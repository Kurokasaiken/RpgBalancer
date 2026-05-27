# Phase 3: SlotRack — Entity Specification

**Phase:** 3 of 6
**Estimated Duration:** 1-2 days
**Entità:** ResidentSlotRack (container) + ActivitySlot (slot receiver)
**Page Route:** `/minimal-slotRack`
**Test Page Requirement:** MUST use real project components (ResidentSlotRack, ActivitySlot) with mock data
**Last Updated:** 2026-05-21

---

**Aligned with Master Plan:** See [MASTER_PLAN.md](../MASTER_PLAN.md) for separation of concerns (plans vs tasks)
**Aligned with Plans Index:** See [IMPLEMENTATION_PLANS_INDEX.md](../IMPLEMENTATION_PLANS_INDEX.md) for plan navigation
**Aligned with Semantic Constraints:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) for freezing semantics
**Aligned with Roster Spec:** See [02_roster_pgtoken.md](./02_roster_pgtoken.md) for Roster component behavior
**Aligned with Roster-Slot Integration:** See [roster_slot_integration_spec.md](../idle_village/roster_slot_integration_spec.md) for complete drag-and-drop integration

---

## 1. Entity Overview

### 1.1 What is ResidentSlotRack?

**ResidentSlotRack** is the container component that displays activity slots where PgTokens are assigned. It provides:
- **Slot rendering** in board layout (rectangular slots)
- **Drop target** for drag-and-drop from Roster
- **Extraction mechanism** (press-and-hold to remove assigned resident)
- **Overflow handling** with scroll navigation
- **Activity state tracking** (assigned, away, failed, completing)

**In the codebase:**
- `ResidentSlotRack.tsx` (822 lines) - Main container with BoardSlot and DetailSlot variants

**Visually rendered as:**
```
┌─────────────────────────────────────────────────┐
│ [Slot] [Slot] [Slot]  ← Scrollable container    │
│  [+]   [PG]   [PG]     ← Empty / Occupied      │
└─────────────────────────────────────────────────┘
```

### 1.2 Key Components

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| **ResidentSlotRack** | Container | `components/ResidentSlotRack.tsx` | Main container with overflow handling |
| **BoardSlot** | Slot variant | Inline in SlotRack | Rectangular slot for board layout |
| **DetailSlot** | Slot variant | Inline in SlotRack | Compact circular slot for detail layout |
| **ActivitySlot** | Slot receiver | `components/ActivitySlot.tsx` | Individual slot logic |
| **SlottedMedal** | Medal overlay | `components/SlottedMedal.tsx` | Medal shown on assigned resident (slot0 only) |

### 1.3 Key Properties

| Property | Type | Source | Example |
|----------|------|--------|---------|
| `slots` | `ResidentSlotViewModel[]` | Activity controller | Array of slot data |
| `layout` | `'board' \| 'detail'` | prop | Layout variant (board = rectangular) |
| `overflowBehavior` | `'wrap' \| 'scroll'` | prop | Always 'scroll' with navigation buttons |
| `onSlotDrop` | `(slotId, residentId) => void` | Callback | Triggered when PgToken is dropped |
| `onSlotClear` | `(slotId) => void` | Callback | Triggered when resident is extracted |
| `onSlotClick` | `(slotId) => void` | Callback | Triggered when slot is clicked |
| `draggingResidentId` | `string \| null` | prop | Currently dragged resident ID |
| `getSlotProgress` | `(slotId) => SlotProgressData` | POI Detail | Progress data for timer (not in SlotRack) |
| `getSlotActivityState` | `(slotId) => SlotActivityState` | POI Detail | Activity state (failed, completing, etc.) |

**Source of truth:** `ResidentSlotViewModel` from activity controller.

---

## 2. Visual Appearance & Rendering

### 2.1 Layout Variants

**Board layout** (rectangular, default):
```
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Portrait │ │ Portrait │ │    +     │
│ Name     │ │ Name     │ │  Empty   │
│ HP/Fat   │ │ HP/Fat   │ │  Slot    │
└──────────┘ └──────────┘ └──────────┘
```

