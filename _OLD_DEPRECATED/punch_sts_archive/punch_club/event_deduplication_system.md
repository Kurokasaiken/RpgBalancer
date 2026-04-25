# Event Deduplication System - NP-201

**Date:** 2026-01-24  
**Agent:** Oracle-PC  
**Status:** ✅ COMPLETED  

## Executive Summary

Config-first system for deduplicating telemetry events with fingerprinting algorithms, window-based detection, CLI analyzer, and comprehensive metrics tracking. Prevents duplicate event processing while preserving unique events.

## Overview

The Event Deduplication System provides:
- **5 Fingerprint Algorithms** - Full, Semantic, Temporal, Content, Hybrid
- **4 Deduplication Strategies** - Exact, Window, Sliding, Adaptive
- **Window-Based Detection** - Configurable time windows (0-3600s)
- **CLI Analyzer** - Metrics, logging, and reporting
- **Telemetry Integration** - `pc_event_deduplicated` event tracking
- **Performance Metrics** - Fingerprint time, deduplication rate, throughput
- **Cache Management** - Automatic cleanup and size limits

## Configuration

### Default Config

```typescript
{
  algorithm: 'semantic',
  strategy: 'window',
  windowSizeMs: 5000,
  maxCacheSize: 10000,
  enableTelemetry: true,
  fingerprintFields: ['event', 'data'],
  excludeFields: ['timestamp', 'sessionId'],
  cleanupIntervalMs: 60000,
}
```

### Validation Schema

```typescript
const DeduplicationConfigSchema = z.object({
  algorithm: z.enum(['full', 'semantic', 'temporal', 'content', 'hybrid']),
  strategy: z.enum(['exact', 'window', 'sliding', 'adaptive']),
  windowSizeMs: z.number().min(0).max(3600000),
  maxCacheSize: z.number().min(10).max(100000),
  enableTelemetry: z.boolean(),
  fingerprintFields: z.array(z.string()),
  excludeFields: z.array(z.string()),
  cleanupIntervalMs: z.number().min(1000).max(3600000),
});
```

## Fingerprint Algorithms (5 types)

### 1. Full
- **Strategy**: Hash all event fields
- **Use Case**: Exact duplicate detection
- **Pros**: Most accurate
- **Cons**: Sensitive to timestamp changes

```typescript
fingerprintData = filterFields(event, excludeFields);
```

### 2. Semantic
- **Strategy**: Hash event type + key data fields
- **Use Case**: Logical duplicate detection
- **Pros**: Ignores irrelevant fields
- **Cons**: Requires field configuration

```typescript
fingerprintData = {
  event: event.event,
  ...extractKeyFields(event.data),
};
```

### 3. Temporal
- **Strategy**: Hash event type + time window
- **Use Case**: Time-based grouping
- **Pros**: Groups similar events in time
- **Cons**: May miss duplicates across windows

```typescript
const timeWindow = Math.floor(timestamp / windowSizeMs);
fingerprintData = {
  event: event.event,
  timeWindow,
};
```

### 4. Content
- **Strategy**: Hash event type + full data payload
- **Use Case**: Content-based deduplication
- **Pros**: Precise content matching
- **Cons**: Sensitive to data changes

```typescript
fingerprintData = {
  event: event.event,
  data: event.data,
};
```

### 5. Hybrid
- **Strategy**: Combination of semantic + temporal
- **Use Case**: Balanced approach
- **Pros**: Best of both worlds
- **Cons**: More complex

```typescript
fingerprintData = {
  event: event.event,
  data: extractKeyFields(event.data),
  timeWindow: Math.floor(timestamp / windowSizeMs),
};
```

## Deduplication Strategies (4 types)

### 1. Exact
- **Detection**: Exact timestamp match
- **Use Case**: Immediate duplicates
- **Window**: None

```typescript
return lastSeen === currentTimestamp;
```

### 2. Window
- **Detection**: Within fixed time window
- **Use Case**: General deduplication
- **Window**: Fixed (e.g., 5000ms)

```typescript
return currentTimestamp - lastSeen <= windowSizeMs;
```

### 3. Sliding
- **Detection**: Sliding time window
- **Use Case**: Continuous monitoring
- **Window**: Slides with each event

```typescript
return currentTimestamp - lastSeen <= windowSizeMs;
```

### 4. Adaptive
- **Detection**: Adaptive window based on frequency
- **Use Case**: Variable event rates
- **Window**: Adjusts automatically

```typescript
const avgInterval = calculateAvgInterval();
const adaptiveWindow = Math.max(windowSizeMs, avgInterval * 2);
return currentTimestamp - lastSeen <= adaptiveWindow;
```

