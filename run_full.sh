#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Paths
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/Backend"
FRONTEND_DIR="${ROOT_DIR}/FrontEnd/client"
AI_DIR="${ROOT_DIR}/AI"
PB_DIR="${ROOT_DIR}/Backend/pocketbase"
PB_DATA_DIR="${PB_DIR}/pb_data"

# Config
PYTHON_BIN="${PYTHON_BIN:-python}"
HEALTH_CHECK_TIMEOUT=30
HEALTH_CHECK_INTERVAL=2

# PIDs for cleanup
PB_PID=""
API_PID=""
BACKEND_PID=""
FRONTEND_PID=""

# Ports (can be overridden via environment variables)
PB_PORT="${POCKETBASE_PORT:-8090}"
API_PORT="${AI_API_PORT:-8000}"
BACKEND_PORT="${PORT:-5001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

# Export for child processes
export POCKETBASE_URL="http://127.0.0.1:${PB_PORT}"
export AI_API_BASE_URL="http://127.0.0.1:${API_PORT}"
export PORT="${BACKEND_PORT}"

# Health check function
check_health() {
  local url="${1}"
  local service="${2}"
  local timeout="${3:-$HEALTH_CHECK_TIMEOUT}"
  local interval="${4:-$HEALTH_CHECK_INTERVAL}"

  log_info "Waiting for ${service} to be healthy at ${url}..."

  local elapsed=0
  while [ $elapsed -lt $timeout ]; do
    if curl -sf "${url}" >/dev/null 2>&1; then
      log_success "${service} is healthy!"
      return 0
    fi
    sleep $interval
    elapsed=$((elapsed + interval))
    echo -n "."
  done

  echo ""
  log_error "${service} failed to become healthy after ${timeout} seconds"
  return 1
}

