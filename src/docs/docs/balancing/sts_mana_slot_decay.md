# STS Mana Slot Decay Regression Guard Documentation

## Overview

The STS Mana Slot Decay Regression Guard is a comprehensive system for monitoring mana slot decay curves in the Slay the Spire (STS) simulator. It provides automated regression detection, snapshot generation, and KPI analysis to ensure mana slot behavior remains within defined parameters.

## Features

### Core Features
- **Decay Profile Support**: Linear, exponential, logarithmic, and custom decay profiles
- **Regression Detection**: Automated detection of mana slot decay regressions with configurable thresholds
- **Snapshot Generation**: Deterministic snapshot creation with KPI metadata
- **CLI Tools**: Command-line interface for snapshot generation and validation
- **Telemetry Integration**: Comprehensive event tracking for regression monitoring
- **Performance Optimization**: Caching and memoization for efficient processing

### Advanced Features
- **Config-First Design**: All parameters configurable via Zod-validated schemas
- **Statistical Analysis**: Detailed KPI calculations and deviation analysis
- **Snapshot Comparison**: Diff functionality for comparing snapshots
- **Validation Framework**: Comprehensive data validation at multiple levels
- **Extensible Architecture**: Plugin-ready design for custom decay profiles

## Architecture

### Components

#### `ManaSlotDecayGuard`
Main guard class that orchestrates decay analysis and regression detection.

**Key Methods:**
- `analyzeManaSlotDecay()`: Analyze mana slot decay from tick data
- `checkRegression()`: Check for regressions against reference snapshot
- `generateSnapshot()`: Create deterministic snapshot with metadata
- `validateTickData()`: Validate tick data against configuration

#### `ManaSlotDecayConfig`
Configuration schema for decay parameters and thresholds.

**Key Properties:**
- `profile`: Decay profile type (linear, exponential, logarithmic, custom)
- `baseDecayRate`: Base decay rate per tick
- `decayAcceleration`: Acceleration factor for exponential profiles
- `thresholds`: Regression detection thresholds

#### `ManaSlotSnapshot`
Complete snapshot structure with metadata, tick data, and analysis results.

**Structure:**
```typescript
interface ManaSlotSnapshot {
  metadata: SnapshotMetadata;
  config: ManaSlotDecayConfig;
  ticks: ManaSlotTick[];
  analysis: ManaSlotDecayAnalysis;
  validation: ValidationResult;
}
```

### Configuration

#### Default Configuration
```typescript
const DEFAULT_CONFIG = {
  decay: {
    profile: 'exponential',
    baseDecayRate: 0.02,
    decayAcceleration: 1.0,
    minSlotValue: 0,
    maxSlotValue: 100,
  },
  thresholds: {
    maxDeviationPercent: 5.0,
    criticalDeviationPercent: 10.0,
    warningDeviationPercent: 2.5,
    minSampleSize: 100,
    maxRuntimeMs: 1000,
  },
  snapshot: {
    filenameTemplate: 'sts-mana-slot-decay-{timestamp}.json',
    includeMetadata: true,
    includeStatistics: true,
    includeRawData: false,
    version: '1.0.0',
    defaultSeed: 42,
  },
  telemetry: {
    enabled: true,
    batchSize: 50,
    flushInterval: 1000,
  },
  performance: {
    enableCaching: true,
    maxCacheSize: 100,
    cacheTimeoutMs: 10000,
  },
};
```

#### Decay Profiles

##### Linear Profile
Linear decay over time with constant rate.
```typescript
value(t) = max(0, min(maxValue, 100 * (1 - baseDecayRate * t)))
```

##### Exponential Profile
Exponential decay with acceleration factor.
```typescript
value(t) = max(0, min(maxValue, 100 * exp(-baseDecayRate * t * decayAcceleration)))
```

##### Logarithmic Profile
Logarithmic decay curve.
```typescript
value(t) = max(0, min(maxValue, 100 * (1 - baseDecayRate * log(t + 1))))
```

##### Custom Profile
User-defined parameters for custom decay curves.
```typescript
value(t) = max(0, min(maxValue, customParams.a || maxValue))
```

## Usage

### Basic Usage

