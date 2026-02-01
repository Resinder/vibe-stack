# Contributing to Vibe Stack

Thank you for your interest in contributing to Vibe Stack! This document provides guidelines and instructions for contributing.

> **Note:** Before contributing, make sure you have Vibe Stack installed by following the **[Installation Guide](02-installation.md)**.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, trolling, or derogatory comments
- Personal or political attacks
- Public or private harassment
- Publishing others' private information
- Any other unethical or unprofessional conduct

---

## Getting Started

### Prerequisites

- Docker 20.10+
- Docker Compose v2.0+
- Git
- Node.js 20+ (for local development)
- 8GB RAM minimum

### Initial Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/vibe-stack.git
cd vibe-stack

# 3. Add upstream remote
git remote add upstream https://github.com/Resinder/vibe-stack.git

# 4. Install dependencies
cd mcp-server
npm install

# 5. Run tests to verify setup
npm test

# 6. Start services
cd ../..
make up
```

### Development Environment

```bash
# Start services in development mode
make dev

# Run tests in watch mode
cd mcp-server
npm run test:watch

# Run linting
npm run lint

# Format code
npm run format
```

---

## Development Workflow

### 1. Create a Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Branch Naming Conventions

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clear, concise commit messages
- Follow the coding standards below
- Add tests for new functionality
- Update documentation as needed

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example:**
```
feat(mcp-server): add WebSocket support for real-time updates

- Implement WebSocket server in http/server.js
- Add connection management and reconnection logic
- Update tests to cover WebSocket functionality

Closes #123
```

### 3. Test Your Changes

```bash
# Run all tests
cd mcp-server && npm test

# Run specific test suite
npm run test:models
npm run test:validation
npm run test:services
npm run test:controllers
npm run test:integration
npm run test:security

# Run integration tests
make test-integration

# Verify services still work
make health
```

### 4. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Link to any related issues
```

---

## Coding Standards

### JavaScript/Node.js

#### Style Guide

We follow standard JavaScript conventions with these specifics:

```javascript
// ✅ Good
async function createTask(taskData) {
  const validated = validateTask(taskData);
  const task = new Task(validated);
  return await boardService.addTask(task);
}

// ❌ Bad
function createTask(d) {
  return boardService.addTask(new Task(validateTask(d)));
}
```

#### Naming Conventions

- **Variables**: camelCase (`taskCount`, `userProfile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_TASKS`, `DEFAULT_PORT`)
- **Classes**: PascalCase (`TaskService`, `ValidationError`)
- **Files**: camelCase (`taskService.js`, `validation.js`)

#### Error Handling

```javascript
// ✅ Good - Specific errors
try {
  const task = await createTask(data);
} catch (error) {
  if (error instanceof TaskNotFoundError) {
    logger.warn(`Task not found: ${error.taskId}`);
  } else {
    logger.error('Unexpected error:', error);
    throw error;
  }
}

// ❌ Bad - Generic catch
try {
  const task = await createTask(data);
} catch (e) {
  // silently ignore
}
```

#### Async/Await

```javascript
// ✅ Good
async function processTasks() {
  const tasks = await getTasks();
  for (const task of tasks) {
    await processTask(task);
  }
}

// ❌ Bad - Mixing promises
function processTasks() {
  return getTasks().then(tasks => {
    tasks.forEach(task => {
      processTask(task); // Missing await
    });
  });
}
```

### Shell Scripts

#### Style Guide

```bash
# ✅ Good
function validate_input() {
  local input="$1"

  if [[ -z "$input" ]]; then
    log_error "Input is required"
    return 1
  fi

  log_info "Input validated: $input"
  return 0
}

# ❌ Bad
validate_input(){
input=$1
if [ -z $input ]; then
echo "Error"
fi
}
```

#### Shell Script Guidelines

- Use `#!/bin/bash` shebang
- Use `[[ ]]` for tests instead of `[ ]`
- Quote all variables: `"$var"` not `$var`
- Use `local` for function-local variables
- Provide error messages with `>&2`
- Return meaningful exit codes

### Documentation

```markdown
# ✅ Good

## Function Name

Brief description of what the function does.

### Parameters

- `param1` (string): Description of parameter 1
- `param2` (number): Description of parameter 2

### Returns

- `Promise<Task>`: Resolves to the created task

### Example

```javascript
const task = await createTask({
  title: "Example",
  priority: "high"
});
```

### Throws

- `ValidationError`: If input is invalid
```

---

## Testing Guidelines

### Test Structure

```javascript
describe('ModuleName', () => {
  describe('FunctionName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = { ... };

      // Act
      const result = functionUnderTest(input);

      // Assert
      assert.strictEqual(result.expected, 'value');
    });

    it('should handle edge case', () => {
      // Test edge cases
    });

    it('should throw error for invalid input', () => {
      // Test error handling
    });
  });
});
```

### Test Coverage

- Aim for **80%+ code coverage**
- All critical paths must be tested
- Edge cases and error handling must be covered
- Integration tests for workflows

### Test Categories

1. **Unit Tests**: Test individual functions/classes
2. **Integration Tests**: Test module interactions
3. **Security Tests**: Test input validation and sanitization
4. **Error Handling Tests**: Test error scenarios

---

## Documentation

### What to Document

1. **New Features**: Update README and relevant docs
2. **API Changes**: Update API.md
3. **Breaking Changes**: Update ARCHITECTURE.md and CHANGELOG.md
4. **Configuration**: Update .env.example

### Documentation Style

- Use clear, concise language
- Provide examples for all features
- Include error messages and solutions
- Add diagrams for complex flows
- Keep documentation up-to-date

---

## Submitting Changes

### Pull Request Checklist

Before submitting, ensure:

- [ ] Tests pass locally (`npm test`)
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commit messages follow format
- [ ] PR description is clear and comprehensive
- [ ] Related issues are linked

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated

## Related Issues
Fixes #123
Related to #456
```

---

## Reporting Issues

### Before Reporting

1. **Search existing issues** - Check if your issue has already been reported
2. **Check documentation** - Review docs for possible solutions
3. **Run diagnostics** - Use `make doctor` to check system health

### Issue Report Template

```markdown
## Description
Clear description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Ubuntu 22.04, macOS 13, Windows 11]
- Docker Version: [e.g., 24.0.0]
- Vibe Stack Version: [e.g., 1.0.0]

## Logs
```
Paste relevant logs here
```

## Additional Context
Any other relevant information
```

---

## Getting Help

- **Documentation**: Check [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Resinder/vibe-stack/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Resinder/vibe-stack/discussions)

---

**Thank you for contributing to Vibe Stack! 🚀**
