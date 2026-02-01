# Backup and Restore

This guide covers backup and restore procedures for Vibe Stack data.

## Overview

Vibe Stack uses Docker volumes for persistent data storage. The backup script provides:

- **Automated PostgreSQL dumps** - Logical backups of the database
- **Volume snapshots** - Full volume backups
- **Backup rotation** - Daily, weekly, monthly retention
- **Encryption support** - GPG-encrypted backups
- **Cloud storage** - S3-compatible upload support
- **Integrity verification** - Backup validation

## Quick Start

```bash
# Create a full backup
npm run backup:create

# List available backups
npm run backup:list

# Prune old backups
npm run backup:prune
```

## Backup Types

### PostgreSQL Backups

PostgreSQL data is backed up using `pg_dump`:

```bash
# Backup PostgreSQL only
npm run backup:postgres

# Or use the script directly
bash scripts/ops/backup-volumes.sh --postgres
```

This creates:
- SQL dump with `--clean` and `--if-exists` flags
- Gzip compression
- Timestamped filenames
- Symlink to latest backup

### Volume Backups

All Docker volumes can be backed up:

```bash
# Backup all volumes
bash scripts/ops/backup-volumes.sh --volumes
```

Volumes backed up:
- `vibe_config` - Vibe-Kanban configuration
- `vibe_data` - Vibe-Kanban data
- `code_server_data` - VS Code settings
- `open_webui_data` - Open WebUI data
- `postgres_data` - PostgreSQL data

## Backup Options

### Full Backup

```bash
# Backup everything (PostgreSQL + volumes)
npm run backup:create
```

### Encrypted Backups

```bash
# Backup with GPG encryption
export GPG_RECIPIENT="your-email@example.com"
bash scripts/ops/backup-volumes.sh --full --encrypt
```

### S3 Upload

```bash
# Upload backups to S3-compatible storage
export S3_BUCKET="my-backups"
export S3_ENDPOINT="https://s3.amazonaws.com"
bash scripts/ops/backup-volumes.sh --full --upload-s3
```

### Backup Verification

```bash
# Verify backup integrity
bash scripts/ops/backup-volumes.sh --verify
```

## Backup Location

By default, backups are stored in:

```
./backups/
├── daily/          # Daily backups (last 7 days)
├── weekly/         # Weekly backups (last 4 weeks)
└── monthly/        # Monthly backups (last 12 months)
```

## Retention Policy

Default retention:

- **Daily**: 7 days
- **Weekly**: 4 weeks
- **Monthly**: 12 months

Configure via environment variables:

```bash
export RETENTION_DAYS=14
export RETENTION_WEEKS=8
export RETENTION_MONTHS=24
```

## Scheduled Backups

### Using Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/vibe-stack && npm run backup:create
```

### Using systemd Timer

Create `/etc/systemd/system/vibe-stack-backup.service`:

```ini
[Unit]
Description=Vibe Stack Backup
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=/path/to/vibe-stack
ExecStart=/usr/bin/npm run backup:create
```

Create `/etc/systemd/system/vibe-stack-backup.timer`:

```ini
[Unit]
Description=Vibe Stack Backup Timer
Requires=vibe-stack-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable the timer:

```bash
sudo systemctl enable vibe-stack-backup.timer
sudo systemctl start vibe-stack-backup.timer
```

## Restore Procedures

### PostgreSQL Restore

```bash
# Stop the services
docker compose down

# Restore PostgreSQL from backup
bash scripts/ops/backup-volumes.sh --restore backups/daily/postgres_20250131_120000.sql.gz

# Start services
docker compose up -d
```

### Volume Restore

```bash
# Stop the services
docker compose down

# Restore volume from backup
bash scripts/ops/backup-volumes.sh --restore backups/daily/volume_postgres_data_20250131_120000.tar.gz

# Start services
docker compose up -d
```

### Decrypting Encrypted Backups

```bash
# Decrypt GPG-encrypted backup
gpg --output backup.sql.gz --decrypt backup.sql.gz.gpg

# Then restore as normal
bash scripts/ops/backup-volumes.sh --restore backup.sql.gz
```

