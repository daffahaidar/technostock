package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL      string
	Port             string
	AuthGRPCURL      string
	MidtransClientKey string
	MidtransServerKey string
	// "sandbox" (default) atau "production". Sebelumnya di-hardcode ke Sandbox
	// di usecase, sehingga tidak mungkin menerima pembayaran nyata.
	MidtransEnv      string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or failed to load. Falling back to environment variables.")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL must be set")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8002"
	}

	authGRPCURL := os.Getenv("AUTH_GRPC_URL")
	if authGRPCURL == "" {
		log.Fatal("AUTH_GRPC_URL must be set")
	}

	midtransServerKey := os.Getenv("MIDTRANS_SERVER_KEY")
	if midtransServerKey == "" {
		log.Fatal("MIDTRANS_SERVER_KEY must be set")
	}

	midtransClientKey := os.Getenv("MIDTRANS_CLIENT_KEY")

	midtransEnv := strings.ToLower(os.Getenv("MIDTRANS_ENV"))
	switch midtransEnv {
	case "":
		midtransEnv = "sandbox"
	case "sandbox", "production":
	default:
		log.Fatalf("MIDTRANS_ENV must be \"sandbox\" or \"production\", got %q", midtransEnv)
	}

	return &Config{
		DatabaseURL:     databaseURL,
		Port:            port,
		AuthGRPCURL:     authGRPCURL,
		MidtransClientKey: midtransClientKey,
		MidtransServerKey: midtransServerKey,
		MidtransEnv:       midtransEnv,
	}
}
