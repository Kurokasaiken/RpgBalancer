# Phase 4: Drag Interactions (Roster → SlotRack) — Entity Specification

**Phase:** 4 of 6
**Estimated Duration:** 1-2 days
**Entità:** Drag-and-drop system (dnd-kit) + CustomDragOverlay + DragContext + residentDropRules
**Page Route:** `/minimal-drag`
**Test Page Requirement:** MUST use real project components (DragProvider, CustomDragOverlay, DragContext) with mock data
**Last Updated:** 2026-05-21

---

**Aligned with Master Plan:** See [MASTER_PLAN.md](../MASTER_PLAN.md) for separation of concerns (plans vs tasks)
**Aligned with Semantic Constraints:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) for freezing semantics
**Aligned with Roster-Slot Integration:** See [roster_slot_integration_spec.md](../idle_village/roster_slot_integration_spec.md) for complete drag-and-drop integration (trusted)
**Aligned with Drag System Contract:** See [roster_drag_trusted.md](../idle_village/trusted/roster_drag_trusted.md) for drag system architecture
**Aligned with Roster Spec:** See [02_roster_pgtoken.md](./02_roster_pgtoken.md) for Roster component behavior
**Aligned with SlotRack Spec:** See [03_slotRack.md](./03_slotRack.md) for SlotRack component behavior

---

## 1. Entity Overview

### 1.1 What is the Drag-and-Drop System?

**Drag-and-drop system** enables users to drag PgToken from Roster to SlotRack, assigning residents to activities (POI). The system uses:
- **dnd-kit library** for drag-and-drop functionality
- **CustomDragOverlay** for visual feedback during drag
- **DragContext** for state management (cursor offset, preview center, home center)
- **residentDropRules** for validation logic
- **PgCard** as draggable source (with "medaglione"/WanderlustMedalOverlay)
- **ActivitySlot** as drop target

**Architecture:**
```
POI Detail (Activity)
  └─ SlotRack
      └─ ActivitySlot (drop target)

Roster
  └─ PgCard (draggable source)
      └─ WanderlustMedalOverlay ("medaglione")
```

**In the codebase:**
- `CustomDragOverlay.tsx` (394 lines) - Overlay that follows cursor during drag
- `DragContext.tsx` (31 lines) - Context for drag state management
- `residentDropRules.ts` (291 lines) - Validation rules for drop operations
- `MinimalDragPage.tsx` (314 lines) - Test page for drag integration

**Visually rendered as:**
```
Roster                    POI Detail
┌─────────────┐           ┌─────────────┐
│ [PgToken]   │   drag→   │ [Slot]     │
│ [PgToken]   │  ──────→ │ [Slot]     │
│ [PgToken]   │           │ [Slot]     │
└─────────────┘           └─────────────┘
```

### 1.2 Key Components

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| **DndContext** | Library wrapper | @dnd-kit/core | Main drag-and-drop context |
| **CustomDragOverlay** | Visual overlay | components/CustomDragOverlay.tsx | Shows dragged item at cursor |
| **DragContext** | State context | components/DragContext.tsx | Manages drag state (offset, center) |
| **DragProvider** | Context provider | components/DragContext.tsx | Provides drag context to children |
| **residentDropRules** | Validation logic | config/residentDropRules.ts | Validates drop operations |
| **PgCard** | Draggable source | components/PgCard.tsx | Card that initiates drag |
| **WanderlustMedalOverlay** | Medal visual | components/WanderlustMedalOverlay.tsx | "Medaglione" shown during drag |
| **ActivitySlot** | Drop target | components/ActivitySlot.tsx | Slot that receives drops |

### 1.3 Key Properties

| Property | Type | Source | Example |
|----------|------|--------|---------|
| `activeId` | `string \| null` | DragContext | Currently dragged resident ID |
| `dragCursorOffset` | `{x, y} \| null` | DragContext | Cursor offset from pickup point |
| `dragPreviewCenter` | `{x, y} \| null` | DragContext | Current overlay center position |
| `dragHomeCenter` | `{x, y} \| null` | DragContext | Original portrait center (for spring return) |
| `magnetTargetCenter` | `{x, y} \| null` | DragContext | Nearest slot center (for magnetic tilt) |
| `isValid` | `boolean` | residentDropRules | Whether drop is valid |
| `failedRule` | `DropValidationRule` | residentDropRules | Rule that failed validation |
| `message` | `string` | residentDropRules | Human-readable error message |

