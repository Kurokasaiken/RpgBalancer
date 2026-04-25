# NP-102 ActivitySlot Telemetry Mirror Documentation

## Overview

The ActivitySlot Telemetry Mirror is a comprehensive telemetry system for Idle Village Phase 12 ActivitySlot components. It provides real-time monitoring, event tracking, and export capabilities for slot states, resident assignments, and drop validation results.

## Architecture

### Core Components

1. **ActivitySlotTelemetryMirror.ts** - Schema definitions and utility functions
2. **useActivitySlotTelemetry.ts** - React hook for telemetry management
3. **ActivitySlotTelemetryMirror.test.tsx** - Comprehensive test suite

### Design Principles

- **Config-First**: All telemetry behavior driven by configuration
- **Async Persistence**: Uses PersistenceService for reliable data storage
- **Event-Driven**: Custom DOM events for external integration
- **Performance Optimized**: Sampling rates and debounced saves
- **Type Safe**: Full TypeScript coverage with Zod validation

## Telemetry Events

### Event Types

| Event Type | Description | Trigger |
|------------|-------------|---------|
| `iv_activityslot_state_changed` | Slot state transition | State changes |
| `iv_activityslot_resident_assigned` | Resident assigned to slot | Assignment |
| `iv_activityslot_resident_removed` | Resident removed from slot | Removal |
| `iv_activityslot_drop_attempted` | Drop operation started | Drag start |
| `iv_activityslot_drop_validated` | Drop validation succeeded | Valid drop |
| `iv_activityslot_drop_failed` | Drop validation failed | Invalid drop |
| `iv_activityslot_progress_updated` | Activity progress update | Progress tick |
| `iv_activityslot_completed` | Activity completed | Completion |
| `iv_activityslot_batch_sync` | Bulk state synchronization | Batch ops |
| `iv_activityslot_mirror_active` | Telemetry mirror active | System init |

### Slot States

```typescript
const SLOT_STATES = {
  EMPTY: 'empty',        // No resident assigned
  OCCUPIED: 'occupied',  // Resident assigned, not started
  IN_PROGRESS: 'in_progress', // Activity running
  COMPLETED: 'completed', // Activity finished
  BLOCKED: 'blocked',    // Slot blocked/unavailable
  ERROR: 'error',        // Error state
} as const;
```

### Drop Results

```typescript
const DROP_RESULTS = {
  VALID: 'valid',                    // Drop successful
  INVALID_FATIGUE: 'invalid_fatigue', // Resident too tired
  INVALID_INJURED: 'invalid_injured', // Resident injured
  INVALID_UNAVAILABLE: 'invalid_unavailable', // Resident busy
  INVALID_STATS: 'invalid_stats',    // Stat requirements not met
  INVALID_CAPACITY: 'invalid_capacity', // Slot at capacity
  ERROR: 'error',                    // System error
} as const;
```

## Usage Guide

### Basic Hook Usage

```typescript
import { useActivitySlotTelemetry } from '@/ui/idleVillage/hooks/useActivitySlotTelemetry';

function MyComponent() {
  const telemetry = useActivitySlotTelemetry({
    enabled: true,
    sampleRate: 1.0, // Track all events
    maxEvents: 1000,
  });

  // Track slot state changes
  const handleSlotStateChange = (slotData, newState, resident) => {
    telemetry.trackSlotStateChange(slotData, newState, resident);
  };

  // Track resident assignments
  const handleAssignment = (slotData, resident) => {
    telemetry.trackResidentAssignment(slotData, resident);
  };

  // Track drop attempts
  const handleDrop = (slotData, residentId, result, reason) => {
    telemetry.trackDropAttempt(slotData, residentId, result, reason);
  };

  return (
    <div>
      <p>Total Events: {telemetry.events.length}</p>
      <p>Drop Success Rate: {telemetry.getStatistics().dropSuccessRate}</p>
      <button onClick={() => telemetry.exportTelemetry('json')}>
        Export JSON
      </button>
    </div>
  );
}
```

### Configuration Options

```typescript
const config = {
  enabled: true,                    // Enable/disable telemetry
  sampleRate: 1.0,                 // Event sampling (0.0-1.0)
  maxEvents: 1000,                 // Max events in memory
  export: {
    json: true,                    // Enable JSON export
    csv: true,                     // Enable CSV export
    autoExportInterval: 300000,    // Auto-export every 5 minutes
  },
  performance: {
    trackProcessingTime: true,     // Track event processing time
    trackMemoryUsage: false,       // Memory monitoring (disabled for perf)
  },
};
```

