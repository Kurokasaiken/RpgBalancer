# Balancer System Discussion Reference

## Context

- Source: strategy session (Jan 11, 2026) between Fausto and Cascade Strategist.
- Goal: define a self-balancing RPG framework where every stat, action, spell, weapon, and defense is valued in **turns** (TTK/TTD) and converted to HP-equivalent weights.
- Scope delimits 1v1 baseline first (~8 turns desired), then extends to boss, group, and swarm scenarios using the same modules.

## Core Principles

1. **Turns as Currency** – everything is evaluated by how it changes average combat duration. Baseline 1v1 vs equal-level opponent should last ~8 turns; other scenarios inherit from this.
2. **Single Source of Truth** – stats, weights, formulas live in config (`defaultConfig.ts`, `balancer-default-config.json`, `statWeights.ts`) and derived modules (`src/balancing/modules/*`).
3. **Modular Calculations** – hit chance, criticals, mitigation, sustain, risk, cooldown/mana, AoE/DOT/HoT, anti-crit, anti-CC, reflection, etc. each live in dedicated modules whose outputs are aggregated.
4. **Deterministic Expectations** – randomness (crit, fail, DOT ticks) is treated as expected value so designers can see immediate effects before Monte Carlo validation.
5. **Trade-off Visibility** – investing in mana, cooldown, AoE, or sustain must have explicit cost multipliers expressed in turns/HP_eq to keep choice parity.

## Required Modules & Outputs

| Module | Inputs | Outputs (all in HP_eq or turns) |
| --- | --- | --- |
| Core Damage | hp, damage | `htk`, baseline EDPT |
| Hit & Accuracy | txc, evasion, baseHitChance | `hitChance`, `attacksPerKo` |
| Critical & Fail | critChance, critMult, critTxCBonus, failChance, failMult | `expectedDamagePerHit`, crit-adjusted EDPT |
| Mitigation & Pen | DR (ex Ward), armor, resistance, armorPen, penPercent | `effectiveDamageDealt`, `effectiveDamageTaken` |
| Sustain | lifesteal, regen, shield regen | `hpRecoveredPerTurn`, sustain-adjusted TTD |
| Early/Late Impact | edpt, configurable turn windows | burst/attrition metrics |
| Resource & Tempo | manaCost, manaPool, regen, cooldown, priority | `usableTurns`, EDPT scaling factors |
| Risk/Drawback | selfDamage, miscastChance, extraDamageTaken | `riskAdjustedEDPT` |
| Defensive Specials | antiCrit, antiCC, damageReflection, ccResistance | `damagePrevented`, `ttdModifiers` |
| AoE / DOT / Multi-hit | aoeTargets, eco, duration, tickDamage | distribution multipliers for EDPT |

## Aggregation Targets

1. **TTK (Turns to Kill)** = defender.hp / (Σ offensive module EDPT − defender.hpRecoveredPerTurn)  
2. **TTD (Turns to Die)** = attacker.hp / (Σ defender offensive EDPT − attacker.hpRecoveredPerTurn)  
3. **Average Combat Duration** = (TTK + TTD) / 2  
4. **Balance Score** = Σ(statWeight × selectedTickWeight) compared to scenario budget.

All downstream features (spell creator, weapons, armor, racial perks) must consume these modules so that editing any config value reverberates across TTK/TTD without bespoke math.

## Next Actions (High Level)

1. Finalize module schema + formulas in config/JSON for 1v1 baseline.
2. Encode scenario targets (1v1, boss, group, swarm) so other modules inherit desired turn lengths.
3. Extend spell/weapon configs to reference module outputs (effect, AoE, DOT, mana, cooldown) instead of ad-hoc interpretations.
4. Validate via Monte Carlo + WeightCalibration to ensure HP_eq weights match empirical 50% win rate.

This document should accompany future plans/tasks so every change can be traced back to the balancing philosophy captured here.
