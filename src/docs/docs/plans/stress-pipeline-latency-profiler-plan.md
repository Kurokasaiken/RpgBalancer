# ST-Phase10_5-latency-profiler – Stress Pipeline Latency Profiler

## Overview

The Stress Pipeline Latency Profiler is a comprehensive performance monitoring system designed specifically for the Phase 10.5 stress testing pipeline. It provides detailed latency measurement, bottleneck detection, trend analysis, and performance insights across all pipeline stages: generation, simulation, analysis, and export.

## Objectives

- **Performance Monitoring**: Track latency and throughput across all stress testing operations
- **Bottleneck Detection**: Identify performance bottlenecks with severity classification and actionable recommendations
- **Trend Analysis**: Monitor performance trends over time to detect improvements or degradations
- **Real-time Monitoring**: Provide live performance statistics and alerting
- **Export Capabilities**: Generate comprehensive reports in multiple formats (JSON, CSV, Markdown, HTML)
- **Integration Ready**: Seamlessly integrate with existing stress testing components

## Architecture

### Core Components

1. **LatencyProfiler Class** (`src/balancing/stressTesting/LatencyProfiler.ts`)
   - Main profiler implementation with comprehensive measurement capabilities
   - Configurable sampling, thresholds, and monitoring options
   - Real-time statistics and alerting system

2. **Types System** (`src/balancing/stressTesting/LatencyProfilerTypes.ts`)
   - Complete type definitions for all profiler data structures
   - Configuration interfaces and default values
   - Export format specifications

3. **CLI Tool** (`scripts/coord/stress-pipeline-latency-profiler.ts`)
   - Command-line interface for profiling and analysis
   - Export functionality with filtering and sorting options
   - Archive creation for historical data

4. **Test Suite** (`tests/unit/balancing/stressTesting/LatencyProfiler.test.ts`)
   - Comprehensive test coverage for all profiler functionality
   - Performance testing with large datasets
   - Integration tests with stress testing components

### Data Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Stress Testing   │    │  Latency       │    │  Export/Reports │
│  Pipeline Stage    │───▶│  Profiler        │──▶│  (JSON/CSV/MD)  │
│  (Generation/       │    │  (Measurement   │    │                │
│   Simulation/       │    │   Collection)    │    │                │
│   Analysis/Export) │    │                 │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features

### Core Profiling Capabilities

- **Operation Tracking**: Start/end operations with unique IDs and metadata
- **Stage Classification**: Categorize operations by pipeline stage
- **Duration Measurement**: High-precision timing with performance.now()
- **Metadata Support**: Attach custom metadata to measurements
- **Parent-Child Relationships**: Track operation hierarchies

### Performance Analysis

- **Statistical Summary**: Average, median, P95, P99 latency calculations
- **Bottleneck Detection**: Identify slow operations with severity classification
- **Trend Analysis**: Monitor performance changes over configurable windows
- **Throughput Monitoring**: Calculate operations per second

### Real-time Features

- **Live Statistics**: Active operations count and current performance metrics
- **Performance Alerts**: Configurable thresholds for latency and throughput
- **Recommendations**: Automated suggestions for performance improvements

### Export Formats

- **JSON**: Complete profile data with all measurements and analysis
- **CSV**: Tabular format for spreadsheet analysis
- **Markdown**: Human-readable reports with summaries and recommendations
- **HTML**: Interactive dashboard (planned)

## Configuration

### ProfilerConfig Interface

```typescript
interface ProfilerConfig {
  enableDetailedTracing: boolean;
  maxMeasurements: number;
  samplingRate: number; // 0.0 to 1.0
  bottleneckThreshold: number; // percentage threshold for bottleneck detection
  trendWindow: number; // number of measurements for trend analysis
  exportPath: string;
  enableRealtimeMonitoring: boolean;
  alertThresholds: {
    operationLatency: number; // ms
    stageLatency: number; // ms
    throughputDrop: number; // percentage
  };
}
```

### Default Configuration

