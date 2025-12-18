# Idle Village Map Verb System – Implementation Plan

**Status:** Draft · **Owner:** Idle Village pod · **Last Updated:** 2025-12-18

## 1. Objectives

1. **Unify Verb Rendering on the Map** – The map-only page (`IdleVillageMapPage.tsx`) must render *all* verbs (passive drains, continuous jobs, quests/offers) via the standard `VerbCard` pipeline, consuming the shared `VerbSummary` builders from `src/ui/idleVillage/verbSummaries.ts`.
2. **Shared Time Flow** – A single time cursor (backed by `tickIdleVillage`) drives every VerbCard. When time is paused, no verb progresses; when it runs, passive/resource drains, jobs, and quest deadlines all advance in lockstep.
3. **Config-Driven Behavior** – Activity cadence, resource consumption, quest expiry, and tone/visuals derive exclusively from `IdleVillageConfig` (e.g., `globalRules.secondsPerTimeUnit`, activity metadata, quest spawn settings). No hardcoded timers or resource IDs in the UI.
4. **Role-Specific Verb Buckets**
   - **Passive/system verbs:** Hunger, upkeep, or background effects defined via config-driven hooks; consume resources at fixed intervals.
   - **Continuous jobs:** Activities tagged as `job` (optionally `metadata.continuousJob`) that auto-reschedule until cancelled.
   - **Quests/offers:** Activities tagged `quest`, spawned via config weights, expiring after `metadata.questDeadlineInDays` or offer `expiresAtTime`.
5. **Diagnostics & Determinism** – Maintain deterministic RNG (LCG seed) and expose debug hooks to trace time advancement, verb state, and resource deltas for testing.

## 2. Non-Goals

- Introducing new activity types (e.g., raids) or overhauling TimeEngine logic.
- Offline progression, multi-run persistence, or resource UI outside the map context.
- Visual redesign of VerbCard beyond scaling/variants already supported.
- Replacing IdleVillagePage HUD; this plan focuses on the map-only surface.

## 3. Current State Snapshot

| Area | Current Behavior | Gap |
| --- | --- | --- |
| Map verbs | `IdleVillageMapPage.tsx` renders `VerbCard`s for scheduled jobs/quests using helper summaries, but only when activities already exist (`@filepath:src/ui/idleVillage/IdleVillageMapPage.tsx#486-553`). | No passive/system verbs; no continuous auto-scheduling beyond simple repeat hook; quest expiry not surfaced. |
| Time sync | Local `isPlaying` flag toggles `setInterval` that advances time independently (`@filepath:src/ui/idleVillage/IdleVillageMapPage.tsx#321-331`). | Not integrated with global loop; passive drains & quest offers are not tied into map-specific controls. |
| Config usage | Activity metadata partially respected (`mapSlotId`, `supportsAutoRepeat`). | No use of `globalRules.secondsPerTimeUnit`, `dayLengthInTimeUnits`, quest spawn cadence, or passive resource config. |
| Documentation | VerbCard refactor plan exists (`docs/plans/idle_village_verbcard_refactor_plan.md`). | No dedicated plan for the map-only page; TODO/master plan unaware. |

## 4. Research Highlights (Dec 18 Review)

- **IdleVillagePage as reference implementation**
  - Uses `useVillageStateStore` for undo/export/import/reset, ensuring deterministic history (`@filepath:src/ui/idleVillage/IdleVillagePage.tsx#270-350`).
  - Drives auto-repeat jobs and hunger FX inside `advanceTimeBy` via `tickIdleVillage` (`@filepath:src/ui/idleVillage/IdleVillagePage.tsx#497-597`).
  - Hooks quest/job scheduling helpers (`handleSchedule`, `handleAssignResidentToSlot`) that respect `metadata.continuousJob`, `mapSlotId`, `slotTags`.
- **TimeEngine behaviors**
  - Emits `food_consumed_daily` events based on `globalRules.dayLengthInTimeUnits` and `foodConsumptionPerResidentPerDay` (`@filepath:src/engine/game/idleVillage/TimeEngine.ts#407-437`).
  - Quest offers spawn every N days with per-quest metadata: `questSpawnEnabled`, `questSpawnWeight`, `questMinDay`, `questAllowedSlotTags`, etc. (`@filepath:src/engine/game/idleVillage/TimeEngine.ts#454-621`).
- **Config metadata already available**
  - Activities expose `metadata.continuousJob`, `supportsAutoRepeat`, `mapSlotId`, `questDeadlineInDays`, and display-only risk percentages (`@filepath:src/balancing/config/idleVillage/defaultConfig.ts`).
  - `globalRules` provide `secondsPerTimeUnit`, `dayLengthInTimeUnits`, quest spawn cadence, and starting resources.
- **Gap on map page**
  - Current `IdleVillageMapPage` keeps its own local `useState` for `VillageState`, so undo/export/time controls added to IdleVillagePage are not reflected.
  - Passive/system verbs (hunger, injury alerts) are emitted as events but not translated into VerbCards on the map view.

## 4. Guiding Principles

- **Single Source of Truth:** All verb data flows from `VillageState` + config. UI selectors (memoized) transform domain state → summaries; no ad-hoc timers.
- **Config-First Hooks:** Passive verbs reference config modules (e.g., `globalRules.foodConsumptionPerResidentPerDay`). Additional passive behaviors must be authored in config before UI wiring.
- **Pure Selectors:** Keep summarizers (`buildScheduledVerbSummary`, upcoming passive/system builders) pure for easy testing.
- **Deterministic State:** Map page seeds its RNG via config (`globalRules.defaultRandomSeed ?? 12345`) to keep quest spawning reproducible.
- **Shared Store:** Where possible reuse `useVillageStateStore` so map-only page, full page, and future overlays observe the same `VillageState`, undo history, and persistence hooks.

## 5. Architecture Overview

1. **Time Orchestrator**
   - `IdleVillageMapPage` owns a `useReducer/useState` for `VillageState` seeded via `createVillageStateFromConfig` and optional founder preset.
   - `advanceTimeBy(delta)` wraps `tickIdleVillage` and dispatches passive/system events (food, injuries) before returning new state.
   - Play/pause + single-step buttons feed into `advanceTimeBy` to ensure shared cadence.

2. **Passive/System Verbs**
   - Introduce a dedicated passive-effects config layer (new file `src/balancing/config/idleVillage/passiveEffects.ts` + corresponding tab in Idle Village Config UI) that mirrors the job/quest authoring experience. Each passive entry defines:
     - `id`, `label`, `description`, `icon`, `tone` (for VerbCard visuals)
     - `slotId` or `slotTags` (where its VerbCard appears on the map)
     - `frequencyFormula` / `timeUnitsBetweenTicks`
     - `resourceDeltas` (consumption/production)
     - Optional `statRequirements`, `unlockConditions`, `metadata` for future scaling.
   - `buildSystemVerbSummary` consumes those passive configs plus engine events (e.g., hunger) to render verbs with countdowns and risk indicators.
   - Map page listens to resource deltas/time to spawn passive VerbCards anchored to synthetic slot (e.g., `slotId: 'system_overlay'`).

3. **Continuous Jobs**
   - Activities tagged `job` with `metadata.continuousJob` or `supportsAutoRepeat` remain active. When completion events fire, scheduler immediately enqueues a new instance (already partially done) but now must:
     - Respect crew availability/fatigue thresholds.
     - Use config-driven cooldowns (future metadata `autoRepeatDelayUnits`).

4. **Quests & Offers**
   - Quest offers continue to originate from TimeEngine quest spawner.
   - `offer.expiresAtTime` or quest metadata deadline informs VerbCard countdown.
   - Expired offers automatically purge and optionally spawn “Expired” system verb.

5. **Verb Buckets Rendering**
   - `verbsBySlot` groups scheduled verbs per map slot.
   - `passiveVerbs` bucket attaches to overlay UI.
   - `questOffersBySlot` groups offers per slot; pinned to clusters with CTA.

## 6. Implementation Phases

### Phase 0 – Config & Type Prep

- Extend `IdleVillageConfig` (if needed) with passive verb definitions (e.g., `globalRules.passiveVerbs` or dedicated `passiveEffects` map) and quest expiry defaults.
- Ensure `globalRules.secondsPerTimeUnit` and `dayLengthInTimeUnits` are surfaced via `useIdleVillageConfig` hook.
- Document new metadata keys (`continuousJob`, `autoRepeatDelayUnits`, `passiveResourceConsumptionId`, etc.).
- Audit `IdleVillagePage` metadata usage (market jobs, auto-repeat) and ensure matching selectors exist for the map page to avoid divergence.
- Create `src/balancing/config/idleVillage/passiveEffects.ts` + tab UI schema mirroring Jobs/Quests so designers can CRUD passive entries.

### Phase 1 – Time Synchronization

- Replace bespoke `setInterval` with a shared `useAnimationFrame`/`useInterval` hook driven by `globalRules.secondsPerTimeUnit` for consistent scale. When possible wire `IdleVillageMapPage` into `useVillageStateStore` so both pages share the same `advanceTimeBy`.
- Expose manual step controls (±1 unit, ±day) for debugging.
- Ensure `advanceTimeBy` dispatches passive drains even when no jobs run (hook into `tickIdleVillage` results + system event queue, mirroring IdleVillagePage hunger FX).

### Phase 2 – Passive/System Verb Pipeline

- Implement selectors that read config passive definitions + `VillageState` to emit `VerbSummary` entries for hunger/upkeep drains. Use `buildSystemVerbSummary` as baseline and extend it with countdown + risk metadata.
- Tie resource consumption events (daily food) to these verbs; show countdown until next tick (e.g., `nextFoodTickTime = ceil(currentTime / dayLength) * dayLength`).
- Add Vitest coverage for builder edge cases.
- Include placeholder passive verbs for injuries, buffs, or building auras by reading config-defined passive entries.

### Phase 3 – Continuous Job Loop

