#!/usr/bin/env bash
# =============================================================================
# Vibe Stack - AI Provider Setup (Interactive)
# =============================================================================
# This script helps you configure your AI provider step by step
# Run: ./scripts/setup/setup-ai.sh
# =============================================================================

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Clear screen for better experience
clear

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}${GREEN}Vibe Stack - AI Provider Setup${NC}                        ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo ""
}

print_option() {
    local num=$1
    local name=$2
    local desc=$3
    printf "  ${MAGENTA}%2d)${NC} ${BOLD}%s${NC} - %s\n" "$num" "$name" "$desc"
}

print_info() {
    echo -e "${CYAN}ℹ${NC}  $1"
}

print_success() {
    echo -e "${GREEN}✓${NC}  $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

# =============================================================================
# MAIN SETUP FLOW
# =============================================================================

print_header
echo -e "${BOLD}Welcome! Let's configure your AI provider.${NC}"
echo ""
echo -e "This setup will:"
echo "  1. Help you choose an AI provider"
echo "  2. Collect necessary credentials"
echo "  3. Configure Open WebUI automatically"
echo ""
read -p "Press Enter to continue..."
clear

# =============================================================================
# STEP 1: Choose AI Provider
# =============================================================================
print_header
print_step "Step 1: Choose your AI provider"

echo "Which AI provider would you like to use?"
echo ""
print_option "1" "Ollama (Local)" "Free, runs on your computer, no API key needed"
print_option "2" "OpenAI" "GPT-4, GPT-4 Turbo (requires API key)"
print_option "3" "Anthropic" "Claude 3.5 Sonnet, Claude 3 Opus (requires API key)"
print_option "4" "Z.AI (GLM-4)" "Chinese AI, GLM-4.7, cost-effective (requires API key)"
print_option "5" "OpenRouter" "Access to multiple models (requires API key)"
print_option "6" "Google" "Gemini models (requires API key)"
print_option "7" "Groq" "Fast LLaMA models (requires API key)"
print_option "8" "Skip for now" "Configure manually later"
echo ""

while true; do
    read -p "Enter your choice (1-8): " choice
    case $choice in
        1) PROVIDER="ollama"; break;;
        2) PROVIDER="openai"; break;;
        3) PROVIDER="anthropic"; break;;
        4) PROVIDER="zai"; break;;
        5) PROVIDER="openrouter"; break;;
        6) PROVIDER="google"; break;;
        7) PROVIDER="groq"; break;;
        8) echo ""; echo "Skipping AI provider setup."; echo "You can configure it later in Open WebUI: http://localhost:8081"; exit 0;;
        *) echo "Invalid choice. Please enter 1-8.";;
    esac
done

clear

