# ActivitySlot Persistence Resilience Testing

## Overview

Config-first chaos testing suite for ActivitySlot persistence resilience. Simulates crash scenarios, quota exceeded, duplicate hydration, and other failure modes to validate recovery mechanisms and data integrity.

## Features

- **Config-First Design**: All chaos events and scenarios defined in validated configuration
- **Comprehensive Event Matrix**: Crash, quota, corruption, timeout, concurrency scenarios
- **Recovery KPI Tracking**: Measures recovery time, data integrity, failure rates
- **Automated Mitigation Suggestions**: Provides actionable recommendations
- **Export Formats**: JSON and Markdown reports with detailed metrics
- **Telemetry Integration**: Tracks chaos run results for monitoring

## Architecture

### Files

```
scripts/idleVillage/
└── activitySlotChaosRunner.ts          # Chaos runner configuration and utilities

tests/unit/idleVillage/
└── ActivitySlotPersistenceChaos.test.ts # Chaos test suite

docs/idle_village/
└── activityslot_persistence_resilience.md # This file

test-results/activityslot-chaos/
├── chaos-run-*.json                     # JSON export
└── chaos-run-*.md                       # Markdown export
```

## Chaos Events

### 1. Crash Mid-Save
- **Type**: crash_mid_save
- **Description**: Application crashes during ActivitySlot save operation
- **Probability**: 10%
- **Timing**: during_save
- **Expected Recovery**: Yes, within 3000ms, data preserved
- **Mitigations**:
  - Implement atomic write operations
  - Use write-ahead logging
  - Add save operation checkpoints

### 2. Crash Mid-Load
- **Type**: crash_mid_load
- **Description**: Application crashes during ActivitySlot load operation
- **Probability**: 5%
- **Timing**: during_load
- **Expected Recovery**: Yes, within 2000ms, data preserved
- **Mitigations**:
  - Implement graceful load failure handling
  - Use default fallback state
  - Add load operation timeout

### 3. Quota Exceeded
- **Type**: quota_exceeded
- **Description**: Storage quota exceeded during save
- **Probability**: 15%
- **Timing**: during_save
- **Expected Recovery**: Yes, within 1000ms, data may be lost
- **Mitigations**:
  - Implement quota monitoring
  - Add data compression
  - Implement cleanup of old data
  - Show user warning before quota limit

### 4. Duplicate Hydration
- **Type**: duplicate_hydration
- **Description**: Multiple tabs attempt to hydrate ActivitySlot store simultaneously
- **Probability**: 20%
- **Timing**: during_load
- **Expected Recovery**: Yes, within 500ms, data preserved
- **Mitigations**:
  - Implement tab synchronization
  - Use BroadcastChannel API
  - Add hydration lock mechanism
  - Detect and merge concurrent changes

### 5. Corrupted Data
- **Type**: corrupted_data
- **Description**: Stored ActivitySlot data is corrupted or invalid
- **Probability**: 5%
- **Timing**: during_load
- **Expected Recovery**: Yes, within 1000ms, data may be lost
- **Mitigations**:
  - Implement data validation on load
  - Use schema versioning
  - Add data migration logic
  - Keep backup of last known good state

### 6. Network Timeout
- **Type**: network_timeout
- **Description**: Network timeout during async persistence operation
- **Probability**: 10%
- **Timing**: during_save
- **Expected Recovery**: Yes, within 5000ms, data preserved
- **Mitigations**:
  - Implement retry logic with exponential backoff
  - Add operation timeout
  - Queue failed operations for retry
  - Show user feedback for pending operations

### 7. Concurrent Writes
- **Type**: concurrent_writes
- **Description**: Multiple concurrent write operations to same ActivitySlot
- **Probability**: 15%
- **Timing**: during_save
- **Expected Recovery**: Yes, within 2000ms, data preserved
- **Mitigations**:
  - Implement write operation queue
  - Use optimistic locking
  - Add conflict resolution strategy
  - Debounce rapid save operations

## Test Scenarios

### Scenario 1: Crash Recovery
Tests recovery from mid-operation crashes.

**Events**: crash_mid_save, crash_mid_load  
**Initial State**: 2 activity slots  
**Expected Final State**: Same 2 activity slots (data preserved)  
**Timeout**: 10000ms

### Scenario 2: Quota Exceeded Handling
Tests behavior when storage quota is exceeded.

