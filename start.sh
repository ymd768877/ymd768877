#!/bin/bash
set -e

echo "======================================"
echo "  yasin666 Gaming Platform"
echo "======================================"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "[!] Node.js not found. Installing..."
  pkg install nodejs -y
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo "[!] pnpm not found. Installing..."
  npm install -g pnpm
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
  echo "[!] PostgreSQL not found. Installing..."
  pkg install postgresql -y
fi

# Install dependencies
echo "[1] Installing packages..."
pnpm install

# Start PostgreSQL if not running
echo "[2] Starting PostgreSQL..."
pg_ctl -D $PREFIX/var/lib/postgresql start 2>/dev/null || true
sleep 2

# Create database if not exists
psql -U $(whoami) -d postgres -c "CREATE DATABASE yasin666;" 2>/dev/null || true

# Set environment variables
export DATABASE_URL="postgresql://$(whoami)@localhost/yasin666"
export SESSION_SECRET="yasin666-super-secret-key-change-this"
export PORT_API=5000
export PORT_USER=3000
export PORT_ADMIN=3001

echo "[3] Running database migrations..."
pnpm --filter @workspace/db run push

echo "[4] Starting all services..."
echo ""

# Start API server
PORT=5000 pnpm --filter @workspace/api-server run dev &
API_PID=$!
echo "  API Server  → http://localhost:5000/api"

# Wait for API to be ready
sleep 3

# Start user site
PORT=3000 BASE_PATH="/" pnpm --filter @workspace/user-site run dev &
USER_PID=$!
echo "  User Site   → http://localhost:3000"

# Start admin panel
PORT=3001 BASE_PATH="/admin/" pnpm --filter @workspace/admin-panel run dev &
ADMIN_PID=$!
echo "  Admin Panel → http://localhost:3001/admin/"

echo ""
echo "======================================"
echo "  All services running!"
echo "  Admin login: admin / password"
echo "======================================"
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

# Wait and cleanup on exit
trap "echo 'Stopping...'; kill $API_PID $USER_PID $ADMIN_PID 2>/dev/null; pg_ctl -D $PREFIX/var/lib/postgresql stop 2>/dev/null; exit" INT TERM
wait
