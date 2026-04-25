# Idle Village Drop Validation Telemetry

## Overview

The Idle Village Drop Validation Telemetry system provides comprehensive tracking, analysis, and export capabilities for Phase E drop validation outcomes. This system enables UX audit capabilities, performance monitoring, and data-driven insights for resident drop validation in the Idle Village sandbox.

## Features

### 📊 Event Tracking
- **Validation Events**: Track pass/fail outcomes with detailed metadata
- **Feedback Events**: Monitor when validation feedback is shown to users
- **Export Events**: Log data export operations with format and record counts
- **Performance Metrics**: Capture validation latency and processing times

### 🔍 Analytics & Metrics
- **Success/Failure Rates**: Real-time validation outcome tracking
- **Rule Performance**: Identify most common failure rules and severities
- **Latency Monitoring**: Track validation processing times with alerts
- **Session Analysis**: Per-session metrics and trend analysis

### 📤 Export Capabilities
- **JSON Export**: Structured data with aggregated metrics
- **CSV Export**: Tabular format for spreadsheet analysis
- **Markdown Export**: Human-readable reports with summaries
- **Custom Filters**: Export by date range, severity, rule type, and event type

### 🎯 Performance Monitoring
- **Latency Tracking**: Monitor validation processing times
- **Alert Thresholds**: Configurable alerts for slow validations
- **Performance Trends**: Track performance over time
- **Resource Usage**: Monitor event storage and processing efficiency

## Architecture

### Core Components

#### 1. Analytics Module (`src/analytics/idleVillageDropValidation.ts`)

```typescript
// Main analytics interface
export interface DropValidationAnalytics {
  sessionMetrics: SessionMetrics;
  aggregatedMetrics: AggregatedMetrics;
  recentEvents: DropValidationTelemetryEvent[];
  exportHistory: ExportHistoryEntry[];
}

// Hook for analytics operations
export function useDropValidationAnalytics(config?: Partial<DropValidationAnalyticsConfig>) {
  return {
    recordEvent,
    recordValidationOutcome,
    recordDropFeedbackShown,
    getFilteredEvents,
    exportEvents,
    getCurrentAnalytics,
    resetAnalytics,
  };
}
```

#### 2. Event Types

```typescript
export type DropValidationEventType = 
  | 'drop_feedback_shown'
  | 'drop_validation_failed'
  | 'drop_validation_passed'
  | 'drop_validation_exported';

export type DropValidationRuleType = 
  | 'fatigue_threshold'
  | 'crew_capacity'
  | 'stat_tags'
  | 'activity_requirements'
  | 'resident_compatibility'
  | 'slot_availability';

export type DropValidationSeverity = 'low' | 'medium' | 'high' | 'critical';
```

#### 3. Validation Outcome Structure

```typescript
export interface DropValidationOutcome {
  isValid: boolean;
  ruleType: DropValidationRuleType;
  ruleId: string;
  severity: DropValidationSeverity;
  message: string;
  residentId?: string;
  activityId?: string;
  slotId?: string;
  metadata: {
    fatigue?: number;
    crewCount?: number;
    requiredStats?: string[];
    availableStats?: string[];
    requirements?: ActivityRequirements;
    timestamp: number;
    sessionId: string;
  };
}
```

### Configuration System

```typescript
export interface DropValidationAnalyticsConfig {
  id: string;
  version: string;
  analytics: {
    enabled: boolean;
    throttleMs: number;
    maxEventsPerSession: number;
    retentionMs: number;
    batchSize: number;
  };
  export: {
    enabled: boolean;
    formats: ('json' | 'csv' | 'markdown')[];
    maxRecordsPerExport: number;
    includeSensitiveData: boolean;
    filenamePattern: string;
    exportDirectory: string;
  };
  performance: {
    maxValidationLatencyMs: number;
    slowValidationThresholdMs: number;
    enableMonitoring: boolean;
  };
  filters: {
    dateRanges: DateRangeOption[];
    severities: DropValidationSeverity[];
    ruleTypes: DropValidationRuleType[];
    eventTypes: DropValidationEventType[];
  };
}
```

## Usage Examples

### Basic Event Recording

