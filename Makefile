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
# Priority: docker-compose (v1) > docker compose (v2)
DOCKER_COMPOSE := $(shell command -v docker-compose 2>/dev/null || echo "docker compose")

# Verify Docker Compose is available
ifeq ($(words $(DOCKER_COMPOSE)), 0)
$(error Docker Compose not found. Please install Docker Compose v1 or v2)
endif

# Docker Compose version (for diagnostics)
DOCKER_COMPOSE_VERSION := $(shell $(DOCKER_COMPOSE) version --short 2>/dev/null || echo "unknown")

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
	@echo "  $(YELLOW)make logs-webui$(NC)   Follow open-webui logs"
	@echo "  $(YELLOW)make watch-logs$(NC)    Watch for errors/fatal events"
	@echo "  $(YELLOW)make stats$(NC)        Resource usage (CPU/Memory)"
	@echo ""
	@echo "$(CYAN)Container Access:$(NC)"
	@echo "  $(YELLOW)make shell-vibe$(NC)   Enter vibe-kanban container"
	@echo "  $(YELLOW)make shell-code$(NC)   Enter code-server container"
	@echo "  $(YELLOW)make claude$(NC)       Quick access to Claude Code CLI"
	@echo "  $(YELLOW)make webui$(NC)        Open Open WebUI in browser"
	@echo ""
	@echo "$(CYAN)Configuration:$(NC)"
	@echo "  $(YELLOW)make config$(NC)       Open configuration in editor"
	@echo "  $(YELLOW)make secrets$(NC)      List project secrets directories"
	@echo ""
	@echo "$(CYAN)Version Management:$(NC)"
	@echo "  $(YELLOW)make versions$(NC)     Show current image versions/digests"
	@echo "  $(YELLOW)make rollback$(NC)     Rollback to previous working version"
	@echo ""
	@echo "$(CYAN)System Evolution:$(NC)"
	@echo "  $(YELLOW)make evolve$(NC)      Run self-evolution analysis"
	@echo "  $(YELLOW)make test-harness$(NC) Run immune system validation"
	@echo "  $(YELLOW)make test$(NC)        Run all test suites"
	@echo "  $(YELLOW)make test-coverage$(NC) Run tests with coverage report"
	@echo "  $(YELLOW)make kanban-sync$(NC)  Sync system state with Kanban board"
	@echo "  $(YELLOW)make observer$(NC)     Open Observer Dashboard"
	@echo ""
	@echo "$(CYAN)AI Integration (Open WebUI + MCP):$(NC)"
	@echo "  $(YELLOW)make mcp-test$(NC)     Test MCP server connection"
	@echo "  $(YELLOW)make mcp-tools$(NC)    List available MCP tools"
	@echo "  $(YELLOW)make mcp-plan$(NC)     Generate task plan via AI"
	@echo "  $(YELLOW)make webui$(NC)        Open Open WebUI in browser"
	@echo ""
	@echo "$(CYAN)Mission State:$(NC)"
	@echo "  $(YELLOW)make state-show$(NC)   Show current mission state"
	@echo "  $(YELLOW)make state-clear$(NC)  Clear mission state"
	@echo "  $(YELLOW)make state-resume$(NC) Resume interrupted mission"
	@echo ""
	@echo "$(CYAN)Maintenance:$(NC)"
	@echo "  $(YELLOW)make clean$(NC)        Remove stopped containers"
	@echo "  $(YELLOW)make prune$(NC)        Remove unused Docker resources"
	@echo "  $(YELLOW)make reset$(NC)        Full reset (WARNING: deletes data)"
	@echo "  $(YELLOW)make update$(NC)       Orchestrated self-update with rolling restart"
	@echo ""
	@echo "$(CYAN)Development:$(NC)"
	@echo "  $(YELLOW)make build$(NC)        Rebuild containers (no cache)"
	@echo "  $(YELLOW)make dev$(NC)          Start with visible logs"
	@echo ""
	@echo "$(CYAN)Environments:$(NC)"
	@echo "  $(YELLOW)make dev-up$(NC)           Start development environment"
	@echo "  $(YELLOW)make dev-down$(NC)         Stop development environment"
	@echo "  $(YELLOW)make prod-up$(NC)          Start production environment"
	@echo "  $(YELLOW)make prod-down$(NC)        Stop production environment"
	@echo "  $(YELLOW)make up-monitoring$(NC)     Start monitoring stack"
	@echo "  $(YELLOW)make down-monitoring$(NC)   Stop monitoring stack"
	@echo ""
	@echo "$(CYAN)Code Quality:$(NC)"
	@echo "  $(YELLOW)make lint$(NC)         Run shell script linting (shellcheck)"
	@echo "  $(YELLOW)make lint-docker$(NC)  Validate docker-compose.yml"
	@echo "  $(YELLOW)make check-scripts$(NC) Check shell script syntax"
	@echo "  $(YELLOW)make code-quality$(NC) Run all code quality checks"
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
	@chmod +x scripts/setup/init.sh 2>/dev/null || echo "$(YELLOW)⚠ Could not set init.sh as executable$(NC)"
	@chmod +x scripts/ops/evolve.sh 2>/dev/null || echo "$(YELLOW)⚠ Could not set evolve.sh as executable$(NC)"
	@chmod +x scripts/ops/test-harness.sh 2>/dev/null || echo "$(YELLOW)⚠ Could not set test-harness.sh as executable$(NC)"
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
	@echo "  Open WebUI:   $(BLUE)http://localhost:8081$(NC)"
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

