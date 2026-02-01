#!/bin/bash
# ============================================================================
# Vibe Stack - Self-Evolution Engine
# ============================================================================
# Analyzes system health, resource usage, and image versions to generate
# intelligent recommendations for stack evolution and optimization.
#
# This script implements the "Self-Evolving Architect" pattern, where
# the system can monitor its own state and suggest improvements.
#
# Usage: ./evolve.sh [--auto-apply] [--verbose]
#
# Options:
#   --auto-apply    Automatically apply safe recommendations
#   --verbose       Show detailed analysis data
# ============================================================================

# Strict mode: Exit on error, undefined variables, and pipe failures
set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly AUTO_APPLY="${1:-}"
readonly VERBOSE="${2:-false}"

# Thresholds for recommendations
readonly CPU_WARNING_THRESHOLD=80      # Percentage
readonly MEMORY_WARNING_THRESHOLD=85    # Percentage
readonly HEALTH_FAILURE_THRESHOLD=3     # Consecutive failures

# ANSI color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'  # No Color

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

log_recommendation() {
    echo ""
    echo -e "${MAGENTA}  💡 RECOMMENDATION: ${*}${NC}"
}

log_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}  [DEBUG] ${*}${NC}"
    fi
}

# ============================================================================
# DATA COLLECTION
# ============================================================================

collect_health_status() {
    log_section "Collecting System Health..."

    local health_status="healthy"
    local unhealthy_services=()

    # Check container health
    for container in vibe-kanban code-server open-webui; do
        if docker ps --filter "name=${container}" --format "{{.Names}}" 2>/dev/null | grep -q "${container}"; then
            local container_health
            container_health=$(docker inspect -f '{{.State.Health.Status}}' "${container}" 2>/dev/null || "unknown")

            if [[ "$container_health" == "healthy" ]]; then
                log_success "${container}: healthy"
            else
                log_warning "${container}: ${container_health}"
                unhealthy_services+=("${container}: ${container_health}")
                health_status="degraded"
            fi
        else
            log_warning "${container}: not running"
            unhealthy_services+=("${container}: not running")
            health_status="unhealthy"
        fi
    done

    echo "$health_status"
}

