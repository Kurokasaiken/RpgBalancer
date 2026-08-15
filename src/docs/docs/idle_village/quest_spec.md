---
title: Quest Spec
status: draft
updated: 2026-08-13
type: component-spec
---

# Quest Spec

> Child of [`poi_family_spec.md`](./poi_family_spec.md). Quest-specific contracts, milestones, skill checks and reward collection live here.

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

### Scenario 6: Quest inert before start

**Given:** the `QuestPOI` is idle and at least one required slot is empty
**When:** time advances
**Then:** the `MagicCircleHalo` does not draw, `QuestChronicle` does not open, and no milestone fires
**Visual contract:** POI shows static idle medallion; `DayNightPOI` continues normally

### Scenario 7: Milestone resolves off-screen

**Given:** the quest is running and `QuestChronicle` is closed
**When:** a milestone deadline is reached
**Then:** `useMilestoneEngine` queues the phase, resolves it without the modal, and the quest continues
**Visual contract:** POI medallion pulse may change; no modal appears until the player opens `QuestChronicle`

### Scenario 8: Start is gated by running time

**Given:** all required slots are filled
**When:** the user clicks Start while the game is paused
**Then:** nothing happens (or a "resume time" hint is shown); the quest begins only when `resumeGame` is called and ticks advance
**Visual contract:** Start CTA is enabled but the circle does not draw until `isPaused === false`

## Invariants

- Quest phases are equispaced by total duration / number of phases
- While a skill check is open, quest time does not advance
- The magic circle is written from 12 o'clock, with no pre-existing ring
- Phases resolve one at a time; no two phases resolve simultaneously
- A quest is considered successful when `successi >= fasi_totali / 2` (half or more phases passed)
- The quest is inert (no halo, no time consumption, no chronicle) until all required slots are assigned and Start is pressed while time is running
- All quest data comes from `questBlueprints` and `questSkillCheckConfig`

## Trial of Fire

**GIVEN** a quest with a fatal risk profile (`ActivityDefinition.trialOfFire`)

**WHEN** the final milestone or the quest outcome resolution is reached

**THEN** a `Trial of Fire` skill check is resolved before the normal outcome: it can override death with injury, injury with survival, or escalate failure based on the configured rules

**Visual contract:** the milestone modal shows a fire glyph or a second Astrolabe spin; outcome text reflects the trial result

**Config source:** `src/balancing/config/idleVillage/types.ts` (`trialOfFire?: TrialOfFireRules`) and `src/balancing/config/idleVillage/defaultConfig.ts`

**Test:** `poiFamilyRegressions.spec.ts` — `should resolve a Trial of Fire for a fatal quest`

## References

- Trusted / planning: [`poi_quest_system_plan.md`](../plans/poi_quest_system_plan.md)
- Related: [`poi_spec.md`](./poi_spec.md), [`detail_spec.md`](./detail_spec.md), [`time_engine_spec.md`](./time_engine_spec.md)
- Used by: [`poi_quest_interaction_spec.md`](./poi_quest_interaction_spec.md), [`time_engine_quest_interaction_spec.md`](./time_engine_quest_interaction_spec.md)
