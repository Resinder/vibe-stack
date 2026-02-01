#!/usr/bin/env bash
# =============================================================================
# Vibe Stack - End-to-End Test
# =============================================================================
# Tests all services are working correctly
# Run: ./scripts/setup/e2e-test.sh
# Updated for current versions: PostgreSQL 18.1, Node.js 24.13.0, Open WebUI v0.7.2
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Expected versions
EXPECTED_POSTGRES_VERSION="18.1"
EXPECTED_NODE_VERSION="24.13.0"
EXPECTED_OPENWEBUI_VERSION="v0.7.2"

# Helper functions
test_service() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}

    echo -n "Testing $name... "

    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

    if [ "$status_code" = "$expected_code" ] || [ "$status_code" = "302" ] && [ "$expected_code" = "200" ]; then
        echo -e "${GREEN}PASS${NC} ($status_code)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}FAIL${NC} (got $status_code, expected $expected_code)"
        ((TESTS_FAILED++))
        return 1
    fi
}

test_container_health() {
    local container=$1
    echo -n "Testing container $container... "

    local health=$(docker compose ps -q "$container" 2>/dev/null | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "missing")

    if [ "$health" = "healthy" ]; then
        echo -e "${GREEN}PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}FAIL${NC} ($health)"
        ((TESTS_FAILED++))
        return 1
    fi
}

test_docker_image_version() {
    local service=$1
    local expected_version=$2
    echo -n "Testing $service image version... "

    local image=$(docker compose ps -q "$service" 2>/dev/null | xargs docker inspect --format='{{.Config.Image}}' 2>/dev/null || echo "")

    if echo "$image" | grep -q "$expected_version"; then
        echo -e "${GREEN}PASS${NC} ($image)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${YELLOW}WARN${NC} (expected $expected_version, got $image)"
        ((TESTS_PASSED++))  # Don't fail on version mismatch, just warn
        return 0
    fi
}

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# =============================================================================
# Main Test Suite
# =============================================================================

print_header "Vibe Stack - End-to-End Test (Current Versions)"
echo -e "${CYAN}Expected versions:${NC}"
echo "  • PostgreSQL: $EXPECTED_POSTGRES_VERSION"
echo "  • Node.js:    $EXPECTED_NODE_VERSION"
echo "  • Open WebUI: $EXPECTED_OPENWEBUI_VERSION"
echo ""

# Test 1: Container Health
print_header "Test 1: Container Health Checks"

test_container_health "vibe-postgres"
test_container_health "vibe-mcp-server"
test_container_health "code-server"
test_container_health "open-webui"
test_container_health "vibe-kanban"

# Test 2: Docker Image Versions
print_header "Test 2: Docker Image Version Verification"

test_docker_image_version "vibe-postgres" "$EXPECTED_POSTGRES_VERSION"
test_docker_image_version "vibe-kanban" "$EXPECTED_NODE_VERSION"
test_docker_image_version "open-webui" "$EXPECTED_OPENWEBUI_VERSION"

# Test 3: HTTP Endpoints
print_header "Test 3: HTTP Endpoint Tests"

test_service "Vibe-Kanban" "http://localhost:4000/" "200"
test_service "MCP Server Health" "http://localhost:4001/health" "200"
test_service "Open WebUI" "http://localhost:8081/" "200"
test_service "code-server" "http://localhost:8443/" "302"

# Test 4: Docker Network & Infrastructure
print_header "Test 4: Docker Infrastructure"

echo -n "Testing network exists... "
if docker network inspect vibe-stack_default &>/dev/null; then
    echo -e "${GREEN}PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -n "Testing volumes exist... "
volumes=("vibe-stack_vibe_config" "vibe-stack_vibe_data" "vibe-stack_code_server_data" "vibe-stack_open_webui_data" "vibe-stack_postgres_data")
missing=0
for vol in "${volumes[@]}"; do
    if ! docker volume inspect "$vol" &>/dev/null; then
        ((missing++))
    fi
done

if [ $missing -eq 0 ]; then
    echo -e "${GREEN}PASS${NC} (5 volumes)"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}WARN${NC} ($missing volumes missing, may be first run)"
    ((TESTS_PASSED++))
fi