# =============================================================================
# STEP 2: Provider-Specific Setup
# =============================================================================
case $PROVIDER in
    ollama)
        print_header
        print_step "Step 2: Setting up Ollama (Free Local AI)"

        echo ""
        echo -e "${GREEN}Ollama is a free, local AI that runs on your computer.${NC}"
        echo ""
        echo "Benefits:"
        echo "  • 100% free, no API keys needed"
        echo "  • Works offline"
        echo "  • Private - your data never leaves your computer"
        echo "  • Models: Llama 3.2, Mistral, Gemma, and more"
        echo ""

        # Check if Ollama is installed
        if command -v ollama &> /dev/null; then
            print_success "Ollama is already installed!"
            echo ""
            ollama_version=$(ollama --version 2>/dev/null || echo "unknown")
            print_info "Version: $ollama_version"
            echo ""

            # Show installed models
            echo "Installed models:"
            if ollama list &> /dev/null; then
                ollama list 2>/dev/null || echo "  (no models installed yet)"
            else
                echo "  (no models installed yet)"
            fi
            echo ""

            read -p "Do you want to install a model now? (y/n): " install_model
            if [[ $install_model =~ ^[Yy]$ ]]; then
                echo ""
                echo "Recommended models:"
                print_option "1" "llama3.2" "Fast, capable, 4GB RAM"
                print_option "2" "llama3.1" "Larger context, 8GB RAM"
                print_option "3" "mistral" "Fast, 4GB RAM"
                print_option "4" "gemma2" "Google model, 4GB RAM"
                print_option "5" "Skip" "Choose model later"
                echo ""

                read -p "Choose a model (1-5): " model_choice
                case $model_choice in
                    1) MODEL="llama3.2";;
                    2) MODEL="llama3.1";;
                    3) MODEL="mistral";;
                    4) MODEL="gemma2";;
                    5) MODEL="";;
                    *) MODEL="llama3.2";;
                esac

                if [ -n "$MODEL" ]; then
                    echo ""
                    print_info "Downloading $MODEL (this may take a few minutes)..."
                    echo ""
                    if ollama pull "$MODEL"; then
                        print_success "Model installed successfully!"
                    else
                        print_warning "Failed to install model. You can try again later with: ollama pull $MODEL"
                    fi
                fi
            fi
        else
            print_info "Ollama is not installed yet."
            echo ""
            echo "Install Ollama:"
            echo ""
            case "$(uname -s)" in
                Linux*)
                    echo "  curl -fsSL https://ollama.com/install.sh | sh"
                    ;;
                Darwin*)
                    echo "  brew install ollama"
                    ;;
                *)
                    echo "  Download from: https://ollama.com/download"
                    ;;
            esac
            echo ""
            read -p "Press Enter after installing Ollama..."
            echo ""

            if command -v ollama &> /dev/null; then
                print_success "Ollama installed!"
                print_info "Now let's install a model..."
                echo ""
                MODEL="llama3.2"
                print_info "Downloading $MODEL (recommended, ~2GB)..."
                echo ""

                if ollama pull "$MODEL"; then
                    print_success "Model installed!"
                else
                    print_warning "Failed to install. Try: ollama pull $MODEL"
                fi
            else
                print_warning "Ollama installation not detected."
                echo "Please install Ollama and run this script again."
                exit 1
            fi
        fi

        echo ""
        print_success "Ollama setup complete!"
        print_info "Open WebUI will auto-detect Ollama."
        ;;

    openai)
        print_header
        print_step "Step 2: OpenAI Configuration"

        echo ""
        echo -e "${GREEN}OpenAI provides GPT-4, GPT-4 Turbo, and more.${NC}"
        echo ""
        echo "To get your API key:"
        echo "  1. Go to: https://platform.openai.com/api-keys"
        echo "  2. Create a new API key"
        echo "  3. Copy the key (starts with sk-)"
        echo ""

        read -p "Enter your OpenAI API key: " api_key
        api_key=$(echo "$api_key" | xargs)  # trim whitespace

        if [ -z "$api_key" ]; then
            print_warning "No API key provided. Setup cancelled."
            exit 1
        fi

        if [[ ! $api_key =~ ^sk- ]]; then
            print_warning "This doesn't look like a valid OpenAI API key."
            read -p "Continue anyway? (y/n): " confirm
            if [[ ! $confirm =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi

        echo ""
        print_info "Choose your preferred model:"
        echo ""
        print_option "1" "gpt-4o" "Latest GPT-4 Omni (recommended)"
        print_option "2" "gpt-4o-mini" "Faster, cheaper"
        print_option "3" "gpt-4-turbo" "GPT-4 Turbo"
        print_option "4" "gpt-3.5-turbo" "Most affordable"
        echo ""

        read -p "Choose a model (1-4): " model_choice
        case $model_choice in
            1) MODEL="gpt-4o";;
            2) MODEL="gpt-4o-mini";;
            3) MODEL="gpt-4-turbo";;
            4) MODEL="gpt-3.5-turbo";;
            *) MODEL="gpt-4o";;
        esac

        # Save to .env for reference
        if [ -f .env ]; then
            echo "" >> .env
            echo "# OpenAI Configuration (added by setup-ai.sh)" >> .env
            echo "OPENAI_API_KEY=$api_key" >> .env
            print_success "API key saved to .env"
        fi

        OPENAI_API_KEY="$api_key"
        ;;

    anthropic)
        print_header
        print_step "Step 2: Anthropic Claude Configuration"

        echo ""
        echo -e "${GREEN}Anthropic provides Claude 3.5 Sonnet and Claude 3 Opus.${NC}"
        echo ""
        echo "To get your API key:"
        echo "  1. Go to: https://console.anthropic.com/"
        echo "  2. Create an account or sign in"
        echo "  3. Go to API Keys"
        echo "  4. Create a new key"
        echo ""

        read -p "Enter your Anthropic API key: " api_key
        api_key=$(echo "$api_key" | xargs)

        if [ -z "$api_key" ]; then
            print_warning "No API key provided. Setup cancelled."
            exit 1
        fi

        echo ""
        print_info "Choose your preferred model:"
        echo ""
        print_option "1" "claude-sonnet-4-20250514" "Claude 3.5 Sonnet 4 (latest)"
        print_option "2" "claude-3-5-sonnet-20241022" "Claude 3.5 Sonnet"
        print_option "3" "claude-3-5-haiku-20241022" "Claude 3.5 Haiku (fast)"
        print_option "4" "claude-3-opus-20240229" "Claude 3 Opus (best quality)"
        echo ""

        read -p "Choose a model (1-4): " model_choice
        case $model_choice in
            1) MODEL="claude-sonnet-4-20250514";;
            2) MODEL="claude-3-5-sonnet-20241022";;
            3) MODEL="claude-3-5-haiku-20241022";;
            4) MODEL="claude-3-opus-20240229";;
            *) MODEL="claude-sonnet-4-20250514";;
        esac

        if [ -f .env ]; then
            echo "" >> .env
            echo "# Anthropic Configuration (added by setup-ai.sh)" >> .env
            echo "ANTHROPIC_API_KEY=$api_key" >> .env
            print_success "API key saved to .env"
        fi

        ANTHROPIC_API_KEY="$api_key"
        ;;

    zai)
        print_header
        print_step "Step 2: Z.AI (GLM-4) Configuration"

        echo ""
        echo -e "${GREEN}Z.AI provides GLM-4 models (GLM Coding Plan).${NC}"
        echo ""
        echo "Benefits:"
        echo "  • GLM-4.7 - 3× usage at fraction of the cost"
        echo "  • Anthropic-compatible API format"
        echo "  • 128K+ context windows"
        echo ""
        echo "To get your API key:"
        echo "  1. Go to: https://z.ai/model-api"
        echo "  2. Create an account or sign in"
        echo "  3. Generate an API key"
        echo ""

        read -p "Enter your Z.AI API key: " api_key
        api_key=$(echo "$api_key" | xargs)

        if [ -z "$api_key" ]; then
            print_warning "No API key provided. Setup cancelled."
            exit 1
        fi

        echo ""
        print_info "Choose your preferred model:"
        echo ""
        print_option "1" "glm-4.7" "Latest GLM-4 (recommended, best quality)"
        print_option "2" "glm-4.5-air" "Fast, cost-effective"
        echo ""

        read -p "Choose a model (1-2): " model_choice
        case $model_choice in
            1) MODEL="glm-4.7";;
            2) MODEL="glm-4.5-air";;
            *) MODEL="glm-4.7";;
        esac

        # Save to .env for reference
        if [ -f .env ]; then
            echo "" >> .env
            echo "# Z.AI Configuration (added by setup-ai.sh)" >> .env
            echo "# For Open WebUI: Use Anthropic provider with Custom Base URL" >> .env
            echo "ZAI_API_KEY=$api_key" >> .env
            echo "ZAI_BASE_URL=https://api.z.ai/api/anthropic" >> .env
            echo "" >> .env
            echo "# For Claude Code (~/.claude/settings.json):" >> .env
            echo "# {" >> .env
            echo "#   \"env\": {" >> .env
            echo "#     \"ANTHROPIC_AUTH_TOKEN\": \"$api_key\"," >> .env
            echo "#     \"ANTHROPIC_BASE_URL\": \"https://api.z.ai/api/anthropic\"," >> .env
            echo "#     \"ANTHROPIC_DEFAULT_HAIKU_MODEL\": \"glm-4.5-air\"," >> .env
            echo "#     \"ANTHROPIC_DEFAULT_SONNET_MODEL\": \"$MODEL\"," >> .env
            echo "#     \"ANTHROPIC_DEFAULT_OPUS_MODEL\": \"$MODEL\"," >> .env
            echo "#     \"API_TIMEOUT_MS\": \"3000000\"" >> .env
            echo "#   }" >> .env
            echo "# }" >> .env
            print_success "Configuration saved to .env"
        fi

        ZAI_API_KEY="$api_key"
        ZAI_BASE_URL="https://api.z.ai/api/anthropic"
        ;;

    openrouter)
        print_header
        print_step "Step 2: OpenRouter Configuration"

        echo ""
        echo -e "${GREEN}OpenRouter gives you access to many AI models.${NC}"
        echo ""
        echo "To get your API key:"
        echo "  1. Go to: https://openrouter.ai/keys"
        echo "  2. Create an account"
        echo "  3. Generate an API key"
        echo ""

        read -p "Enter your OpenRouter API key: " api_key
        api_key=$(echo "$api_key" | xargs)

        if [ -z "$api_key" ]; then
            print_warning "No API key provided. Setup cancelled."
            exit 1
        fi

        echo ""
        print_info "Enter OpenRouter model ID (or press Enter for default):"
        echo "Examples: anthropic/claude-3.5-sonnet, openai/gpt-4o, google/gemini-pro"
        read -p "Model: " model_input
        MODEL=${model_input:-"anthropic/claude-3.5-sonnet"}

        if [ -f .env ]; then
            echo "" >> .env
            echo "# OpenRouter Configuration (added by setup-ai.sh)" >> .env
            echo "OPENROUTER_API_KEY=$api_key" >> .env
            print_success "API key saved to .env"
        fi

        OPENROUTER_API_KEY="$api_key"
        ;;

    google)
        print_header
        print_step "Step 2: Google Gemini Configuration"

        echo ""
        echo -e "${GREEN}Google provides Gemini models.${NC}"
        echo ""
        echo "To get your API key:"
        echo "  1. Go to: https://makersuite.google.com/app/apikey"
        echo "  2. Create a new API key"
        echo ""

        read -p "Enter your Google API key: " api_key
        api_key=$(echo "$api_key" | xargs)

        if [ -z "$api_key" ]; then
            print_warning "No API key provided. Setup cancelled."
            exit 1
        fi

        MODEL="gemini-2.0-flash-exp"

        if [ -f .env ]; then
            echo "" >> .env
            echo "# Google Configuration (added by setup-ai.sh)" >> .env
            echo "GOOGLE_API_KEY=$api_key" >> .env
            print_success "API key saved to .env"
        fi

        GOOGLE_API_KEY="$api_key"
        ;;

    groq)
        print_header
        print_step "Step 2: Groq Configuration"

        echo ""
        echo -e "${GREEN}Groq provides fast LLaMA models.${NC}"
        echo ""
        echo "To get your API key:"
        echo "  1. Go to: https://console.groq.com/keys"
        echo "  2. Create an account"
        echo "  3. Generate an API key"
        echo ""

        read -p "Enter your Groq API key: " api_key
        api_key=$(echo "$api_key" | xargs)

        if [ -z "$api_key" ]; then
            print_warning "No API key provided. Setup cancelled."
            exit 1
        fi

        MODEL="llama-3.3-70b-versatile"

        if [ -f .env ]; then
            echo "" >> .env
            echo "# Groq Configuration (added by setup-ai.sh)" >> .env
            echo "GROQ_API_KEY=$api_key" >> .env
            print_success "API key saved to .env"
        fi

        GROQ_API_KEY="$api_key"
        ;;
