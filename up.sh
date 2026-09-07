#!/bin/bash
# up.sh — Sobe backend e frontend localmente (substituto do make up no Windows Git Bash)

BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

echo "▶ Subindo backend na porta $BACKEND_PORT..."
cd backend && .venv/Scripts/python manage.py runserver $BACKEND_PORT &
BACKEND_PID=$!
cd ..

echo "▶ Subindo frontend na porta $FRONTEND_PORT..."
cd frontend && npm run dev -- --port=$FRONTEND_PORT &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Serviços iniciados:"
echo "   Backend  → http://localhost:$BACKEND_PORT  (PID $BACKEND_PID)"
echo "   Frontend → http://localhost:$FRONTEND_PORT  (PID $FRONTEND_PID)"
echo ""
echo "   Para parar, pressione Ctrl+C ou rode: bash down.sh"

# Salva os PIDs para o down.sh usar
mkdir -p .pids
echo "$BACKEND_PID" > .pids/backend.pid
echo "$FRONTEND_PID" > .pids/frontend.pid

wait
