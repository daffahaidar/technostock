package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Voucher struct {
	ID                 uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Code               string         `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	DiscountPercentage float64        `gorm:"type:numeric(5,2);not null" json:"discount_percentage"`
	MaxDiscountAmount  float64        `gorm:"type:numeric(10,2);not null" json:"max_discount_amount"` // The "Up To" amount
	ExpiresAt          time.Time      `gorm:"not null" json:"expires_at"`
	Quota              *int           `gorm:"type:int" json:"quota"` // nil = unlimited
	UsedQuota          int            `gorm:"type:int;not null;default:0" json:"used_quota"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"-"`
}
