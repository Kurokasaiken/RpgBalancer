# Idle Village Risk Calibration Tool

## Overview

The Idle Village Risk Calibration Tool provides a comprehensive system for automatically calibrating injury and death risk curves based on telemetry data. It uses genetic algorithms with deterministic LCG-based random number generation to optimize risk parameters while maintaining reproducible results.

## Features

- **Genetic Algorithm Optimization**: Advanced optimization using population-based evolution
- **Deterministic Seeding**: LCG-based random number generation for reproducible results
- **Multi-Objective Fitness**: Balances accuracy, KPI compliance, and overall performance
- **Telemetry Integration**: Processes historical injury/death events for calibration
- **CLI Interface**: Command-line tool for batch processing and automation
- **Export Formats**: JSON configuration and markdown reports
- **Validation System**: Built-in configuration validation and testing

## Architecture

### Core Components

1. **RiskCurveIndividual**: Genetic algorithm individual representing a risk curve configuration
2. **RiskCurveOptimizer**: Main optimization engine using genetic algorithms
3. **TelemetryPoint**: Data structure for injury/death events
4. **OptimizedRiskCurve**: Final optimized configuration with fitness metrics

### Data Flow

```
Telemetry Data → Risk Curve Optimizer → Genetic Algorithm → Optimized Configuration → Export
```

## Usage

### CLI Commands

#### Run Optimization
```bash
npx tsx scripts/idleVillage/riskAutoTune.ts optimize \
  --telemetry telemetry-data.json \
  --seed 42 \
  --iterations 100 \
  --population 50 \
  --max-injury-rate 0.15 \
  --max-death-rate 0.02 \
  --target-risk 0.1 \
  --output test-results
```

#### Generate Sample Data
```bash
npx tsx scripts/idleVillage/riskAutoTune.ts sample-data \
  --output sample-telemetry.json \
  --count 1000
```

#### Validate Configuration
```bash
npx tsx scripts/idleVillage/riskAutoTune.ts validate \
  --config risk-curves-optimized.json \
  --telemetry telemetry-data.json
```

#### Dry Run (Configuration Only)
```bash
npx tsx scripts/idleVillage/riskAutoTune.ts optimize \
  --dry-run \
  --seed 42
```

### Programmatic API

```typescript
import { RiskCurveOptimizer, RiskCurveIndividual } from '@/scripts/idleVillage/riskAutoTune';

// Load telemetry data
const telemetry = loadTelemetryData('telemetry.json');

// Initialize optimizer
const kpiTargets = { maxInjuryRate: 0.15, maxDeathRate: 0.02, targetOverallRisk: 0.1 };
const optimizer = new RiskCurveOptimizer(telemetry, kpiTargets, 42);

// Run optimization
const params = {
  iterations: 100,
  populationSize: 50,
  mutationRate: 0.1,
  crossoverRate: 0.8,
  eliteSize: 5,
  convergenceThreshold: 20,
  maxGenerations: 100,
};

const optimizedConfig = optimizer.optimize(params);
console.log(`Fitness: ${optimizedConfig.fitness.overallScore}`);
```

## Risk Curve Configuration

### Injury Curve Parameters

```typescript
interface InjuryCurve {
  baseRate: number;           // Base injury probability (0.001-0.1)
  fatigueMultiplier: number; // Fatigue impact factor (0.5-3.0)
  hungerMultiplier: number;    // Hunger impact factor (0.5-3.0)
  healthMultiplier: number;   // Health impact factor (0.5-3.0)
  moraleMultiplier: number;   // Morale impact factor (0.5-3.0)
  levelScaling: number;       // Level scaling factor (0.8-1.2)
}
```

### Death Curve Parameters

```typescript
interface DeathCurve {
  baseRate: number;           // Base death probability (0.0001-0.01)
  fatigueMultiplier: number; // Fatigue impact factor (0.5-3.0)
  hungerMultiplier: number;  // Hunger impact factor (0.5-3.0)
  healthMultiplier: number;  // Health impact factor (0.5-3.0)
  moraleMultiplier: number;  // Morale impact factor (0.5-3.0)
  levelScaling: number;      // Level scaling factor (0.8-1.2)
}
```

### Smoothing Configuration

```typescript
interface SmoothingConfig {
  type: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  factor: number;    // Smoothing intensity (0.1-2.0)
  threshold: number; // Minimum risk to apply smoothing (0.1-0.5)
}
```

