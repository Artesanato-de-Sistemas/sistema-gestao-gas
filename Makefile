SHELL := /bin/bash

.PHONY: up down rebuild logs ps health test lint format shell migrate makemigrations

up:
	docker compose up -d --build

down:
	docker compose down

rebuild:
	docker compose build --no-cache

logs:
	docker compose logs -f --tail=200

health:
	@curl -fsS http://localhost:$${BACKEND_PORT:-8000}/api/health >/dev/null
	@echo "backend: ok"
	@curl -fsS http://localhost:$${FRONTEND_PORT:-5173}/ >/dev/null
	@echo "frontend: ok"

lint:
	docker compose run --rm backend ruff check .

format:
	docker compose run --rm backend ruff format .

shell:
	docker compose run --rm backend python manage.py shell

migrate:
	docker compose run --rm backend python manage.py migrate

makemigrations:
	docker compose run --rm backend python manage.py makemigrations