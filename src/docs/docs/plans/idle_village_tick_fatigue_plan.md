# Idle Village Tick-Based Fatigue & Recovery Plan

**Status:** Draft v0.2 (2025-12-29)

## 1. Goals & Requirements

1. Model fatigue and rewards as **per-day budgets** divided evenly across ticks (1 tick = 1 `VillageTimeUnit` for every system).
2. Support **partial completion for jobs** flagged as such: resources and fatigue adjustments accrue every tick, not only at activity completion.
3. Synchronize the loop with the **day/night cycle** so that:
   - Day ticks advance production and consume fatigue/resources.
   - Night ticks restore fatigue per resident according to config.
4. Add a **continuous assignment mode** for jobs flagged as persistent: characters remain bound indefinitely, producing during day ticks and resting at night until relieved.
5. Keep everything **config-first** (no hardcoded stat values, tick counts, or per-job multipliers) and reuse the [`Gameplay Modifier Registry`](./idle_village_modifiers_plan.md) for every additive/multiplicative tweak (e.g., barracks rest bonuses, cursed terrain penalties) via `GameplayModifier` entries targeting `stat_fatigue_gain`, `stat_fatigue_recovery`, `stat_reward_gold`, etc.
6. Maintain compatibility with existing quest resolution and UI layers (Village Sandbox, Map HUD, Resident Roster) without duplicating logic outside the engine modules.

## 2. Research Snapshot

- `TimeEngine.advanceTime` already streams fatigue using `getActivityFatigueGain(...)` but only accumulates at completion and does not allocate reward per tick.
- `IdleVillageConfig.globalRules` exposes `dayLengthInTimeUnits`, `dayNightCycle`, and `fatigueRecoveryPerDay`, yet no module distributes these values across ticks.
- Jobs currently resolve in `resolveJob`, which simply grants all rewards at completion and ignores partial progress.
- `IdleVillageMapPage` handles auto-repeat jobs (`continuousJob` metadata) entirely in the UI; engine-side affinity is limited.

## 3. Proposed Architecture

### 3.1 Config Extensions

1. **Global rules additions**
   - `ticksPerDay`: optional explicit tick count override (defaults to `dayLengthInTimeUnits`).
   - `ticksPerNight`: optional night tick count (defaults to `dayNightCycle.nightTimeUnits`).
   - `fatigueRecoveryPerNightTick`: optional override; default derives from `fatigueRecoveryPerDay / ticksPerNight`.
   - `productionHaltFatigueThreshold`: optional ratio that determines when residents stop producing mid-day (e.g., 100% fatigue).
2. **Activity definition metadata**
   - `dailyFatigueCost`: config-level field for jobs describing per-day fatigue budget; ignored for quests/rituals.
   - `dailyRewardProfile`: collection of `resourceId` + `amountPerDay` for deterministic production (jobs only).
   - `supportsPartialResolution`: boolean; true per job (default false). UI authoring must expose the toggle so designers can retrofit existing activities or enable it after upgrades.
   - `continuousJob` (reuse existing flag) / `supportsAutoRepeat`: keep current metadata names but formalize behavior (continuous = infinite assignment, auto-repeat = reschedule on completion). Both flags must remain editable from the activity creation UI and persisted inside `IdleVillageConfig`.
   - `tickCostProfile`: optional extension for secondary costs (materials, upkeep) consumed per tick. Also used by probabilistic maintenance actions that roll success/fail each tick.
3. Update `types.ts`, `schemas.ts`, `defaultConfig.ts`, and authoring UIs (`IdleVillageGlobalRulesTab.tsx`, Activities tab) so designers can toggle `supportsPartialResolution`, `continuousJob`, `supportsAutoRepeat`, and edit tick budgets directly from the menu. Ensure JSON export/import and PersistenceService snapshots capture the new metadata.

### 3.2 Engine Changes

1. **Tick slicing helper**
   - Add `iterateTimeWindows(state.currentTime, targetTime, tickSize)` to enumerate tick boundaries for day/night segments.
   - Derive tick size from `dayLengthInTimeUnits / ticksPerDay` and `nightTimeUnits / ticksPerNight`.
2. **Per-tick fatigue & reward streaming**
   - Extend `ScheduledActivity` with `progressedTicks` and `lastTickTime` to avoid double-counting.
   - During each tick window intersecting an activity, compute fractional progress and update (jobs only when `supportsPartialResolution` is true):
     - Fatigue: `dailyFatigueCost / ticksPerDay`, clamped by slot modifiers/injury multipliers.
     - Rewards: `dailyRewardProfile[*].amountPerDay / ticksPerDay` for jobs flagged `supportsPartialResolution`.
   - Accumulate partial rewards into `updatedResources` and enqueue `job_progressed` events for HUD feedback.
3. **Partial completion semantics**
   - Keep `activity.status` as `running` until scheduled `endTime`; partial rewards/fatigue do not mark completion.
   - On cancellation/early removal, already-applied ticks remain (no rollback).
   - Jobs flagged `supportsPartialResolution` expose `progressedTicks` for incremental display; all other actions (quests, expeditions, rituals) keep all-or-nothing payouts even if their duration spans many ticks.
