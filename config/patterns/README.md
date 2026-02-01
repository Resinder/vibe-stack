# Task Generation Patterns

This directory contains modular pattern definitions for AI-powered task generation in Vibe Stack.

## Overview

Patterns are reusable templates that define common project types and their associated tasks. When you request task generation from Open WebUI, the MCP server analyzes your request and matches it against these patterns to generate relevant tasks.

## Structure

```
config/patterns/
├── README.md              # This file
├── authentication.json    # Authentication & Authorization pattern
├── database.json          # Database & Data Management pattern
├── api.json              # API & Backend Services pattern
├── frontend.json         # Frontend & UI Development pattern
├── testing.json          # Testing & Quality Assurance pattern
├── deployment.json       # Deployment & DevOps pattern
└── [custom].json         # Add your custom patterns here
```

## Pattern Schema

Each pattern file follows this schema:

```json
{
  "_comment": "Pattern description",
  "name": "pattern-name",
  "displayName": "Human Readable Name",
  "description": "Detailed description of what this pattern covers",
  "keywords": ["keyword1", "keyword2", "..."],
  "estimatedHours": 54,
  "taskCount": 8,
  "priorityDistribution": {
    "high": 6,
    "medium": 2,
    "low": 0
  },
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed task description",
      "priority": "high|medium|low",
      "estimatedHours": 8,
      "tags": ["tag1", "tag2"]
    }
  ],
  "dependencies": ["pattern1", "pattern2"],
  "relatedPatterns": ["pattern1", "pattern2"]
}
```

## Available Patterns

### Authentication & Authorization

**File**: `authentication.json`

**Keywords**: auth, login, oauth, jwt, session, password, 2fa, sso, rbac

**Tasks**: 8 tasks (~54 hours)

**Best For**: Projects requiring user authentication, authorization, and session management

**Includes**:
- Authentication architecture design
- Backend implementation
- Password reset flow
- OAuth/SSO integration
- 2FA/MFA support
- Role-based access control (RBAC)
- Authentication UI
- Session management

### Database & Data Management

**File**: `database.json`

**Keywords**: database, sql, nosql, postgres, mongodb, schema, migration, orm

**Tasks**: 7 tasks (~47 hours)

**Best For**: Projects requiring persistent data storage and management

**Includes**:
- Database schema design
- Database server setup
- Migration system
- ORM integration
- Data seeding
- Backup & recovery
- Read replicas

### API & Backend Services

**File**: `api.json`

**Keywords**: api, rest, graphql, backend, server, endpoint, controller, middleware

**Tasks**: 10 tasks (~67 hours)

**Best For**: Building REST/GraphQL APIs and backend services

**Includes**:
- API architecture design
- Server framework setup
- Routing & controllers
- Input validation
- Authentication middleware
- Error handling
- API documentation (Swagger/OpenAPI)
- Rate limiting
- CORS & security headers
- API testing

### Frontend & UI Development

**File**: `frontend.json`

**Keywords**: frontend, ui, ux, react, vue, component, state, routing, responsive

**Tasks**: 9 tasks (~60 hours)

**Best For**: Building web frontends and user interfaces

**Includes**:
- Frontend framework setup
- Component library
- Routing
- State management
- Responsive layout
- Form validation
- Animations & transitions
- Internationalization (i18n)
- Performance optimization

### Testing & Quality Assurance

**File**: `testing.json`

**Keywords**: test, testing, unit, integration, e2e, jest, cypress, ci-cd

**Tasks**: 7 tasks (~47 hours)

**Best For**: Ensuring code quality and catching bugs early

**Includes**:
- Testing framework setup
- Unit tests
- Integration tests
- E2E testing (Cypress/Playwright)
- Test mocking
- CI/CD testing
- Visual regression testing

### Deployment & DevOps

**File**: `deployment.json`

**Keywords**: deploy, docker, kubernetes, ci-cd, aws, monitoring, logging

**Tasks**: 9 tasks (~54 hours)

**Best For**: Production deployment and infrastructure management

**Includes**:
- Deployment architecture design
- Containerization (Docker)
- CI/CD pipeline
- Monitoring (Prometheus/Grafana)
- Centralized logging (ELK)
- Alerting
- Auto-scaling
- Blue-green deployment
- Disaster recovery

## Creating Custom Patterns

To create a custom pattern for your specific use case:

### Step 1: Create Pattern File

```bash
nano config/patterns/my-pattern.json
```

### Step 2: Define Pattern Structure

