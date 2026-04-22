@echo off
REM Setup script for TWIN AI Interview Preparation Platform (Windows)

echo ==========================================
echo TWIN AI - Setup and Initialization
echo ==========================================

REM Check Docker
echo.
echo Checking Docker installation...
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker is not installed. Please install Docker Desktop first.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo √ Docker found

REM Check Docker Compose
echo.
echo Checking Docker Compose...
where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker Compose is not installed.
    pause
    exit /b 1
)
echo √ Docker Compose found

REM Create environment files
echo.
echo Creating environment configuration...

REM Backend .env
(
echo # Backend Configuration
echo NODE_ENV=production
echo PORT=5000
echo.
echo # Database
echo MONGODB_URI=mongodb://admin:password@mongodb:27017/nirmaan?authSource=admin
echo MONGO_INITDB_ROOT_USERNAME=admin
echo MONGO_INITDB_ROOT_PASSWORD=password
echo.
echo # Redis
echo REDIS_HOST=redis
echo REDIS_PORT=6379
echo.
echo # Judge0 (Optional^)
echo JUDGE0_API_KEY=your_judge0_api_key_here
echo JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
echo JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com
echo.
echo # AI Services
echo GEMINI_API_KEY=your_gemini_api_key_here
echo ANTHROPIC_API_KEY=your_anthropic_api_key_here
echo.
echo # Security
echo JWT_SECRET=your_jwt_secret_key_change_this_in_production
echo JWT_EXPIRE=7d
echo.
echo # Frontend URLs
echo FRONTEND_URLS=http://localhost:3000
echo.
echo # Trust proxy
echo TRUST_PROXY=true
echo.
echo # Docker Socket
echo DOCKER_SOCKET=/var/run/docker.sock
) > backend\.env

echo √ Backend .env created

REM Frontend .env.local
(
echo NEXT_PUBLIC_API_URL=http://localhost:5000/api
echo NEXT_PUBLIC_ENVIRONMENT=development
) > frontend\.env.local

echo √ Frontend .env.local created

REM Build images
echo.
echo Building Docker images...
docker-compose build
if %errorlevel% neq 0 (
    echo Build failed. Check Docker installation.
    pause
    exit /b 1
)

REM Start services
echo.
echo Starting services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo Failed to start services.
    pause
    exit /b 1
)

REM Wait for services
echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak

REM Final status
echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Services running:
echo   √ Backend API: http://localhost:5000
echo   √ Frontend: http://localhost:3000
echo   √ MongoDB: mongodb://localhost:27017
echo   √ Redis: redis://localhost:6379
echo.
echo Next steps:
echo 1. Update .env files with your API keys
echo 2. Seed initial data: docker exec nirmaan-backend npm run seed:keys
echo 3. Access frontend at http://localhost:3000
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
echo To stop services:
echo   docker-compose down
echo.
pause