```typescript
import { ManaSlotDecayGuard } from '@/balancing/sts/manaSlotDecayGuard';

// Create guard with default configuration
const guard = new ManaSlotDecayGuard();

// Analyze mana slot decay
const analysis = guard.analyzeManaSlotDecay(tickData);

// Check for regressions
const result = guard.checkRegression(currentTicks, referenceSnapshot);

// Generate snapshot
const snapshot = guard.generateSnapshot(ticks, 'Test Snapshot', 'Test Description');
```

### Advanced Configuration

```typescript
import { createManaSlotDecayGuard } from '@/balancing/sts/manaSlotDecayGuard';

const guard = createManaSlotDecayGuard({
  decay: {
    profile: 'exponential',
    baseDecayRate: 0.025,
    decayAcceleration: 1.2,
    minSlotValue: 5,
    maxSlotValue: 150,
  },
  thresholds: {
    maxDeviationPercent: 3.0,
    criticalDeviationPercent: 8.0,
    warningDeviationPercent: 1.5,
    minSampleSize: 50,
    maxRuntimeMs: 500,
  },
});
```

### CLI Usage

#### Generate Snapshot
```bash
# Basic snapshot generation
npx tsx scripts/sts/manaSlotDecaySnapshot.ts generate

# Custom configuration
npx tsx scripts/sts/manaSlotDecaySnapshot.ts generate \
  --output test-results \
  --seed 42 \
  --ticks 100 \
  --slot-count 5 \
  --profile exponential \
  --base-decay-rate 0.02 \
  --decay-acceleration 1.0 \
  --name "Test Snapshot" \
  --description "Generated for regression testing" \
  --verbose
```

#### Validate Snapshot
```bash
npx tsx scripts/sts/manaSlotDecaySnapshot.ts validate \
  test-results/sts-mana-slot-decay-2026-01-19.json \
  --verbose
```

#### Compare Snapshots
```bash
npx tsx scripts/sts/manaSlotDecaySnapshot.ts compare \
  snapshot1.json \
  snapshot2.json \
  --verbose
```

#### List Available Profiles
```bash
npx tsx scripts/sts/manaSlotDecaySnapshot.ts list-profiles
```

## Data Structures

### ManaSlotTick
Individual tick data point in the decay timeline.

```typescript
interface ManaSlotTick {
  tick: number;                    // Tick number
  timestamp: number;               // Timestamp in milliseconds
  slotValues: number[];            // Mana slot values at this tick
  totalMana: number;               // Total mana available
  averageManaPerSlot: number;      // Average mana per slot
  decayRate: number;               // Decay rate at this tick
}
```

### ManaSlotDecayAnalysis
Analysis results from decay processing.

```typescript
interface ManaSlotDecayAnalysis {
  timestamp: number;                // Analysis timestamp
  totalTicks: number;               // Total ticks analyzed
  profile: ManaSlotDecayProfile;    // Decay profile used
  averageDecayRate: number;         // Average decay rate
  maxDeviationPercent: number;      // Maximum deviation from expected
  criticalDeviations: number;       // Critical deviations found
  warningDeviations: number;        // Warning deviations found
  performance: {                    // Performance metrics
    averageRuntimeMs: number;
    maxRuntimeMs: number;
    totalRuntimeMs: number;
  };
  sampleSize: number;               // Sample size
}
```

### ManaSlotRegressionResult
Regression detection result.

```typescript
interface ManaSlotRegressionResult {
  hasRegression: boolean;           // Whether regression was detected
  severity: 'none' | 'warning' | 'critical';  // Regression severity
  analysis: ManaSlotDecayAnalysis;  // Analysis results
  regressions: Array<{              // Regression details
    tick: number;
    slotIndex: number;
    expectedValue: number;
    actualValue: number;
    deviationPercent: number;
    severity: 'warning' | 'critical';
  }>;
  timestamp: number;               // Timestamp of analysis
}
```

## Regression Detection

### Thresholds

The guard uses configurable thresholds to detect regressions:

- **Warning Threshold**: Deviations exceeding this trigger warnings
- **Critical Threshold**: Deviations exceeding this trigger critical alerts
- **Maximum Deviation**: Upper limit for acceptable deviations
- **Sample Size**: Minimum number of ticks required for analysis
- **Runtime Limit**: Maximum allowed processing time

