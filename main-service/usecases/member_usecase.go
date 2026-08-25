package usecases

import (
	"context"
	"main-service/domain/entities"
	"main-service/infrastructure/grpc"
	"main-service/pb"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MemberUseCase struct {
	db                *gorm.DB
	authClient        *grpc.AuthClient
	userSubUseCase    *UserSubscriptionUseCase
}

func NewMemberUseCase(db *gorm.DB, authClient *grpc.AuthClient, userSubUseCase *UserSubscriptionUseCase) *MemberUseCase {
	return &MemberUseCase{
		db:             db,
		authClient:     authClient,
		userSubUseCase: userSubUseCase,
	}
}

type MemberResponse struct {
	ID                  string     `json:"id"`
	Name                string     `json:"name"`
	Email               string     `json:"email"`
	Role                string     `json:"role"`
	Status              string     `json:"status"`
	MembershipEndDate   *time.Time `json:"membership_end_date"`
	SubscriptionPlanName string     `json:"subscription_plan_name"`
	SubscriptionStatus  string     `json:"subscription_status"`
	AccountTypeName     string     `json:"account_type_name"`
	DiscordUsername     string     `json:"discord_username"`
}

func (u *MemberUseCase) GetMembers() ([]MemberResponse, error) {
	// 1. Fetch all users excluding Admin and Maintainer via gRPC
	grpcResp, err := u.authClient.GetClient().GetAllUsers(context.Background(), &pb.GetAllUsersRequest{
		ExcludeRoles: []string{"Admin", "Maintainer"},
	})
	if err != nil {
		return nil, err
	}

	// 2. Extract user IDs
	var userIDs []string
	usersMap := grpcResp.Users
	for id := range usersMap {
		userIDs = append(userIDs, id)
	}

	// 3. Fetch active subscriptions for these users
	var activeSubs []entities.UserSubscription
	if len(userIDs) > 0 {
		u.db.Preload("SubscriptionPlan").
			Preload("SubscriptionPlan.AccountType").
			Where("user_id IN ? AND status = ?", userIDs, entities.SubscriptionStatusActive).
			Find(&activeSubs)
	}

	// Map user_id to their active subscription
	subMap := make(map[string]entities.UserSubscription)
	for _, sub := range activeSubs {
		subMap[sub.UserID] = sub
	}

	// 4. Combine data
	var result []MemberResponse
	for id, grpcUser := range usersMap {
		member := MemberResponse{
			ID:     id,
			Name:   grpcUser.Name,
			Email:  grpcUser.Email,
			Role:   grpcUser.Role,
			Status: grpcUser.Status,
		}

		if grpcUser.DiscordUsername != nil {
			member.DiscordUsername = *grpcUser.DiscordUsername
		}

		if sub, ok := subMap[id]; ok {
			member.MembershipEndDate = sub.EndDate
			member.SubscriptionStatus = string(sub.Status)
			if sub.SubscriptionPlan.ID != uuid.Nil {
				member.SubscriptionPlanName = sub.SubscriptionPlan.Name
				if sub.SubscriptionPlan.AccountType.ID != uuid.Nil {
					member.AccountTypeName = sub.SubscriptionPlan.AccountType.Name
				}
			}
		}

		result = append(result, member)
	}

	return result, nil
}

func (u *MemberUseCase) PromoteToMember(userID string, planID uuid.UUID, discordUsername string) error {
	// 1. Give them the subscription
	_, err := u.userSubUseCase.SubscribeUser(userID, planID)
	if err != nil {
		return err
	}

	// 2. Update Role to Member via gRPC
	_, err = u.authClient.GetClient().UpdateUserRole(context.Background(), &pb.UpdateUserRoleRequest{
		UserId: userID,
		Role:   "Member",
	})
	if err != nil {
		return err
	}

	// 3. Update Discord Username if provided
	if discordUsername != "" {
		_, err = u.authClient.GetClient().UpdateDiscordUsername(context.Background(), &pb.UpdateDiscordUsernameRequest{
			UserId:          userID,
			DiscordUsername: discordUsername,
		})
	}

	return err
}

func (u *MemberUseCase) ExtendSubscription(userID string, planID uuid.UUID) error {
    // 1. Start Transaction
	tx := u.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var plan entities.SubscriptionPlan
	if err := tx.First(&plan, "id = ?", planID).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 2. Find active subscription
	var activeSub entities.UserSubscription
	err := tx.Preload("SubscriptionPlan").Where("user_id = ? AND status = ?", userID, entities.SubscriptionStatusActive).First(&activeSub).Error
	if err != nil {
		tx.Rollback()
		// If they don't have an active subscription, just promote/subscribe them normally
		if err == gorm.ErrRecordNotFound {
			// fallback to Subscribing
			tx.Commit()
			_, subErr := u.userSubUseCase.SubscribeUser(userID, planID)
			return subErr
		}
		return err
	}

	// 3. Update plan ID and end date
	isSameAccountType := activeSub.SubscriptionPlan.AccountTypeID == plan.AccountTypeID
	activeSub.SubscriptionPlanID = plan.ID
	activeSub.SubscriptionPlan = entities.SubscriptionPlan{} // Clear relation so GORM uses the updated ID

	if plan.DurationMonths > 0 {
		if isSameAccountType && activeSub.EndDate != nil {
			// Akumulasi dari EndDate lama
			newEndDate := activeSub.EndDate.AddDate(0, plan.DurationMonths, 0)
			activeSub.EndDate = &newEndDate
		} else {
			// Reset (dihitung dari sekarang) jika beda AccountType atau sebelumnya Lifetime
			newEndDate := time.Now().AddDate(0, plan.DurationMonths, 0)
			activeSub.EndDate = &newEndDate
		}
	} else if plan.DurationMonths == 0 {
		// Lifetime
		activeSub.EndDate = nil
	}

	if err := tx.Save(&activeSub).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (u *MemberUseCase) RevokeMembership(userID string) error {
	// 1. Mark active subscription as cancelled
	if err := u.db.Model(&entities.UserSubscription{}).
		Where("user_id = ? AND status = ?", userID, entities.SubscriptionStatusActive).
		Update("status", entities.SubscriptionStatusCancelled).Error; err != nil {
		return err
	}

	// 2. Update role to User via gRPC
	_, err := u.authClient.GetClient().UpdateUserRole(context.Background(), &pb.UpdateUserRoleRequest{
		UserId: userID,
		Role:   "User",
	})

	return err
}
