---
title: Idle Village Modifier Builder & Tooling Guidelines
description: End-to-end handbook for connecting Idle Village authoring tools to the Gameplay Modifier Registry (GM-REG) with config-first serialization, validation, and CLI guardrails.
---

<!-- markdownlint-disable MD013 -->
## Overview

The Gameplay Modifier Registry (GM-REG) elevates every buff, penalty, aura, quest effect,
and consumable into a single config-first pipeline. GM-BLD documents how existing
builders (Activity Builder, Barracks, Market Consumables, Trait Editor) must:

- Read the canonical `GameplayStatId` catalog exported by
  `src/balancing/config/idleVillage/gameplayStats.ts`.
- Author `GameplayModifier[]` objects that comply with the schema introduced in GM-REG (§4)
  and validated by a shared Zod schema.
- Persist data via `PersistenceService` (for UI builders) or JSON/TS config modules (for
  static presets) without inline magic numbers.
- Run lint/test guardrails (docs lint, build check, modifier linter CLI) and provide
  telemetry hooks for authoring sessions.

This guide is documentation-only and references existing plans/config; engineering
prompts that implement the described tooling must link back here.

## Toolchain

### Activity Builder

1. **Stat Catalog Integration**
   - Load `GameplayStatDefinition[]` via
     `import { gameplayStats } from '@/balancing/config/idleVillage/gameplayStats';`
     (module introduced by GM-REG).
   - Populate dropdowns/search with `definition.id`, `label`, `tags`. Sorting must respect
     `definition.domain` to keep core stats on top.
2. **Modifier Authoring Flow**
   - Activities expose three modifier slots: `baseYield`, `riskAdjustments`,
     `fatigueEffects`. Each slot serializes to an array of `GameplayModifier` objects
     filtered by `scope` (`LOCATION` for slot-level, `QUEST` for quest hooks, `RESIDENT`
     for per-assignee effects).
   - Scopes default to `LOCATION`; authors can switch to `QUEST` only when the activity is
     part of a quest chain flagged in `minimalGameplayConfig.activities[].questContext`.
3. **Stacking & Conditions**
   - Default `mode` = `ADDITIVE` for `operation='ADD'`. Multiplicative entries must set
     `metadata.requiresApproval = true` and provide a reviewer ID.
   - Conditions automatically include `{ tags: activity.tags }`; optional predicates (e.g.,
     `hasTrait:edge_walker`) are selected via multi-select referencing
     `src/balancing/config/idleVillage/traitTags.ts`.
4. **Persistence**
   - Builder saves drafts by calling
     `PersistenceService.saveData('iv_activity_builder_modifiers_v1', payload)` with
     checksum (reuse History Guardrails from CF-Phase10).
   - Exports write to `data/exports/idleVillage/activities/<activityId>.modifiers.json`.

### Barracks Upgrades Builder

1. **Scope Discipline**: All barracks modifiers use `scope='LOCATION'` (building aura)
   or `scope='SESSION'` (global perk unlocked for a save).
2. **Stat Selection**: Filter stat catalog by `tags` that match `['discipline',
   'fatigue', 'risk']`. Provide quick filters defined in config: `BAR_RISK_TAGS`,
   `BAR_FATIGUE_TAGS` stored under `src/balancing/config/idleVillage/barracksConfig.ts`.
3. **Stack Tracking**: Upgrades with multiple tiers map to `maxStacks` equal to
   upgrade level count; `refreshPolicy='IGNORE'` to prevent duration resets.
4. **Serialization**: Output appended to `idleVillage.modifiers.presets.barracks`
   inside `src/balancing/config/idleVillage/gameplayModifiersConfig.ts` once that module
   exists; until migration completes, exports land under
   `data/exports/idleVillage/barracks/` with the same schema.

### Market Consumables Builder

1. **Scope**: Consumables affecting entire parties use `scope='SESSION'`; single-use per
   resident items use `scope='RESIDENT'` with `lifetime.type='INSTANT'`.
