---
title: Gameplay System — End-to-End
status: draft
updated: 2026-08-13
type: system-spec
---

# Gameplay System Complete — End-to-End

## Narrative

This document tells the full gameplay story of the Idle Village vertical slice as a sequence of user actions, component involvements, and integration contracts.

### Step 0 — Residents exist before the user opens the app

- **Components involved:** character storage → `toVillageResident()` → `VillageResidentStore`
- **Links:** [`character_resident_trusted.md`](./trusted/character_resident_trusted.md), [`roster_spec.md`](./roster_spec.md)
- **What happens:** Characters are created or acquired elsewhere and converted into canonical residents. `VillageResidentStore` is the single source of truth for roster presentation, drag-and-drop, and assignment.
- **Status:** implemented

### Step 1 — User opens the app

- **Component involved:** `App.tsx` routes, `MinimalGameplayPage`
- **Links:** [`time_engine_spec.md`](./time_engine_spec.md), [`day_night_poi_spec.md`](./day_night_poi_spec.md)
- **What happens:** The game loads `IdleVillageConfig`, initializes `useMinimalGameplay`, and `TimeEngine` starts from the persisted `currentTime`.

### Step 2 — User sees the roster and POIs on the map

- **Components involved:** `VillageRosterSection`, `ActivityCapsule` (POIs), `DayNightPOI`, `ActiveHUD`
- **Links:** [`roster_spec.md`](./roster_spec.md), [`poi_spec.md`](./poi_spec.md), [`day_night_poi_spec.md`](./day_night_poi_spec.md)
- **What happens:** `VillageResidentStore` feeds the roster. `TimeEngine` feeds `DayNightPOI`. POIs render from `ActivityDefinition` config.
- **Interaction:** [`time_engine_day_night_poi_interaction_spec.md`](./time_engine_day_night_poi_interaction_spec.md)

### Step 3 — User clicks a POI

- **Components involved:** `ActivityCapsule`, `FloatingPanel`, `ActivityCapsuleDetailSkinAware`
- **Links:** [`poi_spec.md`](./poi_spec.md), [`detail_spec.md`](./detail_spec.md), [`floating_panel_spec.md`](./floating_panel_spec.md)
- **What happens:** The POI click opens a non-modal floating detail panel. The panel loads the same `ActivityDefinition` and slot blueprints used by the capsule.
- **Interaction:** [`poi_detail_interaction_spec.md`](./poi_detail_interaction_spec.md)

### Step 4 — User assigns residents to slots

- **Components involved:** `VillageRosterSection`, `ResidentSlotRack`, `CardSocket`, `useDragOutcome`, `DragOutcomeFlight`
- **Links:** [`roster_spec.md`](./roster_spec.md), [`slot_rack_spec.md`](./slot_rack_spec.md)
- **What happens:** The user drags a resident from the roster. `useResidentDropValidation` checks `statMatching` against the slot blueprint. If valid, `DragOutcomeFlight` carries the card into the slot and `onFlightComplete` writes the assignment.
- **Interactions:** [`roster_slot_rack_interaction_spec.md`](./roster_slot_rack_interaction_spec.md), [`slot_rack_poi_interaction_spec.md`](./slot_rack_poi_interaction_spec.md)

### Step 5 — User clicks "Avvia"

- **Components involved:** `Detail` CTA, `TimeEngine`, `ActivityCapsule`
- **Links:** [`time_engine_spec.md`](./time_engine_spec.md), [`poi_spec.md`](./poi_spec.md)
- **What happens:** `TimeEngine.scheduleActivity` creates a `ScheduledActivity`, sets residents to `away`, and the POI status becomes `in-progress`.
- **Interaction:** [`slot_rack_poi_interaction_spec.md`](./slot_rack_poi_interaction_spec.md)

### Step 6 — TimeEngine starts, time ticks

- **Component involved:** `TimeEngine`
- **Links:** [`time_engine_spec.md`](./time_engine_spec.md)
- **What happens:** `advanceTime` increments `currentTime` atomically, applies fatigue and food consumption, and updates activity progress.

### Step 7 — DayNightPOI changes phase

- **Component involved:** `DayNightPOI`
- **Links:** [`day_night_poi_spec.md`](./day_night_poi_spec.md)
- **What happens:** `isDayPhase` and `cycleProgress` derive from `currentTime`; the icon cross-fades and telemetry is emitted.
- **Interaction:** [`time_engine_day_night_poi_interaction_spec.md`](./time_engine_day_night_poi_interaction_spec.md)

