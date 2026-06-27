#!/usr/bin/env bash
# ===========================================================
# Conexiaa - Automated Setup & Demo Launcher
# -----------------------------------------------------------
# Usage:  chmod +x setup.sh && ./setup.sh
#         (Run from the project root directory)
# ===========================================================

set -euo pipefail

# ─── Colours (Orange theme #FF6B00) ──────────────────────
ORANGE='\033[38;5;208m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
INFO="${GREEN}[INFO]${NC}"
WARN="${ORANGE}[WARN]${NC}"
ERR="${RED}[ERROR]${NC}"

# ─── Detect project root ────────────────────────────────
cd "$(dirname "$0")"
PROJECT_ROOT="$(pwd)"
echo -e "${ORANGE}🟠 Conexiaa Hackathon Setup – starting in ${PROJECT_ROOT}${NC}"

# ─── 1. Environment file ────────────────────────────────
if [ ! -f .env ]; then
  echo -e "${INFO} Creating .env from .env.example..."
  cp .env.example .env
else
  echo -e "${INFO} .env already exists; skipping creation."
fi

# ─── 2. System dependencies ─────────────────────────────
REQUIRED_PKGS="git curl build-essential python3.12 python3.12-venv python3.12-dev"
echo -e "${INFO} Checking system dependencies..."
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq $REQUIRED_PKGS
else
  echo -e "${WARN} apt-get not found; please install: $REQUIRED_PKGS manually."
fi

# ─── 3. Install Node.js & pnpm (if missing) ─────────────
if ! command -v pnpm >/dev/null 2>&1; then
  echo -e "${INFO} Installing pnpm..."
  curl -fsSL https://get.pnpm.io/install.sh | sh -
  export PNPM_HOME="$HOME/.local/share/pnpm"
  export PATH="$PNPM_HOME:$PATH"
fi

# ─── 4. Install Python package manager (uv) ─────────────
if ! command -v uv >/dev/null 2>&1; then
  echo -e "${INFO} Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.cargo/bin:$PATH"
fi

# ─── 5. Frontend dependencies ────────────────────────────
echo -e "${INFO} Installing frontend dependencies..."
pnpm install

# ─── 6. Backend dependencies ─────────────────────────────
echo -e "${INFO} Setting up Python virtual environment..."
uv venv .venv --python 3.12
source .venv/bin/activate
uv pip install -r backend/requirements.txt

# ─── 7. Demo data & ingestion ────────────────────────────
echo -e "${INFO} Generating demo data..."
python scripts/generate_demo_data.py

echo -e "${INFO} Running data ingestion (FAISS index)..."
python scripts/ingest_datasets.py

# ─── 8. (Optional) Docker services ───────────────────────
echo ""
echo -e "${ORANGE}🟠 Would you like to start PostgreSQL & Redis via Docker? [Y/n] ${NC}"
read -r answer
if [[ "${answer:-y}" =~ ^[Yy]$ ]]; then
  if command -v docker-compose >/dev/null 2>&1 || command -v docker >/dev/null 2>&1; then
    echo -e "${INFO} Starting docker-compose services..."
    docker-compose up -d postgres redis
  else
    echo -e "${WARN} Docker not found; skipping. Run backend with local DB or SQLite."
  fi
else
  echo -e "${INFO} Skipping Docker. Make sure your database is running manually."
fi

# ─── 9. Launch the application ───────────────────────────
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${ORANGE}🟠 Starting Conexiaa AI Bridge...${NC}"
echo -e "   Frontend → http://localhost:3000"
echo -e "   Backend  → http://localhost:8000/docs"
echo ""

# Start backend in background, then frontend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

sleep 2
pnpm dev &
FRONTEND_PID=$!

# Trap Ctrl+C to clean up both processes
trap "echo -e '${ORANGE}Shutting down...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
echo -e "${ORANGE}Press Ctrl+C to stop all services.${NC}"
wait