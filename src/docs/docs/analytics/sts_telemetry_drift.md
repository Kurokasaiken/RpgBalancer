# STS Telemetry Drift Monitor

Config-first telemetry drift monitoring service for STS (Slay the Spire) simulator metrics.

## Overview

The STS Telemetry Drift Monitor tracks deviations between expected and actual telemetry metrics from the STS simulator, generating configurable alerts and maintaining drift history. This service ensures data quality and system health by detecting anomalies in key performance indicators.

## Features

- **Config-First Design**: All thresholds, severity levels, and alert rules configurable via Zod schemas
- **Real-Time Monitoring**: Continuous monitoring with configurable check intervals
- **Multi-Severity Alerts**: Low, medium, high, and critical severity levels with escalation rules
- **Persistence Integration**: Full state persistence via PersistenceService
- **CLI Reporting**: Command-line tool for generating drift reports in JSON/Markdown/CSV formats
- **Comprehensive Testing**: Full unit test coverage with mock data scenarios

## Architecture

### Core Components

1. **TelemetryDriftMonitor** - Main service class
2. **telemetryDriftConfig** - Configuration schemas and utilities
3. **telemetryDriftReport** - CLI reporting tool
4. **TelemetryDriftMonitor.test.ts** - Comprehensive test suite

### Monitored Metrics

| Metric ID | Description | Expected Range | Critical |
|-----------|-------------|-----------------|----------|
| `avg_mana_curve` | Average mana curve across runs | 2.5 - 4.5 | ✅ |
| `agency_gap_rate` | Rate of agency gaps detected | 0.1 - 0.3 | ❌ |
| `pacing_variance` | Variance in pacing metrics | 0.8 - 1.2 | ❌ |
| `turn_completion_rate` | Rate of successful turn completions | 0.85 - 1.0 | ✅ |
| `error_rate` | Rate of errors in telemetry data | 0.0 - 0.05 | ✅ |

## Configuration

### Default Configuration

```typescript
export const DEFAULT_DRIFT_CONFIG: DriftAlertConfig = {
  enabled: true,
  checkIntervalMs: 30000, // 30 seconds
  thresholds: [
    {
      metricId: 'avg_mana_curve',
      expectedRange: { min: 2.5, max: 4.5 },
      tolerancePercent: 15,
      severity: 'medium',
      critical: true,
    },
    // ... other thresholds
  ],
  escalationRules: {
    consecutiveViolations: 3,
    violationWindowMs: 300000, // 5 minutes
    maxSeverity: 'critical',
  },
  notifications: {
    console: true,
    telemetry: true,
    persistence: true,
  },
  performance: {
    maxProcessingTimeMs: 1000,
    maxEventsPerCheck: 10000,
    enableCaching: true,
    cacheTtlMs: 60000, // 1 minute
  },
};
```

### Severity Levels

- **Low** (🟡): Within acceptable tolerance
- **Medium** (🟠): Minor deviation, monitoring required
- **High** (🔴): Significant deviation, attention needed
- **Critical** (🚨): Severe deviation, immediate action required

## Usage

### Basic Setup

```typescript
import { initializeTelemetryDriftMonitor } from '@/analytics/sts/TelemetryDriftMonitor';

// Initialize with default configuration
const monitor = await initializeTelemetryDriftMonitor();

// Check drift status
const status = monitor.getDriftStatus();
console.log(`Active alerts: ${status.activeAlerts.length}`);

// Perform manual drift check
const results = await monitor.checkDrift(telemetryData);
```

### Custom Configuration

```typescript
import { getTelemetryDriftMonitor } from '@/analytics/sts/TelemetryDriftMonitor';

const monitor = getTelemetryDriftMonitor({
  enabled: true,
  checkIntervalMs: 60000, // 1 minute
  thresholds: [
    {
      metricId: 'custom_metric',
      expectedRange: { min: 0, max: 100 },
      tolerancePercent: 10,
      severity: 'high',
      critical: false,
    },
  ],
});

await monitor.initialize();
```

### CLI Reporting

```bash
# Generate JSON report
npm run telemetry:drift report --format json

# Generate Markdown report with filtering
npm run telemetry:drift report --format markdown --severity critical

# Check current status
npm run telemetry:drift status

# Show configuration
npm run telemetry:drift config
```

## Alert System

### Alert Generation

Alerts are generated when:
1. A metric exceeds its tolerance threshold
2. Consecutive violations exceed the configured limit
3. Escalation rules are triggered

### Alert Structure

```typescript
interface DriftAlertEvent {
  alertId: string;
  metricId: string;
  severity: DriftSeverity;
  message: string;
  timestamp: number;
  drift: DriftResult;
  resolved: boolean;
  resolvedAt?: number;
  metadata: {
    checkId: string;
    configVersion: string;
    processingTimeMs: number;
  };
}
```

