/**
 * ============================================================================
 * VIBE STACK - Project-Based Credential Manager
 * ============================================================================
 * Manages credentials across different projects and workspaces
 * @version 1.0.0
 * ============================================================================
 */

import crypto from 'crypto';
import { Logger } from '../../utils/logger.js';

/**
 * Project credential manager
 * Allows organizing credentials by project/workspace
 */
export class ProjectCredentialManager {
  #storage;

  constructor(storage) {
    this.#storage = storage;
  }

  /**
   * Get storage key for project
   * @param {string} userId - User ID
   * @param {string} project - Project/workspace name
   * @param {string} provider - Provider ID
   * @returns {string} Storage key
   */
  #getProjectKey(userId, project, provider) {
    return `${userId}:project:${project}:${provider}`;
  }

  /**
   * Set credential for a specific project
   * @param {Object} args - Arguments
   * @returns {Promise<Object>} Result
   */
  async setProjectCredential(args = {}) {
    const { userId, project, provider, credential, environment = 'default' } = args;

    if (!project) {
      throw new Error('Project name is required');
    }

    // Create scope that includes environment
    const scope = environment !== 'default' 
      ? `project:${project}:${environment}`
      : `project:${project}`;

    return this.#storage.storeCredential(provider, credential, userId, scope, {
      project,
      environment,
      type: 'project_credential'
    });
  }

  /**
   * Get credential for a project
   * @param {Object} args - Arguments
   * @returns {Promise<string|null>} Credential
   */
  async getProjectCredential(args = {}) {
    const { userId, project, provider, environment = 'default' } = args;

    const scope = environment !== 'default'
      ? `project:${project}:${environment}`
      : `project:${project}`;

    return this.#storage.getCredential(provider, userId, scope);
  }

  /**
   * Get all credentials for a project
   * @param {Object} args - Arguments
   * @returns {Promise<Object>} Project credentials
   */
  async getProjectCredentials(args = {}) {
    const { userId, project } = args;

    if (!project) {
      throw new Error('Project name is required');
    }

    const allCredentials = await this.#storage.listCredentials(userId);

    // Filter credentials that belong to this project
    const projectCredentials = allCredentials.filter(c => 
      c.scope?.startsWith(`project:${project}:`) || 
      c.scope === `project:${project}`
    );

    // Group by environment
    const byEnvironment = {};
    for (const cred of projectCredentials) {
      const match = cred.scope?.match(/project:([^:]+)(?::([^:]+))?$/);
      if (match) {
        const env = match[2] || 'default';
        if (!byEnvironment[cred.providerId]) {
          byEnvironment[cred.providerId] = {};
        }
        byEnvironment[cred.providerId][env] = {
          scope: cred.scope,
          createdAt: cred.createdAt,
          updatedAt: cred.updatedAt
        };
      }
    }

    return {
      project,
      userId,
      credentials: byEnvironment,
      totalCredentials: projectCredentials.length
    };
  }

  /**
   * List all projects
   * @param {Object} args - Arguments
   * @returns {Promise<Array>} List of projects
   */
  async listProjects(args = {}) {
    const { userId } = args;

    const allCredentials = await this.#storage.listCredentials(userId);

    // Extract unique projects
    const projects = new Map();

    for (const cred of allCredentials) {
      if (cred.scope?.startsWith('project:')) {
        const match = cred.scope.match(/project:([^:]+)(?::([^:]+))?$/);
        if (match) {
          const projectName = match[1];
          const environment = match[2] || 'default';

          if (!projects.has(projectName)) {
            projects.set(projectName, {
              name: projectName,
              environments: new Set(),
              providers: new Set(),
              credentialCount: 0
            });
          }

          const project = projects.get(projectName);
          project.environments.add(environment);
          project.providers.add(cred.providerId);
          project.credentialCount++;
        }
      }
    }

    return Array.from(projects.values()).map(p => ({
      name: p.name,
      environments: Array.from(p.environments).sort(),
      providers: Array.from(p.providers).sort(),
      credentialCount: p.credentialCount
    }));
  }

  /**
   * Clone project credentials
   * Useful for setting up staging from prod, or new project from template
   * @param {Object} args - Arguments
   * @returns {Promise<Object>} Clone result
   */
  async cloneProjectCredentials(args = {}) {
    const { userId, sourceProject, targetProject, providers } = args;

    const sourceCreds = await this.getProjectCredentials({ userId, project: sourceProject });

    const results = [];
    const providersToClone = providers || Object.keys(sourceCreds.credentials);

    for (const provider of providersToClone) {
      const envs = sourceCreds.credentials[provider] || {};
      for (const [env, credInfo] of Object.entries(envs)) {
        try {
          // Get the actual credential value
          const credentialValue = await this.#storage.getCredential(provider, userId, credInfo.scope);

          if (credentialValue) {
            // Create new scope for target project
            const targetScope = env !== 'default'
              ? `project:${targetProject}:${env}`
              : `project:${targetProject}`;

            await this.#storage.storeCredential(provider, credentialValue, userId, targetScope, {
              project: targetProject,
              environment: env,
              type: 'project_credential',
              clonedFrom: sourceProject
            });

            results.push({
              provider,
              environment: env,
              status: 'cloned'
            });
          }
        } catch (error) {
          results.push({
            provider,
            environment: env,
            status: 'failed',
            error: error.message
          });
        }
      }
    }

    return {
      sourceProject,
      targetProject,
      results,
      cloned: results.filter(r => r.status === 'cloned').length,
      failed: results.filter(r => r.status === 'failed').length
    };
  }

  /**
   * Delete all credentials for a project
   * @param {Object} args - Arguments
   * @returns {Promise<Object>} Delete result
   */
  async deleteProject(args = {}) {
    const { userId, project, confirm = false } = args;

    if (!confirm) {
      return {
        success: false,
        message: 'Please confirm by setting confirm=true',
        warning: `This will delete all credentials for project: ${project}`
      };
    }

    const projectCreds = await this.getProjectCredentials({ userId, project });

    const results = [];
    for (const provider of Object.keys(projectCreds.credentials)) {
      for (const env of Object.keys(projectCreds.credentials[provider])) {
        const scope = env !== 'default'
          ? `project:${project}:${env}`
          : `project:${project}`;

        const deleted = await this.#storage.deleteCredential(provider, userId, scope);
        results.push({ provider, environment: env, deleted });
      }
    }

    return {
      success: true,
      project,
      deletedCount: results.filter(r => r.deleted).length,
      results
    };
  }
}

export default ProjectCredentialManager;