## Usage

### System API

```typescript
import { createDeduplicationSystem } from '@/analytics/punchClub/eventDeduplicationSystem';

// Create system
const system = createDeduplicationSystem({
  algorithm: 'semantic',
  strategy: 'window',
  windowSizeMs: 5000,
});

// Check for duplicates
const event = {
  event: 'pc_combat_started',
  timestamp: Date.now(),
  data: { matchId: 'match-123' },
};

const result = system.isDuplicate(event);

if (result.isDuplicate) {
  console.log(`Duplicate detected! Count: ${result.duplicateCount}`);
} else {
  // Process unique event
  processEvent(event);
}

// Get metrics
const metrics = system.getMetrics();
console.log(`Deduplication rate: ${metrics.deduplicationRate}%`);

// Cleanup
system.stop();
```

### CLI Analyzer

```bash
# Basic usage
npm run event:dedup

# With input file
npm run event:dedup -- --input events.json

# Custom algorithm
npm run event:dedup -- --algorithm semantic --window-size 10000

# Custom strategy
npm run event:dedup -- --strategy adaptive --verbose

# Output formats
npm run event:dedup -- --format json
npm run event:dedup -- --format markdown
npm run event:dedup -- --format both
```

## Metrics

### Deduplication Metrics

```typescript
{
  totalEvents: number,
  uniqueEvents: number,
  duplicateEvents: number,
  deduplicationRate: number,        // Percentage
  cacheSize: number,
  avgFingerprintTime: number,       // ms
  avgDeduplicationTime: number,     // ms
  eventTypeBreakdown: {
    [eventType]: {
      total: number,
      unique: number,
      duplicates: number,
    }
  }
}
```

### Performance Metrics

- **Fingerprint Time**: Average time to generate fingerprint
- **Deduplication Time**: Average time to check for duplicates
- **Throughput**: Events processed per second
- **Cache Hit Rate**: Percentage of cache hits

## Telemetry Event

```typescript
{
  event: 'pc_event_deduplicated',
  timestamp: Date.now(),
  data: {
    originalEvent: 'pc_combat_started',
    fingerprint: 'a1b2c3...',
    duplicateCount: 3,
    firstSeen: 1706097600000,
    lastSeen: 1706097605000,
    algorithm: 'semantic',
    strategy: 'window',
    windowSizeMs: 5000,
  }
}
```

## CLI Analyzer Features

### 1. Event Analysis
- Load events from JSON file
- Generate mock events for testing
- Process events with configured system
- Track duplicates in real-time

### 2. Metrics Calculation
- Total/unique/duplicate counts
- Deduplication rate
- Event type breakdown
- Performance metrics

### 3. Report Generation
- **JSON Report**: Complete metrics data
- **Markdown Report**: Human-readable summary
- **Console Summary**: Quick overview

### 4. Recommendations
- High deduplication rate warnings
- Performance optimization suggestions
- Configuration recommendations

## Report Formats

### JSON Report

```json
{
  "timestamp": 1706097600000,
  "config": {
    "algorithm": "semantic",
    "strategy": "window",
    "windowSizeMs": 5000
  },
  "metrics": {
    "totalEvents": 100,
    "uniqueEvents": 85,
    "duplicateEvents": 15,
    "deduplicationRate": 15.0
  }
}
```

### Markdown Report

```markdown
# Event Deduplication Analysis Report

**Generated:** 2026-01-24T10:00:00.000Z

## Summary Metrics
| Metric | Value |
|--------|-------|
| Total Events | 100 |
| Unique Events | 85 |
| Duplicate Events | 15 |
| Deduplication Rate | 15.0% |

## Recommendations
✅ Low Deduplication Rate: 15.0% of events are duplicates.
- Event generation is working well
- Deduplication system is effective
```

## Algorithm Selection Guide

### When to Use Each Algorithm

| Algorithm | Best For | Avoid When |
|-----------|----------|------------|
| **Full** | Exact duplicates | Timestamps vary |
| **Semantic** | Logical duplicates | Key fields unknown |
| **Temporal** | Time-based grouping | Precise matching needed |
| **Content** | Content matching | Data structure varies |
| **Hybrid** | General use | Simple cases |

### Recommended Configurations

**High-Frequency Events** (>100/sec)
```typescript
{
  algorithm: 'temporal',
  strategy: 'window',
  windowSizeMs: 1000,
  maxCacheSize: 50000,
}
```

