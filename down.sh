#!/bin/bash
# down.sh — Para backend e frontend

BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

echo "⏹ Parando serviços..."

# Tenta pelos PIDs salvos
if [ -f .pids/backend.pid ]; then
  kill $(cat .pids/backend.pid) 2>/dev/null && echo "   Backend parado." || true
  rm -f .pids/backend.pid
fi

if [ -f .pids/frontend.pid ]; then
  kill $(cat .pids/frontend.pid) 2>/dev/null && echo "   Frontend parado." || true
  rm -f .pids/frontend.pid
fi

# Fallback: mata por porta
kill $(lsof -t -i:$BACKEND_PORT) 2>/dev/null || true
kill $(lsof -t -i:$FRONTEND_PORT) 2>/dev/null || true

echo "✅ Pronto."