- Enforce config-driven auto-repeat: after job completion, requeue respecting `metadata.autoRepeatDelayUnits` and resident fatigue thresholds (read from `globalRules.maxFatigueBeforeExhausted`). Mirror IdleVillagePage auto-repeat logic so both surfaces stay aligned.
- Surface job persistence on map via special badge (e.g., “Looping”).
- Propagate `supportsAutoRepeat` / `continuousJob` flags into `VerbSummary` so map UI can display loop state, and ensure quests/jobs pulled from config keep their `mapSlotId` association.

### Phase 4 – Quest Lifecycle & Expiry

- Display quest deadlines on VerbCards using `buildQuestOfferSummary`/`buildScheduledVerbSummary` (deadline label already supported but not surfaced prominently).
- Auto-expire offers when `expiresAtTime <= currentTime`, removing them from `VillageState` and optionally logging a system verb (and toast). Extend `spawnQuestOffersIfNeeded` consumer to stamp `expiresAtTime = createdAt + deadline`.
- Add optional notification (toast/log) tied to config flag.
- Show countdown ring/badge for offers so designers see when a quest is about to disappear.

### Phase 5 – UI Enhancements & Controls

- Add map overlay controls (play/pause, step, speed) sharing the same time state, reusing IdleVillagePage controls for undo/export/import if the shared store is adopted.
- Provide filter toggles (jobs/passive/quests) for readability.
- Ensure droppable clusters show combined passive + active states without conflicting pointer logic.
- Add notifications (toast, HUD badges) when passive verbs tick (e.g., hunger) so designers can correlate resource drains with map VerbCards.

### Phase 6 – Testing & Documentation

- Unit tests for new selectors/builders + scheduler hooks.
- Playwright scenario: assign resident → continuous job loops → pause/resume; spawn quest → verify expiry.
- Update docs (`idle_village_plan.md`, this plan, master plan) with outcomes.

## 7. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Time drift between map page and other Idle Village surfaces | Centralize time controls in a shared hook or future context so both pages can subscribe; for now, keep RNG seed + config-driven cadence identical. |
| Passive verbs overwhelming UI | Provide grouping/stacking with badges (e.g., hunger uses a single VerbCard with aggregated residents) and allow filters. |
| Config churn | Document every new metadata flag in `docs/plans/idle_village_plan.md` and update Zod schemas to enforce presence. |
| Drag-drop regressions | Maintain current droppable IDs (`slot-${slot.id}`) and extend tests to cover new passive overlays. |

## 8. Deliverables & Exit Criteria

- ✅ Updated `IdleVillageMapPage.tsx` consuming shared selectors for passive/jobs/quests, with unified time controls.
- ✅ Passive/system VerbCards driven by config, showing resource drain cadence and pausing/resuming with global time.
- ✅ Continuous jobs auto-repeat per config, respecting crew fatigue.
- ✅ Quest offers display and expire according to metadata deadlines, with clear countdown on the map.
- ✅ Vitest + Playwright coverage for selectors, scheduling loops, quest expiry, and drag-drop flows.
- ✅ Documentation: this plan, `idle_village_plan.md` references, `MASTER_PLAN.md` summary, and new checklist items in `idle_village_tasks.md`.

## 9. Passive Effects Config Tab & UI Requirements

1. **New Tab Structure**
   - Add a dedicated “Passive Effects” tab alongside Jobs/Quests in the Idle Village Config UI.
   - Tab lists all passive entries (`config.passiveEffects`) with search/filter by slot/tag/tone.
   - Uses standard Gilded Observatory cards (title, tone badge, description, slot preview).

2. **Editor Drawer**
   - On select/create, open drawer mirroring weight-based creators:
     - Fields: `id`, `label`, `description`, `icon`, `verbToneId`, `slotId`, `slotTags[]`, `timeUnitsBetweenTicks`, `frequencyFormula`, `resourceDeltas[]`, `statRequirements`, `unlockConditionIds[]`.
     - `resourceDeltas` uses same component as Jobs/Quests (Resource + Formula).
     - Provide live preview of VerbCard (tone + countdown) using builder helpers.

3. **Validation & Schema**
   - Enforce unique IDs, at least one placement hint (`slotId` or `slotTags`).
   - Either `timeUnitsBetweenTicks` or `frequencyFormula` must be provided.
   - Resource delta formulas validated via FormulaEngine; show inline errors.

4. **Integration Hooks**
   - Extend `useIdleVillageConfig` to expose CRUD helpers (`createPassiveEffect`, `updatePassiveEffect`, `deletePassiveEffect`).
   - Add memoized selector `usePassiveVerbSummaries` that transforms config entries into `PassiveEffectDefinition`.

5. **Import/Export & History**
   - Passive effects included automatically in JSON export/import + snapshots.
   - Undo/redo (history stack) treats passive edits as first-class operations.

6. **Testing & Docs**
   - Vitest: schema validation + selector coverage.
   - Playwright: smoke test editing a passive effect and verifying VerbCard update on map.
   - Update `idle_village_plan.md` + README to describe passive tab workflow.