# ============================================================================
# ENVIRONMENT-SPECIFIC TARGETS
# ============================================================================
.PHONY: prod-up
prod-up: ## Start production environment
	@echo "$(CYAN)Starting production environment...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo ""
	@echo "$(GREEN)✓ Production environment started$(NC)"
	@echo ""
	@echo "$(CYAN)Production features:$(NC)"
	@echo "  • Resource limits enabled"
	@echo "  • Health checks active"
	@echo "  • Auto-restart enabled"
	@echo ""

.PHONY: prod-down
prod-down: ## Stop production environment
	@echo "$(CYAN)Stopping production environment...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml down
	@echo "$(GREEN)✓ Production environment stopped$(NC)"

.PHONY: up-monitoring
up-monitoring: ## Start monitoring stack (Prometheus + Grafana)
	@echo "$(CYAN)Starting monitoring stack...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.monitoring.yml up -d
	@echo ""
	@echo "$(GREEN)✓ Monitoring stack started$(NC)"
	@echo ""
	@echo "$(CYAN)Monitoring Services:$(NC)"
	@echo "  • Prometheus: http://localhost:9090"
	@echo "  • Grafana: http://localhost:3000 (admin/admin)"
	@echo "  • AlertManager: http://localhost:9093"
	@echo ""

.PHONY: down-monitoring
down-monitoring: ## Stop monitoring stack
	@echo "$(CYAN)Stopping monitoring stack...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.monitoring.yml down
	@echo "$(GREEN)✓ Monitoring stack stopped$(NC)"

.PHONY: ps
ps: ## Show running containers
	@$(DOCKER_COMPOSE) ps

.PHONY: status
status: ## Detailed service status
	@echo "$(CYAN)Container Status:$(NC)"
	@docker ps --filter "name=vibe" --filter "name=code-server" --filter "name=open-webui" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "$(CYAN)Health Status:$(NC)"
	@docker inspect -f '{{.Name}}: {{.State.Health.Status}}' vibe-kanban code-server open-webui 2>/dev/null || echo "Health check not available"

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

.PHONY: logs-webui
logs-webui: ## Follow open-webui logs
	@$(DOCKER_COMPOSE) logs -f open-webui

.PHONY: logs-tail
logs-tail: ## Show last 50 lines of all logs
	@$(DOCKER_COMPOSE) logs --tail 50

.PHONY: stats
stats: ## Show resource usage (CPU/Memory)
	@docker stats --no-stream vibe-kanban code-server open-webui

