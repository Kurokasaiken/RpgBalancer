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

## Invariants

- POI is a capsule, not a map marker and not an expanded detail view
- Skin resolution uses `activityCapsuleSkinConfig` and `poiAmberSkinConfig`
- Drag validation matches the slot rack inside the POI detail
- No local timers; progress is derived from `TimeEngine` state

## References

- Trusted contract: [`poi_standard_trusted.md`](./trusted/poi_standard_trusted.md)
- Used by: [`detail_spec.md`](./detail_spec.md), [`slot_rack_poi_interaction_spec.md`](./slot_rack_poi_interaction_spec.md), [`poi_detail_interaction_spec.md`](./poi_detail_interaction_spec.md), [`poi_quest_interaction_spec.md`](./poi_quest_interaction_spec.md)
