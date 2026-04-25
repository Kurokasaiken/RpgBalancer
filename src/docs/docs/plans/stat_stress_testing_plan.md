# Stat Stress Testing & Efficiency Analysis Plan

**Date:** 2025-12-04 (Updated)  
**Purpose:** Round-Robin stat efficiency testing via Monte Carlo simulation  
**Status:** ✅ Phase 10.5 Complete - Full UI Implementation (SynergyHeatmap, StatProfileRadar, StressTestDashboard, useStressTesting hook)  
**Test Status:** ✅ StressTestArchetypeGenerator tests completati (deterministic seeding, edge cases, 100% coverage)  
**UI Status:** ✅ Complete visualization suite with interactive features, export options, and Gilded Observatory theme  
**KS-105 Status:** ✅ **COMPLETED 2026-01-13** - StressTestArchetypeGenerator Implementation Complete - Single/pair stat archetypes (+25 × weight) with BalancerConfig integration

---

## 🎯 OBJECTIVE

Create a **deterministic, dynamic stress-testing system** that measures **relative stat efficiency** through Round-Robin matchups:

1. **Mono-Stat Archetypes**: Generate configs with +N points in ONE stat (weighted by current weight)
2. **Round-Robin Testing**: Each stat@budget vs every other stat@budget (NxN matrix)
3. **Efficiency Scoring**: Calculate empirical efficiency of each stat from win rates
4. **Multi-Tier Analysis**: Test at multiple budget tiers (25, 50, 75 points)
5. **Dynamic Generation**: Read stats from live BalancerConfig (no hardcoding, no derived stats)
6. **Presentation**: Efficiency table + NxN heatmap + radar chart

---

## 🧠 METHODOLOGY (Correct Approach)

### Why Round-Robin > Baseline Testing

❌ **Old approach (stat vs baseline)**: Not sufficient — doesn't compare stats against each other  
✅ **Correct approach (stat@N vs stat@N)**: Round-robin produces relative efficiency

### How It Works

For each stat pair (A, B):
- Archetype A: baseline + (weightA × budget) on statA
- Archetype B: baseline + (weightB × budget) on statB
- Run 500–1000 Monte Carlo simulations (seeded RNG)
- Record winRateA (winRateB = 1 - winRateA)

This creates an **NxN matrix** where each cell = efficiency of statA vs statB at same budget.

### Efficiency Calculation

```
efficiency(statX) = mean(winRate of X@budget vs Y@budget for all Y ≠ X)
```

Example:
| Stat | Efficiency |
|------|------------|
| ATK  | 68%        |
| SPD  | 59%        |
| CRIT | 52%        |
| HP   | 44%        |
| ARMOR| 33%        |

**Interpretation:**
- ATK too strong → increase weight/cost
- ARMOR too weak → decrease weight/cost

### Multi-Tier Testing

Test at multiple budgets to detect non-linear scaling:
- Tier 1: +25 points
- Tier 2: +50 points  
- Tier 3: +75 points

If HP@25 is weak but HP@75 is OP → non-linear scaling issue → fix formula.

### Additional Metrics

Beyond win rate, track:
- **avgTurns**: burst stat (low) vs sustain stat (high)
- **hpRemaining**: defensive efficiency
- **damageDealt**: offensive efficiency

---

## ✅ IMPLEMENTATION: StressTestArchetypeGenerator (Phase 1 Complete)

**Status:** ✅ Module implemented, tested, and documented.

### Files Created
- `src/balancing/stressTesting/StressTestArchetypeGenerator.ts` - Core generator class
- `src/balancing/stressTesting/__tests__/StressTestArchetypeGenerator.test.ts` - Vitest tests (18 test cases)
- `src/balancing/stressTesting/README.md` - Usage documentation
- `src/balancing/stressTesting/MarginalUtilityCalculator.ts` - Updated for new interfaces

### Key Features Implemented
- **Config-First**: Reads all stat definitions, weights, and defaults from `BalancerConfigStore`
- **Deterministic**: Uses seeded LCG RNG (`TestRNG`) for reproducibility
- **Zero Hardcoding**: No magic numbers; all calculations use config-driven weights
- **Logging**: Diagnostic console logs for generation steps and counts
- **Type Safety**: Full TypeScript interfaces (`StressTestArchetype`)

### API Overview

```typescript
import { StressTestArchetypeGenerator, generateStressTestArchetypes } from '@/balancing/stressTesting/StressTestArchetypeGenerator';

// From config
const config = await BalancerConfigStore.load();
const generator = new StressTestArchetypeGenerator(config, seed);

// Generate archetypes
const singleStats = generator.generateSingleStatArchetypes();  // +25 * weight per stat
const pairStats = generator.generatePairStatArchetypes();      // C(n,2) combinations
const all = generator.generateAllStressTestArchetypes();       // baseline + single + pairs

// Convenience function
const archetypes = await generateStressTestArchetypes(seed);
```

### Archetype Structure
```typescript
interface StressTestArchetype {
  id: string;           // 'baseline', 'single_hp', 'pair_hp_damage'
  name: string;         // 'Baseline Archetype', 'Health Points +25'
  stats: Record<string, number>;  // Full stat block for simulation
  seed: number;         // For reproducibility
}
```

### Synergy Seeds & Intelligent Pair Generation (Phase 1.1 Enhanced)

**Status:** ✅ Enhanced with synergy-based filtering and multipliers

#### Synergy Seed Configuration
The archetype generator now includes intelligent pair selection based on stat synergies:

**Incompatible Stat Pairs:**
```typescript
export const INCOMPATIBLE_STAT_PAIRS: Array<[string, string]> = [
  // Defensive + offensive conflicts
  ['hp', 'damage'], ['armor', 'damage'], ['hp', 'crit'], ['armor', 'crit'],
  // Speed + defensive tradeoffs  
  ['speed', 'armor'], ['speed', 'hp'], ['speed', 'resistance'],
  // Accuracy + evasion redundancy
  ['hit_chance', 'dodge'], ['crit_chance', 'dodge'], ['accuracy', 'evasion'],
  // Resource management conflicts
  ['mana_regen', 'mana_cost'], ['stamina_regen', 'stamina_cost'],
  // Crowd control redundancy
  ['stun_duration', 'slow_duration'], ['freeze_duration', 'slow_duration'],
  // Role conflicts
  ['healing_power', 'damage'], ['healing_power', 'crit']
];
```

**Synergy Multipliers:**
```typescript
export const SYNERGY_MULTIPLIERS: Record<string, Record<string, number>> = {
  // Positive synergies (> 1.0)
  'damage': { 'crit': 1.15, 'accuracy': 1.08 },
  'armor': { 'resistance': 1.12, 'hp': 1.10 },
  'speed': { 'dodge': 1.20, 'hit_chance': 1.15 },
  
  // Negative synergies (< 1.0)
  'dodge': { 'armor': 0.85, 'resistance': 0.90 }
};
```

#### Intelligent Pair Generation Algorithm

1. **Filter Stats**: Remove derived stats and low-weight stats
2. **Generate Combinations**: Create all C(n,2) pairs
3. **Apply Filters**:
   - Skip incompatible pairs (if `excludeIncompatiblePairs` enabled)
   - Skip low-synergy pairs (if `useSynergyMultipliers` and synergy < threshold)
4. **Apply Boosts**: Add weighted points to both stats in pair
5. **Create Archetypes**: Generate full stat blocks with descriptive names

#### Configuration Options
```typescript
interface ArchetypeSeedConfig {
  pointsPerWeight: number;           // 25 (default)
  excludeIncompatiblePairs: boolean; // true
  useSynergyMultipliers: boolean;   // true  
  minSynergyThreshold: number;       // 0.95
  maxPairs?: number;                 // 50 (limit combinatorial explosion)
}
```

#### Benefits
- **Balanced Testing**: Avoids unrealistic stat combinations
- **Efficient Coverage**: Focuses on meaningful synergies
- **Configurable Intelligence**: Adjustable filtering and thresholds
- **Scalable**: Prevents exponential growth in large stat sets

#### Helper Functions
```typescript
// Check if stats are incompatible
areStatsIncompatible('hp', 'damage') // → true

// Get synergy multiplier (bidirectional)
getSynergyMultiplier('damage', 'crit') // → 1.15

// Get stat category for grouping
getStatCategory('damage') // → 'offensive'
```

#### Updated Pair Generation Logic
```typescript
for (let i = 0; i < statIds.length; i++) {
  for (let j = i + 1; j < statIds.length; j++) {
    const statId1 = statIds[i];
    const statId2 = statIds[j];

    // Skip incompatible pairs
    if (config.excludeIncompatiblePairs && areStatsIncompatible(statId1, statId2)) {
      continue;
    }

    // Skip low-synergy pairs  
    if (config.useSynergyMultipliers) {
      const synergy = getSynergyMultiplier(statId1, statId2);
      if (synergy < config.minSynergyThreshold) {
        continue;
      }
    }

    // Generate archetype...
  }
}
```

#### Testing Coverage (Enhanced)
- ✅ Basic pair generation (C(n,2) combinations)
- ✅ Incompatible pairs filtering
- ✅ Synergy multiplier validation
- ✅ Configuration-based generation
- ✅ Edge cases and error handling
- ✅ Performance with large stat sets

This enhancement ensures the stress testing focuses on realistic and balanced stat combinations while maintaining comprehensive coverage of meaningful synergies.

---

### 1.1 Mono-Stat Archetypes (Dynamic from BalancerConfig)

**Goal:** For each non-derived stat in the live BalancerConfig, create an archetype that stresses it.

**Source:** Stats come from `BalancerConfig.stats` (the same config used by the Balancer tab).

