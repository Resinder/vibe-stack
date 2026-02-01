# Vibe Stack - Architecture Documentation

Technical architecture and design decisions behind Vibe Stack.

> **Related:** For code-level architecture patterns and modular design details, see **[Architecture Guide](../03-technical/07-architecture-guide.md)**.

---

## Overview

Vibe Stack is a Docker-based development environment with clean, layered architecture:

- **Vibe-Kanban**: Task management and AI agent orchestration
- **Open WebUI**: AI chat interface
- **MCP Server**: API bridge (90+ tools, pattern detection)
- **code-server**: Browser-based VS Code

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vibe Stack                              │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │  Open WebUI  │───▶│  MCP Server  │◀───│ Vibe-Kanban │    │
│  │              │    │              │    │              │    │
│  │  AI Chat     │    │  90+ Tools   │    │  Task Board  │    │
│  │  :8081       │    │  :4001       │    │  :4000       │    │
│  └──────────────┘    └──────┬───────┘    └──────┬───────┘    │
│                              │                     │             │
│                              └──────────┬──────────┘             │
│                                         ▼                           │
│                              ┌──────────────┐                    │
│                              │ code-server  │                    │
│                              │              │                    │
│                              │  VS Code     │                    │
│                              │  :8443       │                    │
│                              └──────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## MCP Server Architecture (v1.1.7)

### Modular Layer Design (Zero Spaghetti)

The v1.1.7 MCP Server features a clean 5-layer architecture that eliminates code duplication and provides clear separation of concerns with PostgreSQL storage, WebSocket support, and credential management.

```
┌─────────────────────────────────────────────────────────┐
│              LAYER 5: MCP SERVER + HTTP                   │
│        (Protocol Translation + HTTP API)                │
│                  index.js, http/                         │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│              LAYER 4: CONTROLLERS                        │
│          (MCP Tool Handlers & Orchestration)             │
│                 controllers/                             │
│  • TaskController  • BoardController  • PlanningController│
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│              LAYER 3: MIDDLEWARE                         │
│        (Validation, Error Handling, Routing)             │
│                  middleware/, utils/                     │
│  • Validator  • ErrorHandler  • ToolRouter              │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│              LAYER 2: SERVICES                          │
│           (Business Logic & Pattern Detection)           │
│                      services/                           │
│  • BoardService (CRUD, File Watch, Real-time)          │
│  • TaskPlanningService (Patterns, Estimates)            │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│              LAYER 1: CORE + CONFIG                      │
│         (Domain Models, Constants)                       │
│                    core/, config/                        │
│  • Task, Board  • ValidationError  • TOOLS, LANES       │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │  Bridge File    │
                  │  (JSON State)   │
                  └─────────────────┘
```

### Module Responsibilities

| Layer | Module | Responsibility | Lines of Code |
|-------|--------|---------------|---------------|
| **5. Server** | index.js, http/ | Protocol handling, HTTP API, routing, comprehensive error handling | ~300 |
| **4. Controllers** | taskController.js, boardController.js, planningController.js | Tool execution, request handling with proper validator usage | ~200 |
| **3. Middleware** | validation.js, taskValidation.js, planningValidation.js, inputValidation.js, errorHandler.js, toolRouter.js | Modular input sanitization, validation, error handling, routing | ~600 |
| **2. Services** | boardService.js, taskPlanningService.js | Business logic, pattern detection, CRUD, extracted search helpers | ~400 |
| **1. Core** | models.js, constants.js | Domain models, extracted validation methods, config | ~300 |
| **Tests** | *.test.js (12 files) | Unit tests, integration, boundary, concurrency, security, error recovery | ~3,000 |

**Total Code: ~2,500+ lines** (including WebSocket, credential management, and PostgreSQL integration)

---

## Components

### Vibe-Kanban

**Image:** `node:20-slim`
**Port:** 4000
**Resources:** 2 CPU, 2GB RAM

**Features:**
- AI agent orchestration
- Task board UI
- Dev server management (ports 3000-3100)
- Health monitoring

### Open WebUI

**Image:** `ghcr.io/open-webui/open-webui:main`
**Port:** 8081
**Resources:** 1 CPU, 1GB RAM

**Features:**
- AI chat interface
- Multi-model support (OpenAI, Anthropic, Ollama, etc.)
- MCP server integration
- Custom panels

