# Minimal Snapshot Schema

This document describes the Minimal Gameplay snapshot serialization system, including schema definition, versioning strategy, and migration procedures.

## Overview

The Minimal Snapshot Serializer provides a robust, config-first system for serializing and deserializing Minimal Gameplay state with built-in versioning, integrity validation, and migration support.

## Schema Definition

### Snapshot Structure

```typescript
interface MinimalSnapshot {
  metadata: SnapshotMetadata;
  data: MinimalGameState;
}
```

### Metadata Schema

```typescript
interface SnapshotMetadata {
  version: string;        // Schema version (e.g., "1.0")
  createdAt: number;      // Unix timestamp
  checksum: string;       // Data integrity hash
  summary: {
    gold: number;         // Current gold amount
    food: number;         // Current food amount
    currentDay: number;   // Days played
    residentCount: number;// Number of residents
  };
}
```

### Game State Schema

```typescript
interface MinimalGameState {
  gold: number;
  food: number;
  maxFood: number;
  currentDay: number;
  currentTime: number;
  isPaused: boolean;
  speedMultiplier: number;
  residents: Array<{
    id: string;
    name: string;
    level: number;
    stats: Record<string, number>;
    fatigue: number;
    isWorking: boolean;
    isInjured: boolean;
  }>;
  activeActivities: Array<{
    activityId: string;
    residentId: string;
    ticksRemaining: number;
  }>;
  lastSavedAt?: number;
}
```

## API Reference

### serializeSnapshot(gameState)

Serializes a game state into a validated snapshot.

```typescript
import { serializeSnapshot } from '@/engine/game/idleVillage/minimalSnapshotSerializer';

const gameState: MinimalGameState = { /* ... */ };
const snapshot = serializeSnapshot(gameState);
```

**Throws:**
- `Error` if validation fails

### deserializeSnapshot(input)

Deserializes a snapshot, applying migrations if needed.

```typescript
import { deserializeSnapshot } from '@/engine/game/idleVillage/minimalSnapshotSerializer';

const snapshot = { /* ... */ };
const gameState = deserializeSnapshot(snapshot);
```

**Throws:**
- `Error` if validation fails
- `Error` if checksum validation fails

### diffSnapshots(snapshotA, snapshotB)

Compares two snapshots and returns differences.

```typescript
import { diffSnapshots } from '@/engine/game/idleVillage/minimalSnapshotSerializer';

const diff = diffSnapshots(snapshotA, snapshotB);
console.log(diff.changedFields);     // ['gold', 'food', 'residents.0.level']
console.log(diff.summary);           // { goldChanged: true, ... }
```

### validateSnapshot(snapshot)

Validates a snapshot against the current schema.

```typescript
import { validateSnapshot } from '@/engine/game/idleVillage/minimalSnapshotSerializer';

const isValid = validateSnapshot(snapshot);
```

## Versioning Strategy

### Version Format

Versions follow semantic versioning: `MAJOR.MINOR`

- **MAJOR**: Breaking changes requiring migration
- **MINOR**: Backward-compatible additions

### Current Version: 1.0

Initial release with complete Minimal Gameplay state support.

## Migration Procedures

### Migration Infrastructure

Migrations are applied automatically during deserialization:

```typescript
function migrateSnapshotIfNeeded(input: any): MinimalSnapshot {
  // Detect version and apply migrations
  if (!input.metadata?.version) {
    return migrateFromLegacy(input);
  }

  // Future version-specific migrations
  // if (input.metadata.version === '0.9') {
  //   return migrateV09ToV10(input);
  // }

  return input;
}
```

### Legacy Format Migration

Snapshots without version metadata are migrated to v1.0:

```typescript
function migrateFromLegacy(input: any): MinimalSnapshot {
  return {
    metadata: {
      version: '1.0',
      createdAt: input.createdAt || Date.now(),
      checksum: input.checksum || generateChecksum(input.data || input),
      summary: input.summary || calculateSummary(input.data || input),
    },
    data: input.data || input,
  };
}
```

### Adding New Migrations

