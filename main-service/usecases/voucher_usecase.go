package usecases

import (
	"errors"
	"main-service/domain/entities"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VoucherUseCase struct {
	db *gorm.DB
}

func NewVoucherUseCase(db *gorm.DB) *VoucherUseCase {
	return &VoucherUseCase{db: db}
}

func (u *VoucherUseCase) CreateVoucher(voucher *entities.Voucher) error {
	var existing entities.Voucher
	if err := u.db.Where("code = ?", voucher.Code).First(&existing).Error; err == nil {
		return errors.New("kode voucher sudah ada")
	}
	return u.db.Create(voucher).Error
}

func (u *VoucherUseCase) GetAllVouchers() ([]entities.Voucher, error) {
	var vouchers []entities.Voucher
	if err := u.db.Order("created_at desc").Find(&vouchers).Error; err != nil {
		return nil, err
	}
	return vouchers, nil
}

func (u *VoucherUseCase) GetVoucherByID(id uuid.UUID) (*entities.Voucher, error) {
	var voucher entities.Voucher
	if err := u.db.First(&voucher, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &voucher, nil
}

func (u *VoucherUseCase) GetVoucherByCode(code string) (*entities.Voucher, error) {
	var voucher entities.Voucher
	if err := u.db.Where("code = ?", code).First(&voucher).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &voucher, nil
}

func (u *VoucherUseCase) UpdateVoucher(voucher *entities.Voucher) error {
	var existing entities.Voucher
	if err := u.db.Where("code = ? AND id != ?", voucher.Code, voucher.ID).First(&existing).Error; err == nil {
		return errors.New("kode voucher sudah digunakan voucher lain")
	}
	return u.db.Save(voucher).Error
}

func (u *VoucherUseCase) DeleteVoucher(id uuid.UUID) error {
	// Soft delete the voucher so transaction history remains intact
	return u.db.Delete(&entities.Voucher{}, "id = ?", id).Error
}
