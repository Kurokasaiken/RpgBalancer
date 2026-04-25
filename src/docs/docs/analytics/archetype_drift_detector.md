# Archetype Drift Detector Documentation

## Overview

The Archetype Drift Detector is a comprehensive monitoring system for detecting weight changes in RPG Balancer archetypes between releases. It compares current weight snapshots with historical baselines, calculates drift percentages, and provides severity assessment with actionable recommendations.

## Features

### Core Capabilities

- **Snapshot Management**: Load and save archetype weight snapshots with persistence
- **Drift Analysis**: Calculate percentage changes and severity levels for weight drifts
- **Multi-criteria Detection**: Configurable thresholds for different severity levels
- **Telemetry Integration**: Automatic event emission for detected drifts
- **CLI Reporting**: Command-line tool for generating detailed reports
- **Comprehensive Testing**: Full unit test coverage with mock scenarios

### Detection Criteria

1. **Weight Change Threshold**: Minimum percentage change for detection (default: 10%)
2. **Severity Levels**: Low (5-20%), Medium (20-50%), High (50-80%), Critical (80-100%+)
3. **Global Weight Changes**: Changes to base stat weights across all archetypes
4. **Derived Stat Impact**: Analysis of derived stat changes from weight modifications

## Architecture

### Components

```
src/balancing/analytics/
├── ArchetypeDriftDetector.ts          # Core detector class and schemas
├── types.ts                           # Type definitions (if separated)
└── utils.ts                           # Utility functions (if separated)

scripts/balancer/
├── archetypeDriftReport.ts            # CLI report tool
└── archetypeDriftMonitor.ts          # Background monitor (optional)

tests/unit/balancing/
├── ArchetypeDriftDetector.test.ts    # Unit tests
└── ArchetypeDriftReport.test.ts      # CLI tests (optional)
```

### Data Flow

```
BalancerConfig → ArchetypeSnapshot → Drift Analysis → Telemetry Event → CLI Report
```

## Configuration

### ArchetypeDriftDetectionConfigSchema

```typescript
interface ArchetypeDriftDetectionConfig {
  weightChangeThreshold: number;        // 0.01-1.0 (default: 0.1)
  severityThresholds: {
    low: number;                      // 0.05-0.2 (default: 0.05)
    medium: number;                    // 0.2-0.5 (default: 0.2)
    high: number;                      // 0.5-0.8 (default: 0.5)
    critical: number;                   // 0.8-1.0 (default: 0.8)
  };
  minSampleCount: number;                // Minimum samples for analysis (default: 2)
  includeDerivedStats: boolean;          // Include derived stats (default: true)
  verbose: boolean;                     // Enable detailed logging (default: false)
}
```

### Default Configuration

```typescript
const defaultConfig: ArchetypeDriftDetectionConfig = {
  weightChangeThreshold: 0.1,
  severityThresholds: {
    low: 0.05,
    medium: 0.2,
    high: 0.5,
    critical: 0.8,
  },
  minSampleCount: 2,
  includeDerivedStats: true,
  verbose: false,
};
```

## Usage

### Basic Usage

```typescript
import { createArchetypeDriftDetector } from '@/balancing/analytics/ArchetypeDriftDetector';

// Create detector with default configuration
const detector = createArchetypeDriftDetector();

// Load baseline snapshot
await detector.loadBaseline();

// Create current snapshot
await detector.createCurrentSnapshot();

// Analyze drift
const detection = detector.analyzeDrift();

// Check results
console.log('Severity:', detection.severity);
console.log('Drifted Archetypes:', detection.driftedArchetypes.length);
```

### Custom Configuration

```typescript
import { createArchetypeDriftDetector } from '@/balancing/analytics/ArchetypeDriftDetector';

const detector = createArchetypeDriftDetector({
  weightChangeThreshold: 0.05,              // 5% threshold
  severityThresholds: {
    low: 0.02,                              // 2-20%
    medium: 0.15,                            // 15-50%
    high: 0.4,                              // 40-80%
    critical: 0.7,                            // 70-100%+
  },
  verbose: true,                             // Enable logging
  minSampleCount: 3,                          // Require more samples
});
```

