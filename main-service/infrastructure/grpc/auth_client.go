package grpc

import (
	"context"
	"log"
	"strings"

	"main-service/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type AuthClient struct {
	client pb.UserServiceClient
}

func NewAuthClient(authGRPCURL string) *AuthClient {
	// Extract host from URL if it contains http:// prefix
	authGRPCURL = strings.TrimPrefix(authGRPCURL, "http://")
	
	// Ensure we connect using insecure credentials since we don't have TLS in local dev
	conn, err := grpc.NewClient(authGRPCURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("Failed to connect to auth gRPC service: %v", err)
	}

	client := pb.NewUserServiceClient(conn)
	log.Println("Connected to Auth gRPC service at", authGRPCURL)

	return &AuthClient{
		client: client,
	}
}

func (c *AuthClient) ValidateToken(ctx context.Context, token string) (*pb.ValidateTokenResponse, error) {
	req := &pb.ValidateTokenRequest{
		Token: token,
	}

	res, err := c.client.ValidateToken(ctx, req)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (c *AuthClient) GetClient() pb.UserServiceClient {
	return c.client
}
