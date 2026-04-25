# Punch Club Combat Animation Frame Budget Monitor

## Overview

Config-first monitoring system for frame budget and animation performance. Tracks 16ms target (60fps), violations, jank with real-time alerts and comprehensive reporting.

## Features

- **Config-First Design**: All thresholds and behavior defined in validated configuration
- **Real-Time Monitoring**: Uses requestAnimationFrame for accurate frame timing
- **Violation Detection**: Identifies frames exceeding budget threshold
- **Jank Detection**: Flags frames exceeding 2x budget (severe performance issues)
- **Alert System**: Real-time warnings for performance degradation
- **Statistics**: Comprehensive metrics including P95/P99 percentiles
- **Performance Grading**: Automatic A-F grade based on multiple factors
- **Telemetry Integration**: Automatic event emission for violations
- **Export Formats**: JSON and Markdown reports with analysis

## Architecture

### Files

```
src/ui/punchClub/perf/
└── FrameBudgetMonitor.ts              # Monitor class and configuration

scripts/punchClub/
└── frameBudgetBenchmark.ts            # CLI benchmark and reporting

tests/unit/punchClub/
└── FrameBudgetMonitor.test.ts         # Unit tests

docs/punch_club/
└── frame_budget_monitor.md            # This file

test-results/
├── frame-budget-*.json                # JSON reports
└── frame-budget-*.md                  # Markdown reports
```

## Configuration

### Frame Budget Configuration Schema

```typescript
interface FrameBudgetConfig {
  enabled: boolean;
  targetFrameTime: number;           // 16.67ms = 60fps
  violationThreshold: number;        // 1.0x = exact budget
  jankThreshold: number;             // 2.0x = severe jank
  maxFrames: number;                 // History size
  enableAlerts: boolean;
  enableTelemetry: boolean;
  alerts: {
    maxViolationRate: number;        // 0.1 = 10%
    maxJankRate: number;             // 0.05 = 5%
    minAverageFps: number;           // 55 fps
  };
}
```

### Default Configuration

```typescript
{
  enabled: true,
  targetFrameTime: 16.67,            // 60fps
  violationThreshold: 1.0,
  jankThreshold: 2.0,
  maxFrames: 1000,
  enableAlerts: true,
  enableTelemetry: true,
  alerts: {
    maxViolationRate: 0.1,           // 10%
    maxJankRate: 0.05,               // 5%
    minAverageFps: 55,
  },
}
```

## Usage

### Basic Usage

```typescript
import { getFrameBudgetMonitor } from '@/ui/punchClub/perf/FrameBudgetMonitor';

// Get monitor instance
const monitor = getFrameBudgetMonitor();

// Start monitoring
monitor.start();

// Get statistics
const stats = monitor.getStatistics();
console.log(`Average FPS: ${stats.averageFps.toFixed(1)}`);
console.log(`Violation Rate: ${(stats.violationRate * 100).toFixed(1)}%`);

// Stop monitoring
monitor.stop();
```

### Custom Configuration

```typescript
import { FrameBudgetMonitor } from '@/ui/punchClub/perf/FrameBudgetMonitor';

const monitor = new FrameBudgetMonitor({
  targetFrameTime: 33.33,            // 30fps target
  violationThreshold: 1.2,           // 20% tolerance
  enableAlerts: true,
  alerts: {
    maxViolationRate: 0.15,          // 15% threshold
    maxJankRate: 0.08,               // 8% threshold
    minAverageFps: 28,               // 28fps minimum
  },
});
```

### Getting Frame Data

```typescript
// Get all frames
const allFrames = monitor.getFrames();

// Get recent frames
const recentFrames = monitor.getRecentFrames(10);

// Get violations only
const violations = monitor.getViolations();

// Get jank frames only
const jankFrames = monitor.getJankFrames();
```

### Exporting Data

```typescript
const exportData = monitor.exportData();

import { saveBenchmarkReport } from '@/scripts/punchClub/frameBudgetBenchmark';
saveBenchmarkReport(exportData, 'test-results', ['json', 'markdown']);
```

## Frame Timing Metrics

### Frame Duration

Time between consecutive frames in milliseconds.

**Target**: 16.67ms (60fps)

### Violation

Frame duration exceeds `targetFrameTime * violationThreshold`.

**Default Threshold**: 16.67ms (1.0x)

### Jank

Frame duration exceeds `targetFrameTime * jankThreshold`.

**Default Threshold**: 33.34ms (2.0x)

### FPS (Frames Per Second)

Calculated as `1000 / frameDuration`.

**Target**: 60 FPS

## Statistics

### Basic Metrics

- **Total Frames**: Count of all measured frames
- **Frames Within Budget**: Frames meeting target
- **Violations**: Frames exceeding budget
- **Jank Frames**: Frames with severe performance issues
- **Violation Rate**: Percentage of frames exceeding budget
- **Jank Rate**: Percentage of frames with jank

### Performance Metrics

- **Average Frame Time**: Mean duration across all frames
- **P95 Frame Time**: 95th percentile (5% of frames are slower)
- **P99 Frame Time**: 99th percentile (1% of frames are slower)
- **Average FPS**: Mean frames per second
- **Minimum FPS**: Lowest FPS recorded

## Alert System

### Violation Rate Alert

Triggered when violation rate exceeds threshold.

**Default Threshold**: 10%

```
[FrameBudgetMonitor] High violation rate: 15.2% (threshold: 10.0%)
```

### Jank Rate Alert

Triggered when jank rate exceeds threshold.

**Default Threshold**: 5%

```
[FrameBudgetMonitor] High jank rate: 8.5% (threshold: 5.0%)
```

### FPS Alert

Triggered when average FPS drops below threshold.

**Default Threshold**: 55 FPS

```
[FrameBudgetMonitor] Low average FPS: 48.3 (threshold: 55)
```

### Critical Jank Alert

Triggered immediately when jank frame detected.

```
[FrameBudgetMonitor] Jank detected: 45.23ms (22.1 FPS)
```

## Telemetry

### Event: pc_frame_budget_violation

Emitted for every frame that exceeds budget.

**Payload**:
```typescript
{
  frameId: 'frame-1706097600000-abc123',
  duration: 20.5,
  targetFrameTime: 16.67,
  fps: 48.8,
  isJank: false,
  timestamp: 1706097600000
}
```

## Performance Grading

### Grade Calculation

Starts at 100 points, deductions for:

- **Violation Rate > 10%**: Up to -30 points
- **Jank Rate > 5%**: Up to -30 points
- **Average FPS < 55**: Up to -20 points
- **P99 Frame Time > 33ms**: Up to -20 points

### Grade Scale

- **A**: 90-100 points (Excellent)
- **B**: 80-89 points (Good)
- **C**: 70-79 points (Acceptable)
- **D**: 60-69 points (Poor)
- **F**: 0-59 points (Unacceptable)

## Reports

### JSON Report

```json
{
  "config": { ... },
  "frames": [ ... ],
  "statistics": {
    "totalFrames": 1000,
    "framesWithinBudget": 920,
    "violations": 80,
    "jankFrames": 15,
    "violationRate": 0.08,
    "jankRate": 0.015,
    "averageFrameTime": 15.8,
    "p95FrameTime": 19.2,
    "p99FrameTime": 25.6,
    "averageFps": 63.3,
    "minFps": 39.1
  },
  "timestamp": "2026-01-24T10:00:00.000Z",
  "duration": 16670
}
```

### Markdown Report

