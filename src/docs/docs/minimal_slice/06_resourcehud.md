# Page 06: ResourceHUD (Isolated)

**Phase:** 3  
**Component:** ResourceHUD  
**Route:** `/minimal-resourcehud`  
**Purpose:** Display village resources (gold, wood, food, iron)

---

## Test Cases (26 total)

### Rendering (6)
- HUD container renders
- Gold resource visible
- Wood resource visible
- Food resource visible
- Iron resource visible
- All icons visible

### Resource Display (6)
- Gold value shows correct number
- Wood value shows correct number
- Food value shows correct number
- Iron value shows correct number
- Resource icons load
- Values are numeric

### Formatting (4)
- Large numbers formatted (1000+)
- Zero values display
- Negative values display
- Decimal values not shown

### Interactions (4)
- Hover shows tooltip
- Tooltip shows full value
- Hover on icon works
- Hover on value works

### State (4)
- Resource values update
- No mutation of state
- Values persist on re-render
- Read-only display

### Edge Cases (2)
- Very large numbers
- Zero resources

---

**Total:** 26 tests
