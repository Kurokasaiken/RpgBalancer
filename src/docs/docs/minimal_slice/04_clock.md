# Page 04: ClockWidget (Isolated)

**Phase:** 2  
**Component:** ClockWidget  
**Route:** `/minimal-clock`  
**Purpose:** Test time display, speed controls

---

## Test Cases (28 total)

### Rendering (6)
- Clock displays current time
- Day counter shows
- Hour/minute display correct format
- Speed buttons visible
- Pause state indicator visible
- Time updates live

### Time Display (6)
- Hour displays 0-24
- Minute displays 0-59
- Day counter increments correctly
- Time format readable (e.g. "Day 1, 12:30")
- Fractional hours handled
- Milliseconds not shown

### Speed Control (8)
- Play button starts time
- Pause button stops time
- Speed 1x button
- Speed 2x button
- Speed 4x button
- Speed changes apply
- Play/Pause toggle works
- Speed persists

### State (6)
- Time updates after 1 second (1x)
- Time updates 2x after 0.5 second (2x)
- Time paused when pause clicked
- Day increments at hour 24
- Hour resets to 0 at day end
- Speed change doesn't reset time

### Edge Cases (2)
- Very fast speed (4x)
- Clock handles day boundaries

---

**Total:** 28 tests