**Detail layout** (compact circular):
```
┌────┐ ┌────┐ ┌────┐
│ PG │ │ PG │ │ +  │
└────┘ └────┘ └────┘
```

### 2.2 Slot States

| State | Visual | When |
|-------|--------|------|
| **Empty** | Dashed border, "+" placeholder | No resident assigned |
| **Assigned** | Solid border, resident portrait, SlottedMedal overlay | Resident assigned, timer not started |
| **Away** | Dimmed, non-interactive | Timer running, resident cannot be extracted |
| **Valid drop target** | Green glow, pulse animation | Dragging compatible resident over slot |
| **Invalid drop target** | Red dashed border, opacity 35% | Dragging incompatible resident over slot |
| **Extracting** | Progress animation, bezel opening | Press-and-hold extraction in progress |
| **Failed** | Red glow, medal shake animation | Activity failed (medal only) |
| **Completing** | Green glow, medal completion animation | Activity completing (medal only) |

### 2.3 Overflow Handling

**Scroll behavior** (always enabled):
- Horizontal scroll with navigation buttons (left/right arrows)
- Fade indicators on left/right edges when content overflows
- Smooth scroll animation (200px per click)
- Scroll mask gradient on edges

**Navigation buttons:**
- Left arrow: scrolls left by 200px
- Right arrow: scrolls right by 200px
- Only visible when hovering over the rack
- Disabled when at scroll boundaries

---

## 3. Freezing Semantics (Quando sono congelato)

### 3.1 Freezing Rules

| Entity | When Frozen | Duration | Why |
|--------|----------|----------|-----|
| **Slot** | During drag over | Drag duration | Drop target active, but cannot receive other actions |
| **Slot** | When assigned (timer not started) | Until timer starts | Can be extracted via press-and-hold |
| **Slot** | When away (timer running) | Until timer completes | Cannot be extracted, non-interactive |
| **Slot** | When extracting | 560ms (extraction duration) | Extraction animation in progress |
| **SlotRack** | Never | N/A | Stateless container |

### 3.2 Freezing Implementation

**During drag over:**
- Slot shows drop state (valid/invalid) based on compatibility
- Slot is not interactive for other actions during drag
- Visual feedback: green glow (valid) or red border (invalid)

**When assigned (timer not started):**
- Slot shows resident portrait with SlottedMedal overlay (if slot0)
- Slot is interactive: press-and-hold to extract
- Click on slot does nothing (extraction handled by press-and-hold)

**When away (timer running):**
- Slot shows dimmed resident portrait
- Slot is non-interactive: cannot be extracted
- Drop target disabled: cannot receive new assignments

**During extraction:**
- Press-and-hold triggers extraction animation (560ms)
- Bezel opens with linear progress
- If released before 560ms: animation cancels, bezel closes
- If held for 560ms: extraction completes, spring animation triggers, resident removed

---

## 4. Cross-Entity Behavior (Come interagisco con...)

### 4.1 SlotRack ↔ PgToken

**Assignment flow:**
1. User drags PgToken from Roster
2. SlotRack receives drop event via dnd-kit
3. Slot validates assignment (compatibility check)
4. If valid: slot shows assigned state, calls `onSlotDrop`
5. POI Detail receives assignment, starts timer
6. Roster updates: marks resident as locked

**Extraction flow:**
1. User presses and holds on assigned slot
2. Extraction animation starts (560ms linear progress)
3. If released early: animation cancels, slot remains assigned
4. If held to completion: spring animation triggers, resident removed
5. SlotRack calls `onSlotClear`
6. POI Detail updates: removes assignment
7. Roster updates: removes locked state

### 4.2 SlotRack ↔ Roster

**Assignment:**
- SlotRack calls `onSlotDrop` with slotId and residentId
- Roster receives update: marks resident as locked
- Roster shows "Assigned" label on PgCard
- Roster filters: locked residents appear as "away" status

**Extraction:**
- SlotRack calls `onSlotClear` with slotId
- Roster receives update: removes locked state
- Roster shows "Available" status on PgCard
- Roster filters: resident appears as available again

### 4.3 SlotRack ↔ POI Detail

**Progress tracking:**
- POI Detail manages timer (not SlotRack)
- POI Detail provides `getSlotProgress` callback
- SlotRack receives progress data: ratio, elapsedSeconds, totalSeconds
- POI Detail renders progress bar (not in SlotRack)

**Activity state:**
- POI Detail manages activity state (not SlotRack)
- POI Detail provides `getSlotActivityState` callback
- SlotRack receives activity state: failed, completing, etc.
- SlotRack triggers medal animations based on state

### 4.4 SlotRack ↔ SlottedMedal

**Medal display:**
- SlottedMedal shown only on slot0 (first slot)
- Medal appears when resident is assigned
- Medal overlays resident portrait
- Medal shows: clank sound on drop, detach sound on extraction

**Medal animations:**
- Failed state: medal shake animation
- Completing state: medal completion animation
- Extraction: medal fades out during bezel animation

---

## 5. Known Issues & Guard Layers (Cosa può andare storto)

### 5.1 Drop Validation

**Problem:** Incompatible residents can be dropped on slots.

**Guard layer:** Drop state validation
- Slot checks compatibility via `dropState` prop
- Valid: green glow, pulse animation, allows drop
- Invalid: red dashed border, opacity 35%, blocks drop
- Empty: dashed border, allows drop

**Edge cases:**
- Slot already occupied: cannot receive new assignment
- Resident locked in another slot: cannot be assigned
- Resident incompatible with slot requirements: invalid drop

### 5.2 Extraction Cancellation

**Problem:** User may release press-and-hold before completion.

**Guard layer:** Extraction cancellation animation
- If released before 560ms: bezel closes with easing animation
- Linear progress reverses with cubic easing
- Slot returns to assigned state
- No extraction callback triggered

### 5.3 Overflow Navigation

**Problem:** Many slots may overflow container.

**Guard layer:** Scroll indicators
- Left fade indicator when scroll position > 0
- Right fade indicator when scroll position < max
- Navigation buttons appear on hover
- Buttons disabled at scroll boundaries

**Edge cases:**
- Scroll position lost after slot assignment → Maintained
- Rapid scroll clicks → Smooth scroll animation queues

### 5.4 Activity State Failed

**Problem:** Activity may fail during execution.

**Guard layer:** Failed state animation
- Medal triggers shake animation
- Red glow on slot
- Slot becomes non-interactive
- Telemetry event tracked

### 5.5 SlottedMedal vs PgToken

**Problem:** SlottedMedal and PgToken are visually different components.

**Current behavior:**
- SlottedMedal is a circular board game token overlay
- PgToken is the rectangular card visual from Roster
- In slot: PgToken portrait shown with SlottedMedal overlay on top
- They are not visually coincident (different shapes/sizes)

**Note:** This may be intentional or may need alignment in future.

---

## 6. Extraction Mechanism

### 6.1 Press-and-Hold Extraction

**Duration:** 560ms (matches bezel transition time)

**Animation sequence:**
1. User presses on assigned slot
2. Bezel starts opening with linear progress (0 → 1)
3. If released before 560ms: bezel closes with cubic easing
4. If held to 560ms: extraction completes
5. Bezel flares (progress overshoots to 1.2)
6. Spring animation triggers (600ms duration)
7. Resident removed from slot
8. Slot returns to empty state

**Visual feedback:**
- Extraction progress shown on bezel
- Slot glows amber during extraction
- Cursor changes to grabbing
- Medal fades out during extraction

### 6.2 Extraction Timing

| Phase | Duration | Description |
|-------|----------|-------------|
| Press-and-hold | 560ms | Bezel opening animation |
| Post-open hold | 140ms | Wait after bezel opens |
| Spring duration | 600ms | Spring animation for PG return |
| Cleanup delay | 200ms | Final cleanup after spring |

**Total extraction time:** ~1.5s

---

## 7. Test Cases

### Rendering (8)
- SlotRack renders with container
- Board layout renders rectangular slots
- Detail layout renders circular slots
- Empty slot shows placeholder
- Occupied slot shows resident portrait
- SlottedMedal shown on slot0 only
- Overflow indicators shown when content overflows
- Navigation buttons shown on hover

### Slot States (10)
- Empty slot default style
- Assigned slot different style
- Away slot dimmed style
- Valid drop target green glow
- Invalid drop target red border
- Extracting slot progress animation
- Failed slot red glow
- Completing slot green glow
- Selected slot ring outline
- Highlighted slot amber glow

### Drop Validation (8)
- Valid resident can be dropped
- Invalid resident cannot be dropped
- Occupied slot cannot receive new assignment
- Empty slot can receive assignment
- Compatibility check works
- Drop state updates during drag
- Drop callback triggered on valid drop
- Drop callback not triggered on invalid drop

### Extraction (12)
- Press-and-hold starts extraction
- Extraction progress shows linear animation
- Release before 560ms cancels extraction
- Hold to 560ms completes extraction
- Spring animation triggers after extraction
- Extraction callback triggered on completion
- Extraction callback not triggered on cancellation
- Bezel animation matches timing
- Medal fades out during extraction
- Slot returns to empty state after extraction
- Cursor changes to grabbing during extraction
- Slot glows amber during extraction

### Overflow (8)
- Scroll activates when content overflows
- Left fade indicator shows when scroll position > 0
- Right fade indicator shows when scroll position < max
- Left button scrolls left by 200px
- Right button scrolls right by 200px
- Navigation buttons appear on hover
- Navigation buttons disabled at boundaries
- Scroll position maintained after slot changes

### Interactions (10)
- Click empty slot triggers callback
- Click assigned slot does nothing (extraction handled by press-and-hold)
- Hover shows tooltip on occupied slot
- Tooltip shows resident stats
- Drag over slot shows drop state
- Drag over compatible slot shows valid state
- Drag over incompatible slot shows invalid state
- Drag over occupied slot shows invalid state
- Slot selected state persists
- Slot highlighted state persists

### Activity State (6)
- Failed state triggers medal shake
- Completing state triggers medal completion
- Failed state shows red glow
- Completing state shows green glow
- Failed state telemetry tracked
- Completing state telemetry tracked

### Edge Cases (10)
- All slots occupied
- All slots empty
- Single slot
- Many slots (10+)
- Rapid drag-drop cycles
- Rapid extraction cycles
- Extraction during drag
- Assignment during extraction
- Scroll during extraction
- Resize during scroll

---

**Total Test Cases:** 72  
**Estimated Test Duration:** 10-12 minutes

---

## 8. Skin Testing

### Skin Variants to Test

**SlotRack skins:**
- Default skin (Gilded Observatory)
- Wilderness skin (if available)
- Empire skin (if available)

**Test cases for each skin:**
- Border colors match skin tokens
- Background colors match skin tokens
- Shadow colors match skin tokens
- Text colors match skin tokens
- Glow effects match skin tokens
- Navigation button colors match skin tokens

**Test approach:**
- Render SlotRack with each skin variant
- Visual inspection of all colors and effects
- Verify CSS variables are applied correctly
- Test interactions with each skin

---

## 9. Related Documentation

- [Phase 2: Roster Specification](./02_roster_pgtoken.md) - Roster container component
- [Phase 4: Drag Interactions](./04_drag_roster_to_slot.md) - Drag-and-drop between Roster and SlotRack
- [Phase 5: Activity + Timer](./05_activity_timer.md) - Activity timer and POI Detail
- [Card System Description](../idle_village/card_system_description.md) - Complete card system architecture
- [Vertical Slice Entities](../../context/VERTICAL_SLICE_ENTITIES_FULL.md) - Complete entity inventory

---

## 10. Questions?

- **About extraction:** See §6 for extraction mechanism details
- **About freezing:** See §3.1 for freezing rules
- **About activity states:** See §4.3 for POI Detail interaction
- **About test strategy:** See §7 for test cases and §8 for skin testing
- **About a decision:** See `context/DECISION_LOG.md`

**Still stuck?** Ask in the chat.

---

**Last updated:** 2026-05-21  
**Next review:** After Phase 3 completion