```typescript
import { getDropValidationAnalytics } from '@/analytics/idleVillageDropValidation';

const analytics = getDropValidationAnalytics();

// Record validation outcome
await analytics.recordValidationOutcome({
  isValid: false,
  ruleType: 'crew_capacity',
  ruleId: 'crew-001',
  severity: 'medium',
  message: 'Activity is full',
  metadata: {
    crewCount: 5,
    timestamp: Date.now(),
    sessionId: 'session-123',
  },
}, {
  validationLatencyMs: 25,
  ruleProcessingTimeMs: 10,
  totalProcessingTimeMs: 35,
});

// Record feedback shown
await analytics.recordDropFeedbackShown({
  isValid: true,
  ruleType: 'stat_tags',
  ruleId: 'stat-001',
  severity: 'low',
  message: 'Stat requirements met',
  metadata: {
    requiredStats: ['strength', 'agility'],
    availableStats: ['strength', 'agility'],
    timestamp: Date.now(),
    sessionId: 'session-123',
  },
});
```

### Data Export

```typescript
// Export all events as JSON
const jsonData = await analytics.exportEvents('json');

// Export filtered events as CSV
const csvData = await analytics.exportEvents('csv', {
  dateRange: 24, // Last 24 hours
  severities: ['medium', 'high', 'critical'],
  ruleTypes: ['crew_capacity', 'stat_tags'],
});

// Export summary as Markdown
const markdownData = await analytics.exportEvents('markdown', {
  dateRange: 168, // Last week
  eventTypes: ['drop_validation_failed', 'drop_validation_passed'],
});
```

### Analytics Queries

```typescript
// Get current aggregated metrics
const metrics = await analytics.getCurrentAnalytics();
console.log('Success Rate:', metrics.aggregatedMetrics.successRate);
console.log('Failure Rate:', metrics.aggregatedMetrics.failureRate);
console.log('Average Latency:', metrics.aggregatedMetrics.averageLatencyMs);

// Get filtered events
const recentFailures = await analytics.getFilteredEvents({
  dateRange: 1, // Last hour
  severities: ['high', 'critical'],
  eventTypes: ['drop_validation_failed'],
});

// Get session metrics
const sessionMetrics = await analytics.getCurrentAnalytics();
console.log('Session ID:', sessionMetrics.sessionMetrics.sessionId);
console.log('Total Events:', sessionMetrics.sessionMetrics.totalEvents);
console.log('Dominant Failure Rule:', sessionMetrics.sessionMetrics.dominantFailureRule);
```

### Integration with Drop Validation

```typescript
// In your drop validation logic
import { getDropValidationAnalytics } from '@/analytics/idleVillageDropValidation';

const analytics = getDropValidationAnalytics();

export async function validateResidentDrop(
  residentId: string,
  activityId: string,
  slotId: string
): Promise<DropValidationOutcome> {
  const startTime = performance.now();
  
  try {
    // Your validation logic here
    const outcome = await performValidation(residentId, activityId, slotId);
    
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    // Record the outcome
    await analytics.recordValidationOutcome(outcome, {
      validationLatencyMs: latency,
      ruleProcessingTimeMs: latency * 0.8,
      totalProcessingTimeMs: latency,
    });
    
    // Show feedback if validation failed
    if (!outcome.isValid) {
      await analytics.recordDropFeedbackShown(outcome);
    }
    
    return outcome;
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  }
}
```

## Export Formats

### JSON Export

```json
{
  "events": [
    {
      "eventType": "drop_validation_failed",
      "timestamp": 1640995200000,
      "data": {
        "outcome": {
          "isValid": false,
          "ruleType": "crew_capacity",
          "ruleId": "crew-001",
          "severity": "medium",
          "message": "Activity is full",
          "metadata": {
            "crewCount": 5,
            "timestamp": 1640995200000,
            "sessionId": "session_123"
          }
        },
        "context": {
          "interactionMode": "desktop",
          "screenDimensions": { "width": 1920, "height": 1080 }
        }
      }
    }
  ],
  "exportedAt": "2024-01-20T12:00:00.000Z",
  "version": "1.0.0",
  "totalEvents": 1,
  "aggregatedMetrics": {
    "totalValidations": 1,
    "successRate": 0,
    "failureRate": 1,
    "averageLatencyMs": 25.5,
    "ruleFailureRates": {
      "crew_capacity": 1,
      "fatigue_threshold": 0,
      "stat_tags": 0,
      "activity_requirements": 0,
      "resident_compatibility": 0,
      "slot_availability": 0
    },
    "severityDistribution": {
      "low": 0,
      "medium": 1,
      "high": 0,
      "critical": 0
    }
  }
}
```

