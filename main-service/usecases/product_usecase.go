package usecases

import (
	"fmt"
	"time"

	"main-service/domain/entities"

	"github.com/google/uuid"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
	"gorm.io/gorm"
)

type ProductUseCase struct {
	db         *gorm.DB
	snapClient snap.Client
}

func NewProductUseCase(db *gorm.DB, midtransServerKey string) *ProductUseCase {
	var snapClient snap.Client
	snapClient.New(midtransServerKey, midtrans.Sandbox)
	
	return &ProductUseCase{
		db:         db,
		snapClient: snapClient,
	}
}

// ==================== Product CRUD ====================

func (u *ProductUseCase) CreateProduct(product *entities.Product) error {
	// Verify category exists
	var category entities.ProductCategory
	if err := u.db.First(&category, "id = ?", product.CategoryID).Error; err != nil {
		return fmt.Errorf("category not found")
	}

	if err := u.db.Create(product).Error; err != nil {
		return err
	}

	// Preload category for response
	return u.db.Preload("Category").First(product, "id = ?", product.ID).Error
}

func (u *ProductUseCase) GetProductByID(id uuid.UUID) (*entities.Product, error) {
	var product entities.Product
	err := u.db.Preload("Category").First(&product, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (u *ProductUseCase) GetAllProducts() ([]entities.Product, error) {
	var products []entities.Product
	err := u.db.Preload("Category").Find(&products).Error
	return products, err
}

func (u *ProductUseCase) UpdateProduct(product *entities.Product) error {
	// Verify category exists if CategoryID changed
	var category entities.ProductCategory
	if err := u.db.First(&category, "id = ?", product.CategoryID).Error; err != nil {
		return fmt.Errorf("category not found")
	}

	if err := u.db.Save(product).Error; err != nil {
		return err
	}

	// Preload category for response
	return u.db.Preload("Category").First(product, "id = ?", product.ID).Error
}

func (u *ProductUseCase) DeleteProduct(id uuid.UUID) error {
	return u.db.Delete(&entities.Product{}, "id = ?", id).Error
}

// ==================== Checkout & Payment ====================

type CheckoutResponse struct {
	TransactionID string `json:"transaction_id"`
	InvoiceURL    string `json:"invoice_url"`
	ExternalID    string `json:"external_id"`
}

type BuyRequest struct {
	SerialNumber string `json:"serial_number"`
	CategorySlug string `json:"category"`
	PlanSlug     string `json:"plan"`
	ReturnURL    string `json:"return_url"`
}

func (u *ProductUseCase) BuyProduct(userID string, req *BuyRequest) (*CheckoutResponse, error) {
	// Find category by slug
	var category entities.ProductCategory
	if err := u.db.Where("slug = ?", req.CategorySlug).First(&category).Error; err != nil {
		return nil, fmt.Errorf("category not found")
	}

	// Find plan by slug and category_id
	var plan entities.ProductPlan
	if err := u.db.Where("slug = ? AND category_id = ?", req.PlanSlug, category.ID).First(&plan).Error; err != nil {
		return nil, fmt.Errorf("product plan not found")
	}

	// Check if product with this serial number already exists globally
	var existingProduct entities.Product
	if err := u.db.Where("serial_number = ?", req.SerialNumber).First(&existingProduct).Error; err == nil {
		return nil, fmt.Errorf("serial number already registered")
	}

	// Check for existing pending transaction for this serial number
	var existingTx entities.Transaction
	result := u.db.Where("serial_number = ? AND status = ?", req.SerialNumber, entities.TransactionStatusPending).First(&existingTx)
	if result.Error == nil {
		// Return existing pending invoice
		return &CheckoutResponse{
			TransactionID: existingTx.ID.String(),
			InvoiceURL:    existingTx.InvoiceURL,
			ExternalID:    existingTx.ExternalID,
		}, nil
	}

	// Create unique external ID (Midtrans order_id max length is 50 chars)
	shortUUID := uuid.New().String()[:8]
	externalID := fmt.Sprintf("TXN-%d-%s", time.Now().UnixMilli(), shortUUID)

	// Create Midtrans Snap Transaction
	reqSnap := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  externalID,
			GrossAmt: int64(plan.Price),
		},
		Callbacks: &snap.Callbacks{
			Finish: req.ReturnURL,
		},
		Items: &[]midtrans.ItemDetails{
			{
				ID:    plan.ID.String(),
				Price: int64(plan.Price),
				Qty:   1,
				Name:  fmt.Sprintf("%s (%s)", plan.Name, req.SerialNumber),
			},
		},
	}

	snapResp, snapErr := u.snapClient.CreateTransaction(reqSnap)
	if snapErr != nil {
		return nil, fmt.Errorf("failed to create Midtrans transaction: %v", snapErr)
	}

	// Save transaction
	transaction := entities.Transaction{
		UserID:          userID,
		PlanID:          plan.ID,
		SerialNumber:    req.SerialNumber,
		PaymentToken:    snapResp.Token,
		ExternalID:      externalID,
		Amount:          plan.Price,
		Status:          entities.TransactionStatusPending,
		InvoiceURL:      snapResp.RedirectURL,
	}

	if err := u.db.Create(&transaction).Error; err != nil {
		return nil, fmt.Errorf("failed to save transaction: %v", err)
	}

	return &CheckoutResponse{
		TransactionID: transaction.ID.String(),
		InvoiceURL:    snapResp.RedirectURL,
		ExternalID:    externalID,
	}, nil
}

