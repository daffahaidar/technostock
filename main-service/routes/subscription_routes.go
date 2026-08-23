package routes

import (
	"main-service/handlers"
	"main-service/infrastructure/grpc"
	"main-service/infrastructure/middleware"

	"github.com/gofiber/fiber/v3"
)

func SetupSubscriptionRoutes(
	api fiber.Router,
	accountTypeHandler *handlers.AccountTypeHandler,
	subscriptionPlanHandler *handlers.SubscriptionPlanHandler,
	userSubscriptionHandler *handlers.UserSubscriptionHandler,
	authClient *grpc.AuthClient,
) {
	// ==================== Account Type Routes ====================
	accountTypeGroup := api.Group("/account-types")
	accountTypeGroup.Use(middleware.AuthMiddleware(authClient))

	accountTypeGroup.Get("/", accountTypeHandler.GetAllAccountTypes)
	
	// Admin only
	adminRole := middleware.RequireRole("Admin", "SuperAdmin", "Maintainer")
	accountTypeGroup.Post("", adminRole, accountTypeHandler.CreateAccountType)
	accountTypeGroup.Post("/", adminRole, accountTypeHandler.CreateAccountType)
	accountTypeGroup.Patch("/:id", adminRole, accountTypeHandler.UpdateAccountType)
	accountTypeGroup.Delete("/:id", adminRole, accountTypeHandler.DeleteAccountType)

	// ==================== Subscription Plan Routes ====================
	planGroup := api.Group("/subscription-plans")
	planGroup.Use(middleware.AuthMiddleware(authClient))

	planGroup.Get("", subscriptionPlanHandler.GetAllPlans)
	planGroup.Get("/", subscriptionPlanHandler.GetAllPlans)
	planGroup.Get("/account-type/:accountTypeId", subscriptionPlanHandler.GetPlansByAccountType)

	// Admin only
	planGroup.Post("", adminRole, subscriptionPlanHandler.CreatePlan)
	planGroup.Post("/", adminRole, subscriptionPlanHandler.CreatePlan)
	planGroup.Patch("/:id", adminRole, subscriptionPlanHandler.UpdatePlan)
	planGroup.Delete("/:id", adminRole, subscriptionPlanHandler.DeletePlan)

	// ==================== Public Routes ====================
	publicGroup := api.Group("/public")
	publicGroup.Get("/account-types", accountTypeHandler.GetAllAccountTypes)
	publicGroup.Get("/subscription-plans", subscriptionPlanHandler.GetAllPlans)
	publicGroup.Get("/subscription-plans/:id", subscriptionPlanHandler.GetPlanByID)

	publicGroup.Post("/subscription/midtrans-webhook", userSubscriptionHandler.MidtransWebhook)

	// ==================== User Subscription Routes ====================
	subGroup := api.Group("/subscriptions")
	subGroup.Use(middleware.AuthMiddleware(authClient))
	subGroup.Post("/subscribe", userSubscriptionHandler.Subscribe)
	subGroup.Post("/buy", userSubscriptionHandler.Buy)
	subGroup.Get("/my-active", userSubscriptionHandler.GetMyActiveSubscription)
}
