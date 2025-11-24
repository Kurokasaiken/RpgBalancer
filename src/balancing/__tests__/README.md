# Combat Test Framework - User Guide

## Overview

Il **Combat Test Framework** è un sistema automatizzato per testare e validare il bilanciamento del sistema di combattimento 1v1 idle tramite simulazioni Monte Carlo.

## Quick Start

### Running Tests

```bash
# Run all tests
npm test -- src/balancing/__tests__/CombatTestFramework.test.ts

# Run with verbose output
npm test -- src/balancing/__tests__/CombatTestFramework.test.ts --reporter=verbose

# Run in watch mode (during development)
npm test -- src/balancing/__tests__/CombatTestFramework.test.ts --watch
```

### Basic Usage

```typescript
import { CombatTestFramework, createBaselineTests } from './CombatTestFramework';
import { DEFAULT_STATS } from '../types';

// Create framework instance
const framework = new CombatTestFramework();

// Run baseline tests
const tests = createBaselineTests(DEFAULT_STATS);
const results = framework.runBatch(tests, DEFAULT_STATS);

// Generate report
const report = framework.generateReport(results);
console.log(report);

// Export CSV
const csv = framework.generateCSV(results);
// Save to file or analyze in Excel
```

---

## Test Scenarios

### Predefined Baseline Tests

Il framework include 6 test baseline che validano comportamenti fondamentali:

1. **Symmetry Test** ✅
   - **Goal**: Stats identici → 50% winrate
   - **Tolerance**: ±2%
   - **Current Result**: 51.8% (PASS)

2. **HP Scaling** ✅
   - **Goal**: +100 HP → vantaggio significativo
   - **Expected**: >70% winrate
   - **Current Result**: 98.4% (PASS)

3. **Damage Scaling** ✅
   - **Goal**: +20 damage → vantaggio significativo
   - **Expected**: >70% winrate
   - **Current Result**: 75.4% (PASS)

4. **Mitigation Layering** ✅
   - **Goal**: Armor + Resistance → defense forte
   - **Stats**: +25 armor, +25% resistance
   - **Current Result**: 100% (PASS)

5. **Sustain Value** ✅
   - **Goal**: Lifesteal + Regen → extended combat
   - **Stats**: 15% lifesteal, 5 HP/turn regen
   - **Current Result**: 83.1% (PASS)

6. **Crit Impact** ✅
   - **Goal**: +25% crit chance → more damage
   - **Current Result**: 75.4% (PASS)

---

## Creating Custom Scenarios

### Example: Testing Evasion

```typescript
const evasionTest: TestScenario = {
    name: 'Evasion Test: +20 Evasion',
    description: 'High evasion should reduce incoming damage significantly',
    entityA: { evasion: DEFAULT_STATS.evasion + 20 },
    entityB: {},
    expectedOutcome: 'A_WINS',
    simulations: 1000,
    tolerance: 0.05
};

const result = framework.runScenario(evasionTest, DEFAULT_STATS);
console.log(`Winrate: ${(result.winrateA * 100).toFixed(1)}%`);
```

### Example: Testing configApplyBeforeCrit

```typescript
const critBeforeMitigationTest: TestScenario = {
    name: 'Crit Before Mitigation (C→M)',
    description: 'Test default behavior: Crit multiplier applied before mitigation',
    entityA: { 
        critChance: 50,
        armor: 20,
        configApplyBeforeCrit: false // default
    },
    entityB: {},
    expectedWinrate: 0.8, // Should have advantage
    simulations: 2000
};

const mitigationBeforeCritTest: TestScenario = {
    name: 'Mitigation Before Crit (M→C)',
    description: 'Alternative: Mitigation applied before crit multiplier',
    entityA: { 
        critChance: 50,
        armor: 20,
        configApplyBeforeCrit: true // M→C mode
    },
    entityB: {},
    expectedWinrate: 0.75, // Slightly less advantage than C→M
    simulations: 2000
};

// Compare both
const results = framework.runBatch([critBeforeMitigationTest, mitigationBeforeCritTest], DEFAULT_STATS);
console.log(framework.generateReport(results));
```

---

## Understanding Results

### TestResult Interface

```typescript
interface TestResult {
    scenario: string;           // Test name
    passed: boolean;            // Did it meet expectations?
    winrateA: number;          // Winrate for Entity A (0.0-1.0)
    winrateB: number;          // Winrate for Entity B
    avgTurns: number;          // Average combat duration
    avgDamageA: number;        // Average damage dealt by A
    avgDamageB: number;        // Average damage dealt by B
    simulations: number;       // Number of simulations run
    errorMessage?: string;     // Why test failed (if failed)
    details: {
        minTurns: number;      // Shortest combat
        maxTurns: number;      // Longest combat
        drawCount: number;     // Combats that hit 1000 turn limit
    };
}
```

### Interpreting Winrates

