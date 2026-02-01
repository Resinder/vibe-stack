# Vibe Stack - Security Policy

## Reporting Security Vulnerabilities

We take the security of Vibe Stack seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Do NOT** open a public issue.

Instead, send an email to: **TODO: Add security contact email**

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if known)

### What to Expect

1. **Acknowledgment**: We'll respond within 48 hours
2. **Assessment**: We'll investigate and validate the report
3. **Remediation**: We'll develop a fix
4. **Disclosure**: We'll coordinate disclosure with you

### Disclosure Policy

- We will disclose vulnerabilities within 90 days of report
- Credits will be given to reporters in the release notes
- We may issue security advisories for critical issues

---

## Supported Versions

Security updates are provided for:

| Version | Security Support |
|---------|------------------|
| 3.x.x   | ✅ Supported     |
| 2.x.x   | ⚠️ Best effort    |
| < 2.0   | ❌ Unsupported   |

---

## Security Features

### Credential Management (v3.0+)

Vibe Stack includes a comprehensive credential management system for securely storing user credentials like GitHub tokens.

#### Encryption

```javascript
// All credentials are encrypted with AES-256-GCM
// Key derivation: PBKDF2 (100,000 iterations)
const encryption = {
  algorithm: 'aes-256-gcm',
  keyDerivation: 'PBKDF2',
  iterations: 100000,
  keyLength: 32
};
```

#### Token Validation

```javascript
// GitHub tokens are validated against GitHub API
// Format: ghp_, gho_, ghu_, ghs_, ghr_, ghb_, ghc_
const validation = {
  formatCheck: true,
  apiValidation: true,
  cache: '5 minutes'
};
```

#### Rate Limiting

```javascript
// Credential operations are rate-limited
const rateLimits = {
  operations: 5,
  window: '1 minute',
  perUser: true
};
```

### Input Validation

All user inputs are validated and sanitized:

```javascript
// Automatic sanitization
const sanitized = sanitizer.sanitizeString(userInput);
const validated = validator.validateTaskId(taskId);

// User ID sanitization (injection prevention)
const cleanUserId = userId.replace(/[^a-zA-Z0-9_.-]/g, '');
```

### Path Traversal Prevention

```javascript
// Blocks malicious paths like "../../etc/passwd"
if (!isValidPath(filePath)) {
  throw new SecurityError('Invalid file path');
}

// InputValidator - File Path Validation
// should block path traversal
// should remove null bytes from file paths
// should validate clean path
```

### Injection Prevention

- **SQL Injection**: Parameterized queries only

  ```javascript
  // All queries use $1, $2, ... parameters
  await pool.query(query, [sanitizedUserId, 'github_token']);
  ```

- **XSS**: Output encoding for all user-generated content

  ```javascript
  // No innerHTML, document.write, or outerHTML found in code
  ```

- **Command Injection**: No direct shell command execution with user input

  ```javascript
  // exec() only used in test files, never with user input
  ```

### ReDoS Prevention

Regular expressions are tested for catastrophic backtracking:

```javascript
// Query length limits enforced
const MAX_QUERY_LENGTH = 1000;
if (query.length > MAX_QUERY_LENGTH) {
  throw new ValidationError('Query too long');
}
```

### Production Security Checks

```javascript
// In production mode, credentials are mandatory
if (process.env.NODE_ENV === 'production') {
  if (!process.env.CREDENTIAL_ENCRYPTION_KEY) {
    throw new Error('[SECURITY] CREDENTIAL_ENCRYPTION_KEY required in production');
  }
  if (!process.env.PGPASSWORD) {
    throw new Error('[SECURITY] Database password required in production');
  }
}
```

---

## Best Practices

### For Users

#### 1. Initial Setup (Required)

```bash
# Generate secure encryption key (REQUIRED)
openssl rand -base64 48

# Add to .env file
echo "CREDENTIAL_ENCRYPTION_KEY=<generated-key>" >> .env

# Generate secure database password
openssl rand -base64 24

# Add to .env file
echo "POSTGRES_PASSWORD=<generated-password>" >> .env
```

#### 2. Keep Updated

```bash
# Pull latest security patches
docker-compose pull
docker-compose up -d
```

#### 3. Don't Expose Ports Publicly

```yaml
# Bad - exposes services to internet
ports:
  - "0.0.0.0:4000:4000"

# Good - localhost only
ports:
  - "127.0.0.1:4000:4000"
```

#### 4. Use Environment Variables

```bash
# .env is already in .gitignore
# Never commit secrets!
git check-ignore .env  # Should return .env
```

