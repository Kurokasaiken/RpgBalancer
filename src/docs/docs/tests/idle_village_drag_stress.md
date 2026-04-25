# Idle Village Drag Stress Testing Guide

## Overview

The Idle Village Drag Stress Test Suite provides comprehensive performance testing for drag & drop operations in the Idle Village interface. It simulates high-volume drag operations (1000+ operations) to validate drop feedback, scheduler performance, and UI responsiveness under Phase E requirements.

## Architecture

### Core Components

1. **DragStressConfig** - Configuration schema with Zod validation
2. **IdleVillageDragHarness** - Test execution engine with performance monitoring
3. **ResidentDragStress.test.ts** - Comprehensive test suite
4. **Telemetry Integration** - Performance metrics collection

### Performance Metrics

- **TTI (Time to Interactive)**: Measures UI responsiveness during stress
- **Drop Latency**: Time from drag start to drop completion
- **Memory Growth**: Heap size growth during test execution
- **CPU Usage**: Simulated CPU load based on operation duration
- **Throughput**: Operations per second
- **Error Rate**: Percentage of failed operations

## Drag Simulation API Changes (NP-019)

### Updated Playwright Integration

The drag simulation utility has been updated to use modern Playwright API without deprecated `elementHandle()`:

#### Key Changes
- **Removed**: `elementHandle()` usage (deprecated in newer Playwright versions)
- **Added**: Direct selector-based event dispatching
- **Enhanced**: Better selector resolution with fallback strategies
- **Improved**: More robust error handling for missing elements

#### New API Pattern
```typescript
// Old approach (deprecated)
const handle = await source.elementHandle();
await dispatchDragEventOnHandle(handle, 'dragstart', point);

// New approach (modern API)
const selector = await source.evaluate((el) => {
  if (el.id) return `#${el.id}`;
  if (el.getAttribute('data-testid')) 
    return `[data-testid="${el.getAttribute('data-testid')}"]`;
  return el.tagName.toLowerCase();
});
await dispatchDragEventOnElement(page, selector, 'dragstart', point);
```

### Test Instrumentation Enhancements

#### LocationCard Improvements
- **Added**: `aria-live="polite"` attribute for drop state changes
- **Added**: `data-bloom="active"` attribute on bloom overlay
- **Enhanced**: Better testability for visual state detection

#### Data Attributes for Testing
```typescript
// Main card attributes
data-state={dropState}           // 'idle' | 'valid' | 'invalid' | 'locked'
data-can-drop={canDropAttr}      // 'true' | 'false' | undefined
data-bloom-visible={bloomVisible ? 'true' : 'false'}

// Bloom overlay attributes
data-testid="location-card-bloom"
data-state="valid"
data-bloom="active"
```

### Test Environment Notes

#### Current Limitations
- Tests require proper village sandbox layout loading
- Synthetic drag events may not trigger all visual states
- Test environment setup needs proper initialization

#### Recommendations
1. Ensure test environment loads village sandbox before drag tests
2. Use both synthetic and native drag strategies for comprehensive coverage
3. Monitor visual state changes through data attributes
4. Add telemetry verification for drag operations

## Configuration

### Default Configuration

```typescript
const DEFAULT_DRAG_STRESS_CONFIG = {
  batchSize: 100,              // Number of batches to execute
  operationsPerBatch: 1000,     // Operations per batch
  cooldownMs: 50,              // Cooldown between operations
  maxConcurrentDrags: 5,       // Maximum concurrent drag operations
  enableTelemetry: true,       // Enable telemetry collection
  mockTimers: true,           // Use fake timers for deterministic testing
  virtualizationThreshold: 50, // Minimum items before enabling virtualization
  performanceThresholds: {
    maxTTI: 3000,              // Maximum Time to Interactive (ms)
    maxDropLatency: 100,       // Maximum drop feedback latency (ms)
    maxMemoryGrowth: 100,      // Maximum memory growth (MB)
    maxCPUUsage: 80,           // Maximum CPU usage percentage
  },
};
```

### Stress Test Presets

#### Smoke Test
Quick validation with minimal load:
```typescript
import { getStressPreset } from '@/ui/idleVillage/config/dragStressConfig';
const smokeConfig = getStressPreset('smoke');
// batchSize: 10, operationsPerBatch: 100, cooldownMs: 10
```

#### Standard Test
Balanced performance testing:
```typescript
const standardConfig = getStressPreset('standard');
// batchSize: 50, operationsPerBatch: 500, cooldownMs: 25
```

#### Heavy Load
Maximum stress testing:
```typescript
const heavyConfig = getStressPreset('heavy');
// batchSize: 200, operationsPerBatch: 2000, cooldownMs: 5
```

#### Memory Pressure
Focus on memory usage:
```typescript
const memoryConfig = getStressPreset('memory');
// batchSize: 100, operationsPerBatch: 1500, cooldownMs: 0
```

#### Latency Focus
Focus on response times:
```typescript
const latencyConfig = getStressPreset('latency');
// batchSize: 25, operationsPerBatch: 200, cooldownMs: 100
```

## Usage

### Running Tests

#### Basic Stress Test
```bash
npm run test:unit -- tests/stress/idleVillage/ResidentDragStress.test.ts
```

#### With Custom Configuration
```typescript
import { runDragStressTest } from '@/tests/utils/idleVillageDragHarness';

