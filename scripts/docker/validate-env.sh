#!/usr/bin/env bash
# =============================================================================
# Vibe Stack - Environment Variable Validation Script
# =============================================================================
#
# Validates all required environment variables before starting services.
# Checks for missing, empty, or invalid values.
#
# Usage:
#   ./scripts/docker/validate-env.sh [options]
#
# Options:
#   --env-file <path>   Path to .env file (default: ./.env)
#   --strict             Fail on warnings (not just errors)
#   --fix                Generate suggested fixes
#   --export             Export validated variables
#   --help               Show this help message
#
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
ENV_EXAMPLE="${PROJECT_ROOT}/.env.example"
STRICT=false
FIX=false
EXPORT=false

# Validation results
ERRORS=0
WARNINGS=0

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((ERRORS++))
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARNINGS++))
}

print_header() {
    echo ""
    echo "=================================================================="
    echo "  $1"
    echo "=================================================================="
    echo ""
}

show_help() {
    cat << EOF
Usage: $(basename "$0") [options]

Vibe Stack Environment Variable Validation

Options:
  --env-file <path>   Path to .env file (default: ./.env)
  --strict             Fail on warnings (not just errors)
  --fix                Generate suggested fixes
  --export             Export validated variables
  --help               Show this help message

Environment Variables:
  POSTGRES_PASSWORD    PostgreSQL database password (required)
  CODE_SERVER_PASSWORD code-server login password (required)
  CREDENTIAL_ENCRYPTION_KEY
                       Encryption key for credentials (32+ bytes, required)
  GRAFANA_ADMIN_PASSWORD
                       Grafana admin password (required)

Exit Codes:
  0    All validations passed
  1    Validation errors found
  2    Missing .env file

Examples:
  # Validate current .env file
  $(basename "$0")

  # Validate with strict mode
  $(basename "$0") --strict

  # Generate fix commands
  $(basename "$0") --fix

  # Export validated variables
  $(basename "$0") --export

EOF
}

# =============================================================================
# Parse Arguments
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env-file)
                ENV_FILE="$2"
                shift 2
                ;;
            --strict)
                STRICT=true
                shift
                ;;
            --fix)
                FIX=true
                shift
                ;;
            --export)
                EXPORT=true
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

# =============================================================================
# Validation Functions
# =============================================================================

load_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        echo ""
        echo "To create a new .env file:"
        echo "  cp .env.example .env"
        echo "  # Edit .env with your values"
        echo ""
        exit 2
    fi

    log_info "Loading environment file: $ENV_FILE"

    # Source the .env file
    set -a
    source "$ENV_FILE"
    set +a
}

