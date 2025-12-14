# Balancing System Documentation

## Table of Contents
1. [Philosophy](#philosophy)
2. [Core Concepts](#core-concepts)
3. [Complete Stat Reference](#complete-stat-reference)
4. [Combat Formulas](#combat-formulas)
5. [Configuration Flags](#configuration-flags)
6. [Balancing Tools](#balancing-tools)

---

## Philosophy

### The "Turns" Currency
The entire balancing system revolves around **Turns** as the universal currency. Every stat, item, and spell is ultimately valued by its impact on:
-   **Time to Kill (TTK)**: How many turns to defeat a balanced enemy
-   **Time to Die (TTD)**: How many turns you survive against a balanced enemy

**Balance Axiom**: A perfectly balanced character has `TTK ≈ TTD` against an equally balanced opponent, resulting in a ~50% win rate.

### HP as Weight Reference
Stat weights are expressed as **HP equivalents**:
-   `+10 Damage ≈ +50 HP` (5.0 weight)
-   `+100 Armor ≈ +500 HP` (5.0 weight)

This allows direct comparison: "Is +10 Damage better than +100 Armor?" Both are worth the same HP_eq, so they should perform similarly.

### Monte Carlo Validation
All weights are empirically validated through Monte Carlo simulations:
1.  Incrementally add a stat (e.g., +10 Damage)
2.  Use binary search to find HP_eq that restores 50% win rate
3.  Repeat for multiple increments
4.  Calculate average ratio

---

## Core Concepts

### 1. Base Stat Kit (Human Growth + Quests)

The **Base Stat Kit** identifies which stats belong to the default human template.  
These stats are:
- available when generating or growing human characters,
- exposed to quest/skill-check pools (e.g., Skill Check Lab),
- exported/imported via the `baseStat` flag in balancing config.

Designers can toggle the `baseStat` flag per stat in the Balancer UI. Any stat without the flag is ignored when building human kits or quest radar charts.

#### Flag Reference

| Flag | Meaning | Typical Stats | Notes |
|------|---------|---------------|-------|
| `baseStat: true` | Human growth/quest pool | `hp`, `damage`, `txc`, `evasion`, `baseHitChance`, `critChance`, `critMult`, `critTxCBonus` | Level-up + quest checks use solo queste stat. |
| `baseStat: false` (equip/bonus) | Solo da equip, talenti, o razze speciali | `ward`, `armor`, `resistance`, `armorPen`, `penPercent`, `lifesteal`, `regen` | Non entrano nelle quest umane; restano editabili per bozze razziali. |
| `isDetrimental: true` (“Hero Only”) | Benefici per l’eroe ma dannosi nelle quest | `failChance`, `failMult`, `failTxCMalus` (tutte anche `isPenalty`) | Filtrate dal kit umano; visibili solo nelle build giocatore. |

Derived stats (`isDerived === true`) vengono sempre trattate come `baseStat: false`, indipendentemente dal flag manuale.

#### Single Source of Truth

- **TypeScript defaults**: `src/balancing/config/defaultConfig.ts`  
- **JSON di bootstrap/import**: `src/balancing/config/balancer-default-config.json`

Entrambi contengono i flag aggiornati; il `BalancerConfigStore` applica `mergeWithDefaults + applyStatFlagDefaults` per garantire che qualsiasi import/export mantenga la semantica.  
Se servono modifiche senza passare dalla UI, editare **entrambi** i file sopra (o almeno il JSON) per evitare divergenze tra il reset iniziale e il salvataggio locale.

### 2. Baseline Stats
The "Standard Enemy" used for all calculations:
```typescript
BASELINE_STATS = {
    hp: 100,
    damage: 25,
    txc: 25,
    armor: 0,
    evasion: 0,
    // ... (see baseline.ts for full list)
}
```

### 3. Derived Stats
Stats that are CALCULATED from other stats, not directly set:
-   `hitChance` = `TxC + 50 - Evasion` (clamped 1-100%)
-   `effectiveDamage` = Damage after mitigation
-   `attacksPerKo` = `HTK / (HitChance/100)`

### 4. Configuration Flags
Combat behavior can be customized via flags:
-   `configFlatFirst`: Apply Armor before or after Resistance?
-   `configApplyBeforeCrit`: Apply Mitigation before or after Crit?

---

## Complete Stat Reference

### Offensive Stats

#### Damage
-   **Description**: Raw physical/magical attack power
-   **Formula**: Base value, modified by buffs
-   **Weight**: 5.0 HP/point
-   **Example**: +10 Damage ≈ +50 HP value

#### TxC (To Hit Chance)
-   **Description**: Accuracy rating. Higher values increase hit chance.
-   **Formula**: `HitChance = TxC + 50 - Target.Evasion`
-   **Weight**: 2.0 HP/point
-   **Linearity**: 95% (nearly linear)
-   **Derived**: `Efficiency (%)` = HitChance

#### Crit Chance
-   **Description**: Probability (0-100%) to deal critical damage
-   **Formula**: `DPS Multiplier = 1 + (CritChance * (CritMult - 1))`
-   **Weight**: 4.0 HP/point
-   **Default CritMult**: 2.0 (200% damage)
-   **Example**: 20% Crit

 with x2 Mult = +20% DPS

#### Crit Multiplier
-   **Description**: Damage multiplier on critical hits
-   **Formula**: `CritDamage = BaseDamage * CritMult`
-   **Weight**: 10.0 HP/0.1 (expensive!)
-   **Example**: 2.0 → 2.5 is a +25% DPS increase (with 20% CritChance)

#### Armor Penetration (Flat)
-   **Description**: Ignores X points of enemy armor
-   **Formula**: `EffectiveArmor = max(0, Armor - ArmorPen)`
-   **Weight**: 1.5 HP/point
-   **Use Case**: Effective against low-armor enemies

#### Penetration (%)
-   **Description**: Ignores X% of enemy resistance
-   **Formula**: `EffectiveRes = max(0, Resistance - PenPercent)`
-   **Weight**: 80 HP/point (very strong!)
-   **Use Case**: Essential against high-resistance enemies

---

### Defensive Stats

#### Armor
-   **Description**: Physical damage reduction using Path of Exile formula
-   **Formula**: `Reduction = Armor / (Armor + 10 * RawDamage)`
-   **Weight**: 5.0 HP/point (tuned empirically)
-   **Linearity**: 82% (non-linear scaling)
-   **Cap**: 90% max reduction
-   **Derived**: `EHP Boost (%)` = `(Armor / (10*BaseDmg)) * 100`
-   **Example**: 250 Armor vs 25 Dmg → 50% reduction → +100% EHP

> **Why PoE Formula?**  
> EHP scales **linearly** with Armor using this formula:  
> `EHP = HP * (1 + Armor / (10*Dmg))`  
> This prevents diminishing returns and makes Armor stacking viable.

#### Resistance (%)
-   **Description**: Magical damage reduction (percentage-based)
-   **Formula**: `DamageTaken *= (1 - Resistance/100)`
-   **Weight**: 100 HP/point (extremely valuable)
-   **Example**: 20% Resistance = 20% damage reduction = +25% EHP

#### Evasion
-   **Description**: Avoidance rating. Higher values reduce enemy hit chance.
-   **Formula**: `EnemyHitChance = EnemyTxC + 50 - Evasion`
-   **Weight**: 4.0 HP/point (symmetric to TxC)
-   **Linearity**: 95%

---

### Sustain Stats

#### Lifesteal (%)
-   **Description**: Heals for X% of damage dealt
-   **Formula**: `HealPerHit = DamageDealt * (Lifesteal/100)`
-   **Weight**: 100 HP/point (empirical - very strong)
-   **TTD Impact**: Subtracts from DTPS (Damage Taken Per Second)
-   **Example**: 5% Lifesteal with 100 DPS = 5 HP/turn heal

#### Regen
-   **Description**: HP restored per turn (flat)
-   **Formula**: Adds to HP at start of each turn
-   **Weight**: 20 HP/point
-   **TTD Impact**: Subtracts from DTPS
-   **Example**: 5 Regen = 5 HP/turn

#### Ward
-   **Description**: One-time damage shield
-   **Formula**: Absorbs damage 1:1 until depleted
-   **Weight**: 1.5 HP/point
-   **Example**: 50 Ward = 50 HP of temporary shielding

#### Block (%)
-   **Description**: Probability to completely negate an attack
-   **Formula**: `if (random() < Block%) Damage = 0`
-   **Weight**: 80 HP/point
-   **Linearity**: 75% (non-linear - probabilistic)

---

## Combat Formulas

### Order of Operations (Standard)

1.  **Start of Turn Effects**
    -   Apply Regen
    -   Apply DoT/HoT ticks
    -   Tick down buff durations

2.  **Attack Resolution**
    ```
    rawDamage = Attacker.Damage * BuffMultipliers
    
    IF configApplyBeforeCrit == FALSE (STANDARD):
        // A. Crit Roll FIRST
        isCrit = random() < CritChance
        if isCrit: rawDamage *= CritMult
        
        // B. Mitigation AFTER
        mitigation = calculateMitigation(rawDamage, Armor, Resistance, ...)
        finalDamage = rawDamage * (1 - mitigation)
    ELSE:
        // Rare: Mitigation BEFORE Crit
        mitigation = calculateMitigation(rawDamage, Armor, Resistance, ...)
        mitigatedDamage = rawDamage * (1 - mitigation)
        
        isCrit = random() < CritChance
        if isCrit: finalDamage = mitigatedDamage * CritMult
        else: finalDamage = mitigatedDamage
    
    // C. Hit Chance
    hitChance = TxC + 50 - Evasion
    if random() > hitChance: finalDamage = 0
    
    // D. Apply Damage
    target.HP -= finalDamage
    
    // E. Lifesteal
    attacker.HP += finalDamage * (Lifesteal / 100)
    ```

3.  **End of Turn**
    -   Check for death
    -   Increment turn counter

### Mitigation Formula

```typescript
function calculateMitigation(
    rawDamage: number,
    armor: number,
    resistance: number, // 0-100 percentage
    armorPen: number,
    penPercent: number,
    flatFirst: boolean
): number {
    // 1. Effective Stats (after penetration)
    effArmor = max(0, armor - armorPen)
    effRes = max(0, resistance - penPercent)
    
    // 2. Calculate Reductions
    armorReduction = effArmor / (effArmor + 10 * rawDamage) // PoE formula, capped at 90%
    resReduction = effRes / 100
    
    // 3. Apply in Order
    if (flatFirst) {
        damage = rawDamage * (1 - armorReduction) * (1 - resReduction)
    } else {
        damage = rawDamage * (1 - resReduction) * (1 - armorReduction)
    }
    
    return max(1, damage) // Minimum 1 damage
}
```

> **Order Matters!**  
> Armor reduction depends on raw damage. If applied after Resistance, the effective damage is lower, so Armor is more effective.

---

## Configuration Flags

### configFlatFirst
-   **Default**: `true`
-   **Effect**: Determines if Armor (flat) is applied before or after Resistance (%)
-   **Use Case**: 
    -   `true` (standard): Armor reduces first, then Resistance
    -   `false` (alternate): Resistance reduces first, then Armor (makes Armor stronger)

### configApplyBeforeCrit
-   **Default**: `false`
-   **Effect**: Determines if Mitigation is applied before or after Crit
-   **Use Case**:
    -   `false` (standard): Crit amplifies pre-mitigation damage (standard RPG)
    -   `true` (rare): Mitigation applies first, then Crit amplifies the mitigated value (less variance)

---

## Balancing Tools

### 1. Monte Carlo Simulator
-   **Path**: `src/balancing/simulation/MonteCarloSimulation.ts`
-   **Purpose**: Runs thousands of simulated battles to measure win rates
-   **Usage**: `npm run calibrate <stat> [increment] [iterations]`

### 2. Stat Value Analyzer
-   **Path**: `src/balancing/simulation/StatValueAnalyzer.ts`
-   **Purpose**: Auto-calibrates stat weights using binary search
-   **Algorithm**:
    1.  Add +X to stat
    2.  Find HP_eq that restores 50% win rate
    3.  Weight = HP_eq / X

### 3. Combat Predictor
-   **Path**: `src/balancing/modules/combatPredictor.ts`
-   **Purpose**: Calculates TTK and TTD analytically (without simulation)
-   **Use Case**: Real-time UI feedback in Spell Creator

### 4. Spell Creator
-   **Path**: `src/ui/spell/SpellCreation.tsx`
-   **Purpose**: Interactive balancing UI
-   **Features**:
    -   "Smart Stats": Shows derived values (Efficiency, EHP Boost, DPS Multiplier)
    -   Combat Preview: Shows TTK vs TTD in real-time
    -   Balance Score: Target vs Actual HP cost

---

## Example: Full Combat Calculation

```typescript
// Attacker Stats
const attacker = {
    damage: 30,
    txc: 25,
    critChance: 20,
    critMult: 2.0,
    armorPen: 0,
    penPercent: 0
};

// Defender Stats
const defender = {
    hp: 100,
    armor: 100,
    resistance: 0,
    evasion: 0,
    configFlatFirst: true
};

// 1. Crit Roll (BEFORE mitigation)
const isCrit = random() < 0.20; // 20% chance
let rawDmg = isCrit ? 30 * 2.0 : 30; // Crit: 60, Normal: 30

// 2. Mitigation (PoE formula for Armor)
const armorReduction = 100 / (100 + 10 * rawDmg);
// If Crit (60 dmg): 100/(100+600) = 14.3%
// If Normal (30 dmg): 100/(100+300) = 25%
const finalDmg = rawDmg * (1 - armorReduction);
// If Crit: 60 * 0.857 = 51.4
// If Normal: 30 * 0.75 = 22.5

// 3. Hit Chance
const hitChance = 25 + 50 - 0 = 75%;
if (random() > 0.75) finalDmg = 0; // Miss!

// 4. Apply
defender.hp -= finalDmg;
```

---

## Links
-   [Stat Weights Database](../balancing/statWeights.ts)
-   [Baseline Stats](../balancing/baseline.ts)
-   [Combat Logic](../engine/combat/logic.ts)
-   [Monte Carlo Testing](../balancing/simulation/MonteCarloSimulation.test.ts)
