#!/bin/bash

# Script to clear all Docker and build caches for leema_react project
# Author: Claude Code
# Description: Complete cache cleanup for development environment

set -e

echo "🧹 Starting complete cache cleanup for leema_react..."
echo ""

# Navigate to project directory
cd /var/www/leema_react

# 1. Stop and remove containers
echo "1️⃣  Stopping and removing containers..."
docker-compose down 2>/dev/null || true
echo "   ✅ Containers stopped"

# 2. Remove Docker images
echo ""
echo "2️⃣  Removing Docker images..."
docker images | grep leema_react | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
echo "   ✅ Project images removed"

# 3. Clean dangling images
echo ""
echo "3️⃣  Cleaning dangling images..."
docker image prune -f
echo "   ✅ Dangling images cleaned"

# 4. Clean build cache
echo ""
echo "4️⃣  Cleaning Docker build cache..."
docker builder prune -f
echo "   ✅ Build cache cleaned"

# 5. Remove dist directory
echo ""
echo "5️⃣  Removing dist directory..."
rm -rf dist/
echo "   ✅ dist/ removed"

# 6. Remove node_modules/.vite cache
echo ""
echo "6️⃣  Cleaning Vite cache..."
rm -rf node_modules/.vite
echo "   ✅ Vite cache removed"

# 7. Optional: Remove all volumes (uncomment if needed)
# echo ""
# echo "7️⃣  Removing Docker volumes..."
# docker volume prune -f
# echo "   ✅ Volumes cleaned"

echo ""
echo "✨ Cache cleanup completed!"
echo ""
echo "📝 Summary:"
echo "   - Docker containers: stopped and removed"
echo "   - Docker images: removed"
echo "   - Dangling images: cleaned"
echo "   - Build cache: pruned"
echo "   - dist/: removed"
echo "   - Vite cache: removed"
echo ""
echo "🚀 You can now rebuild with:"
echo "   docker-compose up -d --build"
