# 🏰 Plan – Quest Blueprint & Quest Chronicle (Idle Village)

**Status:** Draft · **Owner:** Idle Village pod · **Last Updated:** 2025-12-24  
**Dependencies:** Phase 12 (Idle Incremental RPG), Trial of Fire/Theater View plan  
**Goal:** Model multi-phase quests in config, surface their progress via the Quest Chronicle UI, and bridge quest phases with TimeEngine + combat/trial modules.

---

## 1. Background

- Current quests are flat activities tagged `quest` in `IdleVillageConfig.activities`, with single-duration scheduling and resolution via `QuestResolver`.  
- TimeEngine spawns quest offers and resolves quests but has no concept of per-phase progress or callbacks to other engines once a quest completes (`TimeEngine.ts`).  
- UI renders verbs per slot but lacks a quest-specific progression component or theater linkage for narrative beats (`IdleVillageMapPage.tsx`, `TheaterView.tsx`).  
- The user vision (THE QUEST ARCHITECT) requires:  
  1. Configurable `QuestBlueprint` schema with ordered `QuestPhase` nodes.  
  2. Quest Chronicle card showing progress, halo for active step, and outcome badges.  
  3. Engine handshake so each phase invokes Trial/Combat/Work modules before advancing.  
  4. Visual Lab sandbox quest to validate the flow end-to-end.

---

## 2. Scope & Deliverables

1. **Config & Types** – Extend `IdleVillageConfig` to support quest blueprints (phases, status, node requirements) and migrate `defaultConfig.ts` sample quests.  
2. **QuestChronicle Component** – Gilded Observatory-styled card with icon stepper, phase status badges, and Theater 21:9 linkage.  
3. **Logic Bridge** – TimeEngine/QuestManager handshake to route per-phase execution into Trial/Combat/Work modules and resume quest state after callbacks.  
4. **Visual Sandbox** – “Quest di Prova” with three phases (Exploration → Combat → Loot) rendered on IdleVillageMapPage/TheaterView for designers to inspect.  
5. **Docs & Tests** – Update tasks/master plan, add regression coverage for phase advancement, quest chronicle rendering, and sandbox interactions.

Out of scope: new combat/trial mechanics, offline progress, roster UX changes (handled in existing plans).

---

## 3. Architecture Overview

### 3.1 Data Model Additions

- `QuestBlueprint` stored alongside activities or as a dedicated config section referencing `ActivityDefinition`.  
- `QuestPhase` fields: `type ('TRIAL' | 'COMBAT' | 'WORK')`, `label`, `icon`, `requirements` (typed union per module), `result`.  
- `QuestState` per scheduled quest keeps `currentPhaseIndex`, `phaseResults`, `status`.  
- `IdleVillageConfig` gains `quests` map or augments activity metadata with `phases`.  
- Extend `ScheduledActivity` metadata (or add `ScheduledQuest`) to hold `questId`, `phaseIndex`, `pendingModuleRequestId`.

### 3.2 Engine Flow

1. **Assignment:** When a quest activity is scheduled, its blueprint is loaded and the first phase is staged.  
2. **Tick:** Upon duration completion, TimeEngine checks whether the current phase requires async resolution.  
3. **Module Invocation:**  
   - `TRIAL` → open existing dice/trial UI module; pass `requirements`.  
   - `COMBAT` → enqueue idle combat encounter (existing `quest_combat` resolver).  
   - `WORK` → resolve immediately via JobResolver with quest-specific modifiers.  
4. **Callback:** Module returns `success`/`failure` payload to `QuestManager`, which:  
   - Sets `result` on the phase.  
   - Advances `currentPhaseIndex` if success (or handles branching per config).  
   - When final phase resolves, marks quest `completed`/`failed` and emits events for UI/logging.  
5. **Persistence:** Updates stored inside `VillageState.activities[scheduledId].metadata.questState`.

### 3.3 UI Flow

- `buildQuestSummary` helper transforms quest state into `QuestChronicleData`.  
- `QuestChronicle` component reads `phases`, highlights active icon, colors success/failure, and exposes CTA to open Theater.  
- Clicking Chronicle opens Theater view anchored above slot (21:9) showing narrative text, current requirements, and CTA to trigger module/resolution.

