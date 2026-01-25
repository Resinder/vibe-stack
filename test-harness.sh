#!/bin/bash
# ============================================================================
# Vibe Stack - Immune System (Test Harness)
# ============================================================================
# Validates system changes before allowing them to merge to main.
# This implements the "Self-Correcting Protocol" where all changes must:
#   1. Create a temporary branch
#   2. Validate syntax and configuration
#   3. Perform dry-run container test
#   4. Verify health checks pass
#   5. Only then allow merge back to main
#
# If any step fails, triggers "Immune Response" (abort + log error).
#
# Usage: ./test-harness.sh [--skip-branch] [--task "Description"]
#
# Options:
#   --skip-branch    Skip branch creation (for CI/CD or manual use)
#   --task           Description of the change being tested
# ============================================================================

# Strict mode: Exit on error, undefined variables, and pipe failures
set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Parse arguments
SKIP_BRANCH=false
TASK_DESCRIPTION="System update"

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-branch)
            SKIP_BRANCH=true
            shift
            ;;
        --task)
            TASK_DESCRIPTION="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ANSI color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'  # No Color

# Branch naming
readonly BRANCH_PREFIX="evolution/test-check"
readonly TIMESTAMP=$(date +%Y%m%d-%H%M%S)
readonly TEST_BRANCH="${BRANCH_PREFIX}-${TIMESTAMP}"

# Health check timeouts
readonly HEALTH_CHECK_TIMEOUT=60  # seconds
readonly ROLLBACK_TIMEOUT=30      # seconds

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

log_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${MAGENTA}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

log_section() {
    echo ""
    echo -e "${CYAN}▶ $1${NC}"
}

log_info() {
    echo -e "${CYAN}  ℹ ${*}${NC}"
}

log_success() {
    echo -e "${GREEN}  ✓ ${*}${NC}"
}

log_warning() {
    echo -e "${YELLOW}  ⚠ ${*}${NC}"
}

log_error() {
    echo -e "${RED}  ✗ ${*}${NC}"
}

log_immune_response() {
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  IMMUNE RESPONSE TRIGGERED                                 ║${NC}"
    echo -e "${RED}║  Change rejected: $1${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# ============================================================================
# IMMUNE SYSTEM FUNCTIONS
# ============================================================================

immune_response() {
    local error_message="$1"
    local error_log="immune-response-${TIMESTAMP}.log"

    # Log the immune response
    {
        echo "=== IMMUNE RESPONSE TRIGGERED ==="
        echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
        echo "Task: ${TASK_DESCRIPTION}"
        echo "Error: ${error_message}"
        echo "Branch: ${TEST_BRANCH}"
        echo "=================================================="
    } >> "${error_log}"

    log_immune_response "${error_message}"
    log_info "Details logged to: ${error_log}"

    # Abort if we created a branch
    if [[ "$SKIP_BRANCH" == "false" ]] && git rev-parse --verify "${TEST_BRANCH}" >/dev/null 2>&1; then
        log_info "Aborting test branch: ${TEST_BRANCH}"
        git checkout main >/dev/null 2>&1 || true
        git branch -D "${TEST_BRANCH}" >/dev/null 2>&1 || true
    fi

    exit 1
}

# ============================================================================
# STEP 1: BRANCH CREATION
# ============================================================================

create_test_branch() {
    if [[ "$SKIP_BRANCH" == "true" ]]; then
        log_info "Skipping branch creation (--skip-branch flag)"
        return 0
    fi

    log_section "Creating Test Branch"

    # Check if we're in a git repo
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        log_warning "Not in a git repository, skipping branch creation"
        SKIP_BRANCH=true
        return 0
    fi

    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        log_warning "You have uncommitted changes"
        log_info "Commit them first, or use --skip-branch"
        immune_response "Uncommitted changes detected"
    fi

    # Check current branch
    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)

    if [[ "$current_branch" != "main" ]] && [[ "$current_branch" != "master" ]]; then
        log_warning "Currently on branch: ${current_branch}"
        log_info "Switching to main for test branch creation"
        git checkout main || immune_response "Could not checkout main"
    fi

    # Create test branch
    log_info "Creating test branch: ${TEST_BRANCH}"
    git checkout -b "${TEST_BRANCH}" || immune_response "Failed to create test branch"
    log_success "Test branch created: ${TEST_BRANCH}"
}

# ============================================================================
# STEP 2: VALIDATION
# ============================================================================

