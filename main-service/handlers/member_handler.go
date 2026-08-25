package handlers

import (
	"main-service/usecases"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type MemberHandler struct {
	usecase *usecases.MemberUseCase
}

func NewMemberHandler(usecase *usecases.MemberUseCase) *MemberHandler {
	return &MemberHandler{
		usecase: usecase,
	}
}

func (h *MemberHandler) GetMembers(c fiber.Ctx) error {
	members, err := h.usecase.GetMembers()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": members})
}

type MemberActionRequest struct {
	PlanID          string `json:"plan_id"`
	DiscordUsername string `json:"discord_username"`
}

func (h *MemberHandler) PromoteToMember(c fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "User ID is required"})
	}

	var req MemberActionRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	planID, err := uuid.Parse(req.PlanID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid plan ID"})
	}

	if err := h.usecase.PromoteToMember(userID, planID, req.DiscordUsername); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "User successfully promoted to Member"})
}

func (h *MemberHandler) ExtendSubscription(c fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "User ID is required"})
	}

	var req MemberActionRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	planID, err := uuid.Parse(req.PlanID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid plan ID"})
	}

	if err := h.usecase.ExtendSubscription(userID, planID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "User subscription successfully extended"})
}

func (h *MemberHandler) RevokeMembership(c fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "User ID is required"})
	}

	if err := h.usecase.RevokeMembership(userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Membership successfully revoked"})
}
