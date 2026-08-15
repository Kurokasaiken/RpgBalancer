---
title: POI Detail Spec
status: draft
updated: 2026-08-14
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
**Then:** `ActivityCapsuleDetailSkinAware` opens as a draggable detail panel with POI info, slots, progress, and CTA
**Visual contract:** Panel opens with a 300-400ms animation; the page behind remains interactive; the drag handle is visible and the panel can be moved by pointer dragging

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

### Scenario 5: Quest POI detail pauses time

**Given:** the user clicks a `QuestPOI` that has not yet started
**When:** the POI detail opens
**Then:** `pauseGame()` is called automatically and `DayNightPOI` shows the paused state
**Visual contract:** Pause icon appears in the clock; the quest detail is ready for assignment

### Scenario 6: Quest detail restored from reference page

**Given:** the current `POI detail` of a Quest has extra non-functional chrome
**When:** the page is aligned with `/poi-quest-detail-roster-integration`
**Then:** the detail contains only: header (draggable), POI info, slot rack, CTA; no extra ornaments or nested panels
**Visual contract:** Same surface as the reference page; header has `cursor: move`; no backdrop

### Scenario 7: Floating panel centered in map viewport

**Given:** the map viewport has known bounds
**When:** any floating panel opens
**Then:** it is positioned at the center of the map viewport and is fully visible (clamped to bounds)
**Visual contract:** Panel `left`/`top` computed from the map container rect, not the full window

## Invariants

- Detail is a `ActivityCapsuleDetailSkinAware` draggable window; it never blocks the page with a backdrop
- All visual properties come from `ActivityCapsuleDetailSkinPresets`; no hardcoded values
- Slot data passes through `ActivityDetailSlotData` contract with role, required, emptyPenalty, risk modifiers
- Opening the Quest POI detail pauses the game automatically
- The Quest POI detail is visually identical to the reference in `/poi-quest-detail-roster-integration` (no extra chrome)
- Floating panels open centered in the map viewport and are fully visible
- State persistence uses `PersistenceService`, never direct localStorage

## Runtime Evidence

Playwright suite `poiQuestDetailRosterTimeClock.spec.ts` (2026-08-14):

- `should open the Quest POI detail and show the ResidentSlotRack` — validates Scenario 1 (open + slot rack visible).
- `should pause the game when opening the Quest POI detail` — validates Scenario 5 (`__idleVillageTestHooks.getQuestState().isPaused` becomes `true`).
- `should drag the POI detail panel by its header` — validates Scenario 1 (draggable header).
- `should keep Start disabled until a required slot is filled` — validates Scenario 2/3 (slot assignment enables Start CTA).
- `should run the quest end-to-end, auto-resolve milestones and collect rewards` — validates Scenario 3/4 (start, complete, collect, close).

## References

- Trusted contract: [`poi_detail_trusted.md`](./trusted/poi_detail_trusted.md)
- Depends on: [`poi_spec.md`](./poi_spec.md), [`floating_panel_spec.md`](./floating_panel_spec.md)
- Used by: [`poi_detail_interaction_spec.md`](./poi_detail_interaction_spec.md), [`quest_spec.md`](./quest_spec.md)
