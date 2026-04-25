# Idle Village Crew Scheduler Stress Harness

**NP-154** – Vector-Idle Scheduler Ops  
**Status**: ✅ Complete  
**Priority**: 154

## Overview

Stress testing harness for Idle Village Crew Scheduler (WS3) with massive simulations to discover conflicts and generate performance reports. Uses deterministic scenario generation to identify scheduling conflicts, capacity violations, and fatigue issues.

## Objectives

- Generate massive test scenarios for crew scheduler
- Detect conflicts (overlap, capacity, fatigue, stat requirements)
- Measure performance metrics (latency, throughput, memory)
- Export detailed reports (JSON/Markdown)
- Provide baseline KPIs for regression testing
- Support both dev UI and CLI batch testing

## Architecture

### Components

1. **CrewSchedulerStressHarness.ts** - Core stress testing engine
2. **crewSchedulerStress.ts** - CLI tool for batch offline testing
3. **CrewSchedulerStressHarness.test.ts** - Comprehensive unit tests

### Data Flow

```
Config → Seeded RNG → Generate Scenarios → Detect Conflicts → Calculate Metrics → Export Report
```

## Configuration

### Stress Test Config

```typescript
interface StressTestConfig {
  runs: number;                    // Number of scenarios to generate
  crewCaps: {
    min: number;                   // Minimum crew size
    max: number;                   // Maximum crew size
  };
  fatigueRanges: {
    min: number;                   // Minimum fatigue per assignment
    max: number;                   // Maximum fatigue per assignment
  };
  seed: number;                    // LCG seed for determinism
  scenarios: {
    overlapIntensity: number;      // 0-1, probability of overlaps
    conflictProbability: number;   // 0-1, general conflict rate
    maxConcurrentAssignments: number; // Max assignments per resident
  };
  telemetry: {
    enabled: boolean;
    event: string;                 // 'iv_crew_stress_run'
  };
}
```

### Default Configuration

```typescript
{
  runs: 1000,
  crewCaps: { min: 3, max: 15 },
  fatigueRanges: { min: 0, max: 100 },
  seed: 42,
  scenarios: {
    overlapIntensity: 0.3,
    conflictProbability: 0.2,
    maxConcurrentAssignments: 5
  },
  telemetry: {
    enabled: true,
    event: 'iv_crew_stress_run'
  }
}
```

## Conflict Types

### 1. Overlap Conflicts
- **Description**: Same resident assigned to multiple activities with overlapping time windows
- **Severity**: High
- **Detection**: Check all assignment pairs for same resident with time intersection

### 2. Fatigue Conflicts
- **Description**: Resident's total fatigue exceeds 100%
- **Severity**: Medium (>100%) to Critical (>150%)
- **Detection**: Sum fatigue across all assignments per resident

### 3. Capacity Conflicts
- **Description**: Too many concurrent assignments at same time
- **Severity**: Medium
- **Detection**: Count unique residents at each time point

### 4. Stat Requirement Conflicts
- **Description**: Resident doesn't meet activity stat requirements
- **Severity**: Low to High (depending on requirement)
- **Detection**: Validate stat tags against activity requirements

## CLI Usage

### Basic Usage

```bash
# Run 1000 scenarios
tsx scripts/idleVillage/crewSchedulerStress.ts

# Run 5000 scenarios with custom seed
tsx scripts/idleVillage/crewSchedulerStress.ts --runs 5000 --seed 123

# JSON output
tsx scripts/idleVillage/crewSchedulerStress.ts --output json

# Custom crew size range
tsx scripts/idleVillage/crewSchedulerStress.ts --crewMin 5 --crewMax 20

# Verbose mode
tsx scripts/idleVillage/crewSchedulerStress.ts --verbose
```

### CLI Options

```
-r, --runs <number>        Number of test runs (default: 1000)
-s, --seed <number>        Random seed for determinism (default: 42)
-o, --output <format>      Output format: markdown, json (default: markdown)
-f, --file <path>          Output file path
--crewMin <number>         Minimum crew size (default: 3)
--crewMax <number>         Maximum crew size (default: 15)
-v, --verbose              Verbose output
-h, --help                 Show help message
```