## Telemetry Data Format

### Telemetry Point Structure

```typescript
interface TelemetryPoint {
  timestamp: number;
  sessionId: string;
  eventType: 'injury' | 'death';
  residentId: string;
  residentLevel: number;
  activityType: string;
  locationType: string;
  riskFactors: {
    fatigue: number;    // 0-1 scale
    hunger: number;     // 0-1 scale
    health: number;     // 0-1 scale
    morale: number;    // 0-1 scale
  };
  outcome: {
    severity: number;      // 0-1 scale
    duration?: number;     // in ticks
    recoveryTime?: number; // in ticks
  };
}
```

### Sample Telemetry Data

```json
[
  {
    "timestamp": 1642678800000,
    "sessionId": "session-1",
    "eventType": "injury",
    "residentId": "resident-5",
    "residentLevel": 8,
    "activityType": "work",
    "locationType": "forest",
    "riskFactors": {
      "fatigue": 0.7,
      "hunger": 0.4,
      "health": 0.6,
      "morale": 0.5
    },
    "outcome": {
      "severity": 0.3,
      "duration": 15,
      "recoveryTime": 120
    }
  }
]
```

## Genetic Algorithm

### Algorithm Parameters

- **Population Size**: Number of individuals in each generation (default: 50)
- **Generations**: Maximum number of generations (default: 100)
- **Mutation Rate**: Probability of gene mutation (default: 0.1)
- **Crossover Rate**: Probability of gene crossover (default: 0.8)
- **Elite Size**: Number of best individuals to keep (default: 5)
- **Convergence Threshold**: Generations without improvement before stopping (default: 20)

### Fitness Function

The fitness function combines multiple objectives:

1. **Overall Accuracy** (40%): How well predicted risks match actual outcomes
2. **Injury Accuracy** (20%): Accuracy for injury events specifically
3. **Death Accuracy** (20%): Accuracy for death events specifically
4. **KPI Compliance** (20%): How well optimized curves meet target KPIs

### Selection Methods

- **Tournament Selection**: Selects best individuals from random tournament groups
- **Elite Selection**: Preserves top performers across generations
- **Crossover**: Uniform crossover between parent individuals
- **Mutation**: Random perturbation of genes within valid ranges

## Risk Calculation

### Base Risk Formula

```
risk = baseRate × fatigue^fatigueMultiplier × hunger^hungerMultiplier 
        × (2-health)^healthMultiplier × (2-morale)^moraleMultiplier 
        × (level/10)^levelScaling
```

### Smoothing Application

If risk > threshold:
```
smoothedRisk = risk × (1 - factor) + smoothingFunction(risk) × factor
```

### Smoothing Functions

- **Linear**: Simple linear interpolation
- **Ease-In**: Quadratic ease-in curve
- **Ease-Out**: Quadratic ease-out curve
- **Ease-In-Out**: Cubic ease-in-out curve

## KPI Targets

### Default KPI Configuration

```typescript
const kpiTargets = {
  maxInjuryRate: 0.15,    // Maximum 15% injury rate
  maxDeathRate: 0.02,     // Maximum 2% death rate
  targetOverallRisk: 0.1  // Target 10% overall risk
};
```

### Compliance Calculation

```typescript
const injuryCompliance = Math.max(0, 1 - Math.max(0, actualInjuryRate - maxInjuryRate) / maxInjuryRate);
const deathCompliance = Math.max(0, 1 - Math.max(0, actualDeathRate - maxDeathRate) / maxDeathRate);
const kpiCompliance = (injuryCompliance + deathCompliance) / 2;
```

## Export Formats

### JSON Configuration

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-01-19T22:00:00.000Z",
  "optimizedCurves": {
    "injuryCurve": {
      "baseRate": 0.023,
      "fatigueMultiplier": 1.45,
      "hungerMultiplier": 1.23,
      "healthMultiplier": 1.67,
      "moraleMultiplier": 1.34,
      "levelScaling": 1.02
    },
    "deathCurve": {
      "baseRate": 0.003,
      "fatigueMultiplier": 1.78,
      "hungerMultiplier": 1.56,
      "healthMultiplier": 2.01,
      "moraleMultiplier": 1.45,
      "levelScaling": 0.98
    },
    "smoothing": {
      "type": "ease-in-out",
      "factor": 0.75,
      "threshold": 0.25
    },
    "fitness": {
      "overallScore": 0.87,
      "injuryAccuracy": 0.91,
      "deathAccuracy": 0.84,
      "kpiCompliance": 0.89
    }
  },
  "metadata": {
    "algorithm": "genetic-algorithm",
    "fitnessScore": 0.87,
    "kpiCompliance": 0.89
  }
}
```

### Markdown Report

```markdown
# Idle Village Risk Auto-Tune Report

