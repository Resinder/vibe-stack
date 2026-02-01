# Vibe Stack - MCP Tools Reference

Complete reference for all 40 MCP Server tools with detailed parameters, examples, and implementation.

---

## Table of Contents

- [Tools Overview](#tools-overview)
- [Task Management Tools](#task-management-tools)
  - [Tool 1: vibe_create_task](#tool-1-vibe_create_task)
  - [Tool 2: vibe_update_task](#tool-2-vibe_update_task)
  - [Tool 3: vibe_move_task](#tool-3-vibe_move_task)
  - [Tool 4: vibe_search_tasks](#tool-4-vibe_search_tasks)
  - [Tool 5: vibe_batch_create](#tool-5-vibe_batch_create)
- [Board Management Tools](#board-management-tools)
  - [Tool 6: vibe_get_board](#tool-6-vibe_get_board)
  - [Tool 7: vibe_get_stats](#tool-7-vibe_get_stats)
  - [Tool 8: vibe_get_context](#tool-8-vibe_get_context)
- [AI Planning Tools](#ai-planning-tools)
  - [Tool 9: vibe_generate_plan](#tool-9-vibe_generate_plan)
  - [Tool 10: vibe_analyze_goal](#tool-10-vibe_analyze_goal)
- [Repository Tools](#repository-tools)
  - [Tool 11: vibe_clone_repo](#tool-11-vibe_clone_repo)
  - [Tool 12: vibe_list_repos](#tool-12-vibe_list_repos)
  - [Tool 13: vibe_analyze_repo](#tool-13-vibe_analyze_repo)
  - [Tool 14: vibe_read_file](#tool-14-vibe_read_file)
  - [Tool 15: vibe_search_code](#tool-15-vibe_search_code)
  - [Tool 16: vibe_delete_repo](#tool-16-vibe_delete_repo)
- [GitHub Tools](#github-tools)
  - [Tool 17: vibe_github_auth_status](#tool-17-vibe_github_auth_status)
  - [Tool 18: vibe_github_create_repo](#tool-18-vibe_github_create_repo)
  - [Tool 19: vibe_github_create_issue](#tool-19-vibe_github_create_issue)
  - [Tool 20: vibe_github_create_pr](#tool-20-vibe_github_create_pr)
  - [Tool 21: vibe_github_list_issues](#tool-21-vibe_github_list_issues)
  - [Tool 22: vibe_github_update_issue](#tool-22-vibe_github_update_issue)
- [File Tools](#file-tools)
  - [Tool 23: vibe_write_file](#tool-23-vibe_write_file)
  - [Tool 24: vibe_list_files](#tool-24-vibe_list_files)
  - [Tool 25: vibe_delete_file](#tool-25-vibe_delete_file)
  - [Tool 26: vibe_move_file](#tool-26-vibe_move_file)
  - [Tool 27: vibe_create_directory](#tool-27-vibe_create_directory)
  - [Tool 28: vibe_get_file_info](#tool-28-vibe_get_file_info)
- [Command Tools](#command-tools)
  - [Tool 29: vibe_run_command](#tool-29-vibe_run_command)
  - [Tool 30: vibe_run_tests](#tool-30-vibe_run_tests)
  - [Tool 31: vibe_run_script](#tool-31-vibe_run_script)
  - [Tool 32: vibe_install_deps](#tool-32-vibe_install_deps)
- [Git Tools](#git-tools)
  - [Tool 33: vibe_git_status](#tool-33-vibe_git_status)
  - [Tool 34: vibe_git_commit](#tool-34-vibe_git_commit)
  - [Tool 35: vibe_git_push](#tool-35-vibe_git_push)
  - [Tool 36: vibe_git_pull](#tool-36-vibe_git_pull)
  - [Tool 37: vibe_git_create_branch](#tool-37-vibe_git_create_branch)
  - [Tool 38: vibe_git_switch_branch](#tool-38-vibe_git_switch_branch)
  - [Tool 39: vibe_git_log](#tool-39-vibe_git_log)
  - [Tool 40: vibe_git_info](#tool-40-vibe_git_info)
- [Common Parameters](#common-parameters)
- [Error Responses](#error-responses)

---

## Tools Overview

| # | Tool | Category | Description |
|---|------|----------|-------------|
| **Task Management** |
| 1 | `vibe_create_task` | CRUD | Create a new task |
| 2 | `vibe_update_task` | CRUD | Update existing task |
| 3 | `vibe_move_task` | Workflow | Move task between lanes |
| 4 | `vibe_search_tasks` | Query | Search/filter tasks |
| 5 | `vibe_batch_create` | CRUD | Create multiple tasks |
| **Board Management** |
| 6 | `vibe_get_board` | Board | Get board with tasks |
| 7 | `vibe_get_stats` | Board | Get board statistics |
| 8 | `vibe_get_context` | Board | Get AI context |
| **AI Planning** |
| 9 | `vibe_generate_plan` | AI | Generate task plan |
| 10 | `vibe_analyze_goal` | AI | Analyze goal |
| **Repository** |
| 11 | `vibe_clone_repo` | Repo | Clone git repository |
| 12 | `vibe_list_repos` | Repo | List repositories |
| 13 | `vibe_analyze_repo` | Repo | Analyze repository |
| 14 | `vibe_read_file` | Repo | Read file from repo |
| 15 | `vibe_search_code` | Repo | Search code in repo |
| 16 | `vibe_delete_repo` | Repo | Delete repository |
| **GitHub** |
| 17 | `vibe_github_auth_status` | GitHub | Check GitHub auth |
| 18 | `vibe_github_create_repo` | GitHub | Create GitHub repo |
| 19 | `vibe_github_create_issue` | GitHub | Create GitHub issue |
| 20 | `vibe_github_create_pr` | GitHub | Create pull request |
| 21 | `vibe_github_list_issues` | GitHub | List GitHub issues |
| 22 | `vibe_github_update_issue` | GitHub | Update GitHub issue |
| **Files** |
| 23 | `vibe_write_file` | File | Write file to workspace |
| 24 | `vibe_list_files` | File | List directory contents |
| 25 | `vibe_delete_file` | File | Delete file/directory |
| 26 | `vibe_move_file` | File | Move/rename file |
| 27 | `vibe_create_directory` | File | Create directory |
| 28 | `vibe_get_file_info` | File | Get file info |
| **Commands** |
| 29 | `vibe_run_command` | Command | Run shell command |
| 30 | `vibe_run_tests` | Command | Run tests |
| 31 | `vibe_run_script` | Command | Run npm script |
| 32 | `vibe_install_deps` | Command | Install dependencies |
| **Git** |
| 33 | `vibe_git_status` | Git | Get git status |
| 34 | `vibe_git_commit` | Git | Commit changes |
| 35 | `vibe_git_push` | Git | Push to remote |
| 36 | `vibe_git_pull` | Git | Pull from remote |
| 37 | `vibe_git_create_branch` | Git | Create branch |
| 38 | `vibe_git_switch_branch` | Git | Switch branch |
| 39 | `vibe_git_log` | Git | Get commit history |
| 40 | `vibe_git_info` | Git | Get repository info |

---

## Tool 1: vbm_create_task

Create a new task in Vibe-Kanban.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "Task title (required)"
    },
    "description": {
      "type": "string",
      "maxLength": 2000,
      "description": "Detailed task description"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"],
      "description": "Task priority level"
    },
    "lane": {
      "type": "string",
      "enum": ["backlog", "todo", "in_progress", "done", "recovery", "code_review"],
      "description": "Lane to place task in"
    },
    "estimatedHours": {
      "type": "number",
      "minimum": 0.5,
      "maximum": 40,
      "description": "Estimated hours to complete"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "maxItems": 10,
      "description": "Task tags for categorization"
    }
  },
  "required": ["title"]
}
```

### Examples

**Minimal Request:**

```json
{
  "name": "vbm_create_task",
  "arguments": {
    "title": "Fix login bug"
  }
}
```

**Complete Request:**

```json
{
  "name": "vbm_create_task",
  "arguments": {
    "title": "Implement OAuth authentication",
    "description": "Add Google OAuth login with proper error handling and token management",
    "priority": "high",
    "lane": "backlog",
    "estimatedHours": 8,
    "tags": ["auth", "backend", "security"]
  }
}
```

### Response

```json
{
  "success": true,
  "task": {
    "id": "task-abc123",
    "title": "Implement OAuth authentication",
    "description": "Add Google OAuth login...",
    "priority": "high",
    "lane": "backlog",
    "estimatedHours": 8,
    "tags": ["auth", "backend", "security"],
    "status": "backlog",
    "createdAt": "2026-01-28T10:30:00Z",
    "updatedAt": "2026-01-28T10:30:00Z"
  }
}
```

### Implementation

```javascript
// mcp-server/src/controllers/taskController.js
async function createTask(args) {
  const { title, description, priority, lane, estimatedHours, tags } = args;

  // Validate using factory
  const task = taskFactory.create({
    title,
    description,
    priority: priority || 'medium',
    lane: lane || 'backlog',
    estimatedHours: estimatedHours || 0,
    tags: tags || []
  });

  // Save to bridge file
  await bridgeFile.addTask(task);

  return {
    success: true,
    task: task.toJSON()
  };
}
```

---

## Tool 2: vbm_update_task

Update an existing task's properties.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^task-[a-z0-9]+$",
      "description": "Task ID to update (required)"
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "description": {
      "type": "string",
      "maxLength": 2000
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"]
    },
    "estimatedHours": {
      "type": "number",
      "minimum": 0.5,
      "maximum": 40
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "maxItems": 10
    }
  },
  "required": ["id"]
}
```

### Examples

```json
{
  "name": "vbm_update_task",
  "arguments": {
    "id": "task-abc123",
    "priority": "critical",
    "estimatedHours": 12
  }
}
```

---

## Tool 3: vbm_delete_task

Permanently delete a task.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^task-[a-z0-9]+$",
      "description": "Task ID to delete (required)"
    }
  },
  "required": ["id"]
}
```

### Examples

```json
{
  "name": "vbm_delete_task",
  "arguments": {
    "id": "task-abc123"
  }
}
```

### Response

```json
{
  "success": true,
  "message": "Task task-abc123 deleted successfully",
  "deletedAt": "2026-01-28T10:30:00Z"
}
```

---

## Tool 4: vbm_get_task

Retrieve a single task with all details.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^task-[a-z0-9]+$",
      "description": "Task ID to retrieve (required)"
    }
  },
  "required": ["id"]
}
```

### Examples

```json
{
  "name": "vbm_get_task",
  "arguments": {
    "id": "task-abc123"
  }
}
```

### Response

```json
{
  "success": true,
  "task": {
    "id": "task-abc123",
    "title": "Implement OAuth authentication",
    "description": "Add Google OAuth login...",
    "priority": "high",
    "lane": "in_progress",
    "estimatedHours": 8,
    "tags": ["auth", "backend"],
    "status": "in_progress",
    "comments": [
      {
        "text": "Started implementation",
        "timestamp": "2026-01-28T09:00:00Z",
        "author": "user@example.com"
      }
    ],
    "createdAt": "2026-01-27T14:00:00Z",
    "updatedAt": "2026-01-28T10:30:00Z"
  }
}
```

---

## Tool 5: vbm_list_tasks

List tasks with optional filtering.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "lane": {
      "type": "string",
      "enum": ["backlog", "todo", "in_progress", "done", "recovery", "code_review"],
      "description": "Filter by lane"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"],
      "description": "Filter by priority"
    },
    "status": {
      "type": "string",
      "enum": ["backlog", "todo", "in_progress", "done", "recovery"],
      "description": "Filter by status"
    },
    "tag": {
      "type": "string",
      "description": "Filter by tag"
    },
    "limit": {
      "type": "number",
      "minimum": 1,
      "maximum": 200,
      "default": 50,
      "description": "Maximum results to return"
    }
  }
}
```

### Examples

**All tasks:**

```json
{
  "name": "vbm_list_tasks",
  "arguments": {}
}
```

**Filtered by lane:**

```json
{
  "name": "vbm_list_tasks",
  "arguments": {
    "lane": "in_progress",
    "limit": 10
  }
}
```

**Filtered by priority and tag:**

```json
{
  "name": "vbm_list_tasks",
  "arguments": {
    "priority": "high",
    "tag": "security"
  }
}
```

### Response

```json
{
  "success": true,
  "tasks": [
    {
      "id": "task-abc123",
      "title": "Implement OAuth",
      "priority": "high",
      "lane": "in_progress"
    },
    {
      "id": "task-def456",
      "title": "Add rate limiting",
      "priority": "high",
      "lane": "todo"
    }
  ],
  "total": 2,
  "filtered": true
}
```

---

## Tool 6: vbm_move_task

Move a task to a different lane.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^task-[a-z0-9]+$",
      "description": "Task ID to move (required)"
    },
    "lane": {
      "type": "string",
      "enum": ["backlog", "todo", "in_progress", "done", "recovery", "code_review"],
      "description": "Target lane (required)"
    },
    "comment": {
      "type": "string",
      "maxLength": 500,
      "description": "Optional comment about the move"
    }
  },
  "required": ["id", "lane"]
}
```

### Examples

```json
{
  "name": "vbm_move_task",
  "arguments": {
    "id": "task-abc123",
    "lane": "done",
    "comment": "Completed implementation and testing"
  }
}
```

### Response

```json
{
  "success": true,
  "task": {
    "id": "task-abc123",
    "title": "Implement OAuth",
    "lane": "done",
    "previousLane": "in_progress",
    "movedAt": "2026-01-28T10:30:00Z",
    "movedBy": "user@example.com"
  }
}
```

---

## Tool 7: vbm_create_board

Create a new Kanban board.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50,
      "description": "Board name (required)"
    },
    "description": {
      "type": "string",
      "maxLength": 500,
      "description": "Board description"
    },
    "lanes": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Custom lane names (default: standard lanes)"
    }
  },
  "required": ["name"]
}
```

### Examples

```json
{
  "name": "vbm_create_board",
  "arguments": {
    "name": "Sprint 23",
    "description": "February sprint tasks",
    "lanes": ["backlog", "todo", "in_progress", "testing", "done"]
  }
}
```

### Response

```json
{
  "success": true,
  "board": {
    "id": "board-xyz789",
    "name": "Sprint 23",
    "description": "February sprint tasks",
    "lanes": ["backlog", "todo", "in_progress", "testing", "done"],
    "createdAt": "2026-01-28T10:30:00Z"
  }
}
```

---

## Tool 8: vbm_get_board

Retrieve board information with all tasks.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^board-[a-z0-9]+$",
      "description": "Board ID (optional, defaults to current board)"
    }
  }
}
```

### Examples

```json
{
  "name": "vbm_get_board",
  "arguments": {}
}
```

### Response

```json
{
  "success": true,
  "board": {
    "id": "board-xyz789",
    "name": "Main Board",
    "lanes": [
      {
        "name": "backlog",
        "tasks": [
          { "id": "task-001", "title": "Task 1" },
          { "id": "task-002", "title": "Task 2" }
        ]
      },
      {
        "name": "todo",
        "tasks": [
          { "id": "task-003", "title": "Task 3" }
        ]
      }
    ]
  },
  "statistics": {
    "totalTasks": 15,
    "tasksByLane": {
      "backlog": 5,
      "todo": 3,
      "in_progress": 4,
      "done": 2,
      "recovery": 1
    },
    "tasksByPriority": {
      "critical": 1,
      "high": 4,
      "medium": 7,
      "low": 3
    }
  }
}
```

---

## Tool 9: vbm_generate_plan

Generate a task plan using AI pattern recognition.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "prompt": {
      "type": "string",
      "minLength": 10,
      "maxLength": 1000,
      "description": "Natural language prompt (required)"
    },
    "context": {
      "type": "string",
      "maxLength": 1000,
      "description": "Additional context for planning"
    },
    "constraints": {
      "type": "object",
      "properties": {
        "maxHours": { "type": "number", "minimum": 1 },
        "teamSize": { "type": "number", "minimum": 1 },
        "deadline": { "type": "string" }
      }
    },
    "pattern": {
      "type": "string",
      "enum": ["authentication", "database", "api", "frontend", "testing", "deployment"],
      "description": "Known pattern to apply"
    }
  },
  "required": ["prompt"]
}
```

### Examples

**Simple prompt:**

```json
{
  "name": "vbm_generate_plan",
  "arguments": {
    "prompt": "Create a task plan for implementing user authentication"
  }
}
```

**With context and pattern:**

```json
{
  "name": "vbm_generate_plan",
  "arguments": {
    "prompt": "Implement OAuth authentication with Google provider",
    "context": "We're using Express.js and need token management",
    "constraints": {
      "maxHours": 40,
      "teamSize": 2
    },
    "pattern": "authentication"
  }
}
```

### Response

```json
{
  "success": true,
  "plan": {
    "pattern": "authentication",
    "tasks": [
      {
        "id": "task-generated-001",
        "title": "Design authentication schema",
        "description": "Create user model with OAuth fields",
        "priority": "high",
        "estimatedHours": 4,
        "lane": "backlog",
        "dependencies": []
      },
      {
        "id": "task-generated-002",
        "title": "Set up OAuth endpoints",
        "description": "Create /auth/google and /auth/callback routes",
        "priority": "high",
        "estimatedHours": 6,
        "lane": "backlog",
        "dependencies": ["task-generated-001"]
      }
    ],
    "summary": {
      "total": 8,
      "estimatedHours": 54,
      "priorities": {
        "high": 6,
        "medium": 2,
        "low": 0
      }
    }
  }
}
```

### Pattern Detection

The MCP Server recognizes these common patterns:

| Pattern | Tasks Generated | Est. Hours |
|---------|----------------|------------|
| `authentication` | 8 tasks | ~54h |
| `database` | 7 tasks | ~32h |
| `api` | 10 tasks | ~51h |
| `frontend` | 9 tasks | ~49h |
| `testing` | 7 tasks | ~34h |
| `deployment` | 9 tasks | ~35h |

---

## Tool 10: vbm_sync_board

Force immediate synchronization with Vibe-Kanban.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "force": {
      "type": "boolean",
      "default": false,
      "description": "Force sync even if recently synced"
    }
  }
}
```

### Examples

```json
{
  "name": "vbm_sync_board",
  "arguments": {
    "force": true
  }
}
```

### Response

```json
{
  "success": true,
  "syncedAt": "2026-01-28T10:30:00Z",
  "tasksSynced": 15,
  "conflicts": 0,
  "conflictsResolved": []
}
```

---

## Common Parameters

### Priority Levels

| Level | Description | Use When |
|-------|-------------|----------|
| `low` | Nice to have | Optional features, optimizations |
| `medium` | Standard importance | Regular tasks, improvements |
| `high` | Important | Core features, bugs affecting users |
| `critical` | Urgent | Security issues, production outages |

### Lane Types

| Lane | Description | Typical Usage |
|------|-------------|---------------|
| `backlog` | Future work | Feature ideas, tech debt items |
| `todo` | Ready to start | Approved, prioritized tasks |
| `in_progress` | Currently working | Active development |
| `code_review` | Awaiting review | Pull requests pending review |
| `done` | Completed | Finished tasks |
| `recovery` | Urgent fixes | Critical bugs, hotfixes |

### Tag Conventions

**Common Tags:**
- `frontend` - UI/components
- `backend` - Server/API work
- `database` - Database changes
- `auth` - Authentication/authorization
- `security` - Security-related
- `performance` - Optimization
- `bug` - Bug fixes
- `feature` - New features
- `docs` - Documentation
- `tests` - Testing

---

## Repository Tools

### Tool 11: vibe_clone_repo

Clone a git repository to the local workspace.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "description": "Git repository URL"
    },
    "name": {
      "type": "string",
      "description": "Custom repository name (optional)"
    },
    "branch": {
      "type": "string",
      "description": "Specific branch to clone (optional)"
    }
  },
  "required": ["url"]
}
```

#### Example

```json
{
  "name": "vibe_clone_repo",
  "arguments": {
    "url": "https://github.com/vuejs/core.git",
    "name": "vue-core"
  }
}
```

#### Response

```json
{
  "success": true,
  "message": "Repository cloned successfully",
  "repo": {
    "name": "vue-core",
    "path": "/repos/vue-core",
    "url": "https://github.com/vuejs/core.git",
    "branch": "main"
  }
}
```

---

### Tool 12: vibe_list_repos

List all cloned repositories.

#### Input Schema

```json
{
  "type": "object",
  "properties": {}
}
```

#### Response

```json
{
  "success": true,
  "repos": [
    {
      "name": "vue-core",
      "path": "/repos/vue-core",
      "url": "https://github.com/vuejs/core.git",
      "branch": "main"
    }
  ],
  "count": 1
}
```

---

### Tool 13: vibe_analyze_repo

Analyze a repository structure and detect languages.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Repository name"
    }
  },
  "required": ["name"]
}
```

#### Response

```json
{
  "success": true,
  "analysis": {
    "name": "vue-core",
    "path": "/repos/vue-core",
    "structure": {
      "files": ["README.md", "package.json", "src/index.ts"],
      "directories": ["src", "tests", "docs"],
      "totalFiles": 450,
      "totalDirectories": 85
    },
    "languages": [
      { "language": "TypeScript", "files": 320 },
      { "language": "JavaScript", "files": 45 }
    ],
    "size": "45M"
  }
}
```

---

### Tool 14: vibe_read_file

Read a file from a repository.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "repo": {
      "type": "string",
      "description": "Repository name"
    },
    "filePath": {
      "type": "string",
      "description": "File path relative to repo root"
    },
    "limit": {
      "type": "number",
      "description": "Max lines to read (optional)"
    }
  },
  "required": ["repo", "filePath"]
}
```

#### Response

```json
{
  "success": true,
  "file": {
    "path": "README.md",
    "content": "# Vue Core\n\nThe core library...",
    "totalLines": 150,
    "truncated": false,
    "encoding": "utf-8"
  }
}
```

---

### Tool 15: vibe_search_code

Search for text/patterns across all files in a repository.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "repo": {
      "type": "string",
      "description": "Repository name"
    },
    "query": {
      "type": "string",
      "description": "Search query"
    },
    "filePattern": {
      "type": "string",
      "description": "File pattern to limit search (optional)"
    },
    "maxResults": {
      "type": "number",
      "description": "Maximum results (optional)"
    }
  },
  "required": ["repo", "query"]
}
```

#### Response

```json
{
  "success": true,
  "query": "function createApp",
  "results": [
    {
      "file": "src/index.ts",
      "line": 42,
      "content": "export function createApp() {"
    },
    {
      "file": "src/api/app.ts",
      "line": 15,
      "content": "function createApp(rootComponent) {"
    }
  ],
  "count": 2
}
```

---

### Tool 16: vibe_delete_repo

Delete a cloned repository from the workspace.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Repository name to delete"
    }
  },
  "required": ["name"]
}
```

#### Response

```json
{
  "success": true,
  "message": "Repository vue-core deleted successfully"
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": 1001,
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "issue": "Title is required",
        "constraint": "minLength: 1"
      }
    ],
    "hint": "Provide a valid title for the task"
  }
}
```

### Common Errors

| Error Code | Name | Description |
|------------|------|-------------|
| 1001 | VALIDATION_ERROR | Input validation failed |
| 1002 | TASK_NOT_FOUND | Task doesn't exist |
| 1003 | BRIDGE_ERROR | Bridge file operation failed |
| 1004 | SYNC_ERROR | Synchronization failed |
| 1005 | AUTH_ERROR | Authentication required |
| 1006 | PERMISSION_DENIED | Insufficient permissions |

---

## Tool Execution Matrix

| Operation | STDIO | HTTP | Latency | Notes |
|-----------|-------|------|--------|-------|
| **Task Management** |
| Create Task | ✅ | ✅ | ~50ms | Returns task ID |
| Update Task | ✅ | ✅ | ~40ms | Partial updates supported |
| Move Task | ✅ | ✅ | ~30ms | Updates lane |
| Search Tasks | ✅ | ✅ | ~40ms | Supports filtering |
| Batch Create | ✅ | ✅ | ~100ms | Multiple tasks |
| **Board Management** |
| Get Board | ✅ | ✅ | ~60ms | Includes all tasks |
| Get Stats | ✅ | ✅ | ~30ms | Board metrics |
| Get Context | ✅ | ✅ | ~40ms | AI context data |
| **AI Planning** |
| Generate Plan | ✅ | ✅ | ~2-10s | AI-powered |
| Analyze Goal | ✅ | ✅ | ~1-3s | Pattern detection |
| **Repository** |
| Clone Repo | ✅ | ✅ | ~10-120s | Depends on repo size |
| List Repos | ✅ | ✅ | ~50ms | All repos |
| Analyze Repo | ✅ | ✅ | ~1-5s | Structure & languages |
| Read File | ✅ | ✅ | ~20ms | File content |
| Search Code | ✅ | ✅ | ~1-10s | Grep search |
| Delete Repo | ✅ | ✅ | ~100ms | Permanent |
| **GitHub** |
| Auth Status | ✅ | ✅ | ~200ms | Check authentication |
| Create Repo | ✅ | ✅ | ~2-5s | GitHub API |
| Create Issue | ✅ | ✅ | ~1-2s | GitHub API |
| Create PR | ✅ | ✅ | ~1-3s | GitHub API |
| List Issues | ✅ | ✅ | ~1-2s | GitHub API |
| Update Issue | ✅ | ✅ | ~1-2s | GitHub API |
| **Files** |
| Write File | ✅ | ✅ | ~20ms | File I/O |
| List Files | ✅ | ✅ | ~50ms | Directory scan |
| Delete File | ✅ | ✅ | ~30ms | File I/O |
| Move File | ✅ | ✅ | ~40ms | File I/O |
| Create Directory | ✅ | ✅ | ~20ms | File I/O |
| Get File Info | ✅ | ✅ | ~10ms | File stats |
| **Commands** |
| Run Command | ✅ | ✅ | Variable | Depends on command |
| Run Tests | ✅ | ✅ | ~5-30s | Test framework |
| Run Script | ✅ | ✅ | Variable | Depends on script |
| Install Deps | ✅ | ✅ | ~10-60s | Package manager |
| **Git** |
| Git Status | ✅ | ✅ | ~100ms | Git command |
| Git Commit | ✅ | ✅ | ~200ms | Git command |
| Git Push | ✅ | ✅ | ~5-30s | Network dependent |
| Git Pull | ✅ | ✅ | ~5-30s | Network dependent |
| Create Branch | ✅ | ✅ | ~100ms | Git command |
| Switch Branch | ✅ | ✅ | ~100ms | Git command |
| Git Log | ✅ | ✅ | ~100ms | Git command |
| Git Info | ✅ | ✅ | ~100ms | Git command |

---

## Related Documentation

- **[MCP_SERVER.md](MCP_SERVER.md)** - MCP Server architecture
- **[MCP_PROTOCOL.md](MCP_PROTOCOL.md)** - MCP protocol details
- **[MCP_EXTENDING.md](MCP_EXTENDING.md)** - Extending with custom tools
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API reference

---

**Tool Version:** 1.0.0
**Last Updated:** 2026-01-28