## Disaster Recovery

### Complete System Restore

1. **Install Docker** on the new system
2. **Clone the repository**:

   ```bash
   git clone https://github.com/Resinder/vibe-stack.git
   cd vibe-stack
   ```

3. **Copy backups** from S3 or other storage
4. **Restore PostgreSQL**:

   ```bash
   docker compose up -d postgres
   sleep 10
   bash scripts/ops/backup-volumes.sh --restore backups/latest_postgres.sql.gz
   ```

5. **Start all services**:

   ```bash
   docker compose up -d
   ```

### Point-in-Time Recovery (PostgreSQL)

For more advanced PostgreSQL recovery:

1. Enable WAL archiving in `docker-compose.yml`:

   ```yaml
   postgres:
     command:
       - postgres
       - -c
       - wal_level=replica
       - -c
       - archive_mode=on
       - -c
       - archive_command='docker exec postgres wal-g wal-push %p'
   ```

2. Use `wal-g` for continuous archiving:

   ```bash
   # Install wal-g
   docker exec postgres apk add wal-g

   # Backup
   docker exec postgres wal-g backup-push /var/lib/postgresql/data

   # Restore to specific point
   docker exec postgres wal-g backup-fetch /var/lib/postgresql/data LATEST
   ```

## Troubleshooting

### Backup Fails with "No space left on device"

```bash
# Check disk space
df -h

# Clean up old backups
npm run backup:prune

# Clean Docker system
docker system prune -a --volumes
```

### "Permission denied" on backup directory

```bash
# Fix permissions
sudo chown -R $USER:$USER ./backups
chmod 700 ./backups
```

### Restore fails with "database is being accessed"

```bash
# Stop all services first
docker compose down

# Then restore
bash scripts/ops/backup-volumes.sh --restore backup.sql.gz
```

### GPG decryption fails

```bash
# Check GPG key
gpg --list-keys

# Import key if needed
gpg --import private-key.asc

# Test decryption
gpg --decrypt backup.sql.gz.gpg > /dev/null
```

## Best Practices

1. **Test backups regularly** - Restore to a test system monthly
2. **Off-site storage** - Upload backups to S3 or similar
3. **Encrypt backups** - Use GPG for sensitive data
4. **Monitor backups** - Set up alerts for backup failures
5. **Document restore procedures** - Keep this guide accessible
6. **Version control infrastructure** - Store backup scripts in Git

## Advanced Configuration

### Custom Backup Directory

```bash
export BACKUP_ROOT=/mnt/backup-drive/vibe-stack
npm run backup:create
```

### Exclude Specific Volumes

Edit `scripts/ops/backup-volumes.sh` to exclude volumes:

```bash
# Skip code-server volume
volumes=(
    "vibe_config"
    "vibe_data"
    # "code_server_data"  # Comment out to skip
    "open_webui_data"
    "postgres_data"
)
```

### Parallel Backup Processing

For large deployments, backup volumes in parallel:

```bash
# Backup multiple volumes simultaneously
for volume in "${volumes[@]}"; do
    backup_volume "$volume" &
done
wait
```

## Monitoring

### Backup Status Check

```bash
# Check latest backups
ls -lh ./backups/daily/ | tail -5

# Verify backup integrity
bash scripts/ops/backup-volumes.sh --verify
```

### Prometheus Metrics

Create a backup exporter:

```python
#!/usr/bin/env python3
import subprocess
import time
from prometheus_client import start_http_server, Gauge

backup_age = Gauge('vibe_backup_age_seconds', 'Age of latest backup')

def check_backup():
    result = subprocess.run(['ls', '-lt', './backups/daily/'],
                          capture_output=True, text=True)
    # Parse and update metric
    backup_age.set(time.time() - get_backup_timestamp())

start_http_server(8000)
while True:
    check_backup()
    time.sleep(60)
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/Resinder/vibe-stack/issues
- Documentation: https://github.com/Resinder/vibe-stack/tree/main/docs
