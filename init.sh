#!/bin/bash
# ============================================================================
# Vibe Stack - Initialization Script (Self-Healing)
# ============================================================================
# First-time setup automation with intelligent error detection and recovery.
# Automatically fixes common issues and provides exact solutions for problems.
#
# Usage: ./init.sh [--skip-interactive]
#
# Options:
#   --skip-interactive  Use default values without prompting
# ============================================================================

# Strict mode: Exit on error, undefined variables, and pipe failures
set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SKIP_INTERACTIVE="${1:-}"

# Source common library
source "${SCRIPT_DIR}/lib/common.sh"

# ============================================================================
# LOGGING FUNCTIONS (EXTENSIONS)
# ============================================================================

# Custom step logging for setup process
log_step() {
    log_section "$1"
}

# Custom fix logging for self-healing
log_fix() {
    log_recommendation "$1"
}

# ============================================================================
# SELF-HEALING: Port Conflict Detection
# ============================================================================

detect_port_conflict() {
    local port="$1"
    local service_name="$2"

    # Try different methods to detect port usage
    local pid=""
    local process_name=""

    # Method 1: lsof (Linux/macOS)
    if command -v lsof >/dev/null 2>&1; then
        if lsof -i ":${port}" >/dev/null 2>&1; then
            pid=$(lsof -t -i ":${port}" 2>/dev/null | head -1)
            process_name=$(ps -p "${pid}" -o comm= 2>/dev/null || echo "unknown")
        fi
    # Method 2: netstat (Linux)
    elif command -v netstat >/dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | grep -q ":${port} "; then
            pid=$(netstat -tulnp 2>/dev/null | grep ":${port}" | awk '{print $7}' | cut -d'/' -f1 | head -1)
            process_name=$(netstat -tulnp 2>/dev/null | grep ":${port}" | awk '{print $7}' | cut -d'/' -f2 | head -1)
        fi
    # Method 3: ss (Linux, more modern)
    elif command -v ss >/dev/null 2>&1; then
        if ss -tulnp 2>/dev/null | grep -q ":${port} "; then
            pid=$(ss -tulnp 2>/dev/null | grep ":${port}" | awk '{print $6}' | cut -d',' -f2 | head -1)
            process_name=$(ss -tulnp 2>/dev/null | grep ":${port}" | awk '{print $7}' | head -1)
        fi
    fi

    if [[ -n "${pid}" ]]; then
        log_error "Port ${port} is already in use"
        echo ""
        log_fix "Port ${port} conflict detected for ${service_name}"
        echo ""
        echo -e "${CYAN}Details:${NC}"
        echo "  Port:     ${port}"
        echo "  PID:      ${pid}"
        echo "  Process:  ${process_name}"
        echo ""
        echo -e "${YELLOW}Solutions (choose one):${NC}"
        echo "  1. Kill the conflicting process:"
        echo "     ${MAGENTA}kill ${pid}${NC}"
        echo ""
        echo "  2. Stop the conflicting service:"
        echo "     ${MAGENTA}systemctl stop ${process_name}${NC}  # if systemd service"
        echo ""
        echo "  3. Change Vibe Stack port in .env:"
        echo "     ${MAGENTA}echo '${service_name^^}_PORT=${port}1' >> .env${NC}"
        echo ""

        if [[ -z "$SKIP_INTERACTIVE" ]]; then
            read -p "Kill process ${pid} now? [y/N] " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                kill "${pid}" 2>/dev/null || log_warning "Could not kill process (try sudo)"
                sleep 1
                if lsof -i ":${port}" >/dev/null 2>&1 || ss -tulnp 2>/dev/null | grep -q ":${port} "; then
                    log_error "Port still in use. Please resolve manually."
                    return 1
                else
                    log_success "Port ${port} is now available"
                    return 0
                fi
            else
                log_info "Please resolve the port conflict manually and re-run init.sh"
                return 1
            fi
        else
            log_info "Skipping interactive mode. Please resolve port conflict manually."
            return 1
        fi
    fi

    return 0
}

# ============================================================================
# SELF-HEALING: Docker Daemon Check
# ============================================================================

