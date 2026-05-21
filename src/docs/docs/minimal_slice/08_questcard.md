# Page 08: QuestCard (Isolated)

**Phase:** 4  
**Component:** QuestCard  
**Route:** `/minimal-questcard`  
**Purpose:** Display quest card (mission), drop target

---

## Test Cases (30 total)

### Rendering (6)
- Card renders
- Quest icon visible
- Quest title visible
- Difficulty badge visible
- Reward display visible
- Required stats visible

### Quest Display (6)
- Icon loads correctly
- Title displays (e.g., "Dragon Slaying")
- Description shows
- Reward amount shows
- Required level shows
- Required stats show

### State (6)
- Empty slot (no resident)
- Occupied slot (resident assigned)
- Available state
- In-progress state
- Completed state
- Locked state (insufficient level)

### Interactions (6)
- Hover shows tooltip
- Tooltip shows quest requirements
- Drag-over highlight
- Drop preparation visual
- Click selectable
- Requirements check visual

### Drag Readiness (4)
- Accepts drop (meets requirements)
- Rejects drop (insufficient stats)
- Shows feedback on drag
- Completes drop

### Edge Cases (2)
- Very high level requirement
- Multiple stat requirements

---

**Total:** 30 tests
