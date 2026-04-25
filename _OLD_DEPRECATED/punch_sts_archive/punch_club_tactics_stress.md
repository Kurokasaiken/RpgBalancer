# Punch Club Tactics Stress Testing

## Overview

The Punch Club Tactics Stress Testing system provides a comprehensive framework for running multiple combat simulations with deterministic seeding. It collects KPI metrics like Time To Kill (TTK), damage spread, and win rates to help balance combat mechanics.

## Features

- **Deterministic Seeding**: LCG-based random number generation for reproducible results
- **Multiple Simulations**: Run hundreds or thousands of combat scenarios
- **KPI Collection**: TTK, damage spread, hit rates, critical hits, stamina usage
- **Export Formats**: JSON, CSV, and markdown reports
- **CLI Interface**: Command-line tool for batch processing
- **Performance Benchmarking**: Built-in performance testing capabilities

## Architecture

### Core Components

1. **LinearCongruentialGenerator** - Deterministic RNG with multiple presets
2. **PunchClubTacticsRunner** - Combat simulation engine
3. **TacticsStress CLI** - Command-line interface for batch processing
4. **CombatMetrics** - KPI collection and aggregation

### Data Flow

```
Seed → LCG → Combat Simulation → Metrics → Aggregation → Export
```

## Usage

### CLI Commands

#### Run Stress Test
```bash
npx tsx scripts/punchClub/tacticsStress.ts run \
  --scenarios 1000 \
  --seed 42 \
  --output test-results \
  --format json,csv,markdown
```

#### List Available Scenarios
```bash
npx tsx scripts/punchClub/tacticsStress.ts list-scenarios
```

#### Performance Benchmark
```bash
npx tsx scripts/punchClub/tacticsStress.ts benchmark \
  --max 10000 \
  --step 1000 \
  --seed 42
```

#### Dry Run (Configuration Only)
```bash
npx tsx scripts/punchClub/tacticsStress.ts run --dry-run
```

### Programmatic API

```typescript
import { PunchClubTacticsRunner, TacticsRunnerFactory } from '@/balancing/punchClub/tacticsRunner';

// Create runner with specific seed
const runner = TacticsRunnerFactory.create(42);

// Define combat scenario
const scenario = {
  id: 'test-match',
  name: 'Test Match',
  playerStats: { health: 100, stamina: 50, strength: 50, speed: 50, defense: 50, technique: 50 },
  opponentStats: { health: 80, stamina: 40, strength: 40, speed: 40, defense: 40, technique: 40 },
  playerMoves: [/* combat moves */],
  opponentMoves: [/* combat moves */],
  config: { maxRounds: 50 },
};

// Run single simulation
const result = runner.runCombat(scenario);
console.log(`TTK: ${result.ttk}, Winner: ${result.winner}`);

// Run multiple simulations
const results = runner.runMultipleCombats(scenario, 1000, 42);
```

## LCG (Linear Congruential Generator)

### Presets

- **FAST**: Fast but less random (for quick tests)
- **QUALITY**: Good statistical properties (default)
- **LARGE_PERIOD**: Large period for extensive simulations
- **PARK_MILLER**: Park-Miller LCG variant

### Usage

```typescript
import { LinearCongruentialGenerator, LCGFactory, LCG_PRESETS } from '@/balancing/punchClub/lcg';

// Create with custom seed
const lcg = new LinearCongruentialGenerator({ seed: 12345 });

// Create from preset
const lcg = new LinearCongruentialGenerator(LCG_PRESETS.QUALITY);

// Factory methods
const lcg1 = LCGFactory.create(42);
const lcg2 = LCGFactory.createFromString('scenario-name');
const batch = LCGFactory.createSequence(100, 5); // 5 generators with seeds 100-104
```

### Random Number Generation

```typescript
// Float in [0, 1)
const random = lcg.next();

// Integer in [min, max]
const integer = lcg.nextInt(1, 10);

// Float in [min, max]
const float = lcg.nextFloat(5.5, 10.5);

// Boolean with probability
const bool = lcg.nextBoolean(0.3); // 30% chance of true

// Choice from array
const choice = lcg.nextChoice(['a', 'b', 'c']);

// Shuffle array
const shuffled = lcg.shuffle([1, 2, 3, 4, 5]);

// Normal distribution
const normal = lcg.nextNormal(0, 1); // mean=0, std=1
```

## Combat Simulation

### Fighter Stats

```typescript
interface FighterStats {
  health: number;      // Hit points
  stamina: number;    // Energy for moves
  strength: number;   // Damage modifier
  speed: number;      // Turn order modifier
  defense: number;    // Damage reduction
  technique: number;  // Accuracy and critical chance
}
```

### Combat Moves

```typescript
interface CombatMove {
  id: string;
  name: string;
  damage: number;
  staminaCost: number;
  accuracy: number;     // 0-1
  cooldown: number;      // Rounds
  unlockLevel: number;
  statRequirements?: Record<string, number>;
}
```

### Combat Configuration

