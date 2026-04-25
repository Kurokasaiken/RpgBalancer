# STS Seed Diff Documentation

## Overview

The STS Seed Diff tool provides comprehensive analysis and comparison of two STS (Slay the Spire) scenario runner seeds. It identifies divergences in simulation results, generates detailed reports, and provides statistical insights into how different seeds affect gameplay outcomes.

## Features

- **Config-First Design**: All thresholds and parameters configurable via Zod schema
- **Multiple Output Formats**: JSON, Markdown, and CSV export options
- **Statistical Analysis**: Correlation, trends, and significance testing
- **Turn-by-Turn Comparison**: Detailed analysis of simulation progression
- **Telemetry Integration**: Automatic emission of `sts_seed_diff_run` events
- **Comprehensive Testing**: Full unit test coverage with edge cases

## Installation

The tool is part of the RPG Balancer project and requires Node.js 20+.

```bash
# Navigate to project root
cd /path/to/rpg-balancer

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Command Line Interface

```bash
# Basic usage
npm run tsx scripts/sts/seedDiff.ts --seed1 12345 --seed2 67890 --scenario basic-1v1

# With custom threshold
npm run tsx scripts/sts/seedDiff.ts \
  --seed1 12345 \
  --seed2 67890 \
  --scenario basic-1v1 \
  --threshold 0.05 \
  --output ./my-report.json

# Generate markdown report
npm run tsx scripts/sts/seedDiff.ts \
  --seed1 12345 \
  --seed2 67890 \
  --scenario basic-1v1 \
  --format markdown \
  --output ./seed-diff-report.md

# With configuration file
npm run tsx scripts/sts/seedDiff.ts \
  --seed1 12345 \
  --seed2 67890 \
  --scenario basic-1v1 \
  --config ./seed-diff-config.json \
  --verbose
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--seed1` | First seed value (required) | - |
| `--seed2` | Second seed value (required) | - |
| `-s, --scenario` | Scenario identifier (required) | - |
| `-t, --threshold` | Divergence threshold (0-1) | 0.02 |
| `-m, --max-turns` | Maximum turns to analyze | 100 |
| `-o, --output` | Output file path | `./seed-diff-report` |
| `-f, --format` | Output format (`json`, `markdown`, `csv`) | `json` |
| `-c, --config` | Configuration file path | - |
| `-v, --verbose` | Verbose output | `false` |
| `-q, --quiet` | Quiet mode | `false` |

## Configuration

### Configuration Schema

```typescript
interface SeedDiffConfig {
  /** Threshold for highlighting significant divergences (default: 2%) */
  divergenceThreshold: number;
  
  /** Maximum number of turns to analyze (default: 100) */
  maxTurns: number;
  
  /** Whether to include detailed turn-by-turn analysis */
  includeTurnByTurn: boolean;
  
  /** Whether to include statistical analysis */
  includeStatistics: boolean;
  
  /** Custom weights for different metrics */
  metricWeights: {
    hp: number;
    mana: number;
    damage: number;
    turnCount: number;
  };
}
```

### Example Configuration File

```json
{
  "divergenceThreshold": 0.05,
  "maxTurns": 200,
  "includeTurnByTurn": true,
  "includeStatistics": true,
  "metricWeights": {
    "hp": 1.0,
    "mana": 0.8,
    "damage": 1.2,
    "turnCount": 0.5
  }
}
```

## Output Formats

### JSON Output

Complete structured data with all analysis results:

```json
{
  "metadata": {
    "seedA": 12345,
    "seedB": 67890,
    "scenarioId": "basic-1v1",
    "timestamp": "2026-01-19T10:30:00.000Z",
    "config": { ... }
  },
  "results": {
    "resultA": "victory",
    "resultB": "defeat",
    "summaryA": { ... },
    "summaryB": { ... }
  },
  "metricDivergences": [
    {
      "metric": "final_hp",
      "valueA": 75.0,
      "valueB": 60.0,
      "difference": 15.0,
      "percentDifference": 0.2,
      "isSignificant": true,
      "weight": 1.0
    }
  ],
  "turnComparisons": [ ... ],
  "statistics": {
    "overallDivergence": 0.15,
    "significantDivergences": 3,
    "totalDivergences": 6,
    "maxDivergencePercent": 0.25,
    "avgDivergencePercent": 0.12,
    "divergenceTrend": "increasing",
    "firstSignificantTurn": 5,
    "correlation": 0.85
  },
  "significantDivergences": [ ... ]
}
```

### Markdown Output

Human-readable report with tables and formatting:

```markdown
# STS Seed Diff Report

## Metadata

- **Scenario**: basic-1v1
- **Seed A**: 12345
- **Seed B**: 67890
- **Timestamp**: 2026-01-19T10:30:00.000Z
- **Divergence Threshold**: 2.0%

## Results Summary

- **Result A**: victory
- **Result B**: defeat
- **Overall Divergence**: 15.00%
- **Significant Divergences**: 3/6
- **Max Divergence**: 25.00%
- **Correlation**: 0.8500

## Significant Divergences (> 2.0%)

