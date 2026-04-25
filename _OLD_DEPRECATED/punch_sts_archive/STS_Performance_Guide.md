# STS Performance Guide

> **Comprehensive guide for STS (Slay the Spire) performance optimization, monitoring, and auto-tuning**

**Created:** 2026-01-13  
**Status:** ✅ Active  
**Maintainers:** Sentinel-Perf Team

---

## Overview

The STS Performance Guide provides comprehensive documentation for optimizing, monitoring, and auto-tuning STS simulator performance. This guide covers performance budgets, real-time monitoring, automated tuning, and best practices for maintaining optimal frame rates and memory usage.

## Table of Contents

1. [Performance Budgets](#performance-budgets)
2. [Monitoring & Telemetry](#monitoring--telemetry)
3. [Auto-Tuner System](#auto-tuner-system)
4. [Configuration Management](#configuration-management)
5. [Performance Optimization](#performance-optimization)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Performance Budgets

### Target Metrics

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Frame Time | ≤ 16.67ms (60 FPS) | 20-25ms | > 25ms |
| FPS | ≥ 60 | 45-60 | < 45 |
| Drop Rate | ≤ 5% | 5-10% | > 10% |
| Memory Usage | ≤ 200MB | 200-300MB | > 300MB |
| Input Latency | ≤ 30ms | 30-50ms | > 50ms |

### Budget Allocation

```typescript
interface STSPerformanceBudget {
  frameBudget: 16.67;        // 60 FPS target
  renderBudget: 10.0;        // Rendering operations
  logicBudget: 5.0;          // Game logic calculations
  uiBudget: 1.67;           // UI updates and interactions
}
```

---

## Monitoring & Telemetry

### Real-time Metrics

The STS simulator collects real-time performance metrics through multiple sources:

#### Frame Time Monitoring
- **Average Frame Time**: Rolling average over last 100 frames
- **Frame Time Variance**: Standard deviation of frame times
- **Frame Drops**: Count of frames exceeding budget
- **Drop Rate**: Percentage of frames exceeding budget

#### Memory Monitoring
- **Heap Usage**: JavaScript heap size in MB
- **DOM Nodes**: Number of DOM elements
- **Event Listeners**: Active event listener count
- **Texture Memory**: GPU texture memory usage

#### Input Monitoring
- **Input Latency**: Time from input to visual feedback
- **Event Queue**: Size of input event queue
- **Response Time**: Time to process input events

### Telemetry Events

```typescript
interface STSTelemetryEvent {
  type: 'sts_perf_sample';
  timestamp: number;
  metrics: {
    frameTime: number;
    fps: number;
    inputLatency: number;
    memoryUsage: number;
    dropRate: number;
  };
  context: {
    activeVisualizers: number;
    logDetailLevel: number;
    refreshInterval: number;
  };
}
```

---

## Auto-Tuner System

### Overview

The STS Performance Auto-Tuner automatically analyzes performance KPIs and proposes configuration adjustments to optimize frame budget and memory usage. The system operates on config-first principles and provides both manual and automated tuning capabilities.

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Performance   │───▶│   Auto-Tuner     │───▶│  Config Adjust  │
│     KPIs        │    │     Engine       │    │   Recommendations│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Telemetry      │
                       │   Events         │
                       └──────────────────┘
```

### Components

#### 1. Performance Analyzer (`scripts/stsTelemetry/perfAutoTuner.ts`)

Core analysis engine that:
- Collects and analyzes performance KPIs
- Generates configuration recommendations
- Applies adjustments with safety constraints
- Provides detailed reporting

**Key Classes:**
- `STSPerformanceAutoTuner`: Main tuning engine
- `STSPerfTunerCLI`: Command-line interface

#### 2. React Hooks (`src/ui/tools/sts/hooks/useSTSPefBudget.ts`)

UI integration layer that:
- Provides real-time performance data
- Manages recommendation display
- Handles user interactions
- Integrates with STS UI components

**Key Hooks:**
- `useSTSPefBudget`: Main performance budget management
- `useSTSPefBudgetStatus`: Status and alert monitoring
- `useSTSPefBudgetConfig`: Configuration management

### Auto-Tuning Process

#### 1. KPI Analysis

```typescript
const kpis: STSPerformanceKPI = {
  avgFrameTime: 25.5,        // Above target
  currentFPS: 39.2,          // Below target
  dropRate: 12.3,            // Above threshold
  memoryUsage: 245,          // Above threshold
  inputLatency: 67.8,        // Above threshold
  // ... other metrics
};
```

#### 2. Recommendation Generation

The analyzer generates recommendations based on performance issues:

```typescript
const recommendations: ConfigAdjustment[] = [
  {
    key: 'logDetailLevel',
    currentValue: 3,
    recommendedValue: 2,
    reason: 'Reduce log detail to improve frame time by 8.5ms',
    expectedImpact: 'high',
    risk: 'low',
  },
  {
    key: 'refreshInterval',
    currentValue: 100,
    recommendedValue: 150,
    reason: 'Increase refresh interval to reduce CPU load',
    expectedImpact: 'medium',
    risk: 'low',
  },
  // ... more recommendations
];
```

#### 3. Safety Constraints

All adjustments respect safety constraints:
- **Minimum Log Detail**: Never below level 1
- **Maximum Refresh Interval**: Never exceed 1000ms
- **Risk Assessment**: High-risk changes require manual approval
- **Rollback Support**: All changes can be reverted

### CLI Usage

#### Basic Commands

```bash
# Run analysis with sample data
sts_perf_tuner_run --dry-run --verbose

# Auto-apply safe recommendations
sts_perf_tuner_run --auto-apply

# Use custom configuration
sts_perf_tuner_run --config ./custom-config.json

# Load KPIs from file
sts_perf_tuner_run --kpi ./performance-kpis.json

# Generate detailed report
sts_perf_tuner_run --output ./tuning-report.md
```

#### Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--config` | Path to STS config file | `src/ui/tools/sts/config.json` |
| `--kpi` | Path to KPIs JSON file | Sample data |
| `--output` | Report output path | Auto-generated |
| `--dry-run` | Show recommendations without applying | `false` |
| `--auto-apply` | Apply low/medium risk recommendations | `false` |
| `--verbose` | Show detailed output | `false` |
| `--help` | Show help message | - |

### Integration with STS UI

#### Hook Usage

```typescript
import { useSTSPefBudget } from '@/ui/tools/sts/hooks/useSTSPefBudget';

function STSPerformancePanel() {
  const {
    kpis,
    recommendations,
    appliedAdjustments,
    isTunerRunning,
    runTuningAnalysis,
    applyAdjustment,
    applyAllAdjustments,
    resetToDefaults,
  } = useSTSPefBudget({
    autoApplyLowRisk: false,
    refreshInterval: 5000,
    enableMonitoring: true,
  });

  return (
    <div>
      <h2>Performance Budget</h2>
      <div>Frame Time: {kpis?.avgFrameTime.toFixed(1)}ms</div>
      <div>FPS: {kpis?.currentFPS.toFixed(1)}</div>
      
      <button onClick={runTuningAnalysis} disabled={isTunerRunning}>
        Analyze Performance
      </button>
      
      {recommendations.map(adj => (
        <div key={adj.key}>
          <span>{adj.reason}</span>
          <button onClick={() => applyAdjustment(adj)}>
            Apply
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Configuration Management

### Performance Configuration

```typescript
interface STSPerformanceConfig {
  // Frame rate targets
  targetFPS: number;
  frameBudget: number;
  
  // Monitoring settings
  logDetailLevel: number;
  refreshInterval: number;
  
  // Visualizer settings
  activeVisualizers: number;
  enableAnimations: boolean;
  
  // Memory optimization
  enableMemoryOptimization: boolean;
  maxCacheSize: number;
  
  // Input handling
  inputBuffering: boolean;
  inputDebounceMs: number;
}
```

### Auto-Tuner Configuration

```typescript
interface AutoTunerConfig {
  targets: {
    targetFrameTime: number;
    targetFPS: number;
    maxDropRate: number;
    maxMemoryUsage: number;
  };
  thresholds: {
    minFrameTimeImprovement: number;
    minFPSImprovement: number;
    maxAutoApplyRisk: 'low' | 'medium' | 'high';
  };
  constraints: {
    minLogDetailLevel: number;
    maxRefreshInterval: number;
    minRefreshInterval: number;
  };
}
```

### Configuration Files

#### Default Configuration (`src/ui/tools/sts/config.json`)

```json
{
  "performance": {
    "targetFPS": 60,
    "frameBudget": 16.67,
    "logDetailLevel": 2,
    "refreshInterval": 200,
    "enableMemoryOptimization": false,
    "inputBuffering": false
  },
  "autoTuner": {
    "enabled": true,
    "autoApplyLowRisk": false,
    "refreshInterval": 5000
  }
}
```

---

## Performance Optimization

### Frame Time Optimization

#### 1. Reduce Log Detail

```typescript
// Before: High detail logging
const logDetailLevel = 3; // Verbose logging

// After: Reduced detail
const logDetailLevel = 1; // Essential logging only
// Expected improvement: 2-5ms frame time reduction
```

#### 2. Optimize Refresh Intervals

```typescript
// Before: Fast refresh
const refreshInterval = 100; // 10 updates per second

// After: Optimized refresh
const refreshInterval = 250; // 4 updates per second
// Expected improvement: 1-3ms frame time reduction
```

#### 3. Disable Non-Essential Visualizers

```typescript
// Before: All visualizers active
const activeVisualizers = 5;

// After: Essential only
const activeVisualizers = 2;
// Expected improvement: 3-8ms frame time reduction
```

### Memory Optimization

#### 1. Enable Memory Optimization

```typescript
const enableMemoryOptimization = true;
// Expected improvement: 20-50MB memory reduction
```

#### 2. Reduce Cache Sizes

```typescript
const maxCacheSize = 100; // Reduced from 500
// Expected improvement: 10-30MB memory reduction
```

#### 3. Clear Unused Objects

```typescript
// Periodic cleanup
setInterval(() => {
  // Clear unused textures, caches, and event listeners
}, 30000);
```

### Input Optimization

#### 1. Enable Input Buffering

```typescript
const inputBuffering = true;
// Expected improvement: 10-20ms input latency reduction
```

#### 2. Optimize Event Handling

```typescript
const inputDebounceMs = 16; // 60 FPS equivalent
// Expected improvement: 5-15ms input latency reduction
```

---

## Troubleshooting

### Common Performance Issues

#### 1. High Frame Time (> 25ms)

**Symptoms:**
- Stuttering animation
- Poor visual responsiveness
- FPS below 40

**Causes:**
- Too many active visualizers
- High log detail level
- Complex calculations in render loop

**Solutions:**
1. Reduce log detail level to 1 or 2
2. Disable non-essential visualizers
3. Increase refresh interval
4. Enable memory optimization

#### 2. High Memory Usage (> 300MB)

**Symptoms:**
- Browser slowdown
- Frequent garbage collection
- Potential crashes

**Causes:**
- Memory leaks in event listeners
- Large texture caches
- Excessive DOM elements

**Solutions:**
1. Enable memory optimization
2. Reduce cache sizes
3. Clear unused objects periodically
4. Monitor for memory leaks

#### 3. High Input Latency (> 50ms)

**Symptoms:**
- Delayed response to user input
- Poor interactive performance
- Frustrating user experience

**Causes:**
- Blocking operations in event handlers
- Complex input processing
- UI thread contention

**Solutions:**
1. Enable input buffering
2. Optimize event handling
3. Use requestAnimationFrame for updates
4. Debounce input events

### Debugging Tools

#### 1. Performance HUD

Enable the built-in performance HUD for real-time monitoring:

```typescript
const showPerformanceHUD = true;
```

#### 2. Telemetry Events

Monitor telemetry events in the console:

```javascript
// Listen for performance events
window.addEventListener('sts_perf_sample', (event) => {
  console.log('Performance:', event.detail);
});
```

#### 3. Memory Profiling

Use browser memory profiling tools:

1. Open DevTools → Memory
2. Take heap snapshot
3. Analyze retained objects
4. Identify memory leaks

---

## Best Practices

### Performance Monitoring

1. **Continuous Monitoring**: Enable real-time monitoring in development
2. **Threshold Alerts**: Set up alerts for performance degradation
3. **Historical Tracking**: Track performance trends over time
4. **Regular Audits**: Conduct performance audits weekly

### Configuration Management

1. **Config-First**: Store all performance settings in configuration
2. **Environment-Specific**: Use different configs for development/production
3. **Version Control**: Track configuration changes
4. **Documentation**: Document configuration decisions

### Auto-Tuning Usage

1. **Start Conservative**: Begin with dry-run mode
2. **Review Recommendations**: Always review before applying
3. **Monitor Impact**: Verify improvements after changes
4. **Rollback Ready**: Keep rollback plans ready

### Development Practices

1. **Performance Budget**: Design within performance budgets
2. **Lazy Loading**: Load resources on-demand
3. **Efficient Algorithms**: Use O(1) algorithms where possible
4. **Memory Management**: Avoid memory leaks

### Testing

1. **Performance Tests**: Include performance tests in CI/CD
2. **Load Testing**: Test with realistic workloads
3. **Regression Testing**: Monitor for performance regressions
4. **Cross-Browser**: Test across different browsers

---

## API Reference

### Auto-Tuner Classes

#### STSPerformanceAutoTuner

```typescript
class STSPerformanceAutoTuner {
  constructor(config?: Partial<AutoTunerConfig>);
  
  async loadCurrentConfig(configPath: string): Promise<void>;
  analyzePerformance(kpis: STSPerformanceKPI): ConfigAdjustment[];
  async applyAdjustments(
    adjustments: ConfigAdjustment[],
    configPath: string,
    dryRun?: boolean
  ): Promise<ConfigAdjustment[]>;
  async runTuningSession(
    kpis: STSPerformanceKPI,
    configPath: string,
    options?: { dryRun?: boolean; autoApply?: boolean; }
  ): Promise<TuningSession>;
  generateReport(session: TuningSession): string;
}
```

#### STSPerfTunerCLI

```typescript
class STSPerfTunerCLI {
  constructor(config?: Partial<AutoTunerConfig>);
  
  async run(args: string[]): Promise<void>;
  private parseArgs(args: string[]): ParsedArgs;
  private showHelp(): void;
  private loadKPIsFromFile(filePath: string): STSPerformanceKPI;
  private generateSampleKPIs(): STSPerformanceKPI;
}
```

### React Hooks

#### useSTSPefBudget

```typescript
function useSTSPefBudget(options?: UseSTSPefBudgetOptions): UseSTSPefBudgetReturn;

interface UseSTSPefBudgetOptions {
  refreshInterval?: number;
  autoApplyLowRisk?: boolean;
  tunerConfig?: Partial<AutoTunerConfig>;
  enableMonitoring?: boolean;
}

interface UseSTSPefBudgetReturn {
  kpis: STSPerformanceKPI | null;
  recommendations: ConfigAdjustment[];
  appliedAdjustments: ConfigAdjustment[];
  isTunerRunning: boolean;
  lastSession: TuningSession | null;
  applyAdjustment: (adjustment: ConfigAdjustment) => Promise<boolean>;
  applyAllAdjustments: () => Promise<ConfigAdjustment[]>;
  runTuningAnalysis: () => Promise<ConfigAdjustment[]>;
  resetToDefaults: () => Promise<void>;
  toggleMonitoring: (enabled: boolean) => void;
  isMonitoring: boolean;
}
```

#### useSTSPefBudgetStatus

```typescript
function useSTSPefBudgetStatus(): {
  status: 'good' | 'warning' | 'critical';
  alerts: string[];
  hasAlerts: boolean;
};
```

#### useSTSPefBudgetConfig

```typescript
function useSTSPefBudgetConfig(): {
  config: STSPerformanceConfig;
  updateConfig: (updates: Partial<STSPerformanceConfig>) => void;
  resetConfig: () => void;
};
```

---

## Glossary

| Term | Definition |
|------|------------|
| **Frame Budget** | Maximum time allowed per frame (16.67ms for 60 FPS) |
| **Drop Rate** | Percentage of frames exceeding the frame budget |
| **KPI** | Key Performance Indicator |
| **Auto-Tuner** | Automated performance optimization system |
| **Config-First** | Design principle where all settings come from configuration |
| **Telemetry** | Performance data collection and analysis |
| **Visualizer** | UI component that renders performance data |

---

## Contributing

### Adding New Recommendations

1. Update `STSPerformanceAutoTuner.analyzePerformance()`
2. Add recommendation logic with risk assessment
3. Update configuration constraints if needed
4. Add tests for new recommendations
5. Update documentation

### Extending Monitoring

1. Add new KPI collection in `useSTSPefBudget`
2. Update telemetry event structure
3. Add alert thresholds in `useSTSPefBudgetStatus`
4. Update configuration schema
5. Add tests for new monitoring

### Reporting Issues

1. Include performance KPIs
2. Describe expected vs actual behavior
3. Provide configuration details
4. Include browser and environment info
5. Add reproduction steps

---

## Changelog

### v1.0.0 (2026-01-13)
- ✅ Initial STS Performance Guide
- ✅ Auto-Tuner system documentation
- ✅ CLI usage examples
- ✅ React hooks integration
- ✅ Performance optimization guidelines
- ✅ Troubleshooting guide
- ✅ Best practices documentation

---

## Related Documentation

- [STS Telemetry Dashboard](../docs/archmage/STS_Telemetry_Dashboard.md)
- [STS Numeric Simulator Spec](../docs/archmage/STS_NumericSimulator_Spec.md)
- [STS Troubleshooting Guide](../docs/operations/STS_Troubleshooting_Guide.md)
- [STS QA Checklist](../docs/tests/STS_QA_CHECKLIST.md)

---

## Support

For questions, issues, or contributions:

1. **Documentation Issues**: Create issue in documentation repository
2. **Performance Problems**: Use the troubleshooting guide
3. **Feature Requests**: Submit enhancement proposals
4. **Bug Reports**: Include performance KPIs and configuration

---

*Last updated: 2026-01-13*
