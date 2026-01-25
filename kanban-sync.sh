#!/bin/bash
# ============================================================================
# Vibe Stack - Kanban Bridge (Agent Sync)
# ============================================================================
# Bridges the gap between system state and Kanban UI.
# Reads .vibe-state.json and git log to automatically move tasks between
# 'To Do', 'In Progress', and 'Done'.
#
# This script is triggered after:
#   - Successful make update
#   - Successful test-harness.sh run
#   - Manual execution via make kanban-sync
#
# Usage: ./kanban-sync.sh [--dry-run] [--verbose]
#
# Options:
#   --dry-run    Show what would be synced without making changes
#   --verbose    Show detailed sync operations
# ============================================================================

# Strict mode: Exit on error, undefined variables, and pipe failures
set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Parse arguments
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ANSI color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'  # No Color

# State files
readonly STATE_FILE=".vibe-state.json"
readonly VERSION_LOG=".vibe-versions.log"
readonly KANBAN_STATE=".vibe-kanban-bridge.json"
readonly IMMUNE_LOG_PATTERN="immune-response-*.log"

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${CYAN}[KANBAN-BRIDGE]${NC} ${*}"
}

log_success() {
    echo -e "${GREEN}[KANBAN-BRIDGE] ✓${NC} ${*}"
}

log_warning() {
    echo -e "${YELLOW}[KANBAN-BRIDGE] ⚠${NC} ${*}"
}

log_error() {
    echo -e "${RED}[KANBAN-BRIDGE] ✗${NC} ${*}"
}

log_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[KANBAN-BRIDGE] [DEBUG]${NC} ${*}"
    fi
}

# ============================================================================
# KANBAN STATE MANAGEMENT
# ============================================================================

init_kanban_state() {
    if [[ ! -f "$KANBAN_STATE" ]]; then
        cat > "$KANBAN_STATE" << 'EOF'
{
  "lanes": {
    "backlog": [],
    "todo": [],
    "in_progress": [],
    "done": [],
    "recovery": []
  },
  "last_sync": null,
  "sync_count": 0
}
EOF
        log_verbose "Initialized kanban state"
    fi
}

# ============================================================================
# MISSION STATE READING
# ============================================================================

read_mission_state() {
    if [[ ! -f "$STATE_FILE" ]]; then
        log_verbose "No mission state file found"
        return 1
    fi

    if ! command -v jq >/dev/null 2>&1; then
        log_warning "jq not found - cannot parse state file"
        return 1
    fi

    local mission_title
    local mission_status
    local current_step
    local step_name
    local percent_complete
    local interrupted

    mission_title=$(jq -r '.mission.title' "$STATE_FILE" 2>/dev/null || echo "Unknown Mission")
    mission_status=$(jq -r '.mission.status' "$STATE_FILE" 2>/dev/null || echo "unknown")
    current_step=$(jq -r '.progress.current_step' "$STATE_FILE" 2>/dev/null || echo "0")
    step_name=$(jq -r '.progress.step_name' "$STATE_FILE" 2>/dev/null || echo "Unknown step")
    percent_complete=$(jq -r '.progress.percent_complete' "$STATE_FILE" 2>/dev/null || echo "0")

    # Check if mission is interrupted (has active state but not recently updated)
    local last_updated
    last_updated=$(jq -r '.metadata.last_heartbeat' "$STATE_FILE" 2>/dev/null || echo "")
    interrupted="false"

    if [[ -n "$last_updated" ]]; then
        local now
        now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        local diff_seconds
        diff_seconds=$(($(date -d "$now" +%s) - $(date -d "$last_updated" +%s) 2>/dev/null || echo "3600"))

        # If no heartbeat for more than 30 minutes, consider interrupted
        if [[ $diff_seconds -gt 1800 ]] && [[ "$mission_status" == "active" ]]; then
            interrupted="true"
        fi
    fi

    # Export for use in other functions
    export MISSION_TITLE="$mission_title"
    export MISSION_STATUS="$mission_status"
    export MISSION_STEP="$current_step"
    export MISSION_STEP_NAME="$step_name"
    export MISSION_PERCENT="$percent_complete"
    export MISSION_INTERRUPTED="$interrupted"

    log_verbose "Mission: $mission_title | Status: $mission_status | Interrupted: $interrupted"
    return 0
}

# ============================================================================
# GIT LOG ANALYSIS
# ============================================================================

