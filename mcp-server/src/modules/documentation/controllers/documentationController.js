/**
 * ============================================================================
 * VIBE STACK - Documentation Controller
 * ============================================================================
 * Auto-generate documentation from code
 * @version 1.0.0
 * ============================================================================
 */

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../../../utils/logger.js';

const execAsync = promisify(exec);

/**
 * Documentation Controller
 * Handles documentation generation
 */
export class DocumentationController {
  constructor() {
    this.workspace = path.resolve(process.env.WORKSPACE_PATH || './repos');
  }

  /**
   * Get repository path
   * @private
   */
  _getRepoPath(repo = '.') {
    return path.resolve(path.join(this.workspace, repo));
  }

  /**
   * Generate README.md from repository
   * @param {Object} args - Generate arguments
   * @returns {Promise<Object>} Generated README
   */
  async generateReadme(args = {}) {
    const { repo = '.', force = false } = args;

    try {
      const repoPath = this._getRepoPath(repo);
      const readmePath = path.join(repoPath, 'README.md');

      // Check if README already exists
      try {
        await fs.access(readmePath);
        if (!force) {
          return {
            success: true,
            message: 'README.md already exists. Use force=true to overwrite.',
            exists: true,
            path: readmePath
          };
        }
      } catch {
        // README doesn't exist, proceed
      }

      // Analyze repository
      const analysis = await this._analyzeRepository(repoPath);

      // Generate README content
      const readme = this._buildReadme(analysis, repo);

      // Write README
      await fs.writeFile(readmePath, readme, 'utf-8');

      Logger.info(`Generated README for: ${repo}`);

      return {
        success: true,
        message: 'README.md generated successfully',
        path: readmePath,
        content: readme,
        summary: {
          title: analysis.title,
          sections: this._countSections(readme),
          size: readme.length
        }
      };
    } catch (error) {
      Logger.error(`Failed to generate README: ${error.message}`);
      throw new Error(`Failed to generate README: ${error.message}`);
    }
  }

  /**
   * Generate API documentation
   * @param {Object} args - Generate arguments
   * @returns {Promise<Object>} Generated API docs
   */
  async generateApiDocs(args = {}) {
    const { repo = '.', format = 'markdown', outputFile = 'API.md' } = args;

    try {
      const repoPath = this._getRepoPath(repo);
      const outputPath = path.join(repoPath, outputFile);

      // Analyze code for API endpoints
      const endpoints = await this._extractApiEndpoints(repoPath);

      if (endpoints.length === 0) {
        return {
          success: true,
          message: 'No API endpoints found in the repository.',
          endpoints: [],
          recommendation: 'This repository might not contain a REST API or the endpoints could not be detected automatically.'
        };
      }

      // Generate API documentation
      let docs = '';
      if (format === 'markdown') {
        docs = this._buildMarkdownApiDocs(endpoints, repo);
      }

      // Write API docs
      await fs.writeFile(outputPath, docs, 'utf-8');

      Logger.info(`Generated API docs for: ${repo}`);

      return {
        success: true,
        message: 'API documentation generated successfully',
        path: outputPath,
        format,
        endpoints,
        summary: {
          totalEndpoints: endpoints.length,
          byMethod: this._groupByMethod(endpoints),
          byPath: this._groupByPath(endpoints)
        }
      };
    } catch (error) {
      Logger.error(`Failed to generate API docs: ${error.message}`);
      throw new Error(`Failed to generate API docs: ${error.message}`);
    }
  }

  /**
   * Analyze repository for README generation
   * @private
   */
  async _analyzeRepository(repoPath) {
    const analysis = {
      title: path.basename(repoPath),
      description: '',
      language: null,
      languages: [],
      frameworks: [],
      dependencies: [],
      scripts: [],
      hasTests: false,
      license: null
    };

    try {
      // Try package.json
      const packagePath = path.join(repoPath, 'package.json');
      try {
        const pkg = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
        analysis.title = pkg.name || analysis.title;
        analysis.description = pkg.description || '';
        analysis.language = 'JavaScript';
        analysis.dependencies = Object.keys(pkg.dependencies || {});
        analysis.scripts = Object.keys(pkg.scripts || {});
        analysis.hasTests = !!(pkg.scripts?.test || pkg.devDependencies?.jest || pkg.devDependencies?.vitest || pkg.devDependencies?.mocha);
      } catch {}

      // Try requirements.txt
      if (!analysis.language) {
        const reqPath = path.join(repoPath, 'requirements.txt');
        try {
          const reqs = await fs.readFile(reqPath, 'utf-8');
          analysis.language = 'Python';
          analysis.dependencies = reqs.split('\n').filter(l => l && !l.startsWith('#'));
          analysis.hasTests = analysis.dependencies.some(d => d.includes('pytest') || d.includes('test'));
        } catch {}
      }

      // Try Cargo.toml
      if (!analysis.language) {
        const cargoPath = path.join(repoPath, 'Cargo.toml');
        try {
          await fs.access(cargoPath);
          analysis.language = 'Rust';
        } catch {}
      }

      // Try go.mod
      if (!analysis.language) {
        const goPath = path.join(repoPath, 'go.mod');
        try {
          await fs.access(goPath);
          analysis.language = 'Go';
        } catch {}
      }

      // Detect license
      const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING', 'COPYRIGHT'];
      for (const licenseFile of licenseFiles) {
        try {
          await fs.access(path.join(repoPath, licenseFile));
          analysis.license = 'detected';
          break;
        } catch {}
      }

    } catch (error) {
      Logger.warn(`Repository analysis incomplete: ${error.message}`);
    }

    return analysis;
  }

