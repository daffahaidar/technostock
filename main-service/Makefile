.PHONY: dev start build test clean fmt check help

# Development server dengan hot reload (butuh air: go install github.com/air-verse/air@latest)
dev:
	@if command -v air > /dev/null; then \
		air; \
	elif [ -f "$$(go env GOPATH)/bin/air" ]; then \
		"$$(go env GOPATH)/bin/air"; \
	else \
		go run ./cmd/api/main.go; \
	fi

# Production server (run direct)
start:
	go run ./cmd/api/main.go

# Build production binary
build:
	go build -o main ./cmd/api/main.go

# Build development binary
build-dev:
	go build -o main ./cmd/api/main.go

# Run tests
test:
	go test ./...

# Run tests dengan output lengkap
test-verbose:
	go test -v ./...

# Format code
fmt:
	go fmt ./...

# Check code tanpa compile (vet & linting)
check:
	go vet ./...

# Clean build artifacts
clean:
	rm -f main

# Show available commands
help:
	@echo "Available commands:"
	@echo "  make dev           - Run development server (uses air if installed, else go run)"
	@echo "  make start         - Run production server"
	@echo "  make build         - Build production binary"
	@echo "  make build-dev     - Build development binary"
	@echo "  make test          - Run tests"
	@echo "  make test-verbose  - Run tests with full output"
	@echo "  make fmt           - Format code"
	@echo "  make check         - Check code without compiling"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make help          - Show this help message"
