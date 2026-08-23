package usecases

import (
	"errors"
	"main-service/domain/entities"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserSubscriptionUseCase struct {
	db *gorm.DB
}

func NewUserSubscriptionUseCase(db *gorm.DB) *UserSubscriptionUseCase {
	return &UserSubscriptionUseCase{db: db}
}

func (u *UserSubscriptionUseCase) SubscribeUser(userID string, planID uuid.UUID) (*entities.UserSubscription, error) {
	// Start transaction
	tx := u.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var plan entities.SubscriptionPlan
	if err := tx.First(&plan, "id = ?", planID).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("subscription plan not found")
		}
		return nil, err
	}

	// Check if user already has an active subscription
	var existing entities.UserSubscription
	err := tx.Where("user_id = ? AND status = ?", userID, entities.SubscriptionStatusActive).First(&existing).Error
	if err == nil {
		// User has active subscription, expire it if they are upgrading, or handle appropriately
		// For simplicity, we just mark old as cancelled to allow the new one
		existing.Status = entities.SubscriptionStatusCancelled
		tx.Save(&existing)
	}

	startDate := time.Now()
	var endDate *time.Time
	if plan.DurationMonths > 0 {
		t := startDate.AddDate(0, plan.DurationMonths, 0)
		endDate = &t
	}

	newSub := &entities.UserSubscription{
		UserID:             userID,
		SubscriptionPlanID: plan.ID,
		Status:             entities.SubscriptionStatusActive,
		StartDate:          startDate,
		EndDate:            endDate,
	}

	if err := tx.Create(newSub).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return newSub, nil
}
