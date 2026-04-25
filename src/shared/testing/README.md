# Storage Testing Framework

A generic, reusable testing system for save/load patterns in the RpgBalancer application.

## Files

### Core Framework

- **`StorageTestFramework.ts`** - Main testing framework (10 comprehensive tests)
- **`StorageTestFramework.test.ts`** - Unit tests for the framework itself

### Examples & Usage

- **`StorageTestExamples.ts`** - Ready-to-use examples for:
  - localStorage with JSON
  - BalancerConfigStore
  - SpellStorage
  - CharacterStorage
  - PresetStorage
  - Custom memory storage
  - Batch test runner

## Quick Start

```typescript
import { StorageTestFramework } from '@/shared/testing/StorageTestFramework';

// Create adapter
const adapter = {
  save: (data) => localStorage.setItem('key', JSON.stringify(data)),
  load: () => JSON.parse(localStorage.getItem('key') || '{}'),
  clear: () => localStorage.removeItem('key'),
};

// Run tests
const tester = new StorageTestFramework('myStorage', adapter, { verbose: true });
const results = await tester.runFullTest(testData);

console.log(`Success Rate: ${results.successRate}%`);
```

## 10 Comprehensive Tests

1. **Basic Save & Load** - Verify data can be saved and loaded
2. **Data Integrity** - Ensure deep equality of saved/loaded data
3. **Multiple Saves** - Test overwrite behavior
4. **Clear Operation** - Verify cleanup functionality
5. **Empty State** - Handle empty storage gracefully
6. **Large Data** - Test with large datasets
7. **Concurrent Operations** - Handle simultaneous operations
8. **Type Preservation** - Maintain object structure and types
9. **Error Recovery** - Ensure consistency after errors
10. **Performance** - Benchmark save/load operations

## Features

✅ **Generic** - Works with any storage system
✅ **Async-Friendly** - Supports async operations
✅ **Configurable** - Timeout, retries, verbose logging
✅ **Comprehensive** - 10 different test scenarios
✅ **Detailed Results** - Timing, error messages, success rates
✅ **Reusable** - Use across the entire application
✅ **Well-Tested** - Framework itself has unit tests

## Usage Examples

### Test localStorage
```typescript
import { testLocalStorageJSON } from '@/shared/testing/StorageTestExamples';
const results = await testLocalStorageJSON('key', testData);
```

### Test Balancer Config
```typescript
import { testBalancerConfigStore } from '@/shared/testing/StorageTestExamples';
const results = await testBalancerConfigStore(configData);
```

### Test Spells
```typescript
import { testSpellStorage } from '@/shared/testing/StorageTestExamples';
const results = await testSpellStorage(spellsData);
```

## Full Documentation

See `../../docs/STORAGE_TESTING_GUIDE.md` for comprehensive documentation.

## Running Tests

```bash
# Run framework unit tests
npm run test -- StorageTestFramework.test.ts

# Run with coverage
npm run test -- StorageTestFramework.test.ts --coverage
```

## Integration Points

The framework is designed to test all storage systems in the app:

- `src/balancing/config/BalancerConfigStore.ts`
- `src/balancing/spellStorage.ts`
- `src/balancing/presetStorage.ts`
- `src/balancing/character/storage.ts`
- `src/shared/hooks/useDefaultStorage.ts`
- Any custom localStorage implementation

## Performance Expectations

| Operation | Expected Time |
|-----------|---------------|
| Save small object | < 1ms |
| Load small object | < 1ms |
| 100 iterations | < 100ms |
| Large data (100KB) | < 10ms |

## Contributing

To add new tests:

1. Add method to `StorageTestFramework` class
2. Add example in `StorageTestExamples.ts`
3. Add unit test in `StorageTestFramework.test.ts`
4. Update documentation

## License

Part of RpgBalancer project.
