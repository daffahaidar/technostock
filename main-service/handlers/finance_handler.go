package handlers

import (
	"main-service/usecases"

	"github.com/gofiber/fiber/v3"
)

type FinanceHandler struct {
	financeUseCase *usecases.FinanceUseCase
}

func NewFinanceHandler(financeUseCase *usecases.FinanceUseCase) *FinanceHandler {
	return &FinanceHandler{
		financeUseCase: financeUseCase,
	}
}

func (h *FinanceHandler) GetMidtransBalance(c fiber.Ctx) error {
	balanceData, err := h.financeUseCase.GetMidtransBalance()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Gagal mengambil data saldo dari Midtrans",
			"details": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Sukses mengambil data saldo",
		"data":    balanceData,
	})
}
