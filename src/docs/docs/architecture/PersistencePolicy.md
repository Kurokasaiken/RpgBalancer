# Persistence Policy

## Overview

This document outlines the persistence policy for the RPG Balancer project, ensuring consistent and reliable data storage across all modules.

## Policy Statement

**All persistence operations MUST use the async `PersistenceService` abstraction layer. Direct usage of `localStorage`, `sessionStorage`, or synchronous storage patterns is prohibited.**

## Requirements

### ✅ Allowed Patterns

```typescript
// ✅ Correct: Use async PersistenceService
import { PersistenceService } from '@/services/persistence';

const data = await PersistenceService.getItem('key');
await PersistenceService.setItem('key', value);
await PersistenceService.removeItem('key');
await PersistenceService.clear();
```

### ❌ Prohibited Patterns

```typescript
// ❌ Incorrect: Direct localStorage usage
const data = localStorage.getItem('key');
localStorage.setItem('key', value);

// ❌ Incorrect: Direct sessionStorage usage  
const session = sessionStorage.getItem('key');
sessionStorage.setItem('key', value);

// ❌ Incorrect: Synchronous storage patterns
storage.getItem('key');
storage.setItem('key', value);

// ❌ Incorrect: Direct storage property access
storage.clear();
storage.length;
```

## Implementation Guidelines

### 1. Service Integration

All modules must import and use the `PersistenceService`:

```typescript
import { PersistenceService } from '@/shared/services/PersistenceService';

export class GameDataManager {
  async saveGameState(state: GameState): Promise<void> {
    await PersistenceService.setItem('gameState', state);
  }

  async loadGameState(): Promise<GameState | null> {
    return await PersistenceService.getItem('gameState');
  }
}
```

### 2. Error Handling

Always handle async operations properly:

```typescript
try {
  const data = await PersistenceService.getItem('config');
  if (data) {
    // Process data
  }
} catch (error) {
  console.error('Failed to load configuration:', error);
  // Handle error appropriately
}
```

### 3. Type Safety

Use TypeScript interfaces for stored data:

```typescript
interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
}

const preferences = await PersistenceService.getItem<UserPreferences>('userPrefs');
```

## Enforcement

### Automated Auditing

The project includes an automated persistence audit script:

```bash
# Run persistence audit
npm run audit:persistence

# Run with verbose output
npm run audit:persistence -- --verbose

# Save results to file
npm run audit:persistence -- --output audit-results.json
```

### CI/CD Integration

The persistence audit is integrated into the CI pipeline:

```yaml
# Example GitHub Actions step
- name: Audit Persistence Usage
  run: npm run audit:persistence
```

### Violation Types

The audit detects these violation types:

1. **localStorage** (Error) - Direct localStorage usage
2. **sessionStorage** (Error) - Direct sessionStorage usage  
3. **sync-persistence** (Warning) - Synchronous getItem/setItem calls
4. **direct-storage** (Error) - Direct storage property access

## Architecture

### PersistenceService Interface

```typescript
interface PersistenceService {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getKeys(): Promise<string[]>;
  getSize(): Promise<number>;
}
```

### Storage Abstraction Layer

```
┌─────────────────┐
│   Application   │
├─────────────────┤
│ PersistenceService │
├─────────────────┤
│   Storage API   │
├─────────────────┤
│ localStorage    │
│ sessionStorage   │
│   IndexedDB     │
└─────────────────┘
```

## Migration Guide

### From Direct Storage

**Before:**
```typescript
const data = localStorage.getItem('key');
localStorage.setItem('key', value);
```

**After:**
```typescript
const data = await PersistenceService.getItem('key');
await PersistenceService.setItem('key', value);
```

### Batch Migration

1. Identify files using direct storage (run audit)
2. Update imports to include PersistenceService
3. Replace direct storage calls with async equivalents
4. Add proper error handling
5. Test thoroughly

## Testing

### Unit Testing

Mock PersistenceService in tests:

```typescript
import { vi } from 'vitest';

vi.mock('@/services/PersistenceService', () => ({
  PersistenceService: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}));
```

### Integration Testing

Test persistence behavior end-to-end:

```typescript
test('should persist game state', async () => {
  const gameState = { level: 1, score: 100 };
  
  await PersistenceService.setItem('gameState', gameState);
  const loaded = await PersistenceService.getItem('gameState');
  
  expect(loaded).toEqual(gameState);
});
```

## Compliance Monitoring

### Metrics

- **Compliance Percentage**: Files using proper persistence patterns
- **Violation Count**: Number of policy violations found
- **Trend Analysis**: Violation trends over time

### Reporting

Weekly compliance reports are generated automatically:

```bash
# Generate compliance report
npm run audit:persistence -- --output compliance-report.json
```

## Exceptions

### Temporary Exceptions

In rare cases, temporary exceptions may be granted for:

1. **Legacy Code**: During migration periods
2. **Third-party Dependencies**: When unable to modify external code
3. **Performance Critical**: When async overhead is unacceptable (requires approval)

### Exception Process

1. Document exception reason and duration
2. Add TODO comment with migration plan
3. Create tracking issue in project management
4. Review monthly for removal

## Best Practices

### 1. Consistent Keys

Use consistent naming conventions:

```typescript
const KEYS = {
  USER_PREFERENCES: 'user:preferences',
  GAME_STATE: 'game:state',
  BALANCER_CONFIG: 'balancer:config'
} as const;
```

### 2. Data Validation

Validate data before storage:

```typescript
if (isValidConfig(config)) {
  await PersistenceService.setItem('config', config);
} else {
  throw new Error('Invalid configuration data');
}
```

### 3. Performance Optimization

- Batch operations when possible
- Use appropriate data structures
- Implement caching for frequently accessed data
- Monitor storage usage

## Troubleshooting

### Common Issues

1. **Async/Await Errors**: Ensure all storage operations are awaited
2. **Type Errors**: Use proper TypeScript interfaces
3. **Storage Quota**: Handle storage limit exceeded errors
4. **Data Corruption**: Implement validation and backup strategies

### Debug Tools

```typescript
// Enable debug logging
localStorage.setItem('persistence:debug', 'true');

// View storage contents
await PersistenceService.debug?.getContents();
```

## Related Documents

- [Storage Testing Guide](STORAGE_TESTING_GUIDE.md)
- [Architecture Reference](ARCHITECTURE.md)
- [Development Guidelines](DEVELOPMENT_GUIDELINES.md)

## Version History

- **v1.0** (2026-01-11): Initial policy definition
- **v1.1** (2026-01-11): Added automated auditing
- **v1.2** (2026-01-11): Added CI/CD integration

---

*This policy is enforced by automated tools. Violations will block merges and require remediation.*
