@echo off
REM Vibe Stack Setup Script for Windows
REM This script sets up the environment for first-time use

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   Vibe Stack Setup Script (Windows)
echo ============================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [1/6] Docker found:
docker --version
echo.

REM Check if Docker Compose is available
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose is not available
    echo Please ensure Docker Desktop is running
    pause
    exit /b 1
)

echo [2/6] Docker Compose found:
docker compose version
echo.

REM Create necessary directories
echo [3/6] Creating directories...
if not exist "config\state" mkdir "config\state"
if not exist "repos" mkdir "repos"
if not exist "secrets" mkdir "secrets"
if not exist "agents\claude" mkdir "agents\claude"
if not exist "logs" mkdir "logs"
echo Directories created successfully.
echo.

REM Copy example configuration if .env doesn't exist
echo [4/6] Setting up environment configuration...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo Created .env from .env.example
    ) else (
        echo WARNING: .env.example not found
    )
) else (
    echo .env already exists, skipping...
)
echo.

REM Generate random password for code-server if not set
echo [5/6] Generating secure password...
powershell -Command "$password = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 20 | % {[char]$_}); Add-Content -Path .env -Value \"CODE_SERVER_PASSWORD=$password\" -Force" >nul 2>&1
echo Secure password generated.
echo.

REM Create initial state file
echo [6/6] Creating initial state...
if not exist "config\state\.vibe-state.json" (
    if exist "config\state\.vibe-state.json.example" (
        copy "config\state\.vibe-state.json.example" "config\state\.vibe-state.json" >nul
        echo Created state configuration
    )
) else (
    echo State configuration already exists
)
echo.

REM Start services
echo.
echo ============================================
echo   Starting Vibe Stack Services
echo ============================================
echo.

docker compose up -d

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start services
    echo Please check Docker Desktop is running
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Vibe Stack is now running. Access the services:
echo.
echo   - Vibe-Kanban:    http://localhost:4000
echo   - Open WebUI:     http://localhost:8081
echo   - code-server:    http://localhost:8443
echo   - MCP Server:     http://localhost:4001
echo.
echo Your code-server password has been set in .env
echo.
echo To stop services:    docker compose down
echo To view logs:        docker compose logs -f
echo To restart services: docker compose restart
echo.

pause
