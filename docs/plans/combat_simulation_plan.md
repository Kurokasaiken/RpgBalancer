# Combat Simulation Testing System - Implementation Plan

**Status:** Planning  
**Priority:** High  
**Type:** Core Testing Infrastructure

> **🚨 CRITICAL: ZERO HARDCODING RULE**
> 
> ALL baseline stats, formulas, and configurations MUST be imported from existing modules:
> - Baseline Stats: `BASELINE_STATS` from `src/balancing/baseline.ts`
> - Default Stats: `DEFAULT_STATS` from `src/balancing/types.ts`
> - Combat Formulas: `src/balancing/modules/*`
> - Stat Weights: `src/balancing/statWeights.ts`
> 
> **NEVER define stats manually in examples or code.**
> This is the **SINGLE SOURCE OF TRUTH** principle.

---

## 🎯 Obiettivo

Creare un sistema di **Monte Carlo simulation** per testare il balancing delle stat in combattimento 1v1. Il sistema deve:

1. **Simulare 10,000 combattimenti** a turni tra due entità
2. **Estrarre metriche significative** per valutare il bilanciamento
3. **Usare HP come "moneta"** per valutare il valore relativo delle stat (1 damage = 4 HP)
4. **Essere facilmente manutenibile** e modificabile

---

## 📊 Ricerca: Best Practices Identificate

### **Monte Carlo Simulation Principles**

**Vantaggi:**
- Law of Large Numbers: più simulazioni = risultati più accurati
- Identifica outliers e edge cases
- Quantifica uncertainty tramite confidence intervals

**Standard Industry:**
- 1,000-10,000 simulazioni per analisi robusta
- 95% confidence interval come metrica standard
- Automated testing bots per gameplay ripetitivo

### **Metriche Critiche per Balancing**

1. **Win Rate** + Confidence Interval
   ```
   Win Rate = Wins / Total Simulations
   95% CI = p̂ ± 1.96 × √(p̂(1-p̂)/n)
   ```

2. **Time to Kill (TTK)** - Quanti turni per uccidere l'avversario
3. **Damage Per Turn (DPT)** - Normalizzato per confronti
4. **HP Remaining** - Margin of victory
5. **Overkill Damage** - Damage sprecato dopo morte
6. **Combat Length Distribution** - Min/Max/Mean/Median turns
7. **Resource Efficiency** - Damage dealt vs HP lost ratio

### **Stat Value Equivalency**

Conversione HP-Damage per valutare stat value:
- **Baseline:** 1 damage = 4 HP
- Permette di calcolare "HP value" di ogni stat
- Es: +10% damage = equivalent to +40 HP in value

---

## 🏗️ Architettura Sistema

### **1. Combat Simulator Engine**

**File:** `src/balancing/simulation/CombatSimulator.ts`

```typescript
interface CombatConfig {
  entity1: EntityStats;
  entity2: EntityStats;
  turnLimit: number; // Max turns prima di draw (es. 100)
}

interface CombatResult {
  winner: 'entity1' | 'entity2' | 'draw';
  turns: number;
  damageDealt: {
    entity1: number;
    entity2: number;
  };
  hpRemaining: {
    entity1: number;
    entity2: number;
  };
  overkill: {
    entity1: number;
    entity2: number;
  };
  turnByTurnLog?: TurnData[]; // Optional detailed log
}
```

**Logica:**
- Iniziativa alternata (turn-based deterministic)
- Usa formule esistenti da `balancing/` (single source of truth)
- Simula combattimento completo fino a morte/draw
- Estrae tutte le metriche richieste

---

### **2. Monte Carlo Batch Runner**

**File:** `src/balancing/simulation/MonteCarloSimulation.ts`