**Events**: quota_exceeded  
**Initial State**: 100 activity slots  
**Expected Final State**: Empty (graceful degradation)  
**Timeout**: 5000ms

### Scenario 3: Multi-Tab Synchronization
Tests duplicate hydration from multiple tabs.

**Events**: duplicate_hydration  
**Initial State**: 1 activity slot  
**Expected Final State**: Same 1 activity slot (no duplication)  
**Timeout**: 3000ms

### Scenario 4: Data Corruption Recovery
Tests recovery from corrupted stored data.

**Events**: corrupted_data  
**Initial State**: Corrupted data string  
**Expected Final State**: Empty (fallback to default)  
**Timeout**: 3000ms

### Scenario 5: Concurrent Operations
Tests handling of concurrent write operations.

**Events**: network_timeout, concurrent_writes  
**Initial State**: 1 activity slot  
**Expected Final State**: Same 1 activity slot (no conflicts)  
**Timeout**: 8000ms

## Configuration

### Chaos Runner Configuration Schema

```typescript
interface ChaosRunnerConfig {
  scenarios: ChaosScenario[];
  runner: {
    maxRetries: number;
    retryDelayMs: number;
    enableTelemetry: boolean;
    verboseLogging: boolean;
  };
  kpis: {
    maxRecoveryTimeMs: number;
    minDataIntegrityPercent: number;
    maxFailureRate: number;
  };
  export: {
    formats: ('json' | 'markdown')[];
    outputDir: string;
    includeStackTraces: boolean;
  };
}
```

### Default KPIs

- **Max Recovery Time**: 5000ms
- **Min Data Integrity**: 95%
- **Max Failure Rate**: 5%

## Usage

### Running Chaos Tests

```bash
# Run all chaos tests
npm run test -- tests/unit/idleVillage/ActivitySlotPersistenceChaos.test.ts

# Run with verbose output
npm run test -- tests/unit/idleVillage/ActivitySlotPersistenceChaos.test.ts --reporter=verbose

# Run specific scenario
npm run test -- tests/unit/idleVillage/ActivitySlotPersistenceChaos.test.ts -t "Crash Recovery"
```

### Programmatic Usage

```typescript
import {
  createSafeChaosRunnerConfig,
  calculateDataIntegrity,
  generateChaosRunSummary,
} from '@/scripts/idleVillage/activitySlotChaosRunner';

// Create custom configuration
const config = createSafeChaosRunnerConfig({
  scenarios: [
    {
      id: 'custom-crash',
      name: 'Custom Crash Test',
      description: 'Test custom crash scenario',
      events: [/* custom events */],
      initialState: { activitySlots: [] },
      expectedFinalState: { activitySlots: [] },
      timeoutMs: 5000,
    },
  ],
  kpis: {
    maxRecoveryTimeMs: 3000,
    minDataIntegrityPercent: 98,
    maxFailureRate: 0.02,
  },
});

// Calculate data integrity
const integrity = calculateDataIntegrity(expected, actual);
console.log(`Data integrity: ${integrity}%`);

// Generate summary
const summary = generateChaosRunSummary(result);
console.log(summary);
```

## Output

### Console Summary

```
================================================================================
ActivitySlot Persistence Chaos Test - Run Summary
================================================================================

Timestamp: 2026-01-24T10:00:00.000Z
Total Scenarios: 5
Passed: 4
Failed: 1
Success Rate: 80.0%

Total Events: 10
Recovered Events: 9
Recovery Rate: 90.0%
Average Data Integrity: 95.5%
KPIs Met: ✓

Scenario Results:
--------------------------------------------------------------------------------
  ✓ crash-recovery
    Duration: 2500ms
    Events: 2 triggered, 2 recovered
    Data Integrity: 100.0%
    Avg Recovery Time: 1200ms
    Max Recovery Time: 1800ms
    Failed Recoveries: 0

  ✓ quota-handling
    Duration: 1200ms
    Events: 1 triggered, 1 recovered
    Data Integrity: 0.0%
    Avg Recovery Time: 800ms
    Max Recovery Time: 800ms
    Failed Recoveries: 0
    Suggested Mitigations:
      - Implement quota monitoring
      - Add data compression

  ✗ multi-tab-sync
    Duration: 3100ms
    Events: 1 triggered, 0 recovered
    Data Integrity: 50.0%
    Avg Recovery Time: 0ms
    Max Recovery Time: 0ms
    Failed Recoveries: 1
    Errors:
      - duplicate_hydration: Race condition detected
    Suggested Mitigations:
      - Implement tab synchronization
      - Use BroadcastChannel API

Overall Suggestions:
--------------------------------------------------------------------------------
  - Implement BroadcastChannel for tab synchronization
  - Add quota monitoring before save operations
  - Implement retry logic with exponential backoff

================================================================================
```

