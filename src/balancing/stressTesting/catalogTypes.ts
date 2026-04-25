/**
 * Type definitions for Stress Testing Dataset Catalog & Versioning
 * Defines interfaces for dataset metadata, catalog management, and versioning
 */

import type { StressTestAnalysis, StressTestScenario } from './types';

/**
 * Dataset metadata for catalog entries
 */
export interface DatasetMetadata {
  /** Unique dataset identifier */
  id: string;
  /** Human-readable dataset name */
  name: string;
  /** Dataset description */
  description: string;
  /** Dataset version */
  version: string;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
  /** Dataset file size in bytes */
  size: number;
  /** SHA-256 checksum for integrity verification */
  checksum: string;
  /** Dataset format (json, csv, etc.) */
  format: 'json' | 'csv' | 'bundle';
  /** Compression algorithm used */
  compression?: 'gzip' | 'brotli' | 'none';
  /** Dataset tags for categorization */
  tags: string[];
  /** Configuration used for stress testing */
  config: {
    /** Balancer config version */
    balancerVersion: string;
    /** Points per stat multiplier */
    pointsPerStat: number;
    /** Number of simulations per archetype */
    simulationsPerArchetype: number;
    /** Random seed used */
    seed: number;
    /** Stat adjustments applied */
    adjustments: Array<{
      statId: string;
      adjustment: number;
      weightMultiplier: number;
    }>;
  };
  /** Performance metrics */
  metrics: {
    /** Total simulation time in milliseconds */
    totalSimulationTime: number;
    /** Number of archetypes tested */
    archetypeCount: number;
    /** Number of simulations run */
    totalSimulations: number;
    /** Average simulation time */
    avgSimulationTime: number;
    /** Memory usage peak in MB */
    memoryPeak: number;
  };
  /** Analysis results summary */
  summary: {
    /** Number of OP synergies found */
    opSynergies: number;
    /** Number of weak synergies found */
    weakSynergies: number;
    /** Top synergy multiplier */
    topSynergyMultiplier: number;
    /** Bottom synergy multiplier */
    bottomSynergyMultiplier: number;
    /** Average synergy multiplier */
    avgSynergyMultiplier: number;
  };
}

/**
 * Catalog metadata and statistics
 */
export interface CatalogMetadata {
  /** Total number of datasets in catalog */
  totalDatasets: number;
  /** Combined size of all datasets in bytes */
  totalSize: number;
  /** Catalog checksum for integrity verification */
  checksum: string;
  /** Schema version for compatibility */
  schemaVersion: string;
  /** Catalog creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  lastUpdated: string;
  /** Catalog version */
  version: string;
  /** Catalog description */
  description: string;
}

/**
 * Complete catalog structure
 */
export interface StressTestCatalog {
  /** Catalog version */
  version: string;
  /** Catalog creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  lastUpdated: string;
  /** Catalog description */
  description: string;
  /** Array of dataset entries */
  datasets: DatasetMetadata[];
  /** Catalog metadata and statistics */
  metadata: CatalogMetadata;
}

/**
 * Configuration for catalog operations
 */
export interface CatalogConfig {
  /** Catalog file path */
  catalogPath: string;
  /** Dataset storage directory */
  datasetDir: string;
  /** Backup directory */
  backupDir: string;
  /** Maximum number of backups to keep */
  maxBackups: number;
  /** Auto-save enabled */
  autoSave: boolean;
  /** Compression enabled for new datasets */
  compressionEnabled: boolean;
  /** Default compression algorithm */
  defaultCompression: 'gzip' | 'brotli' | 'none';
}

/**
 * Catalog update operation result
 */
export interface CatalogUpdateResult {
  /** Operation success status */
  success: boolean;
  /** Updated dataset ID */
  datasetId?: string;
  /** Previous version (if update) */
  previousVersion?: string;
  /** New version */
  newVersion: string;
  /** Operation duration in milliseconds */
  duration: number;
  /** Error message (if failed) */
  error?: string;
  /** Backup created */
  backupCreated?: boolean;
  /** Checksum verification result */
  checksumValid?: boolean;
}

/**
 * Dataset validation result
 */
export interface DatasetValidationResult {
  /** Validation success status */
  valid: boolean;
  /** Dataset ID */
  datasetId: string;
  /** Validation errors found */
  errors: Array<{
    type: 'checksum' | 'format' | 'schema' | 'missing_field';
    message: string;
    field?: string;
  }>;
  /** Validation warnings */
  warnings: Array<{
    type: 'deprecated' | 'optional' | 'recommendation';
    message: string;
    field?: string;
  }>;
  /** Validation duration */
  duration: number;
}

/**
 * Catalog statistics for reporting
 */
export interface CatalogStatistics {
  /** Total datasets count */
  totalDatasets: number;
  /** Datasets by format */
  datasetsByFormat: Record<string, number>;
  /** Datasets by version */
  datasetsByVersion: Record<string, number>;
  /** Datasets by tags */
  datasetsByTags: Record<string, number>;
  /** Size distribution */
  sizeDistribution: {
    min: number;
    max: number;
    avg: number;
    total: number;
  };
  /** Date range */
  dateRange: {
    earliest: string;
    latest: string;
  };
  /** Performance metrics */
  performanceMetrics: {
    avgSimulationTime: number;
    avgMemoryUsage: number;
    totalSimulationTime: number;
  };
  /** Synergy metrics */
  synergyMetrics: {
    totalOpSynergies: number;
    totalWeakSynergies: number;
    avgSynergyMultiplier: number;
  };
}

/**
 * Catalog search/filter options
 */
export interface CatalogSearchOptions {
  /** Search query (matches name, description, tags) */
  query?: string;
  /** Filter by format */
  format?: string[];
  /** Filter by tags */
  tags?: string[];
  /** Filter by date range */
  dateRange?: {
    from?: string;
    to?: string;
  };
  /** Filter by size range */
  sizeRange?: {
    min?: number;
    max?: number;
  };
  /** Sort by field */
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'version';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Catalog search result
 */
export interface CatalogSearchResult {
  /** Matching datasets */
  datasets: DatasetMetadata[];
  /** Total matches found */
  totalMatches: number;
  /** Search duration */
  duration: number;
  /** Search options used */
  options: CatalogSearchOptions;
}
