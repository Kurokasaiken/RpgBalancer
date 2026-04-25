# Persistence Chaos Monkey Guide

## Overview

The Persistence Chaos Monkey is a comprehensive fault injection testing system for the PersistenceService layer. It enables chaos engineering practices by systematically injecting faults, tracking KPIs, and generating detailed reports to identify weaknesses in the persistence layer.

## Purpose

- **Fault Injection**: Systematically inject various types of faults (latency, failures, corruption, timeouts)
- **KPI Tracking**: Monitor performance metrics, error rates, and data integrity
- **Scenario Management**: Run predefined chaos scenarios or custom fault combinations
- **Comprehensive Reporting**: Generate detailed reports in JSON, CSV, and Markdown formats
- **Telemetry Integration**: Emit telemetry events for monitoring and alerting

## Architecture

### Core Components

```
src/shared/testing/
├── PersistenceChaosConfig.ts      # Configuration schemas and presets
├── PersistenceChaosHarness.ts     # Main chaos harness implementation
└── PersistenceChaosHarness.test.ts # Unit tests

scripts/testing/
└── persistenceChaosMonkey.ts      # CLI tool for running chaos tests

docs/testing/
└── persistence_chaos_monkey.md    # This documentation
```

### Fault Injectors

The system includes 8 different fault injectors:

1. **LatencyInjector**: Adds artificial delays to operations
2. **FailureInjector**: Simulates operation failures
3. **CorruptionInjector**: Corrupts data during operations
4. **TimeoutInjector**: Simulates operation timeouts
5. **PartialInjector**: Returns partial results
6. **IntermittentInjector**: Intermittent failures
7. **CascadeInjector**: Cascading failure propagation
8. **ExhaustionInjector**: Resource exhaustion simulation

## Configuration

### Fault Injection Types

```typescript
export const FaultTypeSchema = z.enum([
  'latency',      // Add artificial delay
  'failure',      // Simulate failure
  'corruption',   // Corrupt data
  'timeout',      // Simulate timeout
  'partial',      // Partial success/failure
  'intermittent', // Intermittent issues
  'cascade',      // Cascading failures
  'exhaustion',   // Resource exhaustion
]);

export const FaultSeveritySchema = z.enum([
  'low',      // Minor issues
  'medium',   // Moderate issues
  'high',     // Severe issues
  'critical', // Critical failures
]);
```

### Chaos Scenario Configuration

```typescript
interface ChaosScenario {
  id: string;
  name: string;
  description: string;
  faults: FaultInjection[];
  duration: number;
  warmupPeriod: number;
  cooldownPeriod: number;
  namespace: string;
  enabled: boolean;
}

interface FaultInjection {
  type: FaultType;
  severity: FaultSeverity;
  probability: number;        // 0-1
  duration: number;           // milliseconds
  targetOperations: string[];
  parameters: Record<string, unknown>;
  enabled: boolean;
}
```

### Default Scenarios

#### 1. Basic Latency Scenario
```typescript
{
  id: 'basic-latency',
  name: 'Basic Latency Injection',
  description: 'Injects moderate latency into all operations',
  faults: [
    {
      type: 'latency',
      severity: 'medium',
      probability: 0.3,
      duration: 5000,
      targetOperations: ['save', 'load'],
      parameters: {
        minDelay: 100,
        maxDelay: 500,
        distribution: 'uniform',
        jitter: 0.2,
      },
      enabled: true,
    },
  ],
  duration: 10000,
  warmupPeriod: 1000,
  cooldownPeriod: 2000,
  namespace: 'chaos-test-basic',
  enabled: true,
}
```

#### 2. Failure Injection Scenario
```typescript
{
  id: 'failure-injection',
  name: 'Failure Injection',
  description: 'Injects random failures into save operations',
  faults: [
    {
      type: 'failure',
      severity: 'high',
      probability: 0.2,
      duration: 8000,
      targetOperations: ['save'],
      parameters: {
        errorType: 'network',
        message: 'Simulated network failure',
        code: 'NETWORK_ERROR',
        autoRetry: false,
        retryAttempts: 0,
      },
      enabled: true,
    },
  ],
  duration: 12000,
  warmupPeriod: 1000,
  cooldownPeriod: 3000,
  namespace: 'chaos-test-failure',
  enabled: true,
}
```