const customConfig = {
  batchSize: 50,
  operationsPerBatch: 500,
  cooldownMs: 25,
  performanceThresholds: {
    maxTTI: 2000,
    maxDropLatency: 80,
    maxMemoryGrowth: 80,
    maxCPUUsage: 75,
  },
};

const results = await runDragStressTest(customConfig);
console.log('Statistics:', results.statistics);
console.log('CSV Report:', results.csvReport);
```

### Programmatic Usage

#### Direct Harness Usage
```typescript
import { IdleVillageDragHarness } from '@/tests/utils/idleVillageDragHarness';

const harness = new IdleVillageDragHarness({
  batchSize: 25,
  operationsPerBatch: 200,
  enableTelemetry: true,
});

try {
  const metrics = await harness.executeStressTest();
  const statistics = harness.calculateStatistics();
  const csvReport = harness.exportToCSV();
  
  console.log(`Completed ${statistics.totalOperations} operations`);
  console.log(`Average latency: ${statistics.averageLatency.toFixed(2)}ms`);
  console.log(`Error rate: ${statistics.errorRate.toFixed(2)}%`);
} finally {
  harness.cleanup();
}
```

#### Performance Monitoring
```typescript
// Check if thresholds are exceeded during test
const config = {
  performanceThresholds: {
    maxTTI: 1000,        // Fail if TTI > 1s
    maxDropLatency: 50,   // Fail if drop latency > 50ms
    maxMemoryGrowth: 50,  // Fail if memory growth > 50MB
    maxCPUUsage: 90,      // Fail if CPU usage > 90%
  },
};

const harness = new IdleVillageDragHarness(config);