### MCP Server

**Image:** `node:20-alpine`
**Port:** 4001
**Resources:** 0.5 CPU, 256MB RAM

**Features:**
- 10 MCP tools
- Pattern detection (6 patterns)
- OpenAI-compatible API
- Real-time file watching
- Webhook support

### code-server

**Image:** `codercom/code-server:latest`
**Port:** 8443
**Resources:** 1 CPU, 1GB RAM

**Features:**
- Full VS Code in browser
- Extension support
- Git integration
- Hot reload for dev servers

---

## Data Flow

### Task Planning Flow

```
User Chat (Open WebUI)
    │
    │ "Create plan for OAuth"
    │
    ▼
MCP Server
    │
    ├─► Pattern Detection
    │   └─► Detects "authentication"
    │       └─► Loads 8-task template
    │
    ├─► Task Generation
    │   └─► Creates Task objects
    │
    ├─► Board Update
    │   └─► Writes to bridge file
    │
    └─► Response
        └─► Returns summary to user
```

### Real-time Sync

```
┌──────────────┐     watchFile     ┌──────────────┐
│  MCP Server  │◀───────────────────│  Bridge File │
│              │                    │              │
│  • Listener  │     onChange       │  .json       │
│  • Notifier  │                     │              │
└──────────────┘                     └──────────────┘
       │
       │ notifyWatchers()
       ▼
┌──────────────┐
│ Open WebUI   │
│  (Auto-refresh│
│   every 10s)  │
└──────────────┘
```

### Complete Request/Response Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ "Create task plan for OAuth"
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     OPEN WEBUI (Port 8081)                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 1. Capture user input                                  │    │
│  │ 2. Format as MCP request                               │    │
│  │ 3. Send to MCP Server via STDIO/HTTP                   │    │
│  └────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ MCP Protocol
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MCP SERVER (Port 4001)                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ LAYER 5: Protocol Handler                              │    │
│  │ • Parse MCP request                                    │    │
│  │ • Extract tool name and arguments                      │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │                                    │
│  ┌────────────────────────▼───────────────────────────────┐    │
│  │ LAYER 4: Controller (PlanningController)               │    │
│  │ • Validate request parameters                          │    │
│  │ • Route to appropriate service                         │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │                                    │
│  ┌────────────────────────▼───────────────────────────────┐    │
│  │ LAYER 3: Middleware (Validation)                       │    │
│  │ • Sanitize input                                       │    │
│  │ • Validate goal format                                 │    │
│  │ • Check for security issues                           │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │                                    │
│  ┌────────────────────────▼───────────────────────────────┐    │
│  │ LAYER 2: Service (TaskPlanningService)                 │    │
│  │ • Detect patterns (authentication, API, etc.)          │    │
│  │ • Generate task list with estimates                    │    │
│  │ • Calculate priorities and workload                    │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │                                    │
│  ┌────────────────────────▼───────────────────────────────┐    │
│  │ LAYER 1: Core (Board)                                  │    │
│  │ • Create Task objects                                  │    │
│  │ • Add to appropriate lanes                             │    │
│  │ • Update board state                                   │    │
│  └────────────────────────┬───────────────────────────────┘    │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ Write tasks
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BRIDGE FILE (.vibe-kanban-bridge.json)         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ • Persist all tasks                                    │    │
│  │ • Update lastSync timestamp                            │    │
│  │ • Maintain board version                               │    │
│  └────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Watch notification
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  VIBE-KANBAN (Port 4000)                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ • Detect file changes                                  │    │
│  │ • Update UI with new tasks                             │    │
│  │ • Refresh board display                                │    │
│  └────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Return response
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RESPONSE FLOW                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ MCP Server → Open WebUI → User                        │    │
│  │                                                        │    │
│  │ "✓ Generated 8 tasks for OAuth authentication"        │    │
│  │ "• Design authentication architecture (4h, high)"     │    │
│  │ "• Set up authentication backend (8h, high)"          │    │
│  │ "• View complete plan at: http://localhost:4000"      │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         DOCKER HOST                                  │
│                                                                      │
│  ┌──────────────────┐     ┌──────────────────┐     ┌─────────────┐ │
│  │   Open WebUI     │     │   MCP Server     │     │ Vibe-Kanban │ │
│  │                  │     │                  │     │             │ │
│  │  • AI Chat UI    │◄────│  • Tool Router   │◄────│  • Task UI  │ │
│  │  • MCP Client    │ STD │  • Pattern Detect│ Sync │  • Board    │ │
│  │  • Custom Panels │     │  • Plan Generator│     │  • State    │ │
│  │                  │     │  • Validation    │     │             │ │
│  └──────────────────┘     └────────┬─────────┘     └──────┬──────┘ │
│           │                         │                      │        │
│           │                         │                      │        │
│           │                         │                      │        │
│  ┌────────┴─────────────────────────┴──────────────────────┴─────┐ │
│  │                      SHARED VOLUMES                           │ │
│  │  ┌────────────┐  ┌─────────────────┐  ┌─────────────────┐   │ │
│  │  │   repos/   │  │  bridge file    │  │   secrets/      │   │ │
│  │  │  Workspace │  │  (State sync)   │  │  API Keys       │   │ │
│  │  └────────────┘  └─────────────────┘  └─────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                      │                            │
│  ┌───────────────────────────────────┴────────────────────────┐   │
│  │                    code-server (VS Code)                   │   │
│  │  • Browser-based IDE                                      │   │
│  │  • Access to repos/                                       │   │
│  │  • Hot reload dev servers                                 │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Exposed Ports
                                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL WORLD                            │
