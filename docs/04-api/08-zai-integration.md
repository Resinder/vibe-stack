# Vibe Stack - Z.ai (Zhipu AI / GLM-4) Integration Guide

Complete guide for integrating Vibe Stack with Z.ai (Zhipu AI) and GLM-4 models.

---

## Table of Contents

- [Overview](#overview)
- [What is Z.ai?](#what-is-zai)
- [GLM-4 Models](#glm-4-models)
- [Setup Guide](#setup-guide)
- [Configuration](#configuration)
- [Model Mapping](#model-mapping)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Comparison with Other Providers](#comparison-with-other-providers)

---

## Overview

Vibe Stack provides **native support for Z.ai (Zhipu AI)** through GLM-4 models. This enables Chinese-language AI-powered task planning and code generation with excellent performance and cost-effectiveness.

### Why Use Z.ai?

| Feature | Z.ai (GLM-4) | OpenAI (GPT-4) | Anthropic (Claude) |
|---------|---------------|-----------------|-------------------|
| **Chinese Support** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good | ⭐⭐⭐ Good |
| **Cost** | 💰 Low | 💰💰 High | 💰💰💰 Very High |
| **Speed** | ⚡ Fast | ⚡ Fast | ⚡⚡ Very Fast |
| **Code Quality** | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent |
| **API Compatibility** | Anthropic-compatible | OpenAI-native | Anthropic-native |

### Key Benefits

✅ **Cost-Effective** - Up to 10x cheaper than GPT-4
✅ **Chinese Native** - Optimized for Chinese language tasks
✅ **Fast Inference** - Quick response times
✅ **Anthropic-Compatible** - Drop-in replacement
✅ **Multiple Models** - GLM-4-Air, GLM-4-Flash, GLM-4-Plus

---

## What is Z.ai?

**Z.ai** (Zhipu AI) is a leading Chinese AI research company providing GLM (General Language Model) series models.

### Platform Details

- **Website**: https://open.bigmodel.cn/
- **API Docs**: https://open.bigmodel.cn/usercenter/apikeys
- **Console**: https://open.bigmodel.cn/usercenter/apikeys
- **Pricing**: https://open.bigmodel.cn/pricing

### API Proxy

Z.ai provides an **Anthropic-compatible API proxy** at:
```
https://api.z.ai/api/anthropic
```

This means existing Anthropic API code works without modification!

---

## GLM-4 Models

### Model Family

| Model | Equivalent | Speed | Quality | Use Case |
|-------|-----------|-------|---------|----------|
| **GLM-4-Air** | Claude Haiku | ⚡⚡⚡ Fastest | ⭐⭐⭐ Good | Quick queries, simple tasks |
| **GLM-4-Flash** | Claude Sonnet | ⚡⚡ Fast | ⭐⭐⭐⭐ Very Good | General development, most tasks |
| **GLM-4-Plus** | Claude Opus | ⚡ Moderate | ⭐⭐⭐⭐⭐ Excellent | Complex problems, architecture |

### Model Specifications

**GLM-4-Air**
- Context Window: 128K tokens
- Max Output: 4K tokens
- Response Time: < 1 second
- Cost: ¥0.001 / 1K tokens

**GLM-4-Flash**
- Context Window: 128K tokens
- Max Output: 8K tokens
- Response Time: 1-2 seconds
- Cost: ¥0.005 / 1K tokens

**GLM-4-Plus**
- Context Window: 128K tokens
- Max Output: 12K tokens
- Response Time: 2-5 seconds
- Cost: ¥0.01 / 1K tokens

---

## Setup Guide

### Step 1: Get Z.ai API Key

1. Visit https://open.bigmodel.cn/
2. Register or login to your account
3. Navigate to API Keys: https://open.bigmodel.cn/usercenter/apikeys
4. Generate a new API key
5. Copy the key for configuration

### Step 2: Configure Vibe Stack

**Option A: Using Claude Code with GLM-4**

```bash
cd agents/claude

# Create settings file from template
cp settings.glm4.json.example settings.json

# Edit settings.json with your API key
nano settings.json
```

**settings.json:**
```json
{
  "hasAcknowledgedDangerousSkipPermissions": true,
  "hasCompletedOnboarding": true,
  "theme": "dark",
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-zhipu-ai-api-key-here",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "API_TIMEOUT_MS": "3000000",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4-plus"
  }
}
```

**Option B: Using Open WebUI with GLM-4**

```bash
# Access Open WebUI
open http://localhost:8081

# Navigate to Settings → Models
# Add Custom Model:
```

**Open WebUI Custom Model:**
```
Name: GLM-4-Flash
Base URL: https://api.z.ai/api/anthropic/v1
API Key: your-zhipu-ai-api-key-here
Model ID: glm-4-flash
Context Length: 128000
```

### Step 3: Restart Services

```bash
# Restart with new configuration
docker compose restart

# Or full restart
make down
make up
```

---

## Configuration

### Environment Variables

Update `.env` with z.ai configuration:

```bash
# ============================================================================
# Z.AI (ZHIPU AI) / GLM-4 CONFIGURATION
# ============================================================================

# Z.ai API Configuration
ZAI_API_KEY=your-zhipu-ai-api-key-here
ZAI_BASE_URL=https://api.z.ai/api/anthropic

# Default Model Selection
ZAI_DEFAULT_MODEL=glm-4-flash
ZAI_HAIKU_MODEL=glm-4-air
ZAI_SONNET_MODEL=glm-4-flash
ZAI_OPUS_MODEL=glm-4-plus

# API Settings
ZAI_TIMEOUT=120000
ZAI_MAX_RETRIES=3
ZAI_TEMPERATURE=0.7
ZAI_MAX_TOKENS=4096
```

### Provider Selection

The MCP Server supports **provider abstraction** - switch between providers without code changes:

```javascript
// config/providers.js
module.exports = {
  providers: {
    anthropic: {
      baseUrl: 'https://api.anthropic.com',
      models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus']
    },
    zai: {
      baseUrl: 'https://api.z.ai/api/anthropic',
      models: ['glm-4-air', 'glm-4-flash', 'glm-4-plus']
    },
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
    }
  },
  current: process.env.AI_PROVIDER || 'anthropic'
};
```

---

## Model Mapping

### Claude Code Model Mapping

| Claude Code Setting | GLM-4 Model | Usage |
|--------------------|-------------|-------|
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | `glm-4-air` | Quick tasks, autocomplete |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | `glm-4-flash` | Code generation, refactoring |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | `glm-4-plus` | Complex problems, architecture |

### Context Recommendations

| Task Type | Recommended Model | Reason |
|-----------|------------------|--------|
| **Simple queries** | GLM-4-Air | Fast, cost-effective |
| **Code generation** | GLM-4-Flash | Balanced speed/quality |
| **Task planning** | GLM-4-Flash | Good understanding, fast |
| **Architecture design** | GLM-4-Plus | Best quality output |
| **Debugging** | GLM-4-Flash | Quick analysis |
| **Documentation** | GLM-4-Air | Fast text generation |

---

## Usage Examples

### Example 1: Task Planning with GLM-4

```
You (in Open WebUI):
Create a task plan for implementing a REST API with:
- Express.js framework
- PostgreSQL database
- JWT authentication
- 5 endpoints (CRUD operations)

AI (GLM-4-Flash):
✅ Generated 8 tasks:
1. Design database schema (4h)
2. Set up Express server (2h)
3. Create database models (3h)
4. Implement JWT authentication (6h)
5. Create CRUD endpoints (8h)
6. Add input validation (2h)
7. Write API tests (4h)
8. Add API documentation (2h)

Total: 31 hours
Priority breakdown: 3 high, 3 medium, 2 low
```

### Example 2: Code Generation with GLM-4

```
You (in Claude Code):
Write a Express.js route for user registration with:
- Email validation
- Password hashing with bcrypt
- Duplicate email check
- Proper error handling

AI (GLM-4-Flash):
[Generates complete Express route with all requirements]

Quality: Excellent
Time: < 2 seconds
Cost: ~¥0.01
```

### Example 3: Chinese Language Task

```
You (in Open WebUI):
为一个电商网站创建任务计划，包括：
- 用户认证系统
- 商品管理
- 购物车功能
- 订单处理
- 支付集成

AI (GLM-4-Plus):
✅ 生成了12个任务：
1. 设计用户认证系统（6小时）
2. 实现商品管理模块（8小时）
3. 创建购物车功能（6小时）
4. 订单处理流程（8小时）
5. 集成支付宝支付（10小时）
...等

总计：58小时
优先级：4个高优先级，5个中优先级，3个低优先级
```

---

## API Reference

### Authentication

```http
POST https://api.z.ai/api/anthropic/v1/messages
Authorization: Bearer your-zhipu-ai-api-key-here
Content-Type: application/json
anthropic-version: 2023-06-01
```

### Request Format

```json
{
  "model": "glm-4-flash",
  "max_tokens": 4096,
  "messages": [
    {
      "role": "user",
      "content": "Create a task plan for implementing OAuth authentication"
    }
  ]
}
```

### Response Format

```json
{
  "id": "msg-abc123",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Here's a comprehensive task plan..."
    }
  ],
  "model": "glm-4-flash",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 42,
    "output_tokens": 387
  }
}
```

### Streaming

```json
{
  "model": "glm-4-flash",
  "max_tokens": 4096,
  "stream": true,
  "messages": [
    {
      "role": "user",
      "content": "Generate REST API endpoints"
    }
  ]
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Authentication Failed"

**Problem:** API key is invalid or expired

**Solution:**
```bash
# Check API key
echo $ZAI_API_KEY

# Regenerate key at: https://open.bigmodel.cn/usercenter/apikeys
# Update settings.json or .env
docker compose restart open-webui
```

#### 2. "Model Not Found"

**Problem:** Incorrect model name

**Solution:**
```bash
# Use correct model names:
# - glm-4-air (not glm-4-haiku)
# - glm-4-flash (not glm-4-sonnet)
# - glm-4-plus (not glm-4-opus)
```

#### 3. "Connection Timeout"

**Problem:** Network issues or firewall blocking

**Solution:**
```bash
# Test connectivity
curl -I https://api.z.ai

# If blocked, try alternative endpoint:
# https://api.bigmodel.cn/api/anthropic
```

#### 4. "Response Quality Poor"

**Problem:** Wrong model for task

**Solution:**
```bash
# Switch to higher quality model
# Change from: glm-4-air
# To: glm-4-flash or glm-4-plus
```

---

## Comparison with Other Providers

### Feature Matrix

| Feature | Z.ai (GLM-4) | Anthropic (Claude) | OpenAI (GPT-4) |
|---------|---------------|-------------------|-----------------|
| **Chinese** | Native | Good | Good |
| **Code Quality** | Very Good | Excellent | Excellent |
| **Speed** | Fast | Very Fast | Fast |
| **Context Window** | 128K | 200K | 128K |
| **Cost (1M tokens)** | ~¥5 | ~$15 | ~$10 |
| **Rate Limits** | Generous | Strict | Moderate |
| **API Compatibility** | Anthropic | Native | OpenAI |

### Cost Comparison (Per 1M Tokens)

| Provider | Input | Output | Total |
|----------|-------|--------|-------|
| **Z.ai GLM-4-Plus** | ¥5 | ¥5 | ¥10 (~$1.4) |
| **Claude Opus** | $15 | $75 | $90 |
| **GPT-4 Turbo** | $10 | $30 | $40 |

**Z.ai is ~9x cheaper than Claude Opus and ~4x cheaper than GPT-4 Turbo!**

---

## Best Practices

### 1. Model Selection

```javascript
// Choose model based on task complexity
function selectModel(complexity) {
  switch(complexity) {
    case 'simple':
      return 'glm-4-air';      // Fast, cheap
    case 'medium':
      return 'glm-4-flash';    // Balanced
    case 'complex':
      return 'glm-4-plus';     // Best quality
    default:
      return 'glm-4-flash';    // Default
  }
}
```

### 2. Prompt Engineering for Chinese

```
❌ Bad:
"创建任务"

✅ Good:
"请为以下需求创建详细的任务计划：
- 用户认证系统
- 支持 Google OAuth
- 使用 JWT 令牌管理
- 包含密码重置功能

请提供每个任务的预计时间、优先级和依赖关系。"
```

### 3. Error Handling

```javascript
try {
  const response = await zaiClient.messages.create({
    model: 'glm-4-flash',
    messages: [{ role: 'user', content: prompt }]
  });
} catch (error) {
  if (error.status === 401) {
    console.error('API Key invalid - check https://open.bigmodel.cn/usercenter/apikeys');
  } else if (error.status === 429) {
    console.error('Rate limit exceeded - please wait');
  } else {
    console.error('Z.ai API error:', error.message);
  }
}
```

---

## Quick Reference

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `https://api.z.ai/api/anthropic` | Main API endpoint |
| `https://open.bigmodel.cn/usercenter/apikeys` | API Key Management |
| `https://open.bigmodel.cn/dev/api` | API Documentation |

### Environment Variables

```bash
ZAI_API_KEY=your-key-here
ZAI_BASE_URL=https://api.z.ai/api/anthropic
ZAI_DEFAULT_MODEL=glm-4-flash
```

### Model Names

- `glm-4-air` - Fast, cost-effective
- `glm-4-flash` - Balanced performance
- `glm-4-plus` - Highest quality

---

## Related Documentation

- **[AI_PROVIDERS.md](AI_PROVIDERS.md)** - All AI provider comparisons
- **[Configuration](../05-operations/01-configuration.md)** - Configuration guide
- **[OPENWEBUI.md](OPENWEBUI.md)** - Open WebUI setup
- **[API_REFERENCE.md](API_REFERENCE.md)** - API reference

---

**Z.ai Support Version:** 1.0.0
**Last Updated:** 2026-01-28
**GLM-4 Models:** glm-4-air, glm-4-flash, glm-4-plus
