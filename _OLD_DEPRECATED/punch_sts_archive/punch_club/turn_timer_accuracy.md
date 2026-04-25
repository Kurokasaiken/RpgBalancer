# Turn Timer Accuracy Validator - NP-189

**Date:** 2026-01-24  
**Agent:** Sentinel-PC  
**Status:** ✅ COMPLETED  

## Executive Summary

Config-first validator for Punch Club combat turn timer accuracy with drift detection, precision measurement, consistency analysis, CLI tooling, and Playwright e2e tests. Ensures timer accuracy within tolerance and detects drift >10%.

## Overview

The Turn Timer Accuracy Validator provides:
- **Config-Driven Validation** - Zod schema for target duration, tolerance, drift threshold
- **CLI Validator** - Measures timer accuracy with statistical analysis
- **Playwright E2E Tests** - 7 comprehensive test scenarios
- **Drift Detection** - Identifies timing drift and accumulation
- **Precision Measurement** - Standard deviation and consistency metrics
- **Telemetry Integration** - `pc_turn_timer_validated` event tracking
- **Automated Reporting** - JSON and Markdown reports

## Configuration

### Default Config

```typescript
{
  targetDuration: 1000,      // 1 second per turn
  tolerance: 50,             // ±50ms acceptable
  driftThreshold: 10,        // 10% max drift
  sampleSize: 100,           // 100 turns measured
  warmupTurns: 5,            // 5 warmup turns
}
```

### Validation Schema

```typescript
const TimerValidationConfigSchema = z.object({
  targetDuration: z.number().min(100).max(10000),
  tolerance: z.number().min(0).max(1000),
  driftThreshold: z.number().min(0).max(100),
  sampleSize: z.number().min(10).max(1000),
  warmupTurns: z.number().min(0).max(10),
});
```

## Usage

### CLI Validator

```bash
# Basic usage
npm run timer:validate

# Custom target duration
npm run timer:validate -- --target-duration 2000 --tolerance 100

# Custom sample size
npm run timer:validate -- --sample-size 200

# Verbose mode
npm run timer:validate -- --verbose

# Custom config file
npm run timer:validate -- --config timer-config.json

# Output formats
npm run timer:validate -- --format json
npm run timer:validate -- --format markdown
npm run timer:validate -- --format both
```

### Playwright E2E Tests

```bash
# Run all timer accuracy tests
npm run test:e2e -- tests/e2e/punchClub/TurnTimerAccuracy.spec.ts

# Run specific test
npm run test:e2e -- tests/e2e/punchClub/TurnTimerAccuracy.spec.ts -g "validates timer accuracy"

# Run with headed browser
npm run test:e2e -- tests/e2e/punchClub/TurnTimerAccuracy.spec.ts --headed
```

## Validation Metrics

### 1. Average Duration
- **Metric**: Mean of all turn durations
- **Target**: Within ±tolerance of targetDuration
- **Formula**: `avgDuration = Σ(durations) / n`

### 2. Average Drift
- **Metric**: Mean absolute difference from target
- **Target**: < tolerance
- **Formula**: `avgDrift = Σ|actualDuration - targetDuration| / n`

### 3. Drift Percentage
- **Metric**: Drift as percentage of target
- **Target**: < driftThreshold (10%)
- **Formula**: `driftPercentage = (avgDrift / targetDuration) × 100`

### 4. Standard Deviation
- **Metric**: Measure of timing consistency
- **Target**: Low variance
- **Formula**: `σ = √(Σ(duration - avgDuration)² / n)`

### 5. Within Tolerance Rate
- **Metric**: Percentage of turns within tolerance
- **Target**: ≥90%
- **Formula**: `rate = (withinTolerance / total) × 100`

### 6. Drift Accumulation
- **Metric**: Drift increase over time
- **Target**: < 5% increase
- **Formula**: `accumulation = |secondHalfAvg - firstHalfAvg|`

