#!/bin/sh
set -e

echo "🔄 Running database migrations for auth-service..."
sqlx migrate run
echo "✅ Migrations completed."

echo "🚀 Starting auth-service..."
exec ./auth-service