### Detection Process

1. **Data Validation**: Validate input tick data against configuration
2. **Expected Calculation**: Calculate expected values using decay profile
3. **Deviation Analysis**: Compute percentage deviations from expected
4. **Threshold Comparison**: Compare deviations against thresholds
5. **Regression Classification**: Classify severity based on deviation magnitude
6. **Telemetry Emission**: Emit appropriate telemetry events

### Telemetry Events

The guard emits telemetry events for monitoring:

```typescript
// Regression detected
{
  type: 'sts_mana_slot_decay_regressed',
  timestamp: 1642694400000,
  data: {
    severity: 'critical',
    deviationPercent: 12.5,
    regressionsCount: 3,
    runtimeMs: 150,
  }
}

// Analysis passed
{
  type: 'sts_mana_slot_decay_passed',
  timestamp: 1642694400000,
  data: {
    severity: 'none',
    deviationPercent: 1.2,
    regressionsCount: 0,
    runtimeMs: 85,
  }
}
```

## Performance Optimization

### Caching

The guard implements intelligent caching for:

- **Snapshot Data**: Cache loaded snapshots to avoid repeated I/O
- **Analysis Results**: Cache analysis results for repeated queries
- **Configuration**: Cache validated configuration objects

### Memoization

Expensive calculations are memoized:

- **Decay Rate Calculations**: Cache decay rate computations
- **Expected Values**: Cache expected value calculations
- **Deviation Analysis**: Cache deviation computations

### Performance Metrics

The guard tracks performance metrics:

- **Average Runtime**: Average processing time per tick
- **Maximum Runtime**: Maximum processing time encountered
- **Total Runtime**: Total processing time for analysis
- **Cache Hit Rate**: Cache effectiveness metrics

## Testing

### Unit Tests

Comprehensive unit tests cover:

- **Configuration Validation**: Schema validation and default handling
- **Decay Analysis**: Analysis accuracy and edge cases
- **Regression Detection**: Threshold-based detection logic
- **Snapshot Generation**: Snapshot creation and validation
- **Performance**: Caching and memoization effectiveness

### Test Structure

```typescript
describe('ManaSlotDecayGuard', () => {
  describe('Configuration', () => {
    // Test configuration validation and defaults
  });

  describe('Decay Analysis', () => {
    // Test decay analysis algorithms
  });

  describe('Regression Detection', () => {
    // Test regression detection logic
  });

  describe('Snapshot Generation', () => {
    // Test snapshot creation and validation
  });

  describe('Performance', () => {
    // Test caching and optimization
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test -- tests/unit/sts/ManaSlotDecayGuard.test.ts

# Run with coverage
npm run test -- tests/unit/sts/ManaSlotDecayGuard.test.ts --coverage

# Run specific test groups
npm run test -- tests/unit/sts/ManaSlotDecayGuard.test.ts -g "Configuration"
```

## Integration

### STS Simulator Integration

The guard integrates with the STS simulator:

```typescript
// In simulator
import { ManaSlotDecayGuard } from '@/balancing/sts/manaSlotDecayGuard';

const guard = new ManaSlotDecayGuard();

// After each simulation run
const tickData = simulator.getManaSlotTicks();
const analysis = guard.analyzeManaSlotDecay(tickData);

// Check against reference
const referenceSnapshot = await guard.loadSnapshot('reference.json');
const regressionResult = guard.checkRegression(tickData, referenceSnapshot);

if (regressionResult.hasRegression) {
  console.warn('Mana slot decay regression detected!');
}
```

### Persistence Integration

The guard works with the persistence system:

```typescript
import { PersistenceService } from '@/shared/persistence/PersistenceService';

// Save configuration
await PersistenceService.saveData('mana-decay-config', guard.getConfig());

// Load configuration
const savedConfig = await PersistenceService.loadData('mana-decay-config');
const guard = new ManaSlotDecayGuard(savedConfig);
```

### Telemetry Integration

The guard emits telemetry events:

```typescript
import { dispatchTelemetry } from '@/analytics/telemetry';

// Listen for regression events
window.addEventListener('sts_mana_slot_decay_regressed', (event) => {
  const { severity, deviationPercent, regressionsCount } = event.detail.data;
  
  // Handle regression
  if (severity === 'critical') {
    dispatchTelemetry('critical_mana_decay_regression', {
      deviationPercent,
      regressionsCount,
      timestamp: Date.now(),
    });
  }
});
```

## Troubleshooting

### Common Issues

#### High False Positive Rate
**Problem**: Too many regression warnings for acceptable variations.
**Solution**: Adjust thresholds in configuration:
```typescript
guard.updateConfig({
  thresholds: {
    warningDeviationPercent: 5.0,  // Increase from 2.5%
    criticalDeviationPercent: 15.0, // Increase from 10%
  }
});
```

#### Performance Issues
**Problem**: Slow analysis with large datasets.
**Solution**: Enable caching and optimize configuration:
```typescript
guard.updateConfig({
  performance: {
    enableCaching: true,
    maxCacheSize: 200,
    cacheTimeoutMs: 30000,
  },
  thresholds: {
    minSampleSize: 50,  // Reduce sample size
    maxRuntimeMs: 2000, // Increase runtime limit
  }
});
```

#### Invalid Snapshots
**Problem**: Snapshot validation failures.
**Solution**: Ensure snapshot structure is correct:
```typescript
const validation = guard.validateTickData(ticks);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  console.warn('Validation warnings:', validation.warnings);
}
```

### Debug Mode

Enable debug logging:
```typescript
const guard = new ManaSlotDecayGuard({
  telemetry: {
    enabled: true,
    batchSize: 1,  // Immediate telemetry
    flushInterval: 100,
  }
});
```

### Performance Monitoring

Monitor guard performance:
```typescript
const stats = guard.getCacheStatistics();
console.log('Cache stats:', stats);

const regressionStats = guard.getRegressionStatistics(results);
console.log('Regression stats:', regressionStats);
```

## Best Practices

### Configuration Management

1. **Use Environment-Specific Configs**: Different thresholds for development vs production
2. **Version Control Configuration**: Track configuration changes
3. **Validate Configuration**: Always validate before use
4. **Document Custom Profiles**: Document custom decay profile parameters

### Snapshot Management

1. **Regular Snapshots**: Generate reference snapshots regularly
2. **Version Snapshots**: Use semantic versioning for snapshots
3. **Store Snapshots Securely**: Use appropriate storage locations
4. **Clean Old Snapshots**: Implement cleanup policies

### Regression Monitoring

1. **Set Up Alerts**: Configure alerts for critical regressions
2. **Monitor Trends**: Track regression patterns over time
3. **Investigate False Positives**: Review and adjust thresholds
4. **Document Findings**: Keep records of regression investigations

### Performance Optimization

1. **Enable Caching**: Use caching for repeated operations
2. **Optimize Sample Size**: Balance accuracy vs performance
3. **Monitor Resource Usage**: Track memory and CPU usage
4. **Profile Regularly**: Identify performance bottlenecks

## API Reference

### Classes

#### ManaSlotDecayGuard
Main guard class for mana slot decay analysis.

**Constructor:**
```typescript
new ManaSlotDecayGuard(config?: Partial<ManaSlotRegressionGuardConfig>)
```

**Methods:**
- `getConfig(): ManaSlotRegressionGuardConfig`
- `updateConfig(config: Partial<ManaSlotRegressionGuardConfig>): void`
- `analyzeManaSlotDecay(ticks: ManaSlotTick[]): ManaSlotDecayAnalysis`
- `checkRegression(ticks: ManaSlotTick[], reference: ManaSlotSnapshot): ManaSlotRegressionResult`
- `generateSnapshot(ticks: ManaSlotTick[], name?: string, description?: string): ManaSlotSnapshot`
- `validateTickData(ticks: ManaSlotTick[]): ValidationResult`
- `getRegressionStatistics(results: ManaSlotRegressionResult[]): RegressionStatistics`

### Factory Functions

#### createManaSlotDecayGuard
Create a mana slot decay guard with custom configuration.

```typescript
function createManaSlotDecayGuard(config?: Partial<ManaSlotRegressionGuardConfig>): ManaSlotDecayGuard
```

### Utility Functions

#### calculateExpectedManaSlotValue
Calculate expected mana slot value at given tick.

