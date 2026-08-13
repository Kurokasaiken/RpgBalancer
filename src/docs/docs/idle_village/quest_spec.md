---
title: Quest Spec
status: draft
updated: 2026-08-13
type: component-spec
---

# Quest Spec

## State Machine (ASCII)

```text
[mount] ──► idle
 idle ──(open detail)──► assembling
 assembling ──(assign slots)──► ready
 ready ──(embark)──► running
 running ──(phase elapsed)──► milestone
 milestone ──(skill check open)──► resolving
 resolving ──(resolve)──► running
 resolving ──(player reduces to icon)──► auto-resolve
 running ──(last phase done)──► completed
 completed ──(open chronicle)──► rewards
 rewards ──(collect)──► idle
```

## Detailed Scenarios

### Scenario 1: Assemble quest party

**Given:** a Quest POI detail is open
**When:** the user drags residents into the quest slot rack
**Then:** `useQuestAssignmentPreview` shows live RNG-free preview of success/injury/death chances
**Visual contract:** Preview labels update; required slot emptyPenalty and risk modifiers are shown

### Scenario 2: Start quest and magic circle begins

**Given:** all required slots are filled
**When:** the user clicks Embark
**Then:** the quest transitions to `running`, `MagicCircleHalo` starts writing from 12 o'clock, and `TimeEngine` advances phases
**Visual contract:** Arcane characters appear character by character in a glowing ring around the POI

### Scenario 3: Milestone skill check

**Given:** a quest phase finishes (25% of total duration)
**When:** the milestone is reached
**Then:** the game pauses, `MilestoneCheckModal` opens with Destiny Astrolabe, and the player can spend consumables
**Visual contract:** Modal/card flips or Astrolabe spins; outcome is applied when the player resolves it

### Scenario 4: Quest completes and chronicle opens

**Given:** the final quest phase is resolved
**When:** the magic circle is complete
**Then:** the POI becomes clickable, opening `QuestChronicle` with a luminous rope, per-phase frame, and reward summary
**Visual contract:** Chronicle panel floats on screen; a "Raccogli ricompense" button is prominent

### Scenario 5: Collect rewards

**Given:** the chronicle is open
**When:** the user clicks "Raccogli ricompense"
**Then:** rewards are applied, residents are released to the roster, and the panel closes
**Visual contract:** Reward screen on `/design-system` primitives; residents fly back to the roster

## Invariants

- Quest phases are equispaced by total duration / number of phases
- While a skill check is open, quest time does not advance
- The magic circle is written from 12 o'clock, with no pre-existing ring
- Phases resolve one at a time; no two phases resolve simultaneously
- All quest data comes from `questBlueprints` and `questSkillCheckConfig`

## References

- Trusted / planning: [`poi_quest_system_plan.md`](../plans/poi_quest_system_plan.md)
- Related: [`poi_spec.md`](./poi_spec.md), [`detail_spec.md`](./detail_spec.md), [`time_engine_spec.md`](./time_engine_spec.md)
- Used by: [`poi_quest_interaction_spec.md`](./poi_quest_interaction_spec.md), [`time_engine_quest_interaction_spec.md`](./time_engine_quest_interaction_spec.md)
