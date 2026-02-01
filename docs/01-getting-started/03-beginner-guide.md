# Vibe Stack - Complete Beginner's Guide

**Never used Docker before? Never worked with containers?** This guide is for you!

> **Note:** If you already have Docker installed and are familiar with containers, see the **[Installation Guide](02-installation.md)** for a quicker setup.

---

## 🎯 What You'll Learn

- What Docker is (in plain English)
- How to install Docker on your computer
- How to set up Vibe Stack step-by-step
- Common Docker commands you'll need
- Troubleshooting for beginners

---

## 📚 Table of Contents

- [What is Docker?](#what-is-docker)
- [Why Use Docker?](#why-use-docker)
- [Installing Docker](#installing-docker)
- [Docker Basics](#docker-basics)
- [Setting Up Vibe Stack](#setting-up-vibe-stack)
- [Your First AI Tasks](#your-first-ai-tasks)
- [Common Beginner Questions](#common-beginner-questions)
- [Next Steps](#next-steps)

---

## What is Docker?

### In Simple Terms

**Docker** is a tool that packages software into containers. Think of containers like lightweight virtual machines that include everything an application needs to run.

```
┌─────────────────────────────────────────┐
│         Your Computer                   │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Container  │  │   Container  │   │
│  │  (Vibe Stack)│  │  (Other App) │   │
│  │              │  │              │   │
│  │  ┌────────┐  │  │  ┌────────┐  │   │
│  │  │   App  │  │  │  │   App  │  │   │
│  │  ├────────┤  │  │  ├────────┤  │   │
│  │  │  Files │  │  │  │  Files │  │   │
│  │  └────────┘  │  │  └────────┘  │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         Docker Engine           │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Why Containers Are Great

✅ **Everything included** - No need to install Node.js, Python, or other tools
✅ **Isolated** - Won't mess up your computer
✅ **Consistent** - Works the same on every computer
✅ **Easy to remove** - Just delete the container when done

---

## Why Use Docker?

### Traditional vs. Docker

#### Traditional Installation (Painful)

```
1. Install Node.js
   → Download installer
   → Run installer
   → Restart computer
   → Hope nothing breaks

2. Install Python
   → Download installer
   → Run installer
   → Restart computer
   → Hope versions don't conflict

3. Configure all services
   → Edit config files
   → Set environment variables
   → Fix path issues
   → Spend hours troubleshooting

4. Something breaks
   → Uninstall everything
   → Start over
   → Cry
```

#### Docker Installation (Easy)

```
1. Install Docker (one time)
   → Download installer
   → Run installer
   → Done!

2. Run Vibe Stack
   → One command: make up
   → Everything works!

3. Something breaks?
   → One command: make down
   → One command: make up
   → Fixed!
```

---

## Installing Docker

### Windows

#### Requirements
- **Windows 10/11** Pro, Enterprise, or Education
- **OR Windows 10/11** Home with WSL 2
- **64-bit processor**
- **4GB RAM minimum** (8GB recommended)

#### Installation Steps

1. **Download Docker Desktop**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Click "Download for Windows"
   - Save the installer

2. **Run Installer**
   - Double-click `Docker Desktop Installer.exe`
   - Follow the installation wizard
   - Click "OK" when prompted to enable WSL 2
   - Click "Close and restart" when done

3. **Verify Installation**
   - Open PowerShell or Command Prompt
   - Type: `docker --version`
   - Should see: `Docker version 24.x.x...`

4. **Start Docker Desktop**
   - Open "Docker Desktop" from Start Menu
   - Wait for "Docker Desktop is running" message

#### Troubleshooting Windows

**Issue**: "WSL 2 not installed"
```
Solution:
1. Open PowerShell as Administrator
2. Run: wsl --install
3. Restart computer
4. Try again
```

**Issue**: "Virtualization not enabled"
```
Solution:
1. Restart computer
2. Enter BIOS (usually F2 or Delete key)
3. Enable Virtualization Technology (VT-x)
4. Save and restart
```

---

### macOS

#### Requirements
- **macOS 11** (Big Sur) or newer
- **Apple Silicon (M1/M2)** or Intel processor
- **4GB RAM minimum** (8GB recommended)

#### Installation Steps

1. **Download Docker Desktop**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Click "Download for Mac"
   - Choose Apple Silicon or Intel chip

2. **Open Docker.dmg**
   - Double-click the downloaded file
   - Drag Docker to Applications folder

3. **Start Docker**
   - Open Docker from Applications
   - Click "Open" when prompted
   - Wait for "Docker Desktop is running"

4. **Verify Installation**
   - Open Terminal
   - Type: `docker --version`
   - Should see: `Docker version 24.x.x...`

#### Troubleshooting macOS

**Issue**: "Docker won't start"
```
Solution:
1. Update macOS to latest version
2. Update Docker Desktop to latest version
3. Restart computer
4. Try again
```

---

### Linux (Ubuntu/Debian)

#### Requirements
- **Ubuntu 20.04+** or **Debian 11+**
- **64-bit processor**
- **4GB RAM minimum** (8GB recommended)

#### Installation Steps

1. **Update System**
   ```bash
   sudo apt-get update
   sudo apt-get upgrade -y
   ```

2. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

3. **Install Docker Compose**
   ```bash
   sudo apt-get install docker-compose-plugin -y
   ```

4. **Add User to Docker Group**
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

5. **Verify Installation**
   ```bash
   docker --version
   docker compose version
   ```

#### Troubleshooting Linux

**Issue**: "Permission denied"
```
Solution:
1. Log out and log back in
2. Or use: sudo docker
```

---

## Docker Basics

### Key Commands You'll Need

```bash
# See running containers
docker ps

# See all containers (including stopped)
docker ps -a

# See container logs
docker logs <container-name>

# Stop a container
docker stop <container-name>

# Start a container
docker start <container-name>

# Restart a container
docker restart <container-name>

# Remove a container
docker rm <container-name>
```

### Vibe Stack Commands (Simplified)

```bash
# Start everything
make up

# Stop everything
make down

# See what's running
make ps

# View logs
make logs

# Check health
make health

# Help (see all commands)
make help
```

---

## Setting Up Vibe Stack

### Step 1: Download Vibe Stack

**Option A: If you have Git**
```bash
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack
```

**Option B: If you DON'T have Git**
1. Go to: https://github.com/Resinder/vibe-stack
2. Click green "Code" button
3. Click "Download ZIP"
4. Extract the ZIP file
5. Open terminal/command prompt in that folder

---

### Step 2: Run Setup

**Windows (PowerShell or Command Prompt)**:
```bash
.\scripts\setup\init.bat
# OR if that doesn't work
make setup
```

**Mac/Linux (Terminal)**:
```bash
make setup
```

**What this does**:
- ✅ Creates configuration file (`.env`)
- ✅ Sets up AI settings
- ✅ Configures permissions
- ✅ Prepares everything for you

---

### Step 3: Set Your Password

**IMPORTANT**: You MUST set a secure password!

**Windows (PowerShell)**:
```powershell
# Edit .env file
notepad .env
```

**Mac/Linux**:
```bash
nano .env
# or
vim .env
```

**Change this line**:
```bash
CODE_SERVER_PASSWORD=your-secure-password-here
```

**Save**:
- **nano**: Ctrl+X, then Y, then Enter
- **vim**: :wq
- **notepad**: Ctrl+S, close window

---

### Step 4: Start Vibe Stack

```bash
make up
```

**What you'll see**:
```
Starting Vibe Stack services...
[+] Running 4/4
✓ vibe-kanban
✓ code-server
✓ open-webui
✓ mcp-server

✓ Services started

Service URLs:
  Vibe-Kanban:  http://localhost:4000
  VS Code:      http://localhost:8443
  Open WebUI:   http://localhost:8081
```

**Wait 30 seconds** for services to fully start.

---

### Step 5: Verify Everything Works

```bash
make health
```

**You should see**:
```
Vibe-Kanban (port 4000):
  ● Healthy

Code-Server (port 8443):
  ● Healthy

Open WebUI (port 8081):
  ● Healthy
```

**If you see "Starting/Unreachable"**:
- Wait another 30 seconds
- Run `make health` again
- Services take time to start up

---

## Your First AI Tasks

### Step 1: Open Open WebUI

Go to: **http://localhost:8081**

---

### Step 2: Configure AI Provider

**Choose ONE of these options**:

#### Option A: OpenAI (Easiest)
1. Click **Settings** (gear icon, top right)
2. Click **Providers** → **OpenAI**
3. Enter your OpenAI API key
   - Get one at: https://platform.openai.com/api-keys
4. Select **GPT-4** or **GPT-3.5-turbo**
5. Click **Save**

#### Option B: Anthropic Claude (Best for coding)
1. Click **Settings** → **Providers** → **Anthropic**
2. Enter your Anthropic API key
   - Get one at: https://console.anthropic.com/
3. Select **Claude Opus** or **Claude Sonnet**
4. Click **Save**

#### Option C: Ollama (Free, runs locally)
1. Install Ollama: https://ollama.ai/
2. Run: `ollama pull llama2`
3. In Open WebUI: **Settings** → **Providers** → **Ollama**
4. Click **Connect**

---

### Step 3: Add MCP Server

1. In **Settings**, go to **MCP Servers**
2. Click **Add MCP Server**
3. Fill in:
   - **Name**: `Vibe Stack`
   - **Type**: `STDIO`
   - **Command**: Copy this exactly:
     ```
     docker exec -i vibe-mcp-server node /app/index.js
     ```
4. Click **Save**
5. Click **Test Connection**
6. Should say: **"Connected successfully"**

---

### Step 4: Generate Your First Tasks!

**Create a new chat** in Open WebUI (click **+ New Chat**)

**Type this** (exactly):
```
Create a task plan for building a simple todo app
```

**Watch the magic happen**:
```
🎯 Analyzing your goal...

Detected: Frontend pattern
Estimated: 9 tasks (~49 hours)

🎯 Generated 9 tasks for "Todo App"

📊 Summary:
  • Total: 9 tasks
  • High priority: 5
  • Medium priority: 3
  • Low priority: 1

📋 Tasks:
  1. Design app structure (4h, high)
  2. Create HTML/CSS layout (6h, high)
  3. Implement add task (4h, high)
  4. Implement delete task (2h, high)
  5. Add local storage (3h, medium)
  6. Add edit functionality (4h, medium)
  7. Style with CSS (4h, medium)
  8. Write tests (4h, low)
  9. Deploy to GitHub Pages (2h, low)

✨ Tasks added to Vibe-Kanban!
   View at: http://localhost:4000
```

---

### Step 5: See Your Tasks!

Go to: **http://localhost:4000**

**You'll see**:
- Your Kanban board with all AI-generated tasks
- Tasks organized in lanes (backlog, todo, in_progress, done, recovery)
- Task details with priorities and time estimates

---

### Step 6: Start Coding!

1. **Open code-server**: http://localhost:8443
2. **Login** with password from `.env`
3. **Create your project** in `/repos`
4. **Start working** on your tasks!

---

## Common Beginner Questions

### Q: What is a "container"?

**A**: Think of a container like a packed lunchbox. Everything you need (sandwich, fruit, drink) is inside the box. You don't need to bring anything else. Similarly, a Docker container has everything the application needs to run.

### Q: Do I need to know Docker commands?

**A**: Not really! Vibe Stack uses `make` commands that hide Docker complexity. You only need:
- `make up` - Start everything
- `make down` - Stop everything
- `make logs` - See what's happening
- `make health` - Check if things are working

### Q: Can I use Vibe Stack without Docker?

**A**: No. Vibe Stack requires Docker. But don't worry - Docker is easy to install and use!

### Q: Will Docker slow down my computer?

**A**: Docker uses some resources, but not much. Vibe Stack needs about 4GB RAM and 2 CPU cores. Most modern computers can handle this easily.

### Q: What if something breaks?

**A**: Just run:
```bash
make down
make up
```

This restarts everything fresh. If that doesn't work, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

### Q: Can I run other Docker containers?

**A**: Yes! Docker can run many containers at once. Vibe Stack won't interfere with your other Docker projects.

### Q: Do I need to know how to code?

**A**: Vibe Stack helps you organize and plan development work. You'll still need to know how to code (or use AI to help you code!).

### Q: Is this free?

**A**: Vibe Stack itself is completely free and open-source. However, you'll need an AI provider account (OpenAI, Anthropic, etc.) which may cost money.

### Q: What if I don't want to pay for AI?

**A**: Use Ollama! It's free and runs locally on your computer. See the "Option C" in Step 2 above.

### Q: Can I use this for work projects?

**A**: Absolutely! Vibe Stack is perfect for professional development. Just make sure to follow your company's security policies.

### Q: Where are my files stored?

**A**: In the `repos/` folder in the vibe-stack directory. This folder is shared between all services, so your code is accessible from code-server and vibe-kanban.

---

## Docker Glossary

| Term | Simple Definition |
|------|------------------|
| **Container** | Like a lightweight virtual machine with everything an app needs |
| **Image** | A template for creating containers (like a blueprint) |
| **Docker Hub** | A store where you can download container images |
| **Volume** | A way to store files that persist even when containers stop |
| **Port** | A "door" that lets you access a service (like port 4000 for Vibe-Kanban) |
| **Compose** | A tool for running multiple containers together |
| **Pull** | Download a container image from Docker Hub |
| **Run** | Start a container from an image |
| **Stop** | Gracefully stop a running container |
| **Remove** | Delete a container permanently |

---

## Next Steps

Congratulations! 🎉 You now have Vibe Stack running!

### Learn More

| Guide | Description | Next For You |
|-------|-------------|--------------|
| **[Quick Start](../01-getting-started/01-quick-start.md)** | 5-minute quick start | ⭐ Start here |
| **[INTEGRATION.md](INTEGRATION.md)** | How everything works | Understand the system |
| **[OPENWEBUI.md](OPENWEBUI.md)** | Open WebUI configuration | Configure AI |
| **[User Guide](../02-user-guide/01-user-guide.md)** | Complete user guide | Master the features |
| **[FAQ.md](FAQ.md)** | Common questions | Get answers |

### Practice These

1. ✅ Generate a task plan for a simple feature
2. ✅ Move tasks between lanes in Vibe-Kanban
3. ✅ Open code-server and create a file
4. ✅ Ask AI to create more tasks
5. ✅ Try different AI providers

---

## Still Stuck?

### Common Issues

**Issue**: "Docker won't start"
- **Solution**: See Docker installation troubleshooting above

**Issue**: "make: command not found"
- **Windows**: Use Git Bash or WSL
- **Mac**: Install Xcode Command Line Tools
- **Linux**: `sudo apt-get install build-essential`

**Issue**: "Port already in use"
- **Solution**: Something else is using port 4000, 4001, 8081, or 8443
- **Fix**: Stop the conflicting service or change ports in `.env`

**Issue**: "Services not healthy"
- **Solution**: Wait 30-60 seconds, services take time to start
- **Fix**: Run `make health` again after waiting

---

## Real Talk: What Vibe Stack Does (And Doesn't Do)

### ✅ What Vibe Stack DOES

- ✅ Generate intelligent task plans via AI
- ✅ Organize tasks in a Kanban board
- ✅ Provide a professional development environment (code-server)
- ✅ Sync tasks between AI chat and Kanban board
- ✅ Track progress and estimates
- ✅ Support multiple AI providers

### ❌ What Vibe Stack DOESN'T Do

- ❌ Write actual code for you (AI generates tasks, not code)
- ❌ Auto-deploy to production
- ❌ Replace your entire development workflow
- ❌ Work without an AI provider (unless you use Ollama)

---

## You're Ready! 🚀

You now have:
- ✅ Docker installed and working
- ✅ Vibe Stack running
- ✅ AI configured
- ✅ Your first tasks generated
- ✅ Development environment ready

**Next**: Start building! Generate tasks for your project and watch the AI help you organize and plan your work.

---

**Need more help?**
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[FAQ.md](FAQ.md)** - Frequently asked questions
- **[GitHub Issues](https://github.com/Resinder/vibe-stack/issues)** - Report bugs

---

**Welcome to the future of AI-powered development!** 🎉