#### 5. Set Strong Passwords

```bash
# code-server password
# Edit .env
CODE_SERVER_PASSWORD=$(openssl rand -base64 16)

# Database password
POSTGRES_PASSWORD=$(openssl rand -base64 24)

# Credential encryption key
CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -base64 48)
```

### For Developers

#### 1. Validate All Inputs

```javascript
// Always validate
const validated = validateInput(data);
```

#### 2. Use Parameterized Queries

```javascript
// Good
db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);

// Bad
db.query(`SELECT * FROM tasks WHERE id = ${taskId}`);
```

#### 3. Sanitize Outputs

```javascript
// Mask sensitive data
const masked = maskSensitive(token, 4); // "abcd...xyzw"
```

#### 4. Least Privilege

```javascript
// Only request minimum permissions
const fs = require('fs').promises;
```

#### 5. Security Testing

```bash
# Run security tests
npm run test:security

# All security tests should pass
# - Input Sanitization
# - Path Traversal Prevention
# - Injection Prevention
# - ReDoS Prevention
# - Task ID Validation
```

---

## Container Security

### Image Security

```bash
# Scan for vulnerabilities
docker scan vibe-stack-mcp-server:latest

# Use minimal images
FROM node:20-alpine  # Smaller attack surface
```

### Volume Security

```yaml
# Read-only where possible
volumes:
  - ./config:/app/config:ro  # Read-only

# Don't mount sensitive directories
# volumes:
#   - /root:/host/root  # NEVER DO THIS
```

### Network Security

```yaml
# Services communicate on internal Docker network
# Only expose necessary ports
ports:
  - "127.0.0.1:4000:4000"  # Localhost only for production
```

### Resource Limits

```yaml
# Prevent DoS
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 256M
```

---

## Secrets Management

### Environment Variables (.env)

```bash
# .env (NEVER commit - already in .gitignore)
# ============================================================================
# CREDENTIAL SECURITY (CRITICAL)
# ============================================================================
# Encryption key for storing user credentials (GitHub tokens, etc.)
# CRITICAL: Generate a secure random key for production!
# Use: openssl rand -base64 48
CREDENTIAL_ENCRYPTION_KEY=VeynlrVZurJZUNDB/ezFQthnwptFLX5/B3yrlsapvKCIS8VOJOVJZReYYrILdV/i

# Database credentials
POSTGRES_PASSWORD=<secure-password-generated-with-openssl>

# code-server password
CODE_SERVER_PASSWORD=<secure-password>
```

### Required Environment Variables

| Variable | Required | Description | Generate Command |
|----------|----------|-------------|------------------|
| `CREDENTIAL_ENCRYPTION_KEY` | Yes (Production) | Encryption for user credentials | `openssl rand -base64 48` |
| `POSTGRES_PASSWORD` | Yes | Database password | `openssl rand -base64 24` |
| `CODE_SERVER_PASSWORD` | Yes | code-server access | `openssl rand -base64 16` |

### GitHub Secrets (CI/CD)

```yaml
# .github/workflows/e2e.yml
env:
  # Use GitHub Secrets for sensitive data
  POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD || 'vibepass-test-only' }}
```

**Setup:**

1. Go to repository Settings → Secrets → Actions
2. Add `POSTGRES_PASSWORD` with secure value
3. Add `CREDENTIAL_ENCRYPTION_KEY` with secure value (if needed for CI)

---

## Security Auditing

### Automated Checks

```bash
# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

### Run Security Tests

```bash
# All security tests
npm run test:security

# Output:
# ✅ Security - Input Sanitization (4 tests)
# ✅ Security - Path Traversal Prevention (4 tests)
# ✅ Security - Injection Prevention (3 tests)
# ✅ Security - Board Service (2 tests)
# ✅ Security - ReDoS Prevention (2 tests)
# ✅ Security - Task ID Validation (2 tests)
# Total: 17 security tests
```

### Dependency Scanning

```bash
# Scan for known vulnerabilities
npm audit --audit-level=moderate

# Fix automatically
npm audit fix
```

---

## Credential Management Usage

### Setting GitHub Token

Through Open WebUI chat interface:

```
You: Set my GitHub token to ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Vibe Stack: ✅ GitHub token has been securely stored and configured
- Token prefix: ghp_...xyzw
- Encryption: AES-256-GCM
- Storage: Encrypted at rest in PostgreSQL
```

### Checking Token Status

```
You: Check my GitHub token status

Vibe Stack: ✅ GitHub token is configured and valid
- User: your-username
- Validated: True
```

### Removing Token

```
You: Remove my GitHub token