#### 3. Data Corruption Scenario
```typescript
{
  id: 'data-corruption',
  name: 'Data Corruption',
  description: 'Corrupts data during load operations',
  faults: [
    {
      type: 'corruption',
      severity: 'critical',
      probability: 0.1,
      duration: 6000,
      targetOperations: ['load'],
      parameters: {
        corruptionType: 'modify',
        corruptionPercentage: 0.3,
        preserveStructure: true,
      },
      enabled: true,
    },
  ],
  duration: 8000,
  warmupPeriod: 1000,
  cooldownPeriod: 2000,
  namespace: 'chaos-test-corruption',
  enabled: false, // Disabled by default due to critical severity
}
```

### Presets

#### Light Preset
- **Purpose**: CI/CD pipeline testing
- **Duration**: 5 seconds
- **Latency**: 50-200ms
- **Probability**: 10%
- **Features**: Minimal impact, fast execution

#### Medium Preset
- **Purpose**: Staging environment testing
- **Scenarios**: Basic latency, failure injection, data corruption
- **Duration**: 8-12 seconds
- **Features**: Moderate impact, comprehensive coverage

#### Heavy Preset
- **Purpose**: Chaos engineering
- **Scenarios**: All scenarios enabled
- **Duration**: 8-20 seconds
- **Features**: Maximum impact, full coverage

#### Performance Preset
- **Purpose**: Performance testing
- **Scenarios**: Latency, timeout
- **Focus**: Latency metrics, resource usage
- **Features**: Performance-oriented KPIs

#### Reliability Preset
- **Purpose**: Reliability testing
- **Scenarios**: Failure, corruption, intermittent
- **Focus**: Error rates, data integrity
- **Features**: Reliability-oriented KPIs

## Usage

### CLI Tool

The `persistenceChaosMonkey.ts` script provides a command-line interface for running chaos tests.

#### Basic Usage

```bash
# Run a specific scenario
tsx scripts/testing/persistenceChaosMonkey.ts --scenarios basic-latency

# Run multiple scenarios
tsx scripts/testing/persistenceChaosMonkey.ts --scenarios basic-latency failure-injection

# Use a preset
tsx scripts/testing/persistenceChaosMonkey.ts --preset medium

# List available scenarios and presets
tsx scripts/testing/persistenceChaosMonkey.ts --list
```

#### Advanced Usage

```bash
# Custom namespace and output directory
tsx scripts/testing/persistenceChaosMonkey.ts \
  --scenarios basic-latency \
  --namespace my-chaos-test \
  --output test-results/my-chaos

# Custom timeout and export formats
tsx scripts/testing/persistenceChaosMonkey.ts \
  --preset heavy \
  --timeout 120000 \
  --formats json csv markdown

# Dry run mode (no actual chaos)
tsx scripts/testing/persistenceChaosMonkey.ts \
  --scenarios basic-latency \
  --dry-run

# Verbose logging
tsx scripts/testing/persistenceChaosMonkey.ts \
  --scenarios basic-latency \
  --verbose
```

#### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--scenarios <ids...>` | Scenario IDs to run | [] |
| `--preset <name>` | Use preset configuration | none |
| `--namespace <name>` | Namespace for testing | chaos-test-cli |
| `--output <dir>` | Output directory for reports | test-results |
| `--verbose` | Enable verbose logging | false |
| `--dry-run` | Dry run mode (no actual chaos) | false |
| `--timeout <ms>` | Global timeout in milliseconds | 60000 |
| `--formats <formats...>` | Export formats (json, csv, markdown) | json, markdown |
| `--no-raw-results` | Exclude raw operation results | false |
| `--no-summary` | Exclude summary statistics | false |
| `--no-kpi` | Exclude KPI metrics | false |
| `--no-faults` | Exclude fault injection details | false |
| `--list` | List available scenarios and presets | false |

### Programmatic Usage

#### Basic Setup

```typescript
import { PersistenceChaosHarness } from './src/shared/testing/PersistenceChaosHarness';

// Create harness with default configuration
const harness = new PersistenceChaosHarness();

// Create harness with custom configuration
const harness = new PersistenceChaosHarness({
  settings: {
    enabled: true,
    verbose: true,
    maxConcurrentScenarios: 3,
  },
}, 'my-test-namespace');
```

