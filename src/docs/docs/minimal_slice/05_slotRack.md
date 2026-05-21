# Page 05: ResidentSlotRack (Isolated)

**Phase:** 3  
**Component:** ResidentSlotRack  
**Route:** `/minimal-slotRack`  
**Purpose:** Display 4-8 resident slots, empty/occupied, drag-ready

---

## Test Cases (32 total)

### Rendering (6)
- Slot container renders
- All 6 slots visible
- Empty slot shows placeholder
- Occupied slot shows resident portrait
- Slot badge shows rarity (if occupied)
- Slot status indicator visible

### Slot States (8)
- Empty slot default style
- Occupied slot different style
- Hover state on empty slot
- Hover state on occupied slot
- Injured resident marked in slot
- Hero star visible on hero resident
- Fatigue bar shown
- Level badge shown

### Resident Display (6)
- Portrait image loads
- Name displays (optional)
- Rarity ring matches resident level
- Status icon visible (if injured/away)
- Fatigue indicator accurate
- Level text visible

### Interactions (6)
- Click empty slot (selectable)
- Click occupied slot (selectable)
- Hover reveals tooltip
- Tooltip shows resident stats
- Drag-ready cursor on occupied
- Selection state persists

### State (4)
- Selected slot highlighted
- Multiple slots can be occupied
- Slot order preserved
- Empty slots remain empty

### Edge Cases (2)
- All slots occupied
- All slots empty

---

**Total:** 32 tests
