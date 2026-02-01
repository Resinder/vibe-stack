#!/usr/bin/env bash
# =============================================================================
# Vibe Stack - Docker Volume Backup Script
# =============================================================================
#
# Automated backup solution for Docker volumes with:
# - PostgreSQL database dumps
# - Volume snapshots
# - Backup rotation (daily, weekly, monthly)
# - S3/cloud storage integration
# - Backup integrity verification
# - Encryption support
#
# Usage:
#   ./scripts/ops/backup-volumes.sh [options]
#
# Options:
#   --full              Full backup (all volumes)
#   --postgres          Backup PostgreSQL only
#   --volumes           Backup Docker volumes only
#   --encrypt           Encrypt backups with GPG
#   --upload-s3         Upload to S3-compatible storage
#   --verify            Verify backup integrity
#   --restore <file>    Restore from backup file
#   --list              List available backups
#   --prune             Remove old backups per retention policy
#   --dry-run           Show what would be done without executing
#   --help              Show this help message
#
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_ROOT="${BACKUP_ROOT:-$PROJECT_ROOT/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${RETENTION_DAYS:-7}
RETENTION_WEEKS=${RETENTION_WEEKS:-4}
RETENTION_MONTHS=${RETENTION_MONTHS:-12}

# Docker configuration
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.yml"
POSTGRES_CONTAINER="vibe-postgres"
POSTGRES_USER="${POSTGRES_USER:-vibeuser}"
POSTGRES_DB="${POSTGRES_DB:-vibestack}"

# Backup configuration
BACKUP_DATE=$(date +%Y-%m-%d)
BACKUP_DATE_DAY=$(date +%A)
BACKUP_WEEK=$(date +%Y-W%V)
BACKUP_MONTH=$(date +%Y-%m)

# S3 configuration (optional)
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="vibe-stack/backups"
S3_ENDPOINT="${S3_ENDPOINT:-https://s3.amazonaws.com}"

# GPG encryption (optional)
GPG_RECIPIENT="${GPG_RECIPIENT:-}"
GPG_PASSPHRASE="${GPG_PASSPHRASE:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Flags
BACKUP_FULL=false
BACKUP_POSTGRES=false
BACKUP_VOLUMES=false
ENCRYPT=false
UPLOAD_S3=false
VERIFY=false
RESTORE_FILE=""
LIST_BACKUPS=false
PRUNE=false
DRY_RUN=false

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    echo ""
    echo "=================================================================="
    echo "  $1"
    echo "=================================================================="
    echo ""
}

show_help() {
    cat << EOF
Usage: $(basename "$0") [options]

Vibe Stack Docker Volume Backup Script

Options:
  --full              Full backup (all volumes)
  --postgres          Backup PostgreSQL only
  --volumes           Backup Docker volumes only
  --encrypt           Encrypt backups with GPG
  --upload-s3         Upload to S3-compatible storage
  --verify            Verify backup integrity
  --restore <file>    Restore from backup file
  --list              List available backups
  --prune             Remove old backups per retention policy
  --dry-run           Show what would be done without executing
  --help              Show this help message

Environment Variables:
  BACKUP_ROOT         Backup directory (default: ./backups)
  RETENTION_DAYS      Daily backups to keep (default: 7)
  RETENTION_WEEKS     Weekly backups to keep (default: 4)
  RETENTION_MONTHS    Monthly backups to keep (default: 12)
  S3_BUCKET           S3 bucket name for uploads
  S3_ENDPOINT         S3 endpoint URL
  GPG_RECIPIENT       GPG recipient for encryption
  GPG_PASSPHRASE      GPG passphrase

Examples:
  # Full backup with encryption
  $(basename "$0") --full --encrypt

  # PostgreSQL backup only
  $(basename "$0") --postgres

  # Backup and upload to S3
  $(basename "$0") --full --upload-s3

  # Restore from backup
  $(basename "$0") --restore backups/postgres_20250131_120000.sql.gz

  # List available backups
  $(basename "$0") --list

  # Prune old backups
  $(basename "$0") --prune

EOF
}

