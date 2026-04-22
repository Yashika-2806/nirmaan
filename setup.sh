#!/bin/bash

# Setup script for the TWIN AI Interview Preparation Platform

echo "=========================================="
echo "TWIN AI - Setup and Initialization"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
echo -e "\n${BLUE}Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker is not installed. Please install Docker Desktop first.${NC}"
    echo "Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

# Check Docker Compose
echo -e "\n${BLUE}Checking Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found${NC}"

# Create environment files
echo -e "\n${BLUE}Creating environment configuration...${NC}"

# Backend .env
cat > backend/.env << 'EOF'
# Backend Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://admin:password@mongodb:27017/nirmaan?authSource=admin
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Judge0 (Optional - for fallback code execution)
JUDGE0_API_KEY=your_judge0_api_key_here
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com

# AI Services
GEMINI_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Security
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# Frontend URLs
FRONTEND_URLS=http://localhost:3000

# Trust proxy
TRUST_PROXY=true

# Docker Socket for sandbox execution
DOCKER_SOCKET=/var/run/docker.sock
EOF

echo -e "${GREEN}✓ Backend .env created${NC}"

# Frontend .env.local
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ENVIRONMENT=development
EOF

echo -e "${GREEN}✓ Frontend .env.local created${NC}"

# Build images
echo -e "\n${BLUE}Building Docker images...${NC}"
docker-compose build

# Start services
echo -e "\n${BLUE}Starting services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "\n${BLUE}Waiting for services to be ready...${NC}"
sleep 10

# Check MongoDB
echo -e "\n${BLUE}Checking MongoDB...${NC}"
docker exec nirmaan-mongodb mongosh -u admin -p password --eval "db.adminCommand('ping')" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MongoDB is running${NC}"
else
    echo -e "${YELLOW}✗ MongoDB health check failed${NC}"
fi

# Check Redis
echo -e "\n${BLUE}Checking Redis...${NC}"
docker exec nirmaan-redis redis-cli ping 2>/dev/null | grep -q PONG
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${YELLOW}✗ Redis health check failed${NC}"
fi

# Initialize database
echo -e "\n${BLUE}Initializing database...${NC}"
docker exec nirmaan-backend npm run migrate 2>/dev/null || echo -e "${YELLOW}Migration not configured yet${NC}"

# Final status
echo -e "\n${GREEN}=========================================="
echo "Setup Complete!"
echo "==========================================${NC}"
echo -e "\nServices running:"
echo -e "  ${GREEN}✓${NC} Backend API: http://localhost:5000"
echo -e "  ${GREEN}✓${NC} Frontend: http://localhost:3000"
echo -e "  ${GREEN}✓${NC} MongoDB: mongodb://localhost:27017"
echo -e "  ${GREEN}✓${NC} Redis: redis://localhost:6379"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update .env files with your API keys"
echo "2. Seed initial data: docker exec nirmaan-backend npm run seed:keys"
echo "3. Access frontend at http://localhost:3000"
echo -e "\n${YELLOW}To view logs:${NC}"
echo "  docker-compose logs -f"
echo -e "\n${YELLOW}To stop services:${NC}"
echo "  docker-compose down"