│                                                                      │
│  Port 4000 → Vibe-Kanban (Task Board)                                │
│  Port 4001 → MCP Server (API)                                        │
│  Port 8081 → Open WebUI (AI Chat)                                    │
│  Port 8443 → code-server (IDE)                                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
vibe-stack/
│
├── docker-compose.yml          # Service orchestration
├── Makefile                    # CLI commands
├── .env                        # Environment variables
│
├── mcp-server/                 # MCP Server (v1.1.7 - Modular Architecture)
│   ├── src/                   # Source code (modules-based structure)
│   │   ├── index.js           # Server entry point
│   │   ├── package.json       # Dependencies & test scripts
│   │   ├── Dockerfile         # Container build
│   │   │
│   │   ├── config/            # Configuration Layer
│   │   │   ├── constants.js   # Tool definitions, lanes, priorities
│   │   │   ├── tools.js       # MCP tool schemas
│   │   │   ├── defaults.js    # Default values
│   │   │   └── validationConstants.js
│   │   │
│   │   ├── core/              # Domain Models (Layer 1)
│   │   │   └── models.js      # Task, Board, ValidationError
│   │   │
│   │   ├── services/          # Business Logic (Layer 2)
│   │   │   └── boardService.js # Board operations, WebSocket integration
│   │   │
│   │   ├── middleware/        # Cross-cutting (Layer 3)
│   │   │   ├── validation.js         # Re-exports modular validators
│   │   │   ├── taskValidation.js     # Task-specific validation
│   │   │   ├── planningValidation.js # Planning-specific validation
│   │   │   ├── inputValidation.js    # General input validation
│   │   │   ├── errorHandler.js       # Custom errors, error handling
│   │   │   └── rateLimit.js          # Rate limiting middleware
│   │   │
│   │   ├── utils/             # Shared Utilities
│   │   │   ├── toolRouter.js        # Tool call routing
│   │   │   ├── sanitizer.js         # Input sanitization
│   │   │   ├── logger.js            # Structured logging
│   │   │   ├── responseFactory.js   # Response formatting
│   │   │   ├── shutdown.js          # Graceful shutdown
│   │   │   └── metrics.js           # Prometheus metrics
│   │   │
│   │   ├── factories/         # Object Factory
│   │   │   └── taskFactory.js       # Task creation
│   │   │
│   │   ├── controllers/       # Credential Controllers
│   │   │   └── credentialController.js
│   │   │
│   │   ├── http/              # HTTP API (Layer 5)
│   │   │   ├── server.js      # HTTP server setup
│   │   │   └── routes.js      # HTTP route handlers
│   │   │
│   │   ├── mcp/               # MCP Protocol Layer
│   │   │   ├── mcpServer.js   # MCP server implementation
│   │   │   ├── initializers.js # Tool initialization
│   │   │   └── clientManager.js # Client management
│   │   │
│   │   ├── websocket/         # WebSocket Layer
│   │   │   ├── server.js      # WebSocket server
│   │   │   ├── boardSync.js   # Board synchronization
│   │   │   └── logger.js      # WebSocket logging
│   │   │
│   │   ├── shared/            # Shared Components
│   │   │   ├── credentials/   # Credential Management
│   │   │   │   ├── CredentialStorage.js
│   │   │   │   ├── ProjectCredentialManager.js
│   │   │   │   ├── CredentialAnalytics.js
│   │   │   │   └── providers/  # Provider implementations
│   │   │   ├── storage/       # Storage Abstractions
│   │   │   │   └── postgresStorage.js
│   │   │   └── utils/         # Shared utilities
│   │   │       └── gitCredentials.js
│   │   │
│   │   └── modules/           # Feature Modules
│   │       ├── kanban/        # Kanban Board Module
│   │       │   ├── controllers/ # task, board, planning
│   │       │   ├── services/    # taskPlanningService
│   │       │   └── index.js
│   │       ├── repository/    # Git Repository Module
│   │       │   ├── controllers/ # git, repo
│   │       │   └── index.js
│   │       ├── github/        # GitHub Integration Module
│   │       │   ├── controllers/ # github
│   │       │   └── index.js
│   │       ├── environment/   # Environment Management Module
│   │       │   ├── controllers/ # docker, environment
│   │       │   └── index.js
│   │       ├── documentation/ # Documentation Module
│   │       │   ├── controllers/ # documentation
│   │       │   └── index.js
│   │       └── devtools/      # Development Tools Module
│   │           ├── controllers/ # apiTesting, codeQuality, command, file
│   │           └── index.js
│   │
│   ├── tests/                 # Comprehensive Test Suite (270+ tests)
│   │   ├── models.test.js          # Task & Board model tests
│   │   ├── validation.test.js      # Input validation tests
│   │   ├── services.test.js        # Service layer tests
│   │   ├── error-handling.test.js  # Error handling tests
│   │   ├── security.test.js        # Security & sanitization tests
│   │   ├── controllers.test.js     # Controller layer tests
│   │   ├── integration.test.js     # End-to-end workflow tests
│   │   ├── websocket.test.js       # WebSocket tests
│   │   ├── credentials.test.js     # Credential management tests
│   │   └── e2e/                    # End-to-end tests
│   │       ├── docker-deployment.test.js
│   │       ├── full-stack.test.js
│   │       └── performance.test.js
│   │
│   ├── package.json           # Dependencies & scripts
│   └── Dockerfile             # Container build
│
├── scripts/                    # Shell scripts organization
│   ├── setup/                 # Setup and initialization
│   │   └── init.sh            # Setup script
│   ├── ops/                   # System operations
│   │   ├── evolve.sh          # Evolution analysis
│   │   ├── test-harness.sh    # Immune system validation
│   │   └── kanban-sync.sh     # Board sync script
│   ├── dev/                   # Development tools
│   │   └── dev-server.sh      # Development server launcher
│   ├── docker/                # Docker utilities
│   │   └── docker-entrypoint.sh
│   └── lib/                   # Shared libraries
│       └── common.sh          # Common shell functions
│
├── services/                   # Service components
│   ├── open-webui-custom/     # Custom UI panels
│   │   └── kanban-panel.html  # Board view
│   └── observer-dashboard/    # System monitoring
│       └── index.html         # Health dashboard
│
├── config/                     # Configuration files
│   └── state/                 # State management files
│       └── .vibe-state.json.example
│
├── agents/claude/              # Claude Code config
│
├── docs/                       # Documentation
│   ├── GUIDE.md               # User guide
│   ├── OPENWEBUI.md           # Open WebUI setup
│   ├── API.md                 # API reference
│   └── ARCHITECTURE.md        # This file
│
├── lib/                        # Shared shell library
│   └── common.sh              # Common functions
│
├── kanban-sync.sh              # Board sync script
│
└── .vibe-kanban-bridge.json   # Board state (single source of truth)
```

---

## Design Principles

### 1. Single Responsibility

Each layer has one job:
- Core: Domain models
- Services: Business logic
- Adapters: External integration
- Controllers: Request handling
- Server: Protocol translation

### 2. No Circular Dependencies

Data flows one direction:
```
User → MCP → Controller → Service → Core → File
```

### 3. Interface Segregation

Each service exposes minimal interface:
```javascript
class BoardService {
  addTask(task)      // Add task
  moveTask(id, lane)  // Move task
  updateTask(id, data)// Update task
  getBoard()         // Get board
}
```

### 4. Dependency Inversion

High-level layers depend on abstractions:
```javascript
// Controller depends on Service interface
class MCPController {
  constructor(boardService, planningService) {
    this.boardService = boardService;      // Interface
    this.planningService = planningService; // Interface
  }
}
```

### 5. Open/Closed Principle

Open for extension, closed for modification:
- Add new patterns without changing core
- Add new tools without modifying server
- Add new services without breaking existing code

---

## Pattern Detection

### How It Works

```javascript
// Pattern definitions
const PATTERNS = {
  authentication: {
    keywords: ['auth', 'login', 'oauth', 'jwt'],
    tasks: [/* 8 tasks */]
  },
  database: {
    keywords: ['database', 'sql', 'postgres'],
    tasks: [/* 7 tasks */]
  },
  // ... more patterns
};

