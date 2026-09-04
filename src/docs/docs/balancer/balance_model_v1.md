# Balance Model v1 — Canonical Mathematical Specification (Draft)

**Status:** `DRAFT / AUDIT-IN-PROGRESS`  
**Scope:** RpgBalancer core combat math + spell balancing  
**Source used for this audit:** local `src/balancing/` tree (clean archive `RpgBalancer_Source_Clean.zip` was not found in workspace).  
**Last updated:** 2026-09-04  

> This document is the first canonical inventory requested by the handoff. It records, for every stat/formula, whether the value is a confirmed design rule, a current implementation fact, an experiment, or inconsistent. No balance values are changed yet.

---

## 1. Purpose & rules of the document

1. Every entry carries a status:
   - `CANONICAL DESIGN` — approved mathematical intent.
   - `CURRENT IMPLEMENTATION` — what the code actually does today.
   - `EXPERIMENTAL / TEST` — useful data, not yet promoted.
   - `INCONSISTENT` — the same concept is defined in two incompatible ways.
   - `DECISION REQUIRED` — design intent is missing.
2. The Balancer is the single source of truth for baseline stats, weights and formulas. The Spell Creator and future Equipment Creator must consume these values, not define their own.
3. Configurable parameters are editable in `BalancerConfig`; stable formulas are code.
4. Illustrative examples from previous discussions are not canonical unless explicitly promoted.

---

## 2. Baseline (neutral 1v1 reference)

### 2.1 Canonical baseline candidate

The only baseline that has been **validated by simulation** is `BASELINE_STATS` in `src/balancing/baseline.ts`.

| Stat | Value | Source | Status |
|------|-------|--------|--------|
| hp | 100 | `BASELINE_STATS.hp` | EXPERIMENTAL / TEST (validated) |
| damage | 25 | `BASELINE_STATS.damage` | EXPERIMENTAL / TEST (validated) |
| txc | 25 | `BASELINE_STATS.txc` | EXPERIMENTAL / TEST (validated) |
| evasion | 0 | `BASELINE_STATS.evasion` | EXPERIMENTAL / TEST (validated) |
| htk | 4 | `BASELINE_STATS.htk` | EXPERIMENTAL / TEST (validated) |
| hitChance | 75 | `BASELINE_STATS.hitChance` | EXPERIMENTAL / TEST (validated) |
| attacksPerKo | 5.33 | `BASELINE_STATS.attacksPerKo` | EXPERIMENTAL / TEST (validated) |
| critChance | 5 | `BASELINE_STATS.critChance` | EXPERIMENTAL / TEST (validated) |
| critMult | 2 | `BASELINE_STATS.critMult` | EXPERIMENTAL / TEST (validated) |
| critTxCBonus | 20 | `BASELINE_STATS.critTxCBonus` | EXPERIMENTAL / TEST (validated) |
| failChance | 5 | `BASELINE_STATS.failChance` | EXPERIMENTAL / TEST (validated) |
| failMult | 0 | `BASELINE_STATS.failMult` | EXPERIMENTAL / TEST (validated) |
| failTxCMalus | 20 | `BASELINE_STATS.failTxCMalus` | EXPERIMENTAL / TEST (validated) |

Validation metadata (`BASELINE_VALIDATION`):

- 10,000 Monte Carlo simulations.
- Winrate A / B: 50.05% / 49.95%.
- Average turns: 4.47.
- Tolerance ±1%.

> **Status:** `CURRENT IMPLEMENTATION` for `baseline.ts`; `INCONSISTENT` with `DEFAULT_CONFIG` (150 HP / 35.7 damage) and `DEFAULT_STATS` (150 HP / 25 damage).

### 2.2 Conflicting baseline representations

