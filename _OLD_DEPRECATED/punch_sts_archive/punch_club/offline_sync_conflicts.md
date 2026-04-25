# Punch Club Offline Sync Conflict Resolution

## Overview

The Punch Club Offline Sync Conflict Resolver is a config-first system for handling data synchronization conflicts between local and remote storage. It provides automatic and manual resolution strategies to prevent data loss during offline operations and ensure data integrity across devices.

## Architecture

### Core Components

1. **SyncConflictResolverConfig** - Configuration schemas and default settings
2. **SyncConflictResolver** - Main resolution engine with multiple strategies
3. **SyncConflictModal** - UI component for manual conflict resolution
4. **SyncConflictTelemetry** - Analytics and monitoring system

### Key Features

- **Config-First Design**: All strategies and rules defined in configuration
- **Multiple Resolution Strategies**: Local wins, remote wins, most recent, field merge, auto merge, manual
- **Data Type Awareness**: Different handling for game state, preferences, telemetry, progress data
- **Severity-Based Resolution**: Automatic resolution for low-severity conflicts, manual for critical
- **Telemetry Integration**: Comprehensive tracking of conflict patterns and resolution success
- **Type Safety**: Full TypeScript support with Zod validation

## Configuration

### Data Types and Priority Rules

```typescript
// Data types with priority levels (1-10, higher = more important)
const DATA_TYPE_PRIORITIES = {
  game_state: 9,        // Player stats, level, combat state
  progress_data: 7,     // Training progress, achievements
  combat_history: 6,    // Combat results and history
  user_preferences: 3,  // Theme, language, notifications
  telemetry: 2,         // Analytics and usage data
};
```

### Merge Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `local_wins` | Keep local data | User's recent changes |
| `remote_wins` | Use remote data | Server authoritative data |
| `most_recent` | Use newest timestamp | General conflict resolution |
| `merge_fields` | Field-level selection | Granular control |
| `auto_merge` | Intelligent merging | Safe automatic resolution |
| `manual_resolve` | User intervention | Critical conflicts |

### Conflict Detection Rules

```typescript
// Example: Game state conflicts are high severity
{
  dataType: 'game_state',
  conflictFields: ['player.stats', 'player.level', 'player.experience'],
  severity: 'high',
  defaultStrategy: 'most_recent',
  requireManualResolution: false,
  priority: 9
}
```

## Resolution Strategies

### 1. Local Wins
- **When to use**: User's recent changes should take precedence
- **Example**: User changed settings while offline
- **Behavior**: Entire local object replaces remote

### 2. Remote Wins
- **When to use**: Server has authoritative data
- **Example**: Server-side validation or admin changes
- **Behavior**: Entire remote object replaces local

### 3. Most Recent
- **When to use**: Timestamp-based resolution
- **Example**: General conflict resolution
- **Behavior**: Compare `lastModified` timestamps

### 4. Field Merge
- **When to use**: Granular control needed
- **Example**: Some fields changed locally, others remotely
- **Behavior**: Field-by-field selection based on strategy

### 5. Auto Merge
- **When to use**: Safe automatic resolution
- **Example**: Non-critical data with clear merge rules
- **Behavior**: Intelligent merging with validation

### 6. Manual Resolution
- **When to use**: Critical conflicts requiring user input
- **Example**: High-severity game state conflicts
- **Behavior**: Show modal for user selection

## Usage Examples

### Basic Conflict Detection and Resolution

```typescript
import { SyncConflictResolver } from '@/service-worker/syncConflictResolver';
import { DEFAULT_SYNC_CONFLICT_RESOLVER_CONFIG } from '@/service-worker/syncConflictResolverConfig';

// Initialize resolver
const resolver = new SyncConflictResolver(DEFAULT_SYNC_CONFLICT_RESOLVER_CONFIG);
await resolver.initialize();

// Detect conflicts
const localData = { player: { level: 5, health: 100 } };
const remoteData = { player: { level: 6, health: 90 } };

const conflicts = await resolver.detectConflicts(
  localData,
  remoteData,
  'game_state'
);

// Resolve conflicts
for (const conflict of conflicts) {
  const result = await resolver.resolveConflict(conflict);
  if (result.success) {
    console.log('Conflict resolved:', result.strategy);
    // Apply result.resolvedData to your state
  }
}
```

### Manual Resolution with UI