```typescript
interface SimulationConfig {
  config: CombatConfig;
  iterations: number; // Default: 10,000
  logSampleSize?: number; // Salva solo N combat logs completi
}

interface SimulationResults {
  summary: {
    totalSimulations: number;
    winRates: {
      entity1: number;
      entity2: number;
      draws: number;
    };
    confidenceIntervals: {
      entity1: [number, number]; // 95% CI
      entity2: [number, number];
    };
  };
  
  combat Statistics: {
    averageTurns: number;
    medianTurns: number;
    minTurns: number;
    maxTurns: number;
    turnDistribution: number[]; // Histogram data
  };
  
  damageMetrics: {
    entity1: DPTStats;
    entity2: DPTStats;
    averageOverkill: {
      entity1: number;
      entity2: number;
    };
  };
  
  hpEfficiency: {
    entity1: number; // Damage dealt / HP lost ratio
    entity2: number;
  };
  
  statValueAnalysis?: {
    hpEquivalency: Record<string, number>; // Per stat adjustment
  };
  
  sampleCombats: CombatResult[]; // N combattimenti di esempio
}
```

**Algoritmo:**
1. Run N iterations del combat simulator
2. Aggregate results
3. Calculate statistical metrics (mean, median, std dev, CI)
4. Generate histograms/distributions
5. Identify outliers (combats > 3 std dev from mean)

---

### **3. Stat Value Calculator**

**File:** `src/balancing/simulation/StatValueAnalyzer.ts`

**Purpose:** Convertire stat changes in HP equivalency

```typescript
interface StatValueComparison {
  baseline: EntityStats;
  modified: EntityStats; // Una stat cambiata
  hpDifference: number; // Differenza in HP "value"
  hpPerStatPoint: number; // HP value per punto stat
}
```

**Metodologia:**
1. Run 10k simulations con baseline stats
2. Modifica UNA stat alla volta (+10 points)
3. Run 10k simulations con modified stats
4. Compare win rates & HP outcomes
5. Calculate: `HP Value = (Win Rate Δ × Average HP) / Stat Δ`

**Output:**
- Tabella: Stat Name | HP Value per Point | Confidence
- Identifica stat over/underpowered
- Suggerisce weight adjustments

---

### **4. Testing UI Dashboard**

**File:** `src/ui/testing/CombatSimulationDashboard.tsx`

**Features:**
- Input per configurare le due entità
- Slider per numero iterazioni (100 - 50,000)
- "Run Simulation" button
- Real-time progress bar
- Results visualizations:
  - Win rate pie chart
  - Turn distribution histogram
  - DPT comparison bar chart
  - HP efficiency scatter plot
  - Stat value equivalency table

**Export Options:**
- Download results as JSON
- Export CSV per analysis esterna
- Generate PDF report

---

## 🔧 Implementation Details

### **Phase 1: Core Engine**

**Priority:** HIGHEST

1. **CombatSimulator.ts**
   - Implement turn-based combat loop
   - Inherit damage/defense formulas from existing `balancing/`
   - Add optional detailed logging
   - Unit tests (100% coverage)

2. **MonteCarloSimulation.ts**
   - Batch runner with progress callback
   - Statistical calculations (mean, median, CI)
   - Histogram generation
   - Performance optimization (target: 10k sims in <5 seconds)

**Dependencies:**
- Existing: `balancing/spellBalancingConfig.ts`
- Existing: `balancing/characterStats.ts`
- New: Statistical library (consider `simple-statistics` npm package)

---

### **Phase 2: Analysis Tools**

**Priority:** HIGH

1. **StatValueAnalyzer.ts**
   - Automated stat variation testing
   - HP equivalency calculations
   - Balance recommendations generator

2. **ResultsExporter.ts**
   - JSON export
   - CSV export
   - PDF report generation (using `jsPDF`)

---

### **Phase 3: UI Dashboard**

**Priority:** MEDIUM

1. **CombatSimulationDashboard.tsx**
   - Entity configuration inputs
   - Simulation controls
   - Results visualization (using `recharts` or `chart.js`)
   - Export controls

2. **Integration with existing UI**
   - Add "Simulation" tab to main navigation
   - Link to MASTER_PLAN Phase 2

---

### **Phase 4: Advanced Features**