### Advanced Usage

```typescript
import { ArchetypeDriftDetector } from '@/balancing/analytics/ArchetypeDriftDetector';

class BalancerMonitor {
  private detector: ArchetypeDriftDetector;
  
  constructor() {
    this.detector = new ArchetypeDriftDetector({
      weightChangeThreshold: 0.1,
      severityThresholds: {
        low: 0.05,
        medium: 0.2,
        high: 0.5,
        critical: 0.8,
      },
      verbose: true,
    });
    
    // Start monitoring
    this.initializeMonitoring();
  }
  
  async initializeMonitoring() {
    try {
      await this.detector.loadBaseline();
      await this.detector.createCurrentSnapshot();
      
      const detection = this.detector.analyzeDrift();
      this.handleDetection(detection);
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
    }
  }
  
  handleDetection(detection: ArchetypeDriftDetectionSchema) {
    if (detection.severity !== 'none') {
      console.warn(`Archetype drift detected: ${detection.severity}`);
      
      // Send alerts
      this.sendAlert(detection);
      
      // Generate report
      this.generateReport(detection);
    }
  }
  
  async generateReport(detection: ArchetypeDriftDetectionSchema) {
    const { ArchetypeDriftReportRunner } = await import('./archetypeDriftReport');
    const runner = new ArchetypeDriftReportRunner({
      output: `reports/archetype-drift-${Date.now()}.md`,
      format: 'markdown',
      verbose: true,
      exitCode: false,
    });
    
    const results = await runner.run();
    console.log('Report generated:', results.performance.reportGenerationMs, 'ms');
  }
  
  shutdown() {
    this.detector.reset();
  }
}
```

## CLI Tool

### Archetype Drift Report

The CLI tool performs drift analysis and generates reports in JSON or Markdown format.

#### Basic Usage

```bash
# Generate basic drift report
npx tsx scripts/balancer/archetypeDriftReport.ts -o archetype-drift-report.md

# Generate with custom thresholds
npx tsx scripts/balancer/archetypeDriftReport.ts \
  -o archetype-drift-report.json \
  -f json \
  -t 0.05 \
  --severity-low 0.02 \
  --severity-medium 0.15 \
  --severity-high 0.4 \
  --severity-critical 0.7 \
  --verbose
```

#### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Output file path | Required |
| `-f, --format <format>` | Output format (json/markdown) | markdown |
| `-t, --threshold <threshold>` | Weight change threshold (0.01-1.0) | 0.1 |
| `--severity-low <threshold>` | Low severity threshold (0.05-0.2) | 0.05 |
| `--severity-medium <threshold>` | Medium severity threshold (0.2-0.5) | 0.2 |
| `--severity-high <threshold>` | High severity threshold (0.5-0.8) | 0.5 |
| `--severity-critical <threshold>` | Critical severity threshold (0.8-1.0) | 0.8 |
| `-v, --verbose` | Enable verbose output | false |
| `--dry-run` | Show what would be exported without writing files | false |
| `--exit-code` | Set exit code based on detection results | false |

#### Exit Codes

- **0**: No significant drift detected
- **1**: Medium or high drift detected
- **2**: Critical drift detected

#### Integration with CI/CD

```bash
#!/bin/bash
# CI/CD archetype drift check

echo "Running archetype drift analysis..."
npx tsx scripts/balancer/archetypeDriftReport.ts \
  -o ci-archetype-drift-report.json \
  -f json \
  -t 0.05 \
  --severity-low 0.02 \
  --severity-critical 0.7 \
  --exit-code \
  --verbose

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ No significant archetype drift detected"
elif [ $EXIT_CODE -eq 1 ]; then
  echo "⚠️  Warning: Moderate archetype drift detected"
else
  echo "❌ Critical: Significant archetype drift detected"
  exit 1
fi
```