```typescript
import { SyncConflictModal, useSyncConflictModal } from '@/ui/punchClub/components/SyncConflictModal';

function GameSyncComponent() {
  const { showModal, hideModal, handleResolve } = useSyncConflictModal();

  const handleSyncConflict = async (conflict) => {
    if (conflict.requiresManualResolution) {
      showModal(conflict);
    } else {
      const result = await resolver.resolveConflict(conflict);
      // Apply result
    }
  };

  return (
    <>
      {/* Your game UI */}
      <SyncConflictModal
        conflict={visibleConflict}
        isVisible={isVisible}
        onClose={hideModal}
        onResolve={handleResolve}
      />
    </>
  );
}
```

### Telemetry and Monitoring

```typescript
import { syncConflictTelemetry } from '@/analytics/syncConflictTelemetry';

// Telemetry is automatically emitted, but you can also:
const stats = syncConflictTelemetry.getSessionStats();
console.log('Conflict resolution rate:', stats.successRate);
console.log('Average resolution time:', stats.averageResolutionTime);
```

## Field-Level Merge Configuration

### Example Field Configurations

```typescript
const FIELD_MERGE_CONFIGS = [
  {
    fieldPath: 'player.stats.health',
    strategy: 'most_recent',        // Use newest health value
    priority: 8,
    autoMergeSafe: true,
  },
  {
    fieldPath: 'player.level',
    strategy: 'remote_wins',        // Server controls level
    priority: 9,
    autoMergeSafe: true,
  },
  {
    fieldPath: 'theme',
    strategy: 'local_wins',        // User preference wins
    priority: 3,
    autoMergeSafe: true,
  },
];
```

### Priority Rules

- **Priority 9-10**: Critical game state (level, core stats)
- **Priority 7-8**: Important progress data (achievements, training)
- **Priority 5-6**: Secondary data (combat history)
- **Priority 3-4**: User preferences (theme, settings)
- **Priority 1-2**: Analytics and telemetry

## Telemetry Events

### Event Types

1. **`pc_sync_conflict_detected`** - Conflict detected
2. **`pc_sync_conflict_resolved`** - Conflict resolved successfully
3. **`pc_sync_conflict_failed`** - Resolution failed
4. **`pc_sync_conflict_timeout`** - Manual resolution timeout
5. **`pc_sync_conflict_manual_requested`** - Manual resolution started
6. **`pc_sync_conflict_manual_completed`** - Manual resolution completed

### Event Data Structure

```typescript
{
  eventType: 'pc_sync_conflict_resolved',
  timestamp: 1640000000000,
  sessionId: 'sync-1640000000-abc123',
  conflictId: 'conflict-abc123',
  dataType: 'game_state',
  severity: 'medium',
  strategy: 'most_recent',
  resolutionTime: 150,
  success: true,
  context: {
    fieldCount: 2,
    mergedFieldsCount: 1,
    overwrittenFieldsCount: 1,
  }
}
```

## Performance Considerations

### Resolution Time Targets

| Operation | Target Time |
|-----------|-------------|
| Conflict Detection | < 10ms |
| Auto Resolution | < 5ms |
| Field Merge | < 20ms |
| Manual Resolution UI | < 100ms |

### Memory Usage

- **Conflict History**: Limited to 100 entries by default
- **Event Queue**: Batches of 10 events
- **Telemetry**: Automatic cleanup after persistence

### Data Size Limits

- **Auto Merge**: Max 1MB per conflict
- **Manual Resolution**: No strict limit
- **Telemetry**: Batched to prevent memory issues

## Error Handling

### Common Scenarios

1. **Data Corruption**: Falls back to local data
2. **Network Failure**: Uses local data with warning
3. **Invalid Strategy**: Falls back to most_recent
4. **Timeout**: Auto-resolves with most_recent
5. **Manual Resolution Timeout**: Falls back to most_recent

### Recovery Strategies

```typescript
// Example: Handling resolution failures
try {
  const result = await resolver.resolveConflict(conflict);
  if (!result.success) {
    console.error('Resolution failed:', result.errors);
    // Fallback strategy
    const fallbackResult = await resolver.resolveConflict(conflict, 'most_recent');
    return fallbackResult.resolvedData;
  }
  return result.resolvedData;
} catch (error) {
  console.error('Critical error:', error);
  return conflict.localData; // Ultimate fallback
}
```

## Testing

### Unit Tests

