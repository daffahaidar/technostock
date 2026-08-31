package handlers

import (
	"encoding/json"
	"strings"

	"main-service/domain/entities"
	"main-service/usecases"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type AccountTypeHandler struct {
	usecase *usecases.AccountTypeUseCase
}

func NewAccountTypeHandler(usecase *usecases.AccountTypeUseCase) *AccountTypeHandler {
	return &AccountTypeHandler{usecase: usecase}
}

func (h *AccountTypeHandler) CreateAccountType(c fiber.Ctx) error {
	var accountType entities.AccountType
	if err := c.Bind().JSON(&accountType); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if accountType.Benefits != "" && !strings.HasPrefix(accountType.Benefits, "[") {
		parts := strings.Split(accountType.Benefits, ",")
		for i, p := range parts {
			parts[i] = strings.TrimSpace(p)
		}
		if jsonBytes, err := json.Marshal(parts); err == nil {
			accountType.Benefits = string(jsonBytes)
		}
	} else if accountType.Benefits == "" {
		accountType.Benefits = "[]"
	}

	if err := h.usecase.CreateAccountType(&accountType); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(accountType)
}

func (h *AccountTypeHandler) GetAllAccountTypes(c fiber.Ctx) error {
	accountTypes, err := h.usecase.GetAllAccountTypes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"results": accountTypes})
}

// GetPublicPricing: account type + plan-nya dalam satu response untuk halaman pricing.
func (h *AccountTypeHandler) GetPublicPricing(c fiber.Ctx) error {
	pricing, err := h.usecase.GetPublicPricing()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"results": pricing})
}

func (h *AccountTypeHandler) UpdateAccountType(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
	}

	existing, err := h.usecase.GetAccountTypeByID(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if existing == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Account type not found"})
	}

	var req struct {
		Name          *string `json:"name"`
		Description   *string `json:"description"`
		Benefits      *string `json:"benefits"`
		IsRecommended *bool   `json:"is_recommended"`
	}
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Name != nil {
		existing.Name = *req.Name
	}
	if req.Description != nil {
		existing.Description = *req.Description
	}
	if req.IsRecommended != nil {
		existing.IsRecommended = *req.IsRecommended
	}
	
	if req.Benefits != nil && *req.Benefits != "" {
		benefitsStr := *req.Benefits
		if !strings.HasPrefix(benefitsStr, "[") {
			parts := strings.Split(benefitsStr, ",")
			for i, p := range parts {
				parts[i] = strings.TrimSpace(p)
			}
			if jsonBytes, err := json.Marshal(parts); err == nil {
				existing.Benefits = string(jsonBytes)
			}
		} else {
			existing.Benefits = benefitsStr
		}
	}

	if err := h.usecase.UpdateAccountType(existing); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(existing)
}

func (h *AccountTypeHandler) DeleteAccountType(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
	}

	if err := h.usecase.DeleteAccountType(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
