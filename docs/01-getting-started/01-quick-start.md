# Quick Start

Get Vibe Stack running in **2 minutes**.

---

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed and running
- [Git](https://git-scm.com/) installed

---

## Install

```bash
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack
./scripts/setup/install.sh    # Linux/Mac
# or: scripts\setup\install.bat    # Windows
```

**That's it!** All services start automatically with secure passwords.

---

## Access

| Service | URL | Login |
|---------|-----|-------|
| Vibe-Kanban | http://localhost:4000 | None |
| Open WebUI | http://localhost:8081 | Create account |
| code-server | http://localhost:8443 | See `.env` |

---

## Next Steps (2 minutes)

### Interactive AI Setup (Recommended)

```bash
./scripts/setup/setup-ai.sh      # Linux/Mac
# or: scripts\setup\setup-ai.ps1  # Windows
```

This interactive script will:
- Guide you through choosing an AI provider
- Help install Ollama (free, local AI) if you want
- Collect API keys for paid providers
- Configure everything automatically

**Options:**
1. **Ollama** - Free, runs locally, no API key
2. **OpenAI** - GPT-4, GPT-4 Turbo
3. **Anthropic** - Claude 3.5 Sonnet
4. **Z.AI (GLM-4)** - Chinese AI, cost-effective GLM-4.7
5. **OpenRouter** - Access to many models
6. **Google** - Gemini models
7. **Groq** - Fast LLaMA models

---

### Manual Setup (Advanced)

#### Option A: Use Local AI (Free, No API Key)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2

# Open WebUI will auto-detect Ollama
open http://localhost:8081
```

That's it! Ollama is detected automatically.

#### Option B: Use OpenAI/Anthropic

1. Open http://localhost:8081
2. Create account
3. Settings → Providers → Add your API key

---

## Verify Everything Works

```bash
./scripts/setup/e2e-test.sh
# or: make test-e2e
```

---

## Start Using

### Generate Tasks

In Open WebUI chat, type:

```
Create tasks for building a React todo app with TypeScript
```

Tasks automatically appear in Vibe-Kanban!

### Open Vibe-Kanban

http://localhost:4000

---

## Commands

```bash
make up      # Start services
make down    # Stop services
make logs    # View logs
make health  # Check health
make dev     # Development mode with hot-reload
```

---

**Need help?** See [Installation Guide](02-installation.md) or [Troubleshooting](../06-development/05-troubleshooting.md)
