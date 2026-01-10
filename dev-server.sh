#!/bin/bash

# Lightweight Dev Server for Docker Container
# Usage: /app/dev-server.sh <project-name>
# Example: /app/dev-server.sh my-react-app

PORT="${DEV_PORT:-3000}"
HOST="${DEV_HOST:-0.0.0.0}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if project name is provided or use current directory
if [ -z "$1" ]; then
    # No argument - use current directory
    PROJECT_DIR="$(pwd)"
    PROJECT_NAME="$(basename "$PROJECT_DIR")"
    echo -e "${YELLOW}ℹ No project specified, using current directory${NC}"
else
    PROJECT_NAME="$1"
    PROJECT_DIR="/repos/${PROJECT_NAME}"
    
    # Verify project exists
    if [ ! -d "$PROJECT_DIR" ]; then
        echo -e "${RED}❌ Error: Project '${PROJECT_NAME}' not found${NC}"
        echo ""
        echo -e "${BLUE}Available projects in /repos:${NC}"
        ls -1 /repos/ 2>/dev/null || echo "No projects found"
        exit 1
    fi
fi

echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}🚀 Lightweight Dev Server${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "${YELLOW}📁 Project: ${PROJECT_NAME}${NC}"
echo -e "${YELLOW}📂 Path: ${PROJECT_DIR}${NC}"
echo -e "${YELLOW}🌐 Port: ${PORT}${NC}"
echo ""

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Vibe Kanban worktree detection: if no package.json but exactly one subdirectory, use it
if [ ! -f "package.json" ] && [ ! -f "index.html" ]; then
    SUBDIRS=$(find . -maxdepth 1 -type d ! -name '.' | wc -l)
    if [ "$SUBDIRS" -eq 1 ]; then
        SUBDIR=$(find . -maxdepth 1 -type d ! -name '.' | head -1)
        echo -e "${YELLOW}ℹ Detected Vibe Kanban worktree, entering: ${SUBDIR}${NC}"
        cd "$SUBDIR" || exit 1
        PROJECT_DIR="$(pwd)"
        PROJECT_NAME="$(basename "$PROJECT_DIR")"
    fi
fi

# Start dev server
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ Found package.json${NC}"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}→ Installing dependencies...${NC}"
        npm install
    fi
    
    # Run appropriate dev script
    if grep -q '"dev"' package.json; then
        echo -e "${YELLOW}→ Running: npm run dev${NC}"
        npm run dev
    elif grep -q '"start"' package.json; then
        echo -e "${YELLOW}→ Running: npm start${NC}"
        npm start
    elif grep -q '"serve"' package.json; then
        echo -e "${YELLOW}→ Running: npm run serve${NC}"
        npm run serve
    else
        echo -e "${YELLOW}→ Starting static server...${NC}"
        npx -y serve -l ${PORT} -s .
    fi
elif [ -f "index.html" ]; then
    echo -e "${GREEN}✓ Found index.html${NC}"
    npx -y serve -l ${PORT} -s .
else
    echo -e "${RED}⚠ No package.json or index.html found${NC}"
    npx -y serve -l ${PORT} .
fi