**Filtering:**
- Exclude `isDerived === true`
- Exclude stats with `formula` field
- Exclude `isHidden === true`

```typescript
// File: src/balancing/testing/StressTestArchetypeGenerator.ts

interface StatsArchetype {
  id: string;
  name: string;
  type: 'single-stat';
  stats: StatBlock;           // Full stat block for simulation
  testedStats: string[];      // [statId]
  pointsPerStat: number;      // Budget tier (25, 50, 75)
  weights: Record<string, number>;
  description: string;
}

class StatsArchetypeGenerator {
  private readonly config: BalancerConfig;
  private readonly nonDerivedStatIds: string[];

  constructor(config: BalancerConfig) {
    this.config = config;
    // Filter: only non-derived, non-formula, non-hidden stats
    this.nonDerivedStatIds = Object.values(config.stats)
      .filter((s) => !s.isDerived && !s.formula && !s.isHidden)
      .map((s) => s.id);
  }

  generateSingleStatArchetypes(pointTiers: number[] = [25, 50, 75]): StatsArchetype[] {
    const result: StatsArchetype[] = [];

    for (const statId of this.nonDerivedStatIds) {
      const def = this.config.stats[statId];
      if (!def) continue;

      for (const pointsPerStat of pointTiers) {
        // Use weight from config (live from Balancer tab)
        const weight = def.weight;
        const delta = weight * pointsPerStat;

        const stats = cloneBaseline();
        stats[statId] = (stats[statId] ?? 0) + delta;

        result.push({
          id: `stress-${statId}-${pointsPerStat}`,
          name: `Stress +${pointsPerStat} ${def.label}`,
          type: 'single-stat',
          stats,
          testedStats: [statId],
          pointsPerStat,
          weights: { [statId]: weight },
          description: `Baseline + ${delta.toFixed(2)} (${weight} hp/pt × ${pointsPerStat} pt) on ${def.label}`,
        });
      }
    }

    return result;
  }
}
```

---

### 2.1 Round-Robin Runner ✅ (Phase 2 Complete)

**Status:** ✅ RoundRobinRunner implemented, tested, and integrated with Monte Carlo engine.

#### Core Implementation
- **Class:** `RoundRobinRunner` in `src/balancing/testing/RoundRobinRunner.ts`
- **Method:** `runRoundRobin(archetypes, iterations, tier, seed)` → `RoundRobinResults`
- **Integration:** Uses `runMonteCarlo` from `src/balancing/1v1/montecarlo.ts` for deterministic simulations
- **Config:** Accepts `BalancerConfig1v1` for simulation parameters

#### Algorithm Flow
1. **Filter Archetypes:** Extract single-stat archetypes from `StressTestArchetype[]`
2. **Generate Matchups:** Create all unique pairs (i,j) where i < j
3. **Run Simulations:** For each pair, call `runMonteCarlo` with seeded RNG
4. **Collect Results:** Store `MatchupResult` for each simulation
5. **Calculate Efficiencies:** Compute per-stat win rates and rankings
6. **Return Analysis:** `RoundRobinResults` with matchups matrix and efficiency table

#### Key Features
- **Deterministic Seeding:** Unique seed per matchup for reproducibility
- **Error Handling:** Graceful fallback for failed simulations (neutral 0.5 win rate)
- **Performance:** Async execution with UI yield points to prevent blocking
- **Logging:** Console diagnostics for progress and results
- **Type Safety:** Full TypeScript interfaces for results and metadata

#### API Example
```typescript
import { RoundRobinRunner } from '@/balancing/testing/RoundRobinRunner';

const runner = new RoundRobinRunner();
const results = await runner.runRoundRobin(archetypes, 1000, 25, 42);

// Results structure
{
  matchups: MatchupResult[],     // NxN matrix of simulation results
  efficiencies: StatEfficiency[], // Per-stat rankings and assessments  
  tier: 25,                      // Budget level used
  iterations: 1000,              // Simulations per matchup
  timestamp: number              // When analysis completed
}
```

#### MatchupResult Structure
```typescript
interface MatchupResult {
  statA: string;           // First stat ID
  statB: string;           // Second stat ID  
  pointsPerStat: number;   // Budget tier
  winRateA: number;        // Win rate for statA archetype
  winRateB: number;        // Win rate for statB archetype
  avgTurns: number;        // Average combat duration
  iterations: number;      // Simulations run
  runtimeMs: number;       // Time taken for this matchup
}
```

#### StatEfficiency Structure  
```typescript
interface StatEfficiency {
  statId: string;
  pointsPerStat: number;
  efficiency: number;         // 0-1, mean win rate vs others
  rank: number;               // 1 = strongest
  wins: number;               // Matchups with winRate > 0.55
  losses: number;             // Matchups with winRate < 0.45  
  draws: number;              // Matchups with 0.45-0.55
  matchups: MatchupResult[];  // All matchups involving this stat
  assessment: 'OP' | 'strong' | 'balanced' | 'weak' | 'underpowered';
}
```

#### Testing Coverage
- ✅ Archetype filtering and matchup generation
- ✅ Monte Carlo integration with mocked simulations
- ✅ Efficiency calculation and ranking logic
- ✅ Error handling for simulation failures
- ✅ Deterministic seeding and reproducibility
- ✅ Performance with async yield points

#### Performance Characteristics
- **Time Complexity:** O(n² × iterations) where n = number of stats
- **Typical:** 10 stats → 45 matchups × 1000 sims = 45k total simulations
- **Memory:** ~1KB per matchup result
- **Deterministic:** Same inputs = identical results
- **Scalable:** Yield points prevent UI blocking on large runs

#### Integration with Phase 1
- **Input:** Consumes `StressTestArchetype[]` from `StressTestArchetypeGenerator`
- **Output:** Produces analysis ready for UI components (`StatEfficiencyTable`, `MatchupHeatmap`)
- **Seeded:** Uses archetype seeds for consistent matchup seeding

#### Next Steps
- **Phase 3:** Build UI components for visualization
- **Phase 4:** Integrate with live BalancerConfig for real-time analysis
- **Phase 5:** Add multi-tier aggregation and comparison

---

## 📊 PHASE 3: Presentation Layer (✅ Core Implemented)

The core of the system: run every stat@budget vs every other stat@budget.

```typescript
// File: src/balancing/testing/RoundRobinRunner.ts

interface MatchupResult {
  statA: string;
  statB: string;
  pointsPerStat: number;
  winRateA: number;      // Win rate of statA archetype
  winRateB: number;      // = 1 - winRateA
  avgTurns: number;
  iterations: number;
}

interface StatEfficiency {
  statId: string;
  pointsPerStat: number;
  efficiency: number;    // Mean win rate vs all other stats
  wins: number;          // Total matchups won (winRate > 0.5)
  losses: number;        // Total matchups lost
  matchups: MatchupResult[];
}

class RoundRobinRunner {
  constructor(private config: BalancerConfig) {}

  /**
   * Run full round-robin for a given budget tier.
   * Returns NxN matchup matrix + per-stat efficiency scores.
   */
  async runRoundRobin(
    archetypes: StatsArchetype[],
    iterations: number = 1000
  ): Promise<{
    matchups: MatchupResult[];
    efficiencies: StatEfficiency[];
  }> {
    const matchups: MatchupResult[] = [];

    // For each pair (i, j) where i < j
    for (let i = 0; i < archetypes.length; i++) {
      for (let j = i + 1; j < archetypes.length; j++) {
        const archA = archetypes[i];
        const archB = archetypes[j];

        // Run Monte Carlo: archA vs archB
        const result = MonteCarloSimulation.run({
          combat: {
            entity1: toEntityStats(archA.stats, archA.testedStats[0]),
            entity2: toEntityStats(archB.stats, archB.testedStats[0]),
            turnLimit: 100,
          },
          iterations,
        });

        matchups.push({
          statA: archA.testedStats[0],
          statB: archB.testedStats[0],
          pointsPerStat: archA.pointsPerStat,
          winRateA: result.summary.winRates.entity1,
          winRateB: result.summary.winRates.entity2,
          avgTurns: result.combatStatistics.averageTurns,
          iterations,
        });
      }
    }

    // Calculate efficiency for each stat
    const efficiencies = this.calculateEfficiencies(archetypes, matchups);

    return { matchups, efficiencies };
  }

  private calculateEfficiencies(
    archetypes: StatsArchetype[],
    matchups: MatchupResult[]
  ): StatEfficiency[] {
    const statIds = archetypes.map((a) => a.testedStats[0]);
    const pointsPerStat = archetypes[0]?.pointsPerStat ?? 25;

    return statIds.map((statId) => {
      // Find all matchups involving this stat
      const relevant = matchups.filter(
        (m) => m.statA === statId || m.statB === statId
      );

      // Calculate win rates from this stat's perspective
      const winRates = relevant.map((m) =>
        m.statA === statId ? m.winRateA : m.winRateB
      );

      const efficiency = winRates.reduce((a, b) => a + b, 0) / winRates.length;
      const wins = winRates.filter((wr) => wr > 0.5).length;
      const losses = winRates.filter((wr) => wr < 0.5).length;

      return {
        statId,
        pointsPerStat,
        efficiency,
        wins,
        losses,
        matchups: relevant,
      };
    });
  }
}
```

### 2.2 Metrics Types

```typescript
// File: src/balancing/testing/metrics.ts

interface StatEfficiencyMetrics {
  statId: string;
  pointsPerStat: number;
  efficiency: number;        // 0–1, mean win rate vs all others
  rank: number;              // 1 = strongest
  assessment: 'OP' | 'strong' | 'balanced' | 'weak' | 'underpowered';
}

// Assessment thresholds:
// efficiency > 0.65 → OP (needs nerf / higher cost)
// efficiency > 0.55 → strong
// efficiency 0.45–0.55 → balanced
// efficiency 0.35–0.45 → weak
// efficiency < 0.35 → underpowered (needs buff / lower cost)
```

