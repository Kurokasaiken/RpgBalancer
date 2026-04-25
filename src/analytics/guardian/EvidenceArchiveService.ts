/**
 * Guardian Evidence Archive Service
 * 
 * Core service for evidence archive rotation with zip compression,
 * checksum validation, and retention plan management.
 * 
 * @since NP-060 – Guardian Evidence Archive Rotator
 */

import { z } from 'zod';
import { readFile, writeFile, readdir, stat, mkdir, unlink } from 'fs/promises';
import { join, basename, extname, dirname } from 'path';
import { createHash } from 'crypto';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

/**
 * Archive configuration
 */
export interface ArchiveConfig {
  /** Archive identifier */
  id: string;
  /** Base directory for evidence files */
  baseDirectory: string;
  /** Archive destination directory */
  archiveDirectory: string;
  /** Retention policies */
  retention: {
    /** Maximum age in days */
    maxAgeDays: number;
    /** Maximum archive size in MB */
    maxArchiveSizeMB: number;
    /** Maximum number of archives to keep */
    maxArchives: number;
  };
  /** Compression settings */
  compression: {
    /** Compression level (0-9) */
    level: number;
    /** Include checksums */
    includeChecksums: boolean;
    /** Create index files */
    createIndex: boolean;
  };
  /** File patterns */
  patterns: {
    /** Files to include in archive */
    include: string[];
    /** Files to exclude from archive */
    exclude: string[];
    /** Evidence log patterns */
    evidenceLogs: string[];
  };
  /** Validation settings */
  validation: {
    /** Verify checksums after creation */
    verifyChecksums: boolean;
    /** Validate archive integrity */
    validateIntegrity: boolean;
    /** Skip corrupted files */
    skipCorruptedFiles: boolean;
  };
  /** Notification settings */
  notifications: {
    /** Enable notifications */
    enabled: boolean;
    /** Notify on archive creation */
    onArchiveCreated: boolean;
    /** Notify on cleanup */
    onCleanup: boolean;
    /** Notify on errors */
    onErrors: boolean;
  };
}

/**
 * Archive entry information
 */
export interface ArchiveEntry {
  /** File path relative to base directory */
  path: string;
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** File modification time */
  modifiedTime: number;
  /** File checksum */
  checksum: string;
  /** File type */
  type: 'evidence' | 'index' | 'config' | 'other';
  /** Compression ratio */
  compressionRatio?: number;
}

/**
 * Archive metadata
 */
export interface ArchiveMetadata {
  /** Archive identifier */
  id: string;
  /** Archive creation timestamp */
  createdAt: number;
  /** Archive file path */
  archivePath: string;
  /** Archive size in bytes */
  archiveSize: number;
  /** Number of files in archive */
  fileCount: number;
  /** Total uncompressed size */
  totalUncompressedSize: number;
  /** Compression ratio */
  compressionRatio: number;
  /** Archive checksum */
  checksum: string;
  /** Archive entries */
  entries: ArchiveEntry[];
  /** Archive configuration */
  config: ArchiveConfig;
  /** Archive status */
  status: 'creating' | 'completed' | 'failed' | 'corrupted';
  /** Error information */
  error?: string;
  /** Retention information */
  retention: {
    expiresAt: number;
    autoDelete: boolean;
  };
}

/**
 * Rotation result
 */
export interface RotationResult {
  /** Rotation identifier */
  id: string;
  /** Rotation timestamp */
  timestamp: number;
  /** Archives created */
  archivesCreated: ArchiveMetadata[];
  /** Archives cleaned up */
  archivesCleaned: string[];
  /** Files processed */
  filesProcessed: number;
  /** Total size processed */
  totalSizeProcessed: number;
  /** Compression achieved */
  compressionRatio: number;
  /** Errors encountered */
  errors: string[];
  /** Rotation duration in milliseconds */
  duration: number;
}

/**
 * Zod schema for ArchiveConfig
 */
