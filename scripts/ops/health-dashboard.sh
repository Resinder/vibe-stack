#!/usr/bin/env bash
# =============================================================================
# Vibe Stack - Health Monitoring Dashboard
# =============================================================================
#
# Terminal-based dashboard showing:
# - Container status (running/stopped/healthy)
# - CPU/Memory usage (live)
# - Recent log entries
# - Health check status
# - Port bindings
# - Volume usage
#
# Usage:
#   ./scripts/ops/health-dashboard.sh
#
# Keyboard shortcuts:
#   q   Quit
#   r   Refresh
#   l   Show logs (select container)
#   h   Show help
#
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
REFRESH_INTERVAL=5
COMPOSE_FILES=("docker-compose.yml" "docker-compose.monitoring.yml")

# Services to monitor
SERVICES=(
    "vibe-kanban"
    "code-server"
    "open-webui"
    "vibe-mcp-server"
    "vibe-postgres"
    "vibe-prometheus"
    "vibe-grafana"
    "vibe-alertmanager"
    "vibe-node-exporter"
    "vibe-cadvisor"
)

# =============================================================================
# Functions
# =============================================================================

get_container_status() {
    local container_name="$1"

    if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
        if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
            echo -e "${GREEN}●${NC} Running"
        else
            echo -e "${RED}○${NC} Stopped"
        fi
    else
        echo -e "${YELLOW}⊗${NC} Not created"
    fi
}

get_health_status() {
    local container_name="$1"

    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo "N/A"
        return
    fi

    local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")

    case "$health" in
        "healthy")
            echo -e "${GREEN}✔${NC} Healthy"
            ;;
        "unhealthy")
            echo -e "${RED}✖${NC} Unhealthy"
            ;;
        "starting")
            echo -e "${YELLOW}⟳${NC} Starting"
            ;;
        "none")
            echo "No check"
            ;;
        *)
            echo "$health"
            ;;
    esac
}

get_cpu_usage() {
    local container_name="$1"

    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo "N/A"
        return
    fi

    local cpu=$(docker stats --no-stream --format '{{.CPUPerc}}' "$container_name" 2>/dev/null || echo "N/A")
    echo "$cpu"
}

get_memory_usage() {
    local container_name="$1"

    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo "N/A"
        return
    fi

    local mem=$(docker stats --no-stream --format '{{.MemUsage}}' "$container_name" 2>/dev/null || echo "N/A")
    echo "$mem"
}

get_port_bindings() {
    local container_name="$1"

    if ! docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo "N/A"
        return
    fi

    local ports=$(docker port "$container_name" 2>/dev/null | head -3 | tr '\n' ',' | sed 's/,$//')

    if [ -z "$ports" ]; then
        echo "None"
    else
        echo "$ports"
    fi
}

