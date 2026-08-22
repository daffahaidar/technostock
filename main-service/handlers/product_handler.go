package handlers

import (
	"strings"

	"main-service/domain/entities"
	"main-service/usecases"
	"main-service/utils"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type ProductHandler struct {
	useCase *usecases.ProductUseCase
}

func NewProductHandler(useCase *usecases.ProductUseCase) *ProductHandler {
	return &ProductHandler{useCase: useCase}
}

func (h *ProductHandler) CreateProduct(c fiber.Ctx) error {
	var product entities.Product
	if err := c.Bind().Body(&product); err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", err.Error())
	}

	if product.CategoryID == uuid.Nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "category_id is required")
	}

	// Removed serial_number check
	if err := h.useCase.CreateProduct(&product); err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Error", err.Error())
	}

	return utils.SendSuccessOne(c, product)
}

func (h *ProductHandler) GetProductByID(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Invalid ID format")
	}

	product, err := h.useCase.GetProductByID(id)
	if err != nil {
		return utils.SendErrorNotFound(c, "Data Not Found")
	}

	return utils.SendSuccessOne(c, product)
}

func (h *ProductHandler) GetAllProducts(c fiber.Ctx) error {
	products, err := h.useCase.GetAllProducts()
	if err != nil {
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessAll(c, products)
}

func (h *ProductHandler) UpdateProduct(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Invalid ID format")
	}

	product, err := h.useCase.GetProductByID(id)
	if err != nil {
		return utils.SendErrorNotFound(c, "Data Not Found")
	}

	// Create a temporary struct to bind update data, we just bind to product directly
	// Wait, Binding to the existing product will overwrite the fields provided in the request
	if err := c.Bind().Body(product); err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", err.Error())
	}
	// Restore ID just in case it was overwritten by body
	product.ID = id

	if err := h.useCase.UpdateProduct(product); err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Error", err.Error())
	}

	return utils.SendSuccessOne(c, product)
}

func (h *ProductHandler) DeleteProduct(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Invalid ID format")
	}

	// Verify exists
	_, err = h.useCase.GetProductByID(id)
	if err != nil {
		return utils.SendErrorNotFound(c, "Data Not Found")
	}

	if err := h.useCase.DeleteProduct(id); err != nil {
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessCustom(c, nil, "Product deleted successfully")
}

// ==================== Checkout ====================

func (h *ProductHandler) BuyProduct(c fiber.Ctx) error {
	var req usecases.BuyRequest
	if err := c.Bind().Body(&req); err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", err.Error())
	}

	if req.CategorySlug == "" || req.PlanSlug == "" {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "category and plan are required")
	}

	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return utils.SendError(c, fiber.StatusUnauthorized, "Unauthorized", "Please login to purchase a product")
	}
	// Remove quotes if necessary (from Rust gRPC Debug format)
	userID = strings.Trim(userID, `"`)

	result, err := h.useCase.BuyProduct(userID, &req)
	if err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Error", err.Error())
	}

	return utils.SendSuccessCustom(c, result, "Invoice created successfully. Please complete payment.")
}

// ==================== Midtrans Webhook ====================

func (h *ProductHandler) MidtransWebhook(c fiber.Ctx) error {
	var payload usecases.MidtransWebhookPayload
	if err := c.Bind().Body(&payload); err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", err.Error())
	}

	if err := h.useCase.HandleMidtransWebhook(&payload); err != nil {
		if strings.Contains(err.Error(), "transaction not found") {
			// Kembalikan 200 OK agar "Test Webhook" dari Midtrans Dashboard berhasil
			return utils.SendSuccessCustom(c, nil, "Webhook acknowledged (transaction not found / test webhook)")
		}
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessCustom(c, nil, "Webhook processed successfully")
}

// ==================== Owned Products ====================

func (h *ProductHandler) GetOwnedProducts(c fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return utils.SendError(c, fiber.StatusUnauthorized, "Unauthorized", "Please login to view your products")
	}
	userID = strings.Trim(userID, `"`)

	ownedProducts, err := h.useCase.GetOwnedProducts(userID)
	if err != nil {
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessAll(c, ownedProducts)
}
