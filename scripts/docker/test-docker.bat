@echo off
REM =============================================================================
REM Vibe Stack - Docker Infrastructure Test Script (Windows)
REM =============================================================================
REM
REM This script tests the Docker infrastructure on Windows:
REM - Validates Docker Compose files
REM - Verifies all Docker images exist
REM - Tests MCP Server Dockerfile build
REM - Generates a test report
REM
REM Usage: test-docker.bat [options]
REM   --verbose     Show detailed output
REM   --no-pull     Skip pulling images
REM   --help        Show this help message
REM
REM =============================================================================

setlocal enabledelayedexpansion

REM Configuration
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\..\"
set "COMPOSE_FILE1=%PROJECT_ROOT%docker-compose.yml"
set "COMPOSE_FILE2=%PROJECT_ROOT%docker-compose.monitoring.yml"
set "MCP_SERVER_DIR=%PROJECT_ROOT%mcp-server"
set "TEST_REPORT=%PROJECT_ROOT%docker-test-report.txt"

REM Options
set "VERBOSE=false"
set "NO_PULL=false"

REM Test counters
set "TESTS_PASSED=0"
set "TESTS_FAILED=0"
set "TESTS_TOTAL=0"

REM Parse arguments
:parse_args
if "%~1"=="--verbose" (
    set "VERBOSE=true"
    shift
    goto parse_args
)
if "%~1"=="--no-pull" (
    set "NO_PULL=true"
    shift
    goto parse_args
)
if "%~1"=="--help" (
    goto show_help
)
if "%~1"=="-h" (
    goto show_help
)

REM =============================================================================
REM Helper Functions
REM =============================================================================

:log_info
echo [INFO] %~1
goto :eof

:log_success
echo [PASS] %~1
set /a "TESTS_PASSED+=1"
set /a "TESTS_TOTAL+=1"
goto :eof

:log_error
echo [FAIL] %~1
set /a "TESTS_FAILED+=1"
set /a "TESTS_TOTAL+=1"
goto :eof

:log_warning
echo [WARN] %~1
goto :eof

:print_header
echo.
echo ==================================================================
echo   %~1
echo ==================================================================
echo.
goto :eof

:show_help
echo Usage: test-docker.bat [options]
echo.
echo Test Docker infrastructure for Vibe Stack.
echo.
echo Options:
echo   --verbose     Show detailed output
echo   --no-pull     Skip pulling images
echo   --help        Show this help message
echo.
exit /b 0

REM =============================================================================
REM Test Functions
REM =============================================================================

:test_docker_available
call :print_header "Test 1: Docker Availability"

docker --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('docker --version') do set "DOCKER_VERSION=%%i"
    call :log_success "Docker is installed"
) else (
    call :log_error "Docker is not installed"
    goto :eof
)

docker compose version >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Docker Compose is available"
) else (
    docker-compose --version >nul 2>&1
    if %errorlevel% equ 0 (
        call :log_success "Docker Compose is available"
    ) else (
        call :log_error "Docker Compose is not installed"
    )
)
goto :eof

:test_compose_files_exist
call :print_header "Test 2: Compose Files Existence"

if exist "%COMPOSE_FILE1%" (
    call :log_success "Found: docker-compose.yml"
) else (
    call :log_error "Missing: docker-compose.yml"
)

if exist "%COMPOSE_FILE2%" (
    call :log_success "Found: docker-compose.monitoring.yml"
) else (
    call :log_error "Missing: docker-compose.monitoring.yml"
)
goto :eof

:test_compose_syntax
call :print_header "Test 3: Compose Files Syntax"

call :log_info "Validating: docker-compose.yml"
docker compose -f "%COMPOSE_FILE1%" config >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Valid syntax: docker-compose.yml"
) else (
    call :log_error "Invalid syntax: docker-compose.yml"
)

if exist "%COMPOSE_FILE2%" (
    call :log_info "Validating: docker-compose.monitoring.yml"
    docker compose -f "%COMPOSE_FILE2%" config >nul 2>&1
    if %errorlevel% equ 0 (
        call :log_success "Valid syntax: docker-compose.monitoring.yml"
    ) else (
        call :log_error "Invalid syntax: docker-compose.monitoring.yml"
    )
)
goto :eof

:test_pinned_versions
call :print_header "Test 4: Docker Image Version Pinning"

findstr /C:":latest" "%COMPOSE_FILE1%" >nul 2>&1
if %errorlevel% equ 0 (
    call :log_error "Found unpinned :latest tags in docker-compose.yml"
) else (
    call :log_success "All images pinned in docker-compose.yml"
)

if exist "%COMPOSE_FILE2%" (
    findstr /C:":latest" "%COMPOSE_FILE2%" >nul 2>&1
    if %errorlevel% equ 0 (
        call :log_error "Found unpinned :latest tags in docker-compose.monitoring.yml"
    ) else (
        call :log_success "All images pinned in docker-compose.monitoring.yml"
    )
)
goto :eof

:test_docker_images_exist
call :print_header "Test 5: Docker Images Availability"

