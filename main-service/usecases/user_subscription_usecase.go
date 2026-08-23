package usecases

import (
	"context"
	"errors"
	"fmt"
	"main-service/domain/entities"
	"main-service/infrastructure/grpc"
	"main-service/pb"
	"time"

	"github.com/google/uuid"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
	"github.com/midtrans/midtrans-go/snap"
	"gorm.io/gorm"
)

type UserSubscriptionUseCase struct {
	db                *gorm.DB
	midtransServerKey string
	authClient        *grpc.AuthClient
}

func NewUserSubscriptionUseCase(db *gorm.DB, midtransServerKey string, authClient *grpc.AuthClient) *UserSubscriptionUseCase {
	return &UserSubscriptionUseCase{
		db:                db,
		midtransServerKey: midtransServerKey,
		authClient:        authClient,
	}
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

type CheckoutResponse struct {
	Token       string `json:"token"`
	RedirectURL string `json:"redirect_url"`
}

func (u *UserSubscriptionUseCase) BuySubscription(userID string, planID uuid.UUID, discordUsername string, returnURL string) (*CheckoutResponse, error) {
	// Start transaction
	tx := u.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var plan entities.SubscriptionPlan
	if err := tx.Preload("AccountType").First(&plan, "id = ?", planID).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("subscription plan not found")
		}
		return nil, err
	}

	// Cek apakah user sudah punya langganan aktif untuk paket ini
	var activeSub entities.UserSubscription
	err := tx.Where("user_id = ? AND subscription_plan_id = ? AND status = ?", userID, planID, entities.SubscriptionStatusActive).First(&activeSub).Error
	if err == nil {
		tx.Rollback()
		return nil, errors.New("anda sudah memiliki langganan aktif untuk paket ini")
	}

	// Buat transaksi baru
	newTransaction := &entities.Transaction{
		UserID:          userID,
		PlanID:          plan.ID,
		ExternalID:      fmt.Sprintf("SUB-%s-%d", planID.String()[:8], time.Now().Unix()),
		Amount:          plan.Price,
		Status:          entities.TransactionStatusPending,
		DiscordUsername: discordUsername,
	}

	// Midtrans setup
	var snapClient snap.Client
	snapClient.New(u.midtransServerKey, midtrans.Sandbox) // Use Sandbox for testing

	req := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  newTransaction.ExternalID,
			GrossAmt: int64(plan.Price),
		},
		Items: &[]midtrans.ItemDetails{
			{
				ID:    plan.ID.String(),
				Price: int64(plan.Price),
				Qty:   1,
				Name:  plan.Name,
			},
		},
		Callbacks: &snap.Callbacks{
			Finish: returnURL,
		},
	}

	snapRes, midtransErr := snapClient.CreateTransaction(req)
	if midtransErr != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create midtrans transaction: %v", midtransErr)
	}

	newTransaction.PaymentToken = snapRes.Token
	newTransaction.InvoiceURL = snapRes.RedirectURL

	if err := tx.Create(newTransaction).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &CheckoutResponse{
		Token:       snapRes.Token,
		RedirectURL: snapRes.RedirectURL,
	}, nil
}

func (u *UserSubscriptionUseCase) HandleMidtransWebhook(payload map[string]interface{}) error {
	var apiClient coreapi.Client
	apiClient.New(u.midtransServerKey, midtrans.Sandbox)

	orderID, ok := payload["order_id"].(string)
	if !ok {
		fmt.Println("[Midtrans Webhook] No order_id in payload, ignoring (could be a test or recurring test ping)")
		return nil
	}

	transactionStatusResp, err := apiClient.CheckTransaction(orderID)
	if err != nil {
		// Pengecekan ke Midtrans gagal, kemungkinan ini adalah "Test notification" dari dashboard
		// yang menggunakan order_id fiktif. Kita kembalikan nil agar Midtrans menerima HTTP 200 OK.
		fmt.Printf("[Midtrans Webhook] Failed to check transaction status (could be a test ping) for order %s: %v\n", orderID, err)
		return nil
	}

	tx := u.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var transaction entities.Transaction
	if err := tx.Where("external_id = ?", orderID).First(&transaction).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			fmt.Printf("[Midtrans Webhook] Order %s not found in DB (could be a test ping)\n", orderID)
			return nil
		}
		return err
	}

	if transactionStatusResp != nil {
		switch transactionStatusResp.TransactionStatus {
		case "capture":
			if transactionStatusResp.FraudStatus == "accept" {
				transaction.Status = entities.TransactionStatusSettlement
			}
		case "settlement":
			transaction.Status = entities.TransactionStatusSettlement
		case "cancel", "deny", "expire":
			transaction.Status = entities.TransactionStatusFailed
		case "pending":
			transaction.Status = entities.TransactionStatusPending
		}

		if err := tx.Save(&transaction).Error; err != nil {
			tx.Rollback()
			return err
		}

		// Jika settlement, subscribe user
		if transaction.Status == entities.TransactionStatusSettlement {
			// Aktifkan plan di dalam tx (jangan panggil SubscribeUser karena tx terpisah)
			var plan entities.SubscriptionPlan
			if err := tx.First(&plan, "id = ?", transaction.PlanID).Error; err != nil {
				tx.Rollback()
				return err
			}

			// Matikan subs lama
			var existing entities.UserSubscription
			dbErr := tx.Where("user_id = ? AND status = ?", transaction.UserID, entities.SubscriptionStatusActive).First(&existing).Error
			if dbErr == nil {
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
				UserID:             transaction.UserID,
				SubscriptionPlanID: plan.ID,
				Status:             entities.SubscriptionStatusActive,
				StartDate:          startDate,
				EndDate:            endDate,
			}

			if err := tx.Create(newSub).Error; err != nil {
				tx.Rollback()
				return err
			}

			// Update Role to Member via gRPC
			if u.authClient != nil {
				_, err := u.authClient.GetClient().UpdateUserRole(context.Background(), &pb.UpdateUserRoleRequest{
					UserId: transaction.UserID,
					Role:   "Member",
				})
				if err != nil {
					fmt.Printf("[Midtrans Webhook] Failed to update user role for user %s: %v\n", transaction.UserID, err)
				}
			}

			// Update Discord Username via gRPC if it exists
			if transaction.DiscordUsername != "" && u.authClient != nil {
				_, err := u.authClient.GetClient().UpdateDiscordUsername(context.Background(), &pb.UpdateDiscordUsernameRequest{
					UserId:          transaction.UserID,
					DiscordUsername: transaction.DiscordUsername,
				})
				if err != nil {
					fmt.Printf("[Midtrans Webhook] Failed to update discord username for user %s: %v\n", transaction.UserID, err)
				}
			}
		}
	}

	return tx.Commit().Error
}

func (u *UserSubscriptionUseCase) GetActiveSubscription(userID string) (*entities.UserSubscription, error) {
	var existing entities.UserSubscription
	err := u.db.Where("user_id = ? AND status = ?", userID, entities.SubscriptionStatusActive).First(&existing).Error
	if err != nil {
		return nil, err
	}
	return &existing, nil
}