### CSV Export

```csv
timestamp,event_type,is_valid,rule_type,rule_id,severity,message,resident_id,activity_id,slot_id,fatigue,crew_count,validation_latency_ms,interaction_mode,screen_width,screen_height
2024-01-20T12:00:00.000Z,drop_validation_failed,false,crew_capacity,crew-001,medium,Activity is full,res-001,act-001,slot-001,,5,25,desktop,1920,1080
2024-01-20T12:00:01.000Z,drop_validation_passed,true,fatigue_threshold,fatigue-001,low,Resident is well-rested,res-002,act-002,slot-002,50,,15,mobile,375,812
```

### Markdown Export

```markdown
# Drop Validation Telemetry Export

**Exported:** January 20, 2024  
**Total Events:** 2

## Summary Metrics

| Metric | Value |
|--------|-------|
| Total Validations | 2 |
| Success Rate | 50.00% |
| Failure Rate | 50.00% |
| Average Latency | 20.00ms |

## Rule Failure Rates

| Rule Type | Failures | Percentage |
|-----------|---------|------------|
| crew_capacity | 1 | 50.00% |
| fatigue_threshold | 0 | 0.00% |
| stat_tags | 0 | 0.00% |
| activity_requirements | 0 | 0.00% |
| resident_compatibility | 0 | 0.00% |
| slot_availability | 0 | 0.00% |

## Severity Distribution

| Severity | Count | Percentage |
|----------|-------|------------|
| low | 0 | 0.00% |
| medium | 1 | 50.00% |
| high | 0 | 0.00% |
| critical | 0 | 0.00% |

## Recent Events

### 12:00:01 PM - drop_validation_passed
- **Rule:** fatigue_threshold
- **Severity:** low
- **Message:** Resident is well-rested
- **Latency:** 15ms
- **Resident ID:** res-002
- **Activity ID:** act-002
- **Slot ID:** slot-002

---

### 12:00:00 PM - drop_validation_failed
- **Rule:** crew_capacity
- **Severity:** medium
- **Message:** Activity is full
- **Latency:** 25ms
- **Resident ID:** res-001
- **Activity ID:** act-001
- **Slot ID:** slot-001

---
```

## Performance Characteristics

### Latency Targets

| Operation | Target | Alert Threshold |
|-----------|--------|------------------|
| Validation Latency | < 50ms | > 100ms |
| Rule Processing | < 40ms | > 80ms |
| Total Processing | < 60ms | > 120ms |
| Export Generation | < 100ms | > 200ms |

### Storage Performance

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Save Event | < 2ms | Async operation |
| Load Events | < 5ms | Depends on event count |
| Filter Events | < 10ms | Depends on filter complexity |
| Export JSON | < 50ms | Depends on event count |
| Export CSV | < 30ms | Depends on event count |
| Export Markdown | < 40ms | Depends on event count |

### Resource Limits

| Resource | Limit | Impact |
|----------|-------|--------|
| Events per Session | 1,000 | Automatic cleanup |
| Retention Period | 24 hours | Automatic cleanup |
| Export Records | 10,000 | Pagination required |
| File Size | 5MB | Compression applied |

## Configuration

### Default Configuration

```typescript
export const DEFAULT_DROP_VALIDATION_ANALYTICS_CONFIG: DropValidationAnalyticsConfig = {
  id: 'idle-village-drop-validation-analytics',
  version: '1.0.0',
  analytics: {
    enabled: true,
    throttleMs: 100,               // 100ms debounce
    maxEventsPerSession: 1000,
    retentionMs: 86400000,          // 24 hours
    batchSize: 50,
  },
  export: {
    enabled: true,
    formats: ['json', 'csv', 'markdown'],
    maxRecordsPerExport: 10000,
    includeSensitiveData: false,
    filenamePattern: 'drop-validation-telemetry-{date}',
    exportDirectory: 'test-results/idleVillage',
  },
  performance: {
    maxValidationLatencyMs: 50,   // 50ms target
    slowValidationThresholdMs: 100, // 100ms alert threshold
    enableMonitoring: true,
  },
  filters: {
    dateRanges: [
      { id: 'last-hour', label: 'Last Hour', value: 1 },
      { id: 'last-6-hours', label: 'Last 6 Hours', value: 6 },
      { id: 'last-24-hours', label: 'Last 24 Hours', value: 24 },
      { id: 'last-week', label: 'Last Week', value: 168 },
      { id: 'last-month', label: 'Last Month', value: 720 },
    ],
    severities: ['low', 'medium', 'high', 'critical'],
    ruleTypes: ['fatigue_threshold', 'crew_capacity', 'stat_tags', 'activity_requirements', 'resident_compatibility', 'slot_availability'],
    eventTypes: ['drop_feedback_shown', 'drop_validation_failed', 'drop_validation_passed', 'drop_validation_exported'],
  },
};
```

