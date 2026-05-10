package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductPlan struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CategoryID  uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex:idx_category_name;uniqueIndex:idx_category_slug" json:"category_id"`
	Category    ProductCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Name        string         `gorm:"type:varchar(255);not null;uniqueIndex:idx_category_name" json:"name"`
	Slug        string         `gorm:"type:varchar(255);not null;uniqueIndex:idx_category_slug" json:"slug"`
	Description string         `gorm:"type:text" json:"description"`
	Price       float64        `gorm:"type:numeric(10,2);not null" json:"price"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