```json
{
  "_comment": "My custom pattern description",
  "name": "my-pattern",
  "displayName": "My Custom Pattern",
  "description": "Description of what this pattern covers",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "estimatedHours": 40,
  "taskCount": 6,
  "priorityDistribution": {
    "high": 4,
    "medium": 2,
    "low": 0
  },
  "tasks": [
    {
      "title": "First task",
      "description": "Detailed description of the first task",
      "priority": "high",
      "estimatedHours": 8,
      "tags": ["setup", "configuration"]
    }
  ],
  "dependencies": [],
  "relatedPatterns": ["authentication", "database"]
}
```

### Step 3: Restart MCP Server

```bash
docker compose restart mcp-server
```

### Step 4: Test Pattern

Use Open WebUI to generate tasks with keywords matching your pattern.

## Pattern Matching

When you request task generation from Open WebUI, the system:

1. **Analyzes your request** for keywords and context
2. **Matches against patterns** using keyword matching
3. **Selects best-fitting patterns** (can combine multiple)
4. **Generates tasks** from pattern definitions
5. **Customizes tasks** based on your specific context

### Example Requests

```
You: "Create a task plan for implementing OAuth authentication"

System matches: authentication.json (keywords: oauth, auth)

Result: 8 authentication tasks generated

---

You: "I need to build a REST API with user authentication"

System matches: api.json + authentication.json

Result: 10 API tasks + 8 authentication tasks = 18 tasks
```

## Best Practices

### 1. **Keyword Selection**

Choose specific, relevant keywords:
- ✅ Good: `["oauth", "jwt", "sso"]`
- ❌ Bad: `["app", "system", "feature"]`

### 2. **Task Granularity**

Keep tasks focused and achievable:
- ✅ Good: "Implement JWT authentication middleware" (8 hours)
- ❌ Bad: "Build complete auth system" (100+ hours)

### 3. **Priority Distribution**

Most tasks should be high priority for critical patterns:
- High priority: Core functionality, security, performance
- Medium priority: Enhancements, optimizations
- Low priority: Nice-to-have features

### 4. **Time Estimates**

Be realistic with time estimates:
- Simple tasks: 2-4 hours
- Medium tasks: 6-10 hours
- Complex tasks: 12-16 hours

### 5. **Tags**

Use descriptive tags for filtering:
- Technical: `["react", "typescript", "api"]`
- Domain: `["authentication", "database"]`
- Type: `["setup", "testing", "deployment"]`

## Advanced Usage

### Combining Patterns

Patterns can be combined for comprehensive plans:

```
Request: "Build a full-stack application with authentication"

Result:
- frontend.json (9 tasks)
- api.json (10 tasks)
- authentication.json (8 tasks)
- database.json (7 tasks)
- testing.json (7 tasks)

Total: 41 tasks (~282 hours)
```

### Pattern Dependencies

Define dependencies to ensure proper task ordering:

```json
{
  "dependencies": ["database", "authentication"],
  "relatedPatterns": ["api", "frontend"]
}
```

### Customizing for Context

Add project-specific context to customize generated tasks:

```
Request: "Create a React Native mobile app with authentication"

System adapts: Uses authentication.json but customizes tasks for mobile:
- "Set up React Native project"
- "Implement biometric authentication"
- "Add offline authentication support"
```

## Testing Patterns

### Test Pattern Matching

```bash
# Use Open WebUI to test pattern matching
curl -X POST http://localhost:4001/tools/vbm_generate_plan \
  -H "Content-Type: application/json" \
  -d '{
    "context": "Implementing OAuth authentication",
    "constraint": "Use Google OAuth provider"
  }'
```

### Validate Pattern Syntax

```bash
# Validate JSON syntax
cat config/patterns/authentication.json | jq '.'
```

## Troubleshooting

### Pattern Not Matching?

1. **Check keywords**: Ensure your request contains matching keywords
2. **Review pattern name**: Must match filename without extension
3. **Restart MCP server**: `docker compose restart mcp-server`
4. **Check MCP logs**: `docker compose logs mcp-server`

### Tasks Not Generating?

1. **Verify pattern schema**: Ensure all required fields are present
2. **Check task definitions**: Tasks array must have at least one task
3. **Review priority values**: Must be "high", "medium", or "low"

## Related Documentation

- **[MCP_TOOLS.md](../../docs/MCP_TOOLS.md)** - MCP tools reference
- **[MCP_SERVER.md](../../docs/MCP_SERVER.md)** - MCP Server architecture
- **[CONFIGURATION.md](../../docs/CONFIGURATION.md)** - Configuration guide

## Contributing

To contribute new patterns:

1. Create pattern file following the schema
2. Test pattern matching thoroughly
3. Document pattern purpose and use cases
4. Submit pull request with pattern

---

**Patterns Version**: 1.0.0
**Last Updated**: 2026-01-28
