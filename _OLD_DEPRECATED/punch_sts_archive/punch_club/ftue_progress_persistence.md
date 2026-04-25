# FTUE Progress Persistence Validator

## Overview
Config-first validator for FTUE progress persistence with chaos testing, corruption detection, and recovery strategies.

## Features
- **Schema Validation**: Zod-based validation with checksum verification
- **Corruption Detection**: Checksum mismatch, timestamp inconsistency, invalid step order
- **Chaos Testing**: 7 corruption scenarios with automated recovery
- **Recovery Strategies**: Automatic recovery with data preservation
- **CLI Tool**: Interactive validation, recovery, chaos testing, benchmarking
- **Telemetry Integration**: `pc_ftue_progress_validated` events
- **Storage Framework Integration**: Compatible with Storage Testing Framework

## Schema

### FTUEProgressState

```typescript
{
  currentStep: FTUEStep;           // Current FTUE step
  checkpoints: FTUECheckpoint[];   // Completed checkpoints
  startedAt: number;               // Start timestamp
  lastUpdated: number;             // Last update timestamp
  version: string;                 // Schema version
  checksum?: string;               // Integrity checksum
}
```

### FTUEStep

```typescript
type FTUEStep =
  | 'welcome'
  | 'swipe_tutorial'
  | 'tap_tutorial'
  | 'hold_tutorial'
  | 'first_match'
  | 'training_intro'
  | 'completed';
```

### FTUECheckpoint

```typescript
{
  id: string;              // Checkpoint ID
  step: FTUEStep;          // Step identifier
  completedAt: number;     // Completion timestamp
  attempts: number;        // Number of attempts
  skipped: boolean;        // Was skipped
}
```

## Usage

### Programmatic API

```typescript
import {
  validateFTUEProgress,
  recoverProgress,
  createDefaultProgress,
} from '@/tests/unit/punchClub/FTUEProgressPersistence.test';

// Validate progress
const result = validateFTUEProgress(state);

if (!result.valid) {
  console.error('Validation failed:', result.errors);
  
  if (result.recoverable) {
    const recovered = recoverProgress(state);
    // Use recovered state
  }
}

// Create default progress
const defaultState = createDefaultProgress();
```

### CLI Tool

```bash
# Validate progress file
npm run ftue:validate -- --action validate --input progress.json

# Recover corrupted progress
npm run ftue:validate -- --action recover --input corrupted.json --output recovered.json

# Run chaos tests
npm run ftue:validate -- --action chaos --iterations 100 --verbose

# Benchmark validation
npm run ftue:validate -- --action benchmark --iterations 1000
```

## Validation Rules

### Checksum Verification

Progress state includes a checksum for corruption detection:

```typescript
const checksum = calculateChecksum({
  currentStep,
  checkpoints,
  startedAt,
  lastUpdated,
  version,
});
```

Checksum mismatch indicates data corruption.

### Timestamp Consistency

```typescript
lastUpdated >= startedAt
```

`lastUpdated` must not be before `startedAt`.

### Step Order Validation

Checkpoints must not be ahead of current step:

```typescript
const stepOrder = [
  'welcome',
  'swipe_tutorial',
  'tap_tutorial',
  'hold_tutorial',
  'first_match',
  'training_intro',
  'completed',
];

checkpointIndex <= currentStepIndex
```

### Duplicate Detection

Warns about duplicate checkpoints (same step multiple times).

## Corruption Scenarios

### Scenario 1: Checksum Mismatch

**Cause**: Data modified externally or storage corruption

**Detection**: Checksum verification fails

**Recovery**: Recalculate checksum with current data

```typescript
const recovered = {
  ...state,
  checksum: calculateChecksum(state),
};
```

### Scenario 2: Missing Fields

**Cause**: Incomplete save or schema version mismatch

**Detection**: Zod validation fails

**Recovery**: Fill missing fields with defaults

```typescript
const recovered = {
  currentStep: state.currentStep || 'welcome',
  checkpoints: state.checkpoints || [],
  startedAt: state.startedAt || Date.now(),
  lastUpdated: Date.now(),
  version: state.version || '1.0.0',
};
```