### Alert Resolution

Alerts are automatically resolved when:
- Metric returns to acceptable range
- Violation counter is reset
- Resolution notifications are sent

## Performance Metrics

The monitor tracks performance metrics:

```typescript
interface PerformanceMetrics {
  totalChecks: number;
  averageProcessingTime: number;
  lastProcessingTime: number;
}
```

### Performance Targets

- **Processing Time**: < 1000ms per check
- **Event Processing**: < 10,000 events per check
- **Memory Usage**: < 50MB for typical workloads
- **Cache Hit Rate**: > 80% for repeated checks

## Testing

### Unit Tests

Comprehensive test suite covering:
- Initialization and configuration
- Drift detection algorithms
- Alert generation and resolution
- Persistence and error handling
- Performance monitoring

```bash
# Run tests
npm run test -- tests/unit/sts/TelemetryDriftMonitor.test.ts

# Run with coverage
npm run test -- tests/unit/sts/TelemetryDriftMonitor.test.ts --coverage
```

### Test Scenarios

- **Normal Operation**: Metrics within expected ranges
- **Drift Detection**: Metrics exceeding thresholds
- **Alert Escalation**: Consecutive violations
- **Error Recovery**: Persistence failures and recovery
- **Performance**: Large dataset processing

## Integration

### STS Telemetry Dashboard

Integration with the STS Telemetry Dashboard for:
- Real-time metric visualization
- Historical drift analysis
- Alert status display

### PersistenceService

Full integration with PersistenceService for:
- Configuration persistence
- Alert history storage
- State recovery

## CLI Tool

### Commands

#### `report`
Generate drift reports in multiple formats.

```bash
# Basic usage
sts-telemetry-drift report

# With options
sts-telemetry-drift report \
  --format markdown \
  --output ./reports \
  --severity high \
  --metric avg_mana_curve \
  --verbose
```

#### `status`
Show current monitor status and metrics.

```bash
sts-telemetry-drift status [--verbose]
```

#### `config`
Display current configuration.

```bash
sts-telemetry-drift config
```

### Output Formats

#### JSON
Structured data with full alert details and metrics.

#### Markdown
Human-readable report with summaries and tables.

#### CSV
Tabular data for spreadsheet analysis.

## Troubleshooting

### Common Issues

1. **Monitor Not Starting**
   - Check configuration validity
   - Verify PersistenceService availability
   - Review console logs for errors

2. **No Alerts Generated**
   - Verify tolerance thresholds
   - Check telemetry data quality
   - Review escalation rules

3. **Performance Issues**
   - Reduce `maxEventsPerCheck`
   - Enable caching
   - Increase `checkIntervalMs`

### Debug Mode

Enable verbose logging:

```typescript
const monitor = getTelemetryDriftMonitor({
  ...config,
  notifications: {
    ...config.notifications,
    console: true,
  },
});
```

## Future Enhancements

- **Dashboard Integration**: Real-time UI for drift monitoring
- **Machine Learning**: Predictive drift detection
- **Multi-Metric Correlation**: Cross-metric analysis
- **Custom Alert Actions**: Webhook and notification integrations

## API Reference

### TelemetryDriftMonitor

#### Methods

- `initialize()` - Initialize the monitor
- `startMonitoring()` - Start automatic monitoring
- `stopMonitoring()` - Stop automatic monitoring
- `checkDrift(telemetryData)` - Perform manual drift check
- `getDriftStatus()` - Get current status and alerts
- `getMetricsSummary()` - Get performance metrics
- `updateConfig(newConfig)` - Update configuration
- `clearAlerts()` - Clear all alerts
- `cleanup()` - Cleanup resources

#### Properties

- `isRunning` - Whether monitoring is active
- `activeAlerts` - Currently active alerts
- `alertHistory` - Historical alert data

### Types

#### DriftResult
```typescript
interface DriftResult {
  metricId: string;
  currentValue: number;
  expectedRange: { min: number; max: number };
  driftPercent: number;
  severity: DriftSeverity;
  critical: boolean;
  timestamp: number;
  consecutiveViolations: number;
  context: {
    sampleSize: number;
    timeRange: { start: number; end: number };
  };
}
```

#### DriftSeverity
```typescript
type DriftSeverity = 'low' | 'medium' | 'high' | 'critical';
```

## Contributing

When contributing to the STS Telemetry Drift Monitor:

1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure configuration-first design principles
5. Test with various telemetry data scenarios

## License

This project is part of the RPG Balancer system and follows the same licensing terms.

---

*Generated for NP-093 – STS Telemetry Drift Alert Service*