## Pass/Fail Criteria

### Pass Conditions
1. ✅ Average drift ≤ driftThreshold (10%)
2. ✅ ≥90% of turns within tolerance
3. ✅ No significant drift accumulation (<5%)
4. ✅ Standard deviation < 100ms

### Fail Conditions
1. ❌ Average drift > driftThreshold
2. ❌ <90% of turns within tolerance
3. ❌ Drift accumulation >5%
4. ❌ High variance (σ > 100ms)

## CLI Validator Features

### 1. Timer Measurement
- Uses Performance API for high-precision timing
- Warmup turns to stabilize measurements
- Configurable sample size
- Verbose logging option

### 2. Statistical Analysis
- Average duration
- Average drift (absolute and percentage)
- Max/min drift
- Standard deviation
- Within tolerance count and percentage

### 3. Report Generation
- **JSON Report**: Complete measurement data
- **Markdown Report**: Human-readable summary
- **Console Summary**: Quick overview

### 4. Telemetry Tracking
- Event: `pc_turn_timer_validated`
- Tracks: passed, avgDuration, avgDrift, withinTolerancePercentage
- Optional: Enable with `ENABLE_TELEMETRY=true`

## Playwright E2E Tests

### Test Scenarios (7 tests)

1. **Basic Accuracy Validation**
   - Measures 20 turns
   - Validates avgDrift < tolerance
   - Checks ≥90% within tolerance

2. **Excessive Drift Detection**
   - Measures 10 turns
   - Validates avgDriftPercentage < 10%

3. **Multi-Round Precision**
   - 3 rounds × 5 turns
   - Validates consistency across rounds
   - Standard deviation < 100ms

4. **Drift Accumulation**
   - Measures 50 turns
   - Compares first half vs second half
   - Validates drift increase < 5%

5. **Timer Under Load**
   - Simulates heavy computation
   - Validates timer remains accurate
   - Allows slightly higher drift (15%)

6. **Telemetry Tracking**
   - Verifies telemetry events
   - Validates event data structure

7. **Variable Target Durations**
   - Tests 500ms, 1000ms, 2000ms
   - Validates accuracy across different durations

## Report Formats

### JSON Report

```json
{
  "timestamp": 1706097600000,
  "config": {
    "targetDuration": 1000,
    "tolerance": 50,
    "driftThreshold": 10,
    "sampleSize": 100,
    "warmupTurns": 5
  },
  "measurements": [
    {
      "turnNumber": 1,
      "expectedDuration": 1000,
      "actualDuration": 1003.45,
      "drift": 3.45,
      "driftPercentage": 0.345,
      "timestamp": 1706097600100
    }
  ],
  "summary": {
    "totalTurns": 100,
    "avgDuration": 1002.34,
    "avgDrift": 4.56,
    "avgDriftPercentage": 0.456,
    "maxDrift": 12.34,
    "minDrift": 0.12,
    "stdDeviation": 5.67,
    "withinTolerance": 98,
    "withinTolerancePercentage": 98.0,
    "exceedsDriftThreshold": false
  },
  "passed": true
}
```

### Markdown Report

```markdown
# Turn Timer Accuracy Validation Report

**Generated:** 2026-01-24T10:00:00.000Z
**Status:** ✅ PASSED

## Configuration
| Parameter | Value |
|-----------|-------|
| Target Duration | 1000ms |
| Tolerance | ±50ms |
| Drift Threshold | 10% |
| Sample Size | 100 turns |

## Summary
| Metric | Value |
|--------|-------|
| Avg Duration | 1002.34ms |
| Avg Drift | 4.56ms (0.46%) |
| Within Tolerance | 98 (98.0%) |
| Exceeds Drift Threshold | ✅ No |

## Pass/Fail Criteria
- ✅ Average drift ≤ 10%
- ✅ ≥90% of turns within tolerance
```

## Telemetry Event

