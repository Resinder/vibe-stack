# =============================================================================
# Vibe Stack - AI Provider Setup (Interactive) - Windows PowerShell
# =============================================================================
# This script helps you configure your AI provider step by step
# Run: .\scripts\setup\setup-ai.ps1
# =============================================================================

$ErrorActionPreference = "Stop"
$PROJECT_ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $PROJECT_ROOT

# Clear screen for better experience
Clear-Host

function Print-Header {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  Vibe Stack - AI Provider Setup                            ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Print-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "▶ $Message" -ForegroundColor Blue
    Write-Host ""
}

function Print-Option {
    param($Num, $Name, $Desc)
    Write-Host "  $($Num.ToString().PadLeft(2)) " -ForegroundColor Magenta -NoNewline
    Write-Host "$Name" -ForegroundColor White -NoNewline
    Write-Host " - $Desc"
}

function Print-Success {
    param([string]$Message)
    Write-Host "✓  $Message" -ForegroundColor Green
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ  $Message" -ForegroundColor Cyan
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠  $Message" -ForegroundColor Yellow
}

# =============================================================================
# MAIN SETUP FLOW
# =============================================================================

Print-Header
Write-Host "Welcome! Let's configure your AI provider." -ForegroundColor White
Write-Host ""
Write-Host "This setup will:"
Write-Host "  1. Help you choose an AI provider"
Write-Host "  2. Collect necessary credentials"
Write-Host "  3. Configure Open WebUI automatically"
Write-Host ""
$null = Read-Host "Press Enter to continue"
Clear-Host

# =============================================================================
# STEP 1: Choose AI Provider
# =============================================================================
Print-Header
Print-Step "Step 1: Choose your AI provider"

Write-Host "Which AI provider would you like to use?"
Write-Host ""
Print-Option 1 "Ollama (Local)" "Free, runs on your computer, no API key needed"
Print-Option 2 "OpenAI" "GPT-4, GPT-4 Turbo (requires API key)"
Print-Option 3 "Anthropic" "Claude 3.5 Sonnet, Claude 3 Opus (requires API key)"
Print-Option 4 "Z.AI (GLM-4)" "Chinese AI, GLM-4.7, cost-effective (requires API key)"
Print-Option 5 "OpenRouter" "Access to multiple models (requires API key)"
Print-Option 6 "Google" "Gemini models (requires API key)"
Print-Option 7 "Groq" "Fast LLaMA models (requires API key)"
Print-Option 8 "Skip for now" "Configure manually later"
Write-Host ""

$choice = 0
while ($choice -lt 1 -or $choice -gt 8) {
    $input = Read-Host "Enter your choice (1-8)"
    if ($input -match '^\d+$') {
        $choice = [int]$input
    }
    if ($choice -lt 1 -or $choice -gt 8) {
        Write-Host "Invalid choice. Please enter 1-8." -ForegroundColor Red
    }
}

$provider = switch ($choice) {
    1 { "ollama" }
    2 { "openai" }
    3 { "anthropic" }
    4 { "zai" }
    5 { "openrouter" }
    6 { "google" }
    7 { "groq" }
    8 {
        Write-Host ""
        Write-Host "Skipping AI provider setup." -ForegroundColor Yellow
        Write-Host "You can configure it later in Open WebUI: http://localhost:8081"
        exit 0
    }
}

Clear-Host

# =============================================================================
# STEP 2: Provider-Specific Setup
# =============================================================================
$model = ""
$apiKey = ""