---

## 📊 PHASE 3: Marginal Utility Calculator (✅ Implemented)

Core analytics engine for calculating stat synergies and marginal utility via Monte Carlo simulations.

### 3.1 MarginalUtilityCalculator Class

```typescript
// File: src/balancing/stressTesting/MarginalUtilityCalculator.ts

export class MarginalUtilityCalculator {
  private baseline: Archetype;
  private config: BalancerConfig1v1;
  private simulationCount: number;

  constructor(baseline: Archetype, config: BalancerConfig1v1 = DEFAULT_1V1_CONFIG, simulationCount = 10000) {
    // Constructor takes baseline archetype and config
  }

  /**
   * Run Monte Carlo simulation for a single archetype vs baseline
   */
  private analyzeArchetype(archetype: Archetype): MarginalUtilityResult

  /**
   * Analyzes all archetypes and computes marginal utilities
   */
  analyzeArchetypes(archetypes: Archetype[]): MarginalUtilityResult[]

  /**
   * Analyzes synergy for pair archetypes
   */
  analyzeSynergies(
    pairArchetypes: Archetype[],
    singleResults: MarginalUtilityResult[]
  ): SynergyResult[]

  /**
   * Generates heatmap data structure for UI visualization
   */
  generateSynergyHeatmapData(synergies: SynergyResult[]): Record<string, Record<string, number>>

  /**
   * Map archetype stats to StatBlock
   */
  private mapToStatBlock(stats: Record<string, number>): Record<string, number>
}
```

### 3.2 Key Features

- **Monte Carlo Integration**: Uses `runMonteCarlo` from 1v1 engine for accurate simulations
- **LCG Seeding**: Deterministic seeding via `TestRNG` for reproducible results
- **Config-First Thresholds**: OP/weak synergy thresholds from `BALANCING_CONFIG.opSynergyThreshold`
- **Memory Optimization**: Single-run simulations (10k iterations) per archetype
- **Performance**: Optimized for 10k+ simulations without UI blocking

### 3.3 MarginalUtilityResult Interface

```typescript
interface MarginalUtilityResult {
  archetype: Archetype;
  averageScore: number;        // Win rate vs baseline (0-1)
  marginalUtility: number;     // Percentage improvement over baseline
  standardDeviation: number;   // 0 for single-run (can be extended)
  simulationCount: number;     // 10000
}
```

### 3.4 SynergyResult Interface

```typescript
interface SynergyResult {
  pairArchetype: Archetype;
  statIds: [string, string];
  pairScore: number;           // Win rate of pair vs baseline
  expectedScore: number;       // Average of individual wins
  synergyMultiplier: number;   // pairScore / expectedScore
  isOpSynergy: boolean;        // > config threshold (e.g. >1.15x)
  isWeakSynergy: boolean;      // < config threshold (e.g. <0.95x)
}
```

### 3.5 Export Capabilities

- **CSV Export**: Marginal utilities and synergies to CSV format
- **JSON Export**: Full analysis results with metadata
- **Heatmap Data**: Nested record structure for UI visualization

### 3.6 Synergy Reporter CLI

A dedicated CLI (`scripts/stressTesting/marginalReport.ts`) provides KS-105 analysts with a quick way to summarize marginal utility output into JSON or Markdown reports.

```
npm run sts:synergy-report -- \
  --input /data/exports/stressTesting/marginalUtility/mu-analysis.json \
  --format markdown \
  --output /tmp/mu-report.md \
  --op-threshold 1.2 \
  --weak-threshold 0.9 \
  --top 12
```

- **Input**: MarginalUtilityAnalysis JSON emitted by `runStressPipeline` or calculator exports.
- **Formats**: `json` (default) or `markdown` for retro-ready dashboards.
- **Highlight Controls**: `--top`, `--anomaly-threshold`, `--weak-anomaly-threshold` tune OP/weak tables.
- **Defaults**: OP ≥ 1.15×, Weak ≤ 0.95×, anomalies flagged at ≥ 1.35× or ≤ 0.75×.

### 3.6 Usage Example

```typescript
import { MarginalUtilityCalculator } from '@/balancing/stressTesting/MarginalUtilityCalculator';
import { generateStressTestArchetypes } from '@/balancing/stressTesting/StressTestArchetypeGenerator';

const archetypes = await generateStressTestArchetypes(42);
const baseline = archetypes.find(a => a.id === 'baseline')!;
const calculator = new MarginalUtilityCalculator(baseline);

const marginalResults = calculator.analyzeArchetypes(archetypes);
const singleStats = marginalResults.filter(r => r.archetype.id.startsWith('single_'));

const synergies = calculator.analyzeSynergies(
  archetypes.filter(a => a.id.startsWith('pair_')),
  singleStats
);

// Export results
const csvData = calculator.exportMarginalUtilitiesToCsv(marginalResults);
const heatmap = calculator.generateSynergyHeatmapData(synergies);
```

### 3.7 Integration with Round-Robin

- **Input**: Consumes archetypes from `StressTestArchetypeGenerator`
- **Output**: Produces synergy data for `SynergyHeatmap` UI component
- **Performance**: Designed for large datasets (100+ archetypes)
- **Deterministic**: Same inputs = identical results

### 3.8 Testing Coverage

- ✅ Monte Carlo integration with mocked simulations
- ✅ Synergy calculation logic and threshold application
- ✅ Export functionality (CSV/JSON)
- ✅ Memory optimization for large archetype sets
- ✅ Deterministic seeding and reproducibility

### 3.9 StressTestDashboard UI (✅ 2026-01-03)

- **Entry point:** `@src/ui/balancing/StressTestDashboard.tsx`
- **Layout:** observatory hero (phase label + CTA row), action row (generate/run/export), content tabs (utility / synergy / radar)
- **Controls:** custom drawer for stat focus (single + pair) wired to `selectStat` / `selectPair`; Refresh button triggers `refreshData`
- **Components wired:** `MarginalUtilityTable`, `SynergyHeatmap`, `StatProfileRadar` (all config-first, zero hardcoding)
- **State handling:** `useStressTesting()` drives loading/error states; tabs show fallback messaging when datasets empty
- **Docs:** `docs/ui_regressions/stress_test_dashboard.md` captures UI evidence + follow-ups

### 3.11 MarginalUtilityCalculator Tests (✅ 2026-01-03)

- **File:** `src/balancing/stressTesting/__tests__/MarginalUtilityCalculator.test.ts`
- **Coverage:** Complete suite with 100% accuracy verification
- **Mock Strategy:** `runMonteCarlo` mocked for fast execution (no 10k real simulations)
- **Test Categories:**
  - `analyzeArchetypes`: Marginal utility calculations, baseline handling, reproducibility
  - `analyzeSynergies`: OP/weak synergy detection (>1.15x/<0.95x thresholds), error handling
  - `exportMarginalUtilitiesToCsv` / `exportSynergiesToCsv`: CSV format validation
  - `toJson`: Full analysis export with marginal utilities and synergies
  - Deterministic seeding: Reproducible results across runs
  - Performance: Custom simulation count (e.g., 5000) respected
- **Key Features Tested:**
  - Win rate calculations with seeded RNG
  - Synergy multiplier computation (pairScore / expectedScore)
  - Threshold-based OP/weak classification using `BALANCING_CONFIG`
  - Error handling: Missing baseline, invalid pair IDs, incomplete single results
  - Export formats: CSV headers/data, JSON structure
- **Vitest Config:** 30s timeout for potential long runs, mocked dependencies for isolation

**API Examples (Test-Driven):**

```typescript
// Marginal utility analysis
const results = calculator.analyzeArchetypes(archetypes);
// Verifies: baseline marginalUtility=0, others calculated as % improvement

// Synergy detection
const synergies = calculator.analyzeSynergies(pairArchetypes, singleResults);
// Verifies: synergyMultiplier calculation, OP/weak flags

// CSV export
const csv = calculator.exportMarginalUtilitiesToCsv(results);
// Verifies: Headers + data rows with 4 decimal precision

// JSON export
const json = calculator.toJson({ marginalUtilities: results, synergies });
// Verifies: Structured export with all metrics
```

### 3.12 Next Steps

---

### 3.1 Stat Efficiency Table

Shows per-stat efficiency scores ranked from strongest to weakest.

```typescript
// File: src/ui/testing/StatEfficiencyTable.tsx

interface StatEfficiencyTableProps {
  efficiencies: StatEfficiency[];
  tier: number;
}

export const StatEfficiencyTable: React.FC<StatEfficiencyTableProps> = ({
  efficiencies,
  tier
}) => {
  const sorted = [...efficiencies].sort((a, b) => b.efficiency - a.efficiency);
  
  const getAssessment = (eff: number) => {
    if (eff > 0.65) return { label: 'OP', color: 'text-red-400' };
    if (eff > 0.55) return { label: 'Strong', color: 'text-amber-400' };
    if (eff > 0.45) return { label: 'Balanced', color: 'text-green-400' };
    if (eff > 0.35) return { label: 'Weak', color: 'text-blue-400' };
    return { label: 'Underpowered', color: 'text-purple-400' };
  };
  
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-indigo-500/30">
          <th className="px-3 py-2 text-left">Rank</th>
          <th className="px-3 py-2 text-left">Stat</th>
          <th className="px-3 py-2 text-right">Efficiency</th>
          <th className="px-3 py-2 text-right">W/L</th>
          <th className="px-3 py-2 text-center">Assessment</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((eff, idx) => {
          const assessment = getAssessment(eff.efficiency);
          return (
            <tr key={eff.statId} className="border-b border-slate-700/50">
              <td className="px-3 py-2 text-slate-400">#{idx + 1}</td>
              <td className="px-3 py-2 font-semibold text-indigo-300">{eff.statId}</td>
              <td className="px-3 py-2 text-right font-mono">
                {(eff.efficiency * 100).toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-right text-slate-400">
                {eff.wins}W / {eff.losses}L
              </td>
              <td className={`px-3 py-2 text-center ${assessment.color}`}>
                {assessment.label}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
```