1. Increment version number in schema
2. Add migration function for previous version
3. Update `migrateSnapshotIfNeeded` to call new migration
4. Add tests for migration path
5. Update this documentation

## Data Integrity

### Checksum Validation

All snapshots include an integrity checksum:

```typescript
function generateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + char;
  }
  return hash.toString(16);
}
```

- Generated during serialization
- Validated during deserialization
- Uses simple hash for performance

### Validation Rules

- Schema validation using Zod
- Checksum integrity verification
- Required field presence
- Type safety enforcement

## Usage Examples

### Basic Serialization

```typescript
import { serializeSnapshot, deserializeSnapshot } from '@/engine/game/idleVillage/minimalSnapshotSerializer';

// Serialize current game state
const snapshot = serializeSnapshot(gameState);

// Save to storage (via PersistenceService)
await saveData('minimal-gameplay-save', snapshot);

// Load and deserialize
const loadedSnapshot = await loadData('minimal-gameplay-save');
const restoredGameState = deserializeSnapshot(loadedSnapshot);
```

### Comparing Save States

```typescript
import { diffSnapshots } from '@/engine/game/idleVillage/minimalSnapshotSerializer';

// Compare before and after autosave
const diff = diffSnapshots(beforeSnapshot, afterSnapshot);

if (diff.summary.goldChanged) {
  console.log(`Gold changed: ${diff.differences.gold.from} → ${diff.differences.gold.to}`);
}
```

### Manual Validation

```typescript
import { validateSnapshot } from '@/engine/game/idleVillage/minimalSnapshotSerializer';

// Check snapshot integrity
if (!validateSnapshot(snapshot)) {
  throw new Error('Snapshot corrupted');
}
```

## Error Handling

### Common Errors

- **Schema Validation Failed**: Snapshot doesn't match expected structure
- **Checksum Mismatch**: Data has been tampered with or corrupted
- **Migration Failed**: Unable to migrate from old version

### Recovery Strategies

1. **Schema Errors**: Check data structure matches expected format
2. **Checksum Errors**: Verify data hasn't been corrupted during storage
3. **Migration Errors**: Ensure migration path exists for version

## Testing Strategy

### Unit Tests

- Schema validation correctness
- Serialization/deserialization roundtrip
- Migration path verification
- Checksum integrity
- Diff calculation accuracy
- Error condition handling

### Integration Tests

- End-to-end save/load cycle
- Migration across versions
- Performance under load
- Corruption recovery

## Performance Considerations

### Serialization Performance

- JSON.stringify overhead
- Checksum calculation (O(n) string length)
- Zod validation cost

### Recommended Optimizations

- Cache serialized snapshots when possible
- Use incremental diffing for frequent saves
- Consider binary serialization for large states

## Future Enhancements

### Planned Features

1. **Compression**: LZ4 or similar for storage efficiency
2. **Encryption**: Secure snapshot storage
3. **Partial Loading**: Load only needed state sections
4. **Cloud Sync**: Cross-device synchronization
5. **Backup Rotation**: Automatic old snapshot cleanup

### Extension Points

- Custom migration functions
- Alternative checksum algorithms
- Schema versioning strategies
- Compression algorithms

## Troubleshooting

### Debug Mode

Enable detailed logging:

```typescript
// Set debug flag in local storage or environment
localStorage.setItem('minimal-snapshot-debug', 'true');
```

### Common Issues

1. **"Schema validation failed"**
   - Check data structure matches expected schema
   - Verify all required fields are present

2. **"Checksum mismatch"**
   - Data corrupted during storage/retrieval
   - Check PersistenceService implementation

3. **"Migration failed"**
   - Version not supported
   - Check migration path exists

## API Stability

The serializer API is considered stable for v1.x releases. Breaking changes will only occur in major version bumps with appropriate migration support.

## Related Documentation

- [Minimal Persistence Playbook](../docs/idle_village/minimal_persistence_playbook.md)
- [PersistenceService API](../../shared/persistence/PersistenceService.ts)
- [Zod Schema Documentation](https://zod.dev/)
