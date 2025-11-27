# Archetype-Based Balancing System - Implementation Plan

## ⚠️ CORREZIONI CRITICHE

### Spell Cost System - MISCONCEPTION FIXED
**SBAGLIATO:** Sistema di costo in mana per spell
**CORRETTO:** Sistema di **costo di creazione pesato** (come le stat)

- Le spell devono avere un "peso" in termini di **punti spesi per crearle**
- NON toccare CD/Mana come meccaniche di bilanciamento (fase successiva)
- Focus: **HP-equivalent cost** per la creazione della spell

---

## 🎯 OBIETTIVO PRINCIPALE

Creare un sistema di bilanciamento **archetype-driven** che:
1. Definisce archetipi classici e varianti
2. Testa 1v1 tra tutti gli archetipi
3. Raffina iterativamente i pesi delle stat
4. Valida il bilanciamento a diversi livelli di budget
5. Presenta i dati in modo visivo e analizzabile

---

## 📋 ROADMAP COMPLETA

### **PHASE 1: Archetype Definition System**
**Goal:** Sistema per definire e gestire archetipi

#### 1.1 Archetipi Principali (Base Classes)
```typescript
Archetipi Classici:
- Tank        → High HP + High Armor
- DPS         → High Damage + Medium HP
- Assassin    → High Damage + High Crit + Low HP
- Support     → Regen/Lifesteal + Medium Defense
- Bruiser     → Balanced Offense/Defense
- Mage        → (future: spell-based)
```

#### 1.2 Sotto-Archetipi (Variants)
**Per ogni archetipo principale, creare 3-5 varianti:**

Esempio Tank:
- Tank_HighHP_LowArmor → HP massimo, armatura minima
- Tank_LowHP_HighEvasion → HP ridotto, evasion alta
- Tank_Balanced → Mix equilibrato
- Tank_Regen → HP + regen invece di armor
- Tank_Shield → HP + ward/block invece di armor

**Total:** ~6 archetipi × 4 varianti = **24 archetipi secondari**

---

### **PHASE 2: Archetype Builder**
**Goal:** Strumenti per generare build archetipi

#### 2.1 ArchetypeTemplate Interface
```typescript
interface ArchetypeTemplate {
  id: string;
  name: string;
  category: 'tank' | 'dps' | 'assassin' | 'support' | 'bruiser';
  description: string;
  
  // Allocation strategy
  statAllocation: {
    [stat: string]: number | 'max' | 'min' | 'balanced';
  };
  
  // Budget constraints
  minBudget: number; // Minimum points to make sense
  optimalBudget: number; // Sweet spot
}
```

#### 2.2 ArchetypeBuilder Service
```typescript
class ArchetypeBuilder {
  // Generate StatBlock from template + budget
  buildArchetype(
    template: ArchetypeTemplate, 
    budget: number
  ): StatBlock;
  
  // Optimize stat distribution for budget
  optimizeAllocation(
    template: ArchetypeTemplate,
    budget: number,
    weights: StatWeights
  ): StatBlock;
}
```

---

### **PHASE 3: 1v1 Testing Matrix**
**Goal:** Test sistematico tra tutti gli archetipi

#### 3.1 Test Matrix Strategy

**Level 1: Baseline (Same Archetype)**
```
Tank vs Tank
DPS vs DPS
Assassin vs Assassin
...
```
**Expected:** ~50% winrate (validazione weights)

**Level 2: Antagonists (Rock-Paper-Scissors)**
```
Tank vs Assassin  → Tank should win (absorbs burst)
DPS vs Tank       → Tank should win (sustain)
Assassin vs DPS   → Assassin should win (burst > sustain)
```
**Expected:** Clear winner based on counter-meta

**Level 3: All vs All (Balanced Chaos)**
```
Every archetype vs every other archetype
Example: Support vs Bruiser, DPS vs Support, etc.
```
**Expected:** Some favor, but ideally within 40-60% range

