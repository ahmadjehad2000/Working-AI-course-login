#!/usr/bin/env bash
set -e

echo "=== Installing AI Course Platform Dependencies ==="
echo ""

# AI dependencies
echo "[1/2] Installing AI Service dependencies (Python)..."
cd AI
pip install -r Requirements.txt
cd ..
echo "✓ AI dependencies installed"
echo ""

# Backend + Frontend dependencies (monorepo)
echo "[2/2] Installing Backend + Frontend dependencies (Node.js monorepo)..."
cd Backend
npm install --legacy-peer-deps
cd ..
echo "✓ Backend + Frontend dependencies installed"
echo ""

echo "=== All dependencies installed successfully! ==="
echo ""
echo "Next steps:"
echo "1. Configure AI/.env with your OpenAI API key"
echo "2. Run ./run_full.sh to start all services"
echo ""
echo "Note: This project uses a monorepo structure."
echo "Frontend code is in FrontEnd/client but dependencies are installed via Backend package.json"