esac

clear

# =============================================================================
# STEP 3: Configure Open WebUI
# =============================================================================
print_header
print_step "Step 3: Configuring Open WebUI"

echo ""
print_info "Checking if Open WebUI is running..."

# Check if Open WebUI is accessible
if curl -s http://localhost:8081 > /dev/null; then
    print_success "Open WebUI is running!"

    echo ""
    echo "Your AI provider is now configured!"
    echo ""
    print_info "Next steps:"
    echo "  1. Open http://localhost:8081"
    echo "  2. Go to Settings → Providers"
    echo "  3. Select your provider and enter the API key if prompted"

    case $PROVIDER in
        ollama)
            echo ""
            print_info "For Ollama:"
            echo "  • Select 'Ollama' provider"
            echo "  • Click 'Connect'"
            echo "  • Your model ($MODEL) will be detected automatically"
            ;;
        openai)
            echo ""
            print_info "For OpenAI:"
            echo "  • Select 'OpenAI'"
            echo "  • Enter your API key (already saved to .env)"
            echo "  • Select model: $MODEL"
            ;;
        anthropic)
            echo ""
            print_info "For Anthropic:"
            echo "  • Select 'Anthropic'"
            echo "  • Enter your API key (already saved to .env)"
            echo "  • Select model: $MODEL"
            ;;
        zai)
            echo ""
            print_info "For Z.AI (GLM-4):"
            echo "  • Select 'Anthropic' provider (Z.AI is Anthropic-compatible)"
            echo "  • Enter your API key (already saved to .env)"
            echo "  • Use Custom Base URL: https://api.z.ai/api/anthropic"
            echo "  • Select model: $MODEL (or type custom model name)"
            ;;
        openrouter)
            echo ""
            print_info "For OpenRouter:"
            echo "  • Select 'OpenRouter'"
            echo "  • Enter your API key"
            echo "  • Enter model: $MODEL"
            ;;
        google)
            echo ""
            print_info "For Google:"
            echo "  • Select 'Google (Gemini)'"
            echo "  • Enter your API key"
            echo "  • Select model: $MODEL"
            ;;
        groq)
            echo ""
            print_info "For Groq:"
            echo "  • Select 'Groq'"
            echo "  • Enter your API key"
            echo "  • Select model: $MODEL"
            ;;
    esac

else
    print_warning "Open WebUI is not running."
    echo ""
    echo "Start Open WebUI:"
    echo "  docker compose up -d open-webui"
    echo ""
    echo "Then open: http://localhost:8081"
    echo ""
    echo "Your provider: $PROVIDER"
    [ -n "$MODEL" ] && echo "Your model: $MODEL"
fi

echo ""
print_header
echo -e "${GREEN}AI Provider Setup Complete!${NC}"
echo ""
echo "You can now start generating tasks with AI."
echo ""
echo "Quick test: Open http://localhost:8081 and type:"
echo -e "  ${CYAN}\"Create 5 tasks for building a todo app\"${NC}"
echo ""
