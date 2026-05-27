@echo off
REM Complete Interview Platform Setup and Run Script (Windows)

setlocal enabledelayedexpansion

echo ===============================================================
echo   Interview Practice Platform - Setup ^& Run (Windows)
echo ===============================================================
echo.

REM Check for Docker
echo Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not found. Please install Docker Desktop for Windows.
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Check for Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose not found. Please ensure Docker Desktop is fully installed.
    pause
    exit /b 1
)

echo [OK] Docker Compose is installed
echo.

REM Step 1: Create necessary directories
echo Step 1: Creating necessary directories...
if not exist "backend\logs" mkdir backend\logs
if not exist "backend\uploads\pdf" mkdir backend\uploads\pdf
if not exist "logs" mkdir logs
echo [OK] Directories created
echo.

REM Step 2: Start Docker containers
echo Step 2: Starting Docker containers...
echo   - MongoDB (port 27017)
echo   - Redis (port 6379)
echo   - Backend (port 5000)
echo   - Frontend (port 3000)
echo.

docker-compose up -d

REM Wait for services
echo Waiting 15 seconds for services to start...
timeout /t 15 /nobreak

REM Verify containers are running
echo.
echo Verifying containers...
docker ps --filter "name=nirmaan"

REM Step 3: Install backend dependencies if needed
echo.
echo Step 3: Installing backend dependencies...
cd backend
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
) else (
    echo Dependencies already installed
)
echo.

REM Step 4: Seed interview problems
echo Step 4: Seeding interview problems into database...
call node scripts\seed-interview-problems.js

if errorlevel 1 (
    echo [ERROR] Failed to seed problems. Please check MongoDB is running.
    cd ..
    pause
    exit /b 1
)

echo [OK] Interview problems seeded
cd ..
echo.

REM Step 5: Display summary
echo ===============================================================
echo   [SUCCESS] Interview Platform Setup Complete!
echo ===============================================================
echo.
echo AVAILABLE URLS:
echo   • Frontend:  http://localhost:3000
echo   • Backend:   http://localhost:5000  
echo   • MongoDB:   mongodb://admin:password@localhost:27017/nirmaan
echo   • Redis:     localhost:6379
echo.
echo QUICK START:
echo   1. Open http://localhost:3000 in your browser
echo   2. Navigate to Interview section
echo   3. Browse available problems
echo   4. Select a problem and start coding
echo   5. Use "Run" button to test with sample cases
echo   6. Use "Submit" button to test with all cases
echo.
echo SAMPLE PROBLEMS AVAILABLE:
echo   • Two Sum
echo   • Reverse String
echo   • Longest Substring Without Repeating Characters
echo   • Merge Sorted Array
echo.
echo USEFUL COMMANDS:
echo   • Stop all services:  docker-compose down
echo   • View backend logs:  docker-compose logs -f backend
echo   • View frontend logs: docker-compose logs -f frontend
echo   • View all containers: docker ps
echo.
echo SUPPORTED LANGUAGES:
echo   • Python 3.11
echo   • JavaScript (Node 18)
echo   • Java 17
echo   • C++ 12
echo   • C, Go, Rust (also supported)
echo.
echo ===============================================================

pause