# =============================================================================
# Parse Arguments
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --full)
                BACKUP_FULL=true
                BACKUP_POSTGRES=true
                BACKUP_VOLUMES=true
                shift
                ;;
            --postgres)
                BACKUP_POSTGRES=true
                shift
                ;;
            --volumes)
                BACKUP_VOLUMES=true
                shift
                ;;
            --encrypt)
                ENCRYPT=true
                shift
                ;;
            --upload-s3)
                UPLOAD_S3=true
                shift
                ;;
            --verify)
                VERIFY=true
                shift
                ;;
            --restore)
                RESTORE_FILE="$2"
                shift 2
                ;;
            --list)
                LIST_BACKUPS=true
                shift
                ;;
            --prune)
                PRUNE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# =============================================================================
# Validation Functions
# =============================================================================

validate_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        return 1
    fi

    if ! docker ps &> /dev/null; then
        log_error "Docker daemon is not running"
        return 1
    fi
}

validate_backup_dir() {
    if [ ! -d "$BACKUP_ROOT" ]; then
        log_info "Creating backup directory: $BACKUP_ROOT"
        if [ "$DRY_RUN" = false ]; then
            mkdir -p "$BACKUP_ROOT"/{daily,weekly,monthly}
        fi
    fi
}

validate_s3() {
    if [ "$UPLOAD_S3" = true ] && [ -z "$S3_BUCKET" ]; then
        log_error "S3_BUCKET environment variable is required for --upload-s3"
        return 1
    fi

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is required for S3 uploads. Install with: apt install awscli"
        return 1
    fi
}

validate_gpg() {
    if [ "$ENCRYPT" = true ] && ! command -v gpg &> /dev/null; then
        log_error "GPG is required for encryption. Install with: apt install gnupg"
        return 1
    fi
}

# =============================================================================
# Backup Functions
# =============================================================================

backup_postgres() {
    print_header "PostgreSQL Backup"

    local backup_file="${BACKUP_ROOT}/daily/postgres_${TIMESTAMP}.sql.gz"
    local backup_link="${BACKUP_ROOT}/daily/postgres_latest.sql.gz"

    log_info "Backing up PostgreSQL database..."

    # Check if container is running
    if ! docker ps | grep -q "$POSTGRES_CONTAINER"; then
        log_error "PostgreSQL container is not running"
        return 1
    fi

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would backup PostgreSQL to: $backup_file"
        return 0
    fi

    # Perform backup
    if docker exec "$POSTGRES_CONTAINER" pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl 2>/dev/null | gzip > "$backup_file"; then

        log_success "PostgreSQL backup completed: $backup_file"

        # Create symlink to latest
        ln -sf "$(basename "$backup_file")" "$backup_link"

        # Get file size
        local size=$(du -h "$backup_file" | cut -f1)
        log_info "Backup size: $size"

        # Encrypt if requested
        if [ "$ENCRYPT" = true ]; then
            encrypt_backup "$backup_file"
        fi

        return 0
    else
        log_error "PostgreSQL backup failed"
        return 1
    fi
}

backup_volume() {
    local volume_name="$1"
    local backup_file="${BACKUP_ROOT}/daily/volume_${volume_name}_${TIMESTAMP}.tar.gz"

    log_info "Backing up volume: $volume_name"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would backup volume to: $backup_file"
        return 0
    fi

    # Create temporary container for backup
    local temp_container="backup_temp_${volume_name}"

    # Run alpine container with volume mounted
    if docker run --rm \
        -v "$volume_name":/data:ro \
        -v "$BACKUP_ROOT":/backup \
        alpine:latest \
        tar czf "/backup/$(basename "$backup_file")" -C /data . 2>/dev/null; then

        log_success "Volume backup completed: $backup_file"

        # Get file size
        local size=$(du -h "$backup_file" | cut -f1)
        log_info "Backup size: $size"

        return 0
    else
        log_error "Volume backup failed: $volume_name"
        return 1
    fi
}

backup_all_volumes() {
    print_header "Docker Volumes Backup"

    # Get all Vibe Stack volumes
    local volumes=(
        "vibe_config"
        "vibe_data"
        "code_server_data"
        "open_webui_data"
        "postgres_data"
    )

    for volume in "${volumes[@]}"; do
        if docker volume inspect "$volume" &> /dev/null; then
            backup_volume "$volume"
        else
            log_warning "Volume not found: $volume"
        fi
    done
}

