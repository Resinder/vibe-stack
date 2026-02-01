# Vibe Stack - Best Practices Guide

Comprehensive best practices for using Vibe Stack effectively in professional development.

---

## 📚 Table of Contents

- [Task Management Best Practices](#task-management-best-practices)
- [AI Interaction Best Practices](#ai-interaction-best-practices)
- [Development Workflow Best Practices](#development-workflow-best-practices)
- [Code Organization Best Practices](#code-organization-best-practices)
- [Team Collaboration Best Practices](#team-collaboration-best-practices)

---

## Task Management Best Practices

### 1. Task Definition

**Good Task Example**:
```
Title: [API] Implement POST /users endpoint with validation

Description:
- Create POST /users route
- Add request body validation (name, email, password)
- Hash password with bcrypt
- Return created user with 201 status
- Handle duplicate email error (409)
- Add input sanitization
- Write unit tests

Acceptance Criteria:
- Returns 201 on success
- Returns 400 for invalid input
- Returns 409 for duplicate email
- Password is hashed, not plain text
- Tests pass

Priority: high
Estimated: 4 hours
Tags: [api], [backend], [validation]
Related: task-123, task-124
```

### 2. Task Estimation

**Include Time For**:
- ✅ Coding implementation
- ✅ Self-testing
- ✅ Code review
- ✅ Bug fixes found during review
- ✅ Documentation

**Estimation Guidelines**:
| Complexity | Hours | Examples |
|------------|-------|----------|
| **Simple** | 1-2h | Fix typo, change color |
| **Medium** | 3-6h | Add endpoint, simple feature |
| **Complex** | 7-12h | Authentication, payment integration |
| **Very Complex** | 13-20h | Full feature with edge cases |

### 3. Task Dependencies

**Explicitly Document Dependencies**:
```
Task A: Setup database (4h, high)
  ↓ blocks
Task B: Create user model (3h, high)
  ↓ blocks
Task C: Implement auth endpoints (6h, high)
  ↓ blocks
Task D: Add OAuth (8h, high)
```

**Tag dependent tasks**:
- Add `[blocked-by:task-XXX]` tag
- Reference blocking task in description
- Move blocked tasks to `recovery` lane

---

## AI Interaction Best Practices

### 1. Prompt Engineering

**Be Specific**:
- ❌ "Add authentication"
- ✅ "Create OAuth authentication with Google and GitHub providers"

**Provide Context**:
```
Generate tasks for implementing a REST API:
- Framework: Express.js with TypeScript
- Database: PostgreSQL with Prisma ORM
- Auth: JWT tokens
- Features: CRUD operations, pagination, filtering
- Testing: Jest with supertest
- Include API documentation with Swagger
```

**Ask Follow-up Questions**:
```
"What's the next priority task?"
"Can you break down the authentication task into smaller pieces?"
"Generate test tasks for the API endpoints"
"What dependencies exist between these tasks?"
```

### 2. Pattern Recognition

**MCP Server detects these patterns automatically**:

| Pattern | Keywords | Tasks Generated | Typical Hours |
|---------|----------|------------------|--------------|
| Authentication | oauth, auth, login, jwt | 8 tasks | ~54h |
| Database | database, sql, postgres | 7 tasks | ~32h |
| API | api, rest, graphql | 10 tasks | ~51h |
| Frontend | ui, react, component | 9 tasks | ~49h |
| Testing | test, tdd, coverage | 7 tasks | ~34h |
| Deployment | deploy, docker, k8s | 9 tasks | ~35h |

**Combine Patterns**:
```
"Generate tasks for a full-stack application with:
- Frontend: React with TypeScript
- Backend: Express.js API
- Database: PostgreSQL
- Authentication: OAuth with Google
- Testing: Jest for both frontend and backend
- Deployment: Docker with docker-compose
"
```

### 3. Review and Refine

**Always review AI-generated tasks**:
1. Check if tasks align with your requirements
2. Adjust estimates based on your experience
3. Add or remove tasks as needed
4. Reorder tasks by priority
5. Add acceptance criteria

---

## Development Workflow Best Practices

### 1. Daily Workflow

**Morning**:
```bash
# 1. Check board
make health
# Visit http://localhost:4000

# 2. Move task to in_progress
# Choose highest priority task

# 3. Start coding
code-server http://localhost:8443
```

**During Development**:
```bash
# 1. Update task status
# Add comments to task as you learn

# 2. Commit frequently
git add .
git commit -m "feat: Implement feature X

Task: task-456
Progress: 80% complete
"
```

**End of Day**:
```bash
# 1. Update task with progress
# Add comments about what's done

# 2. Move to appropriate lane:
# - in_progress if still working
# - code-review if ready for review
# - done if complete

# 3. Push changes
git push
```

### 2. Code Review Workflow

**For Reviewer**:
```bash
# 1. Check Vibe-Kanban code-review lane
# 2. Review tasks in order

# 3. For each task:
#    - Pull the branch
#    - Review code
#    - Add comments
#    - Approve or request changes
```

**For Developer**:
```bash
# 1. Move task to code-review when done
# 2. Create pull request
# 3. Reference task in PR description
# 4. Address review feedback
# 5. Move to done when approved
```

### 3. Sprint Planning

**Weekly Sprint Planning**:

```
1. Review completed tasks (done lane)
   → Celebrate wins
   → Calculate velocity

2. Review backlog
   → Ask AI to analyze backlog
   → "What are our top priorities?"

3. Generate new tasks
   → Use AI: "Create plan for [feature]"
   → Add specific acceptance criteria

4. Estimate and prioritize
   → Team estimates together
   → Use AI estimates as baseline

5. Move sprint tasks to todo
   → Capacity plan based on velocity
   → Include buffer for unexpected work
```

---

## Code Organization Best Practices

### 1. Repository Structure

**Recommended for Vibe Stack**:
```
repos/
├── project-name/
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities
│   │   └── types/           # TypeScript types
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── docs/
│   ├── scripts/
│   └── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
```

### 2. Task-to-Code Mapping

**Keep tasks granular**:
```
One task = One feature/fix/refactor

Good:
- Task: "Add user registration"
  → commits: schema, route, controller, tests (4 commits)

Bad:
- Task: "Build entire user system"
  → Too large, hard to track, hard to review
```

### 3. Documentation

**Document with Tasks**:
```
Each task should produce:
- Code changes
- Tests (if applicable)
- Documentation updates
- Example usage (if API)

Task Template:
"Implement user registration

Includes:
- POST /api/users/register endpoint
- Email validation
- Password hashing
- Error handling
- Unit tests
- API documentation"
```

---

## Team Collaboration Best Practices

### 1. Communication

**Task Comments Template**:
```
=== STARTING WORK ===
Status: Moving from backlog to in_progress
Estimate: 4 hours
Approach: Will use passport-local for sessions

=== IN PROGRESS ===
Update: 50% complete
- Schema done
- Working on controller
- Need to discuss validation approach

=== BLOCKED ===
Issue: Waiting for database schema approval
- @techlead please review PR #42
- Unblocked task: task-789

=== COMPLETE ===
Status: Ready for code review
PR: #45
Commits: 3
Tests: Passing
Notes: Added input sanitization as discussed
```

### 2. Code Review Standards

**Review Checklist**:
- [ ] Code follows project style guide
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No hardcoded values
- [ ] Error handling implemented
- [ ] Security concerns addressed
- [ ] Task requirements met
- [ ] No obvious bugs

### 3. Knowledge Sharing

**After Completing Complex Tasks**:
1. **Document learnings** in task
2. **Share with team** in standup
3. **Update wiki** if applicable
4. **Pair programming session** for knowledge transfer

---

## Performance Best Practices

### 1. Vibe Stack Performance

**Keep Board Lean**:
- Archive completed tasks weekly
- Delete obsolete tasks
- Limit backlog to <50 active tasks
- Keep done lane <100 tasks

**Regular Maintenance**:
```bash
# Weekly maintenance
make down
docker system prune -f
make up
```

### 2. Development Workflow

**Batch AI Requests**:
```
Instead of:
"Create task for login"
"Create task for logout"
"Create task for registration"

Do:
"Create tasks for complete authentication system:
- Login with email/password
- OAuth with Google
- Registration with email verification
- Password reset flow
- Logout functionality"
```

---

## Security Best Practices

### 1. Secrets Management

**Never Commit**:
- API keys
- Database credentials
- `.env` files
- Certificates
- Personal tokens

**Use**:
```bash
secrets/
└── my-project/
    ├── .env.development
    ├── .env.staging
    └── .env.production
```

### 2. Access Control

**Production**:
- ✅ Enable authentication
- ✅ Use HTTPS/SSL
- ✅ Implement rate limiting
- ✅ Use VPN for remote access
- ❌ Never expose ports publicly without auth

---

## Monitoring Best Practices

### 1. Health Monitoring

**Daily Checks**:
```bash
make health  # All services healthy?
make stats  # Resource usage OK?
make logs  # Any errors?
```

### 2. Metrics to Track

**Team Metrics**:
- Tasks completed per week
- Average cycle time (created → done)
- Tasks in backlog
- Tasks in recovery (urgent issues)

**Quality Metrics**:
- Tasks returned from code-review
- Bugs in production
- Test coverage percentage
- Documentation completeness

---

## Anti-Patterns to Avoid

### ❌ Don't Do This

1. **Create vague tasks**
   - ❌ "Fix stuff"
   - ✅ "Fix login redirect loop"

2. **Ignore estimates**
   - ❌ "I'll know when it's done"
   - ✅ "4 hours (2h for backend, 2h for frontend)"

3. **Skip code review**
   - ❌ "It's simple, doesn't need review"
   - ✅ Always review, even simple changes

4. **Ignore dependencies**
   - ❌ "I'll figure it out later"
   - ✅ Document and plan for dependencies

5. **Update tasks after coding**
   - ❌ Code first, update task later
   - ✅ Move to in_progress, then code

---

## Quick Reference

### Task Status Flow

```
backlog → todo → in_progress → code-review → done
                 ↓                      ↓
              recovery ←──────────────┘
              (urgent issues)
```

### Daily Commands

```bash
# Start day
make health           # Check services
make logs             # Check for errors

# During work
git add .            # Stage changes
git commit           # Commit with task reference
git push             # Share with team

# End of day
make down            # Stop services (if needed)
```

---

## Related Documentation

- **[GIT_INTEGRATION.md](GIT_INTEGRATION.md)** - Git workflows
- **[TEAM_COLLABORATION.md](TEAM_COLLABORATION.md)** - Team workflows
- **[WORKFLOWS.md](WORKFLOWS.md)** - Complete examples
- **[Configuration](../05-operations/01-configuration.md)** - Configuration options

---

**Follow these practices and your team will ship faster!** 🚀