```markdown
# Frame Budget Benchmark Report

**Generated:** 2026-01-24T10:00:00.000Z
**Duration:** 16670ms

## Configuration

- **Target Frame Time:** 16.67ms
- **Violation Threshold:** 1.0x
- **Jank Threshold:** 2.0x

## Statistics

- **Total Frames:** 1000
- **Frames Within Budget:** 920
- **Violations:** 80
- **Jank Frames:** 15
- **Violation Rate:** 8.00%
- **Jank Rate:** 1.50%

## Performance

- **Average Frame Time:** 15.80ms
- **95th Percentile:** 19.20ms
- **99th Percentile:** 25.60ms
- **Average FPS:** 63.3
- **Minimum FPS:** 39.1

## Performance Grade

**Grade:** A (92/100)

**Assessment:**
- Performance is excellent
```

### Console Summary

```
================================================================================
Frame Budget Benchmark - Summary
================================================================================

Performance:
  Total Frames: 1000
  Within Budget: 920 | Violations: 80 | Jank: 15
  Violation Rate: 8.00% | Jank Rate: 1.50%

Timing:
  Average: 15.80ms
  P95: 19.20ms | P99: 25.60ms

FPS:
  Average: 63.3 | Minimum: 39.1

Grade:
  A (92/100)

================================================================================
```

## Integration with Combat Animations

```typescript
import { getFrameBudgetMonitor } from '@/ui/punchClub/perf/FrameBudgetMonitor';

// In combat animation component
useEffect(() => {
  const monitor = getFrameBudgetMonitor();
  
  // Start monitoring when combat begins
  monitor.start();
  
  return () => {
    // Stop monitoring when combat ends
    monitor.stop();
    
    // Get final statistics
    const stats = monitor.getStatistics();
    console.log('Combat Performance:', stats);
    
    // Export report if needed
    if (stats.violationRate > 0.1) {
      const exportData = monitor.exportData();
      saveBenchmarkReport(exportData);
    }
  };
}, []);
```

## Best Practices

1. **Start/Stop Appropriately**: Only monitor during active animations
2. **Review Reports**: Regularly check violation patterns
3. **Tune Thresholds**: Adjust based on target platform (mobile vs desktop)
4. **Act on Alerts**: Investigate when alerts trigger
5. **Compare Baselines**: Track performance over time
6. **Export Evidence**: Save reports for performance regressions
7. **Clean Up**: Call `stop()` to prevent memory leaks

## Troubleshooting

### High Violation Rate

**Symptom**: Violation rate consistently > 10%

**Solutions**:
1. Reduce animation complexity
2. Optimize rendering pipeline
3. Use CSS transforms instead of layout properties
4. Implement frame skipping for non-critical animations
5. Profile with browser DevTools

### Frequent Jank

**Symptom**: Jank rate > 5%

**Solutions**:
1. Identify jank patterns in reports
2. Check for blocking operations
3. Move heavy computations off main thread
4. Reduce DOM manipulations
5. Use will-change CSS property sparingly

### Low FPS

**Symptom**: Average FPS < 55

**Solutions**:
1. Lower target frame rate (30fps)
2. Reduce particle effects
3. Simplify shaders/effects
4. Implement LOD (Level of Detail)
5. Consider hardware limitations

## Performance Targets (PC-M2 KPIs)

- **Target FPS**: 60 (16.67ms per frame)
- **Max Violation Rate**: 10%
- **Max Jank Rate**: 5%
- **Min Average FPS**: 55
- **Max P99 Frame Time**: 33ms

## Related Documentation

- [NP-172 Animation Monitor](./animation_monitor.md)
- [PC-M2 Performance KPIs](../plans/punch_club_m2_plan.md)
- [Combat Animation System](./combat_animation_system.md)

## Version History

- **v1.0.0** (2026-01-24): Initial implementation
  - Config-first monitoring system
  - Real-time frame timing with requestAnimationFrame
  - Violation and jank detection
  - Alert system with configurable thresholds
  - Statistics with P95/P99 percentiles
  - Performance grading (A-F)
  - JSON and Markdown export
  - Telemetry integration
  - Comprehensive unit tests
