#!/bin/bash
# Complete Interview Platform Setup and Run Script

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  Interview Practice Platform - Setup & Run"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check for Docker
echo "✓ Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "✗ Docker not found. Please install Docker Desktop."
    exit 1
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "✗ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo "✓ Docker and Docker Compose are installed"
echo ""

# Step 1: Start Docker containers
echo "Step 1: Starting Docker containers (MongoDB, Redis, Backend, Frontend)..."
cd "$(dirname "$0")"

# Create necessary directories
mkdir -p backend/logs backend/uploads/pdf logs

# Start containers
docker-compose up -d

echo "✓ Docker containers started"
echo "  - MongoDB: mongodb://admin:password@localhost:27017"
echo "  - Redis: localhost:6379"
echo "  - Backend: http://localhost:5000"
echo "  - Frontend: http://localhost:3000"
echo ""

# Wait for services to be ready
echo "Step 2: Waiting for services to be ready..."
sleep 10

# Step 3: Seed interview problems
echo "Step 3: Seeding interview problems into database..."
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Run seed script
node scripts/seed-interview-problems.js

echo "✓ Interview problems seeded successfully"
echo ""

# Step 4: Display summary
echo "═══════════════════════════════════════════════════════════════"
echo "  🎉 Interview Platform Setup Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📝 Available URLs:"
echo "  • Frontend:  http://localhost:3000"
echo "  • Backend:   http://localhost:5000"
echo "  • MongoDB:   mongodb://admin:password@localhost:27017/nirmaan"
echo "  • Redis:     localhost:6379"
echo ""
echo "🚀 Quick Start:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Navigate to Interview → Browse Problems"
echo "  3. Select a problem and start coding"
echo "  4. Click 'Run' to test against sample cases"
echo "  5. Click 'Submit' to test against all cases"
echo ""
echo "📚 Sample Problems Loaded:"
echo "  • Two Sum"
echo "  • Reverse String"
echo "  • Longest Substring Without Repeating Characters"
echo "  • Merge Sorted Array"
echo ""
echo "🔧 Docker Containers:"
docker ps --filter "label=com.docker.compose.project" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "💡 To stop all services: docker-compose down"
echo "💡 To view logs: docker-compose logs -f [service-name]"
echo "═══════════════════════════════════════════════════════════════"