## Data Structures

### ArchetypeSnapshotSchema

```typescript
interface ArchetypeSnapshot {
  config: {
    schemaVersion: string;
    timestamp: number;
    balancerVersion: string;
    nodeVersion: string;
    platform: string;
    pid: number;
    environment: 'development' | 'staging' | 'production' | 'test';
    generationMethod: 'automatic' | 'manual' | 'test';
    totalStats: number;
    totalArchetypes: number;
    seed: number;
  };
  archetypes: ArchetypeWeightSnapshot[];
  globalWeights: Record<string, number>;
  derivedStats: string[];
  incompatiblePairs: [string, string][];
  metadata: {
    generationDurationMs: number;
    memoryUsageMB: number;
    cpuUsagePercent: number;
  };
}
```

### ArchetypeDriftAnalysisSchema

```typescript
interface ArchetypeDriftAnalysis {
  archetypeId: string;
  currentWeights: Record<string, number>;
  baselineWeights: Record<string, number>;
  weightChanges: Record<string, number>;
  driftPercentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedStats: string[];
  recommendations: string[];
  analyzedAt: number;
}
```

### ArchetypeDriftDetectionSchema

```typescript
interface ArchetypeDriftDetection {
  timestamp: number;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  totalArchetypes: number;
  driftedArchetypes: ArchetypeDriftAnalysis[];
  globalWeightChanges: Record<string, number>;
  derivedStatsChanges: string[];
  metrics: {
    analysisDurationMs: number;
    snapshotComparisonMs: number;
    driftCalculationMs: number;
  };
  recommendations: string[];
  detectionConfig: ArchetypeDriftDetectionConfig;
}
```

## Telemetry Integration

### Event Emission

The detector automatically emits telemetry events when significant drift is detected:

```typescript
interface ArchetypeDriftDetectedTelemetryPayload {
  eventType: 'balancer_archetype_drift_detected';
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  totalArchetypes: number;
  driftedArchetypes: number;
  globalWeightChanges: Record<string, number>;
  mostCriticalDrift: {
    archetypeId: string;
    severity: string;
    driftPercentage: number;
    affectedStats: string[];
  } | null;
  detectionConfig: {
    weightChangeThreshold: number;
    severityThresholds: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    minSampleCount: number;
    includeDerivedStats: boolean;
  };
}
```

### Telemetry Routing

Events are routed to appropriate diagnostics channels based on event type:

- `balancer_*` → Balancer diagnostics channel
- `analytics_*` → Analytics diagnostics channel
- `sts_*` → STS diagnostics channel
- `quest_*` → Quest diagnostics channel

## Testing

### Unit Tests

The comprehensive test suite covers:

- **Initialization**: Detector creation and configuration
- **Snapshot Management**: Loading, saving, and validation
- **Drift Analysis**: Percentage calculation and severity assessment
- **Telemetry**: Event emission and payload validation
- **Configuration**: Updates and validation
- **State Management**: Reset, export, and import functionality
- **Edge Cases**: Empty data, missing archetypes, zero changes

### Running Tests

```bash
# Run archetype drift detector tests
npm run test -- tests/unit/balancing/ArchetypeDriftDetector.test.ts

# Run with coverage
npm run test -- tests/unit/balancing/ArchetypeDriftDetector.test.ts --coverage

# Run all balancing tests
npm run test -- tests/unit/balancing/
```

### Mock Scenarios

Tests use comprehensive mocking for:

- PersistenceService for snapshot storage
- BalancerConfigStore for configuration access
- StressTestArchetypeGenerator for archetype generation
- Telemetry system for event emission
- Process APIs for metadata

## Performance Considerations

### Analysis Impact

- **Memory Overhead**: < 2MB for typical configurations
- **CPU Usage**: < 10% during analysis
- **Storage Impact**: Minimal, only snapshot persistence
- **Analysis Time**: < 100ms for typical scenarios (50 archetypes)