- **48-52%**: Balanced (symmetrical)
- **55-65%**: Slight advantage
- **66-80%**: Significant advantage
- **81-95%**: Very strong advantage
- **96-100%**: Dominant (almost always wins)

### Interpreting Average Turns

- **2-3 turns**: Very short (burst/glass cannon)
- **4-6 turns**: Normal duration
- **7-10 turns**: Long (tanky/sustain)
- **11+ turns**: Very long (extreme tank/stalemate)
- **Draws (1000 turns)**: Infinite combat (usually design flaw)

---

## Batch Testing Best Practices

### 1. Start with Low Simulations

```typescript
// Quick validation (fast)
const quickTest = {
    ...myScenario,
    simulations: 100 // ~10ms
};

// If promising, run full test
const fullTest = {
    ...myScenario,
    simulations: 10000 // ~1sec, more accurate
};
```

### 2. Use Appropriate Tolerance

```typescript
// Tight tolerance for symmetry tests
tolerance: 0.01  // ±1%

// Normal tolerance for most tests
tolerance: 0.05  // ±5%

// Loose tolerance for high-variance scenarios
tolerance: 0.10  // ±10%
```

### 3. Test Incremental Changes

```typescript
const hpScalingTests = [
    { entityA: { hp: DEFAULT_STATS.hp + 10 }, ... },
    { entityA: { hp: DEFAULT_STATS.hp + 25 }, ... },
    { entityA: { hp: DEFAULT_STATS.hp + 50 }, ... },
    { entityA: { hp: DEFAULT_STATS.hp + 100 }, ... },
];

// Analyze curve: is HP scaling linear?
```

---

## Report Generation

### Markdown Report

```typescript
const report = framework.generateReport(results);
// Save to file
import fs from 'fs';
fs.writeFileSync('test-results.md', report);
```

Output format:
```markdown
# Combat Test Report

**Date:** 2025-11-23T21:43:07.959Z
**Tests Run:** 6
**Passed:** 6/6 (100.0%)

---

## 1. ✅ Symmetry Test

| Metric | Value |
|--------|-------|
| Winrate A | 51.80% |
| Winrate B | 48.20% |
| Avg Turns | 4.5 |
...
```

### CSV Export

```typescript
const csv = framework.generateCSV(results);
fs.writeFileSync('test-results.csv', csv);
```

Use in Excel/Google Sheets for:
- Plotting winrate curves
- Statistical analysis
- Comparing test runs over time

---

## Performance Tips

### Parallel Execution

```typescript
// For independent tests, run in parallel (when available)
const results = await Promise.all(
    scenarios.map(s => 
        new Promise(resolve => 
            resolve(framework.runScenario(s, DEFAULT_STATS))
        )
    )
);
```

### Caching

```typescript
// For repeated tests with same stats, cache results
const cache = new Map<string, TestResult>();

function getCachedOrRun(scenario: TestScenario, baseStats: StatBlock) {
    const key = JSON.stringify({ scenario, baseStats });
    if (!cache.has(key)) {
        cache.set(key, framework.runScenario(scenario, baseStats));
    }
    return cache.get(key)!;
}
```

---

## Troubleshooting

### Test Fails with "Expected A to win majority"

**Possible causes**:
1. Stats not additive (used absolute instead of relative)
2. Baseline stats are unbalanced
3. Tolerance too strict
4. Bug in combat engine

**Solution**:
```typescript
// Wrong (absolute)
entityA: { hp: 100 }

// Correct (relative)
entityA: { hp: DEFAULT_STATS.hp + 100 }
```

### High Draw Count

**Possible causes**:
1. Equal stats with no damage variance
2. Infinite sustain (regen > damage)
3. 100% mitigation

**Solution**: Review stat balance, add damage variance, or cap mitigation.

### Inconsistent Results Between Runs

**Cause**: Monte Carlo variance (random)

**Solution**:
- Increase simulations (1000 → 10,000)
- Reduce tolerance (0.05 → 0.10)
- Use fixed RNG seed (future feature)

---

## Future Enhancements

- [ ] Fixed RNG seed for reproducibility
-[ ] Web Worker parallelization for 10k+ sims
- [ ] Visual charts (winrate curves, damage distribution)
- [ ] Confidence intervals (statistical significance)
- [ ] Regression detection (alert on changed results)

---

## API Reference

### CombatTestFramework

#### Methods

- **`runScenario(scenario, baseStats): TestResult`**
  - Run single test scenario
  - Returns detailed results

- **`runBatch(scenarios, baseStats): TestResult[]`**
  - Run multiple scenarios
  - Returns array of results

- **`generateReport(results): string`**
  - Generate markdown report
  - Human-readable format

- **`generateCSV(results): string`**
  - Generate CSV export
  - Machine-readable format

### Helper Functions

- **`createBaselineTests(baseStats): TestScenario[]`**
  - Generate 6 baseline test scenarios
  - Uses provided baseline stats

---

**Last Updated**: 2025-11-23  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
