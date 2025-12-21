# Phase 12: Idle Incremental RPG – Task Checklist

> Derived from `idle_village_plan.md`. Design changes → update the plan first.

---

## 12.1 – Time & Activity Engine

- [ ] Define domain types for time & activities (engine layer)
  - [ ] `IdleTimeUnit`, `ActivityKind`, `ActivityDefinition`, `ScheduledActivity`, `VillageState` interfaces
- [ ] Implement pure time engine
  - [ ] `scheduleActivity(state, activityDef, assignedChars, startTime)`
  - [ ] `advanceTime(state, delta)` that resolves finished activities
- [ ] Implement fatigue & "stanco fino al giorno dopo" rule (config-driven threshold)
- [ ] Add unit tests for time & activity engine

## 12.2 – Characters & Roster Integration

- [ ] Define `Resident` and related types (status, home assignment)
- [ ] Integrate `SavedCharacter`/`Entity` into idle incremental RPG village domain
- [ ] Implement founder generation based on archetype + difficulty
- [ ] Implement recruitment flow (cost in gold + housing cap)
- [ ] Implement food upkeep per character (config-driven)
- [ ] Add unit tests for founder generation & recruitment rules

## 12.3 – Jobs & Worker Placement

- [ ] Create `jobsConfig.ts` with initial job definitions
  - [ ] `woodcutting`, `quarry`, `farm`, `odd_jobs`, `basic_training`
- [ ] Create `villageBuildingsConfig.ts` with initial building definitions
  - [ ] Starting house, 2 job sites, 1 training ground, 1 shop
- [ ] Implement job resolution engine `resolveJobActivity`
- [ ] Model worker placement constraints (slot limits per building)
- [ ] Add simulation tests for jobs (reward & fatigue distributions)

## 12.4 – Quest System (Dispatch-Style)

- [ ] Create `questConfig.ts` with initial quest templates
  - [ ] Define tags, difficulty, danger rating, durations, party size limits
- [ ] Implement party effectiveness calculation (weight-based on stats/traits)
- [ ] Implement mapping `EffectivePower` → outcome distribution
- [ ] Add quest `level` field and level-based XP formula (XP depends only on quest level)
- [ ] Implement difficulty/reward variance categories with multipliers and color/tooltip config
- [ ] Implement procedural quest generator (name, mission type, reward mix) using config tables
- [ ] Implement spawn system for active quests around the village (near-village low-level quests first, high-level quests gated by exploration buildings/config)
- [ ] Add simulation tests for quest outcomes (winrate, injury/death, XP and variance distributions)

## 12.5 – Combat Integration (Idle Autobattler)

- [ ] Implement adapter from quest combat party → idle combat engine
- [ ] Implement enemy generation from config (archetypes/tiers)
- [ ] Implement `runQuestCombat` helper returning `CombatOutcome`
- [ ] Wire quest outcome resolution to combat results
- [ ] Add unit tests/regression tests for combat adapter

## 12.6 – Injury & Death System

- [ ] Define injury levels and effects (`light`, `moderate`, `severe`)
- [ ] Implement injury application rules for quest outcomes
- [ ] Implement death rules based on danger & outcome
- [ ] Implement rules for injured characters working in buildings
- [ ] Add tests for injury/death probabilities and state transitions

## 12.7 – Village Map & Expansion

- [ ] Create `villageMapConfig.ts` (slots, coordinates, unlock costs)
- [ ] Implement minimal expansion logic (house upgrade + new job site)
- [ ] Ensure config-driven mapping from buildings/jobs to map slots
- [ ] Add tests for expansion and unlock conditions

## 12.8 – Economy, Food & Maintenance

- [ ] Define resource types (gold, food, materials) in shared config/types
- [ ] Implement resource updates from jobs/quests/training
- [ ] Implement food consumption & starvation penalties
- [ ] Add simulation tests for basic economic loop

## 12.9 – UI/UX – Idle Village Screen