### Optimization Strategies

1. **Threshold Tuning**: Adjust thresholds for sensitivity vs. performance
2. **Sample Limits**: Limit archetype count for faster analysis
3. **Caching**: Cache baseline snapshots for repeated analyses
4. **Batch Processing**: Analyze multiple archetypes in single pass

### Recommended Settings

| Environment | Threshold | Low | Medium | High | Critical |
|-------------|-----------|------|------|----------|
| Development | 0.05 | 0.15 | 0.4 | 0.7 |
| Staging | 0.1 | 0.2 | 0.5 | 0.8 |
| Production | 0.1 | 0.2 | 0.5 | 0.8 |

## Troubleshooting

### Common Issues

#### High False Positives

**Symptoms**: Frequent drift detections without actual issues

**Solutions**:
- Increase `weightChangeThreshold` (e.g., from 0.1 to 0.15)
- Adjust severity thresholds to be less sensitive
- Increase `minSampleCount` for more stable analysis

#### Poor Detection Sensitivity

**Symptoms**: Missing actual drift issues

**Solutions**:
- Decrease `weightChangeThreshold` (e.g., from 0.1 to 0.05)
- Decrease severity thresholds for earlier detection
- Enable verbose logging for detailed analysis

#### Performance Issues

**Symptoms**: Slow analysis or high memory usage

**Solutions**:
- Reduce archetype count in configuration
- Increase sampling intervals
- Disable derived stats analysis if not needed
- Use CLI dry-run mode for testing

### Debug Mode

Enable verbose logging for detailed diagnostics:

```typescript
const detector = createArchetypeDriftDetector({
  verbose: true,
  weightChangeThreshold: 0.05,
});

detector.analyzeDrift();
```

### Drift Investigation

When drift is detected:

1. **Review Detection Summary**: Check severity and affected archetypes
2. **Analyze Weight Changes**: Look at specific stat weight modifications
3. **Check Recommendations**: Follow suggested actions
4. **Monitor Trends**: Use CLI for extended analysis
5. **Review Configuration**: Validate BalancerConfig changes

## Integration Examples

### CI/CD Pipeline

```yaml
# .github/workflows/archetype-drift-check.yml
name: Archetype Drift Check
on: [push, pull_request]

jobs:
  drift-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Run archetype drift analysis
        run: |
          npx tsx scripts/balancer/archetypeDriftReport.ts \
            -o ci-archetype-drift-report.json \
            -f json \
            -t 0.1 \
            --exit-code \
            --verbose
      - name: Upload report
        if: failure()
          uses: actions/upload-artifact@v4
          with:
            name: archetype-drift-report
            path: ci-archetype-report.json
```

### Development Workflow

```typescript
// scripts/monitor-archetype-drift.ts
import { createArchetypeDriftDetector } from '@/balancing/analytics/ArchetypeDriftDetector';

async function monitorArchetypeDrift() {
  const detector = createArchetypeDriftDetector({
    verbose: true,
    weightChangeThreshold: 0.05,
  });

  try {
    await detector.loadBaseline();
    await detector.createCurrentSnapshot();
    
    const detection = detector.analyzeDrift();
    
    if (detection.severity !== 'none') {
      console.log(`🚨 Archetype drift detected: ${detection.severity}`);
      
      // Generate report
      const { ArchetypeDriftReportRunner } = await import('./archetypeDriftReport');
      const runner = new ArchetypeDriftReportRunner({
        output: `reports/archetype-drift-${Date.now()}.md`,
        format: 'markdown',
        verbose: true,
      });
      
      await runner.run();
    }
  } catch (error) {
    console.error('Failed to monitor archetype drift:', error);
  }
}

// Run monitoring
monitorArchetypeDrift();
```

### Production Monitoring

