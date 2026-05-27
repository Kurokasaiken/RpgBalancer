# Phase 2: Roster + PgToken — Entity Specification

**Phase:** 2 of 6
**Estimated Duration:** 2-3 days
**Entità:** ResidentRoster (container) + PgToken (draggable)
**Page Route:** `/minimal-roster`
**Test Page Requirement:** MUST use real project components (VillageRosterSection, DragTestContainer) with mock data
**Last Updated:** 2026-05-21

---

**Aligned with Master Plan:** See [MASTER_PLAN.md](../MASTER_PLAN.md) for separation of concerns (plans vs tasks)
**Aligned with Plans Index:** See [IMPLEMENTATION_PLANS_INDEX.md](../IMPLEMENTATION_PLANS_INDEX.md) for plan navigation
**Aligned with Semantic Constraints:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) for freezing semantics
**Aligned with PgToken Spec:** See [01_pgtoken.md](./01_pgtoken.md) for PgToken isolated behavior
**Aligned with Roster-Slot Integration:** See [roster_slot_integration_spec.md](../idle_village/roster_slot_integration_spec.md) for complete drag-and-drop integration

---

## 1. Entity Overview

### 1.1 What is ResidentRoster?

**ResidentRoster** is the container component that displays an ordered list of playable characters (PgTokens) available for assignment to activities. It provides:
- **Sorting** (A-Z, rarity, status, survival score)
- **Filtering** (available, away, injured, exhausted, heroes, dead)
- **Drag-and-drop** (via PgToken)
- **Virtualization** (for large rosters > threshold)
- **Real-time updates** (from TimeEngine)

**In the codebase:**
- `ResidentRosterPanel.tsx` (168 lines) - Wrapper component
- `DragTestContainer.tsx` (1110 lines) - Main container with filtering, sorting, virtualization

**Visually rendered as:**
```
┌─────────────────────────────────────────────────┐
│ [⋮⋮] Roster 3/3 [Filtro ▼] [👁] [Collapse ▼]      │
│ Drag Handle   Count   Dropdown   Controls         │
├─────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Portrait │ │ Portrait │ │ Portrait │           │
│ │ Name     │ │ Name     │ │ Name     │           │
│ │ HP/Fatigue│ │ HP/Fatigue│ │ HP/Fatigue│          │
│ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────┘
```

### 1.2 Key Components

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| **ResidentRosterPanel** | Wrapper | `components/ResidentRosterPanel.tsx` | Thin wrapper, header controls |
| **DragTestContainer** | Container | `components/DragTestContainer.tsx` | Main logic: filtering, sorting, virtualization |
| **PgCard** | Draggable | `components/PgCard.tsx` | Individual resident token (see Phase 1) |
| **CardSocket** | Placeholder | `components/CardSocket.tsx` | Empty slot when PgCard is lifted |

### 1.3 Key Properties

| Property | Type | Source | Example |
|----------|------|--------|---------|
| `residents` | `ResidentState[]` | TimeEngine store | Array of all residents |
| `onDragStart` | `(id: string) => void` | Callback | Triggered when PgCard drag starts |
| `onDragEnd` | `(id: string) => void` | Callback | Triggered when PgCard drag ends |
| `onResidentSelect` | `(id: string) => void` | Callback | Triggered when PgCard is clicked |
| `isDayPhase` | boolean | TimeEngine | `true` = daytime (interactive), `false` = night (blocked) |
| `getResidentCompatibility` | function | SlotRack | Returns compatibility with target slot |
| `enableVirtualization` | boolean | prop | Activates virtualization for large rosters |
| `cardVariant` | `'horizontal' \| 'vertical'` | prop | Visual layout of PgCard |

**Source of truth:** `ResidentState` from `useVillageResidents()` hook (TimeEngine).

---

## 2. Visual Appearance & Rendering

### 2.1 Header Structure (Inline Layout)

The header contains all controls on a single line:

```
┌─────────────────────────────────────────────────┐
│ [⋮⋮] Roster 3/3 [Filtro ▼] [👁] [Collapse ▼]      │
│ Drag Handle   Count   Dropdown   Controls         │
└─────────────────────────────────────────────────┘
```

**Elements:**
- **Drag handle** (GripVertical icon): For positional window dragging (not sortable)
- **Title**: "Roster" text-[9px] uppercase tracking-[0.4em]
- **Count**: "3/3" text-amber-100 (filtered/total)
- **Filter dropdown**: Status filter (Tutti, Eroi, Feriti, Disponibili, Esausti, Impegnati, Caduti)
- **Eye toggle**: Show/hide roster
- **Collapse button**: Collapse/expand roster

### 2.2 Card Layout

**Horizontal variant** (default for inline layout):
```
┌────────────────────────────┐
│ [Portrait]  Name  HP/Fatigue │
│  60px      ...   ...        │
└────────────────────────────┘
```

**Vertical variant** (for showcase layout):
```
┌──────┐
│Portrait│
│ 80px  │
├──────┤
│ Name │
│ HP   │
│ Fat  │
└──────┘
```

### 2.3 Card States

| State | Visual | When |
|-------|--------|------|
| **Idle** | Normal rendering | Resident available, not interacting |
| **Hover** | Highlight border | Mouse over card |
| **Dragging** | CardSocket placeholder | PgCard lifted, shows empty slot |
| **Locked** | "Assigned" label | Resident assigned to activity |
| **Blocked** | "Recupero necessario" overlay | HP < threshold OR fatigue > threshold OR injured |
| **Hero flash** | Amber ping animation | Resident becomes hero (1.4s animation) |

---

## 3. Freezing Semantics (Quando sono congelato)

### 3.1 Freezing Rules

| Entity | When Frozen | Duration | Why |
|--------|----------|----------|-----|
| **PgToken** | During drag | `pointerDown` → `pointerUp` | Overlay controls visual, guard blocks clicks |
| **PgToken** | After failed drop | 200ms | G5 guard layer prevents ghost click |
| **PgToken** | In active activity | Until timer completes | Cannot reassign mid-activity |
| **PgToken** | During night | While `isDayPhase=false` | No activities at night |
| **Roster** | During drag (partial) | Drag duration | Token inert, but list can reorder |
| **Roster** | Never | N/A | Stateless view (always reflects TimeEngine) |

### 3.2 Freezing Implementation

**During PgToken drag:**
```typescript
// Block pointer events on roster list
setListPointerEvents(!draggingResidentId);

// Show CardSocket placeholder instead of PgCard
{isLifted ? (
  <CardSocket className="w-full" horizontal={cardVariant === 'horizontal'} />
) : (
  <PgCard ... />
)}
```

**After drag (ghost click suppression):**
```typescript
dragClickSuppressTimeout.current = window.setTimeout(() => {
  setRecentlyDraggedResidentId((prev) => (prev === residentId ? null : prev));
  dragClickSuppressTimeout.current = null;
}, 200);
```

**During night phase:**
```typescript
const isResidentInteractive = useCallback((resident: ResidentState): boolean => {
  if (!isDayPhase) return false; // Block all interactions at night
  const status = getEffectiveStatus(resident);
  const { minHpThreshold, maxFatigueThreshold } = dragConfig.thresholds;
  return !resident.isInjured &&
         status === 'available' &&
         resident.currentHp >= minHpThreshold &&
         resident.fatigue <= maxFatigueThreshold;
}, [isDayPhase, getEffectiveStatus, dragConfig.thresholds]);
```

---

## 4. Cross-Entity Behavior (Come interagisco con...)

### 4.1 Roster ↔ PgToken

**Roster renders PgCards:**
- Receives `ResidentState[]` from TimeEngine
- Maps each resident to a `PgCard` component
- Passes props: `workerId`, `label`, `hp`, `fatigue`, `portraitUrl`, etc.
- Handles PgCard callbacks: `onDragStart`, `onDragEnd`, `onSelect`

**PgToken interactions:**
- **Drag start**: Roster sets `draggingResidentId`, blocks pointer events
- **Drag end**: Roster clears `draggingResidentId`, enables pointer events, starts 200ms ghost click suppression
- **Select**: Roster calls `onResidentSelect` callback (blocked if dragging or recently dragged)

### 4.2 Roster ↔ SlotRack

**Assignment flow:**
1. User drags PgToken from Roster to SlotRack
2. SlotRack validates assignment (via `getResidentCompatibility`)
3. SlotRack calls `onResidentSelect` or assignment callback
4. Roster updates: marks resident as `locked` (shows "Assigned" label)
5. TimeEngine starts activity timer

**Time flow:**
1. TimeEngine ticks (every game tick)
2. Activity progresses (timer fills)
3. Resident status changes: `available` → `busy`
4. Roster reflects: shows `busy` status on PgCard
5. Activity completes: timer reaches 0
6. Outcome calculated (skill check, rewards)
7. Resident status changes: `busy` → `available`
8. Roster reflects: removes `locked` state, shows `available` status
9. User clicks "Claim rewards" (if applicable)
10. Roster updates: resident stats (HP, fatigue, XP) updated

