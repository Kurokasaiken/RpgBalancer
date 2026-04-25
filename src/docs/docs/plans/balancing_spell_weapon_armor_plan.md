# Balancing & Spell/Weapon/Armor System – Implementation Plan

## 1. Scope & Goals
- Align entire combat economy (stats, spell, weapon, armor, equip) to the TTK/TTD currency.
- Achieve deterministic recalculation when any config (weights, formulas, baselines) changes.
- Target average 1v1 combat duration: ~8 turns.
- Enforce single source of truth: config → modules → balancer → UI.

## 2. Non-Negotiable Principles Mapping
1. **HP + Turns Currency**
   - All module outputs expressed in HP_eq or Turn_eq. Extend `spellBalancingConfig`, `weaponConfig`, `armorConfig` with HP_eq weights (default 0 allowed).
   - Monte Carlo + CombatPredictor remain validation layers.
2. **No Isolated Formulas**
   - New modules must import shared helpers (HitChanceModule, MitigationModule, etc.). No duplicate math.
3. **Player/Spell/Weapon/Armor Parity**
   - Core formulas (EDPT, EID, SustainPT) shared by SpellEffectModule, WeaponModule, ArmorModule.
4. **Average-Based**
   - Crit/Hit/Fail handled as expected values per turn (existing CombatPredictor pattern).
5. **Modular & Config-First**
   - Each new logical block = standalone module under `src/balancing/modules/` with schema in `src/balancing/config/` and documented weights in JSON.

## 3. Existing Modules & Gaps
| Module | Status | Gap vs Spec |
|--------|--------|-------------|
| CoreStatsModule | ✅ | Already covers HP/Damage. Needs hooks for new stat range. |
| HitChance/Critical/Mitigation/Sustain | ✅ | Must expose helper functions to SpellEffectModule & WeaponModule. |
| CombatMetrics + CombatPredictor | ✅ | Need to ingest new spell/weapon outputs to keep TTK/TTD target (8 turns). |
| SpellCostModule | ✅ (cost) | Lacks SpellEffect/Special handling per spec. No Range-of-damage stat. |
| Impact/Resource/Risk | ✅ (Phase10) | Provide early-impact, economy metrics used by SpellEconomyModule. |
| DefenseSpecials | ✅ | Serves ArmorModule; needs config for DR_flat/DR_percent/dodge/crit resist/CC resist. |
| UI SpellCreator | ✅ baseline | Needs effect range stat control, special/trigger builder, cost display in HP_eq/TTK. |

## 4. Modules to Implement / Extend
### 4.1 SpellEffectModule (new)
- **Responsibility**: Compute `spellEffectiveDamagePerTurn`, `spellHealingPerTurn`, `spellHPEquivalent` using average hit/crit/dangerous.
- **Inputs**: Damage base, effect%, scale, precision, dangerous, eco, AoE, special mode.
- **Dependencies**: HitChanceModule, CriticalModule, DotModule, BuffModule, ImpactModule (for EarlyImpact), ResourceModule (for SpellEconomy interactions).
- **Config**: `spellEffectConfig.json` with weights for each stat tick, including `damageRange profiles` (min/max multipliers, default weight 0 but configurable).

### 4.2 SpellEconomyModule (new)
- **Responsibility**: Model mana usage, cooldown, cast frequency. Output `spellUsageRate`, `effectiveSpellContributionToDPS`.
- **Inputs**: Mana pool, mana regen, cooldown, cast time, `SpellEffectModule` output.
- **Dependencies**: ResourceModule (tempo curves), persistence via balancing config.
- **Config**: `spellEconomyConfig.json` (cooldown penalty curves, mana-to-turn conversion baseline 2 HP/mana, adjustable).

### 4.3 WeaponModule (new)
- **Responsibility**: Map weapon stats to HP_eq contributions and grant spell hooks.
- **Inputs**: baseDamageModifier, attackSpeed, critChance, critMultiplier, armorPen, weaponSpells[].
- **Outputs**: `weaponDPSContribution`, `weaponTTKDelta`, aggregated `weaponSpellEffect`. Wraps SpellEffectModule for `weaponSpells`.
- **Dependencies**: SpellEffectModule, SpellEconomyModule, CombatMetrics for TTK delta.
- **Config**: `weaponBalancingConfig.json` (weights for attack speed, crit, etc.).

### 4.4 ArmorModule (new)
- **Responsibility**: Convert DR_flat, DR_percent, dodge, crit resist, CC resist into `effectiveIncomingDamage` and `TTDDelta`.
- **Dependencies**: MitigationModule, DefenseSpecialsModule.
- **Config**: `armorBalancingConfig.json` mapping each stat to HP_eq/Turn_eq.

### 4.5 SpecialMechanicsModule (new)
- **Responsibility**: Evaluate Modality, Dual, Conditional, Triggered, Passive, Counter patterns.
- **Inputs**: Definitions from `specialMechanicsConfig.json` (catalog with phase hooks, activation probabilities, penalty curves).
- **Outputs**: `effectUptime`, `expectedActivationRate`, `finalEffectMultiplier` to feed SpellEffectModule/WeaponModule.
- **Dependencies**: Trigger/Conditional catalogs (previous plan), Combat timeline hooks.

