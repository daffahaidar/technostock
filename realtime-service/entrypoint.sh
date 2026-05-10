#!/bin/sh
set -e

echo "🔄 Running database migrations for realtime-service..."
sqlx migrate run
echo "✅ Migrations completed."

echo "🚀 Starting realtime-service..."
exec ./realtime-service
