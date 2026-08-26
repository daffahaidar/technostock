#!/bin/sh
set -e

echo "🔄 Running database migrations for auth-service..."
# --ignore-missing: DB `technostock` dipakai bersama beberapa service, jadi tabel
# _sqlx_migrations juga bersama. Lihat catatan di realtime-service/entrypoint.sh.
sqlx migrate run --ignore-missing
echo "✅ Migrations completed."

echo "🚀 Starting auth-service..."
exec ./auth-service