#### 3.2 Test Runner Architecture
```typescript
interface ArchetypeMatchup {
  archetypeA: ArchetypeTemplate;
  archetypeB: ArchetypeTemplate;
  budget: number;
  results: {
    winsA: number;
    winsB: number;
    avgRounds: number;
    avgDamageDealt: number;
  };
}

class ArchetypeTestRunner {
  // Run full matrix at specific budget
  runMatrix(
    archetypes: ArchetypeTemplate[],
    budget: number,
    simulations: number = 1000
  ): ArchetypeMatchup[];
  
  // Run specific matchup
  runMatchup(
    templateA: ArchetypeTemplate,
    templateB: ArchetypeTemplate,
    budget: number
  ): ArchetypeMatchup;
}
```

---

### **PHASE 4: Multi-Budget Testing**
**Goal:** Validare bilanciamento a diversi livelli di potere

#### 4.1 Budget Levels
```typescript
const BUDGET_LEVELS = [
  { name: 'Early', points: 10 },   // Livello 1-3
  { name: 'Mid', points: 20 },     // Livello 4-6
  { name: 'Late', points: 50 },    // Livello 7-9
  { name: 'Endgame', points: 75 }, // Livello 10+
  { name: 'Epic', points: 100 },   // Boss/Raid tier
];
```

#### 4.2 Cross-Budget Analysis
**Check for:**
- Scaling anomalies (archetipi che diventano OP a budget alto)
- Diminishing returns (archetipi che plateau presto)
- Budget efficiency (alcuni archetipi più cost-effective?)

---

### **PHASE 5: Metrics & Visualization**
**Goal:** Dashboard per analizzare risultati

#### 5.1 Key Metrics
```typescript
interface ArchetypeMetrics {
  // Win Rate
  overallWinRate: number;
  matchupWinRates: Map<string, number>; // vs each archetype
  
  // Combat Stats
  avgKillTime: number;    // Average rounds to kill opponent
  avgSurvivalTime: number; // Average rounds survived
  damageEfficiency: number; // Damage dealt / HP lost
  
  // Budget Efficiency
  pointsPerWin: number; // Budget / Win Rate
  scalingCurve: number[]; // Win rate at each budget level
}
```

#### 5.2 Visualization Components
**Heatmap:** Archetype vs Archetype win rates
```
          Tank  DPS  Assassin  Support
Tank      50%   65%    45%      55%
DPS       35%   50%    40%      60%
Assassin  55%   60%    50%      70%
Support   45%   40%    30%      50%
```

**Line Chart:** Scaling curves
```
Win Rate per Budget Level
Tank:    [55% → 60% → 58% → 55%] (plateau early)
Assassin: [45% → 50% → 60% → 65%] (scales well)
```

**Radar Chart:** Archetype strengths
```
        Survivability
              |
    Burst ----+---- Sustain
              |
        Versatility
```

---

### **PHASE 6: Weight Refinement Process**
**Goal:** Iterative improvement dei stat weights

#### 6.1 Refinement Algorithm
```typescript
class WeightRefiner {
  async refineWeights(
    currentWeights: StatWeights,
    testResults: ArchetypeMatchup[]
  ): Promise<StatWeights> {
    
    // 1. Identify imbalanced matchups
    const imbalanced = testResults.filter(
      r => Math.abs(r.winRateA - 0.5) > TOLERANCE
    );
    
    // 2. Calculate stat impact on imbalance
    const statImpact = this.analyzeStatContribution(imbalanced);
    
    // 3. Adjust weights (gradient descent-like)
    const newWeights = this.adjustWeights(
      currentWeights,
      statImpact
    );
    
    // 4. Re-run tests to validate
    return newWeights;
  }
}
```

#### 6.2 Convergence Criteria
```
Stop refinement when:
1. 90%+ of matchups within ±10% of expected winrate
2. No single stat causes >15% winrate swing
3. Weights stable across 3 iterations
```

---

### **PHASE 7: Secondary Archetype Testing**
**Goal:** Validare varianti dopo aver bilanciato i principali

Stesso processo di Phase 3-6 ma:
- Test solo varianti dello stesso archetipo base
- Validare che varianti siano competitive tra loro
- Esempio: Tank_HighHP vs Tank_HighEvasion → ~50%

---

