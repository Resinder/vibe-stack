# Vibe Stack - Extending MCP Server

Complete guide for extending the Vibe Stack MCP Server with custom tools and functionality.

---

## Table of Contents

- [Extension Overview](#extension-overview)
- [Architecture](#architecture)
- [Creating Custom Tools](#creating-custom-tools)
- [Tool Development Workflow](#tool-development-workflow)
- [Validation](#validation)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Extension Overview

The Vibe Stack MCP Server (v1.0.0) is designed for extensibility. You can add custom tools to integrate with additional services, APIs, or workflows.

### What Can You Extend?

✅ **Custom Tools** - Add new callable functions
✅ **Resources** - Expose data sources to AI clients
✅ **Prompts** - Create reusable prompt templates
✅ **Middleware** - Add custom request/response processing
✅ **Validators** - Create specialized validation logic

### Extension Points

```
┌─────────────────────────────────────────────────────────┐
│                 MCP Server Extension Points             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Tools          → Add new callable functions        │
│  2. Resources      → Expose data sources               │
│  3. Prompts        → Reusable prompt templates         │
│  4. Middleware     → Request/response processing       │
│  5. Validators     → Custom validation logic           │
│  6. Services       → Business logic layer              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture

### Module Structure

```
mcp-server/src/
├── config/
│   └── tools.js              # ← Register tools here
├── core/
│   └── models.js             # ← Add data models here
├── services/
│   └── customService.js      # ← Add business logic here
├── controllers/
│   └── customController.js   # ← Add handlers here
├── middleware/
│   └── customValidation.js   # ← Add validators here
└── utils/
    └── toolRouter.js         # ← Routes to tools
```

### Request Flow for Custom Tools

```
1. Request arrives
   └─→ toolRouter.js
       ↓
2. Tool identified
   └─→ Check if custom tool
       ↓
3. Custom validator (if exists)
   └─→ Validate input
       ↓
4. Custom controller
   └─→ Execute logic
       ↓
5. Custom service
   └─→ Business operations
       ↓
6. Response formatted
   └─→ Return to client
```

---

## Creating Custom Tools

### Step 1: Define Tool Schema

Add your tool to `config/tools.js`:

```javascript
module.exports = {
  tools: {
    // ... existing tools

    // Your custom tool
    my_custom_tool: {
      name: 'my_custom_tool',
      description: 'Does something useful',
      category: 'custom', // optional category
      inputSchema: {
        type: 'object',
        properties: {
          param1: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'First parameter'
          },
          param2: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Second parameter'
          },
          optionalParam: {
            type: 'boolean',
            description: 'Optional parameter'
          }
        },
        required: ['param1', 'param2']
      }
    }
  }
};
```

### Step 2: Create Controller

Create `controllers/customController.js`:

```javascript
const { successResponse, errorResponse } = require('../utils/responseFactory');

/**
 * Handle custom tool execution
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context (optional)
 * @returns {Promise<Object>} Response object
 */
async function handleMyCustomTool(args, context = {}) {
  try {
    const { param1, param2, optionalParam = false } = args;

    // Validate input (additional validation if needed)
    if (!param1 || param1.trim().length === 0) {
      throw new Error('param1 cannot be empty');
    }

    // Execute business logic
    const result = await executeCustomLogic(param1, param2, optionalParam);

    return successResponse({
      message: 'Custom tool executed successfully',
      result: result
    });

  } catch (error) {
    return errorResponse(
      'CUSTOM_TOOL_ERROR',
      error.message,
      { hint: 'Check your input parameters' }
    );
  }
}

/**
 * Execute custom business logic
 * Separate function for better testing
 */
async function executeCustomLogic(param1, param2, optionalParam) {
  // Your business logic here

  // Example: Call external API
  // const response = await externalApi.call(param1, param2);

  // Example: Database operation
  // const result = await database.query('SELECT * FROM table WHERE id = ?', [param1]);

  // Example: File operation
  // const data = await fs.readFile(param1, 'utf-8');

  // Return result
  return {
    param1: param1,
    param2: param2,
    optionalParam: optionalParam,
    processed: true,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  handleMyCustomTool,
  executeCustomLogic
};
```

### Step 3: Register Tool Router

Update `utils/toolRouter.js`:

```javascript
const customController = require('../controllers/customController');

class ToolRouter {
  constructor() {
    this.routes = new Map();

    // Register existing tools
    this.register('vbm_create_task', taskController.createTask);
    this.register('vbm_update_task', taskController.updateTask);
    // ... other tools

    // Register your custom tool
    this.register('my_custom_tool', customController.handleMyCustomTool);
  }

  register(name, handler) {
    this.routes.set(name, handler);
  }

  async execute(toolName, args, context) {
    const handler = this.routes.get(toolName);
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    return await handler(args, context);
  }
}

module.exports = new ToolRouter();
```

---

## Tool Development Workflow

### 1. Planning

**Define requirements:**
- What does the tool do?
- What inputs does it need?
- What should it return?
- What external systems does it interact with?

**Example:**
```
Tool Name: send_slack_notification
Purpose: Send notifications to Slack channel
Input: channel, message, severity
Output: success status, timestamp, message ID
External: Slack API
```

### 2. Schema Design

```javascript
send_slack_notification: {
  name: 'send_slack_notification',
  description: 'Send a notification to a Slack channel',
  inputSchema: {
    type: 'object',
    properties: {
      channel: {
        type: 'string',
        pattern: '^[#A-Z0-9]+$',
        description: 'Slack channel (e.g., #general)'
      },
      message: {
        type: 'string',
        minLength: 1,
        maxLength: 1000,
        description: 'Message to send'
      },
      severity: {
        type: 'string',
        enum: ['info', 'warning', 'error', 'critical'],
        description: 'Message severity level'
      },
      username: {
        type: 'string',
        maxLength: 50,
        description: 'Bot username (optional)'
      }
    },
    required: ['channel', 'message', 'severity']
  }
}
```

### 3. Implementation

```javascript
// controllers/slackController.js
const WebClient = require('@slack/web-api');

const slackClient = new WebClient(process.env.SLACK_TOKEN);

async function sendSlackNotification(args) {
  const { channel, message, severity, username = 'Vibe Bot' } = args;

  try {
    // Map severity to Slack color
    const colors = {
      info: '#36a64f',
      warning: '#ff9800',
      error: '#f44336',
      critical: '#9c27b0'
    };

    // Send message
    const result = await slackClient.chat.postMessage({
      channel: channel,
      text: message,
      username: username,
      attachments: [{
        color: colors[severity],
        text: `Severity: ${severity.toUpperCase()}`,
        footer: 'Vibe Stack MCP Server',
        ts: Math.floor(Date.now() / 1000)
      }]
    });

    return {
      success: true,
      messageId: result.message.ts,
      channel: result.message.channel,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`Slack API error: ${error.message}`);
  }
}

module.exports = { sendSlackNotification };
```

### 4. Validation

```javascript
// middleware/slackValidation.js
const { validateSlackChannel } = require('../utils/validators');

async function validateSlackNotification(args) {
  const errors = [];

  // Validate channel format
  if (!args.channel.match(/^#[A-Z0-9]+$/)) {
    errors.push({
      field: 'channel',
      message: 'Channel must start with # and contain only uppercase letters and numbers'
    });
  }

  // Validate message length
  if (args.message.length > 1000) {
    errors.push({
      field: 'message',
      message: 'Message must be 1000 characters or less'
    });
  }

  // Validate Slack token is configured
  if (!process.env.SLACK_TOKEN) {
    errors.push({
      field: 'config',
      message: 'SLACK_TOKEN environment variable not set'
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

module.exports = { validateSlackNotification };
```

### 5. Testing

```javascript
// tests/customTools.test.js
const { sendSlackNotification } = require('../controllers/slackController');

describe('Slack Notification Tool', () => {
  test('sends notification to Slack', async () => {
    const result = await sendSlackNotification({
      channel: '#general',
      message: 'Test notification',
      severity: 'info'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test('handles errors gracefully', async () => {
    await expect(
      sendSlackNotification({
        channel: '#invalid',
        message: 'Test',
        severity: 'info'
      })
    ).rejects.toThrow();
  });
});
```

---

## Validation

### Creating Custom Validators

```javascript
// utils/validators/customValidators.js

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate task ID format
 */
function validateTaskId(id) {
  return /^task-[a-z0-9]+$/.test(id);
}

/**
 * Custom validation function
 */
function validateCustomInput(input) {
  const errors = [];

  if (!input.param1) {
    errors.push({
      field: 'param1',
      message: 'param1 is required'
    });
  }

  if (input.param2 && input.param2 < 0) {
    errors.push({
      field: 'param2',
      message: 'param2 must be positive'
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  validateEmail,
  validateURL,
  validateTaskId,
  validateCustomInput
};
```

### Using Validators in Controllers

```javascript
const { validateCustomInput } = require('../utils/validators/customValidators');

async function handleMyCustomTool(args) {
  // Validate input
  const validation = validateCustomInput(args);
  if (!validation.valid) {
    throw new ValidationError(validation.errors);
  }

  // Proceed with logic
  return await executeBusinessLogic(args);
}
```

---

## Testing

### Unit Test Template

```javascript
// tests/tools/myCustomTool.test.js

const { handleMyCustomTool } = require('../../controllers/customController');

describe('my_custom_tool', () => {
  test('executes with valid input', async () => {
    const result = await handleMyCustomTool({
      param1: 'test',
      param2: 42,
      optionalParam: true
    });

    expect(result.success).toBe(true);
    expect(result.result.param1).toBe('test');
  });

  test('rejects invalid input', async () => {
    await expect(
      handleMyCustomTool({
        param1: '',
        param2: 42
      })
    ).rejects.toThrow('param1 cannot be empty');
  });

  test('handles optional parameters', async () => {
    const result = await handleMyCustomTool({
      param1: 'test',
      param2: 42
      // optionalParam omitted
    });

    expect(result.success).toBe(true);
    expect(result.result.optionalParam).toBe(false); // default
  });
});
```

### Integration Test Template

```javascript
// tests/integration/customTool.integration.test.js

const request = require('supertest');
const { app } = require('../../http/server');

describe('my_custom_tool Integration', () => {
  test('executes via HTTP API', async () => {
    const response = await request(app)
      .post('/tools')
      .send({
        name: 'my_custom_tool',
        arguments: {
          param1: 'test',
          param2: 42
        }
      })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

---

## Best Practices

### 1. Error Handling

```javascript
async function handleMyTool(args) {
  try {
    // Validate input
    validateInput(args);

    // Execute logic
    const result = await executeLogic(args);

    // Return success
    return {
      success: true,
      result: result
    };

  } catch (error) {
    // Log error
    logger.error(`Tool error: ${error.message}`, { args, error });

    // Return formatted error
    return {
      success: false,
      error: {
        code: error.code || 'TOOL_ERROR',
        message: error.message,
        hint: getErrorHint(error)
      }
    };
  }
}
```

### 2. Input Sanitization

```javascript
const sanitizer = require('../utils/sanitizer');

async function handleMyTool(args) {
  // Sanitize all string inputs
  const sanitized = {
    param1: sanitizer.sanitizeString(args.param1),
    param2: sanitizer.sanitizeNumber(args.param2),
    param3: sanitizer.sanitizeArray(args.param3)
  };

  // Use sanitized values
  return await executeLogic(sanitized);
}
```

### 3. Async/Await

```javascript
// ✅ Good - Use async/await
async function handleMyTool(args) {
  const result1 = await operation1(args);
  const result2 = await operation2(result1);
  return result2;
}

// ❌ Bad - Promise chains
function handleMyTool(args) {
  return operation1(args)
    .then(result1 => operation2(result1))
    .then(result2 => result2);
}
```

### 4. Logging

```javascript
const logger = require('../utils/logger');

async function handleMyTool(args) {
  logger.info('Tool execution started', { tool: 'my_custom_tool' });

  try {
    const result = await executeLogic(args);
    logger.info('Tool execution succeeded', { result });
    return result;
  } catch (error) {
    logger.error('Tool execution failed', { error: error.message });
    throw error;
  }
}
```

### 5. Configuration

```javascript
// Use environment variables for configuration
const config = {
  apiUrl: process.env.CUSTOM_API_URL || 'https://api.example.com',
  timeout: parseInt(process.env.CUSTOM_API_TIMEOUT) || 5000,
  retries: parseInt(process.env.CUSTOM_API_RETRIES) || 3
};

async function callExternalAPI(data) {
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    timeout: config.timeout
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
}
```

---

## Examples

### Example 1: GitHub Integration

```javascript
// controllers/githubController.js
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function createGitHubIssue(args) {
  const { repo, title, body, labels = [] } = args;

  const [owner, repository] = repo.split('/');

  const issue = await octokit.rest.issues.create({
    owner,
    repo: repository,
    title,
    body,
    labels
  });

  return {
    success: true,
    issue: {
      id: issue.data.id,
      number: issue.data.number,
      url: issue.data.html_url
    }
  };
}

module.exports = { createGitHubIssue };
```

### Example 2: Database Query

```javascript
// controllers/databaseController.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function queryDatabase(args) {
  const { query, parameters = [] } = args;

  // Whitelist allowed queries for security
  const allowedQueries = {
    'get_users': 'SELECT * FROM users LIMIT $1',
    'get_tasks': 'SELECT * FROM tasks WHERE status = $1'
  };

  const sql = allowedQueries[query];
  if (!sql) {
    throw new Error('Query not allowed');
  }

  const result = await pool.query(sql, parameters);

  return {
    success: true,
    rows: result.rows,
    count: result.rowCount
  };
}

module.exports = { queryDatabase };
```

### Example 3: File Operations

```javascript
// controllers/fileController.js
const fs = require('fs').promises;
const path = require('path');

async function readFile(args) {
  const { filePath, encoding = 'utf-8' } = args;

  // Security: Prevent path traversal
  const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))/, '');
  const fullPath = path.join(process.env.ALLOWED_DIR, safePath);

  try {
    const content = await fs.readFile(fullPath, encoding);
    return {
      success: true,
      content: content,
      path: fullPath
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

module.exports = { readFile };
```

---

## Related Documentation

- **[MCP_SERVER.md](MCP_SERVER.md)** - MCP Server architecture
- **[MCP_PROTOCOL.md](MCP_PROTOCOL.md)** - MCP protocol details
- **[MCP_TOOLS.md](MCP_TOOLS.md)** - Built-in tools reference
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API reference

---

## Support

- **Issues:** [GitHub Issues](https://github.com/Resinder/vibe-stack/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Resinder/vibe-stack/discussions)

---

**Extension Guide Version:** 1.0.0
**Last Updated:** 2026-01-28