check_docker_daemon() {
    log_step "Checking Docker daemon..."

    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        echo ""
        log_fix "Docker daemon not detected"
        echo ""
        echo -e "${CYAN}Solutions:${NC}"

        # Detect OS and provide specific instructions
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  1. Start Docker Desktop from Applications"
            echo "  2. Or run: ${MAGENTA}open -a Docker${NC}"
        elif [[ -f /etc/systemd/system/docker.service ]] || systemctl list-unit-files | grep -q docker; then
            echo "  1. Start Docker service:"
            echo "     ${MAGENTA}sudo systemctl start docker${NC}"
            echo "  2. Enable on boot:"
            echo "     ${MAGENTA}sudo systemctl enable docker${NC}"
        else
            echo "  1. Start Docker daemon:"
            echo "     ${MAGENTA}sudo dockerd &${NC}"
            echo "  2. Or install Docker Desktop:"
            echo "     ${MAGENTA}https://docs.docker.com/get-docker/${NC}"
        fi
        echo ""

        if [[ -z "$SKIP_INTERACTIVE" ]]; then
            read -p "Try starting Docker automatically? [y/N] " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    open -a Docker
                    log_info "Docker Desktop starting... (wait 10 seconds)"
                    sleep 10
                elif command -v systemctl >/dev/null 2>&1; then
                    sudo systemctl start docker
                    log_success "Docker service started"
                fi

                if docker info >/dev/null 2>&1; then
                    log_success "Docker is now running"
                    return 0
                else
                    log_error "Docker still not running. Please start manually."
                    return 1
                fi
            else
                return 1
            fi
        else
            return 1
        fi
    fi

    log_success "Docker daemon is running"
    return 0
}

# ============================================================================
# SELF-HEALING: Image Pull with Retry
# ============================================================================

pull_images_with_retry() {
    log_step "Pre-pulling Docker images (this may take a while)..."

    local images_failed=()
    local max_retries=3

    for ((attempt=1; attempt<=max_retries; attempt++)); do
        log_info "Pull attempt ${attempt}/${max_retries}..."

        if docker-compose pull 2>/dev/null; then
            log_success "All images pulled successfully"
            return 0
        fi

        # Detect specific failure reasons
        log_warning "Image pull failed on attempt ${attempt}"

        # Check for common issues
        if ! docker info >/dev/null 2>&1; then
            log_fix "Docker daemon stopped during pull"
            if check_docker_daemon; then
                continue
            fi
        fi

        # Check network connectivity
        if ! ping -c 1 hub.docker.com >/dev/null 2>&1; then
            log_fix "Network connectivity issue detected"
            echo ""
            echo -e "${CYAN}Possible issues:${NC}"
            echo "  • No internet connection"
            echo "  • Firewall blocking Docker Hub"
            echo "  • DNS resolution failure"
            echo ""
            echo -e "${YELLOW}Solutions:${NC}"
            echo "  1. Check internet connection"
            echo "  2. Try using VPN if in restricted region"
            echo "  3. Configure Docker mirror:"
            echo "     ${MAGENTA}echo '{\"registry-mirrors\":[\"https://mirror.gcr.io\"]}' | sudo tee /etc/docker/daemon.json${NC}"
            echo "     ${MAGENTA}sudo systemctl restart docker${NC}"
            echo ""

            if [[ -z "$SKIP_INTERACTIVE" ]]; then
                read -p "Continue anyway (services may fail to start)? [y/N] " -n 1 -r
                echo ""
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    return 1
                fi
            fi
        fi

        if [[ $attempt -lt $max_retries ]]; then
            log_info "Retrying in 5 seconds..."
            sleep 5
        fi
    done

    log_error "Failed to pull images after ${max_retries} attempts"
    echo ""
    log_fix "Image pull failed"
    echo ""
    echo -e "${YELLOW}Manual recovery steps:${NC}"
    echo "  1. Check your internet connection"
    echo "  2. Verify Docker Hub is accessible:"
    echo "     ${MAGENTA}curl -I https://hub.docker.com${NC}"
    echo "  3. Try pulling manually:"
    echo "     ${MAGENTA}docker pull node:20-slim${NC}"
    echo "     ${MAGENTA}docker pull codercom/code-server:latest${NC}"
    echo "  4. If successful, run: ${MAGENTA}make up${NC}"
    echo ""

    if [[ -z "$SKIP_INTERACTIVE" ]]; then
        read -p "Continue without pre-pulling? [y/N] " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_warning "Services will pull images on first start (may be slow)"
            return 0
        fi
    fi

    return 1
}

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

