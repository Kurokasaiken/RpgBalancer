---
title: POI Detail Spec
status: draft
updated: 2026-08-13
type: component-spec
---

# POI Detail Spec

## State Machine (ASCII)

```text
[init] ──► closed
 closed ──(click POI)──► open
 open ──(drag header)──► moved
 open ──(minimize)──► minimized
 minimized ──(restore)──► open
 open / minimized ──(close)──► closed
 open ──(assign)──► open
 open ──(start/cancel/collect)──► open | closed
```

## Detailed Scenarios

### Scenario 1: Open POI detail

**Given:** a POI on the map is idle
**When:** the user clicks it
**Then:** a `FloatingPanel` opens, showing `ActivityCapsuleDetailSkinAware` with POI info, slots, progress, and CTA
**Visual contract:** Panel opens with a 300-400ms animation; the page behind remains interactive

### Scenario 2: Assign resident to a slot inside detail

**Given:** the detail is open and a slot blueprint accepts the dragged resident
**When:** the user drops a resident onto the detail's slot rack
**Then:** the slot becomes `occupied`, `onSlotAssign` is emitted, and the Start CTA enables when required slots are filled
**Visual contract:** Slot shows the resident portrait and name; the CTA border becomes active

### Scenario 3: Start activity from detail

**Given:** all required slots are filled
**When:** the user clicks Start/Embark
**Then:** `onStart` is emitted, the activity begins, and the progress bar advances
**Visual contract:** Progress bar starts, timer appears, panel stays open or collapses depending on quest type

### Scenario 4: Collect from detail

**Given:** the activity is complete
**When:** the user clicks Collect
**Then:** rewards are distributed, residents return to `available`, and the panel closes or resets
**Visual contract:** Reward numbers animate, resident chips move from slots to roster

## Invariants

- Detail is a `FloatingPanel`; it never blocks the page with a backdrop
- All visual properties come from `ActivityCapsuleDetailSkinPresets`; no hardcoded values
- Slot data passes through `ActivityDetailSlotData` contract with role, required, emptyPenalty, risk modifiers
- State persistence uses `PersistenceService`, never direct localStorage

## References

- Trusted contract: [`poi_detail_trusted.md`](./trusted/poi_detail_trusted.md)
- Depends on: [`poi_spec.md`](./poi_spec.md), [`floating_panel_spec.md`](./floating_panel_spec.md)
- Used by: [`poi_detail_interaction_spec.md`](./poi_detail_interaction_spec.md), [`quest_spec.md`](./quest_spec.md)