call :log_info "Checking: node:20.18.0-slim"
if "%NO_PULL%"=="false" (
    docker pull node:20.18.0-slim >nul 2>&1
    if %errorlevel% equ 0 (
        call :log_success "Image available: node:20.18.0-slim"
    ) else (
        call :log_error "Image not available: node:20.18.0-slim"
    )
) else (
    call :log_warning "Skipped pull for node:20.18.0-slim"
)

call :log_info "Checking: postgres:16.8-alpine"
if "%NO_PULL%"=="false" (
    docker pull postgres:16.8-alpine >nul 2>&1
    if %errorlevel% equ 0 (
        call :log_success "Image available: postgres:16.8-alpine"
    ) else (
        call :log_error "Image not available: postgres:16.8-alpine"
    )
) else (
    call :log_warning "Skipped pull for postgres:16.8-alpine"
)

call :log_info "Checking: lscr.io/linuxserver/code-server:4.24.1"
if "%NO_PULL%"=="false" (
    docker pull lscr.io/linuxserver/code-server:4.24.1 >nul 2>&1
    if %errorlevel% equ 0 (
        call :log_success "Image available: code-server:4.24.1"
    ) else (
        call :log_error "Image not available: code-server:4.24.1"
    )
) else (
    call :log_warning "Skipped pull for code-server:4.24.1"
)
goto :eof

:test_version_sync
call :print_header "Test 6: Version Sync with version.json"

set "VERSION_JSON=%PROJECT_ROOT%version.json"

if not exist "%VERSION_JSON%" (
    call :log_error "version.json not found"
    goto :eof
)

REM Check if version.json contains docker image versions
findstr /C:"\"tag\":" "%VERSION_JSON%" >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "version.json contains Docker image versions"
) else (
    call :log_warning "version.json missing Docker image version info"
)
goto :eof

:test_mcp_dockerfile
call :print_header "Test 7: MCP Server Dockerfile"

set "DOCKERFILE=%MCP_SERVER_DIR%Dockerfile"

if not exist "%DOCKERFILE%" (
    call :log_warning "MCP Server Dockerfile not found (skipped)"
    goto :eof
)

REM Check for multi-stage build
findstr /C:"AS " "%DOCKERFILE%" >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Multi-stage build detected"
) else (
    call :log_warning "Multi-stage build not found"
)

REM Check for non-root user
findstr /C:"USER" "%DOCKERFILE%" >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Non-root user configured"
) else (
    call :log_warning "Non-root user not found"
)

REM Check for health check
findstr /C:"HEALTHCHECK" "%DOCKERFILE%" >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Health check configured"
) else (
    call :log_warning "Health check not found"
)

REM Check for .dockerignore
if exist "%MCP_SERVER_DIR%\.dockerignore" (
    call :log_success ".dockerignore exists"
) else (
    call :log_warning ".dockerignore not found"
)
goto :eof

:test_mcp_build
call :print_header "Test 8: MCP Server Build Test"

set "DOCKERFILE=%MCP_SERVER_DIR%Dockerfile"

if not exist "%DOCKERFILE%" (
    call :log_warning "MCP Server Dockerfile not found (skipped)"
    goto :eof
)

call :log_info "Building MCP Server image..."
docker build -t vibe-mcp-server:test -f "%DOCKERFILE%" "%MCP_SERVER_DIR%" >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "MCP Server image built successfully"

    REM Clean up
    docker rmi vibe-mcp-server:test >nul 2>&1
) else (
    call :log_error "Build failed"
)
goto :eof

REM =============================================================================
REM Main Execution
REM =============================================================================

call :print_header "Vibe Stack - Docker Infrastructure Test"
echo Project: %PROJECT_ROOT%
echo Date: %date% %time%
echo.

cd /d "%PROJECT_ROOT%" || exit /b 1

REM Run all tests
call :test_docker_available
call :test_compose_files_exist
call :test_compose_syntax
call :test_pinned_versions
call :test_docker_images_exist
call :test_version_sync
call :test_mcp_dockerfile
call :test_mcp_build

REM Generate report
call :print_header "Test Results Summary"

echo Total Tests: %TESTS_TOTAL%
echo Passed: %TESTS_PASSED%
echo Failed: %TESTS_FAILED%
echo.

REM Save report to file
(
    echo Vibe Stack - Docker Infrastructure Test Report
    echo ==============================================
    echo.
    echo Date: %date% %time%
    echo Project: %PROJECT_ROOT%
    echo.
    echo Test Results Summary
    echo --------------------
    echo Total Tests: %TESTS_TOTAL%
    echo Passed: %TESTS_PASSED%
    echo Failed: %TESTS_FAILED%
    echo.
    if %TESTS_FAILED% equ 0 (
        echo Status: SUCCESS
    ) else (
        echo Status: FAILED
    )
) > "%TEST_REPORT%"

call :log_info "Test report saved to: %TEST_REPORT%"

REM Exit with appropriate code
if %TESTS_FAILED% gtr 0 (
    exit /b 1
) else (
    exit /b 0
)