### Event Subscription

```typescript
import { useActivitySlotTelemetrySubscriber } from '@/ui/idleVillage/hooks/useActivitySlotTelemetry';

function TelemetryMonitor() {
  const { subscribe } = useActivitySlotTelemetrySubscriber((event) => {
    console.log('Telemetry event:', event.detail);
    
    // Handle specific events
    switch (event.detail.eventType) {
      case 'iv_activityslot_drop_failed':
        handleDropFailure(event.detail.data);
        break;
      case 'iv_activityslot_completed':
        handleActivityCompletion(event.detail.data);
        break;
    }
  });

  useEffect(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  }, [subscribe]);

  return <div>Monitoring telemetry events...</div>;
}
```

## Sample Payloads

### Slot State Change Event

```json
{
  "eventType": "iv_activityslot_state_changed",
  "timestamp": 1642694400000,
  "sessionId": "activityslot_session_1642694400_abc123",
  "data": {
    "slotId": "forest-work",
    "slotLabel": "Forest Work",
    "state": "occupied",
    "activity": {
      "id": "forest-work",
      "name": "Forest Work",
      "type": "resource",
      "durationFormula": 10,
      "statRequirement": { "strength": 5 }
    },
    "resident": {
      "id": "resident-1",
      "displayName": "John Doe",
      "fatigue": 25,
      "isInjured": false,
      "status": "available",
      "stats": { "strength": 10, "agility": 8, "intelligence": 6 }
    },
    "lastStateChanged": 1642694400000,
    "timeInCurrentState": 0
  },
  "metadata": {
    "source": "useActivitySlotTelemetry",
    "context": "manual_assignment",
    "performance": {
      "processingTime": 2.5
    }
  }
}
```

### Drop Validation Event

```json
{
  "eventType": "iv_activityslot_drop_failed",
  "timestamp": 1642694401000,
  "sessionId": "activityslot_session_1642694400_abc123",
  "data": {
    "slotId": "mining-operation",
    "slotLabel": "Mining Operation",
    "state": "empty",
    "activity": {
      "id": "mining-operation",
      "name": "Mining Operation",
      "type": "resource",
      "durationFormula": 15,
      "statRequirement": { "strength": 8, "endurance": 6 }
    },
    "dropResult": "invalid_fatigue",
    "validationReason": "Resident is too exhausted to work (fatigue: 85/100)",
    "lastStateChanged": 1642694401000,
    "timeInCurrentState": 0
  },
  "metadata": {
    "source": "useActivitySlotTelemetry",
    "context": "drag_drop",
    "residentId": "resident-2"
  }
}
```

### Progress Update Event

```json
{
  "eventType": "iv_activityslot_progress_updated",
  "timestamp": 1642694402000,
  "sessionId": "activityslot_session_1642694400_abc123",
  "data": {
    "slotId": "forest-work",
    "slotLabel": "Forest Work",
    "state": "in_progress",
    "activity": {
      "id": "forest-work",
      "name": "Forest Work",
      "type": "resource",
      "durationFormula": 10
    },
    "resident": {
      "id": "resident-1",
      "displayName": "John Doe",
      "fatigue": 30,
      "isInjured": false,
      "status": 'working',
      "stats": { "strength": 10, "agility": 8, "intelligence": 6 },
      "currentActivity": "forest-work"
    },
    "progress": {
      "fraction": 0.6,
      "elapsedSeconds": 36,
      "totalSeconds": 60,
      "estimatedCompletion": 1642694460000
    },
    "lastStateChanged": 1642694400000,
    "timeInCurrentState": 2000
  },
  "metadata": {
    "source": "useActivitySlotTelemetry",
    "context": "system_update",
    "progress": {
      "fraction": 0.6,
      "elapsedSeconds": 36,
      "totalSeconds": 60
    }
  }
}
```

### Batch Sync Event

