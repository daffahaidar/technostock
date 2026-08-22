package entities

import (
	"time"

	"github.com/google/uuid"
)

type TransactionStatus string

const (
	TransactionStatusPending    TransactionStatus = "pending"
	TransactionStatusSettlement TransactionStatus = "settlement"
	TransactionStatusFailed     TransactionStatus = "failed"
	TransactionStatusExpired    TransactionStatus = "expired"
)

type Transaction struct {
	ID              uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID          string            `gorm:"type:varchar(255);not null;index" json:"user_id"`
	PlanID          uuid.UUID         `gorm:"type:uuid;not null;index" json:"plan_id"`
	Plan            ProductPlan       `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
	PaymentToken    string            `gorm:"type:varchar(255);not null;uniqueIndex" json:"payment_token"`
	ExternalID      string            `gorm:"type:varchar(255);not null;uniqueIndex" json:"external_id"`
	Amount          float64           `gorm:"type:numeric(10,2);not null" json:"amount"`
	Status          TransactionStatus `gorm:"type:varchar(20);not null;default:'PENDING'" json:"status"`
	InvoiceURL      string            `gorm:"type:text" json:"invoice_url"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
}
