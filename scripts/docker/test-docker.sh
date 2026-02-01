#!/usr/bin/env bash
# =============================================================================
# Vibe Stack - Docker Infrastructure Test Script
# =============================================================================
#
# This script tests the Docker infrastructure:
# - Validates Docker Compose files
# - Verifies all Docker images exist
# - Tests MCP Server Dockerfile build
# - Generates a test report
#
# Usage: ./scripts/docker/test-docker.sh [options]
#   --verbose     Show detailed output
#   --no-pull     Skip pulling images
#   --help        Show this help message
#
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILES=("$PROJECT_ROOT/docker-compose.yml" "$PROJECT_ROOT/docker-compose.monitoring.yml")
MCP_SERVER_DIR="$PROJECT_ROOT/mcp-server"
TEST_REPORT="$PROJECT_ROOT/docker-test-report.txt"

# Options
VERBOSE=false
NO_PULL=false

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_header() {
    echo ""
    echo "=================================================================="
    echo "  $1"
    echo "=================================================================="
    echo ""
}

# =============================================================================
# Parse Arguments
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                VERBOSE=true
                shift
                ;;
            --no-pull)
                NO_PULL=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Usage: $(basename "$0") [options]

Test Docker infrastructure for Vibe Stack.

Options:
  --verbose     Show detailed output
  --no-pull     Skip pulling images
  --help        Show this help message

EOF
}

# =============================================================================
# Test Functions
# =============================================================================

test_docker_available() {
    print_header "Test 1: Docker Availability"

    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
        log_success "Docker is installed (version $DOCKER_VERSION)"
    else
        log_error "Docker is not installed"
        return 1
    fi

    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        if docker compose version &> /dev/null; then
            COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")
            log_success "Docker Compose is available (version $COMPOSE_VERSION)"
        else
            COMPOSE_VERSION=$(docker-compose --version | awk '{print $4}' | sed 's/,//')
            log_success "Docker Compose is available (version $COMPOSE_VERSION)"
        fi
    else
        log_error "Docker Compose is not installed"
        return 1
    fi
}

test_compose_files_exist() {
    print_header "Test 2: Compose Files Existence"

    for compose_file in "${COMPOSE_FILES[@]}"; do
        if [ -f "$compose_file" ]; then
            log_success "Found: $(basename "$compose_file")"
        else
            log_error "Missing: $(basename "$compose_file")"
        fi
    done
}

test_compose_syntax() {
    print_header "Test 3: Compose Files Syntax"

    for compose_file in "${COMPOSE_FILES[@]}"; do
        if [ -f "$compose_file" ]; then
            log_info "Validating: $(basename "$compose_file")"

            if docker compose -f "$compose_file" config > /dev/null 2>&1; then
                log_success "Valid syntax: $(basename "$compose_file")"
            else
                log_error "Invalid syntax: $(basename "$compose_file")"
            fi
        fi
    done
}

test_pinned_versions() {
    print_header "Test 4: Docker Image Version Pinning"

    for compose_file in "${COMPOSE_FILES[@]}"; do
        if [ -f "$compose_file" ]; then
            log_info "Checking: $(basename "$compose_file")"

            # Check for unpinned tags
            if grep -qE "image:.*:(latest|main|master)" "$compose_file"; then
                log_error "Found unpinned tags in $(basename "$compose_file")"
                grep -nE "image:.*:(latest|main|master)" "$compose_file" | while read -r line; do
                    log_warning "  $line"
                done
            else
                log_success "All images pinned in $(basename "$compose_file")"
            fi
        fi
    done
}

test_docker_images_exist() {
    print_header "Test 5: Docker Images Availability"

    # Extract all unique images from compose files
    local images=()
    for compose_file in "${COMPOSE_FILES[@]}"; do
        if [ -f "$compose_file" ]; then
            while IFS= read -r line; do
                if [[ $line =~ image:\ (.+) ]]; then
                    images+=("${BASH_REMATCH[1]}")
                fi
            done < <(grep -E "^\s+image:" "$compose_file" | awk '{print $2}' | sort -u)
        fi
    done

    # Check each image
    for image in "${images[@]}"; do
        log_info "Checking: $image"

        if [ "$NO_PULL" = true ]; then
            # Check locally only
            if docker image inspect "$image" &> /dev/null; then
                log_success "Image exists locally: $image"
            else
                log_warning "Image not found locally (skipped pull): $image"
            fi
        else
            # Try to pull the image
            if docker pull "$image" > /dev/null 2>&1; then
                log_success "Image available: $image"

                # Show image size if verbose
                if [ "$VERBOSE" = true ]; then
                    SIZE=$(docker image inspect "$image" --format='{{.Size}}' | awk '{print $1/1024/1024 " MB"}')
                    log_info "  Size: $SIZE"
                fi
            else
                log_error "Image not available: $image"
            fi
        fi
    done
}