#### Running Scenarios

```typescript
// Start a scenario
await harness.startScenario('basic-latency');

// Execute operations with chaos injection
try {
  await harness.saveData('test-key', { data: 'test' });
  console.log('Operation succeeded');
} catch (error) {
  console.log('Operation failed:', error.message);
}

// Stop the scenario
await harness.stopScenario('basic-latency');
```

#### Using Presets

```typescript
// Apply a preset
harness.applyPreset('medium');

// Start scenarios from preset
await harness.startScenario('basic-latency');
await harness.startScenario('failure-injection');
```

#### Event Handling

```typescript
// Listen for scenario events
harness.on('scenarioStarted', ({ scenarioId, scenario }) => {
  console.log(`Started scenario: ${scenario.name}`);
});

harness.on('scenarioStopped', ({ scenarioId, result }) => {
  console.log(`Completed scenario: ${result.scenarioName}`);
  console.log(`Error rate: ${(result.summary.errorRate * 100).toFixed(2)}%`);
});

harness.on('operationCompleted', (result) => {
  if (!result.success) {
    console.log(`Operation failed: ${result.operation}`);
  }
});

harness.on('telemetry', (event) => {
  console.log(`Telemetry: ${event.eventName}`);
});
```

#### Exporting Results

```typescript
// Export as JSON
const jsonReport = harness.exportResults({
  format: 'json',
  includeRawResults: true,
  includeSummary: true,
  includeKPI: true,
  includeFaults: true,
});

// Export as CSV
const csvReport = harness.exportResults({
  format: 'csv',
  includeRawResults: true,
  includeSummary: false,
  includeKPI: false,
  includeFaults: false,
});

// Export as Markdown
const markdownReport = harness.exportResults({
  format: 'markdown',
  includeRawResults: true,
  includeSummary: true,
  includeKPI: true,
  includeFaults: true,
});
```

## Fault Injection Details

### Latency Fault

Injects artificial delays into operations.

#### Parameters
```typescript
interface LatencyParameters {
  minDelay: number;           // Minimum delay in milliseconds
  maxDelay: number;           // Maximum delay in milliseconds
  distribution: 'fixed' | 'uniform' | 'exponential' | 'normal';
  jitter: number;             // Jitter factor (0-1)
}
```

#### Distributions
- **Fixed**: Constant delay
- **Uniform**: Random delay between min and max
- **Exponential**: Exponential distribution for realistic latency
- **Normal**: Normal distribution with mean and variation

#### Example
```typescript
{
  type: 'latency',
  severity: 'medium',
  probability: 0.3,
  duration: 5000,
  targetOperations: ['save', 'load'],
  parameters: {
    minDelay: 100,
    maxDelay: 500,
    distribution: 'uniform',
    jitter: 0.2,
  },
  enabled: true,
}
```

### Failure Fault

Simulates operation failures with specific error types.

#### Parameters
```typescript
interface FailureParameters {
  errorType: 'timeout' | 'network' | 'storage' | 'quota' | 'permission' | 'unknown';
  message: string;
  code?: string;
  autoRetry: boolean;
  retryAttempts: number;
}
```

#### Error Types
- **timeout**: Operation timeout
- **network**: Network connectivity issues
- **storage**: Storage system failure
- **quota**: Storage quota exceeded
- **permission**: Permission denied
- **unknown**: Unknown error

#### Example
```typescript
{
  type: 'failure',
  severity: 'high',
  probability: 0.2,
  duration: 8000,
  targetOperations: ['save'],
  parameters: {
    errorType: 'network',
    message: 'Simulated network failure',
    code: 'NETWORK_ERROR',
    autoRetry: false,
    retryAttempts: 0,
  },
  enabled: true,
}
```

### Corruption Fault

Corrupts data during operations to test data integrity.

#### Parameters
```typescript
interface CorruptionParameters {
  corruptionType: 'truncate' | 'modify' | 'nullify' | 'duplicate' | 'scramble';
  corruptionPercentage: number;  // 0-1
  targetKeys?: string[];           // Specific keys to corrupt
  preserveStructure: boolean;
}
```

