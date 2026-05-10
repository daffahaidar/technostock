package handlers

import (
	"strings"

	"main-service/domain/entities"
	"main-service/usecases"
	"main-service/utils"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type ProductPlanHandler struct {
	useCase *usecases.ProductPlanUseCase
}

func NewProductPlanHandler(useCase *usecases.ProductPlanUseCase) *ProductPlanHandler {
	return &ProductPlanHandler{useCase: useCase}
}

func (h *ProductPlanHandler) CreateProductPlan(c fiber.Ctx) error {
	var plan entities.ProductPlan
	if err := c.Bind().Body(&plan); err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", err.Error())
	}

	if plan.Name == "" || plan.Price <= 0 || plan.CategoryID == uuid.Nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Name, Price, and CategoryID are required")
	}

	if plan.Slug == "" {
		plan.Slug = strings.ReplaceAll(strings.ToLower(plan.Name), " ", "-")
	}

	if err := h.useCase.CreateProductPlan(&plan); err != nil {
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessOne(c, plan)
}

func (h *ProductPlanHandler) GetProductPlanByID(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Invalid ID format")
	}

	plan, err := h.useCase.GetProductPlanByID(id)
	if err != nil {
		return utils.SendErrorNotFound(c, "Product Plan Not Found")
	}

	return utils.SendSuccessOne(c, plan)
}

func (h *ProductPlanHandler) GetProductPlansByCategoryID(c fiber.Ctx) error {
	idParam := c.Params("category_id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Invalid ID format")
	}

	plans, err := h.useCase.GetProductPlansByCategoryID(id)
	if err != nil {
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessAll(c, plans)
}

func (h *ProductPlanHandler) GetProductPlansByCategorySlug(c fiber.Ctx) error {
	slug := c.Query("slug")
	if slug == "" {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Slug is required")
	}

	plans, err := h.useCase.GetProductPlansByCategorySlug(slug)
	if err != nil {
		if err.Error() == "record not found" {
			return utils.SendErrorNotFound(c, "Category Not Found")
		}
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessAll(c, plans)
}

func (h *ProductPlanHandler) GetProductPlanByCategoryAndPlanSlug(c fiber.Ctx) error {
	categorySlug := c.Params("categorySlug")
	planSlug := c.Params("planSlug")
	
	if categorySlug == "" || planSlug == "" {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Category Slug and Plan Slug are required")
	}

	plan, err := h.useCase.GetProductPlanByCategoryAndPlanSlug(categorySlug, planSlug)
	if err != nil {
		if err.Error() == "record not found" {
			return utils.SendErrorNotFound(c, "Product Plan Not Found")
		}
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessOne(c, plan)
}

func (h *ProductPlanHandler) GetAllProductPlans(c fiber.Ctx) error {
	plans, err := h.useCase.GetAllProductPlans()
	if err != nil {
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessAll(c, plans)
}

func (h *ProductPlanHandler) UpdateProductPlan(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Invalid ID format")
	}

	plan, err := h.useCase.GetProductPlanByID(id)
	if err != nil {
		return utils.SendErrorNotFound(c, "Product Plan Not Found")
	}

	if err := c.Bind().Body(plan); err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", err.Error())
	}
	plan.ID = id

	if plan.Slug == "" {
		plan.Slug = strings.ReplaceAll(strings.ToLower(plan.Name), " ", "-")
	}

	if err := h.useCase.UpdateProductPlan(plan); err != nil {
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessOne(c, plan)
}

func (h *ProductPlanHandler) DeleteProductPlan(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Invalid ID format")
	}

	_, err = h.useCase.GetProductPlanByID(id)
	if err != nil {
		return utils.SendErrorNotFound(c, "Product Plan Not Found")
	}

	if err := h.useCase.DeleteProductPlan(id); err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Error", "Cannot delete plan that is assigned to products")
	}

	return utils.SendSuccessCustom(c, nil, "Product Plan deleted successfully")
}
