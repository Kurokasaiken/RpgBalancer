# Analytics Memory Leak Guard Documentation

## Overview

The Analytics Memory Leak Guard is a comprehensive monitoring system designed to detect memory leaks in telemetry pipelines and Node.js applications. It provides real-time memory monitoring, trend analysis, and automated leak detection with configurable thresholds and alerting.

## Features

### Core Capabilities

- **Real-time Memory Monitoring**: Continuous sampling of memory usage with configurable intervals
- **Baseline Establishment**: Automatic baseline calculation for trend comparison
- **Trend Analysis**: Linear regression and statistical analysis of memory growth patterns
- **Leak Detection**: Multi-criteria detection based on thresholds and growth rates
- **Telemetry Integration**: Automatic event emission for detected leaks
- **CLI Sweep Tool**: Command-line interface for periodic memory analysis
- **Comprehensive Testing**: Full unit test coverage with mock scenarios

### Detection Criteria

1. **Absolute Threshold**: Memory usage exceeds configured limit (default: 100MB)
2. **Growth Rate Threshold**: Memory growth rate exceeds percentage threshold (default: 0.5%)
3. **Trend Analysis**: Consistent increasing trend with significant slope
4. **Statistical Validation**: R-squared values for trend quality assessment

## Architecture

### Components

```
src/analytics/memory/
├── memoryLeakGuard.ts          # Core guard class and interfaces
├── types.ts                     # Type definitions (if separated)
└── utils.ts                     # Utility functions (if separated)

scripts/analytics/
├── memoryLeakSweep.ts           # CLI sweep tool
└── memoryLeakMonitor.ts         # Background monitor (optional)

tests/unit/analytics/
├── MemoryLeakGuard.test.ts      # Unit tests
└── MemoryLeakSweep.test.ts      # CLI tests (optional)
```

### Data Flow

```
Process.memoryUsage() → MemorySnapshot → MemoryTrend → MemoryLeakDetection → Telemetry Event
```

## Configuration

### MemoryLeakGuardConfig

```typescript
interface MemoryLeakGuardConfig {
  thresholdMB: number;           // Memory threshold in MB (10-1024)
  samplingIntervalMs: number;    // Sampling interval (1000-300000ms)
  trendDurationMs: number;        // Trend analysis duration (30000-3600000ms)
  maxSamples: number;             // Maximum samples to maintain (10-1000)
  growthRateThreshold: number;   // Growth rate threshold (0.1-5.0)
  enableBaseline: boolean;        // Enable automatic baseline
  baselineDurationMs: number;    // Baseline establishment duration (10000-300000ms)
  alertCooldownMs: number;       // Alert cooldown period (60000-3600000ms)
  verbose: boolean;               // Enable detailed logging
  storageKey: string;            // Storage key for persistence
}
```

### Default Configuration

```typescript
const defaultConfig: MemoryLeakGuardConfig = {
  thresholdMB: 100,
  samplingIntervalMs: 5000,
  trendDurationMs: 300000,
  maxSamples: 100,
  growthRateThreshold: 0.5,
  enableBaseline: true,
  baselineDurationMs: 30000,
  alertCooldownMs: 300000,
  verbose: false,
  storageKey: 'memory-leak-guard-data',
};
```

## Usage

### Basic Usage

```typescript
import { createMemoryLeakGuard } from '@/analytics/memory/memoryLeakGuard';

// Create guard with default configuration
const guard = createMemoryLeakGuard();

// Start monitoring
guard.start();

// Check current state
const state = guard.getState();
console.log('Active:', state.active);
console.log('Samples:', state.totalSamples);

// Get current snapshot
const snapshot = guard.getCurrentSnapshot();
console.log('Memory usage:', snapshot?.memoryMB, 'MB');

// Stop monitoring
guard.stop();
```

### Custom Configuration

```typescript
import { createMemoryLeakGuard } from '@/analytics/memory/memoryLeakGuard';

const guard = createMemoryLeakGuard({
  thresholdMB: 200,              // 200MB threshold
  samplingIntervalMs: 2000,       // Sample every 2 seconds
  growthRateThreshold: 0.3,        // 30% growth rate threshold
  verbose: true,                   // Enable logging
  alertCooldownMs: 60000,          // 1 minute cooldown
});

guard.start();
```

### Advanced Usage

```typescript
import { MemoryLeakGuard } from '@/analytics/memory/memoryLeakGuard';

class TelemetryService {
  private memoryGuard: MemoryLeakGuard;
  
  constructor() {
    this.memoryGuard = new MemoryLeakGuard({
      thresholdMB: 150,
      samplingIntervalMs: 3000,
      verbose: true,
    });
    
    // Start monitoring when service initializes
    this.memoryGuard.start();
  }
  
  getMemoryStats() {
    const trend = this.memoryGuard.getTrendAnalysis();
    const detection = this.memoryGuard.getState().lastDetection;
    
    return {
      currentMemory: this.memoryGuard.getCurrentSnapshot(),
      trend,
      lastDetection: detection,
      isHealthy: !detection?.detected,
    };
  }
  
  shutdown() {
    this.memoryGuard.stop();
  }
}
```

## CLI Tool

### Memory Leak Sweep

The CLI tool performs periodic memory analysis and generates reports in JSON or Markdown format.

#### Basic Usage

```bash
# Run 60-second sweep with default settings
npx tsx scripts/analytics/memoryLeakSweep.ts -o memory-sweep-report.md

# Run with custom configuration
npx tsx scripts/analytics/memoryLeakSweep.ts \
  -o memory-sweep-report.json \
  -f json \
  -d 120000 \
  -t 200 \
  -i 2000 \
  -g 0.3 \
  --verbose
```

#### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Output file path | Required |
| `-f, --format <format>` | Output format (json/markdown) | markdown |
| `-d, --duration <ms>` | Sweep duration in milliseconds | 60000 |
| `-t, --threshold <mb>` | Memory threshold in MB | 100 |
| `-i, --interval <ms>` | Sampling interval in milliseconds | 5000 |
| `-g, --growth-rate <rate>` | Growth rate threshold (0.0-1.0) | 0.5 |
| `-v, --verbose` | Enable verbose output | false |
| `--dry-run` | Show what would be exported without writing files | false |
| `--exit-code` | Set exit code based on detection results | false |

#### Exit Codes

- **0**: No memory leaks detected
- **1**: Warning level leak detected or high memory growth
- **2**: Critical level leak detected

#### Integration with CI/CD

```bash
#!/bin/bash
# CI/CD memory leak check

echo "Running memory leak sweep..."
npx tsx scripts/analytics/memoryLeakSweep.ts \
  -o ci-memory-report.json \
  -f json \
  -d 300000 \
  -t 150 \
  --exit-code \
  --verbose

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ No memory leaks detected"
elif [ $EXIT_CODE -eq 1 ]; then
  echo "⚠️  Warning: Potential memory issues detected"
else
  echo "❌ Critical: Memory leak detected"
  exit 1
fi
```

## Data Structures

### MemorySnapshot

```typescript
interface MemorySnapshot {
  timestamp: number;        // When snapshot was taken
  memoryMB: number;         // RSS memory in MB
  heapSizeMB: number;       // Heap used in MB
  heapObjects: number;      // Number of heap objects
  availableMB: number;      // Available heap memory in MB
  pid: number;              // Process ID
  nodeVersion: string;      // Node.js version
  platform: string;        // Platform information
}
```

### MemoryTrend

```typescript
interface MemoryTrend {
  current: MemorySnapshot;  // Current memory state
  baseline: MemorySnapshot; // Baseline memory state
  growthRate: number;       // Growth rate (percentage)
  direction: 'increasing' | 'decreasing' | 'stable';
  elapsedMs: number;        // Time since baseline
  sampleCount: number;      // Samples used for analysis
  slope: number;            // Linear regression slope (MB/sec)
  rSquared: number;         // R-squared value for trend quality
}
```