```typescript
// src/monitoring/ArchetypeDriftService.ts
export class ArchetypeDriftService {
  private detector: ArchetypeDriftDetector;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private reportInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<ArchetypeDriftDetectionConfig> = {}) {
    this.detector = createArchetypeDriftDetector(config);
  }

  startMonitoring(intervalMs: number = 3600000): void { // 1 hour default
    this.stopMonitoring();
    
    this.monitoringInterval = setInterval(async () => {
      await this.performCheck();
    }, intervalMs);
    
    this.reportInterval = setInterval(async () => {
      await this.generateReport();
    }, 86400000); // Daily reports
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
  }

  private async performCheck(): Promise<void> {
    try {
      await this.detector.loadBaseline();
      await this.detector.createCurrentSnapshot();
      
      const detection = this.detector.analyzeDrift();
      
      if (detection.severity !== 'none') {
        // Alert team
        await this.sendAlert(detection);
      }
    } catch (error) {
      console.error('Failed to perform drift check:', error);
    }
  }

  private async generateReport(): Promise<void> {
    try {
      const { ArchetypeDriftReportRunner } = await import('./archetypeDriftReport');
      const runner = new ArchetypeDriftReportRunner({
        output: `reports/archetype-drift-${new Date().toISOString().split('T')[0]}.md`,
        format: 'markdown',
        verbose: false,
      });
      
      await runner.run();
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  }

  private async sendAlert(detection: ArchetypeDriftDetectionSchema): Promise<void> {
    // Integration with alerting system
    console.log(`🚨 ALERT: Archetype drift detected - ${detection.severity}`);
    
    // Send to Slack, email, or other alerting system
  }
}
```

## API Reference

### ArchetypeDriftDetector Class

#### Constructor

```typescript
constructor(config?: Partial<ArchetypeDriftDetectionConfig>)
```

#### Methods

- `loadBaseline(): Promise<void>` - Load baseline snapshot from storage
- `saveCurrentSnapshot(): Promise<void>` - Save current snapshot to storage
- `createCurrentSnapshot(): Promise<void>` - Create current snapshot from BalancerConfig
- `analyzeDrift(): ArchetypeDriftDetectionSchema` - Analyze drift between snapshots
- `getState(): DetectorState` - Get current detector state
- `getCurrentAnalysis(): ArchetypeDriftDetectionSchema | null` - Get current drift analysis
- `getDetectionHistory(): ArchetypeDriftDetectionSchema[]` - Get detection history
- `clearHistory(): void` - Clear detection history
- `reset(): void` - Reset detector state
- `updateConfig(config: Partial<ArchetypeDriftDetectionConfig>): void` - Update configuration
- `exportState(): ExportState` - Export detector state for persistence
- `importState(data: ImportState): void` - Import detector state from persistence
- `setTelemetryEnabled(enabled: boolean): void` - Enable/disable telemetry

#### Static Methods

- `createArchetypeDriftDetector(config?: Partial<ArchetypeDriftDetectionConfig>): ArchetypeDriftDetector` - Create new detector instance
- `defaultArchetypeDriftDetector: ArchetypeDriftDetector` - Default instance

### CLI Tool

#### Commands

```bash
# Basic report generation
npx tsx scripts/balancer/archetypeDriftReport.ts -o report.md

# Custom configuration
npx tsx scripts/balancer/archetypeDriftReport.ts \
  -o report.json \
  -f json \
  -t 0.05 \
  --severity-low 0.02 \
  --severity-critical 0.7 \
  --verbose

# CI/CD integration
npx tsx scripts/balancer/archetypeDriftReport.ts \
  -o ci-report.json \
  --exit-code \
  --dry-run
```

## Version History

### v1.0.0 (2026-01-20)

- Initial release
- Core drift detection functionality
- CLI report tool with JSON/Markdown output
- Comprehensive test suite
- Telemetry integration
- Documentation

## Contributing

### Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Run tests: `npm run test`
4. Run linting: `npm run lint -- src/balancing scripts/balancing`