### 4.3 Roster ↔ TimeEngine

**Real-time updates:**
- TimeEngine emits state changes (HP, fatigue, status)
- Roster receives updates via `residents` prop
- Roster re-renders affected PgCards
- Filters re-evaluate (blocked residents may become available)

**Day/night cycle:**
- TimeEngine sets `isDayPhase` flag
- Roster blocks all interactions at night (`isResidentInteractive` returns false)
- Visual feedback: cards show disabled state

---

## 5. Known Issues & Guard Layers (Cosa può andare storto)

### 5.1 Ghost Click After Drag

**Problem:** After dropping a PgToken, clicking immediately can trigger unintended selection.

**Guard layer:** 200ms timeout suppression
```typescript
dragClickSuppressTimeout.current = window.setTimeout(() => {
  setRecentlyDraggedResidentId((prev) => (prev === residentId ? null : prev));
  dragClickSuppressTimeout.current = null;
}, 200);
```

**Behavior:** 
- During 200ms after drag end, `handleResidentSelectSafe` blocks selection
- Logs: "Blocking select due to drag state"

### 5.2 Virtualization Edge Cases

**Problem:** Large rosters (100+ residents) cause performance issues.

**Solution:** Virtualization (render only visible + overscan)
```typescript
const shouldVirtualize = sortedResidents.length > dragConfig.thresholds.virtualizationThreshold;
const visibleResidents = shouldVirtualize
  ? sortedResidents.slice(virtualConfig.startIndex, virtualConfig.endIndex + 1)
  : sortedResidents;
```

**Threshold:** Configured in `dragConfig.thresholds.virtualizationThreshold`

**Edge cases:**
- Scroll position lost after filter change → Maintained via virtualization state
- Portrait preload lag → Preload visible residents on mount
- Overscan insufficient → Configurable `overscan` prop (default 3)

### 5.3 Filter Conflicts

**Problem:** Multiple filters can hide all residents, causing empty roster.

**Guard layer:** Show count "0/3" to indicate filtered state
```typescript
onCountsChange?.({ filtered: sortedResidents.length, total: residents.length });
```

**Edge cases:**
- All residents filtered → Show empty state message
- Filter + sort conflict → Sort applied after filter
- Hero filter with no heroes → Shows empty list

### 5.4 Locked Residents

**Problem:** Locked residents (assigned to activities) should not be draggable.

**Guard layer:** Check `lockedResidentIds` set
```typescript
const lockedSet = useMemo(() => new Set(lockedResidentIds ?? []), [lockedResidentIds]);
const getEffectiveStatus = useCallback((resident: ResidentState): ResidentState['status'] => {
  if (lockedSet.has(resident.id)) {
    return 'away'; // Treat locked as away (non-interactive)
  }
  return resident.status;
}, [lockedSet]);
```

**Visual feedback:** Shows "Assigned" label instead of status

### 5.5 HP/Fatigue Thresholds

**Problem:** Residents with low HP or high fatigue should be blocked from assignment.

**Guard layer:** Config-based thresholds
```typescript
const { minHpThreshold, maxFatigueThreshold } = dragConfig.thresholds;
if (resident.currentHp < minHpThreshold) return false;
if (resident.fatigue > maxFatigueThreshold) return false;
```

**Visual feedback:** Shows "Recupero necessario" overlay on blocked cards

---

## 6. Sorting & Filtering

### 6.1 Sorting Algorithm

**Priority order:**
1. **Heroes first** (group value 0)
2. **Available residents** (group value 1)
3. **Blocked residents** (group value 2)

**Within each group:**
1. Alphabetical by display name
2. Survival score (descending) for tie-breaking
3. Injury status (non-injured first)
4. Ultimate fallback by ID

```typescript
const groupValue = (resident: ResidentState) => {
  if (resident.isHero) return 0;
  return isResidentBlocked(resident) ? 2 : 1;
};
```

### 6.2 Filtering Options

**Status filters:**
- `all` - Show all residents
- `heroes` - Show only heroes
- `available` - Show only available residents
- `away` - Show only away residents
- `exhausted` - Show only exhausted residents
- `injured` - Show only injured residents
- `dead` - Show only dead residents

**System thresholds (hard filters):**
- `minHpThreshold` - Residents below this HP are filtered out
- `maxFatigueThreshold` - Residents above this fatigue are filtered out

