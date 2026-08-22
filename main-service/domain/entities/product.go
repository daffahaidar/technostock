package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Product struct {
	ID           uuid.UUID       `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name         string          `gorm:"type:varchar(255);not null" json:"name"`
	Description  string          `gorm:"type:text" json:"description"`
	CategoryID   uuid.UUID       `gorm:"type:uuid;not null" json:"category_id"`
	Category     ProductCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	PlanID       uuid.UUID       `gorm:"type:uuid;not null" json:"plan_id"`
	Plan         ProductPlan     `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
	DeletedAt    gorm.DeletedAt  `gorm:"index" json:"-"`
}