**Generated:** 2026-01-19T22:00:00.000Z
**Algorithm:** Genetic Algorithm
**Fitness Score:** 87.00%

## Optimization Results

### Injury Curve
- **Base Rate:** 2.300%
- **Fatigue Multiplier:** 1.450
- **Hunger Multiplier:** 1.230
- **Health Multiplier:** 1.670
- **Morale Multiplier:** 1.340
- **Level Scaling:** 1.020

### Death Curve
- **Base Rate:** 0.300%
- **Fatigue Multiplier:** 1.780
- **Hunger Multiplier:** 1.560
- **Health Multiplier:** 2.010
- **Morale Multiplier:** 1.450
- **Level Scaling:** 0.980

### Smoothing Configuration
- **Type:** ease-in-out
- **Factor:** 0.750
- **Threshold:** 25.0%

## Performance Metrics

### Accuracy
- **Overall Accuracy:** 87.00%
- **Injury Accuracy:** 91.00%
- **Death Accuracy:** 84.00%
- **KPI Compliance:** 89.00%
```

## Performance Characteristics

### Optimization Speed

| Dataset Size | Population | Generations | Time (ms) |
|-------------|------------|-------------|-----------|
| 100 points  | 20         | 50          | ~200      |
| 500 points  | 50         | 100         | ~800      |
| 1000 points | 50         | 100         | ~1500     |
| 5000 points | 100        | 100         | ~6000     |

### Memory Usage

- Per individual: ~200 bytes
- Population of 50: ~10KB
- Telemetry of 1000 points: ~200KB
- Total typical usage: < 1MB

### Convergence Behavior

- **Fast convergence**: 10-20 generations for simple datasets
- **Medium convergence**: 30-50 generations for complex datasets
- **Slow convergence**: 80-100 generations for noisy datasets
- **No convergence**: Falls back to max generations limit

## Testing

### Unit Tests

```bash
npm run test -- tests/unit/idleVillage/RiskAutoTune.test.ts
```

### Test Coverage

- **RiskCurveIndividual**: Gene generation, mutation, crossover, cloning
- **RiskCurveOptimizer**: Risk calculation, fitness evaluation, optimization
- **Genetic Algorithm**: Selection, convergence, performance
- **Edge Cases**: Empty data, single points, extreme values
- **Configuration**: Validation, ranges, structure

### Integration Tests

```bash
# Test CLI with sample data
npx tsx scripts/idleVillage/riskAutoTune.ts optimize \
  --telemetry sample-telemetry.json \
  --seed 42 \
  --iterations 10 \
  --dry-run

# Test validation
npx tsx scripts/idleVillage/riskAutoTune.ts validate \
  --config test-config.json \
  --telemetry sample-telemetry.json
```

## Best Practices

### Data Preparation

1. **Clean Data**: Remove outliers and invalid entries
2. **Sufficient Sample**: Minimum 100 data points for reliable optimization
3. **Balanced Events**: Include both injury and death events
4. **Time Range**: Use recent data (last 30-90 days) for current patterns

### Parameter Tuning

1. **Population Size**: Start with 50, increase for complex problems
2. **Mutation Rate**: 0.05-0.15 for balanced exploration/exploitation
3. **Crossover Rate**: 0.7-0.9 for good gene mixing
4. **Elite Size**: 10-20% of population size

### KPI Setting

1. **Realistic Targets**: Set achievable targets based on game design
2. **Safety Margins**: Include buffer zones for edge cases
3. **Player Experience**: Consider fun vs. realism trade-offs
4. **Balance**: Balance injury and death rates for gameplay

## Troubleshooting

### Common Issues

#### Poor Convergence
- **Problem**: Fitness score doesn't improve
- **Solution**: Increase population size, adjust mutation rate
- **Check**: Data quality, KPI targets, parameter ranges

#### Overfitting
- **Problem**: Perfect accuracy but poor generalization
- **Solution**: Use cross-validation, reduce complexity
- **Check**: Data split, regularization parameters

#### Slow Performance
- **Problem**: Optimization takes too long
- **Solution**: Reduce population/generations, use early stopping
- **Check**: Dataset size, algorithm parameters

#### Invalid Results
- **Problem**: Risk curves outside valid ranges
- **Solution**: Check gene bounds, validation logic
- **Check**: Mutation limits, crossover implementation

### Debug Mode

```typescript
// Enable verbose logging
const diagnostics = createSandboxDiagnostics('RiskAutoTune', 'cli', { verbose: true });

