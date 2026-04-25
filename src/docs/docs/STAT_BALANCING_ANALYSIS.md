# Project-Specific Stat Balancing Analysis
**RPG Balancer - Combat Simulation & Weight Calibration Strategy**

**Date:** 2025-11-28  
**Purpose:** Targeted analysis of stat balancing methodology for THIS project's specific architecture and philosophy

> **🚨 CRITICAL RULE: ZERO HARDCODING**
> 
> All baseline stats, formulas, and configurations MUST be imported from existing modules.
> **NEVER define stats manually** - always use:
> - `BASELINE_STATS` from `src/balancing/baseline.ts`
> - `DEFAULT_STATS` from `src/balancing/types.ts`
> - Formulas from `src/balancing/modules/*`
> 
> This is the **SINGLE SOURCE OF TRUTH** principle.

---

## 🎯 Project Context & Philosophy

### Core System: Weight-Based Creator Pattern

**Formula:**
```
Balance = Σ(selected_weights) - Target_Budget
```

**Key Principle:** HP as Universal Currency
- All stats measured in "HP equivalency"
- Baseline: **1 Damage = 4 HP** (current empirical ratio from simulations)
- Weight = "How many HP is this stat worth?"

### Current Stat System

**From `statWeights.ts` Analysis:**

| Stat | Weight (HP per point) | Confidence | Linearity | Notes |
|------|----------------------|------------|-----------|-------|
| `hp` | 1.0 | 1.00 | Perfect | Reference stat |
| `damage` | 5.0 | 0.98 | 0.99 | Very linear, auto-calibrated |
| `armor` | 5.0 | 0.95 | 0.82 | **Non-linear (PoE formula)** |
| `resistance` | 5.0 | 0.90 | 0.88 | % based, strong |
| `txc` (accuracy) | 2.0 | 0.92 | 0.95 | Hit chance modifier |
| `evasion` | 4.0 | 0.92 | 0.95 | Symmetric to txc |
| `critChance` | 4.0 | 0.90 | 0.93 | % based (with 2x mult) |
| `lifesteal` | 100.0 | 0.98 | 0.87 | Extremely valuable |
| `regen` | 20.0 | 0.97 | 0.91 | Per-turn healing |

---

## 📊 Research-Based Insights for THIS Project

### 1. Path of Exile Formula Integration

**Current Implementation (CORRECT):**
```typescript
// src/balancing/modules/mitigation.ts
armorReduction = armor / (armor + 10 * damage)
// Capped at 90%
```

**Why This Matters for Weight-Based System:**
- ✅ Armor value changes based on incoming damage
- ❌ Makes armor weight NON-LINEAR (0.82 linearity score confirms this)
- 🎯 **Implication:** Armor's HP equivalency varies by combat scenario

**Recommendation for Simulation:**
```typescript
// When calculating stat value via simulation:
// Test armor at MULTIPLE damage levels
const testDamageLevels = [10, 20, 50, 100, 200];
testDamageLevels.forEach(dmg => {
  // Run 10k sims with attacker.damage = dmg
  // Calculate armor's effective HP value
  // Average across all damage levels
});
```

### 2. Effective Health Points (EHP) Philosophy

**Formula (from research):**
```
EHP = HP / (1 - damage_reduction)
```

**Applied to THIS Project:**
```typescript
// For a tank with:
const stats = {
  hp: 1000,
  armor: 500,  
  resistance: 50,  // 50%
};

// Against 100 damage attack:
armorReduction = 500 / (500 + 10*100) = 0.33 (33%)
resistanceReduction = 0.50 (50%)

// Apply in order (flatFirst flag):
if (flatFirst) {
  damageAfterArmor = 100 * (1 - 0.33) = 67
  finalDamage = 67 * (1 - 0.50) = 33.5
} else {
  damageAfterRes = 100 * (1 - 0.50) = 50
  finalDamage = 50 * (1 - 0.33) = 33.5
}

// EHP calculation:
EHP = 1000 / (33.5 / 100) = ~2985 HP
```

**Weight Calibration Implication:**
- Armor + Resistance **MULTIPLY** their effectiveness
- **Current weights (both 5.0) may UNDERVALUE defensive stacking**

---

## 🔬 Simulation-Based Calibration Strategy

### Method 1: Binary Search for Equilibrium (RECOMMENDED)

**Goal:** Find stat value that produces 50% win rate#### **STEP 1: Importare Baseline (MAI Hardcodare)**

```typescript
// ✅ CORRETTO: Importa da modulo esistente
import { BASELINE_STATS } from '../baseline';
import type { StatBlock } from '../types';

// Entità di riferimento (validata con 10k simulazioni)
const baseline: StatBlock = BASELINE_STATS;

// ❌ MAI FARE COSÌ:
// const baseline = { hp: 100, attack: 20, ... }  // VIOLAZIONE!
```

