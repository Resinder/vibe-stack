# Docker Image Auto-Update System

> **Fully Automated Docker Image Management** | Zero Manual Intervention Required

---

## Overview

The Vibe Stack includes a **fully automated Docker image update system** that keeps all container images up-to-date with their latest stable versions. No pull requests, no manual reviews - just seamless, automatic updates that trigger new releases.

### What Gets Updated

| Service | Registry | Current | Update Frequency |
|---------|----------|---------|------------------|
| PostgreSQL | Docker Hub | 17-alpine | Daily check |
| Prometheus | Docker Hub | v3.5.1 | Daily check |
| Grafana | Docker Hub | 12.3.2 | Daily check |
| AlertManager | Docker Hub | v0.30.1 | Daily check |
| Node Exporter | Docker Hub | v1.10.2 | Daily check |
| Open WebUI | GHCR | v0.7.2 | Daily check |
| code-server | LinuxServer.io | latest | Auto-pulled |

---

## How It Works

### Automatic Update Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Daily Check (00:00 UTC)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. GitHub Actions: "Docker Image Auto-Update & Release"            │
│     ├─ Query Docker Hub API for latest versions                     │
│     ├─ Query GitHub Releases API for GHCR images                   │
│     └─ Compare with current versions in compose files              │
│                                                                     │
│  2. If updates found:                                              │
│     ├─ Update docker-compose.yml files                             │
│     ├─ Validate syntax with `docker compose config`                │
│     ├─ Commit to main branch (skip CI)                             │
│     └─ Push to repository                                         │
│                                                                     │
│  3. Auto-Version Workflow Triggered:                               │
│     ├─ Bump version (patch)                                        │
│     ├─ Update CHANGELOG.md                                         │
│     ├─ Create git tag                                              │
│     └─ Publish GitHub Release                                      │
│                                                                     │
│  4. Result: New version with updated Docker images                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Workflow Files

| File | Purpose |
|------|---------|
| `.github/workflows/docker-auto-update.yml` | Main update workflow |
| `.github/workflows/auto-version.yml` | Version bump & release |
| `.github/renovate.json5` | Renovate bot configuration (backup) |

---

## Configuration

### Update Schedule

By default, the workflow runs **daily at 00:00 UTC**:

```yaml
# .github/workflows/docker-auto-update.yml
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
```

To change the schedule, edit the cron expression:

```yaml
# Examples:
- cron: '0 0 * * 0'  # Weekly (Sunday midnight)
- cron: '0 0 * * 1'  # Weekly (Monday midnight)
- cron: '0 */6 * * *' # Every 6 hours
- cron: '0 0 * * * 1,3,5' # Mon, Wed, Fri at midnight
```

### Manual Trigger

You can manually trigger an update check:

1. Go to **Actions** tab in GitHub
2. Select **"Docker Image Auto-Update & Release"** workflow
3. Click **"Run workflow"** button
4. Select branch (usually `main`)
5. Click **"Run workflow"**

---

## Tracked Images

### Docker Hub Images

```bash
# Query format for Docker Hub API
curl -s "https://hub.docker.com/v2/repositories/{image}/tags/?page_size=100" | \
  jq -r '.results[] | select(.name | test("^[0-9]+\\.[0-9]+")) | .name' | \
  sort -V | tail -n 1
```

Currently tracked:
- `postgres`
- `prom/prometheus`
- `grafana/grafana`
- `prom/alertmanager`
- `prom/node-exporter`

### GitHub Container Registry Images

```bash
# Query format for GitHub Releases API
curl -s "https://api.github.com/repos/{org}/{repo}/releases" | \
  jq -r '[.[].tag_name | select(startswith("v"))][0]' | \
  sed 's/^v//'
```

Currently tracked:
- `ghcr.io/open-webui/open-webui`

### Images with `latest` Tag

Some images intentionally use `latest`:
- `lscr.io/linuxserver/code-server:latest`

These are automatically updated by the publisher and don't require version tracking.

---

## Release Process

### Automatic Version Bump

When Docker images are updated, the version is automatically bumped:

```
v1.0.0 → v1.0.1 → v1.0.2 → v1.0.3
```

Only **patch versions** are bumped automatically. Major and minor versions require manual intervention.

### Commit Message Format

```
chore(docker): update Docker images to latest versions

Updated Docker images:
- postgres: 17-alpine → 18-alpine
- prom/prometheus: v3.5.1 → v3.6.0

- All compose files validated
- Automatic update via GitHub Actions

[skip ci]
```

### Release Notes

Each release includes:

```markdown
## Release v{version}

**Date:** {YYYY-MM-DD}

### 📦 Docker Images Updated

- postgres: {old} → {new}
- prom/prometheus: {old} → {new}
- ...

### 📝 Changes

See [CHANGELOG.md](https://github.com/...) for full details.
```

---

## Monitoring Updates

### Check Update Status

1. **GitHub Actions**: View workflow runs in the Actions tab
2. **Release Notes**: Check the Releases section for new versions
3. **CHANGELOG.md**: Automatic changelog updates

### Example Release