analyze_git_activity() {
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        log_verbose "Not in a git repository"
        return 1
    fi

    # Get recent commits (last 10)
    local recent_commits
    recent_commits=$(git log --oneline -10 2>/dev/null || echo "")

    if [[ -z "$recent_commits" ]]; then
        return 1
    fi

    # Analyze commits for completed tasks
    local completed_tasks=()
    while IFS= read -r commit; do
        # Look for completion indicators in commit messages
        if echo "$commit" | grep -qiE "(complete|finish|done|merge)"; then
            completed_tasks+=("$commit")
        fi
    done <<< "$recent_commits"

    export GIT_COMPLETED_TASKS="${completed_tasks[*]:-}"
    log_verbose "Found ${#completed_tasks[@]} completed tasks in git log"
}

# ============================================================================
# IMMUNE RESPONSE ANALYSIS
# ============================================================================

analyze_immune_responses() {
    local immune_logs=()
    local recent_errors=()
    local recent_successes=()

    # Find immune response logs
    while IFS= read -r log_file; do
        if [[ -f "$log_file" ]]; then
            immune_logs+=("$log_file")
        fi
    done < <(ls -t $IMMUNE_LOG_PATTERN 2>/dev/null || true)

    # Analyze most recent log
    if [[ ${#immune_logs[@]} -gt 0 ]]; then
        local latest_log="${immune_logs[0]}"
        local content
        content=$(cat "$latest_log" 2>/dev/null || echo "")

        if echo "$content" | grep -q "IMMUNE RESPONSE TRIGGERED"; then
            recent_errors+=("$(basename "$latest_log")")
        else
            recent_successes+=("$(basename "$latest_log")")
        fi
    fi

    export IMMUNE_ERRORS="${recent_errors[*]:-}"
    export IMMUNE_SUCCESSES="${recent_successes[*]:-}"
    log_verbose "Immune errors: ${#recent_errors[@]} | Successes: ${#recent_successes[@]}"
}

# ============================================================================
# KANBAN CARD MANAGEMENT
# ============================================================================

create_or_update_card() {
    local lane="$1"
    local title="$2"
    local status="${3:-}"
    local badge="${4:-}"

    # Create card JSON
    local card
    card=$(jq -n \
        --arg title "$title" \
        --arg status "$status" \
        --arg badge "$badge" \
        --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        '{
            title: $title,
            status: $status // "active",
            badge: $badge // null,
            created_at: $timestamp,
            updated_at: $timestamp
        }')

    # Add card to lane in state
    local tmp_state
    tmp_state=$(mktemp)

    jq --arg lane "$lane" \
       --argjson card "$card" \
       '.lanes[$lane] += [$card] | .lanes[$lane] = (.lanes[$lane] | unique_by(.title))' \
       "$KANBAN_STATE" > "$tmp_state"

    mv "$tmp_state" "$KANBAN_STATE"

    log_verbose "Added card '$title' to lane '$lane'"
}

move_card_to_lane() {
    local title="$1"
    local from_lane="$2"
    local to_lane="$3"

    local tmp_state
    tmp_state=$(mktemp)

    # Remove from source lane
    jq --arg from "$from_lane" \
       --arg title "$title" \
       '.lanes[$from] = (.lanes[$from] | map(select(.title != $title)))' \
       "$KANBAN_STATE" > "$tmp_state"

    mv "$tmp_state" "$KANBAN_STATE"

    # Add to destination lane
    create_or_update_card "$to_lane" "$title"

    log_verbose "Moved '$title' from '$from_lane' to '$to_lane'"
}

# ============================================================================
# SYNC LOGIC
# ============================================================================

sync_mission_state() {
    if ! read_mission_state; then
        return 0
    fi

    local target_lane="in_progress"

    # Determine target lane based on mission status
    case "$MISSION_STATUS" in
        "active")
            if [[ "$MISSION_INTERRUPTED" == "true" ]]; then
                target_lane="recovery"
            else
                target_lane="in_progress"
            fi
            ;;
        "completed")
            target_lane="done"
            ;;
        "paused")
            target_lane="todo"
            ;;
        "failed")
            target_lane="recovery"
            ;;
        *)
            target_lane="todo"
            ;;
    esac

    local badge=""
    if [[ "$MISSION_INTERRUPTED" == "true" ]]; then
        badge="INTERRUPTED"
    fi

    # Update or create card for this mission
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would move '$MISSION_TITLE' to '$target_lane' (badge: $badge)"
    else
        create_or_update_card "$target_lane" "$MISSION_TITLE" "$MISSION_STATUS" "$badge"
        log_success "Synced mission: $MISSION_TITLE → $target_lane"
    fi
}