// Monitor convergence
console.log(`Generation ${generation}: Best fitness = ${bestFitness}`);
console.log(`Population diversity: ${calculateDiversity(population)}`);
```

## Integration Points

### Game Engine Integration

```typescript
// Load optimized configuration
const config = loadRiskConfiguration('risk-curves-optimized.json');

// Apply to risk calculation system
riskCalculator.setInjuryCurve(config.optimizedCurves.injuryCurve);
riskCalculator.setDeathCurve(config.optimizedCurves.deathCurve);
riskCalculator.setSmoothing(config.optimizedCurves.smoothing);
```

### Telemetry Pipeline Integration

```typescript
// Collect telemetry events
telemetryCollector.on('injury', (event) => {
  telemetryData.push(formatTelemetryPoint(event));
});

// Periodic re-optimization
setInterval(() => {
  const optimized = optimizer.optimize(params);
  updateRiskConfiguration(optimized);
}, 24 * 60 * 60 * 1000); // Daily
```

### Configuration Management

```typescript
// Update risk calibration config
import { updateRiskCalibrationConfig } from '@/ui/idleVillage/config/riskCalibrationConfig';

updateRiskCalibrationConfig({
  injuryCurve: optimized.injuryCurve,
  deathCurve: optimized.deathCurve,
  smoothing: optimized.smoothing,
});
```

## Future Enhancements

### Planned Features

- **Multi-Objective Optimization**: Pareto front for multiple KPIs
- **Adaptive Algorithms**: Self-adjusting parameters based on convergence
- **Real-Time Optimization**: Online learning from live telemetry
- **Advanced Analytics**: Statistical analysis and visualization
- **Configuration Templates**: Pre-defined configurations for different game modes

### Extension Points

- **Custom Fitness Functions**: Domain-specific optimization criteria
- **Alternative Algorithms**: Simulated annealing, particle swarm optimization
- **Advanced Smoothing**: Custom smoothing functions and parameters
- **Risk Factor Modeling**: More sophisticated risk factor interactions

## File Structure

```
scripts/idleVillage/
├── riskAutoTune.ts              # Main CLI implementation
├── sample-telemetry.json        # Sample data for testing
└── README.md                    # This documentation

tests/unit/idleVillage/
├── RiskAutoTune.test.ts         # Unit tests
└── fixtures/
    ├── telemetry-sample.json   # Test data
    └── optimized-config.json   # Expected results

docs/tools/
└── idle_risk_calibration.md      # This documentation

test-results/
├── risk-curves-*.json           # Optimized configurations
└── risk-report-*.md             # Generated reports
```

## API Reference

### Classes

#### RiskCurveIndividual
- `constructor(genes?, lcg?)` - Create individual with optional genes
- `mutate(lcg, mutationRate)` - Apply genetic mutations
- `crossover(partner, lcg)` - Create offspring with partner
- `clone()` - Create deep copy of individual

#### RiskCurveOptimizer
- `constructor(telemetry, kpiTargets, seed)` - Initialize optimizer
- `optimize(params)` - Run genetic algorithm optimization
- `calculateFitness(individual)` - Calculate fitness score
- `calculatePredictedRisk(point, curve)` - Calculate risk for point

### Interfaces

#### TelemetryPoint
- `timestamp`: Event timestamp
- `eventType`: 'injury' | 'death'
- `riskFactors`: Fatigue, hunger, health, morale values
- `outcome`: Severity and recovery information

#### OptimizedRiskCurve
- `injuryCurve`: Injury risk parameters
- `deathCurve`: Death risk parameters
- `smoothing`: Smoothing configuration
- `fitness`: Performance metrics

### CLI Commands

- `optimize` - Run risk curve optimization
- `sample-data` - Generate sample telemetry data
- `validate` - Validate configuration against telemetry

## License

This module is part of the RPG Balancer project and follows the same licensing terms.