### 3.2 NxN Matchup Heatmap

Shows win rates for every stat vs every other stat.

```typescript
// File: src/ui/testing/MatchupHeatmap.tsx

interface MatchupHeatmapProps {
  matchups: MatchupResult[];
  statIds: string[];
}

export const MatchupHeatmap: React.FC<MatchupHeatmapProps> = ({ matchups, statIds }) => {
  // Build NxN matrix
  const matrix: Record<string, Record<string, number>> = {};
  
  statIds.forEach(s => {
    matrix[s] = {};
    statIds.forEach(s2 => {
      matrix[s][s2] = 0.5; // Default = draw
    });
  });
  
  matchups.forEach(m => {
    matrix[m.statA][m.statB] = m.winRateA;
    matrix[m.statB][m.statA] = m.winRateB;
  });
  
  const getColor = (winRate: number) => {
    if (winRate > 0.7) return 'bg-green-600';
    if (winRate > 0.55) return 'bg-green-500/60';
    if (winRate > 0.45) return 'bg-slate-600';
    if (winRate > 0.3) return 'bg-red-500/60';
    return 'bg-red-600';
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1 text-slate-400">vs</th>
            {statIds.map(s => (
              <th key={s} className="px-2 py-1 text-indigo-200 font-semibold">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statIds.map(statA => (
            <tr key={statA}>
              <th className="px-2 py-1 text-indigo-200 font-semibold text-right">
                {statA}
              </th>
              {statIds.map(statB => {
                const winRate = matrix[statA][statB];
                const isSelf = statA === statB;
                return (
                  <td 
                    key={`${statA}-${statB}`}
                    className={`px-2 py-1 ${isSelf ? 'bg-slate-800' : getColor(winRate)} text-white text-center`}
                    title={`${statA} vs ${statB}: ${(winRate * 100).toFixed(0)}%`}
                  >
                    {isSelf ? '—' : (winRate * 100).toFixed(0)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 3.3 Efficiency Radar Chart (✅ Implemented)

StatProfileRadar component created for comparative visualization of stat profiles.

```typescript
// File: src/ui/balancing/StatProfileRadar.tsx
interface StatProfileRadarProps {
  profiles: StressTestArchetype[];
  baselineProfile?: StressTestArchetype;
}

export function StatProfileRadar({ profiles, baselineProfile }: StatProfileRadarProps) {
  // Config-first implementation using BalancerConfig for labels
  // Placeholder with tabular display; ready for D3.js integration
}
```

**Features:**
- Dynamic stat labels from `BalancerConfig.stats[*].label`
- Baseline vs. archetype comparison
- Filters derived/hidden stats
- Uses shadcn/ui styling consistent with Gilded Observatory theme

**Integration:** Added to `StressTestDashboard` for profile selection and visualization.

**Documentation:** `docs/ui_regressions/stat_profile_radar.md` with usage examples and future enhancements.

---

## 🔄 PHASE 4: Integration (✅ Round-Robin + Balancer Config Wiring)

### 4.1 Hook for Round-Robin Testing

```typescript
// File: src/ui/testing/useRoundRobinTesting.ts

export function useRoundRobinTesting() {
  const { config } = useBalancerConfig();
  const [results, setResults] = useState<RoundRobinResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = useCallback(async (tier: number = 25, iterations: number = 1000) => {
    setIsRunning(true);
    try {
      const generator = new StatsArchetypeGenerator(config);
      const archetypes = generator.generateSingleStatArchetypes([tier]);
      
      const runner = new RoundRobinRunner(config);
      const results = await runner.runRoundRobin(archetypes, iterations);
      
      setResults(results);
    } finally {
      setIsRunning(false);
    }
  }, [config]);

  return { results, isRunning, runTests };
}
```

### 4.2 Live Config Integration

- Stats come from `useBalancerConfig()` (live from Balancer tab)
- Weights come from `config.stats[statId].weight`
- Changes in Balancer tab reflect immediately in Stat Testing
- The **Stat Stress Testing** page now exposes a live, editable view of all non-derived stat weights, wired directly to `updateStat` on the shared `BalancerConfig`.

---

## 📈 PHASE 5: Dashboard Page (✅ First Iteration Shipped)

```typescript
// File: src/ui/testing/StatStressTestingPage.tsx

// Before run: show list of stats from current config
// After run: show efficiency table + NxN heatmap + radar
// Tier selector: 25 / 50 / 75
// Iterations selector: 500 / 1000 / 2000

// NEW (Dec 2025):
// - After results are available, show a clear table of current stat WEIGHTS
//   (config.stats[statId].weight) alongside the efficiency metrics.
// - Each weight must be editable in-place from this page.
// - Edits must propagate back through the shared config/store
//   (useBalancerConfig / BalancerConfigStore), so that:
//   - future stress-test runs use the updated weights
//   - any other system depending on weights (e.g. archetype generation)
//     sees the new values immediately.
```

---

## 📦 PHASE 2: React Hook Integration (✅ Implemented)

**Status:** Complete - Hook provides seamless UI integration for stress testing.

### Files Created
- `src/balancing/hooks/useStressTesting.ts` - Main React hook with full API
- Vitest tests: `src/balancing/hooks/__tests__/useStressTesting.test.ts`

### Core Features
- **Config Integration**: Uses `useBalancerConfig()` for live BalancerConfig access (no hardcoding)
- **Timeout Protection**: 30s timeout on all async operations with Promise.race
- **Smart Caching**: Cache archetypes, analyses, heatmaps by key to avoid redundant computations
- **Selection Methods**: `selectStat()`, `selectPair()`, `generateArchetypes()` for targeted generation
- **Diagnostic Logging**: Console logs for timing, generation steps, and errors
- **Export Support**: JSON/CSV export via MarginalUtilityCalculator integration

### Hook API

```typescript
interface StressTestingResults {
  archetypes: StressTestArchetype[];
  marginalUtilities: MarginalUtilityResult[];
  synergies: SynergyResult[];
  heatmapData: Record<string, Record<string, number>>;
  isLoading: boolean;
  error: string | null;
}

function useStressTesting(): StressTestingResults & {
  generateArchetypes: (type: 'all' | 'single' | 'pair', statId?: string, pair?: { stat1: string; stat2: string }) => Promise<void>;
  runAnalysis: (key: string) => Promise<void>;
  exportResults: (key: string, format: 'json' | 'csv') => string | { marginalCsv: string; synergiesCsv: string };
  selectStat: (statId: string) => void;
  selectPair: (stat1: string, stat2: string) => void;
  selectedStat: string | null;
  selectedPair: { stat1: string; stat2: string } | null;
  refreshData: (key: string) => Promise<void>;
}
```

### Usage Examples

```typescript
// Basic usage with live config
const {
  archetypes,
  marginalUtilities,
  synergies,
  heatmapData,
  isLoading,
  error,
  generateArchetypes,
  runAnalysis,
  selectStat,
  selectPair,
  exportResults,
} = useStressTesting();

// Generate all archetypes
await generateArchetypes('all');

// Select specific stat for focused view
selectStat('hp');
await generateArchetypes('single', 'hp');
await runAnalysis('single-hp');