```typescript
function calculateExpectedManaSlotValue(tick: number, config: ManaSlotDecayConfig): number
```

#### calculateDecayRate
Calculate decay rate at given tick.

```typescript
function calculateDecayRate(tick: number, config: ManaSlotDecayConfig): number
```

#### generateChecksum
Generate checksum for data integrity.

```typescript
function generateChecksum(data: any): string
```

### Validation Functions

#### validateManaSlotTick
Validate mana slot tick data.

```typescript
function validateManaSlotTick(tick: ManaSlotTick): boolean
```

#### validateManaSlotDecayAnalysis
Validate mana slot decay analysis.

```typescript
function validateManaSlotDecayAnalysis(analysis: ManaSlotDecayAnalysis): boolean
```

#### validateManaSlotSnapshot
Validate mana slot snapshot.

```typescript
function validateManaSlotSnapshot(snapshot: ManaSlotSnapshot): boolean
```

## Examples

### Basic Regression Detection

```typescript
import { ManaSlotDecayGuard } from '@/balancing/sts/manaSlotDecayGuard';

// Create guard
const guard = new ManaSlotDecayGuard();

// Load reference snapshot
const reference = await guard.loadSnapshot('reference-snapshot.json');

// Analyze current run
const currentTicks = getCurrentManaSlotTicks();
const result = guard.checkRegression(currentTicks, reference);

if (result.hasRegression) {
  console.error(`Mana slot decay regression detected! Severity: ${result.severity}`);
  console.log(`Max deviation: ${result.analysis.maxDeviationPercent}%`);
  console.log(`Regressions found: ${result.regressions.length}`);
}
```

### Custom Decay Profile

```typescript
import { createManaSlotDecayGuard } from '@/balancing/sts/manaSlotDecayGuard';

const guard = createManaSlotDecayGuard({
  decay: {
    profile: 'custom',
    baseDecayRate: 0.03,
    decayAcceleration: 1.5,
    minSlotValue: 10,
    maxSlotValue: 120,
    customParams: {
      a: 100,  // Base value
      b: 0.8,  // Decay factor
      c: 15,   // Minimum value
    },
  },
  thresholds: {
    maxDeviationPercent: 4.0,
    criticalDeviationPercent: 8.0,
    warningDeviationPercent: 2.0,
    minSampleSize: 75,
    maxRuntimeMs: 800,
  },
});
```

### Batch Analysis

```typescript
import { ManaSlotDecayGuard } from '@/balancing/sts/manaSlotDecayGuard';

const guard = new ManaSlotDecayGuard();
const results = [];

// Process multiple runs
for (const run of simulationRuns) {
  const result = await guard.runRegressionCheck(run.ticks, run.reference);
  results.push(result);
}

// Get statistics
const stats = guard.getRegressionStatistics(results);
console.log(`Regressions found: ${stats.regressionsFound}/${stats.totalChecks}`);
console.log(`Average deviation: ${stats.averageDeviation.toFixed(2)}%`);
```

## Future Enhancements

### Planned Features
- **Machine Learning**: ML-based regression detection
- **Real-time Monitoring**: Live monitoring dashboard
- **Advanced Analytics**: Statistical significance testing
- **Custom Alerting**: Configurable alert rules
- **Export Formats**: Additional export formats (CSV, Excel)

### Extension Points
- **Custom Decay Profiles**: Plugin system for custom profiles
- **Custom Validators**: Extensible validation framework
- **Custom Telemetry**: Custom telemetry providers
- **Custom Storage**: Pluggable storage backends

## Contributing

When contributing to the Mana Slot Decay Regression Guard:

1. **Follow RPG Balancer Philosophy**: Config-first design, no hardcoding
2. **Add Tests**: Cover new features with comprehensive tests
3. **Update Documentation**: Keep documentation current
4. **Validate Configuration**: Ensure all configuration is validated
5. **Performance Consideration**: Consider performance impact of changes

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm run test -- tests/unit/sts/ManaSlotDecayGuard.test.ts

# Run linting
npm run lint -- src/balancing/sts/manaSlotDecayGuard.ts

# Build check
npm run build:check
```

## License

This component is part of the RPG Balancer project and follows the same licensing terms.
