# Vibe Stack - Architecture Documentation

Technical architecture and design decisions behind Vibe Stack.

---

## Overview

Vibe Stack is a Docker-based development environment with clean, layered architecture:

- **Vibe-Kanban**: Task management and AI agent orchestration
- **Open WebUI**: AI chat interface
- **MCP Server**: API bridge (10 tools, pattern detection)
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
│  │  AI Chat     │    │  10 Tools    │    │  Task Board  │    │
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

## MCP Server Architecture

### 5-Layer Design (Zero Spaghetti)

```
┌─────────────────────────────────────────────────────────┐
│              LAYER 5: MCP SERVER                          │
│        (Protocol Translation + HTTP API)                │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│              LAYER 4: CONTROLLERS                        │
│          (MCP Tool Handlers & Orchestration)             │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│              LAYER 3: ADAPTERS                          │
│        (Open WebUI Adapter, Webhook Service)            │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│              LAYER 2: SERVICES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Task Planning│  │ Board        │  │ Webhook      │  │
│  │ Service      │  │ Service      │  │ Service      │  │
│  │              │  │              │  │              │  │
│  │ • Patterns   │  │ • CRUD       │  │ • Events     │  │
│  │ • Planning   │  │ • File Watch │  │ • Queue      │  │
│  │ • Estimates  │  │ • Real-time  │  │ • Retry      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│              LAYER 1: CORE                              │
│         (Domain Models: Task, Board)                    │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │  Bridge File    │
                  │  (JSON State)   │
                  └─────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility | Lines of Code |
|-------|---------------|---------------|
| **5. MCP Server** | Protocol handling, HTTP API, routing | ~200 |
| **4. Controllers** | Tool execution, request handling | ~300 |
| **3. Adapters** | External integration, webhooks | ~100 |
| **2. Services** | Business logic, pattern detection | ~400 |
| **1. Core** | Domain models, validation | ~150 |

**Total: ~1,150 lines** (including comments)

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

---

## File Structure

```
vibe-stack/
│
├── docker-compose.yml          # Service orchestration
├── Makefile                    # CLI commands
├── init.sh                     # Setup script
├── .env                        # Environment variables
│
├── mcp-server/                 # MCP Server (Layer 1-5)
│   └── enhanced/
│       ├── index.js           # Main server (~1,150 lines)
│       ├── package.json       # Dependencies
│       └── Dockerfile         # Container build
│
├── open-webui-custom/          # Custom UI panels
│   └── kanban-panel.html       # Board view
│
├── observer-dashboard/         # System monitoring
│   └── index.html             # Health dashboard
│
├── agents/claude/              # Claude Code config
│
├── docs/                       # Documentation
│   ├── GUIDE.md               # User guide
│   ├── OPENWEBUI.md           # Open WebUI setup
│   ├── API.md                 # API reference
│   └── ARCHITECTURE.md        # This file
│
├── kanban-sync.sh              # Board sync script
├── evolve.sh                   # Evolution analysis
├── test-harness.sh             # Immune system validation
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
  "version": "2.0.0"
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
   - Use `.env.example` as template

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

### Test Harness

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

## Future Enhancements

### Planned

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
