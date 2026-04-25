/**
 * Unit tests for Stress Testing Dataset Catalog Management
 * Tests catalog operations, validation, checksum generation, and CLI functionality
 */

import { 
  generateChecksum, 
  validateDataset, 
  loadCatalog, 
  saveCatalog, 
  addDatasetToCatalog, 
  removeDatasetFromCatalog,
  generateCatalogStatistics,
  searchCatalog,
  DEFAULT_CONFIG 
} from '../updateCatalog';
import type { 
  DatasetMetadata, 
  CatalogConfig, 
  CatalogUpdateResult,
  CatalogSearchOptions 
} from '../../../src/balancing/stressTesting/catalogTypes';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock console methods for testing
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};

// Mock process.exit
const mockExit = vi.fn();
Object.defineProperty(process, 'exit', {
  value: mockExit,
  writable: true,
});

// Mock process.argv
const mockArgv = vi.fn();
Object.defineProperty(process, 'argv', {
  get: () => mockArgv(),
  set: (value: string[]) => mockArgv.mockReturnValue(value),
  configurable: true,
});
// Test data
const TEST_DATA_DIR = join(__dirname, 'test-data');
const TEST_CATALOG_PATH = join(TEST_DATA_DIR, 'test-catalog.json');

const TEST_DATASET_PATH = join(TEST_DATA_DIR, 'test-dataset.json');

const testConfig: CatalogConfig = {
  catalogPath: TEST_CATALOG_PATH,
  datasetDir: join(TEST_DATA_DIR, 'datasets'),
  backupDir: join(TEST_DATA_DIR, 'backups'),
  maxBackups: 5,
  autoSave: true,
  compressionEnabled: false,
  defaultCompression: 'none' as const,
};

const testDataset: DatasetMetadata = {
  id: 'test-dataset-001',
  name: 'Test Dataset 001',
  description: 'A test dataset for unit testing',
  version: '1.0.0',
  createdAt: '2026-01-11T18:40:00.000Z',
  updatedAt: '2026-01-11T18:40:00.000Z',
  size: 1024,
  checksum: 'test-checksum-123',
  format: 'json' as const,
  tags: ['test', 'unit-test'],
  config: {
    balancerVersion: '1.0.0',
    pointsPerStat: 25,
    simulationsPerArchetype: 1000,
    seed: 42,
    adjustments: [
      { statId: 'hp', adjustment: 25, weightMultiplier: 1.0 },
      { statId: 'damage', adjustment: 25, weightMultiplier: 1.0 },
    ],
  },
  metrics: {
    totalSimulationTime: 5000,
    archetypeCount: 10,
    totalSimulations: 10000,
    avgSimulationTime: 0.5,
    memoryPeak: 128,
  },
  summary: {
    opSynergies: 5,
    weakSynergies: 3,
    topSynergyMultiplier: 1.25,
    bottomSynergyMultiplier: 0.85,
    avgSynergyMultiplier: 1.05,
  },
};

// Setup and teardown
beforeAll(() => {
  // Create test directory
  if (!existsSync(TEST_DATA_DIR)) {
    mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
  
  // Create test dataset file
  const datasetContent = JSON.stringify(testDataset, null, 2);
  const datasetChecksum = generateChecksum(datasetContent);
  const datasetWithChecksum = { ...testDataset, checksum: datasetChecksum };
  writeFileSync(TEST_DATASET_PATH, JSON.stringify(datasetWithChecksum, null, 2), 'utf-8');
});

afterAll(() => {
  // Clean up test directory
  if (existsSync(TEST_DATA_DIR)) {
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
});

beforeEach(() => {
  // Clear console mocks
  mockConsole.log.mockClear();
  mockConsole.error.mockClear();
  mockExit.mockClear();
  
  // Clear catalog file
  if (existsSync(TEST_CATALOG_PATH)) {
    rmSync(TEST_CATALOG_PATH);
  }
});

describe('generateChecksum', () => {
  test('should generate consistent SHA-256 checksum', () => {
    const data = 'test data';
    const checksum1 = generateChecksum(data);
    const checksum2 = generateChecksum(data);
    
    expect(checksum1).toBe(checksum2);
    expect(checksum1).toMatch(/^[a-f0-9]{64}$/);
    expect(checksum1).toBe('916f0027a34264d955cb17c08a371f307d6a076615b21a0c93c9ab3e2f7d5e3b');
  });
  
  test('should generate different checksums for different data', () => {
    const data1 = 'test data 1';
    const data2 = 'test data 2';
    
    const checksum1 = generateChecksum(data1);
    const checksum2 = generateChecksum(data2);
    
    expect(checksum1).not.toBe(checksum2);
  });
});

describe('validateDataset', () => {
  test('should validate correct dataset file', () => {
    const result = validateDataset(TEST_DATASET_PATH);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.duration).toBeGreaterThan(0);
  });
  
  test('should detect missing dataset file', () => {
    const result = validateDataset('/nonexistent/file.json');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('missing_field');
    expect(result.errors[0].message).toBe('Dataset file does not exist');
  });
  
  test('should detect invalid JSON', () => {
    const invalidPath = join(TEST_DATA_DIR, 'invalid.json');
    writeFileSync(invalidPath, 'invalid json content', 'utf-8');
    
    const result = validateDataset(invalidPath);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].type).toBe('schema');
    
    // Clean up
    rmSync(invalidPath);
  });
  
  test('should detect missing required fields', () => {
    const invalidDataset = { name: 'test' }; // Missing required fields
    const invalidPath = join(TEST_DATA_DIR, 'incomplete.json');
    writeFileSync(invalidPath, JSON.stringify(invalidDataset), 'utf-8');
    
    const result = validateDataset(invalidPath);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.field === 'id')).toBe(true);
    expect(result.errors.some(e => e.field === 'version')).toBe(true);
    
    // Clean up
    rmSync(invalidPath);
  });
  
  test('should detect checksum mismatch', () => {
    const invalidDataset = { ...testDataset, checksum: 'wrong-checksum' };
    const invalidPath = join(TEST_DATA_DIR, 'checksum-mismatch.json');
    writeFileSync(invalidPath, JSON.stringify(invalidDataset), 'utf-8');
    
    const result = validateDataset(invalidPath);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.type === 'checksum')).toBe(true);
    
    // Clean up
    rmSync(invalidPath);
  });
});

