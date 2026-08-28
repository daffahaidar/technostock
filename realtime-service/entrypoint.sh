#!/bin/sh
set -e

echo "🔄 Running database migrations for realtime-service..."
# --ignore-missing: auth-service, grpc-service, dan realtime-service memakai DB
# `angeltrade` yang sama, jadi satu tabel _sqlx_migrations dipakai bersama.
# Tanpa flag ini realtime-service gagal ("migration X was previously applied but
# is missing in the resolved migrations") begitu auth-service punya migrasi yang
# belum ada di realtime-service/migrations/.
sqlx migrate run --ignore-missing
echo "✅ Migrations completed."

echo "🚀 Starting realtime-service..."
exec ./realtime-service
