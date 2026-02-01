#!/bin/bash
# ============================================================================
# Vibe Stack - Docker Entrypoint Script
# ============================================================================
# Container initialization script for vibe-kanban service.
# Handles dependency installation, permissions, and startup.
#
# This script is executed as the container's ENTRYPOINT or CMD.
# ============================================================================

set -e

# ============================================================================
# STEP 1: Install base system dependencies
# ============================================================================
echo "========================================="
echo "Installing system dependencies..."
echo "========================================="
apt-get update -qq
apt-get install -y -qq git ssh nano curl sudo

# ============================================================================
# STEP 2: Configure file permissions
# ============================================================================
echo ""
echo "Configuring permissions..."
chown -R node:node /repos /app /home/node

# ============================================================================
# STEP 3: Install Claude Code globally
# ============================================================================
echo ""
echo "========================================="
echo "Installing Claude Code..."
echo "========================================="
npm install -g @anthropic-ai/claude-code

echo ""
echo "Claude Code version check:"
claude --version

echo ""
echo "Claude Code installed successfully!"
echo "========================================="

# ============================================================================
# STEP 4: Configure Claude permissions
# ============================================================================
chown -R node:node /home/node/.claude

# ============================================================================
# STEP 5: Project configuration (copy secrets)
# ============================================================================
echo ""
echo "Checking projects..."
for d in /repos/* ; do
  if [ -d "$d" ]; then
    project_name=$(basename "$d")
    if [ -d "/root/secrets/${project_name}" ]; then
      cp -f /root/secrets/"${project_name}"/.env.development "$d/.env.development.local" 2>/dev/null || true
      cp -f /root/secrets/"${project_name}"/.env.production "$d/.env.production.local" 2>/dev/null || true
      chown node:node "$d/.env.development.local" "$d/.env.production.local" 2>/dev/null || true
    fi
  fi
done

echo "Secrets stored in /root/secrets (inaccessible to agent)"

# ============================================================================
# STEP 6: Start Vibe-Kanban as node user
# ============================================================================
echo ""
echo "Starting Vibe-Kanban..."
# Use environment variables with defaults
PORT=${PORT:-4000}
HOST=${HOST:-0.0.0.0}
exec su - node -c "HOME=/home/node npm_config_cache=/home/node/.npm PORT=${PORT} HOST=${HOST} CLAUDE_SKIP_PERMISSION_CHECK=true DANGEROUS_SKIP_PERMISSION=true npx vibe-kanban"