```typescript
{
  event: 'pc_turn_timer_validated',
  timestamp: Date.now(),
  data: {
    passed: true,
    avgDuration: 1002.34,
    avgDrift: 4.56,
    avgDriftPercentage: 0.456,
    withinTolerancePercentage: 98.0,
    exceedsDriftThreshold: false,
    sampleSize: 100,
  }
}
```

## Combat Pacing KPI Integration

### Pacing Metrics
- **Turn Duration**: Affects combat flow and player engagement
- **Consistency**: Predictable timing improves UX
- **Drift**: Excessive drift degrades experience

### KPI Thresholds
- **Excellent**: <2% avg drift, >95% within tolerance
- **Good**: <5% avg drift, >90% within tolerance
- **Acceptable**: <10% avg drift, >85% within tolerance
- **Poor**: >10% avg drift or <85% within tolerance

### Impact on Combat
- **Low Drift**: Smooth, predictable combat flow
- **High Drift**: Unpredictable timing, poor UX
- **Accumulation**: Progressive degradation over time

## Troubleshooting

### Issue: High Drift Detected

**Symptoms:**
- Average drift >10%
- Inconsistent turn durations

**Solutions:**
1. Check system load and background processes
2. Verify timer implementation uses Performance API
3. Increase tolerance if acceptable
4. Investigate timer logic for accuracy issues

### Issue: Low Tolerance Rate

**Symptoms:**
- <90% of turns within tolerance
- High variance in measurements

**Solutions:**
1. Increase tolerance threshold
2. Optimize timer precision
3. Check for interference from animations/rendering
4. Verify timer not affected by frame rate

### Issue: Drift Accumulation

**Symptoms:**
- Drift increases over time
- Second half significantly different from first half

**Solutions:**
1. Check for memory leaks
2. Verify timer doesn't accumulate rounding errors
3. Investigate long-running combat sessions
4. Reset timer periodically if needed

## Best Practices

### 1. Regular Validation
- Run validator after timer changes
- Include in CI/CD pipeline
- Monitor production metrics

### 2. Appropriate Tolerance
- Balance accuracy vs flexibility
- Consider target platform (mobile vs desktop)
- Adjust for network latency if applicable

### 3. Sample Size
- Larger samples = more reliable statistics
- Minimum 50 turns recommended
- 100+ turns for production validation

### 4. Warmup Turns
- Skip first few turns to stabilize
- Accounts for initialization overhead
- 5 warmup turns recommended

### 5. Load Testing
- Test under realistic conditions
- Simulate heavy UI/animations
- Verify accuracy doesn't degrade

## Prohibited Operations (Enforced)

✅ **No Timer Logic Modification**: Validator only measures, doesn't modify  
✅ **No Intensive Polling**: Uses efficient Performance API  
✅ **No Drift Ignorance**: Fails validation if drift >10%  

## Future Enhancements

- [ ] Real-time monitoring dashboard
- [ ] Historical trend tracking
- [ ] Automated alerts for drift detection
- [ ] Integration with performance monitoring
- [ ] Mobile device testing
- [ ] Network latency compensation
- [ ] Adaptive tolerance based on platform

## Resources

### Internal Documentation
- `scripts/punchClub/turnTimerValidator.ts` - CLI validator
- `tests/e2e/punchClub/TurnTimerAccuracy.spec.ts` - E2E tests

### Related Documentation
- PC-M2 Combat System
- Performance API Documentation
- Combat Pacing KPIs

## Conclusion

The Turn Timer Accuracy Validator provides comprehensive validation of combat turn timer accuracy with config-driven design, CLI tooling, Playwright e2e tests, and telemetry integration. Ensures timer accuracy within tolerance and detects drift >10% to maintain high-quality combat pacing.

---

**Last Updated:** 2026-01-24  
**Next Review:** 2026-04-24  
**Maintainer:** Sentinel-PC (Cascade AI)