| Source | HP | Damage | HTK | Hit chance | Notes |
|--------|----|--------|-----|------------|-------|
| `baseline.ts` | 100 | 25 | 4 | 75% | Validated by simulation |
| `DEFAULT_CONFIG` / `defaultConfig.ts` | 150 | 35.7 | 4.2 | 75% | UI default / shipping config |
| `DEFAULT_STATS` / `types.ts` | 150 | 25 | 0 (derived) | 0 (derived) | Runtime stat block default |
| `BALANCING_CONFIG` | 100 | 25 | 4 | — | Legacy constants |
| `balancer-default-config.json` | 150 | 35.7 | 4.2 | 75% | Serialized store default |

**Decision required:** which one is the canonical neutral baseline? The validated 100/25/4 is the strongest candidate, but `DEFAULT_CONFIG` uses 150/35.7/4.2 because `150 / 35.7 ≈ 4.2017`.

---

## 3. Stat-by-stat canonical inventory

### 3.1 Core stats

#### `hp` — Hit Points

- **Meaning:** total health pool.
- **Unit:** HP.
- **Design purpose:** survival budget.
- **Baseline value:** 100 (validated) or 150 (config default) — `DECISION REQUIRED`.
- **Configurable parameter:** yes (`defaultValue`, `min`, `max`, `step`).
- **Formula:** base input.
- **Dependencies:** none.
- **Output/derived metrics affected:** `htk`, `ttk`, `edpt`, `earlyImpact`.
- **Weight/value interpretation:** 1.0 HP per HP (reference unit).
- **Validation method:** symmetric 1v1 winrate.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `INCONSISTENT` (baseline vs config default).

#### `damage` — Base Damage per landed hit

- **Meaning:** raw damage before crit/mitigation.
- **Unit:** HP.
- **Design purpose:** offensive base.
- **Baseline value:** 25 (validated) or 35.7 (config default).
- **Configurable parameter:** yes.
- **Formula:** base input.
- **Dependencies:** none.
- **Output/derived metrics affected:** `htk`, `effectiveDamage`, `edpt`, `ttk`.
- **Weight/value interpretation:** `CORE_STAT_WEIGHTS` says 1.0 HP; `NORMALIZED_WEIGHTS` / `DEFAULT_CONFIG` say 5.0 HP — `INCONSISTENT`.
- **Validation method:** Monte Carlo; `getStatWeight()` returns `1.0` because `CORE_STAT_WEIGHTS` is checked first.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `INCONSISTENT`.

#### `htk` — Hits to Kill (pure)

- **Meaning:** HP / Damage; hits needed if every hit lands for base damage.
- **Unit:** hits.
- **Design purpose:** linking HP and Damage to a feel target.
- **Baseline value:** 4 (validated) or 4.2 (config default).
- **Configurable parameter:** yes in UI (derived, lockable).
- **Formula:** `hp / damage`.
- **Dependencies:** `hp`, `damage`.
- **Output/derived metrics affected:** `attacksPerKo`.
- **Weight/value interpretation:** 0 (derived).
- **Validation method:** must match `hp / damage` exactly.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `CURRENT IMPLEMENTATION` for formula; `INCONSISTENT` for baseline value.

### 3.2 Hit chance stats

#### `txc` — Tiro x Colpire / Accuracy

- **Meaning:** attack accuracy rating.
- **Unit:** flat points.
- **Design purpose:** convert to hit chance.
- **Baseline value:** 25.
- **Configurable parameter:** yes.
- **Formula:** base input.
- **Dependencies:** none.
- **Output/derived metrics affected:** `hitChance`.
- **Weight/value interpretation:** `CORE_STAT_WEIGHTS` 2.0 HP; `NORMALIZED_WEIGHTS` 2.0 HP; consistent.
- **Validation method:** symmetric 1v1; +1 TxC ≈ +1% hit.
- **Scenario modifiers:** context multipliers in scenarios (e.g. Swarm 0.9).
- **Scope:** universal.
- **Status:** `CURRENT IMPLEMENTATION`.

#### `evasion` — Avoidance