// Export results
const csvData = exportResults('single-hp', 'csv');
```

### Integration Points
- **BalancerConfigStore**: Live config access via `useBalancerConfig`
- **StressTestArchetypeGenerator**: Dynamic archetype creation from config
- **MarginalUtilityCalculator**: Analysis and export functionality
- **React Query Ready**: Designed for easy migration to RQ/SWR caching

### Performance Optimizations
- Caching prevents redundant generations/analysis
- Memoized computed results based on selection
- Timeout prevents UI hangs on long operations
- TypeScript for compile-time safety

### Testing Coverage
- Hook behavior tests with mocked dependencies
- Async operation testing with timeout scenarios
- Cache invalidation and refresh testing
- Error handling and loading state tests

### Next Steps
- **Phase 3**: Integrate hook with `StressTestDashboard` UI
- **Phase 4**: Add React Query for advanced caching
- **Phase 5**: Real-time config updates during testing

---

- [ ] Mono-stat archetypes generated dynamically from BalancerConfig
- [ ] Round-robin: every stat@N vs every other stat@N
- [ ] NxN matchup matrix with win rates
- [ ] Per-stat efficiency scores calculated
- [ ] Efficiency table with rank + assessment
- [ ] NxN heatmap visualization
- [ ] Multi-tier support (25, 50, 75)
- [ ] Deterministic (seeded RNG)
- [ ] Live integration with Balancer config

---

## 🔗 REFERENCES

**Related Documents:**
- `docs/plans/archetype_balancing_plan.md` - Archetype system
- `docs/STAT_BALANCING_ANALYSIS.md` - Weight calibration methodology
- `docs/plans/config_driven_balancer_plan.md` - Config system

**Key Files:**
- `src/balancing/testing/StressTestArchetypeGenerator.ts` ✅
- `src/balancing/testing/RoundRobinRunner.ts` (NEW)
- `src/balancing/testing/metrics.ts` ✅
- `src/ui/testing/StatEfficiencyTable.tsx` (NEW)
- `src/ui/testing/MatchupHeatmap.tsx` (NEW)
- `src/ui/testing/StatStressTestingPage.tsx` ✅

---

## 🚀 IMPLEMENTATION ROADMAP

### Step 1: Archetype Generator ✅
- Read stats from BalancerConfig
- Filter: no derived, no formula, no hidden
- Generate mono-stat archetypes at multiple tiers

### Step 2: Round-Robin Runner (✅ Implemented)
- For each pair (statA, statB): run Monte Carlo
- Collect NxN matchup results
- Calculate per-stat efficiency

### Step 3: UI Components (✅ First Pass Implemented)
- StatEfficiencyTable: ranked list with assessment
- MatchupHeatmap: NxN win rate matrix
- EfficiencyRadar: visual balance indicator

### Step 4: Integration (✅ Config-Driven, Multi-Tier)
- Connected to live BalancerConfig via `useBalancerConfig`
- Tier selector (25 / 50 / 75 / 100) and iteration selector (500 / 1000 / 2000)
- Basic loading state and progress indication for long runs

---

## 🧭 PHASE 9: Auto Stat Balancer & History (Design)

> Goal: extend the existing stat stress testing system into a **config-driven Auto Stat Balancer** that can iteratively adjust `BalancerConfig.stats[*].weight` based on Round-Robin results, while keeping a structured history of runs and sessions.

### 9.1 High-Level Objectives

1. **Stat-Centric AutoBalance**
   - Use empirical Round-Robin efficiency scores (Section 2) as the primary signal to adjust stat weights.
   - Keep `BalancerConfig` as the **single source of truth** for all weights (no parallel tables, no hardcoding).

2. **Inline Weight Suggestions**
   - On the Stat Stress Testing UI, show **per-stat suggestions** (from a pure TS service) alongside the live weight inputs.
   - Suggestions must be **explainable** ("HP efficiency 0.62 > 0.55 → nerf weight by ~10%") and bounded (per-iteration caps).

3. **History of Runs & Sessions**
   - Persist a dedicated `StatBalanceRun` history separate from the generic BalancerConfig history snapshots.
   - Each run stores: timestamp, tiers/iterations, a balance score, and a compact snapshot of efficiency metrics.
   - Group runs into `StatBalanceSession` when using AutoBalance (Section 9.4).

4. **Recursive AutoBalance Loop**
   - Implement an offline/authoring-only loop that:
     1. Reads current `BalancerConfig` weights.
     2. Runs Round-Robin tests for the configured tiers.
     3. Produces adjusted weights via a deterministic rule set.
     4. Persists both the new config and the run metrics as a session iteration.
   - Stop criteria: all stats in a target band (e.g. 0.45–0.55) and/or max iteration count.

5. **Historical Comparison Views**
   - Allow comparing multiple runs side-by-side (weights, efficiency scores, heatmaps) to understand the trajectory of changes.
   - Keep the UI read-only for historical data; edits happen only on the **current** BalancerConfig.

---

### 9.2 Domain Model (Stat AutoBalance)

New domain types (pure TS, no React):

- `StatBalanceRun`
  - `id: string`
  - `timestamp: number`
  - `configVersion: string`
  - `weights: Record<string, number>` (snapshot of non-derived stat weights)
  - `tiers: number[]` (e.g. [25, 50, 75, 100])
  - `iterationsPerTier: number`
  - `balanceScore: number` (aggregate metric, e.g. mean |efficiency-0.5|)
  - `summary: { overpowered: string[]; underpowered: string[] }`

- `StatBalanceSession`
  - `sessionId: string`
  - `startTime: number`
  - `endTime?: number`
  - `runs: StatBalanceRun[]`
  - `strategy: 'manual' | 'auto'`

These types live under `src/balancing/testing` (or an adjacent `stats` subfolder) and are **UI-agnostic**.

---

### 9.3 Stat Weight Advisor (Suggestions Engine)

**Purpose:** Given a snapshot of Round-Robin stat efficiencies and the current `BalancerConfig`, propose **bounded weight adjustments** per stat.

Design sketch:

- File: `src/balancing/stats/StatWeightAdvisor.ts`
- Input:
  - `config: BalancerConfig`
  - `efficiencies: StatEfficiency[]` (from RoundRobinRunner, Section 2)
  - parameters: `targetBand = [0.45, 0.55]`, `maxDeltaPerIteration`, etc. (config-driven)
- Output (per stat):
  - `currentWeight: number`
  - `suggestedWeight: number`
  - `delta: number`
  - `reason: string`

Rules (example, tunable via config):

- If `efficiency > targetMax` → stat is too strong → **decrease** weight.
- If `efficiency < targetMin` → stat is too weak → **increase** weight.
- Clamp `|delta| / currentWeight <= maxRelativeDelta` (e.g. 10% per iteration).
- For derived/hidden stats: **no suggestions**.

The advisor is a **pure function**, testable via Vitest, and does not touch React or localStorage directly.

---

### 9.4 AutoBalance Session Engine

**Purpose:** Run multiple advisor iterations in a row, each time re-running Round-Robin on the updated config, to converge towards a balanced band.

Design sketch:

- File: `src/balancing/stats/AutoStatBalancer.ts`
- Core API:
  - `runSession(config: BalancerConfig, options): StatBalanceSession`
    - internally:
      1. For `i` in `[1..maxIterations]`:
         - run Round-Robin tests (using `RoundRobinRunner`),
         - compute `StatWeightAdvisor` suggestions,
         - apply suggestions to get `nextConfig`,
         - record a `StatBalanceRun`,
         - stop if all stats within target band.
      2. Return `StatBalanceSession` with all runs.

**Important:**

- The engine **returns** the resulting config + session, but **does not** persist anything by itself.
- Persistence is delegated to a dedicated store (Section 9.5) or to the caller (UI, CLI, etc.).

---

### 9.5 History Store (StatBalanceHistoryStore)

**Purpose:** Persist and query `StatBalanceRun` and `StatBalanceSession` data separately from BalancerConfig snapshots.

Design sketch:

- File: `src/balancing/stats/StatBalanceHistoryStore.ts`
- Backed by localStorage (or the same storage layer used by BalancerConfig), keys separated from `rpg_balancer_config`.
- API examples:
  - `addRun(run: StatBalanceRun): void`
  - `addSession(session: StatBalanceSession): void`
  - `listRuns(): StatBalanceRun[]`
  - `listSessions(): StatBalanceSession[]`
  - `getSession(id: string): StatBalanceSession | undefined`
  - `clear(): void`

No UI code here; only data access and validation.

---

### 9.6 UI Integration (Stat Stress Testing Page)

Key UX requirements for the **StatStressTestingPage**:

1. **Inline Suggestions Panel**
   - Extend the existing “Stat Weights (Live)” card with an additional column for **suggested weights** and a short reason.
   - Per-row controls:
     - “Apply” button → applies suggestion for that single stat via `updateStat`.
   - Global controls:
     - “Apply All Safe Suggestions” → applies only suggestions with small deltas (within a configured threshold).

2. **AutoBalance Trigger (Optional, Phase 2)**
   - Add an “AutoBalance Session” CTA:
     - opens a modal / drawer with options (max iterations, tiers, thresholds),
     - triggers `AutoStatBalancer.runSession`,
     - once completed, offers to apply the final weights to `BalancerConfig`.

3. **History & Comparison (Read-Only)**
   - A secondary view/tab that lists historical `StatBalanceRun` and `StatBalanceSession`:
     - click on a run → show its efficiency table, radar and heatmap (read-only snapshot).
     - multi-select → compare 2-3 runs side-by-side (weights + key metrics).

These UI additions must remain **config-driven** (no hardcoded stat lists) and reuse existing components wherever possible.

---

### 9.7 Testing & Determinism

- All new services (`StatWeightAdvisor`, `AutoStatBalancer`, `StatBalanceHistoryStore`) must be covered by Vitest.
- Round-Robin invocations inside AutoBalance must:
  - use deterministic RNG seeds,
  - explicitly specify iterations per tier.
- Target: given the same starting `BalancerConfig` and options, the AutoBalance session should be reproducible.


---

## 🧮 PHASE 6: Simulation-Driven Point Valuation (Stat Costs)

> Goal: turn the empirical Round-Robin results into a **point cost per stat unit**, so the system can automatically price stats instead of using only hand-tuned weights.

### 6.1 Concept

- Each primary stat `X` gets a **point cost** `C(X)` that reflects how much it moves win rate when increased by a small amount.
- Instead of guessing `C(X)` manually, we **measure** it via Monte Carlo:
  1. Start from a **baseline build** (coming from BalancerConfig default values).
  2. Create a variant with `X` increased by `ΔX` (e.g. `+10%` or `+5` flat).
  3. Run many self-play simulations (baseline vs boosted) to estimate **Δ win rate**.
  4. Convert that **Δ win rate** into a normalized **point cost** for `X`.

This is analogous to **sensitivity analysis** / **simulation balancing** in the literature: parameters that strongly affect win rate get a higher point cost.

### 6.2 Proposed Metric

For each stat `X`:

1. Define a reference delta `ΔX` (per stat type):
   - HP: +50
   - Damage: +5
   - Armor: +5
   - CritChance: +5%
   - etc. (config-driven)
2. Run `N` Monte Carlo matches (seeded) between:
   - Entity A: baseline stats.
   - Entity B: baseline stats with `X += ΔX`.
3. Measure `winRateBoosted` (win rate of Entity B vs A).
4. Define **marginal value** of X as:

```text
ΔWR(X) = winRateBoosted - 0.5        // in [-0.5, +0.5]
```

5. Convert to **point cost per unit of X**:

```text
pointsPerUnit(X) = K * (ΔWR(X) / targetDeltaWR) / ΔX
```

Where:

- `targetDeltaWR` is a design target (e.g. `+0.05` = +5% win rate for the reference delta should correspond to 1 point).
- `K` is a global scaling constant to keep point values in a comfortable range.

### 6.3 Implementation Sketch (TODO)

New module, e.g. `src/balancing/testing/StatPointValuation.ts`:

- Input:
  - `BalancerConfig` (live stats definitions and default values).
  - Simulation parameters (iterations, seeds).
- Output:
  - `pointCosts: Record<string, number>` mapping `statId -> pointsPerUnit`.

Pipeline:

1. Build baseline `StatBlock` from BalancerConfig (same baseline used by `StressTestArchetypeGenerator`).
2. For each **non-derived** stat:
   - Construct `(baseline, baseline+ΔX)` pair and run simulations.
   - Estimate `ΔWR(X)` and `pointsPerUnit(X)`.
3. Persist results either:
   - Back into `config.stats[statId].weight` (overwriting manual weight), **or**
   - In a separate `pointCosts` structure consumed by archetype builders and other systems.

### 6.4 Current Status

- ✅ We already have a robust **simulation engine** and Round-Robin framework (single-stat archetypes, Monte Carlo, win rates).
- ✅ `metrics.ts` defines types that can be extended to store `ΔWR` and related sensitivity info.
- ❌ We do **not yet** run dedicated simulations of `baseline vs baseline+ΔX` per stat.
- ❌ There is **no module** that converts `Δ win rate` into a stable `pointsPerUnit` function.

---

## 🔗 PHASE 7: Synergy Function S(A, B) from Pair-Stat Simulations

> Goal: detect when **two stats together** are worth more than the sum of their individual contributions (non-linear synergy) and encode this as a synergy factor `S(A,B)` used in cost calculations.

### 7.1 Concept

For two stats A and B, we want to estimate how powerful **A+B together** are compared to what we would **expect** from A and B individually.

Terminology:

- `C(A)`, `C(B)`: individual point costs from Phase 6.
- `S(A,B)`: synergy factor.
- Combined cost:

```text
Cost(A+B) = C(A) + C(B) + S(A,B)
```

Synergy is **measured, not guessed**, using simulations.

### 7.2 Measurement Procedure (Pair-Stat Simulations)

For each pair of stats (A, B):

1. Build three archetypes (using a new `generatePairStatArchetypes` helper):
   - `Archetype_A`: baseline + ΔA on A only.
   - `Archetype_B`: baseline + ΔB on B only.
   - `Archetype_AB`: baseline + ΔA on A **and** ΔB on B.
2. Use the existing **simulation engine** to estimate win rate deltas vs baseline:
   - `ΔWR(A)` from Archetype_A vs baseline.
   - `ΔWR(B)` from Archetype_B vs baseline.
   - `ΔWR(A+B)` from Archetype_AB vs baseline.
3. Compute the **expected** improvement if A and B were purely additive:

```text
expectedDelta = ΔWR(A) + ΔWR(B)
```

4. Compare with the **observed** improvement of the pair:

```text
synergyDelta = ΔWR(A+B) - expectedDelta
synergyFactor S(A,B) = f(synergyDelta)
```

Where `f` is a scaling function that converts `synergyDelta` into bonus/malus points (e.g. linear scaling with clamping).

### 7.3 Data Structure (Aligning with PairSynergyMetrics)

We already have:

```ts
// src/balancing/testing/metrics.ts
interface PairSynergyMetrics {
  statA: string;
  statB: string;
  pointsPerStat: number;
  combinedWinRate: number;  // pair vs baseline
  expectedWinRate: number;  // from singles
  synergyRatio: number;     // combined / expected
  assessment: 'OP' | 'synergistic' | 'neutral' | 'weak';
}
```

Next steps (TODO):

- Implement a `PairSynergyCalculator` that:
  - Consumes single-stat sensitivity data from Phase 6.
  - Runs pair-stat simulations as described.
  - Produces `PairSynergyMetrics[]` plus a `synergyFactor` table `S(A,B)`.
- Integrate `PairSynergyMetrics` into the UI as a **separate, clearly labeled view** from the current Round-Robin matchup advantage heatmap (which is A vs B, not the (A+B) synergy).

### 7.4 Current Status

- ✅ Types for pair synergy (`PairSynergyMetrics`) and a visual component (`SynergyHeatmap`) exist.
- ✅ We already have infrastructure to run thousands of simulations deterministically.
- ❌ Archetype generation for **pair-stat builds** and synergy-specific simulations are **not implemented yet**.
- ❌ The current "Synergy Heatmap" view is actually a **matchup advantage heatmap** (A vs B), not the true (A+B) vs baseline synergy metric.

---

## 🧷 PHASE 8: Automatic Balancing Pipeline with Point Budgets

> Goal: use stat point costs `C(X)` and synergies `S(A,B)` to automatically keep characters, spells, bosses, etc. within a specified **point budget**.

### 8.1 Budget Model

Each entity type gets a **budget**:

- Player tank archetype: `~100` points.
- DPS archetype: `~80` points.
- Boss: `~300` points.
- Spell: `~20` points.
- Rare item: `~60` points.

Budget is a soft design input; the system enforces it automatically via cost calculations.

### 8.2 Total Cost Formula

Given a build with stats `{X_i}` and non-zero pairs `{(X_i, X_j)}`:

```text
CostTotal = Σ_i C(X_i) + Σ_{i<j} S(X_i, X_j)
```

Where:

- `C(X_i)` uses the **simulation-derived** point values from Phase 6.
- `S(X_i, X_j)` uses the **synergy factors** from Phase 7 (can be zero for most pairs).

### 8.3 Auto-Adjusting Builds (Nerf/Buff Loop)

For each entity (character, spell, boss):

1. Compute `CostTotal` from its current stats.
2. Compare to its budget `Budget(entityType)`.
3. If `CostTotal > Budget`:
   - Mark as **over-budget** (needs nerf or cost increase).
   - Options:
     - Reduce some stats proportionally.
     - Increase resource cost / cooldown / rarity.
4. If `CostTotal < Budget`:
   - Mark as **under-budget** (can be safely buffed).
   - Options:
     - Grant more points in the least impactful stats.
     - Improve quality-of-life effects.

This loop can be:

- **Offline**: run periodically as a developer tool to propose balance changes.
- **Online**: applied in editor when designing a new archetype/spell, giving immediate feedback.

### 8.4 Integration Points (TODO)

- Connect stat point costs and synergy factors into:
  - `ArchetypeBuilder` / character builder modules.
  - Spell/equipment definition systems.
- Expose **budget and cost information** in the UI:
  - Show `CostTotal / Budget` gauges.
  - Highlight which stats or combinations are pushing the build over the limit.

### 8.5 Current Status

- ✅ We have the **simulation infrastructure** and a **stat stress-testing UI** that already gives human-readable insight (efficiency ranking, matchups, heatmaps).
- ❌ We **do not yet**:
  - Compute point budgets per entity type.
  - Compute `CostTotal` from stats + synergies.
  - Run an automatic nerf/buff loop.

## Phase 10.5: Reporting Pipeline - COMPLETE

### Reporting Pipeline Implementation

**Status**: ✅ Complete - CLI export pipeline with JSON/CSV/Markdown output

**Components**:
- `scripts/stressTesting/exportStressReport.ts` - CLI tool for multi-format export
- `scripts/stressTesting/__tests__/exportStressReport.test.ts` - Unit tests for export functionality
- `docs/reports/StressTestingReportTemplate.md` - Standardized report template
- `package.json` - Added `stress:export` script

**Features**:
- **Multi-format Export**: JSON (canonical), CSV (Excel-compatible), Markdown (documentation)
- **Configurable Thresholds**: CLI flags for OP/weak synergy thresholds
- **Ranking Analysis**: Top 10 OP synergies, bottom 10 weak synergies, anomaly detection
- **Template System**: Standardized report format with placeholders
- **Validation**: Input validation and error handling
- **Performance Metrics**: Runtime tracking and simulation statistics

**CLI Usage**:
```bash
npm run stress:export -- -i data/stressTesting/latest.json -o docs/reports --op-threshold 1.2 --weak-threshold 0.9
```

**Test Coverage**:
- ✅ 15 unit tests covering parsing, ranking, threshold filtering, file output
- ✅ Mock file system operations for isolated testing
- ✅ Error handling and validation testing
- ✅ CLI argument parsing testing

**Integration Points**:
- Reads from `data/stressTesting/latest.json` (calculator output)
- Outputs to `docs/reports/` with timestamped files
- Template system for consistent documentation
- Configurable thresholds for different analysis needs

---

## Phase 10.5: Telemetry Integration

### Overview

The stress testing system now includes comprehensive telemetry integration for monitoring simulation runs, batch progress, and performance metrics. This enables data-driven analysis of the marginal utility pipeline and provides insights for optimization.

### Telemetry Architecture

#### Event Types
- **`stress_run_completed`**: Individual simulation run completion
- **`stress_run_failed`**: Simulation run failure with error details
- **`stress_batch_completed`**: Batch completion with aggregate statistics

#### Payload Structure
```typescript
interface StressTestTelemetryEventPayload {
  runId: string;
  archetypeId: string;
  statPair: string;
  winRate: number;
  synergyMultiplier: number;
  iterations: number;
  seed: number;
  durationMs?: number;
  config?: {
    pointsPerWeight: number;
    simulationCount: number;
    baselineStats: Record<string, number>;
  };
  error?: {
    message: string;
    stack?: string;
  };
  batchInfo?: {
    batchId: string;
    totalRuns: number;
    currentRun: number;
  };
}
```

### Integration Points

#### 1. MarginalUtilityCalculator Integration
- Automatic telemetry emission in `runSimulationBatch()`
- Error handling with failed run telemetry
- Deterministic run ID generation for traceability

#### 2. Punch Club Analytics Pipeline
- Events forwarded to global analytics buffer
- Real-time event dispatch via CustomEvent API
- Export utilities for JSON/CSV/Markdown analysis

#### 3. Throttling and Performance
- Configurable throttle rate (default: 1000ms)
- Separate throttle keys for different event types
- Memory-efficient event buffering

### Usage Examples

#### Individual Run Telemetry
```typescript
import { createStressTestContext } from '@/balancing/stressTesting/StressTelemetry';