```markdown
## 🐳 Docker Image Auto-Update Summary

**Status:** ✅ Updates Applied

### Updates Applied:
- postgres: 17-alpine → 18-alpine
- grafana/grafana: 12.3.2 → 13.0.0

### What happens next:
1. ✅ Docker images updated in docker-compose files
2. ✅ Changes pushed to main branch
3. ⏳ Auto-version workflow creating new release
4. 🚀 New GitHub release will be published
```

---

## Troubleshooting

### No Updates Applied

If updates are available but not applied:

1. **Check workflow logs** in GitHub Actions
2. **Verify API access** to Docker Hub and GitHub
3. **Check rate limits** on Docker Hub API
4. **Ensure workflow is enabled** in repository settings

### Version Conflicts

If a version fails validation:

1. The workflow will **skip that update**
2. Other images will still be updated
3. Check logs for specific error messages
4. File an issue if needed

### Rollback Procedure

If an update causes issues:

```bash
# 1. Revert to previous version
git revert HEAD~1

# 2. Push the revert
git push

# 3. Manually pin specific version in docker-compose.yml
# For example:
image: postgres:17-alpine  # Pin to specific version

# 4. Re-deploy
docker compose up -d
```

---

## Customization

### Add New Image to Track

1. Edit `.github/workflows/docker-auto-update.yml`:

```yaml
# Add to the "Check for Docker image updates" step
- name: Check for {image_name} updates
  run: |
    current_{name}=$(grep -E "image: {repo}:" {file} | awk '{print $2}')
    latest_{name}=$(get_latest_dockerhub "{repo}" "$current_{name}")
    if [ "$latest_{name}" != "$current_{name}" ]; then
      HAS_UPDATES=true
      UPDATE_DETAILS="${UPDATE_DETAILS}- {display_name}: ${current_{name}} → ${latest_{name}}\n"
    fi
```

2. Add corresponding update logic in the "Update Docker images" step.

### Exclude Image from Updates

To pin an image to a specific version and exclude from auto-updates:

```yaml
# In docker-compose.yml
services:
  my-service:
    image: my-image:1.2.3  # Pinned - won't be auto-updated
```

Then add the image to the **ignore list** in `.github/workflows/docker-auto-update.yml`:

```bash
# Skip pinned images
if [[ "$image" == *"my-image:"* ]]; then
  continue
fi
```

---

## Security Considerations

### Automatic Update Safety

The system includes several safety measures:

1. **Validation**: All compose files validated before commit
2. **Version Pinning**: Only uses stable release versions
3. **Skip CI**: Prevents CI from running unnecessarily
4. **Rollback**: Easy revert if issues occur

### Security Scanning

The workflow includes security scanning:

```yaml
- name: Check for security advisories
  run: |
    # Uses Trivy to scan for vulnerabilities
    trivy image --severity CRITICAL "$image"
```

Images with **CRITICAL** vulnerabilities will:
- Generate a warning in the workflow
- Still be updated (for transparency)
- Create a GitHub issue for tracking

---

## Best Practices

### For Production Deployments

1. **Monitor Updates**: Watch for new releases
2. **Test Locally**: Pull updates locally before production
3. **Backup First**: Always backup before major updates
4. **Check Logs**: Review workflow logs for any issues
5. **Rollback Plan**: Know how to revert if needed

### Update Strategies

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| **Automatic** | Fully automated updates | Development, testing |
| **Manual** | Review and approve updates | Production, critical systems |
| **Scheduled** | Update on specific schedule | Maintenance windows |
| **Pinned** | Pin to specific versions | Compliance requirements |

---

## Related Documentation

- [Configuration Guide](01-configuration.md) - Environment setup
- [Deployment](02-deployment.md) - Deployment strategies
- [Security](04-security.md) - Security best practices
- [Monitoring](03-monitoring.md) - Observability

---

## FAQ

**Q: Can I disable automatic updates?**

A: Yes! Disable the workflow in GitHub repository settings:
1. Go to **Settings** → **Actions** → **General**
2. Under **Actions permissions**, select **Disable all workflows**
3. Or delete/disable the specific workflow file

**Q: How often are updates checked?**

A: Daily at 00:00 UTC by default. You can change this in the workflow file.

**Q: What if an update breaks something?**

A: The system creates git commits for each update, so you can easily revert:
```bash
git revert HEAD
git push
```

**Q: Can I trigger updates manually?**

A: Yes! Go to Actions → "Docker Image Auto-Update & Release" → Run workflow

**Q: Are security vulnerabilities checked?**

A: Yes! The workflow uses Trivy to scan for CRITICAL vulnerabilities and creates issues if found.

**Q: Can I exclude specific images from updates?**

A: Yes! Pin the version in docker-compose.yml:
```yaml
image: postgres:17-alpine  # Won't be auto-updated
```

---

**Last Updated:** 2026-02-01 | **Workflow Version:** 1.0

---

## Appendix: Complete Docker Image Version History

| Date | Release | PostgreSQL | Prometheus | Grafana | AlertManager | Node Exporter |
|------|---------|------------|------------|---------|--------------|---------------|
| 2026-02-01 | v1.0.0 | 17-alpine | v3.5.1 | 12.3.2 | v0.30.1 | v1.10.2 |

---

## Version History

- **v1.0.0** (2026-02-01): Initial implementation with full automation
