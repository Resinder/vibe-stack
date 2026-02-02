# ============================================================================
# VIBE MCP SERVER - Multi-Stage Production Dockerfile
# ============================================================================
# Features:
# - Multi-stage build for minimal image size
# - Non-root user for security
# - Optimized layer caching
# - SBOM generation
# - Health checks included
# ============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base image with dependencies
# -----------------------------------------------------------------------------
FROM node:24.13.0-alpine AS base

# Install security updates and common dependencies
RUN apk add --no-cache \
    wget \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Set Node.js production environment
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512" \
    npm_config_production=true \
    npm_config_foreground_scripts=true

# -----------------------------------------------------------------------------
# Stage 2: Dependencies
# -----------------------------------------------------------------------------
FROM base AS dependencies

# Copy package file
COPY package.json ./

# Install production dependencies
# Use npm install instead of npm ci to handle workspace setup
RUN npm install --production --no-optional --no-fund && \
    npm cache clean --force && \
    rm -rf /tmp/npm* /root/.npm

# -----------------------------------------------------------------------------
# Stage 3: Build (if needed for TypeScript compilation)
# -----------------------------------------------------------------------------
FROM dependencies AS build

# Copy source code
COPY src/ ./src/
COPY index.js ./

# If using TypeScript, uncomment the following:
# COPY tsconfig.json ./
# RUN npx tsc

# -----------------------------------------------------------------------------
# Stage 4: Development (for testing)
# -----------------------------------------------------------------------------
FROM base AS development

# Copy all files
COPY . .

# Install all dependencies (including dev)
RUN npm ci && \
    npm cache clean --force

# Run in development mode
ENV NODE_ENV=development
CMD ["node", "index.js"]

# -----------------------------------------------------------------------------
# Stage 5: Production
# -----------------------------------------------------------------------------
FROM base AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs index.js ./
COPY --chown=nodejs:nodejs package.json ./

# Create directories for data and logs
RUN mkdir -p /app/data /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose HTTP proxy port
EXPOSE 4001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:4001/health || exit 1

# Security metadata
LABEL maintainer="Vibe Stack <https://github.com/Resinder/vibe-stack>" \
      version="1.1.13" \
      description="Vibe Stack MCP Server - Model Context Protocol server for task management" \
      org.opencontainers.image.title="vibe-mcp-server" \
      org.opencontainers.image.description="MCP Server for Vibe Stack integration" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.source="https://github.com/Resinder/vibe-stack" \
      org.opencontainers.image.vendor="Vibe Stack" \
      org.opencontainers.image.licenses="MIT" \
      security.fsnonroot=true \
      security.readonly.rootfs=false

# Run the server
CMD ["node", "index.js"]

# -----------------------------------------------------------------------------
# Stage 6: SBOM Generation (for security compliance)
# -----------------------------------------------------------------------------
FROM base AS sbom

# Install Syft for SBOM generation
RUN apk add --no-cache wget && \
    wget -qO /usr/local/bin/syft https://raw.githubusercontent.com/anchore/syft/main/install.sh && \
    chmod +x /usr/local/bin/syft

# Copy production image artifacts
COPY --from=production /app /app

# Generate SBOM
RUN syft /app -o spdx-json > /app/sbom.spdx.json || true

# This stage is used for SBOM generation only
# The production stage is used for runtime
