package handlers

import (
	"strings"
	"main-service/domain/entities"
	"main-service/usecases"
	"main-service/utils"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type ProductCategoryHandler struct {
	useCase *usecases.ProductCategoryUseCase
}

func NewProductCategoryHandler(useCase *usecases.ProductCategoryUseCase) *ProductCategoryHandler {
	return &ProductCategoryHandler{useCase: useCase}
}

func (h *ProductCategoryHandler) CreateCategory(c fiber.Ctx) error {
	var category entities.ProductCategory
	if err := c.Bind().Body(&category); err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", err.Error())
	}

	if category.Name == "" {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Category name is required")
	}

	if category.Slug == "" {
		category.Slug = strings.ReplaceAll(strings.ToLower(category.Name), " ", "-")
	}

	if err := h.useCase.CreateCategory(&category); err != nil {
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessOne(c, category)
}

func (h *ProductCategoryHandler) GetCategoryByID(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Invalid ID format")
	}

	category, err := h.useCase.GetCategoryByID(id)
	if err != nil {
		return utils.SendErrorNotFound(c, "Category Not Found")
	}

	return utils.SendSuccessOne(c, category)
}

func (h *ProductCategoryHandler) GetAllCategories(c fiber.Ctx) error {
	categories, err := h.useCase.GetAllCategories()
	if err != nil {
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessAll(c, categories)
}

func (h *ProductCategoryHandler) UpdateCategory(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Invalid ID format")
	}

	category, err := h.useCase.GetCategoryByID(id)
	if err != nil {
		return utils.SendErrorNotFound(c, "Category Not Found")
	}

	if err := c.Bind().Body(category); err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", err.Error())
	}
	category.ID = id

	if err := h.useCase.UpdateCategory(category); err != nil {
		return utils.SendError(c, fiber.StatusInternalServerError, "Error", err.Error())
	}

	return utils.SendSuccessOne(c, category)
}

func (h *ProductCategoryHandler) DeleteCategory(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Bad Request", "Invalid ID format")
	}

	_, err = h.useCase.GetCategoryByID(id)
	if err != nil {
		return utils.SendErrorNotFound(c, "Category Not Found")
	}

	if err := h.useCase.DeleteCategory(id); err != nil {
		return utils.SendError(c, fiber.StatusBadRequest, "Error", "Cannot delete category that has products")
	}

	return utils.SendSuccessCustom(c, nil, "Category deleted successfully")
}