.PHONY: watch-logs
watch-logs: ## Watch logs for errors, fatal events, and failed health checks
	@echo "$(CYAN)Monitoring for critical events...$(NC)"
	@echo ""
	@echo "$(YELLOW)Watching for: Error | Fatal | Failed health check | WARN$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop$(NC)"
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@$(DOCKER_COMPOSE) logs -f 2>/dev/null | grep --line-buffered -E "ERROR|FATAL|Failed health check|WARN|error:|fatal:" || $(DOCKER_COMPOSE) logs -f

# ============================================================================
# CONTAINER ACCESS TARGETS
# ============================================================================
.PHONY: shell-vibe
shell-vibe: ## Enter vibe-kanban container shell
	@docker exec -it vibe-kanban bash

.PHONY: shell-code
shell-code: ## Enter code-server container shell
	@docker exec -it code-server bash

.PHONY: shell-root
shell-root: ## Enter vibe-kanban container as root
	@docker exec -it -u root vibe-kanban bash

.PHONY: claude
claude: ## Quick access to Claude Code CLI
	@echo "$(CYAN)Opening Claude Code...$(NC)"
	@docker exec -it vibe-kanban su - node -c "claude --dangerously-skip-permissions"

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
# SYSTEM EVOLUTION TARGETS
# ============================================================================
.PHONY: evolve
evolve: ## Run self-evolution analysis
	@echo "$(CYAN)Running Vibe Stack evolution analysis...$(NC)"
	@echo ""
	@if [ -f scripts/ops/evolve.sh ]; then \
		./scripts/ops/evolve.sh; \
	else \
		echo "$(RED)Error: evolve.sh not found$(NC)"; \
		echo "$(YELLOW)This script should be in scripts/ops/$(NC)"; \
		exit 1; \
	fi

.PHONY: test-harness
test-harness: ## Run immune system validation (branch, validate, dry-run, health check)
	@echo "$(CYAN)Running Vibe Stack immune system validation...$(NC)"
	@echo ""
	@if [ -f scripts/ops/test-harness.sh ]; then \
		./scripts/ops/test-harness.sh --skip-branch && \
		echo "" && \
		echo "$(CYAN)Test harness passed - triggering Kanban sync...$(NC)" && \
		$(MAKE) --no-print-directory kanban-sync; \
	else \
		echo "$(RED)Error: test-harness.sh not found$(NC)"; \
		echo "$(YELLOW)This script should be in scripts/ops/$(NC)"; \
		exit 1; \
	fi

.PHONY: test
test: ## Run all test suites
	@echo "$(CYAN)Running test suite...$(NC)"
	@echo ""
	@if [ -f package.json ]; then \
		npm test; \
	else \
		echo "$(RED)Error: package.json not found$(NC)"; \
		exit 1; \
	fi

.PHONY: test-coverage
test-coverage: ## Run tests with coverage report
	@echo "$(CYAN)Running tests with coverage...$(NC)"
	@echo ""
	@if [ -f package.json ]; then \
		npm run test:coverage; \
	else \
		echo "$(RED)Error: package.json not found$(NC)"; \
		exit 1; \
	fi

.PHONY: test-e2e
test-e2e: ## Run end-to-end tests
	@echo "$(CYAN)Running E2E tests...$(NC)"
	@echo ""
	@if [ -f scripts/setup/e2e-test.sh ]; then \
		bash scripts/setup/e2e-test.sh; \
	else \
		echo "$(RED)Error: E2E test script not found$(NC)"; \
		exit 1; \
	fi

.PHONY: setup-ai
setup-ai: ## Run interactive AI provider setup
	@echo "$(CYAN)Starting AI provider setup...$(NC)"
	@echo ""
	@if [ -f scripts/setup/setup-ai.sh ]; then \
		bash scripts/setup/setup-ai.sh; \
	else \
		echo "$(RED)Error: setup-ai.sh script not found$(NC)"; \
		exit 1; \
	fi