const ArchiveConfigSchema = z.object({
  id: z.string(),
  baseDirectory: z.string(),
  archiveDirectory: z.string(),
  retention: z.object({
    maxAgeDays: z.number().min(1),
    maxArchiveSizeMB: z.number().min(1),
    maxArchives: z.number().min(1),
  }),
  compression: z.object({
    level: z.number().min(0).max(9),
    includeChecksums: z.boolean(),
    createIndex: z.boolean(),
  }),
  patterns: z.object({
    include: z.array(z.string()),
    exclude: z.array(z.string()),
    evidenceLogs: z.array(z.string()),
  }),
  validation: z.object({
    verifyChecksums: z.boolean(),
    validateIntegrity: z.boolean(),
    skipCorruptedFiles: z.boolean(),
  }),
  notifications: z.object({
    enabled: z.boolean(),
    onArchiveCreated: z.boolean(),
    onCleanup: z.boolean(),
    onErrors: z.boolean(),
  }),
});

/**
 * Zod schema for ArchiveMetadata
 */
const ArchiveMetadataSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  archivePath: z.string(),
  archiveSize: z.number(),
  fileCount: z.number(),
  totalUncompressedSize: z.number(),
  compressionRatio: z.number(),
  checksum: z.string(),
  entries: z.array(z.object({
    path: z.string(),
    name: z.string(),
    size: z.number(),
    modifiedTime: z.number(),
    checksum: z.string(),
    type: z.enum(['evidence', 'index', 'config', 'other']),
    compressionRatio: z.number().optional(),
  })),
  config: ArchiveConfigSchema,
  status: z.enum(['creating', 'completed', 'failed', 'corrupted']),
  error: z.string().optional(),
  retention: z.object({
    expiresAt: z.number(),
    autoDelete: z.boolean(),
  }),
});

/**
 * Default archive configuration
 */
export const DEFAULT_ARCHIVE_CONFIG: ArchiveConfig = {
  id: 'guardian-evidence-archive',
  baseDirectory: 'test-results',
  archiveDirectory: 'test-results/archives',
  retention: {
    maxAgeDays: 90,
    maxArchiveSizeMB: 100,
    maxArchives: 10,
  },
  compression: {
    level: 6,
    includeChecksums: true,
    createIndex: true,
  },
  patterns: {
    include: ['*.log', '*.md', '*.json'],
    exclude: ['.*', 'node_modules', '*.tmp', '*.temp'],
    evidenceLogs: ['np-*.log', '*-evidence-*.log', '*-archive-*.log'],
  },
  validation: {
    verifyChecksums: true,
    validateIntegrity: true,
    skipCorruptedFiles: true,
  },
  notifications: {
    enabled: true,
    onArchiveCreated: true,
    onCleanup: true,
    onErrors: true,
  },
};

/**
 * Create safe archive configuration
 */
export function createSafeArchiveConfig(
  config?: Partial<ArchiveConfig>
): ArchiveConfig {
  const merged = { ...DEFAULT_ARCHIVE_CONFIG, ...config };
  
  const result = ArchiveConfigSchema.safeParse(merged);
  if (!result.success) {
    console.warn('Invalid archive config:', result.error);
    return DEFAULT_ARCHIVE_CONFIG;
  }
  
  return result.data;
}

/**
 * Validate archive configuration
 */
export function isValidArchiveConfig(config: unknown): config is ArchiveConfig {
  return ArchiveConfigSchema.safeParse(config).success;
}

/**
 * Calculate file checksum
 */
export async function calculateChecksum(filePath: string, algorithm: string = 'sha256'): Promise<string> {
  try {
    const data = await readFile(filePath);
    const hash = createHash(algorithm);
    hash.update(data);
    return hash.digest('hex');
  } catch (error) {
    throw new Error(`Failed to calculate checksum for ${filePath}: ${error}`);
  }
}

/**
 * Determine file type
 */
