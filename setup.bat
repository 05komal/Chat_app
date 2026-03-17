@echo off
REM Chat App Setup Script for Windows
REM This script automates the setup process for local development on Windows

setlocal enabledelayedexpansion

color 0B
cls

REM Colors using color codes
REM 0B = Black background, Bright Cyan text

echo.
echo ======================================
echo.
echo      Chat App Setup for Windows
echo.
echo ======================================
echo.

REM Check for Node.js
echo Checking prerequisites...
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    color 0B
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js is installed: %NODE_VERSION%

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] npm is not installed
    color 0B
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm is installed: %NPM_VERSION%

git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Git is installed
) else (
    echo [WARNING] Git is not installed ^(optional^)
)

docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Docker is installed
) else (
    echo [WARNING] Docker is not installed ^(optional^)
)

mongod --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MongoDB is installed
    set MONGODB_LOCAL=1
) else (
    echo [WARNING] MongoDB is not installed locally
    set MONGODB_LOCAL=0
)

echo.
echo ======================================
echo Setting up Backend
echo ======================================
echo.

if not exist "server" (
    color 0C
    echo [ERROR] server directory not found
    color 0B
    pause
    exit /b 1
)

cd server

if not exist "package.json" (
    color 0C
    echo [ERROR] package.json not found in server directory
    color 0B
    pause
    exit /b 1
)

echo Installing backend dependencies...
call npm install

if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Failed to install backend dependencies
    color 0B
    pause
    exit /b 1
)

echo [OK] Backend dependencies installed

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env >nul
    echo [OK] .env file created
    echo.
    echo Please edit server\.env and update these values:
    echo   - MONGODB_URI ^(if using remote MongoDB^)
    echo   - JWT_SECRET ^(change to a random value^)
    echo   - CLIENT_URL ^(if frontend is on different port^)
) else (
    echo [WARNING] .env file already exists, skipping creation
)

cd ..

echo.
echo ======================================
echo Setting up Frontend
echo ======================================
echo.

if not exist "client" (
    color 0C
    echo [ERROR] client directory not found
    color 0B
    pause
    exit /b 1
)

cd client

if not exist "package.json" (
    color 0C
    echo [ERROR] package.json not found in client directory
    color 0B
    pause
    exit /b 1
)

echo Installing frontend dependencies...
call npm install

if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Failed to install frontend dependencies
    color 0B
    pause
    exit /b 1
)

echo [OK] Frontend dependencies installed

cd ..

echo.
echo ======================================
echo Database Setup
echo ======================================
echo.

if %MONGODB_LOCAL% equ 1 (
    echo [OK] MongoDB is installed locally
    echo Make sure MongoDB is running: mongod
) else (
    echo [WARNING] MongoDB is not installed locally
    echo.
    echo Options:
    echo   1. Install MongoDB locally from https://www.mongodb.com/docs/manual/installation/
    echo   2. Use MongoDB Atlas ^(free^): https://www.mongodb.com/atlas
    echo.
    echo If using MongoDB Atlas:
    echo   1. Create a free account at https://www.mongodb.com/atlas
    echo   2. Create a cluster
    echo   3. Get the connection string
    echo   4. Update MONGODB_URI in server\.env
)

echo.
echo ======================================
color 0A
echo [SUCCESS] Setup Complete
color 0B
echo ======================================
echo.

echo Next steps:
echo.
echo 1. Start MongoDB ^(if using local^):
echo    mongod
echo.
echo 2. Start Backend ^(in another terminal^):
echo    cd server
echo    npm run dev
echo.
echo 3. Start Frontend ^(in another terminal^):
echo    cd client
echo    python -m http.server 3000
echo    or: npx http-server public -p 3000
echo.
echo 4. Open in Browser:
echo    http://localhost:3000
echo.
echo.
echo Using Docker?
echo.
echo Install Docker Desktop and run:
echo    docker-compose up
echo.
echo.
echo Useful Commands:
echo.
echo Backend:
echo   cd server ^&^& npm run dev       - Start development server
echo   cd server ^&^& npm test         - Run tests
echo   cd server ^&^& npm run lint     - Run linter
echo.
echo Frontend:
echo   cd client ^&^& python -m http.server 3000  - Start dev server
echo.
echo Docker:
echo   docker-compose up          - Start all services
echo   docker-compose down        - Stop all services
echo   docker-compose logs        - View logs
echo.
echo.
echo Documentation:
echo.
echo   README.md           - Complete documentation
echo   QUICKSTART.md       - Quick setup guide
echo   DEPLOYMENT.md       - Deployment guide
echo   TESTING.md          - Testing guide
echo.

color 0A
echo Happy coding! 
echo.
color 0B

pause
