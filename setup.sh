#!/bin/bash
# Setup script for Portal de Nómina

set -e

echo "🚀 Portal de Nómina - Setup"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
echo "✅ Prerequisites OK"
echo ""

# Environment
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Remember to update .env with your credentials!"
fi

# Start infrastructure
echo "🐳 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "📦 Installing worker dependencies..."
cd worker && npm install && cd ..

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env with your credentials"
echo "  2. Run backend: cd backend && npm run start:dev"
echo "  3. Run worker: cd worker && npm run start:dev"
echo "  4. Run frontend: cd frontend && npm run dev"
echo ""
echo "Or use Docker:"
echo "  docker-compose up -d"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo "  API Docs: http://localhost:3000/api/docs"
echo ""
