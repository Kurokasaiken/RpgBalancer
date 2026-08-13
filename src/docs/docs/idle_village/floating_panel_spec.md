---
title: FloatingPanel Spec
status: draft
updated: 2026-08-13
type: component-spec
---

# FloatingPanel Spec

## State Machine (ASCII)

```text
[init] ──► closed
 closed ──(open)──► open
 open ──(minimize)──► minimized
 open ──(maximize)──► maximized
 open / minimized / maximized ──(drag header)──► moved
 moved ──(minimize/maximize)──► minimized / maximized
 any ──(close)──► closed
```

## Detailed Scenarios

### Scenario 1: Open a detail panel

**Given:** a panel has `isOpen = false`
**When:** the user clicks a POI
**Then:** `FloatingPanel` renders with header, close button, minimize button, and content area
**Visual contract:** Panel appears without a full-screen backdrop; the rest of the page remains interactive

### Scenario 2: Drag to move

**Given:** panel is open and the user pointer is on the header
**When:** the user drags the header
**Then:** `FloatingPanel` translates by `deltaX/deltaY` and stays on top while dragged
**Visual contract:** Header has `cursor=move`, the panel moves 1:1 with the pointer, and z-index rises above other panels on `pointerdown`

### Scenario 3: Minimize and restore

**Given:** panel is open
**When:** the user clicks the minimize button
**Then:** panel collapses to a small header chip at its bottom-right
**Visual contract:** Content area has `display: none` or zero height; header chip remains visible and clickable to restore

### Scenario 4: Close

**Given:** panel is open
**When:** the user clicks the close button
**Then:** the panel unmounts or renders `null` and `onClose` is called
**Visual contract:** No remaining panel node in the accessibility tree

## Invariants

- Panels are non-modal: no backdrop, pointer events are not captured
- Multiple panels can coexist; the most recently touched panel is on top
- Positional state is local to the panel component; domain state remains in the store
- Minimize and close affordances are always available in the header

## References

- Used by: [`poi_spec.md`](./poi_spec.md), [`detail_spec.md`](./detail_spec.md), [`quest_spec.md`](./quest_spec.md)
