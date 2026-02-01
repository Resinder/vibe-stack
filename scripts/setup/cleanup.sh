#!/usr/bin/env bash
# =============================================================================
# Vibe Stack - Docker Cleanup Script
# =============================================================================
# Stops all services and removes old Docker images to free up disk space
# Run: ./scripts/setup/cleanup.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}${GREEN}Vibe Stack - Docker Cleanup${NC}                           ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC}  $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC}  $1"
}

# Count functions
count_containers() {
    docker compose ps -q 2>/dev/null | wc -l
}

count_images() {
    docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "vibe-stack|node|postgres|code-server|open-webui|grafana|prometheus" | wc -l
}

count_dangling() {
    docker images -f "dangling=true" -q | wc -l
}

get_disk_usage() {
    docker system df --format "{{.Size}}" 2>/dev/null | head -1
}

# =============================================================================
# MAIN FLOW
# =============================================================================

print_header
echo -e "${BOLD}This script will:${NC}"
echo "  1. Stop all Vibe Stack services"
echo "  2. Remove old Docker images (frees disk space)"
echo "  3. Clean up dangling images and build cache"
echo ""
echo -e "${YELLOW}⚠️  This will NOT delete your data (volumes are preserved)${NC}"
echo ""

read -p "Continue? (y/n): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

clear

# Show current state
print_header
print_step "Current State"

container_count=$(count_containers)
image_count=$(count_images)
dangling_count=$(count_dangling)
disk_usage=$(get_disk_usage)

echo -e "Running containers: ${BOLD}$container_count${NC}"
echo -e "Vibe Stack images: ${BOLD}$image_count${NC}"
echo -e "Dangling images:   ${BOLD}$dangling_count${NC}"
echo -e "Docker disk usage: ${BOLD}${disk_usage}${NC}"
echo ""

# =============================================================================
# STEP 1: Stop Services
# =============================================================================
print_step "Step 1: Stopping All Services"

print_info "Stopping containers..."
if docker compose down --remove-orphans 2>/dev/null; then
    print_success "All services stopped"
else
    print_warning "Some services may not have been running"
fi

# Double check
remaining=$(docker ps -q --filter "name=vibe" 2>/dev/null | wc -l)
if [ "$remaining" -gt 0 ]; then
    print_info "Force stopping remaining containers..."
    docker ps -q --filter "name=vibe" | xargs -r docker stop 2>/dev/null || true
    docker ps -q --filter "name=vibe" | xargs -r docker rm 2>/dev/null || true
fi

# =============================================================================
# STEP 2: Remove Old Images
# =============================================================================
print_step "Step 2: Removing Old Docker Images"

print_info "Checking for old Vibe Stack images..."

# List images that will be removed
echo ""
echo "Images to be removed:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | \
    grep -E "vibe-stack|REPOSITORY" || echo "  (none found)"
echo ""

removed_count=0

# Remove old vibe-stack images
print_info "Removing Vibe Stack images..."
removed_count=0
total_removed=0

while IFS= read -r image; do
    if [ -n "$image" ]; then
        print_info "Removing: $image"
        if docker rmi "$image" 2>/dev/null; then
            ((removed_count++))
            ((total_removed++))
        else
            # Image might be in use, try force remove
            docker rmi -f "$image" 2>/dev/null && ((total_removed++)) || true
        fi
    fi
done < <(docker images --format "{{.Repository}}:{{.Tag}}" | grep "^vibe-stack" 2>/dev/null || true)

if [ $total_removed -gt 0 ]; then
    print_success "Removed $total_removed image(s)"
else
    print_info "No old images to remove"
fi

# Remove old build cache
print_info "Cleaning build cache..."
docker builder prune -f > /dev/null 2>&1 || true

# =============================================================================
# STEP 3: Clean Dangling Images
# =============================================================================
print_step "Step 3: Cleaning Dangling Images"

dangling_before=$(count_dangling)

if [ "$dangling_before" -gt 0 ]; then
    print_info "Found $dangling_before dangling images"
    docker image prune -f > /dev/null 2>&1
    print_success "Dangling images removed"
else
    print_info "No dangling images found"
fi

# =============================================================================
# STEP 4: Clean Build Cache
# =============================================================================
print_step "Step 4: Cleaning Build Cache"

print_info "Removing unused build cache..."
docker builder prune -f > /dev/null 2>&1 || true
docker builder prune -a --filter "until=24h" -f > /dev/null 2>&1 || true
print_success "Build cache cleaned"

# =============================================================================
# STEP 5: Show Summary
# =============================================================================
clear
print_header

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}Cleanup Complete!${NC}                                         ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show before/after
container_count_after=$(count_containers)
image_count_after=$(count_images)
dangling_after=$(count_dangling)
disk_usage_after=$(get_disk_usage)

echo -e "${CYAN}Before → After:${NC}"
echo -e "  Running containers:  $container_count → ${GREEN}$container_count_after${NC}"
echo -e "  Vibe Stack images:   $image_count → ${GREEN}$image_count_after${NC}"
echo -e "  Dangling images:     $dangling_before → ${GREEN}$dangling_after${NC}"
echo -e "  Docker disk usage:   $disk_usage → ${GREEN}$disk_usage_after${NC}"
echo ""

# Disk space freed
if command -v docker &> /dev/null; then
    space_output=$(docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}" 2>/dev/null)
    if [ -n "$space_output" ]; then
        echo -e "${CYAN}Reclaimable space:${NC}"
        echo "$space_output" | grep -v "TYPE" | awk '{print "  " $4 " reclaimable from " $1}'
    fi
fi

echo ""
print_info "To start services again:"
echo -e "  ${GREEN}make up${NC}  or  ${GREEN}./scripts/setup/install.sh${NC}"
echo ""
print_warning "Note: All data is preserved in volumes."
echo "         Only images and containers were removed."
echo ""