check_prerequisites() {
    log_step "Checking prerequisites..."

    local missing=()

    # Check for Docker
    if ! command -v docker >/dev/null 2>&1; then
        missing+=("docker")
    else
        log_success "Docker installed: $(docker --version | head -n1)"
    fi

    # Check for Docker Compose (v1 or v2)
    local compose_cmd=""
    if command -v docker-compose >/dev/null 2>&1; then
        compose_cmd="docker-compose"
        log_success "Docker Compose installed: $(docker-compose --version | head -n1)"
    elif docker compose version >/dev/null 2>&1; then
        compose_cmd="docker compose"
        log_success "Docker Compose (v2) installed: $(docker compose version | head -n1)"
    else
        missing+=("docker-compose or docker compose v2")
    fi

    # Check for Git
    if ! command -v git >/dev/null 2>&1; then
        missing+=("git")
    else
        log_success "Git installed: $(git --version | head -n1)"
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing prerequisites: ${missing[*]}"
        echo ""
        log_fix "Install missing tools"
        echo ""
        echo -e "${CYAN}Installation commands:${NC}"

        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  brew install ${missing[*]}"
        elif command -v apt-get >/dev/null 2>&1; then
            echo "  sudo apt-get update && sudo apt-get install -y ${missing[*]}"
        elif command -v yum >/dev/null 2>&1; then
            echo "  sudo yum install -y ${missing[*]}"
        elif command -v pacman >/dev/null 2>&1; then
            echo "  sudo pacman -S ${missing[*]}"
        fi
        echo ""
        return 1
    fi

    # Check Docker daemon
    if ! check_docker_daemon; then
        return 1
    fi

    echo ""
    return 0
}

check_port_availability() {
    log_step "Checking port availability..."

    local ports_in_use=()
    local has_conflict=0

    # Check Vibe-Kanban port (4000)
    if ! detect_port_conflict 4000 "Vibe-Kanban"; then
        has_conflict=1
    fi

    # Check code-server port (8443)
    if ! detect_port_conflict 8443 "code-server"; then
        has_conflict=1
    fi

    if [[ $has_conflict -eq 0 ]]; then
        log_success "All required ports are available"
    fi

    echo ""
    return $has_conflict
}

# ============================================================================
# SETUP FUNCTIONS
# ============================================================================

setup_env_file() {
    log_step "Setting up environment file..."

    if [[ -f "${SCRIPT_DIR}/.env" ]]; then
        log_warning ".env already exists"
        if [[ -z "$SKIP_INTERACTIVE" ]]; then
            read -p "Overwrite existing .env? [y/N] " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Skipping .env creation"
                echo ""
                return
            fi
        else
            log_info "Skipping .env creation (interactive mode disabled)"
            echo ""
            return
        fi
    fi

    cp "${SCRIPT_DIR}/.env.example" "${SCRIPT_DIR}/.env"

    # Generate secure password if not set
    if [[ -z "$SKIP_INTERACTIVE" ]]; then
        log_info "Created .env with default configuration"
        log_warning "IMPORTANT: Change the default password in .env!"
    else
        # Generate random password for non-interactive mode
        local random_password
        random_password=$(openssl rand -base64 16 2>/dev/null || echo "change-me-$(date +%s)")
        sed -i.bak "s/your-secure-password-here/${random_password}/" "${SCRIPT_DIR}/.env"
        rm -f "${SCRIPT_DIR}/.env.bak"
        log_success "Generated secure password (check .env)"
    fi

    log_success "Created .env from template"
    echo ""
}