// Detection
function analyzeGoal(goal) {
  const detected = [];
  const goalLower = goal.toLowerCase();

  for (const [name, pattern] of Object.entries(PATTERNS)) {
    for (const keyword of pattern.keywords) {
      if (goalLower.includes(keyword)) {
        detected.push({ name, pattern });
        break;
      }
    }
  }

  return detected;
}
```

### Adding New Patterns

1. Define pattern in `TaskPlanningService`
2. Add keywords
3. Define tasks
4. That's it!

```javascript
const PATTERNS = {
  // ... existing patterns

  'monitoring': {
    keywords: ['monitoring', 'metrics', 'alerting', 'observability'],
    tasks: [
      { title: 'Set up metrics collection', priority: 'high', hours: 4 },
      { title: 'Configure alerting rules', priority: 'high', hours: 3 },
      { title: 'Create monitoring dashboard', priority: 'medium', hours: 6 },
      { title: 'Set up log aggregation', priority: 'medium', hours: 4 },
      { title: 'Configure health checks', priority: 'medium', hours: 3 }
    ]
  }
};
```

---

## State Management

### Single Source of Truth

```
.vibe-kanban-bridge.json
```

**Why:**
- Simple (no database needed)
- Human-readable
- Git-tracked
- Easy to backup
- Fast to read/write

### State Structure

```json
{
  "lanes": {
    "backlog": [...],
    "todo": [...],
    "in_progress": [...],
    "done": [...],
    "recovery": [...]
  },
  "lastSync": "2025-01-25T14:30:00.000Z",
  "version": "1.0.0"
}
```

### Update Flow

```
┌──────────────┐
│   User Chat  │ "Create plan for OAuth"
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  MCP Server  │
│              │
│ 1. Generate  │
│    tasks     │
│              │
│ 2. Write to  │
│    file      │───────┐
└──────────────┘       │
                       ▼
              ┌──────────────┐
              │ Bridge File  │
              │              │
              │ • New tasks  │
              │ • Updated    │
              └──────────────┘
                       │
                       │ watchFile()
                       ▼
              ┌──────────────┐
              │   Sync       │
              └──────────────┘