**Source of truth:** DragContext for state, residentDropRules for validation.

---

## 2. Visual Appearance & Rendering

### 2.1 Drag Flow Visuals

**Before drag:**
```
Roster
┌─────────────┐
│ [PgToken]   │ ← Normal state
│ [Portrait]  │
│ [Stats]     │
└─────────────┘
```

**During drag:**
```
Roster                     Cursor
┌─────────────┐             ┌──────┐
│ [Medaglione]│ ← Placeholder  │ [Medaglione]│ ← Overlay
│ [Empty]     │               │ (Portrait) │
└─────────────┘               └──────┘
```

**Over valid slot:**
```
SlotRack
┌─────────────┐
│ [Slot]      │ ← Green glow, pulse animation
│ (valid)     │
└─────────────┘
```

**Over invalid slot:**
```
SlotRack
┌─────────────┐
│ [Slot]      │ ← Red dashed border, alpha 35%
│ (invalid)   │
└─────────────┘
```

### 2.2 Overlay Visuals

**WanderlustMedalOverlay ("medaglione"):**
- Circular board game token style
- Shows resident portrait
- Amber glow during drag
- Magnetic tilt when near slot (< 150px)
- Spring animation on drop failure

**Overlay states:**
| State | Visual | When |
|-------|--------|------|
| **Dragging** | Medaglione with portrait, amber glow | Drag in progress |
| **Near slot** | Tilted toward slot, scaled up slightly | Cursor within 150px of slot |
| **Spring return** | Bounces back to original position | Drop failed |

---

## 3. Freezing Semantics (Quando sono congelato)

### 3.1 Freezing Rules

| Entity | When Frozen | Duration | Why |
|--------|----------|----------|-----|
| **PgCard** | During drag | Drag duration | Replaced by placeholder (medaglione) |
| **Slot** | During drag over invalid slot | Drag duration | Alpha 35%, non-interactive |
| **Slot** | When occupied | Until extraction | Cannot receive new assignment |
| **Roster** | After drag end | 200ms | Ghost click suppression |
| **DragContext** | Never | N/A | Stateless container |

### 3.2 Freezing Implementation

**During drag:**
- PgCard in Roster replaced by placeholder
- CustomDragOverlay shows medaglione at cursor
- Cursor forced to 'grabbing' globally
- All elements forced to 'grabbing' cursor via CSS injection

**Over invalid slot:**
- Slot shows alpha 35% (opacity)
- Red dashed border
- Cannot accept drop
- If released: spring return to Roster

**After drag end:**
- Ghost click suppression in Roster (200ms)
- Placeholder replaced by PgCard
- Cursor restored to default
- CSS injection removed

---

## 4. Cross-Entity Behavior (Come interagisco con...)

### 4.1 Drag System ↔ PgCard

**Pickup flow:**
1. User presses on PgCard
2. PgCard.handlePointerDown calculates cursor offset from portrait center
3. Offset stored in `window.__dragCursorOffset`
4. Portrait center stored in `window.__dragHomeCenter` (for spring return)
5. DragContext receives dragCursorOffset and dragHomeCenter
6. Drag starts, overlay appears

**Current issue:** snapOverlay modifier may behave incorrectly, causing misalignment.

### 4.2 Drag System ↔ CustomDragOverlay

**Overlay positioning:**
- snapOverlayCenterToCursor modifier aligns overlay center to cursor
- Uses dragCursorOffset from PgCard
- Should center overlay exactly where user clicked
- Overlay renders in portal (dnd-kit DragOverlay)

**Cursor tracking:**
- Global pointer events track cursor position
- dragPreviewCenter updated continuously
- Synthetic dragover events dispatched for Playwright harness

**Magnetic tilt:**
- When cursor within 150px of slot
- Overlay tilts toward slot center
- Scale increases slightly
- Tilt strength based on distance

