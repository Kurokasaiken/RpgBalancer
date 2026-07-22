---
title: Idle Village Gameplay Modifier Registry
description: Config-first specification for the unified GameplayStatId catalog, modifier schema, evaluation pipeline, and telemetry/testing guardrails.
---

## Table of Contents

1. [Vision & Scope](#vision--scope)
2. [Source Documents & Dependencies](#source-documents--dependencies)
3. [GameplayStatId Catalog](#gameplaystatid-catalog)
   - [3.1 Naming Conventions](#31-naming-conventions)
   - [3.2 Core Stats](#32-core-stats)
   - [3.3 Derived / Situational Stats](#33-derived--situational-stats)
   - [3.4 Fatigue, Reward & Risk Tags](#34-fatigue-reward--risk-tags)
4. [GameplayModifier Schema](#gameplaymodifier-schema)
   - [4.1 Field Reference](#41-field-reference)
   - [4.2 Zod Schema Sketch](#42-zod-schema-sketch)
   - [4.3 Example Entries](#43-example-entries)
5. [Evaluation Pipeline & Stacking Policy](#evaluation-pipeline--stacking-policy)
   - [5.1 Scope Order](#51-scope-order)
   - [5.2 Default Stacking Modes](#52-default-stacking-modes)
   - [5.3 Runtime reference (GAS-style implementation)](#53-runtime-reference-gas-style-implementation)
6. [Telemetry & Testing Requirements](#telemetry--testing-requirements)
   - [6.1 Telemetry Events](#61-telemetry-events)
   - [6.2 Testing Matrix](#62-testing-matrix)
7. [Data Ownership & Persistence](#data-ownership--persistence)
8. [Open Questions & Recommendations](#open-questions--recommendations)
   - [8.1 Modifier Visualization Surfaces (GM-UI)](#81-modifier-visualization-surfaces-gm-ui)
9. [Roadmap & Future Appendices](#roadmap--future-appendices)
10. [Appendix A – Migration Checklist (GM-MIG)](#appendix-a--migration-checklist-gm-mig)
11. [Appendix B – Telemetry & Validation (GM-MIG)](#appendix-b--telemetry--validation-gm-mig)

---

## Vision & Scope

The Gameplay Modifier Registry is the single source of truth for every buff, debuff, aura, consumable effect, quest bonus, or penalty that alters Idle Village stats. Designers author modifiers as data (JSON/Zod) while runtime systems—Minimal Gameplay, Village Sandbox, Quest Resolver, Tick Fatigue, and future builders—consume a deterministic pipeline rather than local ad-hoc logic. This spec targets **Phase 12 Idle Village** and unblocks downstream prompts (GM-MP, GM-BLD, GM-MIG) by defining:

- The canonical `GameplayStatId` catalog (core, derived, fatigue/reward domains)
- The schema for `GameplayModifier` objects, including scope, stacking, predicates, lifetime, and ownership metadata
- A GAS-like evaluation pipeline that ensures additive stacking inside the same scope and multiplicative stacking across scopes
- Telemetry and test requirements (Vitest + regression harness) to prevent silent regressions

## Source Documents & Dependencies

| Document | Purpose |
| --- | --- |
| `/.windsurf/plans/gameplay-modifier-system-8c890c.md` | Original rollout brief (“Brotato-style registry”) – defines the need for a registry-first approach. |
| `docs/plans/idle_village_progression_system_plan.md` | Provides stat scaling, reward, and risk context referenced by modifiers. |
| `docs/plans/idle_village_tick_fatigue_plan.md` | Defines fatigue/risk checkpoints that modifiers must target (e.g., per-slot fatigue multipliers). |
| `src/balancing/config/idleVillage/types.ts` | Existing stat/tag definitions and activity metadata consumed by modifiers. |
| `src/balancing/config/idleVillage/minimalGameplayConfig.ts` | Source of UI tokens, thresholds, and roster stats used in examples. |
| `src/balancing/config/idleVillage/gameplayModifierRegistry.ts` | Runtime registry: `registerModifiers`, `getAllRegisteredModifiers`, `getModifiersByScope`, `getModifiersByStat`, `resolveStatGraph`. |
| `src/balancing/modifiers/gameplayModifierEngine.ts` | Evaluation entry point `GameplayModifierEngine.evaluateModifiers` used by `resolveStatGraph`. |
| `src/analytics/idleVillage/modifierTelemetry.ts` | Telemetry wiring for `modifier_applied`, `modifier_removed`, `modifier_stack_changed` events. |
| `src/balancing/config/idleVillage/modifierVisualizationConfig.ts` | Style Lab visualization tokens for modifier rendering (`activitySlot`, `workerPanel`, `questDetail`). |

This spec is the source of truth for registry semantics; downstream prompts (GM-MP, GM-BLD, GM-MIG) extend but do not duplicate it.

## GameplayStatId Catalog

`GameplayStatId` enumerates every stat that the registry may influence. IDs are string-based to align with config-driven systems (`stat_<domain>_<slug>`). Values live in `src/balancing/config/idleVillage/gameplayStats.ts` (new file to be introduced by GM-BLD) and are imported wherever modifiers or UI components reference stats.

### 3.1 Naming Conventions

| Rule | Description |
| --- | --- |
| Prefix | `stat_<domain>_<slug>` (e.g., `stat_core_hp`, `stat_fatigue_recovery`). |
| Domain | `core`, `derived`, `fatigue`, `reward`, `risk`, `ui_token` (reserved for Style Lab overlays). |
| Source of Truth | Config exports a typed `GameplayStatDefinition[]` array with `id`, `label`, `description`, `tags`, `defaultValue`, `unit`. |
| Tagging | Each stat lists `tags` referencing gameplay axes (edge, lantern, moth, fatigue, economy). Used by selectors and builder dropdowns. |

### 3.2 Core Stats

| GameplayStatId | Label | Source Config | Notes |
| --- | --- | --- | --- |
| `stat_core_hp` | Health Points | `defaultConfig.globalRules.coreStats.hp` | Baseline HP for residents; used by injury/death calculations. |
| `stat_core_damage` | Damage Output | `defaultConfig.globalRules.coreStats.damage` | Impacts quest combat outcomes; referenced by Trial/Combat engines. |
| `stat_core_guard` | Guard / Armor | `defaultConfig.globalRules.coreStats.guard` | Mitigates incoming risk; tied to risk stripe calibration. |
| `stat_core_focus` | Focus / Discipline | `defaultConfig.globalRules.coreStats.focus` | Drives success odds for stealth/dialogue phases. |

### 3.3 Derived / Situational Stats

| GameplayStatId | Label | Source Config | Notes |
| --- | --- | --- | --- |
| `stat_derived_synergy` | Party Synergy | Derived from `EffectivePowerConfig.statTagWeights` | Calculated per party to gauge cross-stat synergies. |
| `stat_derived_resolve` | Resolve / Morale | `minimalGameplayConfig.residents[].stats.resolve` | Affected by narrative events; impacts drop validation feedback. |
| `stat_derived_riskBuffer` | Risk Buffer | `idle_village_progression_system_plan §3.3` | Temporary reduction of incoming injury chance; ideal for terrain/consumable buffs. |
| `stat_derived_outputMultiplier` | Output Multiplier | Production engine output | Sits between job base yield and reward multipliers, enabling stacking without double-counting. |

### 3.4 Fatigue, Reward & Risk Tags

| GameplayStatId | Label | Source | Notes |
| --- | --- | --- | --- |
| `stat_fatigue_gain` | Fatigue Gain | `idle_village_tick_fatigue_plan` | Modulates per-tick fatigue accumulation per resident/slot. |
| `stat_fatigue_recovery` | Fatigue Recovery | `idle_village_progression_system_plan §3.5` | Used by rest activities, consumables, and barracks upgrades. |
| `stat_reward_gold` | Gold Reward | Activity definitions (`rewards[]`) | Allows registry to scale final gold yields after reward engine calculations. |
| `stat_reward_food` | Food Reward | Activity/job production | Hook for kitchen buffs or famine penalties. |
| `stat_reward_xp` | XP Reward | `LevelProgressionConfig` once implemented | Ensures XP injections obey level scaling. |
| `stat_risk_injury` | Injury Chance | Quest risk pipeline | Last-mile delta after risk calibration (e.g., +10% injury for cursed terrain). |
| `stat_risk_death` | Death Chance | Quest risk pipeline | Rarely used; requires migration plan + feature flag. |

## GameplayModifier Schema

### 4.1 Field Reference

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | ✅ | Unique slug (`mod_<owner>_<effect>`); stable across sessions. |
| `statId` | `GameplayStatId` | ✅ | Target stat from catalog. |
| `operation` | `'ADD' \| 'MULT' \| 'SET'` | ✅ | ADD = additive delta, MULT = percentage multiplier, SET = hard override. |
| `scope` | `'GLOBAL' \| 'SESSION' \| 'LOCATION' \| 'QUEST' \| 'RESIDENT'` | ✅ | Determines evaluation bucket. |
| `value` | `number` | ✅ | Magnitude; interpretation depends on `operation`. |
| `mode` | `'ADDITIVE' \| 'MULTIPLICATIVE' \| 'OVERRIDE'` | ✅ | Stacking hint (defaults per operation; override for exceptions). |
| `maxStacks` | `number` | Optional | Maximum simultaneous stacks (>=1). |
| `refreshPolicy` | `'RESET_DURATION' \| 'IGNORE' \| 'ADD_DURATION'` | optional | How duration behaves when re-applied. |
| `conditions` | `{ tags?: string[]; predicates?: string[]; residentIds?: string[]; questTags?: string[] }` | optional | Structured predicates enforced by builders. |
| `lifetime` | `{ type: 'INSTANT' \| 'TIMED' \| 'SESSION'; durationTicks?: number; expiresAt?: number }` | optional | Duration semantics. |
| `owner` | `{ type: 'building' \| 'item' \| 'trait' \| 'quest' \| 'terrain' \| 'system'; id: string; label: string }` | ✅ | Provenance for auditing and telemetry. |
| `metadata` | `Record<string, unknown>` | optional | Free-form config (e.g., Style Lab token references). |
| `sourceConfigId` | `string` | ✅ | Points to config chunk or preset (e.g., `idleVillage.modifiers.preset_barracks_alpha`). |

### 4.2 Zod Schema Sketch

```ts
import { z } from 'zod';

export const GameplayModifierSchema = z.object({
  id: z.string().min(1),
  statId: z.string().regex(/^stat_[a-z0-9_]+$/),
  operation: z.enum(['ADD', 'MULT', 'SET']),
  scope: z.enum(['GLOBAL', 'SESSION', 'LOCATION', 'QUEST', 'RESIDENT']),
  value: z.number(),
  mode: z.enum(['ADDITIVE', 'MULTIPLICATIVE', 'OVERRIDE']).default((ctx) => defaultMode(ctx.operation)),
  maxStacks: z.number().int().min(1).default(1),
  refreshPolicy: z.enum(['RESET_DURATION', 'IGNORE', 'ADD_DURATION']).default('RESET_DURATION'),
  conditions: z
    .object({
      tags: z.array(z.string()).optional(),
      predicates: z.array(z.string()).optional(),
      residentIds: z.array(z.string()).optional(),
      questTags: z.array(z.string()).optional(),
    })
    .optional(),
  lifetime: z
    .object({
      type: z.enum(['INSTANT', 'TIMED', 'SESSION']).default('TIMED'),
      durationTicks: z.number().int().nonnegative().optional(),
      expiresAt: z.number().optional(),
    })
    .optional(),
  owner: z.object({
    type: z.enum(['building', 'item', 'trait', 'quest', 'terrain', 'system']),
    id: z.string(),
    label: z.string(),
  }),
  metadata: z.record(z.any()).optional(),
  sourceConfigId: z.string().min(1),
});
```

### 4.3 Example Entries

```ts
// src/balancing/config/idleVillage/gameplayModifierRegistry.ts
export const DEFAULT_IDLE_VILLAGE_MODIFIERS = [
  {
    id: 'mod_barracks_discipline_aura',
    statId: 'stat_core_focus',
    operation: 'ADD',
    scope: 'LOCATION',
    value: 5,
    mode: 'ADDITIVE',
    maxStacks: 1,
    conditions: { tags: ['barracks'] },
    lifetime: { type: 'SESSION' },
    owner: { type: 'building', id: 'barracks_lvl1', label: 'Barracks L1' },
    sourceConfigId: 'idleVillage.modifiers.barracksLvl1',
  },
  {
    id: 'mod_quest_fog_of_dread',
    statId: 'stat_risk_injury',
    operation: 'MULT',
    scope: 'QUEST',
    value: 0.25,
    mode: 'MULTIPLICATIVE',
    lifetime: { type: 'TIMED', durationTicks: 3 },
    owner: { type: 'quest', id: 'trial_fire', label: 'Trial of Fire' },
    sourceConfigId: 'quests.trial_fire.phase_fog',
    phaseId: 'trial_fire_phase_fog',
  },
] satisfies GameplayModifier[];

// Registry helper: exposes register/get/resolve helpers for builders & runtime
export function resolveStatGraph(options: ResolveStatGraphOptions) {
  const modifiers = selectRegisteredModifiers(options.statId, options.scopes);
  return resolveModifiers({ ...options, modifiers });
}
```

### 4.4 Runtime Implementation Reference

- **Types & Schema:** `src/balancing/types/gameplayModifierTypes.ts` exports the Zod schema, enums, and resolver options consumed everywhere else.
- **Stat Catalog:** `src/balancing/config/idleVillage/gameplayStats.ts` centralizes `GAMEPLAY_STAT_IDS` so builders/UI pull from a single source.
- **Registry Runtime:** `src/balancing/config/idleVillage/gameplayModifierRegistry.ts` loads config payloads, exposes selectors (`getModifiersByScope`, `getModifiersByStat`) and the `resolveStatGraph` helper used by Idle Village engines.
- **Resolution Engine:** `src/balancing/modifiers/gameplayModifierEngine.ts` is the deterministic pipeline shared by Minimal Gameplay, Tick Fatigue, telemetry hooks, and future builders.

Runtime call example (mirrors §5 GAS pseudocode):

```ts
import { resolveStatGraph } from '@/balancing/config/idleVillage/gameplayModifierRegistry';

const result = resolveStatGraph({
  statId: 'stat_core_focus',
  baseValue: resident.stats.focus,
  context: {
    statId: 'stat_core_focus',
    residentId: resident.id,
    tags: activeJob.tags,
    locationId: activeJob.slotId,
    questPhaseId: quest?.activePhaseId,
    currentTick: tickEngine.currentTick,
  },
});

console.log(result.finalValue, result.breakdown);
```

## Evaluation Pipeline & Stacking Policy

### 5.1 Scope Order

Scope order ensures deterministic stacking:

1. **GLOBAL** – Always-on campaign modifiers (seasonal events, difficulty).
2. **SESSION** – Save-specific or experimental toggles stored via `PersistenceService`.
3. **LOCATION** – Map slot, terrain, or building effects.
4. **QUEST** – Quest/phasespecific modifiers.
5. **RESIDENT** – Traits, consumables, injury penalties.

### 5.2 Default Stacking Modes

| Scope | Intra-scope default | Cross-scope interaction |
| --- | --- | --- |
| GLOBAL | Additive for `ADD`, multiplicative for `MULT`, last-writer-wins for `SET`. | Output seeds SESSION bucket. |
| SESSION | Matches GLOBAL defaults; limited by `maxStacks`. | Multiplies LOCATION bucket. |
| LOCATION | Additive per stat; duplicates merged by `owner.id` unless `maxStacks > 1`. | LOCATION output multiplies QUEST bucket. |
| QUEST | Additive inside scope; final result multiplies RESIDENT bucket. | Works with quest phases/resolvers. |
| RESIDENT | Additive default; `SET` locks final stat. | Final output returned to caller (engine/UI). |

### 5.3 Runtime reference (GAS-style implementation)

```ts
// src/balancing/modifiers/gameplayModifierEngine.ts
export function resolveModifiers(options: ResolveModifierOptions): ResolveModifiersResult {
  const scopesToEvaluate = dedupeScopes(options.scopeFilter ?? DEFAULT_SCOPE_ORDER);
  let cursor = options.baseValue;

  for (const scope of scopesToEvaluate) {
    const scopedModifiers = sortModifiers(
      selectScopeModifiers(options.modifiers, options.statId, scope, options.context),
    );

    cursor = applyScopeModifiers({
      scope,
      modifiers: scopedModifiers,
      startingValue: cursor,
      context: options.context,
      onModifierApplied: options.onModifierApplied,
    });
  }

  return { statId: options.statId, baseValue: options.baseValue, finalValue: cursor, breakdown };
}
```

**Notes:**

1. Additive → multiplicative → override stacking now lives in `applyScopeModifiers` ensuring deterministic ordering + telemetry callbacks.
2. Predicate filters (tags, resident, quest phase, location) and lifetime checks mirror §4 schema fields (`questPhaseIds`, `expiresAt`).
3. `ScopeResolutionSnapshot` emitted by the engine allows HUD/telemetry to display applied modifier IDs per scope.

Refer back to §4.3 for registry defaults – builders populate the same config arrays, while runtime consumers call `resolveStatGraph` to bridge config → engine without duplicating logic.

## Telemetry & Testing Requirements

### 6.1 Telemetry Events

Runtime now owns the emission layer inside `src/analytics/idleVillage/modifierTelemetry.ts`, which exposes helpers (`emitModifierApplied/Removed/StackChanged`) and a registry-ready hook `getOnModifierAppliedTelemetryCallback`. All events flow through `trackTelemetryEvent(eventType, payload)` (same provider used elsewhere) and use the `gameplay_modifier` channel for diagnostics tagging. Session correlation relies on `PersistenceService` and the storage key `idleVillage_modifier_telemetry_session_v1` so QA can trace multi-event bursts deterministically.

> **Feature flag:** telemetry remains disabled unless `VITE_FEATURE_IDLE_VILLAGE_MODIFIER_TELEMETRY=true` (surfaced as `FeatureFlags.idleVillage.modifierTelemetry`). The flag must stay off in production until Appendix A systems ship their migrations.

| Event | Trigger | Payload Notes |
| --- | --- | --- |
| `modifier_applied` | Modifier becomes active | Includes `modifierId`, `statId`, `scope`, `operation`, `value`, `stackCount`, `owner`, `sourceConfigId`, `conditions`. |
| `modifier_removed` | Modifier expires or is removed manually | Adds `reason` field (`expired`, `manual`, `predicate_failed`). |
| `modifier_stack_changed` | Stack count changes | Adds `previousStackCount`, `newStackCount`, `delta`. |

Example payload (JSON) recorded from the helper layer:

```json
{
  "eventType": "modifier_applied",
  "payload": {
    "channel": "gameplay_modifier",
    "timestamp": "2026-02-18T21:30:00.000Z",
    "sessionId": "modifier_session_1739901000000_abc123def",
    "modifierId": "mod_barracks_discipline_aura",
    "statId": "stat_core_focus",
    "scope": "LOCATION",
    "operation": "ADD",
    "value": 5,
    "stackCount": 1,
    "owner": { "type": "building", "id": "barracks_lvl1", "label": "Barracks L1" },
    "sourceConfigId": "idleVillage.modifiers.barracksLvl1",
    "conditions": { "tags": ["barracks"], "predicates": ["resident_assigned"] },
    "context": { "residentId": "resident_alya", "locationId": "slot_barracks_north" },
    "valueBefore": 10,
    "valueAfter": 15,
    "valueDelta": 5
  }
}
```

Guardrails:

1. Telemetry gated via `VITE_FEATURE_IDLE_VILLAGE_MODIFIER_TELEMETRY` (`FeatureFlags.idleVillage.modifierTelemetry`).
2. Registry automatically attaches `getOnModifierAppliedTelemetryCallback()` unless callers override `onModifierApplied`, ensuring no double wiring.
3. Retention: 14 days dev / 60 days staging-prod.
4. Evidence script `scripts/analytics/exportModifierTelemetry.ts` aggregates events for QA.

### 6.2 Testing Matrix

| Suite | Description | Coverage |
| --- | --- | --- |
| `tests/unit/idleVillage/GameplayModifierRegistry.test.ts` | Pure pipeline tests | Stacking order, predicates, lifetime behavior, telemetry stubs. |
| `tests/integration/idleVillage/ModifierPipeline.test.ts` | End-to-end pipeline | Sample party/quest/resident flows vs snapshot. |
| `tests/unit/analytics/ModifierTelemetry.test.ts` | Telemetry contract | Payload validation via Zod + mock TelemetryProvider. |
| Regression logs | Prompt evidence | `test-results/gm-reg-<date>.log` storing lint/build/test output. |

## Data Ownership & Persistence

- **Module:** `src/balancing/config/idleVillage/gameplayModifiersConfig.ts` – exports schema, registry map, and helper selectors.
- **Persistence:** `PersistenceService.saveData('idleVillage_modifier_registry_v1', payloadWithChecksum)` stores session overrides with versioning for migrations.
- **Builder Integration:** Activity/Barracks/Market/Trait builders load stat catalog + schema metadata via `useGameplayModifierRegistry()` to populate dropdowns, preventing inline enums.
- **UI Consumption:** `useMapContext`, `useTerrainModifiers`, and Minimal Gameplay hooks consume resolved modifiers through shared selectors (`selectResolvedModifiers(scopeFilter)`), ensuring zero logic duplication in React components.

## Open Questions & Recommendations

| Topic | Open Question | Recommendation |
| --- | --- | --- |
| Quest scope granularity | Should quest modifiers separate phase vs entire quest? | Add optional `phaseId` metadata. Pipeline filters by active phase when present. |
| Stacking exceptions | When should LOCATION modifiers multiply? | Default additive per prompt; allow explicit `mode='MULTIPLICATIVE'` but require `metadata.requiresApproval = true` + lint rule. |
| Telemetry volume | How granular should telemetry be? | Emit events only on state transitions (apply/remove/stack change). Aggregate per tick downstream to avoid spam. |
| Reward overrides | Does registry override `RewardEngine` outputs? | Registry operates post reward engine via helper `applyRewardModifiers`. Config-first approach ensures reward multipliers remain centralized. |
| Owner collisions | Same `owner.id` across presets? | Namespaces (e.g., `barracks:level1`). Add validator ensuring uniqueness at build time. |

## Roadmap & Future Appendices

| Milestone | Description | Prompt |
| --- | --- | --- |
| GM-MP | Update MASTER_PLAN + progression/fatigue docs to reference registry. | GM-MP |
| GM-BLD | Document builder/tooling flows, serialization, CLI. | GM-BLD |
| GM-MIG | Migration & telemetry appendices (Appendix A/B). | GM-MIG |
| Registry Implementation | Actual config module + hooks/tests | Post-doc engineering prompt |

Planned appendices (to be delivered by dependent prompts):

1. **Appendix A – Migration Checklist** (GM-MIG): system-by-system mapping from legacy multipliers to registry entries with priority and owners.
2. **Appendix B – Tooling & Builder Guidelines** (GM-BLD): authoring flows, validation checklist, CLI guardrails.
3. **Appendix C – Telemetry & QA Recipes:** scripts, dashboards, evidence references.

---

## Appendix A – Migration Checklist (GM-MIG)

**Purpose:** provide a deterministic runway for migrating every legacy buff/multiplier into the Gameplay Modifier Registry without touching runtime configs prematurely. Each line references the authoritative config/plan plus the future modifier definition so engineering can implement without digging through legacy code.

| System | Stat / Effect | Legacy Source | Target Modifier (scope / operation) | Owner & Priority | Blocks / Notes |
| --- | --- | --- | --- | --- | --- |
| Barracks discipline auras | `stat_core_focus`, `stat_fatigue_recovery` | `src/balancing/config/idleVillage/residentUpgrades.ts` (disciplineLevel, restBonus) | `mod_barracks_discipline_aura` (`LOCATION` / `ADD`), `mod_barracks_rest_cycle` (`SESSION` / `MULT`) | **Owner:** Balancing Team – Structures. **Priority:** P1 (needed by Minimal Gameplay + Sandbox). | Blocked until `gameplayModifiersConfig.ts` exposes LOCATION selectors. Export references crew rotation guide §Modifiers. |
| Training Slots fatigue gates | `stat_fatigue_gain` | `crew_rotation_config.slots[].modifiers.fatigueMultiplier` | `mod_training_slot_fatigue_cap` (`LOCATION` / `SET`) | **Owner:** Crew Systems Squad. **Priority:** P1. | Requires tick fatigue plan alignment (§3). Add validator to ensure slot prerequisites map to modifier predicates. |
| Market consumable boosts | `stat_reward_food`, `stat_reward_gold`, `stat_core_guard` | `src/balancing/config/idleVillage/marketConsumables.ts` (inline multipliers) | `mod_consumable_*` templates (`RESIDENT` / `MULT`) generated per consumable id | **Owner:** Economy Team. **Priority:** P2. | Blocked on builder UI (GM-BLD) to author consumable templates. Telemetry gating must cover purchase + apply events. |
| Resident traits (Edge/Lantern/Moth) | `stat_core_damage`, `stat_core_guard`, `stat_derived_synergy` | `residentTraitsConfig` (pending GM-BLD) & roster defaults | `mod_trait_<traitId>_<stat>` (`RESIDENT` / `ADD`) with `maxStacks=1` | **Owner:** Narrative Systems. **Priority:** P2. | Depends on trait registry freeze. Must ensure duplicates merge via owner id. |
| Crew rotation KPI helpers | `stat_reward_gold`, `stat_reward_food`, `stat_fatigue_gain` | `crew_rotation_guide.md` (§Modifiers & KPI chapter) | `mod_rotation_<slotId>_<axis>` (`SESSION` / `MULT`) applied when slot active | **Owner:** Crew Scheduler Team. **Priority:** P1. | Requires scheduler hook to emit `rotation_modifier_changed`. Needs cross-check with telemetry for drop feedback. |
| Tick fatigue baseline & recovery | `stat_fatigue_gain`, `stat_fatigue_recovery` | `idle_village_tick_fatigue_plan.md` (§3.1–3.3) | `mod_tick_day_budget`, `mod_tick_night_recovery` (`GLOBAL` / `SET` + `SESSION` / `ADD`) | **Owner:** Systems Team. **Priority:** P0 (blocks Phase 12 loop). | Blocked by TimeEngine tick slicing implementation. Document retention in fatigue plan. |
| Quest rewards / penalties | `stat_reward_xp`, `stat_risk_injury`, `stat_risk_death` | `quests/*.json` (legacy `rewardMultiplier`, `injuryDelta` fields) | `mod_quest_<questId>_<phase>` (`QUEST` / `MULT`) + override for death penalty (`SET`) | **Owner:** Quest Content Team. **Priority:** P2. | Need quest phase metadata (GM-REG §Open Questions). Use `sourceConfigId` linking quest doc. |
| Maintenance jobs (food/injury) | `stat_reward_food`, `stat_risk_injury` | `maintenanceJobsConfig` (UI-coded) | `mod_maintenance_food_flow`, `mod_injury_heal` (`LOCATION` / `ADD`) | **Owner:** Maintenance Feature Strike Team. **Priority:** P1. | Blocked until maintenance plan approved. Provide CLI backfill script stub. |

### A.1 System Telemetry Responsibilities

| System | Telemetry hook(s) | Required validation artifacts | Evidence target |
| --- | --- | --- | --- |
| Barracks + Training Slots | `onModifierApplied` callback emitted by `resolveModifiers` (see `tests/unit/balancing/gameplayModifierEngine.test.ts`) + `modifier_applied` event replay via `telemetryProvider`. | Vitest snapshot of modifier payload per slot + `telemetry:validate -- --system modifiers --filter=barracks`. | `test-results/gm-mig-<date>.log` + `data/exports/modifiers/barracks/*.json`. |
| Market consumables | Consumable purchase flow emits `modifier_applied` + stack changes; capture via HUD Playwright spec hooking `window.telemetryBuffer`. | RTL harness validating `useConsumableController` telemetry mocks + Playwright drag/drop script. | `telemetry/modifiers/staging/YYYY/MM/DD.jsonl` filtered on `sourceConfigId=market`. |
| Resident traits | Trait assignment CLI triggers `modifier_applied`/`removed` pairs; quest resolver ensures `residentIds[]` resolved. | Deterministic trait import test + `scripts/migrations/modifierBackfill.ts --system traits --emit-telemetry-sample`. | Evidence appended to `docs/reports/traits-migration.md` referencing same log. |
| Crew rotation + Tick fatigue | Scheduler produces `rotation_modifier_changed` stub + `modifier_stack_changed` for fatigue deltas. | Integration spec `tests/integration/idleVillage/ModifierPipeline.test.ts` (multi-scope) + scheduler smoke test capturing telemetry order. | `telemetry/modifiers/staging/...` with `rotationSlotId` populated + QA note in crew rotation guide. |
| Quests & Maintenance | Quest resolver + maintenance controller each emit `modifier_applied` (quest start) and `modifier_removed` (quest end). | Scenario runner script `scripts/migrations/questModifierAudit.ts` exports telemetry samples + Playwright quest HUD spec verifying UI events. | `test-results/gm-mig-<date>.log` + quest-specific CSV from `scripts/analytics/exportModifierTelemetry.ts`. |

### Checklist Actions

1. **Schema & Type parity:** Before authoring modifiers, ensure `GameplayModifierSchema` exists in runtime (GM-BLD deliverable). Document any derived fields needed per system.
2. **Migration scripts:** Staged CLI utilities:
   - `scripts/migrations/modifierBackfill.ts` – backfills registry entries from legacy configs (Barracks, Market, Crew Rotation). Accepts `--system` filter and writes JSON diff under `data/exports/modifiers/`.
   - `scripts/migrations/questModifierAudit.ts` – parses quest configs and emits required `mod_quest_*` entries plus telemetry samples.
3. **Config touchpoints:**
   - `src/balancing/config/idleVillage/gameplayModifiersConfig.ts` (target home for registry, remains untouched until engineering prompt).
   - `crew_rotation_config.ts`, `marketConsumables.ts`, `tick_fatigue` config: flagged for read-only references until migration branch merges.
4. **Dependencies:**
   - Crew rotation guide §Modifiers, Tick Fatigue plan §3, style lab tokens for UI badges (observatory theme) to ensure consistent label rendering once modifiers show up inside HUD.
5. **Blocking issues tracking:** capture per-system blockers inside Kanban board (GM-MIG lane). Use status `Waiting` when dependent prompt (GM-BLD) not yet delivered.

#### Appendix A Reference Documents

- `docs/idle_village/crew_rotation_guide.md` – source for rotation slot KPI modifiers and scheduler telemetry expectations (see §Modifiers & KPI chapter).
- `docs/plans/idle_village_tick_fatigue_plan.md` – authoritative per-tick fatigue/recovery budgets referenced by `mod_tick_day_budget` and `mod_tick_night_recovery`.
- `docs/plans/idle_village_progression_system_plan.md` – reward/fatigue scaling context for consumables, quests, and trait migrations.

### Ownership & Milestones

| Milestone | Scope | Owner | Timebox | Evidence |
| --- | --- | --- | --- | --- |
| MIG-01 | Barracks + Training Slot migration spec signed off | Balancing Team | 3 workdays | `test-results/gm-mig-YYYY-MM-DD.log` + meeting notes |
| MIG-02 | Economy (Market consumables) + Resident traits mapping finalized | Economy + Narrative | 4 workdays | Same log + export diff attachments |
| MIG-03 | Tick fatigue + quest penalties integrated into registry backlog | Systems + Quest Teams | 3 workdays | Telemetry dry-run trace + doc update |

Owners must update Kanban entries after each milestone, referencing evidence logs and linking relevant sections (crew rotation guide, fatigue plan) to maintain single source of truth.

---

## Appendix B – Telemetry & Validation (GM-MIG)

### B.1 Event Catalog

All events route through `trackTelemetryEvent(eventType, payload)` defined in `src/analytics/telemetry/telemetryProvider.ts`. For modifier-specific events, prepend `modifier_` to keep parity with existing routing logic.

| Event | Trigger | Required Payload Fields | Optional Fields | Notes |
| --- | --- | --- | --- | --- |
| `modifier_applied` | Modifier enters active stack list (initial apply or predicate resolves true). | `modifierId`, `statId`, `scope`, `operation`, `value`, `stackCount`, `owner`, `sourceConfigId`, `conditions`, `timestamp`, `sessionId`, `residentIds[]` | `questId`, `locationId`, `rotationSlotId`, `lifetime` | Fire once per modifier instance. Use `telemetryProvider` tags `['modifier','applied']`. |
| `modifier_removed` | Modifier expires, is manually cleared, or predicate fails. | `modifierId`, `statId`, `scope`, `reason`, `stackCount`, `owner`, `sourceConfigId`, `timestamp` | `durationTicks`, `lastKnownValue`, `sessionId` | `reason` enumerations: `expired`, `manual`, `predicate_failed`, `migration_cleanup`. |
| `modifier_stack_changed` | Stack count increments/decrements without removal (e.g., consumable repeats). | `modifierId`, `statId`, `scope`, `previousStackCount`, `newStackCount`, `delta`, `timestamp`, `owner`, `sourceConfigId` | `residentIds[]`, `questId` | Emit only when `previous !== new`. |

### Logging Level & Routing

1. **Development:** send to `landingDiagnostics` with verbose payload dumps. Retention 14 days.
2. **Staging/Production:** forward to `stressDiagnostics` with hashed resident IDs, retention 60 days. Guarded by `FEATURE_MODIFIER_TELEMETRY` env flag.
3. **Correlation:** each payload includes `sessionId` (PersistenceService session key) and optional `rotationSlotId`/`questId` to correlate with Crew Scheduler and Quest Resolver logs. Telemetry buffer (`window.telemetryBuffer`) collects last 100 events for UI-based inspectors.

### B.2 Payload Schema (TypeScript/JSDoc)

```ts
/**
 * @typedef ModifierTelemetryPayload
 * @property {string} modifierId
 * @property {GameplayStatId} statId
 * @property {'GLOBAL'|'SESSION'|'LOCATION'|'QUEST'|'RESIDENT'} scope
 * @property {'ADD'|'MULT'|'SET'} operation
 * @property {number} value
 * @property {number} stackCount
 * @property {{ type: string; id: string; label: string }} owner
 * @property {string} sourceConfigId
 * @property {ModifierConditions | undefined} conditions
 * @property {string} timestamp ISO 8601
 * @property {string} sessionId
 * @property {string[]} residentIds optional
 */
```

Example emission:

```json
{
  "eventType": "modifier_applied",
  "payload": {
    "modifierId": "mod_barracks_discipline_aura",
    "statId": "stat_core_focus",
    "scope": "LOCATION",
    "operation": "ADD",
    "value": 5,
    "stackCount": 1,
    "owner": { "type": "building", "id": "barracks_lvl1", "label": "Barracks L1" },
    "sourceConfigId": "idleVillage.modifiers.barracksLvl1",
    "conditions": { "tags": ["barracks"], "predicates": ["resident_assigned"] },
    "timestamp": "2026-02-18T14:20:00Z",
    "sessionId": "idleVillage.save.12345",
    "residentIds": ["resident_alya"]
  }
}
```

### B.3 Validation & QA Plan

1. **Unit Tests (Vitest):**
   - Extend `tests/unit/analytics/ModifierTelemetry.test.ts` with schema snapshots ensuring required fields exist per event type.
   - Add deterministic stacking tests in `tests/unit/idleVillage/GameplayModifierRegistry.test.ts` verifying telemetry stub invocation order.
2. **Integration Tests:**
   - `tests/integration/idleVillage/ModifierPipeline.test.ts` emits mock telemetry provider and asserts apply/remove/stack change sequences for multi-scope scenarios.
3. **Playwright / Analytics Validation:**
   - Update Idle Village HUD e2e spec to drag consumables/crew slots and assert `window.telemetryBuffer` captures the expected events.
   - Add analytics harness CLI `npm run telemetry:validate -- --system modifiers` to replay recorded events through Zod schema.
4. **Rollout Checklist:**
   - Feature flag `FEATURE_MODIFIER_TELEMETRY` default off until registry migrations complete per system.
   - Gating rules: Barracks + Training migrations must log ≥1 event per assignment during smoke tests before enabling in staging.
   - QA tasks: verify `scripts/analytics/exportModifierTelemetry.ts` outputs aggregated CSV/JSON with correct retention filters.

### B.4 Retention, Storage, and Evidence

| Environment | Retention | Storage Location | Notes |
| --- | --- | --- | --- |
| Dev | 14 days | Local diagnostics log + `window.telemetryBuffer` | Auto-cleared per session. |
| Staging | 60 days | Central telemetry bucket (`telemetry/modifiers/staging/YYYY/MM/DD.jsonl`) | Hash resident IDs, strip PI. |
| Production | 60 days (extendable via audit request) | Production diagnostics cluster with Guardian guardrails | Guardian mandate requires bundle size <10 MB → telemetry modules tree-shake when flag disabled. |

### B.5 Evidence Workflow & Guardian Alignment

1. **Prompt readiness guardrail:** `npm run prompt:check -- GM-MIG` must pass before edits land; archive console output inside `test-results/gm-mig-<date>.log` alongside lint/build/test summaries.
2. **Docs lint + type safety:** run `npm run lint -- docs` and `npm run build:check` after every appendix update to ensure schema references stay in sync with TypeScript definitions consumed by runtime hooks.
3. **Telemetry replay sanity:** execute `npm run telemetry:validate -- --system modifiers --env dev` using the latest export from `scripts/analytics/exportModifierTelemetry.ts` before enabling any modifier category flag (Barracks, Market, etc.). Attach the command output hash to the same evidence log.
4. **Kanban + Guardian:** once QA sign-off is recorded, run `npm run kanban:lint` to prove Kanban metadata is consistent, then note the guardian verification status (health-check + deploy guard, when applicable) inside the evidence log footer.
5. **Cross-doc linkage:** whenever an appendix entry references crew rotation or fatigue docs, update those sources in the same PR or create follow-up tasks; the evidence log must list every touched document to keep Guardian audits traceable.

#### Appendix B Reference Workflows

- `scripts/analytics/exportModifierTelemetry.ts` – CLI for aggregating modifier events into CSV/JSON evidence packages.
- `tests/unit/analytics/ModifierTelemetry.test.ts` – baseline for payload validation; extend per migration to cover new scopes/owners.
- `docs/idle_village/QA/telemetry_playbook.md` – telemetry routing guidance used by Guardian audits (retention + env flags).

**Compliance Checklist:**

- [x] Frontmatter + TOC
- [x] GameplayStatId catalog with naming conventions and config provenance
- [x] GameplayModifier schema (scope, stacking, conditions, lifetime, owner)
- [x] Evaluation order + policy (additive same scope, multiplicative cross scope) with pseudocode
- [x] Telemetry/testing requirements (`modifier_applied/removed/stack_changed` + Vitest/grn suites)
- [x] Open questions addressed with recommendations
- [x] Roadmap linking future prompts (GM-MP, GM-BLD, GM-MIG)

### 8.1 Modifier Visualization Surfaces (GM-UI)

- `useModifierVisualization` mock hook now supplies config-first preview data for Style Lab surfaces until GM-ENG wiring arrives.
- Surfaces consuming `StatModifierDisplay` (loading + empty fallbacks): Activity Slot tooltip, ActivityCardDetail, WorkerTooltip, QuestDetailPanel.
- Each surface uses Style Lab scope/status tokens and shares mock config defined in `modifierVisualizationConfig.ts`.
- Tests: `ActivityCardDetail.test.tsx`, `WorkerTooltip.test.tsx`, `QuestDetailPanel.test.tsx` cover modifier preview rendering.

## 9. Engine Integration Examples (GM-MP)

This section maps the abstract `GameplayModifier` schema to the concrete runtime implementation delivered by `GM-ENG`.

### 9.1 Default Registry Payload

`src/balancing/config/idleVillage/gameplayModifierRegistry.ts` ships with `DEFAULT_IDLE_VILLAGE_MODIFIERS`, a baseline payload translated from §4.3. It is registered at module load and can be replaced or merged via `registerModifiers(modifiers, { merge?: boolean })`.

```ts
import { registerModifiers, getAllRegisteredModifiers } from '@/balancing/config/idleVillage/gameplayModifierRegistry';

registerModifiers([
  {
    id: 'mod_quest_fog_of_dread',
    statId: 'stat_risk_injury',
    operation: 'MULT',
    scope: 'QUEST',
    value: 0.25,
    mode: 'MULTIPLICATIVE',
    maxStacks: 1,
    refreshPolicy: 'RESET_DURATION',
    lifetime: { type: 'TIMED', durationTicks: 3 },
    owner: { type: 'quest', id: 'trial_fire', label: 'Trial of Fire' },
    sourceConfigId: 'quests.trial_fire.phase_fog',
    phaseId: 'trial_fire_phase_fog',
  },
]);
```

### 9.2 Resolving a Stat Graph

Consumers that need a final stat value call `resolveStatGraph` from the registry. It collects modifiers for the requested scopes, runs them through `resolveModifiers` in `src/balancing/modifiers/gameplayModifierEngine.ts`, and emits telemetry via the `onModifierApplied` callback.

```ts
import { resolveStatGraph } from '@/balancing/config/idleVillage/gameplayModifierRegistry';

const result = resolveStatGraph({
  statId: 'stat_core_focus',
  baseValue: resident.focus,
  scopes: ['GLOBAL', 'SESSION', 'LOCATION', 'QUEST', 'RESIDENT'],
  context: { residentId: resident.id, locationId: slot.id, questId: quest.id },
});

// result.finalValue is the computed stat after additive/multiplicative stacking.
```

### 9.3 Telemetry Integration

`src/analytics/idleVillage/modifierTelemetry.ts` registers the default telemetry callback used by `resolveStatGraph`. Events are routed through `trackTelemetryEvent` with channel `gameplay_modifier`.

- `modifier_applied` — emitted when a modifier enters the active stack.
- `modifier_removed` — emitted on expiration, manual clear, or predicate failure.
- `modifier_stack_changed` — emitted when a repeatable modifier changes stack count.

### 9.4 Style Lab Rendering Tokens

`src/balancing/config/idleVillage/modifierVisualizationConfig.ts` exports `MODIFIER_VISUALIZATION_CONFIG`, a config-first map of modifier entries per UI context (`activitySlot`, `workerPanel`, `questDetail`). Each entry defines `valueLabel`, `lifetime`, `status`, `owner`, `stackCount`, and `sourceConfigId`, ensuring Style Lab surfaces render modifiers without ad-hoc formatting logic.

### 9.5 Cross-References

- `docs/plans/idle_village_progression_system_plan.md` — reward/risk scaling integration.
- `docs/plans/idle_village_tick_fatigue_plan.md` — per-tick fatigue and recovery modifiers.
- `.windsurf/plans/style-lab-flexibility-1a9890.md` — modifier metadata rendering tokens.
- `src/docs/docs/plans/idle_village_modifiers_plan.md` (this document) — canonical schema and catalog.

> **Hardcoded Number Policy:** Numeric literals in examples above are illustrative. Production modifiers must source `value` from config (`sourceConfigId`) and be validated by `GameplayModifierSchema`.

## 10. Builder & Tooling (GM-BLD)

`src/balancing/modifiers/modifierBuilder.ts` provides a typed fluent API for authoring `GameplayModifier` objects. All builder methods validate against the canonical schema and forbid inline magic numbers by requiring `sourceConfigId` and a typed `statId`.

```ts
import { ModifierBuilder } from '@/balancing/modifiers/modifierBuilder';

const aura = new ModifierBuilder()
  .forStat('stat_core_focus')
  .add(5)
  .inScope('LOCATION')
  .ownedBy('building', 'barracks', 'Barracks')
  .fromConfig('idleVillage.modifiers.barracksLvl1')
  .withLifetime('SESSION')
  .withTags('barracks')
  .build();
```

`scripts/modifierRegistryCLI.ts` exposes local commands:

- `list` — dump registry with scope/stat filters.
- `validate <file>` — validate JSON exports against `GameplayModifierSchema`.
- `register <file> [--merge]` — load modifiers into the in-memory registry.
- `example` — print a fluent-builder smoke test.

For full guidelines, see `src/docs/docs/idle_village/builder_tooling.md`.
