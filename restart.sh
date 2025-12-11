#!/bin/bash

echo "🛑 Stopping any running services..."

# Kill any processes on ports 3000 and 5173
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "🐳 Starting Docker containers..."
cd infra
docker-compose -f docker-compose.dev.yml down 2>/dev/null
docker-compose -f docker-compose.dev.yml up -d
cd ..

echo "⏳ Waiting for databases to initialize..."
sleep 5

echo "🚀 Starting Sarathi..."
pnpm dev:all

