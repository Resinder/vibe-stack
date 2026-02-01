@echo off
REM =============================================================================
REM Vibe Stack - One-Command Install (Windows)
REM =============================================================================
REM Run: scripts\setup\install.bat
REM =============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   Vibe Stack - One-Command Install
echo ============================================================
echo.

REM Step 1: Check Docker
echo [1/4] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [X] Docker not found
    echo Install Docker from: https://www.docker.com/get-started
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [X] Docker daemon not running
    echo Please start Docker Desktop and try again
    exit /b 1
)
echo [OK] Docker OK

REM Step 2: Create .env if missing
echo [2/4] Setting up configuration...
if not exist .env (
    copy .env.example .env >nul

    REM Generate random passwords (simple method for Windows)
    set CODE_PASS=%RANDOM%-%RANDOM%-%RANDOM%-%RANDOM%
    set POSTGRES_PASS=%RANDOM%-%RANDOM%-%RANDOM%-%RANDOM%
    set GRAFANA_PASS=%RANDOM%-%RANDOM%-%RANDOM%-%RANDOM%
    set ENCRYPTION_KEY=%RANDOM%-%RANDOM%-%RANDOM%-%RANDOM%-%RANDOM%-%RANDOM%

    REM Update .env with generated passwords (PowerShell)
    powershell -Command "(gc .env) -replace 'CODE_SERVER_PASSWORD=.*', 'CODE_SERVER_PASSWORD=%CODE_PASS%' | Out-File -encoding ASCII .env"
    powershell -Command "(gc .env) -replace 'POSTGRES_PASSWORD=.*', 'POSTGRES_PASSWORD=%POSTGRES_PASS%' | Out-File -encoding ASCII .env"
    powershell -Command "(gc .env) -replace 'GRAFANA_ADMIN_PASSWORD=.*', 'GRAFANA_ADMIN_PASSWORD=%GRAFANA_PASS%' | Out-File -encoding ASCII .env"
    powershell -Command "(gc .env) -replace 'CREDENTIAL_ENCRYPTION_KEY=.*', 'CREDENTIAL_ENCRYPTION_KEY=%ENCRYPTION_KEY%' | Out-File -encoding ASCII .env"

    echo [OK] Created .env with secure passwords
    echo [!] Passwords saved to .env - keep it safe!
) else (
    echo [OK] .env already exists
)

REM Step 3: Start services
echo [3/4] Starting services...
docker compose up -d --build

REM Step 4: Wait
echo [4/4] Waiting for services...
timeout /t 10 /nobreak >nul

REM Done
echo.
echo ============================================================
echo   Installation Complete!
echo ============================================================
echo.
echo Service URLs:
echo   - Vibe-Kanban:  http://localhost:4000
echo   - Open WebUI:   http://localhost:8081
echo   - code-server:  http://localhost:8443
echo   - MCP Server:   http://localhost:4001
echo.
echo Next steps:
echo   1. Open Open WebUI: http://localhost:8081
echo   2. Create an account
echo   3. Add your AI API key (Settings -^> Providers)
echo.
echo [OK] All services are running!
echo.
