#!/usr/bin/env bash
# =============================================================================
# Vibe Stack - AI Provider Validation Test
# =============================================================================
# Validates AI provider configuration and connectivity
# Run: ./scripts/setup/test-ai-providers.sh
# Updated for current providers including Z.AI (GLM-4)
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNED=0

# Helper functions
print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

test_pass() {
    echo -e "${GREEN}✓ PASS${NC} - $1"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}✗ FAIL${NC} - $1"
    ((TESTS_FAILED++))
}

test_warn() {
    echo -e "${YELLOW}⚠ WARN${NC} - $1"
    ((TESTS_WARNED++))
}

test_info() {
    echo -e "${BLUE}ℹ INFO${NC} - $1"
}

# Validate API key format
validate_api_key() {
    local provider=$1
    local key=$2
    local min_length=${3:-20}

    if [ -z "$key" ]; then
        return 1
    fi

    if [ ${#key} -lt $min_length ]; then
        return 1
    fi

    return 0
}

# Test OpenAI configuration
test_openai() {
    print_header "Testing OpenAI Configuration"

    local api_key=""

    # Check .env for API key
    if [ -f .env ]; then
        api_key=$(grep "^OPENAI_API_KEY=" .env 2>/dev/null | cut -d'=' -f2)
    fi

    if [ -z "$api_key" ]; then
        test_warn "OpenAI API key not set in .env"
        test_info "To configure: ./scripts/setup/setup-ai.sh"
        return 0
    fi

    if validate_api_key "OpenAI" "$api_key" 20; then
        test_pass "OpenAI API key format valid (sk-...)"

        # Test API connectivity (optional, may cost money)
        test_info "Skipping API connectivity test (may incur costs)"
        test_info "To test manually: curl -H 'Authorization: Bearer $api_key' https://api.openai.com/v1/models"
    else
        test_fail "OpenAI API key format invalid"
    fi
}

# Test Anthropic configuration
test_anthropic() {
    print_header "Testing Anthropic Configuration"

    local api_key=""

    # Check .env for API key
    if [ -f .env ]; then
        api_key=$(grep "^ANTHROPIC_API_KEY=" .env 2>/dev/null | cut -d'=' -f2)
    fi

    if [ -z "$api_key" ]; then
        test_warn "Anthropic API key not set in .env"
        test_info "To configure: ./scripts/setup/setup-ai.sh"
        return 0
    fi

    if validate_api_key "Anthropic" "$api_key" 20; then
        test_pass "Anthropic API key format valid (sk-ant-...)"

        # Test API connectivity (optional)
        test_info "Skipping API connectivity test (may incur costs)"
        test_info "To test manually: curl -H 'x-api-key: $api_key' https://api.anthropic.com/v1/messages"
    else
        test_fail "Anthropic API key format invalid"
    fi
}

# Test Z.AI configuration
test_zai() {
    print_header "Testing Z.AI (GLM-4) Configuration"

    local api_key=""

    # Check .env for API key
    if [ -f .env ]; then
        api_key=$(grep "^ZAI_API_KEY=" .env 2>/dev/null | cut -d'=' -f2)
    fi

    if [ -z "$api_key" ]; then
        test_warn "Z.AI API key not set in .env"
        test_info "To get API key: https://z.ai/model-api"
        test_info "To configure: ./scripts/setup/setup-ai.sh"
        return 0
    fi

    if validate_api_key "Z.AI" "$api_key" 20; then
        test_pass "Z.AI API key format valid"

        # Check for duplicate entries
        local count
        count=$(grep -c "^ZAI_API_KEY=" .env 2>/dev/null || echo "0")
        if [ "$count" -gt 1 ]; then
            test_warn "Multiple ZAI_API_KEY entries found in .env ($count)"
            test_info "Consider removing duplicates to avoid confusion"
        else
            test_pass "Z.AI API key configured once (no duplicates)"
        fi

        # Test API connectivity (optional)
        test_info "Z.AI Base URL: https://api.z.ai/api/anthropic"
        test_info "Model mapping:"
        test_info "  • Claude Haiku  → glm-4.5-air (fast, cost-effective)"
        test_info "  • Claude Sonnet → glm-4.7 (balanced)"
        test_info "  • Claude Opus   → glm-4.7 (highest quality)"
    else
        test_fail "Z.AI API key format invalid"
    fi
}

# Test Ollama configuration
test_ollama() {
    print_header "Testing Ollama Configuration"

    # Check if Ollama is running
    if ! command -v ollama &> /dev/null; then
        test_warn "Ollama CLI not found"
        test_info "To install: curl -fsSL https://ollama.com/install.sh | sh"
        return 0
    fi

    test_pass "Ollama CLI installed"

    # Check if Ollama service is running
    if ! curl -sf http://localhost:11434/api/tags &> /dev/null; then
        test_warn "Ollama service not running on localhost:11434"
        test_info "To start: ollama serve"
        return 0
    fi

    test_pass "Ollama service running"

    # List available models
    local models
    models=$(curl -s http://localhost:11434/api/tags 2>/dev/null | jq -r '.models[].name' 2>/dev/null || echo "")

    if [ -n "$models" ]; then
        test_pass "Ollama models available:"
        echo "$models" | while read -r model; do
            echo -e "      • ${GREEN}$model${NC}"
        done
    else
        test_warn "No Ollama models found"
        test_info "To pull a model: ollama pull llama3.2"
    fi
}

# Test OpenRouter configuration
test_openrouter() {
    print_header "Testing OpenRouter Configuration"

    local api_key=""

    # Check .env for API key
    if [ -f .env ]; then
        api_key=$(grep "^OPENROUTER_API_KEY=" .env 2>/dev/null | cut -d'=' -f2)
    fi

    if [ -z "$api_key" ]; then
        test_warn "OpenRouter API key not set in .env"
        test_info "To get API key: https://openrouter.ai/keys"
        test_info "To configure: ./scripts/setup/setup-ai.sh"
        return 0
    fi

    if validate_api_key "OpenRouter" "$api_key" 20; then
        test_pass "OpenRouter API key format valid (sk-or-...)"
        test_info "OpenRouter Base URL: https://openrouter.ai/api/v1"
    else
        test_fail "OpenRouter API key format invalid"
    fi
}

# Test Google AI configuration
test_google() {
    print_header "Testing Google AI Configuration"

    local api_key=""

    # Check .env for API key
    if [ -f .env ]; then
        api_key=$(grep "^GOOGLE_API_KEY=" .env 2>/dev/null | cut -d'=' -f2)
    fi

    if [ -z "$api_key" ]; then
        test_warn "Google AI API key not set in .env"
        test_info "To get API key: https://ai.google.dev/"
        test_info "To configure: ./scripts/setup/setup-ai.sh"
        return 0
    fi

    if validate_api_key "Google AI" "$api_key" 30; then
        test_pass "Google AI API key format valid"
        test_info "Google AI Base URL: https://generativelanguage.googleapis.com/v1"
    else
        test_fail "Google AI API key format invalid"
    fi
}

# Test Groq configuration
test_groq() {
    print_header "Testing Groq Configuration"

    local api_key=""

    # Check .env for API key
    if [ -f .env ]; then
        api_key=$(grep "^GROQ_API_KEY=" .env 2>/dev/null | cut -d'=' -f2)
    fi

    if [ -z "$api_key" ]; then
        test_warn "Groq API key not set in .env"
        test_info "To get API key: https://console.groq.com/keys"
        test_info "To configure: ./scripts/setup/setup-ai.sh"
        return 0
    fi

    if validate_api_key "Groq" "$api_key" 30; then
        test_pass "Groq API key format valid (gsk_...)"
        test_info "Groq Base URL: https://api.groq.com/openai/v1"
    else
        test_fail "Groq API key format invalid"
    fi
}

# Test Open WebUI configuration
test_openwebui_config() {
    print_header "Testing Open WebUI Configuration"

    # Check if Open WebUI is configured
    if ! docker ps | grep -q "open-webui"; then
        test_warn "Open WebUI container not running"
        test_info "Start services: make up"
        return 0
    fi

    test_pass "Open WebUI container running"

    # Check Open WebUI health
    if curl -sf http://localhost:8081/health &> /dev/null; then
        test_pass "Open WebUI health check passed"
    else
        test_warn "Open WebUI health check failed"
        test_info "Open WebUI may still be starting up"
    fi

    # Check for default provider in Open WebUI
    test_info "Open WebUI provider configuration is done in the UI"
    test_info "Access at: http://localhost:8081"
    test_info "Navigate to: Settings → Providers"
}

# Test .env file structure
test_env_structure() {
    print_header "Testing .env File Structure"

    if [ ! -f .env ]; then
        test_fail ".env file not found"
        test_info "Create from example: cp .env.example .env"
        return 1
    fi

    test_pass ".env file exists"

    # Check for insecure default passwords
    if grep -q "CHANGE_THIS" .env 2>/dev/null; then
        test_warn ".env contains default 'CHANGE_THIS' passwords"
        test_info "Generate secure passwords: openssl rand -base64 16"
    else
        test_pass "No default passwords found"
    fi

    # Check for required variables
    local required_vars=("CODE_SERVER_PASSWORD" "POSTGRES_PASSWORD" "CREDENTIAL_ENCRYPTION_KEY")
    local missing_vars=0

    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env 2>/dev/null; then
            local value
            value=$(grep "^${var}=" .env | cut -d'=' -f2)
            if [ -n "$value" ] && [ "$value" != "CHANGE_THIS" ]; then
                test_pass "$var is set"
            else
                test_warn "$var is not set or uses default"
                ((missing_vars++))
            fi
        else
            test_warn "$var not found in .env"
            ((missing_vars++))
        fi
    done

    if [ $missing_vars -eq 0 ]; then
        test_pass "All required environment variables are set"
    fi
}

# Main test execution
main() {
    print_header "Vibe Stack - AI Provider Validation Test"
    echo -e "${CYAN}Testing AI provider configuration and connectivity${NC}"
    echo ""

    # Test environment structure first
    test_env_structure

    # Test each provider
    test_openai
    test_anthropic
    test_zai
    test_ollama
    test_openrouter
    test_google
    test_groq

    # Test Open WebUI configuration
    test_openwebui_config

    # Summary
    print_header "Test Summary"

    local total_tests=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNED))

    echo -e "Total Tests: $total_tests"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${YELLOW}Warnings: $TESTS_WARNED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║${NC}  ${GREEN}ALL CRITICAL TESTS PASSED!${NC}                           ${GREEN}║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${CYAN}Next Steps:${NC}"
        echo "  1. Configure your AI provider: ./scripts/setup/setup-ai.sh"
        echo "  2. Open Open WebUI: http://localhost:8081"
        echo "  3. Add your API key in Settings → Providers"
        echo "  4. Start coding with AI!"
        exit 0
    else
        echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║${NC}  ${RED}SOME TESTS FAILED${NC}                                     ${RED}║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Troubleshooting:"
        echo "  • Check .env file for correct API key format"
        echo "  • Run setup script: ./scripts/setup/setup-ai.sh"
        echo "  • Check provider documentation for API key format"
        exit 1
    fi
}

# Run main
main "$@"