const context = createStressTestContext('archetype-001', 'hp+damage', 12345);

// Completed run
context.emitCompleted({
  winRate: 0.75,
  synergyMultiplier: 1.2,
  iterations: 10000,
  durationMs: 5000,
});

// Failed run
context.emitFailed({
  winRate: 0,
  synergyMultiplier: 0,
  iterations: 0,
}, new Error('Simulation timeout'));
```

#### Batch Telemetry
```typescript
import { StressTestBatchTelemetry } from '@/balancing/stressTesting/StressTelemetry';

const batch = new StressTestBatchTelemetry('batch-001', 10);

// Record completed runs (automatically emits batch completion when done)
batch.recordCompletedRun('run-1', 'archetype-001', 'hp+damage', 0.75, 1.2);
batch.recordCompletedRun('run-2', 'archetype-002', 'hp+speed', 0.65, 1.1);

// Monitor progress
const progress = batch.getProgress();
console.log(`Progress: ${progress.progress * 100}%`);
```

### Data Analysis

#### Export Capabilities
```typescript
import { exportStressTestTelemetry, downloadStressTestTelemetry } from '@/analytics/telemetry/telemetryProvider';

// Export all telemetry data
const data = exportStressTestTelemetry();

// Export specific run
const runData = exportStressTestTelemetry('stress-archetype-001-hp+damage-12345-2026-01-11');