```

---

## Security

### Isolation

| Component | Access |
|-----------|--------|
| `/root/secrets/` | Root only (not accessible to AI) |
| `.env` | Environment variables |
| Bridge file | Read by all services, written by MCP |
| Workspace | Mounted in all containers |

### Best Practices

1. **Never commit secrets**
   - `.env` in `.gitignore`
   - Use `.env1.1.7example` as template

2. **API keys in dedicated files**
   - `agents/claude/settings.json`
   - File permissions: `600`

3. **Resource limits**
   - CPU/memory constraints per container
   - Prevents runaway processes

---

## Performance

### Metrics

| Metric | Value |
|--------|-------|
| MCP Server Startup | ~2 seconds |
| Tool Execution | <100ms average |
| File Sync | Instant (fs.watch) |
| Memory Usage | ~64MB (MCP server) |
| Container Build | ~30 seconds |

### Optimization Techniques

1. **File Watching**
   - Uses `fs.watch()` for instant updates
   - No polling overhead

2. **Lazy Loading**
   - Board loaded on demand
   - Services initialized when needed

3. **Connection Pooling**
   - Reuse HTTP connections
   - Keep-alive enabled

---

## Testing

### Modular Test Suite (v1.1.7)

The MCP server includes a comprehensive test suite with **319 tests** (309 passing, 10 skipped) across multiple test files:

```bash
# Run all tests
cd mcp-server && npm test

