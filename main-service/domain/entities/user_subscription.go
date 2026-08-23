package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SubscriptionStatus string

const (
	SubscriptionStatusActive    SubscriptionStatus = "Active"
	SubscriptionStatusExpired   SubscriptionStatus = "Expired"
	SubscriptionStatusCancelled SubscriptionStatus = "Cancelled"
)

type UserSubscription struct {
	ID                 uuid.UUID          `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID             string             `gorm:"type:varchar(255);not null;index" json:"user_id"`
	SubscriptionPlanID uuid.UUID          `gorm:"type:uuid;not null" json:"subscription_plan_id"`
	SubscriptionPlan   SubscriptionPlan   `gorm:"foreignKey:SubscriptionPlanID" json:"subscription_plan,omitempty"`
	Status             SubscriptionStatus `gorm:"type:varchar(50);not null" json:"status"`
	StartDate          time.Time          `gorm:"not null" json:"start_date"`
	EndDate            *time.Time         `json:"end_date"` // null means lifetime
	CreatedAt          time.Time          `json:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at"`
	DeletedAt          gorm.DeletedAt     `gorm:"index" json:"-"`
}
