@echo off
REM =============================================================================
REM Vibe Stack - Docker Cleanup Script (Windows)
REM =============================================================================
REM Stops all services and removes old Docker images to free up disk space
REM Run: scripts\setup\cleanup.bat
REM =============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   Vibe Stack - Docker Cleanup
echo ============================================================
echo.
echo This script will:
echo   1. Stop all Vibe Stack services
echo   2. Remove old Docker images (frees disk space)
echo   3. Clean up dangling images and build cache
echo.
echo [!] This will NOT delete your data (volumes are preserved)
echo.

set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo Cancelled.
    exit /b 0
)

cls

echo ============================================================
echo   Current State
echo ============================================================
echo.

REM Get container count
set containers=0
for /f %%i in ('docker compose ps -q 2^>nul') do set /a containers+=1

echo Running containers: %containers%
echo.

REM =============================================================================
REM STEP 1: Stop Services
REM =============================================================================
echo.
echo [1/4] Stopping All Services
echo.
echo Stopping containers...
docker compose down --remove-orphans 2>nul
echo [OK] All services stopped
echo.

REM =============================================================================
REM STEP 2: Remove Old Images
REM =============================================================================
echo [2/4] Removing Old Docker Images
echo.

echo Removing old Vibe Stack images...
for /f "tokens=*" %%i in ('docker images --format "{{.Repository}}:{{.Tag}}" ^| findstr /i "vibe-stack"') do (
    echo   Removing: %%i
    docker rmi %%i 2>nul
)

echo.
echo [OK] Old images removed
echo.

REM =============================================================================
REM STEP 3: Clean Dangling Images
REM =============================================================================
echo [3/4] Cleaning Dangling Images
echo.

echo Removing dangling images...
docker image prune -f >nul 2>&1

echo [OK] Dangling images removed
echo.

REM =============================================================================
REM STEP 4: Clean Build Cache
REM =============================================================================
echo [4/4] Cleaning Build Cache
echo.

echo Removing build cache...
docker builder prune -f >nul 2>&1

echo [OK] Build cache cleaned
echo.

REM =============================================================================
REM SUMMARY
REM =============================================================================
cls
echo.
echo ============================================================
echo   Cleanup Complete!
echo ============================================================
echo.
echo Services stopped and old images removed.
echo.
echo To start services again:
echo   make up
echo   or
echo   scripts\setup\install.bat
echo.
echo [!] Note: All data is preserved in volumes.
echo          Only images and containers were removed.
echo.