### Custom Configuration

```typescript
const customConfig = {
  analytics: {
    throttleMs: 50,                // Faster debouncing
    maxEventsPerSession: 2000,       // More events
    retentionMs: 172800000,         // 48 hours
  },
  export: {
    maxRecordsPerExport: 50000,      // Larger exports
    includeSensitiveData: true,      // Include PII for debugging
  },
  performance: {
    maxValidationLatencyMs: 25,     // Stricter latency target
    slowValidationThresholdMs: 50,   // Earlier alerts
  },
};

const analytics = getDropValidationAnalytics(customConfig);
```

## Testing

### Unit Tests

The telemetry system includes comprehensive unit tests covering:

- **Configuration Validation**: Schema validation and default values
- **Event Recording**: Validation outcome and feedback events
- **Data Export**: JSON, CSV, and Markdown export formats
- **Filtering**: Date range, severity, rule type, and event type filters
- **Performance**: Latency tracking and alert thresholds
- **Error Handling**: Storage failures and invalid events
- **Data Integrity**: Type preservation and chronological ordering

### Test Coverage

```bash
# Run drop validation telemetry tests
npm run test:unit -- tests/unit/idleVillage/DropValidationTelemetry.test.ts

# Run with coverage
npm run test:unit -- tests/unit/idleVillage/DropValidationTelemetry.test.ts --coverage
```

### Test Examples

```typescript
// Test configuration validation
describe('Configuration', () => {
  it('creates safe config from partial config', () => {
    const partialConfig = {
      analytics: {
        throttleMs: 200,
        maxEventsPerSession: 500,
      },
    };
    
    const config = createSafeDropValidationAnalyticsConfig(partialConfig);
    expect(config.analytics.throttleMs).toBe(200);
    expect(config.analytics.retentionMs).toBe(86400000); // Default value
  });
});

// Test event recording
describe('Event Recording', () => {
  it('records validation outcome', async () => {
    const analytics = getDropValidationAnalytics();
    
    const outcome: DropValidationOutcome = {
      isValid: false,
      ruleType: 'crew_capacity',
      ruleId: 'crew-001',
      severity: 'medium',
      message: 'Activity is full',
      metadata: {
        crewCount: 5,
        timestamp: Date.now(),
        sessionId: 'test-session-123',
      },
    };
    
    await analytics.recordValidationOutcome(outcome);
    
    const events = await analytics.loadEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('drop_validation_failed');
    expect(events[0].data.outcome?.ruleType).toBe('crew_capacity');
  });
});
```

## Integration Points

### Persistence Service

All storage operations use the async `PersistenceService`:

```typescript
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

// Save events
await saveData('idle_village_drop_validation_events', events);

// Load events
const events = await loadData('idle_village_drop_validation_events', []);
```

### Global Analytics System

Events are emitted to the global analytics system:

```typescript
// Emit to global analytics
if (typeof window !== 'undefined' && (window as any).gtag) {
  (window as any).gtag('event', event.eventType, {
    event_category: 'idle_village',
    event_label: event.data.outcome?.ruleType || 'validation',
    value: event.data.outcome?.isValid ? 1 : 0,
    custom_parameters: {
      severity: event.data.outcome?.severity,
      latency: event.data.performance?.validationLatencyMs,
      interactionMode: event.data.context.interactionMode,
    },
  });
}
```

### Drop Validation Integration

The telemetry system integrates with the existing drop validation logic:

```typescript
// In your validation component
import { getDropValidationAnalytics } from '@/analytics/idleVillageDropValidation';

const analytics = getDropValidationAnalytics();

const handleDropValidation = async (outcome: DropValidationOutcome) => {
  // Record the validation outcome
  await analytics.recordValidationOutcome(outcome);
  
  // Show feedback if needed
  if (!outcome.isValid) {
    await analytics.recordDropFeedbackShown(outcome);
  }
  
  // Update UI
  updateValidationFeedback(outcome);
};
```

