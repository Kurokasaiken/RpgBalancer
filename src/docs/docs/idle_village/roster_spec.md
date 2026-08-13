---
title: Roster Spec
status: draft
updated: 2026-08-13
type: component-spec
---

# Roster Spec

## State Machine (ASCII)

```text
[mount] ──► idle
 idle ──(pick card)──► dragging
 dragging ──(valid drop)──► flight
 dragging ──(invalid drop)──► returning
 flight ──(land)──► locked
 returning ──(timeout 600ms)──► idle
 locked ──(extract)──► returning
 returning ──(land)──► idle
```

## Detailed Scenarios

### Scenario 1: Drag a resident to a slot

**Given:** a resident card is rendered in `VillageRosterSection` and a valid slot exists
**When:** the user drags the card and releases over a slot
**Then:** `useDragOutcome` enters `flight`, `DragOutcomeFlight` animates into the slot, and `onFlightComplete` triggers assignment
**Visual contract:** Card remains mounted with alpha 0.5 and "Away" label during drag; target slot blooms valid gold

### Scenario 2: Invalid drop — spring back

**Given:** the user drags a card to a slot whose requirement it fails
**When:** the user releases
**Then:** `useDragOutcome.springBack(residentId)` runs and the card bounces back to the roster
**Visual contract:** Target dims to alpha 0.3; card returns to its origin over 600ms with spring easing

### Scenario 3: Click-to-assign

**Given:** a resident is available and at least one free slot matches its stats
**When:** the user clicks the resident card
**Then:** the page finds the first matching slot, starts a flight, and assigns on landing
**Visual contract:** Card flies to the slot and locks in place without a manual drag

### Scenario 4: Extraction

**Given:** a resident is locked in a slot
**When:** the user press-and-holds the occupied slot for ~560ms
**Then:** `useExtractionSequence` runs teeth retract + bezel open, then `onExtracted` removes the resident and a return flight lands in the roster
**Visual contract:** Slot chip stays until `onExtracted`; then a FlightProxy carries the card back to the roster

## Invariants

- Resident real status is derived from data, never written by the drag flow
- `lockedResidentIds` = assigned + flying until the return flight lands
- Every drag emits telemetry (`resident_assign`, `resident_unassign`, `slot_drag`, `slot_drop`)
- Drag state is transient visual state only

## References

- Trusted contract: [`roster_drag_trusted.md`](./trusted/roster_drag_trusted.md)
- Used by: [`slot_rack_spec.md`](./slot_rack_spec.md), [`roster_slot_rack_interaction_spec.md`](./roster_slot_rack_interaction_spec.md)
