package usecases

import (
	"fmt"
	"main-service/domain/entities"

	"gorm.io/gorm"
)

type FinanceUseCase struct {
	db *gorm.DB
}

func NewFinanceUseCase(db *gorm.DB) *FinanceUseCase {
	return &FinanceUseCase{
		db: db,
	}
}

func (u *FinanceUseCase) GetMidtransBalance() (map[string]interface{}, error) {
	var totalGrossRevenue float64

	// Menghitung total dari transaksi yang berstatus "settlement"
	// Sesuai AGENTS.md, table prefix wajib ditulis eksplisit pada Raw SQL / method non-model
	err := u.db.Table("main.transactions").
		Where("status = ?", entities.TransactionStatusSettlement).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalGrossRevenue).Error

	if err != nil {
		return nil, fmt.Errorf("gagal menghitung total pendapatan dari database: %v", err)
	}

	result := map[string]interface{}{
		"balance":           totalGrossRevenue,
		"available_balance": totalGrossRevenue, // Kita anggap gross revenue sebagai available_balance untuk opsi 2
	}

	return result, nil
}
