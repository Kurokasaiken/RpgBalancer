# Storage Testing Framework Guide

## Overview

The **StorageTestFramework** is a generic, reusable testing system for any save/load pattern in the application. It works with:

- `localStorage`
- `sessionStorage`
- Custom storage implementations
- Any persistence layer (databases, APIs, etc.)

## Quick Start

### Basic Usage

```typescript
import { StorageTestFramework } from '@/shared/testing/StorageTestFramework';

// 1. Define your storage adapter
const adapter = {
  save: (data) => localStorage.setItem('key', JSON.stringify(data)),
  load: () => JSON.parse(localStorage.getItem('key') || '{}'),
  clear: () => localStorage.removeItem('key'),
};

// 2. Create a tester
const tester = new StorageTestFramework('myStorage', adapter, {
  verbose: true,
});

// 3. Run tests
const results = await tester.runFullTest(testData);
console.log(`Success Rate: ${results.successRate}%`);
```

## API Reference

### StorageAdapter<T>

Interface that defines the storage contract:

```typescript
interface StorageAdapter<T> {
  save: (data: T) => void | Promise<void>;
  load: () => T | Promise<T>;
  clear: () => void | Promise<void>;
}
```

### StorageTestFramework<T>

Main testing class.

#### Constructor

```typescript
new StorageTestFramework(
  name: string,
  adapter: StorageAdapter<T>,
  config?: StorageTestConfig
)
```

**Config Options:**
- `verbose?: boolean` - Log detailed test output (default: false)
- `timeout?: number` - Timeout per test in ms (default: 5000)
- `maxRetries?: number` - Retry failed tests (default: 3)

#### Methods

##### `runFullTest(testData: T, alternateData?: T): Promise<TestSuite>`

Runs all 10 tests and returns comprehensive results.

```typescript
const suite = await tester.runFullTest(testData, alternateData);
// {
//   name: 'myStorage',
//   tests: [...],
//   totalDuration: 123.45,
//   passedCount: 10,
//   failedCount: 0,
//   successRate: 100
// }
```

##### Individual Test Methods

```typescript
// Test 1: Basic save and load
await tester.testBasicSaveLoad(data);

// Test 2: Data integrity (deep equality)
await tester.testDataIntegrity(data);

// Test 3: Multiple saves (overwrite)
await tester.testMultipleSaves(data1, data2);

// Test 4: Clear operation
await tester.testClear(data);

// Test 5: Empty state handling
await tester.testEmptyState();

// Test 6: Large data handling
await tester.testLargeData(data, multiplier);

// Test 7: Concurrent operations
await tester.testConcurrentOperations(data);

// Test 8: Type preservation
await tester.testTypePreservation(data);

// Test 9: Error recovery
await tester.testErrorRecovery(data);

// Test 10: Performance benchmark
await tester.testPerformance(data, iterations);
```

##### `getResultsJSON(): TestSuite | null`

Get results as JSON for reporting/logging.

## Test Descriptions

### 1. Basic Save & Load
Verifies that data can be saved and loaded correctly.

**What it tests:**
- Save operation completes
- Load operation returns the saved data
- Data matches exactly

### 2. Data Integrity
Ensures deep equality between saved and loaded data.

**What it tests:**
- Nested objects are preserved
- Arrays maintain order
- Primitive types are correct

### 3. Multiple Saves (Overwrite)
Verifies that saving new data overwrites old data.

**What it tests:**
- First save works
- Second save overwrites first
- Load returns the latest data

### 4. Clear Operation
Tests the clear/reset functionality.

**What it tests:**
- Clear operation completes
- No errors are thrown
- Storage is properly cleaned

### 5. Empty State Handling
Verifies behavior when storage is empty.

**What it tests:**
- Load on empty storage doesn't crash
- Returns reasonable default value
- No null/undefined returns

### 6. Large Data Handling
Tests performance with large datasets.

**What it tests:**
- Large objects can be saved
- Large objects can be loaded
- Data integrity is maintained with large data

### 7. Concurrent Operations
Tests multiple simultaneous save/load operations.

**What it tests:**
- Concurrent saves don't corrupt data
- Final state is consistent
- No race conditions

### 8. Type Preservation
Ensures object structure and types are preserved.

**What it tests:**
- Original and loaded types match
- Object keys are preserved
- Nested structure is maintained

### 9. Error Recovery
Tests consistency after potential errors.

**What it tests:**
- Multiple loads return same data
- No inconsistency after errors
- Resilience to failures

### 10. Performance Benchmark
Measures save/load performance.

**What it tests:**
- Average operation time
- Warns if operations exceed 100ms
- Provides performance metrics

## Usage Examples

### Example 1: Test localStorage

```typescript
import { testLocalStorageJSON } from '@/shared/testing/StorageTestExamples';

const testData = { id: '1', name: 'Test' };
const results = await testLocalStorageJSON('my_key', testData);
```

### Example 2: Test Balancer Config Store

```typescript
import { testBalancerConfigStore } from '@/shared/testing/StorageTestExamples';
import { DEFAULT_CONFIG } from '@/balancing/config/defaultConfig';

const results = await testBalancerConfigStore(DEFAULT_CONFIG);
```

### Example 3: Test Spell Storage

```typescript
import { testSpellStorage } from '@/shared/testing/StorageTestExamples';
import { DEFAULT_SPELLS } from '@/balancing/defaultSpells';

const results = await testSpellStorage(DEFAULT_SPELLS);
```

### Example 4: Custom Storage Implementation