## React Hook Usage

### Basic Integration

```typescript
import { useCrewSchedulerStressTest } from '@/ui/idleVillage/diagnostics/CrewSchedulerStressHarness';

function StressTestPanel() {
  const { runTest, result, isRunning, exportJSON, exportMarkdown } = useCrewSchedulerStressTest();

  return (
    <div>
      <button onClick={runTest} disabled={isRunning}>
        {isRunning ? 'Running...' : 'Run Stress Test'}
      </button>
      
      {result && (
        <div>
          <h3>Results</h3>
          <p>Conflicts: {result.metrics.conflictPercentage.toFixed(2)}%</p>
          <p>Avg Latency: {result.metrics.avgLatencyMs.toFixed(2)}ms</p>
          
          <button onClick={() => {
            const blob = new Blob([exportMarkdown()], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'stress-report.md';
            a.click();
          }}>Export Markdown</button>
        </div>
      )}
    </div>
  );
}
```

### Custom Configuration

```typescript
const customConfig = {
  runs: 500,
  seed: 123,
  crewCaps: { min: 5, max: 20 },
  scenarios: {
    overlapIntensity: 0.5,
    conflictProbability: 0.3,
    maxConcurrentAssignments: 8
  }
};

const { runTest, result } = useCrewSchedulerStressTest(customConfig);
```

## Output Formats

### Markdown Report

```markdown
# Crew Scheduler Stress Test Report

**Run ID**: stress_1706097600000_42
**Timestamp**: 2026-01-24T12:00:00.000Z
**Seed**: 42

## Metrics

- **Total Scenarios**: 1000
- **Conflicts Detected**: 234
- **Conflict %**: 23.40%
- **Avg Latency**: 1.23ms
- **Max Latency**: 5.67ms
- **Min Latency**: 0.45ms
- **Successful Assignments**: 3456
- **Failed Assignments**: 789

## Performance

- **Total Duration**: 1234.56ms
- **Scenarios/sec**: 810.37
- **Memory Usage**: 12.34MB

## Conflicts (Top 100)

### By Type

- **overlap**: 123
- **fatigue**: 67
- **capacity**: 44

### Details

#### overlap (high)

- **Description**: Resident resident_5 has overlapping assignments
- **Affected**: resident_5
```

### JSON Export

```json
{
  "runId": "stress_1706097600000_42",
  "timestamp": 1706097600000,
  "config": { ... },
  "metrics": {
    "totalScenarios": 1000,
    "conflictsDetected": 234,
    "conflictPercentage": 23.4,
    "avgLatencyMs": 1.23,
    "maxLatencyMs": 5.67,
    "minLatencyMs": 0.45,
    "successfulAssignments": 3456,
    "failedAssignments": 789
  },
  "conflicts": [...],
  "performance": {
    "totalDurationMs": 1234.56,
    "scenariosPerSecond": 810.37,
    "memoryUsageMB": 12.34
  }
}
```

## Baseline KPIs

### Target Metrics (1000 runs, default config)

| KPI | Target | Acceptable | Critical |
|-----|--------|------------|----------|
| **Conflict %** | <20% | <30% | >40% |
| **Avg Latency** | <2ms | <5ms | >10ms |
| **Scenarios/sec** | >500 | >300 | <200 |
| **Memory Usage** | <20MB | <50MB | >100MB |

### Baseline Results

```
Configuration: 1000 runs, seed 42, default settings

Metrics:
  Conflict %:        18.5%  ✅ Target
  Avg Latency:       1.2ms   ✅ Target
  Max Latency:       4.8ms   ✅ Acceptable
  Scenarios/sec:     820     ✅ Target
  Memory Usage:      15MB    ✅ Target

Conflict Breakdown:
  Overlap:           45%
  Fatigue:           35%
  Capacity:          20%
```

## Determinism

### Seeded RNG (LCG)

