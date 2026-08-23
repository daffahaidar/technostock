package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SubscriptionPlan struct {
	ID             uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	AccountTypeID  uuid.UUID      `gorm:"type:uuid;not null" json:"account_type_id"`
	AccountType    AccountType    `gorm:"foreignKey:AccountTypeID" json:"account_type,omitempty"`
	Name           string         `gorm:"type:varchar(255);not null" json:"name"`
	Description    string         `gorm:"type:text" json:"description"`
	DurationMonths int            `gorm:"type:int;not null" json:"duration_months"` // 0 means lifetime
	Price          float64        `gorm:"type:numeric(10,2);not null" json:"price"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}
