package workers

import (
	"context"
	"log"
	"time"

	"main-service/domain/entities"
	"main-service/infrastructure/grpc"
	"main-service/pb"

	"gorm.io/gorm"
)

type SubscriptionWorker struct {
	db         *gorm.DB
	authClient *grpc.AuthClient
}

func NewSubscriptionWorker(db *gorm.DB, authClient *grpc.AuthClient) *SubscriptionWorker {
	return &SubscriptionWorker{
		db:         db,
		authClient: authClient,
	}
}

func (w *SubscriptionWorker) Start() {
	// Run immediately on start, then periodically
	go func() {
		w.processExpiredSubscriptions()
		w.processExpiredTransactions()
		
		ticker := time.NewTicker(10 * time.Minute) // Check every 10 minutes
		defer ticker.Stop()
		for range ticker.C {
			w.processExpiredSubscriptions()
			w.processExpiredTransactions()
		}
	}()
}

func (w *SubscriptionWorker) processExpiredTransactions() {
	log.Println("Running expiration checker for pending transactions...")
	// Find pending transactions older than 2 hours
	cutoffTime := time.Now().Add(-2 * time.Hour)
	
	var staleTransactions []entities.Transaction
	if err := w.db.Preload("Plan").Where("status = ? AND created_at < ?", entities.TransactionStatusPending, cutoffTime).Find(&staleTransactions).Error; err != nil {
		log.Printf("Error fetching stale transactions: %v\n", err)
		return
	}

	for _, tx := range staleTransactions {
		err := w.db.Transaction(func(dbTx *gorm.DB) error {
			// Update status to expired
			tx.Status = entities.TransactionStatusExpired
			if err := dbTx.Save(&tx).Error; err != nil {
				return err
			}
			
			// Release quota if plan has quota
			if tx.Plan.Quota != nil {
				if err := dbTx.Model(&entities.SubscriptionPlan{}).
					Where("id = ? AND used_quota > 0", tx.PlanID).
					Update("used_quota", gorm.Expr("used_quota - 1")).Error; err != nil {
					return err
				}
			}
			return nil
		})
		
		if err != nil {
			log.Printf("Error expiring stale transaction %s: %v\n", tx.ID, err)
		} else {
			log.Printf("Successfully expired stale transaction %s and released quota\n", tx.ID)
		}
	}
}

func (w *SubscriptionWorker) processExpiredSubscriptions() {
	log.Println("Running expiration checker for subscriptions...")
	now := time.Now()

	var expiredSubs []entities.UserSubscription
	// Find subscriptions that are Active but have an end_date that has passed
	if err := w.db.Where("status = ? AND end_date IS NOT NULL AND end_date < ?", entities.SubscriptionStatusActive, now).Find(&expiredSubs).Error; err != nil {
		log.Printf("Error fetching expired subscriptions: %v\n", err)
		return
	}

	for _, sub := range expiredSubs {
		// Update DB Status
		sub.Status = entities.SubscriptionStatusExpired
		if err := w.db.Save(&sub).Error; err != nil {
			log.Printf("Error saving expired subscription for user %s: %v\n", sub.UserID, err)
			continue
		}

		// Update Role via gRPC
		// Assuming we revert to 'User'
		_, err := w.authClient.GetClient().UpdateUserRole(context.Background(), &pb.UpdateUserRoleRequest{
			UserId: sub.UserID,
			Role:   "User",
		})
		if err != nil {
			log.Printf("Error downgrading role for user %s: %v\n", sub.UserID, err)
		} else {
			log.Printf("Successfully expired subscription and downgraded role for user %s\n", sub.UserID)
		}
	}
}