encrypt_backup() {
    local backup_file="$1"

    log_info "Encrypting backup: $backup_file"

    if [ -z "$GPG_RECIPIENT" ]; then
        log_warning "GPG_RECIPIENT not set, skipping encryption"
        return 0
    fi

    if gpg --batch --yes \
        --recipient "$GPG_RECIPIENT" \
        --output "${backup_file}.gpg" \
        --encrypt "$backup_file" 2>/dev/null; then

        # Remove unencrypted file
        rm "$backup_file"
        log_success "Backup encrypted: ${backup_file}.gpg"
        return 0
    else
        log_error "Encryption failed"
        return 1
    fi
}

upload_to_s3() {
    local backup_file="$1"
    local s3_path="s3://${S3_BUCKET}/${S3_PREFIX}/$(basename "$backup_file")"

    log_info "Uploading to S3: $s3_path"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would upload to: $s3_path"
        return 0
    fi

    if aws s3 cp "$backup_file" "$s3_path" \
        --endpoint-url "$S3_ENDPOINT" \
        --storage-class STANDARD_IA; then

        log_success "Uploaded to S3: $s3_path"
        return 0
    else
        log_error "S3 upload failed"
        return 1
    fi
}

verify_backup() {
    local backup_file="$1"

    log_info "Verifying backup: $backup_file"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would verify: $backup_file"
        return 0
    fi

    # Check if file exists
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    # Check if encrypted
    if [[ "$backup_file" == *.gpg ]]; then
        if gpg --list-packets "$backup_file" &> /dev/null; then
            log_success "Encrypted backup is valid"
            return 0
        else
            log_error "Encrypted backup is corrupted"
            return 1
        fi
    fi

    # Check if gzip is valid
    if [[ "$backup_file" == *.gz ]]; then
        if gzip -t "$backup_file" 2>/dev/null; then
            log_success "Backup is valid gzip"
            return 0
        else
            log_error "Backup is corrupted"
            return 1
        fi
    fi

    # Check if tar is valid
    if [[ "$backup_file" == *.tar.gz ]]; then
        if tar tzf "$backup_file" &> /dev/null; then
            log_success "Backup is valid tar.gz"
            return 0
        else
            log_error "Backup is corrupted"
            return 1
        fi
    fi

    log_success "Backup file exists"
    return 0
}

# =============================================================================
# Restore Functions
# =============================================================================

restore_postgres() {
    local backup_file="$1"

    print_header "PostgreSQL Restore"

    log_info "Restoring from: $backup_file"

    # Check if container is running
    if ! docker ps | grep -q "$POSTGRES_CONTAINER"; then
        log_error "PostgreSQL container is not running"
        return 1
    fi

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would restore PostgreSQL from: $backup_file"
        return 0
    fi

    # Decrypt if needed
    if [[ "$backup_file" == *.gpg ]]; then
        log_info "Decrypting backup..."
        backup_file="${backup_file%.gpg}"

        if ! gpg --batch --yes \
            --output "$backup_file" \
            --decrypt "${backup_file}.gpg"; then
            log_error "Decryption failed"
            return 1
        fi
    fi

    # Restore backup
    if gunzip -c "$backup_file" | docker exec -i "$POSTGRES_CONTAINER" psql \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB"; then

        log_success "PostgreSQL restore completed"
        return 0
    else
        log_error "PostgreSQL restore failed"
        return 1
    fi
}

restore_volume() {
    local backup_file="$1"
    local volume_name="$2"

    log_info "Restoring volume: $volume_name from: $backup_file"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would restore volume from: $backup_file"
        return 0
    fi

    # Create volume if it doesn't exist
    if ! docker volume inspect "$volume_name" &> /dev/null; then
        docker volume create "$volume_name"
    fi

    # Restore from backup
    if docker run --rm \
        -v "$volume_name":/data \
        -v "$(dirname "$backup_file")":/backup \
        alpine:latest \
        tar xzf "/backup/$(basename "$backup_file")" -C /data; then

        log_success "Volume restore completed: $volume_name"
        return 0
    else
        log_error "Volume restore failed: $volume_name"
        return 1
    fi
}

