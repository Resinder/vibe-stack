#!/usr/bin/env bash
# =============================================================================
# Vibe Stack - Quick Fix Script
# =============================================================================
#
# Automatically diagnoses and fixes common issues:
# - Missing .env file
# - Port conflicts
# - Docker daemon not running
# - Volume permission issues
# - Outdated Docker images
# - Network problems
#
# Usage:
#   ./scripts/fix.sh [options]
#
# Options:
#   --dry-run    Show what would be done without making changes
#   --fix        Automatically fix issues found
#   --all        Run all checks and fixes
#   --help       Show this help message
#
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

# Flags
DRY_RUN=false
AUTO_FIX=false
RUN_ALL=false
FIXES_APPLIED=0
ISSUES_FOUND=0

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║${NC}  $1                                                    ${BOLD}${BLUE}║${NC}"
    echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_fix() {
    echo -e "${CYAN}[FIX]${NC} $1"
}

# =============================================================================
# Parse Arguments
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --fix)
                AUTO_FIX=true
                shift
                ;;
            --all)
                RUN_ALL=true
                AUTO_FIX=true
                shift
                ;;
            --help|-h)
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

Vibe Stack - Quick Fix Script

Automatically diagnoses and fixes common issues.

Options:
  --dry-run    Show what would be done without making changes
  --fix        Automatically fix issues found
  --all        Run all checks and fixes
  --help       Show this help message

Examples:
  # Check for issues
  $(basename "$0")

  # Auto-fix all issues
  $(basename "$0") --all

  # Dry-run to see what would be fixed
  $(basename "$0") --dry-run

EOF
}

# =============================================================================
# Check Functions
# =============================================================================

check_docker() {
    print_header "Checking Docker"

    if command -v docker &> /dev/null; then
        log_success "Docker is installed"
    else
        log_error "Docker is not installed"
        log_fix "Install Docker from https://www.docker.com/get-started"
        ((ISSUES_FOUND++))
        return 1
    fi

    if docker info &> /dev/null; then
        log_success "Docker daemon is running"
    else
        log_error "Docker daemon is not running"
        log_fix "Start Docker Desktop or run: sudo systemctl start docker"
        ((ISSUES_FOUND++))

        if [ "$AUTO_FIX" = true ] && [ "$DRY_RUN" = false ]; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                open -a Docker
                log_info "Starting Docker Desktop on macOS..."
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                sudo systemctl start docker
                log_info "Starting Docker daemon..."
            fi
            ((FIXES_APPLIED++))
        fi
        return 1
    fi

    local docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
    log_info "Docker version: $docker_version"
}

check_docker_compose() {
    print_header "Checking Docker Compose"

    if docker compose version &> /dev/null; then
        log_success "Docker Compose is available"
        local compose_version=$(docker compose version --short 2>/dev/null || echo "unknown")
        log_info "Docker Compose version: $compose_version"
    else
        log_error "Docker Compose is not available"
        log_fix "Docker Compose should be included with Docker Desktop"
        ((ISSUES_FOUND++))
        return 1
    fi
}

