package handlers

import (
	"main-service/domain/entities"
	"main-service/usecases"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type SubscriptionPlanHandler struct {
	usecase *usecases.SubscriptionPlanUseCase
}

func NewSubscriptionPlanHandler(usecase *usecases.SubscriptionPlanUseCase) *SubscriptionPlanHandler {
	return &SubscriptionPlanHandler{usecase: usecase}
}

func (h *SubscriptionPlanHandler) CreatePlan(c fiber.Ctx) error {
	var plan entities.SubscriptionPlan
	if err := c.Bind().JSON(&plan); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := h.usecase.CreatePlan(&plan); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(plan)
}

func (h *SubscriptionPlanHandler) GetPlansByAccountType(c fiber.Ctx) error {
	accountTypeIDParam := c.Params("accountTypeId")
	accountTypeID, err := uuid.Parse(accountTypeIDParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid account type ID"})
	}

	plans, err := h.usecase.GetPlansByAccountTypeID(accountTypeID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"results": plans})
}

func (h *SubscriptionPlanHandler) GetAllPlans(c fiber.Ctx) error {
	plans, err := h.usecase.GetAllPlans()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"results": plans})
}

func (h *SubscriptionPlanHandler) UpdatePlan(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
	}

	existing, err := h.usecase.GetPlanByID(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if existing == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Plan not found"})
	}

	var req entities.SubscriptionPlan
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	existing.Name = req.Name
	existing.Description = req.Description
	existing.DurationMonths = req.DurationMonths
	existing.Price = req.Price

	if err := h.usecase.UpdatePlan(existing); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(existing)
}

func (h *SubscriptionPlanHandler) DeletePlan(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
	}

	if err := h.usecase.DeletePlan(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