- [ ] Design Idle Village layout (left roster, center map, right activity/log)
- [x] Implement character roster UI with drag handles & status badges *(ResidentRoster component wired to drag handlers, 2025-12-20)*
- [x] Implement village map UI with droppable slots for jobs/quests *(IdleVillageMapPage + MapSlotVerbCluster, drop validation & highlights, 2025-12-20)*
- [ ] Implement quest detail panel (risk, reward, duration, death chance, quest level)
- [ ] Implement activity queue & event log UI (Cultist Simulator-style cards/lanes for jobs/quests)
- [ ] Implement visual indicators (green/yellow/red badges) for difficulty/reward categories driven from config
- [ ] Add detailed tooltips explaining quest level, difficulty/reward categories and color semantics
- [ ] Apply Gilded Observatory theme and responsive layout
- [ ] Add basic Playwright E2E for main loop (job + simple quest) — *plan drafted in `docs/plans/idle_village_drag_drop_e2e_plan.md`; implementation underway in `tests/ui.spec.ts`.*

## 12.10 – Testing & Integration

- [ ] Add Vitest suites for Idle Village domain (time, jobs, quests, injury, economy)
- [ ] Add simulation tests with JSON outputs for non-regression
- [ ] Integrate Idle Village tests into existing `npm test` flows
- [ ] Verify no regressions on combat/archetypes/balancer suites

---

## Idle Village VerbCard Refactor (UI Focus)

- [x] Align Idle Village UI with the new VerbCard system (`docs/plans/idle_village_verbcard_refactor_plan.md`)
- [x] Implement `ScheduledVerbSummary` helper pipeline (variants, tone, risk, deadlines, timers)
- [x] Introduce `MapSlotVerbCluster` to replace legacy `MapSlotMarker` on the map
- [x] Render quest/job offers as VerbCards within map clusters, preserving dnd-kit drop states
- [ ] Replace the “Jobs & Quests in progress” panel with compact text-based summaries driven by scheduled verbs
- [ ] Ensure hunger/injury/system verbs reuse the same summary data for consistency
- [ ] Update quest offer UI (map + HUD) with risk badges, tone colors, and Accept CTA
- [ ] Add Vitest coverage for helper logic and Playwright smoke test for drag/drop + quest offer accept flows

## Idle Village Map-Only Page (Verb System)

- [ ] Reference implementation plan: `docs/plans/idle_village_map_only_plan.md`
- [ ] Wire shared time controls (play/pause/step) to `tickIdleVillage` so every VerbCard shares the same clock
- [ ] Implement passive/system VerbCard selectors (hunger, upkeep) driven by config `globalRules`
- [ ] Ensure continuous jobs auto-reschedule per activity metadata (`continuousJob`, `supportsAutoRepeat`, `autoRepeatDelayUnits`)
- [ ] Surface quest offer deadlines/expiry on the map-only page and auto-remove expired offers
- [ ] Add filters/overlay controls for passive/jobs/quests visibility on the map-only page
- [ ] Expand tests (Vitest + Playwright) to cover passive verbs, continuous jobs, and quest expiry flows on the new page

## Idle Village Passive Effects Tab

- [ ] Create `src/balancing/config/idleVillage/passiveEffects.ts` with schema mirroring Jobs/Quests (id, label, description, icon, tone, slotId/slotTags, frequency formula, resource deltas, requirements, metadata)
- [ ] Extend `IdleVillageConfig` types + Zod schemas to include `passiveEffects` collection
- [ ] Build CRUD UI tab (Idle Village Config) for passive effects, reusing weight-based creator pattern
- [ ] Expose hook/selectors that read passive effects and feed `buildSystemVerbSummary`
- [ ] Ensure passive effects export/import via config snapshots and JSON editors
- [ ] Add docs explaining passive config workflow (plan + README linkage)

---

## Meta

- [ ] Link this file and `idle_village_plan.md` from `MASTER_PLAN.md`
- [ ] Keep tasks strictly actionable; move any design changes back into the plan
- [x] Capture a dedicated drag/drop E2E test plan (`docs/plans/idle_village_drag_drop_e2e_plan.md`)
