---
title: POI Spec
status: draft
updated: 2026-08-13
type: component-spec
---

# POI Spec

## State Machine (ASCII)

```text
[mount] ──► idle
 idle ──(assign slot)──► ready
 ready ──(start)──► in-progress
 in-progress ──(advance)──► in-progress
 in-progress ──(complete)──► completed
 completed ──(collect)──► idle
 idle ──(expire)──► gone
```

## Detailed Scenarios

### Scenario 1: POI renders in idle

**Given:** no residents assigned and no running activity
**When:** `ActivityCapsule` renders on the map
**Then:** it shows the POI frame, label, icon, empty slot grid, and zero progress
**Visual contract:** Capsule frame, label, 0% progress bar, empty slot placeholders

### Scenario 2: Drag resident onto POI medallion

**Given:** a resident is dragged over a `JobPOI`
**When:** the resident satisfies at least one slot requirement and is released
**Then:** the POI blooms valid and the same slot validation as the detail panel is run
**Visual contract:** POI medallion gets `valid` bloom; the resident flight targets the detail's slot rack

### Scenario 3: Start an activity

**Given:** required slots are filled and the user clicks the Start CTA
**When:** `onStart` fires
**Then:** the POI transitions to `in-progress`, `TimeEngine` schedules the activity, and a timer begins
**Visual contract:** Progress bar starts filling, timer shows MM:SS, halo changes to yellow/amber

### Scenario 4: Collect an activity

**Given:** the POI is `completed` and `canCollect = true`
**When:** the user clicks the Collect CTA
**Then:** rewards are applied and the POI returns to `idle`
**Visual contract:** Collect button is visible and enabled; after click, resources update and progress resets

### Scenario 5: Quest POI inert before start

**Given:** a `QuestPOI` with required slots not yet filled
**When:** `DayNightPOI` advances or the user clicks the POI
**Then:** the `MagicCircleHalo` stays empty, no chronicle opens, and the POI ignores time
**Visual contract:** Medallion is static; no arcane ring; no pulse

### Scenario 6: Completed Quest POI pulses

**Given:** a quest has resolved all phases and is waiting for the player to open `QuestChronicle`
**When:** the `QuestPOI` renders in `completed` state
**Then:** the `MagicCircleHalo` pulses (full ring + glyphs + glow) continuously
**Visual contract:** The POI medallion has a breathing glow; it remains clickable to open the chronicle

## Invariants

- POI is a capsule, not a map marker and not an expanded detail view
- Skin resolution uses `activityCapsuleSkinConfig` and `poiAmberSkinConfig`
- Drag validation matches the slot rack inside the POI detail
- A `QuestPOI` ignores time until all required slots are assigned and Start is triggered while time runs
- A completed `QuestPOI` pulses until the player opens `QuestChronicle`
- No local timers; progress is derived from `TimeEngine` state

## References

- Trusted contract: [`poi_standard_trusted.md`](./trusted/poi_standard_trusted.md)
- Used by: [`detail_spec.md`](./detail_spec.md), [`slot_rack_poi_interaction_spec.md`](./slot_rack_poi_interaction_spec.md), [`poi_detail_interaction_spec.md`](./poi_detail_interaction_spec.md), [`poi_quest_interaction_spec.md`](./poi_quest_interaction_spec.md)
