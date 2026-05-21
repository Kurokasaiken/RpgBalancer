# Page 03: VillageRosterSection (Isolated)

**Phase:** 2  
**Component:** VillageRosterSection  
**Route:** `/minimal-roster`  
**Purpose:** Test roster rendering, sorting, filtering

---

## Test Cases

### Rendering (6)
- Roster renders list of PgCards
- All residents visible
- Sorting dropdown works (A-Z, Z-A, Rarity, Status)
- Sort changes DOM order
- Filter dropdown works (available, away, injured, busy)
- Filter hides/shows tokens

### Sorting (8)
- Sort A-Z alphabetical
- Sort Z-A reverse alphabetical
- Sort by Rarity descending (3→2→1)
- Sort by Status (available first)
- Sort updates instantly
- Sort persists on page refresh
- Multiple sorts don't break each other
- Unsorted returns to default

### Filtering (8)
- Filter "Available" shows only available residents
- Filter "Away" shows only away residents
- Filter "Injured" shows only injured residents
- Filter "Busy" shows only busy residents
- Filter "All" shows all residents
- Filter updates instantly
- Multiple filters don't conflict
- Filter + Sort work together

### Interactions (6)
- Click resident triggers callback
- Click while filtering works
- Click while sorting works
- Hover shows tooltip on resident
- Drag resident from roster (integration with drag)
- Roster updates when resident state changes

### State (4)
- Roster reflects resident updates live
- New resident appears in list
- Removed resident disappears from list
- Injured resident visual changes instantly

### Edge Cases (6)
- Empty roster (0 residents)
- Single resident
- Many residents (100+)
- All residents same name (duplicate names)
- All residents same level
- All residents same status

---

**Total Test Cases:** 38  
**Estimated Test Duration:** 4-5 minutes