#### Corruption Types
- **truncate**: Truncate arrays/objects
- **modify**: Modify values (reverse strings, multiply numbers)
- **nullify**: Set values to null
- **duplicate**: Duplicate array elements
- **scramble**: Random modifications

#### Example
```typescript
{
  type: 'corruption',
  severity: 'critical',
  probability: 0.1,
  duration: 6000,
  targetOperations: ['load'],
  parameters: {
    corruptionType: 'modify',
    corruptionPercentage: 0.3,
    preserveStructure: true,
  },
  enabled: true,
}
```

### Timeout Fault

Simulates operation timeouts.

#### Parameters
```typescript
interface TimeoutParameters {
  timeout: number;           // Timeout duration in milliseconds
  partialTimeout: boolean;   // Simulate partial timeout
  timeoutBehavior: 'reject' | 'timeout' | 'hang';
}
```

#### Timeout Behaviors
- **reject**: Reject with timeout error
- **timeout**: Timeout with proper error
- **hang**: Never resolve (hang forever)

#### Example
```typescript
{
  type: 'timeout',
  severity: 'high',
  probability: 0.25,
  duration: 7000,
  targetOperations: ['save', 'load', 'clear'],
  parameters: {
    timeout: 1000,
    partialTimeout: false,
    timeoutBehavior: 'timeout',
  },
  enabled: true,
}
```

### Partial Fault

Returns partial results or incomplete data.

#### Parameters
```typescript
interface PartialParameters {
  successRate: number;       // 0-1
  returnPartial: boolean;    // Return partial data
  missingPercentage: number; // 0-1
}
```

#### Example
```typescript
{
  type: 'partial',
  severity: 'medium',
  probability: 0.3,
  duration: 4000,
  targetOperations: ['save', 'load'],
  parameters: {
    successRate: 0.7,
    returnPartial: true,
    missingPercentage: 0.3,
  },
  enabled: true,
}
```

### Intermittent Fault

Simulates intermittent connectivity issues.

#### Parameters
```typescript
interface IntermittentParameters {
  pattern: 'random' | 'periodic' | 'burst' | 'decay';
  burstSize: number;
  periodDuration: number;
  activePeriods: number;
}
```

#### Patterns
- **random**: Random failures
- **periodic**: Periodic active/inactive periods
- **burst**: Burst of failures
- **decay**: Decaying failure probability

#### Example
```typescript
{
  type: 'intermittent',
  severity: 'medium',
  probability: 0.4,
  duration: 15000,
  targetOperations: ['save', 'load'],
  parameters: {
    pattern: 'burst',
    burstSize: 3,
    periodDuration: 2000,
    activePeriods: 2,
  },
  enabled: true,
}
```

### Cascade Fault

Simulates cascading failures.

#### Parameters
```typescript
interface CascadeParameters {
  triggerConditions: string[];
  cascadeDelay: number;
  propagationFactor: number;
  maxCascadeDepth: number;
}
```

#### Example
```typescript
{
  type: 'cascade',
  severity: 'high',
  probability: 0.2,
  duration: 10000,
  targetOperations: ['save', 'load'],
  parameters: {
    triggerConditions: ['save'],
    cascadeDelay: 100,
    propagationFactor: 1.5,
    maxCascadeDepth: 3,
  },
  enabled: true,
}
```

### Exhaustion Fault

Simulates resource exhaustion.

#### Parameters
```typescript
interface ExhaustionParameters {
  resourceType: 'memory' | 'storage' | 'quota' | 'connections';
  exhaustionRate: number;
  recoveryTime: number;
  partialThreshold: number;
}
```

#### Resource Types
- **memory**: Memory exhaustion
- **storage**: Storage space exhaustion
- **quota**: Quota exceeded
- **connections**: Connection pool exhaustion

#### Example
```typescript
{
  type: 'exhaustion',
  severity: 'high',
  probability: 0.15,
  duration: 8000,
  targetOperations: ['save', 'load'],
  parameters: {
    resourceType: 'storage',
    exhaustionRate: 0.3,
    recoveryTime: 5000,
    partialThreshold: 0.8,
  },
  enabled: true,
}
```

## KPI Metrics

### Core Metrics

```typescript
interface ChaosMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalFaultsInjected: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  errorRate: number;
  dataIntegrityIssues: number;
  resourceExhaustionEvents: number;
  cascadeEvents: number;
}
```

