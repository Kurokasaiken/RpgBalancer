---
title: SlotRack ↔ POI Interaction
status: draft
updated: 2026-08-14
type: interaction-spec
---

# SlotRack ↔ POI Interaction

## Data Flow

```text
ResidentSlotRack
   │
   │ ResidentSlotViewModel[]
   │
   ▼
ActivityCapsule (POI)
   │
   │ canStart, progress, canCollect
   │
   ▼
POI start / collect CTA
```

| Source | Data | Consumer | Effect |
|---|---|---|---|
| SlotRack | `occupiedSlots` | POI | enables Start CTA when required slots are filled |
| SlotRack | `slotBlueprints` | POI | shows role labels and requirement hints |
| POI | `onStart` | TimeEngine | schedules activity |
| POI | `onCollect` | TimeEngine | resolves rewards and releases slots |
| TimeEngine | `progress` | POI | updates progress bar and timer |

## State Transitions

When all required slots are filled:

- `startDisabled` becomes `false`
- The Start/Embark CTA becomes visually active

When `onStart` is clicked:

- `TimeEngine.scheduleActivity` is called
- POI status becomes `in-progress`
- Progress bar begins filling from `TimeEngine` ticks

When the activity completes:

- `TimeEngine.resolveActivityOutcome` fires
- POI status becomes `completed`
- `canCollect` becomes `true`

## Edge Cases

- A required slot becomes empty after start: not possible because start validates before scheduling
- `canCollect` stays `false` until `TimeEngine` reports `completed`
- If a slot is `infinite`, the POI only requires `role`/`required` slots, not all slots

## Invariants

- POI progress is derived from `TimeEngine` state
- Start CTA state is derived from slot occupancy and required flags
- Slot rack inside the POI uses the same `ResidentSlotViewModel` contract as the standalone rack
- POI medallion bloom is per-resident: `valid` only if the dragged resident matches at least one free slot; otherwise `invalid`

## Runtime Evidence

Playwright suite `poiQuestDetailRosterTimeClock.spec.ts` (2026-08-14):

- `should bloom the QuestPOI valid for a compatible resident and invalid for an incompatible one` — `poi-detail-stage__medallion` `style.filter` contains `drop-shadow` for a valid resident and `grayscale(0.7)` for an invalid one.
- `should assign a compatible resident via the API and reflect it in the detail` — the resident is accepted by the POI-level drop and lands in the first matching slot.

## References

- [`slot_rack_spec.md`](./slot_rack_spec.md)
- [`poi_spec.md`](./poi_spec.md)
- [`poi_standard_trusted.md`](./trusted/poi_standard_trusted.md)
