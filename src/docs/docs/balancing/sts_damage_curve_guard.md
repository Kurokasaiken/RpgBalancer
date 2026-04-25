# STS Damage Curve Regression Guard

## Overview

The STS Damage Curve Regression Guard is a comprehensive testing suite for ensuring damage curve linearity and target-turn compliance across STS archetypes. It provides automated regression testing by comparing current simulation results against baseline snapshots.

## Features

- **Regression Testing**: Automated comparison of current vs baseline damage curves
- **Snapshot Management**: JSON snapshot generation and versioning via git
- **Delta Analysis**: Detailed analysis of win rates, turn counts, and damage curves
- **CI Integration**: JSON output suitable for CI/CD pipelines
- **Configurable Thresholds**: Customizable delta limits and archetype selection
- **Telemetry Integration**: Automatic alert generation for regression failures

## Architecture

### Core Components

1. **DamageCurveGuard** (`src/balancing/sts/damageCurveGuard.ts`)
   - Main regression testing engine
   - Snapshot management and comparison
   - Delta analysis and verdict calculation

2. **DamageCurveSnapshot CLI** (`scripts/sts/damageCurveSnapshot.ts`)
   - Command-line tool for snapshot generation
   - Integration with scenarioRunner.ts
   - Batch processing of multiple archetypes

3. **Test Suite** (`tests/unit/sts/DamageCurveGuard.test.ts`)
   - Comprehensive unit tests
   - Mock implementations for testing
   - Performance testing for large datasets

## Configuration

### Default Thresholds

```typescript
export const DEFAULT_DAMAGE_CURVE_GUARD_CONFIG: DamageCurveGuardConfig = {
  maxAllowedDeltaPercent: 2.0,      // Max delta per archetype
  maxOverallDeltaPercent: 5.0,      // Max overall delta
  requiredArchetypes: [
    'basic-1v1',
    'boss-fight', 
    'group-combat',
    'swarm-horde'
  ],
  excludedArchetypes: [],
  snapshotPath: 'test-results/sts-damage-curves-snapshot.json',
  enableTelemetry: true,
};
```

### Regression Verdict

```typescript
interface DamageCurveVerdict {
  passed: boolean;
  overallDeltaPercent: number;
  maxDeltaPercent: number;
  failingArchetypes: string[];
  summary: string;
}
```

## Usage

### CLI Commands

#### Generate Snapshot

```bash
# Generate snapshot for all required archetypes
tsx scripts/sts/damageCurveSnapshot.ts

# Custom iterations and archetypes
tsx scripts/sts/damageCurveSnapshot.ts -i 50000 -a basic-1v1,boss-fight

# Custom output directory
tsx scripts/sts/damageCurveSnapshot.ts -o ./snapshots

# Force overwrite existing snapshot
tsx scripts/sts/damageCurveSnapshot.ts --force
```

#### List Available Archetypes

```bash
tsx scripts/sts/damageCurveSnapshot.ts --list
```

#### Show Snapshot Information

```bash
tsx scripts/sts/damageCurveSnapshot.ts --info
```

### Programmatic API

```typescript
import { DamageCurveGuard } from '../src/balancing/sts/damageCurveGuard';

// Initialize guard
const guard = new DamageCurveGuard({
  maxAllowedDeltaPercent: 1.5,
  requiredArchetypes: ['basic-1v1', 'boss-fight'],
});

// Run regression test
const currentResults = await runScenarioRunner(...);
const verdict = await guard.runRegressionTest(currentResults);

if (!verdict.passed) {
  console.error('Regression detected:', verdict.summary);
  console.error('Failing archetypes:', verdict.failingArchetypes);
}

// Generate report
const report = await guard.generateReport(currentResults);
console.log(report);
```

## Snapshot Format

### JSON Structure

```json
{
  "version": "1.0.0",
  "timestamp": "2026-01-16T12:00:00.000Z",
  "scenarioResults": {
    "basic-1v1": {
      "winRate": 0.523,
      "averageTurns": 19.8,
      "targetTurnsCompliance": 0.847,
      "damageCurve": [12.3, 15.7, 14.2, 18.9, 16.1],
      "iterations": 10000,
      "archetypeId": "basic-1v1",
      "scenarioName": "Basic 1v1 Combat"
    },
    "boss-fight": {
      "winRate": 0.312,
      "averageTurns": 28.4,
      "targetTurnsCompliance": 0.623,
      "damageCurve": [22.1, 26.8, 24.5, 29.2, 25.7],
      "iterations": 10000,
      "archetypeId": "boss-fight",
      "scenarioName": "Boss Fight"
    }
  },
  "metadata": {
    "gitCommit": "abc123def456",
    "nodeVersion": "v20.19.6",
    "totalIterations": 20000,
    "generatedBy": "sts-damage-curve-guard",
    "cliOptions": {
      "iterations": "10000",
      "archetypes": "basic-1v1,boss-fight"
    },
    "generationTime": 2347
  }
}
```

## Regression Analysis

### Metrics Compared

1. **Win Rate Delta**: Percentage change in win probability
2. **Average Turns Delta**: Percentage change in average combat duration
3. **Target Turns Compliance**: Change in target-turns adherence
4. **Damage Curve Delta**: Maximum percentage difference in damage curves

