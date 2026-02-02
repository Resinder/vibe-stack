#!/usr/bin/env node

/**
 * Docker Image Version Checker
 *
 * Fetches the latest stable version tags for Docker images from their respective registries.
 * This script crawls Docker Hub and GitHub Container Registry to find the latest stable
 * releases for images used in the Vibe Stack project.
 *
 * @version 1.0.0
 */

import https from 'https';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const VERSION_FILE = join(process.cwd(), 'version.json');

// Image definitions with their API endpoints
const DOCKER_HUB_IMAGES = [
  { name: 'node', repo: 'node', tagPattern: /^(\d+\.\d+\.\d+)-alpine$/ },
  { name: 'postgres', repo: 'postgres', tagPattern: /^(\d+\.\d+)\-alpine$/ },
];

const GHCR_IMAGES = [
  { name: 'openWebUI', repo: 'open-webui/open-webui', tagPattern: /^v(\d+\.\d+\.\d+)$/ },
];

const OTHER_IMAGES = [
  {
    name: 'codeServer',
    repo: 'linuxserver/docker-code-server',
    source: 'https://github.com/linuxserver/docker-code-server',
    tagPattern: /^(\d+\.\d+\.\d+)$/,
    apiType: 'github'
  },
  {
    name: 'grafana',
    repo: 'grafana/grafana',
    source: 'https://github.com/grafana/grafana',
    tagPattern: /^(\d+\.\d+\.\d+)$/,
    apiType: 'dockerhub'
  },
  {
    name: 'prometheus',
    repo: 'prom/prometheus',
    source: 'https://github.com/prometheus/prometheus',
    tagPattern: /^v(\d+\.\d+\.\d+)$/,
    apiType: 'dockerhub'
  },
  {
    name: 'cadvisor',
    repo: 'google/cadvisor',
    source: 'https://github.com/google/cadvisor',
    tagPattern: /^v(\d+\.\d+\.\d+)$/,
    apiType: 'dockerhub'
  },
  {
    name: 'nodeExporter',
    repo: 'prom/node-exporter',
    source: 'https://github.com/prometheus/node_exporter',
    tagPattern: /^v(\d+\.\d+\.\d+)$/,
    apiType: 'dockerhub'
  },
  {
    name: 'alertmanager',
    repo: 'prom/alertmanager',
    source: 'https://github.com/prometheus/alertmanager',
    tagPattern: /^v(\d+\.\d+\.\d+)$/,
    apiType: 'dockerhub'
  },
];

/**
 * Fetch JSON from an HTTPS URL
 */
async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Get Docker Hub token for authenticated requests
 */
async function getDockerHubToken(repository) {
  const url = `https://auth.docker.io/token?service=registry.docker.io&scope=repository:${repository}:pull`;
  const data = await fetchJSON(url);
  return data.token;
}

/**
 * Fetch tags from Docker Hub
 */
async function fetchDockerHubTags(repository, tagPattern) {
  try {
    const token = await getDockerHubToken(repository);
    const url = `https://registry-1.docker.io/v2/${repository}/tags/list`;

    const options = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
      }
    };

    return new Promise((resolve, reject) => {
      https.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const tags = json.tags || [];
            // Filter tags matching pattern and sort by version
            const matchingTags = tags
              .filter(tag => tagPattern.test(tag))
              .sort((a, b) => {
                const aMatch = a.match(tagPattern);
                const bMatch = b.match(tagPattern);
                const aVer = aMatch[1] || aMatch[0];
                const bVer = bMatch[1] || bMatch[0];
                return bVer.localeCompare(aVer, undefined, { numeric: true, sensitivity: 'base' });
              });
            resolve(matchingTags[0] || null);
          } catch (e) {
            reject(new Error(`Failed to fetch tags for ${repository}: ${e.message}`));
          }
        });
      }).on('error', reject);
    });
  } catch (error) {
    console.error(`Error fetching Docker Hub tags for ${repository}:`, error.message);
    return null;
  }
}

/**
 * Fetch latest GitHub release tag
 */
async function fetchGitHubReleaseTag(repo) {
  try {
    const url = `https://api.github.com/repos/${repo}/releases/latest`;
    const data = await fetchJSON(url);
    return data.tag_name || null;
  } catch (error) {
    console.error(`Error fetching GitHub release for ${repo}:`, error.message);
    return null;
  }
}

/**
 * Get latest stable version for an image
 */
async function getLatestImageVersion(image) {
  console.log(`Checking ${image.name}...`);

  try {
    if (image.apiType === 'github' || image.source?.includes('github.com')) {
      // For GitHub releases
      const repoPath = image.repo.replace('linuxserver/', 'linuxserver/docker-');
      return await fetchGitHubReleaseTag(repoPath);
    } else {
      // For Docker Hub
      return await fetchDockerHubTags(image.repo, image.tagPattern);
    }
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return null;
  }
}

/**
 * Main function to check all Docker image versions
 */
async function main() {
  console.log('🔍 Checking Docker image versions from registries...\n');

  const versionData = JSON.parse(await readFile(VERSION_FILE, 'utf-8'));
  const currentImages = versionData.docker.images;

  const results = {
    changes: [],
    current: {},
    latest: {},
    hasChanges: false
  };

  // Check all images
  for (const image of [...DOCKER_HUB_IMAGES, ...GHCR_IMAGES, ...OTHER_IMAGES]) {
    const currentTag = currentImages[image.name]?.tag;
    if (!currentTag) {
      console.log(`⚠️  ${image.name}: No current tag found in version.json`);
      continue;
    }

    results.current[image.name] = currentTag;

    // Get latest version from registry
    const latestTag = await getLatestImageVersion(image);

    if (!latestTag) {
      console.log(`⚠️  ${image.name}: Could not determine latest version`);
      results.latest[image.name] = currentTag; // Fallback to current
      continue;
    }

    results.latest[image.name] = latestTag;

    if (latestTag !== currentTag) {
      console.log(`✅ ${image.name}: ${currentTag} → ${latestTag} (UPDATE AVAILABLE)`);
      results.changes.push({
        name: image.name,
        repository: image.repo,
        current: currentTag,
        latest: latestTag
      });
      results.hasChanges = true;
    } else {
      console.log(`✓ ${image.name}: ${currentTag} (up to date)`);
    }
  }

  console.log(`\n${results.hasChanges ? '⚠️  Changes detected!' : '✅ All images up to date!'}`);

  // Output results as JSON for GitHub Actions
  console.log('\n=== RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  // Set exit code for CI
  process.exit(results.hasChanges ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