**Current issue:** Magnetic tilt not "interesting enough" (too subtle).

### 4.3 Drag System ↔ SlotRack

**Drop validation:**
1. Slot receives drag events via dnd-kit
2. residentDropRules validates:
   - Resident availability (status must be 'available')
   - Fatigue threshold (max 90%)
   - Stat requirements (allOf/anyOf/noneOf)
   - Crew capacity (maxSlots)
3. Slot shows drop state:
   - Valid: green glow, pulse animation
   - Invalid: red dashed border, alpha 35%
4. If valid: onSlotDrop callback triggered
5. If invalid: spring return to Roster

**Slot states during drag:**
- Empty slot: shows valid/invalid state
- Occupied slot: shows invalid state (cannot receive new assignment)

### 4.4 Drag System ↔ DragContext

**State management:**
- activeId: currently dragged resident ID
- dragCursorOffset: cursor offset from pickup point
- dragPreviewCenter: current overlay center
- dragHomeCenter: original portrait center (for spring return)
- magnetTargetCenter: nearest slot center (for magnetic tilt)

**State lifecycle:**
1. Drag start: activeId set, offsets calculated
2. Drag move: dragPreviewCenter updated, magnetTargetCenter updated
3. Drag end: all state cleared

---

## 5. Known Issues & Guard Layers (Cosa può andare storto)

### 5.1 Pickup Alignment Issue

**Problem:** snapOverlay modifier behaves incorrectly, causing misalignment.

**Expected behavior:** Overlay center should align exactly where user clicked on portrait.

**Actual behavior:** Overlay may be offset from cursor.

**Root cause:** dragCursorOffset calculation or snapOverlay modifier implementation.

**Guard layer:** Fallback when pickup offset unavailable (assumes click at center).

### 5.2 Spring Return Issue

**Problem:** Spring return returns to left of PgCard component instead of center.

**Expected behavior:** Overlay should spring back to original portrait center.

**Actual behavior:** Overlay returns to top-left corner of PgCard.

**Root cause:** dragHomeCenter may be incorrectly set or used by modifier.

**Note:** Original frozen documentation version worked correctly.

### 5.3 Ghost Click Suppression

**Problem:** Ghost clicks may occur after drag end.

**Guard layer:** 200ms suppression in Roster after drag end.

**Status:** User unsure if this works correctly.

### 5.4 Drop Validation

**Problem:** Incompatible residents may be dropped on slots.

**Guard layer:** residentDropRules validates:
- Resident availability
- Fatigue threshold
- Stat requirements
- Crew capacity

**Status:** Works correctly, shows if slot is occupied or not.

### 5.5 Magnetic Tilt

**Problem:** Magnetic tilt is too subtle, not "interesting enough".

**Current behavior:** Tilt angle reduced by 0.3 factor, scale increase 5%.

**Expected behavior:** More noticeable tilt and scale effects.

**Guard layer:** None (visual enhancement only).

---

## 6. Validation Rules

### 6.1 Drop Validation Rules

| Rule | Description | Config |
|------|-------------|--------|
| **stat_requirement_allOf** | Resident must have all required stats | enableStatValidation |
| **stat_requirement_anyOf** | Resident must have at least one of anyOf stats | enableStatValidation |
| **stat_requirement_noneOf** | Resident must not have any of noneOf stats | enableStatValidation |
| **fatigue_threshold** | Resident fatigue must be below threshold | enableFatigueValidation |
| **crew_capacity** | Activity must not be at full capacity | enableCrewValidation |
| **resident_availability** | Resident status must be 'available' | Always enabled |
| **slot_locked** | Slot must not be occupied | Always enabled |

### 6.2 Validation Configuration

```typescript
interface ResidentDropRulesConfig {
  maxFatigueBeforeExhausted: number;  // Default: 90
  defaultCrewSize: number;            // Default: 1
  enableStatValidation: boolean;       // Default: true
  enableFatigueValidation: boolean;    // Default: true
  enableCrewValidation: boolean;      // Default: true
}
```

### 6.3 Validation Result