### Step 8 — MagicCircleHalo advances (quest path)

- **Component involved:** `MagicCircleHalo`
- **Links:** [`quest_spec.md`](./quest_spec.md)
- **What happens:** The arcane ring is drawn character-by-character from 12 o'clock, proportional to quest progress.

### Step 9 — Milestone is reached

- **Components involved:** `useMilestoneEngine`, `MilestoneCheckModal`, `DestinyAstrolabeComponent`
- **Links:** [`quest_spec.md`](./quest_spec.md)
- **What happens:** At 25% / 50% / 75% / 100% of the quest duration, `useMilestoneEngine` pauses the quest and opens the skill check. The player can spend consumables before the roll.
- **Interaction:** [`time_engine_quest_interaction_spec.md`](./time_engine_quest_interaction_spec.md)

### Step 10 — Outcome is applied

- **Components involved:** `TimeEngine.resolveActivityOutcome`, `QuestPowerEngine`, `Trial of Fire`
- **Links:** [`time_engine_spec.md`](./time_engine_spec.md), [`quest_spec.md`](./quest_spec.md)
- **What happens:** Destiny Astrolabe resolves with RNG from `deps.rng`. Death, injury, or loot modifiers are applied per phase. Survivors keep running.

### Step 11 — Quest completes, rewards appear

- **Components involved:** `QuestChronicle`, `QuestRewardPanel`
- **Links:** [`quest_spec.md`](./quest_spec.md), [`detail_spec.md`](./detail_spec.md)
- **What happens:** The final phase completes. `QuestChronicle` opens with a rope-luminous, per-phase summary. A "Raccogli ricompense" CTA is shown.

### Step 12 — User collects rewards

- **Components involved:** `QuestRewardPanel`, `TimeEngine`, `VillageRosterSection`, `ActiveHUD`
- **Links:** [`quest_spec.md`](./quest_spec.md), [`roster_spec.md`](./roster_spec.md), [`time_engine_spec.md`](./time_engine_spec.md)
- **What happens:** The player clicks the button. Rewards are applied, residents are released to the roster (return flight if needed), and resource counters update.
- **Interaction:** [`poi_quest_interaction_spec.md`](./poi_quest_interaction_spec.md)

## POI Quest Page — `/poi-quest-detail-roster-time-clock`

This page follows the same 12 steps, but with four critical specializations:

- **Step 3 (open POI detail)**: opening a `QuestPOI` detail opens a floating, draggable, minimizable panel. Time does **not** pause automatically.
- **Step 5 (Start)**: `Start/Embark` is effective only if the game is not paused. While paused, the quest remains `idle` and the `MagicCircleHalo` does not draw.
- **Step 9+ (Milestones)**: if `QuestChronicle` is open, the `MilestoneCheckModal` appears with the V2 `DestinyAstrolabeComponent`; if it is closed, the phase resolves off-screen and the quest continues.
- **Step 11 (Success)**: the quest is a success if `successi >= fasi_totali / 2`; `QuestRewardPanel` then shows rewards including XP for each assigned resident.

See the dedicated page workflow: [`poi_quest_detail_roster_time_clock_page_workflow.md`](./poi_quest_detail_roster_time_clock_page_workflow.md) and error registry: [`poi_quest_detail_roster_time_clock_error_registry.md`](./poi_quest_detail_roster_time_clock_error_registry.md).

## Interaction Spec Map

| Step | Components | Interaction Spec |
|---|---|---|
| 2 | TimeEngine → DayNightPOI | [`time_engine_day_night_poi_interaction_spec.md`](./time_engine_day_night_poi_interaction_spec.md) |
| 3 | POI → Detail | [`poi_detail_interaction_spec.md`](./poi_detail_interaction_spec.md) |
| 4 | Roster → SlotRack | [`roster_slot_rack_interaction_spec.md`](./roster_slot_rack_interaction_spec.md) |
| 4 | SlotRack → POI | [`slot_rack_poi_interaction_spec.md`](./slot_rack_poi_interaction_spec.md) |
| 5+ | TimeEngine → Quest | [`time_engine_quest_interaction_spec.md`](./time_engine_quest_interaction_spec.md) |
| 9+ | POI → Quest | [`poi_quest_interaction_spec.md`](./poi_quest_interaction_spec.md) |

