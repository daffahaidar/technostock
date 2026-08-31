package routes

import (
	"main-service/handlers"
	"main-service/infrastructure/grpc"
	"main-service/infrastructure/middleware"

	"github.com/gofiber/fiber/v3"
)

func SetupFinanceRoutes(
	api fiber.Router,
	financeHandler *handlers.FinanceHandler,
	authClient *grpc.AuthClient,
) {
	financeGroup := api.Group("/finances")
	
	// Gunakan middleware otentikasi
	financeGroup.Use(middleware.AuthMiddleware(authClient))
	
	// Hanya Owner yang diizinkan mengakses menu finansial
	ownerRole := middleware.RequireRole("Owner")
	
	financeGroup.Get("/balance", ownerRole, financeHandler.GetMidtransBalance)
}
