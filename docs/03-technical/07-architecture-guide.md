# Vibe Stack - Modular Architecture Guide

Complete guide to Vibe Stack's modular architecture, design patterns, and extensibility.

> **Related:** For system architecture and deployment details, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Design Patterns](#design-patterns)
- [Module Structure](#module-structure)
- [Dependency Injection](#dependency-injection)
- [Error Handling](#error-handling)
- [Configuration System](#configuration-system)
- [Extending the System](#extending-the-system)

---

## Architecture Overview

Vibe Stack follows a **layered modular architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   HTTP API   │  │  MCP API     │  │  CLI         │      │
│  │   (routes)   │  │  (mcp)       │  │  (make)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Controller Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │TaskController│  │BoardController│ │PlanningController│   │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ BoardService │  │PlanningService│                       │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        Core Layer                             │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Task       │  │   Board      │                        │
│  │   Models     │  │   Models     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Config   │  │  Logger  │  │   Cache  │  │  Paths   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Separation of Concerns** - Each layer has a single responsibility
2. **Dependency Inversion** - Depend on abstractions, not concretions
3. **Open/Closed Principle** - Open for extension, closed for modification
4. **Interface Segregation** - Small, focused interfaces
5. **Don't Repeat Yourself** - Reusable components and utilities

---

## Design Patterns

### 1. Dependency Injection Pattern

**Location**: `mcp-server/src/di/container.js`

The DI container manages service lifecycles and dependencies:

```javascript
import { container, register, resolve } from './di/container.js';

// Register services
register('boardService', BoardService, {
  lifetime: 'singleton',
  dependencies: ['logger', 'config']
});

// Resolve service
const boardService = resolve('boardService');
```

**Supported Lifetimes:**
- **Singleton** - One instance shared across application
- **Transient** - New instance created each time
- **Scoped** - One instance per request scope

### 2. Factory Pattern

**Location**: `mcp-server/src/factories/taskFactory.js`

Creates consistent Task objects:

```javascript
import { TaskFactory } from './factories/taskFactory.js';

const task = TaskFactory.create({
  title: 'Implement OAuth',
  priority: 'high',
  estimatedHours: 8
});
```

### 3. Repository Pattern

**Location**: `mcp-server/src/services/boardService.js`

Abstracts data access:

```javascript
// BoardService acts as repository
const tasks = await boardService.getTasksByLane('backlog');
const task = await boardService.getTask('task-123');
```

### 4. Strategy Pattern

**Location**: `mcp-server/src/services/taskPlanningService.js`

Different pattern matching strategies:

```javascript
// Match patterns based on keywords
const patterns = await planningService.matchPatterns(context);
```

### 5. Middleware Pattern

**Location**: `mcp-server/src/middleware/`

Request/response processing pipeline:

```javascript
import { validationMiddleware } from './middleware/validation.js';
import { errorHandlingMiddleware } from './middleware/errorHandler.js';

// Apply middleware
app.use(validationMiddleware);
app.use(errorHandlingMiddleware);
```

---

## Module Structure

### Configuration Modules

**Path**: `mcp-server/src/config/`

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| **settings.js** | Environment-based configuration | `getConfig()`, `getEnvironment()` |
| **paths.js** | Centralized path management | `getBridgeFile()`, `getPatternsDir()` |
| **schema.js** | Configuration schema definition | `validateConfigValue()`, `getSchemaForKey()` |
| **constants.js** | Application constants | `getRuntimeConfig()` |
| **validator.js** | Configuration validation | `validateConfig()`, `validateOrThrow()` |

### Service Modules

**Path**: `mcp-server/src/services/`

| Module | Purpose | Interface |
|--------|---------|-----------|
| **boardService.js** | Board & task management | `IBoardService` |
| **taskPlanningService.js** | AI task planning | `ITaskPlanningService` |

### Controller Modules

**Path**: `mcp-server/src/controllers/`

| Module | Purpose | Methods |
|--------|---------|---------|
| **taskController.js** | Task HTTP handlers | `createTask()`, `updateTask()`, `deleteTask()` |
| **boardController.js** | Board HTTP handlers | `getBoard()`, `syncBoard()` |
| **planningController.js** | Planning HTTP handlers | `generatePlan()` |

### Utility Modules

**Path**: `mcp-server/src/utils/`

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| **logger.js** | Structured logging | `debug()`, `info()`, `warn()`, `error()` |
| **sanitizer.js** | Input sanitization | `sanitizeInput()`, `sanitizePath()` |
| **responseFormatter.js** | Response formatting | `MCPResponseFormatter`, `HTTPResponseFormatter` |

### Error Modules

**Path**: `mcp-server/src/errors/`

| Module | Purpose | Key Classes |
|--------|---------|-------------|
| **errorFactory.js** | Error creation | `ValidationError`, `NotFoundError`, `ErrorFactory` |

### DI Modules

**Path**: `mcp-server/src/di/`

| Module | Purpose | Key Classes |
|--------|---------|-------------|
| **container.js** | Dependency injection | `DIContainer`, `register()`, `resolve()` |

---

## Dependency Injection

### Service Registration

Services are registered in the DI container:

```javascript
import { container } from './di/container.js';
import { BoardService } from './services/boardService.js';
import { TaskPlanningService } from './services/taskPlanningService.js';

// Register as singletons
container.singleton('boardService', BoardService, {
  dependencies: ['logger', 'config'],
  description: 'Board and task management service'
});

container.singleton('planningService', TaskPlanningService, {
  dependencies: ['logger', 'config', 'patterns'],
  description: 'AI-powered task planning service'
});
```

### Service Resolution

Services are resolved from the container:

```javascript
import { resolve } from './di/container.js';

// Resolve service (injects dependencies automatically)
const boardService = resolve('boardService');

// Use service
const tasks = await boardService.getTasks();
```

### Scoped Services

For request-scoped services:

```javascript
import { createScope } from './di/container.js';

// Create scope
const exitScope = createScope('request-123');

// Use scoped services
const service1 = resolve('scopedService');
const service2 = resolve('scopedService'); // Same instance

// Exit scope
exitScope();
```

---

## Error Handling

### Error Hierarchy

```
AppError (base)
├── ValidationError
│   ├── RequiredFieldError
│   ├── InvalidFormatError
│   └── OutOfRangeError
├── NotFoundError
│   ├── TaskNotFoundError
│   └── BoardNotFoundError
├── AuthenticationError
│   ├── UnauthorizedError
│   └── InvalidTokenError
├── ConflictError
│   └── DuplicateError
├── RateLimitError
├── ServiceUnavailableError
├── ExternalServiceError
├── ConfigurationError
│   └── MissingConfigurationError
├── FileSystemError
│   ├── FileNotFoundError
│   └── PermissionDeniedError
└── BusinessLogicError
    ├── InvalidStateError
    └── OperationNotAllowedError
```

### Creating Errors

Use the error factory for consistent errors:

```javascript
import { ErrorFactory } from './errors/errorFactory.js';

// Create validation error
throw ErrorFactory.create('REQUIRED_FIELD', { field: 'title' });

// Create not found error
throw ErrorFactory.create('TASK_NOT_FOUND', { taskId: '123' });

// Create configuration error
throw ErrorFactory.create('MISSING_CONFIGURATION', { configKey: 'API_KEY' });

// Or use specific error classes
import { ValidationError, TaskNotFoundError } from './errors/errorFactory.js';

throw new ValidationError('Invalid input');
throw new TaskNotFoundError('task-123');
```

### Error Handling Wrapper

Wrap controller methods with error handling:

```javascript
import { withErrorHandling } from './utils/responseFormatter.js';

class TaskController {
  @withErrorHandling
  async createTask(req, res) {
    // Automatic error handling
    const task = await this.taskService.createTask(req.body);
    return res.json(task);
  }
}
```

---

## Configuration System

### Configuration Schema

All configuration is defined in `config/schema.js`:

```javascript
import { CONFIG_SCHEMA, getSchemaForKey } from './config/schema.js';

// Get schema for a config key
const schema = getSchemaForKey('server.port');
console.log(schema);
// {
//   type: 'number',
//   default: 4001,
//   env: 'HTTP_PORT',
//   min: 1024,
//   max: 65535
// }
```

### Environment Variables

All configuration supports environment variables:

```bash
# Server configuration
HTTP_PORT=4001
HOST=0.0.0.0
DEBUG=false
LOG_LEVEL=info

# Vibe-Kanban configuration
VIBE_KANBAN_URL=http://localhost:4000
VIBE_PORT=4000

# Bridge file configuration
BRIDGE_FILE=/data/.vibe-kanban-bridge.json
BRIDGE_SYNC_INTERVAL=5000
```

### Accessing Configuration

Use the centralized settings module:

```javascript
import { server, vibeKanban, bridgeFile } from './config/settings.js';

// Access server config
const port = server.getPort();
const host = server.getHost();
const debug = server.isDebug();

// Access Vibe-Kanban config
const url = vibeKanban.getUrl();
const port = vibeKanban.getPort();

// Access bridge file config
const path = bridgeFile.getPath();
const interval = bridgeFile.getSyncInterval();
```

### Path Management

Use the centralized paths module:

```javascript
import { files, patterns, providers } from './config/paths.js';

// Get file paths
const bridgeFile = files.getBridgeFile();
const stateFile = files.getStateFile();

// Get pattern file paths
const authPattern = patterns.getAuthentication();
const dbPattern = patterns.getDatabase();

// Get provider config paths
const anthropic = providers.getAnthropic();
const zai = providers.getZai();
```

---

## Extending the System

### Adding New Services

1. **Create service class**:
```javascript
// mcp-server/src/services/myService.js
export class MyService {
  constructor(logger, config) {
    this.logger = logger;
    this.config = config;
  }

  async doSomething() {
    this.logger.info('Doing something');
    // Implementation
  }
}
```

2. **Register in DI container**:
```javascript
import { container } from './di/container.js';
import { MyService } from './services/myService.js';

container.singleton('myService', MyService, {
  dependencies: ['logger', 'config']
});
```

3. **Use in controllers**:
```javascript
import { resolve } from './di/container.js';

class MyController {
  constructor() {
    this.myService = resolve('myService');
  }

  async handleRequest(req, res) {
    const result = await this.myService.doSomething();
    return res.json(result);
  }
}
```

### Adding New Error Types

1. **Define error class**:
```javascript
import { AppError } from './errors/errorFactory.js';

export class MyCustomError extends AppError {
  constructor(message, options = {}) {
    super(message, {
      code: 'MY_CUSTOM_ERROR',
      statusCode: 400,
      severity: 'medium',
      ...options
    });
  }
}
```

2. **Add to error factory**:
```javascript
static myCustom(context) {
  return new MyCustomError('Custom error message', context);
}
```

### Adding New Configuration

1. **Add to schema**:
```javascript
// In config/schema.js
myFeature: {
  type: 'boolean',
  default: false,
  env: 'MY_FEATURE_ENABLED',
  description: 'Enable my feature'
}
```

2. **Access through settings**:
```javascript
import { getConfig, getBooleanConfig } from './config/settings.js';

const enabled = getBooleanConfig('MY_FEATURE_ENABLED', false);
```

### Adding New Patterns

1. **Create pattern file**:
```bash
nano config/patterns/my-pattern.json
```

2. **Define pattern**:
```json
{
  "name": "my-pattern",
  "displayName": "My Custom Pattern",
  "description": "Description of my pattern",
  "keywords": ["keyword1", "keyword2"],
  "estimatedHours": 40,
  "taskCount": 6,
  "tasks": [...]
}
```

3. **Pattern is automatically available** for task generation

---

## Module Dependencies

### Dependency Graph

```
constants.js
  ├── settings.js (circular dependency resolved)
  ├── paths.js
  └── schema.js

controllers/
  ├── taskController.js
  │   ├── services/boardService.js
  │   ├── errors/errorFactory.js
  │   └── utils/responseFormatter.js
  ├── boardController.js
  └── planningController.js

services/
  ├── boardService.js
  │   ├── core/models.js
  │   ├── config/paths.js
  │   └── utils/logger.js
  └── taskPlanningService.js
      ├── config/paths.js
      └── utils/logger.js

utils/
  ├── logger.js
  ├── sanitizer.js
  └── responseFormatter.js
```

### Resolving Circular Dependencies

The circular dependency between `constants.js` and `settings.js` has been resolved by:

1. **Lazy imports** - Import only when needed
2. **Dependency injection** - Pass dependencies as parameters
3. **Configuration schema** - Define defaults in schema, not in code

---

## Best Practices

### 1. Use Dependency Injection

❌ **Bad**: Direct instantiation
```javascript
import { BoardService } from './services/boardService.js';

class Controller {
  constructor() {
    this.boardService = new BoardService(); // Tight coupling
  }
}
```

✅ **Good**: DI container
```javascript
import { resolve } from './di/container.js';

class Controller {
  constructor() {
    this.boardService = resolve('boardService'); // Loose coupling
  }
}
```

### 2. Use Centralized Configuration

❌ **Bad**: Hardcoded values
```javascript
const url = 'http://localhost:4000';
const port = 4001;
```

✅ **Good**: Centralized config
```javascript
import { vibeKanban, server } from './config/settings.js';

const url = vibeKanban.getUrl();
const port = server.getPort();
```

### 3. Use Standardized Errors

❌ **Bad**: Generic errors
```javascript
throw new Error('Invalid input');
```

✅ **Good**: Specific errors
```javascript
import { ValidationError } from './errors/errorFactory.js';

throw new ValidationError('Invalid input', {
  details: { field: 'title', reason: 'too short' }
});
```

### 4. Use Response Formatters

❌ **Bad**: Manual response formatting
```javascript
res.status(200).json({
  success: true,
  data: task
});
```

✅ **Good**: Response formatter
```javascript
import { HTTPResponseFormatter } from './utils/responseFormatter.js';

HTTPResponseFormatter.success(res, task);
```

### 5. Use Type Guards

❌ **Bad**: No type checking
```javascript
function processTask(task) {
  return task.id; // May throw if task is null
}
```

✅ **Good**: Type guards
```javascript
import { isTask } from './interfaces/types.js';

function processTask(task) {
  if (!isTask(task)) {
    throw new ValidationError('Invalid task');
  }
  return task.id;
}
```

---

## Module Index

### Complete Module List

**Configuration Modules:**
- `config/settings.js` - Environment-based configuration
- `config/paths.js` - Centralized path management
- `config/schema.js` - Configuration schema definition
- `config/constants.js` - Application constants
- `config/validator.js` - Configuration validator

**Service Modules:**
- `services/boardService.js` - Board & task management
- `services/taskPlanningService.js` - AI task planning

**Controller Modules:**
- `controllers/taskController.js` - Task HTTP handlers
- `controllers/boardController.js` - Board HTTP handlers
- `controllers/planningController.js` - Planning HTTP handlers

**Utility Modules:**
- `utils/logger.js` - Structured logging
- `utils/sanitizer.js` - Input sanitization
- `utils/responseFormatter.js` - Response formatting

**Error Modules:**
- `errors/errorFactory.js` - Error creation and handling

**DI Modules:**
- `di/container.js` - Dependency injection container

**Interface Modules:**
- `interfaces/types.js` - JSDoc interfaces and type guards

---

## Related Documentation

- **[Configuration](../05-operations/01-configuration.md)** - Configuration guide
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development setup
- **[MCP_SERVER.md](MCP_SERVER.md)** - MCP Server architecture
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API reference

---

**Architecture Guide Version:** 1.0.0
**Last Updated:** 2026-01-28