check_env_file() {
    print_header "Checking Environment File"

    if [ -f "$ENV_FILE" ]; then
        log_success ".env file exists"
    else
        log_error ".env file not found"
        log_fix "Creating .env from .env.example..."
        ((ISSUES_FOUND++))

        if [ "$AUTO_FIX" = true ] && [ "$DRY_RUN" = false ]; then
            if [ -f "$ENV_EXAMPLE" ]; then
                cp "$ENV_EXAMPLE" "$ENV_FILE"
                log_success "Created .env file from .env.example"
                log_warning "Please update .env with your configuration!"
                ((FIXES_APPLIED++))
            else
                log_error ".env.example not found, cannot create .env"
                return 1
            fi
        fi
    fi

    # Check for required variables
    if [ -f "$ENV_FILE" ]; then
        local required_vars=("POSTGRES_PASSWORD" "CODE_SERVER_PASSWORD" "CREDENTIAL_ENCRYPTION_KEY")
        local missing_vars=()

        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
                local value=$(grep "^${var}=" "$ENV_FILE" | cut -d'=' -f2)
                if [[ "$value" == "change-me"* ]] || [[ "$value" == "vibepass" ]] || [ -z "$value" ]; then
                    log_warning "$var needs to be updated (currently: $value)"
                    missing_vars+=("$var")
                fi
            else
                log_warning "$var is not set in .env"
                missing_vars+=("$var")
            fi
        done

        if [ ${#missing_vars[@]} -gt 0 ]; then
            ((ISSUES_FOUND++))
            log_error "Required variables need updating: ${missing_vars[*]}"
            log_fix "Update these in .env with secure values"

            if [ "$AUTO_FIX" = true ] && [ "$DRY_RUN" = false ]; then
                log_info "Generating secure values..."

                for var in "${missing_vars[@]}"; do
                    if [ "$var" = "CREDENTIAL_ENCRYPTION_KEY" ]; then
                        local new_value=$(openssl rand -base64 48 2>/dev/null || echo "change-me-$(date +%s)")
                    else
                        local new_value="change-me-$(openssl rand -hex 16 2>/dev/null || date +%s)"
                    fi

                    # Replace in .env
                    sed -i.bak "s/^${var}=.*/${var}=${new_value}/" "$ENV_FILE"
                    log_fix "Updated $var in .env"
                done

                rm -f "${ENV_FILE}.bak"
                ((FIXES_APPLIED++))
                log_warning "Please review the generated values in .env"
            fi
        else
            log_success "All required variables are properly configured"
        fi
    fi
}

check_ports() {
    print_header "Checking Port Availability"

    local ports=(4000 8443 8081 4001 5432 3000 9090)
    local conflicts=()

    for port in "${ports[@]}"; do
        if command -v lsof &> /dev/null; then
            # macOS/Linux
            if lsof -i ":$port" &> /dev/null; then
                local process=$(lsof -i ":$port" -t | head -1)
                local process_name=$(ps -p "$process" -o comm= 2>/dev/null || echo "unknown")
                log_warning "Port $port is in use by $process_name (PID: $process)"
                conflicts+=("$port:$process")
            fi
        elif command -v netstat &> /dev/null; then
            # Windows/netstat
            if netstat -an 2>/dev/null | grep -q ":$port.*LISTEN"; then
                log_warning "Port $port is in use"
                conflicts+=("$port")
            fi
        fi
    done

    if [ ${#conflicts[@]} -gt 0 ]; then
        ((ISSUES_FOUND++))
        log_error "Found ${#conflicts[@]} port conflict(s)"
        log_fix "Stop conflicting processes or change ports in .env"

        if [ "$AUTO_FIX" = true ] && [ "$DRY_RUN" = false ]; then
            log_info "Attempting to resolve conflicts..."

            for conflict in "${conflicts[@]}"; do
                local port="${conflict%%:*}"
                local pid="${conflict##*:}"

                if [ -n "$pid" ] && [ "$pid" != "$port" ]; then
                    log_fix "Killing process $pid using port $port..."
                    kill -9 "$pid" 2>/dev/null || true
                    ((FIXES_APPLIED++))
                fi
            done
        fi
    else
        log_success "All required ports are available"
    fi
}

check_network() {
    print_header "Checking Docker Network"

    local network_name="vibe-network"

    if docker network inspect "$network_name" &> /dev/null; then
        log_success "Network '$network_name' exists"
    else
        log_warning "Network '$network_name' does not exist"
        log_fix "Creating network '$network_name'..."
        ((ISSUES_FOUND++))

        if [ "$AUTO_FIX" = true ] && [ "$DRY_RUN" = false ]; then
            docker network create "$network_name" 2>/dev/null || true
            log_success "Created network '$network_name'"
            ((FIXES_APPLIED++))
        fi
    fi
}

check_volumes() {
    print_header "Checking Docker Volumes"

    local required_volumes=(
        "vibe_config"
        "vibe_data"
        "code_server_data"
        "open_webui_data"
        "postgres_data"
    )

    local missing_volumes=()

    for volume in "${required_volumes[@]}"; do
        if docker volume inspect "$volume" &> /dev/null; then
            log_success "Volume '$volume' exists"
        else
            log_warning "Volume '$volume' does not exist (will be created on first run)"
            missing_volumes+=("$volume")
        fi
    done

    if [ ${#missing_volumes[@]} -gt 0 ]; then
        log_info "Missing volumes will be created automatically on first start"
    fi
}

check_images() {
    print_header "Checking Docker Images"

    if [ "$DRY_RUN" = false ]; then
        log_info "Pulling latest images..."
        if docker compose pull &> /dev/null; then
            log_success "All images are up to date"
        else
            log_warning "Some images could not be pulled (this is okay if they're custom builds)"
        fi
    fi
}

check_permissions() {
    print_header "Checking File Permissions"

    # Check if scripts are executable
    local scripts=(
        "scripts/docker/test-docker.sh"
        "scripts/docker/validate-env.sh"
        "scripts/ops/backup-volumes.sh"
        "scripts/ops/health-dashboard.sh"
    )

    for script in "${scripts[@]}"; do
        if [ -f "$PROJECT_ROOT/$script" ]; then
            if [ -x "$PROJECT_ROOT/$script" ]; then
                log_success "$script is executable"
            else
                log_warning "$script is not executable"
                log_fix "Making $script executable..."
                ((ISSUES_FOUND++))

                if [ "$AUTO_FIX" = true ] && [ "$DRY_RUN" = false ]; then
                    chmod +x "$PROJECT_ROOT/$script"
                    log_success "Made $script executable"
                    ((FIXES_APPLIED++))
                fi
            fi
        fi
    done
}

check_git() {
    print_header "Checking Git Configuration"

    if command -v git &> /dev/null; then
        log_success "Git is installed"

        # Check line endings
        local autocrlf=$(git config --get core.autocrlf 2>/dev/null || echo "false")
        if [ "$autocrlf" = "true" ]; then
            log_warning "Git autocrlf is set to true (may cause issues with scripts)"
            log_fix "Run: git config core.autocrlf input"
            ((ISSUES_FOUND++))

            if [ "$AUTO_FIX" = true ] && [ "$DRY_RUN" = false ]; then
                git config core.autocrlf input
                log_success "Set Git autocrlf to input"
                ((FIXES_APPLIED++))
            fi
        else
            log_success "Git line endings configured correctly"
        fi
    else
        log_warning "Git is not installed (optional but recommended)"
    fi
}

cleanup_docker() {
    print_header "Cleaning Up Docker Resources"

    log_info "Removing dangling images..."
    local dangling_images=$(docker images -f "dangling=true" -q | wc -l)
    if [ "$dangling_images" -gt 0 ]; then
        if [ "$DRY_RUN" = true ]; then
            log_info "[DRY-RUN] Would remove $dangling_images dangling images"
        else
            docker image prune -f
            log_success "Removed $dangling_images dangling images"
            ((FIXES_APPLIED++))
        fi
    else
        log_success "No dangling images to remove"
    fi

    log_info "Removing unused build cache..."
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would remove unused build cache"
    else
        docker builder prune -f
        log_success "Removed unused build cache"
        ((FIXES_APPLIED++))
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    parse_args "$@"

    print_header "Vibe Stack - Quick Fix Script"
    echo "Project: $PROJECT_ROOT"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        log_warning "DRY-RUN MODE - No changes will be made"
    fi

    # Run all checks
    check_docker
    check_docker_compose
    check_env_file
    check_ports
    check_network
    check_volumes
    check_permissions
    check_git

    if [ "$RUN_ALL" = true ]; then
        check_images
        cleanup_docker
    fi

    # Print summary
    print_header "Summary"

    if [ "$ISSUES_FOUND" -eq 0 ]; then
        log_success "No issues found! Everything looks good."
    else
        log_error "Found $ISSUES_FOUND issue(s)"

        if [ "$FIXES_APPLIED" -gt 0 ]; then
            log_success "Applied $FIXES_APPLIED fix(es)"
        fi

        if [ "$AUTO_FIX" = false ] && [ "$DRY_RUN" = false ]; then
            echo ""
            log_info "Run with --fix to automatically fix issues"
            echo "  ./scripts/fix.sh --fix"
            echo ""
            log_info "Or run with --all to fix everything:"
            echo "  ./scripts/fix.sh --all"
        fi
    fi

    echo ""

    if [ "$ISSUES_FOUND" -eq 0 ] || [ "$FIXES_APPLIED" -gt 0 ]; then
        log_info "You can now start Vibe Stack:"
        echo "  docker compose up -d"
        echo ""
    fi

    # Exit code
    if [ "$ISSUES_FOUND" -gt 0 ] && [ "$FIXES_APPLIED" -eq 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