describe('loadCatalog', () => {
  test('should create initial catalog if none exists', () => {
    const catalog = loadCatalog(testConfig);
    
    expect(catalog.version).toBe('1.0.0');
    expect(catalog.datasets).toHaveLength(0);
    expect(catalog.metadata.totalDatasets).toBe(0);
    expect(catalog.metadata.totalSize).toBe(0);
    expect(catalog.metadata.schemaVersion).toBe('1.0.0');
    expect(existsSync(TEST_CATALOG_PATH)).toBe(true);
  });
  
  test('should load existing catalog', () => {
    // Create initial catalog
    loadCatalog(testConfig);
    
    // Load it again
    const catalog = loadCatalog(testConfig);
    
    expect(catalog.version).toBe('1.0.0');
    expect(catalog.datasets).toHaveLength(0);
  });
});

describe('saveCatalog', () => {
  test('should save catalog with checksum', () => {
    const catalog = loadCatalog(testConfig);
    saveCatalog(catalog, testConfig);
    
    const catalogContent = readFileSync(TEST_CATALOG_PATH, 'utf-8');
    const savedCatalog = JSON.parse(catalogContent);
    
    expect(savedCatalog.metadata.checksum).toBe(generateChecksum(catalogContent));
    expect(savedCatalog.metadata.lastUpdated).toBeDefined();
  });
  
  test('should create backup when catalog exists', () => {
    // Create initial catalog
    const catalog = loadCatalog(testConfig);
    saveCatalog(catalog, testConfig);
    
    // Save again to create backup
    saveCatalog(catalog, testConfig);
    
    expect(existsSync(testConfig.backupDir)).toBe(true);
    
    const backupFiles = require('fs').readdirSync(testConfig.backupDir)
      .filter((file: string) => file.startsWith('catalog-') && file.endsWith('.json'));
    
    expect(backupFiles.length).toBeGreaterThan(0);
  });
});

describe('addDatasetToCatalog', () => {
  test('should add new dataset to catalog', () => {
    const result = addDatasetToCatalog(testDataset, testConfig);
    
    expect(result.success).toBe(true);
    expect(result.datasetId).toBe(testDataset.id);
    expect(result.newVersion).toBe('1.0.1');
    expect(result.backupCreated).toBe(true);
    expect(result.checksumValid).toBe(true);
    expect(result.duration).toBeGreaterThan(0);
    
    const catalog = loadCatalog(testConfig);
    expect(catalog.datasets).toHaveLength(1);
    expect(catalog.datasets[0].id).toBe(testDataset.id);
  });
  
  test('should update existing dataset', () => {
    // Add initial dataset
    addDatasetToCatalog(testDataset, testConfig);
    
    // Update with new version
    const updatedDataset = { 
      ...testDataset, 
      version: '1.1.0', 
      updatedAt: new Date().toISOString() 
    };
    
    const result = addDatasetToCatalog(updatedDataset, testConfig);
    
    expect(result.success).toBe(true);
    expect(result.newVersion).toBe('1.0.2');
    
    const catalog = loadCatalog(testConfig);
    expect(catalog.datasets).toHaveLength(1);
    expect(catalog.datasets[0].version).toBe('1.1.0');
  });
  
  test('should handle errors gracefully', () => {
    const invalidDataset = { ...testDataset, id: '' }; // Invalid empty ID
    
    const result = addDatasetToCatalog(invalidDataset, testConfig);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
  });
});