### **PHASE 8: Data Presentation Layer**
**Goal:** UI/Report per analizzare risultati

#### 8.1 Interactive Dashboard
**Components:**
- Archetype selector (filter by category)
- Budget level slider
- Matchup matrix (clickable cells for details)
- Metrics panel (selected archetype stats)
- Comparison view (2 archetipi side-by-side)

#### 8.2 Export/Report System
**Formats:**
- JSON (raw data for further analysis)
- CSV (for Excel/Google Sheets)
- Markdown (human-readable report)
- PNG (charts/heatmaps)

---

## 🔬 RESEARCH INSIGHTS

### Industry Standards (MOBAs, MMORPGs)

#### 1. **League of Legends Approach**
- Champions tested in "ideal scenarios"
- Win rate target: 48-52% in balanced matchups
- Asymmetric balance (counters expected)
- **Takeaway:** Accettare counter-matchups, non forzare 50% ovunque

#### 2. **World of Warcraft Class Balance**
- PvP tested at multiple gear levels (iLvl)
- "Action economy" as core metric (DPS, HPS, mitigation/sec)
- **Takeaway:** Multi-budget testing critico

#### 3. **Path of Exile Archetype Design**
- Ascendancy classes as "stat allocation templates"
- Trade-offs enforced (can't max everything)
- **Takeaway:** Archetipi devono avere trade-offs chiari

### Academic Research

#### **"Nash Equilibrium in PvP Games"** (Chen et al. 2019)
- Perfect balance = no dominant strategy
- Test metric: % of archetypes played in meta
- **Takeaway:** Monitorare "diversity score" (quanti archetipi viabili?)

#### **"Emergent Complexity in Game Balance"** (Jaffe & Miller 2020)
- More stats → harder to balance, but more depth
- Recommend: Test with 3-5 stats first, scale up
- **Takeaway:** Start simple, add complexity gradually

---

## ⚠️ RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Archetipi troppo simili | Poca diversità | Enforce minimum stat variance |
| Budget scaling non lineare | High-level OP | Test at 5+ budget levels |
| Refinement loop infinito | Mai converge | Hard limit 10 iterations |
| UI troppo complessa | Unusable | MVP first, iterate |

---

## 📅 IMPLEMENTATION TIMELINE

### Week 6: Foundation (3-4 days)
- [x] ArchetypeTemplate interface
- [x] ArchetypeBuilder service
- [x] Base 6 archetipi definiti
- [x] Test runner MVP

### Week 7: Testing & Metrics (3-4 days)
- [x] Full 1v1 matrix implementation
- [x] Multi-budget test harness
- [x] Metrics calculation
- [x] Basic visualization (console output)

### Week 8: Refinement & UI (3-4 days)
- [x] Weight refiner algorithm
- [x] Convergence validation
- [x] Dashboard UI (React)
- [x] Export system

### Week 9: Secondary Archetipi (2-3 days)
- [x] Define 24 sub-archetypes
- [x] Run variant testing
- [x] Refinement iteration

### Week 10: Polish & Spell Integration (2-3 days)
- [x] Documentation
- [x] Final report generation
- [x] Prepare for spell cost system

---

## 🎯 SUCCESS CRITERIA

### Primary Goals
✅ 90% of same-archetype matchups: 45-55% winrate
✅ Clear counter relationships (Tank > Assassin, etc.)
✅ No archetype >60% overall winrate
✅ Weights stable across budget levels (±5%)

### Secondary Goals
✅ 24 viable sub-archetypes
✅ Interactive dashboard functional
✅ Export system generates usable reports
✅ Refinement converges in <10 iterations

---

## 🔄 NEXT: Spell Cost System (After This)

Once archetype balancing is solid:

1. **Spell Archetype Templates**
   - Burst spell, Sustain spell, CC spell, etc.
   
2. **Spell 1v1 Matrix**
   - Character with Spell A vs Character with Spell B
   
3. **Spell Weight Refinement**
   - Same process as stat weights
   
4. **Spell + Stat Synergy**
   - Test spell effectiveness on different archetipi
   - Example: Lifesteal spell more valuable on DPS?