### Scenario-Specific Metrics

```typescript
interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  startTime: number;
  endTime: number;
  duration: number;
  operations: ChaosOperationResult[];
  summary: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageLatency: number;
    maxLatency: number;
    minLatency: number;
    errorRate: number;
    dataIntegrityIssues: number;
    resourceExhaustionEvents: number;
    cascadeEvents: number;
  };
  faultSummary: {
    totalFaultsInjected: number;
    faultsByType: Record<FaultType, number>;
    faultsBySeverity: Record<FaultSeverity, number>;
  };
  kpiMetrics: {
    throughput: number;      // ops per second
    reliability: number;     // 0-1
    efficiency: number;       // 0-1
    faultDensity: number;     // faults per operation
  };
}
```

### Data Integrity

The system automatically checks data integrity when corruption faults are active:

```typescript
interface DataIntegrityCheck {
  passed: boolean;
  issues: string[];
}
```

**Checks Performed:**
- Type consistency between original and processed data
- Deep equality for simple cases
- Unexpected null values
- Structure preservation

## Telemetry Events

### Scenario Events

```typescript
// Scenario started
{
  eventName: 'persistence_chaos_scenario_started',
  data: {
    scenarioId: 'basic-latency',
    scenarioName: 'Basic Latency Injection',
    faults: 1,
    duration: 10000,
  },
  timestamp: 1641894400000,
  harness: 'persistence-chaos',
  namespace: 'chaos-test',
}

// Scenario stopped
{
  eventName: 'persistence_chaos_scenario_stopped',
  data: {
    scenarioId: 'basic-latency',
    scenarioName: 'Basic Latency Injection',
    result: {
      totalOperations: 50,
      successfulOperations: 45,
      failedOperations: 5,
      averageLatency: 125.5,
      errorRate: 0.1,
    },
  },
  timestamp: 1641894410000,
  harness: 'persistence-chaos',
  namespace: 'chaos-test',
}
```

### Operation Events

```typescript
// Fault injected
{
  eventName: 'persistence_chaos_fault_injected',
  data: {
    faultType: 'latency',
    operation: 'save',
    scenarioId: 'basic-latency',
    severity: 'medium',
  },
  timestamp: 1641894405000,
  harness: 'persistence-chaos',
  namespace: 'chaos-test',
}

// Operation completed
{
  eventName: 'persistence_chaos_operation_completed',
  data: {
    operation: 'save',
    success: true,
    duration: 150,
    injectedFaults: ['latency'],
    error: undefined,
  },
  timestamp: 1641894405150,
  harness: 'persistence-chaos',
  namespace: 'chaos-test',
}
```

## Report Formats

### JSON Report

Complete structured data with all details:

```json
{
  "config": {
    "scenarios": [...],
    "kpiConfig": {...},
    "settings": {...}
  },
  "operations": [
    {
      "operation": "save",
      "success": true,
      "duration": 150,
      "timestamp": 1641894400000,
      "injectedFaults": ["latency"],
      "error": null
    }
  ],
  "scenarios": [
    {
      "scenarioId": "basic-latency",
      "scenarioName": "Basic Latency Injection",
      "startTime": 1641894400000,
      "endTime": 1641894410000,
      "duration": 10000,
      "summary": {
        "totalOperations": 50,
        "successfulOperations": 45,
        "failedOperations": 5,
        "averageLatency": 125.5,
        "maxLatency": 500,
        "minLatency": 50,
        "errorRate": 0.1,
        "dataIntegrityIssues": 0,
        "resourceExhaustionEvents": 0,
        "cascadeEvents": 0
      },
      "faultSummary": {
        "totalFaultsInjected": 15,
        "faultsByType": {
          "latency": 15
        },
        "faultsBySeverity": {
          "medium": 15
        }
      },
      "kpiMetrics": {
        "throughput": 5.0,
        "reliability": 0.9,
        "efficiency": 0.9,
        "faultDensity": 0.3
      }
    }
  ],
  "metrics": {
    "totalOperations": 50,
    "successfulOperations": 45,
    "failedOperations": 5,
    "totalFaultsInjected": 15,
    "averageLatency": 125.5,
    "maxLatency": 500,
    "minLatency": 50,
    "errorRate": 0.1,
    "dataIntegrityIssues": 0,
    "resourceExhaustionEvents": 0,
    "cascadeEvents": 0
  },
  "summary": {
    "totalOperations": 50,
    "successfulOperations": 45,
    "failedOperations": 5,
    "averageLatency": 125.5,
    "errorRate": 0.1,
    "totalFaultsInjected": 15,
    "dataIntegrityIssues": 0,
    "resourceExhaustionEvents": 0,
    "cascadeEvents": 0
  },
  "exportedAt": "2026-01-20T23:00:00.000Z"
}
```