switch ($provider) {
    "ollama" {
        Print-Header
        Print-Step "Step 2: Setting up Ollama (Free Local AI)"

        Write-Host ""
        Write-Host "Ollama is a free, local AI that runs on your computer." -ForegroundColor Green
        Write-Host ""
        Write-Host "Benefits:"
        Write-Host "  • 100% free, no API keys needed"
        Write-Host "  • Works offline"
        Write-Host "  • Private - your data never leaves your computer"
        Write-Host "  • Models: Llama 3.2, Mistral, Gemma, and more"
        Write-Host ""

        # Check if Ollama is installed
        $ollamaInstalled = Get-Command ollama -ErrorAction SilentlyContinue

        if ($ollamaInstalled) {
            Print-Success "Ollama is already installed!"
            Write-Host ""
            try {
                $ollamaVersion = ollama --version 2>$null
                Print-Info "Version: $ollamaVersion"
            }
            catch {
                Print-Info "Version: Unable to detect"
            }
            Write-Host ""

            # List installed models
            Write-Host "Installed models:"
            try {
                ollama list 2>$null
            }
            catch {
                Write-Host "  (no models installed yet)"
            }
            Write-Host ""

            $installModel = Read-Host "Do you want to install a model now? (y/n)"
            if ($installModel -eq 'y' -or $installModel -eq 'Y') {
                Write-Host ""
                Write-Host "Recommended models:"
                Print-Option 1 "llama3.2" "Fast, capable, 4GB RAM"
                Print-Option 2 "llama3.1" "Larger context, 8GB RAM"
                Print-Option 3 "mistral" "Fast, 4GB RAM"
                Print-Option 4 "gemma2" "Google model, 4GB RAM"
                Print-Option 5 "Skip" "Choose model later"
                Write-Host ""

                $modelChoice = 0
                while ($modelChoice -lt 1 -or $modelChoice -gt 5) {
                    $input = Read-Host "Choose a model (1-5)"
                    if ($input -match '^\d+$') {
                        $modelChoice = [int]$input
                    }
                }

                $model = switch ($modelChoice) {
                    1 { "llama3.2" }
                    2 { "llama3.1" }
                    3 { "mistral" }
                    4 { "gemma2" }
                    5 { "" }
                    default { "llama3.2" }
                }

                if ($model) {
                    Write-Host ""
                    Print-Info "Downloading $model (this may take a few minutes)..."
                    Write-Host ""
                    try {
                        ollama pull $model
                        Print-Success "Model installed successfully!"
                    }
                    catch {
                        Print-Warning "Failed to install model. Try: ollama pull $model"
                    }
                }
            }
        }
        else {
            Print-Info "Ollama is not installed yet."
            Write-Host ""
            Write-Host "Install Ollama:"
            Write-Host "  Download from: https://ollama.com/download"
            Write-Host ""
            $null = Read-Host "Press Enter after installing Ollama"
            Write-Host ""

            $ollamaInstalled = Get-Command ollama -ErrorAction SilentlyContinue
            if ($ollamaInstalled) {
                Print-Success "Ollama installed!"
                Print-Info "Now let's install a model..."
                Write-Host ""
                $model = "llama3.2"
                Print-Info "Downloading $model (recommended, ~2GB)..."
                Write-Host ""

                try {
                    ollama pull $model
                    Print-Success "Model installed!"
                }
                catch {
                    Print-Warning "Failed to install. Try: ollama pull $model"
                }
            }
            else {
                Print-Warning "Ollama installation not detected."
                Write-Host "Please install Ollama and run this script again."
                exit 1
            }
        }

        Write-Host ""
        Print-Success "Ollama setup complete!"
        Print-Info "Open WebUI will auto-detect Ollama."
    }

    "openai" {
        Print-Header
        Print-Step "Step 2: OpenAI Configuration"

        Write-Host ""
        Write-Host "OpenAI provides GPT-4, GPT-4 Turbo, and more." -ForegroundColor Green
        Write-Host ""
        Write-Host "To get your API key:"
        Write-Host "  1. Go to: https://platform.openai.com/api-keys"
        Write-Host "  2. Create a new API key"
        Write-Host "  3. Copy the key (starts with sk-)"
        Write-Host ""

        $apiKey = Read-Host "Enter your OpenAI API key"
        $apiKey = $apiKey.Trim()

        if ([string]::IsNullOrWhiteSpace($apiKey)) {
            Print-Warning "No API key provided. Setup cancelled."
            exit 1
        }

        if (-not $apiKey.StartsWith("sk-")) {
            Print-Warning "This doesn't look like a valid OpenAI API key."
            $confirm = Read-Host "Continue anyway? (y/n)"
            if ($confirm -ne 'y' -and $confirm -ne 'Y') {
                exit 1
            }
        }

        Write-Host ""
        Print-Info "Choose your preferred model:"
        Write-Host ""
        Print-Option 1 "gpt-4o" "Latest GPT-4 Omni (recommended)"
        Print-Option 2 "gpt-4o-mini" "Faster, cheaper"
        Print-Option 3 "gpt-4-turbo" "GPT-4 Turbo"
        Print-Option 4 "gpt-3.5-turbo" "Most affordable"
        Write-Host ""

        $modelChoice = 0
        while ($modelChoice -lt 1 -or $modelChoice -gt 4) {
            $input = Read-Host "Choose a model (1-4)"
            if ($input -match '^\d+$') {
                $modelChoice = [int]$input
            }
        }

        $model = switch ($modelChoice) {
            1 { "gpt-4o" }
            2 { "gpt-4o-mini" }
            3 { "gpt-4-turbo" }
            4 { "gpt-3.5-turbo" }
            default { "gpt-4o" }
        }

        # Save to .env
        if (Test-Path .env) {
            Add-Content .env ""
            Add-Content .env "# OpenAI Configuration (added by setup-ai.ps1)"
            Add-Content .env "OPENAI_API_KEY=$apiKey"
            Print-Success "API key saved to .env"
        }
    }

    "anthropic" {
        Print-Header
        Print-Step "Step 2: Anthropic Claude Configuration"

        Write-Host ""
        Write-Host "Anthropic provides Claude 3.5 Sonnet and Claude 3 Opus." -ForegroundColor Green
        Write-Host ""
        Write-Host "To get your API key:"
        Write-Host "  1. Go to: https://console.anthropic.com/"
        Write-Host "  2. Create an account or sign in"
        Write-Host "  3. Go to API Keys"
        Write-Host "  4. Create a new key"
        Write-Host ""

        $apiKey = Read-Host "Enter your Anthropic API key"
        $apiKey = $apiKey.Trim()

        if ([string]::IsNullOrWhiteSpace($apiKey)) {
            Print-Warning "No API key provided. Setup cancelled."
            exit 1
        }

        Write-Host ""
        Print-Info "Choose your preferred model:"
        Write-Host ""
        Print-Option 1 "claude-sonnet-4-20250514" "Claude 3.5 Sonnet 4 (latest)"
        Print-Option 2 "claude-3-5-sonnet-20241022" "Claude 3.5 Sonnet"
        Print-Option 3 "claude-3-5-haiku-20241022" "Claude 3.5 Haiku (fast)"
        Print-Option 4 "claude-3-opus-20240229" "Claude 3 Opus (best quality)"
        Write-Host ""

        $modelChoice = 0
        while ($modelChoice -lt 1 -or $modelChoice -gt 4) {
            $input = Read-Host "Choose a model (1-4)"
            if ($input -match '^\d+$') {
                $modelChoice = [int]$input
            }
        }

        $model = switch ($modelChoice) {
            1 { "claude-sonnet-4-20250514" }
            2 { "claude-3-5-sonnet-20241022" }
            3 { "claude-3-5-haiku-20241022" }
            4 { "claude-3-opus-20240229" }
            default { "claude-sonnet-4-20250514" }
        }

        if (Test-Path .env) {
            Add-Content .env ""
            Add-Content .env "# Anthropic Configuration (added by setup-ai.ps1)"
            Add-Content .env "ANTHROPIC_API_KEY=$apiKey"
            Print-Success "API key saved to .env"
        }
    }

    "openrouter" {
        Print-Header
        Print-Step "Step 2: OpenRouter Configuration"

        Write-Host ""
        Write-Host "OpenRouter gives you access to many AI models." -ForegroundColor Green
        Write-Host ""
        Write-Host "To get your API key:"
        Write-Host "  1. Go to: https://openrouter.ai/keys"
        Write-Host "  2. Create an account"
        Write-Host "  3. Generate an API key"
        Write-Host ""

        $apiKey = Read-Host "Enter your OpenRouter API key"
        $apiKey = $apiKey.Trim()

        if ([string]::IsNullOrWhiteSpace($apiKey)) {
            Print-Warning "No API key provided. Setup cancelled."
            exit 1
        }

        Write-Host ""
        Print-Info "Enter OpenRouter model ID (or press Enter for default):"
        Write-Host "Examples: anthropic/claude-3.5-sonnet, openai/gpt-4o, google/gemini-pro"
        $modelInput = Read-Host "Model"
        $model = if ($modelInput) { $modelInput } else { "anthropic/claude-3.5-sonnet" }

        if (Test-Path .env) {
            Add-Content .env ""
            Add-Content .env "# OpenRouter Configuration (added by setup-ai.ps1)"
            Add-Content .env "OPENROUTER_API_KEY=$apiKey"
            Print-Success "API key saved to .env"
        }
    }

    "google" {
        Print-Header
        Print-Step "Step 2: Google Gemini Configuration"

        Write-Host ""
        Write-Host "Google provides Gemini models." -ForegroundColor Green
        Write-Host ""
        Write-Host "To get your API key:"
        Write-Host "  1. Go to: https://makersuite.google.com/app/apikey"
        Write-Host "  2. Create a new API key"
        Write-Host ""

        $apiKey = Read-Host "Enter your Google API key"
        $apiKey = $apiKey.Trim()

        if ([string]::IsNullOrWhiteSpace($apiKey)) {
            Print-Warning "No API key provided. Setup cancelled."
            exit 1
        }

        $model = "gemini-2.0-flash-exp"

        if (Test-Path .env) {
            Add-Content .env ""
            Add-Content .env "# Google Configuration (added by setup-ai.ps1)"
            Add-Content .env "GOOGLE_API_KEY=$apiKey"
            Print-Success "API key saved to .env"
        }
    }

    "groq" {
        Print-Header
        Print-Step "Step 2: Groq Configuration"

        Write-Host ""
        Write-Host "Groq provides fast LLaMA models." -ForegroundColor Green
        Write-Host ""
        Write-Host "To get your API key:"
        Write-Host "  1. Go to: https://console.groq.com/keys"
        Write-Host "  2. Create an account"
        Write-Host "  3. Generate an API key"
        Write-Host ""

        $apiKey = Read-Host "Enter your Groq API key"
        $apiKey = $apiKey.Trim()

        if ([string]::IsNullOrWhiteSpace($apiKey)) {
            Print-Warning "No API key provided. Setup cancelled."
            exit 1
        }

        $model = "llama-3.3-70b-versatile"

        if (Test-Path .env) {
            Add-Content .env ""
            Add-Content .env "# Groq Configuration (added by setup-ai.ps1)"
            Add-Content .env "GROQ_API_KEY=$apiKey"
            Print-Success "API key saved to .env"
        }
    }

    "zai" {
        Print-Header
        Print-Step "Step 2: Z.AI (GLM-4) Configuration"

        Write-Host ""
        Write-Host "Z.AI provides GLM-4 models (GLM Coding Plan)." -ForegroundColor Green
        Write-Host ""
        Write-Host "Benefits:"
        Write-Host "  • GLM-4.7 - 3× usage at fraction of the cost"
        Write-Host "  • Anthropic-compatible API format"
        Write-Host "  • 128K+ context windows"
        Write-Host ""
        Write-Host "To get your API key:"
        Write-Host "  1. Go to: https://z.ai/model-api"
        Write-Host "  2. Create an account or sign in"
        Write-Host "  3. Generate an API key"
        Write-Host ""

        $apiKey = Read-Host "Enter your Z.AI API key"
        $apiKey = $apiKey.Trim()

        if ([string]::IsNullOrWhiteSpace($apiKey)) {
            Print-Warning "No API key provided. Setup cancelled."
            exit 1
        }

        Write-Host ""
        Print-Info "Choose your preferred model:"
        Write-Host ""
        Print-Option 1 "glm-4.7" "Latest GLM-4 (recommended, best quality)"
        Print-Option 2 "glm-4.5-air" "Fast, cost-effective"
        Write-Host ""

        $modelChoice = 0
        while ($modelChoice -lt 1 -or $modelChoice -gt 2) {
            $input = Read-Host "Choose a model (1-2)"
            if ($input -match '^\d+$') {
                $modelChoice = [int]$input
            }
        }

        $model = switch ($modelChoice) {
            1 { "glm-4.7" }
            2 { "glm-4.5-air" }
            default { "glm-4.7" }
        }

        if (Test-Path .env) {
            Add-Content .env ""
            Add-Content .env "# Z.AI Configuration (added by setup-ai.ps1)"
            Add-Content .env "# For Open WebUI: Use Anthropic provider with Custom Base URL"
            Add-Content .env "ZAI_API_KEY=$apiKey"
            Add-Content .env "ZAI_BASE_URL=https://api.z.ai/api/anthropic"
            Add-Content .env ""
            Add-Content .env "# For Claude Code (~/.claude/settings.json):"
            Add-Content .env "# {"
            Add-Content .env "#   `"env`": {"
            Add-Content .env "#     `"ANTHROPIC_AUTH_TOKEN`": `"$apiKey`","
            Add-Content .env "#     `"ANTHROPIC_BASE_URL`": `"https://api.z.ai/api/anthropic`","
            Add-Content .env "#     `"ANTHROPIC_DEFAULT_HAIKU_MODEL`": `"glm-4.5-air`","
            Add-Content .env "#     `"ANTHROPIC_DEFAULT_SONNET_MODEL`": `"$model`","
            Add-Content .env "#     `"ANTHROPIC_DEFAULT_OPUS_MODEL`": `"$model`","
            Add-Content .env "#     `"API_TIMEOUT_MS`": `"3000000`""
            Add-Content .env "#   }"
            Add-Content .env "# }"
            Print-Success "Configuration saved to .env"
        }
    }
}

