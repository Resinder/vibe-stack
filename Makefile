# ============================================================================
# Vibe Stack - Makefile
# ============================================================================
# Developer Experience Automation for Docker-based AI Development Environment
#
# Image Strategy: :latest tags with enhanced health monitoring
# Version Tracking: Automatic digest logging and rollback capability
#
# Usage:
#   make setup    - First-time setup
#   make up       - Start all services
#   make down     - Stop all services
#   make logs     - View logs
#   make help     - Show all available commands
# ============================================================================

# Colors for output
BLUE  := \033[0;34m
GREEN := \033[0;32m
YELLOW:= \033[1;33m
RED   := \033[0;31m
CYAN  := \033[0;36m
MAGENTA:= \033[0;35m
NC    := \033[0m # No Color

# Docker Compose command (use docker-compose v2 or fallback to v1)
DOCKER_COMPOSE := $(shell command -v docker-compose 2>/dev/null || echo "docker compose")

# Version tracking file
VERSION_LOG := .vibe-versions.log

# Default target
.DEFAULT_GOAL := help

# ============================================================================
# HELP TARGET
# ============================================================================
.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)  Vibe Stack - Developer Experience Commands$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(CYAN)Quick Start:$(NC)"
	@echo "  $(YELLOW)make setup$(NC)        First-time setup (install & configure)"
	@echo "  $(YELLOW)make up$(NC)           Start all services"
	@echo "  $(YELLOW)make down$(NC)         Stop all services"
	@echo ""
	@echo "$(CYAN)Service Management:$(NC)"
	@echo "  $(YELLOW)make restart$(NC)      Restart all services"
	@echo "  $(YELLOW)make ps$(NC)           Show running containers"
	@echo "  $(YELLOW)make status$(NC)       Detailed service status"
	@echo "  $(YELLOW)make watch$(NC)        Watch mode (auto-reload on file changes)"
	@echo ""
	@echo "$(CYAN)Logs & Monitoring:$(NC)"
	@echo "  $(YELLOW)make logs$(NC)         Follow all logs"
	@echo "  $(YELLOW)make logs-vibe$(NC)    Follow vibe-kanban logs"
	@echo "  $(YELLOW)make logs-code$(NC)    Follow code-server logs"
	@echo "  $(YELLOW)make stats$(NC)        Resource usage (CPU/Memory)"
	@echo ""
	@echo "$(CYAN)Container Access:$(NC)"
	@echo "  $(YELLOW)make shell-vibe$(NC)   Enter vibe-kanban container"
	@echo "  $(YELLOW)make shell-code$(NC)   Enter code-server container"
	@echo "  $(YELLOW)make claude$(NC)       Quick access to Claude Code CLI"
	@echo ""
	@echo "$(CYAN)Configuration:$(NC)"
	@echo "  $(YELLOW)make config$(NC)       Open configuration in editor"
	@echo "  $(YELLOW)make secrets$(NC)      List project secrets directories"
	@echo ""
	@echo "$(CYAN)Version Management:$(NC)"
	@echo "  $(YELLOW)make versions$(NC)     Show current image versions/digests"
	@echo "  $(YELLOW)make rollback$(NC)     Rollback to previous working version"
	@echo ""
	@echo "$(CYAN)Maintenance:$(NC)"
	@echo "  $(YELLOW)make clean$(NC)        Remove stopped containers"
	@echo "  $(YELLOW)make prune$(NC)        Remove unused Docker resources"
	@echo "  $(YELLOW)make reset$(NC)        Full reset (WARNING: deletes data)"
	@echo "  $(YELLOW)make update$(NC)       Pull latest images (logs before updating)"
	@echo ""
	@echo "$(CYAN)Development:$(NC)"
	@echo "  $(YELLOW)make build$(NC)        Rebuild containers (no cache)"
	@echo "  $(YELLOW)make dev$(NC)          Start with visible logs"
	@echo ""
	@echo "$(CYAN)Utilities:$(NC)"
	@echo "  $(YELLOW)make health$(NC)       Check service health"
	@echo "  $(YELLOW)make ports$(NC)        Show port bindings"
	@echo "  $(YELLOW)make doctor$(NC)       Full diagnostics check (with version tracking)"
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""

# ============================================================================
# VERSION TRACKING
# ============================================================================
.PHONY: log-versions
log-versions: ## Log current image versions (internal)
	@echo "$(CYAN)Logging current image versions...$(NC)"
	@echo "[$$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Image Version Check" >> $(VERSION_LOG)
	@echo "Node.js:" >> $(VERSION_LOG)
	@docker images --format "{{.Repository}}:{{.Tag}} | {{.ID}} | {{.CreatedAt}}" | grep "node.*20-slim" >> $(VERSION_LOG) 2>/dev/null || echo "  node:20-slim not found" >> $(VERSION_LOG)
	@echo "code-server:" >> $(VERSION_LOG)
	@docker images --format "{{.Repository}}:{{.Tag}} | {{.ID}} | {{.CreatedAt}}" | grep "code-server.*latest" >> $(VERSION_LOG) 2>/dev/null || echo "  code-server:latest not found" >> $(VERSION_LOG)
	@echo "" >> $(VERSION_LOG)
	@echo "$(GREEN)✓ Versions logged to $(VERSION_LOG)$(NC)"

.PHONY: versions
versions: ## Show current image versions and digests
	@echo "$(CYAN)Current Image Versions:$(NC)"
	@echo ""
	@echo "$(BLUE)node:20-slim$(NC)"
	@docker images --format "  Tag: {{.Tag}} | Digest: {{.ID}} | Created: {{.CreatedAt}}" | grep "node.*20-slim" | head -1 || echo "  $(YELLOW)Not pulled yet$(NC)"
	@echo ""
	@echo "$(BLUE)codercom/code-server:latest$(NC)"
	@docker images --format "  Tag: {{.Tag}} | Digest: {{.ID}} | Created: {{.CreatedAt}}" | grep "code-server.*latest" | head -1 || echo "  $(YELLOW)Not pulled yet$(NC)"
	@echo ""
	@echo "$(CYAN)Version History ($(VERSION_LOG)):$(NC)"
	@tail -20 $(VERSION_LOG) 2>/dev/null || echo "  No version history yet"
	@echo ""

.PHONY: rollback
rollback: ## Rollback to previous working image version
	@echo "$(YELLOW)⚠ Rollback functionality$(NC)"
	@echo ""
	@echo "$(CYAN)Previous versions from log:$(NC)"
	@tail -10 $(VERSION_LOG) 2>/dev/null || echo "  No version history found"
	@echo ""
	@echo "$(YELLOW)Manual rollback steps:$(NC)"
	@echo "  1. Check $(VERSION_LOG) for previous working image digest"
	@echo "  2. Pull specific version: docker pull node:20-slim@<digest>"
	@echo "  3. Tag it: docker tag <digest> node:20-slim"
	@echo "  4. Restart: make restart"
	@echo ""
	@echo "$(RED)Note: Using :latest tags means automatic updates on pull.$(NC)"
	@echo "      To prevent automatic updates, pin specific versions in docker-compose.yml"

# ============================================================================
# SETUP TARGETS
# ============================================================================
.PHONY: setup
setup: ## First-time setup (install & configure)
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║  Vibe Stack - First-Time Setup                             ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(CYAN)Checking prerequisites...$(NC)"
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)Error: Docker is not installed$(NC)"; exit 1; }
	@command -v git >/dev/null 2>&1 || { echo "$(RED)Error: Git is not installed$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Prerequisites met$(NC)"
	@echo ""
	@echo "$(CYAN)Setting up environment files...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env && \
		echo "$(GREEN)✓ Created .env from .env.example$(NC)"; \
		echo "$(YELLOW)⚠ Edit .env to set your CODE_SERVER_PASSWORD$(NC)"; \
	else \
		echo "$(GREEN)✓ .env already exists$(NC)"; \
	fi
	@echo ""
	@echo "$(CYAN)Setting up Claude configuration...$(NC)"
	@if [ ! -f agents/claude/settings.json ]; then \
		cp agents/claude/settings.json.example agents/claude/settings.json && \
		echo "$(GREEN)✓ Created Claude settings from template$(NC)"; \
		echo "$(YELLOW)⚠ Edit agents/claude/settings.json to add your API key$(NC)"; \
	else \
		echo "$(GREEN)✓ Claude settings already exist$(NC)"; \
	fi
	@echo ""
	@echo "$(CYAN)Setting script permissions...$(NC)"
	@chmod +x dev-server.sh 2>/dev/null || echo "$(YELLOW)⚠ Could not set dev-server.sh as executable$(NC)"
	@chmod +x init.sh 2>/dev/null || echo "$(YELLOW)⚠ Could not set init.sh as executable$(NC)"
	@echo "$(GREEN)✓ Script permissions set$(NC)"
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║  Setup complete!                                            ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(CYAN)Next steps:$(NC)"
	@echo "  1. Edit $(YELLOW).env$(NC) to set your password"
	@echo "  2. Edit $(YELLOW)agents/claude/settings.json$(NC) to add your API key"
	@echo "  3. Run $(YELLOW)make up$(NC) to start all services"
	@echo "  4. Run $(YELLOW)make claude$(NC) to authenticate Claude Code (first time only)"
	@echo ""

# ============================================================================
# SERVICE MANAGEMENT TARGETS
# ============================================================================
.PHONY: up
up: ## Start all services in detached mode
	@echo "$(CYAN)Starting Vibe Stack services...$(NC)"
	@$(DOCKER_COMPOSE) up -d
	@$(MAKE) --no-print-directory log-versions
	@echo ""
	@echo "$(GREEN)✓ Services started$(NC)"
	@echo ""
	@echo "$(CYAN)Service URLs:$(NC)"
	@echo "  Vibe-Kanban:  $(BLUE)http://localhost:4000$(NC)"
	@echo "  VS Code:      $(BLUE)http://localhost:8443$(NC)"
	@echo ""
	@echo "$(CYAN)Waiting for health checks...$(NC)"
	@sleep 5
	@$(MAKE) --no-print-directory health

.PHONY: down
down: ## Stop all services
	@echo "$(CYAN)Stopping Vibe Stack services...$(NC)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ Services stopped$(NC)"

.PHONY: restart
restart: down up ## Restart all services

.PHONY: ps
ps: ## Show running containers
	@$(DOCKER_COMPOSE) ps

.PHONY: status
status: ## Detailed service status
	@echo "$(CYAN)Container Status:$(NC)"
	@docker ps --filter "name=vibe" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "$(CYAN)Health Status:$(NC)"
	@docker inspect -f '{{.Name}}: {{.State.Health.Status}}' vibe-server code-server 2>/dev/null || echo "Health check not available"

.PHONY: watch
watch: ## Enable watch mode (auto-reload on file changes)
	@echo "$(CYAN)Enabling watch mode (requires Docker Compose V2)...$(NC)"
	@$(DOCKER_COMPOSE) watch

# ============================================================================
# LOGS TARGETS
# ============================================================================
.PHONY: logs
logs: ## Follow all service logs
	@$(DOCKER_COMPOSE) logs -f

.PHONY: logs-vibe
logs-vibe: ## Follow vibe-kanban logs
	@$(DOCKER_COMPOSE) logs -f vibe-kanban

.PHONY: logs-code
logs-code: ## Follow code-server logs
	@$(DOCKER_COMPOSE) logs -f code-server

.PHONY: logs-tail
logs-tail: ## Show last 50 lines of all logs
	@$(DOCKER_COMPOSE) logs --tail 50

.PHONY: stats
stats: ## Show resource usage (CPU/Memory)
	@docker stats --no-stream vibe-server code-server

# ============================================================================
# CONTAINER ACCESS TARGETS
# ============================================================================
.PHONY: shell-vibe
shell-vibe: ## Enter vibe-kanban container shell
	@docker exec -it vibe-server bash

.PHONY: shell-code
shell-code: ## Enter code-server container shell
	@docker exec -it code-server bash

.PHONY: shell-root
shell-root: ## Enter vibe-kanban container as root
	@docker exec -it -u root vibe-server bash

.PHONY: claude
claude: ## Quick access to Claude Code CLI
	@echo "$(CYAN)Opening Claude Code...$(NC)"
	@docker exec -it vibe-server su - node -c "claude --dangerously-skip-permissions"

# ============================================================================
# CONFIGURATION TARGETS
# ============================================================================
.PHONY: config
config: ## Open configuration in default editor
	@echo "$(CYAN)Opening configuration files...$(NC)"
	@command -v code >/dev/null 2>&1 && code .env agents/claude/settings.json.example || \
	 command -v vim >/dev/null 2>&1 && vim .env || \
	 command -v nano >/dev/null 2>&1 && nano .env || \
	 echo "$(RED)No editor found. Please edit .env manually.$(NC)"

.PHONY: secrets
secrets: ## List project secrets directories
	@echo "$(CYAN)Project secrets structure:$(NC)"
	@ls -la secrets/ 2>/dev/null || echo "No secrets directory found"
	@echo ""
	@echo "$(CYAN)Usage:$(NC)"
	@echo "  mkdir -p secrets/my-project"
	@echo "  cp secrets/your-project/example.env secrets/my-project/.env.development"

# ============================================================================
# MAINTENANCE TARGETS
# ============================================================================
.PHONY: clean
clean: ## Remove stopped containers
	@echo "$(CYAN)Cleaning up stopped containers...$(NC)"
	@docker container prune -f
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

.PHONY: prune
prune: ## Remove unused Docker resources (images, networks, volumes)
	@echo "$(YELLOW)⚠ This will remove unused Docker resources$(NC)"
	@read -p "Continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker system prune -a --volumes -f; \
		echo "$(GREEN)✓ Prune complete$(NC)"; \
	else \
		echo "$(YELLOW)Aborted$(NC)"; \
	fi

.PHONY: reset
reset: ## Full reset (WARNING: deletes all data)
	@echo "$(RED)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(RED)║  WARNING: This will DELETE ALL DATA                        ║$(NC)"
	@echo "$(RED)║  This action cannot be undone!                              ║$(NC)"
	@echo "$(RED)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@read -p "Are you sure? [yes/NO] " -r; \
	echo; \
	if [[ $$REPLY == "yes" ]]; then \
		$(DOCKER_COMPOSE) down -v; \
		docker volume rm vibe-stack_vibe_config vibe-stack_vibe_data vibe-stack_code_server_data 2>/dev/null || true; \
		rm -f $(VERSION_LOG); \
		echo "$(GREEN)✓ Reset complete$(NC)"; \
		echo "$(YELLOW)Run 'make setup' to reinitialize$(NC)"; \
	else \
		echo "$(YELLOW)Aborted$(NC)"; \
	fi

.PHONY: update
update: ## Pull latest Docker images
	@echo "$(CYAN)Logging current versions before update...$(NC)"
	@$(MAKE) --no-print-directory log-versions
	@echo ""
	@echo "$(YELLOW)⚠ Using :latest tags - images will update to latest version$(NC)"
	@echo ""
	@echo "$(CYAN)Pulling latest images...$(NC)"
	@$(DOCKER_COMPOSE) pull
	@echo ""
	@echo "$(GREEN)✓ Images updated$(NC)"
	@echo ""
	@echo "$(CYAN)New versions:$(NC)"
	@$(DOCKER_COMPOSE) config | grep "image:" | sed 's/^[ ]*image: /  /'
	@echo ""
	@echo "$(CYAN)Run 'make up' to restart with new images$(NC)"
	@echo "$(CYAN)Run 'make versions' to see image digests$(NC)"

# ============================================================================
# DEVELOPMENT TARGETS
# ============================================================================
.PHONY: build
build: ## Rebuild containers without cache
	@echo "$(CYAN)Rebuilding containers...$(NC)"
	@$(DOCKER_COMPOSE) build --no-cache
	@echo "$(GREEN)✓ Build complete$(NC)"

.PHONY: dev
dev: ## Start services with visible logs
	@$(DOCKER_COMPOSE) up

# ============================================================================
# UTILITY TARGETS
# ============================================================================
.PHONY: health
health: ## Check service health
	@echo "$(CYAN)Checking service health...$(NC)"
	@echo ""
	@echo "$(BLUE)Vibe-Kanban (port 4000):$(NC)"
	@curl -sf http://localhost:4000/api/health >/dev/null 2>&1 && \
		echo "  $(GREEN)● Healthy$(NC)" || \
		echo "  $(YELLOW)● Starting/Unreachable$(NC)"
	@echo ""
	@echo "$(BLUE)Code-Server (port 8443):$(NC)"
	@curl -sf http://localhost:8443/health >/dev/null 2>&1 && \
		echo "  $(GREEN)● Healthy$(NC)" || \
		echo "  $(YELLOW)● Starting/Unreachable$(NC)"
	@echo ""

.PHONY: ports
ports: ## Show port bindings
	@echo "$(CYAN)Port bindings:$(NC)"
	@docker ps --filter "name=vibe" --format "table {{.Names}}\t{{.Ports}}"

.PHONY: doctor
doctor: ## Full diagnostics check with version tracking
	@echo "$(CYAN)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(CYAN)  Vibe Stack - Diagnostics$(NC)"
	@echo "$(CYAN)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(BLUE)Docker:$(NC)"
	@command -v docker >/dev/null 2>&1 && echo "  $(GREEN)✓$(NC) Installed: $$(docker --version)" || echo "  $(RED)✗$(NC) Not installed"
	@echo ""
	@echo "$(BLUE)Docker Compose:$(NC)"
	@command -v docker-compose >/dev/null 2>&1 && echo "  $(GREEN)✓$(NC) Installed: $$(docker-compose --version)" || echo "  $(YELLOW)⚠$(NC) Using 'docker compose' (v2)"
	@echo ""
	@echo "$(BLUE)Image Versions (Current):$(NC)"
	@docker images --format "  {{.Repository}}:{{.Tag}} | {{.ID}}" | grep -E "node.*20-slim|code-server.*latest" || echo "  $(YELLOW)No images pulled yet$(NC)"
	@echo ""
	@echo "$(BLUE)Configuration Files:$(NC)"
	@test -f .env && echo "  $(GREEN)✓$(NC) .env exists" || echo "  $(RED)✗$(NC) .env missing (run 'make setup')"
	@test -f agents/claude/settings.json && echo "  $(GREEN)✓$(NC) Claude settings exist" || echo "  $(YELLOW)⚠$(NC) Claude settings missing"
	@test -f docker-compose.yml && echo "  $(GREEN)✓$(NC) docker-compose.yml exists" || echo "  $(RED)✗$(NC) docker-compose.yml missing"
	@echo ""
	@echo "$(BLUE)Container Status:$(NC)"
	@docker ps --filter "name=vibe" --format "{{.Names}}: {{.Status}}" 2>/dev/null || echo "  $(YELLOW)⚠$(NC) No containers running"
	@echo ""
	@echo "$(BLUE)Container Health:$(NC)"
	@docker ps --filter "name=vibe" --format "{{.Names}}: {{.Health}}" 2>/dev/null | grep "healthy" >/dev/null && echo "  $(GREEN)✓$(NC) All containers healthy" || echo "  $(YELLOW)⚠$(NC) Some containers unhealthy or starting"
	@echo ""
	@echo "$(BLUE)Port Availability:$(NC)"
	@netstat -an 2>/dev/null | grep -q ":4000 " && echo "  $(YELLOW)⚠$(NC) Port 4000 in use" || echo "  $(GREEN)✓$(NC) Port 4000 available"
	@netstat -an 2>/dev/null | grep -q ":8443 " && echo "  $(YELLOW)⚠$(NC) Port 8443 in use" || echo "  $(GREEN)✓$(NC) Port 8443 available"
	@echo ""
	@echo "$(BLUE)Version Log:$(NC)"
	@test -f $(VERSION_LOG) && echo "  $(GREEN)✓$(NC) Version tracking enabled ($(VERSION_LOG))" || echo "  $(YELLOW)⚠$(NC) No version history yet"
	@echo ""
	@echo "$(CYAN)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(MAGENTA)💡 Run 'make versions' for detailed version history$(NC)"

# ============================================================================
# ACCESS TARGETS
# ============================================================================
.PHONY: open
open: ## Open services in default browser
	@echo "$(CYAN)Opening services...$(NC)"
	@command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:4000 && xdg-open http://localhost:8443 || \
	 command -v open >/dev/null 2>&1 && open http://localhost:4000 && open http://localhost:8443 || \
	 echo "$(YELLOW)Please open manually:$(NC)\n  http://localhost:4000\n  http://localhost:8443"

# ============================================================================
# VARIABLES EXPORT
# ============================================================================
.EXPORT_ALL_VARIABLES:
