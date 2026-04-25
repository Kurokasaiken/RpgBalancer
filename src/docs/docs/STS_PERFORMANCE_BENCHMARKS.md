# STS Performance Benchmark Documentation

## Overview

The STS Performance Benchmark system provides comprehensive performance testing for the Slay the Spire (STS) simulator engine. This system includes both a Node.js CLI benchmark harness and a Vitest benchmark suite for automated performance testing.

## Components

### 1. Benchmark Harness (`scripts/stsTelemetry/benchmarkSimulator.ts`)

A Node.js CLI tool that runs seeded simulations and measures:
- **Turn Processing Time**: Average time per turn, p95/p99 latencies
- **Memory Usage**: Peak, average, and final memory consumption
- **First Input Latency**: Time to first user interaction
- **Throughput**: Operations per second

#### Usage

```bash
# Run default benchmark
npx ts-node scripts/stsTelemetry/benchmarkSimulator.ts

# Run with custom configuration
npx ts-node scripts/stsTelemetry/benchmarkSimulator.ts --iterations 200 --deck starter_deck --enemy tutorial

# Run with memory profiling
npx ts-node scripts/stsTelemetry/benchmarkSimulator.ts --memory-profiling

# Run with custom output directory
npx ts-node scripts/stsTelemetry/benchmarkSimulator.ts --output-dir custom-results
```

### 2. Vitest Benchmark Suite (`tests/perf/stsSimulator.bench.ts`)

Automated performance benchmarks using Vitest's `bench` function. Tests cover:
- Small, medium, and large datasets
- Memory usage under sustained load
- High-frequency operation throughput
- First input latency measurement
- Stress testing with maximum load
- Regression baseline comparison

#### Running Benchmarks

```bash
# Run all performance benchmarks
npm run test -- tests/perf/stsSimulator.bench.ts

# Run specific benchmark
npm run test -- tests/perf/stsSimulator.bench.ts --reporter=verbose

# Run with coverage
npm run test -- tests/perf/stsSimulator.bench.ts --coverage
```

## Configuration

### Default Benchmark Configuration

```typescript
const DEFAULT_CONFIG = {
  iterations: 100,              // Number of simulation runs
  seed: 42,                     // Random seed for reproducibility
  turnsPerRun: 50,              // Maximum turns per simulation
  warmupIterations: 10,         // Warmup runs (not measured)
  outputDir: 'test-results/sts-benchmark',
  enableMemoryProfiling: true,
  enableTelemetryProfiling: true,
  deckId: 'starter_deck',       // Deck preset to use
  enemyId: 'tutorial',          // Enemy profile to use
  thresholds: {
    maxTurnTimeMs: 100,         // Max allowed turn time
    maxFirstInputLatencyMs: 50, // Max allowed first input latency
    maxMemoryUsageMB: 200,      // Max allowed memory usage
    minThroughputOpsPerSec: 10,  // Min required throughput
  },
};
```

### Available Deck Presets

- `starter_deck`: Basic starting deck
- More decks can be added to `src/balancing/config/archmage/decks.ts`

### Available Enemy Profiles

- `tutorial`: Tutorial enemy (low difficulty)
- `ironclad`: Ironclad enemy (medium difficulty)
- `silent`: Silent enemy (medium difficulty)
- `guardian`: Guardian enemy (high difficulty)
- More profiles can be added to `src/balancing/config/archmage/enemies/defaultEnemies.ts`

## Performance Thresholds

### Current Baseline (as of implementation)

| Metric | Threshold | Description |
|--------|-----------|-------------|
| Turn Time (avg) | 100ms | Average time per simulation turn |
| Turn Time (p95) | 150ms | 95th percentile turn time |
| First Input Latency | 50ms | Time to first user interaction |
| Memory Usage (peak) | 200MB | Maximum memory consumption |
| Throughput | 10 ops/sec | Minimum operations per second |

### Updating Thresholds

