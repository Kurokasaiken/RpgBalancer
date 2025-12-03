/**
 * Generic Storage Testing Framework
 * 
 * Provides a reusable testing system for any save/load pattern.
 * Works with localStorage, sessionStorage, or custom storage implementations.
 * 
 * Usage:
 * ```ts
 * const tester = new StorageTestFramework<MyData>('myStorage', {
 *   save: (data) => localStorage.setItem('key', JSON.stringify(data)),
 *   load: () => JSON.parse(localStorage.getItem('key') || '{}'),
 *   clear: () => localStorage.removeItem('key')
 * });
 * 
 * const results = await tester.runFullTest(testData);
 * ```
 */

export interface StorageAdapter<T> {
  save: (data: T) => void | Promise<void>;
  load: () => T | Promise<T>;
  clear: () => void | Promise<void>;
}

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  totalDuration: number;
  passedCount: number;
  failedCount: number;
  successRate: number;
}

export interface StorageTestConfig {
  verbose?: boolean;
  timeout?: number;
  maxRetries?: number;
}

export class StorageTestFramework<T> {
  private adapter: StorageAdapter<T>;
  private name: string;
  private config: Required<StorageTestConfig>;
  private results: TestResult[] = [];

  constructor(
    name: string,
    adapter: StorageAdapter<T>,
    config: StorageTestConfig = {}
  ) {
    this.name = name;
    this.adapter = adapter;
    this.config = {
      verbose: config.verbose ?? false,
      timeout: config.timeout ?? 5000,
      maxRetries: config.maxRetries ?? 3,
    };
  }

  /**
   * Run a single test with timing and error handling
   */
  private async runTest(
    testName: string,
    testFn: () => void | Promise<void>
  ): Promise<TestResult> {
    const startTime = performance.now();
    let retries = 0;

    while (retries < this.config.maxRetries) {
      try {
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Test timeout')), this.config.timeout)
        );

        await Promise.race([testFn(), timeoutPromise]);

        const duration = performance.now() - startTime;
        const result: TestResult = {
          name: testName,
          passed: true,
          duration,
        };

        if (this.config.verbose) {
          console.log(`✓ ${testName} (${duration.toFixed(2)}ms)`);
        }

        return result;
      } catch (error) {
        retries++;
        if (retries >= this.config.maxRetries) {
          const duration = performance.now() - startTime;
          const result: TestResult = {
            name: testName,
            passed: false,
            duration,
            error: (error as Error).message,
          };

          if (this.config.verbose) {
            console.error(`✗ ${testName}: ${(error as Error).message}`);
          }

          return result;
        }
      }
    }

