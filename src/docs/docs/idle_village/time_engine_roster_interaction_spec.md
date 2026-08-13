---
title: TimeEngine ↔ Roster Interaction
status: draft
updated: 2026-08-13
type: interaction-spec
---

# TimeEngine ↔ Roster Interaction

## Data Flow

```text
TimeEngine
   │
   │ currentTime, active activities, resident status
   │
   ▼
useMinimalGameplay
   │
   │ residents[].status, availableResidents, scheduledActivities
   │
   ▼
VillageRosterSection
```

| Source | Data | Consumer | Effect |
|---|---|---|---|
| TimeEngine | `advanceTime` | gameplay store | updates resident status |
| gameplay store | `residents[].status` | Roster | renders available/away/injured/dead labels |
| TimeEngine | `resolveActivityOutcome` | gameplay store | unlocks residents, applies injuries |
| Roster | `residentId` (drag start) | gameplay store | locks resident while flying |

## State Transitions

When TimeEngine marks an activity complete:

- Resident `status` changes from `away` to `available` (or `injured`/`dead`)
- `lockedResidentIds` no longer includes the resident
- Roster re-derives card labels and interactivity

When the user starts dragging a resident:

- The resident remains in `VillageResidentStore`
- `useDragOutcome` marks the card visual as `dragging` (alpha 0.5, "Away" label)
- No TimeEngine mutation occurs during the drag

## Edge Cases

- Drag a resident that just died: the roster re-derived status makes the card non-draggable
- Time advances while a resident is flying: `lockedResidentIds` prevents double assignment
- Pause while dragging: time is already frozen, so no race

## Invariants

- Roster shows status derived from data, not drag state
- `lockedResidentIds` includes assigned + flying residents
- Drag flow never writes resident `status`

## References

- [`time_engine_spec.md`](./time_engine_spec.md)
- [`roster_spec.md`](./roster_spec.md)
- [`roster_drag_trusted.md`](./trusted/roster_drag_trusted.md)
