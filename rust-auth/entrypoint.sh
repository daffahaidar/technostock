#!/bin/sh
set -e

echo "🔄 Running database migrations for rust-auth..."
sqlx migrate run
echo "✅ Migrations completed."

echo "🚀 Starting rust-auth..."
exec ./rust-auth
