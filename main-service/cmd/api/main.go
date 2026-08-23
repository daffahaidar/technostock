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
	"net"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
	googleGrpc "google.golang.org/grpc"
)

func main() {
	cfg := config.LoadConfig()

	db := database.ConnectPostgres(cfg.DatabaseURL)

	err := db.AutoMigrate(
		&entities.AccountType{},
		&entities.SubscriptionPlan{},
		&entities.UserSubscription{},
		&entities.Transaction{},
	)
	if err != nil {
		log.Fatalf("Failed to auto migrate: %v", err)
	}

	authClient := grpc.NewAuthClient(cfg.AuthGRPCURL)

	// Start Background Workers
	subscriptionWorker := workers.NewSubscriptionWorker(db, authClient)
	subscriptionWorker.Start()

	// gRPC Server setup
	grpcServer := googleGrpc.NewServer()

	go func() {
		lis, err := net.Listen("tcp", ":50052")
		if err != nil {
			log.Fatalf("Failed to listen on gRPC port: %v", err)
		}
		log.Printf("gRPC server listening on port 50052")
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("Failed to serve gRPC: %v", err)
		}
	}()
	
	// Subscription Handlers
	accountTypeUseCase := usecases.NewAccountTypeUseCase(db)
	accountTypeHandler := handlers.NewAccountTypeHandler(accountTypeUseCase)

	subscriptionPlanUseCase := usecases.NewSubscriptionPlanUseCase(db)
	subscriptionPlanHandler := handlers.NewSubscriptionPlanHandler(subscriptionPlanUseCase)

	userSubscriptionUseCase := usecases.NewUserSubscriptionUseCase(db, cfg.MidtransServerKey, authClient)
	userSubscriptionHandler := handlers.NewUserSubscriptionHandler(userSubscriptionUseCase, authClient)

	app := fiber.New()

	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New())

	api := app.Group("/api/v1")
	routes.SetupSubscriptionRoutes(api, accountTypeHandler, subscriptionPlanHandler, userSubscriptionHandler, authClient)


	log.Printf("Server listening on port %s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
