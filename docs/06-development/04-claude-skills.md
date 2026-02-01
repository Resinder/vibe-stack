# Claude Skills Integration Guide

Complete guide for using Claude Skills with Vibe Stack MCP Server.

---

## Table of Contents

- [Overview](#overview)
- [Why Skills Matter](#why-skills-matter)
- [Available Skills](#available-skills)
- [How Skills Work](#how-skills-work)
- [Creating Custom Skills](#creating-custom-skills)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Overview

**Claude Skills** are reusable workflows that combine MCP server tools with automation.

### MCP + Skills Synergy

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server (Tools)                         │
│                                                              │
│  create_task → move_task → search_tasks → generate_plan     │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Claude Skills (Workflows)                  │
│                                                              │
│  /implement-task → /commit-work → /run-tests → /review-pr    │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Developer Experience                      │
│                                                              │
│  Single command → Full workflow automation                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Why Skills Matter

### 1. Code Quality Improvement

**Without Skills:**
```bash
# Manual workflow
user: Create authentication
  → Claude writes code
user: Run tests manually
  → Tests pass/fail
user: git add .
user: git commit -m "wip"
user: Create PR
user: Request review
```

**With Skills:**
```bash
# Automated workflow
user: /implement-task "Add authentication"
  → Claude:
      1. Gets task from Vibe Kanban
      2. Writes code with tests
      3. Runs tests automatically
      4. Commits with descriptive message
      5. Moves task to next lane
      6. Updates CHANGELOG
```

### 2. Consistency

**Skills enforce:**
- ✅ Consistent commit messages
- ✅ Test-driven development
- � Atomic changes (one task per commit)
- ✅ Documentation updates
- ✅ Code review standards

### 3. Developer Productivity

**Time savings:**
- Commit: 30 seconds → 5 seconds
- Testing: 2 minutes → 0 seconds (automatic)
- Review: 10 minutes → 2 minutes (assisted)
- **Total: 50% faster development cycle**

---

## Available Skills

Vibe Stack includes these pre-configured skills:

### `/commit-work`

Commit your current work with Vibe Kanban context.

**What it does:**
1. Searches for in-progress tasks
2. Generates descriptive commit message
3. Stages and commits changes
4. Updates task status

**Usage:**
```
Hey Claude, /commit-work
```

**Commit message format:**
```
feat(auth): implement JWT authentication

- Add JWT token generation
- Add middleware for route protection
- Add login/logout endpoints

Task: task-123 (Implement JWT Auth)
```

### `/run-tests`

Run tests and update task status automatically.

**What it does:**
1. Detects test framework
2. Runs tests
3. Parses results
4. Updates task status based on results

**Usage:**
```
/run-tests for authentication module
```

**Behavior:**
- Tests pass → Move task to next lane
- Tests fail → Show summary, keep in current lane

### `/review-pr`

Review pull request with Vibe Kanban context.

**What it does:**
1. Finds related tasks
2. Fetches PR diff
3. Reviews against requirements
4. Provides feedback

**Usage:**
```
/review-pr #123
```

**Includes:**
- Task requirement validation
- Code quality checks
- Best practices verification
- Improvement suggestions

### `/create-task`

Create task from conversation or selection.

**What it does:**
1. Extracts task details
2. Determines metadata
3. Creates task via MCP
4. Provides feedback

**Usage:**
```
We need to add rate limiting to the API
/create-task
```

**Auto-detects:**
- Priority (keywords: "urgent", "critical")
- Tags (domain keywords)
- Estimated hours (complexity)

---

## How Skills Work

### Skill Anatomy

```
.claude/skills/my-skill.md

---
description: Brief description
---

Detailed explanation of what the skill does.

Additional context and instructions.
```

### Skill Execution Flow

```
User Input
    ↓
Claude parses skill
    ↓
Executes skill instructions
    ↓
Uses MCP tools (if needed)
    ↓
Returns result to user
```

### MCP Tools in Skills

Skills can call MCP tools:

```javascript
// In a skill, Claude can:

// 1. Get task context
mcp: search_tasks({ query: "authentication" })

// 2. Create new task
mcp: create_task({
  title: "Add rate limiting",
  lane: "backlog",
  priority: "high"
})

// 3. Move task
mcp: move_task({
  taskId: "task-123",
  targetLane: "in_progress"
})

// 4. Get statistics
mcp: get_board_stats({})
```

---

## Creating Custom Skills

### Example: `/deploy-and-verify`

Create `.claude/skills/deploy-and-verify.md`:

```markdown
---
description: Deploy changes and verify with tests
---

Deploy your changes and run verification tests.

Steps:
1. Build the project
2. Run tests
3. If tests pass:
   - Deploy to staging
   - Run smoke tests
   - Move task to "done"
4. If tests fail:
   - Revert changes
   - Keep task in current lane
   - Notify user

Uses MCP tools:
- move_task
- get_board_stats
```

### Skill Best Practices

**1. Be Specific**
```markdown
❌ Bad:
description: Do stuff

✅ Good:
description: Run tests and move task to done if passing
```

**2. Use MCP Tools**
```markdown
When implementing features, use MCP tools:
- create_task: For new tasks
- move_task: To update task status
- search_tasks: To find related tasks
```

**3. Handle Errors**
```markdown
If tests fail:
1. Show test summary
2. Suggest fixes
3. Don't move task
4. Ask user for next steps
```

---

## Best Practices

### 1. Always Use Skills for Repetitive Tasks

❌ **Without Skills:**
```
User: Create a task for this feature
User: Move it to todo
User: Update priority
User: Commit changes
```

✅ **With Skills:**
```
User: /create-task for "Add feature X"
User: /implement-task
User: /commit-work
```

### 2. Combine Skills with MCP Tools

Skills amplify MCP capabilities:

```
User: Plan and implement authentication system

Claude Skill:
1. generate_plan → Creates 10 tasks
2. create_task → Adds to board
3. Implement each task:
   - Write code
   - /run-tests
   - /commit-work
   - move_task to next lane
4. Final /commit-work
5. /review-pr
```

### 3. Maintain Task Context

Skills keep track of task context:

```bash
# Skills remember the current task
User: I'm working on task-123
Claude: Got it, task-123 (JWT Authentication)

# Later in conversation
User: /commit-work
Claude: Committing work for task-123 (JWT Authentication)
        Message: feat(auth): implement JWT
```

---

## Examples

### Example 1: Feature Development Workflow

```bash
# 1. User creates task
User: We need to add user profile management
Claude: /create-task

# 2. User implements feature
Claude: [Writes code with tests]

# 3. User runs tests
User: /run-tests

# 4. User commits work
User: /commit-work

# Result: Complete workflow in seconds
```

### Example 2: Bug Fix Workflow

```bash
# 1. User finds bug
User: There's a bug in the authentication
Claude: /create-task for "Fix auth bug"

# 2. User fixes bug
Claude: [Fixes code, adds test for bug]

# 3. User verifies fix
User: /run-tests

# 4. User commits
User: /commit-work

# Result: Tracked from discovery to resolution
```

### Example 3: Code Review Workflow

```bash
# 1. Open PR
User: I've opened PR #45 for the authentication feature

# 2. User requests review
User: /review-pr #45

# 3. Claude reviews with task context
Claude:
    - Found task-123 in Vibe Kanban
    - Validates implementation against requirements
    - Suggests 3 improvements
    - Approves with minor changes
```

---

## Advanced: Skill Chaining

Skills can be combined for complex workflows:

```bash
# Complete feature development workflow

User: Implement the authentication system

Claude executes:
1. /generate-plan
   → Creates 8 tasks in backlog

2. For each task:
   a. /implement-task
   b. /run-tests
   c. /commit-work
   d. move_task to next lane

3. /review-pr (when PR created)

4. Final /commit-work

# Result: Full development lifecycle automated
```

---

## Configuration

### Enable Skills

Skills are enabled by default in Vibe Stack.

Check `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(make:*)",
      "Bash(npm test:*)"
    ]
  }
}
```

### Disable Specific Skills

To disable a skill, remove the file:

```bash
rm .claude/skills/unwanted-skill.md
```

### Update Skills

Skills update automatically when files change.

No restart needed!

---

## Troubleshooting

### Skill Not Found

**Problem:** `/my-skill` command not found

**Solution:**
1. Check file exists: `.claude/skills/my-skill.md`
2. Check file format (frontmatter required)
3. Restart Claude Code

### MCP Tools Not Available in Skills

**Problem:** Skill can't access MCP tools

**Solution:**
1. Verify MCP server is running:
   ```bash
   curl http://localhost:4001/health
   ```
2. Check MCP connection in Claude Code
3. Verify permissions in settings

### Skill Executes Wrong Action

**Problem:** Skill doesn't do what you expect

**Solution:**
1. Be more specific in your command
2. Update skill description
3. Add detailed instructions to skill file

---

## Next Steps

- [MCP Tools Reference](../03-technical/04-mcp-tools.md) - Learn about MCP tools
- [Development Guide](../06-development/01-development.md) - Custom skill development
- [Best Practices](../02-user-guide/03-best-practices.md) - Development workflows

---

**Last Updated:** 2026-01-29
**Claude Code Version:** Latest
**MCP Server Version:** 1.0.0