.PHONY: cleanup
cleanup: ## Stop services and clean up old Docker images
	@echo "$(CYAN)Starting Docker cleanup...$(NC)"
	@echo ""
	@if [ -f scripts/setup/cleanup.sh ]; then \
		bash scripts/setup/cleanup.sh; \
	else \
		echo "$(RED)Error: cleanup.sh script not found$(NC)"; \
		exit 1; \
	fi

.PHONY: kanban-sync
kanban-sync: ## Sync system state with Kanban board
	@echo "$(CYAN)Running Kanban Bridge sync...$(NC)"
	@echo ""
	@if [ -f scripts/ops/kanban-sync.sh ]; then \
		./scripts/ops/kanban-sync.sh; \
	else \
		echo "$(YELLOW)Kanban sync script not found - skipping$(NC)"; \
	fi

.PHONY: observer
observer: ## Open Observer Dashboard in browser
	@echo "$(CYAN)Opening Observer Dashboard...$(NC)"
	@command -v xdg-open >/dev/null 2>&1 && xdg-open services/observer-dashboard/index.html || \
	 command -v open >/dev/null 2>&1 && open services/observer-dashboard/index.html || \
	 echo "$(YELLOW)Please open manually:$(NC)\n  services/observer-dashboard/index.html"

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
		docker volume rm vibe-stack_vibe_config vibe-stack_vibe_data vibe-stack_code_server_data vibe-stack_open_webui_data vibe-stack_postgres_data 2>/dev/null || true; \
		rm -f $(VERSION_LOG); \
		echo "$(GREEN)✓ Reset complete$(NC)"; \
		echo "$(YELLOW)Run 'make setup' to reinitialize$(NC)"; \
	else \
		echo "$(YELLOW)Aborted$(NC)"; \
	fi

.PHONY: update
update: ## Orchestrated self-update with rolling restart and auto-rollback
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗${NC}"
	@echo "$(CYAN)║  Vibe Stack - Orchestrated Self-Update                     ║${NC}"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝${NC}"
	@echo ""
	@echo "$(CYAN)Step 1: Snapshotting current state...${NC}"
	@$(MAKE) --no-print-directory log-versions
	@$(MAKE) --no-print-directory snapshot-state
	@echo ""
	@echo "$(CYAN)Step 2: Pulling latest images...${NC}"
	@$(DOCKER_COMPOSE) pull
	@echo ""
	@echo "$(CYAN)Step 3: Performing rolling restart...${NC}"
	@echo "$(YELLOW)Services will restart one at a time with health verification${NC)"
	@echo ""
	@$(MAKE) --no-print-directory rolling-restart
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗${NC}"
	@echo "$(GREEN)║  Update Complete!                                          ║${NC}"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝${NC}"
	@echo ""
	@echo "$(CYAN)Triggering Kanban sync...${NC}"
	@$(MAKE) --no-print-directory kanban-sync
	@echo ""
	@echo "$(CYAN)Run 'make versions' to see new image digests${NC}"
	@echo "$(CYAN)Run 'make evolve' for system health analysis${NC}"
	@echo "$(CYAN)Run 'make observer' to open Observer Dashboard${NC}"

.PHONY: snapshot-state
snapshot-state: ## Snapshot current state for rollback
	@echo "$(CYAN)Creating state snapshot...${NC}"
	@echo '{"timestamp":"'"$$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'","backup":"manual"}' > .vibe-state-backup.json
	@echo "$(GREEN)✓ State snapshot created${NC}"

.PHONY: rolling-restart
rolling-restart: ## Restart services one at a time with health checks
	@echo "$(CYAN)Starting rolling restart...${NC)"
	@echo ""
	@for service in postgres vibe-kanban mcp-server code-server open-webui; do \
		echo "$(CYAN)Restarting $$service...${NC}"; \
		$(DOCKER_COMPOSE) stop $$service; \
		$(DOCKER_COMPOSE) up -d $$service; \
		echo "$(CYAN)Waiting for $$service health check...${NC}"; \
		timeout=60; \
		while [ $$timeout -gt 0 ]; do \
			if $($(DOCKER_COMPOSE) ps -q $$service | xargs docker inspect -f '{{.State.Health.Status}}' 2>/dev/null | grep -q healthy); then \
				echo "$(GREEN)✓ $$service is healthy${NC}"; \
				break; \
			fi; \
			sleep 2; \
			timeout=$$((timeout - 2)); \
		done; \
		if [ $$timeout -le 0 ]; then \
			echo "$(RED)✗ $$service failed health check${NC}"; \
			echo "$(YELLOW)Initiating rollback...${NC}"; \
			$(MAKE) --no-print-directory rollback-emergency; \
			exit 1; \
		fi; \
		echo ""; \
	done
	@echo "$(GREEN)✓ All services restarted successfully${NC}"

