.PHONY: dev dev-d prod prod-d down-dev down-prod logs-dev logs-prod ps-dev ps-prod \
        push push-auth push-grpc push-realtime push-main push-frontend \
        pull deploy deploy-down \
        docker\:dev docker\:prod podman\:dev podman\:prod engine

# ─── Config ───────────────────────────────────────────────────────────────────
# Default engine per OS: Windows → podman, macOS/Linux → docker.
# Keduanya support sub-command `compose`, jadi syntax recipe di bawah identik.
#
# Kenapa tidak auto-detect via $(shell ...)? Karena `make` yang dijalankan dari
# PowerShell/cmd memakai cmd.exe sebagai shell — `command -v`, `/dev/null`, dan
# `&&` gaya POSIX tidak ada di sana. $(OS) di-set langsung oleh Windows sendiri,
# jadi tidak butuh shell sama sekali dan aman di PowerShell, cmd, maupun bash.
#
# Override: make dev ENGINE=docker    (atau pakai target docker:dev / podman:dev)
ifeq ($(OS),Windows_NT)
ENGINE           ?= podman
else
ENGINE           ?= docker
endif
COMPOSE          ?= $(ENGINE) compose

DOCKER_HUB_USER  := daffahaidarnz
REPO             := technostock
VERSION          ?= latest

AUTH_IMAGE       := $(DOCKER_HUB_USER)/$(REPO):auth-service-$(VERSION)
GRPC_IMAGE       := $(DOCKER_HUB_USER)/$(REPO):grpc-service-$(VERSION)
REALTIME_IMAGE   := $(DOCKER_HUB_USER)/$(REPO):realtime-service-$(VERSION)
MAIN_IMAGE       := $(DOCKER_HUB_USER)/$(REPO):main-service-$(VERSION)
FRONTEND_IMAGE   := $(DOCKER_HUB_USER)/$(REPO):frontend-$(VERSION)

# ─── Engine Specific Shortcuts (Docker / Podman) ──────────────────────────────
# Dipakai kalau kedua engine terpasang di satu mesin dan mau pilih manual.

docker\:dev:
	$(MAKE) dev ENGINE=docker

docker\:prod:
	$(MAKE) prod ENGINE=docker

podman\:dev:
	$(MAKE) dev ENGINE=podman

podman\:prod:
	$(MAKE) prod ENGINE=podman

## Tampilkan engine yang terdeteksi
engine:
	@echo "engine  : $(ENGINE)"
	@echo "compose : $(COMPOSE)"

# ─── Technostock Dev ──────────────────────────────────────────────────────────

## Jalankan semua service dalam mode development (foreground + live logs)
dev:
	$(COMPOSE) -f docker-compose.dev.yml up --build

## Jalankan semua service dalam mode development (background / detached)
dev-d:
	$(COMPOSE) -f docker-compose.dev.yml up --build -d

## Hentikan semua container dev (tanpa hapus volumes)
down-dev:
	$(COMPOSE) -f docker-compose.dev.yml down

## Hentikan semua container dev DAN hapus semua volumes (reset data)
down-dev-volumes:
	$(COMPOSE) -f docker-compose.dev.yml down -v

## Lihat logs semua service dev secara live
logs-dev:
	$(COMPOSE) -f docker-compose.dev.yml logs -f

## Status container dev
ps-dev:
	$(COMPOSE) -f docker-compose.dev.yml ps

# ─── Technostock Prod (local build) ───────────────────────────────────────────

## Jalankan semua service dalam mode production (foreground + live logs)
prod:
	$(COMPOSE) -f docker-compose.prod.yml up --build

## Jalankan semua service dalam mode production (background / detached)
prod-d:
	$(COMPOSE) -f docker-compose.prod.yml up --build -d

## Hentikan semua container prod (tanpa hapus volumes)
down-prod:
	$(COMPOSE) -f docker-compose.prod.yml down

## Hentikan semua container prod DAN hapus semua volumes (reset data)
down-prod-volumes:
	$(COMPOSE) -f docker-compose.prod.yml down -v

## Lihat logs semua service prod secara live
logs-prod:
	$(COMPOSE) -f docker-compose.prod.yml logs -f

## Status container prod
ps-prod:
	$(COMPOSE) -f docker-compose.prod.yml ps

# ─── Docker Hub — Push ────────────────────────────────────────────────────────

## Build & push semua production image ke Docker Hub
## Usage: make push              → tag: latest
##        make push VERSION=1.0.0 → tag: 1.0.0
push: push-auth push-grpc push-realtime push-main push-frontend
	@echo ""
	@echo "✅ Semua image berhasil dipush ke Docker Hub!"
	@echo "   $(AUTH_IMAGE)"
	@echo "   $(GRPC_IMAGE)"
	@echo "   $(REALTIME_IMAGE)"
	@echo "   $(MAIN_IMAGE)"
	@echo "   $(FRONTEND_IMAGE)"

## Build & push auth-service saja
push-auth:
	@echo "🔨 Building auth-service..."
	$(COMPOSE) -f docker-compose.prod.yml build auth-service
	$(ENGINE) tag auth-service:latest $(AUTH_IMAGE)
	@echo "📤 Pushing $(AUTH_IMAGE)..."
	$(ENGINE) push $(AUTH_IMAGE)