2. **Owner Metadata**: `owner` must include `{ type: 'item', id: consumableId, label:
   consumableName }` to unblock telemetry queries.
3. **Conditions**: Provide presets for `questTags` (e.g., `['trial_fire']`) and
   `residentIds` (auto-filled when item binds to unique characters). Ensure no inline
   lists—read from `consumableConfig.targetingRules`.
4. **Storage**: Authoring UI persists drafts via
   `PersistenceService.saveData('iv_market_builder_drafts_v1', payload)`; published
   consumables commit to `src/balancing/config/idleVillage/marketConsumables.ts` after CLI
   validation.

### Trait Editor

1. **Stat Binding**: Traits can emit multiple modifiers; enforce `scope='RESIDENT'` and
   derive owner from trait definition (`owner.id = trait.id`).
2. **Derived Stats**: When targeting derived stats (`stat_derived_synergy`,
   `stat_derived_resolve`), require designers to link the originating subsystem doc
   (progression, morale) in `metadata.references`.
3. **Guardrails**: Traits flagged as negative must set `value` negative for ADD
   and `value < 1` for MULT; CLI rejects contradictory values.
4. **Persistence**: Traits live in `src/balancing/config/idleVillage/traitsConfig.ts`;
   editor writes preview exports to `tmp/component-lab-deps/traits/trait_<id>.json` for
   review.

## Serialization Schema

All builders conform to the schema defined in GM-REG. The shared Zod module (to be
created under `src/balancing/config/idleVillage/gameplayModifierSchema.ts`) must export
both the type and helper factories:

```ts
import { z } from 'zod';

export const GameplayModifierSchema = z.object({
  id: z.string().min(1),
  statId: z.string().regex(/^stat_[a-z0-9_]+$/),
  operation: z.enum(['ADD', 'MULT', 'SET']),
  scope: z.enum(['GLOBAL', 'SESSION', 'LOCATION', 'QUEST', 'RESIDENT']),
  value: z.number(),
  mode: z.enum(['ADDITIVE', 'MULTIPLICATIVE', 'OVERRIDE']).default('ADDITIVE'),
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
  metadata: z.record(z.unknown()).optional(),
  sourceConfigId: z.string().min(1),
});
```

Builder implementations must import the schema, call
`GameplayModifierSchema.parse(modifier)` before persisting, and surface validation errors
directly in the UI (no silent casting).

## Validation Checklist

Before committing any modifier payload, designers and CI must verify:

1. **Scope Required** – Every modifier explicitly sets `scope`; UI defaults must be
   visible to the author.
2. **Stacking Defaults** – `mode` remains additive unless reviewer-approved;
   multiplicative overrides require `metadata.approver`.
3. **Source of Truth** – `statId` must come from `gameplayStats`; disallow manual string
   input.
4. **Owner Metadata** – Provide `{ type, id, label }` for telemetry and
   migration mapping.
5. **sourceConfigId Present** – Points to the config module or preset
   responsible for the modifier (e.g., `idleVillage.activities.forest_patrol`).
6. **PersistenceService Usage** – UI builders never write directly to
   `localStorage`; use async persistence helpers.
7. **CLI Validation** – Run `npm run modifier:lint -- <target>` (see CLI
   section) and block publish if the command exits non-zero.
8. **Telemetry Hooks Enabled** – Builder must emit `modifier_draft_saved` /
   `modifier_published` telemetry events with stat/scope metadata for
   auditing.

## CLI & Testing

