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


## 📊 Comprehensive Combat Testing & Balancing Plan

### 🎯 Goals
- Validare matematicamente (motore deterministico) ed empiricamente (Monte Carlo) tutte le meccaniche.
- Integrare i moduli di combattimento/balancing mantenendo l’output in turni equivalenti.
- Generare metriche robuste per designers e AI tooling (confidence intervals, pivot frequency, ecc.).
- Consentire simulazioni avanzate (Markov, sensitivity analysis) per scenari complessi.

### 🧩 Moduli / Fasi (ordine consigliato)
1. **Core Combat & Deterministic Math Engine**
   - Output: TTK/TTD, EDPT, expected win rate 50/50 baseline, EarlyImpact (es. 3 turni).
   - Test: conservation of damage, confronto deterministico vs Monte Carlo ridotto.
2. **Monte Carlo Simulator & Statistical Metrics**
   - Output: distribuzioni TTK/TTD, win rate empirico, varianza, CI 95%.
   - QA: determinazione sample size, sanity check su mean/variance, varianza ridotta tramite tecniche di variance reduction se necessario.
3. **Spell Effect Modeling & Expected Value Metrics**
   - Output: `deltaTTK/TTD` per spell, frontload vs sustain, efficienza mana/cd.
   - Metriche: confronto spell vs baseline attack, ratio beneficio/costo.
4. **Status / CC Metrics Module**
   - Status: stun, silence, freeze, slow, vulnerable, exposed, ecc.
   - Output: `deltaTTK/TTD`, frequenza di applicazione, pivot frequency, plan invalidation rate (quante volte un CC invalida la build prevista).
   - Dipendenza: Monte Carlo per misurare occorrenze stocastiche.
5. **Markovian State Modeling (Advanced)**
   - Stati chiave (alive, stunned, recovering, lowHP, dead).
   - Output: probabilità di essere in vantaggio al turno n, chance di recupero da debuff, swing probability.
   - Motivo: offre distribuzioni di outcome più ricche rispetto a medie semplici.
6. **Weapon & Armor Integration**
   - Armi: scaling danno, crit pattern, weapon spells → `deltaTTK`.
   - Armature: DR, dodge, crit/status resist → `deltaTTD`.
   - Test: simulazioni di loadout varianti vs baseline, calibrazione resist/pen per target TTK.

### 📈 Metriche Essenziali
| Metric | Purpose |
| --- | --- |
| TTK/TTD median & mean | Baseline durata/sopravvivenza |
| Win rate & CI | Bilanciamento 50/50 |
| Variance & Std Dev | Consistenza risultati |
| Overkill rate | Spreco di danno |
| Pivot frequency | Frequenza di cambi di stato drastici |
| Plan invalidation | Quante build vengono invalidate da CC/status |

### 🧪 Workflow di Test
1. **Before module activation**: run baseline deterministico (TTK/TTD).
2. **After module activation**:
   - Eseguire calcoli deterministici aggiornati.
   - Lanciare Monte Carlo (≥10k iterazioni).
   - Confrontare distribuzioni vs deterministico.
   - Validare CI/varianza e stressare edge case.

### 🤖 Automation & CI
- Test automatizzati per ogni modulo (unit + integration).
- Threshold metrici (es. varianza massima) come gate.
- Regression suite su combinazioni di spell/equip (cards config-first).
- Evidence logs (TTK, win rate trend) allegati a safeguard run.

### 🧠 Rigor Scientifico
- **Monte Carlo**: per sistemi complessi con interazioni non lineari.
- **Sensitivity Analysis**: valutare l’impatto di ogni stat su TTK/TTD.
- **Distribution Over Time**: analizzare curve, code, momenti oltre alle medie.
- **Markov Chains**: stimare transizioni di stato e swing probability (anche con modelli approssimati).

### 🔄 Conclusione Operativa
- Modularità assoluta: ogni modulo produce `deltaTTK/TTD`.
- Unità comune: turni/HP equivalenti per confrontare danno, healing, CC, ecc.
- Config-first: `StatConfig.module` definisce l’ownership; editor UI usa weight/step dal config.
- Somma finale: `TTK_total` / `TTD_total` aggregano i delta e alimentano CombatPredictor, Monte Carlo, Spell/Weapon/Armor creator.

> **Integration:** questo piano si collega al MASTER PLAN Balancing Phase 10/12 e funge da checklist per QA e R&D. Va referenziato nei coordinator docs (agent_assignments) quando vengono aperti task su moduli/combat testing.

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

## 🧱 Dummy Player & Baseline Plan

### 🎯 Obiettivo
Definire un personaggio di riferimento (Dummy Player) con stats neutre per validare formule (TTK/TTD, scaling spell/armi/armature) prima di usare build reali o scenari Monte Carlo. Garantisce coerenza tra Balancer, Spell Creator e CombatEngine.

### 1️⃣ Stat e Setup del Dummy
| Categoria | Valore / Setup | Note |
| --- | --- | --- |
| Livello | uguale al PG testato | baseline neutra |
| HP | 100 | facile da leggere in % |
| Stat principali | 0 punti extra (Forza, Agilità, Int, …) | niente bonus nascosti |
| Arma | Attacco base | nessun bonus crit / scaling minimo |
| Armor | Armor/DR baseline | nessun armor pen o bonus |
| Spell | Solo attacco base (AoE=1, DoT/HoT=0) | tutte le altre stats a 0 |
| Status | Nessuno | stun/slow/buff disabilitati di default |

> Usare valori estremi per arma o armor costituirebbe un “cheat” e renderebbe i test inutili.

### 2️⃣ Moduli che devono supportare il Dummy
- Damage / Attack Module
- Spell Module (AoE, DoT/HoT, heal flat, lifesteal)
- Mitigation / Armor / DR Module
- Status Module (stun, freeze, condizionali)
- Sustain Module (regen, lifesteal, heal flat)
- Balancer aggregators (conversione stats → turn-equivalent)

### 3️⃣ Workflow suggerito
1. Istanziate dummy + baseline weapon/armor/spell.
2. Test 1v1:
   - TTK: PG reale vs Dummy
   - TTD: Dummy vs PG reale
3. Verificare TTK ≈ TTD (~50% win rate) e assenza di outlier.
4. Ajustare scale/costi/pesi in base ai risultati.
5. Solo dopo la validazione dummy → Monte Carlo / scenari complessi.

### 4️⃣ Collegamento con Spell Creator
- Ogni tick dello Spell Creator mappa a una variabile del balancer.
- Costi speciali (dual, modal, trigger) derivano dai pesi formula-based.
- AoE, DoT/HoT, lifesteal/heal flat calcolati rispetto al dummy → preview TTK/TTD coerenti.

### 5️⃣ Weapon & Armor Baseline
- Weapon: definisce accesso alle spell base (attacco base, affondo), crit chance, scaling damage.
- Armor: DR/armor/dodge baseline; varianti derivate dal contributo vs Dummy.

### 6️⃣ Benefici
- Standardizza i test e elimina variabilità da build casuali.
- Isola formule per debug rapido.
- Facilita tuning degli slider del Creator su valori concreti.
- Fornisce baseline per boss, multi-target, swarm.

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