## Build & push grpc-service saja
push-grpc:
	@echo "🔨 Building grpc-service..."
	$(COMPOSE) -f docker-compose.prod.yml build grpc-service
	$(ENGINE) tag grpc-service:latest $(GRPC_IMAGE)
	@echo "📤 Pushing $(GRPC_IMAGE)..."
	$(ENGINE) push $(GRPC_IMAGE)

## Build & push realtime-service saja
push-realtime:
	@echo "🔨 Building realtime-service..."
	$(COMPOSE) -f docker-compose.prod.yml build realtime-service
	$(ENGINE) tag realtime-service:latest $(REALTIME_IMAGE)
	@echo "📤 Pushing $(REALTIME_IMAGE)..."
	$(ENGINE) push $(REALTIME_IMAGE)

## Build & push main-service saja
push-main:
	@echo "🔨 Building main-service..."
	$(COMPOSE) -f docker-compose.prod.yml build main-service
	$(ENGINE) tag main-service:latest $(MAIN_IMAGE)
	@echo "📤 Pushing $(MAIN_IMAGE)..."
	$(ENGINE) push $(MAIN_IMAGE)

## Build & push frontend saja
push-frontend:
	@echo "🔨 Building frontend..."
	$(COMPOSE) -f docker-compose.prod.yml build frontend
	$(ENGINE) tag frontend:latest $(FRONTEND_IMAGE)
	@echo "📤 Pushing $(FRONTEND_IMAGE)..."
	$(ENGINE) push $(FRONTEND_IMAGE)

# ─── Docker Hub — Deploy (dari server/VPS) ────────────────────────────────────

## Pull semua image terbaru dari Docker Hub (untuk server)
pull:
	$(ENGINE) pull $(AUTH_IMAGE)
	$(ENGINE) pull $(GRPC_IMAGE)
	$(ENGINE) pull $(REALTIME_IMAGE)
	$(ENGINE) pull $(MAIN_IMAGE)
	$(ENGINE) pull $(FRONTEND_IMAGE)
	@echo "✅ Semua image berhasil di-pull!"

## Jalankan semua service menggunakan image dari Docker Hub (untuk server)
## Pastikan sudah `make pull` atau image sudah tersedia
deploy:
	$(COMPOSE) -f docker-compose.hub.yml up -d
	@echo "🚀 Technostock production running dari Docker Hub!"

## Hentikan deployment dari Docker Hub
deploy-down:
	$(COMPOSE) -f docker-compose.hub.yml down

## Hentikan deployment + hapus semua volumes
deploy-down-volumes:
	$(COMPOSE) -f docker-compose.hub.yml down -v

## Lihat logs deployment
logs-deploy:
	$(COMPOSE) -f docker-compose.hub.yml logs -f

## Update service dari Docker Hub (pull latest + restart)
deploy-update:
	@echo "📥 Pulling latest images..."
	make pull VERSION=$(VERSION)
	@echo "♻️  Restarting services..."
	$(COMPOSE) -f docker-compose.hub.yml up -d --no-build
	@echo "✅ Deployment updated!"

# ─── Utilities ────────────────────────────────────────────────────────────────

## Validasi syntax semua compose file
validate:
	@echo "✅ Validating docker-compose.dev.yml..."
	$(COMPOSE) -f docker-compose.dev.yml config --quiet && echo "  dev: OK"
	@echo "✅ Validating docker-compose.prod.yml..."
	$(COMPOSE) -f docker-compose.prod.yml config --quiet && echo "  prod: OK"
	@echo "✅ Validating docker-compose.hub.yml..."
	$(COMPOSE) -f docker-compose.hub.yml config --quiet && echo "  hub: OK"

## Tampilkan help
help:
	@echo ""
	@echo "  Technostock Container Commands  (engine: $(ENGINE))"
	@echo "  ═══════════════════════════════════════════════"
	@echo "  Engine di-auto-detect: docker kalau ada, kalau tidak podman."
	@echo "  make engine           Lihat engine & compose yang terpakai"
	@echo ""
	@echo "  [Development]"
	@echo "  make dev              Start semua service (dev, foreground)"
	@echo "  make docker:dev       Paksa pakai docker compose"
	@echo "  make podman:dev       Paksa pakai podman compose"
	@echo "  make dev-d            Start semua service (dev, background)"
	@echo "  make down-dev         Stop dev services"
	@echo "  make down-dev-volumes Stop dev + hapus semua volumes"
	@echo "  make logs-dev         Tail dev logs"
	@echo "  make ps-dev           Status dev services"
	@echo ""
	@echo "  [Production — local build]"
	@echo "  make prod             Start semua service (prod, foreground)"
	@echo "  make docker:prod      Paksa pakai docker compose"
	@echo "  make podman:prod      Paksa pakai podman compose"
	@echo "  make prod-d           Start semua service (prod, background)"
	@echo "  make down-prod        Stop prod services"
	@echo "  make logs-prod        Tail prod logs"
	@echo "  make ps-prod          Status prod services"
	@echo ""
	@echo "  [Docker Hub — Push]"
	@echo "  make push             Build & push semua service ke Docker Hub"
	@echo "  make push VERSION=x.x Build & push dengan versi spesifik"
	@echo "  make push-auth        Push auth-service saja"
	@echo "  make push-grpc        Push grpc-service saja"
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
