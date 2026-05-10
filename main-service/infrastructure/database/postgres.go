package database

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func ConnectPostgres(databaseURL string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "product.", // schema name
			SingularTable: false,
		},
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Create schema if it doesn't exist
	db.Exec("CREATE SCHEMA IF NOT EXISTS product;")

	log.Println("Connected to PostgreSQL database")
	return db
}
