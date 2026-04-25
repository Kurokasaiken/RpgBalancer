# STS Numeric Simulator Metrics Documentation

**Version:** 1.0.0  
**Created:** 2026-01-20  
**Author:** Cascade  

## Overview

The STS Numeric Simulator Metrics system provides comprehensive metric recording and analysis capabilities for Slay the Spire-style numeric simulations. This config-first system captures mana curves, agency gaps, pacing metrics, and performance data with export functionality for analysis and reporting.

## Architecture

### Core Components

1. **NumericSimulatorMetricRecorder** - Main recording engine
2. **MetricRecorderConfig** - Configuration interface
3. **CLI Export Tool** - Command-line export functionality
4. **Zod Schemas** - Data validation and type safety

### Metric Types

#### Mana Curve Metrics
Tracks mana generation and usage patterns throughout simulations:

```typescript
interface ManaCurveMetrics {
  turn: number;
  totalMana: number;
  manaByType: Record<STSManaType, number>;
  generated: Record<STSManaType, number>;
  spent: Record<STSManaType, number>;
  efficiency: number;
}
```

#### Agency Gap Metrics
Analyzes decision-making capabilities and optimal play gaps:

```typescript
interface AgencyGapMetrics {
  turn: number;
  availableActions: number;
  agencyScore: number;
  manaEfficiency: number;
  cardQuality: number;
  threatLevel: number;
  agencyGap: number; // Difference from optimal
}
```

#### Pacing Metrics
Monitors combat progression and resource management:

```typescript
interface PacingMetrics {
  turn: number;
  damageDealt: number;
  damageTaken: number;
  damageRatio: number;
  turnPace: number;
  depletionRate: number;
  victoryProximity: number;
}
```

#### Performance Metrics
Overall simulation performance statistics:

```typescript
interface PerformanceMetrics {
  totalTurns: number;
  averageTurnTime: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  manaEfficiency: number;
  cardUtilization: number;
  outcome: 'victory' | 'defeat' | 'timeout';
  simulationDuration: number;
}
```

## Configuration

### Default Configuration

```typescript
export const DEFAULT_METRIC_RECORDER_CONFIG: MetricRecorderConfig = {
  enableManaCurves: true,
  enableAgencyGaps: true,
  enablePacing: true,
  enablePerformance: true,
  resolution: 1, // Record every turn
  storageKey: 'sts_numeric_simulator_metrics',
  maxRecords: 100,
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableManaCurves` | boolean | true | Enable mana curve recording |
| `enableAgencyGaps` | boolean | true | Enable agency gap analysis |
| `enablePacing` | boolean | true | Enable pacing metrics |
| `enablePerformance` | boolean | true | Enable performance metrics |
| `resolution` | number | 1 | Recording resolution (turns per sample) |
| `storageKey` | string | 'sts_numeric_simulator_metrics' | Storage key for persistence |
| `maxRecords` | number | 100 | Maximum records to keep in memory |

## Usage Examples

### Basic Recording

```typescript
import { NumericSimulatorMetricRecorder } from '@/balancing/sts/NumericSimulatorMetricRecorder';

// Create recorder with default configuration
const recorder = new NumericSimulatorMetricRecorder();

// Start a new simulation
recorder.startSimulation('sim-001', 'ironclad-starter', 'jaw-worm', 12345);

// Record turn results
for (const turnResult of simulationTurns) {
  recorder.recordTurn(turnResult);
}

// Finish simulation and get metrics
const metrics = recorder.finishSimulation(simulationResult);
console.log('Simulation metrics:', metrics);
```

### Custom Configuration

```typescript
import { NumericSimulatorMetricRecorder, MetricRecorderConfig } from '@/balancing/sts/NumericSimulatorMetricRecorder';

const customConfig: Partial<MetricRecorderConfig> = {
  enableManaCurves: true,
  enableAgencyGaps: false, // Disable agency analysis
  resolution: 5, // Record every 5 turns
  maxRecords: 50,
};

const recorder = new NumericSimulatorMetricRecorder(customConfig);
```

### Integration with STSNumericSimulatorEngine