## Security and Privacy

### Data Protection

- **No PII in Exports**: Sensitive data is excluded by default
- **Configurable Data Inclusion**: Optional inclusion of sensitive data for debugging
- **Retention Policies**: Automatic cleanup of old data
- **Secure Storage**: Uses encrypted storage where available

### Access Control

- **Export Restrictions**: Limited to `test-results/idleVillage` directory
- **File Size Limits**: Maximum export size to prevent resource exhaustion
- **Rate Limiting**: Event throttling to prevent spam
- **Session Isolation**: Events are isolated by session ID

## Troubleshooting

### Common Issues

#### 1. Events Not Recording

**Symptoms**: No events appear in analytics data
**Causes**: Analytics disabled, storage errors, invalid event data
**Solutions**: 
- Check `analytics.enabled` configuration
- Verify PersistenceService is working
- Validate event data structure

#### 2. Export Failures

**Symptoms**: Export functions throw errors or return empty data
**Causes**: Invalid filters, storage errors, format issues
**Solutions**:
- Verify filter parameters
- Check storage permissions
- Validate export format configuration

#### 3. Performance Issues

**Symptoms**: Slow validation, high latency
**Causes**: Large event counts, complex filters, storage bottlenecks
**Solutions**:
- Reduce event retention period
- Optimize filter queries
- Check storage performance

#### 4. Memory Issues

**Symptoms**: High memory usage, browser crashes
**Causes**: Too many events, large exports, memory leaks
**Solutions**:
- Reduce `maxEventsPerSession`
- Limit export record count
- Check for memory leaks in event processing

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const debugConfig = {
  analytics: {
    enabled: true,
    throttleMs: 0,  // Disable throttling for debugging
  },
  performance: {
    enableMonitoring: true,
  },
};

const analytics = getDropValidationAnalytics(debugConfig);
```

### Performance Monitoring

Monitor key metrics:

```typescript
// Check current performance
const metrics = await analytics.getCurrentAnalytics();
console.log('Average Latency:', metrics.aggregatedMetrics.averageLatencyMs);
console.log('Total Events:', metrics.sessionMetrics.totalEvents);

// Check for performance alerts
if (metrics.aggregatedMetrics.averageLatencyMs > 100) {
  console.warn('High validation latency detected');
}
```

## Future Enhancements

### Planned Features

1. **Real-time Dashboard**: Live monitoring of validation metrics
2. **Advanced Analytics**: Machine learning for pattern detection
3. **Custom Reports**: User-defined report templates
4. **Alert System**: Configurable alerts for performance issues
5. **Data Visualization**: Charts and graphs for trend analysis

### Integration Opportunities

1. **A/B Testing**: Compare validation rule effectiveness
2. **User Feedback**: Collect user satisfaction data
3. **Performance Optimization**: Identify bottlenecks in validation logic
4. **UX Research**: Analyze user behavior patterns

### API Extensions

1. **Webhook Support**: Real-time event notifications
2. **REST API**: External access to analytics data
3. **GraphQL**: Flexible data querying
4. **WebSocket**: Live streaming of validation events

## Best Practices

### Performance

1. **Event Throttling**: Use appropriate debounce values
2. **Batch Processing**: Process events in batches
3. **Lazy Loading**: Load data on demand
4. **Memory Management**: Clean up old data regularly

### Data Quality

1. **Validation**: Always validate event data
2. **Type Safety**: Use TypeScript interfaces
3. **Error Handling**: Graceful error recovery
4. **Data Integrity**: Maintain chronological order

### Security

1. **Data Minimization**: Only collect necessary data
2. **Access Control**: Limit export capabilities
3. **Encryption**: Use secure storage where available
4. **Audit Logging**: Track data access and modifications

## Conclusion

The Idle Village Drop Validation Telemetry system provides comprehensive tracking and analysis capabilities for Phase E drop validation outcomes. With its config-first design, robust export functionality, and performance monitoring, it enables data-driven UX improvements and ensures optimal validation performance.

The system is designed to be:
- **Configurable**: All settings are configurable through the config system
- **Performant**: Optimized for high-frequency validation events
- **Secure**: Protects user privacy and prevents data leaks
- **Extensible**: Easy to add new event types and metrics
- **Maintainable**: Well-documented with comprehensive test coverage

For questions or issues, refer to the troubleshooting section or check the unit tests for usage examples.