# Run specific test modules
npm run test:models          # Task & Board model tests
npm run test:validation      # Input validation tests
npm run test:services        # Business logic tests
npm run test:error-handling  # Error handling tests
npm run test:security        # Security & sanitization tests
npm run test:controllers     # Controller layer tests
npm run test:multi-user      # Multi-user collaboration scenarios
```

### Test Categories

| Category | File | Tests | Coverage |
|----------|------|-------|----------|
| Core Tests | models.test.js | 11 | Task, Board model validation |
| Validation | validation.test.js | 27 | Input sanitization, validation (modular validators) |
| Services | services.test.js | 10 | BoardService, TaskPlanningService |
| Error Handling | error-handling.test.js | 25 | Custom error classes, handlers |
| Security | security.test.js | 28 | Path traversal, injection prevention |
| Controllers | controllers.test.js | 14 | Task, Board, Planning controllers |
| Integration | integration.test.js | 14 | End-to-end workflow tests |
| **Boundary Tests** | boundary.test.js | 71 | Edge cases, limits, boundaries |
| **Concurrency Tests** | concurrency.test.js | 17 | Race conditions, concurrent access |
| **Security Bypass** | security-bypass.test.js | 63 | Bypass attempts, injection attacks |
| **Error Recovery** | error-recovery.test.js | 27 | Corrupted data, filesystem errors |
| **Complete Workflows** | integration-complete-workflows.test.js | 148 | End-to-end user journeys |
| **Multi-User Scenarios** | multi-user-scenarios.test.js | 21 | Collaboration, concurrent ops |
| **Total** | **13+ files** | **319** | **80 test suites** |

### Enhanced Test Coverage (v1.1.7)

**Boundary Tests (71 tests):**
- Title length boundaries (min, max, Unicode, special characters)
- Description length limits and edge cases
- estimatedHours validation (0, negative, decimals, large numbers)
- Priority/lane validation (exact match required, case-sensitive)
- Tag limits (max 10 tags, length validation)
- Assignee format validation
- Search query boundaries (max 500 chars, empty, Unicode)
- Task ID format validation
- Task count limits (max 100 per batch, max 1000 total)

**Concurrency Tests (17 tests):**
- Concurrent task creation from multiple service instances
- Simultaneous file access patterns
- Concurrent move operations on same task
- Concurrent update operations
- Board state consistency under concurrent access

**Security Bypass Tests (63 tests):**
- Type coercion prevention (number as string, boolean as string)
- Prototype pollution prevention (__proto__, constructor, prototype)
- Property shadowing prevention (toString, valueOf, hasOwnProperty)
- NoSQL injection prevention ($ne, $gt, $where operators)
- Command injection prevention (shell metacharacters, command chaining)
- XSS payload testing (script tags, event handlers, javascript: URLs)
- Path traversal prevention (../, ..\, encoded variants)
- SQL injection prevention (UNION, SELECT, DROP statements)
- ReDoS prevention (catastrophic backtracking patterns)
- Control character and NULL byte handling
- Large payload handling (DoS prevention)

**Error Recovery Tests (27 tests):**
- Corrupted bridge file handling (invalid JSON, truncated, malformed)
- Missing required fields recovery
- Invalid task objects handling
- File system errors (file deleted during operation, permission errors)
- Directory not existing scenarios
- Watcher failure handling
- Service state after errors

**Complete Workflow Tests (12 tests):**
- Full task lifecycle (create → move → update → search → verify)
- Multiple tasks through complete lifecycle
- Planning to execution workflow (generate → review → execute → complete)
- Batch operations workflow (create → move → update → verify stats)
- Error recovery workflow (operation failure → recovery → continue)
- Search and filter workflow
- Stats accuracy throughout workflow

### Test Organization

```
tests/
├── models.test.js          # Domain model tests
│   ├── Task Model
│   │   ├── Constructor validation
│   │   ├── ID generation
│   │   └── toJSON/fromJSON
│   └── Board Model
│       ├── Lane initialization
│       ├── Task management
│       └── Metadata handling
│
├── validation.test.js      # Input validation tests
│   ├── String Sanitization
│   │   ├── Null byte removal
│   │   ├── Control character removal
│   │   └── Length limits
│   ├── Task ID Validation
│   ├── Lane Validation
│   ├── Priority Validation
│   └── File Path Validation
│
├── services.test.js        # Business logic tests
│   ├── BoardService
│   │   ├── CRUD operations
│   │   ├── Task moving
│   │   ├── Statistics
│   │   └── Search functionality
│   └── TaskPlanningService
│       ├── Pattern detection
│       ├── Task generation
│       └── Goal analysis
│
├── error-handling.test.js  # Error handling tests
│   ├── AppError
│   ├── TaskNotFoundError
│   ├── InvalidLaneError
│   ├── BoardError
│   ├── ErrorHandler.wrap()
│   └── ErrorHandler.handle()
│
├── security.test.js        # Security tests
│   ├── Input Sanitization
│   ├── Path Traversal Prevention
│   ├── Injection Prevention
│   ├── ReDoS Prevention
│   └── Task ID Validation
│
└── controllers.test.js     # Controller tests
    ├── TaskController
    │   ├── Create task
    │   ├── Move task
    │   ├── Update task
    │   ├── Search tasks
    │   └── Batch operations
    ├── BoardController
    │   ├── Get board
    │   ├── Get stats
    │   └── Get context
    └── PlanningController
        ├── Generate plan
        └── Analyze goal
