# Idle Village Drag Diagnostics CLI

## Overview

The Idle Village Drag Diagnostics CLI (NP-103) is a comprehensive tool for reproducing Phase E drag/drop scenarios, measuring validation latency, and generating diagnostic reports. It tests the drag validation system with various scenarios and provides detailed performance metrics and KPI analysis.

## Features

- **Scenario-Based Testing**: Predefined drag scenarios (valid, invalid, blocked, warning)
- **Performance Measurement**: Latency tracking and performance scoring
- **Multiple Export Formats**: JSON, Markdown, and CSV reports
- **Latency Visualization**: ASCII charts for performance analysis
- **Telemetry Integration**: Emits `iv_drag_diagnostics_run` events
- **Preset Configurations**: Quick, comprehensive, and performance testing profiles
- **Parallel/Sequential Execution**: Configurable execution modes
- **Threshold Validation**: Configurable performance and success rate thresholds

## Installation

The CLI is included in the RPG Balancer project. No additional installation required.

## Usage

### Basic Usage

```bash
# Run with default configuration
node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts

# Use a preset configuration
node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts --preset quick

# Verbose output
node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts --preset comprehensive --verbose
```

### Advanced Usage

```bash
# Custom output directory and formats
node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts \
  --output ./diagnostics \
  --format json,markdown,csv

# Test specific scenarios only
node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts \
  --scenarios valid-basic-drop,invalid-stat-mismatch

# Custom iterations and timeout
node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts \
  --iterations 50 \
  --timeout 15000

# Performance testing with DOM harness
node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts \
  --preset performance \
  --dom-harness \
  --parallel
```

## Command Line Options

| Option | Type | Description |
|--------|------|-------------|
| `--preset` | string | Configuration preset (quick, comprehensive, performance) |
| `--output` | string | Output directory for diagnostic reports |
| `--scenarios` | string | Comma-separated list of scenario IDs to test |
| `--format` | string | Output formats (json,markdown,csv) |
| `--iterations` | number | Number of iterations per scenario |
| `--timeout` | number | Scenario timeout in milliseconds |
| `--parallel` | boolean | Enable parallel execution |
| `--dom-harness` | boolean | Use DOM harness for drag simulation |
| `--verbose` | boolean | Enable verbose logging |
| `--dry-run` | boolean | Show what would be done without executing |
| `--help` | boolean | Show help information |

## Configuration

### Default Configuration

The CLI comes with a comprehensive default configuration that tests four main drag scenarios:

1. **Valid Basic Drop** (`valid-basic-drop`) - Resident with matching stats
2. **Invalid Stat Mismatch** (`invalid-stat-mismatch`) - Wrong stats for activity
3. **Blocked by Fatigue** (`blocked-fatigue-limit`) - Exhausted resident
4. **Warning - Crew Limit** (`warning-crew-limit`) - Activity at capacity

### Presets

#### Quick Preset
- **Purpose**: Fast validation for CI/CD pipelines
- **Scenarios**: 2 (valid-basic-drop, invalid-stat-mismatch)
- **Execution**: Sequential, 1 concurrent operation
- **Timeout**: 5 seconds per scenario

#### Comprehensive Preset
- **Purpose**: Full validation suite for release testing
- **Scenarios**: All 4 scenarios
- **Execution**: Parallel, up to 3 concurrent operations
- **Timeout**: 15 seconds per scenario
- **Features**: Verbose logging enabled

#### Performance Preset
- **Purpose**: Performance and latency testing
- **Scenarios**: All 4 scenarios
- **Execution**: Parallel, up to 10 concurrent operations
- **Features**: DOM harness, strict thresholds, latency charts
- **Thresholds**: 25ms max latency, 100% success rate

### Custom Configuration

You can create custom configurations by modifying the `dragDiagnosticsConfig.ts` file:

```typescript
export const CUSTOM_CONFIG: DragDiagnosticsConfig = {
  name: 'Custom Drag Diagnostics',
  description: 'Custom testing configuration',
  scenarios: [
    {
      id: 'custom-scenario',
      name: 'Custom Scenario',
      type: 'valid',
      description: 'Custom test scenario',
      resident: { /* resident config */ },
      slot: { /* slot config */ },
      currentAssignments: {},
      expected: { valid: true },
      iterations: 20,
      thresholds: {
        maxLatencyMs: 30,
        minSuccessRate: 0.95,
      },
      enabled: true,
      priority: 1,
    },
  ],
  execution: {
    parallelExecution: true,
    maxConcurrentOps: 5,
    scenarioTimeoutMs: 10000,
    continueOnFailure: false,
    verbose: false,
    captureMetrics: true,
    useDOMHarness: false,
  },
  output: {
    outputDir: 'test-results',
    createTimestampedFilenames: true,
    formats: ['json', 'markdown', 'csv'],
    includeDetailedResults: true,
    includePerformanceMetrics: true,
    generateLatencyChart: true,
    includeRawLogs: false,
  },
  telemetry: {
    enabled: true,
    eventName: 'iv_drag_diagnostics_run',
    trackScenarioResults: true,
    trackPerformanceMetrics: true,
  },
};
```

