# Vibe Stack - Installation Guide

Complete installation guide for Vibe Stack on all platforms.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Install (2 minutes)](#quick-install-2-minutes)
- [Platform-Specific Installation](#platform-specific-installation)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

| Software | Version | Check Command |
|----------|---------|---------------|
| **Docker** | 20.10+ | `docker --version` |
| **Docker Compose** | 2.0+ | `docker compose version` |
| **Git** | 2.0+ | `git --version` |
| **Bash** | 4.0+ | `bash --version` |

### Hardware Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **RAM** | 8GB | 16GB |
| **Disk Space** | 10GB | 20GB |
| **CPU** | 2 cores | 4+ cores |

### Optional Software

- **OpenSSL** - For generating secure passwords
- **curl** - For testing API endpoints
- **Make** - For using Makefile commands

---

## Quick Install (2 minutes)

### Step 1: Clone Repository

```bash
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack
```

### Step 2: Run Setup Script

**Linux/macOS:**
```bash
./scripts/setup/init.sh
```

**Windows (PowerShell):**
```powershell
scripts\setup\init.bat
```

### Step 3: Start Services

```bash
make up
```

### Step 4: Access Services

Open your browser:

- **Vibe-Kanban**: http://localhost:4000
- **Open WebUI**: http://localhost:8081
- **code-server**: http://localhost:8443

---

## Platform-Specific Installation

### macOS

#### Using Homebrew

```bash
# Install Docker Desktop
brew install --cask docker

# Install Git (if not installed)
brew install git

# Clone and setup
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack
./scripts/setup/init.sh
```

#### Manual Installation

1. Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
2. Install and start Docker
3. Follow Quick Install steps above

### Linux (Ubuntu/Debian)

#### Install Docker

```bash
# Update package index
sudo apt-get update

# Install dependencies
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
```

#### Install Git

```bash
sudo apt-get install -y git
```

#### Clone and Setup

```bash
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack
./scripts/setup/init.sh
```

### Windows

#### Using Docker Desktop

1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Run installer with WSL 2 backend enabled
3. Restart computer when prompted
4. Open PowerShell or Command Prompt

#### Using PowerShell Script

```powershell
# Clone repository
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack

# Run setup script
scripts\setup\init.bat

# Start services
make up
```

#### Using WSL 2 (Recommended)

```bash
# Enable WSL 2
wsl --install

# Open Ubuntu terminal
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Follow Linux instructions above
```

---

## Configuration

### Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# Required
CODE_SERVER_PASSWORD=your-secure-password

# Optional
VIBE_PORT=4000
CODE_SERVER_PORT=8443
OPEN_WEBUI_PORT=8081
```

### AI Provider Configuration

Select and configure your AI provider:

```bash
# Copy provider configuration
cp config/providers/anthropic.example.json config/providers/active.json

# Set API key
export ANTHROPIC_API_KEY="sk-ant-your-key"
```

**Supported Providers:**
- **Anthropic (Claude)** - Best for English, code quality
- **Z.AI (GLM-4)** - Chinese AI, GLM-4.7, cost-effective
- **OpenAI (GPT)** - General purpose
- **Google (Gemini)** - Large context, multimodal
- **Ollama** - Local models, privacy

See [CONFIGURATION.md](../05-operations/01-configuration.md) for details.

---

## Verification

### Check Docker Installation

```bash
docker --version
docker compose version
```

### Check Service Health

```bash
# All services
make health

# Individual services
curl http://localhost:4000/health    # Vibe-Kanban
curl http://localhost:4001/health    # MCP Server
curl http://localhost:8081/health    # Open WebUI
```

### View Logs

```bash
# All services
make logs

# Specific service
docker compose logs -f vibe-kanban
```

---

## Troubleshooting

### Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
```bash
# Linux: Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# macOS/Windows: Start Docker Desktop
```

### Port Already in Use

**Error:** `Port 4000 is already in use`

**Solution:**
```bash
# Find process using port
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Change port in .env
VIBE_PORT=5000
```

### Permission Denied

**Error:** `permission denied while trying to connect to the Docker daemon`

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in
```

### Out of Memory

**Error:** Services crash or become unresponsive

**Solution:**
```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory (8GB+)

# Or reduce resource limits in docker-compose.yml
```

### Services Not Starting

**Diagnosis:**
```bash
# Check service status
docker compose ps

# View logs
docker compose logs [service-name]

# Check configuration
docker compose config
```

**Common Fixes:**
```bash
# Clean restart
docker compose down -v
docker compose up -d

# Rebuild images
docker compose build --no-cache
docker compose up -d
```

---

## Advanced Installation

### Development Environment

```bash
# Use development configuration
docker compose -f docker-compose.yml -f config/environments/development/docker-compose.yml up
```

### Production Environment

```bash
# Use production configuration
docker compose -f docker-compose.yml -f config/environments/production/docker-compose.yml up -d
```

### Custom Configuration

```bash
# Create custom compose file
cp docker-compose.yml docker-compose.custom.yml

# Edit with custom settings
nano docker-compose.custom.yml

# Use custom configuration
docker compose -f docker-compose.yml -f docker-compose.custom.yml up
```

---

## Updates

### Update Vibe Stack

```bash
# Pull latest changes
git pull origin main

# Update images
docker compose pull

# Restart services
docker compose up -d
```

### Rollback Update

```bash
# Rollback to previous version
git checkout HEAD~1

# Restart with previous version
docker compose up -d
```

---

## Uninstallation

### Stop Services

```bash
docker compose down -v
```

### Remove Volumes (⚠️ Deletes Data)

```bash
docker volume rm vibe-stack_vibe_data
docker volume rm vibe-stack_code_server_data
```

### Remove Project Directory

```bash
cd ..
rm -rf vibe-stack
```

---

## Next Steps

After installation:

1. **[Quick Start Guide](QUICKSTART.md)** - Get started in 5 minutes
2. **[Configuration Guide](../05-operations/01-configuration.md)** - Configure your setup
3. **[User Guide](../02-user-guide/01-user-guide.md)** - Learn how to use Vibe Stack
4. **[Examples](../examples/)** - See practical examples

---

## Getting Help

- **Documentation**: [docs/](../)
- **Issues**: [GitHub Issues](https://github.com/Resinder/vibe-stack/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Resinder/vibe-stack/discussions)
- **Troubleshooting**: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)

---

**Installation Guide Version:** 1.0.0
**Last Updated:** 2026-01-28
