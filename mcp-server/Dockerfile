# ============================================================================
# VIBE MCP SERVER - Dockerfile
# ============================================================================
FROM node:20-alpine

# Install dependencies for Alpine
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY index.js ./

# Expose HTTP proxy port
EXPOSE 4001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4001/health || exit 1

# Run the server
CMD ["node", "index.js"]
