# =====================================
# Full-Stack Template Makefile
# =====================================
# Usage: make [target]
# Run "make help" to see all targets
# =====================================

.PHONY: help setup dev dev-backend dev-frontend stop stop-backend stop-frontend restart build build-backend build-frontend logs logs-backend logs-frontend clean prod-backend prod-frontend prod-frontend-nginx

help: ## Show available commands
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-25s %s\n", $$1, $$2}'

# --- Setup ---
setup: clean build dev ## Clean, build, and start all containers

setup-prod: clean build-prod prod ## Clean, build production image, and start production containers


# --- Development ---
dev: ## Start all dev containers
	cd shared && docker-compose up -d

prod: ## Start production containers
	cd shared && docker-compose -f docker-compose.prod.yml up -d

dev-backend: ## Start only backend dev container
	cd shared && docker-compose -f docker-compose.backend.yml up -d

dev-frontend: ## Start only frontend dev container
	cd shared && docker-compose -f docker-compose.frontend.yml up -d

# --- Stop ---
stop: ## Stop all containers
	cd shared && docker-compose down

stop-backend: ## Stop backend container
	cd shared && docker-compose -f docker-compose.backend.yml down

stop-frontend: ## Stop frontend container
	cd shared && docker-compose -f docker-compose.frontend.yml down

# --- Restart ---
restart: ## Restart all containers
	cd shared && docker-compose restart

# --- Build ---
build: ## Build all services
	cd shared && docker-compose build

build-prod: ## Build production image
	cd shared && docker-compose -f docker-compose.prod.yml build

build-backend: ## Build backend image
	cd shared && docker-compose -f docker-compose.backend.yml build

build-frontend: ## Build frontend image
	cd shared && docker-compose -f docker-compose.frontend.yml build

# --- Logs ---
logs: ## Follow logs for all containers
	cd shared && docker-compose logs -f

logs-backend: ## Follow logs for backend
	cd shared && docker-compose -f docker-compose.backend.yml logs -f

logs-frontend: ## Follow logs for frontend
	cd shared && docker-compose -f docker-compose.frontend.yml logs -f

# --- Clean ---
clean: ## Remove containers and volumes
	cd shared && docker-compose down -v

# --- Production ---
prod-backend: ## Start backend in production mode
	cd shared && docker-compose -f docker-compose.backend.prod.yml up -d

prod-frontend: ## Start frontend in production mode
	cd shared && docker-compose -f docker-compose.frontend.prod.yml up -d

prod-frontend-nginx: ## Start frontend with nginx
	cd shared && docker-compose -f docker-compose.frontend.nginx.yml up -d
