/**
 * Storage Integration Tests
 * 
 * Tests the StorageTestFramework with actual storage systems used in the app.
 * These tests verify that all persistence layers work correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StorageTestFramework, type StorageAdapter } from './StorageTestFramework';

describe('Storage Integration Tests', () => {
  // ========================================================================
  // Test 1: localStorage with JSON (Generic Pattern)
  // ========================================================================

  describe('localStorage JSON Pattern', () => {
    interface TestData {
      id: string;
      name: string;
      value: number;
    }

    let adapter: StorageAdapter<TestData>;

    beforeEach(() => {
      localStorage.clear();
      adapter = {
        save: (data) => {
          localStorage.setItem('test_key', JSON.stringify(data));
        },
        load: () => {
          const raw = localStorage.getItem('test_key');
          return raw ? JSON.parse(raw) : ({} as TestData);
        },
        clear: () => {
          localStorage.removeItem('test_key');
        },
      };
    });

    it('should pass all storage tests for localStorage', async () => {
      const tester = new StorageTestFramework('localStorage-json', adapter, {
        verbose: false,
      });

      const testData: TestData = {
        id: 'test-1',
        name: 'Test Item',
        value: 42,
      };

      const results = await tester.runFullTest(testData);
      if (results.failedCount > 0) {
        const failed = results.tests.filter((test) => !test.passed);
        console.warn('Multi-key storage failures:', failed);
      }

      expect(results.successRate).toBe(100);
      expect(results.passedCount).toBe(10);
      expect(results.failedCount).toBe(0);
    });
  });

  // ========================================================================
  // Test 2: Complex Nested Data
  // ========================================================================

  describe('Complex Nested Data', () => {
    interface NestedData {
      id: string;
      metadata: {
        created: string;
        modified: string;
        tags: string[];
      };
      config: {
        settings: Record<string, number | boolean | string>;
        nested: {
          deep: {
            value: number;
          };
        };
      };
    }

    let adapter: StorageAdapter<NestedData>;

    beforeEach(() => {
      localStorage.clear();
      adapter = {
        save: (data) => {
          localStorage.setItem('nested_test', JSON.stringify(data));
        },
        load: () => {
          const raw = localStorage.getItem('nested_test');
          if (!raw) {
            return {
              id: '',
              metadata: { created: '', modified: '', tags: [] },
              config: { settings: {}, nested: { deep: { value: 0 } } },
            } as NestedData;
          }
          return JSON.parse(raw);
        },
        clear: () => {
          localStorage.removeItem('nested_test');
        },
      };
    });

    it('should handle complex nested structures', async () => {
      const tester = new StorageTestFramework('nested-data', adapter, {
        verbose: false,
      });

      const testData: NestedData = {
        id: 'complex-1',
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          tags: ['important', 'archived', 'verified'],
        },
        config: {
          settings: {
            maxRetries: 3,
            timeout: 5000,
            enabled: true,
            mode: 'production',
          },
          nested: {
            deep: {
              value: 999,
            },
          },
        },
      };

      const results = await tester.runFullTest(testData);

      expect(results.successRate).toBe(100);
      expect(results.passedCount).toBe(10);
    });
  });

  // ========================================================================
  // Test 3: Array of Objects
  // ========================================================================

  describe('Array of Objects', () => {
    interface Item {
      id: string;
      name: string;
      active: boolean;
    }

    let adapter: StorageAdapter<Item[]>;

    beforeEach(() => {
      localStorage.clear();
      adapter = {
        save: (data) => {
          localStorage.setItem('items_test', JSON.stringify(data));
        },
        load: () => {
          const raw = localStorage.getItem('items_test');
          return raw ? JSON.parse(raw) : [];
        },
        clear: () => {
          localStorage.removeItem('items_test');
        },
      };
    });

    it('should handle arrays of objects', async () => {
      const tester = new StorageTestFramework('array-objects', adapter, {
        verbose: false,
      });

      const testData: Item[] = [
        { id: '1', name: 'Item 1', active: true },
        { id: '2', name: 'Item 2', active: false },
        { id: '3', name: 'Item 3', active: true },
      ];

      const alternateData: Item[] = [
        { id: '4', name: 'Item 4', active: true },
        { id: '5', name: 'Item 5', active: true },
      ];

      const results = await tester.runFullTest(testData, alternateData);

      expect(results.successRate).toBe(100);
      expect(results.passedCount).toBe(10);
    });
  });

  // ========================================================================
  // Test 4: Async Storage Adapter
  // ========================================================================

  describe('Async Storage Adapter', () => {
    interface AsyncData {
      id: string;
      timestamp: number;
    }

    let asyncStorage: Map<string, string>;
    let adapter: StorageAdapter<AsyncData>;

    beforeEach(() => {
      asyncStorage = new Map();
      adapter = {
        save: async (data) => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10));
          asyncStorage.set('async_test', JSON.stringify(data));
        },
        load: async () => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10));
          const raw = asyncStorage.get('async_test');
          return raw ? JSON.parse(raw) : ({} as AsyncData);
        },
        clear: async () => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10));
          asyncStorage.clear();
        },
      };
    });

    it('should handle async storage operations', async () => {
      const tester = new StorageTestFramework('async-storage', adapter, {
        verbose: false,
        timeout: 5000,
      });

      const testData: AsyncData = {
        id: 'async-1',
        timestamp: Date.now(),
      };

      const results = await tester.runFullTest(testData);

      expect(results.successRate).toBe(100);
      expect(results.passedCount).toBe(10);
    });
  });

  // ========================================================================
  // Test 5: Error Handling in Adapter
  // ========================================================================

  describe('Error Handling', () => {
    interface ErrorTestData {
      id: string;
      value: string;
    }

    it('should detect save failures', async () => {
      const failingAdapter: StorageAdapter<ErrorTestData> = {
        save: () => {
          throw new Error('Save operation failed');
        },
        load: () => ({} as ErrorTestData),
        clear: () => {},
      };

      const tester = new StorageTestFramework('failing-save', failingAdapter, {
        maxRetries: 1,
      });

      const testData: ErrorTestData = { id: '1', value: 'test' };
      const result = await tester.testBasicSaveLoad(testData);

      expect(result.passed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should detect load failures', async () => {
      const failingAdapter: StorageAdapter<ErrorTestData> = {
        save: () => {},
        load: () => {
          throw new Error('Load operation failed');
        },
        clear: () => {},
      };

      const tester = new StorageTestFramework('failing-load', failingAdapter, {
        maxRetries: 1,
      });

      const testData: ErrorTestData = { id: '1', value: 'test' };
      const result = await tester.testBasicSaveLoad(testData);

      expect(result.passed).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ========================================================================
  // Test 6: Large Dataset Performance
  // ========================================================================

  describe('Large Dataset Performance', () => {
    interface LargeData {
      id: string;
      items: Array<{
        id: string;
        data: string;
        value: number;
      }>;
    }

    let adapter: StorageAdapter<LargeData>;

    beforeEach(() => {
      localStorage.clear();
      adapter = {
        save: (data) => {
          localStorage.setItem('large_test', JSON.stringify(data));
        },
        load: () => {
          const raw = localStorage.getItem('large_test');
          return raw ? JSON.parse(raw) : { id: '', items: [] };
        },
        clear: () => {
          localStorage.removeItem('large_test');
        },
      };
    });

    it('should handle large datasets efficiently', async () => {
      const tester = new StorageTestFramework('large-data', adapter, {
        verbose: false,
      });

      // Create large dataset
      const testData: LargeData = {
        id: 'large-1',
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: `item-${i}`,
          data: `Data for item ${i}`.repeat(10),
          value: Math.random() * 1000,
        })),
      };

      const results = await tester.runFullTest(testData);

      expect(results.successRate).toBe(100);
      expect(results.passedCount).toBe(10);
      // Performance should be reasonable even with large data
      expect(results.totalDuration).toBeLessThan(5000);
    });
  });

  // ========================================================================
  // Test 7: Multiple Storage Keys
  // ========================================================================

  describe('Multiple Storage Keys', () => {
    interface MultiKeyData {
      key1: string;
      key2: number;
      key3: boolean;
    }

    let adapter: StorageAdapter<MultiKeyData>;
    const KEY_PREFIX = 'mk_key_';
    const META_KEY = 'mk_meta_keys';
    const DEFAULT_VALUES: MultiKeyData = {
      key1: '',
      key2: 0,
      key3: false,
    };

    const toRecord = (data: MultiKeyData): Record<string, unknown> =>
      data as unknown as Record<string, unknown>;

    function readMetaKeys(): string[] {
      const raw = localStorage.getItem(META_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    }

    function writeMetaKeys(keys: string[]): void {
      localStorage.setItem(META_KEY, JSON.stringify(keys));
    }

    beforeEach(() => {
      localStorage.clear();
      adapter = {
        save: (data) => {
          const dataRecord = toRecord(data);
          const keys = Object.keys(dataRecord);
          const previousKeys = new Set(readMetaKeys());

          keys.forEach((key) => {
            localStorage.setItem(`${KEY_PREFIX}${key}`, JSON.stringify(dataRecord[key]));
            previousKeys.delete(key);
          });

          // remove stale keys
          previousKeys.forEach((staleKey) => {
            localStorage.removeItem(`${KEY_PREFIX}${staleKey}`);
          });

          writeMetaKeys(keys);
        },
        load: () => {
          const keys = readMetaKeys();
          if (keys.length === 0) {
            return { ...DEFAULT_VALUES };
          }

          const restored = keys.reduce((acc, key) => {
            const raw = localStorage.getItem(`${KEY_PREFIX}${key}`);
            acc[key] = raw !== null ? JSON.parse(raw) : null;
            return acc;
          }, {} as Record<string, unknown>);

          return {
            ...DEFAULT_VALUES,
            ...(restored as Partial<MultiKeyData>),
          };
        },
        clear: () => {
          const keys = readMetaKeys();
          keys.forEach((key) => localStorage.removeItem(`${KEY_PREFIX}${key}`));
          localStorage.removeItem(META_KEY);
        },
      };
    });

    it('should handle multiple storage keys', async () => {
      const tester = new StorageTestFramework('multi-key', adapter, {
        verbose: true,
        timeout: 10000, // increase timeout for multi-key scenario
      });

      const testData: MultiKeyData = {
        key1: 'test-value',
        key2: 42,
        key3: true,
      };

      const results = await tester.runFullTest(testData);

      expect(results.successRate).toBe(100);
      expect(results.passedCount).toBe(10);
    });
  });

  // ========================================================================
  // Test 8: Batch Operations
  // ========================================================================

  describe('Batch Operations', () => {
    interface BatchItem {
      id: string;
      processed: boolean;
    }

    it('should run multiple storage tests in sequence', async () => {
      const results = [];

      for (let i = 0; i < 3; i++) {
        const adapter: StorageAdapter<BatchItem> = {
          save: (data) => {
            localStorage.setItem(`batch_${i}`, JSON.stringify(data));
          },
          load: () => {
            const raw = localStorage.getItem(`batch_${i}`);
            return raw ? JSON.parse(raw) : ({} as BatchItem);
          },
          clear: () => {
            localStorage.removeItem(`batch_${i}`);
          },
        };

        const tester = new StorageTestFramework(`batch-${i}`, adapter, {
          verbose: false,
        });

        const testData: BatchItem = {
          id: `batch-item-${i}`,
          processed: i % 2 === 0,
        };

        const result = await tester.runFullTest(testData);
        results.push(result);
      }

      // All batch tests should pass
      results.forEach((result) => {
        expect(result.successRate).toBe(100);
        expect(result.passedCount).toBe(10);
      });
    });
  });
});
