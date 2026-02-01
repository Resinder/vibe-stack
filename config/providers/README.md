# AI Provider Configuration

This directory contains modular configuration files for supported AI providers.

## Structure

```
config/providers/
├── README.md                 # This file
├── anthropic.example.json   # Anthropic Claude configuration
├── zai.example.json         # Z.ai (Zhipu AI / GLM-4) configuration
├── openai.example.json      # OpenAI GPT configuration
├── google.example.json      # Google Gemini configuration
└── ollama.example.json      # Ollama local models configuration
```

## Usage

### 1. Select Provider

Copy the example file for your provider:

```bash
# For Anthropic (Claude)
cp config/providers/anthropic.example.json config/providers/active.json

# For Z.ai (GLM-4)
cp config/providers/zai.example.json config/providers/active.json

# For OpenAI (GPT)
cp config/providers/openai.example.json config/providers/active.json

# For Google (Gemini)
cp config/providers/google.example.json config/providers/active.json

# For Ollama (Local)
cp config/providers/ollama.example.json config/providers/active.json
```

### 2. Configure API Key

Edit `config/providers/active.json` and add your API key:

```json
{
  "api": {
    "apiKey": "your-actual-api-key-here"
  }
}
```

Or set as environment variable:

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

### 3. Enable Provider

Set `"enabled": true` in the configuration file.

## Provider Comparison

| Provider | Best For | Cost | Chinese | Code Quality |
|----------|----------|------|---------|--------------|
| **Anthropic** | English, code | 💰💰💰 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Z.ai** | Chinese, cost-effective | 💰 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **OpenAI** | General purpose | 💰💰💰 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Google** | Multimodal, large context | 💰💰 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Ollama** | Privacy, offline | 💰💰💰💰 | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## Configuration Schema

Each provider configuration follows this schema:

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
    "haiku": { "name": "fast-model", "alias": "fast" },
    "sonnet": { "name": "balanced-model", "alias": "balanced" },
    "opus": { "name": "quality-model", "alias": "quality" }
  },

  "defaults": {
    "model": "sonnet",
    "temperature": 0.7
  },

  "capabilities": {
    "codeGeneration": "excellent|good|fair",
    "chineseSupport": "excellent|good|fair",
    "multimodal": true|false,
    "streaming": true|false
  },

  "pricing": {
    "currency": "USD|CNY",
    "haiku": { "input": 0.25, "output": 1.25, "unit": "1M" }
  }
}
```

## Quick Start

### For Chinese Users (Recommended)

```bash
cp config/providers/zai.example.json config/providers/active.json
# Edit ZAI_API_KEY
```

### For English Users (Recommended)

```bash
cp config/providers/anthropic.example.json config/providers/active.json
# Edit ANTHROPIC_API_KEY
```

### For Privacy/Offline

```bash
cp config/providers/ollama.example.json config/providers/active.json
# Install Ollama: https://ollama.com
# ollama pull llama3
```

## Switching Providers

To switch providers:

```bash
# 1. Backup current config
cp config/providers/active.json config/providers/backup.json

# 2. Copy new provider
cp config/providers/[new-provider].example.json config/providers/active.json

# 3. Update API key
# Edit config/providers/active.json

# 4. Restart services
docker compose restart open-webui mcp-server
```

## Environment Variables

Each provider uses environment variables for API keys:

| Provider | Environment Variable |
|----------|---------------------|
| Anthropic | `ANTHROPIC_API_KEY` |
| Z.ai | `ZAI_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google | `GOOGLE_API_KEY` |
| Ollama | (none required) |

Add these to your `.env` file:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-your-key
ZAI_API_KEY=your-zhipu-key
OPENAI_API_KEY=sk-openai-key
GOOGLE_API_KEY=your-google-key
```

## Troubleshooting

### Provider not working?

1. Check API key is set correctly
2. Verify `"enabled": true` in configuration
3. Check API endpoint is accessible
4. Review provider documentation

### Want to compare providers?

See [AI_PROVIDERS.md](../../docs/AI_PROVIDERS.md) for complete comparison.

### Need provider-specific setup?

- Anthropic: [See README](../../README.md)
- Z.ai: [See ZAI_INTEGRATION.md](../../docs/ZAI_INTEGRATION.md)
- OpenAI: [platform.openai.com](https://platform.openai.com)
- Google: [ai.google.dev](https://ai.google.dev)
- Ollama: [ollama.com](https://ollama.com)

## Adding New Providers

To add a new provider:

1. Create `config/providers/[provider].example.json`
2. Follow the schema above
3. Add documentation link
4. Update this README

---

**Configuration Version:** 1.0.0
**Last Updated:** 2026-01-28
