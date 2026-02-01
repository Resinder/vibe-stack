# Vibe Stack - Configuration Guide

Complete guide for configuring Vibe Stack services and components.

---

## Table of Contents

- [Overview](#overview)
- [Environment Variables](#environment-variables)
- [Configuration Files](#configuration-files)
- [Service Configuration](#service-configuration)
- [State Management](#state-management)
- [Claude Code Configuration](#claude-code-configuration)
- [Secrets Management](#secrets-management)
- [Common Configurations](#common-configurations)

---

## Overview

Vibe Stack uses multiple configuration mechanisms:

- **Environment Variables** - Service-level settings via `.env` file
- **Configuration Files** - JSON/YAML files for specific services
- **State Files** - Runtime state tracking and persistence
- **Secrets** - Sensitive data isolated from code

All configuration is designed to be:
- **Secure**: Sensitive data never committed to git
- **Flexible**: Easy to customize for different environments
- **Documented**: All options clearly explained
- **Validated**: Input validation prevents misconfiguration

---

## Environment Variables

### Primary Configuration File: `.env`

Create `.env` from the template:
```bash
cp .env.example .env
```

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CODE_SERVER_PASSWORD` | `dev123` | Password for code-server access |

**Security**: Always change this in production!

### Optional Variables

#### Service Ports
```bash
VIBE_PORT=4000              # Vibe-Kanban port
CODE_SERVER_PORT=8443       # code-server port
OPEN_WEBUI_PORT=8081        # Open WebUI port
MCP_SERVER_PORT=4001        # MCP Server port
```

#### MCP Server
```bash
HTTP_PORT=4001              # HTTP API port
BRIDGE_FILE=/data/.vibe-kanban-bridge.json
NODE_ENV=production         # Node environment
```

#### Vibe-Kanban
```bash
PORT=4000                   # Server port
HOST=0.0.0.0                # Bind address
NODE_ENV=production         # Node environment
```

#### Logging
```bash
LOG_LEVEL=info              # Log level: error, warn, info, debug
```

---

## Configuration Files

### Project Structure

```
config/
├── providers/              # AI Provider configurations (modular)
│   ├── README.md           # Provider configuration guide
│   ├── anthropic.example.json
│   ├── zai.example.json
│   ├── openai.example.json
│   ├── google.example.json
│   └── ollama.example.json
└── state/                  # State management templates
    └── .vibe-state.json.example

agents/
└── claude/                 # Claude Code configuration
    ├── settings.json       # Claude API settings
    └── settings.json.example

services/
├── open-webui-custom/      # Open WebUI customizations
└── observer-dashboard/     # Observer dashboard files
```

---

## AI Provider Configuration (Modular)

### Overview

Vibe Stack supports multiple AI providers through a **modular configuration system**. Each provider has its own configuration file with standardized schema, making it easy to switch between providers.

### Supported Providers

| Provider | Config File | Best For |
|----------|-------------|----------|
| **Anthropic** | `anthropic.example.json` | English, code quality |
| **Z.ai** | `zai.example.json` | Chinese, cost-effective |
| **OpenAI** | `openai.example.json` | General purpose |
| **Google** | `google.example.json` | Multimodal, large context |
| **Ollama** | `ollama.example.json` | Privacy, offline |

### Quick Setup

#### Step 1: Select Provider

Copy the example configuration for your provider:

```bash
# For Anthropic (Claude) - Recommended for English users
cp config/providers/anthropic.example.json config/providers/active.json

# For Z.ai (GLM-4) - Recommended for Chinese users
cp config/providers/zai.example.json config/providers/active.json

# For OpenAI (GPT)
cp config/providers/openai.example.json config/providers/active.json

# For Google (Gemini)
cp config/providers/google.example.json config/providers/active.json

# For Ollama (Local)
cp config/providers/ollama.example.json config/providers/active.json
```

#### Step 2: Configure API Key

Edit `config/providers/active.json`:

```json
{
  "api": {
    "apiKey": "your-actual-api-key-here"
  }
}
```

**Or use environment variable** (recommended for security):

```bash
# Anthropic
export ANTHROPIC_API_KEY="sk-ant-xxx"

# Z.ai
export ZAI_API_KEY="your-zhipu-ai-key"

# OpenAI
export OPENAI_API_KEY="sk-xxx"

# Google
export GOOGLE_API_KEY="your-google-key"
```

Add to `.env` file:
```bash
ANTHROPIC_API_KEY=sk-ant-your-key
ZAI_API_KEY=your-zhipu-key
OPENAI_API_KEY=sk-openai-key
GOOGLE_API_KEY=your-google-key
```

#### Step 3: Enable Provider

Set `"enabled": true` in the configuration file.

#### Step 4: Restart Services

```bash
docker compose restart open-webui mcp-server
```

### Configuration Schema

Each provider configuration follows this standardized schema:

```json
{
  "_comment": "Provider description",
  "_documentation": "API documentation URL",

  "provider": "provider-name",
  "enabled": true,

  "api": {
    "baseUrl": "https://api.example.com",
    "apiKey": "${API_KEY_ENV_VAR}",
    "version": "api-version",
    "timeout": 120000
  },

  "models": {
    "haiku": { "name": "fast-model", "alias": "fast", "contextWindow": 200000, "maxTokens": 8192 },
    "sonnet": { "name": "balanced-model", "alias": "balanced", "contextWindow": 200000, "maxTokens": 8192 },
    "opus": { "name": "quality-model", "alias": "quality", "contextWindow": 200000, "maxTokens": 4096 }
  },

  "defaults": {
    "model": "sonnet",
    "temperature": 0.7,
    "topP": 0.9,
    "maxTokens": 4096
  },

  "capabilities": {
    "codeGeneration": "excellent|good|fair",
    "chineseSupport": "excellent|good|fair",
    "multimodal": true|false,
    "streaming": true|false
  },

  "pricing": {
    "currency": "USD|CNY",
    "haiku": { "input": 0.25, "output": 1.25, "unit": "1M" },
    "sonnet": { "input": 3.00, "output": 15.00, "unit": "1M" },
    "opus": { "input": 15.00, "output": 75.00, "unit": "1M" }
  }
}
```

### Provider Comparison

| Provider | Cost | Chinese | Code Quality | Multimodal | Privacy |
|----------|------|---------|--------------|------------|---------|
| **Anthropic** | 💰💰💰 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ Limited | ⭐⭐⭐⭐ |
| **Z.ai** | 💰 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ No | ⭐⭐⭐⭐ |
| **OpenAI** | 💰💰💰 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Yes | ⭐⭐⭐⭐ |
| **Google** | 💰💰 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Yes | ⭐⭐⭐⭐ |
| **Ollama** | 💰💰💰💰 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ Some | ⭐⭐⭐⭐⭐ |

**Cost per 1M tokens (approximate)**:
- Ollama: Free (hardware only)
- Google Gemini: Free tier available
- Z.ai: ~$1.40 / 1M tokens
- OpenAI GPT-3.5: $2.00 / 1M tokens
- Claude Haiku: $1.50 / 1M tokens
- OpenAI GPT-4o: $12.50 / 1M tokens
- Claude Sonnet: $18.00 / 1M tokens
- OpenAI GPT-4 Turbo: $40.00 / 1M tokens
- Claude Opus: $90.00 / 1M tokens

### Switching Providers

To switch between providers:

```bash
# 1. Backup current config
cp config/providers/active.json config/providers/backup.json

# 2. Copy new provider config
cp config/providers/[new-provider].example.json config/providers/active.json

# 3. Update API key in .env or config file
nano .env  # or nano config/providers/active.json

# 4. Restart services
docker compose restart open-webui mcp-server
```

### Provider-Specific Guides

#### Anthropic (Claude)

**Best for**: English-language projects, code quality

**Setup**:
```bash
cp config/providers/anthropic.example.json config/providers/active.json

# Get API key from https://console.anthropic.com/
export ANTHROPIC_API_KEY="sk-ant-xxx"
```

**Models**:
- `claude-3-haiku` (fast) - $0.25/1M input, $1.25/1M output
- `claude-3-5-sonnet` (balanced) - $3/1M input, $15/1M output
- `claude-opus` (quality) - $15/1M input, $75/1M output

#### Z.ai (Zhipu AI / GLM-4)

**Best for**: Chinese-language projects, cost-effectiveness

**Setup**:
```bash
cp config/providers/zai.example.json config/providers/active.json

# Get API key from https://open.bigmodel.cn/usercenter/apikeys
export ZAI_API_KEY="your-zhipu-ai-key"
```

**Models**:
- `glm-4-air` (fast) - ~$0.14/1M tokens
- `glm-4-flash` (balanced) - ~$0.70/1M tokens
- `glm-4-plus` (quality) - ~$1.40/1M tokens

**Detailed guide**: [ZAI_INTEGRATION.md](ZAI_INTEGRATION.md)

#### OpenAI (GPT)

**Best for**: General-purpose, multimodal

**Setup**:
```bash
cp config/providers/openai.example.json config/providers/active.json

# Get API key from https://platform.openai.com/api-keys
export OPENAI_API_KEY="sk-xxx"
```

**Models**:
- `gpt-3.5-turbo` (fast) - $0.50/1M input, $1.50/1M output
- `gpt-4o` (balanced) - $2.50/1M input, $10/1M output
- `gpt-4-turbo` (quality) - $10/1M input, $30/1M output

#### Google (Gemini)

**Best for**: Large context, multimodal

**Setup**:
```bash
cp config/providers/google.example.json config/providers/active.json

# Get API key from https://ai.google.dev/
export GOOGLE_API_KEY="your-google-key"
```

**Models**:
- `gemini-2.0-flash-exp` (fast) - Free up to limits
- `gemini-1.5-pro` (balanced/quality) - $1.25/1M input, $5/1M output

#### Ollama (Local)

**Best for**: Privacy, offline, cost

**Setup**:
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull llama3

# Copy config
cp config/providers/ollama.example.json config/providers/active.json
```

**Models** (examples):
- `llama3:8b` (fast) - Free
- `llama3:70b` (balanced) - Free
- `codellama:34b` (quality) - Free

### Environment Variables Reference

| Provider | Environment Variable | Required |
|----------|---------------------|----------|
| Anthropic | `ANTHROPIC_API_KEY` | Yes |
| Z.ai | `ZAI_API_KEY` | Yes |
| OpenAI | `OPENAI_API_KEY` | Yes |
| Google | `GOOGLE_API_KEY` | Yes |
| Ollama | (none) | No |

### Adding Custom Providers

To add a new provider:

1. Create configuration file:
   ```bash
   nano config/providers/myprovider.example.json
   ```

2. Follow the standardized schema

3. Add documentation URL

4. Update `config/providers/README.md`

### Troubleshooting

#### Provider not responding?

```bash
# Check API key is set
echo $ANTHROPIC_API_KEY

# Verify configuration
cat config/providers/active.json

# Check service logs
docker compose logs open-webui
```

#### Wrong model being used?

```bash
# Check model mapping
cat config/providers/active.json | grep -A 10 '"models"'

# Verify Open WebUI settings
# Open http://localhost:8081 → Settings → Models
```

#### Want to compare providers?

See [AI_PROVIDERS.md](AI_PROVIDERS.md) for complete comparison guide.

---

---

## Service Configuration

### Vibe-Kanban

**Location**: `vibe-kanban` container

**Configuration via**:
- Environment variables in `.env`
- Docker Compose service definition

**Key Settings**:
```yaml
# docker-compose.yml
vibe-kanban:
  environment:
    - PORT=4000
    - HOST=0.0.0.0
    - NODE_ENV=production
  ports:
    - "4000:4000"
    - "3000-3100:3000-3100"  # Dev server range
```

**Data persistence**:
- `vibe_config` volume - Configuration and settings
- `vibe_data` volume - Projects and database

---

### MCP Server

**Location**: `mcp-server/` directory

**Configuration files**:
- `src/config/constants.js` - Main configuration
- `src/config/tools.js` - Tool definitions
- `src/config/validationConstants.js` - Validation rules

**Environment variables**:
```bash
HTTP_PORT=4001              # HTTP API port
BRIDGE_FILE=/data/.vibe-kanban-bridge.json
NODE_ENV=production
```

**Tool definitions** (in `src/config/tools.js`):
- 10 MCP tools for task management
- Input schemas and validation
- Tool descriptions for AI

---

### code-server

**Location**: `code-server` container

**Configuration via**:
- Environment variables in `.env`
- Docker Compose service definition
- VS Code settings (persisted in volume)

**Key Settings**:
```yaml
code-server:
  environment:
    - PASSWORD=${CODE_SERVER_PASSWORD}
    - DOCKER_USER=root
    - DEFAULT_WORKSPACE=/home/coder/repos
  ports:
    - "8443:8443"
```

**Customization**:
- VS Code extensions (auto-installed)
- Settings (persisted in `code_server_data` volume)
- Keybindings (user-specific)

---

### Open WebUI

**Location**: `open-webui` container

**Configuration via**:
- Environment variables
- Web UI settings
- Provider configurations

**Key Settings**:
```yaml
open-webui:
  environment:
    - ENABLE_OLLAMA_API=false
    - DATA_DIR=/app/backend/data
    - MODELS=
  ports:
    - "8081:8080"
```

**Provider setup** (via Web UI):
1. Open http://localhost:8081
2. Go to Settings → Providers
3. Add your AI provider (OpenAI, Anthropic, etc.)
4. Enter API keys
5. Select default model

---

## State Management

### Mission State File

**Location**: `.vibe-state.json` (created at runtime)

**Purpose**: Track mission/agent state for resumption

**Template**: `config/state/.vibe-state.json.example`

**Structure**:
```json
{
  "mission": "Mission description",
  "currentStep": 0,
  "totalSteps": 10,
  "status": "in_progress",
  "timestamp": "2026-01-28T12:00:00Z",
  "context": {
    "notes": "Additional context"
  }
}
```

**Commands**:
```bash
make state-show    # Show current state
make state-clear   # Clear state
make state-resume  # Resume mission
```

---

## Claude Code Configuration

### Claude Code Settings

**Location**: `agents/claude/settings.json`

**Template**: `agents/claude/settings.json.example`

**Configuration options**:

#### API Provider
```json
{
  "provider": "anthropic",
  "apiKey": "sk-ant-xxxxx",
  "baseUrl": "https://api.anthropic.com"
}
```

#### GLM-4/Z.ai (Alternative)
```json
{
  "provider": "glm",
  "apiKey": "your-api-key",
  "baseUrl": "https://api.z.ai/v1"
}
```

#### Model Selection
```json
{
  "model": "claude-opus-4-5-20251101",
  "maxTokens": 200000,
  "temperature": 0.7
}
```

---

## Secrets Management

### Project Secrets

**Location**: `secrets/` directory (not in git)

**Structure**:
```
secrets/
├── my-project-1/
│   ├── .env.development
│   └── .env.production
└── my-project-2/
    └── .env.staging
```

**Creating secrets for a project**:
```bash
# Create directory
mkdir -p secrets/my-project

# Copy template
cp secrets/your-project/example.env secrets/my-project/.env.development

# Edit with actual values
nano secrets/my-project/.env.development
```

**Access in containers**:
- Mounted at `/root/secrets` (read-only)
- Available to all services
- Isolated from AI agent access

**Example `.env.development`**:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/db
API_KEY=secret-api-key
JWT_SECRET=jwt-secret-key
```

---

## Common Configurations

### Development Environment

```bash
# .env
CODE_SERVER_PASSWORD=dev123
LOG_LEVEL=debug
NODE_ENV=development
```

**Features**:
- Verbose logging
- Development ports
- No authentication required

---

### Production Environment

```bash
# .env
CODE_SERVER_PASSWORD=$(openssl rand -base64 32)
LOG_LEVEL=warn
NODE_ENV=production
```

**Features**:
- Secure password
- Minimal logging
- Optimized for performance

---

### Testing Environment

```bash
# .env.test
CODE_SERVER_PASSWORD=test123
LOG_LEVEL=debug
NODE_ENV=test
```

**Features**:
- Debug logging
- Test database
- Mock services

---

### Local LLM (Ollama)

```bash
# .env
ENABLE_OLLAMA_API=true
OLLAMA_BASE_URL=http://localhost:11434
MODELS=llama2,codellama
```

**Setup**:
1. Install Ollama
2. Pull models: `ollama pull llama2`
3. Enable in docker-compose.yml
4. Restart services

---

### Multi-Provider AI

**Open WebUI configuration**:

1. **Add OpenAI**:
   - Settings → Providers → OpenAI
   - Enter API key
   - Select model (gpt-4, gpt-3.5-turbo)

2. **Add Anthropic**:
   - Settings → Providers → Anthropic
   - Enter API key
   - Select model (claude-opus, claude-sonnet)

3. **Add Ollama (Local)**:
   - Settings → Providers → Ollama
   - Enter base URL
   - Select available models

---

## Configuration Validation

### Verify Configuration

```bash
# Check all configs
make doctor

# Check specific service
docker config vibe-kanban

# Validate docker-compose
docker-compose config
```

### Common Issues

#### Invalid Environment Variable
```bash
# Error: Undefined variable
# Fix: Check .env file for typos
```

#### Port Already in Use
```bash
# Error: Port 4000 already in use
# Fix: Change port in .env or stop conflicting service
lsof -i :4000
```

#### Missing Required Variable
```bash
# Error: CODE_SERVER_PASSWORD not set
# Fix: Add to .env file
echo "CODE_SERVER_PASSWORD=mypassword" >> .env
```

---

## Best Practices

1. **Never commit secrets**: Use `.gitignore` to exclude `.env` and `secrets/`
2. **Use strong passwords**: Generate random passwords for production
3. **Document custom configs**: Add comments to `.env` for custom settings
4. **Validate before deploy**: Run `make doctor` before production deployment
5. **Use environment-specific configs**: Separate `.env.development`, `.env.production`
6. **Rotate secrets regularly**: Change API keys and passwords periodically
7. **Backup configurations**: Keep backups of working configurations

---

## Related Documentation

- **[README.md](../README.md)** - Main documentation
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development setup
- **[SECURITY.md](../SECURITY.md)** - Security guidelines
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues

---

**For configuration issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**
