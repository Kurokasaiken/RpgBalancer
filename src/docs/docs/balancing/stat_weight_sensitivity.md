# Stat Weight Sensitivity Analysis

## Overview

The Stat Weight Sensitivity Analysis is a config-first tool for analyzing how sensitive balance outcomes are to changes in stat weights using Monte Carlo simulations. It helps identify which stats have the most impact on game balance and provides actionable insights for balancer tuning.

## Features

- **Config-First Design**: All analysis parameters are configurable through Zod-validated schemas
- **Monte Carlo Integration**: Uses the existing Monte Carlo engine for accurate simulation results
- **Weight Perturbation**: Tests multiple perturbation ranges to understand sensitivity curves
- **Multiple Analysis Scopes**: Single stat, pairwise, full system, or custom analysis
- **Comprehensive Metrics**: Win rate, balance score, turns, damage, survivability, and more
- **Export Capabilities**: JSON, CSV, and Markdown export with visualization data
- **CLI Interface**: Command-line tool for easy automation and batch processing
- **Performance Optimized**: Efficient analysis with timeout protection and progress tracking

## Architecture

### Configuration System

The analysis uses a comprehensive configuration system defined in `src/balancing/analysis/StatWeightSensitivity.ts`:

```typescript
interface SensitivityConfig {
  analysis: {
    scope: 'single-stat' | 'pairwise' | 'full-system' | 'custom';
    iterations: number;
    seed: number;
    timeoutMinutes: number;
    verbose: boolean;
  };
  perturbation: {
    ranges: Array<{
      id: string;
      percentage: number;
      steps: number;
      description: string;
    }>;
    bidirectional: boolean;
    maxPerturbations: number;
  };
  targetStats: {
    statIds: string[];
    coreOnly: boolean;
    includeDerived: boolean;
    includePenalty: boolean;
  };
  metrics: {
    primary: Array<'winRate' | 'averageTurns' | 'damageOutput' | 'survivability' | 'balanceScore'>;
    secondary: Array<'synergyScore' | 'powerLevel' | 'efficiency' | 'resourceUsage'>;
    weights: Record<string, number>;
  };
  scenario: {
    template: 'basic-1v1' | 'boss-fight' | 'group-combat' | 'swarm-horde';
    custom?: {
      scenarioType: '1v1' | 'boss' | 'group' | 'swarm';
      targetTurns: number;
      budgetPoints: number;
      archetypes: number;
    };
  };
  export: {
    formats: Array<'json' | 'csv' | 'markdown'>;
    includeDetails: boolean;
    includeVisualization: boolean;
    outputDir: string;
  };
}
```

### Analysis Process

1. **Configuration Loading**: Load and validate analysis configuration
2. **Stat Selection**: Identify target stats based on configuration
3. **Perturbation Generation**: Create weight perturbations for each stat
4. **Monte Carlo Simulation**: Run simulations for each perturbation
5. **Metric Calculation**: Calculate sensitivity metrics from results
6. **Classification**: Classify sensitivity levels (insensitive to critical)
7. **Export Generation**: Create reports and visualization data

### Sensitivity Metrics

#### Primary Metrics
- **Win Rate**: Percentage of battles won
- **Balance Score**: Composite balance metric
- **Average Turns**: Mean turns to complete scenario
- **Damage Output**: Average damage dealt
- **Survivability**: Damage mitigation and survival rate

#### Secondary Metrics
- **Synergy Score**: Stat interaction effectiveness
- **Power Level**: Overall power rating
- **Efficiency**: Resource utilization efficiency
- **Resource Usage**: Resource consumption patterns

## Usage

### Basic Usage

```typescript
import { runSensitivityAnalysis } from '@/balancing/analysis/StatWeightSensitivity';

// Run analysis with default configuration
const results = await runSensitivityAnalysis({}, balancerConfig);

// Run analysis with custom configuration
const customConfig = {
  analysis: {
    scope: 'single-stat',
    iterations: 5000,
    timeoutMinutes: 10,
  },
  perturbation: {
    ranges: [
      { id: 'fine', percentage: 0.05, steps: 10, description: 'Fine perturbations' },
    ],
  },
};

const results = await runSensitivityAnalysis(customConfig, balancerConfig);
```

