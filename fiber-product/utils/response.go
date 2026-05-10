package utils

import "github.com/gofiber/fiber/v3"

type Meta struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

type ApiResponse struct {
	Meta    Meta        `json:"meta"`
	Results interface{} `json:"results"`
}

// SendSuccessAll for arrays/slices
func SendSuccessAll(c fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusOK).JSON(ApiResponse{
		Meta: Meta{
			Status:  "Success",
			Message: "Success Retrieve All Data",
		},
		Results: data,
	})
}

// SendSuccessOne for single objects
func SendSuccessOne(c fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusOK).JSON(ApiResponse{
		Meta: Meta{
			Status:  "Success",
			Message: "Success Retrieve One Data",
		},
		Results: data,
	})
}

// SendSuccessCustom for specific messages
func SendSuccessCustom(c fiber.Ctx, data interface{}, message string) error {
	return c.Status(fiber.StatusOK).JSON(ApiResponse{
		Meta: Meta{
			Status:  "Success",
			Message: message,
		},
		Results: data,
	})
}

// SendErrorNotFound
func SendErrorNotFound(c fiber.Ctx, message string) error {
	if message == "" {
		message = "Data Not Found"
	}
	return c.Status(fiber.StatusNotFound).JSON(ApiResponse{
		Meta: Meta{
			Status:  "Not Found",
			Message: message,
		},
		Results: nil,
	})
}

// SendError generic error
func SendError(c fiber.Ctx, statusCode int, statusStr string, message string) error {
	return c.Status(statusCode).JSON(ApiResponse{
		Meta: Meta{
			Status:  statusStr,
			Message: message,
		},
		Results: nil,
	})
}