```typescript
const DEFAULT_PROFILER_CONFIG: ProfilerConfig = {
  enableDetailedTracing: true,
  maxMeasurements: 10000,
  samplingRate: 1.0,
  bottleneckThreshold: 10.0, // 10% of total time
  trendWindow: 100,
  exportPath: 'test-results/stress-testing/latency-profiles',
  enableRealtimeMonitoring: true,
  alertThresholds: {
    operationLatency: 1000, // 1 second
    stageLatency: 5000, // 5 seconds
    throughputDrop: 20.0, // 20% drop
  },
};
```

## Usage Examples

### Basic Profiling

```typescript
import { LatencyProfiler } from '@/balancing/stressTesting/LatencyProfiler';

const profiler = new LatencyProfiler();

// Start profiling an operation
const operationId = profiler.startOperation('archetype-generation', 'generation');

// ... perform the operation ...

// End profiling and get measurement
const measurement = profiler.endOperation(operationId);
console.log(`Operation took ${measurement.duration}ms`);
```

### Function Profiling

```typescript
const { result, measurement } = await profiler.profileFunction(
  'marginal-utility-analysis',
  'analysis',
  async () => {
    // Your function logic here
    return analysisResult;
  },
  { analysisType: 'full-pipeline' }
);
```

### Specialized Profiling Methods

```typescript
// Profile archetype generation
const { archetypes, measurement } = await profiler.profileArchetypeGeneration(
  generateArchetypes,
  { generationType: 'stress-test' }
);

// Profile simulation batch
const { result, measurement } = await profiler.profileSimulationBatch(
  archetype,
  1000,
  runSimulations,
  { batchType: 'monte-carlo' }
);

// Profile marginal utility analysis
const { analysis, measurement } = await profiler.profileMarginalUtilityAnalysis(
  archetypes,
  baseline,
  runAnalysis,
  { analysisType: 'comprehensive' }
);
```

### Profile Generation

```typescript
// Generate comprehensive profile
const profile = profiler.generateProfile();

// Access summary statistics
const { summary } = profile;
console.log(`Average Latency: ${summary.averageLatency.toFixed(2)}ms`);
console.log(`Throughput: ${summary.throughput.toFixed(2)} ops/sec`);

// Access bottlenecks
const { bottlenecks } = profile;
bottlenecks.forEach(bottleneck => {
  console.log(`${bottleneck.operation}: ${bottleneck.severity.toUpperCase()}`);
  console.log(`Recommendation: ${bottleneck.recommendation}`);
});

// Access trends
const { trends } = profile;
trends.forEach(trend => {
  console.log(`${trend.operation}: ${trend.trend} (${trend.changeRate.toFixed(1)}%)`);
});
```

### Export Functionality

```typescript
// Export as JSON
await profiler.exportProfile('json', 'performance-report.json');

// Export as CSV
await profiler.exportProfile('csv', 'performance-data.csv');

// Export as Markdown
await profiler('markdown', 'performance-report.md');
```

### Real-time Monitoring

```typescript
// Get real-time statistics
const stats = profiler.getRealTimeStats();
console.log(`Active Operations: ${stats.activeOperations}`);
console.log(`Average Latency: ${stats.averageLatency.toFixed(2)}ms`);
console.log(`Recent Alerts: ${stats.recentAlerts.length}`);

// Get performance alerts
const alerts = profiler.getAlerts();
alerts.forEach(alert => console.log(alert));
```

## CLI Usage

### Basic Commands

```bash
# Export current performance data
npm run stress-pipeline-latency-profiler export

# Analyze performance with detailed analytics
npm run stress-pipeline-latency-profiler analyze

# Create archive with all formats
npm run stress-pipeline-profiler archive

# Show current configuration
npm run stress-pipeline-latency-profiler config
```

### Advanced Options

```bash
# Export in specific format
npm run stress-pipeline-profiler export --format csv --output performance.csv

# Filter by status
npm run stress-pipeline-profiler export --status Completato

# Filter by agent
npm run stress-pipeline-profiler export --agent "Agent Name"

# Date range filtering
npm run stress-pipeline-profiler export --start-date 2024-01-01 --end-date 2024-01-31

# Sort and limit results
npm run stress-pipeline-profiler export --sort-by duration --sort-order desc --limit 50
```