- **Meaning:** subtracts from enemy TxC.
- **Unit:** flat points.
- **Design purpose:** defense through miss chance.
- **Baseline value:** 0.
- **Configurable parameter:** yes.
- **Formula:** base input.
- **Dependencies:** none.
- **Output/derived metrics affected:** `hitChance`.
- **Weight/value interpretation:** `CORE_STAT_WEIGHTS` 4.0 HP; `NORMALIZED_WEIGHTS` 4.0 HP; consistent.
- **Validation method:** symmetric 1v1.
- **Scenario modifiers:** context multipliers.
- **Scope:** universal.
- **Status:** `CURRENT IMPLEMENTATION`.

#### `baseHitChance`

- **Meaning:** hit chance when `txc == evasion`.
- **Unit:** percentage points.
- **Design purpose:** global accuracy tuning knob.
- **Baseline value:** 50.
- **Configurable parameter:** yes.
- **Formula:** base input.
- **Dependencies:** none.
- **Output/derived metrics affected:** `hitChance`.
- **Weight/value interpretation:** 0 (config-only parameter).
- **Validation method:** determines neutral hit curve.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `CURRENT IMPLEMENTATION`.

#### `hitChance`

- **Meaning:** final probability to land a hit.
- **Unit:** percentage (0-100).
- **Design purpose:** UX + combat output.
- **Baseline value:** 75%.
- **Configurable parameter:** derived; can be locked and reverse-solved.
- **Formula (config/UI):** `txc - evasion + baseHitChance`.
- **Formula (combat engine, `CriticalModule`):** weighted average of normal/crit/fail hit chances, each clamped 0-100.
- **Dependencies:** `txc`, `evasion`, `baseHitChance`, `critChance`, `critTxCBonus`, `failChance`, `failTxCMalus`.
- **Output/derived metrics affected:** `edpt`, `attacksPerKo`.
- **Weight/value interpretation:** 0 (derived).
- **Validation method:** expected damage per turn must equal `damage * hitChance/100` in the simple model.
- **Scenario modifiers:** scenario effectiveness multipliers.
- **Scope:** universal.
- **Status:** `INCONSISTENT` (simple config formula vs full `CriticalModule` weighted hit chance).

> **Important:** `CriticalModule.calculateEffectiveHitChance` treats `crit` and `fail` as separate attack outcomes that each have their own hit probability. This affects both damage and hit chance. The config-level `hitChance` formula does not capture this.

#### `attacksPerKo`

- **Meaning:** average number of attack attempts to knock out a target.
- **Unit:** attacks.
- **Design purpose:** feel target (e.g. "about 6 rounds").
- **Baseline value:** 5.33 (validated) or 5.3 (config default).
- **Configurable parameter:** derived; can be locked.
- **Formula (config):** `htk / hitChance` — but this is dimensionally wrong if `hitChance` is a percentage (4.2 / 75 = 0.056, not 5.3).
- **Formula (likely intended):** `htk / (hitChance / 100)` gives `4.2 / 0.75 = 5.6`, still not 5.3.
- **Formula (combat engine, `CriticalModule`):** `htkPure / (effectiveHitChance/100 * avgDmgMult)`.
- **Dependencies:** `htk`, `hitChance`, `critChance`, `critMult`, `failChance`, `failMult`.
- **Output/derived metrics affected:** `ttk` indirectly.
- **Weight/value interpretation:** 0 (derived).
- **Validation method:** Monte Carlo average rounds to KO.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `INCONSISTENT` (config formula vs engine formula vs displayed default).

### 3.3 Critical stats

#### `critChance`

- **Meaning:** probability of a critical hit.
- **Unit:** percentage (0-100).
- **Design purpose:** burst / variance.
- **Baseline value:** 5.
- **Configurable parameter:** yes.
- **Formula:** base input.
- **Dependencies:** none.
- **Output/derived metrics affected:** `hitChance` (via `CriticalModule`), `edpt`.
- **Weight/value interpretation:** `CORE_STAT_WEIGHTS` 4.0 HP; `NORMALIZED_WEIGHTS` 4.0 HP.
- **Validation method:** Monte Carlo.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `CURRENT IMPLEMENTATION`.