### CSV Report

Tabular format for spreadsheet analysis:

```csv
Timestamp,Operation,Success,Duration,Error,InjectedFaults
2026-01-20T23:00:00.000Z,save,true,150,,latency
2026-01-20T23:00:00.500Z,load,false,200,Network Error,failure
2026-01-20T23:00:01.000Z,save,true,100,,latency
```

### Markdown Report

Human-readable report with summaries:

```markdown
# Persistence Chaos Monkey Results

**Generated:** 2026-01-20T23:00:00.000Z
**Total Operations:** 50
**Success Rate:** 90.00%
**Average Latency:** 125.50ms
**Total Faults Injected:** 15

## Scenario Results

### Basic Latency Injection

- **Duration:** 10000ms
- **Operations:** 50
- **Success Rate:** 90.00%
- **Average Latency:** 125.50ms
- **Faults Injected:** 15

## Operation Details

| Timestamp | Operation | Success | Duration | Error | Faults |
|-----------|-----------|---------|----------|-------|--------|
| 2026-01-20T23:00:00.000Z | save | true | 150ms |  | latency |
| 2026-01-20T23:00:00.500Z | load | false | 200ms | Network Error | failure |
| 2026-01-20T23:00:01.000Z | save | true | 100ms |  | latency |
```

## Best Practices

### Testing Strategy

1. **Start Small**: Begin with light preset and basic scenarios
2. **Gradual Increase**: Progress to medium and heavy presets
3. **Monitor KPIs**: Track error rates and latency changes
4. **Data Integrity**: Always verify data after corruption tests
5. **Clean Up**: Ensure test namespaces are isolated

### Scenario Design

1. **Realistic Faults**: Use fault types that match real-world scenarios
2. **Appropriate Probability**: Set reasonable fault probabilities (10-30%)
3. **Limited Duration**: Keep scenarios short to avoid system overload
4. **Clear Objectives**: Define what each scenario is testing

### CI/CD Integration

1. **Light Preset**: Use light preset for quick smoke tests
2. **Timeout Protection**: Set reasonable timeouts for CI environments
3. **Exit Codes**: Use exit codes to indicate test failures
4. **Report Generation**: Generate reports for analysis

### Production Safety

1. **Namespace Isolation**: Always use separate namespaces
2. **Dry Run Mode**: Use dry run to validate scenarios
3. **Monitoring**: Monitor system health during tests
4. **Rollback Plans**: Have rollback procedures ready

## Troubleshooting

### Common Issues

#### Scenario Not Found
```
Error: Scenario invalid-scenario not found
```
**Solution**: Check available scenarios with `--list` option

#### High Error Rate
```
Error: High error rate detected: 75.00% (threshold: 50.00%)
```
**Solution**: Reduce fault probability or check system health

#### Timeout Issues
```
Error: Chaos test timeout after 60000ms
```
**Solution**: Increase timeout or reduce scenario duration

#### Data Corruption
```
Warning: Data integrity issues detected
```
**Solution**: Verify data integrity checks and corruption parameters

### Debug Mode

Enable verbose logging for detailed debugging:

```bash
tsx scripts/testing/persistenceChaosMonkey.ts \
  --scenarios basic-latency \
  --verbose
```

### Log Analysis

Check operation history for detailed analysis:

```typescript
const history = harness.getOperationHistory();
const failedOperations = history.filter(op => !op.success);
const latencyIssues = history.filter(op => op.duration > 1000);
```

## Integration Examples

### CI/CD Pipeline