---

## 4. Implementation Phases

### Phase A – Schema & Config (1.5d)

1. Update `idleVillage/types.ts` with `Quest`, `QuestPhase`, `QuestState`.  
2. Extend Zod schemas and config editors (Activities tab) to author quest phases.  
3. Migrate `defaultConfig` sample quest to new blueprint (Exploration → Combat → Loot).  
4. Seed “Quest di Prova” blueprint for sandbox slot.

### Phase B – Engine Bridge (2d)

1. Create `QuestManager.ts` (pure helper) to load/update quest blueprint state.  
2. Extend `TimeEngine` scheduling to attach quest state to `ScheduledActivity`.  
3. On completion, if quest has pending phase:  
   - For WORK type, resolve immediately via new helper referencing JobResolver math.  
   - For TRIAL/COMBAT, emit `QuestModuleRequest` event for UI/sub-engine to process; suspend quest until callback.  
4. Implement callback API `resumeQuestPhase(result)` to be invoked by Trial/Combat modules (wired via IdleVillageEngine).  
5. Unit tests: quest state progression, failure handling, callback resume.

### Phase C – Quest Chronicle UI (1.5d)

1. Build `QuestChronicle.tsx` in `src/ui/idleVillage/components/`.  
2. Stepper layout: vertical icon rail, amber halo for active phase, emerald/red color for success/failure, muted for locked phases.  
3. Add CTA header linking to Theater (prop callback).  
4. Integrate into `MapSlotVerbCluster` or overlay above quest slots.  
5. Add story/narrative copy placeholders referencing config text.

### Phase D – Integration & Theater Link (1d)

1. Extend `buildQuestOfferSummary`/`buildScheduledVerbSummary` to include quest chronicle metadata.  
2. When quest card clicked, open Theater with current phase narrative and module CTA (Trial dice modal, Combat viewer, etc.).  
3. Ensure drag-drop assignment triggers handshake (TimeEngine checking `phase.type` before scheduling).

### Phase E – Visual Lab Sandbox & Docs (1d)

1. In Idle Village Sandbox page, inject “Quest di Prova” slot with three-phase blueprint (Exploration → Combat → Recupero Bottino).  
2. Add debug controls to fast-forward quest phases and show chronicle updates.  
3. Update docs: `quest_chronicle_plan.md`, `idle_village_tasks.md`, `MASTER_PLAN.md`.  
4. Tests: Vitest for QuestManager, Playwright scenario verifying chronicle UI updates after manual callbacks.

---

## 5. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Cross-engine deadlocks between TimeEngine and combat/trial modules | Keep QuestManager pure; use explicit request/response events with timeouts; log stalled quests in dev builds. |
| Config drift (phases defined but metadata missing) | Zod schema ensures at least one phase per quest; editor validation with inline errors. |
| UI clutter on map | Chronicle collapses into compact token when not focused; Theater houses detailed narrative. |
| Async persistence when resuming quests | Leverage existing async `PersistenceService` to store quest state snapshots alongside `VillageState`. |

---

## 6. Success Criteria

- ✅ Quest blueprint schema lives entirely in config (UI-editable) with sample quest migrated.  
- ✅ TimeEngine/QuestManager can advance quests phase-by-phase, invoking appropriate modules.  
- ✅ Quest Chronicle card shows live progression, success/failure states, and opens Theater view.  
- ✅ Visual sandbox quest demonstrates Exploration → Combat → Loot nodes updating in-place.  
- ✅ Docs/tasks/master plan updated; regression tests cover QuestManager + UI interactions.

---

## 7. Related Documents

- `docs/plans/idle_village_plan.md` – overall Phase 12 roadmap.  
- `docs/plans/idle_village_trial_of_fire_plan.md` – Theater + Trial integration.  
- `docs/plans/idle_village_tasks.md` – execution checklist.  
- `src/engine/game/idleVillage/TimeEngine.ts` – current scheduling/resolution logic.  
- `src/ui/idleVillage/IdleVillageMapPage.tsx` – slot + Theater interactions (will host Quest Chronicle).