### CLI Usage

```bash
# Run basic analysis
npm run sensitivity-analysis run --config basic

# Run comprehensive analysis
npm run sensitivity-analysis run --config comprehensive --verbose

# Analyze specific stats
npm run sensitivity-analysis run --config focused --stat hp,damage,defense

# Custom iterations and timeout
npm run sensitivity-analysis run --iterations 5000 --timeout 15

# Export to multiple formats
npm run sensitivity-analysis run --export json,csv,markdown --output ./results

# List available configurations
npm run sensitivity-analysis list-configs

# Validate configuration
npm run sensitivity-analysis validate --config comprehensive
```

### Advanced Usage

```typescript
import { StatWeightSensitivityAnalyzer } from '@/balancing/analysis/StatWeightSensitivity';

const analyzer = new StatWeightSensitivityAnalyzer(config, balancerConfig);

// Run analysis
const results = await analyzer.runAnalysis();

// Access specific results
const hpSensitivity = results.statResults.find(r => r.statId === 'hp');
console.log(`HP Sensitivity: ${hpSensitivity?.overallSensitivity}`);

// Export results
const jsonExport = exportResults(results, 'json');
const csvExport = exportResults(results, 'csv');
const markdownExport = exportResults(results, 'markdown');
```

## Configuration

### Predefined Configurations

#### Basic Configuration
- **Scope**: Full system analysis
- **Iterations**: 1,000
- **Perturbations**: Small (±10%) and medium (±20%)
- **Metrics**: Win rate and balance score
- **Scenario**: Basic 1v1

#### Quick Configuration
- **Scope**: Single stat analysis
- **Iterations**: 500
- **Perturbations**: Small (±5%)
- **Metrics**: Win rate only
- **Scenario**: Basic 1v1

#### Comprehensive Configuration
- **Scope**: Full system analysis
- **Iterations**: 5,000
- **Perturbations**: Tiny (±2%) to large (±20%)
- **Metrics**: All primary and secondary metrics
- **Scenario**: Boss fight

#### Focused Configuration
- **Scope**: Single stat analysis
- **Iterations**: 2,000
- **Perturbations**: Fine-grained (±1%) and small (±5%)
- **Metrics**: Win rate and balance score
- **Scenario**: Basic 1v1

### Custom Configuration

```typescript
const customConfig = {
  analysis: {
    scope: 'full-system' as const,
    iterations: 3000,
    seed: 12345,
    timeoutMinutes: 8,
    verbose: true,
  },
  perturbation: {
    ranges: [
      {
        id: 'ultra-fine',
        percentage: 0.01,
        steps: 20,
        description: 'Ultra-fine perturbations (±1%)',
      },
      {
        id: 'large',
        percentage: 0.30,
        steps: 5,
        description: 'Large perturbations (±30%)',
      },
    ],
    bidirectional: true,
    maxPerturbations: 25,
  },
  targetStats: {
    statIds: ['hp', 'damage', 'defense'],
    coreOnly: true,
    includeDerived: false,
    includePenalty: false,
  },
  metrics: {
    primary: ['winRate', 'balanceScore', 'averageTurns'],
    secondary: ['synergyScore', 'powerLevel'],
    weights: {
      winRate: 0.5,
      balanceScore: 0.3,
      averageTurns: 0.2,
    },
  },
  scenario: {
    template: 'boss-fight' as const,
  },
  export: {
    formats: ['json', 'csv', 'markdown'],
    includeDetails: true,
    includeVisualization: true,
    outputDir: './custom-results',
  },
};
```

## Results Interpretation

### Sensitivity Classifications

| Classification | Range | Description | Color |
|----------------|-------|-------------|-------|
| Insensitive | < 0.05 | Minimal impact on balance | 🟢 Green |
| Low | 0.05 - 0.15 | Minor impact on balance | 🔵 Blue |
| Moderate | 0.15 - 0.30 | Moderate impact on balance | 🟡 Yellow |
| High | 0.30 - 0.50 | Significant impact on balance | 🟠 Orange |
| Critical | > 0.50 | Critical impact on balance | 🔴 Red |

### Result Structure

```typescript
interface SensitivityAnalysisResult {
  config: SensitivityConfig;
  metadata: {
    analysisId: string;
    startTime: string;
    endTime: string;
    duration: number;
    totalSimulations: number;
    totalPerturbations: number;
  };
  statResults: Array<{
    statId: string;
    statName: string;
    originalWeight: number;
    perturbations: Array<{
      perturbation: number;
      newWeight: number;
      sensitivityScore: number;
      impactDirection: 'positive' | 'negative' | 'neutral';
    }>;
    overallSensitivity: number;
    classification: 'insensitive' | 'low' | 'moderate' | 'high' | 'critical';
    maxImpact: number;
    recommendation: string;
  }>;
  summary: {
    mostSensitive: string;
    leastSensitive: string;
    averageSensitivity: number;
    criticalStats: string[];
    insensitiveStats: string[];
  };
  visualization: {
    heatmap: Array<{
      statId: string;
      perturbation: number;
      sensitivity: number;
      impact: number;
    }>;
    ranking: Array<{
      statId: string;
      statName: string;
      sensitivity: number;
      classification: string;
    }>;
  };
}
```

### Recommendations

The system provides automatic recommendations based on sensitivity classification:

- **Critical**: "Critical sensitivity - requires immediate attention and careful tuning"
- **High**: "High sensitivity - monitor closely and consider adjustments"
- **Moderate**: "Moderate sensitivity - normal tuning required"
- **Low**: "Low sensitivity - minimal tuning needed"
- **Insensitive**: "Insensitive - can be adjusted with minimal impact"

## Performance Considerations

### Analysis Performance

- **Single Simulation**: < 1ms
- **1,000 Iterations**: ~100-500ms
- **5,000 Iterations**: ~500ms-2s
- **10,000 Iterations**: ~1-5s

### Memory Usage

- **Base Analysis**: ~10-50MB
- **Large Analysis**: ~100-200MB
- **Export Data**: ~1-10MB per format

### Optimization Tips

1. **Use Appropriate Iterations**: More iterations provide better accuracy but take longer
2. **Limit Perturbations**: Too many perturbations can generate excessive data
3. **Choose Right Scope**: Single-stat analysis is faster than full-system
4. **Set Timeouts**: Prevent analysis from running indefinitely
5. **Use Seeds**: Enable reproducible results for debugging

## Integration

### Monte Carlo Engine Integration

The sensitivity analysis integrates with the Monte Carlo engine through:

```typescript
// Perturbed configuration creation
const perturbedConfig = createPerturbedConfig(statId, newWeight);

// Simulation execution
const results = await runMonteCarloSimulation(
  scenarioConfig,
  perturbedConfig,
  iterations,
  seed
);
```

### Balancer Config Integration

The analysis reads from the balancer configuration to:

- Get available stats and their current weights
- Apply perturbations without modifying original config
- Validate stat definitions and constraints

### Scenario Runner Integration

The analysis uses scenario templates for:

- Consistent simulation environments
- Reproducible test conditions
- Multiple scenario types (1v1, boss, group, swarm)

## Export Formats

### JSON Export

Complete data export with all results, metadata, and visualization data:

```json
{
  "config": { ... },
  "metadata": { ... },
  "statResults": [ ... ],
  "summary": { ... },
  "visualization": { ... }
}
```

### CSV Export

Tabular format for spreadsheet analysis:

```csv
Stat ID,Stat Name,Original Weight,Overall Sensitivity,Classification,Max Impact,Recommendation
hp,Health Points,1.0000,0.2542,moderate,0.1234,Moderate sensitivity - normal tuning required
damage,Damage,1.0000,0.6789,critical,0.3456,Critical sensitivity - requires immediate attention
```

### Markdown Export

Human-readable report with summary and detailed results:

```markdown
# Stat Weight Sensitivity Analysis

**Analysis ID:** sensitivity-1643123456789-abc123
**Duration:** 5000ms
**Total Simulations:** 10000
**Total Perturbations:** 50

## Summary

- **Most Sensitive:** damage
- **Least Sensitive:** hp
- **Average Sensitivity:** 0.4666
- **Critical Stats:** damage
- **Insensitive Stats:** []

## Results

| Stat | Sensitivity | Classification | Max Impact | Recommendation |
|------|-------------|----------------|------------|----------------|
| Health Points | 0.2542 | moderate | 0.1234 | Moderate sensitivity - normal tuning required |
| Damage | 0.6789 | critical | 0.3456 | Critical sensitivity - requires immediate attention |
```

