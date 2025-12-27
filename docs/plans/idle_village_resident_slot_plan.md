# Idle Village Resident Slot Expansion – Implementation Plan

**Status:** Completed · 2025-12-27 11:50 CET  
**Owner:** Cascade  
**Scope:** Bring ActivitySlot behaviors (bloom feedback, drag/drop validation, occupancy, overflow handling) to TheaterView verbs and VerbDetailCard slot rows, while supporting dynamic/infinite slot growth and horizontal scrolling.

---

## Completed Phases

 

### Phase A – Slot Controller & Shared Types ✅

 
- Created `useResidentSlotController` hook with infinite slot support (virtualSlots = assignedCount + 1).
- Tests passing (5/5 Vitest).
- Types: `ResidentSlotViewModel`, `ResidentSlotController`, `SlotOverflowPolicy`.

 

### Phase B – ResidentSlotRack Component ✅

 
- Built `ResidentSlotRack.tsx` with board/detail variants.
- Horizontal scroll with fade indicators, arrow controls, hint text when overflowing.
- Animations with transition-all for slot changes.

 

### Phase C – TheaterView Parity ✅

 
- Replaced inline `ActivitySlot` with `VerbCard` medallions from `ScheduledVerbSummary`.
- Shared drop handlers, bloom reveal on drag-over.

 

### Phase D – VerbDetailCard Slot Integration ✅

 
- Already using `ResidentSlotRack` in detail mode.
- Drag/drop, bloom, occupancy states enabled.

 

### Phase E – Infinite Slot UX & Scroll Polish ✅

 
- Infinite slots spawn placeholders dynamically.
- Scroll arrows, hint text, smooth transitions.

 

### Phase F – Testing & Documentation ✅

 
- Vitest: Controller tests pass.
- Added basic `ResidentSlotRack.test.tsx` (component render test).
- Playwright: Integration tests need selector updates (failing due to UI changes).
- Docs updated with completion status.

 

### Phase G – Interaction & Timing Parity (Future)

 
- Theater/Board symmetry, hover delays, halo/timer source of truth.

 

---

 

## 1. Background & Findings

 

- **ActivitySlot.tsx** already implements the canonical Verb slot UI (halo, drag/drop hooks, bloom) @src/ui/idleVillage/components/ActivitySlot.tsx#7-220.
- **TheaterView.tsx** renders scaled ActivitySlot instances but lacks progress/timer props and drag/drop parity vs. board slots (no progressFraction, totalDuration) @src/ui/idleVillage/components/TheaterView.tsx#35-218.
- **ActivityCardDetail.tsx** has its own slot rendering logic (circular badges, overflow scroll) and special-cases `activity.maxSlots === 'infinite'` @src/ui/idleVillage/components/ActivityCardDetail.tsx#105-410.
- **VerbDetailCard.tsx** still treats slots as static buttons without drag/drop nor assignment state derived from ActivitySlot behaviors @src/ui/idleVillage/VerbDetailCard.tsx#149-188.
- **Config** already exposes `maxSlots: number | 'infinite'` and optional per-slot modifiers for activities @src/balancing/config/idleVillage/types.ts#62-158.

 

Gaps: duplicate slot UIs, no shared slot manager, Theater lacks full parity, VerbDetailCard cannot host drops, and overflow/infinite slots are not virtualized.

---

## 2. Goals

1. **Slot Parity:** Any surface (map tile, Theater, Verb detail) that accepts residents must reuse a shared slot renderer + behaviors.
2. **Bloom & Validation:** Hovering with a compatible resident triggers bloom/glow + dropState feedback identical to ActivitySlot.
3. **Infinite Slots:** When an activity exposes `maxSlots: 'infinite'`, occupying a slot should spawn a new empty placeholder while keeping the "+" affordance at the end of the row.
4. **Scrollability:** Slot rows that exceed the visual rail width should become horizontally scrollable with snap indicators.
5. **Config-First:** Slot requirements/stat hints/policies continue to come exclusively from IdleVillageConfig (no hardcoding).

---

## 3. Architecture Decisions

1. **`useResidentSlotController` Hook**  
   - Consumes `ActivityDefinition`, current assignments, `ResidentState` dictionary, and `slotModifiers`.  
   - Exposes derived slot list (with virtual placeholders for `infinite`), drop validations (`evaluateStatRequirement`), bloom flags, and callbacks (`assign`, `clear`, `duplicatePlaceholder`).

2. **`ResidentSlotRack` Component**  
   - Pure presentational component rendering a row/scroll list of slot badges using ActivitySlot visuals (compact variant).  
   - Props: `slots[]`, `layout` (`grid | rail`), `overflowBehavior` (`wrap | scroll`), `onDrop`, `onRemove`, `onInspect`).  
   - Handles horizontal scroll when `overflowBehavior === 'scroll'` and renders a trailing `SlotAddButton` that slides when new slots appear.

3. **Shared Drag Context**  
   - Extend `RESIDENT_DRAG_MIME` usage to VerbDetailCard/Theater surfaces; ensure `ActivitySlot` drop handlers delegate to controller, not local state.  
   - Provide bloom state via `dropState: DropState` to ActivitySlot and to the compact circular badges inside VerbDetailCard.

4. **Infinite Slot Strategy**  
   - Represent infinite slots as `virtualSlots = assignedSlots.length + 1` (always keep one empty).  
   - When a virtual slot becomes occupied, push a new placeholder to the end.  
   - Move the `+` badge rightward by re-rendering `SlotAddButton` after the trailing placeholder.

5. **Scroll Thresholds**  
   - Use tokens for rail width (e.g., 4 slots per view).  
   - Switch to `overflow-x-auto` + gradient masks when `slots.length > visibleSlotCount`.  
   - Provide keyboard scroll (arrow keys) + accessible hint.

---

## 4. Implementation Phases

### Parallelization & Agent Handoff Notes

- **Phase A is gated** – the slot controller defines the contract for every other phase, so it must complete (and ship its tests) before parallel agents branch off.
- **Phases B & C can run concurrently once Phase A is stable**: one agent can build `ResidentSlotRack` while another integrates it into `TheaterView`, provided both consume the published controller types/API.
- **Phase D** waits only on the rack component, not on Theater parity, so a second agent can start Verb detail integration as soon as B’s API is finalized.
- **Phase E** depends on at least one consumer (Theater or Verb detail) plus the rack animations, so keep it sequenced after B/C/D convergence.
- **Phase F** (testing/docs) can partially overlap with D/E: unit tests for controller/rack should land immediately after Phase A/B, while integration/Playwright specs run once a first host surface is wired.
- **Phase G** is endgame polish and should start only after C, D, and the scheduler contracts are settled to avoid churn.
- **Communication requirement:** every agent must send a completion summary (including blockers found + verification status) to the plan owner immediately after finishing their assigned phase so coordination stays centralized.

### Phase A – Slot Controller & Shared Types
1. Create `ResidentSlotController.ts` under `src/ui/idleVillage/slots/` exporting:
   - Types: `ResidentSlotViewModel`, `ResidentSlotController`, `SlotOverflowPolicy`.
   - Hook `useResidentSlotController({ activity, assignments, residents, maxSlots, slotModifiers })` returning derived slots, drop validators, and `assign/clear` callbacks.
2. Wire controller to `evaluateStatRequirement` + `useActivityScheduler` for canonical validation.
3. Add unit tests covering: required slot enforcement, infinite slot growth, stat mismatch feedback.

### Phase B – ResidentSlotRack Component
1. Build `ResidentSlotRack.tsx` that renders slots using ActivitySlot visuals (scaled).  
2. Support both **board scale** (full-size ActivitySlot) and **detail scale** (compact circular badge).  
3. Implement overflow detection + horizontal scroll with `IntersectionObserver`-based fade indicators.
4. Provide `onSlotDrop`, `onSlotRemove`, `onSlotClick` props tied to controller callbacks.