### Adding Features

1. Update schemas in `ArchetypeDriftDetector.ts`
2. Implement functionality in detector class
3. Add comprehensive tests
4. Update CLI tool if needed
5. Update documentation
6. Ensure CI/CD integration

### Testing Guidelines

- Unit tests for all new functionality
- Mock external dependencies
- Test edge cases and error conditions
- Maintain >90% code coverage
- Use deterministic data for tests

### Code Quality

- Follow TypeScript best practices
- Use Zod for all data validation
- Implement proper error handling
- Maintain consistent code style
- Add comprehensive JSDoc comments

## License

This project is licensed under the same terms as the main RPG Balancer project.

## Support

For issues, questions, or contributions:

1. Check existing documentation
2. Review test cases for usage examples
3. Create GitHub issue for bugs or feature requests
4. Follow contribution guidelines

## Best Practices

### Configuration Management

1. Use environment-specific settings
2. Store configuration in version control
3. Document threshold decisions
4. Regular review and adjustment

### Monitoring Strategy

1. Start with conservative thresholds
2. Monitor trends over time
3. Adjust based on historical data
4. Regular review of detection patterns

### Incident Response

1. Immediate: Check detection severity and recommendations
2. Extended: Use CLI for detailed analysis
3. Root Cause: Investigate configuration changes
4. Long-term: Adjust thresholds and add monitoring

## Data Examples

### Sample Archetype Snapshot

```json
{
  "config": {
    "schemaVersion": "1.0.0",
    "timestamp": 1642678800000,
    "balancerVersion": "1.0.0",
    "nodeVersion": "v18.0.0",
    "platform": "linux",
    "pid": 12345,
    "environment": "development",
    "generationMethod": "automatic",
    "totalStats": 5,
    "totalArchetypes": 10,
    "seed": 42
  },
  "archetypes": [
    {
      "id": "warrior",
      "name": "Warrior",
      "archetypeType": "single-stat",
      "statWeights": {
        "strength": 100,
        "agility": 50
      },
      "totalPoints": 150,
      "generatedAt": 1642678800000,
      "seed": 42
    },
    {
      "id": "mage",
      "name": "Mage",
      "archetypeType": "single-stat",
      "statWeights": {
        "intelligence": 100,
        "agility": 30
      },
      "totalPoints": 130,
      "generatedAt": 1642678800000,
      "seed": 42
    }
  ],
  "globalWeights": {
    "strength": 1.0,
    "agility": 0.8,
    "intelligence": 0.6
  },
  "derivedStats": ["damage", "health", "armor"],
  "incompatiblePairs": [
    ["strength", "intelligence"]
  ],
  "metadata": {
    "generationDurationMs": 100,
    "memoryUsageMB": 50,
    "cpuUsagePercent": 10
  }
}
```

### Sample Drift Detection Result

```json
{
  "timestamp": 1642678800000,
  "severity": "medium",
  "totalArchetypes": 10,
  "driftedArchetypes": [
    {
      "archetypeId": "warrior",
      "currentWeights": {
        "strength": 110,
        "agility": 55
      },
      "baselineWeights": {
        "strength": 100,
        "agility": 50
      },
      "weightChanges": {
        "strength": 10,
        "agility": 10
      },
      "driftPercentage": 10,
      "severity": "medium",
      "affectedStats": ["strength", "agility"],
      "recommendations": [
        "Review warrior archetype - 10.00% weight change",
        "Focus on affected stats: strength, agility"
      ],
      "analyzedAt": 1642678800000
    }
  ],
  "globalWeightChanges": {},
  "derivedStatsChanges": [],
  "metrics": {
    "analysisDurationMs": 150,
    "snapshotComparisonMs": 50,
    "driftCalculationMs": 100
  },
  "recommendations": [
    "MEDIUM: Moderate archetype drift detected",
    "Review recent configuration changes",
    "Consider adjusting weight thresholds"
  ],
  "detectionConfig": {
    "weightChangeThreshold": 0.1,
    "severityThresholds": {
      "low": 0.05,
      "medium": 0.2,
      "high": 0.5,
      "critical": 0.8
    },
    "minSampleCount": 2,
    "includeDerivedStats": true,
    "verbose": false
  }
}
```

