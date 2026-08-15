---
title: POI ↔ Quest Interaction
status: draft
updated: 2026-08-14
type: interaction-spec
---

# POI ↔ Quest Interaction

## Data Flow

```text
ActivityCapsule (Quest POI)
   │
   │ questBlueprints, slotBlueprints
   │
   ▼
Quest detail panel / QuestChronicle
   │
   │ party, duration, phases
   │
   ▼
useMilestoneEngine
   │
   │ phase triggers
   │
   ▼
MilestoneCheckModal + Destiny Astrolabe
```

| Source | Data | Consumer | Effect |
|---|---|---|---|
| POI | `questBlueprints` | Quest detail | loads quest duration, phases, requirements |
| Quest detail | `assignedResidents` | `useQuestAssignmentPreview` | live preview of success/injury/death |
| Quest detail | `onEmbark` | `TimeEngine` + `MagicCircleHalo` | starts quest and visual timer |
| `useMilestoneEngine` | `milestoneReached` | `MilestoneCheckModal` | opens skill check and pauses time |
| `MilestoneCheckModal` | `onResolve` | `TimeEngine` | applies injury/loot modifier and resumes quest |

## State Transitions

When the user clicks the quest POI:

- Quest detail opens with slot rack and live preview
- `MagicCircleHalo` is not yet drawn

When all required quest slots are filled:

- `useQuestAssignmentPreview` returns `canEmbark = true`
- The Embark CTA enables

When Embark is clicked:

- `TimeEngine` schedules the quest activity
- `MagicCircleHalo` begins writing from 12 o'clock
- `useMilestoneEngine` registers phase breakpoints at 25%, 50%, 75%, 100%

When a milestone is reached:

- Quest time pauses
- `MilestoneCheckModal` opens with Destiny Astrolabe
- The player can spend consumables before the roll

When the player resolves the skill check:

- `DestinyAstrolabeComponent` performs the RNG roll
- Outcome applies to the party and quest state
- Quest resumes until the next milestone

## Edge Cases

- Player reduces milestone panel to icon: the milestone auto-resolves and the quest continues
- Player pauses the game during a quest: `MagicCircleHalo` stops drawing; `TimeEngine` stops advancing
- Final milestone resolves: the quest completes and the POI becomes clickable for chronicle/rewards

## Invariants

- Quest phases are equispaced; no two resolve at the same instant
- Skill checks pause quest time
- The magic circle is a pure visual timer; the canonical completion is decided by `TimeEngine`

## Runtime evidence

- Suite: `tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts`
- Risultato: 17 passati, 1 saltato, 0 fallimenti (Playwright, Desktop Chrome).
- Test coperti: page shell, apertura detail e pausa, chiusura detail → ripresa tempo, assegnazione/gating, drop invalid, drag pannello, bloom POI/slot compatibilità, skill check astrolabe, end-to-end start → close card → rewards → applicazione ricompense allo store (`gold`/`food`/`wood`/`xp`) → release, apertura/chiusura `QuestChronicle` durante una quest, day/night halo/transition, pause/resume, assegnazione compatibile nel detail.
- Mismatch trovato: la chiusura di `QuestChronicle` mentre un `MilestoneCheckModal` è aperto non risolve il milestone attivo off-screen (solo quelli in coda). Documentato in `poi_quest_detail_roster_time_clock_error_registry.md` (ERR-014). Per i test si è esposto `__idleVillageTestHooks.resolveActiveMilestone()` come workaround test-only.

## Comportamento atteso (2026-08-15)

- **Magnetic snap:** quando un residente viene trascinato verso il QuestPOI, il drop si ancora al centro del POI (non alla posizione del puntatore). Test: `should magnetically snap a resident to the Quest POI center on drop`.
- **Quest start gating:** con tutti i residenti obbligatori assegnati correttamente e il tempo in play, il pulsante Start è abilitato e avvia la quest. Test: `should start the quest after manually filling all required slots`.

## References

- [`poi_spec.md`](./poi_spec.md)
- [`quest_spec.md`](./quest_spec.md)
- [`poi_quest_system_plan.md`](../plans/poi_quest_system_plan.md)
- [`poi_quest_detail_roster_time_clock_page_workflow.md`](./poi_quest_detail_roster_time_clock_page_workflow.md)
