/**
 * Storage Test Framework - Unit Tests
 * 
 * Tests the StorageTestFramework itself to ensure it works correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageTestFramework, type StorageAdapter } from './StorageTestFramework';

describe('StorageTestFramework', () => {
  interface TestData {
    id: string;
    name: string;
    value: number;
    nested?: {
      key: string;
      items: number[];
    };
  }

  let mockStorage: Map<string, string>;
  let adapter: StorageAdapter<TestData>;

  beforeEach(() => {
    mockStorage = new Map();
    adapter = {
      save: (data) => {
        mockStorage.set('test', JSON.stringify(data));
      },
      load: () => {
        const raw = mockStorage.get('test');
        if (!raw) return {} as TestData;
        return JSON.parse(raw);
      },
      clear: () => {
        mockStorage.clear();
      },
    };
  });

  afterEach(() => {
    mockStorage.clear();
  });

  const testData: TestData = {
    id: 'test-1',
    name: 'Test Item',
    value: 42,
    nested: {
      key: 'nested-key',
      items: [1, 2, 3, 4, 5],
    },
  };

  const alternateData: TestData = {
    id: 'test-2',
    name: 'Alternate Item',
    value: 100,
    nested: {
      key: 'alternate-key',
      items: [10, 20, 30],
    },
  };

  it('should create a framework instance', () => {
    const framework = new StorageTestFramework('test', adapter);
    expect(framework).toBeDefined();
  });

  it('should run basic save and load test', async () => {
    const framework = new StorageTestFramework('test', adapter);
    const result = await framework.testBasicSaveLoad(testData);

    expect(result.passed).toBe(true);
    expect(result.name).toBe('Basic Save & Load');
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should verify data integrity', async () => {
    const framework = new StorageTestFramework('test', adapter);
    const result = await framework.testDataIntegrity(testData);

    expect(result.passed).toBe(true);
    expect(result.name).toBe('Data Integrity');
  });

  it('should handle multiple saves (overwrite)', async () => {
    const framework = new StorageTestFramework('test', adapter);
    const result = await framework.testMultipleSaves(testData, alternateData);

    expect(result.passed).toBe(true);
    expect(result.name).toBe('Multiple Saves (Overwrite)');
  });

  it('should clear storage', async () => {
    const framework = new StorageTestFramework('test', adapter);
    const result = await framework.testClear(testData);

    expect(result.passed).toBe(true);
    expect(result.name).toBe('Clear Operation');
  });

  it('should handle empty state', async () => {
    const framework = new StorageTestFramework('test', adapter);
    const result = await framework.testEmptyState();

    expect(result.passed).toBe(true);
    expect(result.name).toBe('Empty State Handling');
  });

  it('should handle large data', async () => {
    const framework = new StorageTestFramework('test', adapter);
    const result = await framework.testLargeData(testData, 50);

    expect(result.passed).toBe(true);
    expect(result.name).toBe('Large Data Handling');
  });

  it('should handle concurrent operations', async () => {
    const framework = new StorageTestFramework('test', adapter);
    const result = await framework.testConcurrentOperations(testData);

    expect(result.passed).toBe(true);
    expect(result.name).toBe('Concurrent Operations');
  });

  it('should preserve types', async () => {
    const framework = new StorageTestFramework('test', adapter);
    const result = await framework.testTypePreservation(testData);

    expect(result.passed).toBe(true);
    expect(result.name).toBe('Type Preservation');
  });

  it('should handle error recovery', async () => {
    const framework = new StorageTestFramework('test', adapter);
    const result = await framework.testErrorRecovery(testData);

    expect(result.passed).toBe(true);
    expect(result.name).toBe('Error Recovery');
  });

  it('should benchmark performance', async () => {
    const framework = new StorageTestFramework('test', adapter);
    const result = await framework.testPerformance(testData, 50);

    expect(result.passed).toBe(true);
    expect(result.name).toBe('Performance Benchmark');
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should run full test suite', async () => {
    const framework = new StorageTestFramework('test', adapter, {
      verbose: false,
    });
    const suite = await framework.runFullTest(testData, alternateData);

    expect(suite).toBeDefined();
    expect(suite.name).toBe('test');
    expect(suite.tests.length).toBe(10);
    expect(suite.passedCount).toBeGreaterThan(0);
    expect(suite.successRate).toBeGreaterThan(0);
    expect(suite.totalDuration).toBeGreaterThan(0);
  });

  it('should detect save/load failures', async () => {
    const failingAdapter: StorageAdapter<TestData> = {
      save: () => {
        throw new Error('Save failed');
      },
      load: () => {
        throw new Error('Load failed');
      },
      clear: () => {
        throw new Error('Clear failed');
      },
    };

    const framework = new StorageTestFramework('test', failingAdapter, {
      maxRetries: 1,
    });
    const result = await framework.testBasicSaveLoad(testData);

    expect(result.passed).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should get results as JSON', async () => {
    const framework = new StorageTestFramework('test', adapter);
    await framework.runFullTest(testData);
    const json = framework.getResultsJSON();

    expect(json).toBeDefined();
    expect(json?.name).toBe('test');
    expect(json?.tests.length).toBe(10);
  });

  it('should respect timeout configuration', async () => {
    const slowAdapter: StorageAdapter<TestData> = {
      save: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      },
      load: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return testData;
      },
      clear: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      },
    };

    const framework = new StorageTestFramework('test', slowAdapter, {
      timeout: 50,
      maxRetries: 1,
    });
    const result = await framework.testBasicSaveLoad(testData);

    // Should fail due to timeout
    expect(result.passed).toBe(false);
  });
});
