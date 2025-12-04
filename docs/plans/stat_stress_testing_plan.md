# Stat Stress Testing & Efficiency Analysis Plan

**Date:** 2025-12-04 (Updated)  
**Purpose:** Round-Robin stat efficiency testing via Monte Carlo simulation  
**Status:** Implementation In Progress

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

## 📋 PHASE 1: Archetype Generation Engine

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

## 📊 PHASE 2: Round-Robin Simulation Engine

### 2.1 Round-Robin Runner

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

## 🎨 PHASE 3: Presentation Layer

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

### 3.3 Efficiency Radar Chart

Visual representation of stat balance.

```typescript
// File: src/ui/testing/EfficiencyRadar.tsx

interface EfficiencyRadarProps {
  efficiencies: StatEfficiency[];
}

// SVG radar showing efficiency per stat
// Balanced = circular shape
// Imbalanced = spiky shape
```

---

## 🔄 PHASE 4: Integration

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

---

## 📈 PHASE 5: Dashboard Page

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

## ✅ SUCCESS CRITERIA

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

### Step 2: Round-Robin Runner (TODO)
- For each pair (statA, statB): run Monte Carlo
- Collect NxN matchup results
- Calculate per-stat efficiency

### Step 3: UI Components (TODO)
- StatEfficiencyTable: ranked list with assessment
- MatchupHeatmap: NxN win rate matrix
- EfficiencyRadar: visual balance indicator

### Step 4: Integration (TODO)
- Connect to live BalancerConfig
- Tier selector
- Iteration count selector
- Progress indicator for long runs

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
