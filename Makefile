.PHONY: dev dev-d prod prod-d down-dev down-prod logs-dev logs-prod ps-dev ps-prod

# ─── Technorider Dev ──────────────────────────────────────────────────────────

## Jalankan semua service dalam mode development (foreground + live logs)
dev:
	docker compose -f docker-compose.dev.yml up --build

## Jalankan semua service dalam mode development (background / detached)
dev-d:
	docker compose -f docker-compose.dev.yml up --build -d

## Hentikan semua container dev (tanpa hapus volumes)
down-dev:
	docker compose -f docker-compose.dev.yml down

## Hentikan semua container dev DAN hapus semua volumes (reset data)
down-dev-volumes:
	docker compose -f docker-compose.dev.yml down -v

## Lihat logs semua service dev secara live
logs-dev:
	docker compose -f docker-compose.dev.yml logs -f

## Status container dev
ps-dev:
	docker compose -f docker-compose.dev.yml ps

# ─── Technorider Prod ─────────────────────────────────────────────────────────

## Jalankan semua service dalam mode production (foreground + live logs)
prod:
	docker compose -f docker-compose.prod.yml up --build

## Jalankan semua service dalam mode production (background / detached)
prod-d:
	docker compose -f docker-compose.prod.yml up --build -d

## Hentikan semua container prod (tanpa hapus volumes)
down-prod:
	docker compose -f docker-compose.prod.yml down

## Hentikan semua container prod DAN hapus semua volumes (reset data)
down-prod-volumes:
	docker compose -f docker-compose.prod.yml down -v

## Lihat logs semua service prod secara live
logs-prod:
	docker compose -f docker-compose.prod.yml logs -f

## Status container prod
ps-prod:
	docker compose -f docker-compose.prod.yml ps

# ─── Utilities ────────────────────────────────────────────────────────────────

## Validasi syntax kedua compose file
validate:
	@echo "✅ Validating docker-compose.dev.yml..."
	docker compose -f docker-compose.dev.yml config --quiet && echo "  dev: OK"
	@echo "✅ Validating docker-compose.prod.yml..."
	docker compose -f docker-compose.prod.yml config --quiet && echo "  prod: OK"

## Tampilkan help
help:
	@echo ""
	@echo "  Technorider Docker Commands"
	@echo "  ─────────────────────────────────────────"
	@echo "  make dev             Start all services (dev, foreground)"
	@echo "  make dev-d           Start all services (dev, background)"
	@echo "  make down-dev        Stop dev services"
	@echo "  make down-dev-volumes Stop dev + remove all volumes"
	@echo "  make logs-dev        Tail dev logs"
	@echo "  make ps-dev          Status dev services"
	@echo "  ─────────────────────────────────────────"
	@echo "  make prod            Start all services (prod, foreground)"
	@echo "  make prod-d          Start all services (prod, background)"
	@echo "  make down-prod       Stop prod services"
	@echo "  make down-prod-volumes Stop prod + remove all volumes"
	@echo "  make logs-prod       Tail prod logs"
	@echo "  make ps-prod         Status prod services"
	@echo "  ─────────────────────────────────────────"
	@echo "  make validate        Validate both compose files"
	@echo ""