#### `critMult`

- **Meaning:** damage multiplier on critical hit.
- **Unit:** multiplier.
- **Design purpose:** burst magnitude.
- **Baseline value:** 2.
- **Configurable parameter:** yes.
- **Formula:** base input.
- **Dependencies:** none.
- **Output/derived metrics affected:** `edpt`.
- **Weight/value interpretation:** `NORMALIZED_WEIGHTS` 10.0 HP per 0.1 mult.
- **Validation method:** Monte Carlo.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `CURRENT IMPLEMENTATION`.

#### `critTxCBonus`

- **Meaning:** accuracy bonus on a crit attempt.
- **Unit:** flat points.
- **Design purpose:** crits are harder to confirm but more rewarding.
- **Baseline value:** 20.
- **Configurable parameter:** yes.
- **Formula:** base input.
- **Dependencies:** none.
- **Output/derived metrics affected:** `hitChance` (via `CriticalModule`).
- **Weight/value interpretation:** `NORMALIZED_WEIGHTS` 1.0 HP.
- **Validation method:** expected DPS.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `CURRENT IMPLEMENTATION`.

#### `failChance`, `failMult`, `failTxCMalus`

- **Meaning:** mirror critical stats for failed attacks.
- **Unit:** percentage / multiplier / flat points.
- **Design purpose:** negative variance; used as penalty stats.
- **Baseline value:** 0 / 0 / 20 (config); 5 / 0 / 20 (validated baseline).
- **Configurable parameter:** yes.
- **Formula:** base inputs.
- **Dependencies:** none.
- **Output/derived metrics affected:** `hitChance`, `edpt`.
- **Weight/value interpretation:** `isPenalty` / `isDetrimental` flags.
- **Validation method:** symmetric 1v1.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `INCONSISTENT` (baseline failChance 5 vs config default 0).

### 3.4 Mitigation stats

#### `ward` — Flat shield

- **Meaning:** one-time flat damage absorption.
- **Unit:** HP.
- **Design purpose:** buffer damage.
- **Baseline value:** 0.
- **Configurable parameter:** yes.
- **Formula:** base input.
- **Dependencies:** none.
- **Output/derived metrics affected:** `effectiveDamage` (config formula) but **not** `MitigationModule`.
- **Weight/value interpretation:** `NORMALIZED_WEIGHTS` 1.5 HP per ward point; `CORE_STAT_WEIGHTS` 1.5 HP.
- **Validation method:** effective HP.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `INCONSISTENT` (config formula uses ward, `MitigationModule` ignores it).

#### `armor` — Percentage physical reduction

- **Meaning:** damage mitigation using PoE-style formula.
- **Unit:** points (not directly a %).
- **Design purpose:** non-linear damage reduction.
- **Baseline value:** 0.
- **Configurable parameter:** yes.
- **Formula (config/registry):** stale `armor / (armor + 50)` in `registry.ts` description.
- **Formula (actual engine, `MitigationModule` & `MathEngine`):** `effArmor / (effArmor + 10 * rawDamage)`, capped at 90%.
- **Dependencies:** `rawDamage`, `armorPen`, `configFlatFirst`.
- **Output/derived metrics affected:** `effectiveDamage`, `edpt`, `ttk`.
- **Weight/value interpretation:** `CORE_STAT_WEIGHTS` 2.8 HP; `NORMALIZED_WEIGHTS` 5.0 HP — `INCONSISTENT`.
- **Validation method:** EHP vs baseline.
- **Scenario modifiers:** scenario effectiveness multipliers.
- **Scope:** universal.
- **Status:** `INCONSISTENT` (registry description vs engine formula vs weights).

#### `resistance` — Percentage magical reduction

