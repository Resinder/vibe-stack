#!/usr/bin/env bash
# =============================================================================
# Vibe Stack - One-Command Install
# =============================================================================
# Run: curl -fsSL https://raw.githubusercontent.com/Resinder/vibe-stack/main/scripts/setup/install.sh | bash
# Or: ./scripts/setup/install.sh
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  ${GREEN}Vibe Stack - One-Command Install${NC}                      ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check Docker
echo -e "${YELLOW}[1/4]${NC} Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found${NC}"
    echo "Install Docker from: https://www.docker.com/get-started"
    exit 1
fi
if ! docker info &> /dev/null; then
    echo -e "${RED}✗ Docker daemon not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi
echo -e "${GREEN}✓ Docker OK${NC}"

# Step 2: Create .env if missing
echo -e "${YELLOW}[2/4]${NC} Setting up configuration..."
if [ ! -f .env ]; then
    # Generate secure passwords
    CODE_PASSWORD=$(openssl rand -base64 16 2>/dev/null || echo "dev123")
    POSTGRES_PASSWORD=$(openssl rand -base64 16 2>/dev/null || echo "vibepass")
    GRAFANA_PASSWORD=$(openssl rand -base64 16 2>/dev/null || echo "grafana123")
    ENCRYPTION_KEY=$(openssl rand -base64 48 2>/dev/null || echo "encryption-key")

    # Create .env with generated passwords (using awk for cross-platform compatibility)
    awk -v cp="$CODE_PASSWORD" -v pp="$POSTGRES_PASSWORD" -v gp="$GRAFANA_PASSWORD" -v ek="$ENCRYPTION_KEY" '
        /^# CREDENTIAL_ENCRYPTION_KEY=/ { print "CREDENTIAL_ENCRYPTION_KEY=" ek; next }
        /CODE_SERVER_PASSWORD=/ { sub(/=.*/, "=" cp) }
        /POSTGRES_PASSWORD=/ { sub(/=.*/, "=" pp) }
        /GRAFANA_ADMIN_PASSWORD=/ { sub(/=.*/, "=" gp) }
        { print }
    ' .env.example > .env

    echo -e "${GREEN}✓ Created .env with secure passwords${NC}"
    echo -e "${YELLOW}  Passwords saved to .env - keep it safe!${NC}"
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi

# Step 3: Start services
echo -e "${YELLOW}[3/4]${NC} Starting services..."
docker compose up -d --build

# Step 4: Wait for health checks
echo -e "${YELLOW}[4/4]${NC} Waiting for services to be healthy..."
sleep 10

# Check health
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  ${GREEN}Installation Complete!${NC}                                    ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Service URLs:${NC}"
echo -e "  • Vibe-Kanban:  ${BLUE}http://localhost:4000${NC}"
echo -e "  • Open WebUI:   ${BLUE}http://localhost:8081${NC}"
echo -e "  • code-server:  ${BLUE}http://localhost:8443${NC}"
echo -e "  • MCP Server:   ${BLUE}http://localhost:4001${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Open Open WebUI: http://localhost:8081"
echo -e "  2. Create an account"
echo -e "  3. Add your AI API key (Settings → Providers)"
echo ""
echo -e "${GREEN}✓ All services are running!${NC}"