**Perché questo è critico:**
- `BASELINE_STATS` è già validato (50.05% win rate)
- Contiene TUTTE le stat necessarie per `StatBlock`
- Se cambiano le formule, baseline si aggiorna automaticamente(high - low > 0.1) {
    const mid = (low + high) / 2;
    
    // Test: baseline vs baseline with +mid of stat
    const challenger = { ...baseline, [stat]: baseline[stat] + mid };
    
```typescript
// Simulazione: BASELINE_STATS vs Challenger
const result = MonteCarloSimulation.run({
  combat: {
    entity1: BASELINE_STATS,
    entity2: challenger,
    turnLimit: 100
  },
  iterations: 10000  // 10k combattimenti
});
    
    const winRate = result.summary.winRates.entity2;
    
    if (winRate > 0.51) {
      high = mid; // Stat too strong
    } else if (winRate < 0.49) {
      low = mid; // Stat too weak
    } else {
      break; // Found equilibrium!
    }
  }
  
  const equilibriumValue = (low + high) / 2;
  
  // HP equivalency = how much HP gives same power
  return equilibriumValue / baseline.hp; // Weight in HP per stat point
}
```

### Method 2: Marginal Value Analysis

**Test increments instead of absolute values:**

```typescript
function calculateMarginalValue(stat: string): number[] {
  const baseline = BASELINE_STATS;
  const increments = [1, 5, 10, 20, 50];
  const marginalValues = [];
  
  for (const inc of increments) {
    const modified = { ...baseline, [stat]: baseline[stat] + inc };
    
    const result = MonteCarloSimulation.run({
      combat: { entity1: baseline, entity2: modified, turnLimit: 100 },
      iterations: 5000
    });
    
    // HP margin = average HP remaining for winner
    const avgHPMargin = calculateAvgHPMargin(result);
    
    // HP value per stat point
    marginalValues.push(avgHPMargin / inc);
  }
  
  return marginalValues; // Check for diminishing returns
}
```

---

## 🎯 Specific Recommendations for THIS Project

### Priority 1: Validate Current Weights via Simulation

**Action:** Run auto-calibration for all core stats

```typescript
// File: src/balancing/simulation/AutoCalibrator.ts
const statsToCalibrate = [
  'damage', 'armor', 'resistance', 'txc', 'evasion',
  'critChance', 'lifesteal', 'regen'
];

const calibrationResults = {};

for (const stat of statsToCalibrate) {
  calibrationResults[stat] = {
    currentWeight: CORE_STAT_WEIGHTS[stat].avgRatio,
    simulatedWeight: calibrateStatWeight(stat),
    discrepancy: Math.abs(current - simulated),
    recommendation: discrepancy > 1.0 ? 'ADJUST' : 'OK'
  };
}

// Export report
exportCalibrationReport(calibrationResults);
```

### Priority 2: Account for Defensive Layering

**Issue:** Armor + Resistance stack multiplicatively

**Test Case:**
```typescript
// ✅ CORRETTO: Usa baseline importato
import { BASELINE_STATS } from '../baseline';

// Voglio sapere: "Quanti HP valgono 10 punti armor?"

// Creo variante con +10 armor
const challenger: StatBlock = {
  ...BASELINE_STATS,
  armor: BASELINE_STATS.armor + 10  // +10 rispetto a baseline
};
// Run 10k sims for each
// Compare EHP
// Adjust weights if Scenario C DRASTICALLY outperforms A+B
```

**Expected Finding:**
- If defensive stacking is overpowered, reduce armor/resistance weights
- If armor/resistance are independent, current weights OK

### Priority 3: Combat Duration Sensitivity

**Ob servation from weights:**
```
regen: 20.0 HP  // Per-turn
lifesteal: 100.0 HP // % based
```

**Regen is MUCH stronger than expected** because:
- Triggers every turn (guaranteed)
- Longer combat = more value
- Linear scaling with turns

**Test:**
```typescript
// Run sims with different turn limit caps
const turnLimits = [10, 20, 50, 100];

for (const limit of turnLimits) {
  // Test regen value at each limit
  // Check if weight should scale with turn limit
}
```

**Recommendation:**
- Consider **dynamic weights** based on expected combat duration
- OR: Set turn limit as a balancing constant (e.g., always 50 turns)

### Priority 4: Offensive vs Defensive Ratio

**Research Finding:** Balance depends on game mode (hardcore = more defense)

**For THIS Project:**
```typescript
// Define target ratios for different build types
const archetypeRatios = {
  tank: { offense: 0.3, defense: 0.7 },
  dps: { offense: 0.7, defense: 0.3 },
  balanced: { offense: 0.5, defense: 0.5 }
};

// Test: Do weights produce these ratios naturally?
function validateArchetypeBalance(archetype: string) {
  const stats = buildArchetype(archetype);
  
  const offensivePower = 
    stats.damage * WEIGHTS.damage +
    stats.critChance * WEIGHTS.critChance;
    
  const defensivePower =
    stats.hp * WEIGHTS.hp +
    stats.armor * WEIGHTS.armor +
    stats.resistance * WEIGHTS.resistance;
    
  const actualRatio = offensivePower / (offensivePower + defensivePower);
  const expectedRatio = archetypeRatios[archetype].offense;
  
  return Math.abs(actualRatio - expectedRatio) < 0.1; // Within 10%
}
```

---

## 🛠️ Implementation Roadmap

### Phase 1: Validation (1-2 days)
- [ ] Run binary search calibration for all stats
- [ ] Compare simulated weights vs current weights
- [ ] Generate discrepancy report
- [ ] Identify stats that need adjustment

### Phase 2: Refinement (2-3 days)
- [ ] Test defensive stacking scenarios
- [ ] Measure combat duration impact on sustain stats
- [ ] Test archetype ratio validation
- [ ] Adjust weights based on findings

### Phase 3: Documentation (1 day)
- [ ] Update `statWeights.ts` with new empirical data
- [ ] Document calibration methodology
- [ ] Create "last calibrated" timestamps
- [ ] Add confidence intervals to all weights

### Phase 4: Continuous Calibration (ongoing)
- [ ] Create automated weight calibration CLI tool
- [ ] Run weekly calibrations as combat formulas evolve
- [ ] Track weight drift over time
- [ ] Alert when weights deviate >10% from expected

---

## 📐 Formula Recommendations

### Stat Value Equivalency (for UI Display)

```typescript
// Show users: "10 Armor ≈ 50 HP"
function displayStatEquivalency(stat: string, value: number): string {
  const weight = getStatWconsole.log(`\n✅ RISULTATO:`);
console.log(`+5 Attack richiede +${finalHP - BASELINE_STATS.hp} HP per equilibrio`);
console.log(`Peso: 1 Attack = ${damageWeight.toFixed(1)} HP`);
console.log(`\nBaseline usato: hp=${BASELINE_STATS.hp}, damage=${BASELINE_STATS.damage}`);
console.log(`Source: src/balancing/baseline.ts (validated 2025-11-23)`);
}
```

### Balance Score (for Creator UI)

```typescript
// Current: just sum - budget
// Improved: normalize by budget
function calculateBalanceScore(stats: StatConfig, budget: number): number {
  const totalCost = calculateTotalCost(stats);
  const balance = totalCost - budget;
  
  // Normalize: -1.0 to +1.0 scale
  const normalizedBalance = balance / budget;
  
  // Color code:
  // Green: [-0.05, +0.05] (within 5%)
  // Yellow: [-0.15, -0.05] or [+0.05, +0.15]
  // Red: outside ±15%
  
  return normalizedBalance;
}
```

---

## 🚨 Critical Warnings

### ⚠️ Non-Linear Stats (Armor)

**Current Issue:**
- Armor weight is 5.0 (constant)
- But armor effectiveness varies with damage
- Weight should reflect AVERAGE case, not best case

**Solution:**
```typescript
// When calibrating armor:
const damageLevels = [10, 20, 50, 100, 200]; // 4. Calcolo peso
const damageWeight = (finalHP - BASELINE_STATS.hp) / 5; // +5 attack testatomageLevel(dmg)
);

// Use median or weighted average
const finalArmorWeight = median(armorWeights);
```

### ⚠️ Interaction Effects

**Crit Chance + Crit Multiplier:**
- Currently weighted independently
- But they multiply together
- **crit_value = crit_chance × (crit_mult - 1.0) × base_damage**

**Recommendation:**
- Test in combination
- Adjust weights based on typical multiplier (e.g., 1.5x)

### ⚠️ Percentage vs Flat Stats

**Resistance (%) vs Armor (flat):**
- Different scaling curves
- Don't compare directly
- Always test in realistic scenarios

---

## 🎓 Learning from Path of Exile

**What to ADOPT:**
1. ✅ Defensive layering (already doing via armor + resistance)
2. ✅ Damage-dependent mitigation (already using PoE armor formula)
3. ✅ Cap defensive stats at 90% (already implemented)

**What to AVOID:**
1. ❌ Too many interconnected mechanics (keeps weights simple)
2. ❌ Unclear stat scaling (your linear weights are better)
3. ❌ Hidden calculations (your weight-based system is transparent)

**What THIS Project Does BETTER:**
- ✅ Explicit weight-based balancing (easier to understand)
- ✅ User-defined baselines (more flexible)
- ✅ Simulation-driven validation (data > guessing)

---

## 📚 References (Tailored to THIS Project)

**Your Existing Files:**
- `src/balancing/statWeights.ts` - Current weight database
- `src/balancing/modules/mitigation.ts` - PoE armor formula
- `src/balancing/simulation/CombatSimulator.ts` - Testing engine
- `docs/PROJECT_PHILOSOPHY.md` - Weight-based creator pattern

**Research Applied:**
- Path of Exile: Armor formula mechanics
- EHP Theory: Defensive layering principles
- Simulation-Based Tuning: Monte Carlo calibration

---

**Next Action:** Implement `AutoCalibrator.ts` to validate all current weights via simulation and generate adjustment recommendations.