```typescript
interface DropValidationResult {
  isValid: boolean;
  failedRule?: DropValidationRule;
  message?: string;
  meta?: {
    missingStats?: string[];
    fatigue?: { current: number; threshold: number };
    crew?: { capacity: number; occupied: number; requested: number };
    resident?: { id: string; status: string };
  };
}
```

---

## 7. Test Cases

### Drag Setup (8)
- DndContext wraps application
- DragProvider provides context
- CustomDragOverlay renders in portal
- PgCard is draggable source
- ActivitySlot is drop target
- WanderlustMedalOverlay shows during drag
- Cursor forced to grabbing during drag
- CSS injection applied during drag

### Drag Flow (12)
- Drag starts on PgCard pointerDown
- dragCursorOffset calculated correctly
- dragHomeCenter calculated correctly
- Overlay appears at cursor position
- Overlay center aligned to cursor
- Placeholder replaces PgCard in Roster
- Overlay shows resident portrait
- Overlay shows amber glow
- Overlay tracks cursor movement
- Synthetic dragover events dispatched
- DragContext state updated during drag
- DragContext state cleared on drag end

### Drop Validation (12)
- Valid resident can be dropped on empty slot
- Valid resident cannot be dropped on occupied slot
- Invalid resident (unavailable) cannot be dropped
- Invalid resident (too exhausted) cannot be dropped
- Invalid resident (missing stats) cannot be dropped
- Invalid resident (full capacity) cannot be dropped
- Slot shows valid state for compatible resident
- Slot shows invalid state for incompatible resident
- Slot shows invalid state for occupied slot
- Slot shows alpha 35% for invalid state
- Slot shows green glow for valid state
- Validation error message displayed

### Spring Return (8)
- Failed drop triggers spring return
- Spring return uses dragHomeCenter
- Overlay returns to original position
- Spring animation has correct duration
- Spring animation has correct easing
- PgCard reappears in Roster after spring
- Placeholder replaced by PgCard
- Ghost click suppression active after spring

**Known issue:** Spring return currently returns to left of PgCard instead of center.

### Magnetic Tilt (8)
- Magnetic tilt activates when cursor near slot (< 150px)
- Tilt angle calculated based on distance
- Tilt angle points toward slot center
- Tilt strength increases as cursor approaches
- Scale increases when cursor near slot
- Tilt deactivates when cursor moves away
- Tilt animation has correct duration
- Tilt animation has correct easing

**Known issue:** Magnetic tilt too subtle, not "interesting enough".

### Cursor Tracking (8)
- Cursor position tracked during drag
- dragPreviewCenter updated continuously
- dragPreviewCenter matches cursor position
- Synthetic dragover events dispatched
- Playwright harness can capture drag coords
- Cursor forced to grabbing globally
- CSS injection applied to all elements
- Cursor restored to default after drag

### Edge Cases (12)
- Rapid drag-drop cycles
- Drag over multiple slots
- Drag outside viewport
- Drag during scroll
- Drag during resize
- Drag with touch events
- Drag with keyboard events
- Drag with multiple pointers
- Drag during animation
- Drag during extraction
- Drag during timer
- Drag during activity state change

---

**Total Test Cases:** 68  
**Estimated Test Duration:** 10-12 minutes

---

## 8. Related Documentation

- [Phase 2: Roster Specification](./02_roster_pgtoken.md) - Roster container component
- [Phase 3: SlotRack Specification](./03_slotRack.md) - SlotRack container component
- [Phase 5: Activity + Timer](./05_activity_timer.md) - Activity timer and POI Detail
- [Card System Description](../idle_village/card_system_description.md) - Complete card system architecture
- [Vertical Slice Entities](../../context/VERTICAL_SLICE_ENTITIES_FULL.md) - Complete entity inventory

---

## 9. Questions?

- **About pickup alignment:** See §5.1 for snapOverlay issue
- **About spring return:** See §5.2 for spring return issue
- **About magnetic tilt:** See §5.5 for magnetic tilt issue
- **About validation:** See §6 for validation rules
- **About test strategy:** See §7 for test cases
- **About a decision:** See `context/DECISION_LOG.md`

**Still stuck?** Ask in the chat.

---

**Last updated:** 2026-05-21  
**Next review:** After Phase 4 completion