### Scenario 3: Invalid Step Values

**Cause**: Schema change or data corruption

**Detection**: Step not in valid enum

**Recovery**: Reset to 'welcome' step

```typescript
const validSteps = ['welcome', 'swipe_tutorial', ...];
const recovered = {
  ...state,
  currentStep: validSteps.includes(state.currentStep)
    ? state.currentStep
    : 'welcome',
};
```

### Scenario 4: Timestamp Inconsistency

**Cause**: Clock skew or manual modification

**Detection**: `lastUpdated < startedAt`

**Recovery**: Update `lastUpdated` to current time

```typescript
const recovered = {
  ...state,
  lastUpdated: Math.max(state.lastUpdated, state.startedAt, Date.now()),
};
```

### Scenario 5: Invalid Checkpoint Order

**Cause**: Race condition or data corruption

**Detection**: Checkpoint ahead of current step

**Recovery**: Filter invalid checkpoints

```typescript
const validCheckpoints = state.checkpoints.filter(
  checkpoint => stepOrder.indexOf(checkpoint.step) <= currentStepIndex
);
```

### Scenario 6: Corrupted JSON

**Cause**: Incomplete write or storage failure

**Detection**: JSON.parse() throws

**Recovery**: Create default progress

```typescript
try {
  return JSON.parse(data);
} catch {
  return createDefaultProgress();
}
```

### Scenario 7: Quota Exceeded

**Cause**: Storage limit reached

**Detection**: localStorage.setItem() throws QuotaExceededError

**Recovery**: Compress data or use alternative storage

```typescript
try {
  localStorage.setItem(key, JSON.stringify(state));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Compress checkpoints or use IndexedDB
  }
}
```

## Recovery Strategies

### Strategy 1: Automatic Recovery

Attempt automatic recovery for recoverable corruption:

```typescript
const result = validateFTUEProgress(state);

if (!result.valid && result.recoverable) {
  const recovered = recoverProgress(state);
  const revalidation = validateFTUEProgress(recovered);
  
  if (revalidation.valid) {
    // Use recovered state
    saveProgress(recovered);
  }
}
```

### Strategy 2: Checkpoint Preservation

Preserve valid checkpoints during recovery:

```typescript
const validCheckpoints = state.checkpoints.filter(checkpoint => {
  try {
    FTUECheckpointSchema.parse(checkpoint);
    return true;
  } catch {
    return false;
  }
});
```

### Strategy 3: Progressive Degradation

Fall back through recovery levels:

```typescript
// Level 1: Fix checksum
if (checksumMismatch) {
  return { ...state, checksum: calculateChecksum(state) };
}

// Level 2: Fix timestamps
if (timestampInconsistent) {
  return { ...state, lastUpdated: Date.now() };
}

// Level 3: Reset to default
return createDefaultProgress();
```

### Strategy 4: User Notification

Notify user of data loss:

```typescript
if (!result.recoverable) {
  showNotification({
    type: 'error',
    message: 'FTUE progress corrupted. Starting fresh.',
  });
  
  return createDefaultProgress();
}
```

## Chaos Testing

### Test Scenarios

1. **Corrupted JSON**: Invalid JSON string
2. **Missing Fields**: Incomplete state object
3. **Invalid Step**: Step not in enum
4. **Timestamp Inconsistency**: `lastUpdated < startedAt`
5. **Invalid Checksum**: Checksum mismatch
6. **Null State**: Null or undefined
7. **Wrong Type**: Array instead of object

### Running Chaos Tests

```bash
npm run ftue:validate -- --action chaos --iterations 100 --verbose
```

**Expected Results:**
- Detection Rate: 100%
- Recovery Success Rate: ≥80%
- Failed Recovery: ≤20%

### Chaos Test Output

```
=== Chaos Test Results ===

Total Tests: 700
Corruptions Detected: 700 (100.0%)
Successfully Recovered: 600 (85.7%)
Failed Recovery: 100 (14.3%)

Recovery Success Rate: 85.7%
✓ Excellent recovery rate
```

## Integration with Storage Testing Framework