- **Meaning:** percentage damage reduction.
- **Unit:** percentage (0-100).
- **Design purpose:** secondary mitigation type.
- **Baseline value:** 0.
- **Configurable parameter:** yes.
- **Formula:** `effectiveRes = max(0, resistance - penPercent)`, then `damage *= (1 - effectiveRes / 100)`.
- **Dependencies:** `penPercent`, `configFlatFirst`.
- **Output/derived metrics affected:** `effectiveDamage`, `edpt`, `ttk`.
- **Weight/value interpretation:** `CORE_STAT_WEIGHTS` 100 HP; `NORMALIZED_WEIGHTS` 5.0 HP — `INCONSISTENT`.
- **Validation method:** EHP.
- **Scenario modifiers:** scenario effectiveness multipliers.
- **Scope:** universal.
- **Status:** `INCONSISTENT` (weights differ by 20x).

#### `armorPen` — Flat armor ignored

- **Meaning:** subtracts from enemy `armor` before mitigation.
- **Unit:** points.
- **Design purpose:** counter armor.
- **Baseline value:** 0.
- **Configurable parameter:** yes.
- **Formula:** `effectiveArmor = max(0, armor - armorPen)`.
- **Dependencies:** `armor`.
- **Output/derived metrics affected:** `effectiveDamage`.
- **Weight/value interpretation:** `CORE_STAT_WEIGHTS` 1.5 HP; `NORMALIZED_WEIGHTS` 1.5 HP; consistent.
- **Validation method:** EHP comparison.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `CURRENT IMPLEMENTATION`.

#### `penPercent` — Percentage resistance ignored

- **Meaning:** subtracts from enemy `resistance` before mitigation.
- **Unit:** percentage.
- **Design purpose:** counter resistance.
- **Baseline value:** 0.
- **Configurable parameter:** yes.
- **Formula:** `effectiveRes = max(0, resistance - penPercent)`.
- **Dependencies:** `resistance`.
- **Output/derived metrics affected:** `effectiveDamage`.
- **Weight/value interpretation:** `CORE_STAT_WEIGHTS` 80 HP; `NORMALIZED_WEIGHTS` 80 HP; consistent.
- **Validation method:** EHP comparison.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `CURRENT IMPLEMENTATION`.

#### `effectiveDamage`

- **Meaning:** damage after mitigation.
- **Unit:** HP.
- **Design purpose:** UX + derived metric.
- **Baseline value:** 25 or 35.7.
- **Configurable parameter:** derived; can be locked.
- **Formula (config/UI):** `damage * (1 - armor/100) - ward`.
- **Formula (combat engine):** `MitigationModule.calculateEffectiveDamage(...)` uses PoE armor formula and resistance, **does not subtract ward**.
- **Dependencies:** `damage`, `armor`, `resistance`, `armorPen`, `penPercent`, `ward` (config only), `configFlatFirst`.
- **Output/derived metrics affected:** `ttk`, `edpt`.
- **Weight/value interpretation:** 0 (derived).
- **Validation method:** must match engine.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `INCONSISTENT` (config formula vs engine formula; ward handling).

### 3.5 Sustain stats

#### `lifesteal`

- **Meaning:** % of damage dealt returned as HP.
- **Unit:** percentage.
- **Design purpose:** sustain through offense.
- **Baseline value:** 0.
- **Configurable parameter:** yes.
- **Formula:** heal per hit = `damageDealt * lifesteal / 100`.
- **Dependencies:** damage dealt.
- **Output/derived metrics affected:** `ttk` of defender.
- **Weight/value interpretation:** `CORE_STAT_WEIGHTS` 800 HP; `NORMALIZED_WEIGHTS` 100 HP — `INCONSISTENT`.
- **Validation method:** Monte Carlo TTD.
- **Scenario modifiers:** scenario multipliers.
- **Scope:** universal.
- **Status:** `INCONSISTENT` (weights differ 8x).

#### `regen`

