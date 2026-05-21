# Page 02: SlottedMedal (Isolated)

**Phase:** 1 (variant of PgCard)  
**Component:** SlottedMedal  
**Route:** `/minimal-slottedmedal`  
**Purpose:** Test SlottedMedal rendering (circular token, used in ResidentSlotRack)

---

## Component Overview

**SlottedMedal** is a circular token display (board game style) showing:
- Portrait image (circular crop, centered)
- Rarity ring (colored border: bronze/silver/gold)
- Halo effect (optional, when selected/active)
- Status icons (injured, away, busy, fatigue — same as PgCard)
- Level indicator (ring color only)

**Difference from PgCard:**
- Circular instead of rectangular
- Optimized for slot display (ResidentSlotRack)
- May have halo or glow effect when occupied

---

## Test Cases (Exhaustive)

All tests are **identical to PgCard**, just verifying circular variant:

### Rendering Tests (6)
- Portrait loads correctly
- Rarity ring color — Level 1 (Bronze)
- Rarity ring color — Level 2 (Silver)
- Rarity ring color — Level 3+ (Gold)
- Circular shape (border-radius: 50%)
- Component renders without errors

### Status Icons (8)
- Injured icon visible/hidden
- Away icon visible/hidden
- Busy icon visible/hidden
- Fatigue icon visible/hidden
- Multiple icons visible together

### Interactions (6)
- Hover shows tooltip with name
- Unhover hides tooltip
- Tooltip contains stats
- Tooltip contains level
- Tooltip contains HP
- Responsive on different viewports

### State (4)
- Available status shows bright visual
- Away status shows dimmed visual
- Injured token shows visual indicator
- Busy status shows distinct visual

### Edge Cases (6)
- Very long name does not overflow
- Missing portrait shows placeholder
- Zero HP displays correctly
- Max fatigue shows correctly
- Invalid level (0) shows default visual
- Multiple instances don't conflict

---

## Definition of Done

- ✅ Page `/minimal-slottedmedal` renders without errors
- ✅ Shows 5 different residents with different levels/statuses
- ✅ All 30 test cases pass (same structure as PgCard)
- ✅ Circular shape verified (border-radius: 50%)
- ✅ No console errors
- ✅ Visual regression baseline captured

---

**Total Test Cases:** 30  
**Estimated Test Duration:** 3-4 minutes  
**Next Phase:** 02_roster.md (combines PgCard + container)
