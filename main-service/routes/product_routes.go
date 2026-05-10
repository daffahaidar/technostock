package routes

import (
	"main-service/handlers"
	"main-service/infrastructure/grpc"
	"main-service/infrastructure/middleware"

	"github.com/gofiber/fiber/v3"
)

func SetupRoutes(
	app *fiber.App,
	productHandler *handlers.ProductHandler,
	categoryHandler *handlers.ProductCategoryHandler,
	planHandler *handlers.ProductPlanHandler,
	authClient *grpc.AuthClient,
) {
	api := app.Group("/api/v1")

	// ==================== Public Routes (No Auth) ====================
	publicGroup := api.Group("/public")

	// Midtrans Webhook - must be public so Midtrans servers can call it
	publicGroup.Post("/product/midtrans-webhook", productHandler.MidtransWebhook)
	
	// Public endpoint for frontend to fetch plans by category slug
	publicGroup.Get("/product-plan/category", planHandler.GetProductPlansByCategorySlug)
	
	// Public endpoint for frontend to fetch specific plan by category and plan slug
	publicGroup.Get("/product-plan/:categorySlug/:planSlug", planHandler.GetProductPlanByCategoryAndPlanSlug)

	
	// ==================== Product Category Routes ====================
	categoryGroup := api.Group("/product-category")
	categoryGroup.Use(middleware.AuthMiddleware(authClient))

	// Read routes (Available for all authenticated roles)
	categoryGroup.Get("/", categoryHandler.GetAllCategories)
	categoryGroup.Get("/:id", categoryHandler.GetCategoryByID)

	// Write routes (Only for Admin and SuperAdmin)
	categoryWriteGroup := categoryGroup.Group("/")
	categoryWriteGroup.Use(middleware.RequireRole("Admin", "SuperAdmin"))

	categoryWriteGroup.Post("/", categoryHandler.CreateCategory)
	categoryWriteGroup.Patch("/:id", categoryHandler.UpdateCategory)
	categoryWriteGroup.Delete("/:id", categoryHandler.DeleteCategory)

	// ==================== Product Plan Routes ====================
	planGroup := api.Group("/product-plan")
	planGroup.Use(middleware.AuthMiddleware(authClient))

	// Read routes
	planGroup.Get("/", planHandler.GetAllProductPlans)
	planGroup.Get("/:id", planHandler.GetProductPlanByID)
	planGroup.Get("/category/:category_id", planHandler.GetProductPlansByCategoryID)

	// Write routes
	planWriteGroup := planGroup.Group("/")
	planWriteGroup.Use(middleware.RequireRole("Admin", "SuperAdmin"))

	planWriteGroup.Post("/", planHandler.CreateProductPlan)
	planWriteGroup.Patch("/:id", planHandler.UpdateProductPlan)
	planWriteGroup.Delete("/:id", planHandler.DeleteProductPlan)

	// ==================== Product Routes ====================
	productGroup := api.Group("/product")
	productGroup.Use(middleware.AuthMiddleware(authClient))

	// User-specific routes (must come BEFORE /:id to avoid route conflicts)
	productGroup.Get("/owned", productHandler.GetOwnedProducts)

	// Checkout (Any authenticated user)
	productGroup.Post("/buy", productHandler.BuyProduct)

	// Read routes (Available for all authenticated roles)
	productGroup.Get("/", productHandler.GetAllProducts)
	productGroup.Get("/:id", productHandler.GetProductByID)
	// Write routes (Only for Admin and SuperAdmin)
	writeGroup := productGroup.Group("/")
	writeGroup.Use(middleware.RequireRole("Admin", "SuperAdmin"))

	writeGroup.Post("/", productHandler.CreateProduct)
	writeGroup.Patch("/:id", productHandler.UpdateProduct)
	writeGroup.Delete("/:id", productHandler.DeleteProduct)
}
