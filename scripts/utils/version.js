#!/usr/bin/env node
/**
 * Version Utility
 *
 * Single source of truth for version management.
 * All version reads and updates go through this utility.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION_FILE = path.resolve(__dirname, '../../version.json');
const PACKAGE_ROOT = path.resolve(__dirname, '../..');
const MCP_SERVER_DIR = path.resolve(PACKAGE_ROOT, 'mcp-server');

/**
 * Read version from version.json
 */
export async function getVersion() {
  try {
    const content = await fs.readFile(VERSION_FILE, 'utf-8');
    const data = JSON.parse(content);
    return data.version;
  } catch (error) {
    throw new Error(`Failed to read version: ${error.message}`);
  }
}

/**
 * Read full version data
 */
export async function getVersionData() {
  try {
    const content = await fs.readFile(VERSION_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read version data: ${error.message}`);
  }
}

/**
 * Get component version
 */
export async function getComponentVersion(component) {
  const data = await getVersionData();
  return data.components?.[component] || data.version;
}

/**
 * Increment version (semantic versioning)
 */
export async function incrementVersion(type = 'patch') {
  const data = await getVersionData();
  const version = data.version;

  const [major, minor, patch] = version.split('.').map(Number);

  let newVersion;
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }

  data.version = newVersion;
  data.components.mcp_server = newVersion;
  data.components.docs = newVersion;

  await fs.writeFile(VERSION_FILE, JSON.stringify(data, null, 2), 'utf-8');

  return newVersion;
}

/**
 * Set specific version
 */
export async function setVersion(version) {
  const data = await getVersionData();

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('Invalid version format. Use SEMVER (e.g., 1.2.3)');
  }

  data.version = version;
  data.components.mcp_server = version;
  data.components.docs = version;

  await fs.writeFile(VERSION_FILE, JSON.stringify(data, null, 2), 'utf-8');

  return version;
}

/**
 * Sync version to package.json files
 */
export async function syncToPackageJson() {
  const version = await getVersion();

  // Root package.json
  const rootPackagePath = path.join(PACKAGE_ROOT, 'package.json');
  const rootPackage = JSON.parse(await fs.readFile(rootPackagePath, 'utf-8'));
  rootPackage.version = version;
  await fs.writeFile(rootPackagePath, JSON.stringify(rootPackage, null, 2), 'utf-8');

  // MCP Server package.json
  const mcpPackagePath = path.join(MCP_SERVER_DIR, 'package.json');
  const mcpPackage = JSON.parse(await fs.readFile(mcpPackagePath, 'utf-8'));
  mcpPackage.version = version;
  await fs.writeFile(mcpPackagePath, JSON.stringify(mcpPackage, null, 2), 'utf-8');

  return { root: rootPackagePath, mcp: mcpPackagePath };
}

/**
 * Generate version badge markdown
 */
export async function generateBadge() {
  const version = await getVersion();
  return `[![Version](https://img.shields.io/badge/Version-${version.replace(/\./g, '%2E')}-orange)](https://github.com/Resinder/vibe-stack)`;
}

/**
 * Get version info for documentation
 */
export async function getDocsVersionInfo() {
  const data = await getVersionData();
  return {
    version: data.version,
    lastUpdated: data.changelog.current.date,
    features: data.changelog.current.features,
    tests: '270+',
    status: 'Production Ready'
  };
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  (async () => {
    try {
      switch (command) {
        case 'get':
          console.log(await getVersion());
          break;
        case 'patch':
        case 'minor':
        case 'major':
          const newVer = await incrementVersion(command);
          console.log(`Version incremented to ${newVer}`);
          await syncToPackageJson();
          console.log('Synced to package.json files');
          break;
        case 'set':
          const ver = process.argv[3];
          if (!ver) throw new Error('Version required');
          await setVersion(ver);
          console.log(`Version set to ${ver}`);
          await syncToPackageJson();
          console.log('Synced to package.json files');
          break;
        case 'sync':
          await syncToPackageJson();
          console.log('Synced to package.json files');
          break;
        case 'badge':
          console.log(await generateBadge());
          break;
        case 'docs':
          console.log(JSON.stringify(await getDocsVersionInfo(), null, 2));
          break;
        default:
          console.log(`
Usage: node version.js <command>

Commands:
  get              - Get current version
  patch            - Increment patch version
  minor            - Increment minor version
  major            - Increment major version
  set <version>    - Set specific version
  sync             - Sync version to package.json files
  badge            - Generate version badge markdown
  docs             - Get version info for documentation
          `);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  })();
}

export default {
  getVersion,
  getVersionData,
  getComponentVersion,
  incrementVersion,
  setVersion,
  syncToPackageJson,
  generateBadge,
  getDocsVersionInfo
};