```typescript
import { StorageTestFramework } from '@/shared/testing/StorageTestFramework';

class MyCustomStorage {
  private data = {};
  
  save(key, value) { this.data[key] = value; }
  load(key) { return this.data[key]; }
  clear(key) { delete this.data[key]; }
}

const storage = new MyCustomStorage();
const adapter = {
  save: (data) => storage.save('test', data),
  load: () => storage.load('test'),
  clear: () => storage.clear('test'),
};

const tester = new StorageTestFramework('custom', adapter, { verbose: true });
const results = await tester.runFullTest(testData);
```

## Running Tests

### In Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { StorageTestFramework } from '@/shared/testing/StorageTestFramework';

describe('My Storage', () => {
  it('should pass all storage tests', async () => {
    const tester = new StorageTestFramework('test', adapter);
    const results = await tester.runFullTest(testData);
    
    expect(results.successRate).toBe(100);
    expect(results.failedCount).toBe(0);
  });
});
```

### In React Components

```typescript
import { useEffect, useState } from 'react';
import { StorageTestFramework } from '@/shared/testing/StorageTestFramework';

export function StorageTestComponent() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const tester = new StorageTestFramework('test', adapter);
      const suite = await tester.runFullTest(testData);
      setResults(suite);
      setLoading(false);
    };

    runTests();
  }, []);

  if (loading) return <div>Testing...</div>;

  return (
    <div>
      <h2>Storage Test Results</h2>
      <p>Success Rate: {results.successRate}%</p>
      <p>Passed: {results.passedCount}/{results.tests.length}</p>
      <p>Duration: {results.totalDuration.toFixed(2)}ms</p>
    </div>
  );
}
```

## Test Results Format

### TestResult

```typescript
interface TestResult {
  name: string;           // Test name
  passed: boolean;        // Pass/fail status
  duration: number;       // Execution time in ms
  error?: string;         // Error message if failed
  details?: Record<string, any>; // Additional info
}
```

### TestSuite

```typescript
interface TestSuite {
  name: string;           // Storage name
  tests: TestResult[];    // All test results
  totalDuration: number;  // Total time in ms
  passedCount: number;    // Number of passed tests
  failedCount: number;    // Number of failed tests
  successRate: number;    // Percentage (0-100)
}
```

## Best Practices

### 1. Use Realistic Test Data

```typescript
// ✅ Good: Use actual data structures
const testData = {
  id: 'user-123',
  name: 'John Doe',
  stats: { hp: 100, damage: 25 },
  items: ['sword', 'shield'],
};

// ❌ Bad: Overly simple data
const testData = { test: 'data' };
```

### 2. Test with Alternate Data

```typescript
// ✅ Good: Test overwrite behavior
const results = await tester.runFullTest(data1, data2);

// ❌ Bad: Only test with one dataset
const results = await tester.runFullTest(data1);
```

### 3. Enable Verbose Mode During Development

```typescript
// ✅ Good: See detailed output
const tester = new StorageTestFramework('test', adapter, {
  verbose: true,
});

// ❌ Bad: Silent failures
const tester = new StorageTestFramework('test', adapter);
```

### 4. Handle Async Operations

```typescript
// ✅ Good: Await async operations
const adapter = {
  save: async (data) => await db.save(data),
  load: async () => await db.load(),
  clear: async () => await db.clear(),
};

// ❌ Bad: Ignore promises
const adapter = {
  save: (data) => db.save(data), // Missing await
  load: () => db.load(),
  clear: () => db.clear(),
};
```

### 5. Check Results Properly

```typescript
// ✅ Good: Check success rate
if (results.successRate === 100) {
  console.log('All tests passed!');
}

// ❌ Bad: Only check passed count
if (results.passedCount > 0) {
  console.log('Some tests passed');
}
```

## Troubleshooting

### Tests Timing Out

**Problem:** Tests fail with "Test timeout" error.

**Solution:** Increase timeout in config:

```typescript
const tester = new StorageTestFramework('test', adapter, {
  timeout: 10000, // 10 seconds
});
```

### Data Corruption Detected

**Problem:** "Data integrity check failed" error.

**Solution:** Check your serialization:

```typescript
// ✅ Good: Proper JSON serialization
save: (data) => localStorage.setItem('key', JSON.stringify(data)),
load: () => JSON.parse(localStorage.getItem('key')),

// ❌ Bad: Incomplete serialization
save: (data) => localStorage.setItem('key', data),
load: () => localStorage.getItem('key'),
```

### Concurrent Operations Fail

**Problem:** "Concurrent operations resulted in null load" error.

**Solution:** Ensure thread-safe operations:

```typescript
// ✅ Good: Use locks or queues
const queue = [];
save: async (data) => {
  queue.push(data);
  while (queue.length > 0) {
    const item = queue.shift();
    await localStorage.setItem('key', JSON.stringify(item));
  }
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Run Storage Tests
  run: npm run test -- StorageTestFramework.test.ts

- name: Generate Test Report
  if: always()
  run: npm run test -- StorageTestFramework.test.ts --reporter=json > test-results.json
```

## Performance Benchmarks

Expected performance on modern systems:

| Operation | Expected Time |
|-----------|---------------|
| Save small object | < 1ms |
| Load small object | < 1ms |
| Save large object (100KB) | < 10ms |
| Load large object (100KB) | < 10ms |
| Concurrent 5 saves | < 5ms total |
| Performance benchmark (100 iterations) | < 100ms |

## Contributing

To add new tests to the framework:

1. Add test method to `StorageTestFramework` class
2. Add example in `StorageTestExamples.ts`
3. Add unit test in `StorageTestFramework.test.ts`
4. Update this documentation

## License

Part of RpgBalancer project.
