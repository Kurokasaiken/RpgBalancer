# Punch Club PWA Background Sync Monitor

## Overview

Config-first monitoring system for PWA background sync operations. Tracks queue status, retry logic, failure tracking with comprehensive telemetry and reporting.

## Features

- **Config-First Design**: All monitoring behavior defined in validated configuration
- **Queue Status Tracking**: Real-time monitoring of sync queue depth and status
- **Retry Logic**: Configurable retry strategies with exponential backoff
- **Failure Tracking**: Detailed failure reason categorization
- **Telemetry Integration**: Automatic event emission for monitoring
- **Alert System**: Configurable thresholds for queue depth, failure rate, retry count
- **Export Formats**: JSON and Markdown reports with statistics
- **Event Retention**: Automatic cleanup of old events

## Architecture

### Files

```
src/analytics/punchClub/
└── backgroundSyncMonitor.ts          # Monitor class and configuration

scripts/punchClub/
└── backgroundSyncMonitor.ts          # CLI reporter and utilities

tests/unit/punchClub/
└── BackgroundSyncMonitor.test.ts     # Unit tests

docs/punch_club/
└── background_sync_monitor.md        # This file

test-results/
├── background-sync-*.json            # JSON reports
└── background-sync-*.md              # Markdown reports
```

## Configuration

### Monitor Configuration Schema

```typescript
interface BackgroundSyncMonitorConfig {
  enabled: boolean;
  enableTelemetry: boolean;
  verboseLogging: boolean;
  maxEvents: number;
  retentionPeriodMs: number;
  retry: {
    maxRetries: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
    backoffMultiplier: number;
  };
  alerts: {
    maxQueueDepth: number;
    maxFailureRate: number;
    maxRetryCount: number;
  };
}
```

### Default Configuration

```typescript
{
  enabled: true,
  enableTelemetry: true,
  verboseLogging: false,
  maxEvents: 1000,
  retentionPeriodMs: 86400000, // 24 hours
  retry: {
    maxRetries: 3,
    retryDelayMs: 5000,
    exponentialBackoff: true,
    backoffMultiplier: 2,
  },
  alerts: {
    maxQueueDepth: 100,
    maxFailureRate: 0.2,
    maxRetryCount: 5,
  },
}
```

## Usage

### Basic Usage

```typescript
import { getBackgroundSyncMonitor } from '@/analytics/punchClub/backgroundSyncMonitor';

// Get monitor instance
const monitor = getBackgroundSyncMonitor();

// Record sync events
monitor.recordEvent({
  type: 'sync_registered',
  tag: 'user-data-sync',
  retryCount: 0,
});

monitor.recordEvent({
  type: 'sync_started',
  tag: 'user-data-sync',
  retryCount: 0,
});

monitor.recordEvent({
  type: 'sync_completed',
  tag: 'user-data-sync',
  retryCount: 0,
  duration: 1500,
});
```

### Custom Configuration

```typescript
import { BackgroundSyncMonitor } from '@/analytics/punchClub/backgroundSyncMonitor';

const monitor = new BackgroundSyncMonitor({
  maxEvents: 500,
  verboseLogging: true,
  retry: {
    maxRetries: 5,
    retryDelayMs: 3000,
    exponentialBackoff: true,
    backoffMultiplier: 1.5,
  },
});
```

### Recording Failures

```typescript
monitor.recordEvent({
  type: 'sync_failed',
  tag: 'user-data-sync',
  retryCount: 1,
  failureReason: 'network_error',
  errorMessage: 'Connection timeout after 30s',
});
```

### Getting Statistics

```typescript
const stats = monitor.getStatistics();
console.log(`Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
console.log(`Average Duration: ${stats.averageSyncDuration.toFixed(0)}ms`);
console.log(`Queue Depth: ${stats.queueStats.currentDepth}`);
```

### Exporting Data

```typescript
const exportData = monitor.exportData();

