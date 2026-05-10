package middleware

import (
	"strings"

	"main-service/infrastructure/grpc"
	"main-service/utils"

	"github.com/gofiber/fiber/v3"
)

func AuthMiddleware(authClient *grpc.AuthClient) fiber.Handler {
	return func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return utils.SendError(c, fiber.StatusUnauthorized, "Unauthorized", "Missing Authorization header")
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			return utils.SendError(c, fiber.StatusUnauthorized, "Unauthorized", "Invalid Authorization header format")
		}

		token := parts[1]

		res, err := authClient.ValidateToken(c.Context(), token)
		if err != nil {
			return utils.SendError(c, fiber.StatusInternalServerError, "Error", "Failed to validate token via gRPC")
		}

		if !res.IsValid {
			return utils.SendError(c, fiber.StatusUnauthorized, "Unauthorized", res.ErrorMessage)
		}

		c.Locals("user_id", res.UserId)
		c.Locals("role", res.Role)

		return c.Next()
	}
}

func RequireRole(roles ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		userRole, ok := c.Locals("role").(string)
		if !ok {
			return utils.SendError(c, fiber.StatusForbidden, "Forbidden", "Access denied. Role not found.")
		}

		// Remove quotes if the role string comes quoted from Rust's Debug format `{:?}`
		userRole = strings.Trim(userRole, `"`)

		hasRole := false
		for _, role := range roles {
			if userRole == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			return utils.SendError(c, fiber.StatusForbidden, "Forbidden", "Access denied. Insufficient permissions.")
		}

		return c.Next()
	}
}
