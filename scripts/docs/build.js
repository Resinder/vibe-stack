#!/usr/bin/env node
/**
 * Documentation Build Script
 *
 * Dynamically injects version information into documentation files
 * from the central version.json file (single source of truth).
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDocsVersionInfo, generateBadge } from '../utils/version.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '../..');
const DOCS_DIR = path.join(ROOT, 'docs');

/**
 * Update README.md with dynamic version info
 */
async function updateReadme() {
  const readmePath = path.join(ROOT, 'README.md');
  const versionInfo = await getDocsVersionInfo();
  const badge = await generateBadge();

  let content = await fs.readFile(readmePath, 'utf-8');

  // Update version badge
  content = content.replace(
    /\[!\[Version\]\(https:\/\/img\.shields\.io\/badge\/Version-[^)]+\)\]\(https:\/\/github\.com\/Resinder\/vibe-stack\)/g,
    badge
  );

  // Update feature list
  const featuresSection = `**✨ v${versionInfo.version} Features:**
- 🏗️ **Clean Architecture** - Modular 5-layer design
- 🗄️ **PostgreSQL Storage** - Async, non-blocking state management with caching
- 🔒 **Credential Management** - AES-256-GCM encrypted GitHub token storage
- 🔒 **Rate Limiting** - Tiered protection for API endpoints
- 📊 **Monitoring** - Prometheus metrics + Grafana dashboards
- 🧪 **E2E Testing** - Comprehensive Docker deployment tests (${versionInfo.tests} tests)
- 📐 **Architecture Diagrams** - Mermaid.js documentation
- ⚡ **High Performance** - Connection pooling, caching, async I/O
- 🔐 **Security First** - Input sanitization, path traversal prevention
- 🔄 **WebSocket Support** - Real-time task synchronization
- 📝 **Test Coverage Dashboard** - HTML coverage visualization`;

  content = content.replace(
    /\*\*✨ v[\d.]+\s+Features:\*\*[\s\S]*?(?=\n\n---)/,
    featuresSection + '\n\n---'
  );

  // Update project status version
  content = content.replace(
    /### ✅ Completed \(v[\d.]+\)/,
    `### ✅ Completed (v${versionInfo.version})`
  );

  await fs.writeFile(readmePath, content, 'utf-8');
  console.log('✓ Updated README.md');
}

/**
 * Update docs/README.md with dynamic version info
 */
async function updateDocsReadme() {
  const docsReadmePath = path.join(DOCS_DIR, 'README.md');
  const versionInfo = await getDocsVersionInfo();

  let content = await fs.readFile(docsReadmePath, 'utf-8');

  // Update version header
  content = content.replace(
    /\*\*Version: [\d.]+\*\* \*\*[\d+]+ Tests Passing\*\* \*\*Production Ready\*\*/g,
    `**Version: ${versionInfo.version}** | **${versionInfo.tests} Tests Passing** | **${versionInfo.status}**`
  );

  // Update last updated date
  content = content.replace(
    /\*\*Version:\** [\d.]+\* \*\*Last Updated:\** [\d-]+/g,
    `**Version:** ${versionInfo.version} | **Last Updated:** ${versionInfo.lastUpdated}`
  );

  await fs.writeFile(docsReadmePath, content, 'utf-8');
  console.log('✓ Updated docs/README.md');
}

/**
 * Update architecture docs
 */
async function updateArchitectureDocs() {
  const files = [
    path.join(DOCS_DIR, '03-technical/01-architecture.md'),
    path.join(DOCS_DIR, '03-technical/02-mcp-server.md')
  ];

  const versionInfo = await getDocsVersionInfo();

  for (const file of files) {
    try {
      let content = await fs.readFile(file, 'utf-8');

      // Update version references
      content = content.replace(
        /v[\d.]+/g,
        `v${versionInfo.version}`
      );
      content = content.replace(
        /Version:[\s]*[\d.]+/g,
        `Version: ${versionInfo.version}`
      );
      content = content.replace(
        /Last Updated:[\s]*[\d-]+/g,
        `Last Updated: ${versionInfo.lastUpdated}`
      );

      await fs.writeFile(file, content, 'utf-8');
      console.log(`✓ Updated ${path.relative(DOCS_DIR, file)}`);
    } catch (error) {
      console.log(`  Skipped ${path.relative(DOCS_DIR, file)}: ${error.message}`);
    }
  }
}

/**
 * Update SECURITY.md
 */
async function updateSecurityDocs() {
  const securityPath = path.join(ROOT, 'SECURITY.md');
  const versionInfo = await getDocsVersionInfo();

  try {
    let content = await fs.readFile(securityPath, 'utf-8');

    content = content.replace(
      /\*\*Version: [\d.]+\*\*\n\*\*Last Updated: [\d-]+\*\*/g,
      `**Version: ${versionInfo.version}**\n**Last Updated: ${versionInfo.lastUpdated}`
    );

    await fs.writeFile(securityPath, content, 'utf-8');
    console.log('✓ Updated SECURITY.md');
  } catch (error) {
    console.log(`  Skipped SECURITY.md: ${error.message}`);
  }
}

/**
 * Main build function
 */
async function build() {
  const versionInfo = await getDocsVersionInfo();
  process.stdout.write(`🔨 Building documentation v${versionInfo.version}...\n`);

  try {
    await updateReadme();
    await updateDocsReadme();
    await updateArchitectureDocs();
    await updateSecurityDocs();

    process.stdout.write('\n✅ Documentation build complete!\n');
  } catch (error) {
    process.stderr.write(`\n❌ Build failed: ${error.message}\n`);
    process.exit(1);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  (async () => {
    try {
      switch (command) {
        case 'readme':
          await updateReadme();
          break;
        case 'docs':
          await updateDocsReadme();
          break;
        case 'all':
        default:
          await build();
          break;
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  })();
}

export { build, updateReadme, updateDocsReadme, updateArchitectureDocs, updateSecurityDocs };
