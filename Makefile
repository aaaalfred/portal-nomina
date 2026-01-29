# Portal de Nómina - Makefile

.PHONY: help setup dev build clean deploy

help:
	@echo "Portal de Nómina - Commands"
	@echo ""
	@echo "  make setup     - Initial setup (install deps, start DB)"
	@echo "  make dev       - Run all services in development"
	@echo "  make build     - Build all Docker images"
	@echo "  make up        - Start all Docker containers"
	@echo "  make down      - Stop all Docker containers"
	@echo "  make logs      - View Docker logs"
	@echo "  make clean     - Clean build artifacts"
	@echo "  make migrate   - Run database migrations"

setup:
	@./setup.sh

dev:
	@echo "Starting dev servers..."
	@make -j3 dev-backend dev-worker dev-frontend

dev-backend:
	cd backend && npm run start:dev

dev-worker:
	cd worker && npm run start:dev

dev-frontend:
	cd frontend && npm run dev

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	rm -rf backend/dist backend/node_modules
	rm -rf worker/dist worker/node_modules
	rm -rf frontend/dist frontend/node_modules
	rm -rf storage/temp/*

migrate:
	cd backend && npm run migration:run

migrate-from-mysql:
	cd db && node migrate-from-mysql.js
