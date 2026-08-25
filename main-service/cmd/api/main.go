package main

import (
	"log"

	"main-service/config"
	"main-service/domain/entities"
	"main-service/handlers"
	"main-service/infrastructure/database"
	"main-service/infrastructure/grpc"
	"main-service/infrastructure/workers"
	"main-service/routes"
	"main-service/usecases"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
)

func main() {
	cfg := config.LoadConfig()

	db := database.ConnectPostgres(cfg.DatabaseURL)

	err := db.AutoMigrate(
		&entities.AccountType{},
		&entities.SubscriptionPlan{},
		&entities.UserSubscription{},
		&entities.Transaction{},
		&entities.Voucher{},
	)
	if err != nil {
		log.Fatalf("Failed to auto migrate: %v", err)
	}

	// Create partial unique index for lifetime plan (only 1 lifetime plan per account type)
	err = db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_lifetime_plan ON subscription_plans (account_type_id) WHERE duration_months = 0").Error
	if err != nil {
		log.Printf("Warning: Failed to create partial unique index: %v", err)
	}

	authClient := grpc.NewAuthClient(cfg.AuthGRPCURL)

	// Start Background Workers
	subscriptionWorker := workers.NewSubscriptionWorker(db, authClient)
	subscriptionWorker.Start()

	// Subscription Handlers
	accountTypeUseCase := usecases.NewAccountTypeUseCase(db)
	accountTypeHandler := handlers.NewAccountTypeHandler(accountTypeUseCase)

	subscriptionPlanUseCase := usecases.NewSubscriptionPlanUseCase(db)
	subscriptionPlanHandler := handlers.NewSubscriptionPlanHandler(subscriptionPlanUseCase)

	userSubscriptionUseCase := usecases.NewUserSubscriptionUseCase(db, cfg.MidtransServerKey, authClient)
	userSubscriptionHandler := handlers.NewUserSubscriptionHandler(userSubscriptionUseCase, authClient)

	memberUseCase := usecases.NewMemberUseCase(db, authClient, userSubscriptionUseCase)
	memberHandler := handlers.NewMemberHandler(memberUseCase)

	voucherUseCase := usecases.NewVoucherUseCase(db)
	voucherHandler := handlers.NewVoucherHandler(voucherUseCase)

	app := fiber.New()

	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New())

	api := app.Group("/api/v1")
	routes.SetupSubscriptionRoutes(api, accountTypeHandler, subscriptionPlanHandler, userSubscriptionHandler, memberHandler, voucherHandler, authClient)


	log.Printf("Server listening on port %s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