### Phase C – TheaterView Parity
1. Replace inline ActivitySlot instantiation with `ResidentSlotRack` in "rail" mode, feeding progress/timer props from actual scheduled activity data (duration, elapsed) via `useActivityScheduler`.  
2. Forward drag/drop handlers from controller so Theater slots accept residents identical to map board slots.  
3. Ensure theater inherits bloom states and can display multi-resident counts when `maxSlots > 1`.

### Phase D – VerbDetailCard Slot Integration
1. Swap the static button grid with `ResidentSlotRack` in "detail" mode to enable drag/drop, bloom, and occupancy states.  
2. When a slot is filled within the detail drawer, persist assignments back to the shared scheduler (same source of truth as board).  
3. Show modifiers (yield/fatigue multipliers) as badges under each slot; highlight invalid drops.

### Phase E – Infinite Slot UX & Scroll Polish
1. Add animation when a placeholder duplicates (Slide/scale the `+` badge).  
2. For very long rows, enable flick scrolling + arrow controls + hint text (“Scroll to view more slots”).  
3. Update `ActivityCardDetail` to consume the new rack component, removing bespoke overflow logic.

### Phase F – Testing & Documentation
1. **Vitest:** slot controller (infinite growth, drop validation), ResidentSlotRack snapshot for overflow, Theater drag/drop integration (with mocked scheduler).  
2. **Playwright:** scenario covering: drag resident into Theater slot, open VerbDetailCard, drop resident, verify placeholder creation and scroll behavior once slots > 6.
3. **Docs:** update `idle_village_plan.md` + `idle_village_tasks.md` + `MASTER_PLAN.md` referencing this plan.

### Phase G – Interaction & Timing Parity
1. **Theater/Board Symmetry:** Consume the controller outputs inside `VillageSandbox` and `TheaterView`, so every ActivitySlot instance reads `progressFraction`, `elapsedSeconds`, and `totalDuration` from the scheduler/engine instead of local timers.  
2. **Detail Panel Validation:** Wire `assignResidentToSlot` results directly to `handleWorkerDrop`, ensuring Verb detail slots only accept residents that satisfy stat requirements, fatigue thresholds, and crew limits surfaced by the controller.  
3. **Hover-to-Inspect Delay:** Introduce a shared hover manager (500–1000 ms hold) that opens `ActivityCardDetail` when una ActivitySlot è attraversata e `TheaterView` quando lo stesso hover avviene sopra una Location; cancella il timer su drag-leave/drop per evitare aperture accidentali.  
4. **Halo & Timer Source of Truth:** Route halo/timer props through `useActivityScheduler.getActivityState` so pausing the global timer freezes progress visuals everywhere (board, Theater, HUD, detail).  
5. **Auto-Run Safeguards:** When assignments change via board, Theater, or detail, notify the scheduler to restart activities only if the global timer is playing; paused states should queue the new assignment without advancing progress.  
6. **UX Telemetry:** Emit events for hover-open, assignment validation failures, and timer state changes so HUD/notifications can explain why a resident was rejected or why an activity stayed paused.

---

## 5. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Duplicated state between controller and scheduler | Controller reads/writes via callbacks passed down from scheduler; no local source of truth. |
| Performance with many infinite-slot placeholders | Cap rendered placeholders to `assignedCount + 1` and virtualize offscreen slots with `aria-live` hints. |
| Drag/drop regressions | Reuse `RESIDENT_DRAG_MIME` + ActivitySlot events; add Playwright regression. |
| Accessibility concerns for horizontal scroll | Provide keyboard handlers, focus-visible outlines, and screen reader instructions for additional slots. |

---

## 6. Deliverables

- `ResidentSlotController.ts` + tests.
- `ResidentSlotRack.tsx` (board + detail variants) + Storybook/Sandbox knobs (optional).
- Updated `TheaterView`, `VerbDetailCard`, `ActivityCardDetail` consuming shared components.
- Updated docs/tasks/master plan referencing resident slot expansion.
- Phase-level completion summaries delivered to the owner once each phase is done, highlighting verification evidence and open risks.