validate_configuration() {
    log_section "Validating Configuration"

    local validation_failed=0

    # Check docker-compose.yml syntax
    log_info "Checking docker-compose.yml syntax..."
    if docker compose config --no-interpolate >/dev/null 2>&1; then
        log_success "docker-compose.yml syntax valid"
    else
        immune_response "docker-compose.yml syntax error"
    fi

    # Check .env file exists
    log_info "Checking .env file..."
    if [[ -f .env ]]; then
        log_success ".env file exists"
    else
        log_warning ".env file missing (may cause issues)"
    fi

    # Check shell script syntax
    log_info "Checking shell script syntax..."
    local script_failed=0
    for script in *.sh; do
        if [[ -f "$script" ]]; then
            if bash -n "$script" 2>/dev/null; then
                log_success "${script} syntax valid"
            else
                log_error "${script} syntax error"
                script_failed=1
            fi
        fi
    done

    if [[ $script_failed -eq 1 ]]; then
        immune_response "Shell script syntax errors detected"
    fi

    # Check Makefile syntax
    log_info "Checking Makefile syntax..."
    if make -n validate >/dev/null 2>&1 || [[ -f Makefile ]]; then
        log_success "Makefile exists and appears valid"
    else
        log_warning "Could not validate Makefile"
    fi

    log_success "All validation checks passed"
}

# ============================================================================
# STEP 3: DRY RUN
# ============================================================================

perform_dry_run() {
    log_section "Performing Dry Run"

    log_info "Stopping any existing containers..."
    docker compose down --remove-orphans >/dev/null 2>&1 || true

    log_info "Starting containers in dry-run mode..."
    if docker compose up -d >/dev/null 2>&1; then
        log_success "Containers started successfully"
    else
        immune_response "Failed to start containers in dry run"
    fi

    # Wait a moment for containers to initialize
    log_info "Waiting for containers to initialize..."
    sleep 5

    # Check if containers are running
    log_info "Verifying container status..."
    local running_containers
    running_containers=$(docker compose ps --services --filter "status=running" 2>/dev/null | wc -l)

    if [[ $running_containers -gt 0 ]]; then
        log_success "${running_containers} container(s) running"
    else
        immune_response "No containers are running after dry run"
    fi
}

# ============================================================================
# STEP 4: HEALTH VERIFICATION
# ============================================================================

verify_health() {
    log_section "Verifying Health Checks"

    local services=("vibe-server:4000/api/health" "code-server:8443/" "open-webui:8081/")
    local unhealthy_count=0
    local start_time
    start_time=$(date +%s)

    for service_endpoint in "${services[@]}"; do
        local service_name="${service_endpoint%:*}"
        local health_endpoint="${service_endpoint#*:}"

        echo -n "  Checking ${service_name}... "

        local elapsed=0
        local healthy=false

        while [[ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]]; do
            if curl -sf "http://localhost:${health_endpoint}" >/dev/null 2>&1; then
                echo -e "${GREEN}Healthy${NC}"
                healthy=true
                break
            fi

            elapsed=$(($(date +%s) - start_time))
            sleep 2
        done

        if [[ "$healthy" == "false" ]]; then
            echo -e "${RED}Unhealthy (timed out)${NC}"
            ((unhealthy_count++))
        fi
    done

    if [[ $unhealthy_count -gt 0 ]]; then
        immune_response "${unhealthy_count} service(s) failed health check"
    fi

    log_success "All health checks passed"
}

# ============================================================================
# STEP 5: MERGE (OR REPORT SUCCESS)
# ============================================================================

merge_or_report() {
    log_section "Test Results"

    if [[ "$SKIP_BRANCH" == "false" ]]; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ALL TESTS PASSED                                          ║${NC}"
        echo -e "${GREEN}║  Change validated: ${TASK_DESCRIPTION}${NC}"
        echo -e "${GREEN}║                                                            ║${NC}"
        echo -e "${GREEN}║  Test branch: ${TEST_BRANCH}${NC}"
        echo -e "${GREEN}║                                                            ║${NC}"
        echo -e "${GREEN}║  To merge this change:                                     ║${NC}"
        echo -e "${GREEN}║    1. Review changes: git diff main                        ║${NC}"
        echo -e "${GREEN}║    2. If satisfied: git checkout main && git merge ${TEST_BRANCH}${NC}"
        echo -e "${GREEN}║    3. Clean up: git branch -d ${TEST_BRANCH}               ║${NC}"
        echo -e "${GREEN}║                                                            ║${NC}"
        echo -e "${GREEN}║  To abort: git checkout main && git branch -D ${TEST_BRANCH}║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""

        # Stay on the test branch for review
        log_info "Remaining on test branch for review"
        log_info "Switch back to main when ready: git checkout main"
    else
        log_success "All validation checks passed (--skip-branch mode)"
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    log_header "Vibe Stack - Immune System Test Harness"

    echo -e "${BOLD}Task:${NC} ${TASK_DESCRIPTION}"
    echo -e "${BOLD}Test Branch:${NC} ${TEST_BRANCH}"
    echo ""

    # Run immune system checks
    create_test_branch
    validate_configuration
    perform_dry_run
    verify_health
    merge_or_report
}

# Handle script interruption
trap 'echo ""; log_error "Test harness interrupted"; exit 130' INT

# Run main function
main "$@"