- **Meaning:** HP recovered per turn.
- **Unit:** HP/turn.
- **Design purpose:** sustain independent of damage.
- **Baseline value:** 0.
- **Configurable parameter:** yes.
- **Formula:** added at start of turn; `MathEngine.calcEDPT` subtracts `defStats.regen` from final damage.
- **Dependencies:** none.
- **Output/derived metrics affected:** `edpt`, `ttk`.
- **Weight/value interpretation:** `CORE_STAT_WEIGHTS` 2000 HP; `NORMALIZED_WEIGHTS` 20 HP — `INCONSISTENT` (100x).
- **Validation method:** Monte Carlo TTD.
- **Scenario modifiers:** scenario multipliers.
- **Scope:** universal.
- **Status:** `INCONSISTENT` (weights).

### 3.6 Combat metrics

#### `ttk` — Time to Kill

- **Meaning:** turns to defeat target.
- **Unit:** turns.
- **Design purpose:** feel target (e.g. 6-8 turns).
- **Baseline value:** 4 (validated) or 4 (config default).
- **Configurable parameter:** derived; can be locked.
- **Formula (config/UI):** `hp / effectiveDamage`.
- **Formula (engine):** depends on `MathEngine.calcEDPT` which includes crit, hit chance, mitigation, regen.
- **Dependencies:** `hp`, `effectiveDamage`, `edpt`.
- **Output/derived metrics affected:** none.
- **Weight/value interpretation:** 0 (derived).
- **Validation method:** Monte Carlo average.
- **Scenario modifiers:** scenario `targetTurns` (1v1=8, boss=11, group=9, swarm=7).
- **Scope:** universal.
- **Status:** `INCONSISTENT` (config simplified vs engine full).

#### `edpt` — Effective Damage Per Turn

- **Meaning:** average damage output per turn.
- **Unit:** HP/turn.
- **Design purpose:** DPS metric.
- **Baseline value:** 18.75 (validated) or 37.5 (config default).
- **Configurable parameter:** derived; can be locked.
- **Formula (config/UI):** `effectiveDamage * hitChance / 100`.
- **Formula (engine, `MathEngine.calcEDPT`):**
  1. `rawDamagePerHit = damage * averageDamageMultiplier(crit/fail)`
  2. `expectedHits = effectiveHitChance / 100`
  3. `rawDamagePerTurn = rawDamagePerHit * expectedHits`
  4. `mitigatedDamage = MitigationModule.calculateEffectiveDamage(rawDamagePerTurn, ...)`
  5. `finalDamage = max(0, mitigatedDamage - regen)`
- **Dependencies:** many.
- **Output/derived metrics affected:** `ttk`, `earlyImpact`.
- **Weight/value interpretation:** 0 (derived).
- **Validation method:** Monte Carlo average DPT.
- **Scenario modifiers:** scenario effectiveness multipliers.
- **Scope:** universal.
- **Status:** `INCONSISTENT` (config simplified vs engine full).

#### `earlyImpact`

- **Meaning:** damage in first 3 turns.
- **Unit:** HP.
- **Design purpose:** burst metric.
- **Baseline value:** 56.25 (validated) or 112.5 (config default).
- **Configurable parameter:** derived.
- **Formula:** `edpt * 3`.
- **Dependencies:** `edpt`.
- **Output/derived metrics affected:** none.
- **Weight/value interpretation:** 0 (derived).
- **Validation method:** must match `edpt * 3`.
- **Scenario modifiers:** none.
- **Scope:** universal.
- **Status:** `CURRENT IMPLEMENTATION` for formula; depends on `edpt` status.

---

## 4. Weight source-of-truth conflict

There are at least two active weight tables:

| Stat | `CORE_STAT_WEIGHTS` | `NORMALIZED_WEIGHTS` | Notes |
|------|---------------------|----------------------|-------|
| damage | 1.0 | 5.0 | Which one is canonical? |
| txc | 2.0 | 2.0 | OK |
| critChance | 4.0 | 4.0 | OK |
| evasion | 4.0 | 4.0 | OK |
| armor | 2.8 | 5.0 | Large gap |
| resistance | 100.0 | 5.0 | 20x gap |
| armorPen | 1.5 | 1.5 | OK |
| penPercent | 80.0 | 80.0 | OK |
| lifesteal | 800.0 | 100.0 | 8x gap |
| regen | 2000.0 | 20.0 | 100x gap |
| ward | 1.5 | 1.5 | OK |
| block | 80.0 | 80.0 | OK |

