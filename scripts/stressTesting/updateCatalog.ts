#!/usr/bin/env tsx

/**
 * Stress Testing Dataset Catalog Management Script
 * 
 * Provides functionality to manage versioned dataset catalog with metadata,
 * checksum verification, and automatic backup. Follows config-first principles.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, unlinkSync } from 'fs';
import { createHash } from 'crypto';
import { join, basename } from 'path';
import type { 
  StressTestCatalog, 
  DatasetMetadata, 
  CatalogConfig, 
  CatalogUpdateResult, 
  DatasetValidationResult,
  CatalogStatistics,
  CatalogSearchOptions,
  CatalogSearchResult
} from '../../src/balancing/stressTesting/catalogTypes';

/**
 * Default catalog configuration
 */
const DEFAULT_CONFIG: CatalogConfig = {
  catalogPath: join(process.cwd(), 'data/stressTesting/catalog.json'),
  datasetDir: join(process.cwd(), 'data/stressTesting/datasets'),
  backupDir: join(process.cwd(), 'data/stressTesting/backups'),
  maxBackups: 10,
  autoSave: true,
  compressionEnabled: true,
  defaultCompression: 'gzip' as const,
};

/**
 * Generate SHA-256 checksum for data integrity verification
 */
function generateChecksum(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Validate dataset file integrity and format
 */
function validateDataset(datasetPath: string): DatasetValidationResult {
  const startTime = Date.now();
  const datasetId = basename(datasetPath, '.json');
  
  try {
    if (!existsSync(datasetPath)) {
      return {
        valid: false,
        datasetId,
        errors: [{ type: 'missing_field', message: 'Dataset file does not exist' }],
        warnings: [],
        duration: Date.now() - startTime,
      };
    }

    const fileContent = readFileSync(datasetPath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    const errors: DatasetValidationResult['errors'] = [];
    const warnings: DatasetValidationResult['warnings'] = [];

    // Check required fields
    const requiredFields = ['id', 'name', 'version', 'createdAt', 'updatedAt', 'checksum'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push({
          type: 'missing_field',
          message: `Missing required field: ${field}`,
          field,
        });
      }
    }

    // Verify checksum
    if (data.checksum) {
      const calculatedChecksum = generateChecksum(fileContent);
      if (calculatedChecksum !== data.checksum) {
        errors.push({
          type: 'checksum',
          message: 'Checksum mismatch - file may be corrupted',
        });
      }
    }

    // Validate format
    if (data.format && !['json', 'csv', 'bundle'].includes(data.format)) {
      errors.push({
        type: 'format',
        message: `Invalid format: ${data.format}`,
        field: 'format',
      });
    }

    // Check for deprecated fields
    if (data.legacyFormat) {
      warnings.push({
        type: 'deprecated',
        message: 'Legacy format field is deprecated',
        field: 'legacyFormat',
      });
    }

    return {
      valid: errors.length === 0,
      datasetId,
      errors,
      warnings,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      valid: false,
      datasetId,
      errors: [{ 
        type: 'schema', 
        message: `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }],
      warnings: [],
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Load catalog from file
 */
function loadCatalog(config: CatalogConfig): StressTestCatalog {
  if (!existsSync(config.catalogPath)) {
    // Create initial catalog
    const initialCatalog: StressTestCatalog = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      description: 'Stress Testing Dataset Catalog - Versioned collection of stat stress testing results',
      datasets: [],
      metadata: {
        totalDatasets: 0,
        totalSize: 0,
        checksum: '',
        schemaVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        description: 'Stress Testing Dataset Catalog - Versioned collection of stat stress testing results',
      },
    };
    saveCatalog(initialCatalog, config);
    return initialCatalog;
  }

  const catalogContent = readFileSync(config.catalogPath, 'utf-8');
  return JSON.parse(catalogContent) as StressTestCatalog;
}

/**
 * Save catalog to file with checksum
 */
function saveCatalog(catalog: StressTestCatalog, config: CatalogConfig): void {
  // Update metadata
  catalog.metadata.totalDatasets = catalog.datasets.length;
  catalog.metadata.totalSize = catalog.datasets.reduce((sum, dataset) => sum + dataset.size, 0);
  catalog.metadata.lastUpdated = new Date().toISOString();
  
  const catalogContent = JSON.stringify(catalog, null, 2);
  catalog.metadata.checksum = generateChecksum(catalogContent);
  
  // Create backup if catalog exists
  if (existsSync(config.catalogPath)) {
    if (!existsSync(config.backupDir)) {
      mkdirSync(config.backupDir, { recursive: true });
    }
    
    const backupPath = join(config.backupDir, `catalog-${Date.now()}.json`);
    copyFileSync(config.catalogPath, backupPath);
    
    // Clean old backups
    const backupFiles = readdirSync(config.backupDir)
      .filter((file: string) => file.startsWith('catalog-') && file.endsWith('.json'))
      .map((file: string) => join(config.backupDir, file))
      .sort((a: string, b: string) => {
        const timeA = parseInt(basename(a, '.json').replace('catalog-', '').replace('.json', ''));
        const timeB = parseInt(basename(b, '.json').replace('catalog-', '').replace('.json', ''));
        return timeB - timeA;
      });
    
    if (backupFiles.length > config.maxBackups) {
      backupFiles.slice(config.maxBackups).forEach((backup: string) => {
        unlinkSync(backup);
      });
    }
  }
  
  writeFileSync(config.catalogPath, catalogContent, 'utf-8');
}

/**
 * Add or update dataset in catalog
 */
function addDatasetToCatalog(
  dataset: DatasetMetadata, 
  config: CatalogConfig
): CatalogUpdateResult {
  const startTime = Date.now();
  
  try {
    const catalog = loadCatalog(config);
    const previousVersion = catalog.version;
    
    // Check if dataset already exists
    const existingIndex = catalog.datasets.findIndex(d => d.id === dataset.id);
    
    if (existingIndex >= 0) {
      // Update existing dataset
      catalog.datasets[existingIndex] = dataset;
    } else {
      // Add new dataset
      catalog.datasets.push(dataset);
    }
    
    // Increment catalog version
    const versionParts = catalog.version.split('.');
    versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
    catalog.version = versionParts.join('.');
    
    saveCatalog(catalog, config);
    
    return {
      success: true,
      datasetId: dataset.id,
      previousVersion,
      newVersion: catalog.version,
      duration: Date.now() - startTime,
      backupCreated: true,
      checksumValid: true,
    };
  } catch (error) {
    return {
      success: false,
      datasetId: dataset.id,
      newVersion: '0.0.0',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove dataset from catalog
 */
function removeDatasetFromCatalog(
  datasetId: string, 
  config: CatalogConfig
): CatalogUpdateResult {
  const startTime = Date.now();
  
  try {
    const catalog = loadCatalog(config);
    const previousVersion = catalog.version;
    
    const index = catalog.datasets.findIndex(d => d.id === datasetId);
    if (index === -1) {
      return {
        success: false,
        datasetId,
        newVersion: catalog.version,
        duration: Date.now() - startTime,
        error: `Dataset not found: ${datasetId}`,
      };
    }
    
    catalog.datasets.splice(index, 1);
    
    // Increment catalog version
    const versionParts = catalog.version.split('.');
    versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
    catalog.version = versionParts.join('.');
    
    saveCatalog(catalog, config);
    
    return {
      success: true,
      datasetId,
      previousVersion,
      newVersion: catalog.version,
      duration: Date.now() - startTime,
      backupCreated: true,
      checksumValid: true,
    };
  } catch (error) {
    return {
      success: false,
      datasetId,
      newVersion: '0.0.0',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate catalog statistics
 */
function generateCatalogStatistics(config: CatalogConfig): CatalogStatistics {
  const catalog = loadCatalog(config);
  
  const datasetsByFormat: Record<string, number> = {};
  const datasetsByVersion: Record<string, number> = {};
  const datasetsByTags: Record<string, number> = {};
  
  let totalOpSynergies = 0;
  let totalWeakSynergies = 0;
  let totalSynergyMultiplier = 0;
  let synergyCount = 0;
  
  const sizes = catalog.datasets.map(d => d.size);
  const dates = catalog.datasets.map(d => d.createdAt).concat(catalog.datasets.map(d => d.updatedAt));
  
  catalog.datasets.forEach(dataset => {
    // Format distribution
    datasetsByFormat[dataset.format] = (datasetsByFormat[dataset.format] || 0) + 1;
    
    // Version distribution
    datasetsByVersion[dataset.version] = (datasetsByVersion[dataset.version] || 0) + 1;
    
    // Tag distribution
    dataset.tags.forEach(tag => {
      datasetsByTags[tag] = (datasetsByTags[tag] || 0) + 1;
    });
    
    // Synergy metrics
    if (dataset.summary) {
      totalOpSynergies += dataset.summary.opSynergies;
      totalWeakSynergies += dataset.summary.weakSynergies;
      totalSynergyMultiplier += dataset.summary.avgSynergyMultiplier;
      synergyCount++;
    }
  });
  
  return {
    totalDatasets: catalog.datasets.length,
    datasetsByFormat,
    datasetsByVersion,
    datasetsByTags,
    sizeDistribution: {
      min: Math.min(...sizes),
      max: Math.max(...sizes),
      avg: sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0,
      total: sizes.reduce((a, b) => a + b, 0),
    },
    dateRange: {
      earliest: dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))).toISOString() : '',
      latest: dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))).toISOString() : '',
    },
    performanceMetrics: {
      avgSimulationTime: catalog.datasets.reduce((sum, d) => sum + (d.metrics?.avgSimulationTime || 0), 0) / catalog.datasets.length,
      avgMemoryUsage: catalog.datasets.reduce((sum, d) => sum + (d.metrics?.memoryPeak || 0), 0) / catalog.datasets.length,
      totalSimulationTime: catalog.datasets.reduce((sum, d) => sum + (d.metrics?.totalSimulationTime || 0), 0),
    },
    synergyMetrics: {
      totalOpSynergies,
      totalWeakSynergies,
      avgSynergyMultiplier: synergyCount > 0 ? totalSynergyMultiplier / synergyCount : 0,
    },
  };
}

/**
 * Search catalog datasets
 */
function searchCatalog(
  catalog: StressTestCatalog,
  options: CatalogSearchOptions
): CatalogSearchResult {
  const startTime = Date.now();
  
  let filteredDatasets = [...catalog.datasets];
  
  // Apply filters
  if (options.query) {
    const query = options.query.toLowerCase();
    filteredDatasets = filteredDatasets.filter(dataset => 
      dataset.name.toLowerCase().includes(query) ||
      dataset.description.toLowerCase().includes(query) ||
      dataset.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  if (options.format && options.format.length > 0) {
    filteredDatasets = filteredDatasets.filter(dataset => 
      options.format!.includes(dataset.format)
    );
  }
  
  if (options.tags && options.tags.length > 0) {
    filteredDatasets = filteredDatasets.filter(dataset => 
      options.tags!.some(tag => dataset.tags.includes(tag))
    );
  }
  
  if (options.dateRange) {
    const fromDate = options.dateRange.from ? new Date(options.dateRange.from) : new Date(0);
    const toDate = options.dateRange.to ? new Date(options.dateRange.to) : new Date();
    filteredDatasets = filteredDatasets.filter(dataset => {
      const datasetDate = new Date(dataset.updatedAt);
      return datasetDate >= fromDate && datasetDate <= toDate;
    });
  }
  
  if (options.sizeRange) {
    const minSize = options.sizeRange.min || 0;
    const maxSize = options.sizeRange.max || Infinity;
    filteredDatasets = filteredDatasets.filter(dataset => {
      return dataset.size >= minSize && dataset.size <= maxSize;
    });
  }
  
  // Apply sorting
  if (options.sortBy) {
    filteredDatasets.sort((a, b) => {
      let comparison = 0;
      
      switch (options.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'version':
          comparison = a.version.localeCompare(b.version);
          break;
      }
      
      return options.sortOrder === 'desc' ? -comparison : comparison;
    });
  }
  
  // Apply pagination
  const totalMatches = filteredDatasets.length;
  const offset = options.offset || 0;
  const limit = options.limit || filteredDatasets.length;
  
  const paginatedDatasets = filteredDatasets.slice(offset, offset + limit);
  
  return {
    datasets: paginatedDatasets,
    totalMatches,
    duration: Date.now() - startTime,
    options,
  };
}

/**
 * CLI command handlers
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const config = { ...DEFAULT_CONFIG };
  
  switch (command) {
    case 'init': {
      console.log('Initializing catalog...');
      const catalog = loadCatalog(config);
      console.log(`Catalog created: ${config.catalogPath}`);
      console.log(`Catalog version: ${catalog.version}`);
      console.log(`Datasets: ${catalog.datasets.length}`);
      break;
    }
      
    case 'add': {
      if (args.length < 2) {
        console.error('Usage: tsx updateCatalog.ts add <dataset-path>');
        process.exit(1);
      }
      
      const datasetPath = args[1];
      console.log(`Adding dataset: ${datasetPath}`);
      
      const validation = validateDataset(datasetPath);
      
      if (!validation.valid) {
        console.error('Dataset validation failed:');
        validation.errors.forEach(error => {
          console.error(`  ${error.type}: ${error.message}`);
        });
        process.exit(1);
      }
      
      if (validation.warnings.length > 0) {
        console.log('Warnings:');
        validation.warnings.forEach(warning => {
          console.log(`  ${warning.type}: ${warning.message}`);
        });
      }
      
      const datasetData = JSON.parse(readFileSync(datasetPath, 'utf-8'));
      const result = addDatasetToCatalog(datasetData, config);
      
      if (result.success) {
        console.log(`Dataset added successfully: ${result.datasetId}`);
        console.log(`Catalog version: ${result.newVersion}`);
        console.log(`Duration: ${result.duration}ms`);
      } else {
        console.error(`Failed to add dataset: ${result.error}`);
        process.exit(1);
      }
      break;
    }
      
    case 'remove': {
      if (args.length < 2) {
        console.error('Usage: tsx updateCatalog.ts remove <dataset-id>');
        process.exit(1);
      }
      
      const datasetId = args[1];
      console.log(`Removing dataset: ${datasetId}`);
      
      const removeResult = removeDatasetFromCatalog(datasetId, config);
      
      if (removeResult.success) {
        console.log(`Dataset removed successfully: ${removeResult.datasetId}`);
        console.log(`Catalog version: ${removeResult.newVersion}`);
        console.log(`Duration: ${removeResult.duration}ms`);
      } else {
        console.error(`Failed to remove dataset: ${removeResult.error}`);
        process.exit(1);
      }
      break;
    }
      
    case 'validate': {
      if (args.length < 2) {
        console.error('Usage: tsx updateCatalog.ts validate <dataset-path>');
        process.exit(1);
      }
      
      const validatePath = args[1];
      console.log(`Validating dataset: ${validatePath}`);
      
      const validation = validateDataset(validatePath);
      
      console.log(`Valid: ${validation.valid}`);
      console.log(`Duration: ${validation.duration}ms`);
      
      if (validation.errors.length > 0) {
        console.log('Errors:');
        validation.errors.forEach(error => {
          console.log(`  ${error.type}: ${error.message}`);
        });
      }
      
      if (validation.warnings.length > 0) {
        console.log('Warnings:');
        validation.warnings.forEach(warning => {
          console.log(`  ${warning.type}: ${warning.message}`);
        });
      }
      break;
    }
      
    case 'stats': {
      console.log('Generating catalog statistics...');
      const stats = generateCatalogStatistics(config);
      
      console.log(`Total datasets: ${stats.totalDatasets}`);
      console.log(`Total size: ${(stats.sizeDistribution.total / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Date range: ${stats.dateRange.earliest} to ${stats.dateRange.latest}`);
      console.log(`Average simulation time: ${stats.performanceMetrics.avgSimulationTime.toFixed(2)}ms`);
      console.log(`Total OP synergies: ${stats.synergyMetrics.totalOpSynergies}`);
      console.log(`Total weak synergies: ${stats.synergyMetrics.totalWeakSynergies}`);
      break;
    }
      
    case 'search': {
      console.log('Searching catalog...');
      const catalogData = loadCatalog(config);
      const searchOptions: CatalogSearchOptions = {
        query: args[1],
        limit: args[2] ? parseInt(args[2]) : undefined,
      };
      
      const searchResult = searchCatalog(catalogData, searchOptions);
      
      console.log(`Found ${searchResult.totalMatches} datasets`);
      console.log(`Duration: ${searchResult.duration}ms`);
      console.log('Results:');
      searchResult.datasets.forEach(dataset => {
        console.log(`  ${dataset.name} (${dataset.id}) - ${dataset.format} - ${dataset.size} bytes`);
      });
      break;
    }
      
    case 'help': {
      console.log(`
Stress Testing Catalog Management

Usage:
  tsx updateCatalog.ts <command> [options]

Commands:
  init                    Initialize catalog
  add <dataset-path>      Add dataset to catalog
  remove <dataset-id>     Remove dataset from catalog
  validate <dataset-path> Validate dataset integrity
  stats                   Show catalog statistics
  search [query] [limit] Search datasets
  help                    Show this help message

Examples:
  tsx updateCatalog.ts add ./results/stress-test-2024-01-11.json
  tsx updateCatalog.ts remove stress-test-2024-01-11
  tsx updateCatalog.ts validate ./results/stress-test-2024-01-11.json
  tsx updateCatalog.ts search "baseline" 5
  tsx updateCatalog.ts stats
      `);
      break;
    }
      
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Use "help" for available commands');
      process.exit(1);
  }
}

// Export functions for use in other modules
export {
  generateChecksum,
  validateDataset,
  loadCatalog,
  saveCatalog,
  addDatasetToCatalog,
  removeDatasetFromCatalog,
  generateCatalogStatistics,
  searchCatalog,
  DEFAULT_CONFIG,
};

// Export types for external use
export type {
  DatasetMetadata,
  CatalogConfig,
  CatalogUpdateResult,
  DatasetValidationResult,
  CatalogStatistics,
  CatalogSearchOptions,
  CatalogSearchResult
};

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}