Clear-Host

# =============================================================================
# STEP 3: Configure Open WebUI
# =============================================================================
Print-Header
Print-Step "Step 3: Configuring Open WebUI"

Write-Host ""
Print-Info "Checking if Open WebUI is running..."

# Check if Open WebUI is accessible
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Print-Success "Open WebUI is running!"

    Write-Host ""
    Write-Host "Your AI provider is now configured!"
    Write-Host ""
    Print-Info "Next steps:"
    Write-Host "  1. Open http://localhost:8081"
    Write-Host "  2. Go to Settings → Providers"
    Write-Host "  3. Select your provider and enter the API key if prompted"

    switch ($provider) {
        "ollama" {
            Write-Host ""
            Print-Info "For Ollama:"
            Write-Host "  • Select 'Ollama' provider"
            Write-Host "  • Click 'Connect'"
            if ($model) {
                Write-Host "  • Your model ($model) will be detected automatically"
            }
        }
        "openai" {
            Write-Host ""
            Print-Info "For OpenAI:"
            Write-Host "  • Select 'OpenAI'"
            Write-Host "  • Enter your API key (already saved to .env)"
            Write-Host "  • Select model: $model"
        }
        "anthropic" {
            Write-Host ""
            Print-Info "For Anthropic:"
            Write-Host "  • Select 'Anthropic'"
            Write-Host "  • Enter your API key (already saved to .env)"
            Write-Host "  • Select model: $model"
        }
        "openrouter" {
            Write-Host ""
            Print-Info "For OpenRouter:"
            Write-Host "  • Select 'OpenRouter'"
            Write-Host "  • Enter your API key"
            Write-Host "  • Enter model: $model"
        }
        "google" {
            Write-Host ""
            Print-Info "For Google:"
            Write-Host "  • Select 'Google (Gemini)'"
            Write-Host "  • Enter your API key"
            Write-Host "  • Select model: $model"
        }
        "groq" {
            Write-Host ""
            Print-Info "For Groq:"
            Write-Host "  • Select 'Groq'"
            Write-Host "  • Enter your API key"
            Write-Host "  • Select model: $model"
        }
        "zai" {
            Write-Host ""
            Print-Info "For Z.AI (GLM-4):"
            Write-Host "  • Select 'Anthropic' provider (Z.AI is Anthropic-compatible)"
            Write-Host "  • Enter your API key (already saved to .env)"
            Write-Host "  • Use Custom Base URL: https://api.z.ai/api/anthropic"
            Write-Host "  • Select model: $model (or type custom model name)"
        }
    }
}
catch {
    Print-Warning "Open WebUI is not running."
    Write-Host ""
    Write-Host "Start Open WebUI:"
    Write-Host "  docker compose up -d open-webui"
    Write-Host ""
    Write-Host "Then open: http://localhost:8081"
    Write-Host ""
    Write-Host "Your provider: $provider"
    if ($model) {
        Write-Host "Your model: $model"
    }
}

Write-Host ""
Print-Header
Write-Host "AI Provider Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now start generating tasks with AI."
Write-Host ""
Write-Host "Quick test: Open http://localhost:8081 and type:" -ForegroundColor White
Write-Host '  "Create 5 tasks for building a todo app"' -ForegroundColor Cyan
Write-Host ""