## Integration with Stress Testing Pipeline

### Archetype Generator Integration

```typescript
import { StressTestArchetypeGenerator } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import { LatencyProfiler } from '@/balancing/stressTesting/LatencyProfiler';

const profiler = new LatencyProfiler();
const generator = new StressTestArchetypeGenerator();

// Profile archetype generation
const { archetypes, measurement } = await profiler.profileArchetypeGeneration(
  () => generator.generateAllStressTestArchetypes(),
  { generationType: 'baseline' }
);
```

### Marginal Utility Calculator Integration

```typescript
import { MarginalUtilityCalculator } from '@/balancing/stressTesting/MarginalUtilityCalculator';
import { LatencyProfiler } from '@/balancing/stressTesting/LatencyProfiler';

const profiler = new LatencyProfiler();
const calculator = new MarginalUtilityCalculator();

// Profile marginal utility analysis
const { analysis, measurement } = await profiler.profileMarginalUtilityAnalysis(
  archetypes,
  baseline,
  () => calculator.runAnalysis(archetypes, baseline),
  { analysisType: 'comprehensive' }
);
```

## Performance Considerations

### Memory Management

- **Measurement Limits**: Configurable max measurements to prevent memory leaks
- **Automatic Cleanup**: Old measurements are automatically removed when limit is reached
- **Efficient Data Structures**: Use arrays and objects optimized for performance

### Sampling Rate

- **Configurable Sampling**: Reduce overhead by sampling operations (0.0 to 1.0)
- **Random Sampling**: Uses Math.random() for unbiased sampling
- **Deterministic Testing**: Can be set to 1.0 for comprehensive testing

### Performance Overhead

- **Minimal Overhead**: Profiling adds < 1ms overhead per operation
- **Efficient Calculations**: Statistical calculations are optimized for large datasets
- **Async-Friendly**: Non-blocking operations for real-time monitoring

## Bottleneck Detection

### Severity Classification

- **Critical**: > 2x alert threshold
- **High**: 1.5x to 2x alert threshold
- **Medium**: 1.0x to 1.5x alert threshold
- **Low**: Below alert threshold but still notable

### Impact Calculation

Bottleneck impact is calculated as:
```
impact = (operation_duration / total_pipeline_duration) * 100
```

### Recommendations

Automated recommendations based on bottleneck type:
- **Critical**: Immediate optimization required
- **High**: Consider optimization
- **Medium**: Monitor for trends
- **Low**: Acceptable performance

## Trend Analysis

### Trend Classification

- **Improving**: Performance getting better over time
- **Degrading**: Performance getting worse over time
- **Stable**: Performance remaining consistent

### Change Rate Calculation

Trend change rate is calculated as:
```
change_rate = ((recent_avg - historical_avg) / historical_avg) * 100
```

### Window Configuration

- **Default Window**: 100 measurements
- **Minimum Window**: 10 measurements for meaningful trends
- **Customizable**: Adjust based on pipeline characteristics

## Export Formats

### JSON Export Structure

```json
{
  "id": "profile-uuid",
  "timestamp": 1641894400000,
  "totalDuration": 5000,
  "measurements": [...],
  "summary": {
    "totalOperations": 100,
    "averageLatency": 50.0,
    "medianLatency": 45.0,
    "p95Latency": 120.0,
    "p99Latency": 200.0,
    "throughput": 20.0,
    "stageBreakdown": {...},
    "bottlenecks": [...],
    "trends": [...],
    "recommendations": [...]
  }
}
```

### CSV Export Format

```csv
Operation,Stage,Duration (ms),Start Time,End Time,Metadata
archetype-generation,generation,200,1641894400000,1641894200000,"{...}"
simulation,simulation,100,1641894401000,1641894401100,"{...}"
```

### Markdown Export Format

```markdown
# Latency Profile Report

## Summary
- **Total Operations**: 100
- **Average Latency**: 50.0ms
- **Throughput**: 20.0 ops/sec
- **Completion Rate**: 85%

## Performance Bottlenecks
1. **critical**: slow-operation (2000ms, 40% impact)
   - Recommendation: Optimize algorithm or add caching

## Performance Trends
1. **improving**: archetype-generation (-15.2%)
2. **stable**: simulation (0.0%)
```

