# Stress Testing CI Regression Monitor

## Overview

The Stress Testing CI Regression Monitor is an enhanced monitoring system specifically designed to detect and report regressions in the stress testing pipeline. It extends the existing CI regression monitor with stress test specific metrics, alerts, and visualization capabilities.

## Features

### 🔍 **Comprehensive Monitoring**
- **Build Pipeline Metrics**: Build duration, test duration, lint results
- **Stress Test Metrics**: Execution time, simulations per second, memory usage, cache hit rate
- **Quality Metrics**: Test failure rates, code coverage, error counts
- **Performance Trends**: Historical analysis and trend detection

### 🚨 **Intelligent Alerting**
- **Performance Regressions**: Duration increases, throughput decreases
- **Quality Degradation**: Test failures, coverage drops, lint errors
- **Resource Issues**: Memory leaks, CPU spikes, cache inefficiencies
- **Synergy Drift**: Changes in balance calculations affecting game mechanics

### 📊 **Real-time Dashboard**
- **Live Metrics**: Real-time updates with configurable refresh intervals
- **Historical Trends**: Visual indicators for performance trends
- **Alert Management**: Filterable alert list with severity levels
- **Stress Test Details**: Detailed stress test run information and results

### 🔧 **Configurable Thresholds**
- **Customizable Alerts**: Adjustable thresholds for different metrics
- **Baseline Windows**: Configurable historical data windows for comparison
- **Environment-Specific**: Different configurations for CI, staging, production

## Architecture

### Core Components

1. **CIRegressionMonitor Class** (`scripts/coord/ci-regression-monitor.ts`)
   - Main monitoring engine
   - Metrics collection and analysis
   - Regression detection algorithms
   - Alert generation and notification

2. **StressTestMetrics Interface**
   - Stress test specific metrics
   - Performance indicators
   - Configuration tracking
   - Error reporting

3. **StressTestCIRegressionDashboard** (`src/ui/tools/stressTesting/StressTestCIRegressionDashboard.tsx`)
   - React dashboard component
   - Real-time metrics display
   - Alert management interface
   - Trend visualization

### Data Flow

```
Stress Test Pipeline → Results Files → CI Monitor → Metrics Analysis → Regression Detection → Alerts → Dashboard
```

## Configuration

### Monitor Configuration

```json
{
  "baselineWindow": 30,
  "alertThresholds": {
    "buildDuration": 25,
    "testDuration": 30,
    "stressTestDuration": 30,
    "stressTestSimulationsPerSecond": 15,
    "stressTestMemoryUsage": 25,
    "stressTestCacheHitRate": 10,
    "stressTestSynergyDrift": 20
  },
  "stressTestConfig": {
    "enableStressTestMonitoring": true,
    "stressTestResultsPath": "data/stressTesting/ci",
    "baselineStressTestRuns": 10
  }
}
```

### Alert Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| `stressTestDuration` | 30% | Stress test execution time increase |
| `stressTestSimulationsPerSecond` | 15% | Simulation throughput decrease |
| `stressTestMemoryUsage` | 25% | Memory usage increase |
| `stressTestErrorRate` | 3 | New stress test errors |
| `stressTestCacheHitRate` | 10% | Cache efficiency drop |
| `stressTestSynergyDrift` | 20% | Balance calculation changes |

## Usage

### Command Line Interface

```bash
# Monitor current CI run with stress test metrics
npm run ci:regression-monitor -- --monitor

# Generate regression report
npm run ci:regression-monitor -- --report --format markdown

# Analyze trends
npm run ci:regression-monitor -- --analyze --days 30

# Send alerts
npm run ci:regression-monitor -- --alerts

# Full monitoring pipeline
npm run ci:regression-monitor -- --monitor --report --alerts
```

### Dashboard Integration

```tsx
import { StressTestCIRegressionDashboard } from '@/ui/tools/stressTesting/StressTestCIRegressionDashboard';

function MonitoringPage() {
  return (
    <StressTestCIRegressionDashboard
      apiBaseUrl="/api/ci-regression-monitor"
      refreshInterval={30000}
      showStressTestMetrics={true}
    />
  );
}
```

### CI/CD Integration

The monitor integrates with GitHub Actions workflow:

```yaml
- name: Run CI Regression Monitor
  run: |
    npm run ci:regression-monitor \
      --monitor \
      --report \
      --alerts \
      --format markdown \
      --config ./.github/workflows/ci-regression-config.json
```

## Stress Test Metrics

### Core Metrics

- **Duration**: Total stress test execution time
- **Simulations Run**: Number of simulation iterations completed
- **Archetypes Generated**: Count of generated test archetypes
- **Pairs Analyzed**: Number of stat pair combinations tested

### Performance Metrics

- **Simulations Per Second**: Throughput measurement
- **Memory Usage**: Peak memory consumption
- **CPU Usage**: Processor utilization
- **Cache Hit Rate**: Caching efficiency

### Quality Metrics

- **OP Synergies**: Overpowered combinations found
- **Weak Synergies**: Underpowered combinations found
- **Average Synergy Multiplier**: Balance calculation average
- **Error Count**: Simulation errors encountered

