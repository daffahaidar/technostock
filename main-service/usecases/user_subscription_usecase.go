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
	midtransEnv       midtrans.EnvironmentType
	authClient        *grpc.AuthClient
}

// midtransEnv: "sandbox" atau "production". Nilai lain diperlakukan sebagai sandbox.
func NewUserSubscriptionUseCase(db *gorm.DB, midtransServerKey, midtransEnv string, authClient *grpc.AuthClient) *UserSubscriptionUseCase {
	env := midtrans.Sandbox
	if midtransEnv == "production" {
		env = midtrans.Production
	}
	return &UserSubscriptionUseCase{
		db:                db,
		midtransServerKey: midtransServerKey,
		midtransEnv:       env,
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

func (u *UserSubscriptionUseCase) BuySubscription(userID string, planID uuid.UUID, discordUsername string, returnURL string, voucherCode string) (*CheckoutResponse, error) {
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

	// Idempotency: Check if user already has a PENDING transaction for this specific plan
	var pendingTx entities.Transaction
	err := tx.Where("user_id = ? AND plan_id = ? AND status = ?", userID, planID, entities.TransactionStatusPending).First(&pendingTx).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		tx.Rollback()
		return nil, err
	}
	if err == nil {
		// Return existing pending transaction without eating more quota
		tx.Rollback()
		return &CheckoutResponse{
			Token:       pendingTx.PaymentToken,
			RedirectURL: pendingTx.InvoiceURL,
		}, nil
	}

	// Double Purchase Protection: Check if user already has an active lifetime subscription for this account type
	var activeLifetimeSub entities.UserSubscription
	err = tx.Joins("JOIN main.subscription_plans ON main.subscription_plans.id = main.user_subscriptions.subscription_plan_id").
		Where("main.user_subscriptions.user_id = ? AND main.subscription_plans.account_type_id = ? AND main.subscription_plans.duration_months = 0 AND main.user_subscriptions.status = ?", userID, plan.AccountTypeID, entities.SubscriptionStatusActive).
		First(&activeLifetimeSub).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		tx.Rollback()
		return nil, err
	}
	if err == nil {
		tx.Rollback()
		return nil, errors.New("anda sudah memiliki langganan lifetime untuk tipe akun ini")
	}

	// Atomic Quota Reservation
	if plan.Quota != nil {
		res := tx.Model(&entities.SubscriptionPlan{}).
			Where("id = ? AND used_quota < quota", plan.ID).
			Update("used_quota", gorm.Expr("used_quota + 1"))
		if res.Error != nil {
			tx.Rollback()
			return nil, res.Error
		}
		if res.RowsAffected == 0 {
			tx.Rollback()
			return nil, errors.New("mohon maaf, kuota untuk plan ini sudah habis")
		}
	}

	var appliedVoucher *entities.Voucher
	var discountAmount float64 = 0

	if voucherCode != "" {
		var voucher entities.Voucher
		if err := tx.Where("code = ?", voucherCode).First(&voucher).Error; err != nil {
			tx.Rollback()
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("kode voucher tidak ditemukan")
			}
			return nil, err
		}

		if time.Now().After(voucher.ExpiresAt) {
			tx.Rollback()
			return nil, errors.New("kode voucher sudah kedaluwarsa")
		}

		// Atomic Quota Reservation for Voucher
		if voucher.Quota != nil {
			res := tx.Model(&entities.Voucher{}).
				Where("id = ? AND used_quota < quota", voucher.ID).
				Update("used_quota", gorm.Expr("used_quota + 1"))
			if res.Error != nil {
				tx.Rollback()
				return nil, res.Error
			}
			if res.RowsAffected == 0 {
				tx.Rollback()
				return nil, errors.New("mohon maaf, kuota voucher ini sudah habis")
			}
		}

		appliedVoucher = &voucher
		
		// Calculate discount
		discountAmount = plan.Price * (voucher.DiscountPercentage / 100)
		if discountAmount > voucher.MaxDiscountAmount {
			discountAmount = voucher.MaxDiscountAmount
		}
	}

	finalPrice := plan.Price - discountAmount
	if finalPrice < 0 {
		finalPrice = 0
	}

	// Buat transaksi baru
	newTransaction := &entities.Transaction{
		UserID:          userID,
		PlanID:          plan.ID,
		ExternalID:      fmt.Sprintf("SUB-%s-%d", planID.String()[:8], time.Now().Unix()),
		Amount:          finalPrice,
		DiscountAmount:  discountAmount,
		Status:          entities.TransactionStatusPending,
		DiscordUsername: discordUsername,
	}

	if appliedVoucher != nil {
		newTransaction.VoucherID = &appliedVoucher.ID
	}

	if finalPrice == 0 {
		newTransaction.Status = entities.TransactionStatusSettlement
		newTransaction.PaymentToken = "FREE-" + newTransaction.ExternalID
		newTransaction.InvoiceURL = returnURL

		if err := tx.Create(newTransaction).Error; err != nil {
			tx.Rollback()
			return nil, err
		}

		if err := u.activateSubscription(tx, newTransaction); err != nil {
			tx.Rollback()
			return nil, err
		}

		if err := tx.Commit().Error; err != nil {
			return nil, err
		}

		return &CheckoutResponse{
			Token:       newTransaction.PaymentToken,
			RedirectURL: newTransaction.InvoiceURL,
		}, nil
	}

	// Midtrans setup
	var snapClient snap.Client
	snapClient.New(u.midtransServerKey, u.midtransEnv)

	req := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  newTransaction.ExternalID,
			GrossAmt: int64(finalPrice),
		},
		Items: &[]midtrans.ItemDetails{
			{
				ID:    plan.ID.String(),
				Price: int64(finalPrice),
				Qty:   1,
				Name:  plan.Name,
			},
		},
		Callbacks: &snap.Callbacks{
			Finish: returnURL,
		},
		Expiry: &snap.ExpiryDetails{
			Unit:     "hour",
			Duration: 1,
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
	apiClient.New(u.midtransServerKey, u.midtransEnv)

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

	oldStatus := transaction.Status

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

		// Release quota if transaction failed/expired and it was previously pending
		if transaction.Status == entities.TransactionStatusFailed && oldStatus == entities.TransactionStatusPending {
			var plan entities.SubscriptionPlan
			if err := tx.First(&plan, "id = ?", transaction.PlanID).Error; err == nil && plan.Quota != nil {
				tx.Model(&entities.SubscriptionPlan{}).
					Where("id = ? AND used_quota > 0", plan.ID).
					Update("used_quota", gorm.Expr("used_quota - 1"))
			}

			if transaction.VoucherID != nil {
				tx.Model(&entities.Voucher{}).
					Where("id = ? AND used_quota > 0", *transaction.VoucherID).
					Update("used_quota", gorm.Expr("used_quota - 1"))
			}
		}

		// Jika settlement DAN status lama bukan settlement, subscribe user (idempotency check)
		if transaction.Status == entities.TransactionStatusSettlement && oldStatus != entities.TransactionStatusSettlement {
			if err := u.activateSubscription(tx, &transaction); err != nil {
				tx.Rollback()
				return err
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

func (u *UserSubscriptionUseCase) SyncTransaction(orderID string) (*entities.Transaction, error) {
	payload := map[string]interface{}{
		"order_id": orderID,
	}
	
	// Secara paksa trigger webhook logic yang sudah menghandle call API Midtrans dan logic DB
	_ = u.HandleMidtransWebhook(payload)

	var transaction entities.Transaction
	if err := u.db.Where("external_id = ?", orderID).First(&transaction).Error; err != nil {
		return nil, err
	}

	return &transaction, nil
}

func (u *UserSubscriptionUseCase) activateSubscription(tx *gorm.DB, transaction *entities.Transaction) error {
	var plan entities.SubscriptionPlan
	if err := tx.First(&plan, "id = ?", transaction.PlanID).Error; err != nil {
		return err
	}

	// Cek subscription lama
	var existing entities.UserSubscription
	dbErr := tx.Preload("SubscriptionPlan").Where("user_id = ? AND status = ?", transaction.UserID, entities.SubscriptionStatusActive).First(&existing).Error
	
	if dbErr == nil && existing.SubscriptionPlan.AccountTypeID == plan.AccountTypeID {
		// Account Type sama -> Akumulasi
		existing.SubscriptionPlanID = plan.ID
		existing.SubscriptionPlan = entities.SubscriptionPlan{} // Clear relation so GORM uses the updated ID
		if plan.DurationMonths > 0 {
			if existing.EndDate != nil {
				newEndDate := existing.EndDate.AddDate(0, plan.DurationMonths, 0)
				existing.EndDate = &newEndDate
			} else {
				newEndDate := time.Now().AddDate(0, plan.DurationMonths, 0)
				existing.EndDate = &newEndDate
			}
		} else if plan.DurationMonths == 0 {
			existing.EndDate = nil
		}
		
		if err := tx.Save(&existing).Error; err != nil {
			return err
		}
	} else {
		// Account Type beda ATAU belum ada langganan aktif
		if dbErr == nil {
			// Batalkan yang lama
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
			return err
		}
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
	return nil
}
