package usecases

import (
	"errors"
	"main-service/domain/entities"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SubscriptionPlanUseCase struct {
	db *gorm.DB
}

func NewSubscriptionPlanUseCase(db *gorm.DB) *SubscriptionPlanUseCase {
	return &SubscriptionPlanUseCase{db: db}
}

func (u *SubscriptionPlanUseCase) CreatePlan(plan *entities.SubscriptionPlan) error {
	var accountType entities.AccountType
	if err := u.db.First(&accountType, "id = ?", plan.AccountTypeID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("account type not found")
		}
		return err
	}
	return u.db.Create(plan).Error
}

func (u *SubscriptionPlanUseCase) GetPlansByAccountTypeID(accountTypeID uuid.UUID) ([]entities.SubscriptionPlan, error) {
	var plans []entities.SubscriptionPlan
	if err := u.db.Where("account_type_id = ?", accountTypeID).Preload("AccountType").Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}

func (u *SubscriptionPlanUseCase) GetAllPlans() ([]entities.SubscriptionPlan, error) {
	var plans []entities.SubscriptionPlan
	
	subQuery := u.db.Table("main.user_subscriptions").
		Select("COUNT(DISTINCT main.user_subscriptions.user_id)").
		Where("main.user_subscriptions.subscription_plan_id = main.subscription_plans.id").
		Where("main.user_subscriptions.status = ?", entities.SubscriptionStatusActive)

	if err := u.db.Select("main.subscription_plans.*, (?) AS user_count", subQuery).
		Preload("AccountType").
		Order("created_at asc").
		Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}

func (u *SubscriptionPlanUseCase) GetPlanByID(id uuid.UUID) (*entities.SubscriptionPlan, error) {
	var plan entities.SubscriptionPlan
	if err := u.db.Preload("AccountType").First(&plan, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &plan, nil
}

func (u *SubscriptionPlanUseCase) UpdatePlan(plan *entities.SubscriptionPlan) error {
	return u.db.Save(plan).Error
}

func (u *SubscriptionPlanUseCase) DeletePlan(id uuid.UUID) error {
	return u.db.Transaction(func(tx *gorm.DB) error {
		var activeUserCount int64
		if err := tx.Table("main.user_subscriptions").
			Where("subscription_plan_id = ?", id).
			Where("status = ?", entities.SubscriptionStatusActive).
			Count(&activeUserCount).Error; err != nil {
			return err
		}

		if activeUserCount > 0 {
			return errors.New("cannot delete subscription plan because there are still users with active subscriptions")
		}

		return tx.Unscoped().Delete(&entities.SubscriptionPlan{}, "id = ?", id).Error
	})
}
