# Vibe Stack - Development Guide

Complete guide for setting up and contributing to Vibe Stack development.

> **Note:** For basic installation and usage, see the **[Installation Guide](02-installation.md)**. This guide is specifically for developers who want to contribute to or modify the Vibe Stack codebase.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [Building](#building)
6. [Debugging](#debugging)
7. [Code Style](#code-style)
8. [Common Tasks](#common-tasks)

---

## Prerequisites

### Required Software

- **Node.js** v20+ - [Download](https://nodejs.org/)
- **Docker** 20.10+ - [Download](https://www.docker.com/products/docker-desktop)
- **Docker Compose** v2.0+ - Included with Docker Desktop
- **Git** - [Download](https://git-scm.com/)
- **Make** - Usually pre-installed on Unix/Linux
- **Code Editor** - VS Code recommended

### Optional but Recommended

- **Postman** or **curl** - For API testing
- **jq** - For JSON parsing in terminal
- **shellcheck** - For shell script linting

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack
```

### 2. Install Dependencies

```bash
# MCP Server dependencies
cd mcp-server/enhanced
npm install

# Return to project root
cd ../..
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

Required settings:
```bash
CODE_SERVER_PASSWORD=your-secure-password
```

### 4. Start Development Environment

```bash
# Start all services
make up

# Or start in development mode (with logs)
make dev
```

### 5. Verify Setup

```bash
# Run diagnostics
make doctor

# Check service health
make health

# Run tests
cd mcp-server/enhanced && npm test
```

---

## Development Workflow

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes
# Edit files...

# 3. Run tests
cd mcp-server/enhanced && npm test

# 4. Test locally
make up
# Verify your changes work

# 5. Commit
git add .
git commit -m "feat: add my feature"

# 6. Push and create PR
git push origin feature/my-feature
```

### MCP Server Development

The MCP Server uses a modular architecture. When adding features:

```bash
mcp-server/enhanced/
├── config/           # Add new config here
├── core/             # Domain models
├── services/         # Business logic
├── middleware/       # Validation & errors
├── controllers/      # Request handlers
├── utils/            # Utilities
├── factories/        # Object creation
├── http/             # HTTP endpoints
└── tests/            # Add tests here
```

### Adding a New Tool

1. **Add to config/tools.js**:
```javascript
export const TOOLS = {
  // ... existing tools

  vibe_my_new_tool: {
    name: 'vibe_my_new_tool',
    description: 'Does something useful',
    inputSchema: {
      type: 'object',
      properties: {
        param1: { type: 'string' }
      },
      required: ['param1']
    }
  }
};
```

2. **Add controller method** in `controllers/`:
```javascript
export class MyController {
  static async myNewTool(args) {
    // Implementation
    return { success: true, result: '...' };
  }
}
```

3. **Add route** in `http/routes.js`:
```javascript
router.post('/v1/tools/vibe_my_new_tool', async (req, res) => {
  // Handle request
});
```

4. **Add tests** in `tests/`:
```javascript
it('should execute my new tool', () => {
  // Test implementation
});
```

---

## Testing

### Run All Tests

```bash
cd mcp-server/enhanced
npm test
```

### Run Specific Test Suite

```bash
npm run test:models          # Task & Board models
npm run test:validation      # Input validation
npm run test:services        # Business logic
npm run test:error-handling  # Error handling
npm run test:security        # Security tests
npm run test:controllers     # Controllers
npm run test:integration     # End-to-end tests
```

### Watch Mode

```bash
# Run tests on file changes
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Integration Testing

```bash
# Test actual MCP integration
make mcp-test

# Test tool execution
make mcp-tools
```

---

## Building

### Build MCP Server Container

```bash
docker-compose build mcp-server
```

### Build All Containers

```bash
docker-compose build
```

### Rebuild from Scratch

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## Debugging

### Enable Debug Logging

```bash
# Set log level
export LOG_LEVEL=debug

# Or in .env
echo "LOG_LEVEL=debug" >> .env
```

### View Logs

```bash
# All services
make logs

# Specific service
docker logs vibe-mcp-server -f
docker logs vibe-kanban -f
```

### Enter Container for Debugging

```bash
# Vibe-Kanban container
make shell-vibe

# MCP Server container
docker exec -it vibe-mcp-server sh

# code-server container
make shell-code
```

### Debug MCP Server

```bash
# Start MCP server with debug output
cd mcp-server/enhanced
node --inspect index.js
```

Then attach with Chrome DevTools:
1. Open chrome://inspect
2. Click "inspect"
3. Set breakpoints in DevTools

---

## Code Style

### JavaScript Standards

- **ESLint** configuration included
- **Prettier** for formatting (optional)
- **Node.js** native test runner

Run linting:
```bash
cd mcp-server/enhanced
npm run lint
```

Format code:
```bash
npm run format
```

### Shell Script Standards

- **ShellCheck** for validation
- Use `#!/bin/bash` shebang
- Quote all variables: `"$var"`
- Use `[[ ]]` for tests

Check shell scripts:
```bash
shellcheck scripts/**/*.sh
```

### Documentation Standards

- **Markdown** for all docs
- **JSDoc** comments for functions:
```javascript
/**
 * Creates a new task with validation
 * @param {Object} taskData - The task data
 * @param {string} taskData.title - Task title
 * @returns {Promise<Task>} Created task
 */
async function createTask(taskData) {
  // ...
}
```

---

## Common Tasks

### Add New Pattern Detection

Edit `services/taskPlanningService.js`:

```javascript
const PATTERNS = {
  // ... existing patterns

  'microservices': {
    keywords: ['microservice', 'micro-services', 'distributed system'],
    tasks: [
      { title: 'Design service boundaries', priority: 'high', hours: 6 },
      { title: 'Set up service mesh', priority: 'high', hours: 8 },
      { title: 'Implement API gateway', priority: 'high', hours: 6 },
      { title: 'Configure service discovery', priority: 'medium', hours: 4 },
      { title: 'Set up distributed tracing', priority: 'medium', hours: 6 },
      { title: 'Implement circuit breakers', priority: 'medium', hours: 5 },
      { title: 'Configure inter-service communication', priority: 'medium', hours: 4 },
      { title: 'Set up centralized logging', priority: 'low', hours: 3 }
    ]
  }
};
```

### Add New Environment Variable

1. Add to `.env.example`:
```bash
MY_NEW_VAR=default_value
```

2. Use in code:
```javascript
const myVar = process.env.MY_NEW_VAR || 'fallback';
```

3. Document in relevant `.md` file

### Add New Docker Service

1. Add to `docker-compose.yml`:
```yaml
my-service:
  image: my-image:latest
  ports:
    - "8000:8000"
  environment:
    - ENV_VAR=value
  volumes:
    - ./data:/data
```

2. Add health check
3. Update Makefile with commands
4. Update documentation

### Run Single Test

```bash
cd mcp-server/enhanced
node --test tests/models.test.js
```

### Update Dependencies

```bash
cd mcp-server/enhanced

# Check for updates
npm outdated

# Update packages
npm update

# Update major versions
npx npm-check-updates -u
npm install
```

---

## Hot Reload

### MCP Server Hot Reload

For development with auto-restart:

```bash
cd mcp-server/enhanced
npm install --save-dev nodemon
```

Create `nodemon.json`:
```json
{
  "watch": ["*.js", "config/", "core/", "services/"],
  "ext": "js,json",
  "ignore": ["tests/", "*.test.js"],
  "exec": "node index.js"
}
```

Run:
```bash
npx nodemon
```

### Frontend Hot Reload

Frontend files are in `repos/`. To enable hot reload:

```bash
# From code-server terminal
cd /repos/my-project
npm run dev
```

Accessible at http://localhost:3000-3100

---

## Performance Profiling

### Profile MCP Server

```bash
cd mcp-server/enhanced

# Generate profiling data
node --prof index.js

# Analyze profile
node --prof-process isolate-*.log > processed.txt
```

### Memory Profiling

```bash
# Check memory usage
docker stats vibe-mcp-server

# Generate heap snapshot
kill -USR1 <pid>
```

---

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :4001

# Kill process
kill -9 <PID>
```

### Permission Denied

```bash
# Fix permissions
sudo chown -R $USER:$USER .
chmod +x scripts/**/*.sh
```

### Container Won't Start

```bash
# Check logs
docker logs vibe-mcp-server

# Rebuild
docker-compose build mcp-server --no-cache

# Restart
docker-compose up -d
```

### Tests Failing

```bash
# Clear test data
rm -rf mcp-server/enhanced/tests/.test-data

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run tests again
npm test
```

---

## IDE Setup

### VS Code

Recommended extensions:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.js-debug",
    "christian-kohler.path-intellisense",
    "tomoki1207.pdf"
  ]
}
```

### Debug Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug MCP Server",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/mcp-server/enhanced/index.js"
    }
  ]
}
```

---

## Resources

- [Node.js Documentation](https://nodejs.org/docs)
- [Docker Documentation](https://docs.docker.com/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Open WebUI](https://openwebui.com/)
- [Vibe-Kanban](https://github.com/Resinder/vibe-stack)

---

**Happy coding! 🚀**
