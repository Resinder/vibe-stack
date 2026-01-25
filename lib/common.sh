#!/bin/bash
# ============================================================================
# Vibe Stack - Common Shell Library
# ============================================================================
# Shared functions and constants for all Vibe Stack shell scripts.
#
# Usage:
#   source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"
#
# This library provides:
#   - Consistent logging functions with colors
#   - Common validation functions
#   - Error handling utilities
#   - Docker utility functions
# ============================================================================

# Prevent multiple inclusion
[[ -n "${_VIBE_COMMON_LOADED:-}" ]] && return 0
 readonly _VIBE_COMMON_LOADED=true

# ============================================================================
# COLOR CONSTANTS (ANSI)
# ============================================================================

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

/**
 * Print a formatted header banner
 * @param {string} title - Header title
 */
log_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${MAGENTA}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

/**
 * Print a section header
 * @param {string} title - Section title
 */
log_section() {
    echo ""
    echo -e "${CYAN}▶ $1${NC}"
}

/**
 * Print an informational message
 * @param {string} message - Info message
 */
log_info() {
    echo -e "${CYAN}  ℹ ${*}${NC}"
}

/**
 * Print a success message
 * @param {string} message - Success message
 */
log_success() {
    echo -e "${GREEN}  ✓ ${*}${NC}"
}

/**
 * Print a warning message
 * @param {string} message - Warning message
 */
log_warning() {
    echo -e "${YELLOW}  ⚠ ${*}${NC}"
}

/**
 * Print an error message to stderr
 * @param {string} message - Error message
 */
log_error() {
    echo -e "${RED}  ✗ ${*}${NC}" >&2
}

/**
 * Print a recommendation/tip
 * @param {string} message - Recommendation message
 */
log_recommendation() {
    echo ""
    echo -e "${MAGENTA}  💡 RECOMMENDATION: ${*}${NC}"
}

/**
 * Print a debug message (only if VERBOSE is true)
 * @param {string} message - Debug message
 */
log_verbose() {
    if [[ "${VERBOSE:-false}" == "true" ]]; then
        echo -e "${BLUE}  [DEBUG] ${*}${NC}"
    fi
}

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

/**
 * Check if a command exists
 * @param {string} cmd - Command to check
 * @returns {boolean} True if command exists
 */
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

/**
 * Validate a port is available
 * @param {number} port - Port number to check
 * @returns {boolean} True if port is available
 */
is_port_available() {
    local port="$1"

    if command_exists lsof; then
        ! lsof -i ":${port}" >/dev/null 2>&1
    elif command_exists netstat; then
        ! netstat -tuln 2>/dev/null | grep -q ":${port} "
    elif command_exists ss; then
        ! ss -tulnp 2>/dev/null | grep -q ":${port} "
    else
        return 0  # Assume available if no tools
    fi
}

/**
 * Get process using a port
 * @param {number} port - Port number
 * @returns {string} Process info or empty string
 */
get_port_process() {
    local port="$1"

    if command_exists lsof; then
        lsof -i ":${port}" 2>/dev/null | tail -n +2
    elif command_exists ss; then
        ss -tulnp 2>/dev/null | grep ":${port} "
    elif command_exists netstat; then
        netstat -tulnp 2>/dev/null | grep ":${port} "
    fi
}

# ============================================================================
# DOCKER UTILITY FUNCTIONS
# ============================================================================

/**
 * Detect Docker Compose command (v1 or v2)
 * @returns {string} Docker Compose command to use
 */
detect_docker_compose() {
    if command_exists docker-compose; then
        echo "docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    else
        echo ""
    fi
}

/**
 * Check if Docker daemon is running
 * @returns {boolean} True if Docker is running
 */
is_docker_running() {
    docker info >/dev/null 2>&1
}

/**
 * Get container health status
 * @param {string} container - Container name
 * @returns {string} Health status (healthy, unhealthy, starting, or none)
 */
get_container_health() {
    local container="$1"

    if docker ps --filter "name=${container}" --format "{{.Names}}" 2>/dev/null | grep -q "${container}"; then
        docker inspect -f '{{.State.Health.Status}}' "${container}" 2>/dev/null || echo "no-healthcheck"
    else
        echo "not-running"
    fi
}

/**
 * Check if container is healthy
 * @param {string} container - Container name
 * @returns {boolean} True if container is healthy
 */
is_container_healthy() {
    [[ "$(get_container_health "$1")" == "healthy" ]]
}

# ============================================================================
# ERROR HANDLING
# ============================================================================

/**
 * Exit with error message
 * @param {string} message - Error message
 * @param {number} code - Exit code (default: 1)
 */
die() {
    log_error "$1"
    exit "${2:-1}"
}

/**
 * Print error and return failure
 * @param {string} message - Error message
 * @returns {number} Exit code 1
 */
fail() {
    log_error "$1"
    return 1
}

# ============================================================================
# USER INTERACTION
# ============================================================================

/**
 * Prompt user for yes/no confirmation
 * @param {string} prompt - Prompt message
 * @param {string} default - Default answer (Y or N)
 * @returns {boolean} True if user answered yes
 */
confirm() {
    local prompt="$1"
    local default="${2:-N}"

    if [[ "$default" == "Y" ]]; then
        prompt="$prompt [Y/n]"
    else
        prompt="$prompt [y/N]"
    fi

    read -p "  $prompt " -n 1 -r
    echo ""

    if [[ -z "$REPLY" ]]; then
        [[ "$default" == "Y" ]]
    else
        [[ "$REPLY" =~ ^[Yy]$ ]]
    fi
}

# ============================================================================
# STRING UTILITIES
# ============================================================================

/**
 * Trim whitespace from string
 * @param {string} str - Input string
 * @returns {string} Trimmed string
 */
trim() {
    local str="$1"
    str="${str#"${str%%[![:space:]]*}"}"   # Trim leading
    str="${str%"${str##*[![:space:]]}"}"   # Trim trailing
    echo "$str"
}

/**
 * Check if string is empty or whitespace
 * @param {string} str - Input string
 * @returns {boolean} True if empty
 */
is_empty() {
    [[ -z "$(trim "$1")" ]]
}

# ============================================================================
# FILE/DIRECTORY UTILITIES
# ============================================================================

/**
 * Get script directory (works with sourced scripts)
 * @returns {string} Absolute path to script directory
 */
get_script_dir() {
    cd "$(dirname "${BASH_SOURCE[1]}")" && pwd
}

/**
 * Ensure directory exists, create if not
 * @param {string} dir - Directory path
 */
ensure_dir() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        mkdir -p "$dir" || die "Failed to create directory: $dir"
    fi
}

# ============================================================================
# EXPORTED FUNCTIONS
# ============================================================================

# Export all functions for use in other scripts
export -f log_header
export -f log_section
export -f log_info
export -f log_success
export -f log_warning
export -f log_error
export -f log_recommendation
export -f log_verbose
export -f command_exists
export -f is_port_available
export -f get_port_process
export -f detect_docker_compose
export -f is_docker_running
export -f get_container_health
export -f is_container_healthy
export -f die
export -f fail
export -f confirm
export -f trim
export -f is_empty
export -f ensure_dir
export -f get_script_dir
