package main

import (
	"log"

	"main-service/config"
	"main-service/domain/entities"
	"main-service/handlers"
	"main-service/infrastructure/database"
	"main-service/infrastructure/grpc"
	"main-service/pb"
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
	
	// gRPC Server setup
	grpcServer := googleGrpc.NewServer()
	categoryGrpcServer := grpc.NewProductCategoryGrpcServer(categoryUseCase, authClient)
	pb.RegisterProductCategoryServiceServer(grpcServer, categoryGrpcServer)

	planGrpcServer := grpc.NewProductPlanGrpcServer(planUseCase, authClient)
	pb.RegisterProductPlanServiceServer(grpcServer, planGrpcServer)

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