**Priority:** LOW (Future)

1. **Comparison Mode**
   - Side-by-side stat adjustments
   - A/B testing interface

2. **Archetype Pre-sets**
   - Pre-configured entities (Tank, DPS, etc.)
   - Quick testing buttons

3. **Historical Tracking**
   - Save simulation results over time
   - Track balance changes impact

---

## 📐 Formule e Calcoli

### **Confidence Interval (95%)**

```typescript
function calculate95CI(winRate: number, n: number): [number, number] {
  const z = 1.96; // 95% confidence
  const standardError = Math.sqrt((winRate * (1 - winRate)) / n);
  const marginOfError = z * standardError;
  
  return [
    Math.max(0, winRate - marginOfError),
    Math.min(1, winRate + marginOfError)
  ];
}
```

### **HP Equivalency**

```typescript
function calculateHPEquivalency(
  baselineWinRate: number,
  modifiedWinRate: number,
  averageHPMargin: number,
  statDelta: number
): number {
  const winRateDelta = modifiedWinRate - baselineWinRate;
  const hpImpact = winRateDelta * averageHPMargin;
  return hpImpact / statDelta; // HP value per stat point
}
```

### **Damage Per Turn (DPT)**

```typescript
function calculateDPT(totalDamage: number, turns: number): number {
  return totalDamage / turns;
}
```

---

## ✅ Metriche di Success

**Performance:**
- [ ] 10,000 simulazioni in <5 secondi
- [ ] 50,000 simulazioni in <20 secondi

**Accuracy:**
- [ ] Confidence interval width <5% per 10k simulations
- [ ] Formula inheritance 100% (no hardcoding)

**Usability:**
- [ ] UI intuitiva per configurazione entità
- [ ] Visualizzazioni chiare e informative
- [ ] Export funzionante per tutti i formati

**Maintainability:**
- [ ] Codebase modulare e ben documentato
- [ ] Facile aggiungere nuove metriche
- [ ] Facile modificare formule (ereditate da balancing/)

---

## 🧪 Testing Strategy

1. **Unit Tests** (CombatSimulator)
   - Test con damage noto → verify HP loss
   - Test turn limit edge case
   - Test draw conditions

2. **Integration Tests** (MonteCarloSimulation)
   - Verify 100 sims == 10k sims trends (within CI)
   - Verify stat value equivalency calculations

3. **Manual Validation**
   - Known balanced matchup → should be ~50% win rate
   - Extreme stat mismatch → verify expected win rate

---

## 📁 File Structure

```
src/balancing/simulation/
├── CombatSimulator.ts          # Core turn-based engine
├── MonteCarloSimulation.ts     # Batch runner + statistics
├── StatValueAnalyzer.ts        # HP equivalency calculator
├── ResultsExporter.ts          # JSON/CSV/PDF export
├── types.ts                    # Shared interfaces
└── __tests__/
    ├── CombatSimulator.test.ts
    ├── MonteCarloSimulation.test.ts
    └── StatValueAnalyzer.test.ts

src/ui/testing/
├── CombatSimulationDashboard.tsx
├── components/
│   ├── EntityConfigurator.tsx
│   ├── SimulationControls.tsx
│   ├── ResultsVisualizations.tsx
│   └── ExportPanel.tsx
└── hooks/
    └── useSimulation.ts
```

---

## 🎯 Next Steps (Immediate)

1. Create task checklist in `combat_simulation_tasks.md`
2. Setup npm dependencies (`simple-statistics`, `recharts`)
3. Implement `CombatSimulator.ts` (Phase 1.1)
4. Write unit tests for combat engine
5. Implement `MonteCarloSimulation.ts` (Phase 1.2)

---

## 🔗 References

- **MASTER_PLAN:** Phase 2 - Archetype Balancing
- **Existing Code:** `src/balancing/spellBalancingConfig.ts`
- **Research:** Monte Carlo game balancing best practices
- **Statistical Methods:** Confidence intervals for proportions