// Download as JSON file
downloadStressTestTelemetry('all', 'stress-telemetry-analysis.json');
```

#### Summary Statistics
```typescript
import { getStressTestTelemetrySummary } from '@/analytics/telemetry/telemetryProvider';

const summary = getStressTestTelemetrySummary();
console.log(`Total runs: ${summary.totalEvents}`);
console.log(`Completed runs: ${summary.stats.completedRuns}`);
console.log(`Failed runs: ${summary.stats.failedRuns}`);
console.log(`Average win rate: ${summary.stats.avgWinRate}`);
```

### Performance Monitoring

#### Key Metrics
- **Run Duration**: Average simulation time per archetype
- **Success Rate**: Percentage of completed vs failed runs
- **Throughput**: Runs per hour for performance analysis
- **Error Patterns**: Common failure modes and frequencies

#### Alerting Thresholds
- High failure rate (>10%): Potential simulation issues
- Long run times (>5000ms): Performance bottlenecks
- Missing evidence: Incomplete telemetry coverage

### Configuration

#### Telemetry Settings
```typescript
import { configureStressTelemetry } from '@/balancing/stressTesting/StressTelemetry';

configureStressTelemetry({
  enabled: true,
  throttleMs: 1000,
  debug: false,
});
```

#### Environment-Specific Settings
- **Development**: Debug mode enabled, shorter throttle
- **Production**: Optimized settings, comprehensive logging
- **Testing**: Disabled telemetry for clean test runs

### Privacy and Data Management

#### Data Retention
- Automatic cleanup of old telemetry events
- Configurable retention periods (default: 30 days)
- Export and archival capabilities

#### Sensitive Data
- No PII collected in telemetry
- Anonymous run IDs for privacy
- Configurable data anonymization

### Integration with CI/CD

#### Automated Testing
```bash
# Run stress tests with telemetry
npm run stress:test -- --telemetry

# Validate telemetry coverage
npm run telemetry:validate
```

#### Quality Gates
- Minimum telemetry coverage thresholds
- Performance regression detection
- Error rate monitoring

### Troubleshooting

#### Common Issues
1. **Missing Events**: Check telemetry configuration
2. **Throttling**: Adjust throttle rate for high-frequency testing
3. **Memory Issues**: Limit event buffer size for long-running tests

#### Debug Tools
```typescript
import { getStressTelemetryConfig, resetStressTelemetryThrottle } from '@/balancing/stressTesting/StressTelemetry';

// Check current configuration
console.log(getStressTelemetryConfig());

// Reset throttle state for testing
resetStressTelemetryThrottle();
```

---

## Phase 10.5: CLI Pipeline Integration

### Overview

The stress testing system now includes a comprehensive CLI orchestrator that automates the complete pipeline: Generator → Calculator → Exporter with metadata persistence and comprehensive logging.

### CLI Architecture

#### Pipeline Flow
```
CLI Entry Point → Load Config → Generate Archetypes → Run Analysis → Export Results → Store Metadata
```

#### Key Components
- **runStressPipeline.ts** - Main CLI orchestrator (400+ lines)
- **Commander.js** - CLI argument parsing and help
- **PersistenceService** - Run metadata storage
- **Telemetry Integration** - Automatic telemetry collection
- **Error Handling** - Graceful failure and cleanup

### CLI Commands

#### Main Command: `npm run stressTesting:run`
```bash
# Run complete pipeline with defaults
npm run stressTesting:run

# Custom iterations and seed
npm run stressTesting:run -- --iterations 5000 --seed 12345

# Export only mode (no generation/analysis)
npm run stressTesting:run -- --export-only

# Custom output directory
npm run stressTesting:run -- --output /custom/exports/path

# Disable telemetry for faster execution
npm run stressTesting:run -- --no-telemetry

# Silent mode (no console logging)
npm run stressTesting:run -- --no-logging
```

#### Command Options
- `--iterations <number>` - Simulations per archetype pair (default: 10000)
- `--seed <number>` - Random seed for deterministic results (default: timestamp)
- `--output <path>` - Output directory (default: `/data/exports/stressTesting`)
- `--export-only` - Only export existing telemetry data
- `--no-telemetry` - Disable telemetry collection
- `--no-logging` - Disable console logging
- `--config <path>` - Custom balancer config file

#### Additional Commands
```bash
# Show status of recent runs
node scripts/stressTesting/runStressPipeline.ts status

# Clean up old run data
node scripts/stressTesting/runStressPipeline.ts cleanup --days 7
```

### Pipeline Stages

#### 1. Configuration Loading
```typescript
// Load balancer config with fallback
const config = await loadBalancerConfig(configPath);
const configHash = calculateConfigHash(config);
```

#### 2. Archetype Generation
```typescript
// Generate baseline, single stat, and pair stat archetypes
const generator = new StressTestArchetypeGenerator(config, seed);
const archetypes = [
  generator.generateBaselineArchetype(),
  ...generator.generateSingleStatArchetypes(25),
  ...generator.generatePairStatArchetypes(25)
];
```

#### 3. Marginal Utility Analysis
```typescript
// Run complete analysis with progress tracking
const calculator = new MarginalUtilityCalculator({
  simulation: { simulationCount: iterations, seed },
  thresholds: { opThreshold: 1.15, weakThreshold: 0.95 }
});
const analysis = await calculator.runAnalysis(archetypes, baseline);
```

#### 4. Export and Persistence
```typescript
// Export results and telemetry
const exportPaths = await exportResults(analysis, config);
await saveRunMetadata(metadata);
```

### Metadata and Persistence

#### Run Metadata Structure
```typescript
interface RunMetadata {
  id: string;                    // Unique run identifier
  timestamp: string;             // ISO timestamp
  config: CLIConfig;            // CLI configuration used
  balancerConfigHash: string;   // Config hash for change detection
  duration: number;             // Total runtime in ms
  status: 'running' | 'completed' | 'failed';
  error?: string;               // Error message if failed
  results?: {                   // Results summary
    archetypesGenerated: number;
    simulationsRun: number;
    analysesCompleted: number;
    exportPaths: string[];
  };
}
```

#### Persistence Locations
```
/data/exports/stressTesting/
├── run-metadata-{runId}.json           # Run metadata
├── {analysisId}.json                   # Analysis results
├── {analysisId}.csv                    # CSV export
├── {analysisId}.md                     # Markdown report
└── telemetry-{analysisId}.json         # Telemetry data
```

### Error Handling and Recovery

#### Graceful Failure
- No `process.exit(0)` without proper cleanup
- Comprehensive error logging and metadata updates
- Partial result preservation on failure
- Clear error messages with stack traces

#### Fallback and Rollback
```typescript
// Config loading fallback
try {
  config = await BalancerConfigStore.loadFromFile(configPath);
} catch (error) {
  config = await BalancerConfigStore.load(); // Default fallback
}

// Telemetry export fallback
try {
  await exportTelemetry();
} catch (error) {
  console.warn('Telemetry export failed, continuing...');
}
```

### Performance Characteristics

#### Runtime Estimates
- **Small Dataset** (1000 iterations): ~30 seconds
- **Medium Dataset** (10000 iterations): ~5 minutes
- **Large Dataset** (50000 iterations): ~25 minutes

#### Memory Usage
- **Archetype Generation**: ~10MB for full stat set
- **Analysis Processing**: ~50MB peak during simulation
- **Export Generation**: ~20MB for JSON/CSV/Markdown

#### I/O Operations
- **Config Loading**: <100ms
- **Metadata Persistence**: <50ms
- **Export Writing**: <200ms per format

### Integration Examples

#### CI/CD Pipeline
```yaml
# GitHub Actions example
- name: Run Stress Testing Pipeline
  run: |
    npm run stressTesting:run -- --iterations 1000 --no-telemetry
  if: ${{ failure() }}
    echo "Stress testing failed"
    exit 1
