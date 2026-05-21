# Page 09: SkillCheckPanel (Isolated)

**Phase:** 5  
**Component:** SkillCheckPanel  
**Route:** `/minimal-skillcheck`  
**Purpose:** Display skill check resolution (before outcome)

---

## Test Cases (28 total)

### Rendering (6)
- Panel renders
- Resident portrait visible
- DC (difficulty class) visible
- Relevant stat visible
- Roll input visible
- Check button visible

### Skill Check Display (6)
- Resident name shows
- Portrait loads correctly
- DC value displays
- Required stat shows (STR, DEX, etc)
- Modifier displays
- Expected difficulty label shows

### State (6)
- Unresolved state (input ready)
- Input focused state
- Roll in progress state
- Success calculation
- Failure calculation
- Result display

### Interactions (6)
- Input field accepts numbers
- Check button triggers resolution
- Enter key triggers check
- Result displays immediately
- Margin of success shown
- Margin of failure shown

### Edge Cases (4)
- Critical success (nat 20)
- Critical failure (nat 1)
- Zero modifier
- Negative modifier

---

**Total:** 28 tests
