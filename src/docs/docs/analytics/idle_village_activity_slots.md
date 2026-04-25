# Idle Village Activity Slots Analytics

## Overview

The Activity Slots Analytics system provides comprehensive telemetry for all activity slot operations in the Idle Village game. This unified pipeline captures drag operations, assignments, failures, and performance metrics with config-first design and KPI tracking.

## Architecture

### Core Components

1. **Analytics Module** (`src/analytics/idleVillageActivitySlots.ts`)
   - Zod schemas for event validation
   - Event type definitions and payloads
   - Configuration management

2. **Telemetry Mapper** (`src/ui/idleVillage/telemetry/activitySlotTelemetryMapper.ts`)
   - Event processing and routing
   - Performance monitoring
   - Data aggregation

3. **React Hook** (`src/ui/idleVillage/telemetry/hooks/useActivitySlotTelemetry.ts`)
   - Component integration layer
   - Event emission utilities
   - State management

4. **Component Integration** (`src/ui/idleVillage/components/ActivitySlot.tsx`)
   - Event emission from UI interactions
   - Real-time telemetry capture

## Event Types

### Drag Operations

#### `drag_start`
Emitted when a resident drag operation begins.

**Payload:**
```typescript
interface DragStartPayload {
  resident: ResidentState;
  sourceSlotId?: string;
  startPosition: { x: number; y: number };
  dragType: 'resident_to_slot' | 'slot_to_slot' | 'resident_unassigned';
}
```

#### `drag_complete`
Emitted when a drag operation completes (successful drop).

**Payload:**
```typescript
interface DragCompletePayload {
  resident: ResidentState;
  targetSlotId: string;
  dropPosition: { x: number; y: number };
  dragDuration: number;
  wasSuccessful: boolean;
  validationResult?: DropValidationResult;
}
```

#### `drag_cancel`
Emitted when a drag operation is cancelled.

**Payload:**
```typescript
interface DragCancelPayload {
  resident: ResidentState;
  reason: 'user_cancel' | 'invalid_target' | 'timeout' | 'system_error';
  dragDuration: number;
  lastPosition: { x: number; y: number };
}
```

### Assignment Operations

#### `resident_assign`
Emitted when a resident is successfully assigned to a slot.

**Payload:**
```typescript
interface ResidentAssignPayload {
  resident: ResidentState;
  previousSlotId?: string;
  assignmentReason: 'drag_drop' | 'auto_assign' | 'system_assign';
  assignmentDuration: number;
}
```

#### `assign_failure`
Emitted when a resident assignment fails.

**Payload:**
```typescript
interface AssignFailurePayload {
  resident: ResidentState;
  failureReason: string;
  validationRule?: string;
  targetSlotId: string;
  attemptTimestamp: number;
}
```

### Validation Operations

#### `validation_check`
Emitted when validation is performed on a potential assignment.

**Payload:**
```typescript
interface ValidationCheckPayload {
  resident: ResidentState;
  targetSlotId: string;
  validationResult: DropValidationResult;
  validationDuration: number;
  validationContext: {
    isDragOperation: boolean;
    isAutoAssignment: boolean;
    forcedAssignment: boolean;
  };
}
```

### Performance Operations

#### `performance_metric`
Emitted for performance monitoring and alerting.

**Payload:**
```typescript
interface PerformanceMetricPayload {
  metricName: string;
  value: number;
  unit: 'ms' | 'fps' | 'bytes' | 'count' | 'percentage';
  category: 'render' | 'interaction' | 'validation' | 'persistence' | 'network';
  threshold?: number;
  isAlert: boolean;
}
```

### State Change Operations

#### `fatigue_change`
Emitted when a resident's fatigue level changes.

**Payload:**
```typescript
interface FatigueChangePayload {
  resident: ResidentState;
  previousFatigue: number;
  newFatigue: number;
  changeReason: 'activity_completion' | 'assignment' | 'rest' | 'injury' | 'system_adjustment';
  thresholdCrossed?: {
    threshold: number;
    crossed: 'above' | 'below';
  };
}
```

#### `slot_state_change`
Emitted when a slot's state changes.

**Payload:**
```typescript
interface SlotStateChangePayload {
  previousState: {
    isOccupied: boolean;
    assignedResidentId?: string;
    isActive: boolean;
    progress: number;
  };
  newState: {
    isOccupied: boolean;
    assignedResidentId?: string;
    isActive: boolean;
    progress: number;
  };
  changeReason: 'assignment' | 'completion' | 'cancellation' | 'phase_change' | 'system_update';
  changeDuration: number;
}
```

## Configuration

### Default Configuration

```typescript
export const DEFAULT_ACTIVITY_SLOT_TELEMETRY_CONFIG: ActivitySlotTelemetryConfig = {
  enabled: true,
  trackedEventTypes: [
    'drag_start',
    'drag_complete',
    'drag_cancel',
    'resident_assign',
    'assign_failure',
    'validation_check',
    'performance_metric',
    'fatigue_change',
    'slot_state_change',
  ],
  samplingRate: 1.0,
  maxBufferSize: 100,
  flushInterval: 5000,
  performanceThresholds: {
    dragDuration: 2000, // 2 seconds
    validationDuration: 100, // 100ms
    renderTime: 16, // 60fps
    interactionLatency: 100, // 100ms
  },
  verboseLogging: false,
};
```

### Persistence Integration

The telemetry system integrates with PersistenceService for:

- **Verbose Logging Toggle**: User preference for detailed logging
- **Configuration Storage**: Custom telemetry settings
- **Event History**: Persistent event buffer for debugging

## KPI Mapping

### User Engagement KPIs

| Event | KPI | Calculation |
|--------|-----|-------------|
| `drag_start` | Drag Initiation Rate | Count per session |
| `drag_complete` | Drag Success Rate | successful / total |
| `drag_cancel` | Drag Abandonment Rate | cancelled / total |
| `resident_assign` | Assignment Frequency | Count per time unit |

### Performance KPIs

| Event | KPI | Threshold |
|--------|-----|-----------|
| `performance_metric` | Drag Duration | < 2000ms |
| `performance_metric` | Validation Time | < 100ms |
| `performance_metric` | Render Time | < 16ms |
| `performance_metric` | Interaction Latency | < 100ms |

### Error Rate KPIs

| Event | KPI | Target |
|--------|-----|--------|
| `assign_failure` | Assignment Failure Rate | < 10% |
| `validation_check` | Validation Failure Rate | < 5% |
| `drag_cancel` | Drag Cancellation Rate | < 15% |

### Fatigue Management KPIs

| Event | KPI | Calculation |
|--------|-----|-------------|
| `fatigue_change` | Fatigue Accumulation Rate | Sum per resident |
| `fatigue_change` | Threshold Crossings | Count of threshold breaches |
| `slot_state_change` | Slot Utilization | occupied / total |

## Integration Examples

### Component Integration

```typescript
// In ActivitySlot component
const telemetry = useActivitySlotTelemetry({
  enablePerformanceMonitoring: true,
});

const handleDragOver = (event: React.DragEvent) => {
  const residentId = event.dataTransfer.getData('text/resident-id');
  if (residentId) {
    telemetry.recordDragStart(
      slotId,
      activity,
      resident,
      'unassigned',
      { x: event.clientX, y: event.clientY }
    );
  }
};
```

### Performance Monitoring

```typescript
// Automatic performance tracking
telemetry.recordPerformanceMetric(
  slotId,
  activity,
  'drag_duration',
  dragDuration,
  'ms',
  { category: 'interaction', threshold: 2000 }
);
```

### Validation Tracking

```typescript
// Validation result tracking
telemetry.recordValidationCheck(
  slotId,
  activity,
  resident,
  { isDragOperation: true, isAutoAssignment: false, forcedAssignment: false },
  validationResult
);
```

## Data Export

### Event Export Format

```json
{
  "events": [
    {
      "id": "evt_123456789",
      "timestamp": 1641894400000,
      "type": "drag_start",
      "slotId": "forest-work-1",
      "activity": { "id": "forest-work", "name": "Forest Work" },
      "sessionId": "session_abc123",
      "context": {
        "gamePhase": "day",
        "currentTimeUnit": 42,
        "villageState": {
          "totalResidents": 8,
          "activeResidents": 6,
          "totalSlots": 12,
          "occupiedSlots": 6
        }
      },
      "payload": {
        "resident": { "id": "resident-1", "name": "Alice" },
        "startPosition": { "x": 150, "y": 200 },
        "dragType": "resident_to_slot"
      }
    }
  ],
  "summary": {
    "totalEvents": 1,
    "eventTypes": { "drag_start": 1 },
    "timeRange": { "start": 1641894400000, "end": 1641894400000 },
    "performanceMetrics": {
      "avgDragDuration": 1250,
      "validationSuccessRate": 0.95
    }
  }
}
```

## Debugging and Development

### Verbose Logging

Enable verbose logging for detailed event information:

```typescript
const telemetry = useActivitySlotTelemetry({
  config: { verboseLogging: true }
});
```

### Event Inspection

```typescript
// Get all events
const events = telemetry.getEvents();

// Filter by type
const dragEvents = telemetry.getEventsByType('drag_start');

// Filter by slot
const slotEvents = telemetry.getEventsBySlot('forest-work-1');

// Time range filtering
const recentEvents = telemetry.getEventsByTimeRange(
  Date.now() - 3600000, // Last hour
  Date.now()
);
```

### Performance Alerts

The system automatically generates alerts when performance thresholds are exceeded:

```typescript
// Performance alert event
{
  "type": "performance_metric",
  "payload": {
    "metricName": "drag_duration",
    "value": 2500,
    "unit": "ms",
    "category": "interaction",
    "threshold": 2000,
    "isAlert": true
  }
}
```

## Best Practices

1. **Event Sampling**: Use sampling for high-frequency events to avoid performance impact
2. **Payload Size**: Keep payloads minimal to reduce memory usage
3. **Async Processing**: Use async event processing to avoid blocking UI
4. **Error Handling**: Wrap telemetry calls in try-catch to prevent UI failures
5. **Privacy**: Avoid collecting sensitive user information in events

## Future Enhancements

1. **Real-time Dashboard**: Web dashboard for live telemetry visualization
2. **Machine Learning**: Pattern recognition for user behavior analysis
3. **A/B Testing**: Event-based A/B testing framework
4. **Cross-session Analytics**: Persistent user behavior tracking
5. **Export Formats**: Additional export formats (CSV, Parquet)

## Related Documentation

- [Idle Village Plan](../plans/idle_village_plan.md)
- [Drop Feedback System](../ui/idleVillage/config/dropFeedbackConfig.ts)
- [Persistence Service](../../shared/persistence/PersistenceService.ts)
- [Sandbox Diagnostics](../../ui/idleVillage/utils/sandboxDiagnostics.ts)
