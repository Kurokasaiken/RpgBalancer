# Roster + PgCard + Slot + SlotRack — Integration Spec

> **Purpose**: Complete architectural reference for the drag-and-drop assignment system in the Idle Village "Slot Lab" (`TestRosterPage`). Covers every component in the chain, the exact event flow, the guard system against ghost clicks, and the known regressions. Use this document as the single source of truth when debugging or extending the system.
>
> **Related**: See [Roster Slot POI Integration](../../../docs/plans/roster_slot_poi_integration.md) for complete POI behavior, timer management, and reward system integration with slot assignments.

---

## 1. Component Hierarchy

```
TestRosterPage (orchestrator)
├── DndContext  (@dnd-kit/core)
│   ├── VillageRosterSection            ← thin wrapper
│   │   └── ResidentRosterPanel         ← thin wrapper + DropFeedbackHUD
│   │       └── DragTestContainer       ← filtering, virtualization, PgCard rendering
│   │           └── PgCard              ← single draggable resident card
│   │               └── useDraggable()  ← @dnd-kit hook
│   │
│   ├── RackScenarioPanel (×N scenarios: "open", "restricted")
│   │   └── useResidentSlotController() ← validates + assigns residents to slots
│   │       └── ResidentSlotRack        ← renders slots
│   │           ├── BoardSlot           ← layout variant (board)
│   │           │   └── useDroppable()  ← @dnd-kit hook
│   │           │   └── ActivitySlotCard
│   │           └── DetailSlot          ← layout variant (detail)
│   │               └── useDroppable()  ← @dnd-kit hook
│   │
│   └── CustomDragOverlay               ← visual overlay during drag
│
├── CertifiedWorkerPickerSheet          ← inline picker modal
└── SandboxTimingProvider + DragProvider ← context providers
```

### 1.1 File Map

| Component | File | Lines |
|---|---|---|
| **TestRosterPage** | `src/ui/idleVillage/TestRosterPage.tsx` | ~1924 |
| **VillageRosterSection** | `src/ui/idleVillage/components/VillageRosterSection.tsx` | ~116 |
| **ResidentRosterPanel** | `src/ui/idleVillage/components/ResidentRosterPanel.tsx` | ~143 |
| **DragTestContainer** | `src/ui/idleVillage/components/DragTestContainer.tsx` | ~935 |
| **PgCard** | `src/ui/idleVillage/components/PgCard.tsx` | ~469 |
| **ResidentSlotRack** | `src/ui/idleVillage/components/ResidentSlotRack.tsx` | ~402 |
| **ActivitySlotCard** | `src/ui/idleVillage/components/ActivitySlot.tsx` | ~488 |
| **useResidentSlotController** | `src/ui/idleVillage/slots/useResidentSlotController.ts` | ~403 |
| **Slot types** | `src/ui/idleVillage/slots/types.ts` | ~182 |

---

## 2. Data Flow Overview

### 2.1 Resident Data

```
Character Storage (primary source)
  ↓
bootstrapResidentsFromCharacters() (canonical conversion)
  ↓
TestRosterPage.residents: ResidentState[]
  ↓
VillageRosterSection → ResidentRosterPanel → DragTestContainer
  ↓
DragTestContainer filters/sorts → PgCard[] rendered
```

**Canonical Implementation**: `TestRosterPage.tsx` uses `bootstrapResidentsFromCharacters()` from `CharacterToResidentBootstrap.ts` for all resident data loading. This ensures single source-of-truth Character → Resident conversion with proper fallback handling.

**Legacy References**: `MINIMAL_GAMEPLAY_RESIDENTS` and `loadResidentsFromCharacterManager()` are deprecated. See `src/docs/docs/idle_village/trusted/character_resident_trusted.md` for current architecture.

`ResidentState` includes: `id`, `status`, `currentHp`, `maxHp`, `fatigue`, `isHero`, `isInjured`, `portraitUrl`, `survivalScore`, `statSnapshot`, etc.

### 2.2 Assignment Data

```
TestRosterPage.assignmentsByScenario: Record<RackScenarioKey, Record<slotId, residentId>>
  ↓
RackScenarioPanel receives assignments + onAssign/onClear callbacks
  ↓
useResidentSlotController derives slot view-models from assignments
  ↓
ResidentSlotRack renders BoardSlot/DetailSlot with drop states
```

