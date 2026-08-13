---
title: SlotRack Spec
status: draft
updated: 2026-08-13
type: component-spec
---

# SlotRack Spec

## State Machine (ASCII)

```text
[config load] ──► empty
 empty ──(drag enter)──► preview
 preview ──(drop valid)──► occupied
 occupied ──(start)──► active
 active ──(complete)──► done
 done ──(collect/extract)──► empty
 preview ──(drop invalid)──► empty
```

## Detailed Scenarios

### Scenario 1: Render slots from config

**Given:** an `ActivityDefinition` with `metadata.slotBlueprints` and `maxSlots`
**When:** `ResidentSlotRack` mounts
**Then:** it renders the configured number of `CardSocket` slots with role labels and requirement hints
**Visual contract:** Slots appear in a grid; empty slots show a placeholder ghost

### Scenario 2: Drag over a valid slot

**Given:** a dragged resident has stats that satisfy a slot's `NumericStatRequirement`
**When:** the card hovers the slot
**Then:** the slot applies `bloomEffect` in `valid` state
**Visual contract:** Slot gets a warm gold drop-shadow halo and no desaturation

### Scenario 3: Drag over an invalid slot

**Given:** a dragged resident fails a slot's requirement
**When:** the card hovers the slot
**Then:** the slot applies `bloomEffect` in `invalid` state
**Visual contract:** Slot dims to 0.3 opacity and desaturates

### Scenario 4: Infinite slot expansion

**Given:** `maxSlots: 'infinite'` and the last free slot is filled
**When:** a resident is assigned to the last slot
**Then:** a new empty `CardSocket` appears at the end of the rack
**Visual contract:** A new slot is appended before the flight lands

## Invariants

- Slot list is derived from config; no hardcoded slots in page code
- `useResidentSlotController` produces `ResidentSlotViewModel[]` from assignments + blueprints
- Each slot evaluates requirements via `statMatching`
- `CardSocket` never applies `box-shadow` bloom; only `drop-shadow` bloom

## References

- Related integration: [`roster_slot_integration_spec.md`](./roster_slot_integration_spec.md)
- Used by: [`poi_spec.md`](./poi_spec.md), [`roster_slot_rack_interaction_spec.md`](./roster_slot_rack_interaction_spec.md), [`slot_rack_poi_interaction_spec.md`](./slot_rack_poi_interaction_spec.md)