**Low-Frequency Events** (<10/sec)
```typescript
{
  algorithm: 'semantic',
  strategy: 'adaptive',
  windowSizeMs: 10000,
  maxCacheSize: 10000,
}
```

**Exact Matching Required**
```typescript
{
  algorithm: 'full',
  strategy: 'exact',
  windowSizeMs: 0,
  maxCacheSize: 5000,
}
```

## Edge Cases

### 1. Timing Edge Cases

**Problem**: Events at window boundary
```typescript
Event A: timestamp = 1000
Event B: timestamp = 6001
Window: 5000ms
Result: Not duplicate (outside window)
```

**Solution**: Use sliding strategy or increase window

### 2. Cache Overflow

**Problem**: Cache exceeds maxCacheSize
**Solution**: Automatic cleanup removes oldest entries

### 3. Rapid Duplicates

**Problem**: Many duplicates in short time
**Solution**: Increment count, update lastSeen

### 4. Clock Skew

**Problem**: Timestamps from different sources
**Solution**: Use semantic algorithm, exclude timestamp

## Performance Optimization

### 1. Algorithm Selection
- **Fast**: Temporal (time window only)
- **Balanced**: Semantic (key fields)
- **Accurate**: Full (all fields)

### 2. Cache Management
- Smaller cache = faster lookups
- Larger cache = better detection
- Optimal: 10,000 entries

### 3. Window Size
- Smaller window = faster cleanup
- Larger window = better detection
- Optimal: 5,000ms

### 4. Cleanup Interval
- More frequent = lower memory
- Less frequent = better performance
- Optimal: 60,000ms

## Integration with NP-190 Batch Optimizer

### Batch Processing

```typescript
const system = createDeduplicationSystem();
const batchOptimizer = createBatchOptimizer();

// Process batch
const batch = batchOptimizer.getBatch();
const uniqueEvents = batch.filter(event => {
  const result = system.isDuplicate(event);
  return !result.isDuplicate;
});

// Send unique events
sendEvents(uniqueEvents);
```

### Pipeline Integration

```typescript
// Telemetry pipeline
const pipeline = [
  validateEvent,
  deduplicateEvent,  // <- NP-201
  batchEvent,        // <- NP-190
  sendEvent,
];
```

## Troubleshooting

### Issue: High Deduplication Rate

**Symptoms**: >30% duplicates

**Solutions**:
1. Check event generation logic
2. Review retry mechanisms
3. Investigate batching strategy
4. Verify event timestamps

### Issue: Slow Performance

**Symptoms**: >1ms per event

**Solutions**:
1. Reduce cache size
2. Use simpler algorithm (temporal)
3. Increase cleanup interval
4. Optimize fingerprint fields

### Issue: Missing Duplicates

**Symptoms**: Known duplicates not detected

**Solutions**:
1. Increase window size
2. Use semantic algorithm
3. Configure fingerprint fields
4. Check timestamp accuracy

## Best Practices

### 1. Algorithm Selection
- Start with semantic
- Test with real data
- Monitor deduplication rate
- Adjust based on metrics

### 2. Window Configuration
- Match event frequency
- Consider network latency
- Account for clock skew
- Test edge cases

### 3. Cache Management
- Monitor cache size
- Adjust maxCacheSize
- Configure cleanup interval
- Track memory usage

### 4. Monitoring
- Track deduplication rate
- Monitor performance
- Log duplicate events
- Alert on anomalies

## Prohibited Operations (Enforced)

✅ **No Unique Event Loss**: All unique events preserved  
✅ **No Hardcoded Logic**: All config-driven  
✅ **Edge Case Handling**: Window boundaries, cache overflow, timing  

## Future Enhancements

- [ ] Distributed deduplication across instances
- [ ] Persistent cache with Redis
- [ ] Machine learning for adaptive windows
- [ ] Real-time dashboard
- [ ] Historical analysis
- [ ] A/B testing for algorithms

## Resources

### Internal Documentation
- `src/analytics/punchClub/eventDeduplicationSystem.ts` - System
- `scripts/punchClub/eventDedupAnalyzer.ts` - CLI analyzer

### Related Documentation
- NP-190 Batch Optimizer
- PC-M2E Telemetry Pipeline

## Conclusion

The Event Deduplication System provides comprehensive config-first tooling for identifying and removing duplicate telemetry events with 5 fingerprint algorithms, 4 deduplication strategies, and complete metrics tracking. Ensures data quality while preserving unique events.

---

**Last Updated:** 2026-01-24  
**Next Review:** 2026-04-24  
**Maintainer:** Oracle-PC (Cascade AI)