```json
{
  "eventType": "iv_activityslot_batch_sync",
  "timestamp": 1642694403000,
  "sessionId": "activityslot_session_1642694400_abc123",
  "data": {
    "slotId": "system",
    "slotLabel": "System",
    "state": "empty",
    "lastStateChanged": 1642694403000,
    "timeInCurrentState": 0
  },
  "batchData": {
    "batchId": "sync_1642694403_def456",
    "operation": "state_sync",
    "affectedSlots": ["forest-work", "mining-operation", "farming"],
    "slotData": [
      {
        "slotId": "forest-work",
        "slotLabel": "Forest Work",
        "state": "occupied",
        "lastStateChanged": 1642694400000,
        "timeInCurrentState": 3000
      },
      {
        "slotId": "mining-operation",
        "slotLabel": "Mining Operation",
        "state": "empty",
        "lastStateChanged": 1642694401000,
        "timeInCurrentState": 2000
      }
    ],
    "timestamp": 1642694403000,
    "duration": 15
  },
  "metadata": {
    "source": "useActivitySlotTelemetry",
    "context": "system_update",
    "performance": {
      "processingTime": 15
    }
  }
}
```

## Export Formats

### JSON Export

```json
{
  "metadata": {
    "timestamp": 1642694400000,
    "sessionId": "activityslot_session_1642694400_abc123",
    "totalEvents": 150,
    "dateRange": {
      "start": 1642694300000,
      "end": 1642694400000
    },
    "version": "1.0.0"
  },
  "events": [...],
  "statistics": {
    "stateChanges": 45,
    "assignments": 23,
    "dropAttempts": 18,
    "dropSuccessRate": 0.78,
    "commonStates": {
      "empty": 67,
      "occupied": 45,
      "in_progress": 23,
      "completed": 15
    },
    "completionRate": 0.85,
    "avgProcessingTime": 3.2
  }
}
```

### CSV Export

```csv
timestamp,eventType,sessionId,slotId,slotLabel,state,residentId,residentName,dropResult,validationReason,progressFraction,elapsedSeconds,totalSeconds,source,context,processingTime
1642694400000,iv_activityslot_state_changed,activityslot_session_1642694400_abc123,forest-work,Forest Work,occupied,resident-1,John Doe,,,,,,useActivitySlotTelemetry,manual_assignment,2.5
1642694401000,iv_activityslot_drop_failed,activityslot_session_1642694400_abc123,mining-operation,Mining Operation,empty,,,,invalid_fatigue,Resident is too exhausted,,,useActivitySlotTelemetry,drag_drop,1.8
```

## Integration Guide

### Phase 12 Map Integration

```typescript
// In your Phase 12 map component
import { useActivitySlotTelemetry } from '@/ui/idleVillage/hooks/useActivitySlotTelemetry';

function Phase12Map() {
  const telemetry = useActivitySlotTelemetry();
  const { slots, residents } = useMapContext();

  // Track slot state changes
  useEffect(() => {
    slots.forEach(slot => {
      const currentState = slot.assignedWorkerId ? 'occupied' : 'empty';
      const resident = slot.assignedWorkerId ? residents[slot.assignedWorkerId] : undefined;
      
      telemetry.trackSlotStateChange(slot, currentState, resident);
    });
  }, [slots, residents, telemetry]);

  // Handle drag and drop
  const handleDrop = (slotId, residentId, validationResult) => {
    const slot = slots.find(s => s.slotId === slotId);
    const result = validationResult.valid ? 'valid' : getDropResult(validationResult.reason);
    const reason = validationResult.reason;
    
    telemetry.trackDropAttempt(slot, residentId, result, reason);
  };

  return <MapComponent onDrop={handleDrop} />;
}
```

### Store Integration

```typescript
// Listen to store changes and emit telemetry
import { useActivitySlotTelemetry } from '@/ui/idleVillage/hooks/useActivitySlotTelemetry';

function StoreTelemetryBridge() {
  const telemetry = useActivitySlotTelemetry();
  const villageState = useVillageState();

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = villageState.subscribe((changes) => {
      changes.forEach(change => {
        if (change.type === 'SLOT_ASSIGNMENT') {
          telemetry.trackResidentAssignment(change.slot, change.resident);
        } else if (change.type === 'SLOT_REMOVAL') {
          telemetry.trackResidentRemoval(change.slot);
        } else if (change.type === 'PROGRESS_UPDATE') {
          telemetry.trackProgressUpdate(change.slot, change.resident, change.progress);
        }
      });
    });

    return unsubscribe;
  }, [telemetry, villageState]);

  return null;
}
```

## Performance Considerations

### Sampling Rates

