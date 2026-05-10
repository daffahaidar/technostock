#!/bin/sh
set -e

echo "🔄 Running database migrations for rust-message..."
sqlx migrate run
echo "✅ Migrations completed."

echo "🚀 Starting rust-message..."
exec ./rust-message