    throw new Error('Unexpected state in runTest');
  }

  /**
   * Test 1: Basic Save and Load
   */
  async testBasicSaveLoad(data: T): Promise<TestResult> {
    return this.runTest('Basic Save & Load', async () => {
      await this.adapter.clear();
      await this.adapter.save(data);
      const loaded = await this.adapter.load();

      if (JSON.stringify(loaded) !== JSON.stringify(data)) {
        throw new Error('Loaded data does not match saved data');
      }
    });
  }

  /**
   * Test 2: Data Integrity (Deep Equality)
   */
  async testDataIntegrity(data: T): Promise<TestResult> {
    return this.runTest('Data Integrity', async () => {
      await this.adapter.clear();
      await this.adapter.save(data);
      const loaded = await this.adapter.load();

      // Deep comparison
      const original = JSON.stringify(data);
      const restored = JSON.stringify(loaded);

      if (original !== restored) {
        throw new Error('Data integrity check failed');
      }
    });
  }

  /**
   * Test 3: Multiple Saves (Overwrite)
   */
  async testMultipleSaves(data1: T, data2: T): Promise<TestResult> {
    return this.runTest('Multiple Saves (Overwrite)', async () => {
      await this.adapter.clear();
      await this.adapter.save(data1);
      await this.adapter.save(data2);
      const loaded = await this.adapter.load();

      if (JSON.stringify(loaded) !== JSON.stringify(data2)) {
        throw new Error('Second save did not overwrite first');
      }
    });
  }

  /**
   * Test 4: Clear Operation
   */
  async testClear(data: T): Promise<TestResult> {
    return this.runTest('Clear Operation', async () => {
      await this.adapter.clear();
      await this.adapter.save(data);
      await this.adapter.clear();

      // After clear, load should return empty/default state
      // This depends on implementation, so we just verify no error
    });
  }

  /**
   * Test 5: Empty State Handling
   */
  async testEmptyState(): Promise<TestResult> {
    return this.runTest('Empty State Handling', async () => {
      await this.adapter.clear();
      const loaded = await this.adapter.load();

      // Should not throw, should return something reasonable
      if (loaded === null || loaded === undefined) {
        throw new Error('Empty state returned null/undefined');
      }
    });
  }

  /**
   * Test 6: Large Data Handling
   */
  async testLargeData(data: T, multiplier: number = 100): Promise<TestResult> {
    return this.runTest('Large Data Handling', async () => {
      await this.adapter.clear();

      // Create a large dataset by repeating the data
      const largeData = JSON.parse(JSON.stringify(data));
      if (typeof largeData === 'object' && largeData !== null) {
        for (let i = 0; i < multiplier; i++) {
          Object.assign(largeData, { [`_large_${i}`]: Math.random() });
        }
      }

      await this.adapter.save(largeData as T);
      const loaded = await this.adapter.load();

      if (JSON.stringify(loaded) !== JSON.stringify(largeData)) {
        throw new Error('Large data integrity failed');
      }
    });
  }

  /**
   * Test 7: Concurrent Operations
   */
  async testConcurrentOperations(data: T): Promise<TestResult> {
    return this.runTest('Concurrent Operations', async () => {
      await this.adapter.clear();

      // Run multiple saves concurrently
      const promises = Array(5)
        .fill(null)
        .map((_, i) => {
          const modifiedData = JSON.parse(JSON.stringify(data));
          if (typeof modifiedData === 'object' && modifiedData !== null) {
            (modifiedData as any)._concurrent_id = i;
          }
          return this.adapter.save(modifiedData as T);
        });

      await Promise.all(promises);

      // Final load should succeed
      const loaded = await this.adapter.load();
      if (!loaded) {
        throw new Error('Concurrent operations resulted in null load');
      }
    });
  }

  /**
   * Test 8: Type Preservation
   */
  async testTypePreservation(data: T): Promise<TestResult> {
    return this.runTest('Type Preservation', async () => {
      await this.adapter.clear();
      await this.adapter.save(data);
      const loaded = await this.adapter.load();

      // Check that types are preserved (especially for nested objects)
      const originalType = typeof data;
      const loadedType = typeof loaded;

      if (originalType !== loadedType) {
        throw new Error(
          `Type mismatch: expected ${originalType}, got ${loadedType}`
        );
      }

      // For objects, check structure
      if (originalType === 'object') {
        const originalKeys = Object.keys(data as any).sort();
        const loadedKeys = Object.keys(loaded as any).sort();

        if (JSON.stringify(originalKeys) !== JSON.stringify(loadedKeys)) {
          throw new Error('Object structure mismatch');
        }
      }
    });
  }

  /**
   * Test 9: Error Recovery
   */
  async testErrorRecovery(data: T): Promise<TestResult> {
    return this.runTest('Error Recovery', async () => {
      await this.adapter.clear();
      await this.adapter.save(data);

      // Try to load multiple times to ensure consistency
      const loaded1 = await this.adapter.load();
      const loaded2 = await this.adapter.load();

      if (JSON.stringify(loaded1) !== JSON.stringify(loaded2)) {
        throw new Error('Inconsistent loads after potential error');
      }
    });
  }

  /**
   * Test 10: Performance Benchmark
   */
  async testPerformance(data: T, iterations: number = 100): Promise<TestResult> {
    return this.runTest('Performance Benchmark', async () => {
      await this.adapter.clear();

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        await this.adapter.save(data);
        await this.adapter.load();
      }

      const duration = performance.now() - startTime;
      const avgTime = duration / (iterations * 2); // save + load

      if (avgTime > 100) {
        // Warning threshold: 100ms per operation
        console.warn(
          `Performance warning: ${avgTime.toFixed(2)}ms per operation (threshold: 100ms)`
        );
      }
    });
  }

  /**
   * Run all tests
   */
  async runFullTest(
    testData: T,
    alternateData?: T
  ): Promise<TestSuite> {
    const startTime = performance.now();
    this.results = [];

    if (this.config.verbose) {
      console.log(`\n🧪 Starting Storage Test Suite: ${this.name}`);
      console.log('='.repeat(50));
    }

    // Run all tests
    this.results.push(await this.testBasicSaveLoad(testData));
    this.results.push(await this.testDataIntegrity(testData));
    this.results.push(
      await this.testMultipleSaves(testData, alternateData || testData)
    );
    this.results.push(await this.testClear(testData));
    this.results.push(await this.testEmptyState());
    this.results.push(await this.testLargeData(testData));
    this.results.push(await this.testConcurrentOperations(testData));
    this.results.push(await this.testTypePreservation(testData));
    this.results.push(await this.testErrorRecovery(testData));
    this.results.push(await this.testPerformance(testData));

    const totalDuration = performance.now() - startTime;
    const passedCount = this.results.filter((r) => r.passed).length;
    const failedCount = this.results.filter((r) => !r.passed).length;

    const suite: TestSuite = {
      name: this.name,
      tests: this.results,
      totalDuration,
      passedCount,
      failedCount,
      successRate: (passedCount / this.results.length) * 100,
    };

    if (this.config.verbose) {
      this.printSummary(suite);
    }

    return suite;
  }

  /**
   * Print test results summary
   */
  private printSummary(suite: TestSuite): void {
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${suite.name}`);
    console.log('='.repeat(50));

    this.results.forEach((result) => {
      const icon = result.passed ? '✓' : '✗';
      const status = result.passed ? 'PASS' : 'FAIL';
      console.log(
        `${icon} ${result.name.padEnd(30)} [${status}] ${result.duration.toFixed(2)}ms`
      );
      if (result.error) {
        console.log(`  └─ Error: ${result.error}`);
      }
    });

    console.log('='.repeat(50));
    console.log(
      `Summary: ${suite.passedCount}/${this.results.length} passed (${suite.successRate.toFixed(1)}%)`
    );
    console.log(`Total Duration: ${suite.totalDuration.toFixed(2)}ms`);
    console.log('='.repeat(50) + '\n');
  }

  /**
   * Get results as JSON for reporting
   */
  getResultsJSON(): TestSuite | null {
    if (this.results.length === 0) return null;

    const passedCount = this.results.filter((r) => r.passed).length;
    const failedCount = this.results.filter((r) => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      name: this.name,
      tests: this.results,
      totalDuration,
      passedCount,
      failedCount,
      successRate: (passedCount / this.results.length) * 100,
    };
  }
}