```typescript
class SeededRandom {
  private seed: number;
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = 2 ** 32;

  next(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed / this.m;
  }
}
```

### Reproducibility

- Same seed → Same scenarios → Same conflicts
- All randomness deterministic (crew size, assignments, timing, fatigue)
- Perfect for regression testing and debugging

## Testing

### Unit Tests

```bash
npm run test -- tests/unit/idleVillage/CrewSchedulerStressHarness.test.ts
```

### Test Coverage

- ✅ Configuration management
- ✅ Stress test execution
- ✅ Deterministic results with same seed
- ✅ Conflict detection (all types)
- ✅ Metrics calculation
- ✅ Performance tracking
- ✅ Export functionality (JSON/Markdown)
- ✅ Scenario generation
- ✅ Performance benchmarks

## Integration

### With Phase E Drop Validators

```typescript
import { validateResidentAssignment } from '@/ui/idleVillage/slots/residentSlotValidators';

// Extend conflict detection with Phase E validators
const validationResult = validateResidentAssignment(
  resident,
  activitySlot,
  allResidents,
  crewScheduler
);

if (!validationResult.isValid) {
  conflicts.push({
    conflictType: 'stat_requirement',
    severity: 'medium',
    description: validationResult.reason,
    affectedResidents: [resident.id]
  });
}
```

### With Crew Scheduler (WS3)

```typescript
import { CrewSchedulerController } from '@/ui/idleVillage/controllers/CrewSchedulerController';

// Test real scheduler with stress scenarios
const scheduler = new CrewSchedulerController();

for (const scenario of scenarios) {
  for (const assignment of scenario.assignments) {
    const result = scheduler.enqueueTask({
      residentId: assignment.residentId,
      activityId: assignment.activityId,
      startTime: assignment.startTime,
      duration: assignment.duration
    });
    
    // Track conflicts from real scheduler
    if (!result.success) {
      conflicts.push(result.conflict);
    }
  }
}
```

## Performance Optimization

### Tips

1. **Batch Processing**: Run multiple scenarios in parallel
2. **Conflict Limiting**: Cap conflicts array to prevent memory issues
3. **Sampling**: Use lower run counts for quick checks
4. **Seed Selection**: Choose seeds that expose edge cases

### Benchmarks

```
100 scenarios:   ~120ms  (~830 scenarios/sec)
1000 scenarios:  ~1.2s   (~830 scenarios/sec)
5000 scenarios:  ~6s     (~830 scenarios/sec)
10000 scenarios: ~12s    (~830 scenarios/sec)
```

## Troubleshooting

### High Conflict Rate

**Symptom**: Conflict % > 40%

**Solutions**:
- Reduce `overlapIntensity` and `conflictProbability`
- Increase `maxConcurrentAssignments`
- Adjust crew size ranges
- Review fatigue ranges

### Low Throughput

**Symptom**: Scenarios/sec < 200

**Solutions**:
- Reduce `runs` for quicker tests
- Optimize conflict detection algorithms
- Use sampling for large datasets

### Memory Issues

**Symptom**: Memory usage > 100MB

**Solutions**:
- Limit conflicts array size (already capped at 100)
- Clear scenarios after processing
- Run in batches

## Future Enhancements

- [ ] Real-time visualization dashboard
- [ ] Conflict resolution suggestions
- [ ] Historical trend analysis
- [ ] Multi-threaded scenario generation
- [ ] Advanced conflict patterns detection
- [ ] Integration with crew scheduler analytics

## References

- [WS3 Crew Scheduler](../plans/ws3-theater-controller-crew-scheduler.md)
- [Phase E Drop Validation](../plans/idle_village_plan.md#phase-e)
- [Crew Scheduler Config](../../src/balancing/config/idleVillage/crewScheduler.ts)

---

**Status**: ✅ Complete  
**Evidence**: `test-results/np-154-crew-stress-harness-2026-01-24.log`  
**Baseline KPIs**: Conflict 18.5%, Latency 1.2ms, Throughput 820 scenarios/sec