```typescript
interface CombatConfig {
  maxRounds: number;        // Combat time limit
  staminaRegen: number;     // Stamina recovery per round
  critChance: number;        // Critical hit probability
  critMultiplier: number;   // Critical damage multiplier
  damageVariance: number;    // Damage randomization (0-1)
  accuracyVariance: number; // Accuracy randomization (0-1)
}
```

### Combat Metrics

```typescript
interface CombatMetrics {
  ttk: number;              // Time to kill (rounds)
  totalDamageDealt: number;  // Total damage inflicted
  totalDamageTaken: number;  // Total damage received
  hitsLanded: number;        // Successful hits
  hitsMissed: number;        // Missed attacks
  criticalHits: number;      // Critical strikes
  staminaConsumed: number;    // Stamina used
  winner: number;            // 0=player, 1=opponent, -1=draw
  staminaExhaustion: boolean; // Ended due to no stamina
  timeLimit: boolean;        // Ended due to round limit
}
```

## Predefined Scenarios

### Fighter Presets

- **beginner**: HP 50, Stamina 30, Stats 30
- **amateur**: HP 75, Stamina 50, Stats 50
- **professional**: HP 100, Stamina 75, Stats 70
- **champion**: HP 150, Stamina 100, Stats 90

### Default Moves

1. **Jab**: Damage 8, Stamina 3, Accuracy 90%
2. **Cross**: Damage 12, Stamina 5, Accuracy 80%, Cooldown 1
3. **Hook**: Damage 15, Stamina 7, Accuracy 70%, Cooldown 2
4. **Uppercut**: Damage 20, Stamina 10, Accuracy 60%, Cooldown 3
5. **Block**: Damage 0, Stamina 2, Accuracy 100%

### Test Scenarios

1. **beginner_vs_amateur**: Basic matchup
2. **amateur_vs_professional**: Mid-tier with more moves
3. **professional_vs_champion**: High-tier full moveset
4. **Mirror matches**: Same skill level vs same skill level

## KPI Analysis

### Win Rate Analysis

```typescript
// From aggregated results
const winRate = aggregated.playerWins / aggregated.totalSimulations;
console.log(`Player win rate: ${(winRate * 100).toFixed(2)}%`);
```

### TTK Distribution

```typescript
// TTK buckets (5-round intervals)
Object.entries(aggregated.ttkDistribution).forEach(([range, count]) => {
  const percentage = (count / aggregated.totalSimulations * 100).toFixed(2);
  console.log(`${range} rounds: ${percentage}%`);
});
```

### Damage Spread Analysis

```typescript
const { min, max, mean, stdDev } = aggregated.damageSpread;
console.log(`Damage: ${min}-${max} (avg: ${mean.toFixed(2)}, σ: ${stdDev.toFixed(2)})`);
```

### Combat Efficiency

```typescript
const hitRate = aggregated.avgHitRate;
const critRate = aggregated.avgCritRate;
const staminaEfficiency = aggregated.avgDamageDealt / aggregated.avgStaminaConsumed;

console.log(`Hit rate: ${(hitRate * 100).toFixed(2)}%`);
console.log(`Crit rate: ${(critRate * 100).toFixed(2)}%`);
console.log(`Damage per stamina: ${staminaEfficiency.toFixed(2)}`);
```

## Performance Characteristics

### Simulation Speed

| Simulations | Expected Time | Sims/Second |
|-------------|---------------|-------------|
| 100         | < 50ms        | > 2000       |
| 1,000       | < 200ms       | > 5000       |
| 10,000      | < 2s          | > 5000       |
| 100,000     | < 20s         | > 5000       |

### Memory Usage

- Per simulation: ~200 bytes
- 1,000 simulations: ~200KB
- 10,000 simulations: ~2MB
- 100,000 simulations: ~20MB

### Scaling Recommendations

- **Development**: 100-1,000 simulations for quick feedback
- **Testing**: 1,000-10,000 simulations for reliable metrics
- **Production**: 10,000+ simulations for comprehensive analysis

## Export Formats

### JSON Export

```json
{
  "scenario": {
    "id": "beginner_vs_amateur",
    "name": "Beginner vs Amateur",
    "playerStats": { "health": 50, "stamina": 30, ... },
    "opponentStats": { "health": 75, "stamina": 50, ... }
  },
  "aggregated": {
    "totalSimulations": 1000,
    "playerWins": 650,
    "opponentWins": 350,
    "avgTTK": 12.5,
    "damageSpread": { "min": 45, "max": 120, "mean": 82.3, "stdDev": 15.7 }
  },
  "rawResults": [...],
  "exportedAt": "2026-01-19T22:00:00.000Z"
}
```

### CSV Export

```csv
simulation_id,ttk,total_damage_dealt,total_damage_taken,hits_landed,hits_missed,critical_hits,stamina_consumed,winner,stamina_exhaustion,time_limit
0,15,95,65,8,2,1,22,0,false,false
1,12,102,58,9,1,0,20,0,false,false
...
```

### Markdown Report

