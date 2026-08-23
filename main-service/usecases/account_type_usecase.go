package usecases

import (
	"errors"
	"main-service/domain/entities"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AccountTypeUseCase struct {
	db *gorm.DB
}

func NewAccountTypeUseCase(db *gorm.DB) *AccountTypeUseCase {
	return &AccountTypeUseCase{db: db}
}

func (u *AccountTypeUseCase) CreateAccountType(accountType *entities.AccountType) error {
	return u.db.Transaction(func(tx *gorm.DB) error {
		if accountType.IsRecommended {
			// Unset any existing recommended account types
			if err := tx.Model(&entities.AccountType{}).Where("is_recommended = ?", true).Update("is_recommended", false).Error; err != nil {
				return err
			}
		}
		return tx.Create(accountType).Error
	})
}

func (u *AccountTypeUseCase) GetAccountTypeByID(id uuid.UUID) (*entities.AccountType, error) {
	var accountType entities.AccountType
	if err := u.db.First(&accountType, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &accountType, nil
}

func (u *AccountTypeUseCase) GetAllAccountTypes() ([]entities.AccountType, error) {
	var accountTypes []entities.AccountType
	if err := u.db.Order("created_at asc").Find(&accountTypes).Error; err != nil {
		return nil, err
	}
	return accountTypes, nil
}

func (u *AccountTypeUseCase) UpdateAccountType(accountType *entities.AccountType) error {
	return u.db.Transaction(func(tx *gorm.DB) error {
		if accountType.IsRecommended {
			// Unset any existing recommended account types except this one
			if err := tx.Model(&entities.AccountType{}).Where("id != ? AND is_recommended = ?", accountType.ID, true).Update("is_recommended", false).Error; err != nil {
				return err
			}
		}
		return tx.Save(accountType).Error
	})
}

func (u *AccountTypeUseCase) DeleteAccountType(id uuid.UUID) error {
	return u.db.Unscoped().Delete(&entities.AccountType{}, "id = ?", id).Error
}
