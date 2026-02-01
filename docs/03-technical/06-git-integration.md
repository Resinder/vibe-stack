# Vibe Stack - Git Integration Guide

Complete guide for integrating Vibe Stack with Git workflows and version control.

---

## 📚 Table of Contents

- [Git + Vibe Stack Workflow](#git--vibe-stack-workflow)
- [code-server Git Setup](#code-server-git-setup)
- [Branching Strategies](#branching-strategies)
- [Commit Message Standards](#commit-message-standards)
- [Common Git Workflows](#common-git-workflows)

---

## Git + Vibe Stack Workflow

### Recommended Workflow

```
┌─────────────────────────────────────────────────────────┐
│                  Development Workflow                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Plan (Open WebUI → Vibe-Kanban)                     │
│     └─→ AI generates tasks                               │
│                                                         │
│  2. Work (code-server)                                   │
│     ├─→ Create feature branch                            │
│     ├─→ Implement tasks                                   │
│     └─→ Commit changes                                   │
│                                                         │
│  3. Review (Vibe-Kanban + Git)                           │
│     ├─→ Move task to code-review                          │
│     ├─→ Create pull request                              │
│     └─→ Get approval                                     │
│                                                         │
│  4. Merge                                               │
│     ├─→ Merge to main                                    │
│     ├─→ Update Vibe-Kanban                               │
│     └─→ Move task to done                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## code-server Git Setup

### Initial Setup

code-server comes with Git pre-installed. Configure it:

```bash
# Set your name
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your.email@example.com"

# Enable color output
git config --global color.ui true

# Set default branch name
git config --global init.defaultBranch main
```

### SSH Keys for Git

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub/GitLab/Bitbucket
# Settings → SSH Keys → Add New
```

---

## Branching Strategies

### Strategy 1: Feature Branch Workflow (Recommended)

```
main (production)
  ├── feature/user-authentication
  ├── feature/payment-integration
  ├── feature/dashboard-redesign
  └── hotfix/login-bug
```

**Process**:
1. Create feature branch from `main`
2. Complete tasks in Vibe-Kanban
3. Commit changes with task references
4. Create pull request
5. Get approval and merge
6. Delete feature branch

**Example**:
```bash
# Create feature branch
git checkout -b feature/user-authentication

# Work on tasks from Vibe-Kanban
# Task: "Implement OAuth login (task-123)"

# Commit with task reference
git add .
git commit -m "feat(auth): Implement OAuth login

- Task: task-123
- Complete Google OAuth integration
- Add token management
- Fixes #42"

# Push and create PR
git push origin feature/user-authentication
```

---

### Strategy 2: Task Branch Workflow

Each task in Vibe-Kanban gets its own branch:

```
main
  ├── task/task-123-oauth-login
  ├── task/task-124-token-storage
  └── task/task-125-user-profile
```

**Best for**:
- Teams doing code reviews
- Projects with many parallel tasks
- Strict CI/CD requirements

---

### Strategy 3: Environment Branches

```
main (production)
  ├── develop (staging)
  └── feature/* (development)
```

**Best for**:
- Projects with staging environment
- Teams with formal release process
- Multiple deployment targets

---

## Commit Message Standards

### Conventional Commits (Recommended)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example**:
```bash
git commit -m "feat(auth): Implement OAuth login

- Add Google OAuth provider
- Add token storage in database
- Add logout functionality
- Update auth middleware

Task: task-123
Closes #42"
```

---

### Task-Referenced Commits

Always reference Vibe-Kanban task IDs:

```bash
# Format
git commit -m "type(scope): description

Task: task-<id>
Related: #<issue-number>"
```

**Benefits**:
- Traceable from task to code
- Automatic updates in Vibe-Kanban
- Better code review context

---

## Common Git Workflows

### Workflow 1: Feature Development with AI Planning

```bash
# 1. Generate tasks in Open WebUI
"Create task plan for user authentication feature"

# 2. Review tasks in Vibe-Kanban
# http://localhost:4000

# 3. Create feature branch
git checkout -b feature/user-auth

# 4. Start first task in Vibe-Kanban
# Move "Design auth schema" to in_progress

# 5. Implement in code-server
# Edit files, create schema

# 6. Commit with task reference
git add database/schema.sql
git commit -m "feat(auth): Design authentication schema

Task: task-456
ERD: docs/auth-erd.png
"

# 7. Mark task complete, move to next
# Repeat for all tasks

# 8. Create pull request
git push origin feature/user-auth

# 9. After merge, update Vibe-Kanban
# Move all tasks to done
git checkout main
git pull
```

---

### Workflow 2: Bug Fix Workflow

```bash
# 1. Create bug task in Vibe-Kanban
# Title: "Fix login redirect loop"
# Priority: critical
# Lane: todo

# 2. Create hotfix branch
git checkout -b hotfix/login-redirect

# 3. Investigate and fix
# Edit code, test locally

# 4. Commit fix
git commit -m "fix(auth): Resolve login redirect loop

Issue: User redirects infinitely after login
Cause: Missing token validation check
Fix: Add token.exists() before redirect

Task: task-789
Fixes #123"

# 5. Test and push
# Move task to done
git push origin hotfix/login-redirect

# 6. Create PR, merge, delete branch
```

---

### Workflow 3: Refactoring with Task Tracking

```bash
# 1. Generate refactoring tasks
"Generate tasks for refactoring user service"

# 2. Work systematically
git checkout -b refactor/user-service

# Task 1: Extract validation logic
git commit -m "refactor(user): Extract validation to separate module

Task: task-201"

# Task 2: Add interface for repository
git commit -m "refactor(user): Add IUserRepository interface

Task: task-202"

# 3. Ensure tests pass
npm test

# 4. Update and merge
```

---

## Git Hooks Integration

### Pre-commit Hook (Task Validation)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check if task is referenced in commit message

if ! git log -1 --pretty=%B | grep -q "Task: task-"; then
    echo "⚠️  Warning: Commit doesn't reference a Vibe-Kanban task"
    echo "   Include 'Task: task-XXX' in commit message"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

---

## Best Practices

### 1. Branch Naming

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Urgent production fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions

### 2. Commit Frequency

- ✅ Commit often, small chunks
- ✅ One logical change per commit
- ✅ Reference task IDs
- ❌ Don't commit broken code
- ❌ Don't commit sensitive data

### 3. Task-to-Code Ratio

- Aim for: **1 task = 1-3 commits**
- If task is large, break it down
- If commit is large, split it up

### 4. Pull Request Hygiene

- ✅ Clear PR title
- ✅ Description with task references
- ✅ Link to Vibe-Kanban tasks
- ✅ Request reviews from team
- ✅ Address all feedback

---

## Related Documentation

- **[BEST_PRACTICES.md](BEST_PRACTICES.md)** - Overall best practices
- **[TEAM_COLLABORATION.md](TEAM_COLLABORATION.md)** - Team workflows
- **[WORKFLOWS.md](WORKFLOWS.md)** - Complete workflow examples
- **[CODE_SERVER.md](#)** - code-server documentation (if exists)
