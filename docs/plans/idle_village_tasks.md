# Phase 12: Idle Incremental RPG – Task Checklist

> **Village Sandbox terminology update (Dec 2025):** This checklist now targets the rebuilt **Village Sandbox** experience (formerly the Idle Village page). Use the ActivityCard/ActivityCardDetail + ActivitySlot naming used inside Village Sandbox; legacy VerbCard references are deprecated.  
> Derived from `idle_village_plan.md`. Design changes → update the plan first.

---

## 12.11 – Theater View & Activity Cards

> Implementation detail: `docs/plans/idle_village_trial_of_fire_plan.md`

- [ ] Extend `ResidentState` with `survivalCount`, `isHero`, `isInjured` and wire hero promotion helpers
- [ ] Extend `ActivityState` with `isAuto`, `snapshotDeathRisk`, and capture risk snapshot when scheduling
- [ ] Implement `calculateSurvivalBonus` + Trial of Fire resolution inside `tickIdleVillage`
- [ ] Add auto-rescheduling logic for `isAuto` activities (respecting fatigue/slots)
- [ ] Build `RosterSidebar` with filters (All/Available/Heroes/Injured) and draggable hero tokens
- [ ] Create `TheaterView` container (panorama header + ActivityCard medallions) scoped to `mapSlotId`
- [ ] Update ActivityCard visuals to surface Auto infinity icon, hero borders, and “collection ready” halo
- [ ] Implement bloom expansion when dragging residents over closed slots to reveal TheaterView
- [ ] Hook hero promotion + survival streak events to UI feedback (toasts/logs)
- [ ] Add Vitest + Playwright coverage for Trial of Fire math, auto-loop scheduling, hero promotion, bloom UX

## 12.13 – Quest Blueprint & Quest Chronicle

> Implementation detail: `docs/plans/quest_chronicle_plan.md`

- [ ] Extend `IdleVillageConfig` types/Zod schema with `QuestBlueprint` + `QuestPhase` definitions (phases, type, requirements, icon, narrative).
- [ ] Update Activities authoring UI to edit quest phases and migrate sample quest (`quest_city_rats`) to the blueprint format.
- [ ] Implement `QuestManager` + quest state stored on `ScheduledActivity` (`currentPhaseIndex`, `phaseResults`, `status`).
- [ ] Teach `TimeEngine`/`IdleVillageEngine` to pause quests per phase and handshake with Trial/Combat/Work modules via callbacks.
- [ ] Build `QuestChronicle` UI component (stepper, halo for active, success/fail badges) and integrate above quest map slots + Theater link.
- [ ] Add Visual Lab quest sandbox with 3-phase blueprint (Exploration → Combat → Recupero bottino) and debug controls to fast-forward phases.
- [ ] Add Vitest (QuestManager progression) + Playwright (QuestChronicle visual updates + Theater deep link) coverage.

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
- [x] Integrate Idle Village tests into existing `npm test` flows
- [ ] Verify no regressions on combat/archetypes/balancer suites

---

## Village Sandbox ActivityCard Refactor (UI Focus)

- [x] Align Village Sandbox UI with the ActivityCard system (`docs/plans/idle_village_verbcard_refactor_plan.md`)
- [x] Implement `ScheduledVerbSummary` helper pipeline (variants, tone, risk, deadlines, timers)
- [x] Introduce `MapSlotActivityCluster` to replace legacy `MapSlotMarker` on the map
- [x] Render quest/job offers as ActivityCards within map clusters, preserving dnd-kit drop states
- [ ] Replace the “Jobs & Quests in progress” panel with compact text-based summaries driven by scheduled verbs
- [ ] Ensure hunger/injury/system activities reuse the same summary data for consistency
- [ ] Update quest offer UI (map + HUD) with risk badges, tone colors, and Accept CTA
- [ ] Add Vitest coverage for helper logic and Playwright smoke test for drag/drop + quest offer accept flows

## Village Sandbox Map-Only Page (Activity System)

- [ ] Reference implementation plan: `docs/plans/idle_village_map_only_plan.md`
- [ ] Wire shared time controls (play/pause/step) to `tickIdleVillage` so every ActivityCard shares the same clock
- [ ] Implement passive/system ActivityCard selectors (hunger, upkeep) driven by config `globalRules`
- [ ] Ensure continuous jobs auto-reschedule per activity metadata (`continuousJob`, `supportsAutoRepeat`, `autoRepeatDelayUnits`)
- [ ] Surface quest offer deadlines/expiry on the map-only page and auto-remove expired offers
- [ ] Add filters/overlay controls for passive/jobs/quests visibility on the map-only page
- [ ] Expand tests (Vitest + Playwright) to cover passive verbs, continuous jobs, and quest expiry flows on the new page

## Village Sandbox Passive Effects Tab