### CLI Report Output

#### Markdown Format

```markdown
# Archetype Drift Report

**Report Generated:** 2022-01-20T12:00:00.000Z
**Process ID:** 12345
**Node Version:** v18.0.0
**Platform:** linux (x64)

## Configuration

- **Weight Change Threshold:** 0.1
- **Severity Thresholds:**
  - Low: 0.05
  - Medium: 0.2
  - High: 0.5
  - Critical: 0.8
- **Minimum Sample Count:** 2
- **Include Derived Stats:** true

## Detection Summary

- **Overall Severity:** MEDIUM
- **Total Archetypes:** 10
- **Drifted Archetypes:** 3
- **Global Weight Changes:** 0
- **Derived Stats Changes:** 0

## Drifted Archetypes

| Archetype ID | Drift % | Severity | Affected Stats | Recommendations |
|-------------|---------|----------|---------------|----------------|
| warrior | 10.00% | MEDIUM | strength, agility | Review warrior archetype - 10.00% weight change |
| mage | 20.00% | MEDIUM | intelligence, agility | Review mage archetype - 20.00% weight change |
| rogue | 5.00% | LOW | dexterity, perception | Review rogue archetype - 5.00% weight change |

## Performance Metrics

- **Report Generation:** 250ms
- **Baseline Load:** 50ms
- **Current Snapshot:** 100ms
- **Analysis:** 100ms

## Recommendations

- MEDIUM: Moderate archetype drift detected
- Review recent configuration changes
- Consider adjusting weight thresholds

## Exit Code

1

---
*Generated by Archetype Drift Report CLI v1.0.0*
```

#### JSON Format

```json
{
  "report": {
    "config": {
      "weightChangeThreshold": 0.1,
      "severityThresholds": {
        "low": 0.05,
        "medium": 0.2,
        "high": 0.5,
        "critical": 0.8
      },
      "minSampleCount": 2,
      "includeDerivedStats": true,
      "verbose": false
    },
    "detection": {
      "timestamp": 1642678800000,
      "severity": "medium",
      "totalArchetypes": 10,
      "driftedArchetypes": [...],
      "globalWeightChanges": {},
      "derivedStatsChanges": [],
      "metrics": {
        "analysisDurationMs": 150,
        "snapshotComparisonMs": 50,
        "driftCalculationMs": 100
      },
      "recommendations": [...],
      "detectionConfig": {
        "weightChangeThreshold": 0.1,
        "severityThresholds": {
          "low": 0.05,
          "medium": 0.2,
          "high": 0.5,
          "critical": 0.8
        },
        "minSampleCount": 2,
        "includeDerivedStats": true,
        "verbose": false
      }
    },
    "timestamp": 1642678800000,
    "processInfo": {
      "pid": 12345,
      "nodeVersion": "v18.0.0",
      "platform": "linux",
      "arch": "x64"
    },
    "performance": {
      "reportGenerationMs": 250,
      "baselineLoadMs": 50,
      "currentSnapshotMs": 100,
      "analysisMs": 100
    },
    "recommendations": [...],
    "exitCode": 1
  },
  "exportMetadata": {
    "exportedAt": 1642678800000,
    "exportedBy": "archetype-drift-report-cli",
    "format": "json",
    "version": "1.0.0"
  }
}
```

## Integration Points

### BalancerConfigStore

The detector integrates with:
- `BalancerConfigStore.getConfig()` - Current configuration
- `BalancerConfigStore.getArchetypes()` - Generated archetypes
- `BalancerConfigStore.getDerivedStats()` - Derived stat definitions
- `BalancerConfigStore.getIncompatibleStatPairs()` - Incompatible pairs