`getStatWeight()` checks `CORE_STAT_WEIGHTS` first, so `damage` resolves to 1.0 for consumers. This means `DEFAULT_CONFIG` `damage` weight 5.0 and `NORMALIZED_WEIGHTS` 5.0 are ignored in `calculateItemPower`.

**Decision required:** choose one canonical weight source. If `CORE_STAT_WEIGHTS` is the empirical calibration, the config/UI should reflect it. If `NORMALIZED_WEIGHTS` is the gameplay target, the code should use it consistently.

---

## 5. Spell balancing

### 5.1 Spell stats

`spellStatDefinitions.ts` defines the canonical stat categories:

| Category | Stats |
|----------|-------|
| Core | `effect`, `eco`, `dangerous` |
| Advanced | `scale`, `precision` |
| Optional | `aoe`, `cooldown`, `range`, `priority`, `manaCost` |

`spellTypes.ts` defines the runtime `Spell` interface. There is a second `SpellDefinition` in `src/spells/config/types.ts` for a different spell creator (D&D-style fields: school, level, components, duration, baseDamage, scaling, areaOfEffect, saveDC). This is a **structural duplication** that needs reconciliation or explicit scoping.

### 5.2 Spell power (`SpellCostModule`)

`SpellCostModule.calculateSpellPower` is the current implementation. Key behaviors:

- `effect` is treated as percentage of base damage/heal (`100 = base attack`).
- `eco > 1` spreads the effect over `eco` turns (DoT/HoT) and uses `DotModule`.
- Direct heal uses `hp` weight; direct damage uses `damage` weight.
- `shield` uses `hp` weight.
- `buff`/`debuff` uses a mock `Buff` with `stat: 'damage'` and multiplicative mode.
- `cc` uses `damage` weight × 3.0.
- AoE multiplier is hard-coded per target count (`0.8`, `0.6`, `0.5` per target).
- `dangerous` is used as a reliability multiplier: `(dangerous || 100) / 100`.

**Status:** `CURRENT IMPLEMENTATION` but many formulas are likely `EXPERIMENTAL / TEST` or `DECISION REQUIRED`:

- DoT/HoT total value uses `DotModule` (needs review).
- AoE curve is hard-coded; user wants it configurable globally.
- `dangerous` semantic mismatch: the field is described as "risk" but used as a straight power multiplier.
- Mana cost uses `baseDamagePerMana = 2.0`, type efficiency table, cooldown factor, cast time penalty.

### 5.3 Spell budget terminology

Per user constraint: use **"budget"**, not "danger budget", "power cost", "rarity", "spell budget", etc.

- `budget = 0` = standard/average spell construction reference.
- Positive = above reference.
- Negative = below reference.
- It measures deviation from a standard construction, not character level or rarity.

Current code has `SpellCostModule` (power/cost) and a `calculateBalance()` style in `SpellCreation.tsx` / `SpellCreatorNew.tsx` (ticks vs target budget). These are conceptually different and need to be explicitly separated or unified.

---

## 6. Scenario model

`DEFAULT_CONFIG.targetTurns`:

| Scenario | targetTurns | scenarioBudget hpEq/damageEq |
|----------|-------------|------------------------------|
| 1v1 | 8 | 150 / 35.7 |
| boss | 11 | 220 / 45.0 |
| group | 9 | 180 / 40.0 |
| swarm | 7 | 120 / 30.0 |

`ScenarioSimulationRunner` currently uses `expectedTurns` as a turn limit but does not construct true multi-enemy encounters from `enemyCount` and `enemyAvgHP`.

