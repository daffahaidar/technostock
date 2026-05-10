package main

import (
	"log"

	"fiber-product/config"
	"fiber-product/domain/entities"
	"fiber-product/handlers"
	"fiber-product/infrastructure/database"
	"fiber-product/infrastructure/grpc"
	"fiber-product/routes"
	"fiber-product/usecases"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
)

func main() {
	cfg := config.LoadConfig()

	db := database.ConnectPostgres(cfg.DatabaseURL)

	// Migrations below have already been executed successfully on the database:
	// db.Exec("ALTER TABLE product.transactions DROP COLUMN IF EXISTS product_id CASCADE")
	// db.Exec("ALTER TABLE product.transactions RENAME COLUMN xendit_invoice_id TO payment_token")
	// db.Exec("ALTER TABLE product.products DROP COLUMN IF EXISTS price CASCADE")

	// Auto Migrate (order matters: Category first, then Plan, then Product, then Transaction & UserProduct)
	err := db.AutoMigrate(
		&entities.ProductCategory{},
		&entities.ProductPlan{},
		&entities.Product{},
		&entities.Transaction{},
		&entities.UserProduct{},
	)
	if err != nil {
		log.Fatalf("Failed to auto migrate: %v", err)
	}

	authClient := grpc.NewAuthClient(cfg.AuthGRPCURL)

	// Use cases
	productUseCase := usecases.NewProductUseCase(db, cfg.MidtransServerKey)
	categoryUseCase := usecases.NewProductCategoryUseCase(db)
	planUseCase := usecases.NewProductPlanUseCase(db)

	// Handlers
	productHandler := handlers.NewProductHandler(productUseCase)
	categoryHandler := handlers.NewProductCategoryHandler(categoryUseCase)
	planHandler := handlers.NewProductPlanHandler(planUseCase)
	
	app := fiber.New()

	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New())

	routes.SetupRoutes(app, productHandler, categoryHandler, planHandler, authClient)

	log.Printf("Server listening on port %s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