## Drag Scenarios

### Scenario Types

#### Valid Scenarios
- **Description**: Resident should be successfully assigned to the activity
- **Expected**: `valid: true`
- **Examples**: Correct stats, low fatigue, available slots

#### Invalid Scenarios
- **Description**: Resident should be rejected due to validation rules
- **Expected**: `valid: false` with specific reason
- **Examples**: Wrong stats, missing requirements

#### Blocked Scenarios
- **Description**: Resident cannot be assigned due to blocking conditions
- **Expected**: `valid: false` with blocking reason
- **Examples**: High fatigue, already assigned elsewhere

#### Warning Scenarios
- **Description**: Assignment might work but with warnings
- **Expected**: `valid: false` with warning reason
- **Examples**: Activity at capacity, marginal stats

### Adding New Scenarios

To add a new drag scenario, extend the configuration:

```typescript
{
  id: 'my-custom-scenario',
  name: 'My Custom Scenario',
  type: 'valid', // or 'invalid', 'blocked', 'warning'
  description: 'Description of what this scenario tests',
  resident: {
    id: 'resident-123',
    name: 'Test Resident',
    status: 'idle',
    fatigue: 25,
    statTags: ['strength', 'agility'],
    stats: { strength: 60, agility: 55, endurance: 40 },
  },
  slot: {
    id: 'activity-slot-1',
    activityId: 'forest-work',
    name: 'Forest Work',
    maxCapacity: 3,
  },
  currentAssignments: {
    'activity-slot-2': 'other-resident-id',
  },
  expected: {
    valid: true,
    reason: 'Optional expected reason',
  },
  thresholds: {
    maxLatencyMs: 50,
    minSuccessRate: 1.0,
  },
  iterations: 10,
  enabled: true,
  priority: 1,
}
```

## Output Formats

### JSON Export

Complete diagnostics bundle with all test results, metrics, and metadata:

```json
{
  "id": "drag-diagnostics-1642694400000",
  "name": "Idle Village Drag Diagnostics",
  "timestamp": "2026-01-21T22:45:00.000Z",
  "duration": 1250,
  "config": { ... },
  "results": [ ... ],
  "summary": {
    "totalScenarios": 4,
    "successfulScenarios": 3,
    "failedScenarios": 1,
    "totalIterations": 40,
    "overallSuccessRate": 0.75,
    "averageLatencyMs": 28.5,
    "performanceScore": 82.5,
    "kpiAchieved": false
  },
  "telemetry": { ... }
}
```

### Markdown Export

Human-readable report with summary tables, latency charts, and detailed results:

```markdown
# Idle Village Drag Diagnostics

**Description**: Phase E drag/drop validation diagnostics for Idle Village
**Timestamp**: 2026-01-21T22:45:00.000Z
**Duration**: 1250ms
**Diagnostics ID**: drag-diagnostics-1642694400000

## Summary

- **Total Scenarios**: 4
- **Successful**: 3
- **Failed**: 1
- **Overall Success Rate**: 75.0%
- **Average Latency**: 28.5ms
- **Performance Score**: 82.5/100
- **KPI Achieved**: ❌ NO

## Latency Performance Chart

```
Latency Performance (ms)
--------------------------------------------------
Valid Basic Drop     |████████████████████████████████| 25.5ms  
Invalid Stat Mismatch|███████████████████               | 35.2ms  
Blocked by Fatigue  |███████████                        | 60.8ms  
Warning - Crew Limit|████████████████████████             | 30.1ms  
--------------------------------------------------
```

## Scenario Results

| Scenario | Type | Iterations | Success Rate | Avg Latency | Score | Status |
|----------|------|------------|-------------|------------|-------|--------|
| Valid Basic Drop | valid | 10 | 100.0% | 25.5ms | 95.0/100 | ✅ |
| Invalid Stat Mismatch | invalid | 10 | 100.0% | 35.2ms | 85.0/100 | ✅ |
| Blocked by Fatigue | blocked | 10 | 100.0% | 60.8ms | 45.0/100 | ❌ |
| Warning - Crew Limit | warning | 10 | 100.0% | 30.1ms | 80.0/100 | ✅ |
```

### CSV Export

Tabular data for spreadsheet analysis:

```csv
Scenario ID,Scenario Name,Type,Iterations,Successful,Failed,Success Rate,Avg Latency (ms),Min Latency (ms),Max Latency (ms),Performance Score,Status
valid-basic-drop,"Valid Basic Drop",valid,10,10,0,100.00,25.50,20.00,30.00,95.00,PASS
invalid-stat-mismatch,"Invalid Stat Mismatch",invalid,10,10,0,100.00,35.20,25.00,45.00,85.00,PASS
blocked-fatigue-limit,"Blocked by Fatigue",blocked,10,10,0,100.00,60.80,55.00,65.00,45.00,FAIL
warning-crew-limit,"Warning - Crew Limit",warning,10,10,0,100.00,30.10,25.00,35.00,80.00,PASS
```

## Performance Metrics

### Scoring System

Each scenario receives a performance score (0-100) based on three factors:

1. **Latency Score** (0-100): How quickly validation completes
   - Formula: `Math.max(0, 100 - (avgLatency / threshold) * 100)`
   - Default threshold: 50ms

2. **Success Score** (0-100): Consistency of successful iterations
   - Formula: `successRate * 100`

3. **Consistency Score** (0-100): Consistency of validation results
   - Formula: `validationConsistency * 100`

**Overall Score**: Average of the three scores

### KPI Achievement

The CLI achieves KPI targets when:
- **Overall Success Rate**: ≥ 80% of scenarios pass thresholds
- **Average Latency**: ≤ 50ms across all scenarios
- **Individual Scenarios**: Meet their specific thresholds

### Threshold Violations

When a scenario fails its thresholds, the violation is reported:

```
Threshold Violations:
- Latency 60.80ms > 50ms
- Success rate 75.0% < 100.0%
```

## Telemetry

The CLI emits telemetry events for monitoring and analytics:

### Event: `iv_drag_diagnostics_run`

```json
{
  "eventId": "evt-1642694400000-abc123",
  "timestamp": "2026-01-21T22:45:00.000Z",
  "metadata": {
    "bundleId": "drag-diagnostics-1642694400000",
    "scenarios": 4,
    "successRate": 75.0,
    "performanceScore": 82.5,
    "version": "1.0.0",
    "nodeVersion": "v20.19.6",
    "platform": "darwin",
    "executionMode": "parallel",
    "useDOMHarness": false
  }
}
```

## Integration

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Run Drag Diagnostics
  run: |
    node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts \
      --preset quick \
      --format json,markdown \
      --output ./drag-diagnostics
```

### npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:drag:diagnostics": "node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts --preset comprehensive",
    "test:drag:quick": "node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts --preset quick",
    "test:drag:performance": "node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts --preset performance"
  }
}
```

## Troubleshooting

### Common Issues

1. **Validation API Not Available**: Ensure `validateResidentDrop` is properly imported
2. **Timeout Issues**: Increase timeout values or reduce scenario complexity
3. **Performance Issues**: Disable verbose logging or reduce iterations
4. **DOM Harness Errors**: Ensure DOM environment is available when using `--dom-harness`

### Debug Mode

Use verbose logging for detailed troubleshooting:

```bash
node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts --verbose --dry-run
```

### Performance Tips

1. Use `quick` preset for fast validation
2. Enable parallel execution for multiple scenarios
3. Adjust `maxConcurrentOps` based on system resources
4. Use `performance` preset for regression testing

## Security Considerations

- Test data should not contain sensitive information
- Output files should be stored in secure locations
- DOM harness usage should be limited to trusted environments
- Telemetry events should not expose internal system details

## Maintenance

### Regular Tasks

1. Update scenarios as validation rules evolve
2. Adjust thresholds based on performance data
3. Add new scenario types as needed
4. Monitor telemetry for anomalies

### Version Updates

When updating the CLI:

1. Update version in configuration
2. Test with all presets and scenarios
3. Verify backward compatibility
4. Update documentation

## Examples

### Example 1: Quick CI/CD Validation

```bash
node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts \
  --preset quick \
  --format json \
  --output ./ci-diagnostics
```

### Example 2: Full Release Validation

```bash
node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts \
  --preset comprehensive \
  --verbose \
  --format json,markdown,csv \
  --output ./release-diagnostics
```

### Example 3: Performance Regression Testing

```bash
node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts \
  --preset performance \
  --iterations 100 \
  --parallel \
  --dom-harness
```

### Example 4: Custom Scenario Testing

```bash
node --import tsx/esm scripts/idleVillage/dragDiagnostics.ts \
  --scenarios valid-basic-drop,blocked-fatigue-limit \
  --iterations 50 \
  --format markdown \
  --verbose
```

## API Reference

### Configuration Schema

See `src/ui/idleVillage/diagnostics/dragDiagnosticsConfig.ts` for complete schema definitions.

### Validation API

The CLI uses the existing `validateResidentDrop` function from `locationDropValidators.ts`:

```typescript
function validateResidentDrop(params: ValidateResidentDropParams): DropValidationResult
```

### Result Interfaces

```typescript
interface DragTestResult {
  scenarioId: string;
  scenarioName: string;
  scenarioType: string;
  iterations: number;
  results: Array<{
    iteration: number;
    success: boolean;
    latencyMs: number;
    valid: boolean;
    reason?: string;
    error?: string;
  }>;
  summary: {
    totalIterations: number;
    successfulIterations: number;
    failedIterations: number;
    averageLatencyMs: number;
    minLatencyMs: number;
    maxLatencyMs: number;
    successRate: number;
    validationConsistency: number;
    performanceScore: number;
  };
  performance: {
    passedThresholds: boolean;
    latencyThresholdMs: number;
    successRateThreshold: number;
    thresholdViolations: string[];
  };
}
```

## Contributing

When contributing to the Drag Diagnostics CLI:

1. Follow the existing code style and patterns
2. Add comprehensive tests for new scenarios
3. Update documentation for any API changes
4. Test with all presets and configurations
5. Ensure KS-030 compliance for validation logic

## License

This CLI is part of the RPG Balancer project and follows the same licensing terms.
