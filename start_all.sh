#!/usr/bin/env bash

set -euo pipefail

echo "🚀 Unified launcher: API server + Next.js kiosk"
echo "==============================================="

# Ensure .env exists so server doesn't prompt
if [ ! -f .env ]; then
  echo "OPENAI_API_KEY=" > .env
  echo "Created placeholder .env file."
fi

echo "[1/3] Installing Python dependencies inside venv (if needed)"
if command -v python3 >/dev/null 2>&1; then PY=python3; else PY=python; fi

if [ ! -d .venv ]; then
  $PY -m venv .venv
fi
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo "[2/3] Starting FastAPI server on :8000"
($PY start_server.py) &
API_PID=$!

cleanup() {
  echo
  echo "🧹 Shutting down background processes..."
  kill $API_PID 2>/dev/null || true
  kill $WEB_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 2
echo "Health-checking API..."
if command -v curl >/dev/null 2>&1; then
  curl -s http://localhost:8000/ || true
fi

echo "[3/3] Starting Next.js dev server on :3000"
if command -v npm >/dev/null 2>&1; then
  (bash start_webpage.sh) &
  WEB_PID=$!
  echo "Both services started. Press Ctrl+C to stop."
  wait
else
  echo "⚠️ npm not found. Skipping Next.js startup. API server is running on :8000"
  wait $API_PID
fi

