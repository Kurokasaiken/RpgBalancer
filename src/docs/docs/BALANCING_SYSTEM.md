# Balancing System Documentation

## Table of Contents
1. [Philosophy](#philosophy)
2. [Core Concepts](#core-concepts)
3. [Complete Stat Reference](#complete-stat-reference)
4. [Combat Formulas](#combat-formulas)
5. [Configuration Flags](#configuration-flags)
6. [Balancing Tools](#balancing-tools)
7. [Archmage Balancing Extensions](#archmage-balancing-extensions)

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

#### Flag & Testing Pipeline

- **Skill Check Lab** usa solo le stat con `baseStat: true` e `isDetrimental: false` per costruire i poligoni e le simulazioni (anche nelle viste alternative).
- **Stat Stress Testing / Round-Robin** importa l’elenco dei driver tramite `isStressTestCandidate`, quindi ignora automaticamente stats derivate, di equip o contrarie alle quest.  
  (Generator: `StatsArchetypeGenerator`, Harness CLI/UI: `StatStressHarness`, Dashboard UI: `StressTestDashboard`).
- Se una nuova stat deve entrare nei test, assicurarsi che `baseStat=true` e non sia marcata `isDetrimental`. Stats equip-only o penalità rimangono comunque disponibili nel Balancer ma non vengono allenate nei tool di testing.

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
-   **TTD Impact**: Subtracts from DTPS
-   **Example**: 5% Lifesteal with 100 DPS = 5 HP/turn heal
-   **Heal Cap Policy**: l’heal ottenuto per turno non può superare la quota di TTD assegnata a sustain (es. “lifesteal può ridare al massimo 0.4 turni di TTD per round”). In pratica il cap viene calcolato in HP equivalenti usando il TTD baseline e applicato via `SustainModule.applyHealingCap`. Questo mantiene “healing feels good” senza far diventare il sustain dominante nei match prolungati.

#### Regen
-   **Description**: HP restored per turn (flat)
-   **Formula**: Adds to HP at start of each turn
-   **Weight**: 20 HP/point
-   **TTD Impact**: Subtracts from DTPS
-   **Example**: 5 Regen = 5 HP/turn
-   **Heal Cap Policy**: ogni tick di regen è limitato in base al TTD target: il cap si esprime come “% di TTD recuperabile” anziché come HP grezzi, così da evitare che regen/HoT superino l’obiettivo di sopravvivenza prefissato (es. max 0.6 turni di TTD recuperabili in prep phase). I valori sono configurabili nei moduli sustain e devono restare coerenti con `TTK ≈ TTD`.

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

## Combat Turn & Simulation Overview

### 1. Filosofia di base
- **Moneta universale**: i turni sono convertiti in HP equivalenti; ogni stat, buff o malus si misura per l’impatto su TTK/TTD.
- **Obiettivo di bilanciamento**: in uno scontro 1v1 tra pari livello la baseline è `TTK ≈ TTD`, quindi ~50% di win rate. Tutte le spell/armi/armature devono convergere su questa metrica.

### 2. Sequenza di un turno
1. **Prep Phase** – incremento contatore turni, logging e raccolta delle entità vive.
2. **Sustain Phase** – applica regen e cap di healing tramite `SustainModule`.
3. **Status Effects Phase** – DoT/HoT e tick dei debuff gestiti da `StatusEffectManager`.
4. **Initiative Phase** – ordine dei turni determinato dall’`InitiativeModule` (solo runtime; nei calcoli deterministici l’ordine è ignorato).
5. **Action Phase** – controlli su stun/silence/CC, AI che decide spell buff/debuff o attacco base, applicazione di hit chance, crit, mitigazione, lifesteal e logging.
6. **Basic Attack Fallback** – se nessuna spell è lanciata si calcola il danno base usando le stat effettive e i modificatori correnti.
7. **End Turn / Win Check** – verifica delle morti e aggiornamento dei timer TTK/TTD.

### 3. Strati di simulazione e bilanciamento
#### 3.1 Deterministic Math Engine
- Funzione: `simulateExpectedTTK`.
- Input: valori attesi delle stat (EDPT, buff, lifesteal, regen).
- Output: TTK/TTD senza RNG (crit/hit/lifesteal mediati, regen a fine turno). Ideale per UI, anteprime e calcolo dei pesi.

#### 3.2 Monte Carlo / Combat Simulator
- Funzione: `CombatSimulator.simulate` (interna a `runMonteCarlo`).
- Input: stesso `resolveCombatRound` del runtime con RNG seedato.
- Output: distribuzione completa (TTK, win rate, overkill, edge case). Usato per validare empiricamente i pesi e scoprire outlier.

Entrambi gli strati condividono `DEFAULT_1V1_CONFIG`, così preview deterministiche e simulazioni statistiche restano allineate al comportamento runtime.

### 4. Variabili chiave
- **TTK**: turni medi necessari per uccidere l’avversario.
- **TTD**: turni medi prima di morire.
- **HP equivalenti**: unità comune che permette di confrontare stats offensive/defensive/sustain.
- **Overkill**: danno sprecato, utile per misurare burst inefficiente.
- **Timeout Policy / Sudden Death**: regole di pareggio e moltiplicatori danno per stoppare loop infiniti.

### 5. Spell / Equip Integration
- Spell, armi e armature generano gli input del motore di combattimento (`StatBlock`).
- Qualsiasi modifica (danni, buff, AoE, trigger) aggiorna TTK/TTD in modo lineare o scalato in base ai pesi configurati.
- Il motore restituisce il “valore in HP” di ogni stat/bonus, mantenendo il single source of truth con i moduli di bilanciamento.

### 6. Metriche di output
- TTK medio, TTD medio, win rate e overkill.
- Facoltativo ma consigliato: analisi dell’impatto front-loaded vs back-loaded per capire dove cade la potenza di una build nel timeline.
- Tutte le metriche sono calcolate come valori medi per semplificare il tuning di spell e archetipi.

### 7. Consigli di implementazione
- Rispettare sempre l’ordine delle fasi documentato per avere preview affidabili nelle UI.
- Usare l’engine deterministico per valutare i pesi delle stats e i costi (niente RNG → risultati stabili).
- Eseguire Monte Carlo solo per edge case, regressioni e validazione empirica dei win rate.
- Dichiarare cap/limiti (regen, lifesteal, CC duration) come HP equivalenti nelle config per evitare hardcoding locale.

### 8. Applicazione pratica (Windsurf / AI tooling)
- Qualsiasi entità (player, boss, mob) viene ridotta a input numerici del motore.
- Ogni spell/equip può essere valutato in termini di impatto sui turni, generando prompt del tipo: “Crea una spell che riduca il TTK avversario di 1 turno senza aumentare il TTD del caster”.
- Le AI possono usare gli output TTK/TTD per tarare power, mana cost, cooldown e scaling mantenendo il vincolo `TTK ≈ TTD`.

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

## Archmage Balancing Extensions

### Spell Lifecycle Balancing

Spell-creatures progress through lifecycle stages (infant, juvenile, mature) with different stat configurations. Each stage uses weight-based ticks for attributes like power, mana cost, mood, and training difficulty. Progression costs are expressed in turns currency, validated empirically via Monte Carlo simulations to ensure balanced growth curves.

Example: Infant stage might have low power but high mood variability, while mature stage offers optimized power with stable mood.

### Mental Palace Balancing

Mental palace rooms are balanced using HP equivalents for strategic depth:

- **Mana Generation Rate**: Weight expressed as HP_eq per turn (e.g., +10 mana/turn ≈ +50 HP)
- **Creature Capacity**: Weight for maximum creatures housed
- **Defense Rating**: Weight for resisting demonic incursions

Room expansion costs use the same turns currency, with Monte Carlo validation ensuring that palace upgrades provide measurable strategic advantages without dominating gameplay.

See `docs/archmage/GameplayPillars.md` for full mechanics.

---

## Links
-   [Stat Weights Database](../balancing/statWeights.ts)
-   [Baseline Stats](../balancing/baseline.ts)
-   [Combat Logic](../engine/combat/logic.ts)
-   [Monte Carlo Testing](../balancing/simulation/MonteCarloSimulation.test.ts)