validate_postgres_password() {
    local password="${POSTGRES_PASSWORD:-}"

    print_header "PostgreSQL Password Validation"

    if [ -z "$password" ]; then
        log_error "POSTGRES_PASSWORD is not set"
        return 1
    fi

    # Check if it's the default value
    if [ "$password" = "vibepass" ]; then
        log_warning "POSTGRES_PASSWORD is using the default value"
        echo "  Recommended: Change to a strong, unique password"
        return 0
    fi

    # Check minimum length
    if [ ${#password} -lt 12 ]; then
        log_warning "POSTGRES_PASSWORD is shorter than 12 characters"
        echo "  Current length: ${#password}"
        echo "  Recommended: Use at least 12 characters"
        return 0
    fi

    log_success "POSTGRES_PASSWORD is set (${#password} characters)"

    # Check for common patterns
    if echo "$password" | grep -qE "(password|123456|admin|qwerty)"; then
        log_warning "POSTGRES_PASSWORD contains common patterns"
        return 0
    fi

    log_success "POSTGRES_PASSWORD passes validation"
    return 0
}

validate_code_server_password() {
    local password="${CODE_SERVER_PASSWORD:-}"

    print_header "code-server Password Validation"

    if [ -z "$password" ]; then
        log_error "CODE_SERVER_PASSWORD is not set"
        return 1
    fi

    # Check if it's the default value
    if [ "$password" = "dev123" ]; then
        log_warning "CODE_SERVER_PASSWORD is using the default value"
        echo "  Recommended: Change to a strong, unique password"
        return 0
    fi

    # Check minimum length
    if [ ${#password} -lt 8 ]; then
        log_warning "CODE_SERVER_PASSWORD is shorter than 8 characters"
        echo "  Current length: ${#password}"
        echo "  Recommended: Use at least 8 characters"
        return 0
    fi

    log_success "CODE_SERVER_PASSWORD is set (${#password} characters)"
    return 0
}

validate_credential_encryption_key() {
    local key="${CREDENTIAL_ENCRYPTION_KEY:-}"

    print_header "Credential Encryption Key Validation"

    if [ -z "$key" ]; then
        log_error "CREDENTIAL_ENCRYPTION_KEY is not set"
        echo "  This key is required for encrypting stored credentials"
        echo "  Generate with: openssl rand -base64 48"
        return 1
    fi

    # Check minimum length (should be 32+ bytes for AES-256-GCM)
    local key_length=$(echo -n "$key" | wc -c)
    if [ "$key_length" -lt 32 ]; then
        log_error "CREDENTIAL_ENCRYPTION_KEY is too short ($key_length bytes)"
        echo "  Required: 32+ bytes for AES-256-GCM encryption"
        echo "  Generate with: openssl rand -base64 48"
        return 1
    fi

    log_success "CREDENTIAL_ENCRYPTION_KEY is set ($key_length bytes)"
    return 0
}

validate_grafana_password() {
    local password="${GRAFANA_ADMIN_PASSWORD:-}"

    print_header "Grafana Password Validation"

    if [ -z "$password" ]; then
        log_warning "GRAFANA_ADMIN_PASSWORD is not set"
        echo "  Default admin user will be used"
        echo "  Set this password to secure Grafana"
        return 0
    fi

    # Check minimum length
    if [ ${#password} -lt 8 ]; then
        log_warning "GRAFANA_ADMIN_PASSWORD is shorter than 8 characters"
        echo "  Current length: ${#password}"
        return 0
    fi

    log_success "GRAFANA_ADMIN_PASSWORD is set (${#password} characters)"
    return 0
}

validate_node_env() {
    local node_env="${NODE_ENV:-}"

    print_header "Node Environment Validation"

    if [ -z "$node_env" ]; then
        log_warning "NODE_ENV is not set (will use default: production)"
        return 0
    fi

    if [[ ! "$node_env" =~ ^(production|development|test)$ ]]; then
        log_warning "NODE_ENV has invalid value: $node_env"
        echo "  Valid values: production, development, test"
        return 0
    fi

    log_success "NODE_ENV is set to: $node_env"
    return 0
}

validate_database_config() {
    print_header "Database Configuration Validation"

    local db_host="${POSTGRES_HOST:-postgres}"
    local db_port="${POSTGRES_PORT:-5432}"
    local db_name="${POSTGRES_DB:-vibestack}"
    local db_user="${POSTGRES_USER:-vibeuser}"

    log_success "POSTGRES_HOST: $db_host"
    log_success "POSTGRES_PORT: $db_port"
    log_success "POSTGRES_DB: $db_name"
    log_success "POSTGRES_USER: $db_user"

    # Validate port number
    if ! [[ "$db_port" =~ ^[0-9]+$ ]] || [ "$db_port" -lt 1 ] || [ "$db_port" -gt 65535 ]; then
        log_error "Invalid POSTGRES_PORT: $db_port"
        return 1
    fi

    return 0
}

validate_port_bindings() {
    print_header "Port Binding Validation"

    local ports=(
        "4000:Vibe-Kanban"
        "8443:code-server"
        "8081:Open WebUI"
        "4001:MCP Server"
        "5432:PostgreSQL"
    )

    for port_info in "${ports[@]}"; do
        local port=$(echo "$port_info" | cut -d':' -f1)
        local service=$(echo "$port_info" | cut -d':' -f2)

        # Check if port is already in use (on Linux)
        if command -v lsof &> /dev/null; then
            if lsof -i ":$port" &> /dev/null; then
                log_warning "Port $port is already in use ($service)"
            else
                log_success "Port $port is available ($service)"
            fi
        fi
    done

    return 0
}

validate_resource_limits() {
    print_header "Resource Limits Validation"

    local vibe_cpu="${VIBE_CPU_LIMIT:-2.0}"
    local vibe_memory="${VIBE_MEMORY_LIMIT:-2G}"

    log_success "VIBE_CPU_LIMIT: $vibe_cpu"
    log_success "VIBE_MEMORY_LIMIT: $vibe_memory"

    return 0
}

generate_fixes() {
    print_header "Generating Fixes"

    echo "# Commands to fix missing environment variables:"
    echo ""

    if [ -z "${POSTGRES_PASSWORD:-}" ]; then
        echo "export POSTGRES_PASSWORD=$(openssl rand -base64 16)"
    fi

    if [ -z "${CODE_SERVER_PASSWORD:-}" ]; then
        echo "export CODE_SERVER_PASSWORD=$(openssl rand -base64 12)"
    fi

    if [ -z "${CREDENTIAL_ENCRYPTION_KEY:-}" ]; then
        echo "export CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -base64 48)"
    fi

    if [ -z "${GRAFANA_ADMIN_PASSWORD:-}" ]; then
        echo "export GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 12)"
    fi

    echo ""
    echo "# Add these to your .env file or run:"
    echo "# cat >> .env << 'EOF'"
    echo "# ... (paste above exports) ..."
    echo "# EOF"
}

export_variables() {
    print_header "Exporting Validated Variables"

    # Export all validated variables
    export POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
    export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
    export POSTGRES_DB="${POSTGRES_DB:-vibestack}"
    export POSTGRES_USER="${POSTGRES_USER:-vibeuser}"
    export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
    export CODE_SERVER_PASSWORD="${CODE_SERVER_PASSWORD:-}"
    export CREDENTIAL_ENCRYPTION_KEY="${CREDENTIAL_ENCRYPTION_KEY:-}"
    export GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-}"
    export NODE_ENV="${NODE_ENV:-production}"

    log_success "Variables exported to environment"
    log_info "Use 'eval \$(./scripts/docker/validate-env.sh --export)' to export in shell"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    parse_args "$@"

    print_header "Vibe Stack - Environment Variable Validation"
    echo "Environment file: $ENV_FILE"
    echo ""

    # Load environment file
    load_env_file

    # Run validations
    validate_postgres_password
    validate_code_server_password
    validate_credential_encryption_key
    validate_grafana_password
    validate_node_env
    validate_database_config
    validate_port_bindings
    validate_resource_limits

    # Generate fixes if requested
    if [ "$FIX" = true ]; then
        generate_fixes
    fi

    # Export variables if requested
    if [ "$EXPORT" = true ]; then
        export_variables
    fi

    # Print summary
    print_header "Validation Summary"

    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""

    # Determine exit code
    if [ "$STRICT" = true ] && [ "$WARNINGS" -gt 0 ]; then
        log_error "Validation failed (strict mode: warnings treated as errors)"
        exit 1
    elif [ "$ERRORS" -gt 0 ]; then
        log_error "Validation failed with $ERRORS error(s)"
        exit 1
    else
        log_success "All validations passed!"
        exit 0
    fi
}

# Run main function
main "$@"
