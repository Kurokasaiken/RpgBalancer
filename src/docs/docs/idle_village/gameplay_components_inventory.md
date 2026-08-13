---
title: Gameplay Components Inventory
status: draft
updated: 2026-08-13
type: catalog
---

# Gameplay Components Inventory

## Purpose

Single catalog of all gameplay-relevant components, hooks, stores and config modules for the Idle Village vertical slice. Used as the source for spec generation, interaction mapping and end-to-end system documentation.

## Categories

### 1. Store Layer (sources of truth)

| Component | Location | Role |
|---|---|---|
| `useMinimalGameplay` | `src/store/useMinimalGameplay.ts` | Gameplay store: tick, pause, speed, day/night, resources, scheduled activities |
| `gameplayStore` | `src/ui/idleVillage/store/gameplayStore.ts` | UI/gameplay state bridge for idle village |
| `VillageResidentStore` | `src/ui/idleVillage/store/VillageResidentStore.ts` | Canonical resident roster state |
| `loreDropStore` | `src/store/loreDropStore.ts` | Lore drop meta state |

### 2. Domain Engine Layer

| Component | Location | Role |
|---|---|---|
| `TimeEngine` | `src/engine/game/idleVillage/TimeEngine.ts` | Pure time/activity simulation engine |
| `QuestPowerEngine` | Derived from `questSkillCheckConfig.ts` + hooks | Quest difficulty / party power / outcome distribution |
| `Destiny Astrolabe V1` | `DestinyAstrolabeComponent.tsx` | Skill check resolution presentation |

### 3. UI Components — Core Gameplay Surfaces

| Component | Location | Role |
|---|---|---|
| `DayNightPOI` | `src/ui/idleVillage/components/minimal/DayNightPOI.tsx` | World-state day/night indicator (POI family) |
| `DayNightPoiSkin` | `src/ui/idleVillage/components/minimal/DayNightPoiSkin.tsx` | Skin-aware day/night renderer |
| `DayNightActionCard` | `src/ui/idleVillage/map/actionCards/DayNightActionCard.tsx` | Pause/resume day-night control |
| `VillageRosterSection` | `src/ui/idleVillage/roster/` | Canonical roster panel with drag sources |
| `ResidentSlotRack` | Slot-rack kit / components | Config-driven slot container |
| `Slot` (`CardSocket`) | `src/ui/idleVillage/components/CardSocket.tsx` | Single resident slot |
| `PgCard` | `src/ui/idleVillage/components/PgCard.tsx` | Resident / hero card (drag source) |
| `ActivityCapsule` | `src/ui/idleVillage/components/ActivityCapsule.tsx` | Standard POI capsule |
| `ActionCardWrapper` | `src/ui/idleVillage/components/ActionCardWrapper.tsx` | POI wrapper / cluster |
| `JobPOI` | `src/ui/idleVillage/components/` (kit) | Job-type POI |
| `QuestPOI` | Frozen kits (`questPoiKit`) | Quest-type POI with magic circle |
| `ActivityPOI` | Kit/ActivityCapsule family | Generic activity POI |
| `ActivityCardDetail` / `DetailPanelCard` | `src/ui/idleVillage/components/` | Detail panel surfaces |
| `FloatingPanel` | `src/ui/idleVillage/components/FloatingPanel.tsx` | Draggable/minimizable panel wrapper |
| `MagicCircleHalo` | `src/ui/idleVillage/components/MagicCircleHalo.tsx` | Quest timer arcane circle |
| `MilestoneCheckModal` | `src/ui/idleVillage/components/MilestoneCheckModal.tsx` | Per-phase skill check panel |
| `QuestChronicle` (extended) | Frozen kits / detail | Quest card / chronicle panel |
| `QuestRewardPanel` | `src/ui/idleVillage/components/` | Reward/victory surface |
| `ActiveHUD` | `src/ui/idleVillage/components/ActiveHUD.tsx` | HUD resource panel |
| `VillageResourcePanel` | Related to `ActiveHUD` | Resource counters display |

### 4. Interaction Layer