print_header() {
    clear
    echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║${NC}  ${BOLD}Vibe Stack - Health Monitoring Dashboard${NC}              ${BOLD}${BLUE}║${NC}"
    echo -e "${BOLD}${BLUE}║${NC}  ${CYAN}Press 'q' to quit, 'r' to refresh, 'l' for logs${NC}        ${BOLD}${BLUE}║${NC}"
    echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_service_table() {
    echo -e "${BOLD}${CYAN}Services Status${NC}"
    echo -e "${BOLD}${CYAN}───────────────────────────────────────────────────────────────────${NC}"
    printf "%-25s %-12s %-12s %-10s %-20s\n" "Container" "Status" "Health" "CPU" "Memory"
    echo -e "${BOLD}${CYAN}───────────────────────────────────────────────────────────────────${NC}"

    for service in "${SERVICES[@]}"; do
        local status=$(get_container_status "$service")
        local health=$(get_health_status "$service")
        local cpu=$(get_cpu_usage "$service")
        local memory=$(get_memory_usage "$service")

        printf "%-25s %-20s %-15s %-10s %-20s\n" \
            "$service" \
            "$status" \
            "$health" \
            "$cpu" \
            "$memory"
    done

    echo ""
}

print_port_table() {
    echo -e "${BOLD}${CYAN}Port Bindings${NC}"
    echo -e "${BOLD}${CYAN}───────────────────────────────────────────────────────────────────${NC}"
    printf "%-25s %s\n" "Container" "Ports"
    echo -e "${BOLD}${CYAN}───────────────────────────────────────────────────────────────────${NC}"

    for service in "${SERVICES[@]}"; do
        local ports=$(get_port_bindings "$service")
        printf "%-25s %s\n" "$service" "$ports"
    done

    echo ""
}

print_volume_info() {
    echo -e "${BOLD}${CYAN}Docker Volumes${NC}"
    echo -e "${BOLD}${CYAN}───────────────────────────────────────────────────────────────────${NC}"

    docker volume ls --format "table {{.Name}}\t{{.Driver}}" | grep -E "NAME|vibe|postgres|code_server|open_webui" || echo "No volumes found"

    echo ""
}

print_summary() {
    echo -e "${BOLD}${CYAN}Summary${NC}"
    echo -e "${BOLD}${CYAN}───────────────────────────────────────────────────────────────────${NC}"

    local total=$(docker ps -a --format '{{.Names}}' | grep -E "$(IFS='|'; echo "${SERVICES[*]}")" | wc -l)
    local running=$(docker ps --format '{{.Names}}' | grep -E "$(IFS='|'; echo "${SERVICES[*]}")" | wc -l)
    local healthy=$(docker ps --filter "health=healthy" --format '{{.Names}}' | grep -E "$(IFS='|'; echo "${SERVICES[*]}")" | wc -l)
    local unhealthy=$(docker ps --filter "health=unhealthy" --format '{{.Names}}' | grep -E "$(IFS='|'; echo "${SERVICES[*]}")" | wc -l)

    echo "Total containers: $total"
    echo -e "Running: ${GREEN}$running${NC}"
    echo -e "Healthy: ${GREEN}$healthy${NC}"
    if [ "$unhealthy" -gt 0 ]; then
        echo -e "Unhealthy: ${RED}$unhealthy${NC}"
    else
        echo -e "Unhealthy: 0"
    fi

    # Docker system info
    local docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
    echo ""
    echo "Docker version: $docker_version"

    echo ""
}

print_recent_logs() {
    echo -e "${BOLD}${CYAN}Recent Logs (Last 5 lines per service)${NC}"
    echo -e "${BOLD}${CYAN}───────────────────────────────────────────────────────────────────${NC}"

    for service in "${SERVICES[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
            echo -e "${BOLD}$service:${NC}"
            docker logs --tail 2 "$service" 2>&1 | sed 's/^/  /' | head -5
            echo ""
        fi
    done
}

show_logs_menu() {
    clear
    echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║${NC}  ${BOLD}Select container for logs${NC}                                    ${BOLD}${BLUE}║${NC}"
    echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    local i=1
    for service in "${SERVICES[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
            echo "  $i) $service"
            ((i++))
        fi
    done
    echo "  0) Back to dashboard"
    echo ""

    read -p "Select container: " choice

    if [ "$choice" = "0" ]; then
        return
    fi

    local selected_service=$(echo "${SERVICES[@]}" | awk -v choice="$choice" '{print $choice}')

    if docker ps --format '{{.Names}}' | grep -q "^${selected_service}$"; then
        clear
        echo -e "${BOLD}${BLUE}Logs for: $selected_service${NC}"
        echo -e "${CYAN}Press Ctrl+C to return to dashboard${NC}"
        echo ""
        docker logs -f "$selected_service" 2>&1
    fi
}

main_loop() {
    while true; do
        print_header
        print_summary
        print_service_table
        print_port_table
        print_volume_info
        print_recent_logs

        echo -e "${BOLD}${CYAN}Next refresh in $REFRESH_INTERVAL seconds... (q=quit, r=refresh, l=logs)${NC}"

        # Read input with timeout
        read -t "$REFRESH_INTERVAL" -n 1 input 2>/dev/null || input=""

        case "$input" in
            q|Q)
                clear
                echo "Goodbye!"
                exit 0
                ;;
            r|R)
                continue
                ;;
            l|L)
                show_logs_menu
                ;;
        esac
    done
}

# =============================================================================
# Main
# =============================================================================

print_header
echo "Checking Docker daemon..."

if ! docker ps &> /dev/null; then
    echo -e "${RED}Error: Docker daemon is not running${NC}"
    exit 1
fi

echo -e "${GREEN}Docker is running${NC}"
echo ""
echo "Starting health dashboard..."
echo ""

# Check for required tools
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Start main loop
main_loop
