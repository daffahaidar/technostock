.PHONY: dev dev-d prod prod-d down-dev down-prod logs-dev logs-prod ps-dev ps-prod \
        push push-auth push-realtime push-main push-frontend \
        pull deploy deploy-down

# ─── Config ───────────────────────────────────────────────────────────────────
DOCKER_HUB_USER  := daffahaidarnz
REPO             := technorider
VERSION          ?= latest

AUTH_IMAGE       := $(DOCKER_HUB_USER)/$(REPO):auth-service-$(VERSION)
REALTIME_IMAGE   := $(DOCKER_HUB_USER)/$(REPO):realtime-service-$(VERSION)
MAIN_IMAGE       := $(DOCKER_HUB_USER)/$(REPO):main-service-$(VERSION)
FRONTEND_IMAGE   := $(DOCKER_HUB_USER)/$(REPO):frontend-$(VERSION)

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

# ─── Technorider Prod (local build) ───────────────────────────────────────────

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

# ─── Docker Hub — Push ────────────────────────────────────────────────────────

## Build & push semua production image ke Docker Hub
## Usage: make push              → tag: latest
##        make push VERSION=1.0.0 → tag: 1.0.0
push: push-auth push-realtime push-main push-frontend
	@echo ""
	@echo "✅ Semua image berhasil dipush ke Docker Hub!"
	@echo "   $(AUTH_IMAGE)"
	@echo "   $(REALTIME_IMAGE)"
	@echo "   $(MAIN_IMAGE)"
	@echo "   $(FRONTEND_IMAGE)"

## Build & push auth-service saja
push-auth:
	@echo "🔨 Building auth-service..."
	docker compose -f docker-compose.prod.yml build auth-service
	docker tag technorider-prod-auth-service:latest $(AUTH_IMAGE)
	@echo "📤 Pushing $(AUTH_IMAGE)..."
	docker push $(AUTH_IMAGE)

## Build & push realtime-service saja
push-realtime:
	@echo "🔨 Building realtime-service..."
	docker compose -f docker-compose.prod.yml build realtime-service
	docker tag technorider-prod-realtime-service:latest $(REALTIME_IMAGE)
	@echo "📤 Pushing $(REALTIME_IMAGE)..."
	docker push $(REALTIME_IMAGE)

## Build & push main-service saja
push-main:
	@echo "🔨 Building main-service..."
	docker compose -f docker-compose.prod.yml build main-service
	docker tag technorider-prod-main-service:latest $(MAIN_IMAGE)
	@echo "📤 Pushing $(MAIN_IMAGE)..."
	docker push $(MAIN_IMAGE)

## Build & push frontend saja
push-frontend:
	@echo "🔨 Building frontend..."
	docker compose -f docker-compose.prod.yml build frontend
	docker tag technorider-prod-frontend:latest $(FRONTEND_IMAGE)
	@echo "📤 Pushing $(FRONTEND_IMAGE)..."
	docker push $(FRONTEND_IMAGE)

# ─── Docker Hub — Deploy (dari server/VPS) ────────────────────────────────────

## Pull semua image terbaru dari Docker Hub (untuk server)
pull:
	docker pull $(AUTH_IMAGE)
	docker pull $(REALTIME_IMAGE)
	docker pull $(MAIN_IMAGE)
	docker pull $(FRONTEND_IMAGE)
	@echo "✅ Semua image berhasil di-pull!"

## Jalankan semua service menggunakan image dari Docker Hub (untuk server)
## Pastikan sudah `make pull` atau image sudah tersedia
deploy:
	docker compose -f docker-compose.hub.yml up -d
	@echo "🚀 Technorider production running dari Docker Hub!"

## Hentikan deployment dari Docker Hub
deploy-down:
	docker compose -f docker-compose.hub.yml down

## Hentikan deployment + hapus semua volumes
deploy-down-volumes:
	docker compose -f docker-compose.hub.yml down -v

## Lihat logs deployment
logs-deploy:
	docker compose -f docker-compose.hub.yml logs -f

## Update service dari Docker Hub (pull latest + restart)
deploy-update:
	@echo "📥 Pulling latest images..."
	make pull VERSION=$(VERSION)
	@echo "♻️  Restarting services..."
	docker compose -f docker-compose.hub.yml up -d --no-build
	@echo "✅ Deployment updated!"

# ─── Utilities ────────────────────────────────────────────────────────────────

## Validasi syntax semua compose file
validate:
	@echo "✅ Validating docker-compose.dev.yml..."
	docker compose -f docker-compose.dev.yml config --quiet && echo "  dev: OK"
	@echo "✅ Validating docker-compose.prod.yml..."
	docker compose -f docker-compose.prod.yml config --quiet && echo "  prod: OK"
	@echo "✅ Validating docker-compose.hub.yml..."
	docker compose -f docker-compose.hub.yml config --quiet && echo "  hub: OK"

## Tampilkan help
help:
	@echo ""
	@echo "  Technorider Docker Commands"
	@echo "  ═══════════════════════════════════════════════"
	@echo "  [Development]"
	@echo "  make dev              Start semua service (dev, foreground)"
	@echo "  make dev-d            Start semua service (dev, background)"
	@echo "  make down-dev         Stop dev services"
	@echo "  make down-dev-volumes Stop dev + hapus semua volumes"
	@echo "  make logs-dev         Tail dev logs"
	@echo "  make ps-dev           Status dev services"
	@echo ""
	@echo "  [Production — local build]"
	@echo "  make prod             Start semua service (prod, foreground)"
	@echo "  make prod-d           Start semua service (prod, background)"
	@echo "  make down-prod        Stop prod services"
	@echo "  make logs-prod        Tail prod logs"
	@echo "  make ps-prod          Status prod services"
	@echo ""
	@echo "  [Docker Hub — Push]"
	@echo "  make push             Build & push semua service ke Docker Hub"
	@echo "  make push VERSION=x.x Build & push dengan versi spesifik"
	@echo "  make push-auth        Push auth-service saja"
	@echo "  make push-realtime    Push realtime-service saja"
	@echo "  make push-main        Push main-service saja"
	@echo "  make push-frontend    Push frontend saja"
	@echo ""
	@echo "  [Deploy dari Docker Hub — untuk server/VPS]"
	@echo "  make pull             Pull semua image terbaru"
	@echo "  make deploy           Jalankan dari Docker Hub image"
	@echo "  make deploy-down      Stop deployment"
	@echo "  make deploy-update    Pull terbaru + restart"
	@echo "  make logs-deploy      Tail deployment logs"
	@echo "  ═══════════════════════════════════════════════"
	@echo ""