```yaml
# .github/workflows/chaos-testing.yml
name: Chaos Testing
on: [push, pull_request]

jobs:
  chaos-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run chaos tests
        run: |
          tsx scripts/testing/persistenceChaosMonkey.ts \
            --preset light \
            --timeout 30000 \
            --namespace ci-chaos-test
      - name: Upload reports
        uses: actions/upload-artifact@v2
        with:
          name: chaos-reports
          path: test-results/
```

### Monitoring Integration

```typescript
// Integrate with monitoring system
harness.on('telemetry', (event) => {
  // Send to monitoring system
  monitoring.sendEvent(event.eventName, event.data);
  
  // Alert on high error rates
  if (event.eventName === 'persistence_chaos_scenario_stopped') {
    const errorRate = event.data.result.errorRate;
    if (errorRate > 0.5) {
      alerting.sendAlert('High error rate in chaos test', {
        errorRate,
        scenarioId: event.data.scenarioId,
      });
    }
  }
});
```

### Custom Fault Injectors

```typescript
// Create custom fault injector
class CustomFaultInjector implements FaultInjector {
  shouldApply(operation: string, fault: FaultInjection): boolean {
    return fault.targetOperations.includes(operation) && fault.enabled;
  }

  getParameters(fault: FaultInjection): any {
    return fault.parameters;
  }

  async inject(operation: string, data: any, fault: FaultInjection): Promise<any> {
    // Custom fault injection logic
    const params = this.getParameters(fault);
    
    // Implement custom behavior
    if (params.customCondition) {
      throw new Error('Custom fault injected');
    }
    
    return data;
  }
}

// Register custom injector
harness.faultInjectors.set('custom', new CustomFaultInjector());
```

## Performance Considerations

### Resource Usage

- **Memory**: Harness maintains operation history (limited to 1000 entries)
- **CPU**: Fault injection adds minimal overhead
- **Storage**: Uses test namespaces to avoid data pollution

### Optimization Tips

1. **Limit History**: Keep operation history manageable
2. **Batch Operations**: Group operations for better performance
3. **Async Processing**: Use async operations for fault injection
4. **Cleanup**: Regular cleanup of completed scenarios

### Scalability

- **Concurrent Scenarios**: Support for multiple concurrent scenarios
- **Namespace Isolation**: Separate namespaces for parallel testing
- **Resource Limits**: Built-in resource exhaustion protection

## Security Considerations

### Data Protection

- **Namespace Isolation**: Test data isolated from production
- **No Permanent Effects**: All chaos effects are temporary
- **Cleanup**: Automatic cleanup of test data

### Access Control

- **Namespace Restrictions**: Limited to specified namespaces
- **Operation Limits**: Maximum concurrent scenarios
- **Timeout Protection**: Global timeout prevents hanging

### Audit Trail

- **Operation Logging**: All operations logged with timestamps
- **Fault Tracking**: Detailed fault injection records
- **Export Capability**: Complete audit trail export

## Future Enhancements

### Planned Features

1. **Web Dashboard**: Real-time chaos testing dashboard
2. **Advanced Analytics**: Machine learning for pattern detection
3. **Integration Tests**: Automated integration with test suites
4. **Cloud Support**: Cloud-native chaos testing
5. **API Gateway**: REST API for remote chaos testing

### Extension Points

1. **Custom Fault Injectors**: Plugin system for custom faults
2. **Metric Collectors**: Custom metric collection
3. **Report Formats**: Additional export formats
4. **Notification Systems**: Custom notification integrations

## Conclusion

The Persistence Chaos Monkey provides a comprehensive solution for chaos engineering in the persistence layer. By systematically injecting faults and tracking KPIs, it helps identify weaknesses and improve system resilience.

### Key Benefits

- **Proactive Testing**: Identify issues before they impact users
- **Quantifiable Metrics**: Measure system resilience with hard data
- **Configurable Scenarios**: Tailor tests to specific use cases
- **Comprehensive Reporting**: Detailed analysis and insights
- **Integration Ready**: Easy integration with existing systems

### Getting Started

1. **Install Dependencies**: Ensure all required packages are installed
2. **Run Basic Test**: Start with the light preset
3. **Analyze Results**: Review generated reports
4. **Customize Scenarios**: Create scenarios for your specific needs
5. **Integrate**: Add to CI/CD pipeline for continuous testing

For more information, refer to the source code documentation and examples provided in the repository.