Vibe Stack: ⚠️ Please confirm by setting confirm=true

You: Remove my GitHub token with confirm=true

Vibe Stack: ✅ GitHub token has been permanently removed
```

---

## Incident Response

### If Compromised

#### 1. Isolate

```bash
# Stop all services immediately
docker-compose down

# Stop Docker completely if needed
docker stop $(docker ps -aq)
```

#### 2. Assess

```bash
# Check logs for suspicious activity
docker logs vibe-kanban > incident-vibe.txt
docker logs vibe-mcp-server > incident-mcp.txt
docker logs vibe-postgres > incident-postgres.txt

# Check for unknown containers/images
docker ps -a
docker images
```

#### 3. Preserve Evidence

```bash
# Export all logs
docker logs vibe-kanban --tail=1000 > incident-vibe-full.txt
docker logs vibe-mcp-server --tail=1000 > incident-mcp-full.txt

# Snapshot PostgreSQL data
docker run --rm -v vibe-stack_postgres_data:/data \
  -v $(pwd):/backup alpine \
  tar czf /backup/incident-db.tar.gz -C /data .

# Backup .env file (for investigation)
cp .env .env.incident
```

#### 4. Remediate

```bash
# 1. Change all passwords/keys
# Generate new encryption key
openssl rand -base64 48 > .env.tmp
# Update CREDENTIAL_ENCRYPTION_KEY in .env

# Generate new database password
openssl rand -base64 24 > .env.tmp
# Update POSTGRES_PASSWORD in .env

# 2. Clear all credential data
docker exec vibe-postgres psql -U vibeuser -d vibestack \
  -c "TRUNCATE TABLE credentials;"

# 3. Rebuild from known-good state
docker-compose down -v  # Remove volumes
git pull origin main     # Get latest code
docker-compose up -d      # Start fresh
```

#### 5. Report

- Email: TODO: Add security contact
- Include: logs, timestamps, affected services

---

## Security Checklist

### Pre-Deployment

- [ ] **CREDENTIAL_ENCRYPTION_KEY** set in .env
- [ ] **POSTGRES_PASSWORD** changed from default
- [ ] **CODE_SERVER_PASSWORD** changed from default
- [ ] No hardcoded credentials in code
- [ ] All inputs validated
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS protection enabled
- [ ] Rate limiting configured
- [ ] Security tests pass (npm run test:security)
- [ ] Dependencies scanned (npm audit)
- [ ] Ports not exposed publicly (127.0.0.1 only)
- [ ] .env file in .gitignore
- [ ] No secrets committed to git

### Post-Deployment

- [ ] Run security audit (npm audit)
- [ ] Test credential storage
- [ ] Test GitHub token validation
- [ ] Monitor logs for security events
- [ ] Set up log monitoring/alerts
- [ ] Review access logs regularly

### Ongoing Maintenance

- [ ] Weekly: `npm audit` for vulnerabilities
- [ ] Weekly: Review logs for suspicious activity
- [ ] Monthly: Rotate encryption key
- [ ] Monthly: Review GitHub token access
- [ ] Quarterly: Full security audit
- [ ] Quarterly: Review and update dependencies

---

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [npm Security](https://docs.npmjs.com/cli/v6/using-npm/developers)
- [GitHub Token Security](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure)
- [AES Encryption](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)

---

## Architecture Security

### Credential Storage Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Request                          │
│  "Set my GitHub token to ghp_xxxxx"                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Credential Controller                         │
│  - Rate limiting (5/min)                                 │
│  - Token format validation                               │
│  - GitHub API validation                                 │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Credential Storage                           │
│  - User ID sanitization                                  │
│  - AES-256-GCM encryption                               │
│  - PBKDF2 key derivation (100k iterations)              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                          │
│  - Encrypted at rest                                     │
│  - Row-level security                                   │
│  - Parameterized queries                                │
└─────────────────────────────────────────────────────────┘
```

### Security Layers

1. **Input Layer**: Sanitization, validation, rate limiting
2. **Application Layer**: Token validation, API checks
3. **Encryption Layer**: AES-256-GCM, PBKDF2 key derivation
4. **Storage Layer**: Encrypted at rest, parameterized queries
5. **Audit Layer**: Comprehensive logging of security events

---

## Contact

- **Security Issues**: TODO: Add security contact email
- **General Questions**: [GitHub Discussions](https://github.com/Resinder/vibe-stack/discussions)
- **Report Bug**: [GitHub Issues](https://github.com/Resinder/vibe-stack/issues)

---

**Last Updated: 2025-01-30**
**Version: 3.0.0**