### 2.3 Scenarios

`RACK_SCENARIOS` (defined in TestRosterPage):
- **`open`**: Accepts any available resident (minStamina 20%)
- **`restricted`**: Requires HP ≥ 200 (minStamina 30%, custom validator)

Each scenario creates a virtual `ActivityDefinition` with slots (format: `slot-lab-{scenarioId}-slot-{index}`).

---

## 3. Assignment Paths

There are exactly **two paths** through which a resident can be assigned to a slot:

### Path A: Drag-and-Drop (handleDragEnd)

```
User drags PgCard → dnd-kit PointerSensor activates
  → DndContext.onDragStart → handleDragStart(event)
      sets activeId = residentId
      unblocks any previous auto-assign block for this resident
  
  → user moves pointer → CustomDragOverlay follows cursor
  
  → DndContext.onDragEnd → handleDragEnd(event)
      sets lastDragEndTimeRef.current = Date.now()
      sets activeId = null
      
      IF event.over === null (dropped outside any slot):
          → ignoreNextSelectRef.current = residentId
          → blockAutoAssignmentForResident(residentId, 'drag_drop_outside', 900ms)
          → triggerResidentReturn(residentId) → returning animation
          → setTimeout(250ms): clear ignoreNextSelectRef if still same resident
          → RETURN (no assignment)
      
      IF event.over !== null (dropped on a slot):
          → parse scenarioId from slotId
          → run scenario.validator(resident) if exists
          → run validateDrop({ resident, activity, context })
          → api.assignResident(residentId, slotId) via scenarioApisRef
          → handleScenarioAssignmentResult() for success/failure
```

### Path B: Click-to-Auto-Assign (handleRosterSelect)

```
User clicks PgCard → PgCard.handleClickInternal
  → guard: if isUnavailable or isReturning → block
  → guard: if didDragRef.current === true → block (post-drag synthetic click)
      (resets didDragRef to false)
  → calls onSelect(workerId)
  
  → DragTestContainer.handleResidentSelectSafe
      → guard: if draggingResidentId === residentId → block
      → guard: if recentlyDraggedResidentId === residentId → block
      → guard: if resident.status === 'away' → block
      → calls onResidentSelect(residentId) (prop from parent)
  
  → TestRosterPage.handleRosterSelect(residentId)
      → guard 1: if ignoreNextSelectRef.current === residentId → block + clear ref
      → guard 2: if timeSinceDragEnd < 160ms → block (ghost click cooldown)
      → guard 3: if blockedAutoAssignReasonRef has entry for residentId → block
      → guard 4: if activeId === residentId → block (still dragging)
      → find first empty slot in "open" scenario → assignResident()
      → if no open slots, try "restricted" scenario → assignResident()
      → handleScenarioAssignmentResult() for success/failure
```

### Path C: Inline Picker (CertifiedWorkerPickerSheet)

```
User opens picker via slot click → handlePickerAssign(residentId)
  → api.assignResident(residentId, slotId)
  → handleScenarioAssignmentResult()
```

---

## 4. Guard System Against Ghost Clicks

The "ghost click" bug: After a drag-and-drop that ends outside a slot, the browser may fire a synthetic `click` event on the PgCard. If unguarded, this triggers `handleRosterSelect` and auto-assigns the resident to the first empty slot.

### 4.1 Guard Layers (bottom-up)