// Save to file
import { saveReport } from '@/scripts/punchClub/backgroundSyncMonitor';
saveReport(exportData, {
  outputDir: 'test-results',
  formats: ['json', 'markdown'],
  includeEvents: true,
  includeConfig: true,
});
```

## Sync Event Types

### 1. sync_registered
Emitted when a new sync is registered with the service worker.

**Fields**: type, tag, retryCount

### 2. sync_started
Emitted when a sync operation begins processing.

**Fields**: type, tag, retryCount

### 3. sync_completed
Emitted when a sync operation completes successfully.

**Fields**: type, tag, retryCount, duration

### 4. sync_failed
Emitted when a sync operation fails.

**Fields**: type, tag, retryCount, failureReason, errorMessage

### 5. sync_retrying
Emitted when a failed sync is being retried.

**Fields**: type, tag, retryCount

### 6. sync_cancelled
Emitted when a sync operation is cancelled.

**Fields**: type, tag, retryCount

## Failure Reasons

- **network_error**: Network connectivity issues
- **server_error**: Server returned error response (5xx)
- **timeout**: Operation exceeded timeout limit
- **quota_exceeded**: Storage quota exceeded
- **invalid_data**: Data validation failed
- **unauthorized**: Authentication/authorization failed
- **unknown**: Unclassified error

## Retry Strategies

### Exponential Backoff

When enabled, retry delays increase exponentially:

```
Retry 0: 5000ms
Retry 1: 10000ms (5000 * 2^1)
Retry 2: 20000ms (5000 * 2^2)
Retry 3: 40000ms (5000 * 2^3)
```

### Non-Retryable Failures

The following failure reasons will not trigger retries:
- `invalid_data` - Data is malformed, retry won't help
- `unauthorized` - Authentication issue, requires user action

## Alert Thresholds

### Queue Depth Alert

Triggered when queue depth exceeds configured maximum:

```typescript
if (queueDepth > config.alerts.maxQueueDepth) {
  console.warn('Queue depth exceeded');
}
```

### Failure Rate Alert

Triggered when failure rate exceeds configured maximum:

```typescript
if ((1 - successRate) > config.alerts.maxFailureRate) {
  console.warn('High failure rate');
}
```

### Retry Count Alert

Triggered when average retry count exceeds configured maximum:

```typescript
if (averageRetryCount > config.alerts.maxRetryCount) {
  console.warn('High retry count');
}
```

## Telemetry

### Event: pc_background_sync_monitored

Emitted for every sync event when telemetry is enabled.

**Payload**:
```typescript
{
  eventType: SyncEventType;
  tag: string;
  retryCount: number;
  duration?: number;
  failureReason?: SyncFailureReason;
  queueDepth: number;
  timestamp: number;
}
```

## Reports

### JSON Report

```json
{
  "config": { ... },
  "events": [ ... ],
  "queueStatus": {
    "totalItems": 5,
    "pendingItems": 2,
    "processingItems": 1,
    "failedItems": 1,
    "completedItems": 10,
    "lastUpdate": 1706097600000
  },
  "statistics": {
    "totalEvents": 15,
    "successfulSyncs": 10,
    "failedSyncs": 2,
    "successRate": 0.833,
    "averageRetryCount": 0.5,
    "averageSyncDuration": 1500,
    "failureReasons": { ... },
    "queueStats": { ... }
  },
  "timestamp": "2026-01-24T10:00:00.000Z"
}
```

### Markdown Report

```markdown
# Background Sync Monitor Report

**Generated:** 2026-01-24T10:00:00.000Z

## Queue Status

- **Total Items:** 5
- **Pending:** 2
- **Processing:** 1
- **Failed:** 1
- **Completed:** 10

## Statistics

- **Total Events:** 15
- **Successful Syncs:** 10
- **Failed Syncs:** 2
- **Success Rate:** 83.3%
- **Average Retry Count:** 0.50
- **Average Sync Duration:** 1500ms
```

### Console Summary

```
================================================================================
Background Sync Monitor - Summary
================================================================================

Queue Status:
  Total: 5 | Pending: 2 | Processing: 1
  Failed: 1 | Completed: 10

Statistics:
  Total Events: 15
  Successful: 10 | Failed: 2 | Retried: 3
  Success Rate: 83.3%
  Avg Retry Count: 0.50
  Avg Duration: 1500ms

Queue Stats:
  Current: 5 | Average: 3.5 | Max: 8

Failure Reasons:
  network_error: 1
  server_error: 1

================================================================================
```

## Integration with Service Worker

```typescript
// In service worker
self.addEventListener('sync', async (event) => {
  const monitor = getBackgroundSyncMonitor();
  
  monitor.recordEvent({
    type: 'sync_started',
    tag: event.tag,
    retryCount: 0,
  });

  try {
    await performSync(event.tag);
    
    monitor.recordEvent({
      type: 'sync_completed',
      tag: event.tag,
      retryCount: 0,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    monitor.recordEvent({
      type: 'sync_failed',
      tag: event.tag,
      retryCount: 0,
      failureReason: classifyError(error),
      errorMessage: error.message,
    });
    
    if (shouldRetry(0, 3, classifyError(error))) {
      // Schedule retry
      await scheduleRetry(event.tag);
    }
  }
});
```

## Best Practices

1. **Record All Events**: Track every sync lifecycle event for complete visibility
2. **Classify Failures**: Use appropriate failure reasons for better debugging
3. **Monitor Alerts**: Act on alert thresholds to prevent queue buildup
4. **Export Regularly**: Generate reports for trend analysis
5. **Tune Retry Logic**: Adjust retry configuration based on failure patterns
6. **Clean Up**: Ensure old events are cleaned up to prevent memory issues
7. **Test Offline**: Verify behavior during network outages

## Troubleshooting

### High Queue Depth

**Symptom**: Queue depth consistently exceeds threshold

**Solutions**:
1. Increase worker concurrency
2. Optimize sync operations
3. Implement batch processing
4. Review retry strategy

### High Failure Rate

**Symptom**: Failure rate exceeds 20%

**Solutions**:
1. Check network connectivity
2. Review server logs for errors
3. Validate data before sync
4. Implement better error handling

### Excessive Retries

**Symptom**: Average retry count > 5

**Solutions**:
1. Reduce retry attempts for certain failures
2. Implement exponential backoff
3. Add circuit breaker pattern
4. Review failure classification

## Performance Considerations

- **Event Retention**: Default 24 hours, adjust based on needs
- **Max Events**: Default 1000, increase for high-volume apps
- **Telemetry Overhead**: Minimal, ~1ms per event
- **Memory Usage**: ~1KB per event, 1MB for 1000 events
- **Cleanup Frequency**: On every event record

## Related Documentation

- [PC-M2 PWA Plan](../plans/punch_club_m2_plan.md)
- [Service Worker Integration](./service_worker_integration.md)
- [PWA Install Tracker](./pwa_install_tracker.md)

## Version History

- **v1.0.0** (2026-01-24): Initial implementation
  - Config-first monitoring system
  - 6 sync event types
  - 7 failure reason categories
  - Retry logic with exponential backoff
  - Alert system with 3 thresholds
  - JSON and Markdown export
  - Telemetry integration
  - Comprehensive unit tests