setup_claude_config() {
    log_step "Setting up Claude Code configuration..."

    local claude_dir="${SCRIPT_DIR}/agents/claude"

    if [[ -f "${claude_dir}/settings.json" ]]; then
        log_warning "Claude settings already exist"
        if [[ -z "$SKIP_INTERACTIVE" ]]; then
            read -p "Overwrite existing Claude settings? [y/N] " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Skipping Claude configuration"
                echo ""
                return
            fi
        else
            log_info "Skipping Claude configuration (interactive mode disabled)"
            echo ""
            return
        fi
    fi

    mkdir -p "${claude_dir}"
    cp "${claude_dir}/settings.json.example" "${claude_dir}/settings.json"

    log_success "Created Claude settings from template"
    log_warning "Don't forget to add your API key to agents/claude/settings.json"
    echo ""
}

setup_script_permissions() {
    log_step "Setting script permissions..."

    local scripts=("dev-server.sh" "init.sh")
    local made_executable=()

    for script in "${scripts[@]}"; do
        local script_path="${SCRIPT_DIR}/${script}"
        if [[ -f "$script_path" ]]; then
            if chmod +x "$script_path" 2>/dev/null; then
                made_executable+=("$script")
            fi
        fi
    done

    if [[ ${#made_executable[@]} -gt 0 ]]; then
        log_success "Made executable: ${made_executable[*]}"
    else
        log_info "No script permissions to update"
    fi

    echo ""
}

setup_directories() {
    log_step "Creating directory structure..."

    local dirs=(
        "repos"
        "secrets"
        "agents/claude"
    )

    for dir in "${dirs[@]}"; do
        local full_path="${SCRIPT_DIR}/${dir}"
        if [[ ! -d "$full_path" ]]; then
            mkdir -p "$full_path"
            log_success "Created: ${dir}/"
        fi
    done

    # Create example project secrets directory
    if [[ ! -d "${SCRIPT_DIR}/secrets/your-project" ]]; then
        mkdir -p "${SCRIPT_DIR}/secrets/your-project"
        cat > "${SCRIPT_DIR}/secrets/your-project/example.env" << 'EOF'
# Example environment file for your project
# Copy this to .env.development and .env.production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# API Keys
API_KEY=your-api-key-here
SECRET_KEY=your-secret-key-here

# Server
PORT=3000
NODE_ENV=development
EOF
        log_success "Created: secrets/your-project/"
    fi

    echo ""
}

verify_gitignore() {
    log_step "Verifying .gitignore configuration..."

    local sensitive_files=(".env" ".claude/" "secrets/*")
    local missing_excludes=()

    for file in "${sensitive_files[@]}"; do
        if ! grep -qF "$file" "${SCRIPT_DIR}/.gitignore" 2>/dev/null; then
            missing_excludes+=("$file")
        fi
    done

    if [[ ${#missing_excludes[@]} -eq 0 ]]; then
        log_success ".gitignore properly configured"
    else
        log_warning "Missing .gitignore entries: ${missing_excludes[*]}"
    fi

    echo ""
}

# ============================================================================
# HEALTH CHECK AFTER SETUP
# ============================================================================

verify_startup() {
    log_step "Verifying services can start..."

    log_info "Starting services in test mode..."

    # Try to start services
    if docker-compose up -d 2>/dev/null; then
        log_success "Services started successfully"

        # Wait a moment for health checks
        log_info "Waiting for health checks (15 seconds)..."
        sleep 15

        # Check container status
        local unhealthy_containers=()
        for container in vibe-server code-server; do
            if docker ps --filter "name=${container}" --format "{{.Health}}" | grep -q "healthy"; then
                log_success "${container}: healthy"
            elif docker ps --filter "name=${container}" --format "{{.Status}}" | grep -q "Up"; then
                log_warning "${container}: starting (may need more time)"
            else
                log_error "${container}: failed to start"
                unhealthy_containers+=("$container")
            fi
        done

        if [[ ${#unhealthy_containers[@]} -gt 0 ]]; then
            echo ""
            log_fix "Some containers failed to start"
            echo ""
            echo -e "${YELLOW}Troubleshooting:${NC}"
            echo "  1. Check logs: ${MAGENTA}docker-compose logs${NC}"
            echo "  2. Check individual service:"
            echo "     ${MAGENTA}docker logs vibe-server${NC}"
            echo "     ${MAGENTA}docker logs code-server${NC}"
            echo "  3. Restart services: ${MAGENTA}docker-compose restart${NC}"
            echo ""

            if [[ -z "$SKIP_INTERACTIVE" ]]; then
                read -p "Stop containers and exit setup? [Y/n] " -n 1 -r
                echo ""
                if [[ ! $REPLY =~ ^[Nn]$ ]]; then
                    docker-compose down
                    log_info "Containers stopped. Fix issues and run 'make up' to retry."
                    return 1
                fi
            fi
        else
            log_success "All services are running!"
            echo ""

            if [[ -z "$SKIP_INTERACTIVE" ]]; then
                read -p "Stop containers and complete setup? [Y/n] " -n 1 -r
                echo ""
                if [[ ! $REPLY =~ ^[Nn]$ ]]; then
                    docker-compose down
                    log_info "Containers stopped. Run 'make up' to start services."
                fi
            fi
        fi
    else
        log_error "Failed to start services"
        echo ""
        log_fix "Service startup failed"
        echo ""
        echo -e "${CYAN}Common issues:${NC}"
        echo "  1. Port conflicts (already checked, but may have changed)"
        echo "  2. Image pull failures (check your internet connection)"
        echo "  3. Volume permission issues (try 'sudo chown -R \$USER:\$USER repos/')"
        echo ""
        echo -e "${YELLOW}Manual check:${NC}"
        echo "  ${MAGENTA}docker-compose config${NC}    # Validate configuration"
        echo "  ${MAGENTA}docker-compose pull${NC}      # Pull images manually"
        echo "  ${MAGENTA}make doctor${NC}              # Run diagnostics"
        echo ""
        return 1
    fi

    echo ""
    return 0
}

# ============================================================================
# DISPLAY SUMMARY
# ============================================================================

display_summary() {
    log_header "Setup Complete!"

    echo -e "${GREEN}Your Vibe Stack environment is ready!${NC}"
    echo ""

    echo -e "${CYAN}Next Steps:$(NC)"
    echo ""
    echo -e "  ${BOLD}1. Configure your environment:${NC}"
    echo -e "     Edit ${YELLOW}.env${NC} to set your code-server password"
    echo -e "     Edit ${YELLOW}agents/claude/settings.json${NC} to add your Anthropic API key"
    echo ""
    echo -e "  ${BOLD}2. Start the services:${NC}"
    echo -e "     ${YELLOW}make up${NC}     or     ${YELLOW}docker-compose up -d${NC}"
    echo ""
    echo -e "  ${BOLD}3. Authenticate Claude Code (first time only):${NC}"
    echo -e "     ${YELLOW}make claude${NC}"
    echo ""
    echo -e "  ${BOLD}4. Access your services:${NC}"
    echo -e "     Vibe-Kanban:  ${BLUE}http://localhost:4000${NC}"
    echo -e "     VS Code:      ${BLUE}http://localhost:8443${NC}"
    echo -e "     Open WebUI:   ${BLUE}http://localhost:8081${NC}"
    echo ""
    echo -e "${CYAN}Quick Commands:$(NC)"
    echo -e "     ${YELLOW}make help${NC}    - Show all available commands"
    echo -e "     ${YELLOW}make doctor${NC}  - Run diagnostics"
    echo -e "     ${YELLOW}make logs${NC}    - View service logs"
    echo ""
    echo -e "${CYAN}Documentation:${NC}"
    echo -e "     README.md  - Main documentation"
    echo -e "     HELPER.md  - Command reference"
    echo ""
    echo -e "${MAGENTA}💡 Need help? Run 'make doctor' for diagnostics${NC}"
    echo ""

    if [[ -z "$SKIP_INTERACTIVE" ]]; then
        read -p "Start services now? [y/N] " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Starting services..."
            echo ""
            if command -v make >/dev/null 2>&1; then
                make up
            else
                docker-compose up -d
            fi
        fi
    fi
}

# ============================================================================
# STATE RESUMPTION (MEMORY SYSTEM)
# ============================================================================

check_state_resumption() {
    local state_file=".vibe-state.json"

    if [[ ! -f "$state_file" ]]; then
        return 0  # No state to resume
    fi

    log_header "Mission State Detected"

    # Parse state file
    if ! command -v jq >/dev/null 2>&1; then
        log_warning "jq not found - cannot parse state file"
        log_info "Install jq for state resumption support"
        return 0
    fi

    local mission_title
    local mission_status
    local current_step
    local step_name
    local percent_complete
    local last_branch

    mission_title=$(jq -r '.mission.title' "$state_file" 2>/dev/null || echo "Unknown")
    mission_status=$(jq -r '.mission.status' "$state_file" 2>/dev/null || echo "unknown")
    current_step=$(jq -r '.progress.current_step' "$state_file" 2>/dev/null || echo "?")
    step_name=$(jq -r '.progress.step_name' "$state_file" 2>/dev/null || echo "Unknown step")
    percent_complete=$(jq -r '.progress.percent_complete' "$state_file" 2>/dev/null || echo "0")
    last_branch=$(jq -r '.context.branch' "$state_file" 2>/dev/null || echo "none")

    echo ""
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  SYSTEM WAS INTERRUPTED DURING MISSION                    ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Mission:${NC} ${mission_title}"
    echo -e "${BOLD}Status:${NC} ${mission_status}"
    echo -e "${BOLD}Progress:${NC} Step ${current_step} - ${step_name}"
    echo -e "${BOLD}Complete:${NC} ${percent_complete}%"

    if [[ "$last_branch" != "null" ]] && [[ "$last_branch" != "none" ]]; then
        echo -e "${BOLD}Branch:${NC} ${last_branch}"
    fi

    echo ""
    echo -e "${CYAN}Pending Steps:${NC}"

    # Show pending steps
    jq -r '.steps_pending[]? | "  \(.step). \(.name) - \(.status)"' "$state_file" 2>/dev/null | while IFS= read -r step; do
        echo "$step"
    done

    echo ""
    echo -e "${CYAN}Resumption Options:${NC}"
    echo "  1. ${GREEN}Resume${NC}      - Continue from step ${current_step}"
    echo "  2. ${YELLOW}View Details${NC} - Show full mission state"
    echo "  3. ${RED}Abort${NC}        - Clear state and start fresh"
    echo ""

    if [[ -z "$SKIP_INTERACTIVE" ]]; then
        read -p "Choose an option [1/2/3]: " -n 1 -r
        echo ""

        case $REPLY in
            1)
                log_info "Resuming mission from step ${current_step}..."
                log_info "State file preserved for AI-assisted resumption"
                log_info "Use 'make state-resume' to continue the mission"
                ;;
            2)
                echo ""
                jq '.' "$state_file" 2>/dev/null || cat "$state_file"
                echo ""
                log_info "Review the state above, then run init.sh again to choose"
                exit 0
                ;;
            3)
                log_warning "Aborting mission..."
                rm -f "$state_file"
                log_success "State cleared"
                ;;
            *)
                log_info "No action taken - state preserved"
                ;;
        esac
    else
        log_info "State file preserved - use 'make state-resume' to continue"
    fi

    echo ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    log_header "Vibe Stack - Self-Healing Initialization"

    # Change to script directory
    cd "$SCRIPT_DIR" || exit 1

    # Check for mission state resumption FIRST (before any setup)
    check_state_resumption

    # Run setup steps with self-healing
    check_prerequisites || exit 1
    check_port_availability || exit 1
    setup_directories
    setup_env_file
    setup_claude_config
    setup_script_permissions
    verify_gitignore

    # Optional: Pre-pull images (with self-healing retry)
    if [[ -z "$SKIP_INTERACTIVE" ]]; then
        read -p "Pre-pull Docker images now? [Y/n] " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            pull_images_with_retry || log_warning "Continuing without pre-pull..."
        fi
    fi

    # Display summary
    display_summary
}

# Handle script interruption
trap 'echo ""; log_error "Setup interrupted"; exit 130' INT INT TERM

# Run main function
main "$@"