| Metric | Seed A | Seed B | Difference | % Difference |
|--------|--------|--------|------------|-------------|
| final_hp | 75.00 | 60.00 | 15.00 | 20.00% |
| total_mana_spent | 50.00 | 61.00 | 11.00 | 18.03% |
| turn_count | 15.00 | 18.00 | 3.00 | 16.67% |
```

### CSV Output

Tabular data for spreadsheet analysis:

```csv
Metric,Value A,Value B,Difference,Percent Difference,Is Significant,Weight
final_hp,75,60,15,20.00%,true,1.0
final_enemy_hp,0,5,5,Infinity%,false,1.0
total_mana_spent,50,61,11,18.03%,true,0.8
turn_count,15,18,3,16.67%,true,0.5
```

## Metrics Analyzed

The tool analyzes the following key metrics:

### Combat Metrics
- **final_hp**: Player's final hit points
- **final_enemy_hp**: Enemy's final hit points
- **total_damage_dealt**: Total damage dealt to enemy

### Resource Metrics
- **total_mana_spent**: Total mana consumed across all types
- **mana_efficiency**: Mana efficiency ratio

### Game Progression Metrics
- **turn_count**: Total turns completed
- **agency_rate**: Percentage of turns with player actions

## Statistical Analysis

### Divergence Calculation

Each metric's divergence is calculated as:

```
percentDifference = |valueA - valueB| / average(valueA, valueB)
isSignificant = percentDifference > threshold
```

### Overall Divergence

Weighted average of all metric divergences:

```
overallDivergence = Σ(percentDifference × weight) / Σ(weight)
```

### Correlation Analysis

Simplified correlation based on HP similarity across turns:

```
correlation = average(1 - |hpA - hpB| / max(hpA, hpB))
```

### Trend Analysis

Identifies patterns in divergence over time:
- **Increasing**: Divergence grows over turns
- **Decreasing**: Divergence reduces over turns  
- **Stable**: Divergence remains consistent

## Telemetry Integration

The tool automatically emits telemetry events:

```typescript
{
  eventType: 'sts_seed_diff_run',
  data: {
    seedA: 12345,
    seedB: 67890,
    scenarioId: 'basic-1v1',
    overallDivergence: 0.15,
    significantDivergences: 3,
    correlation: 0.85,
    config: { ... }
  }
}
```

## API Usage

### Programmatic Access

```typescript
import { SeedDiffAnalyzer } from './src/balancing/tools/sts/SeedDiffAnalyzer';

// Create analyzer with custom config
const analyzer = new SeedDiffAnalyzer({
  divergenceThreshold: 0.05,
  maxTurns: 200,
  includeTurnByTurn: true,
  includeStatistics: true,
});

// Analyze seeds
const result = await analyzer.analyzeSeeds(
  seedA,
  seedB,
  scenarioId,
  runA, // { state: STSSimulatorState, summary: STSRunSummary }
  runB
);

// Access results
console.log(`Overall divergence: ${result.statistics.overallDivergence * 100}%`);
console.log(`Significant divergences: ${result.significantDivergences.length}`);
```

## Testing

Run the test suite:

```bash
# Run all tests
npm run test -- tests/unit/sts/SeedDiffAnalyzer.test.ts

# Run with coverage
npm run test -- tests/unit/sts/SeedDiffAnalyzer.test.ts --coverage
```

## Integration Points

### STS Simulator Integration

The tool integrates with the existing STS simulator infrastructure:

- **STSSimulatorState**: Provides game state data
- **STSRunSummary**: Provides aggregated run statistics
- **STS Telemetry**: Emits analysis events

### Scenario Runner Integration

Works with the scenario runner system:

- **Scenario Config**: Validates scenario compatibility
- **Seed Management**: Handles seed generation and tracking
- **Result Comparison**: Compares simulation outcomes

## Performance Considerations

### Optimization Features

- **Configurable Limits**: `maxTurns` prevents excessive processing
- **Efficient Algorithms**: O(n) complexity for turn comparisons
- **Memory Management**: Streaming processing for large datasets

### Benchmarks

Typical performance characteristics:

| Data Size | Processing Time | Memory Usage |
|-----------|------------------|--------------|
| Small (≤50 turns) | <100ms | <10MB |
| Medium (≤200 turns) | <500ms | <50MB |
| Large (≤1000 turns) | <2s | <200MB |

## Troubleshooting

### Common Issues

**Error: "Seeds must be different"**
- Ensure seed1 and seed2 are different values

**Error: "Valid scenario ID is required"**
- Provide a valid scenario identifier

**Error: "Both runs must use the same deck and enemy configuration"**
- Ensure both simulations use identical deck and enemy settings

**Performance Issues**
- Reduce `maxTurns` in configuration
- Use `includeTurnByTurn: false` for large datasets

### Debug Mode

Enable verbose output for detailed debugging:

```bash
npm run tsx scripts/sts/seedDiff.ts \
  --seed1 12345 \
  --seed2 67890 \
  --scenario basic-1v1 \
  --verbose
```

## Future Enhancements

Planned improvements:

1. **Enhanced Visualization**: Graphical divergence plots
2. **Batch Processing**: Compare multiple seeds simultaneously
3. **Historical Tracking**: Track divergence trends over time
4. **Advanced Statistics**: More sophisticated correlation analysis
5. **Export Formats**: Additional formats (PDF, Excel)
6. **Real-time Analysis**: Live divergence monitoring during simulation

## Contributing

When contributing to the Seed Diff tool:

1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure all safeguards pass (lint, test, build)
5. Include telemetry for new functionality

## License

This tool is part of the RPG Balancer project and follows the same licensing terms.