└── integration.test.js     # End-to-end workflow tests
    ├── Complete Task Workflow
    │   ├── Create task through controller
    │   ├── Move task through lanes
    │   ├── Update and persist changes
    │   ├── Search across lanes
    │   ├── Batch create tasks
    │   └── Get accurate board stats
    ├── Planning Workflow
    │   ├── Generate and add tasks
    │   ├── Analyze goal patterns
    │   └── Validate input properly
    ├── Error Handling
    │   ├── Handle invalid task ID
    │   ├── Handle invalid lane
    │   └── Handle invalid input data
    └── Data Persistence
        ├── Persist across instances
        └── Maintain consistency after updates
```

### System Test Harness

```bash
make test-harness
```

**Validates:**
1. Configuration files
2. Shell script syntax
3. Container startup
4. Health checks
5. Service availability

### Evolution Analysis

```bash
make evolve
```

**Analyzes:**
1. Service health
2. Resource usage
3. Image versions
4. Configuration issues

---

## Architecture Evolution

### Key Features (Current Version v1.1.7)

1. **Modular Validation System**
   - Separate validators for different domains (tasks, planning, input)
   - Reusable validation components
   - Consistent error messaging

2. **Factory Pattern Implementation**
   - `TaskFactory` for consistent task creation
   - Centralized object construction
   - Reduced code duplication

3. **Enhanced Error Handling**
   - Custom error classes for each domain
   - Contextual error messages with hints
   - Proper error propagation

4. **Structured Logging**
   - Configurable log levels (error, warn, info, debug)
   - Timestamps and context information
   - Request tracking

5. **HTTP API Layer**
   - Standalone HTTP server
   - RESTful endpoints for all tools
   - OpenAI-compatible API

### New Utility Modules

| Module | Purpose | Key Features |
|--------|---------|--------------|
| `logger.js` | Structured logging | Log levels, timestamps, formatting |
| `sanitizer.js` | Input sanitization | Control chars, null bytes, trimming |
| `responseFactory.js` | Response formatting | Consistent API responses |
| `shutdown.js` | Graceful shutdown | Cleanup, signal handling |
| `toolRouter.js` | Tool routing | Eliminates code duplication |

### New Middleware

| Module | Purpose |
|--------|---------|
| `inputValidation.js` | General input validation |
| `taskValidation.js` | Task-specific validation |
| `planningValidation.js` | Planning-specific validation |
| `errorHandler.js` | Custom error classes & handling |

### New HTTP Layer

| File | Purpose |
|------|---------|
| `http/server.js` | HTTP server setup |
| `http/routes.js` | HTTP route handlers |

---

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Vibe-Kanban native API integration
- [ ] Task dependencies
- [ ] Sprint planning mode
- [ ] Time tracking
- [ ] Multi-project support

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

**For implementation details, see source code in `mcp-server/enhanced/`**