## Troubleshooting

### Common Issues

**Analysis takes too long**
- Reduce iterations count
- Limit perturbation ranges
- Use single-stat scope instead of full-system
- Set appropriate timeout

**Memory usage too high**
- Reduce max perturbations
- Use smaller iteration counts
- Export only necessary formats
- Clear results after analysis

**Inconsistent results**
- Use fixed seed for reproducible results
- Check balancer configuration consistency
- Verify scenario template stability

**Export failures**
- Check output directory permissions
- Verify disk space availability
- Ensure format compatibility

### Debug Mode

Enable verbose logging for detailed analysis information:

```typescript
const config = {
  analysis: {
    verbose: true,
  },
};
```

Or use CLI flag:

```bash
npm run sensitivity-analysis run --verbose
```

### Error Handling

The system handles errors gracefully:

- **Simulation Failures**: Continues with other perturbations
- **Timeout Protection**: Stops analysis after configured timeout
- **Memory Protection**: Limits perturbation count to prevent overflow
- **Export Failures**: Continues with other formats

## Best Practices

### Configuration

1. **Start Simple**: Begin with basic configuration and iterate
2. **Use Seeds**: Enable reproducible results for debugging
3. **Set Timeouts**: Prevent infinite analysis runs
4. **Validate Config**: Use validation command before running

### Analysis

1. **Iterative Approach**: Start with broad analysis, then focus on sensitive stats
2. **Multiple Scenarios**: Test different scenarios for comprehensive insights
3. **Regular Analysis**: Run periodically to track sensitivity changes
4. **Document Results**: Keep analysis history for trend tracking

### Performance

1. **Batch Processing**: Run multiple analyses during off-peak hours
2. **Result Caching**: Cache results for repeated queries
3. **Parallel Processing**: Use multiple cores for large analyses
4. **Resource Monitoring**: Monitor memory and CPU usage

## API Reference

### Classes

#### StatWeightSensitivityAnalyzer

```typescript
class StatWeightSensitivityAnalyzer {
  constructor(config: Partial<SensitivityConfig>, balancerConfig: BalancerConfig);
  runAnalysis(): Promise<SensitivityAnalysisResult>;
}
```

### Functions

#### runSensitivityAnalysis

```typescript
function runSensitivityAnalysis(
  config: Partial<SensitivityConfig>,
  balancerConfig: BalancerConfig
): Promise<SensitivityAnalysisResult>
```

#### exportResults

```typescript
function exportResults(
  results: SensitivityAnalysisResult,
  format: 'json' | 'csv' | 'markdown'
): string
```

### CLI Commands

#### Run Analysis

```bash
npm run sensitivity-analysis run [options]
```

Options:
- `--config <name>`: Predefined configuration
- `--iterations <number>`: Number of iterations
- `--scope <scope>`: Analysis scope
- `--stat <ids>`: Target stat IDs
- `--seed <number>`: Random seed
- `--timeout <minutes>`: Timeout in minutes
- `--verbose`: Enable verbose logging
- `--export <formats>`: Export formats
- `--output <dir>`: Output directory
- `--balancer-config <name>`: Balancer configuration
- `--scenario <template>`: Scenario template

#### List Configurations

```bash
npm run sensitivity-analysis list-configs
```

#### Validate Configuration

```bash
npm run sensitivity-analysis validate [options]
```

## Version History

### v1.0.0 (NP-189)
- Initial implementation
- Config-first design with Zod validation
- Monte Carlo integration
- CLI interface with multiple commands
- Export functionality (JSON, CSV, Markdown)
- Comprehensive test suite
- Performance optimization
- Error handling and timeout protection

---

For more information, see the source code in:
- `src/balancing/analysis/StatWeightSensitivity.ts`
- `scripts/balancer/sensitivityAnalysis.ts`
- `tests/unit/balancing/StatWeightSensitivity.test.ts`