export function determineFileType(filePath: string, config: ArchiveConfig): ArchiveEntry['type'] {
  const fileName = basename(filePath);
  const relativePath = filePath.replace(config.baseDirectory, '');
  
  // Check if it's an evidence log
  if (config.patterns.evidenceLogs.some(pattern => fileName.includes(pattern.replace('*', '')))) {
    return 'evidence';
  }
  
  // Check if it's an index file
  if (fileName.includes('index') || fileName.includes('catalog')) {
    return 'index';
  }
  
  // Check if it's a config file
  if (fileName.includes('config') || fileName.includes('settings')) {
    return 'config';
  }
  
  return 'other';
}

/**
 * Get file information
 */
export async function getFileInfo(
  filePath: string,
  config: ArchiveConfig
): Promise<ArchiveEntry> {
  const stats = await stat(filePath);
  const checksum = await calculateChecksum(filePath);
  const relativePath = filePath.replace(config.baseDirectory, '');
  
  return {
    path: relativePath,
    name: basename(filePath),
    size: stats.size,
    modifiedTime: stats.mtime.getTime(),
    checksum,
    type: determineFileType(filePath, config),
  };
}

/**
 * Check if file matches patterns
 */
export function matchesPatterns(
  filePath: string,
  includePatterns: string[],
  excludePatterns: string[]
): boolean {
  const fileName = basename(filePath);
  
  // Check exclude patterns first
  const excluded = excludePatterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    return regex.test(fileName);
  });
  
  if (excluded) return false;
  
  // Check include patterns
  const included = includePatterns.length === 0 || includePatterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    return regex.test(fileName);
  });
  
  return included;
}

/**
 * Scan directory for files to archive
 */