describe('removeDatasetFromCatalog', () => {
  test('should remove existing dataset', () => {
    // Add dataset first
    addDatasetToCatalog(testDataset, testConfig);
    
    const result = removeDatasetFromCatalog(testDataset.id, testConfig);
    
    expect(result.success).toBe(true);
    expect(result.datasetId).toBe(testDataset.id);
    expect(result.newVersion).toBe('1.0.2');
    expect(result.backupCreated).toBe(true);
    
    const catalog = loadCatalog(testConfig);
    expect(catalog.datasets).toHaveLength(0);
  });
  
  test('should handle non-existent dataset', () => {
    const result = removeDatasetFromCatalog('non-existent-id', testConfig);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Dataset not found');
  });
});

describe('generateCatalogStatistics', () => {
  test('should generate statistics for empty catalog', () => {
    const stats = generateCatalogStatistics(testConfig);
    
    expect(stats.totalDatasets).toBe(0);
    expect(stats.sizeDistribution.total).toBe(0);
    expect(stats.sizeDistribution.avg).toBe(0);
    expect(stats.performanceMetrics.avgSimulationTime).toBe(0);
    expect(stats.synergyMetrics.totalOpSynergies).toBe(0);
  });
  
  test('should generate statistics for catalog with datasets', () => {
    // Add test dataset
    addDatasetToCatalog(testDataset, testConfig);
    
    const stats = generateCatalogStatistics(testConfig);
    
    expect(stats.totalDatasets).toBe(1);
    expect(stats.sizeDistribution.total).toBe(testDataset.size);
    expect(stats.sizeDistribution.avg).toBe(testDataset.size);
    expect(stats.datasetsByFormat.json).toBe(1);
    expect(stats.datasetsByVersion['1.0.0']).toBe(1);
    expect(stats.datasetsByTags.test).toBe(1);
    expect(stats.datasetsByTags['unit-test']).toBe(1);
    expect(stats.performanceMetrics.avgSimulationTime).toBe(testDataset.metrics.avgSimulationTime);
    expect(stats.synergyMetrics.totalOpSynergies).toBe(testDataset.summary.opSynergies);
  });
});

describe('searchCatalog', () => {
  test('should search all datasets without filters', () => {
    // Add test dataset
    addDatasetToCatalog(testDataset, testConfig);
    const catalog = loadCatalog(testConfig);
    
    const options: CatalogSearchOptions = {};
    const result = searchCatalog(catalog, options);
    
    expect(result.datasets).toHaveLength(1);
    expect(result.totalMatches).toBe(1);
    expect(result.duration).toBeGreaterThan(0);
  });
  
  test('should filter by query', () => {
    // Add test dataset
    addDatasetToCatalog(testDataset, testConfig);
    const catalog = loadCatalog(testConfig);
    
    const options: CatalogSearchOptions = { query: 'Test' };
    const result = searchCatalog(catalog, options);
    
    expect(result.datasets).toHaveLength(1);
    expect(result.totalMatches).toBe(1);
    
    const options2: CatalogSearchOptions = { query: 'nonexistent' };
    const result2 = searchCatalog(catalog, options2);
    
    expect(result2.datasets).toHaveLength(0);
    expect(result2.totalMatches).toBe(0);
  });
  
  test('should filter by format', () => {
    // Add test dataset
    addDatasetToCatalog(testDataset, testConfig);
    const catalog = loadCatalog(testConfig);
    
    const options: CatalogSearchOptions = { format: ['json'] };
    const result = searchCatalog(catalog, options);
    
    expect(result.datasets).toHaveLength(1);
    
    const options2: CatalogSearchOptions = { format: ['csv'] };
    const result2 = searchCatalog(catalog, options2);
    
    expect(result2.datasets).toHaveLength(0);
  });
  
  test('should filter by tags', () => {
    // Add test dataset
    addDatasetToCatalog(testDataset, testConfig);
    const catalog = loadCatalog(testConfig);
    
    const options: CatalogSearchOptions = { tags: ['test'] };
    const result = searchCatalog(catalog, options);
    
    expect(result.datasets).toHaveLength(1);
    
    const options2: CatalogSearchOptions = { tags: ['nonexistent'] };
    const result2 = searchCatalog(catalog, options2);
    
    expect(result2.datasets).toHaveLength(0);
  });
  
  test('should sort results', () => {
    // Add test dataset
    addDatasetToCatalog(testDataset, testConfig);
    const catalog = loadCatalog(testConfig);
    
    const options: CatalogSearchOptions = { 
      sortBy: 'name',
      sortOrder: 'asc'
    };
    const result = searchCatalog(catalog, options);
    
    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].name).toBe(testDataset.name);
  });
  
  test('should limit results', () => {
    // Add test dataset
    addDatasetToCatalog(testDataset, testConfig);
    const catalog = loadCatalog(testConfig);
    
    const options: CatalogSearchOptions = { limit: 1 };
    const result = searchCatalog(catalog, options);
    
    expect(result.datasets.length).toBeLessThanOrEqual(1);
  });
});