# Quick prerequisite check
check_prerequisites() {
  log_info "Checking prerequisites..."

  local missing=()

  if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
    missing+=("Python")
  fi

  if ! command -v node >/dev/null 2>&1; then
    missing+=("Node.js")
  fi

  if ! command -v npm >/dev/null 2>&1; then
    missing+=("npm")
  fi

  if ! command -v curl >/dev/null 2>&1; then
    missing+=("curl")
  fi

  if ! command -v uvicorn >/dev/null 2>&1; then
    missing+=("uvicorn")
  fi

  if [ ${#missing[@]} -gt 0 ]; then
    log_error "Missing prerequisites: ${missing[*]}"
    log_error "Please install missing dependencies. See SETUP_GUIDE.md for instructions."
    exit 1
  fi

  log_success "All prerequisites found"
}

# Check environment files
check_env_files() {
  log_info "Checking environment files..."

  if [[ ! -f "${AI_DIR}/.env" ]]; then
    log_error "AI/.env not found. Please create it from AI/.env.example"
    exit 1
  fi

  if [[ ! -f "${BACKEND_DIR}/.env" ]]; then
    log_error "Backend/.env not found. Please create it from Backend/.env.example"
    exit 1
  fi

  # Check for OpenAI API key
  if grep -q "sk-your-api-key-here" "${AI_DIR}/.env" 2>/dev/null; then
    log_warning "AI/.env contains placeholder OpenAI API key. AI service may fail."
    log_warning "Please update OPENAI_API_KEY in AI/.env"
  fi

  log_success "Environment files present"
}

# Start PocketBase
start_pocketbase() {
  log_info "Starting PocketBase database on port ${PB_PORT}..."

  mkdir -p "${PB_DATA_DIR}"

  local PB_BIN="${PB_DIR}/pocketbase"

  if [[ ! -x "${PB_BIN}" ]]; then
    log_error "PocketBase binary not found at ${PB_BIN}"
    log_error "Please ensure PocketBase is installed in Backend/pocketbase/"
    exit 1
  fi

  (
    cd "${PB_DIR}"
    "${PB_BIN}" serve --http "127.0.0.1:${PB_PORT}" --dir "${PB_DATA_DIR}" > /tmp/pocketbase.log 2>&1
  ) &
  PB_PID=$!

  # Health check
  if check_health "http://127.0.0.1:${PB_PORT}/api/health" "PocketBase" 15 1; then
    log_success "PocketBase started (PID: ${PB_PID})"
  else
    log_error "PocketBase failed to start. Check /tmp/pocketbase.log"
    exit 1
  fi
}

# Start AI Service
start_ai_service() {
  log_info "Starting AI Service on port ${API_PORT}..."

  (
    cd "${AI_DIR}"
    uvicorn api.app:app --host 0.0.0.0 --port "${API_PORT}" > /tmp/ai-service.log 2>&1
  ) &
  API_PID=$!

  # Health check
  if check_health "http://127.0.0.1:${API_PORT}/health" "AI Service" 20 2; then
    log_success "AI Service started (PID: ${API_PID})"
  else
    log_error "AI Service failed to start. Check /tmp/ai-service.log"
    exit 1
  fi
}

# Start Backend
start_backend() {
  log_info "Starting Backend on port ${BACKEND_PORT}..."

  (
    cd "${BACKEND_DIR}"
    npm run dev > /tmp/backend.log 2>&1
  ) &
  BACKEND_PID=$!

  # Health check
  if check_health "http://127.0.0.1:${BACKEND_PORT}/api/health" "Backend" 20 2; then
    log_success "Backend started (PID: ${BACKEND_PID})"
  else
    log_error "Backend failed to start. Check /tmp/backend.log"
    exit 1
  fi
}

# Start Frontend
start_frontend() {
  log_info "Starting Frontend on port ${FRONTEND_PORT}..."

  (
    cd "${BACKEND_DIR}"
    ./node_modules/.bin/vite --port "${FRONTEND_PORT}" --host 127.0.0.1 > /tmp/frontend.log 2>&1
  ) &
  FRONTEND_PID=$!

  # Wait for Vite to start
  sleep 5

  # Health check
  if check_health "http://127.0.0.1:${FRONTEND_PORT}" "Frontend" 20 2; then
    log_success "Frontend started (PID: ${FRONTEND_PID})"
  else
    log_warning "Frontend may still be starting..."
  fi
}

# Monitor services
monitor_services() {
  log_info "Starting health monitoring (every 10 seconds)..."
  log_info "Press Ctrl+C to stop all services"
  echo ""

  while true; do
    sleep 10

    local all_healthy=true

    # Check PocketBase
    if ! curl -sf "http://127.0.0.1:${PB_PORT}/api/health" >/dev/null 2>&1; then
      log_error "PocketBase health check failed!"
      all_healthy=false
    fi

    # Check AI Service
    if ! curl -sf "http://127.0.0.1:${API_PORT}/health" >/dev/null 2>&1; then
      log_error "AI Service health check failed!"
      all_healthy=false
    fi

    # Check Backend
    if ! curl -sf "http://127.0.0.1:${BACKEND_PORT}/api/health" >/dev/null 2>&1; then
      log_error "Backend health check failed!"
      all_healthy=false
    fi

    # Check Frontend
    if ! curl -sf "http://127.0.0.1:${FRONTEND_PORT}" >/dev/null 2>&1; then
      log_warning "Frontend health check failed"
    fi

    if $all_healthy; then
      log_success "All services healthy [$(date '+%H:%M:%S')]"
    fi
  done
}

# Cleanup function
cleanup() {
  echo ""
  log_info "Stopping all services..."

  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "${FRONTEND_PID}" >/dev/null 2>&1 || true
    pkill -P "${FRONTEND_PID}" >/dev/null 2>&1 || true
  fi

  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "${BACKEND_PID}" >/dev/null 2>&1 || true
    pkill -P "${BACKEND_PID}" >/dev/null 2>&1 || true
  fi

  if [[ -n "${API_PID:-}" ]]; then
    kill "${API_PID}" >/dev/null 2>&1 || true
    pkill -P "${API_PID}" >/dev/null 2>&1 || true
  fi

  if [[ -n "${PB_PID:-}" ]]; then
    kill "${PB_PID}" >/dev/null 2>&1 || true
  fi

  sleep 2

  log_success "All services stopped"
  log_info "Logs available in /tmp/: pocketbase.log, ai-service.log, backend.log, frontend.log"
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Main execution
main() {
  echo ""
  log_info "=== AI Course Platform Launcher ==="
  echo ""

  check_prerequisites
  check_env_files

  echo ""
  log_info "=== Starting Services ==="
  echo ""

  start_pocketbase
  sleep 2

  start_ai_service
  sleep 2

  start_backend
  sleep 2

  start_frontend

  echo ""
  log_success "=== All Services Running ==="
  echo ""
  log_info "🎨 Frontend:    http://127.0.0.1:${FRONTEND_PORT}"
  log_info "🔧 Backend:     http://127.0.0.1:${BACKEND_PORT}/api/health"
  log_info "🤖 AI Service:  http://127.0.0.1:${API_PORT}/docs"
  log_info "💾 PocketBase:  http://127.0.0.1:${PB_PORT}/_/"
  echo ""

  monitor_services
}

# Run main
main