sync_git_activity() {
    if ! analyze_git_activity; then
        return 0
    fi

    # Move completed tasks from in_progress to done
    if [[ -n "$GIT_COMPLETED_TASKS" ]]; then
        while IFS= read -r task; do
            if [[ -n "$task" ]]; then
                local task_title
                task_title=$(echo "$task" | sed 's/^[0-9a-f]* //' | cut -d':' -f1)

                if [[ "$DRY_RUN" == "true" ]]; then
                    log_info "[DRY-RUN] Would complete task: $task_title"
                else
                    move_card_to_lane "$task_title" "in_progress" "done"
                    log_success "Completed task from git: $task_title"
                fi
            fi
        done <<< "$GIT_COMPLETED_TASKS"
    fi
}

sync_immune_responses() {
    analyze_immune_responses

    # Create cards for recent immune responses
    if [[ -n "$IMMUNE_ERRORS" ]]; then
        for error in $IMMUNE_ERRORS; do
            local card_title="Immune Response: $error"

            if [[ "$DRY_RUN" == "true" ]]; then
                log_info "[DRY-RUN] Would log immune error: $error"
            else
                create_or_update_card "recovery" "$card_title" "failed" "IMMUNE BLOCKED"
                log_warning "Immune response logged: $error"
            fi
        done
    fi
}

# ============================================================================
# DASHBOARD GENERATION
# ============================================================================

generate_dashboard_data() {
    local dashboard_file=".vibe-dashboard.json"

    # Collect system metrics
    local evolution_score="Unknown"
    local resource_usage="{}"
    local immune_status="clean"

    # Try to get evolution score from evolve.sh output
    if [[ -f ".vibe-evolution-output.log" ]]; then
        evolution_score=$(grep -oP "Evolution Score:.*" ".vibe-evolution-output.log" 2>/dev/null | tail -1 || echo "Unknown")
    fi

    # Get resource usage
    if docker ps >/dev/null 2>&1; then
        resource_output=$(docker stats --no-stream --format "{{.Name}}:{{.CPUPerc}}:{{.MemPerc}}" 2>/dev/null || echo "")
        if [[ -n "$resource_output" ]]; then
            resource_usage=$(echo "$resource_output" | jq -R -s 'split("\n") | map(select(length > 0) | split(":") | {name: .[0], cpu: .[1], mem: .[2]})')
        fi
    fi

    # Check immune status
    if [[ -n "$IMMUNE_ERRORS" ]]; then
        immune_status="compromised"
    fi

    # Generate dashboard JSON
    jq -n \
        --arg score "$evolution_score" \
        --argjson resources "$resource_usage" \
        --arg immune "$immune_status" \
        --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        '{
            evolution_score: $score,
            resource_usage: $resources,
            immune_status: $immune,
            last_updated: $timestamp,
            mission_state: env.MISSION_TITLE // null,
            mission_percent: env.MISSION_PERCENT // null
        }' > "$dashboard_file"

    log_verbose "Generated dashboard data: $dashboard_file"
}

# ============================================================================
# MAIN SYNC FUNCTION
# ============================================================================

perform_sync() {
    log_info "Starting Kanban Bridge synchronization..."

    # Initialize state
    init_kanban_state

    # Sync all sources
    sync_mission_state
    sync_git_activity
    sync_immune_responses

    # Generate dashboard data
    generate_dashboard_data

    # Update sync metadata
    local tmp_state
    tmp_state=$(mktemp)

    jq --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
       '.last_sync = $timestamp | .sync_count += 1' \
       "$KANBAN_STATE" > "$tmp_state"

    mv "$tmp_state" "$KANBAN_STATE"

    log_success "Synchronization complete"

    # Show summary
    if [[ "$VERBOSE" == "true" ]] || [[ "$DRY_RUN" == "true" ]]; then
        echo ""
        echo -e "${CYAN}Kanban State Summary:${NC}"
        jq -r '.lanes | to_entries[] | "\(.key | ascii_upcase): \(.value | length) cards"' "$KANBAN_STATE"
        echo ""
    fi
}

# ============================================================================
# TRIGGER INTEGRATION
# ============================================================================

trigger_after_update() {
    # This function is called by make update after successful completion
    log_info "Auto-sync triggered after successful update"
    perform_sync
}

trigger_after_test_harness() {
    # This function is called by test-harness.sh after successful completion
    log_info "Auto-sync triggered after successful test-harness"
    perform_sync
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo ""
    echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║  Vibe Stack - Kanban Bridge (Agent Sync)                  ║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY-RUN MODE: No changes will be made"
        echo ""
    fi

    perform_sync

    echo ""
    log_info "Kanban state saved to: $KANBAN_STATE"
    log_info "Dashboard data saved to: .vibe-dashboard.json"
    echo ""
}

# Handle script interruption
trap 'echo ""; log_error "Sync interrupted"; exit 130' INT

# Run main function
main "$@"
