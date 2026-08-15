---
title: Roster ↔ SlotRack Interaction
status: draft
updated: 2026-08-14
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
- A resident with no matching slots is marked `compatibilityState='invalid'`, `aria-disabled='true'`, visually grayscale and not interactive

## Runtime Evidence

Playwright suite `poiQuestDetailRosterTimeClock.spec.ts` (2026-08-14):

- `should mark non-compatible residents as disabled and prevent assignment` — skipped only when the current test roster has no incompatible resident; validates `data-compatibility='invalid'`, `aria-disabled='true'`, `grayscale` / `opacity-35` classes, and click-to-assign is suppressed.
- `should bloom detail slots valid/invalid based on dragged resident` — `data-drop-state` is `valid` for matching slots and `invalid` for non-matching slots when `__idleVillageTestHooks.setDraggingResidentId` is used.
- `should assign a compatible resident via the API and reflect it in the detail` — `assignResident` returns the resident id, the POI detail opens, and `[data-resident-id]` is visible in the slot.

## Comportamento atteso (2026-08-15)

- **Overflow slot rack:** quando tutti gli slot sono occupati e ne appare uno extra, la riga slot deve scorrere orizzontalmente (`overflow-x: auto`) senza aumentare la larghezza del POI detail e senza sovrapposizioni tra gli elementi. Test: `should add a scrollable slot row instead of expanding the POI detail`.

## References

- [`roster_spec.md`](./roster_spec.md)
- [`slot_rack_spec.md`](./slot_rack_spec.md)
- [`roster_slot_integration_spec.md`](./roster_slot_integration_spec.md)
