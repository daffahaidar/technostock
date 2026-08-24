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

	// Create subquery to count unique users with active subscriptions
	subQuery := u.db.Table("main.user_subscriptions").
		Select("COUNT(DISTINCT main.user_subscriptions.user_id)").
		Joins("JOIN main.subscription_plans ON main.subscription_plans.id = main.user_subscriptions.subscription_plan_id").
		Where("main.subscription_plans.account_type_id = main.account_types.id").
		Where("main.user_subscriptions.status = ?", entities.SubscriptionStatusActive)

	if err := u.db.Select("main.account_types.*, (?) AS user_count", subQuery).
		Order("created_at asc").
		Find(&accountTypes).Error; err != nil {
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
	return u.db.Transaction(func(tx *gorm.DB) error {
		var activeUserCount int64
		if err := tx.Table("main.user_subscriptions").
			Joins("JOIN main.subscription_plans ON main.subscription_plans.id = main.user_subscriptions.subscription_plan_id").
			Where("main.subscription_plans.account_type_id = ?", id).
			Where("main.user_subscriptions.status = ?", entities.SubscriptionStatusActive).
			Count(&activeUserCount).Error; err != nil {
			return err
		}

		if activeUserCount > 0 {
			return errors.New("cannot delete account type because there are still users with active subscriptions")
		}

		// Delete associated subscription plans first (cascading)
		if err := tx.Where("account_type_id = ?", id).Delete(&entities.SubscriptionPlan{}).Error; err != nil {
			return err
		}

		return tx.Unscoped().Delete(&entities.AccountType{}, "id = ?", id).Error
	})
}
