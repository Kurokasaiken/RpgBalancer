# Page 10: OutcomeModal (Isolated)

**Phase:** 5  
**Component:** OutcomeModal  
**Route:** `/minimal-outcome`  
**Purpose:** Display skill check outcome (success/failure result)

---

## Test Cases (24 total)

### Rendering (6)
- Modal renders
- Outcome title visible
- Resident portrait visible
- Outcome description visible
- Reward display visible
- Close/Continue button visible

### Outcome Display (6)
- Success state styling
- Failure state styling
- Outcome text shows
- Reward amounts show
- Experience gained shows
- Consequence shows (if failure)

### Interactions (6)
- Click continue closes modal
- Escape key closes modal
- Button is keyboard accessible
- Modal focuses correctly
- Background is darkened
- Prevent interaction with page behind

### State (4)
- Success result (rewards shown)
- Failure result (no rewards)
- Partial success (reduced rewards)
- Natural 20 bonus

### Edge Cases (2)
- Very large reward
- No experience gain

---

**Total:** 24 tests
