# Vibe Stack - Scripts Reference

Complete reference for all shell scripts in the Vibe Stack project.

---

## Table of Contents

- [Overview](#overview)
- [Script Organization](#script-organization)
- [Setup Scripts](#setup-scripts)
- [Operations Scripts](#operations-scripts)
- [Development Scripts](#development-scripts)
- [Docker Scripts](#docker-scripts)
- [Library Scripts](#library-scripts)
- [Usage Examples](#usage-examples)

---

## Overview

Vibe Stack includes a collection of shell scripts organized by function to automate common tasks:

- **Setup**: Initial project configuration
- **Operations**: System maintenance and evolution
- **Development**: Development server management
- **Docker**: Container lifecycle management
- **Library**: Shared functions and utilities

All scripts are located in the `scripts/` directory and are organized by purpose.

---

## Script Organization

```
scripts/
├── setup/              # Setup and initialization
│   └── init.sh        # First-time setup
├── ops/               # System operations
│   ├── evolve.sh      # Evolution analysis
│   ├── test-harness.sh # Test validation
│   └── kanban-sync.sh # Board synchronization
├── dev/               # Development tools
│   └── dev-server.sh  # Development server launcher
├── docker/            # Docker utilities
│   └── docker-entrypoint.sh # Container entry point
└── lib/               # Shared libraries
    └── common.sh      # Common functions
```

---

## Setup Scripts

### scripts/setup/init.sh

**Purpose**: First-time project setup and initialization.

**Usage**:
```bash
./scripts/setup/init.sh
```

**What it does**:
1. Checks prerequisites (Docker, Git)
2. Creates `.env` from `.env.example` if needed
3. Creates Claude settings from template if needed
4. Sets script permissions
5. Displays next steps

**Run automatically via**:
```bash
make setup
```

**Prerequisites**:
- Docker installed
- Git installed
- Write permissions in project directory

---

## Operations Scripts

### scripts/ops/evolve.sh

**Purpose**: Run self-evolution analysis on the codebase.

**Usage**:
```bash
./scripts/ops/evolve.sh
```

**What it does**:
1. Analyzes current codebase state
2. Identifies improvement opportunities
3. Suggests architectural enhancements
4. Reports on code quality metrics

**Run automatically via**:
```bash
make evolve
```

**Output**: Evolution analysis report with recommendations

---

### scripts/ops/test-harness.sh

**Purpose**: Run immune system validation tests.

**Usage**:
```bash
./scripts/ops/test-harness.sh [options]
```

**Options**:
- `--skip-branch` - Skip branch validation
- `--dry-run` - Show what would be done without executing
- `--verbose` - Show detailed output

**What it does**:
1. Validates current branch
2. Runs test suite
3. Performs dry-run validation
4. Checks service health
5. Triggers Kanban sync on success

**Run automatically via**:
```bash
make test-harness
```

**Exit codes**:
- `0` - All validations passed
- `1` - One or more validations failed

---

### scripts/ops/kanban-sync.sh

**Purpose**: Synchronize system state with Kanban board.

**Usage**:
```bash
./scripts/ops/kanban-sync.sh
```

**What it does**:
1. Reads current board state
2. Updates bridge file
3. Syncs task status
4. Reports sync results

**Run automatically via**:
```bash
make kanban-sync
```

**Integration**: Automatically triggered after successful test-harness run

---

## Development Scripts

### scripts/dev/dev-server.sh

**Purpose**: Launch development server for projects in workspace.

**Usage**:
```bash
./scripts/dev/dev-server.sh [project-dir] [port]
```

**Arguments**:
- `project-dir` - Project directory in `repos/` (required)
- `port` - Port number 3000-3100 (optional, auto-assigned if not provided)

**What it does**:
1. Validates project directory exists
2. Assigns available port if not specified
3. Starts development server
4. Monitors for file changes
5. Manages server lifecycle

**Example**:
```bash
# Start server for specific project
./scripts/dev/dev-server.sh my-react-app 3000

# Auto-assign port
./scripts/dev/dev-server.sh my-node-api
```

**Integration**: Mounted into containers at `/usr/local/bin/dev-server.sh`

---

## Docker Scripts

### scripts/docker/docker-entrypoint.sh

**Purpose**: Container entry point for vibe-kanban service.

**Usage**: Executed automatically on container start.

**What it does**:
1. Sets up container environment
2. Initializes Vibe-Kanban if needed
3. Starts Vibe-Kanban server
4. Handles graceful shutdown

**Environment variables**:
- `PORT` - Server port (default: 4000)
- `HOST` - Bind address (default: 0.0.0.0)
- `NODE_ENV` - Node environment (default: production)

**Signals handled**:
- `SIGTERM` - Graceful shutdown
- `SIGINT` - Interrupt handling

---

## Library Scripts

### scripts/lib/common.sh

**Purpose**: Shared shell functions and utilities.

**Usage**: Sourced by other scripts:
```bash
source scripts/lib/common.sh
```

**Functions provided**:

#### `log_info message`
Log informational message.
```bash
log_info "Starting deployment..."
```

#### `log_warn message`
Log warning message.
```bash
log_warn "Configuration file not found, using defaults"
```

#### `log_error message`
Log error message.
```bash
log_error "Failed to connect to database"
```

#### `check_command command`
Check if command is available.
```bash
if check_command docker; then
    echo "Docker is installed"
fi
```

#### `check_port port`
Check if port is available.
```bash
if check_port 4000; then
    echo "Port 4000 is available"
fi
```

#### `require_command command`
Require command to be available, exit if not.
```bash
require_command docker  # Exits if docker not found
```

---

## Usage Examples

### Initial Setup

```bash
# Run first-time setup
make setup

# Or directly
./scripts/setup/init.sh
```

### Development Workflow

```bash
# Start dev server for project
./scripts/dev/dev-server.sh my-project 3000

# Run tests
cd mcp-server && npm test

# Sync board state
./scripts/ops/kanban-sync.sh
```

### System Maintenance

```bash
# Run evolution analysis
./scripts/ops/evolve.sh

# Run test harness
./scripts/ops/test-harness.sh --skip-branch

# Check system health
make health
```

### Container Operations

```bash
# Enter container shell
make shell-vibe

# View logs
make logs

# Restart services
make restart
```

---

## Script Permissions

All scripts should have executable permissions:

```bash
chmod +x scripts/setup/init.sh
chmod +x scripts/ops/*.sh
chmod +x scripts/dev/*.sh
chmod +x scripts/docker/*.sh
```

The `make setup` command sets these automatically.

---

## Script Conventions

### Naming

- **kebab-case**: All script names use lowercase with hyphens
- **Descriptive**: Names clearly indicate purpose
- **Organized**: Scripts in directories by function

### Shebang

All scripts use:
```bash
#!/bin/bash
```

### Error Handling

Scripts follow these patterns:
- `set -e` - Exit on error
- `set -u` - Exit on undefined variable
- `set -o pipefail` - Exit on pipe failure

### Logging

Standard log levels:
- `INFO` - Informational messages
- `WARN` - Warning messages
- `ERROR` - Error messages
- `DEBUG` - Debug messages (when `LOG_LEVEL=debug`)

---

## Troubleshooting

### Script won't execute

```bash
# Check permissions
ls -l scripts/ops/evolve.sh

# Fix permissions
chmod +x scripts/ops/evolve.sh
```

### Script not found

```bash
# Verify script exists
ls scripts/ops/evolve.sh

# Check path
pwd  # Should be project root
```

### Permission denied

```bash
# Make script executable
chmod +x scripts/ops/evolve.sh

# Or run with bash
bash scripts/ops/evolve.sh
```

---

## Best Practices

1. **Always run from project root**: All scripts assume working directory is project root
2. **Check logs first**: If something fails, check `make logs` for errors
3. **Use Make commands**: Prefer `make` commands over direct script execution
4. **Read error messages**: Scripts provide helpful error messages
5. **Keep scripts updated**: Pull latest changes to get script improvements

---

## Related Documentation

- **[Makefile](../Makefile)** - CLI command reference
- **[User Guide](../02-user-guide/01-user-guide.md)** - User guide
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development setup
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Troubleshooting guide

---

**For issues or questions, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**