## Config-first gameplay pipeline

All engine values come from `IdleVillageConfig`, not from hardcoded constants.

- **Source of truth:** `src/balancing/config/idleVillage/defaultConfig.ts` (base) + `src/ui/idleVillage/config/dynamicConfig.json` (live edits).
- **Consumers:** `TimeEngine`, `JobResolver`, `QuestResolver`, `QuestPowerEngine`, `InjuryEngine`, skin presets.
- **Note:** the legacy 1v1 balancer module is a separate reference; Idle Village runtime math lives in `src/engine/game/idleVillage/` and is configured through `IdleVillageConfig`.
- **See also:** [`idle_village_gameplay_math_spec.md`](./idle_village_gameplay_math_spec.md)

## Skill check / spell resolution at milestones

- **Component involved:** `MilestoneCheckModal`, `DestinyAstrolabeV4`
- **What happens:** each milestone uses `AstrolabeSkill[]` (resident stat + difficulty) to compute a D100 threshold. The astrolabe rolls, returns `success|near-miss|fail|crit|wounded|dead`, and feeds the phase outcome.
- **Status:** `DestinyAstrolabe` implemented; a future "spell creator" would author `AstrolabeSkill` entries from config.
- **See also:** [`skill_check_workflow_spec.md`](./skill_check_workflow_spec.md)

## Quest outcomes, failure, timeout and recovery

- **Component involved:** `QuestPowerEngine`, `QuestResolver`, `QuestChronicle`
- **What happens:** `QuestPowerEngine` rolls one of five outcomes (`perfect`, `success`, `partial`, `fail`, `deadly`) from the party power vs quest difficulty ratio. `QuestResolver` emits the completion event and returns raw rewards and `injuryRolls`. The downstream injury/death application is not fully wired to the UI, and there is no explicit `quest_timeout` event yet.
- **Status:** power engine and resolver implemented; failure/recovery UI missing; timeout logic missing.
- **See also:** [`quest_failure_and_recovery_spec.md`](./quest_failure_and_recovery_spec.md), [`idle_village_gameplay_math_spec.md`](./idle_village_gameplay_math_spec.md)

## Village and world events

- **System involved:** `VillageState.eventLog`, `worldEventRegistry`
- **What happens:** `TimeEngine` and resolvers append `VillageEvent`s for scheduling, start, completion, fatigue, injury, food, and trial-of-fire. `worldEventRegistry` has weather/threat/resource templates, but world events are not yet integrated into the village event queue.
- **Status:** village event log implemented; world event → gameplay integration missing.
- **See also:** [`village_event_system_spec.md`](./village_event_system_spec.md)

## Implementation status

| Area | Status | Reference |
|---|---|---|
| Time tick & scheduling | implemented | `TimeEngine.ts` |
| Job reward formulas | partially implemented | `JobResolver.ts` (non-numeric formulas return `0`) |
| Quest power & outcome distribution | implemented (not wired to reward multipliers) | `QuestPowerEngine.ts` |
| Quest reward variance | stubbed | `QuestResolver.ts` |
| Injury from fatigue | implemented | `InjuryEngine.ts` |
| Quest timeout / partial failure | missing | [`quest_failure_and_recovery_spec.md`](./quest_failure_and_recovery_spec.md) |
| Quest failure / recovery UI | missing | [`quest_failure_and_recovery_spec.md`](./quest_failure_and_recovery_spec.md) |
| World events → village queue | missing | [`village_event_system_spec.md`](./village_event_system_spec.md) |
| Spell creator / custom skill editor | not implemented | [`skill_check_workflow_spec.md`](./skill_check_workflow_spec.md) |

## Invariants (system-wide)

- All persistence goes through `PersistenceService`
- All user-facing strings go through `i18n`
- All UI visual values come from config / skin presets
- Time is a single canonical `currentTime`; no independent clocks
- Resident status is derived from data, never written by drag visuals
- Drag outcome is visual; assignment happens on `onFlightComplete`

## Verification

- [x] Step 0 — resident acquisition/creation is represented
- [x] Steps 1–12 are represented
- [x] Config-first pipeline is documented
- [x] Skill check / spell resolution is linked
- [x] Quest outcomes, failure and timeout are documented
- [x] Village/world events are documented
- [ ] Each missing area is marked with a concrete reference doc
- [ ] The story reads coherently from resident acquisition to reward collection