**Status:** `CURRENT IMPLEMENTATION` for contextual multipliers; `DECISION REQUIRED` for real encounter simulation.

---

## 7. P0 inconsistencies to resolve before balance changes

1. **Canonical baseline:** choose between `baseline.ts` 100/25/4 and `DEFAULT_CONFIG` 150/35.7/4.2.
2. **Canonical weight source:** reconcile `CORE_STAT_WEIGHTS` vs `NORMALIZED_WEIGHTS` vs `DEFAULT_CONFIG` weights.
3. **`attacksPerKo` formula:** config `htk / hitChance` is dimensionally wrong; engine formula is `htk / (effectiveHitChance/100 * avgDmgMult)`.
4. **`effectiveDamage` formula:** config `damage * (1 - armor/100) - ward` does not match engine PoE formula and ignores ward.
5. **`ward` is not used by `MitigationModule`.**
6. **`registry.ts` armor description** uses stale `armor / (armor + 50)` instead of engine formula `armor / (armor + 10 * damage)`.
7. **`hitChance`:** config formula is simple; engine formula includes crit/fail weighted hit chance.
8. **`ttk` / `edpt`:** config simplified formulas diverge from `MathEngine.calcEDPT`.
9. **`damage` weight:** `CORE_STAT_WEIGHTS` 1.0 vs config 5.0.
10. **`resistance`, `lifesteal`, `regen` weights** differ wildly between tables.
11. **Spell stat duplication** between `balancing/spellTypes.ts` and `spells/config/types.ts`.
12. **AoE curve** is hard-coded; user wants configurable global curve.
13. **`dangerous` semantics** in `SpellCostModule` do not match description.
14. **Scenarios** are contextual multipliers, not true encounter simulations.

---

## 8. Proposed next steps

1. **Baseline decision:** confirm whether the canonical neutral baseline is 100/25/4 (validated) or 150/35.7/4.2 (current UI default).
2. **Weight reconciliation:** choose `CORE_STAT_WEIGHTS` or `NORMALIZED_WEIGHTS` as canonical; align `getStatWeight` and config defaults.
3. **Formula alignment:** make config/UI derived formulas point to the same functions used by `MathEngine` / `CriticalModule` / `MitigationModule` (or document them as deliberate approximations).
4. **Ward handling:** decide whether ward is a flat DR applied in `MitigationModule` or a separate shield layer.
5. **Spell power audit:** finish reviewing `DotModule`, `BuffModule`, AoE curve, mana cost, `dangerous`.
6. **Scenario model:** design real encounter tests for swarm/boss/group.
7. **Update this document** with decisions and mark entries as `CANONICAL DESIGN` or `CURRENT IMPLEMENTATION`.

---

## 9. Source references

- `src/balancing/baseline.ts` — validated baseline and simulation metadata.
- `src/balancing/config/defaultConfig.ts` — UI/shipping defaults and derived formulas.
- `src/balancing/config/balancer-default-config.json` — serialized store defaults.
- `src/balancing/types.ts` — `StatBlock` / `DEFAULT_STATS`.
- `src/balancing/balancingConfig.ts` — legacy constants.
- `src/balancing/registry.ts` — parameter registry with stale armor description.
- `src/balancing/modules/critical.ts` — full crit/fail hit chance and damage multiplier.
- `src/balancing/modules/mitigation.ts` — actual mitigation engine (PoE formula, no ward).
- `src/balancing/1v1/mathEngine.ts` — `calcEDPT` and `calcEHPReference`.
- `src/balancing/config/ConfigSolver.ts` — dependency graph, topological recompute, reverse solve.
- `src/balancing/statWeights.ts` — two conflicting weight tables and `getStatWeight`.
- `src/balancing/modules/spellcost.ts` — spell power, mana cost, tier mapping.
- `src/balancing/spellTypes.ts` and `src/balancing/spellStatDefinitions.ts` — old spell model.
- `src/spells/config/types.ts` and `src/spells/config/defaultSpellConfig.ts` — new spell config model.