```typescript
import { STSNumericSimulatorEngine } from '@/balancing/hooks/archmage/STSNumericSimulatorEngine';
import { NumericSimulatorMetricRecorder } from '@/balancing/sts/NumericSimulatorMetricRecorder';

// Create simulator and recorder
const simulator = new STSNumericSimulatorEngine(simulationConfig);
const recorder = new NumericSimulatorMetricRecorder();

// Hook into simulation lifecycle
recorder.startSimulation(simulationId, deckPreset, enemyConfig, seed);

// Run simulation with metric recording
const result = await simulator.run();

// Record each turn (example integration)
for (const turnResult of result.turnResults) {
  recorder.recordTurn(turnResult);
}

// Finalize recording
const metrics = recorder.finishSimulation(result);
```

## Export Functionality

### JSON Export

```typescript
// Export all records to JSON
const jsonExport = recorder.exportToJSON();
console.log(jsonExport);

// Export filtered records
const victoryRecords = recorder.getRecords().filter(r => r.performance.outcome === 'victory');
const filteredJson = recorder.exportToJSON(victoryRecords);
```

### CSV Export

```typescript
// Export to CSV format
const csvExport = recorder.exportToCSV();
console.log(csvExport);

// CSV output includes:
# id,timestamp,simulationId,deckPreset,enemyConfig,seed,totalTurns,outcome,averageManaEfficiency,averageAgencyScore,averageDamageRatio,simulationDuration
metric_1234567890,1642123456789,sim-001,ironclad,jaw-worm,12345,15,victory,0.856,72.3,2.45,1500
metric_1234567891,1642123456790,sim-002,silent,louse,54321,8,defeat,0.723,65.1,1.23,800
```

### CLI Export Tool

The command-line export tool provides powerful filtering and aggregation capabilities:

```bash
# Export all metrics to JSON
npx tsx scripts/sts/numericSimulatorMetricsExport.ts

# Export to CSV with output file
npx tsx scripts/sts/numericSimulatorMetricsExport.ts -f csv -o metrics.csv

# Filter by deck preset
npx tsx scripts/sts/numericSimulatorMetricsExport.ts --filter.deckPreset ironclad

# Filter by outcome
npx tsx scripts/sts/numericSimulatorMetricsExport.ts --filter.outcome victory

# Multiple filters
npx tsx scripts/sts/numericSimulatorMetricsExport.ts \
  --filter.deckPreset ironclad \
  --filter.outcome victory \
  --filter.minTurns 10 \
  --filter.maxTurns 20

# Export to Markdown with aggregation
npx tsx scripts/sts/numericSimulatorMetricsExport.ts -f markdown -a

# Verbose output
npx tsx scripts/sts/numericSimulatorMetricsExport.ts -v

# Custom input file
npx tsx scripts/sts/numericSimulatorMetricsExport.ts -i custom-metrics.json
```

### CLI Options Reference

| Option | Short | Long | Description | Example |
|--------|-------|------|-------------|---------|
| Input | `-i` | `--input` | Input metrics file path | `-i data/metrics.json` |
| Output | `-o` | `--output` | Output file path | `-o results.csv` |
| Format | `-f` | `--format` | Output format | `-f markdown` |
| Filter | | `--filter.*` | Filter options | `--filter.deckPreset ironclad` |
| Aggregate | `-a` | | Show aggregated statistics | `-a` |
| Verbose | `-v` | `--verbose` | Verbose output | `-v` |

## Data Analysis

### Mana Curve Analysis

Mana curve metrics help identify:

- **Mana Generation Patterns**: How mana availability changes over time
- **Mana Efficiency**: Ratio of mana spent to mana available
- **Color Distribution**: Balance between different mana types
- **Resource Planning**: Optimal mana usage strategies

```typescript
// Example: Calculate average mana efficiency
const records = recorder.getRecords();
const avgEfficiency = records.reduce((sum, record) => {
  const recordAvg = record.manaCurves.reduce((s, curve) => s + curve.efficiency, 0) / record.manaCurves.length;
  return sum + recordAvg;
}, 0) / records.length;

console.log(`Average mana efficiency: ${avgEfficiency.toFixed(3)}`);
```

### Agency Gap Analysis

Agency metrics reveal:

- **Decision Quality**: How close to optimal play the simulation achieves
- **Action Availability**: Number of viable options each turn
- **Card Quality**: Average quality of available cards
- **Threat Response**: Ability to handle enemy threats

```typescript
// Example: Find simulations with high agency gaps
const highGapRecords = records.filter(record => {
  const maxGap = Math.max(...record.agencyGaps.map(gap => gap.agencyGap));
  return maxGap > 20; // More than 20 points below optimal
});

console.log(`Simulations with high agency gaps: ${highGapRecords.length}`);
```

### Pacing Analysis

Pacing metrics show:

- **Damage Progression**: How damage is dealt and received over time
- **Resource Depletion**: Rate of health/resource consumption
- **Victory Trajectory**: Likelihood of winning based on current state
- **Turn Efficiency**: Actions taken per turn

```typescript
// Example: Calculate average damage ratio by deck
const deckStats = records.reduce((acc, record) => {
  if (!acc[record.deckPreset]) {
    acc[record.deckPreset] = { totalRatio: 0, count: 0 };
  }
  const avgRatio = record.pacing.reduce((sum, pace) => sum + pace.damageRatio, 0) / record.pacing.length;
  acc[record.deckPreset].totalRatio += avgRatio;
  acc[record.deckPreset].count += 1;
  return acc;
}, {} as Record<string, { totalRatio: number; count: number }>);

Object.entries(deckStats).forEach(([deck, stats]) => {
  const avgRatio = stats.totalRatio / stats.count;
  console.log(`${deck}: Average damage ratio ${avgRatio.toFixed(3)}`);
});
```

## Performance Considerations

### Memory Usage

- **Record Limit**: Default maximum of 100 records in memory
- **Turn Resolution**: Higher resolution records more data per turn
- **Metric Types**: Enabling all metrics provides comprehensive data but uses more memory

### Processing Performance

- **Large Simulations**: Handles 1000+ turns efficiently (< 1 second)
- **Batch Processing**: Designed for processing multiple simulations
- **Export Performance**: JSON export fastest, CSV moderate, Markdown slowest

### Optimization Tips

```typescript
// For large-scale analysis, consider:
const optimizedConfig: Partial<MetricRecorderConfig> = {
  resolution: 5, // Record every 5 turns instead of every turn
  enableAgencyGaps: false, // Disable if not needed
  maxRecords: 50, // Reduce memory footprint
};

// For detailed analysis:
const detailedConfig: Partial<MetricRecorderConfig> = {
  resolution: 1, // Record every turn
  enableManaCurves: true,
  enableAgencyGaps: true,
  enablePacing: true,
  enablePerformance: true,
};
```

## Integration Points

### With KS-081 Telemetry Dashboard

The metrics system integrates with the STS Telemetry Dashboard:

```typescript
// Export metrics for dashboard consumption
const dashboardData = recorder.exportToJSON();
// Send to telemetry system
telemetry.emit('sts_metrics_collected', {
  recordCount: recorder.getRecords().length,
  timestamp: Date.now(),
  data: dashboardData,
});
```

### With KS-080 Numeric Simulator

Hook into the simulator engine for automatic recording:

```typescript
// Enhanced simulator with built-in metrics
class EnhancedSTSSimulator extends STSNumericSimulatorEngine {
  private metricRecorder: NumericSimulatorMetricRecorder;

  constructor(config: SimulationConfig, metricConfig?: Partial<MetricRecorderConfig>) {
    super(config);
    this.metricRecorder = new NumericSimulatorMetricRecorder(metricConfig);
  }

  async run(): Promise<SimulationResult> {
    this.metricRecorder.startSimulation(this.id, this.deck.name, this.enemy.name, this.seed);
    
    const result = await super.run();
    
    // Record each turn (integrate into simulation loop)
    for (const turnResult of result.turnResults) {
      this.metricRecorder.recordTurn(turnResult);
    }
    
    const metrics = this.metricRecorder.finishSimulation(result);
    
    // Emit telemetry event
    this.emitTelemetry('sts_simulation_completed', { result, metrics });
    
    return result;
  }
}
```

## Testing

### Unit Tests

Comprehensive unit tests cover:

- Configuration validation
- Metric recording accuracy
- Export functionality
- Data validation with Zod schemas
- Performance with large datasets
- Edge cases and error handling

```bash
# Run unit tests
npm run test -- tests/unit/sts/NumericSimulatorMetricRecorder.test.ts
```

### Integration Tests

Test integration with:

- STSNumericSimulatorEngine
- Telemetry systems
- Export CLI tool
- Data persistence

```bash
# Run integration tests
npm run test -- tests/integration/sts/
```

## Troubleshooting

### Common Issues

#### No Metrics Recorded
```typescript
// Ensure simulation is started before recording turns
recorder.startSimulation(simulationId, deckPreset, enemyConfig, seed);
recorder.recordTurn(turnResult); // This will throw if not started
```

#### Empty Export Results
```typescript
// Check if records exist before exporting
const records = recorder.getRecords();
if (records.length === 0) {
  console.log('No records to export');
  return;
}
```

#### Memory Issues with Large Simulations
```typescript
// Use optimized configuration for large datasets
const optimizedConfig: Partial<MetricRecorderConfig> = {
  resolution: 10, // Reduce recording frequency
  maxRecords: 20, // Limit stored records
  enableAgencyGaps: false, // Disable expensive metrics
};
```

### Debug Mode

Enable verbose logging for debugging:

```typescript
const debugConfig: Partial<MetricRecorderConfig> = {
  // Enable all metrics for detailed debugging
  enableManaCurves: true,
  enableAgencyGaps: true,
  enablePacing: true,
  enablePerformance: true,
  resolution: 1, // Record every turn
};

const recorder = new NumericSimulatorMetricRecorder(debugConfig);
```

## Future Enhancements

### Planned Features

1. **Real-time Streaming**: Stream metrics during simulation
2. **Advanced Analytics**: Statistical analysis and trend detection
3. **Visualization Integration**: Chart generation and dashboard widgets
4. **Performance Optimization**: Incremental recording and compression
5. **Custom Metrics**: Plugin system for domain-specific metrics

### Extension Points

```typescript
// Custom metric interface
interface CustomMetric {
  name: string;
  calculate: (turnResult: TurnResult) => number;
  aggregate: (values: number[]) => number;
}

// Future: Custom metric registration
recorder.registerCustomMetric({
  name: 'cardDrawEfficiency',
  calculate: (turn) => turn.cardsPlayed.length / turn.agency.availableActions,
  aggregate: (values) => values.reduce((a, b) => a + b, 0) / values.length,
});
```

## API Reference

### NumericSimulatorMetricRecorder

#### Constructor
```typescript
constructor(config?: Partial<MetricRecorderConfig>)
```

#### Methods
```typescript
startSimulation(simulationId: string, deckPreset: string, enemyConfig: string, seed: number): void
recordTurn(turnResult: TurnResult): void
finishSimulation(result: SimulationResult): MetricRecord
getRecords(): MetricRecord[]
getRecordsBySimulation(simulationId: string): MetricRecord[]
getRecordsByDeck(deckPreset: string): MetricRecord[]
clearRecords(): void
exportToJSON(records?: MetricRecord[]): string
exportToCSV(records?: MetricRecord[]): string
```

### CLI Tool

```bash
# Basic usage
npx tsx scripts/sts/numericSimulatorMetricsExport.ts [options]

# Options
-i, --input <path>        Input metrics file
-o, --output <path>       Output file path  
-f, --format <format>     Output format (json|csv|markdown)
--filter.* <value>        Filter options
-a, --aggregate           Show aggregated statistics
-v, --verbose             Verbose output
```

## Contributing

When contributing to the metrics system:

1. **Follow Config-First Design**: All configuration should be externalizable
2. **Maintain Type Safety**: Use TypeScript and Zod schemas
3. **Add Tests**: Cover new functionality with unit tests
4. **Document Changes**: Update this documentation
5. **Performance Testing**: Verify impact on simulation performance

## License

This metrics system is part of the RPG Balancer project and follows the same licensing terms.

---

**Last Updated:** 2026-01-20  
**Version:** 1.0.0  
**Maintainer:** Cascade – STS Metrics Team