try {
  await harness.executeStressTest();
  console.log('✅ All performance thresholds passed');
} catch (error) {
  console.error('❌ Performance threshold exceeded:', error.message);
}
```

## KPI and Metrics

### Key Performance Indicators

| Metric | Target | Description |
|--------|--------|-------------|
| TTI | < 3000ms | Time to Interactive during stress |
| Drop Latency | < 100ms | Average drag-to-drop time |
| Memory Growth | < 100MB | Heap size growth during test |
| CPU Usage | < 80% | Simulated CPU load |
| Throughput | > 10 ops/s | Operations per second |
| Error Rate | < 1% | Failed operations percentage |

### Performance Report Example

```typescript
const results = await runDragStressTest();
console.log(results.statistics);
/*
{
  totalOperations: 1000,
  averageLatency: 45.2,
  maxLatency: 89.7,
  errorRate: 0.1,
  throughput: 22.1
}
*/
```

### CSV Export

The stress test exports detailed metrics in CSV format:

```csv
batchIndex,operationIndex,operationType,timestamp,duration,memoryUsage,cpuUsage,error
0,0,drag_start,1640995200000,12.5,45.2,15.3,
0,0,drag_over,1640995200012,3.2,45.2,15.3,
0,0,drop,1640995200015,8.7,45.2,15.3,
...
```

## Telemetry Integration

### Events Collected

- `idle_drag_stress_start`: Test execution started
- `idle_drag_stress_batch_complete`: Batch completed
- `idle_drag_stress_operation`: Individual operation
- `idle_drag_stress_complete`: Test completed
- `idle_drag_stress_error`: Performance threshold exceeded

### Telemetry Payload

```typescript
interface DragStressTelemetryEvent {
  type: 'idle_drag_stress_operation';
  payload: {
    batchIndex: number;
    operationIndex: number;
    operationType: 'drag_start' | 'drag_over' | 'drop';
    timestamp: number;
    duration: number;
    memoryUsage?: number;
    cpuUsage?: number;
    error?: string;
  };
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Drag Stress Tests
  run: |
    npm run test:unit -- tests/stress/idleVillage/ResidentDragStress.test.ts -- --reporter=json
    
- name: Upload Stress Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: drag-stress-results
    path: |
      test-results/np-014-*.log
      stress-test-results.json
```

### Performance Regression Detection

```typescript
// In your test setup
const BASELINE_PERFORMANCE = {
  averageLatency: 45.0,
  maxLatency: 85.0,
  throughput: 20.0,
};

const results = await runDragStressTest();
const stats = results.statistics;

// Check for regressions
if (stats.averageLatency > BASELINE_PERFORMANCE.averageLatency * 1.2) {
  throw new Error(`Latency regression: ${stats.averageLatency} > ${BASELINE_PERFORMANCE.averageLatency * 1.2}`);
}
```

## Troubleshooting

### Common Issues

#### Test Timeout
```bash
# Increase test timeout
vitest --testTimeout=30000 tests/stress/idleVillage/ResidentDragStress.test.ts
```

#### Memory Threshold Exceeded
```typescript
// Increase memory threshold or reduce batch size
const config = {
  performanceThresholds: {
    maxMemoryGrowth: 200, // Increase from 100MB
  },
  batchSize: 50, // Reduce from 100
};
```

#### jsdom Limitations
The stress test uses mock DOM elements to avoid jsdom limitations:

```typescript
// Mock elements are created automatically
const residentElement = document.createElement('div');
residentElement.setAttribute('data-testid', `resident-${residentId}`);
```

### Performance Tips

1. **Use Mock Timers**: Set `mockTimers: true` for deterministic testing
2. **Adjust Cooldown**: Increase `cooldownMs` to reduce CPU pressure
3. **Batch Size**: Start with smaller batches and scale up
4. **Memory Monitoring**: Watch memory usage during long-running tests
5. **Virtualization**: Enable virtualization for large resident lists

## Advanced Usage

### Custom Performance Monitors

```typescript
class CustomDragHarness extends IdleVillageDragHarness {
  protected async checkPerformanceThresholds(): Promise<void> {
    // Custom monitoring logic
    const customMetrics = this.collectCustomMetrics();
    
    if (customMetrics.customLatency > this.config.performanceThresholds.maxDropLatency) {
      throw new Error(`Custom latency threshold exceeded`);
    }
    
    // Call parent implementation
    await super.checkPerformanceThresholds();
  }
}
```

### Integration with Existing Tests

```typescript
// Add to existing test suites
import { runDragStressTest } from '@/tests/utils/idleVillageDragHarness';

describe('Idle Village Performance', () => {
  it('should handle drag stress', async () => {
    const results = await runDragStressTest({
      batchSize: 10,
      operationsPerBatch: 100,
    });
    
    expect(results.statistics.errorRate).toBeLessThan(1);
    expect(results.statistics.averageLatency).toBeLessThan(100);
  });
});
```

## File Structure

```
src/
├── tests/utils/
│   └── idleVillageDragHarness.ts          # Main harness implementation
├── ui/idleVillage/config/
│   └── dragStressConfig.ts                # Configuration schema
tests/
├── stress/idleVillage/
│   └── ResidentDragStress.test.ts          # Test suite
docs/
└── tests/
    └── idle_village_drag_stress.md       # This documentation
test-results/
└── np-014-idle-drag-stress-<date>.log    # Evidence logs
```

## Evidence and Reporting

### Evidence Log Format

```markdown
# NP-014 – Idle Village Resident Drag Stress Test Suite
## Evidence Log – 2026-01-16

### Status: COMPLETATO

### Safeguard Results
- Lint: ✅ PASS
- Test: ✅ PASS
- Build: ✅ PASS
- Kanban Lint: ✅ PASS

### Performance KPIs
- Total Operations: 1000
- Average TTI: 2450ms
- Average Drop Latency: 42.3ms
- Memory Growth: 67.2MB
- CPU Usage: 72%
- Throughput: 18.5 ops/s
- Error Rate: 0.1%

### ASCII Performance Chart
TTI:    ████████████████████████████████████████ 2450ms (Target: <3000ms)
Latency: ████████████████████████████████████ 42ms (Target: <100ms)
Memory: ████████████████████████████ 67MB (Target: <100MB)
CPU:     ████████████████████████████████ 72% (Target: <80%)
```

### CSV Report Attachment

The stress test generates a detailed CSV report with all operation metrics, which can be imported into spreadsheet applications for further analysis.

## Best Practices

1. **Start Small**: Begin with smoke tests before running heavy load tests
2. **Monitor Resources**: Keep an eye on memory and CPU during execution
3. **Use Baselines**: Establish performance baselines for regression detection
4. **Automate Reporting**: Integrate with CI/CD for continuous monitoring
5. **Document Results**: Keep evidence logs for performance tracking
6. **Test Different Scenarios**: Test various configurations and edge cases
7. **Handle Timeouts**: Set appropriate timeouts for long-running tests
8. **Clean Resources**: Always cleanup test resources to avoid memory leaks

## Future Enhancements

- **Real Device Testing**: Extend to mobile device stress testing
- **Network Simulation**: Add network latency simulation
- **Visual Regression**: Add visual diff comparison during stress
- **Multi-tab Testing**: Test performance with multiple browser tabs
- **Progressive Loading**: Test with progressive resident loading
- **Accessibility Testing**: Include accessibility metrics in stress tests