- [ ] Create `src/balancing/config/idleVillage/passiveEffects.ts` with schema mirroring Jobs/Quests (id, label, description, icon, tone, slotId/slotTags, frequency formula, resource deltas, requirements, metadata)
- [ ] Extend `IdleVillageConfig` types + Zod schemas to include `passiveEffects` collection
- [ ] Build CRUD UI tab (Idle Village Config) for passive effects, reusing weight-based creator pattern
- [ ] Expose hook/selectors that read passive effects and feed `buildSystemActivitySummary`
- [ ] Ensure passive effects export/import via config snapshots and JSON editors
- [ ] Add docs explaining passive config workflow (plan + README linkage)

## Phase 12.12: Trial of Fire & Theater View (Sistematico)

- [ ] **Config Runtime:** Creare `src/balancing/config/idleVillage/villageConfig.ts` con sezioni heroism/statBonuses/survival/automation/softCap (vedi `trial_of_fire_runtime_plan.md`).
- [ ] **Designer Tools:** Costruire `/debug/balancer/village` con slider e anteprime live che scrivono su `IdleVillageConfigStore`.
- [ ] **Engine Wiring:** Refactor `resolveActivityOutcome` e auto-loop (`tickIdleVillage`) per leggere esclusivamente dal nuovo config.
- [ ] **UX Risk Display:** Aggiornare VerbCard/TheaterView per mostrare bande rischio (giallo/rosso) basate su `snapshotDeathRisk` aggiornato in tempo reale.
- [ ] **Testing:** Coprire i nuovi helper con Vitest + scenario Playwright che modifica slider e verifica l’effetto su Trial of Fire.
- [ ] **Engine:** Implementare `calculateSurvivalBonus` basato sul rischio al tick finale.
- [ ] **UI Roster:** Trasformare `ResidentRoster` in Sidebar sinistra con barre HP/Fatica reali.
- [ ] **UI Map:** Rimuovere `MapSlotVerbCluster` inline e usare il nuovo file esterno.
- [ ] **UI Theater:** Attivare `TheaterView` con panorama cinematografico al click sui luoghi.
- [ ] **Logic:** Integrare `onResolve` manuale nell'HUD destro per le Quest.
- [ ] **Automation:** Testare il loop `isAuto` per i job di produzione.

---

## Phase 12.E – Atomic Sandbox (Village Sandbox Refactor)

> Implementation detail: `docs/plans/idle_village_atomic_sandbox_plan.md`

- [ ] **Config knobs:** Estendere `IdleVillageConfig` (types + Zod + defaultConfig) con hero threshold, risk multiplier `k`, HP/Fatica recovery rates e density thresholds.
- [ ] **UI wiring:** Aggiornare `IdleVillageGlobalRulesTab.tsx` per esporre i nuovi controlli con copy contestuale e parsing/clamp condiviso.
- [ ] **Engine math:** Allineare `TimeEngine.ts` (`applyTrialOfFireStatBonus`, `resolveActivityOutcome`, `tickIdleVillage`) alla formula `Stat_new = Stat_old * (1 + risk × k)` + recovery config-driven.
- [ ] **SandboxEngine:** Creare servizio/hook sotto `src/ui/idleVillage/engine/` che bootstrappa `createVillageStateFromConfig`, gestisce `tickIdleVillage`, e fornisce percentuali/testi al layer UI.
- [ ] **UI harness:** Rifattorizzare `VillageSandbox.tsx`, `WorkerCard.tsx`, `ActivitySlot.tsx`, `ActivityCardDetail` usage per leggere unicamente i dati derivati dal SandboxEngine (niente mock locali).
- [ ] **Density & bloom:** Introdurre hook/componenti per clustering (ActivityCard inline vs Medaglione), bloom compatibile solo quando il worker soddisfa requirement/fatica.
- [ ] **DnD hardening:** Consolidare MIME (`RESIDENT_DRAG_MIME` → `text/resident-id`), rimuovere `pointer-events-none` superflui, auditare z-index tra mappa/Theater.
- [ ] **Theater overlay:** Assicurare che il modal fisso filtri verbs per `slotId`, mostri bande rischio giallo/rosso e richiami i drop handler condivisi.
- [ ] **Testing:** Aggiungere test Vitest (hero threshold, recovery, density) + Playwright scenario (drag compatibile → bloom → Theater → resolve reale).
- [ ] **Docs:** Aggiornare `MASTER_PLAN.md` e questo checklist ogni volta che la milestone avanza.

---

## Meta

- [ ] Link this file and `idle_village_plan.md` from `MASTER_PLAN.md`
- [ ] Keep tasks strictly actionable; move any design changes back into the plan
- [x] Capture a dedicated drag/drop E2E test plan (`docs/plans/idle_village_drag_drop_e2e_plan.md`)