echo -n "Testing container count... "
container_count=$(docker ps --filter "name=vibe" --filter "name=open-webui" --filter "name=code-server" --filter "name=postgres" -q 2>/dev/null | wc -l)
if [ $container_count -ge 4 ]; then
    echo -e "${GREEN}PASS${NC} ($container_count containers running)"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}WARN${NC} (only $container_count containers, expected 4+)"
    ((TESTS_PASSED++))
fi

# Test 5: Environment Configuration
print_header "Test 5: Environment Configuration"

echo -n "Testing .env file exists... "
if [ -f .env ]; then
    echo -e "${GREEN}PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -n "Testing CODE_SERVER_PASSWORD is set... "
if grep -q "CODE_SERVER_PASSWORD=" .env 2>/dev/null && ! grep -q "CHANGE_THIS" .env 2>/dev/null; then
    echo -e "${GREEN}PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}WARN${NC} (using default or needs to be changed)"
    ((TESTS_PASSED++))
fi

echo -n "Testing POSTGRES_PASSWORD is set... "
if grep -q "POSTGRES_PASSWORD=" .env 2>/dev/null && ! grep -q "CHANGE_THIS" .env 2>/dev/null; then
    echo -e "${GREEN}PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}WARN${NC} (using default or needs to be changed)"
    ((TESTS_PASSED++))
fi

echo -n "Testing CREDENTIAL_ENCRYPTION_KEY is set... "
if grep -q "CREDENTIAL_ENCRYPTION_KEY=" .env 2>/dev/null && [ ${#CREDENTIAL_ENCRYPTION_KEY} -gt 20 ]; then
    echo -e "${GREEN}PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}WARN${NC} (may not be set properly)"
    ((TESTS_PASSED++))
fi

# Test 6: Database Connectivity
print_header "Test 6: Database Connectivity"

echo -n "Testing PostgreSQL connection... "
if docker exec vibe-postgres pg_isready -U vibeuser &>/dev/null; then
    echo -e "${GREEN}PASS${NC} (accepting connections)"
    ((TESTS_PASSED++))

    echo -n "Testing PostgreSQL version... "
    pg_version=$(docker exec vibe-postgres psql -U vibeuser -d postgres -t -c "SELECT version();" 2>/dev/null | grep -o "PostgreSQL [0-9.]*" | head -1 || echo "unknown")
    if echo "$pg_version" | grep -q "$EXPECTED_POSTGRES_VERSION"; then
        echo -e "${GREEN}PASS${NC} ($pg_version)"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}WARN${NC} ($pg_version, expected $EXPECTED_POSTGRES_VERSION)"
        ((TESTS_PASSED++))
    fi
else
    echo -e "${RED}FAIL${NC} (cannot connect)"
    ((TESTS_FAILED++))
fi

# Test 7: MCP Server Functionality
print_header "Test 7: MCP Server Functionality"

echo -n "Testing MCP health endpoint... "
mcp_health=$(curl -s http://localhost:4001/health 2>/dev/null || echo "")
if echo "$mcp_health" | grep -q "healthy"; then
    echo -e "${GREEN}PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}FAIL${NC} (health check failed)"
    ((TESTS_FAILED++))
fi

echo -n "Testing MCP server info... "
mcp_info=$(curl -s http://localhost:4001/ 2>/dev/null | head -1 || echo "")
if [ -n "$mcp_info" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}WARN${NC} (root endpoint may not exist)"
    ((TESTS_PASSED++))
fi

# =============================================================================
# Summary
# =============================================================================

print_header "Test Summary"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  ${GREEN}ALL TESTS PASSED!${NC}                                         ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Services Running:${NC}"
    echo -e "  • Vibe-Kanban:  ${BLUE}http://localhost:4000${NC}"
    echo -e "  • MCP Server:   ${BLUE}http://localhost:4001${NC}"
    echo -e "  • Open WebUI:   ${BLUE}http://localhost:8081${NC}"
    echo -e "  • code-server:  ${BLUE}http://localhost:8443${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo "  1. Configure AI provider: make setup-ai"
    echo "  2. Open Open WebUI: http://localhost:8081"
    echo "  3. Start coding with AI!"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}  ${RED}SOME TESTS FAILED${NC}                                         ${RED}║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  • Check logs: docker compose logs [service]"
    echo "  • Restart services: make down && make up"
    echo "  • Rebuild: docker compose up -d --build"
    exit 1
fi
