# Windows Setup Guide

Complete guide for setting up Vibe Stack on Windows.

## Prerequisites

### 1. Windows Version

- **Windows 10** version 2004 or higher (Build 19041 or higher)
- **Windows 11** any version
- Check your version: `Win + R` → `winver`

### 2. Required Software

#### Docker Desktop for Windows

1. Download from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Install with default settings
3. Restart when prompted
4. Verify installation:
   ```powershell
   docker --version
   docker compose version
   ```

#### Git for Windows

1. Download from [git-scm.com](https://git-scm.com/download/win)
2. Install with these options:
   - ✅ Git from the command line and also from 3rd-party software
   - ✅ Use Windows' default console window
   - ✅ Default branch name: `main`
   - ✅ Enable Git Credential Manager
3. Verify installation:
   ```powershell
   git --version
   ```

#### Node.js (Optional, for development)

1. Download from [nodejs.org](https://nodejs.org/)
2. Install LTS version (20.x or higher)
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

#### Visual Studio Code (Optional)

1. Download from [code.visualstudio.com](https://code.visualstudio.com/)
2. Install with default settings
3. Recommended extensions:
   - Docker
   - GitLens
   - ESLint

---

## Installation

### Method 1: Using PowerShell (Recommended)

1. **Open PowerShell as Administrator**
   - Press `Win + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Clone the repository**
   ```powershell
   cd C:\Users\YourName
   git clone https://github.com/Resinder/vibe-stack.git
   cd vibe-stack
   ```

3. **Create environment file**
   ```powershell
   copy .env.example .env
   notepad .env
   ```

4. **Update passwords in .env**
   ```powershell
   # Change these values in the .env file:
   POSTGRES_PASSWORD=your-secure-password
   CODE_SERVER_PASSWORD=your-secure-password
   GRAFANA_ADMIN_PASSWORD=your-secure-password
   CREDENTIAL_ENCRYPTION_KEY=your-encryption-key
   ```

5. **Start services**
   ```powershell
   docker compose up -d
   ```

### Method 2: Using Git Bash

1. **Open Git Bash**
   - Right-click in folder → "Git Bash Here"

2. **Clone and setup**
   ```bash
   cd /c/Users/YourName
   git clone https://github.com/Resinder/vibe-stack.git
   cd vibe-stack
   cp .env.example .env
   nano .env  # or use notepad .env
   docker compose up -d
   ```

### Method 3: Using WSL2 (Best for Linux compatibility)

1. **Enable WSL2**
   ```powershell
   # Open PowerShell as Administrator
   wsl --install
   ```

2. **Restart Windows when prompted**

3. **Set WSL2 as default**
   ```powershell
   wsl --set-default-version 2
   ```

4. **Install Ubuntu in WSL2**
   ```powershell
   wsl --install -d Ubuntu
   ```

5. **Use Linux commands in WSL2**
   ```bash
   # In WSL2 terminal
   cd /mnt/c/Users/YourName/vibe-stack
   docker compose up -d
   ```

---

## Docker Desktop Configuration

### Enable WSL2 Backend

1. **Open Docker Desktop**
2. **Go to Settings**
   - Click the gear icon (⚙️) in the top right

3. **General tab**
   - ✅ Use the WSL 2 based engine

4. **Resources → WSL Integration**
   - ✅ Enable integration with my default WSL distro
   - ✅ Ubuntu-XX.XX (your installed distro)

5. **Apply & Restart Docker Desktop**

### File Sharing

1. **Go to Settings → Resources → File Sharing**
2. **Add your project directory:**
   ```
   C:\Users\YourName\vibe-stack
   ```

3. **Apply & Restart**

### Resource Limits

1. **Go to Settings → Resources**
2. **Adjust based on your system:**
   - **Memory**: 4 GB minimum (8 GB recommended)
   - **CPUs**: 2 minimum (4 recommended)
   - **Disk**: 64 GB minimum

---

## Windows-Specific Configuration

### Path Issues

**Problem:** Windows paths use backslashes (`\`) but Docker expects forward slashes (`/`)

**Solution 1:** Use forward slashes in compose files
```yaml
volumes:
  - ./repos:/repos  # Works on all platforms
```

**Solution 2:** Use double backslashes
```yaml
volumes:
  - .\\repos:/repos  # Windows only
```

**Solution 3:** Use WSL2 paths
```yaml
volumes:
  - /mnt/c/Users/YourName/vibe-stack/repos:/repos
```

### Line Endings

**Problem:** Git converts line endings, causing script errors

**Solution:** Configure Git to use LF line endings
```bash
# In Git Bash or WSL2
git config --global core.autocrlf input
git config --global core.eol lf
```

Or disable for this repository:
```bash
cd vibe-stack
git config core.autocrlf false
git rm --cached -r .
git reset --hard
```

### Permissions

**Problem:** Docker containers can't access mounted volumes

**Solution:**
1. **Open Docker Desktop Settings**
2. **Go to Resources → File Sharing**
3. **Add your project directory**
4. **Set proper permissions:**
   ```powershell
   # In PowerShell (Admin)
   icacls "C:\Users\YourName\vibe-stack" /grant Everyone:(OI)(CI)F
   ```

---

## Starting Services

### Using PowerShell

```powershell
# Navigate to project
cd C:\Users\YourName\vibe-stack

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

### Using Makefile (requires WSL2)

```bash
# In WSL2
make up
make logs
make ps
```

### Using npm scripts

```powershell
# In PowerShell
npm run docker:up
npm run docker:logs
npm run docker:health
```

---

## Accessing Services

Once services are running, access them via:

| Service | URL | Credentials |
|---------|-----|-------------|
| Vibe-Kanban | http://localhost:4000 | None |
| code-server | http://localhost:8443 | From .env (default: dev123) |
| Open WebUI | http://localhost:8081 | Create account |
| Grafana | http://localhost:3000 | admin / From .env |
| Prometheus | http://localhost:9090 | None |

---

## Common Windows Issues

### Issue: "Cannot connect to Docker daemon"

**Solution:**
1. Make sure Docker Desktop is running
2. Check Docker Desktop status in system tray
3. Restart Docker Desktop:
   ```powershell
   # Right-click Docker Desktop icon → Restart
   ```

### Issue: "Port already in use"

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :4000

# Kill the process
taskkill /PID <PID> /F

# Or change the port in .env
```

### Issue: Scripts won't execute

**Error:** `running scripts is disabled on this system`

**Solution:**
```powershell
# Enable script execution (Admin PowerShell)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or just for this session
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Issue: Volume mount errors

**Error:** `invalid mount path for volume`

**Solution:**
1. **Share drive in Docker Desktop:**
   - Docker Desktop → Settings → Resources → File Sharing
   - Add `C:\` drive
2. **Use WSL2 instead**
3. **Use relative paths:**
   ```yaml
   volumes:
     - ./repos:/repos  # Instead of absolute path
   ```

### Issue: Git Bash scripts fail

**Error:** `bash: ./script.sh: bad interpreter`

**Solution:**
```bash
# Convert line endings
dos2unix script.sh

# Or set Git to use LF
git config core.autocrlf input
```

---

## Development Workflow

### Using VS Code with Docker

1. **Install Remote Development extension**
2. **Open project in container:**
   - `F1` → "Dev Containers: Attach to Running Container"
   - Select `vibe-kanban` container

### Hot Reload in Development

```powershell
# Use development compose override
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# This enables:
# - Hot-reload for code changes
# - Debug ports exposed
# - Source code mounted
# - Debug logging enabled
```

### Running Tests

```powershell
# Run all tests
npm test

# Run specific test suite
npm run test:models
npm run test:services
npm run test:controllers
```

---

## Performance Tuning

### Docker Desktop Settings

1. **Increase resources**
   - Memory: 8 GB
   - CPUs: 4
   - Disk: 64 GB

2. **Enable WSL2**
   - Settings → General → Use WSL 2 based engine

3. **Disable unused features**
   - Settings → General → Uncheck "Send usage statistics"
   - Settings → General → Uncheck "Show tips at startup"

### Windows Performance

1. **Use WSL2 for better performance**
2. **Exclude project from Windows Defender:**
   ```powershell
   # In PowerShell (Admin)
   Add-MpPreference -ExclusionPath "C:\Users\YourName\vibe-stack"
   ```

3. **Disable Windows Search for project folder**
   - Right-click `vibe-stack` folder
   - Properties → Advanced
   - Uncheck "Index this folder"

---

## Backup and Restore

### Creating Backups

```powershell
# Using PowerShell
npm run backup:create

# Or directly
bash scripts\ops\backup-volumes.sh --full
```

### Restoring Backups

```powershell
# Stop services
docker compose down

# Restore backup
bash scripts\ops\backup-volumes.sh --restore backups\postgres_20250131.sql.gz

# Start services
docker compose up -d
```

---

## Troubleshooting

### Quick Diagnostics

```powershell
# Check all services
docker compose ps

# Check Docker version
docker --version
docker compose version

# Check logs
docker compose logs --tail=50

# Validate environment
npm run docker:validate
```

### Collect Diagnostic Info

```powershell
# Create diagnostic bundle
$env:COMPOSE_DOCKER_CLI_BUILD=1

diagnostics = @()
$diagnostics += "=== Docker Version ==="
$diagnostics += docker --version
$diagnostics += ""
$diagnostics += "=== Container Status ==="
$diagnostics += docker compose ps
$diagnostics += ""
$diagnostics += "=== Recent Logs ==="
$diagnostics += docker compose logs --tail=50

$diagnostics | Out-File diagnostics.txt

# Include with bug reports
```

### Getting Help

If you encounter issues not covered here:

1. **Check main troubleshooting guide:** [docs/06-development/05-troubleshooting.md](05-troubleshooting.md)
2. **Check GitHub Issues:** https://github.com/Resinder/vibe-stack/issues
3. **Create diagnostic bundle** (see above)
4. **Include system information:**
   - Windows version
   - Docker Desktop version
   - PowerShell version
   - Error messages

---

## Next Steps

After successful installation:

1. **Read the Quick Start Guide:** [docs/01-getting-started/01-quick-start.md](../01-getting-started/01-quick-start.md)
2. **Configure AI Providers:** See [docs/01-getting-started/02-installation.md](../01-getting-started/02-installation.md)
3. **Set up monitoring:** [docs/05-operations/03-monitoring.md](../05-operations/03-monitoring.md)
4. **Learn workflows:** [docs/02-user-guide/02-workflows.md](../02-user-guide/02-workflows.md)

---

## Windows Tips

### Useful PowerShell Aliases

Add these to your PowerShell profile (`$PROFILE`):

```powershell
# Docker aliases
function dcup { docker compose up -d }
function dcdown { docker compose down }
function dclogs { docker compose logs -f }
function dcps { docker compose ps }

# Project aliases
function vibe { cd C:\Users\YourName\vibe-stack }
function vibelogs { cd C:\Users\YourName\vibe-stack; docker compose logs -f }
```

### Windows Terminal Configuration

For best experience, use [Windows Terminal](https://aka.ms/terminal) with:

- **PowerShell 7** - Better performance than Windows PowerShell 5
- **Git Bash** - For Unix-like commands
- **Ubuntu (WSL2)** - For full Linux compatibility
- **Color schemes** - Use "One Dark Pro" or similar

### File Explorer Integration

Add "Open in Windows Terminal" to context menu:

1. Open Windows Terminal Settings (Ctrl+,)
2. Go to "Profiles"
3. Enable "Copy to clipboard on select"
4. Use right-click in File Explorer for quick access