```

#### Scheduled Analysis
```bash
# Daily stress testing with cron
0 2 * * * npm run stressTesting:run -- --seed $(date +%s) --output /daily/exports/$(date +%Y-%m-%d)
```

#### Development Workflow
```bash
# Quick development iteration
npm run stressTesting:run -- --iterations 100 --no-logging

# Full validation before commit
npm run stressTesting:run -- --iterations 10000
```

### Monitoring and Debugging

#### Progress Tracking
```bash
# Real-time progress output
[CLI] Progress: 25% (12/48)
[CLI] Progress: 50% (24/48)
[CLI] Progress: 75% (36/48)
[CLI] Progress: 100% (48/48)
```

#### Debug Mode
```bash
# Enable verbose logging
npm run stressTesting:run -- --logging

# Check recent run status
node scripts/stressTesting/runStressPipeline.ts status --limit 5
```

#### Performance Monitoring
```json
// Pipeline summary output
{
  "runId": "stress-pipeline-2026-01-11T15-48-00-000Z",
  "status": "completed",
  "duration": 284500,
  "results": {
    "archetypesGenerated": 91,
    "simulationsRun": 910000,
    "analysesCompleted": 1,
    "exportPaths": [
      "/data/exports/stressTesting/mu-analysis-12345-2026-01-11T15-48-00-000Z.json",
      "/data/exports/stressTesting/mu-analysis-12345-2026-01-11T15-48-00-000Z.csv",
      "/data/exports/stressTesting/mu-analysis-12345-2026-01-11T15-48-00-000Z.md",
      "/data/exports/stressTesting/telemetry-mu-analysis-12345-2026-01-11T15-48-00-000Z.json"
    ]
  },
  "timestamp": "2026-01-11T15:48:00.000Z"
}
```

### Troubleshooting

#### Common Issues
1. **Config Loading Failures**: Check config file permissions and format
2. **Memory Issues**: Reduce iterations or increase system memory
3. **Export Failures**: Check disk space and write permissions
4. **Telemetry Issues**: Disable telemetry with `--no-telemetry`

#### Debug Commands
```bash
# Check system resources
node scripts/stressTesting/runStressPipeline.ts status

# Clean up corrupted data
node scripts/stressTesting/runStressPipeline.ts cleanup --days 0

# Validate configuration
node scripts/stressTesting/runStressPipeline.ts --config /path/to/config.json --dry-run
```

---

## Phase 10.5: Implementation Evidence and Metrics Documentation

### 1. Implementation Evidence

- **Components**:
  - `src/balancing/stressTesting/StressTestArchetypeGenerator.ts` - Core archetype generator with deterministic seeding.
  - `src/balancing/stressTesting/RoundRobinRunner.ts` - Round-robin matchup engine.
  - `src/balancing/stressTesting/MarginalUtilityCalculator.ts` - Marginal utility and synergy analysis.
  - `src/ui/balancing/StressTestDashboard.tsx` - UI dashboard for visualization.
  - `src/balancing/hooks/useStressTesting.ts` - React hook for state management.

- **Tests**:
  - `src/balancing/stressTesting/__tests__/StressTestArchetypeGenerator.test.ts` - 18 test cases covering generation, filtering, determinism.
  - `src/balancing/hooks/__tests__/useStressTesting.test.ts` - Hook integration tests.
  - `tests/stress-test-dashboard.spec.ts` - Playwright UI tests for dashboard.

### 2. Metrics Documentation

- **Marginal Utility**: Measured as the percentage improvement in win rate over baseline per archetype. Formula: `marginalUtility = (averageScore - 0.5) * 100`. Thresholds: >1.5x for OP synergy, <0.95x for weak synergy (config-driven from `BALANCING_CONFIG.opSynergyThreshold`).

- **Synergy Thresholds**:
  - OP Synergy: synergyMultiplier > 1.15 (pair performance >15% better than expected).
  - Weak Synergy: synergyMultiplier < 0.95 (pair performance <5% worse than expected).
  - Balanced: 0.95-1.15 range.

### 3. Examples: Export Data and Visualizations

- **CSV Export Example**:
```
Archetype,Average Score,Marginal Utility,Synergy Multiplier
single_hp,0.62,12%,N/A
pair_hp_damage,0.68,18%,1.12
```

---

## Phase 10.5: QA Smoke Suite - Accessibility Testing

### 1. WCAG 2.1 AA Compliance Implementation

**Objective**: Ensure SynergyHeatmap and MarginalUtilityTable components meet WCAG 2.1 AA accessibility standards.

**Implementation Details**:

#### SynergyHeatmap Accessibility Enhancements
- **Screen Reader Support**: Added comprehensive ARIA labels, roles, and descriptions
- **Keyboard Navigation**: Full keyboard support with Enter/Space key activation
- **Focus Management**: Visible focus rings with amber-400 color for high contrast
- **Color Contrast**: Using WCAG-compliant color palette (emerald, amber, rose)
- **Semantic HTML**: Proper table structure with scope attributes and captions

```typescript
// Key accessibility features implemented
role="region" aria-label="Stat Synergy Heatmap"
role="table" aria-label="Stat synergy matrix" aria-describedby="synergy-heatmap-description"
scope="col" // All table headers
role="button" // Interactive cells
tabIndex={0} // Focusable elements
aria-label={getCellAriaLabel(statId1, statId2, synergy)} // Descriptive labels
```

#### MarginalUtilityTable Accessibility Enhancements
- **Interactive Rows**: Keyboard-navigable rows with proper button roles
- **Sorting Controls**: Accessible button groups with aria-pressed states
- **Status Announcements**: Live regions for dynamic content updates
- **Descriptive Labels**: Detailed ARIA labels for complex data relationships

### 2. Test Coverage

**Comprehensive RTL Test Suite**: `tests/unit/balancing/SynergyHeatmap.a11y.test.tsx`

**Test Categories**:
- ✅ ARIA labels and roles (12/12 passing)
- ✅ Keyboard navigation (Enter/Space support)
- ✅ Focus management (visible focus indicators)
- ✅ Screen reader announcements (aria-live regions)
- ✅ Color contrast compliance (WCAG AA palette)
- ✅ Mouse/keyboard parity (equal functionality)
- ✅ Edge cases (empty data, disabled states)

**Test Results**: 12/12 tests passing, 100% accessibility coverage

### 3. Accessibility Checklist

#### Visual Accessibility
- ✅ High contrast colors (4.5:1 minimum ratio)
- ✅ Focus indicators visible and consistent
- ✅ Text readable at all zoom levels
- ✅ Color not sole information carrier

#### Keyboard Accessibility
- ✅ Tab order logical and predictable
- ✅ All interactive elements keyboard accessible
- ✅ Enter/Space key support for actions
- ✅ No keyboard traps

#### Screen Reader Accessibility
- ✅ Semantic HTML structure
- ✅ Descriptive ARIA labels
- ✅ Table headers properly scoped
- ✅ Dynamic content announced via aria-live

#### Cognitive Accessibility
- ✅ Clear and consistent navigation
- ✅ Predictable interaction patterns
- ✅ Error prevention and recovery
- ✅ Help text and instructions available

### 4. Configuration-First Accessibility

**Theme Integration**: All accessibility features read from Phase 10.5 configuration:
- Color palette from Gilded Observatory theme tokens
- Focus ring colors configurable via theme system
- Animation timing respects user preferences
- High contrast mode support built-in

**Runtime Configuration**:
```typescript
// Accessibility settings from config
const a11yConfig = {
  focusRingColor: 'rgb(251, 191, 36)', // amber-400
  focusRingWidth: '2px',
  enableAnimations: true,
  highContrastMode: false
};
```

### 5. Testing Tools and Validation

**Automated Testing**: Vitest RTL suite with jest-axe matcher
**Manual Testing**: Screen reader testing with VoiceOver/NVDA
**Color Contrast**: WebAIM contrast checker validation
**Keyboard Testing**: Tab navigation and interaction verification

### 6. Documentation and Maintenance

**Developer Guidelines**:
- All new components must include accessibility tests
- ARIA attributes documented in component JSDoc
- Keyboard interactions specified in component docs
- Color contrast validated before deployment

**Ongoing Monitoring**:
- Accessibility tests run in CI/CD pipeline
- Annual WCAG compliance audit
- User feedback collection for accessibility improvements
- Regular screen reader testing updates

---

- **JSON Export Example**:
```json
{
  "marginalUtilities": [
    {"archetype": "single_hp", "averageScore": 0.62, "marginalUtility": 0.12}
  ],
  "synergies": [
    {"pairArchetype": "pair_hp_damage", "synergyMultiplier": 1.12, "isOpSynergy": false}
  ]
}
```

- **Visualizations**:
  - Marginal Utility Table: Ranked list with color-coded assessments (green for strong, red for OP).
  - Synergy Heatmap: NxN matrix showing synergy multipliers, with tooltips for pair details.
  - Stat Profile Radar: Comparative radar charts for selected archetypes.

### 4. Next Steps After Phase 10.5 (Phase 11?)

- **Phase 11: Auto-Balancing Integration**: Implement StatWeightAdvisor and AutoStatBalancer for automatic weight adjustments based on stress test results.
- **Phase 12: Multi-Tier Aggregation**: Aggregate results across multiple budget tiers for robust efficiency estimates.
- **Phase 13: Historical Comparison**: Add run history store for tracking balance evolution over time.
- **Phase 14: Point Valuation Pipeline**: Develop stat point costs from sensitivity analysis.
- **Future Roadmap**: Integrate with full game entities for automated nerf/buff loops.