| Component | Location | Role |
|---|---|---|
| `useDragOutcome` | `src/ui/idleVillage/interaction/` | Drag outcome state machine |
| `DragOutcomeFlight` / `FlightProxy` | `src/ui/idleVillage/components/FlightProxy.tsx` | Magnetic flight renderer |
| `useExtractionSequence` | `src/ui/idleVillage/hooks/useExtractionStateMachine.ts` | Press-and-hold extraction choreography |
| `bloomEffect` | `src/ui/idleVillage/interaction/` | Drop-target bloom style |
| `DragContext` | `src/ui/idleVillage/components/DragContext.tsx` | Drag state provider |
| `CustomDragOverlay` | `src/ui/idleVillage/components/CustomDragOverlay.tsx` | Drag preview overlay |
| `useResidentDropValidation` | `src/ui/idleVillage/hooks/locationDropValidators.ts` | Drop validation engine |
| `statMatching` | `src/ui/idleVillage/` | Stat requirement evaluation |
| `RosterDropVerdict` | `rosterKit` | Drop verdict contract |

### 5. Quest / Outcome Layer

| Component | Location | Role |
|---|---|---|
| `useMilestoneEngine` | `src/ui/idleVillage/hooks/useMilestoneEngine.ts` | Phase milestone progression |
| `QuestPowerEngine` | `src/balancing/config/idleVillage/questConfig.ts` + utils | Quest power calculation |
| `Trial of Fire` | `TimeEngine.resolveActivityOutcome` | Death/injury resolution |
| `Reward Calculator` | `TimeEngine` / quest resolution | Reward roll / application |
| `useQuestAssignmentPreview` | `src/ui/idleVillage/hooks/` | RNG-free pre-launch preview |
| `QuestActionCard` | `src/ui/idleVillage/components/ActivityActionCard.tsx` / kits | Quest POI representation |

### 6. Config Layer

| Module | Location | Role |
|---|---|---|
| `DEFAULT_IDLE_VILLAGE_CONFIG` | `src/balancing/config/idleVillage/defaultConfig.ts` | Root idle village config |
| `IdleVillageConfigStore` | `src/balancing/config/idleVillage/IdleVillageConfigStore.ts` | Runtime config store |
| `minimalGameplayConfig` | `src/balancing/config/idleVillage/minimalGameplayConfig.ts` | Minimal slice config |
| `questBlueprints` | `src/balancing/config/idleVillage/quests/questBlueprints.ts` | Quest definitions |
| `questSkillCheckConfig` | `src/balancing/config/idleVillage/quests/questSkillCheckConfig.ts` | Skill check rules |
| `dynamicConfig.json` | `src/data/dynamicConfig.json` | Slot caps / dynamic values |
| `activityConfig` / `activityDefs` | `src/balancing/config/idleVillage/defaultConfig.ts` | Activity definitions & slot blueprints |
| `skinConfigRegistry` / `dayNightPoiSkinConfig` | `src/ui/idleVillage/skins/` | Style Lab skin presets |

## Dependency Graph

```text
IdleVillageConfig (config-first)
    │
    ▼
TimeEngine ──► useMinimalGameplay (gameplay store)
    │                  │
    │                  ▼
    │            DayNightPOI (isDayPhase, cycleProgress)
    │                  │
    │                  ▼
    │            VillageRosterSection (residents, availability)
    │                  │
    │                  ▼
    │            ResidentSlotRack (slots, assignment state)
    │                  │
    │                  ▼
    │            ActivityCapsule / POI (progress, collect)
    │                  │
    │                  ▼
    │            DetailPanelCard (expanded POI detail)
    │                  │
    │                  ▼
    │            Quest (milestones, skill check, reward)
    │
    └──────────────► MagicCircleHalo (timer progress)
                     QuestChronicle (phase narrative)
                     MilestoneCheckModal (Destiny Astrolabe)
                     QuestRewardPanel

Interaction layer (orthogonal to all UI surfaces):
useDragOutcome / DragOutcomeFlight / useExtractionSequence / bloomEffect
    │
    ▼
Roster ► SlotRack ► POI ► Detail
```

## Ordering for Spec Production

1. `time_engine_spec.md` (root — no dependencies)
2. `day_night_poi_spec.md` (depends on TimeEngine)
3. `floating_panel_spec.md` (no domain dependencies)
4. `roster_spec.md` (depends on TimeEngine/Store)
5. `slot_rack_spec.md` (depends on Roster)
6. `poi_spec.md` (depends on SlotRack)
7. `detail_spec.md` (depends on POI)
8. `quest_spec.md` (depends on POI, Detail, TimeEngine)

Interaction specs follow the same dependency order.

## Status

- [x] Complete inventory (representative)
- [x] Dependency graph verified (acyclic)
- [x] Components assigned to task list

## Notes

This inventory intentionally links to existing trusted contracts for canonical facts. It does not duplicate contracts. See `COMPONENT_MASTER_INDEX.md` for authoritative status and certified pages.
