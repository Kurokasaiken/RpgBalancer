---
title: Roster ↔ SlotRack Interaction
status: draft
updated: 2026-08-13
type: interaction-spec
---

# Roster ↔ SlotRack Interaction

## Data Flow

```text
VillageRosterSection (drag source)
   │
   │ resident card + stats payload
   │
   ▼
useResidentDropValidation (statMatching)
   │
   │ valid / invalid
   │
   ▼
ResidentSlotRack (drop target)
```

| Source | Data | Consumer | Effect |
|---|---|---|---|
| Roster | `resident.stats` | SlotRack/validator | evaluates slot requirements |
| Slot blueprint | `requirement`, `role` | Roster/validator | decides which cards are accepted |
| Validator | `valid` / `invalid` | SlotRack | applies `bloomEffect` state |
| SlotRack | `ResidentSlotViewModel[]` | Roster | lockedResidentIds sent back to roster |

## State Transitions

When a card enters a slot:

- `statMatching.evaluateStatRequirement` runs against the blueprint
- `bloomEffect` updates to `valid` or `invalid`
- On drop, `onDragEnd` returns `flightToSlot`
- `DragOutcomeFlight` lands, then `onFlightComplete` writes assignment

When the last empty slot is filled:

- `maxSlots: 'infinite'` generates a new empty slot
- The rack may scroll if `overflowBehavior='scroll'`

## Edge Cases

- Drag a card that does not match any slot: `springBack` to the roster
- Drop on a locked slot: `invalid` bloom and spring-back
- Multiple valid slots: click-to-assign chooses the first free matching slot

## Invariants

- Requirement evaluation uses config-driven `statMatching`, not hardcoded logic
- `bloomEffect` is `drop-shadow`-based only
- Slot assignment happens after `onFlightComplete`, not in `onDragEnd`

## References

- [`roster_spec.md`](./roster_spec.md)
- [`slot_rack_spec.md`](./slot_rack_spec.md)
- [`roster_slot_integration_spec.md`](./roster_slot_integration_spec.md)
