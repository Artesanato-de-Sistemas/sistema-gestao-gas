SHELL := /bin/bash

PYTHON   := backend/.venv/Scripts/python
MANAGE   := $(PYTHON) backend/manage.py
NPM      := npm
BACKEND_PORT  ?= 8000
FRONTEND_PORT ?= 3000

.PHONY: up down backend frontend health shell migrate makemigrations lint format install

## ── Ciclo de vida ─────────────────────────────────────────────────────────────

# Sobe backend e frontend em segundo plano
up:
	@echo "▶ Subindo backend na porta $(BACKEND_PORT)..."
	@cd backend && $(CURDIR)/backend/.venv/Scripts/python manage.py runserver $(BACKEND_PORT) &
	@echo "▶ Subindo frontend na porta $(FRONTEND_PORT)..."
	@cd frontend && npm run dev -- --port=$(FRONTEND_PORT) &
	@echo ""
	@echo "✅ Serviços iniciados:"
	@echo "   Backend  → http://localhost:$(BACKEND_PORT)"
	@echo "   Frontend → http://localhost:$(FRONTEND_PORT)"
	@echo ""
	@echo "   Para parar: make down"

# Para os processos nas portas configuradas
down:
	@echo "⏹ Parando backend (porta $(BACKEND_PORT))..."
	@-kill $$(lsof -t -i:$(BACKEND_PORT)) 2>/dev/null || true
	@echo "⏹ Parando frontend (porta $(FRONTEND_PORT))..."
	@-kill $$(lsof -t -i:$(FRONTEND_PORT)) 2>/dev/null || true
	@echo "✅ Serviços parados."

## ── Individuais ───────────────────────────────────────────────────────────────

backend:
	cd backend && .venv/Scripts/python manage.py runserver $(BACKEND_PORT)

frontend:
	cd frontend && npm run dev -- --port=$(FRONTEND_PORT)

## ── Verificações ──────────────────────────────────────────────────────────────

health:
	@curl -fsS http://localhost:$(BACKEND_PORT)/api/ > /dev/null && echo "backend:  ✅ ok" || echo "backend:  ❌ offline"
	@curl -fsS http://localhost:$(FRONTEND_PORT)/ > /dev/null && echo "frontend: ✅ ok" || echo "frontend: ❌ offline"

## ── Django management ─────────────────────────────────────────────────────────

shell:
	cd backend && .venv/Scripts/python manage.py shell

migrate:
	cd backend && .venv/Scripts/python manage.py migrate

makemigrations:
	cd backend && .venv/Scripts/python manage.py makemigrations

## ── Qualidade de código ───────────────────────────────────────────────────────

lint:
	cd backend && .venv/Scripts/python -m ruff check .

format:
	cd backend && .venv/Scripts/python -m ruff format .

## ── Instalação ────────────────────────────────────────────────────────────────

install:
	@echo "▶ Instalando dependências do backend..."
	cd backend && python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt
	@echo "▶ Instalando dependências do frontend..."
	cd frontend && npm install
	@echo "✅ Instalação concluída."