## Alert Types

### Performance Alerts

- **Duration Increase**: Stress test running slower than baseline
- **Throughput Decrease**: Fewer simulations per second
- **Memory Regression**: Increased memory consumption
- **Cache Inefficiency**: Lower cache hit rates

### Quality Alerts

- **Error Rate Increase**: More simulation failures
- **Synergy Drift**: Significant changes in balance calculations
- **Configuration Issues**: Problems with test parameters

### Reliability Alerts

- **Test Failures**: Stress test pipeline failures
- **Timeout Issues**: Tests exceeding time limits
- **Resource Exhaustion**: System resource depletion

## Trend Analysis

### Trend Types

- **Improving** 📈: Metrics getting better
- **Degrading** 📉: Metrics getting worse
- **Stable** ➡️: No significant change

### Calculation Method

Trends are calculated by comparing recent performance (last 50% of data) with older performance (first 50% of data):

```typescript
const change = ((recentAvg - olderAvg) / olderAvg) * 100;
if (Math.abs(change) < 5) return 'stable';
return change > 0 ? 'improving' : 'degrading';
```

## Best Practices

### Configuration

1. **Baseline Window**: Use 30+ runs for stable baselines
2. **Threshold Tuning**: Adjust based on project requirements
3. **Environment Separation**: Different configs for CI/staging/production

### Monitoring

1. **Regular Reviews**: Weekly alert and trend analysis
2. **Threshold Adjustments**: Update based on project evolution
3. **Documentation**: Record alert investigations and resolutions

### Alert Management

1. **Severity Classification**: Critical alerts require immediate attention
2. **Investigation Protocol**: Standard process for alert analysis
3. **Resolution Tracking**: Document fixes and preventive measures

## Troubleshooting

### Common Issues

1. **Missing Stress Test Results**
   - Check stress test pipeline completion
   - Verify results file paths
   - Ensure proper file permissions

2. **False Positives**
   - Adjust threshold values
   - Increase baseline window
   - Review configuration changes

3. **Performance Issues**
   - Check system resources
   - Optimize data processing
   - Consider caching strategies

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
const monitor = new CIRegressionMonitor({
  stressTestConfig: {
    enableStressTestMonitoring: true,
    debug: true
  }
});
```

## Integration Points

### Stress Testing Pipeline

The monitor integrates with the existing stress testing workflow:

1. **StressTestRunner**: Generates test results
2. **Results Export**: Saves metrics to configured paths
3. **Monitor Processing**: Analyzes results for regressions
4. **Alert Generation**: Creates notifications for issues

### Telemetry System

Integration with the stress test telemetry system:

```typescript
import { emitStressRunCompleted } from '@/balancing/stressTesting/StressTelemetry';

// Automatic telemetry emission during monitoring
emitStressRunCompleted(stressTestPayload);
```

### Persistence Layer

Uses the project's async persistence service:

```typescript
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

// Metrics storage and retrieval
await saveData('ci-metrics.json', metrics);
const metrics = await loadData('ci-metrics.json');
```

## Future Enhancements

### Planned Features

1. **Machine Learning**: Predictive regression detection
2. **Advanced Visualization**: Interactive charts and graphs
3. **Integration APIs**: Webhook and notification system expansions
4. **Mobile Support**: Responsive dashboard for mobile monitoring

### Extensibility

The system is designed for easy extension:

- **Custom Metrics**: Add new stress test metrics
- **Alert Types**: Define custom alert categories
- **Notification Channels**: Integrate with Slack, Teams, email
- **Analysis Algorithms**: Implement custom regression detection

## Security Considerations

### Data Protection

- **Sensitive Data**: No sensitive information in metrics
- **Access Control**: Restrict dashboard access as needed
- **Data Retention**: Configure appropriate retention policies

### System Security

- **Input Validation**: Validate all configuration inputs
- **File Access**: Restrict file system access to required paths
- **Resource Limits**: Prevent resource exhaustion attacks

## Performance Optimization

### Efficient Processing

- **Incremental Updates**: Only process new data
- **Caching**: Cache computed trends and baselines
- **Parallel Processing**: Analyze metrics concurrently

### Resource Management

- **Memory Usage**: Efficient data structures
- **Disk I/O**: Optimize file operations
- **Network Requests**: Batch API calls

## Contributing

### Development Setup

1. Install dependencies: `npm install`
2. Run tests: `npm run test:unit`
3. Start development: `npm run dev`

### Code Standards

- **TypeScript**: Strict typing enabled
- **ESLint**: Follow project linting rules
- **Testing**: Comprehensive test coverage required
- **Documentation**: Update docs for new features

### Pull Request Process

1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit pull request with description

## Support

For issues and questions:

1. **Documentation**: Check this guide first
2. **Issues**: Create GitHub issue with details
3. **Discussions**: Use GitHub Discussions for questions
4. **Maintainers**: Contact project maintainers for urgent issues

---

*Last Updated: 2026-01-12*
*Version: 1.0.0*
*Author: Vector-Monitor*
