# Vibe Stack - Team Collaboration Guide

Complete guide for using Vibe Stack in team environments with multiple users.

> **Note:** For basic installation instructions, see the **[Installation Guide](02-installation.md)**. This guide covers multi-user specific setup and workflows.

---

## 🎯 Overview

Vibe Stack supports **team collaboration** through shared boards, synchronized state, and concurrent access. This guide covers multi-user scenarios, team workflows, and best practices.

---

## 📚 Table of Contents

- [Team Scenarios](#team-scenarios)
- [Multi-User Setup](#multi-user-setup)
- [Access Control](#access-control)
- [Team Workflows](#team-workflows)
- [Collaboration Best Practices](#collaboration-best-practices)
- [Scaling for Teams](#scaling-for-teams)
- [Troubleshooting](#troubleshooting)

---

## Team Scenarios

### Scenario 1: Small Team (2-5 Developers)

**Setup**: Single Vibe Stack instance

```
┌─────────────────────────────────────────────────────────┐
│                  Vibe Stack Server                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Developer 1 ──┐                                       │
│  Developer 2 ──┼──→ Shared Vibe-Kanban Board            │
│  Developer 3 ──┤                                       │
│  Developer 4 ──┘                                       │
│                                                         │
│  • Shared task board                                   │
│  • Common code-server workspace                        │
│  • Single Open WebUI instance                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Best For**:
- Small startups
- Project teams
- Development squads

**Requirements**:
- ✅ Single Vibe Stack deployment
- ✅ Network access for all team members
- ✅ Shared authentication (if needed)

---

### Scenario 2: Multiple Teams (5-20 Developers)

**Setup**: Vibe Stack with role-based lanes

```
┌─────────────────────────────────────────────────────────┐
│                Vibe-Kanban Board                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Team A (Frontend)    Team B (Backend)  Team C (DevOps)│
│  ┌─────────────┐      ┌─────────────┐   ┌───────────┐ │
│  │ backlog     │      │ backlog     │   │ backlog   │ │
│  │ todo        │      │ todo        │   │ todo      │ │
│  │ in_progress │      │ in_progress │   │ in_progress│ │
│  │ done        │      │ done        │   │ done      │ │
│  └─────────────┘      └─────────────┘   └───────────┘ │
│                                                         │
│  Shared lanes at bottom:                                │
│  ┌───────────────────────────────────────┐             │
│  │ code-review (all teams)              │             │
│  │ deployment (all teams)               │             │
│  └───────────────────────────────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Best For**:
- Multiple project teams
- Department-level organization
- Medium companies

**Requirements**:
- Task tagging by team
- Clear lane ownership
- Regular sync meetings

---

### Scenario 3: Distributed Team (Remote Workers)

**Setup**: Vibe Stack with VPN/Tunnel access

```
┌─────────────────────────────────────────────────────────┐
│              Vibe Stack (Office/Cloud)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Remote Dev 1 ──┐                                      │
│  Remote Dev 2 ──┼──→ VPN/Internet                      │
│  Remote Dev 3 ──┤                                      │
│  Office Dev   ──┘                                      │
│                                                         │
│  • HTTPS required                                     │
│  • VPN/Tailscale recommended                           │
│  • Authentication required                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Best For**:
- Remote teams
- Distributed companies
- Freelancers/contractors

**Requirements**:
- ✅ External access (see [EXTERNAL_OPENWEBUI.md](EXTERNAL_OPENWEBUI.md))
- ✅ VPN or secure tunnel
- ✅ Authentication enabled
- ✅ HTTPS/SSL certificates

---

### Scenario 4: Large Organization (20+ Developers)

**Setup**: Multiple Vibe Stack instances with aggregation

```
┌─────────────────────────────────────────────────────────┐
│                  Organization Level                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Team A Stack │  │ Team B Stack │  │Team C Stack│  │
│  │             │  │             │  │            │  │
│  │ Kanban      │  │ Kanban      │  │ Kanban     │  │
│  │ Open WebUI  │  │ Open WebUI  │  │ Open WebUI │  │
│  │ code-server │  │ code-server │  │code-server │  │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                 │                │          │
│         └─────────────────┴────────────────┘          │
│                         │                            │
│                  ┌──────▼──────────┐                 │
│                  │  Aggregation    │                 │
│                  │  (Optional)     │                 │
│                  └─────────────────┘                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Best For**:
- Large enterprises
- Multiple departments
- Complex organizations

**Requirements**:
- ✅ Load balancer
- ✅ Centralized authentication
- ✅ Monitoring and logging
- ✅ Disaster recovery

---

## Multi-User Setup

### Basic Setup (2-5 Users)

#### Step 1: Deploy Vibe Stack

```bash
# On the host machine
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack
make setup
make up
```

#### Step 2: Configure Network Access

**Option A: Local Network**

```bash
# Find host IP
hostname -I  # Linux/Mac
ipconfig     # Windows

# Configure firewall
sudo ufw allow 4000/tcp  # Vibe-Kanban
sudo ufw allow 4001/tcp  # MCP Server
sudo ufw allow 8081/tcp  # Open WebUI
sudo ufw allow 8443/tcp  # code-server
```

**Option B: VPN (Recommended for Remote Teams)**

Use **Tailscale** or **WireGuard** for secure access:

1. **Install Tailscale** on host
2. **Install Tailscale** on each team member's machine
3. **Connect** to the same Tailscale network
4. **Access** via Tailscale IP addresses

#### Step 3: Share Access Credentials

**For Vibe-Kanban**: http://HOST_IP:4000
- No authentication required (basic)
- Or set up nginx reverse proxy with auth

**For Open WebUI**: http://HOST_IP:8081
- Each user configures their own AI provider
- MCP Server connection shared (see below)

**For code-server**: http://HOST_IP:8443
- Password from `.env` file
- Share securely (NOT via email/chat)

---

### Advanced Setup (5+ Users)

#### Reverse Proxy with Authentication

**Install Nginx**:

```bash
sudo apt-get install nginx
```

**Configuration** (`/etc/nginx/sites-available/vibe-stack`):

```nginx
server {
    listen 80;
    server_name vibe-stack.company.com;

    # Vibe-Kanban
    location / {
        auth_basic "Vibe Stack";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://localhost:4000;
    }

    # MCP Server
    location /mcp/ {
        auth_basic "Vibe Stack";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://localhost:4001/;
    }

    # code-server
    location /ide/ {
        auth_basic "Vibe Stack";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://localhost:8443/;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    # Open WebUI
    location /webui/ {
        proxy_pass http://localhost:8081/;
    }
}
```

**Create user passwords**:

```bash
# For each team member
sudo htpasswd /etc/nginx/.htpasswd alice
sudo htpasswd /etc/nginx/.htpasswd bob
sudo htpasswd /etc/nginx/.htpasswd charlie
```

#### SSL/HTTPS (Required for Remote Access)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d vibe-stack.company.com
```

---

## Access Control

### User Levels

| Level | Access | Responsibilities |
|-------|--------|------------------|
| **Admin** | Full access | Manage board, configure system |
| **Developer** | Task access | Create/update/move tasks |
| **Viewer** | Read-only | View board and tasks |
| **Guest** | Limited | View specific lanes only |

### Implementing Access Control

#### Method 1: Nginx Authentication (Recommended)

Different user levels with different htpasswd files:

```nginx
# Admins - Full access
location /admin/ {
    auth_basic_user_file /etc/nginx/.htpasswd-admins;
    proxy_pass http://localhost:4000/;
}

# Developers - Task access
location / {
    auth_basic_user_file /etc/nginx/.htpasswd-devs;
    proxy_pass http://localhost:4000/;
}
```

#### Method 2: Open WebUI User Management

Open WebUI has built-in user management:
1. **Settings** → **Users**
2. **Add User**
3. **Set Role** (Admin, User, Viewer)
4. **User** logs in with credentials

#### Method 3: VPN with User Isolation

- Each team member gets own Open WebUI account
- MCP Server accessible via VPN only
- Task board shared through VPN

---

## Team Workflows

### Workflow 1: Sprint Planning

**Participants**: Product Manager, Tech Lead, Developers

```
1. Product Manager
   └→ In Open WebUI: "Create tasks for user authentication feature"
   └→ AI generates 10 tasks in backlog

2. Tech Lead
   └→ Reviews generated tasks in Vibe-Kanban
   └→ Adjusts priorities and estimates
   └→ Moves sprint tasks to "todo" lane

3. Developers
   └→ Each claims tasks from "todo"
   └→ Moves to "in_progress" when starting
   └→ Moves to "done" when complete
```

---

### Workflow 2: Code Review Integration

**Setup**: Tasks move through review process

```
Development Lane
    │
    ├─→ Developer completes task
    │       │
    │       └─→ Move to "code-review" lane
    │               │
    │               ├─→ Reviewer claims task
    │               │       │
    │               │       └─→ Review code
    │               │               │
    │               │               ├─→ Approved → Move to "done"
    │               │               │
    │               │               └─→ Changes needed → Move back to "in_progress"
    │
    └─→ Continuous integration
```

---

### Workflow 3: Parallel Development

**Multiple developers working simultaneously**:

```
Developer A           Developer B           Developer C
     │                     │                     │
     ├─ Claims Task A1    ├─ Claims Task B1    ├─ Claims Task C1
     │                     │                     │
     ├─ Works in           ├─ Works in           ├─ Works in
     │  code-server        │  code-server        │  code-server
     │                     │                     │
     ├─ Updates task       ├─ Updates task       ├─ Updates task
     │  status             │  status             │  status
     │                     │                     │
     └─→ Moves to done     └─→ Moves to done     └─→ Moves to done
```

**Best Practices**:
- Use task tags: `[frontend]`, `[backend]`, `[api]`
- Assign tasks to specific people
- Use sub-lanes for work-in-progress

---

### Workflow 4: On-Call Rotation

**On-call engineer handles urgent tasks**:

```
┌─────────────────────────────────────────────┐
│           Recovery Lane                      │
├─────────────────────────────────────────────┤
│                                             │
│  🔥 Critical Bug (Production)              │
│  ⚠️ High Priority Infrastructure Issue     │
│  📊 Monitor Alert                           │
│                                             │
└─────────────────────────────────────────────┘
```

**Process**:
1. Urgent issues auto-created in "recovery" lane
2. On-call engineer gets notified (webhook/Slack)
3. Engineer addresses issue immediately
4. Task moved to "done" when resolved

---

## Collaboration Best Practices

### 1. Task Naming Conventions

**Standard format**:
```
[Component] Action - Context
```

**Examples**:
- `[Auth] Implement OAuth login - Google provider`
- `[API] Add POST /users endpoint - JSON response`
- `[UI] Fix navigation menu - Mobile responsive`

**Benefits**:
- Easy to search and filter
- Clear ownership by component
- Consistent across team

---

### 2. Task Tagging Strategy

**Tags by Purpose**:
- `[feature]` - New features
- `[bug]` - Bug fixes
- `[refactor]` - Code improvements
- `[docs]` - Documentation
- `[test]` - Test code
- `[deploy]` - Deployment tasks
- `[urgent]` - Time-sensitive
- `[blocker]` - Blocking other work

**Tags by Component**:
- `[frontend]`, `[backend]`, `[api]`, `[database]`
- `[auth]`, `[payment]`, `[notification]`
- `[mobile]`, `[web]`, `[desktop]`

---

### 3. Lane Management

**Recommended Lane Usage**:

| Lane | Purpose | Who Moves Here |
|------|---------|----------------|
| **backlog** | Future work, ideas | Tech Lead, PM |
| **todo** | Approved, ready to start | Anyone |
| **in_progress** | Currently being worked | Person doing it |
| **code-review** | Awaiting review | After dev done |
| **testing** | Being tested | QA team |
| **done** | Completed | After review/test |
| **recovery** | Urgent issues | On-call engineer |

---

### 4. Communication Rules

**Task Comments**:
- Always add notes when moving tasks
- Explain blockers or dependencies
- Tag relevant team members

**Example**:
```
Task: Implement OAuth login

Movement: todo → in_progress
Comment: Starting OAuth implementation.
         Need API keys from @admin.
         Estimated 2 days.

Movement: in_progress → code-review
Comment: Ready for review. Test credentials in #dev-credentials.
         Needs review of token validation.

Movement: code-review → done
Comment: Approved by @techlead.
         Merged to main.
         Deployed to staging.
```

---

### 5. Conflict Resolution

**Multiple people want same task**:
1. First person to move to `in_progress` gets it
2. Others choose different tasks
3. If task needs collaboration:
   - Create subtasks
   - Tag both people
   - Add comments explaining split

**Task priority conflicts**:
- Tech Lead or PM resolves
- Consider time estimate and dependencies
- May need sprint planning meeting

---

## Scaling for Teams

### Performance Considerations

**Small Teams (2-5)**:
- ✅ Single instance fine
- ✅ No performance issues
- ✅ Simple setup

**Medium Teams (5-20)**:
- ⚠️ May need load balancing
- ⚠️ Consider caching
- ✅ Monitor resources

**Large Teams (20+)**:
- ❌ Need dedicated infrastructure
- ❌ Consider database backend
- ❌ Implement caching layer
- ❌ Add monitoring/alerts

---

### Resource Planning

**Estimated Resources per Team Size**:

| Team Size | CPU | RAM | Storage | Recommendation |
|-----------|-----|-----|---------|----------------|
| 2-5 users | 2 cores | 4GB | 20GB | Single instance |
| 5-10 users | 4 cores | 8GB | 50GB | Load balancer + 2 instances |
| 10-20 users | 8 cores | 16GB | 100GB | Full HA setup |
| 20+ users | 16+ cores | 32GB+ | 500GB | Cluster setup |

---

### High Availability Setup

**For production teams**, use load balancer:

```nginx
upstream vibe_stack_backends {
    server vibe-stack-1:4000;
    server vibe-stack-2:4000;
    server vibe-stack-3:4000;
}

server {
    listen 80;
    location / {
        proxy_pass http://vibe_stack_backends;
    }
}
```

**Shared Storage**:
- Use NFS or cloud storage for `repos/`
- Use PostgreSQL instead of SQLite for board data
- Use Redis for session management

---

## Troubleshooting

### Issue: Concurrent Task Conflicts

**Problem**: Two people move same task at once

**Solution**:
1. Last write wins (by default)
2. Add webhook notifications on task changes
3. Implement optimistic locking in custom layer

---

### Issue: Board Performance Degradation

**Problem**: Board gets slow with many users

**Solutions**:
- Archive old completed tasks
- Increase server resources
- Add caching layer
- Use database backend instead of file-based

---

### Issue: Authentication Problems

**Problem**: Users can't log in

**Solutions**:
- Check htpasswd file permissions
- Verify nginx configuration
- Test with curl: `curl -u user:pass http://localhost:4000`

---

### Issue: VPN Connection Drops

**Problem**: Remote users lose connection

**Solutions**:
- Use reliable VPN (Tailscale recommended)
- Implement auto-reconnect
- Add fallback access method
- Monitor VPN health

---

## Related Documentation

- **[EXTERNAL_OPENWEBUI.md](EXTERNAL_OPENWEBUI.md)** - Remote access setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment
- **[Configuration](../05-operations/01-configuration.md)** - Authentication setup
- **[BEST_PRACTICES.md](BEST_PRACTICES.md)** - Team best practices

---

## Summary

Vibe Stack supports **team collaboration** through:

✅ **Shared Kanban boards** - Everyone sees same tasks
✅ **Concurrent access** - Multiple users work simultaneously
✅ **Remote access** - VPN/HTTPS support for distributed teams
✅ **Access control** - Authentication and authorization
✅ **Scalable architecture** - From 2 to 20+ users

**Team sizes**:
- **Small (2-5)**: Single instance, simple setup
- **Medium (5-20)**: Load balancing, multiple instances
- **Large (20+)**: Full HA, clustering, dedicated infrastructure

---

**Ready for team collaboration?** See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup!
