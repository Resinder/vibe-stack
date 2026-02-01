# Vibe Stack - AI Providers Comparison Guide

Complete comparison of all AI providers supported by Vibe Stack.

---

## Table of Contents

- [Provider Overview](#provider-overview)
- [Supported Providers](#supported-providers)
- [Feature Comparison](#feature-comparison)
- [Pricing Comparison](#pricing-comparison)
- [Performance Comparison](#performance-comparison)
- [Language Support](#language-support)
- [Setup Guides](#setup-guides)
- [Provider Selection](#provider-selection)
- [Migration Guide](#migration-guide)

---

## Provider Overview

Vibe Stack supports **multiple AI providers** through a unified abstraction layer, enabling you to switch between providers without changing your code.

### Supported Providers

| Provider | Models | API Compatibility | Best For |
|----------|--------|-------------------|----------|
| **Anthropic** | Claude 3 series | Native | English, code quality |
| **Z.ai (Zhipu AI)** | GLM-4 series | Anthropic-compatible | Chinese, cost-effective |
| **OpenAI** | GPT-4 series | OpenAI-native | General purpose |
| **Google** | Gemini series | OpenAI-compatible | Multimodal |
| **Ollama** | Local models | OpenAI-compatible | Privacy, offline |

---

## Supported Providers

### 1. Anthropic (Claude)

**Models:** Claude 3 Haiku, Claude 3 Sonnet, Claude 3.5 Sonnet, Claude Opus

**Website:** https://www.anthropic.com/

**API Endpoint:** https://api.anthropic.com

**Strengths:**
- ✅ Best code quality
- ✅ Fast response times
- ✅ Large context window (200K tokens)
- ✅ Strong security focus
- ✅ Excellent at following instructions

**Best For:**
- Code generation and review
- Complex reasoning tasks
- English-language content
- Security-critical applications

**Pricing:**
- Claude 3 Haiku: $0.25 / 1M input, $1.25 / 1M output
- Claude 3 Sonnet: $3 / 1M input, $15 / 1M output
- Claude 3.5 Sonnet: $3 / 1M input, $15 / 1M output
- Claude Opus: $15 / 1M input, $75 / 1M output

---

### 2. Z.AI (GLM-4)

**Models:** GLM-4.5-Air, GLM-4.7

**Website:** https://z.ai/model-api

**API Endpoint:** https://api.z.ai/api/anthropic

**Strengths:**
- ✅ Native Chinese language support
- ✅ Very cost-effective (~3× usage at fraction of the cost)
- ✅ Fast inference
- ✅ Anthropic API compatible
- ✅ 128K+ context windows
- ✅ Claude Code compatible

**Best For:**
- Chinese-language tasks
- Cost-sensitive applications
- High-volume operations
- Chinese market applications
- Claude Code users

**Pricing:**
- GLM-4.5-Air: ~1/3 the cost of Claude Haiku
- GLM-4.7: ~1/3 the cost of Claude Sonnet/Opus

**Model Mapping (for Claude Code):**
- Claude Haiku → glm-4.5-air (fast, cost-effective)
- Claude Sonnet → glm-4.7 (balanced)
- Claude Opus → glm-4.7 (highest quality)

---

### 3. OpenAI (GPT)

**Models:** GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo

**Website:** https://platform.openai.com/

**API Endpoint:** https://api.openai.com/v1

**Strengths:**
- ✅ Most widely adopted
- ✅ Large ecosystem
- ✅ Good performance
- ✅ Strong multimodal capabilities
- ✅ Extensive documentation

**Best For:**
- General-purpose applications
- Multimodal tasks
- Wide compatibility
- Quick prototyping

**Pricing:**
- GPT-4o: $2.50 / 1M input, $10 / 1M output
- GPT-4 Turbo: $10 / 1M input, $30 / 1M output
- GPT-3.5 Turbo: $0.50 / 1M input, $1.50 / 1M output

---

### 4. Google (Gemini)

**Models:** Gemini 2.0 Flash, Gemini 1.5 Pro

**Website:** https://ai.google.dev/

**API Endpoint:** https://generativelanguage.googleapis.com/v1

**Strengths:**
- ✅ Strong multimodal capabilities
- ✅ Large context window (1M tokens)
- ✅ Competitive pricing
- ✅ Good performance

**Best For:**
- Multimodal applications
- Large document processing
- Google ecosystem integration

**Pricing:**
- Gemini 2.0 Flash: Free (up to limits)
- Gemini 1.5 Pro: $1.25 / 1M input, $5 / 1M output

---

### 5. Ollama (Local Models)

**Models:** Llama 3, Mistral, Gemma, Code Llama, and 100+ more

**Website:** https://ollama.com/

**API Endpoint:** http://localhost:11434/v1

**Strengths:**
- ✅ Complete privacy
- ✅ No API costs
- ✅ Works offline
- ✅ 100+ model options
- ✅ Full data control

**Best For:**
- Privacy-critical applications
- Offline environments
- Cost-sensitive projects
- Custom model requirements

**Pricing:** Free (hardware costs only)

---

## Feature Comparison

### Capability Matrix

| Feature | Anthropic | Z.ai | OpenAI | Google | Ollama |
|---------|-----------|------|--------|--------|--------|
| **API Stability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Code Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Chinese Support** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Cost** | 💰💰💰 | 💰 | 💰💰💰 | 💰💰 | 💰💰💰💰 |
| **Privacy** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Context Window** | 200K | 128K | 128K | 1M | Variable |
| **Multimodal** | ⚠️ Limited | ❌ No | ✅ Yes | ✅ Yes | ⚠️ Some |

### Code Quality Comparison

| Provider | Code Quality | Best For |
|----------|--------------|----------|
| **Claude 3.5 Sonnet** | ⭐⭐⭐⭐⭐ | Complex algorithms, architecture |
| **Claude Opus** | ⭐⭐⭐⭐⭐ | Critical debugging, optimization |
| **GLM-4-Flash** | ⭐⭐⭐⭐ | General development, Chinese code |
| **GLM-4-Plus** | ⭐⭐⭐⭐ | Complex Chinese code |
| **GPT-4 Turbo** | ⭐⭐⭐⭐ | Quick prototyping, variety |
| **GPT-4o** | ⭐⭐⭐⭐⭐ | Production code, debugging |
| **Gemini 1.5 Pro** | ⭐⭐⭐⭐ | Large refactoring, analysis |
| **Llama 3 70B** | ⭐⭐⭐⭐ | Local code generation |

---

## Pricing Comparison

### Cost Per 1M Tokens (USD)

| Provider | Model | Input | Output | Total |
|----------|-------|-------|--------|-------|
| **Ollama** | Any | $0 | $0 | **$0** |
| **Google** | Gemini 2.0 Flash | $0 | $0 | **$0** |
| **Z.AI** | GLM-4.5-Air | ~$0.50 | ~$0.50 | **$1.00** |
| **Anthropic** | Claude 3 Haiku | $0.25 | $1.25 | **$1.50** |
| **OpenAI** | GPT-3.5 Turbo | $0.50 | $1.50 | **$2.00** |
| **Google** | Gemini 1.5 Pro | $1.25 | $5.00 | **$6.25** |
| **OpenAI** | GPT-4o | $2.50 | $10.00 | **$12.50** |
| **Z.AI** | GLM-4.7 | ~$5.00 | ~$5.00 | **$10.00** |
| **OpenAI** | GPT-4 Turbo | $10.00 | $30.00 | **$40.00** |
| **Anthropic** | Claude 3.5 Sonnet | $3.00 | $15.00 | **$18.00** |
| **Anthropic** | Claude Opus | $15.00 | $75.00 | **$90.00** |

### Cost Efficiency Ranking

1. **Ollama** - Free (hardware only)
2. **Google Gemini** - Free tier available
3. **Z.AI GLM-4.5-Air** - ~$1.00 / 1M tokens
4. **Claude 3 Haiku** - $1.50 / 1M tokens
5. **OpenAI GPT-3.5** - $2.00 / 1M tokens
6. **Gemini 1.5 Pro** - $6.25 / 1M tokens
7. **Z.AI GLM-4.7** - ~$10.00 / 1M tokens
8. **GPT-4o** - $12.50 / 1M tokens
9. **Claude 3.5 Sonnet** - $18.00 / 1M tokens
10. **GPT-4 Turbo** - $40.00 / 1M tokens
11. **Claude Opus** - $90.00 / 1M tokens

---

## Performance Comparison

### Response Time (Seconds)

| Provider | Model | Simple Query | Code Gen | Complex Task |
|----------|-------|--------------|----------|--------------|
| **Anthropic** | Claude 3 Haiku | < 1s | 2-3s | 5-10s |
| **Anthropic** | Claude 3.5 Sonnet | 1-2s | 3-5s | 10-15s |
| **Z.AI** | GLM-4.5-Air | < 1s | 2-3s | 5-8s |
| **Z.AI** | GLM-4.7 | 1-2s | 3-5s | 8-12s |
| **OpenAI** | GPT-4o | 1-2s | 3-6s | 10-20s |
| **Google** | Gemini 2.0 Flash | 1-2s | 4-8s | 15-25s |
| **Ollama** | Llama 3 8B | 2-5s | 5-15s | 20-60s |

### Throughput (Tokens/Second)

| Provider | Model | Input | Output |
|----------|-------|-------|--------|
| **Anthropic** | Claude 3.5 Sonnet | ~110 | ~40 |
| **Z.AI** | GLM-4.7 | ~100 | ~35 |
| **OpenAI** | GPT-4o | ~85 | ~30 |
| **Google** | Gemini 2.0 Flash | ~80 | ~25 |
| **Ollama** | Llama 3 8B | ~50 | ~15 |

---

## Language Support

### Chinese Language Performance

| Provider | Chinese | Reasoning | Code | Translation |
|----------|---------|-----------|------|------------|
| **Z.ai** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Google** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **OpenAI** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Anthropic** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Ollama** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

### Multilingual Capabilities

| Language | Best Provider | Alternative |
|----------|---------------|--------------|
| **Chinese (Simplified)** | Z.ai (GLM-4) | Google Gemini |
| **Chinese (Traditional)** | Z.ai (GLM-4) | Google Gemini |
| **English** | Anthropic (Claude) | OpenAI (GPT-4) |
| **Japanese** | Google Gemini | OpenAI (GPT-4) |
| **Korean** | Google Gemini | Z.ai (GLM-4) |
| **Spanish** | OpenAI (GPT-4) | Anthropic (Claude) |
| **French** | Anthropic (Claude) | OpenAI (GPT-4) |
| **German** | Anthropic (Claude) | OpenAI (GPT-4) |

---

## Setup Guides

### Anthropic Setup

```bash
# Get API key from https://console.anthropic.com/

# Configure Claude Code
cd agents/claude
cat > settings.json << 'EOF'
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-ant-your-key-here",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
  }
}
EOF

# Or configure Open WebUI
# Settings → Models → Add Custom Model
```

### Z.AI Setup

```bash
# Get API key from https://z.ai/model-api

# Configure Claude Code (~/.claude/settings.json)
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-zai-api-key",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "API_TIMEOUT_MS": "3000000",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7"
  }
}

# Or use interactive setup
./scripts/setup/setup-ai.sh

# Or configure Open WebUI
# Settings → Models → Add Custom Model
# Name: GLM-4.7
# Base URL: https://api.z.ai/api/anthropic
# Model ID: glm-4.7
```

### OpenAI Setup

```bash
# Get API key from https://platform.openai.com/api-keys

# Configure Open WebUI
# Settings → Models → Add Custom Model
# Name: GPT-4o
# Base URL: https://api.openai.com/v1
# Model ID: gpt-4o
```

### Ollama Setup

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull llama3

# Start Ollama server
ollama serve

# Configure Open WebUI
# Settings → Models → Add Custom Model
# Name: Llama 3
# Base URL: http://localhost:11434/v1
# Model ID: llama3
```

---

## Provider Selection

### Decision Tree

```
Start
  │
  ├─ Need Chinese language?
  │   └─ Yes → Z.ai (GLM-4)
  │
  ├─ Need maximum privacy?
  │   └─ Yes → Ollama (Local)
  │
  ├─ Budget constraints?
  │   └─ Yes → Z.ai (GLM-4) or Google (Gemini)
  │
  ├─ Best code quality?
  │   └─ Yes → Anthropic (Claude)
  │
  ├─ Need multimodal?
  │   └─ Yes → OpenAI (GPT-4o) or Google (Gemini)
  │
  └─ General purpose?
      └─ OpenAI (GPT-4o) or Anthropic (Claude 3.5 Sonnet)
```

### Use Case Recommendations

| Use Case | Primary | Secondary | Reason |
|----------|---------|-----------|--------|
| **Chinese Projects** | Z.ai | Gemini | Native Chinese |
| **English Projects** | Claude | GPT-4 | Best quality |
| **Cost-Sensitive** | Z.ai | Ollama | Cheapest options |
| **Privacy-Critical** | Ollama | Z.ai | Full control |
| **Quick Prototyping** | GPT-3.5 | Claude Haiku | Fast & cheap |
| **Production Code** | Claude 3.5 | GPT-4o | High quality |
| **Large Context** | Gemini | Claude | 1M context |
| **Multimodal** | GPT-4o | Gemini | Vision + text |
| **Offline** | Ollama | - | Local only |

---

## Migration Guide

### Switching Between Providers

**Step 1: Backup Configuration**
```bash
cp agents/claude/settings.json agents/claude/settings.json.backup
```

**Step 2: Update Provider**

**From Anthropic to Z.AI:**
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "zai-api-key",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7"
  }
}
```

**From Anthropic to OpenAI:**
```json
{
  "env": {
    "OPENAI_API_KEY": "openai-api-key",
    "OPENAI_BASE_URL": "https://api.openai.com/v1",
    "DEFAULT_MODEL": "gpt-4o"
  }
}
```

**Step 3: Restart Services**
```bash
docker compose restart open-webui
```

### Model Mapping

| From | To (Equivalent) | Notes |
|------|----------------|-------|
| Claude Haiku | GLM-4.5-Air, GPT-3.5 | Faster, cheaper |
| Claude Sonnet | GLM-4.7, GPT-4o | Similar quality |
| Claude Opus | GLM-4.7, GPT-4 Turbo | Highest quality |

---

## Quick Reference

### Provider Quick Start

```bash
# Anthropic (Claude)
export ANTHROPIC_API_KEY="sk-ant-xxx"
export BASE_URL="https://api.anthropic.com"

# Z.ai (GLM-4)
export ANTHROPIC_API_KEY="zai-api-key"
export BASE_URL="https://api.z.ai/api/anthropic"

# OpenAI (GPT)
export OPENAI_API_KEY="sk-xxx"
export BASE_URL="https://api.openai.com/v1"

# Ollama (Local)
export BASE_URL="http://localhost:11434/v1"
```

### Model Quick Reference

| Provider | Fast | Balanced | Quality |
|----------|------|----------|---------|
| **Anthropic** | claude-3-haiku | claude-3.5-sonnet | claude-opus |
| **Z.AI** | glm-4.5-air | glm-4.7 | glm-4.7 |
| **OpenAI** | gpt-3.5-turbo | gpt-4o | gpt-4-turbo |
| **Google** | gemini-2.0-flash | gemini-1.5-pro | gemini-1.5-pro |
| **Ollama** | llama3-8b | llama3-70b | codellama-34b |

---

## Related Documentation

- **[ZAI_INTEGRATION.md](ZAI_INTEGRATION.md)** - Z.ai specific guide
- **[Configuration](../05-operations/01-configuration.md)** - Configuration reference
- **[OPENWEBUI.md](OPENWEBUI.md)** - Open WebUI setup
- **[API_REFERENCE.md](API_REFERENCE.md)** - API reference

---

**Providers Version:** 1.0.0
**Last Updated:** 2026-01-31
