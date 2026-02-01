# Vibe Stack - Complete Workflow Examples

Real-world workflow examples for common development scenarios.

---

## 📚 Table of Contents

- [Workflow 1: New Feature Development](#workflow-1-new-feature-development)
- [Workflow 2: Bug Fix Lifecycle](#workflow-2-bug-fix-lifecycle)
- [Workflow 3: Refactoring Project](#workflow-3-refactoring-project)
- [Workflow 4: Sprint Planning](#workflow-4-sprint-planning)
- [Workflow 5: Emergency Response](#workflow-5-emergency-response)

---

## Workflow 1: New Feature Development

### Scenario: Adding User Authentication

#### Step 1: Planning (Open WebUI)

```
You: Create a comprehensive task plan for implementing user authentication with:
- Email/password authentication
- OAuth with Google provider
- JWT token management
- Password reset functionality
- Remember me feature
```

**AI generates 10 tasks in backlog**:
```
1. Design authentication schema (4h, high)
2. Set up authentication backend API (8h, high)
3. Implement email/password login (4h, high)
4. Add JWT token generation (3h, high)
5. Implement Google OAuth (6h, high)
6. Add password reset flow (4h, medium)
7. Implement remember me (3h, medium)
8. Add session management (2h, medium)
9. Write authentication tests (6h, low)
10. Update API documentation (2h, low)
```

#### Step 2: Setup

```bash
# Create feature branch
git checkout -b feature/user-authentication

# Create project in code-server
cd /repos/my-app
npm init -y
npm install express jsonwebtoken bcryptjs
```

#### Step 3: Implementation

**Task 1: Design authentication schema**

```bash
# Move task to in_progress in Vibe-Kanban
# Open code-server: http://localhost:8443

# Create schema
mkdir -p src/models
nano src/models/user.js
```

```javascript
// src/models/user.js
export const userSchema = {
  id: 'UUID',
  email: 'STRING unique',
  passwordHash: 'STRING',
  googleId: 'STRING optional',
  createdAt: 'TIMESTAMP',
  updatedAt: 'TIMESTAMP'
};
```

```bash
# Commit
git add src/models/user.js
git commit -m "feat(auth): Design user schema

Task: task-001
- Define user model structure
- Add support for both email and OAuth
- Add timestamps
"
```

**Task 2: Set up authentication backend**

```bash
# Move task-002 to in_progress
# Continue implementation...
```

#### Step 4: Testing

```bash
# Task: Write authentication tests
cd /repos/my-app
npm install --save-dev jest supertest

# Create tests
mkdir tests/auth.test.js
```

#### Step 5: Code Review

```bash
# All development complete
# Move each task to code-review lane

# Create pull request
git push origin feature/user-authentication

# PR title: "feat(auth): User authentication with OAuth"
# Body: "Implements tasks task-001 through task-010"
```

#### Step 6: Completion

```bash
# After PR approval and merge
git checkout main
git pull

# Move all tasks to done in Vibe-Kanban
```

---

## Workflow 2: Bug Fix Lifecycle

### Scenario: Production Bug - Login Fails

#### Step 1: Report Bug

**In Vibe-Kanban**:
```
Title: [CRITICAL] Users cannot log in - shows 500 error
Priority: critical
Lane: recovery
Tag: [production], [urgent]
```

#### Step 2: Investigation

```bash
# Create hotfix branch
git checkout -b hotfix/login-500-error

# Check logs
docker logs vibe-kanban | grep -i error

# Reproduce bug
curl -X POST http://localhost:4000/api/auth/login \
  -d '{"email":"test@test.com","password":"wrong"}'
```

#### Step 3: Fix Bug

```javascript
// Found issue in src/auth/login.js
// Error: accessing undefined property

// Fix
if (!user || !user.validatePassword(password)) {
  return res.status(401).json({ error: 'Invalid credentials' });
}
```

```bash
# Test fix
curl -X POST http://localhost:4000/api/auth/login \
  -d '{"email":"test@test.com","password":"test123"}'

# Commit
git commit -m "fix(auth): Fix 500 error on login

Issue: Undefined property access when user not found
Fix: Add null check before accessing user methods
Test: Verified with curl

Task: task-bug-001
Fixes #456"
```

#### Step 4: Deploy Fix

```bash
# Push to staging
git push origin hotfix/login-500-error

# Run tests
npm test

# Deploy to production
./deploy-production.sh

# Verify fix
curl https://api.example.com/auth/login
```

#### Step 5: Update Board

```
Move task from recovery → done
Tag with [verified]
Add comment: "Deployed to production, verified working"
```

---

## Workflow 3: Refactoring Project

### Scenario: Refactor User Service

#### Step 1: Analysis

```
You: Analyze the user service code and suggest refactoring tasks

Current issues:
- 2000-line user controller
- Mixed concerns (validation, business logic, data access)
- No unit tests
- Duplicate validation code
```

**AI generates refactoring plan**:
```
1. Extract validation layer (6h, medium)
2. Create repository pattern (4h, medium)
3. Add service layer (5h, medium)
4. Implement dependency injection (3h, low)
5. Add unit tests (8h, low)
```

#### Step 2: Refactor Iteratively

**Week 1: Extract Validation**

```bash
# Task: Extract validation layer
git checkout -b refactor/validation-extraction

# Create validator classes
mkdir src/validators
nano src/validators/user-validator.js
```

```javascript
// Before: validation in controller
if (!email || !email.includes('@')) {
  return res.status(400).json({ error: 'Invalid email' });
}

// After: separate validator
export const UserValidator = {
  validateEmail(email) {
    if (!email || !email.includes('@')) {
      throw new ValidationError('Invalid email');
    }
  }
};
```

```bash
# Commit refactoring
git commit -m "refactor(auth): Extract validation to separate layer

- Create UserValidator class
- Reusable validation methods
- Centralized error messages

Task: task-refactor-001
Refs: #789"
```

#### Step 3: Add Tests

```bash
# Task: Add unit tests
# Create test files
mkdir tests/unit/validators

nano tests/unit/validators/user-validator.test.js
```

```javascript
describe('UserValidator', () => {
  test('validateEmail accepts valid email', () => {
    expect(() => UserValidator.validateEmail('test@test.com'))
      .not.toThrow();
  });

  test('validateEmail rejects invalid email', () => {
    expect(() => UserValidator.validateEmail('invalid'))
      .toThrow(ValidationError);
  });
});
```

#### Step 4: Integration

```bash
# Run tests
npm test

# If all pass:
git commit -m "test(auth): Add validator unit tests

- Test valid emails
- Test invalid emails
- Test edge cases

Task: task-refactor-005
Coverage: 100%
"
```

---

## Workflow 4: Sprint Planning

### Scenario: 2-Week Sprint

#### Day 1: Sprint Planning

**Team Review**:
```bash
# Check velocity from last sprint
# Last sprint: 12 tasks completed
# Average: 6 tasks per week

# Review backlog
make health
# Visit http://localhost:4000
```

**AI-Assisted Planning**:

```
You: We need to plan a 2-week sprint for our e-commerce site.
Focus on:
- Shopping cart improvements
- Checkout process optimization
- Payment integration
Team capacity: 2 developers
Velocity: ~60 hours per week

Generate appropriate tasks with estimates.
```

**AI generates sprint tasks**:
```
Shopping Cart (Week 1):
1. Add quantity controls (4h)
2. Implement persistent cart (6h)
3. Add cart sharing (8h)
4. Cart analytics (4h)

Checkout (Week 1):
5. Design checkout flow (3h)
6. Guest checkout (6h)
7. Address validation (4h)
8. Order summary (3h)

Payment (Week 2):
9. Stripe integration (8h)
10. Payment confirmation (3h)
11. Webhook handling (4h)
12. Error recovery (4h)
```

#### During Sprint

**Daily Standup** (in Vibe-Kanban comments):
```
Task: Implement persistent cart

Developer 1:
- Moved to in_progress yesterday
- Created cart model
- Working on local storage integration
- Blocker: Need decision on session vs local storage
- Estimate: 4h remaining
```

#### End of Sprint

```
Completed: 12/12 tasks (100%)
Velocity: 62 hours (exceeded estimate by 2h)

Retrospective:
- What went well: Cart sharing feature
- What didn't: Estimated too low on Stripe
- Improvements: Add buffer for complex integrations
```

---

## Workflow 5: Emergency Response

### Scenario: Production Outage

#### Step 1: Detection

**Automated Alert** (webhook):
```json
{
  "event": " outage",
  "service": "api-server",
  "error": "Database connection timeout",
  "severity": "critical",
  "timestamp": "2026-01-28T14:30:00Z"
}
```

**MCP Server creates task**:
```
Task: [CRITICAL] Database connection timeout - API down
Priority: critical
Lane: recovery
Auto-created: true
```

#### Step 2: Immediate Response

```bash
# On-call engineer sees task in recovery lane
# Moves task to in_progress
# Checks logs
docker logs api-server

# Identifies issue: Database connection pool exhausted
```

#### Step 3: Fix Implementation

```javascript
// Quick fix: Increase pool size
// config/database.js
module.exports = {
  pool: {
    max: 20,  // increased from 10
    min: 5,
    acquireTimeoutMillis: 30000
  }
};
```

```bash
# Deploy hotfix
git checkout -b hotfix/db-pool-size
git commit -m "fix(db): Increase connection pool size

Critical issue: Pool exhaustion causing API downtime
Immediate action: Increase max connections
Monitor: Watch for recurrence

Task: task-emergency-001
Fixes #outage-123"
```

#### Step 4: Verification

```bash
# Deploy to production
kubectl rollout status deployment/api-server

# Verify database connections
curl https://api.example.com/health
# Returns: {"status":"healthy"}

# Monitor for 30 minutes
watch kubectl get pods
```

#### Step 5: Post-Incident

```
Move task: recovery → done

Create follow-up tasks:
- "Investigate root cause of pool exhaustion" (high)
- "Add connection pool monitoring" (medium)
- "Implement auto-scaling for database" (low)
- "Post-incident review meeting" (high)
```

---

## Quick Reference

### Task State Flow

```
┌─────────┐
│ backlog │ ← AI generates here
└────┬────┘
     │
     ↓ (approved)
┌─────────┐
│   todo   │ ← Ready to start
└────┬────┘
     │
     ↓ (claimed)
┌─────────────┐
│in_progress  │ ← Currently working
└──────┬──────┘
       │
       ↓ (done coding)
┌─────────────┐
│code-review  │ ← Awaiting review
└──────┬──────┘
       │
       ↓ (approved)
┌─────────┐
│   done   │ ← Complete!
└─────────┘
```

### Emergency Flow

```
┌──────────┐
│ recovery │ ← Critical/urgent issues
└────┬─────┘
     │
     ↓ (fixed)
┌─────────┐
│   done   │ ← Resolved
└─────────┘
```

---

## Summary

Each workflow demonstrates:

✅ **AI Planning** - Generate tasks with Open WebUI
✅ **Task Management** - Track in Vibe-Kanban
✅ **Development** - Implement in code-server
✅ **Version Control** - Git integration
✅ **Review Process** - Code review workflows
✅ **Completion** - Tasks marked done

**Choose the workflow that matches your scenario** and adapt as needed!

---

**Need more?** See [BEST_PRACTICES.md](BEST_PRACTICES.md) and [GIT_INTEGRATION.md](GIT_INTEGRATION.md)
