# PgCard / PgToken Trusted Contract

**Status:** trusted
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15
**Component:** `PgCard` (`src/ui/idleVillage/components/PgCard.tsx`)
**Related:** `CustomDragOverlay` (`src/ui/idleVillage/components/CustomDragOverlay.tsx`), `useDragOutcome` (`src/ui/idleVillage/interaction/useDragOutcome.ts`)

## Goal

`PgCard` is the draggable, interactive representation of a village resident. It is used inside the roster, as the source of drag-and-drop assignments, and as the visual identity of a resident assigned to a slot. This contract defines its rendering, its drag/freeze semantics, and the interaction invariants every surface must respect.

## Data Flow

```text
ResidentState
   │
   │ workerId, label, hp, fatigue, maxHp, portraitUrl, status, compatibilityState
   ▼
PgCardProps
   │
   │ layout (horizontal/vertical), frameType, dragFeedbackState
   ▼
PgCard (useDraggable from @dnd-kit/core)
   │
   ├─ idle → renders portrait + stat bars + status/compatibility ring
   ├─ dragging → CustomDragOverlay shows WanderlustMedalOverlay at cursor
   ├─ returning → card is semi-transparent + non-interactive, bounces back
   ▼
CustomDragOverlay / FlightProxy
```

## Visual Contract

### Portrait
- Portrait URL comes from `getResidentPortraitUrl(resident)`.
- Fallback: if `portraitUrl` is missing, the component shows the first letter of `label`.
- The portrait lives inside a `PgCard` frame (see `pgCardFrameConfig` for `frameType` tokens).

### Frame / Rarity Ring
- `frameType` (`heroic`, `minimal`, `wilderness`, `empire`, etc.) is resolved by `getPgCardFrameTokens` / `getPgCardFrameStyle`.
- Border radius, corner decorations, accent color are all token-driven (`pgCardFrameConfig`).
- Rarity ring is part of the frame; it is not a separate CSS file.

### Status and Compatibility
- `statusLabel` (e.g. `Available`, `Away`, `Unavailable`) is passed or derived.
- `compatibilityState`: `idle` (no drag), `valid` (the dragged token matches a hovered slot), `invalid` (no matching slot).
- When `compatibilityState='valid'`, the card gets a green met ring/shadow.
- When `compatibilityState='invalid'`, the card gets a muted ring and `aria-disabled`.

## Freezing Rules (When PgCard Cannot Be Interacted With)

Freezing is a generic concept that applies to `PgCard` in several contexts.

### F1 — Frozen During Drag

- **Condition:** the user has pressed the pointer on the card and a drag is in progress (`dndIsDragging === true`).
- **Effect:**
  - Clicks and `onSelect` are ignored.
  - The original card stays visible but is semi-transparent and non-interactive.
  - `CustomDragOverlay` renders a circular `WanderlustMedalOverlay` at the cursor.
- **Source of truth:** `useDraggable` state in `PgCard`; `dragVisualState.mode === 'dragging'` in consumers.

### F2 — Frozen After Failed Drop

- **Condition:** the user released the drag outside any valid slot (`springBack(residentId)` called).
- **Effect:**
  - `PgCard` gets `dragFeedbackState='returning'`.
  - It is non-interactive (`aria-disabled`, click ignored) and shows the bounce-spring animation.
  - After `SPRING_BACK_MS` (600ms) `useDragOutcome` automatically resets to `idle`.
- **Rationale:** prevent synthetic click / auto-assign while the token is animating back.

### F3 — Frozen While Resident Is Away / Busy

- **Condition:** resident status is `away` (assigned to an activity) or the card is marked `disabled` / `isInteractive=false`.
- **Effect:** `PgCard` does not respond to drag or click.
- **Source of truth:** `ResidentState.status` and the `disabled` prop derived from `isInteractive`.

## Drag State Machine

```text
idle ──(pointerDown)──► dragging
 dragging ──(valid drop)──► flight ──(onFlightComplete)──► idle
 dragging ──(invalid drop)──► returning ──(600ms)──► idle
 idle ──(resident away)──► disabled (until status changes)
```

## Interactions

### Click
- `Enter` or `Space` with `onSelect` while not `isUnavailable`/`isReturning`.
- Click is ignored when `isUnavailable || isReturning`.

### Drag Start
- `handlePointerDown` stores the cursor offset relative to the card and the portrait center in `window.__dragCursorOffset` and `window.__dragHomeCenter`.
- `useDraggable` from `@dnd-kit/core` owns the drag.

### Drag Overlay
- `CustomDragOverlay` renders `WanderlustMedalOverlay` (circular portrait) by default.
- `snapOverlayCenterToCursor` modifier keeps the overlay center at the pointer position using the captured cursor offset.
- Magnetic tilt (±8°) is applied when the cursor is within 150px of a drop target (`magnetTargetCenter`).

### Failed Drop / Spring Back
- `centerReturnDropAnimation` animates the overlay from the release cursor position back to the original PgCard portrait center.
- Duration: 250ms.
- The original card shows `animate-bounce-spring` for 600ms and then resets.

### Flight Into Slot
- `useDragOutcome.startFlight` is called on a valid `flightToSlot` verdict.
- `FlightProxy` takes over and animates the token into the slot.
- `CustomDragOverlay` hides its clone immediately to avoid a double token.

## Invariants

- A `PgCard` can be dragged only when `!disabled`, `isInteractive`, and `dragFeedbackState !== 'returning'`.
- The drag overlay is purely visual; it never changes `ResidentState`.
- `useDragOutcome` is the single source of truth for drag/flyback visual state.
- `CustomDragOverlay` must not overwrite `window.__dragHomeCenter`; that value is authoritative for spring-back.
- `PgCard` is non-interactive for the whole `returning` animation.

## Test Commands

```bash
# Playwright E2E for PgCard roster + drag preview
npx playwright test tests/e2e/idleVillage/testRosterPgCards.spec.ts
npx playwright test tests/e2e/idleVillage/testRosterPgCardSkin.spec.ts
npx playwright test tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts

# Build check
npm run build:check
```

## Evidence

- `test-results/poi-quest-detail-roster-time-clock-err-028-030-2026-08-15.md`

## References

- Kit doc: [`pgcardKit.md`](../../ui/idleVillage/frozen/kits/pgcardKit.md)
- Roster trusted: [`roster_drag_trusted.md`](./roster_drag_trusted.md)
- Interaction core: [`../interaction_core_spec.md`](../interaction_core_spec.md)
- Frame config: `src/ui/idleVillage/config/pgCardFrameConfig.ts`
- Drag config: `src/ui/idleVillage/config/dragConfig.ts`
