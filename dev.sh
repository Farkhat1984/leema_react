#!/bin/bash
# Development mode with hot-reload

set -e

echo "🔥 Starting Development Environment with Hot-Reload..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /var/www/leema_react

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env 2>/dev/null || echo "No .env.example found"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
fi

# Start dev server with docker-compose
echo -e "${BLUE}🚀 Starting Vite dev server with hot-reload...${NC}"
docker-compose -f docker-compose.dev.yml up -d --build

echo ""
echo -e "${GREEN}✅ Development server started!${NC}"
echo -e "${GREEN}📍 Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}📍 Backend:  http://localhost:8000${NC}"
echo ""
echo -e "${BLUE}💡 Changes in /src will auto-reload in browser${NC}"
echo -e "${BLUE}💡 To view logs: docker-compose -f docker-compose.dev.yml logs -f frontend-dev${NC}"
echo -e "${BLUE}💡 To stop: docker-compose -f docker-compose.dev.yml down${NC}"
echo ""
