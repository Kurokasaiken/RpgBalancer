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
- [ ] Implement character roster UI with drag handles & status badges
- [ ] Implement village map UI with droppable slots for jobs/quests
- [ ] Implement quest detail panel (risk, reward, duration, death chance, quest level)
- [ ] Implement activity queue & event log UI (Cultist Simulator-style cards/lanes for jobs/quests)
- [ ] Implement visual indicators (green/yellow/red badges) for difficulty/reward categories driven from config
- [ ] Add detailed tooltips explaining quest level, difficulty/reward categories and color semantics
- [ ] Apply Gilded Observatory theme and responsive layout
- [ ] Add basic Playwright E2E for main loop (job + simple quest)

## 12.10 – Testing & Integration

- [ ] Add Vitest suites for Idle Village domain (time, jobs, quests, injury, economy)
- [ ] Add simulation tests with JSON outputs for non-regression
- [ ] Integrate Idle Village tests into existing `npm test` flows
- [ ] Verify no regressions on combat/archetypes/balancer suites

---

## Meta

- [ ] Link this file and `idle_village_plan.md` from `MASTER_PLAN.md`
- [ ] Keep tasks strictly actionable; move any design changes back into the plan