### StressTestArchetypeGenerator

The detector uses:
- `StressTestArchetypeGenerator.generateArchetypes()` - Generate test archetypes
- Configuration from BalancerConfigStore for generation

### PersistenceService

The detector uses:
- `PersistenceService.loadData()` - Load baseline snapshots
- `PersistenceService.saveData()` - Save current snapshots
- Async storage with error handling

### Telemetry System

The detector integrates with:
- `trackTelemetryEvent()` - Generic telemetry tracking
- Event routing to appropriate diagnostics channels
- Payload validation and formatting

## Migration Guide

### From Manual Analysis

1. **Export Current State**: Document current archetype weights
2. **Create Baseline**: Save current configuration as baseline
3. **Install Detector**: Add detector to monitoring system
4. **Configure Thresholds**: Set appropriate thresholds for environment
5. **Set Up CI/CD**: Add drift checks to pipeline
6. **Monitor Trends**: Review drift patterns over time

### From Custom Scripts

1. **Extract Logic**: Move analysis logic to detector
2. **Standardize Format**: Use detector schemas for data
3. **Add Telemetry**: Integrate with telemetry system
4. **Replace CLI**: Use standard CLI tool
5. **Update Tests**: Migrate tests to use detector API

### Configuration Migration

```typescript
// Old configuration
const oldConfig = {
  threshold: 0.1,
  severityLevels: {
    low: 0.05,
    medium: 0.2,
    high: 0.5,
    critical: 0.8,
  },
};

// New configuration
const newConfig = {
  weightChangeThreshold: oldConfig.threshold,
  severityThresholds: oldConfig.severityLevels,
  minSampleCount: 2,
  includeDerivedStats: true,
  verbose: false,
};
```

## Security Considerations

### Data Privacy

- No personal data in snapshots
- Only configuration and generated data
- Optional telemetry can be disabled
- Local storage only

### Access Control

- Snapshots contain configuration data only
- No user data or sensitive information
- File system access limited to designated directories
- CLI tool respects file permissions

### Validation

- All data validated with Zod schemas
- Type safety enforced throughout
- Error handling for corrupted data
- Version compatibility checks

## Roadmap

### Future Enhancements

1. **Visual Dashboard**: Web interface for real-time monitoring
2. **Trend Analysis**: Historical trend analysis and prediction
3. **Alert Integration**: Integration with external alerting systems
4. **Batch Analysis**: Multiple baseline comparison
5. **Machine Learning**: Pattern recognition for drift prediction

### Planned Features

- **Automated Recommendations**: AI-driven suggestions for weight adjustments
- **Impact Analysis**: Quantitative impact assessment of changes
- **Rollback Suggestions**: Safe rollback recommendations
- **Integration Testing**: Automated integration with BalancerConfig changes

### Community Contributions

- **Custom Severity Thresholds**: Environment-specific configurations
- **Additional Metrics**: Custom drift analysis metrics
- **Export Formats**: Additional export formats (CSV, XML, etc.)
- **Integration Examples**: More integration examples and patterns

## Conclusion

The Archetype Drift Detector provides a robust system for monitoring weight changes in RPG Balancer archetypes between releases. With comprehensive drift analysis, configurable thresholds, and detailed reporting, it enables teams to maintain balance consistency and detect issues early in the development process.

The system successfully provides:

1. **Robust Drift Detection**: Multi-criteria analysis with configurable thresholds
2. **Comprehensive Reporting**: Detailed JSON and Markdown reports with recommendations
3. **Telemetry Integration**: Automatic event emission for detected issues
4. **Full Test Coverage**: Comprehensive unit test coverage with mock scenarios
5. **CLI Tool**: Command-line interface for automated analysis

The implementation follows RPG Balancer philosophy with config-first design, proper type safety, comprehensive testing, and detailed error reporting. The Archetype Drift Detector provides a powerful tool for maintaining archetype balance consistency across releases.
