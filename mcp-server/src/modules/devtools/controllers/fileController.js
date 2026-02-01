/**
 * ============================================================================
 * VIBE STACK - File Controller
 * ============================================================================
 * File system operations for workspace management
 * @version 1.0.0
 * ============================================================================
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Logger } from '../../../utils/logger.js';

/**
 * File Controller
 * Handles file system operations
 */
export class FileController {
  constructor() {
    // Base workspace directory
    this.workspace = path.resolve(process.env.WORKSPACE_PATH || './repos');
  }

  /**
   * Resolve and validate file path
   * @private
   */
  _resolvePath(targetPath) {
    const resolved = path.resolve(targetPath);
    // Ensure path is within workspace
    if (!resolved.startsWith(path.resolve(this.workspace))) {
      throw new Error('Path outside workspace is not allowed');
    }
    return resolved;
  }

  /**
   * Write content to a file
   * @param {Object} args - Write arguments
   * @returns {Promise<Object>} Write result
   */
  async writeFile(args = {}) {
    const { filePath, content, createDirs = true } = args;

    if (!filePath) {
      throw new Error('File path is required');
    }

    if (content === undefined || content === null) {
      throw new Error('Content is required');
    }

    try {
      const fullPath = this._resolvePath(filePath);

      // Create directories if needed
      if (createDirs) {
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
      }

      // Write file
      await fs.writeFile(fullPath, content, 'utf-8');

      Logger.info(`Wrote file: ${filePath}`);

      return {
        success: true,
        message: `File written successfully`,
        file: {
          path: filePath,
          fullPath,
          size: content.length
        }
      };
    } catch (error) {
      Logger.error(`Failed to write file: ${error.message}`);
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  /**
   * List files in a directory
   * @param {Object} args - List arguments
   * @returns {Promise<Object>} Directory contents
   */
  async listFiles(args = {}) {
    const { directory = '.', recursive = false, pattern } = args;

    try {
      const fullPath = this._resolvePath(directory);

      const files = [];
      const dirs = [];

      async function walkDir(dir, base = '') {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          // Skip hidden files
          if (entry.name.startsWith('.')) continue;
          // Skip node_modules
          if (entry.name === 'node_modules') continue;

          const relativePath = path.join(base, entry.name);
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            dirs.push(relativePath);
            if (recursive) {
              await walkDir(fullPath, relativePath);
            }
          } else {
            // Apply pattern filter if provided
            if (pattern) {
              const regex = new RegExp(pattern.replace('*', '.*'));
              if (!regex.test(entry.name)) continue;
            }
            files.push(relativePath);
          }
        }
      }

      await walkDir(fullPath, directory);

      Logger.info(`Listed directory: ${directory}`);

      return {
        success: true,
        directory,
        files,
        directories: dirs,
        summary: {
          fileCount: files.length,
          directoryCount: dirs.length
        }
      };
    } catch (error) {
      Logger.error(`Failed to list directory: ${error.message}`);
      throw new Error(`Failed to list directory: ${error.message}`);
    }
  }

  /**
   * Delete a file or directory
   * @param {Object} args - Delete arguments
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(args = {}) {
    const { path: filePath, recursive = false } = args;

    if (!filePath) {
      throw new Error('Path is required');
    }

    try {
      const fullPath = this._resolvePath(filePath);

      // Check if exists
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        await fs.rm(fullPath, { recursive: true, force: true });
        Logger.info(`Deleted directory: ${filePath}`);
      } else {
        await fs.unlink(fullPath);
        Logger.info(`Deleted file: ${filePath}`);
      }

      return {
        success: true,
        message: `Deleted successfully: ${filePath}`,
        deleted: {
          path: filePath,
          type: stats.isDirectory() ? 'directory' : 'file'
        }
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Path not found: ${filePath}`);
      }
      Logger.error(`Failed to delete: ${error.message}`);
      throw new Error(`Failed to delete: ${error.message}`);
    }
  }

  /**
   * Move or rename a file
   * @param {Object} args - Move arguments
   * @returns {Promise<Object>} Move result
   */
  async moveFile(args = {}) {
    const { source, destination } = args;

    if (!source || !destination) {
      throw new Error('Source and destination are required');
    }

    try {
      const sourcePath = this._resolvePath(source);
      const destPath = this._resolvePath(destination);

      // Ensure destination directory exists
      const destDir = path.dirname(destPath);
      await fs.mkdir(destDir, { recursive: true });

      // Move file
      await fs.rename(sourcePath, destPath);

      Logger.info(`Moved: ${source} → ${destination}`);

      return {
        success: true,
        message: `Moved successfully`,
        moved: {
          from: source,
          to: destination
        }
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Source not found: ${source}`);
      }
      Logger.error(`Failed to move: ${error.message}`);
      throw new Error(`Failed to move: ${error.message}`);
    }
  }

  /**
   * Create a directory
   * @param {Object} args - Directory arguments
   * @returns {Promise<Object>} Create result
   */
  async createDirectory(args = {}) {
    const { path: dirPath, recursive = true } = args;

    if (!dirPath) {
      throw new Error('Path is required');
    }

    try {
      const fullPath = this._resolvePath(dirPath);

      await fs.mkdir(fullPath, { recursive });

      Logger.info(`Created directory: ${dirPath}`);

      return {
        success: true,
        message: `Directory created successfully`,
        directory: {
          path: dirPath,
          fullPath
        }
      };
    } catch (error) {
      Logger.error(`Failed to create directory: ${error.message}`);
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  }

  /**
   * Get file info
   * @param {Object} args - File info arguments
   * @returns {Promise<Object>} File info
   */
  async getFileInfo(args = {}) {
    const { path: filePath } = args;

    if (!filePath) {
      throw new Error('Path is required');
    }

    try {
      const fullPath = this._resolvePath(filePath);
      const stats = await fs.stat(fullPath);

      const info = {
        path: filePath,
        fullPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        permissions: stats.mode.toString(8)
      };

      return {
        success: true,
        info
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Path not found: ${filePath}`);
      }
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }
}

/**
 * Create file controller instance
 * @returns {FileController} File controller instance
 */
export function createFileController() {
  return new FileController();
}