**User-defined filters (UI):**
- `minHp` - User HP slider
- `maxFatigue` - User fatigue slider

**Combined logic:**
```typescript
// Apply system thresholds first (hard filters)
if (resident.currentHp < minHpThreshold) return false;
if (resident.fatigue > maxFatigueThreshold) return false;

// Then apply user-defined filters
if (resident.currentHp < filters.minHp) return false;
if (resident.fatigue > filters.maxFatigue) return false;

// Finally apply status filter
if (filters.status === 'heroes' && !resident.isHero) return false;
if (filters.status !== 'all' && status !== filters.status) return false;
```

---

## 7. Test Cases

### Rendering (8)
- Roster panel renders with header
- Header shows drag handle, title, count, filter dropdown
- Roster renders list of PgCards
- All residents visible (before filtering)
- Empty roster shows empty state
- Horizontal card variant renders correctly
- Vertical card variant renders correctly
- Virtualization enabled/disabled based on threshold

### Sorting (12)
- Sort A-Z alphabetical
- Sort Z-A reverse alphabetical
- Sort by Rarity descending (3→2→1)
- Sort by Status (available first)
- Heroes sort to top
- Blocked residents sort to bottom
- Sort updates instantly on selection
- Sort persists on page refresh
- Multiple sorts don't break each other
- Unsorted returns to default order
- Survival score tie-breaking works
- Injury status tie-breaking works

### Filtering (14)
- Filter "Available" shows only available residents
- Filter "Away" shows only away residents
- Filter "Injured" shows only injured residents
- Filter "Exhausted" shows only exhausted residents
- Filter "Heroes" shows only heroes
- Filter "Dead" shows only dead residents
- Filter "All" shows all residents
- Filter updates instantly on selection
- Filter persists on page refresh
- Multiple filters don't conflict
- Filter + Sort work together
- System HP threshold filters low HP residents
- System fatigue threshold filters high fatigue residents
- User HP slider filters residents below threshold
- User fatigue slider filters residents above threshold

### Interactions (12)
- Click resident triggers callback
- Click while filtering works
- Click while sorting works
- Hover shows tooltip on resident
- Drag resident from roster starts drag
- Drag resident from roster shows CardSocket placeholder
- Drag end restores PgCard
- Click blocked after drag (200ms suppression)
- Click blocked during night phase
- Click blocked for locked residents
- Click blocked for injured residents
- Click blocked for low HP residents

### State (10)
- Roster reflects resident updates live
- New resident appears in list
- Removed resident disappears from list
- Injured resident visual changes instantly
- Hero status triggers flash animation
- Locked resident shows "Assigned" label
- Blocked resident shows "Recupero necessario" overlay
- Count updates correctly (filtered/total)
- Virtualization activates for large rosters
- Virtualization maintains scroll position

### Virtualization (6)
- Virtualization activates when resident count > threshold
- Only visible residents are rendered
- Scroll shows correct residents
- Overscan loads adjacent residents
- Portrait preload works for visible residents
- Performance improves for large rosters (100+)

### Edge Cases (10)
- Empty roster (0 residents)
- Single resident
- Many residents (100+)
- All residents same name (duplicate names)
- All residents same level
- All residents same status
- All residents filtered (empty list)
- Night phase blocks all interactions
- Rapid drag-drop cycles
- Filter changes during drag

---

**Total Test Cases:** 72  
**Estimated Test Duration:** 8-10 minutes

---

## 8. Related Documentation

- [Phase 1: PgToken Specification](./01_pgtoken.md) - Isolated PgToken behavior
- [Phase 3: SlotRack Specification](./03_slotRack.md) - SlotRack container component
- [Phase 4: Drag Interactions](./04_drag_roster_to_slot.md) - Drag-and-drop between Roster and SlotRack
- [Card System Description](../idle_village/card_system_description.md) - Complete card system architecture
- [Vertical Slice Entities](../../context/VERTICAL_SLICE_ENTITIES_FULL.md) - Complete entity inventory

---

## 9. Questions?

- **About filtering:** See §6.2 for filter logic
- **About freezing:** See §3.1 for freezing rules
- **About virtualization:** See §5.2 for virtualization implementation
- **About test strategy:** See `context/RPG_PROJECT_CONTEXT.md` §5
- **About a decision:** See `context/DECISION_LOG.md`

**Still stuck?** Ask in the chat.

---

**Last updated:** 2026-05-21  
**Next review:** After Phase 2 completion