```bash
# Run sync conflict resolver tests
npm run test -- tests/unit/punchClub/SyncConflictResolver.test.ts

# Run with coverage
npm run test -- tests/unit/punchClub/SyncConflictResolver.test.ts --coverage
```

### Test Coverage Areas

1. **Conflict Detection**: All data types and edge cases
2. **Resolution Strategies**: All 6 strategies
3. **Error Handling**: Network failures, data corruption
4. **Performance**: Large data sets, concurrent operations
5. **Telemetry**: Event emission and data accuracy

### Integration Testing

```typescript
// Example integration test
describe('Sync Integration', () => {
  it('should handle real-world sync scenario', async () => {
    // Simulate offline changes
    const localChanges = await simulateOfflineGameplay();
    
    // Simulate server changes
    const remoteChanges = await simulateServerUpdates();
    
    // Detect and resolve conflicts
    const conflicts = await resolver.detectConflicts(
      localChanges,
      remoteChanges,
      'game_state'
    );
    
    // Verify resolution
    for (const conflict of conflicts) {
      const result = await resolver.resolveConflict(conflict);
      expect(result.success).toBe(true);
    }
  });
});
```

## Best Practices

### 1. Configuration Management

- Keep conflict rules in configuration, not code
- Use appropriate severity levels for different data types
- Regularly review and update merge strategies

### 2. Error Prevention

- Validate data before sync operations
- Use checksums for data integrity
- Implement proper logging and monitoring

### 3. User Experience

- Provide clear feedback for manual resolutions
- Show conflict context and resolution options
- Allow users to set preferred resolution strategies

### 4. Performance Optimization

- Batch conflict detection for multiple fields
- Use efficient deep comparison algorithms
- Implement proper cleanup for old conflicts

## Troubleshooting

### Common Issues

1. **Conflicts Not Detected**
   - Check field paths in detection rules
   - Verify data structure matches expected format
   - Ensure timestamps are properly set

2. **Resolution Fails**
   - Check data integrity and validation
   - Verify strategy configuration
   - Review error logs for specific issues

3. **Manual Resolution Not Working**
   - Ensure modal is properly integrated
   - Check event listeners for resolution events
   - Verify timeout configuration

4. **Telemetry Not Working**
   - Check if telemetry is enabled in config
   - Verify persistence service is working
   - Review session management

### Debug Tools

```typescript
// Enable debug logging
const resolver = new SyncConflictResolver({
  ...DEFAULT_SYNC_CONFLICT_RESOLVER_CONFIG,
  global: {
    ...DEFAULT_SYNC_CONFLICT_RESOLVER_CONFIG.global,
    enableTelemetry: true, // Enable for debugging
  },
});

// Get detailed statistics
const stats = resolver.getResolutionStats();
console.log('Resolution Statistics:', stats);

// Check conflict history
const history = await getConflictHistory();
console.log('Recent Conflicts:', history);
```

## Future Enhancements

### Planned Features

1. **Machine Learning Resolution**: AI-based conflict prediction and resolution
2. **Conflict Prevention**: Proactive detection before conflicts occur
3. **Advanced UI**: Visual diff viewers and merge editors
4. **Cross-Platform**: Mobile-specific conflict handling
5. **Real-time Sync**: WebSocket-based conflict prevention

### Extension Points

- Custom resolution strategies
- Additional data type handlers
- Third-party telemetry integrations
- Advanced merge algorithms

## API Reference

### SyncConflictResolver

```typescript
class SyncConflictResolver {
  constructor(config?: SyncConflictResolverConfig);
  async initialize(): Promise<void>;
  async detectConflicts(localData, remoteData, dataType): Promise<SyncConflictEvent[]>;
  async resolveConflict(conflict, strategy?): Promise<ConflictResolutionResult>;
  async handleManualResolution(conflictId, resolutionData, strategy): Promise<void>;
  getResolutionStats(): ResolutionStats;
  async clearHistory(): Promise<void>;
  updateConfig(newConfig): void;
}
```

### Configuration Types

```typescript
interface SyncConflictResolverConfig {
  global: GlobalSettings;
  detectionRules: ConflictDetectionRule[];
  fieldMergeConfigs: FieldMergeConfig[];
  priorityRules: Record<DataType, number>;
  strategyBySeverity: Record<SyncConflictSeverity, MergeStrategy>;
  validation: ValidationSettings;
}
```

For complete API documentation, see the TypeScript definitions in the source files.
