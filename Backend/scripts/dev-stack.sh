#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
AI_DIR="$(cd "$WEB_DIR/../AI" && pwd)"

API_PORT="${AI_API_PORT:-8000}"
export AI_API_BASE_URL="http://127.0.0.1:${API_PORT}"

echo "Starting AI API on port ${API_PORT} (source: ${AI_DIR})"
(
  cd "$AI_DIR"
  uvicorn api.app:app --host 0.0.0.0 --port "${API_PORT}"
) &
API_PID=$!

echo "Starting web stack (Express + Vite) from ${WEB_DIR}"
(
  cd "$WEB_DIR"
  npm run dev
) &
WEB_PID=$!

cleanup() {
  echo "Stopping services..."
  if [[ -n "${API_PID:-}" ]]; then
    kill "${API_PID}" >/dev/null 2>&1 || true
  fi
  if [[ -n "${WEB_PID:-}" ]]; then
    kill "${WEB_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

wait -n
