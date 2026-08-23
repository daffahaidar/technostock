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
	if err := u.db.Preload("AccountType").Find(&plans).Error; err != nil {
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
	return u.db.Unscoped().Delete(&entities.SubscriptionPlan{}, "id = ?", id).Error
}
