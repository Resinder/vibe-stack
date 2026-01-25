#!/bin/bash
# ============================================================================
# Vibe Stack - Development Server Launcher
# ============================================================================
# Lightweight development server for Docker containerized projects.
# Automatically detects project type and starts appropriate dev server.
#
# Usage: dev-server.sh [project-name]
# Example: dev-server.sh my-react-app
#
# Environment Variables:
#   DEV_PORT    - Port to run server on (default: 3000)
#   DEV_HOST    - Host to bind to (default: 0.0.0.0)
# ============================================================================

# Strict mode: Exit on error, undefined variables, and pipe failures
set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PORT="${DEV_PORT:-3000}"
readonly HOST="${DEV_HOST:-0.0.0.0}"

# Source common library
source "${SCRIPT_DIR}/lib/common.sh"

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

# Check if required commands exist
check_dependencies() {
    local missing_deps=()

    for cmd in npm node npx; do
        if ! command -v "$cmd" &>/dev/null; then
            missing_deps+=("$cmd")
        fi
    done

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_error "Please install Node.js and npm to continue."
        exit 1
    fi
}

# Validate project directory exists
validate_project_dir() {
    local project_dir="$1"

    if [[ ! -d "$project_dir" ]]; then
        log_error "Project directory not found: $project_dir"
        return 1
    fi

    return 0
}

# ============================================================================
# PROJECT DETECTION
# ============================================================================

# Determine project directory and name
detect_project() {
    local project_name="$1"
    local project_dir

    if [[ -z "$project_name" ]]; then
        # No argument provided - use current directory
        project_dir="$(pwd)"
        project_name="$(basename "$project_dir")"
        log_info "No project specified, using current directory"
    else
        # Project name provided - construct path
        project_name="$1"
        project_dir="/repos/${project_name}"

        # Verify project exists
        if ! validate_project_dir "$project_dir"; then
            log_error "Project '${project_name}' not found"
            echo ""
            echo -e "${BLUE}Available projects in /repos:${NC}"
            ls -1 /repos/ 2>/dev/null || echo "No projects found"
            exit 1
        fi
    fi

    echo "$project_dir|$project_name"
}

# Detect Vibe Kanban worktree subdirectory
detect_worktree_subdir() {
    local project_dir="$1"

    # If no package.json or index.html, check for single subdirectory
    if [[ ! -f "${project_dir}/package.json" ]] && [[ ! -f "${project_dir}/index.html" ]]; then
        local subdir_count
        subdir_count=$(find "$project_dir" -maxdepth 1 -type d ! -name '.' | wc -l)

        if [[ "$subdir_count" -eq 1 ]]; then
            local subdir
            subdir=$(find "$project_dir" -maxdepth 1 -type d ! -name '.' -printf "%f")
            log_info "Detected Vibe Kanban worktree, entering: $subdir"
            echo "${project_dir}/${subdir}"
            return 0
        fi
    fi

    echo "$project_dir"
    return 0
}

# ============================================================================
# SERVER STARTUP
# ============================================================================

# Start development server based on project type
start_server() {
    local project_dir="$1"
    local project_name="$2"

    # Change to project directory
    cd "$project_dir" || exit 1

    # Display startup banner
    log_header "🚀 Dev Server"
    log_info "Project: ${project_name}"
    log_info "Path: ${project_dir}"
    log_info "Port: ${PORT}"
    echo ""

    # Check for package.json (Node.js project)
    if [[ -f "package.json" ]]; then
        start_nodejs_project
    # Check for index.html (static HTML project)
    elif [[ -f "index.html" ]]; then
        start_static_server "Single Page Application"
    # Fallback: generic file server
    else
        start_static_server "Generic file server"
    fi
}

# Start Node.js project (npm/yarn/pnpm)
start_nodejs_project() {
    log_success "Found package.json"

    # Install dependencies if node_modules missing
    if [[ ! -d "node_modules" ]]; then
        log_warning "Installing dependencies..."
        npm install
    fi

    # Detect and run appropriate script
    if grep -q '"dev"' package.json; then
        log_info "Running: npm run dev"
        npm run dev
    elif grep -q '"start"' package.json; then
        log_info "Running: npm start"
        npm start
    elif grep -q '"serve"' package.json; then
        log_info "Running: npm run serve"
        npm run serve
    elif grep -q '"preview"' package.json; then
        log_info "Running: npm run preview"
        npm run preview
    else
        log_warning "No dev script found, starting static server..."
        start_static_server "No dev script found"
    fi
}

# Start static file server
start_static_server() {
    local reason="${1:-Static files}"

    log_success "Found static files (${reason})"
    log_info "Starting static server on port ${PORT}..."

    # Use serve package if available, fallback to built-in tools
    if command -v serve &>/dev/null || npx -y serve --version &>/dev/null; then
        npx -y serve -l "$PORT" -s .
    elif command -v python3 &>/dev/null; then
        log_info "Using Python HTTP server..."
        python3 -m http.server "$PORT"
    elif command -v python &>/dev/null; then
        log_info "Using Python HTTP server..."
        python -m SimpleHTTPServer "$PORT"
    else
        log_error "No static file server available. Install 'serve' package:"
        log_error "  npm install -g serve"
        exit 1
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    local project_name="${1:-}"
    local detection_result
    local project_dir
    local final_project_name

    # Validate dependencies
    check_dependencies

    # Detect project directory and name
    detection_result=$(detect_project "$project_name")
    project_dir=$(echo "$detection_result" | cut -d'|' -f1)
    final_project_name=$(echo "$detection_result" | cut -d'|' -f2)

    # Detect Vibe Kanban worktree subdirectory
    project_dir=$(detect_worktree_subdir "$project_dir")
    final_project_name=$(basename "$project_dir")

    # Start the appropriate server
    start_server "$project_dir" "$final_project_name"
}

# Execute main function with all arguments
main "$@"