### Delta Thresholds

- **Per-Archetype**: 2.0% maximum delta (configurable)
- **Overall**: 5.0% maximum average delta (configurable)
- **Win Rate**: 5.0% absolute delta threshold
- **Turn Compliance**: 5.0% absolute delta threshold

### Failure Conditions

A regression is detected when:
- Any archetype exceeds per-archetype delta threshold
- Overall average delta exceeds threshold
- Required archetype results are missing
- Damage curves show significant divergence

## CI/CD Integration

### GitHub Actions Example

```yaml
name: STS Damage Curve Regression Test

on: [push, pull_request]

jobs:
  regression-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20.19.6'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Generate current results
      run: tsx scripts/sts/damageCurveSnapshot.ts --force
      
    - name: Run regression test
      run: npm run test:sts-damage-guard
      
    - name: Upload regression report
      if: failure()
      uses: actions/upload-artifact@v3
      with:
        name: regression-report
        path: test-results/sts-damage-regression-report.md
```

### Package.json Scripts

```json
{
  "scripts": {
    "test:sts-damage-guard": "tsx -e \"import('./src/balancing/sts/damageCurveGuard').then(m => new m.DamageCurveGuard().runRegressionTest(require('./test-results/current-results.json')).then(v => console.log(v.summary)).catch(e => { console.error(e); process.exit(1); }))\"",
    "snapshot:sts-damage-curves": "tsx scripts/sts/damageCurveSnapshot.ts",
    "regression:sts-report": "tsx -e \"import('./src/balancing/sts/damageCurveGuard').then(m => new m.DamageCurveGuard().generateReport(require('./test-results/current-results.json')).then(r => console.log(r)))\""
  }
}
```

## Telemetry Integration

### Alert Events

```typescript
// Emitted when regression is detected
{
  eventType: 'sts_damage_guard_failed',
  data: {
    maxDeltaPercent: 3.2,
    overallDeltaPercent: 2.8,
    failingArchetypes: ['boss-fight', 'group-combat'],
    snapshotVersion: '1.0.0',
    gitCommit: 'abc123def456',
    timestamp: 1641894400000,
    metadata: {
      totalIterations: 40000,
      generationTime: 4521,
    }
  }
}
```

### Monitoring KPIs

- **Regression Detection Rate**: Percentage of runs that detect regressions
- **False Positive Rate**: Percentage of regressions that are false alarms
- **Snapshot Freshness**: Age of baseline snapshot in days
- **Analysis Performance**: Time to complete regression analysis

## Performance Characteristics

- **Single Archetype**: < 10ms analysis time
- **Full Regression Test**: < 100ms for 4 archetypes
- **Snapshot Generation**: < 5 seconds for 10,000 iterations per archetype
- **Memory Usage**: < 50MB for typical analysis
- **Large Dataset Support**: Handles 50+ archetypes efficiently

## Troubleshooting

### Common Issues

1. **Missing Baseline Snapshot**
   ```
   Error: No baseline snapshot found. Run damageCurveSnapshot.ts first.
   ```
   **Solution**: Generate baseline snapshot with CLI tool

2. **High Delta Values**
   ```
   Max delta: 15.3% (threshold: 2.0%)
   ```
   **Solution**: Review recent changes to balancing logic or increase thresholds

3. **Missing Archetype Results**
   ```
   Missing current result for boss-fight
   ```
   **Solution**: Ensure scenarioRunner.ts produces results for all required archetypes

### Debug Mode

Enable verbose output:
```bash
tsx scripts/sts/damageCurveSnapshot.ts --verbose
```

### Snapshot Management

- **Version Control**: Snapshots are versioned via git commits
- **Size Limits**: Automatic warning if snapshot exceeds 5MB
- **Refresh Strategy**: Update snapshots when intentional balance changes occur

## Best Practices

### When to Update Snapshots

1. **Intentional Balance Changes**: When modifying card stats, enemy stats, or game mechanics
2. **New Archetypes**: When adding new scenario types
3. **Algorithm Changes**: When modifying simulation logic
4. **Major Releases**: When preparing for version releases

### Regression Prevention

1. **Small Changes**: Make incremental changes to reduce regression impact
2. **Test Locally**: Run regression tests before committing
3. **Document Changes**: Update snapshot metadata with change descriptions
4. **Monitor Trends**: Track delta patterns over time

### Threshold Tuning

1. **Start Conservative**: Begin with strict thresholds (1-2%)
2. **Adjust Based on Noise**: Increase if false positives are high
3. **Per-Archetype Tuning**: Use different thresholds for different scenario types
4. **Regular Review**: Re-evaluate thresholds quarterly

## Future Enhancements

Planned features:

1. **Advanced Analytics**: Statistical significance testing
2. **Trend Analysis**: Historical delta tracking and prediction
3. **Auto-Threshold**: Adaptive threshold based on historical variance
4. **Web Interface**: Browser-based regression dashboard
5. **Integration Hooks**: Direct integration with CI/CD platforms
6. **Performance Profiling**: Detailed performance analysis tools

---

*Last updated: 2026-01-16*
*Version: 1.0.0*