describe('CLI functionality', () => {
  test('should handle init command', async () => {
    mockArgv.mockReturnValue(['node', 'updateCatalog.ts', 'init']);
    
    // Import and run main function
    const { main } = require('../updateCatalog');
    await main();
    
    expect(mockConsole.log).toHaveBeenCalledWith('Initializing catalog...');
    expect(mockConsole.log).toHaveBeenCalledWith(`Catalog created: ${testConfig.catalogPath}`);
    expect(mockConsole.log).toHaveBeenCalledWith('Catalog version: 1.0.0');
    expect(mockConsole.log).toHaveBeenCalledWith('Datasets: 0');
  });
  
  test('should handle help command', async () => {
    mockArgv.mockReturnValue(['node', 'updateCatalog.ts', 'help']);
    
    const { main } = require('../updateCatalog');
    await main();
    
    expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Stress Testing Catalog Management'));
  });
  
  test('should handle unknown command', async () => {
    mockArgv.mockReturnValue(['node', 'updateCatalog.ts', 'unknown']);
    
    const { main } = require('../updateCatalog');
    await main();
    
    expect(mockConsole.error).toHaveBeenCalledWith('Unknown command: unknown');
    expect(mockConsole.log).toHaveBeenCalledWith('Use "help" for available commands');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  test('should handle add command with insufficient arguments', async () => {
    mockArgv.mockReturnValue(['node', 'updateCatalog.ts', 'add']);
    
    const { main } = require('../updateCatalog');
    await main();
    
    expect(mockConsole.error).toHaveBeenCalledWith('Usage: tsx updateCatalog.ts add <dataset-path>');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

describe('Integration tests', () => {
  test('should handle complete workflow', async () => {
    // Initialize catalog
    const catalog = loadCatalog(testConfig);
    expect(catalog.datasets).toHaveLength(0);
    
    // Add dataset
    const addResult = addDatasetToCatalog(testDataset, testConfig);
    expect(addResult.success).toBe(true);
    
    // Verify dataset added
    const updatedCatalog = loadCatalog(testConfig);
    expect(updatedCatalog.datasets).toHaveLength(1);
    
    // Generate statistics
    const stats = generateCatalogStatistics(testConfig);
    expect(stats.totalDatasets).toBe(1);
    
    // Search dataset
    const searchResult = searchCatalog(updatedCatalog, { query: 'Test' });
    expect(searchResult.datasets).toHaveLength(1);
    
    // Remove dataset
    const removeResult = removeDatasetFromCatalog(testDataset.id, testConfig);
    expect(removeResult.success).toBe(true);
    
    // Verify dataset removed
    const finalCatalog = loadCatalog(testConfig);
    expect(finalCatalog.datasets).toHaveLength(0);
  });
  
  test('should handle backup rotation', async () => {
    // Create multiple saves to test backup rotation
    const catalog = loadCatalog(testConfig);
    
    // Save multiple times to create backups
    for (let i = 0; i < 7; i++) {
      saveCatalog(catalog, testConfig);
    }
    
    // Check that only maxBackups backups exist
    const backupFiles = require('fs').readdirSync(testConfig.backupDir)
      .filter((file: string) => file.startsWith('catalog-') && file.endsWith('.json'));
    
    expect(backupFiles.length).toBeLessThanOrEqual(testConfig.maxBackups);
  });
});

describe('Error handling', () => {
  test('should handle corrupted catalog file', () => {
    // Create corrupted catalog file
    writeFileSync(TEST_CATALOG_PATH, 'invalid json content', 'utf-8');
    
    expect(() => {
      loadCatalog(testConfig);
    }).toThrow();
  });
  
  test('should handle file system errors during save', () => {
    // Test with invalid path
    const invalidConfig = { ...testConfig, catalogPath: '/invalid/path/catalog.json' };
    
    const catalog = loadCatalog(testConfig);
    
    expect(() => {
      saveCatalog(catalog, invalidConfig);
    }).toThrow();
  });
});