1. Run benchmarks on target hardware
2. Review results in `test-results/sts-benchmark/`
3. Update thresholds in `scripts/stsTelemetry/benchmarkSimulator.ts`
4. Commit changes with rationale

## Output Files

### Benchmark Harness Output

```
test-results/sts-benchmark/
├── benchmark-2026-01-11T14-30-00.json    # Full benchmark results
├── baseline-2026-01-11T14-30-00.json     # Baseline for regression
└── summary-2026-01-11T14-30-00.txt        # Human-readable summary
```

### Result Structure

```typescript
interface BenchmarkResults {
  config: BenchmarkConfig;
  summary: {
    avgTurnTimeMs: number;
    p95TurnTimeMs: number;
    p99TurnTimeMs: number;
    firstInputLatencyMs: number;
    throughputOpsPerSec: number;
    memoryUsageMB: {
      peak: number;
      average: number;
      final: number;
    };
  };
  violations: PerformanceViolation[];
  duration: number;
  timestamp: string;
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: STS Performance Tests
on: [push, pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run STS benchmarks
        run: npm run test -- tests/perf/stsSimulator.bench.ts
      
      - name: Run benchmark harness
        run: npx ts-node scripts/stsTelemetry/benchmarkSimulator.ts
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: test-results/sts-benchmark/
```

## Performance Analysis

### Key Metrics

1. **Turn Processing Time**
   - Measures simulation engine efficiency
   - Critical for responsive gameplay
   - Target: < 100ms average

2. **Memory Usage**
   - Indicates memory leaks or inefficient allocation
   - Important for long-running sessions
   - Target: < 200MB peak

3. **First Input Latency**
   - Time from start to first user action
   - Affects perceived performance
   - Target: < 50ms

4. **Throughput**
   - Operations per second the engine can handle
   - Measures overall capacity
   - Target: > 10 ops/sec

### Performance Regression Detection

The system automatically detects regressions by comparing current results against saved baselines:

```typescript
interface PerformanceViolation {
  metric: string;
  threshold: number;
  actual: number;
  severity: 'warning' | 'error';
  message: string;
}
```

## Troubleshooting

### Common Issues

1. **High Turn Times**
   - Check deck complexity (card count, effects)
   - Verify enemy intent complexity
   - Review simulation algorithm efficiency

2. **Memory Leaks**
   - Enable memory profiling: `--memory-profiling`
   - Check for circular references in simulation state
   - Verify proper cleanup in simulation engine

3. **Slow First Input**
   - Check initialization overhead
   - Verify configuration loading performance
   - Review deck/enemy setup time

4. **Benchmark Failures**
   - Ensure all required configurations exist
   - Check TypeScript compilation
   - Verify import paths are correct

### Debug Mode

Run with verbose logging:

```bash
DEBUG=sts:* npx ts-node scripts/stsTelemetry/benchmarkSimulator.ts --verbose
```

## Best Practices

1. **Consistent Environment**: Run benchmarks on consistent hardware
2. **Multiple Runs**: Average results across multiple benchmark runs
3. **Baseline Management**: Regularly update baselines after improvements
4. **Threshold Tuning**: Adjust thresholds based on target hardware
5. **Profiling**: Use memory profiling to identify optimization opportunities

## Future Enhancements

- [ ] Visual performance dashboard
- [ ] Automated regression alerts
- [ ] Historical performance tracking
- [ ] Multi-threaded simulation testing
- [ ] Browser-based performance testing
- [ ] Performance profiling integration

## Related Files

- `scripts/stsTelemetry/benchmarkSimulator.ts` - Main benchmark harness
- `tests/perf/stsSimulator.bench.ts` - Vitest benchmark suite
- `src/balancing/hooks/archmage/STSNumericSimulatorEngine.ts` - Simulation engine
- `src/balancing/config/archmage/` - Deck and enemy configurations
- `src/balancing/config/sts/combatantsConfig.ts` - Combatant configuration