| # | Layer | Location | Mechanism | Scope |
|---|---|---|---|---|
| G1 | **PgCard.didDragRef** | `PgCard.tsx:180-194` | `didDragRef.current` set `true` when `dndIsDragging` goes truthy (useEffect L116-120) or when pointer moves > 4px from start (onPointerMove L310-317). `handleClickInternal` blocks click if `didDragRef` is true, then resets it. | Blocks browser's synthetic click after any drag gesture |
| G2 | **DragTestContainer.recentlyDraggedResidentId** | `DragTestContainer.tsx:176,373-380` | Set to `residentId` on `_handleDragEnd`, cleared after 200ms timeout. `handleResidentSelectSafe` blocks if `recentlyDraggedResidentId === residentId`. | Blocks clicks for 200ms after drag end (container-level) |
| G3 | **TestRosterPage.ignoreNextSelectRef** | `TestRosterPage.tsx:1177,1225-1233,1483-1493` | Set to `residentId` in `handleDragEnd` when `over === null`. Cleared in `handleRosterSelect` on first match, or after 250ms timeout. | One-shot sentinel: blocks the very next select for the dropped-outside resident |
| G4 | **TestRosterPage.timeSinceDragEnd cooldown** | `TestRosterPage.tsx:1235-1245` | `lastDragEndTimeRef.current` set in `handleDragEnd`. Any select within 160ms is blocked. | Time-based cooldown after any drag end |
| G5 | **TestRosterPage.blockedAutoAssignReasonRef** | `TestRosterPage.tsx:1176,1191-1212,1247-1256` | Map of `residentId → reason`. Set in `handleDragEnd` when `over === null` with 900ms TTL. `handleRosterSelect` blocks if entry exists. | Duration-based block for a specific resident after failed drop |
| G6 | **TestRosterPage.activeId check** | `TestRosterPage.tsx:1258-1267` | If `activeId === residentId`, the resident is still being dragged. Block select. | Prevents select during active drag |

### 4.2 Guard Timeline for "Drop Outside" Scenario

```
T=0ms     handleDragEnd fires
          → activeId = null (G6 disarmed)
          → lastDragEndTimeRef = T (G4 armed for 160ms)
          → ignoreNextSelectRef = residentId (G3 armed)
          → blockedAutoAssignReasonRef.set(residentId) (G5 armed for 900ms)
          → returning animation starts

T=0-5ms   Browser may fire synthetic click on PgCard
          → G1 (didDragRef) blocks it in PgCard
          → Even if G1 fails:
            → G2 (recentlyDraggedResidentId) blocks in DragTestContainer
            → Even if G2 fails:
              → G3 (ignoreNextSelectRef) blocks in handleRosterSelect
              → Even if G3 already consumed:
                → G4 (timeSinceDragEnd < 160ms) blocks
                → Even if G4 fails:
                  → G5 (blockedAutoAssignReasonRef) blocks for 900ms

T=160ms   G4 expires
T=200ms   G2 expires (recentlyDraggedResidentId cleared)
T=250ms   G3 timeout: ignoreNextSelectRef cleared if still same resident
T=900ms   G5 expires (blockedAutoAssignReasonRef entry removed)
```

---

## 5. Component Details

### 5.1 PgCard (`PgCard.tsx`)

**Purpose**: Draggable resident card. Renders portrait/initials, HP bar, stamina bar, status badge, compatibility indicator.

**Key Props**:
- `workerId: string` — unique resident ID
- `onSelect?: (workerId: string) => void` — called on legitimate click
- `dragFeedbackState?: 'idle' | 'valid' | 'invalid' | 'returning'` — visual state
- `disabled, isInteractive` — interactivity flags

**Drag Setup**:
- Uses `useDraggable({ id: workerId, disabled: ... })` from `@dnd-kit/core`
- `disabled` when: `disabled || !isInteractive || dragFeedbackState === 'returning'`

**Click Prevention Logic** (L180-197):
```typescript
const handleClickInternal = useCallback((event) => {
  if (isUnavailable || isReturning) { event.preventDefault(); return; }
  if (didDragRef.current) {
    didDragRef.current = false;
    event.preventDefault(); event.stopPropagation(); return;
  }
  onSelect?.(workerId);
}, [...]);
```

**Pointer Events** (L290-327):
- `onPointerDown`: resets `didDragRef = false`, captures drag start position
- `onPointerMove`: sets `didDragRef = true` if pointer moved > 4px
- `onPointerUp`: forwards to parent handler
- Also calls `listeners?.onPointerDown?.(e)` for dnd-kit

**Known Issue**: There is a `console.log('🔍 [PgCard] Listeners:', listeners)` at L123 that runs on every render. This is debug noise that should be removed.

### 5.2 DragTestContainer (`DragTestContainer.tsx`)

**Purpose**: Renders the filtered, sortable, virtualizable list of PgCards.

**Key Features**:
- **Filtering**: by status (all/heroes/injured/available/exhausted/away/dead) + config-based HP/fatigue thresholds
- **Sorting**: heroes first, then unblocked, then blocked; within groups by survival score
- **Virtualization**: activates for rosters > threshold (from `dragConfig.thresholds.virtualizationThreshold`)
- **Window dragging**: GripVertical handle for repositioning the entire roster panel

**Click Guard** (`handleResidentSelectSafe`, L449-470):
```typescript
if (draggingResidentId === residentId || recentlyDraggedResidentId === residentId) return;
if (resident?.status === 'away') return;
onResidentSelect?.(residentId);
```

**recentlyDraggedResidentId** (L176, 373-380): Set on `_handleDragEnd`, cleared after 200ms. Acts as a secondary guard against post-drag clicks at the container level.

**Note**: `_handleDragStart` and `_handleDragEnd` (prefixed with underscore) are internal DragTestContainer handlers. In the current TestRosterPage integration, drag start/end are handled by the **DndContext** at the TestRosterPage level, not by DragTestContainer's internal handlers. The `onDragStart`/`onDragEnd` props passed down from TestRosterPage are used for the VillageRosterSection-level callbacks (L1832-1833), which set `activeId` but do NOT call `_handleDragStart`/`_handleDragEnd` on DragTestContainer.

**Important**: This means `recentlyDraggedResidentId` inside DragTestContainer may NOT be set correctly during a DndContext-managed drag, because `_handleDragEnd` is not called. This is a **potential gap** in guard G2.

### 5.3 VillageRosterSection / ResidentRosterPanel

Pure pass-through wrappers. No logic of their own.

**Prop chain**:
```
TestRosterPage
  → VillageRosterSection (accepts dragInterruptionFlag but TestRosterPage no longer passes it)
    → ResidentRosterPanel (accepts dragInterruptionFlag, passes to DragTestContainer)
      → DragTestContainer (accepts dragInterruptionFlag in props but DOES NOT USE IT in code)
```

**Note**: `dragInterruptionFlag` prop exists in type definitions for all three wrappers but is currently:
- Not passed by TestRosterPage (removed in previous bug fix)
- Not consumed/read by DragTestContainer's runtime code
- Effectively dead code in the prop chain

### 5.4 ResidentSlotRack (`ResidentSlotRack.tsx`)

**Purpose**: Renders a horizontal list of ActivitySlot cards with optional scroll arrows and overflow indicators.

**Layout modes**: `board` (via `BoardSlot`) and `detail` (via `DetailSlot`)

**BoardSlot** (L118-173):
- Uses `useDroppable({ id: slot.id, data: { type: 'slot', slotId: slot.id } })`
- Renders `ActivitySlotCard` with all slot visual states
- Shows "Clear" button if slot has assigned resident

**DetailSlot** (L187-263):
- Uses `useDroppable({ id: slot.id, data: { type: 'slot', slotId: slot.id } })`
- Renders circular slot with avatar/initials
- Click toggles: if assigned → clear, if empty → onSlotClick

**Native drop handlers** in ActivitySlotCard (ActivitySlot.tsx) are **disabled** — they log and `preventDefault()` to force all drops through dnd-kit's `handleDragEnd` with centralized validation.

### 5.5 useResidentSlotController (`useResidentSlotController.ts`)

**Purpose**: Core assignment logic. Derives slot view-models from activity + assignments, validates assignment attempts.

**`assignResidentToSlot(residentId, slotId)`** (L265-310):
1. Reject if no `slotId`
2. Find `targetSlot` in `slotViewModels`
3. Run `customValidator(residentId, slotId)` if provided — can reject
4. Run `validateResidentAssignment({ residentId, activity, scheduler, residents, slotRequirement, maxFatigueBeforeExhausted })`
5. If valid → call `onAssign(slotId, residentId)`, return `{ success: true, slotId }`
6. If invalid → return `{ success: false, reason, details, slotId }`

**Result type** (`ResidentSlotAssignResult`):
```typescript
| { success: true; slotId: string }
| { success: false; reason: AssignmentFailureReason; details?: string; slotId?: string }
```

### 5.6 ActivitySlotCard (`ActivitySlot.tsx`)

**Purpose**: Visual representation of a single activity slot with progress ring, glow effects, timer.

**Key behavior**:
- Uses `useDroppable({ id: slotId, disabled: isLockedByPhase || !canAcceptDrop })`
- Native `handleNativeDrop` is disabled (L182-186): logs and prevents default
- Config-driven glow via `getSlotGlowConfig()`
- Audio cues via `useAudioCueConfig()`
- Haptic feedback via `useHaptic()`

---

## 6. What Currently Works

1. **Drag-and-drop to valid slot**: Resident can be dragged from roster and dropped on a valid BoardSlot/DetailSlot. The DndContext `handleDragEnd` parses the scenario from `slotId`, runs validation, and calls `assignResidentToSlot`. Assignment is reflected in the slot rack.

2. **Drop validation**: Custom scenario validators and `useResidentDropValidation` correctly reject invalid drops (e.g., HP < 200 for restricted scenario). Failed drops trigger returning animation.

3. **Drop outside protection**: When dropping outside any slot, `handleDragEnd` sets guard refs and triggers returning animation. The multi-layer guard system (G1-G6) prevents auto-assignment.

4. **Slot rack rendering**: `ResidentSlotRack` renders slots with correct drop states, bloom effects, and scroll indicators. Both `board` and `detail` layouts work.

5. **Telemetry**: Comprehensive telemetry events for drag start, drag end, drop outside, assignment success/failure, roster select blocked/allowed.

6. **Roster filtering/sorting**: Status filters, HP/fatigue thresholds, hero priority sorting, and virtualization for large rosters.

7. **Returning animation**: Residents that fail drop validation or are dropped outside show a returning state (`dragFeedbackState: 'returning'`) with visual feedback.

8. **Custom drag overlay**: `CustomDragOverlay` renders a circular portrait preview following the cursor during drag.

---

## 7. What Is Currently Broken / Regressed

### BUG-1: Click-to-Auto-Assign May Be Blocked After Any Drag

**Symptom**: After dragging any resident and dropping (even on a valid slot), clicking a *different* resident to auto-assign may fail if done within 160ms of the drag end.

**Root Cause**: Guard G4 (`timeSinceDragEnd < 160ms`) is **global** — it blocks select for ALL residents, not just the one that was dragged. If the user quickly clicks another resident after completing a drag, the click is blocked.

**Severity**: Low (timing window is small, 160ms)

**Fix**: Make G4 resident-specific or reduce the cooldown.

### BUG-2: Guard G2 (recentlyDraggedResidentId) May Not Activate

**Symptom**: The `recentlyDraggedResidentId` guard in `DragTestContainer.handleResidentSelectSafe` may not fire because `_handleDragEnd` (which sets it) is not called during DndContext-managed drags.

**Root Cause**: In `TestRosterPage`, drags are managed by `DndContext.onDragEnd` → `handleDragEnd` (TestRosterPage). The `onDragEnd` prop passed to `VillageRosterSection` is `() => setActiveId(null)` — it does NOT call DragTestContainer's `_handleDragEnd`. Therefore `recentlyDraggedResidentId` is never set during normal drags.

**Severity**: Medium — Guard G2 is effectively non-functional. Other guards (G1, G3-G6) provide coverage, but this creates a gap if those fail.

**Fix**: Either:
- Have TestRosterPage's `handleDragEnd` also propagate to DragTestContainer's `_handleDragEnd`, or
- Remove reliance on G2 and document that G1 + G3-G6 are the active guards.

### BUG-3: `dragInterruptionFlag` Is Dead Code

**Symptom**: The `dragInterruptionFlag` prop exists in `VillageRosterSectionProps`, `ResidentRosterPanelProps`, and `DragTestContainerProps` but is never passed by `TestRosterPage` (removed in previous fix) and never consumed by `DragTestContainer`.

**Severity**: Low (cosmetic / maintenance burden)

**Fix**: Remove `dragInterruptionFlag` from all prop interfaces and component signatures.

### BUG-4: Console Debug Logs in Production

**Symptom**: Multiple `console.log('🔍 ...')` statements in `PgCard.tsx`, `DragTestContainer.tsx`, and `ResidentSlotRack.tsx` output debug information on every render/interaction.

**Locations**:
- `PgCard.tsx:123` — logs listeners on every render
- `PgCard.tsx:181,189,195` — logs click handling
- `DragTestContainer.tsx:451,454,456,466` — logs select handling
- `ResidentSlotRack.tsx:155` — logs slot drop

**Severity**: Low (performance noise, not user-facing)

**Fix**: Remove or gate behind `process.env.NODE_ENV === 'development'`.

### BUG-5: Font Regression in PgCard (Reported, Not Yet Diagnosed)

**Symptom**: User reported that the font inside PgCard resident cards changed unexpectedly.

**Possible Causes**:
- Style Lab token changes affecting `--minimal-font-family`
- Tailwind class changes in PgCard's `baseTokenClasses` (L213-214)
- Parent component CSS overriding PgCard's inherited font
- The `useMinimalStyleLabTokens` hook returning different token values

**Severity**: Medium (visual regression)

**Investigation Needed**: Compare current `baseTokenClasses` and computed CSS against the expected Gilded Observatory / Style Lab typography tokens.

### BUG-6: `activeId` in handleRosterSelect Dependency Array

**Symptom**: `handleRosterSelect` references `activeId` in its body (L1260) but does NOT include it in its `useCallback` dependency array (L1329). This means the guard `if (activeId === residentId)` may use a stale closure value.

**Root Cause**: Missing dependency in `useCallback`.

**Severity**: Medium — Guard G6 may not work correctly because it reads a stale `activeId`.

**Fix**: Add `activeId` to the dependency array of `handleRosterSelect`.

---

## 8. Event Sequence Diagrams

### 8.1 Successful Drag-to-Slot

```
PgCard.onPointerDown
  → didDragRef = false
  → dragStartPosRef set
  → dnd-kit listeners.onPointerDown (activates PointerSensor)

[pointer moves > activationConstraint.distance (3px)]
  → dnd-kit starts drag
  → DndContext.onDragStart → handleDragStart
    → activeId = residentId
    → unblockAutoAssignment(residentId)
  → PgCard: dndIsDragging = true → useEffect sets didDragRef = true
  → CustomDragOverlay appears

[pointer moves over BoardSlot]
  → useDroppable.isOver = true
  → slot highlights with valid/invalid state

[pointer up over BoardSlot]
  → DndContext.onDragEnd → handleDragEnd
    → lastDragEndTimeRef = now
    → activeId = null
    → over !== null → parse scenarioId
    → validate → assignResidentToSlot()
    → handleScenarioAssignmentResult()

[browser may fire click on PgCard]
  → PgCard.handleClickInternal: didDragRef = true → BLOCKED
```

### 8.2 Drag-and-Drop Outside (The Bug Scenario)

```
PgCard.onPointerDown → dnd-kit drag starts
  → activeId = residentId

[pointer released outside any slot]
  → DndContext.onDragEnd → handleDragEnd
    → lastDragEndTimeRef = now
    → activeId = null
    → over === null →
      → ignoreNextSelectRef = residentId (G3)
      → blockAutoAssignmentForResident(900ms) (G5)
      → triggerResidentReturn() → returning animation

[browser fires synthetic click on PgCard]
  → PgCard.handleClickInternal:
    → didDragRef = true → BLOCKED (G1) ✓
    → (if G1 fails):
      → DragTestContainer.handleResidentSelectSafe:
        → recentlyDraggedResidentId check (G2, may not fire — see BUG-2)
      → TestRosterPage.handleRosterSelect:
        → ignoreNextSelectRef === residentId → BLOCKED (G3) ✓
        → timeSinceDragEnd < 160ms → BLOCKED (G4) ✓
        → blockedAutoAssignReasonRef.has(residentId) → BLOCKED (G5) ✓
```

### 8.3 Normal Click (Auto-Assign)

```
PgCard.onPointerDown
  → didDragRef = false
  → dragStartPosRef set

[NO significant pointer movement, pointer up quickly]
  → dnd-kit does NOT start drag (below activation distance)
  → didDragRef remains false

PgCard.onClick → handleClickInternal
  → isUnavailable? NO
  → isReturning? NO
  → didDragRef.current? false → ALLOWED
  → onSelect(workerId) called

DragTestContainer.handleResidentSelectSafe
  → draggingResidentId? null → OK
  → recentlyDraggedResidentId? null → OK
  → status !== 'away' → OK
  → onResidentSelect(residentId) called

TestRosterPage.handleRosterSelect
  → ignoreNextSelectRef.current? null → OK
  → timeSinceDragEnd > 160ms? YES (no recent drag) → OK
  → blockedAutoAssignReasonRef? empty → OK
  → activeId === residentId? NO (activeId is null) → OK
  → find first empty slot in 'open' scenario → assign
  → handleScenarioAssignmentResult('open', result, residentId)
```

---

## 9. Configuration Dependencies

| Config Source | Used By | Purpose |
|---|---|---|
| `dragConfig.thresholds.minHpThreshold` | DragTestContainer | Min HP to show in roster |
| `dragConfig.thresholds.maxFatigueThreshold` | DragTestContainer | Max fatigue to show in roster |
| `dragConfig.thresholds.virtualizationThreshold` | DragTestContainer | When to enable virtual scrolling |
| `RACK_SCENARIOS[].statRequirement` | TestRosterPage | Per-scenario slot requirements |
| `RACK_SCENARIOS[].validator` | TestRosterPage | Per-scenario custom validation |
| `RACK_SCENARIOS[].minStaminaBeforeExhausted` | RackScenarioPanel | Stamina threshold for exhaustion |
| `getSlotGlowConfig()` | ActivitySlotCard | Visual glow per drop state |
| `useMinimalStyleLabTokens()` | PgCard, ActivitySlotCard | Style Lab CSS tokens |
| `DEFAULT_MINIMAL_CONFIG.ui` | PgCard | UI token defaults |

---

## 10. Sensor Configuration

```typescript
// TestRosterPage.tsx L548-560
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 3 },  // 3px minimum movement to start drag
  }),
  useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },  // 200ms hold + 5px tolerance
  }),
);
```

The 3px activation distance for `PointerSensor` means:
- Clicks with < 3px movement → handled as click (no drag)
- Clicks with ≥ 3px movement → handled as drag start

This should reliably distinguish click from drag. The `PgCard.onPointerMove` threshold (4px for `didDragRef`) is slightly higher, which means there's a 1px window (3-4px) where dnd-kit starts a drag but `didDragRef` hasn't been set yet. This is safe because `dndIsDragging` going true triggers the `useEffect` at L116-120 that also sets `didDragRef = true`.

---

## 11. Returning Animation Flow

```
triggerResidentReturn(residentId, metadata)
  → setReturningResidentIds(prev => new Set([...prev, residentId]))
  → trackTelemetryEvent('slot_lab_resident_returning', ...)
  → setTimeout(1200ms):
    → setReturningResidentIds(prev => { next.delete(residentId); return next; })

While returning:
  → PgCard receives dragFeedbackState = 'returning'
    → useDraggable disabled (L107)
    → isReturning = true → pointer-events-none, opacity-60, grayscale, bounce-spring animation
    → handleClickInternal blocks interaction (L183)
```

---

## 12. Summary of Action Items for Fix

1. **Remove debug console.logs** from PgCard (L123, 181, 189, 195, 291, 301), DragTestContainer (L451, 454, 456, 466), ResidentSlotRack (L155).

2. **Fix `handleRosterSelect` dependency array** — add `activeId` to ensure guard G6 uses fresh value.

3. **Evaluate guard G2**: Either wire `_handleDragEnd` into the DndContext flow or remove `recentlyDraggedResidentId` guard as dead code.

4. **Clean up `dragInterruptionFlag`** dead prop from VillageRosterSection, ResidentRosterPanel, DragTestContainer.

5. **Investigate font regression** by comparing PgCard's computed `font-family` against Style Lab token expectations.

6. **Consider making G4 resident-specific** to avoid blocking unrelated clicks within the cooldown window.

7. **Verify the complete click-to-auto-assign flow** with a Playwright/Puppeteer test that:
   - Clicks a resident without dragging → expects assignment to first empty slot
   - Drags a resident outside → releases → immediately clicks same resident → expects NO assignment
   - Drags a resident outside → waits 1s → clicks same resident → expects assignment