export async function scanDirectory(
  directory: string,
  config: ArchiveConfig
): Promise<string[]> {
  const files: string[] = [];
  
  async function scanRecursive(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanRecursive(fullPath);
        } else if (entry.isFile()) {
          if (matchesPatterns(fullPath, config.patterns.include, config.patterns.exclude)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dir}:`, error);
    }
  }
  
  await scanRecursive(directory);
  return files;
}

/**
 * Create archive metadata
 */
export function createArchiveMetadata(
  id: string,
  archivePath: string,
  entries: ArchiveEntry[],
  config: ArchiveConfig
): ArchiveMetadata {
  const now = Date.now();
  const totalUncompressedSize = entries.reduce((sum, entry) => sum + entry.size, 0);
  const archiveSize = entries.reduce((sum, entry) => sum + (entry.size * (1 - (entry.compressionRatio || 0))), 0);
  const compressionRatio = totalUncompressedSize > 0 ? archiveSize / totalUncompressedSize : 1;
  
  return {
    id,
    createdAt: now,
    archivePath,
    archiveSize,
    fileCount: entries.length,
    totalUncompressedSize,
    compressionRatio,
    checksum: '', // Will be calculated after archive creation
    entries,
    config,
    status: 'creating',
    retention: {
      expiresAt: now + (config.retention.maxAgeDays * 24 * 60 * 60 * 1000),
      autoDelete: true,
    },
  };
}

/**
 * Save archive metadata
 */
export async function saveArchiveMetadata(metadata: ArchiveMetadata): Promise<void> {
  const metadataPath = metadata.archivePath.replace('.zip', '.metadata.json');
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
}

/**
 * Load archive metadata
 */
export async function loadArchiveMetadata(archivePath: string): Promise<ArchiveMetadata | null> {
  try {
    const metadataPath = archivePath.replace('.zip', '.metadata.json');
    const data = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(data);
    
    const result = ArchiveMetadataSchema.safeParse(metadata);
    return result.success ? result.data : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get existing archives
 */
export async function getExistingArchives(config: ArchiveConfig): Promise<ArchiveMetadata[]> {
  try {
    await mkdir(config.archiveDirectory, { recursive: true });
    const files = await readdir(config.archiveDirectory);
    
    const archives: ArchiveMetadata[] = [];
    
    for (const file of files) {
      if (file.endsWith('.zip')) {
        const archivePath = join(config.archiveDirectory, file);
        const metadata = await loadArchiveMetadata(archivePath);
        if (metadata) {
          archives.push(metadata);
        }
      }
    }
    
    return archives.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.warn('Failed to get existing archives:', error);
    return [];
  }
}

/**
 * Check if archive should be cleaned up
 */
export function shouldCleanupArchive(
  archive: ArchiveMetadata,
  config: ArchiveConfig,
  allArchives: ArchiveMetadata[]
): boolean {
  const now = Date.now();
  
  // Check age
  if (now - archive.createdAt > config.retention.maxAgeDays * 24 * 60 * 60 * 1000) {
    return true;
  }
  
  // Check if too many archives
  if (allArchives.length > config.retention.maxArchives) {
    const archiveIndex = allArchives.findIndex(a => a.id === archive.id);
    return archiveIndex >= config.retention.maxArchives;
  }
  
  // Check if archive directory is too large
  const totalSize = allArchives.reduce((sum, a) => sum + a.archiveSize, 0);
  if (totalSize > config.retention.maxArchiveSizeMB * 1024 * 1024) {
    // Remove oldest archives first
    const sortedArchives = allArchives.sort((a, b) => a.createdAt - b.createdAt);
    const archiveIndex = sortedArchives.findIndex(a => a.id === archive.id);
    return archiveIndex < Math.max(0, sortedArchives.length - config.retention.maxArchives);
  }
  
  return false;
}

/**
 * Delete archive
 */
export async function deleteArchive(archive: ArchiveMetadata): Promise<void> {
  try {
    // Delete archive file
    await unlink(archive.archivePath);
    
    // Delete metadata file
    const metadataPath = archive.archivePath.replace('.zip', '.metadata.json');
    try {
      await unlink(metadataPath);
    } catch {
      // Metadata file might not exist, ignore
    }
  } catch (error) {
    throw new Error(`Failed to delete archive ${archive.id}: ${error}`);
  }
}

/**
 * Create archive index
 */
export function createArchiveIndex(archives: ArchiveMetadata[]): string {
  const index = {
    generatedAt: new Date().toISOString(),
    totalArchives: archives.length,
    totalSize: archives.reduce((sum, a) => sum + a.archiveSize, 0),
    totalUncompressedSize: archives.reduce((sum, a) => sum + a.totalUncompressedSize, 0),
    averageCompressionRatio: archives.length > 0 
      ? archives.reduce((sum, a) => sum + a.compressionRatio, 0) / archives.length 
      : 0,
    archives: archives.map(archive => ({
      id: archive.id,
      createdAt: new Date(archive.createdAt).toISOString(),
      archiveSize: archive.archiveSize,
      fileCount: archive.fileCount,
      compressionRatio: archive.compressionRatio,
      checksum: archive.checksum,
      status: archive.status,
      expiresAt: new Date(archive.retention.expiresAt).toISOString(),
      entries: archive.entries.map(entry => ({
        name: entry.name,
        type: entry.type,
        size: entry.size,
        checksum: entry.checksum,
      })),
    })),
  };
  
  return JSON.stringify(index, null, 2);
}

/**
 * Save archive index
 */
export async function saveArchiveIndex(
  archives: ArchiveMetadata[],
  config: ArchiveConfig
): Promise<void> {
  if (!config.compression.createIndex) return;
  
  try {
    await mkdir(config.archiveDirectory, { recursive: true });
    const indexPath = join(config.archiveDirectory, 'archive-index.json');
    const indexContent = createArchiveIndex(archives);
    await writeFile(indexPath, indexContent, 'utf-8');
  } catch (error) {
    console.warn('Failed to save archive index:', error);
  }
}

/**
 * Generate telemetry event
 */
export function generateTelemetryEvent(
  eventType: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  return {
    event: eventType,
    timestamp: Date.now(),
    service: 'guardian-evidence-archive',
    version: '1.0.0',
    ...data,
  };
}

export type {
  ArchiveConfig,
  ArchiveEntry,
  ArchiveMetadata,
  RotationResult,
};

export {
  ArchiveConfigSchema,
  ArchiveMetadataSchema,
};
