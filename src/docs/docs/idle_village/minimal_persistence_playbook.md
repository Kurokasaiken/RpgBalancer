# Minimal Persistence Playbook

This document outlines the persistence strategy for Minimal Gameplay, including autosave recovery, data integrity, and failure handling procedures.

## Overview

Minimal Gameplay uses PersistenceService for all storage operations, ensuring mobile-ready fallback and data integrity across browser contexts. The system includes automatic autosave, manual recovery hooks, and comprehensive error handling.

## Autosave Recovery System

### Architecture

The autosave recovery system provides reusable hooks for restoring the last valid autosave of the Minimal Gameplay store.

#### Key Components

- **`useAutosaveRecovery`**: Main hook exposing recovery functionality
- **`createAutosaveSnapshot`**: Utility for creating and saving snapshots
- **`validateSnapshot`**: Integrity validation using checksums
- **`resolveConflict`**: Conflict resolution strategies

#### Usage Example

```typescript
import { useAutosaveRecovery } from '@/shared/minimalGameplay/useAutosaveRecovery';

// In a React component
const { recoverLastSnapshot, isRecovering, lastResult } = useAutosaveRecovery({
  maxRetries: 3,
  conflictPolicy: 'last-wins',
  enableLogging: true,
});

// Attempt recovery
const result = await recoverLastSnapshot();
if (result.success) {
  // Use result.data to restore state
  console.log('Recovery successful:', result.data);
} else {
  console.error('Recovery failed:', result.error);
}
```

### Configuration Options

```typescript
interface AutosaveRecoveryOptions {
  maxRetries: number;        // Default: 3
  conflictPolicy: 'last-wins' | 'first-wins' | 'manual'; // Default: 'last-wins'
  enableLogging: boolean;    // Default: false
  onConflict?: (existing: any, incoming: any) => any; // Custom conflict resolver
}
```

### Recovery Flow

1. **Load Attempt**: Try to load the last autosave snapshot
2. **Retry Logic**: Retry up to `maxRetries` times with exponential backoff
3. **Validation**: Verify snapshot integrity using checksum
4. **Conflict Resolution**: Handle conflicting snapshots based on policy
5. **Recovery**: Return validated data or error details

### Error Handling

The system handles various failure scenarios:

- **Network Issues**: Automatic retry with backoff
- **Data Corruption**: Checksum validation failure
- **Storage Unavailable**: Graceful fallback to initial state
- **Version Mismatch**: Future migration support

## Data Integrity

### Checksum Validation

All snapshots include a checksum for integrity verification:

```typescript
function generateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
  }
  return hash.toString(16);
}
```

### Snapshot Structure

```typescript
interface AutosaveSnapshot {
  metadata: {
    version: string;
    createdAt: number;
    checksum: string;
    summary: {
      gold: number;
      food: number;
      currentDay: number;
      residentCount: number;
    };
  };
  data: any; // Full game state
}
```

## Conflict Resolution

### Policies

- **`last-wins`**: Prefer the most recently created snapshot
- **`first-wins`**: Prefer the oldest snapshot
- **`manual`**: Require explicit resolution (currently defaults to existing)

### Custom Resolution

```typescript
const recovery = useAutosaveRecovery({
  conflictPolicy: 'manual',
  onConflict: (existing, incoming) => {
    // Custom logic to merge or choose between snapshots
    return incoming; // Prefer incoming data
  }
});
```

## Storage Key Management

### Autosave Key

- **Key**: `minimal_gameplay_autosave`
- **Scope**: User session
- **Retention**: Until explicitly cleared or overwritten

### Game Over Snapshots

- **Key Pattern**: `minimal_gameplay-state-gameover-{timestamp}`
- **Purpose**: Analytics and potential recovery
- **Retention**: Indefinite (for analysis)

## Failure Recovery Procedures

### SOP: Autosave Recovery Failure

1. **Check Network**: Ensure internet connectivity
2. **Verify Storage**: Confirm localStorage is available and not full
3. **Retry Operation**: Use manual retry button if available
4. **Fallback**: Reset to initial state if recovery impossible
5. **Report**: Log failure for debugging

### SOP: Data Corruption Detected

1. **Validate Checksum**: Confirm corruption via checksum mismatch
2. **Attempt Repair**: Try to recover partial data if possible
3. **Clear Corrupted**: Remove corrupted snapshots
4. **Fallback**: Use initial state
5. **Prevent Future**: Ensure proper serialization

## Performance Considerations

### Autosave Frequency

- **Interval**: 30 seconds (configurable)
- **Trigger**: After state changes
- **Async**: Non-blocking persistence

### Recovery Performance

- **Timeout**: 5 seconds per attempt
- **Retries**: Up to 3 attempts
- **Backoff**: Exponential delay (1s, 2s, 3s)

## Testing Strategy

### Unit Tests

- **Hook functionality**: `recoverLastSnapshot`, `hasConflicts`, `getConflictDetails`
- **Utility functions**: `validateSnapshot`, `resolveConflict`, `generateChecksum`
- **Error scenarios**: Network failures, corruption, conflicts

### Integration Tests

- **End-to-end recovery**: Complete save/load cycle
- **Conflict resolution**: Multiple policy scenarios
- **Performance**: Recovery under load

### Sample Fixture

See `data/exports/idleVillage/autosave-recovery-sample.json` for a complete snapshot example.

## Migration Strategy

### Version Handling

Snapshots include version metadata for future migrations:

```typescript
// Future migration example
if (snapshot.metadata.version === '0.9') {
  // Migrate from v0.9 to v1.0
  snapshot.data = migrateV09ToV10(snapshot.data);
  snapshot.metadata.version = '1.0';
}
```

### Backward Compatibility

- Maintain compatibility with older snapshot formats
- Graceful degradation for missing fields
- Clear migration path for breaking changes

## Monitoring and Analytics

### Recovery Events

- `minimal_gameplay_autosave_recovery_success`
- `minimal_gameplay_autosave_recovery_failure`
- `minimal_gameplay_snapshot_validation_error`
- `minimal_gameplay_conflict_detected`

### Metrics

- Recovery success rate
- Average recovery time
- Conflict resolution frequency
- Data corruption incidents

## Future Enhancements

### Planned Features

1. **Cloud Backup**: Optional cloud synchronization
2. **Multi-Slot Recovery**: Multiple save slots
3. **Partial Recovery**: Restore individual game elements
4. **Conflict UI**: User-guided conflict resolution
5. **Backup Rotation**: Automatic old backup cleanup

### Integration Points

- **Game Over System**: Automatic snapshot on game over
- **Settings Panel**: Recovery options and preferences
- **Analytics Dashboard**: Recovery metrics visualization
- **Mobile Support**: Enhanced offline capabilities