<!-- markdownlint-disable MD013 -->
| Command | Purpose | Notes |
| --- | --- | --- |
| `npm run modifier:lint -- --input data/exports/idleVillage/activities/*.modifiers.json` | Validates JSON exports against the schema and policy checklist. | Implemented in `scripts/builder/modifierLinter.ts` (to be delivered by future prompt). |
| `npm run modifier:diff -- --target src/balancing/config/idleVillage/gameplayModifiersConfig.ts` | Compares exported drafts against canonical config, showing per-modifier diffs. | Uses checksum to ensure deterministic ordering. |
| `npm run test -- tests/unit/idleVillage/GameplayModifierRegistry.test.ts` | Ensures stacking behavior remains stable after builder edits. | Required before merging any builder output. |
| `npm run lint -- docs` | Markdown lint for this handbook and related specs. | Part of GM-BLD safeguard suite. |
| `npm run build:check` | TypeScript compilation (guarantees schema imports compile). | Mandatory for every prompt touching builder docs/tooling. |
| `npm run kanban:lint` | Ensures Kanban metadata updated. | Run after updating agent_assignments row. |
<!-- markdownlint-enable MD013 -->

Test data should live under `tests/fixtures/modifiers/` to allow regression
suites to load builder outputs without depending on UI components.

## Worked Examples

### Barracks Discipline Aura (converted)

```ts
const barracksDisciplineAura = {
  id: 'mod_barracks_discipline_aura',
  statId: 'stat_core_focus',
  operation: 'ADD',
  scope: 'LOCATION',
  value: 5,
  mode: 'ADDITIVE',
  maxStacks: 1,
  lifetime: { type: 'SESSION' },
  owner: {
    type: 'building',
    id: 'barracks_lvl1',
    label: 'Barracks L1',
  },
  sourceConfigId: 'idleVillage.barracks.level1',
};
```

_Source_: Derived from the existing Barracks Level 1 entry in
`src/balancing/config/idleVillage/barracksConfig.ts`. The builder stores this
JSON in `data/exports/idleVillage/barracks/discipline_aura.modifiers.json`
until the config migrates.

### Market Ration Crate (converted)

```ts
const rationCrateBoost = {
  id: 'mod_market_ration_crate_output',
  statId: 'stat_reward_food',
  operation: 'MULT',
  scope: 'SESSION',
  value: 0.15,
  mode: 'MULTIPLICATIVE',
  lifetime: { type: 'TIMED', durationTicks: 6 },
  owner: {
    type: 'item',
    id: 'consumable_ration_crate',
    label: 'Ration Crate',
  },
  metadata: {
    approver: 'balancing-lead',
    note: 'Stacking capped at two crates',
  },
  sourceConfigId: 'idleVillage.market.consumables.rationCrate',
};
```

_Source_: Mirrors the reward multiplier previously in
`marketConsumablesConfig`. Setting `metadata.approver` satisfies the
multiplicative override policy.

### Trait – Edge Walker

```ts
const edgeWalkerTrait = {
  id: 'mod_trait_edge_walker_riskbuffer',
  statId: 'stat_derived_riskBuffer',
  operation: 'ADD',
  scope: 'RESIDENT',
  value: 3,
  mode: 'ADDITIVE',
  conditions: {
    tags: ['edge'],
    predicates: ['requiresNightPhase'],
  },
  owner: {
    type: 'trait',
    id: 'trait_edge_walker',
    label: 'Edge Walker',
  },
  sourceConfigId: 'idleVillage.traits.edgeWalker',
};
```

_Source_: Adapted from trait metadata inside `traitsConfig`. The builder
automatically injects `requiresNightPhase` predicate when designers toggle the
night-phase capability.

## Next Steps

1. **Implement Modifier Linter CLI** – Create `scripts/builder/modifierLinter.ts`
   that loads exports, validates via schema, enforces checklist, and writes
   reports to `test-results/modifier-lint-<date>.json`.
2. **Add Gameplay Stats Module** – Introduce
   `src/balancing/config/idleVillage/gameplayStats.ts` with typed catalog
   consumed by all builders.
3. **Wire UI Builders** – Update Activity/Barracks/Market/Trait builders to
   consume this guide, replacing ad-hoc dropdowns and persistence.
4. **Telemetry Dashboard** – Extend analytics
   (`src/analytics/idleVillage/modifierAuthoringTelemetry.ts`) to visualize builder
   usage and policy violations.

Refer back to GM-REG for schema updates and GM-MIG for migration/telemetry appendices.

<!-- markdownlint-enable MD013 -->