# =============================================================================
# Maintenance Functions
# =============================================================================

list_backups() {
    print_header "Available Backups"

    log_info "Backup directory: $BACKUP_ROOT"
    echo ""

    for type in daily weekly monthly; do
        if [ -d "$BACKUP_ROOT/$type" ]; then
            echo "=== $type ==="
            ls -lh "$BACKUP_ROOT/$type" 2>/dev/null || echo "No backups"
            echo ""
        fi
    done
}

prune_backups() {
    print_header "Pruning Old Backups"

    log_info "Retention policy:"
    log_info "  Daily: $RETENTION_DAYS days"
    log_info "  Weekly: $RETENTION_WEEKS weeks"
    log_info "  Monthly: $RETENTION_MONTHS months"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would prune old backups"
        return 0
    fi

    # Prune daily backups (keep last N days)
    log_info "Pruning daily backups..."
    find "$BACKUP_ROOT/daily" -name "*.sql.gz" -o -name "*.tar.gz" 2>/dev/null | \
        sort -r | tail -n +$((RETENTION_DAYS + 1)) | xargs rm -f

    # Prune weekly backups
    log_info "Pruning weekly backups..."
    find "$BACKUP_ROOT/weekly" -name "*.sql.gz" -o -name "*.tar.gz" 2>/dev/null | \
        sort -r | tail -n +$((RETENTION_WEEKS + 1)) | xargs rm -f

    # Prune monthly backups
    log_info "Pruning monthly backups..."
    find "$BACKUP_ROOT/monthly" -name "*.sql.gz" -o -name "*.tar.gz" 2>/dev/null | \
        sort -r | tail -n +$((RETENTION_MONTHS + 1)) | xargs rm -f

    log_success "Backup pruning completed"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    parse_args "$@"

    print_header "Vibe Stack - Docker Volume Backup"
    echo "Project: $PROJECT_ROOT"
    echo "Timestamp: $TIMESTAMP"
    echo ""

    # Change to project directory
    cd "$PROJECT_ROOT" || exit 1

    # Validate Docker
    validate_docker

    # Handle list command
    if [ "$LIST_BACKUPS" = true ]; then
        list_backups
        exit 0
    fi

    # Handle prune command
    if [ "$PRUNE" = true ]; then
        prune_backups
        exit 0
    fi

    # Handle restore command
    if [ -n "$RESTORE_FILE" ]; then
        if [[ "$RESTORE_FILE" == *postgres* ]]; then
            restore_postgres "$RESTORE_FILE"
        else
            log_error "Only PostgreSQL restore is currently supported"
            exit 1
        fi
        exit $?
    fi

    # Default to full backup if no specific option selected
    if [ "$BACKUP_POSTGRES" = false ] && [ "$BACKUP_VOLUMES" = false ]; then
        BACKUP_FULL=true
        BACKUP_POSTGRES=true
        BACKUP_VOLUMES=true
    fi

    # Validate environment
    validate_backup_dir
    validate_gpg
    validate_s3

    # Perform backups
    if [ "$BACKUP_POSTGRES" = true ]; then
        backup_postgres

        # Upload to S3 if requested
        if [ "$UPLOAD_S3" = true ]; then
            LATEST_BACKUP="${BACKUP_ROOT}/daily/postgres_${TIMESTAMP}.sql.gz"
            if [ "$ENCRYPT" = true ]; then
                LATEST_BACKUP="${LATEST_BACKUP}.gpg"
            fi
            upload_to_s3 "$LATEST_BACKUP"
        fi
    fi

    if [ "$BACKUP_VOLUMES" = true ]; then
        backup_all_volumes
    fi

    # Verify backups if requested
    if [ "$VERIFY" = true ]; then
        find "$BACKUP_ROOT/daily" -type f -name "*.sql.gz" -o -name "*.tar.gz" 2>/dev/null | while read -r backup; do
            verify_backup "$backup"
        done
    fi

    # Summary
    print_header "Backup Summary"
    log_success "Backup completed successfully"
    log_info "Backup location: $BACKUP_ROOT"
}

# Run main function
main "$@"