## 5. Spell Creation Stat Additions
1. **Effect Type**: already enumerated (Damage, Healing, Shield, Buff, Debuff, Reflect; Summon previsto ma **placeholder disabilitato** finché il modulo non sarà completato).
2. **Effect Parameters**: `effect`, `eco`, `scale`, `aoe`, `precision`, `dangerous`, **NEW** `damageRange` (min%, max%, slider mostrato ma disabilitato finché il modulo range non è implementato), `manaCost`, `cooldown`, `priority`, `range`/`movement` (placeholder disabilitato).
3. **Special**: None, Modal (A OR B), Dual (A AND B), Conditional, Triggered, Passive, Counter gestiti da SpecialMechanicsModule.
4. **UI**:
   - Add range slider pair (min/max) visibile ma non interattivo; tooltips spiegano che il valore è definito in config e attivabile quando il modulo Range entra in produzione.
   - Special builder referencing catalogs (trigger/conditional doc). Tooltip includes HP_eq cost.

### 5.1 Status Slider Mapping (esempio Stun)
- **Config JSON**:
  ```json
  "stun": {
    "ticks": [
      {"duration": 0, "chance": 0, "weight": 0},
      {"duration": 1, "chance": 50, "weight": 1},
      {"duration": 2, "chance": 50, "weight": 2},
      {"duration": 3, "chance": 100, "weight": 3}
    ]
  }
  ```
- **Formula**:
  ```
  EffectiveTurnReduction = stunDuration * stunChance
  TTKReductionFromStun = EffectiveTurnReduction * expectedDamagePerTurn
  ```
  dove `expectedDamagePerTurn` proviene da SpellEffectModule; il contributo in turni equivalenti viene sommato nel `StatusModule`.
- **Extensions**: scaling su stat del caster, AoE stun (somma per target), gestione immunità/stacking tramite StatusEffectManager.

## 6. Formulas (Codified)
- Damage per Turn (EDPT): `BaseDamage * HitChance * CritMultiplierAvg * SpellMultiplier * WeaponMultiplier`.
- Effective Incoming Damage (EID): `IncomingDamage * (1 - DR%) - DR_flat`, then `* (1 - Dodge)` and `* CritResistFactor`.
- Sustain per Turn: `Regen + LifestealFlat * AttacksPerTurn`.
- TTK/TTD: `TTK = EnemyHP / EDPT`, `TTD = OwnHP / (EID - SustainPT)` (clamp dtps > 0).
- Combat Duration: `CombatTurns = (TTK + TTD) / 2`, target ≈ 8.
- Modal penalty: `max(effectA, effectB) * modalPenalty` (config-defined).
- Dual penalty: `(effectA + effectB) * dualPenalty`.
- Conditional multiplier: `baseEffect * probability(conditionId)` defined in catalog.
- Trigger multiplier: `baseEffect * expectedTriggersPerFight` from trigger catalog (phase-specific).

### 6.1 Turn-Equivalent Aggregation Model
- **Unità comune**: ogni stat/effect lavora in **Turn_eq (HP_eq)**. I moduli traducono sempre gli input in `deltaTTK` o `deltaTTD` sommabili.
- **Catena dati**:
  ```ts
  interface StatConfig {
    name: string;
    type: 'offense' | 'defense' | 'sustain' | 'status';
    baseValue: number;
    weight: number;
    min: number;
    max: number;
    step: number;
    module: 'HitChanceModule' | 'CriticalModule' | 'MitigationModule' | 'SustainModule' | 'StatusModule' | 'SpellModule' | string;
  }
  ```
  Gli slider/ticks in Spell/Weapon/Armor Editor leggono `weight` e `step`, mentre il `module` indirizza automaticamente la stat verso il calcolatore corretto.
- **Stack modulare**:

  | Module | Stat driver | Output (turn-equivalent) |
  | --- | --- | --- |
  | `HitChanceModule` | precision, evasion | `deltaTTK_hit` / `deltaTTD_hit` |
  | `CriticalModule` | critChance, critMult | `deltaTTK_crit` |
  | `MitigationModule` | armor, DR, resist | `deltaTTK_mit` / `deltaTTD_mit` |
  | `SustainModule` | regen, lifesteal | `deltaTTD_sustain` |
  | `StatusModule` | stun, silence, DoT, HoT, debuff | `deltaTTK_status` / `deltaTTD_status` |
  | `SpellModule` (SpellEffect+Economy) | spell stats, AoE, special eco | `deltaTTK_spell` / `deltaTTD_spell` |