```markdown
# Punch Club Tactics Stress Report

**Scenario:** Beginner vs Amateur
**Total Simulations:** 1000

## Win Rates
| Result | Count | Percentage |
|--------|-------|------------|
| Player Wins | 650 | 65.00% |
| Opponent Wins | 350 | 35.00% |
| Draws | 0 | 0.00% |

## Combat Metrics
- **Average TTK:** 12.50 rounds
- **TTK Range:** 8 - 25 rounds
- **Average Damage Dealt:** 82.30
- **Hit Rate:** 85.50%
- **Critical Hit Rate:** 12.30%
```

## Testing

### Unit Tests

```bash
npm run test -- tests/unit/punchClub/TacticsStress.test.ts
```

### Integration Tests

```bash
# Run CLI with small sample
npx tsx scripts/punchClub/tacticsStress.ts run --scenarios 10 --dry-run

# Benchmark performance
npx tsx scripts/punchClub/tacticsStress.ts benchmark --max 1000
```

### Test Coverage

- **LCG Functionality**: Deterministic seeding, statistical properties
- **Combat Simulation**: Turn order, damage calculation, win conditions
- **Metrics Aggregation**: KPI calculation, distribution analysis
- **CLI Interface**: Command parsing, export functionality
- **Performance**: Scaling characteristics, memory usage

## Best Practices

### Deterministic Testing

1. **Always use fixed seeds** for reproducible results
2. **Document seed values** in test cases
3. **Use LCG presets** for consistent random quality
4. **Validate statistical properties** for new RNG configurations

### Performance Optimization

1. **Batch simulations** for efficiency
2. **Limit raw result storage** for large runs
3. **Use aggregated metrics** for analysis
4. **Monitor memory usage** for >10K simulations

### KPI Interpretation

1. **Win rates > 60%** may indicate imbalance
2. **TTK variance > 50%** suggests randomness issues
3. **Hit rates < 70%** may be too low for engagement
4. **Crit rates > 20%** can feel unfair

## Troubleshooting

### Common Issues

#### Non-deterministic Results
- Check seed values are consistent
- Verify LCG configuration
- Ensure no Math.random() usage

#### Performance Issues
- Reduce simulation count for testing
- Check for memory leaks
- Monitor CPU usage

#### Unexpected KPIs
- Validate combat move configurations
- Check fighter stat balance
- Review combat parameters

### Debug Mode

```typescript
// Enable verbose logging
const diagnostics = createSandboxDiagnostics('PunchClubTactics', 'balancing', { verbose: true });
```

## File Structure

```
src/balancing/punchClub/
├── lcg.ts                    # LCG implementation
├── tacticsRunner.ts          # Combat simulation engine
└── combatConfig.ts           # Combat configuration

scripts/punchClub/
└── tacticsStress.ts          # CLI interface

tests/unit/punchClub/
└── TacticsStress.test.ts     # Unit tests

docs/tests/
└── punch_club_tactics_stress.md # This documentation

test-results/
└── punch-club-tactics-*.json/csv/md # Generated reports
```

## Integration Points

### Combat System Integration

```typescript
// Integrate with existing Punch Club combat
import { PunchClubTacticsRunner } from '@/balancing/punchClub/tacticsRunner';

const runner = new PunchClubTacticsRunner(seed, combatConfig);
const results = runner.runMultipleCombats(scenario, count);
```

### Analytics Pipeline

```typescript
// Send metrics to analytics
import { stsIntentForecastReporter } from '@/analytics/stsIntentForecastReporter';

// Similar pattern for tactics metrics
```

### Configuration Management

```typescript
// Use existing config system
import { combatConfig } from '@/balancing/config/punchClub/combatConfig';
```

## Future Enhancements

### Planned Features

- **Advanced AI**: Multiple opponent strategies
- **Equipment System**: Weapon and armor modifiers
- **Status Effects**: Buffs and debuffs
- **Team Combat**: 2v2 and 3v3 scenarios
- **Tournament Mode**: Bracket-style competitions
- **Live Dashboard**: Real-time simulation monitoring

### Extension Points

- **Custom LCG implementations**
- **Additional KPI metrics**
- **Custom export formats**
- **Integration with ML pipelines**
- **Web-based visualization**

## API Reference

### Classes

#### LinearCongruentialGenerator
- `next()` - Random float [0, 1)
- `nextInt(min, max)` - Random integer
- `nextFloat(min, max)` - Random float
- `nextBoolean(probability)` - Random boolean
- `nextChoice(array)` - Random element
- `shuffle(array)` - Shuffle array
- `nextNormal(mean, stdDev)` - Normal distribution
- `reset()` - Reset to seed
- `clone()` - Create copy

#### PunchClubTacticsRunner
- `runCombat(scenario)` - Single simulation
- `runMultipleCombats(scenario, count, baseSeed)` - Multiple simulations
- `getConfig()` - Get combat configuration
- `getLCG()` - Get LCG instance

#### TacticsRunnerFactory
- `create(seed, config)` - Create runner
- `createFromScenario(scenario, seed)` - Create from scenario
- `createBatch(count, baseSeed, config)` - Create multiple runners

### CLI Commands

- `run` - Execute stress test
- `list-scenarios` - Show available scenarios
- `benchmark` - Performance testing
- `--dry-run` - Configuration preview

## License

This module is part of the RPG Balancer project and follows the same licensing terms.
