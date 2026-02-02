#!/usr/bin/env node

/**
 * Docker Image Version Updater
 *
 * Updates version.json with new Docker image tags.
 * This script is called by the docker-version-check workflow when
 * new stable image versions are detected.
 *
 * @version 1.0.0
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const VERSION_FILE = join(process.cwd(), 'version.json');

async function main() {
  const changesJson = process.argv[2];

  if (!changesJson) {
    console.error('Usage: node update-docker-versions.js <changes-json>');
    process.exit(1);
  }

  let changes;
  try {
    changes = JSON.parse(changesJson);
  } catch (e) {
    console.error('Invalid JSON provided:', changesJson);
    process.exit(1);
  }

  if (!Array.isArray(changes) || changes.length === 0) {
    console.log('No changes to apply.');
    return;
  }

  console.log('🔄 Updating Docker image versions...\n');

  // Read version.json
  const versionData = JSON.parse(await readFile(VERSION_FILE, 'utf-8'));

  // Update each image tag
  for (const change of changes) {
    const { name, latest } = change;
    if (!versionData.docker.images[name]) {
      console.warn(`⚠️  Unknown image: ${name}`);
      continue;
    }

    const oldTag = versionData.docker.images[name].tag;
    versionData.docker.images[name].tag = latest;

    console.log(`✅ ${name}: ${oldTag} → ${latest}`);
  }

  // Write updated version.json
  await writeFile(VERSION_FILE, JSON.stringify(versionData, null, 2) + '\n');

  console.log('\n✓ version.json updated successfully');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
