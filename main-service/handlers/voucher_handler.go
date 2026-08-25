package handlers

import (
	"main-service/domain/entities"
	"main-service/usecases"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type VoucherHandler struct {
	voucherUseCase *usecases.VoucherUseCase
}

func NewVoucherHandler(voucherUseCase *usecases.VoucherUseCase) *VoucherHandler {
	return &VoucherHandler{voucherUseCase: voucherUseCase}
}

func (h *VoucherHandler) GetAllVouchers(c fiber.Ctx) error {
	vouchers, err := h.voucherUseCase.GetAllVouchers()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"results": vouchers,
	})
}

func (h *VoucherHandler) GetVoucherByID(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid id format",
		})
	}

	voucher, err := h.voucherUseCase.GetVoucherByID(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	if voucher == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "voucher not found",
		})
	}

	return c.JSON(fiber.Map{
		"results": voucher,
	})
}

func (h *VoucherHandler) CreateVoucher(c fiber.Ctx) error {
	var input struct {
		Code               string    `json:"code"`
		DiscountPercentage float64   `json:"discount_percentage"`
		MaxDiscountAmount  float64   `json:"max_discount_amount"`
		ExpiresAt          time.Time `json:"expires_at"`
		Quota              *int      `json:"quota"`
	}

	if err := c.Bind().Body(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	voucher := &entities.Voucher{
		Code:               input.Code,
		DiscountPercentage: input.DiscountPercentage,
		MaxDiscountAmount:  input.MaxDiscountAmount,
		ExpiresAt:          input.ExpiresAt,
		Quota:              input.Quota,
	}

	if err := h.voucherUseCase.CreateVoucher(voucher); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "voucher created successfully",
		"results": voucher,
	})
}

func (h *VoucherHandler) DeleteVoucher(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid id format",
		})
	}

	if err := h.voucherUseCase.DeleteVoucher(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "voucher deleted successfully",
	})
}

func (h *VoucherHandler) CheckVoucher(c fiber.Ctx) error {
	code := c.Params("code")
	if code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "voucher code is required",
		})
	}

	voucher, err := h.voucherUseCase.GetVoucherByCode(code)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	if voucher == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "kode voucher tidak ditemukan",
		})
	}

	if time.Now().After(voucher.ExpiresAt) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "kode voucher sudah kedaluwarsa",
		})
	}

	if voucher.Quota != nil && voucher.UsedQuota >= *voucher.Quota {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "mohon maaf, kuota voucher ini sudah habis",
		})
	}

	return c.JSON(fiber.Map{
		"results": voucher,
	})
}
