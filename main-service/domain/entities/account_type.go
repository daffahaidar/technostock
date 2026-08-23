package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AccountType struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name        string         `gorm:"type:varchar(255);not null;uniqueIndex" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Benefits      string         `gorm:"type:jsonb" json:"benefits"` // Stored as JSON array
	IsRecommended bool           `gorm:"default:false" json:"is_recommended"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
