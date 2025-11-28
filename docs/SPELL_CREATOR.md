# Spell Creation System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Philosophy](#philosophy)
3. [Spell Stats Reference](#spell-stats-reference)
4. [UI Components](#ui-components)
5. [Balancing Features](#balancing-features)
6. [Configuration](#configuration)

---

## Overview

The Spell Creation system is an **interactive balancing tool** that allows you to design spells using a weight-based budget system. Every stat has a cost (weight), and the total must balance against a target budget.

### Core Principle
**Balance = Σ(Stat Weights) - Target Budget**
- A balanced spell has `Balance = 0`
- Overpowered spells have `Balance > 0` (red)
- Underpowered spells have `Balance < 0` (green)

---

## Philosophy

### The Weight-Based Creator Pattern
Spell Creator uses **HP equivalents** as weights:
- Each spell stat has a weight representing its HP value
- Example: `effect: 10, weight: 50` means this value costs 50 HP
- The UI shows a running balance to keep spells fair

### Smart Stats (Derived Values)
Some stats show **intelligent derived metrics** that help you understand their impact:

#### TxC (Accuracy)
-   **Efficiency**: Hit Chance (%)
-   **Consistency**: `(HitChance/100) ^ HTK` - Probability to kill in minimum turns

#### Armor (Defense)
-   **EHP Boost**: How much your effective HP increases (%)

#### Crit (Burst)
-   **DPS Boost**: Average damage increase from crits (%)

#### Lifesteal (Sustain)
-   **Heal/Hit**: HP recovered per successful attack

These derived stats are **editable** - changing them reverse-solves for the base stat.

### Combat Preview
The UI shows **Time to Kill (TTK)** and **Time to Die (TTD)** metrics:
- **TTK**: How many turns to defeat a baseline enemy
- **TTD**: How many turns you survive against a baseline enemy
- **Win Probability**: Based on the ratio `TTD / TTK`

This gives instant feedback on spell viability.

---

## Spell Stats Reference

### Core Stats (Required)

#### Effect
-   **Description**: Primary damage/healing value
-   **Weight**: Variable (see `statWeights.ts`)
-   **Example**: `effect: 25` for a basic attack

#### Eco (Economy)
-   **Description**: Resource efficiency or cost multiplier
-   **Weight**: Variable
-   **Use Case**: Balances spell strength against resource consumption

#### Dangerous
-   **Description**: Variance/risk factor
-   **Weight**: Variable
-   **Use Case**: High-risk high-reward spells

### Advanced Stats

#### Scale
-   **Description**: Scaling factor with character level/stats
-   **Weight**: Variable
-   **Example**: `scale: 1.5` means +50% effectiveness at max level

#### Precision
-   **Description**: Accuracy bonus for the spell
-   **Weight**: Similar to TxC
-   **Example**: `precision: 10` adds to hit chance

### Optional Stats

#### AoE (Area of Effect)
-   **Description**: Number of targets hit
-   **Weight**: Exponential (hitting 2 targets is 2x value)
-   **Example**: `aoe: 3` targets

#### Cooldown
-   **Description**: Turns between casts
-   **Weight**: Inverse (higher cooldown = negative value)
-   **Example**: `cooldown: 2` means usable every 2 turns

#### Range
-   **Description**: Distance spell can reach
-   **Weight**: Low (mostly tactical)
-   **Example**: `range: 5` tiles

#### Priority
-   **Description**: Initiative/speed bonus
-   **Weight**: Medium
-   **Example**: `priority: 10` acts first

#### Mana Cost
-   **Description**: Resource cost per cast
-   **Weight**: Negative (higher cost = lower weight)
-   **Example**: `manaCost: 30`

---

## UI Components

### EnhancedStatSlider
The core input component for each stat.

#### Features
-   **Multi-Tick Sliders**: Define multiple value/weight pairs
-   **Drag to Reorder**: Click header to drag stats around
-   **Collapse/Expand**: Hide stats you're not editing
-   **Smart Inputs**: See derived values like "Efficiency" or "EHP Boost"
-   **Add/Remove Ticks**: Customize the granularity

#### Layout
```
┌─────────────────────────────────────────┐
│ [☰ Stat Name               [Hide Icon]] │ <- Draggable Header
├─────────────────────────────────────────┤
│ [10] [20] [30] [40] [+]                 │ <- Values
│ ──●──────○──────○──────○────            │ <- Slider
│ [5]  [10] [15] [20] [×]                 │ <- Weights
│ [Efficiency: 75%] [Consistency: 31%]    │ <- Derived Stats (if applicable)
│ "Description text..."                   │ <- Tooltip
└─────────────────────────────────────────┘
```

### Combat Preview Panel
Located below the Spell Identity Card, shows:
-   **TTK**: Estimated turns to kill baseline enemy
-   **TTD**: Estimated turns you survive
-   **Win %**: Probability of victory
-   **Status**: WINNING (green) or LOSING (red)

This updates in real-time as you adjust stats.

### SpellIdentityCard
The top-left card with:
-   **Name**: Spell name
-   **Type**: Attack/Heal/Buff/etc.
-   **Target Budget**: The HP cost you're aiming for

---

## Balancing Features

### 1. Weight-Based Budgeting
Every stat has a weight representing its HP value:
```typescript
damage: { avgRatio: 5.0 } // 1 damage = 5 HP
armor: { avgRatio: 5.0 }  // 1 armor = 5 HP
critChance: { avgRatio: 4.0 } // 1% crit = 4 HP
```

### 2. Real-Time Balance Feedback
The UI shows a balance indicator:
-   **Green (Negative)**: Spell is underpowered
-   **Perfect (Zero)**: Balanced
-   **Red (Positive)**: Spell is overpowered

### 3. Locking Mechanism (Smart Stats)
When you edit a derived stat (e.g., "Efficiency"), the system:
1.  Calculates the required base stat value (e.g., TxC)
2.  Updates the base stat automatically
3.  Recalculates all other derived stats

This creates an interconnected system where everything affects everything.

### 4. Combat Simulation
The Combat Predictor runs an analytical model (not Monte Carlo) to estimate:
-   **DPS (Damage Per Second)**: `(Damage * CritMult * HitChance) / Turn`
-   **DTPS (Damage Taken Per Second)**: `(Enemy_Damage - Lifesteal - Regen) / Turn`
-   **TTK**: `Enemy_HP / DPS`
-   **TTD**: `Your_HP / DTPS`

This respects all configuration flags (see [Configuration](#configuration)).

---

## Configuration

### Baseline Enemy Stats
The "Standard Enemy" used for all calculations:
```typescript
{
    hp: 100,
    damage: 25,
    txc: 25,
    armor: 0,
    evasion: 0
}
```

These are defined in `BALANCING_CONFIG`.

### Combat Flags (Advanced)
These flags affect how combat formulas are calculated:

#### configFlatFirst
-   **Default**: `true`
-   **Effect**: Apply Armor before Resistance?
-   **Impact**: Changes the order of mitigation calculations

#### configApplyBeforeCrit
-   **Default**: `false`
-   **Effect**: Apply Mitigation before Crit multiplier?
-   **Impact**: Changes crit effectiveness

**Most users won't need to change these.** They're for advanced balancing scenarios.

---

## Usage Examples

### Example 1: Basic Attack Spell
```typescript
{
    name: "Basic Attack",
    type: "attack",
    effect: 25,      // 25 damage
    txc: 25,         // 75% hit chance (25 + 50 - 0)
    dangerous: 0,    // No variance
    scale: 1.0,      // No scaling
    aoe: 1,          // Single target
    cooldown: 0,     // No cooldown
    manaCost: 0      // Free
}
```
**Estimated Weight**: ~150 HP (5.0 * 25 + 2.0 * 25 + ...)

### Example 2: High-Crit Burst Spell
```typescript
{
    name: "Critical Strike",
    effect: 15,          // Lower base damage
    critChance: 50,      // 50% crit chance
    critMult: 3.0,       // 3x damage on crit
    cooldown: 3,         // 3-turn cooldown
    manaCost: 50         // Expensive
}
```
**DPS Boost**: +100% (from crit)  
**Effective Damage**: 15 * (1 + 0.5 * 2.0) = 30 average  
**TTK**: Lower than basic attack if cooldown is ignored

### Example 3: Tank Spell (Self-Buff)
```typescript
{
    name: "Shield Wall",
    type: "buff",
    effect: 0,           // No damage
    armor: 500,          // Massive armor
    lifesteal: 10,       // 10% lifesteal
    duration: 5,         // Lasts 5 turns
    manaCost: 100
}
```
**EHP Boost**: +200% (from armor)  
**TTD**: Approximately 3x baseline

---

## Links
-   [Balancing System](./BALANCING_SYSTEM.md) - Full combat formulas
-   [Stat Weights Database](../balancing/statWeights.ts)
-   [Combat Predictor](../balancing/modules/combatPredictor.ts)
-   [Spell Definitions](../balancing/spellStatDefinitions.ts)