### Adapter Pattern

```typescript
import { StorageTestFramework } from '@/shared/testing/StorageTestFramework';

const adapter = {
  save: async (key: string, data: FTUEProgressState) => {
    localStorage.setItem(key, JSON.stringify(data));
  },
  load: async (key: string) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  clear: async (key: string) => {
    localStorage.removeItem(key);
  },
};

const tester = new StorageTestFramework('FTUE Progress', adapter);
const results = await tester.runFullTest(createDefaultProgress());
```

### Test Scenarios

1. **Basic Save & Load**: Verify round-trip
2. **Data Integrity**: Checksum verification
3. **Corruption Recovery**: Automatic recovery
4. **Quota Exceeded**: Handle storage limits
5. **Concurrent Operations**: Race condition handling

## Telemetry

**Event**: `pc_ftue_progress_validated`

**Payload**:
```typescript
{
  timestamp: number;
  valid: boolean;
  corrupted: boolean;
  recoverable: boolean;
  errorCount: number;
  warningCount: number;
  currentStep?: string;
  checkpointCount?: number;
}
```

## Best Practices

### Save Frequency

1. **After Each Step**: Save immediately after step completion
2. **Debounce**: Prevent excessive saves (max 1/second)
3. **Atomic Writes**: Use PersistenceService for atomic operations

### Validation Timing

1. **On Load**: Always validate after loading
2. **Before Save**: Validate before saving (optional)
3. **Periodic**: Validate every 5 minutes during FTUE

### Error Handling

1. **Log Errors**: Always log validation errors
2. **Telemetry**: Emit telemetry for corruption detection
3. **User Notification**: Notify user of data loss
4. **Fallback**: Always have a fallback to default state

### Testing

1. **Unit Tests**: Test all validation rules
2. **Chaos Tests**: Run chaos tests regularly
3. **Integration Tests**: Test with Storage Framework
4. **Performance**: Benchmark validation performance

## Performance

- **Validation Time**: <1ms for typical state
- **Recovery Time**: <5ms for corrupted state
- **Checksum Calculation**: <0.1ms
- **Throughput**: >1000 validations/sec

## Security Considerations

1. **No PII**: Progress state contains no personal information
2. **Checksum**: Detects tampering attempts
3. **Version Control**: Schema version for migration
4. **Audit Trail**: Telemetry for corruption tracking

## Troubleshooting

### Validation Always Fails

**Check 1**: Verify schema version
```typescript
if (state.version !== '1.0.0') {
  // Migrate schema
}
```

**Check 2**: Verify checksum
```typescript
const expected = calculateChecksum(state);
if (state.checksum !== expected) {
  // Recalculate checksum
}
```

### Recovery Fails

**Check 1**: Verify data structure
```typescript
if (typeof state !== 'object') {
  return createDefaultProgress();
}
```

**Check 2**: Check for null/undefined
```typescript
if (!state) {
  return createDefaultProgress();
}
```

### Quota Exceeded

**Solution 1**: Compress checkpoints
```typescript
const compressed = {
  ...state,
  checkpoints: state.checkpoints.slice(-10), // Keep last 10
};
```

**Solution 2**: Use IndexedDB
```typescript
// Fallback to IndexedDB for larger data
```

## CLI Reference

### Actions

**validate**: Validate progress file
- Required: `--input`
- Optional: `--verbose`

**recover**: Recover corrupted progress
- Required: `--input`, `--output`
- Optional: `--verbose`

**chaos**: Run chaos tests
- Optional: `--iterations` (default: 10), `--verbose`

**benchmark**: Benchmark validation
- Optional: `--iterations` (default: 1000), `--verbose`

### Options

- `--action, -a`: Action to perform
- `--input, -i`: Input file path
- `--output, -o`: Output file path
- `--verbose, -v`: Verbose logging
- `--iterations, -n`: Number of iterations
- `--help, -h`: Show help message

## Dependencies

- **GT-3**: FTUE Plan
- **Storage Testing Framework**: Generic storage testing
- **Zod**: Schema validation
- **PersistenceService**: Async storage operations