### MemoryLeakDetection

```typescript
interface MemoryLeakDetection {
  detected: boolean;        // Whether leak was detected
  trend: MemoryTrend;       // Current trend analysis
  alertLevel: 'none' | 'warning' | 'critical';
  timestamp: number;        // Detection timestamp
  reason: string;           // Detection reason
  recommendations: string[]; // Actionable recommendations
  previousDetections: number[]; // Previous detection timestamps
  growthRate: number;       // Growth rate for quick access
}
```

## Telemetry Integration

### Event Emission

The guard automatically emits telemetry events when memory leaks are detected:

```typescript
interface MemoryLeakDetectedTelemetryPayload {
  eventType: 'analytics_memory_leak_detected';
  timestamp: number;
  alertLevel: 'warning' | 'critical';
  currentMemoryMB: number;
  baselineMemoryMB: number;
  growthRate: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  sampleCount: number;
  processInfo: {
    pid: number;
    nodeVersion: string;
    platform: string;
  };
  reason: string;
  recommendations: string[];
  guardConfig: {
    thresholdMB: number;
    samplingIntervalMs: number;
    trendDurationMs: number;
    growthRateThreshold: number;
  };
}
```

### Telemetry Routing

Events are routed to appropriate diagnostics channels based on event type:

- `analytics_*` → Stress diagnostics channel
- `landing_*` → Landing diagnostics channel
- `sts_*` → STS diagnostics channel
- `quest_*` → Quest diagnostics channel
- `fatigue_*` → Fatigue diagnostics channel

## Testing

### Unit Tests

The comprehensive test suite covers:

- **Initialization**: Guard creation and configuration
- **Memory Monitoring**: Snapshot collection and baseline establishment
- **Trend Analysis**: Increasing/decreasing/stable trend detection
- **Leak Detection**: Threshold and growth rate detection
- **Telemetry**: Event emission and payload validation
- **Configuration**: Updates and validation
- **State Management**: Reset, export, and import functionality
- **Edge Cases**: Zero memory, large values, multiple cycles

### Running Tests

```bash
# Run memory leak guard tests
npm run test -- tests/unit/analytics/MemoryLeakGuard.test.ts

# Run with coverage
npm run test -- tests/unit/analytics/MemoryLeakGuard.test.ts --coverage

# Run all analytics tests
npm run test -- tests/unit/analytics/
```

### Mock Scenarios

Tests use comprehensive mocking for:

- `process.memoryUsage()`: Simulate various memory states
- `Performance API`: Mock performance observers
- `Telemetry`: Mock event emission
- `Timers**: Control timing for deterministic tests

## Performance Considerations

### Sampling Impact

- **Memory Overhead**: < 1MB per 1000 samples
- **CPU Overhead**: < 5% during active monitoring
- **Storage Impact**: Configurable sample limits prevent memory bloat

### Optimization Strategies

1. **Sampling Interval**: Balance between detection accuracy and performance
2. **Sample Limits**: Prevent unbounded memory growth
3. **Baseline Caching**: Avoid repeated baseline calculations
4. **Alert Cooldown**: Prevent excessive telemetry emissions

### Recommended Settings

| Environment | Threshold | Interval | Duration |
|-------------|-----------|----------|----------|
| Development | 200MB | 5000ms | 5min |
| Staging | 150MB | 3000ms | 10min |
| Production | 100MB | 10000ms | 30min |

## Troubleshooting

### Common Issues

#### High False Positives

**Symptoms**: Frequent leak detections without actual memory issues

**Solutions**:
- Increase `growthRateThreshold` (e.g., from 0.5 to 1.0)
- Increase `baselineDurationMs` for more stable baseline
- Adjust `alertCooldownMs` to reduce alert frequency

#### Poor Detection Sensitivity

**Symptoms**: Missing actual memory leaks

**Solutions**:
- Decrease `growthRateThreshold` (e.g., from 0.5 to 0.2)
- Decrease `thresholdMB` for lower absolute threshold
- Decrease `baselineDurationMs` for faster baseline establishment

#### Performance Impact

**Symptoms**: Application slowdown during monitoring

**Solutions**:
- Increase `samplingIntervalMs` to reduce frequency
- Decrease `maxSamples` to reduce memory usage
- Disable `verbose` logging in production

### Debug Mode

Enable verbose logging for detailed diagnostics:

```typescript
const guard = createMemoryLeakGuard({
  verbose: true,
  samplingIntervalMs: 1000,
});