- **Somma finale**:
  ```
  TTK_total = baseTTK
            - deltaTTK_hit
            - deltaTTK_crit
            - deltaTTK_mit
            - deltaTTK_status
            - deltaTTK_spell
            ± altri deltaTTK (weapon specials, counter, ecc.)

  TTD_total = baseTTD
            + deltaTTD_sustain
            - deltaTTD_status
            + deltaTTD_mit
            + deltaTTD_spell
            ± altri deltaTTD
  ```
  Tutti i delta sono già calibrati in turni equivalenti, quindi la somma è lineare e coerente tra moduli.
- **Esempi**:
  - *Stun*: `deltaTTK_status = stunTurns * targetAttacksPerTurn`.
  - *DoT*: `deltaTTK_status = Σ_tick(damagePerTick * hitChance / targetHP)`.
  - *Lifesteal/HoT*: `deltaTTD_sustain = Σ_tick(healPerTick / casterHP)` rispettando il TTD heal-cap.
- **Schema di flusso**:
  ```
  [Stat / Effect Input]
           │ (StatConfig.module)
           ▼
  [Modulo dedicato] ──► [deltaTTK / deltaTTD]
           │
           ▼
  [Aggregatore TTK_total / TTD_total]
           │
           ▼
  [CombatPredictor / MonteCarlo / UI previews]
  ```
  Aggiungere una nuova stat/effetto richiede solo: aggiornare `StatConfig`, implementare (o estendere) il modulo designato e lasciare che l’aggregazione centrale ne sommi i delta.

## 7. Data & Config Requirements
- `spellBalancingConfig.json`: extend with `effectTypeWeights`, `specialWeights`, `damageRangeProfiles`, `aoeProfiles`, `modalPenalty`, `dualPenalty`.
- `weaponBalancingConfig.json`: new file for weapon stat weights and allowed weaponSpells references.
- `armorBalancingConfig.json`: new file for DR_flat/DR_percent/dodge/crit resist/CC resist weights.
- `specialMechanicsConfig.json`: new file referencing trigger/condition catalogs for penalty/multiplier values.
- All config files loaded via `BalancerConfigStore` or dedicated stores using `PersistenceService` (no localStorage).

## 8. UI Integration (Spell/Weapon/Armor)
1. **SpellCreator**
   - Effect Range UI, Special builder, economy preview (mana usage per 8-turn fight).
   - Display HP_eq cost, SpellPower, recommended mana (SpellEconomyModule output).
2. **Weapon Editor (new)**
   - Similar stat grid referencing `weaponBalancingConfig`.
   - Show `weaponDPSContribution`, `TTK delta` preview.
3. **Armor Editor (new)**
   - Stats tied to `armorBalancingConfig`, preview `TTD delta` using CombatPredictor.
4. **Balancer UI**
   - Ensure card-based editor can manage new stats (range min/max, special config references) with drag/drop.

## 9. Dependencies & Order of Implementation
1. **Config & Schema Alignment**
   - Update `types.ts`, `schemas.ts`, default configs for spells, weapons, armor, specials.
   - Introduce catalogs (trigger/conditional) if not already merged.
2. **SpellEffectModule & SpellEconomyModule**
   - Foundation for SpellCreator + WeaponModule.
   - Add coverage tests (unit + integration with SpellCostModule).
3. **Spell Creator UI Enhancements**
   - Range slider, special builder, economy preview.
   - Tie into config-first tick weights.
4. **WeaponModule + Weapon UI**
   - Wrap Spell modules, ensure outputs feed CombatMetrics.
5. **ArmorModule + Armor UI**
   - Integrate with Mitigation/DefenseSpecials.
6. **SpecialMechanicsModule**
   - Evaluate triggers/conditionals, connect to Spell/Weapon modules.
7. **System Validation**
   - Monte Carlo scenario runner update to include new modules.
   - Ensure CombatTurns baseline ~8 with default config.
8. **Documentation & Tests**
   - Update `docs/BALANCING_SYSTEM.md`, new plan references, instructions for designers.

## 10. Testing & Safeguards
- **Unit Tests**: Each module (SpellEffect, SpellEconomy, Weapon, Armor, SpecialMechanics).
- **Integration**: SpellCreator flow → preview TTK/TTD; Weapon/Armor editors → CombatPredictor.
- **Monte Carlo**: Scenario runner verifying TTK ≈ 8 with baseline.
- **UI RTL**: Range sliders, special builder, weapon/armor editors.
- **Safeguard Commands**: `npm run lint -- src/balancing src/ui/spell src/ui/weapon src/ui/armor`, `npm run test -- spell-system`, `npm run build:check`, `npm run kanban:lint` with evidence logs.

## 11. Deliverables Checklist
- [ ] Updated configs (spell/weapon/armor/special).
- [ ] New modules implemented with JSDoc.
- [ ] UI components for spells/weapons/armor.
- [ ] Updated documentation + plan references.
- [ ] Automated tests covering formulas and UI interactions.
- [ ] Evidence logs for safeguards.

## 12. Out of Scope Confirmed
- Full Summoning implementation (stub only).
- Swarm/multi-target advanced logic.
- Positioning/AI behavior.
- Non-config persistence (must use PersistenceService).