  /**
   * Build README content
   * @private
   */
  _buildReadme(analysis, repo) {
    const { title, description, language, dependencies, scripts, hasTests, license } = analysis;

    let readme = `# ${title}\n\n`;

    if (description) {
      readme += `${description}\n\n`;
    }

    // Installation section
    if (dependencies.length > 0) {
      readme += '## Installation\n\n';
      if (language === 'JavaScript' || language === 'TypeScript') {
        readme += '```bash\nnpm install\n```\n\n';
      } else if (language === 'Python') {
        readme += '```bash\npip install -r requirements.txt\n```\n\n';
      }
      readme += '## Dependencies\n\n';
      readme += '| Package | Version |\n|---------|----------|\n';
      for (const dep of dependencies.slice(0, 20)) {
        readme += `| ${dep} | latest |\n`;
      }
      readme += '\n';
    }

    // Usage section
    if (scripts.length > 0) {
      readme += '## Usage\n\n';
      readme += '### Available Scripts\n\n';
      readme += '```bash\n';
      for (const script of scripts) {
        readme += `npm run ${script}  # Run ${script}\n`;
      }
      readme += '```\n\n';
    }

    // Testing section
    if (hasTests) {
      readme += '## Testing\n\n';
      readme += '```bash\n';
      if (language === 'JavaScript' || language === 'TypeScript') {
        readme += 'npm test\n';
      } else if (language === 'Python') {
        readme += 'pytest\n';
      }
      readme += '```\n\n';
    }

    // License section
    if (license) {
      readme += '## License\n\nThis project is licensed under the MIT License.\n\n';
    }

    return readme;
  }

  /**
   * Extract API endpoints from code
   * @private
   */
  async _extractApiEndpoints(repoPath) {
    const endpoints = [];

    // Try to find Express/Flask/FastAPI routes
    const files = [];
    const extensions = ['.js', '.ts', '.py'];
    const dirs = ['src', 'app', 'api', 'server', 'controllers', 'routes'];

    for (const dir of dirs) {
      const dirPath = path.join(repoPath, dir);
      try {
        await fs.access(dirPath);
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(path.join(dirPath, entry.name));
          }
        }
      } catch {}
    }

    // Search for route definitions
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Express routes
        const expressRoutes = content.match(/(?:app|router)\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g);
        if (expressRoutes) {
          for (const match of expressRoutes) {
            const methodMatch = match.match(/\.(get|post|put|delete|patch)\s*\(/);
            const pathMatch = match.match(/['"`]([^'"`]+)['"`]/);
            if (methodMatch && pathMatch) {
              endpoints.push({
                method: methodMatch[1].toUpperCase(),
                path: pathMatch[1],
                file: path.relative(repoPath, file)
              });
            }
          }
        }

        // Flask/FastAPI routes
        const pythonRoutes = content.match(/@(?:(?:app|router)\.)?(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g);
        if (pythonRoutes) {
          for (const match of pythonRoutes) {
            const methodMatch = match.match(/(get|post|put|delete|patch)\s*\(/);
            const pathMatch = match.match(/['"`]([^'"`]+)['"`]/);
            if (methodMatch && pathMatch) {
              endpoints.push({
                method: methodMatch[1].toUpperCase(),
                path: pathMatch[1],
                file: path.relative(repoPath, file)
              });
            }
          }
        }
      } catch {}
    }

    return endpoints;
  }

  /**
   * Build markdown API documentation
   * @private
   */
  _buildMarkdownApiDocs(endpoints, repo) {
    let docs = `# API Documentation\n\n`;
    docs += `Auto-generated API documentation for ${repo}\n\n`;

    // Group by path
    const grouped = {};
    for (const ep of endpoints) {
      const base = ep.path.split('/')[1] || 'root';
      if (!grouped[base]) grouped[base] = [];
      grouped[base].push(ep);
    }

    for (const [group, eps] of Object.entries(grouped)) {
      docs += `## ${group.charAt(0).toUpperCase() + group.slice(1)}\n\n`;

      for (const ep of eps) {
        docs += `### ${ep.method} ${ep.path}\n\n`;
        docs += `**File:** \`${ep.file}\`\n\n`;
        docs += `**Description:** Endpoint for ${ep.path.split('/').pop() || 'resource'}\n\n`;
      }

      docs += '---\n\n';
    }

    return docs;
  }

  /**
   * Count sections in README
   * @private
   */
  _countSections(readme) {
    const matches = readme.match(/^##\s+.+$/gm);
    return matches ? matches.length : 0;
  }

  /**
   * Group endpoints by method
   * @private
   */
  _groupByMethod(endpoints) {
    const grouped = {};
    for (const ep of endpoints) {
      if (!grouped[ep.method]) grouped[ep.method] = [];
      grouped[ep.method].push(ep);
    }
    return grouped;
  }

  /**
   * Group endpoints by path
   * @private
   */
  _groupByPath(endpoints) {
    const grouped = {};
    for (const ep of endpoints) {
      const base = ep.path.split('/')[1] || '/';
      if (!grouped[base]) grouped[base] = [];
      grouped[base].push(ep);
    }
    return grouped;
  }
}

/**
 * Create documentation controller instance
 * @returns {DocumentationController} Documentation controller instance
 */
export function createDocumentationController() {
  return new DocumentationController();
}