### JSON Export

```json
{
  "totalScenarios": 5,
  "passedScenarios": 4,
  "failedScenarios": 1,
  "totalEvents": 10,
  "recoveredEvents": 9,
  "averageDataIntegrity": 95.5,
  "kpisMet": true,
  "results": [
    {
      "scenarioId": "crash-recovery",
      "success": true,
      "duration": 2500,
      "eventsTriggered": 2,
      "eventsRecovered": 2,
      "dataIntegrityScore": 100,
      "errors": [],
      "recoveryMetrics": {
        "averageRecoveryTimeMs": 1200,
        "maxRecoveryTimeMs": 1800,
        "failedRecoveries": 0
      },
      "mitigationsSuggested": []
    }
  ],
  "timestamp": "2026-01-24T10:00:00.000Z",
  "suggestions": [
    "Implement BroadcastChannel for tab synchronization"
  ]
}
```

### Markdown Export

See JSON export structure rendered as Markdown with headers and formatting.

## Recovery Metrics

### Data Integrity Score

Calculated as percentage of expected data keys that match actual data:

```typescript
dataIntegrity = (matchingKeys / totalExpectedKeys) * 100
```

### Recovery Time

Measured from event trigger to successful recovery:

```typescript
recoveryTime = recoveryEndTime - eventTriggerTime
```

### Failure Rate

Percentage of events that failed to recover:

```typescript
failureRate = failedRecoveries / totalEvents
```

## Integration with Guardian Suite

### Adding to Guardian Scripts

```typescript
// In scripts/guardian/autoCommitGuardian.ts
import { createSafeChaosRunnerConfig } from '@/scripts/idleVillage/activitySlotChaosRunner';

// Run chaos tests before commit
const chaosConfig = createSafeChaosRunnerConfig();
// Execute chaos tests and validate KPIs
```

### CI/CD Integration

```yaml
name: ActivitySlot Chaos Tests

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * *' # Daily

jobs:
  chaos:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Chaos Tests
        run: npm run test -- tests/unit/idleVillage/ActivitySlotPersistenceChaos.test.ts
      
      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: chaos-test-results
          path: test-results/activityslot-chaos/
```

## Troubleshooting

### High Failure Rate

**Symptom**: Failure rate exceeds 5% KPI

**Solutions**:
1. Review error logs for common failure patterns
2. Implement suggested mitigations from test output
3. Increase retry attempts in runner configuration
4. Add more robust error handling in PersistenceService

### Low Data Integrity

**Symptom**: Data integrity below 95% KPI

**Solutions**:
1. Implement data validation on load
2. Add schema versioning and migration
3. Keep backup of last known good state
4. Use atomic write operations

### Slow Recovery Time

**Symptom**: Recovery time exceeds 5000ms KPI

**Solutions**:
1. Optimize persistence operations
2. Reduce retry delay
3. Implement parallel recovery strategies
4. Add operation timeouts

## Best Practices

1. **Run Regularly**: Execute chaos tests daily or before releases
2. **Monitor Trends**: Track KPI trends over time
3. **Act on Suggestions**: Implement suggested mitigations
4. **Update Scenarios**: Add new scenarios as features evolve
5. **Document Failures**: Keep log of failure patterns and fixes
6. **Test in Isolation**: Run chaos tests in dedicated environment
7. **Validate Fixes**: Re-run tests after implementing mitigations

## Related Documentation

- [Storage Testing Framework](../../src/shared/testing/README.md)
- [PersistenceService](../../src/shared/persistence/PersistenceService.ts)
- [ActivitySlot Store Phase 12](../plans/idle_village_plan.md)
- [Guardian Suite](../../scripts/guardian/README.md)

## Version History

- **v1.0.0** (2026-01-24): Initial implementation
  - 7 chaos event types
  - 5 default test scenarios
  - KPI validation (recovery time, data integrity, failure rate)
  - JSON and Markdown export
  - Telemetry integration
  - Mitigation suggestions