// ==================== Midtrans Webhook ====================

type MidtransWebhookPayload struct {
	TransactionStatus string `json:"transaction_status"`
	OrderID           string `json:"order_id"`
	GrossAmount       string `json:"gross_amount"`
	FraudStatus       string `json:"fraud_status"`
	PaymentType       string `json:"payment_type"`
}

func (u *ProductUseCase) HandleMidtransWebhook(payload *MidtransWebhookPayload) error {
	// Find transaction by external_id
	var transaction entities.Transaction
	if err := u.db.Where("external_id = ?", payload.OrderID).First(&transaction).Error; err != nil {
		return fmt.Errorf("transaction not found for external_id: %s", payload.OrderID)
	}

	// Already processed
	if transaction.Status == entities.TransactionStatusSettlement || transaction.Status == entities.TransactionStatus(payload.TransactionStatus) {
		return nil
	}

	switch payload.TransactionStatus {
	case "capture", "settlement":
		if payload.FraudStatus == "challenge" {
			transaction.Status = entities.TransactionStatusPending
			return u.db.Save(&transaction).Error
		}

		transaction.Status = entities.TransactionStatus(payload.TransactionStatus) // will be "settlement" or "capture"

		// Find the Plan to get CategoryID
		var plan entities.ProductPlan
		if err := u.db.First(&plan, "id = ?", transaction.PlanID).Error; err != nil {
			return fmt.Errorf("plan not found for transaction")
		}

		// Create the Product
		newProduct := entities.Product{
			Name:         fmt.Sprintf("%s (%s)", plan.Name, transaction.SerialNumber),
			SerialNumber: transaction.SerialNumber,
			CategoryID:   plan.CategoryID,
			PlanID:       plan.ID,
		}

		// Use a DB transaction
		return u.db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Save(&transaction).Error; err != nil {
				return err
			}
			if err := tx.Create(&newProduct).Error; err != nil {
				return err
			}
			
			// Create user ownership
			userProduct := entities.UserProduct{
				UserID:    transaction.UserID,
				ProductID: newProduct.ID,
			}
			
			return tx.Create(&userProduct).Error
		})

	case "expire", "cancel", "deny":
		transaction.Status = entities.TransactionStatusExpired
		if payload.TransactionStatus == "deny" {
			transaction.Status = entities.TransactionStatusFailed
		}
		return u.db.Save(&transaction).Error

	default:
		return nil
	}
}

// ==================== User Owned Products ====================

func (u *ProductUseCase) GetOwnedProducts(userID string) ([]entities.UserProduct, error) {
	var userProducts []entities.UserProduct
	err := u.db.Preload("Product.Category").Where("user_id = ?", userID).Find(&userProducts).Error
	return userProducts, err
}
