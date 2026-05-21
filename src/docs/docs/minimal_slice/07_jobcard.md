# Page 07: JobCard (Isolated)

**Phase:** 4  
**Component:** JobCard  
**Route:** `/minimal-jobcard`  
**Purpose:** Display job card (work assignment), drop target

---

## Test Cases (30 total)

### Rendering (6)
- Card renders
- Job icon visible
- Job name visible
- Reward display visible
- Difficulty badge visible
- Drop zone highlight visible

### Job Display (6)
- Icon loads correctly
- Name displays (e.g., "Gathering")
- Description shows
- Reward amount shows
- Difficulty color matches (easy/medium/hard)
- XP reward shows

### State (6)
- Empty slot (no resident)
- Occupied slot (resident assigned)
- Active state (hovering)
- Completed state (if applicable)
- In-progress state
- Disabled state

### Interactions (6)
- Hover shows tooltip
- Tooltip shows job details
- Drag-over highlight
- Drop preparation visual
- Click selectable
- Right-click context menu (if applicable)

### Drag Readiness (4)
- Accepts drop (drag-over)
- Rejects drop (if full/incompatible)
- Shows feedback on drag
- Completes drop

### Edge Cases (2)
- Very long job name
- No reward job

---

**Total:** 30 tests