test_version_sync() {
    print_header "Test 6: Version Sync with version.json"

    local version_json="$PROJECT_ROOT/version.json"

    if [ ! -f "$version_json" ]; then
        log_error "version.json not found"
        return 1
    fi

    # Check Node.js version
    local node_compose=$(grep -A1 "image: node:" "$PROJECT_ROOT/docker-compose.yml" | grep image | awk '{print $2}' | cut -d':' -f2)
    local node_version=$(jq -r '.docker.images.node.tag' "$version_json")

    if [ "$node_compose" = "$node_version" ]; then
        log_success "Node.js version matches ($node_version)"
    else
        log_warning "Node.js version mismatch: compose=$node_compose, version.json=$node_version"
    fi

    # Check PostgreSQL version
    local pg_compose=$(grep -A1 "image: postgres:" "$PROJECT_ROOT/docker-compose.yml" | grep image | awk '{print $2}' | cut -d':' -f2)
    local pg_version=$(jq -r '.docker.images.postgres.tag' "$version_json")

    if [ "$pg_compose" = "$pg_version" ]; then
        log_success "PostgreSQL version matches ($pg_version)"
    else
        log_warning "PostgreSQL version mismatch: compose=$pg_compose, version.json=$pg_version"
    fi
}

test_mcp_dockerfile() {
    print_header "Test 7: MCP Server Dockerfile"

    local dockerfile="$MCP_SERVER_DIR/Dockerfile"

    if [ ! -f "$dockerfile" ]; then
        log_warning "MCP Server Dockerfile not found (skipped)"
        return 0
    fi

    # Check for multi-stage build
    if grep -qE "FROM\s+.*\s+AS\s+" "$dockerfile"; then
        log_success "Multi-stage build detected"
    else
        log_warning "Multi-stage build not found (recommended for production)"
    fi

    # Check for non-root user
    if grep -qE "USER\s+" "$dockerfile"; then
        log_success "Non-root user configured"
    else
        log_warning "Non-root user not found (security best practice)"
    fi

    # Check for health check
    if grep -qE "HEALTHCHECK" "$dockerfile"; then
        log_success "Health check configured"
    else
        log_warning "Health check not found"
    fi

    # Check for .dockerignore
    if [ -f "$MCP_SERVER_DIR/.dockerignore" ]; then
        log_success ".dockerignore exists"
    else
        log_warning ".dockerignore not found (recommended for smaller images)"
    fi
}

test_mcp_build() {
    print_header "Test 8: MCP Server Build Test"

    local dockerfile="$MCP_SERVER_DIR/Dockerfile"

    if [ ! -f "$dockerfile" ]; then
        log_warning "MCP Server Dockerfile not found (skipped)"
        return 0
    fi

    log_info "Building MCP Server image..."

    if docker build -t vibe-mcp-server:test -f "$dockerfile" "$MCP_SERVER_DIR" > /tmp/mcp-build.log 2>&1; then
        log_success "MCP Server image built successfully"

        # Show image size
        SIZE=$(docker image inspect vibe-mcp-server:test --format='{{.Size}}' | awk '{printf "%.2f MB", $1/1024/1024}')
        log_info "Image size: $SIZE"

        # Test container startup
        log_info "Testing container startup..."
        if docker run --rm -d --name mcp-test vibe-mcp-server:test > /dev/null 2>&1; then
            sleep 3

            if docker ps | grep -q mcp-test; then
                log_success "Container started successfully"
                docker stop mcp-test > /dev/null 2>&1 || true
            else
                log_error "Container failed to start"
            fi
        else
            log_error "Failed to start container"
        fi

        # Clean up
        docker rmi vibe-mcp-server:test > /dev/null 2>&1 || true
    else
        log_error "Build failed. Check /tmp/mcp-build.log for details."
        if [ "$VERBOSE" = true ]; then
            cat /tmp/mcp-build.log
        fi
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    parse_args "$@"

    print_header "Vibe Stack - Docker Infrastructure Test"
    echo "Project: $PROJECT_ROOT"
    echo "Date: $(date)"
    echo ""

    # Change to project directory
    cd "$PROJECT_ROOT" || exit 1

    # Run all tests
    test_docker_available
    test_compose_files_exist
    test_compose_syntax
    test_pinned_versions
    test_docker_images_exist
    test_version_sync
    test_mcp_dockerfile
    test_mcp_build

    # Generate report
    print_header "Test Results Summary"

    echo "Total Tests: $TESTS_TOTAL"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo ""

    # Save report to file
    cat > "$TEST_REPORT" << EOF
Vibe Stack - Docker Infrastructure Test Report
==============================================

Date: $(date)
Project: $PROJECT_ROOT

Test Results Summary
--------------------
Total Tests: $TESTS_TOTAL
Passed: $TESTS_PASSED
Failed: $TESTS_FAILED

Status: $([ "$TESTS_FAILED" -eq 0 ] && echo "SUCCESS" || echo "FAILED")

EOF

    log_info "Test report saved to: $TEST_REPORT"

    # Exit with appropriate code
    if [ "$TESTS_FAILED" -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