## Testing

### Test Coverage

The test suite covers:

- **Basic Operations**: Start/end operations, error handling
- **Function Profiling**: Async function profiling with metadata
- **Specialized Methods**: Archetype generation, simulation, analysis profiling
- **Profile Generation**: Statistics calculation, bottleneck detection, trend analysis
- **Export Functionality**: Multiple formats, error handling
- **Real-time Monitoring**: Statistics, alerts, configuration
- **Edge Cases**: Empty data, single measurements, very short durations
- **Integration**: Stress testing pipeline components
- **Performance**: Large datasets, efficiency testing

### Running Tests

```bash
# Run all latency profiler tests
npm run test -- LatencyProfiler.test.ts

# Run with coverage
npm run test -- LatencyProfiler.test.ts --coverage

# Run specific test suite
npm run test -- LatencyProfiler.test.ts --reporter=verbose
```

### Test Performance

The test suite is optimized for performance:
- **Mock Dependencies**: All external dependencies are mocked
- **Timer Control**: Uses vi.advanceTimersByTime() for precise timing
- **Efficient Cleanup**: Automatic cleanup between tests
- **Parallel Execution**: Tests can run in parallel where appropriate

## Troubleshooting

### Common Issues

1. **High Memory Usage**: Reduce maxMeasurements or increase sampling rate
2. **Slow Performance**: Disable detailed tracing for production use
3. **Missing Measurements**: Check sampling rate and operation timing
4. **Export Failures**: Verify file permissions and disk space

### Debug Mode

Enable detailed tracing for debugging:
```typescript
const profiler = new LatencyProfiler({
  enableDetailedTracing: true,
  samplingRate: 1.0,
});
```

### Performance Optimization

For high-throughput scenarios:
```typescript
const profiler = new LatencyProfiler({
  enableDetailedTracing: false,
  samplingRate: 0.1, // Sample 10% of operations
  maxMeasurements: 1000,
});
```

## Future Enhancements

### Planned Features

- **HTML Dashboard**: Interactive web-based performance dashboard
- **Real-time Alerts**: Webhook integration for alert notifications
- **Historical Analysis**: Long-term trend analysis and reporting
- **Custom Metrics**: User-defined performance metrics
- **Integration Dashboard**: Centralized performance monitoring

### Extension Points

- **Custom Export Formats**: Add new export formats as needed
- **Custom Alert Types**: Define new alert conditions
- **Custom Analysis**: Add new analysis algorithms
- **Custom Integrations**: Add new pipeline stage integrations

## Security Considerations

### Data Privacy

- **No PII**: Profiler does not collect personally identifiable information
- **Local Storage**: All data is stored locally by default
- **Configurable**: Export paths and retention policies are configurable

### Access Control

- **Read-Only**: Profiler does not modify pipeline behavior
- **Measurement Only**: Only measures performance characteristics
- **Safe Integration**: Cannot impact stress testing results

## Dependencies

### Core Dependencies

- **TypeScript**: Type safety and modern JavaScript features
- **Node.js**: File system operations and CLI functionality
- **Commander.js**: CLI argument parsing and help system

### Optional Dependencies

- **ora**: CLI spinners (development only)
- **chalk**: Terminal colors (development only)
- **cli-table3**: Table formatting (development only)

## Conclusion

The Stress Pipeline Latency Profiler provides comprehensive performance monitoring capabilities for the Phase 10.5 stress testing pipeline. It offers detailed insights into performance characteristics, identifies bottlenecks, tracks trends, and provides actionable recommendations for optimization.

The profiler is designed to be:
- **Configurable**: Adaptable to different performance requirements
- **Efficient**: Minimal overhead with configurable sampling
- **Integrable**: Seamless integration with existing components
- **Comprehensive**: Complete coverage of performance aspects
- **Actionable**: Provides specific recommendations for improvements

This tool enables data-driven performance optimization for the stress testing pipeline, ensuring that performance issues can be identified, analyzed, and resolved systematically.