- **Production**: Use `sampleRate: 0.1` (10% sampling) for high-traffic environments
- **Development**: Use `sampleRate: 1.0` (100% sampling) for complete tracking
- **Testing**: Use `sampleRate: 0.0` (disabled) to avoid noise in tests

### Memory Management

- Events are limited by `maxEvents` configuration
- Old events are automatically discarded when limit is reached
- Debounced saving prevents excessive I/O operations

### Processing Time

- Event processing is typically < 5ms per event
- Bulk operations may take longer but are still optimized
- Performance tracking can be disabled if needed

## Troubleshooting

### Common Issues

1. **Events not appearing**
   - Check if telemetry is enabled in configuration
   - Verify sampling rate isn't too low
   - Check browser console for errors

2. **Export not working**
   - Ensure export format is enabled in configuration
   - Check browser popup blockers for file downloads
   - Verify sufficient permissions

3. **High memory usage**
   - Reduce `maxEvents` configuration
   - Lower sampling rate
   - Enable auto-export to clear memory periodically

4. **Performance issues**
   - Disable performance tracking
   - Reduce sampling rate
   - Use debounced event emission

### Debug Mode

```typescript
// Enable debug logging
const telemetry = useActivitySlotTelemetry({
  enabled: true,
  sampleRate: 1.0,
  performance: {
    trackProcessingTime: true,
    trackMemoryUsage: true,
  },
});

// Monitor events
telemetry.events.forEach(event => {
  console.debug('Telemetry:', event.eventType, event.data);
});
```

## API Reference

### useActivitySlotTelemetry Hook

```typescript
interface UseActivitySlotTelemetryReturn {
  events: ActivitySlotTelemetryEvent[];
  isLoading: boolean;
  error: string | null;
  exportTelemetry: (format: 'json' | 'csv') => Promise<void>;
  clearTelemetry: () => Promise<void>;
  emitEvent: (eventType: string, data: ActivitySlotTelemetryData, metadata?: Record<string, unknown>) => void;
  getStatistics: () => TelemetryStatistics;
  config: ActivitySlotTelemetryConfig;
  updateConfig: (config: Partial<ActivitySlotTelemetryConfig>) => void;
  
  // Tracking methods
  trackSlotStateChange: (slot: ActivitySlotData, state: SlotState, resident?: ResidentState) => void;
  trackResidentAssignment: (slot: ActivitySlotData, resident: ResidentState) => void;
  trackResidentRemoval: (slot: ActivitySlotData) => void;
  trackDropAttempt: (slot: ActivitySlotData, residentId: string, result: DropResult, reason?: string) => void;
  trackProgressUpdate: (slot: ActivitySlotData, resident: ResidentState, progress: ProgressData) => void;
  trackActivityCompletion: (slot: ActivitySlotData, resident: ResidentState) => void;
}
```

### ActivitySlotTelemetryData

```typescript
interface ActivitySlotTelemetryData {
  slotId: string;
  slotLabel: string;
  state: SlotState;
  activity?: ActivityDefinition;
  resident?: ResidentTelemetryInfo;
  progress?: {
    fraction: number;
    elapsedSeconds: number;
    totalSeconds: number;
    estimatedCompletion: number;
  };
  dropResult?: DropResult;
  validationReason?: string;
  lastStateChanged: number;
  timeInCurrentState: number;
}
```

## Best Practices

1. **Configuration Management**
   - Use environment-specific configurations
   - Disable telemetry in production tests
   - Monitor memory usage with appropriate limits

2. **Event Design**
   - Keep event payloads minimal
   - Use consistent naming conventions
   - Include essential context metadata

3. **Performance**
   - Use sampling for high-frequency events
   - Batch operations when possible
   - Monitor processing times

4. **Data Privacy**
   - Avoid sensitive data in telemetry
   - Use anonymized identifiers where appropriate
   - Respect user privacy preferences

5. **Error Handling**
   - Gracefully handle export failures
   - Continue operation despite telemetry errors
   - Log errors for debugging

## Version History

### v1.0.0 (2026-01-21)
- Initial implementation
- Core telemetry events and tracking
- JSON/CSV export functionality
- Comprehensive test suite
- Phase 12 integration support

---

**Implementation Status**: ✅ COMPLETE  
**Test Coverage**: ✅ COMPREHENSIVE  
**Documentation**: ✅ COMPLETE  
**Integration Ready**: ✅ PHASE 12