collect_resource_usage() {
    log_section "Collecting Resource Usage..."

    local recommendations=0

    # Get stats for all vibe containers (output to stderr to not interfere with return value)
    local stats_output
    stats_output=$(docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" vibe-kanban code-server open-webui 2>/dev/null || echo "")

    if [[ -n "$stats_output" ]]; then
        echo "$stats_output" >&2
    fi

    # Analyze each container
    for container in vibe-kanban code-server open-webui; do
        if docker ps --filter "name=${container}" 2>/dev/null | grep -q "${container}"; then
            # Get CPU and Memory usage
            local cpu_mem
            cpu_mem=$(docker stats --no-stream --format "{{.CPUPerc}}\t{{.MemPerc}}" "${container}" 2>/dev/null || "")

            local cpu_usage
            local mem_usage

            # Parse CPU percentage (remove % and convert to integer)
            cpu_usage=$(echo "$cpu_mem" | awk '{print $1}' | sed 's/%//' | cut -d'.' -f1)
            # Parse memory percentage (convert to integer)
            mem_usage=$(echo "$cpu_mem" | awk '{print $2}' | sed 's/%//' | cut -d'.' -f1)

            # Check thresholds (using integer comparison)
            if [[ -n "$cpu_usage" ]] && [[ "$cpu_usage" -gt $CPU_WARNING_THRESHOLD ]]; then
                log_warning "${container}: CPU usage at ${cpu_usage}%"
                log_recommendation "Consider increasing CPU limit for ${container}"
                ((recommendations++))
            fi

            if [[ -n "$mem_usage" ]] && [[ "$mem_usage" -gt $MEMORY_WARNING_THRESHOLD ]]; then
                log_warning "${container}: Memory usage at ${mem_usage}%"
                log_recommendation "Consider increasing memory limit for ${container}"
                ((recommendations++))
            fi
        fi
    done

    return $recommendations
}

collect_image_versions() {
    log_section "Analyzing Image Versions..."

    local has_updates=false
    local update_recommendations=()

    # Get current image digests
    local node_digest code_server_digest

    node_digest=$(docker images --format "{{.ID}}" node:20-slim 2>/dev/null | head -1 || echo "none")
    code_server_digest=$(docker images --format "{{.ID}}" codercom/code-server:latest 2>/dev/null | head -1 || echo "none")

    if [[ "$VERBOSE" == "true" ]]; then
        log_info "Current node:20-slim digest: ${node_digest}"
        log_info "Current code-server:latest digest: ${code_server_digest}"
    fi

    # Check version log for previous versions
    if [[ -f "${SCRIPT_DIR}/.vibe-versions.log" ]]; then
        local last_node_digest
        local last_code_server_digest

        last_node_digest=$(grep "node.*20-slim" "${SCRIPT_DIR}/.vibe-versions.log" 2>/dev/null | tail -1 | awk -F '|' '{print $2}' | xargs || echo "")
        last_code_server_digest=$(grep "code-server.*latest" "${SCRIPT_DIR}/.vibe-versions.log" 2>/dev/null | tail -1 | awk -F '|' '{print $2}' | xargs || echo "")

        if [[ "$VERBOSE" == "true" ]]; then
            log_info "Last node:20-slim digest: ${last_node_digest}"
            log_info "Last code-server digest: ${last_code_server_digest}"
        fi

        # Check for changes
        if [[ -n "$node_digest" ]] && [[ "$node_digest" != "none" ]] && [[ "$node_digest" != "$last_node_digest" ]]; then
            log_warning "node:20-slim image has been updated"
            update_recommendations+=("node:20-slim: Image digest changed from ${last_node_digest:0:12}... to ${node_digest:0:12}...")
            has_updates=true
        fi

        if [[ -n "$code_server_digest" ]] && [[ "$code_server_digest" != "none" ]] && [[ "$code_server_digest" != "$last_code_server_digest" ]]; then
            log_warning "code-server:latest image has been updated"
            update_recommendations+=("code-server:latest: Image digest changed from ${last_code_server_digest:0:12}... to ${code_server_digest:0:12}...")
            has_updates=true
        fi
    else
        log_info "No version history found (first run)"
    fi

    # Display recommendations
    if [[ ${#update_recommendations[@]} -gt 0 ]]; then
        echo ""
        log_warning "Image Updates Detected:"
        for rec in "${update_recommendations[@]}"; do
            echo "  • $rec"
        done
        echo ""
        log_recommendation "Review image updates and check for breaking changes"
        log_info "Use 'make versions' for detailed version history"
        log_info "Use 'make rollback' if issues occur after update"
    fi

    return 0
}

collect_configuration_audit() {
    log_section "Auditing Configuration..."

    local issues=0

    # Check .env file
    if [[ ! -f "${SCRIPT_DIR}/.env" ]]; then
        log_warning ".env file missing"
        ((issues++))
    fi

    # Check Claude configuration
    if [[ ! -f "${SCRIPT_DIR}/agents/claude/settings.json" ]]; then
        log_warning "Claude configuration missing"
        ((issues++))
    else
        # Validate API key format if Claude is configured
        if grep -q "sk-ant-" "${SCRIPT_DIR}/agents/claude/settings.json" 2>/dev/null; then
            log_success "Claude API key format valid"
        elif grep -q "\"env\":" "${SCRIPT_DIR}/agents/claude/settings.json" 2>/dev/null; then
            log_warning "Claude API key not configured or invalid format"
            ((issues++))
        fi
    fi

    # Check docker-compose.yml syntax
    if ! docker compose -f "${SCRIPT_DIR}/docker-compose.yml" config >/dev/null 2>&1; then
        log_error "docker-compose.yml syntax error"
        ((issues++))
    else
        log_success "docker-compose.yml syntax valid"
    fi

    return $issues
}

# ============================================================================
# EVOLUTION PROPOSAL GENERATOR
# ============================================================================

generate_evolution_proposal() {
    local health_status="$1"
    local resource_issues="$2"
    local has_updates="$3"
    local config_issues="$4"

    log_header "System Evolution Proposal"

    # Overall system health
    echo -e "${BOLD}System Health Assessment:${NC}"
    case "$health_status" in
        healthy)
            echo -e "  ${GREEN}● All systems operational${NC}"
            ;;
        degraded)
            echo -e "  ${YELLOW}● Some services degraded${NC}"
            ;;
        unhealthy)
            echo -e "  ${RED}● System unhealthy - requires attention${NC}"
            ;;
    esac
    echo ""

    # Resource recommendations
    echo -e "${BOLD}Resource Optimization:${NC}"
    if [[ $resource_issues -gt 0 ]]; then
        echo -e "  ${YELLOW}⚠ ${resource_issues} resource concerns detected${NC}"
        echo ""
        echo "  Recommended Actions:"
        echo "    • Review container resource usage"
        echo "    • Consider adjusting limits in docker-compose.yml"
        echo "    • Use 'make stats' for detailed monitoring"
    else
        echo -e "  ${GREEN}✓ Resource usage within acceptable limits${NC}"
    fi
    echo ""

    # Image update status
    echo -e "${BOLD}Image Update Status:${NC}"
    if [[ "$has_updates" == "true" ]]; then
        echo -e "  ${YELLOW}⚠ New images detected${NC}"
        echo ""
        echo "  Recommended Actions:"
        echo "    • Review 'make versions' output for digest changes"
        echo "    • Test services: 'make up && make health'"
        echo "    • Monitor logs: 'make watch-logs'"
        echo "    • Rollback if needed: 'make rollback'"
    else
        echo -e "  ${GREEN}✓ Images up to date${NC}"
    fi
    echo ""

    # Configuration audit
    echo -e "${BOLD}Configuration Status:${NC}"
    if [[ $config_issues -gt 0 ]]; then
        echo -e "  ${YELLOW}⚠ ${config_issues} configuration issues${NC}"
        echo ""
        echo "  Recommended Actions:"
        echo "    • Run 'make setup' to initialize configuration"
        echo "    • Review .env and agents/claude/settings.json"
    else
        echo -e "  ${GREEN}✓ Configuration valid${NC}"
    fi
    echo ""

    # Summary score
    local total_issues=$((resource_issues + config_issues))
    if [[ "$health_status" == "degraded" ]]; then
        ((total_issues++))
    elif [[ "$health_status" == "unhealthy" ]]; then
        ((total_issues += 2))
    fi

    echo -e "${BOLD}Evolution Score:${NC}"
    if [[ $total_issues -eq 0 ]]; then
        echo -e "  ${GREEN}🌟 System Optimal - No evolution needed${NC}"
    elif [[ $total_issues -le 2 ]]; then
        echo -e "  ${YELLOW}⚠ ${total_issues} minor improvement(s) recommended${NC}"
    else
        echo -e "  ${RED}🔴 ${total_issues} issue(s) require attention${NC}"
    fi
    echo ""
}

# ============================================================================
# AUTO-APPLY FUNCTION (SAFE RECOMMENDATIONS ONLY)
# ============================================================================

apply_safe_recommendations() {
    local resource_issues="$1"

    if [[ $resource_issues -eq 0 ]]; then
        log_info "No auto-apply actions needed"
        return 0
    fi

    log_section "Auto-Applying Safe Recommendations..."

    # Check and recreate .env if missing
    if [[ ! -f "${SCRIPT_DIR}/.env" ]] && [[ -f "${SCRIPT_DIR}/.env.example" ]]; then
        log_info "Creating .env from .env.example..."
        cp "${SCRIPT_DIR}/.env.example" "${SCRIPT_DIR}/.env"
        log_success "Created .env"
    fi

    # Log version snapshot
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Evolution Analysis Run" >> "${SCRIPT_DIR}/.vibe-versions.log"

    log_success "Safe recommendations applied"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    log_header "Vibe Stack - Self-Evolution Engine"

    # Change to script directory
    cd "$SCRIPT_DIR" || exit 1

    # Run analysis
    local health_status
    local resource_issues
    local has_updates=false
    local config_issues

    health_status=$(collect_health_status)
    collect_resource_usage; resource_issues=$?
    collect_image_versions || has_updates=true
    collect_configuration_audit; config_issues=$?

    # Generate proposal
    generate_evolution_proposal "$health_status" "$resource_issues" "$has_updates" "$config_issues"

    # Auto-apply safe recommendations if requested
    if [[ "$AUTO_APPLY" == "--auto-apply" ]]; then
        apply_safe_recommendations "$resource_issues"
    fi

    # Next steps
    echo -e "${CYAN}Next Steps:${NC}"
    echo "  • Review recommendations above"
    echo "  • Run 'make doctor' for detailed diagnostics"
    echo "  • Run 'make watch-logs' to monitor for errors"
    echo "  • Run 'make up' to restart with new configuration"

    # Exit with error code if issues found
    if [[ $config_issues -gt 0 ]]; then
        exit 1
    fi
}

# Handle script interruption
trap 'echo ""; log_error "Evolution analysis interrupted"; exit 130' INT

# Run main function
main "$@"