guard.start();
```

### Memory Leak Investigation

When a leak is detected:

1. **Review Detection Reason**: Check why the leak was triggered
2. **Analyze Trend**: Look at growth rate and direction
3. **Check Recommendations**: Follow suggested actions
4. **Monitor Continuously**: Use CLI for extended monitoring
5. **Profile Application**: Use Node.js profiler for detailed analysis

## Integration Examples

### Express.js Middleware

```typescript
import { createMemoryLeakGuard } from '@/analytics/memory/memoryLeakGuard';

const memoryGuard = createMemoryLeakGuard({
  thresholdMB: 200,
  samplingIntervalMs: 10000,
  verbose: process.env.NODE_ENV === 'development',
});

// Start monitoring when server starts
memoryGuard.start();

// Middleware to expose memory stats
app.get('/health/memory', (req, res) => {
  const snapshot = memoryGuard.getCurrentSnapshot();
  const trend = memoryGuard.getTrendAnalysis();
  const detection = memoryGuard.getState().lastDetection;
  
  res.json({
    status: 'ok',
    memory: {
      current: snapshot?.memoryMB || 0,
      trend: trend ? {
        direction: trend.direction,
        growthRate: trend.growthRate,
      } : null,
      detection: detection ? {
        detected: detection.detected,
        alertLevel: detection.alertLevel,
        reason: detection.reason,
      } : null,
    },
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  memoryGuard.stop();
  process.exit(0);
});
```

### Background Worker

```typescript
import { createMemoryLeakGuard } from '@/analytics/memory/memoryLeakGuard';

class WorkerMonitor {
  private guard: MemoryLeakGuard;
  
  constructor() {
    this.guard = createMemoryLeakGuard({
      thresholdMB: 500,  // Higher threshold for workers
      samplingIntervalMs: 30000,  // Less frequent sampling
      verbose: false,
    });
  }
  
  start() {
    this.guard.start();
    
    // Set up periodic reporting
    setInterval(() => {
      const state = this.guard.getState();
      if (state.lastDetection?.detected) {
        console.warn('Worker memory leak detected:', state.lastDetection.reason);
      }
    }, 60000); // Check every minute
  }
  
  stop() {
    this.guard.stop();
  }
}
```

### Microservice Integration

```typescript
import { createMemoryLeakGuard } from '@/analytics/memory/memoryLeakGuard';

class ServiceHealthMonitor {
  private guards: Map<string, MemoryLeakGuard> = new Map();
  
  registerService(serviceName: string, config?: Partial<MemoryLeakGuardConfig>) {
    const guard = createMemoryLeakGuard({
      thresholdMB: 100,
      samplingIntervalMs: 5000,
      verbose: true,
      ...config,
    });
    
    this.guards.set(serviceName, guard);
    guard.start();
    
    return guard;
  }
  
  getServiceHealth(serviceName: string) {
    const guard = this.guards.get(serviceName);
    if (!guard) return null;
    
    const state = guard.getState();
    const trend = guard.getTrendAnalysis();
    
    return {
      healthy: !state.lastDetection?.detected,
      memory: guard.getCurrentSnapshot(),
      trend,
      lastDetection: state.lastDetection,
    };
  }
  
  shutdown() {
    for (const [name, guard] of this.guards) {
      guard.stop();
      console.log(`Stopped monitoring for service: ${name}`);
    }
    this.guards.clear();
  }
}
```

## Best Practices

### Configuration

1. **Environment-Specific Settings**: Use different thresholds for dev/staging/prod
2. **Baseline Duration**: Allow sufficient time for stable baseline establishment
3. **Alert Cooldown**: Prevent alert fatigue with appropriate cooldown periods
4. **Sample Limits**: Balance detection accuracy with memory usage

### Monitoring Strategy

1. **Start Conservative**: Begin with higher thresholds and adjust based on observations
2. **Monitor Trends**: Focus on growth patterns rather than absolute values
3. **Context Awareness**: Consider application-specific memory patterns
4. **Regular Reviews**: Periodically adjust configuration based on historical data

### Incident Response

1. **Immediate Action**: Check detection reason and recommendations
2. **Extended Monitoring**: Use CLI tool for detailed analysis
3. **Root Cause Analysis**: Investigate code changes and deployment patterns
4. **Long-term Prevention**: Adjust thresholds and add automated monitoring

## API Reference

### MemoryLeakGuard Class

#### Constructor

```typescript
constructor(config?: Partial<MemoryLeakGuardConfig>)
```

#### Methods

- `start(): void` - Start memory monitoring
- `stop(): void` - Stop memory monitoring
- `getState(): MemoryLeakGuardState` - Get current guard state
- `getCurrentSnapshot(): MemorySnapshot | null` - Get latest memory snapshot
- `getTrendAnalysis(): MemoryTrend | null` - Get current trend analysis
- `getDetectionHistory(): MemoryLeakDetection[]` - Get detection history
- `reset(): void` - Reset guard state
- `updateConfig(config: Partial<MemoryLeakGuardConfig>): void` - Update configuration
- `exportData(): { state: MemoryLeakGuardState; exportTimestamp: number; version: string; }` - Export guard data
- `importData(data: { state: MemoryLeakGuardState; exportTimestamp: number; version: string; }): void` - Import guard data

#### Static Methods

- `createMemoryLeakGuard(config?: Partial<MemoryLeakGuardConfig>): MemoryLeakGuard` - Create new guard instance
- `defaultMemoryLeakGuard: MemoryLeakGuard` - Default instance

### CLI Tool

#### Commands

```bash
# Basic sweep
npx tsx scripts/analytics/memoryLeakSweep.ts -o report.md

# Custom configuration
npx tsx scripts/analytics/memoryLeakSweep.ts \
  -o report.json \
  -f json \
  -d 120000 \
  -t 200 \
  -i 2000 \
  -g 0.3 \
  --verbose

# CI/CD integration
npx tsx scripts/analytics/memoryLeakSweep.ts \
  -o ci-report.json \
  --exit-code \
  --dry-run
```

## Version History

### v1.0.0 (2026-01-20)

- Initial release
- Core memory leak detection functionality
- CLI sweep tool
- Comprehensive test suite
- Telemetry integration
- Documentation

## Contributing

### Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Run tests: `npm run test`
4. Run linting: `npm run lint`

### Adding Features

1. Update interfaces in `memoryLeakGuard.ts`
2. Implement functionality in guard class
3. Add comprehensive tests
4. Update documentation
5. Ensure CLI integration if applicable

### Testing Guidelines

- Unit tests for all new functionality
- Mock external dependencies
- Test edge cases and error conditions
- Maintain >90% code coverage
- Use deterministic timing for tests

## License

This project is licensed under the same terms as the main RPG Balancer project.

## Support

For issues, questions, or contributions:

1. Check existing documentation
2. Review test cases for usage examples
3. Create GitHub issue for bugs or feature requests
4. Follow contribution guidelines for pull requests
