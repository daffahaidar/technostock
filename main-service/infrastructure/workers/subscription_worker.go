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
	// Run immediately on start, then every hour
	go func() {
		w.processExpiredSubscriptions()
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			w.processExpiredSubscriptions()
		}
	}()
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