.PHONY: rollback-emergency
rollback-emergency: ## Emergency rollback after failed update
	@echo "$(RED)╔════════════════════════════════════════════════════════════╗${NC}"
	@echo "$(RED)║  EMERGENCY ROLLBACK                                        ║${NC}"
	@echo "$(RED)╚════════════════════════════════════════════════════════════╝${NC}"
	@echo ""
	@echo "$(CYAN)Stopping all services...${NC}"
	@$(DOCKER_COMPOSE) down
	@echo ""
	@echo "$(CYAN)Checking for previous version in log...${NC)"
	@if [ -f .vibe-versions.log ]; then \
		echo "$(YELLOW)Previous versions found in .vibe-versions.log${NC}"; \
		echo "$(YELLOW)Manual rollback may be required${NC}"; \
	else \
		echo "$(YELLOW)No version history found${NC}"; \
	fi
	@echo ""
	@echo "$(CYAN)Restarting with current images...${NC}"
	@$(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "$(YELLOW)⚠ Rollback complete. Please verify system health.${NC}"
	@echo "$(YELLOW)Run 'make health' to check service status${NC}"

.PHONY: state-show
state-show: ## Show current mission state
	@if [ -f .vibe-state.json ]; then \
		if command -v jq >/dev/null 2>&1; then \
			jq '.' .vibe-state.json; \
		else \
			cat .vibe-state.json; \
		fi \
	else \
		echo "$(YELLOW)No active mission state found${NC}"; \
	fi

.PHONY: state-clear
state-clear: ## Clear mission state (after completion or abort)
	@echo "$(YELLOW)Clearing mission state...${NC}"
	@rm -f .vibe-state.json
	@echo "$(GREEN)✓ Mission state cleared${NC}"

.PHONY: state-resume
state-resume: ## Resume interrupted mission
	@if [ -f .vibe-state.json ]; then \
		echo "$(CYAN)Resuming mission from state file...${NC}"; \
		echo "$(YELLOW)State file: .vibe-state.json${NC}"; \
		echo "$(YELLOW)Use AI assistant to continue from saved step${NC}"; \
	else \
		echo "$(YELLOW)No mission state to resume${NC}"; \
	fi

# ============================================================================
# DEVELOPMENT TARGETS
# ============================================================================
.PHONY: build
build: ## Rebuild containers without cache
	@echo "$(CYAN)Rebuilding containers...$(NC)"
	@$(DOCKER_COMPOSE) build --no-cache
	@echo "$(GREEN)✓ Build complete$(NC)"

.PHONY: dev
dev: ## Start services in development mode with hot-reload
	@echo "$(CYAN)Starting development environment...$(NC)"
	@echo ""
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml up

.PHONY: dev-up
dev-up: ## Start services in development mode (detached)
	@echo "$(CYAN)Starting development environment in background...$(NC)"
	@echo ""
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo ""
	@echo "$(GREEN)✓ Dev environment started$(NC)"
	@echo "Run 'make dev-logs' to see logs"

.PHONY: dev-down
dev-down: ## Stop development services
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml down

.PHONY: dev-logs
dev-logs: ## Show development logs
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml logs -f

# ============================================================================
# CODE QUALITY TARGETS
# ============================================================================
.PHONY: lint
lint: ## Run shell script linting (shellcheck)
	@echo "$(CYAN)Running shell script quality checks...$(NC)"
	@echo ""
	@if command -v shellcheck >/dev/null 2>&1; then \
		for script in *.sh lib/*.sh; do \
			if [ -f "$$script" ]; then \
				echo "  Checking $$script..."; \
				shellcheck "$$script" || echo "  $(YELLOW)Issues found in $$script$(NC)"; \
			fi; \
		done; \
		echo ""; \
		echo "$(GREEN)✓ Shell script linting complete$(NC)"; \
	else \
		echo "$(YELLOW)⚠ shellcheck not installed. Install with:$(NC)"; \
		echo "  $(MAGENTA)apt-get install shellcheck$(NC)  # Debian/Ubuntu"; \
		echo "  $(MAGENTA)brew install shellcheck$(NC)      # macOS"; \
	fi

.PHONY: lint-docker
lint-docker: ## Validate docker-compose.yml syntax
	@echo "$(CYAN)Validating docker-compose.yml...$(NC)"
	@$(DOCKER_COMPOSE) config --no-interpolate >/dev/null 2>&1 && \
		echo "$(GREEN)✓ docker-compose.yml syntax is valid$(NC)" || \
		echo "$(RED)✗ docker-compose.yml has syntax errors$(NC)"

.PHONY: check-scripts
check-scripts: ## Check all shell scripts for syntax errors
	@echo "$(CYAN)Checking shell script syntax...$(NC)"
	@echo ""
	@failed=0; \
	for script in *.sh lib/*.sh; do \
		if [ -f "$$script" ]; then \
			if bash -n "$$script" 2>/dev/null; then \
				echo "  $(GREEN)✓$(NC) $$script"; \
			else \
				echo "  $(RED)✗$(NC) $$script (syntax error)"; \
				failed=1; \
			fi; \
		fi; \
	done; \
	echo ""; \
	if [ $$failed -eq 0 ]; then \
		echo "$(GREEN)✓ All shell scripts have valid syntax$(NC)"; \
	else \
		echo "$(RED)✗ Some scripts have syntax errors$(NC)"; \
		exit 1; \
	fi

.PHONY: code-quality
code-quality: lint lint-docker check-scripts ## Run all code quality checks
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║  Code Quality Checks Complete                                ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""

# ============================================================================
# UTILITY TARGETS
# ============================================================================
.PHONY: health
health: ## Check service health
	@echo "$(CYAN)Checking service health...$(NC)"
	@echo ""
	@echo "$(BLUE)Vibe-Kanban (port 4000):$(NC)"
	@curl -sf http://localhost:4000/ >/dev/null 2>&1 && \
		echo "  $(GREEN)● Healthy$(NC)" || \
		echo "  $(YELLOW)● Starting/Unreachable$(NC)"
	@echo ""
	@echo "$(BLUE)MCP Server (port 4001):$(NC)"
	@curl -sf http://localhost:4001/health >/dev/null 2>&1 && \
		echo "  $(GREEN)● Healthy$(NC)" || \
		echo "  $(YELLOW)● Starting/Unreachable$(NC)"
	@echo ""
	@echo "$(BLUE)Code-Server (port 8443):$(NC)"
	@curl -sf http://localhost:8443/ >/dev/null 2>&1 && \
		echo "  $(GREEN)● Healthy$(NC)" || \
		echo "  $(YELLOW)● Starting/Unreachable$(NC)"
	@echo ""
	@echo "$(BLUE)Open WebUI (port 8081):$(NC)"
	@curl -sf http://localhost:8081/ >/dev/null 2>&1 && \
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
	@echo "$(BLUE)API Key Validation:$(NC)"
	@if [ -f agents/claude/settings.json ]; then \
		if grep -q "sk-ant-" agents/claude/settings.json 2>/dev/null; then \
			echo "  $(GREEN)✓$(NC) Claude API key format valid (sk-ant- prefix)"; \
		elif grep -q "sk-" agents/claude/settings.json 2>/dev/null; then \
			echo "  $(YELLOW)⚠$(NC) Claude API key may be invalid (missing 'ant' in sk-ant-)"; \
		else \
			echo "  $(YELLOW)⚠$(NC) No Claude API key found or using GLM-4/Z.ai"; \
		fi; \
		if grep -q "api.z.ai" agents/claude/settings.json 2>/dev/null; then \
			echo "  $(GREEN)✓$(NC) GLM-4/Z.ai proxy configured"; \
		fi; \
	else \
		echo "  $(YELLOW)⚠$(NC) No settings.json found"; \
	fi
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
	@netstat -an 2>/dev/null | grep -q ":3000 " && echo "  $(YELLOW)⚠$(NC) Port 3000 in use" || echo "  $(GREEN)✓$(NC) Port 3000 available"
	@echo ""
	@echo "$(BLUE)Version Log:$(NC)"
	@test -f $(VERSION_LOG) && echo "  $(GREEN)✓$(NC) Version tracking enabled ($(VERSION_LOG))" || echo "  $(YELLOW)⚠$(NC) No version history yet"
	@echo ""
	@echo "$(CYAN)═══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(MAGENTA)💡 Run 'make versions' for detailed version history$(NC)"
	@echo "$(MAGENTA)💡 Run 'make evolve' for system evolution analysis$(NC)"
	@echo "$(MAGENTA)💡 Run 'make watch-logs' to monitor for errors$(NC)"

# ============================================================================
# ACCESS TARGETS
# ============================================================================
.PHONY: open
open: ## Open services in default browser
	@echo "$(CYAN)Opening services...$(NC)"
	@command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:4000 && xdg-open http://localhost:8443 && xdg-open http://localhost:8081 || \
	 command -v open >/dev/null 2>&1 && open http://localhost:4000 && open http://localhost:8443 && open http://localhost:8081 || \
	 echo "$(YELLOW)Please open manually:$(NC)\n  http://localhost:4000\n  http://localhost:8443\n  http://localhost:8081"

.PHONY: webui
webui: ## Open Open WebUI in default browser
	@echo "$(CYAN)Opening Open WebUI...$(NC)"
	@command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:8081 || \
	 command -v open >/dev/null 2>&1 && open http://localhost:8081 || \
	 echo "$(YELLOW)Please open manually:$(NC)\n  http://localhost:8081"

# ============================================================================
# MCP SERVER TARGETS
# ============================================================================
.PHONY: mcp-test
mcp-test: ## Test MCP server connection
	@echo "$(CYAN)Testing MCP Server...$(NC)"
	@curl -sf http://localhost:4001/health >/dev/null 2>&1 && \
		echo "  $(GREEN)✓$(NC) MCP Server is running" || \
		echo "  $(YELLOW)⚠$(NC) MCP Server not reachable (start with 'make up')"
	@echo ""
	@curl -sf http://localhost:4001/.well-known/mcp 2>/dev/null | head -20 || echo "  $(RED)✗$(NC) Failed to get MCP info"

.PHONY: mcp-tools
mcp-tools: ## List available MCP tools
	@echo "$(CYAN)Available MCP Tools:$(NC)"
	@echo ""
	@curl -sf http://localhost:4001/.well-known/mcp 2>/dev/null | \
		grep -E '"name"|"description"' | \
		sed 's/,$$//' | \
		paste - - | \
		awk -F'"' '{print "  " $$4 ": " $$8}' || \
		echo "  $(YELLOW)⚠$(NC) MCP Server not reachable"
	@echo ""

.PHONY: mcp-plan
mcp-plan: ## Generate task plan via AI (example)
	@echo "$(CYAN)Generating example task plan...$(NC)"
	@echo ""
	@echo "$(YELLOW)Goal:$(NC) Add user authentication with OAuth"
	@echo ""
	@curl -sf -X POST http://localhost:4001/api/tools/vibe_generate_plan \
		-H "Content-Type: application/json" \
		-d '{"goal": "Add user authentication with OAuth", "targetLane": "backlog"}' \
		2>/dev/null || echo "  $(YELLOW)⚠$(NC) MCP Server not reachable"
	@echo ""

# ============================================================================
# VARIABLES EXPORT
# ============================================================================
.EXPORT_ALL_VARIABLES:
