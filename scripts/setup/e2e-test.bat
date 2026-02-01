@echo off
REM =============================================================================
REM Vibe Stack - End-to-End Test (Windows)
REM =============================================================================
REM Tests all services are working correctly
REM Run: scripts\setup\e2e-test.bat
REM =============================================================================

setlocal enabledelayedexpansion

set TESTS_PASSED=0
set TESTS_FAILED=0

echo.
echo ============================================================
echo   Vibe Stack - End-to-End Test
echo ============================================================
echo.

REM Test 1: Container Health
echo ------------------------------------------------------------
echo Test 1: Container Health
echo ------------------------------------------------------------

for %%C in (vibe-postgres vibe-mcp-server code-server open-webui vibe-kanban) do (
    set CONTAINER_NAME=%%C
    docker compose ps %%C >nul 2>&1
    if not errorlevel 1 (
        echo [OK] %%C is running
        set /a TESTS_PASSED+=1
    ) else (
        echo [FAIL] %%C is not running
        set /a TESTS_FAILED+=1
    )
)

echo.

REM Test 2: HTTP Endpoints
echo ------------------------------------------------------------
echo Test 2: HTTP Endpoints
echo ------------------------------------------------------------

curl -s -o nul -w "Vibe-Kanban: %%{http_code}\n" http://localhost:4000/ >nul 2>&1
if not errorlevel 1 (
    echo [OK] Vibe-Kanban is responding
    set /a TESTS_PASSED+=1
) else (
    echo [FAIL] Vibe-Kanban is not responding
    set /a TESTS_FAILED+=1
)

curl -s -o nul -w "MCP Server: %%{http_code}\n" http://localhost:4001/health >nul 2>&1
if not errorlevel 1 (
    echo [OK] MCP Server is responding
    set /a TESTS_PASSED+=1
) else (
    echo [FAIL] MCP Server is not responding
    set /a TESTS_FAILED+=1
)

curl -s -o nul -w "Open WebUI: %%{http_code}\n" http://localhost:8081/ >nul 2>&1
if not errorlevel 1 (
    echo [OK] Open WebUI is responding
    set /a TESTS_PASSED+=1
) else (
    echo [FAIL] Open WebUI is not responding
    set /a TESTS_FAILED+=1
)

curl -s -o nul -w "code-server: %%{http_code}\n" http://localhost:8443/ >nul 2>&1
if not errorlevel 1 (
    echo [OK] code-server is responding
    set /a TESTS_PASSED+=1
) else (
    echo [FAIL] code-server is not responding
    set /a TESTS_FAILED+=1
)

echo.

REM Summary
echo ------------------------------------------------------------
echo Test Summary
echo ------------------------------------------------------------
set /a TOTAL_TESTS=TESTS_PASSED+TESTS_FAILED
echo Total Tests: %TOTAL_TESTS%
echo Passed: %TESTS_PASSED%
echo Failed: %TESTS_FAILED%
echo.

if %TESTS_FAILED%==0 (
    echo ============================================================
    echo   ALL TESTS PASSED!
    echo ============================================================
    echo.
    echo Open your browser and try:
    echo   - Vibe-Kanban:  http://localhost:4000
    echo   - Open WebUI:   http://localhost:8081
    echo   - code-server:  http://localhost:8443
    echo.
) else (
    echo ============================================================
    echo   SOME TESTS FAILED
    echo ============================================================
    echo.
    echo Run 'docker compose logs' to see what went wrong
    echo.
    exit /b 1
)