4. **Continuous assignments**
   - Introduce `activity.runtimeMode = 'finite' | 'continuous'`.
   - For `continuous` jobs, automatically reschedule a new block that starts immediately after the previous block with same residents/slot, unless a resident is exhausted or manually detached.
   - Enforce that residents assigned to continuous jobs shift into `resting` status at night tick boundaries while remaining attached.
5. **Night recovery loop**
   - Track `ResidentsRestState` with `isResting`, `pendingRecovery`, `maxFatigue`.
   - Every night tick, reduce fatigue by `fatigueRecoveryPerNightTick`, ensuring `status` transitions from `exhausted`→`available` when below threshold.
   - Residents bound to continuous jobs recover at night ticks but remain assigned; they cannot produce until day phase resumes.
6. **Resource accounting**
   - Add `perTickCostProfile` evaluation (e.g., food upkeep, tool durability) so that partial ticks still consume maintenance resources.
   - Ensure conversions go through existing `VillageResources` map.

### 3.3 UI / State Hooks

1. `VillageState` additions (`ongoingTickEvents`, `residentRestState`) remain engine-side; UI reads derived summaries (`buildScheduledVerbSummary`).
2. Expand `ActiveActivityHUD` and `ResidentRoster` selectors to display:
   - Current fatigue delta per tick.
   - Partial reward tallies for jobs ("+1 gold/tick" badges).
   - Continuous assignment badge (∞) and rest/production states.
3. Keep UI thin: all calculations come from new engine events.

### 3.4 Testing Strategy

1. **Unit tests** (`src/engine/game/idleVillage/__tests__`):
   - Tick slicing utility.
   - Partial reward accrual for jobs with arbitrary tick counts.
   - Night recovery math (fatigue restoration, exhaustion transitions).
2. **Integration tests** (`tests/idleVillage/tickLoop.test.ts`): simulate multi-day runs with continuous jobs and verify resources/fatigue vs config budgets.
3. **Playwright** additions: confirm UI reflects per-tick increments and continuous loops.

## 4. Implementation Phases

1. **Schema & config groundwork** (types, schemas, default config, UI editors, docs).
2. **Engine tick runner** (helpers, `advanceTime` integration, new event types).
3. **Partial job resolver + continuous mode** (job metadata, IdleVillageEngine glue, persistence of assignments).
4. **Night recovery + resident state transitions** (rest windows, statuses, exhaustion handling).
5. **UI & HUD updates** (ResidentRoster, Activity HUD, risk displays referencing new metadata).
6. **Testing & docs** (unit/integration suites, doc updates, config examples).

### 3.5 Registry Mapping & Scope Policy

- **Scope to Stat Map**
  - `LOCATION` modifiers (terrain, slot presets) must target `stat_fatigue_gain` or `stat_reward_*` for per-slot adjustments. Example: `mod_terrain_fog_fatigue = { scope: 'LOCATION', operation: 'MULT', value: 0.15 }`.
  - `RESIDENT` modifiers (traits, injuries, consumables) target `stat_fatigue_recovery`, `stat_core_focus`, etc., and stack multiplicatively after LOCATION per the registry pipeline.
  - `SESSION/GLOBAL` scopes handle seasonal effects (e.g., `mod_winter_rest_penalty`) so Tick Engine can apply them uniformly without ad-hoc constants.

- **Authoring Flow**
  1. Designers register/flag the modifier in the Gameplay Modifier Registry (`gameplayModifiersConfig.ts`) with `sourceConfigId` pointing to the originating plan/config.
  2. Tick engine queries `selectResolvedModifiers({ statId: 'stat_fatigue_gain', scope: ['GLOBAL','SESSION','LOCATION','RESIDENT'] })` once per resident per tick and feeds the aggregated multiplier into fatigue math.
  3. UI surfaces display modifier provenance via Style Lab tokens (see Style Lab Flexibility plan update) instead of textual “+10% fatigue” strings.

- **Migration Notes**
  - Existing references to `slot.modifiers.fatigueMultiplier` or `terrainFatiguePenalty` are now marked **Deprecated – replace with registry**. Their values must be migrated into explicit `GameplayModifier` entries so the pipeline remains auditable and telemetry-ready.

## 5. Risks & Mitigations

1. **Double-counting resources**: guard via `progressedTicks` tracking and snapshot-based tests.
2. **Config drift**: centralize defaults in `globalRules` and reuse them across engine/UI; add assertions when metadata is missing for jobs marked partial.
3. **Performance**: tick iteration per activity could explode; limit iteration by computing tick windows only when `advanceTime` crosses a tick boundary and by caching cycle snapshots.
4. **Resident locking**: ensure UI affords manual detach for continuous jobs and engine exposes safe cancellation API.

## 6. Open Questions

1. What is the canonical definition of a "tick"? Should it always equal `1 time unit`, or can we derive it from `dayLengthInTimeUnits / ticksPerDay`? (Needed to avoid drift.)
2. Do quests also require per-tick reward/fatigue streaming, or is the requirement limited to jobs/maintenance activities?
3. For continuous jobs, should there be a UI control to pause/resume production, or must they run 24/7 until manually unassigned?
4. How should multi-resident jobs split fatigue and rewards—equally per resident, or weighted via slot modifiers/stat weights?
5. Are there activities whose rewards are not strictly linear with time (e.g., all-or-nothing) that must remain exempt from partial payouts?
