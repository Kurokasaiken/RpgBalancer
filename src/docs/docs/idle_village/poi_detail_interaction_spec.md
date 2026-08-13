---
title: POI ↔ Detail Interaction
status: draft
updated: 2026-08-13
type: interaction-spec
---

# POI ↔ Detail Interaction

## Data Flow

```text
ActivityCapsule (POI)
   │
   │ click ──► open / close
   │
   ▼
FloatingPanel + ActivityCapsuleDetailSkinAware
   │
   │ slot assignments, start/cancel/collect
   │
   ▼
useMinimalGameplay (state updates)
```

| Source | Data | Consumer | Effect |
|---|---|---|---|
| POI | `activityId` | Detail | loads the same `ActivityDefinition` and slot blueprints |
| POI | `onActivityClick` | Detail | opens the floating panel |
| Detail | `onSlotAssign`, `onSlotDetach` | POI/Store | updates assignments and re-renders the capsule |
| Detail | `onStart` / `onCollect` | POI | changes POI status and progress |
| Detail | `onClose` | POI | panel closes; POI remains visible |

## State Transitions

When the user clicks a POI:

- `FloatingPanel` opens at a default or remembered position
- `ActivityCapsuleDetailSkinAware` receives the same `activityId`
- Panel header, POI display, slot rack, and CTA render

When a slot is assigned inside the detail:

- The detail calls `onSlotAssign(slotId)`
- The store adds the resident to that slot
- The POI capsule re-renders to show the filled slot summary

When Start is clicked:

- `TimeEngine` schedules the activity
- The POI state becomes `in-progress`
- The detail may show real-time progress or minimize

## Edge Cases

- Open multiple details: each is an independent `FloatingPanel` with its own `activityId`; z-index managed by last interaction
- Minimize detail while activity runs: the POI capsule continues to show progress; detail can be restored
- Close detail with unstarted assignments: assignments are kept in store; panel state is local

## Invariants

- Detail does not own activity state; it only delegates actions to the store/TimeEngine
- `FloatingPanel` is non-modal; the map remains interactive
- The same slot blueprints are used by POI and Detail (single source: `ActivityDefinition`)

## References

- [`poi_spec.md`](./poi_spec.md)
- [`detail_spec.md`](./detail_spec.md)
- [`poi_detail_trusted.md`](./trusted/poi_detail_trusted.md)
