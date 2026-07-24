# Materic Roster Vertical Slice — Implementation Plan

**Status:** Planning  
**Type:** UI / Skin Vertical Slice  
**Scope:** `src/ui/idleVillage` roster + `src/ui/wanderlust-surface` Materic skin  
**Depends On:** `idle_village_plan.md` Phase 12, `village_sandbox_refactor_plan.md`, `world_surface_v3_strategic_plan.md`  
**Owner:** Strategist → Idle Village UI Agent  
**Last Updated:** 2026-07-23

---

## 1. Objective

Deliver a **complete, playable roster surface** wrapped in the *Pulsazione Materica* (rough stone/bronze) skin. The existing `MatericRosterComponent` is a thin provider wrapper around `RosterDraggable`; this plan turns it into a **AAA-quality vertical slice** with full drag-and-drop UX, slot compatibility, persistence, telemetry, and visual regression coverage.

### Success Criteria

- A new route/page renders the Materic roster in isolation (`/materic-roster` or `/minimal-roster-materic`).
- All roster cards, stat bars, and the roster container respect `MATERIC_SKIN_CONFIG` tokens.
- Drag-and-drop interactions provide distinct Materic feedback (glow, grain shift, spring-back, magnetic flight).
- Sorting and filtering are functional and telemetered.
- Slot compatibility hints are visible before and during drag.
- Unit + RTL + visual regression tests pass; evidence logs are produced.
- No new `localStorage` usage — only `PersistenceService`.

---

## 2. Problem / Gap Analysis

| Gap | Current State | Target State |
|-----|---------------|--------------|
| **Wrapper-only component** | `MatericRosterComponent` only wraps `RosterDraggable` with `MatericSkinProvider`. | Component owns layout, chrome, empty/fatigued states, and a documented public API. |
| **Incomplete skin adoption** | Only `WanderlustStatBar` reads `useMatericSkin`. | `VillageRosterSection`, `WanderlustRosterCard`, `PgCard`, and `CustomDragOverlay` react to `isMateric`. |
| **Generic drag feedback** | Spring-back and flight are skin-agnostic. | Stone/bronze visual cues (etched border, ember pulse, grit displacement) during drag. |
| **Missing compatibility hints** | `getResidentCompatibility` returns `undefined` in `RosterDraggable`. | Per-card/overlay compatibility badges driven by `useResidentDropValidation` and resident rules. |
| **No dedicated route** | `MatericRosterComponent` is not mounted on any page. | Isolation route exists for manual QA and visual regression. |
| **Missing telemetry** | No events for sort, filter, skin toggle, drag attempts. | `trackTelemetryEvent` emits `materic_roster_sort`, `materic_roster_filter`, `materic_roster_drag_start/end`, `materic_roster_flight_complete`. |

---

## 3. Research Insights (AAA References)

Fonti analizzate in fase di ricerca:

- **Baldur's Gate 3 / Larian UX redesign** — party selection and quest-companion hints emphasize *contextual roster suggestions*. Takeaway: the roster should surface *why* a resident fits a slot, not only *whether*.
- **Wayfinder character management** — expanding rosters demand horizontal strip + selected-detail pattern. Takeaway: Materic roster must scale beyond 6 residents without overflow.
- **Gears 5 / Overwatch 2 hero select** — medallion grid with clear selected/hover/pending states. Takeaway: use strong silhouette + stateful frame; color is confirmation, not the message.
- **Indie Brawler wireframes** — grid + side panel keeps browsing fast and casual-friendly. Takeaway: reserve a detail/summary side panel for the hovered/selected resident.

### Design Principles for the Slice

1. **Materiality first** — depth, grain, and inset shadows make the UI feel carved, not layered.
2. **Readability at a glance** — valenza/magnitude lives in the world (cards); precision lives in hover/detail.
3. **Scalable strip** — roster must work from 3 to 12+ residents without re-layout.
4. **Input parity** — mouse drag, touch hold, and controller/keyboard selection must all produce the same visual feedback.

---

## 4. Scope

### In Scope

- `MatericRosterComponent` owns container chrome, empty state, and error fallback.
- Materic skin tokens applied to `VillageRosterSection`, `WanderlustRosterCard`, `PgCard`, `CustomDragOverlay`, and `DragOutcomeFlight`.
- New isolation route (`/materic-roster`) wired in the router.
- Sort (name, class, fatigue, compatibility) and filter (combat, worker, injured) controls.
- Slot compatibility preview (per-card badge + overlay hint).
- Telemetry events and evidence logs.

### Out of Scope (for this slice)

- Full inventory/equipment panel (only compact stats).
- Audio/SFX implementation (placeholder hooks only).
- Online multiplayer / lobby sync.
- Save-game migration from non-canonical sources.

---

## 5. Architecture

```text
MatericRosterComponent
├── MatericSkinProvider
├── RosterKitShell (SkinSystemProvider → SandboxTimingProvider → DragProvider → DndContext)
│   ├── MatericRosterHeader  (title, sort, filter, count)
│   ├── MatericRosterGrid    (responsive strip/grid)
│   │   └── WanderlustRosterCard (Materic variant)
│   │       ├── WanderlustPortrait
│   │       ├── WanderlustStatBar (hp / stamina / fatigue)
│   │       └── CompatibilityBadge
│   ├── MatericDragOverlay   (drag preview with Materic border/glow)
│   ├── DragOutcomeFlight    (magnetic drop flight, skinned)
│   └── MatericRosterDetail  (hover/selected resident summary)
```

### State & Data Flow

- **Roster data**: `useRosterKitData` (canonical bundle) — already shared with `TestRosterPage`.
- **Sort/filter**: local React state, persisted via `PersistenceService` under key `materic_roster_prefs`.
- **Skin flag**: `MatericSkinProvider` React Context (presentation-only, no persistence needed).
- **Drag outcome**: `useDragOutcome` state machine (idle → dragging → flight/returning → idle).
- **Telemetry**: `trackTelemetryEvent` with namespaced `materic_roster_*` events.

---

## 6. Config-First Tokens

All new visual values are read from existing or extended config modules; no hardcoded values in components.

| Config Module | Responsibility |
|---------------|----------------|
| `src/ui/wanderlust-surface/matericSkinConfig.ts` | Stat-bar track/fill, grain overlay, highlight, border radius, shadows. |
| `src/ui/idleVillage/config/rosterSortConfig.ts` | Sort modes and labels (i18n keys). |
| `src/ui/idleVillage/config/rosterFilterConfig.ts` *(new)* | Filter categories, default active filters, icons. |
| `src/ui/idleVillage/config/matericRosterTelemetryConfig.ts` *(new)* | Event names, payload schemas, sampled vs always-on. |
| `src/balancing/config/idleVillage/residentDropRules.ts` | Slot compatibility rules (reuse, do not duplicate). |

---

## 7. Task Breakdown

| ID | Task | Owner | Est. | Evidence Log |
|----|------|-------|------|--------------|
| MR-001 | Finalize design spec & tokens | Strategist | 2h | `test-results/MR-001-design-spec.log` |
| MR-002 | Extend `MATERIC_SKIN_CONFIG` with roster chrome tokens | UI Agent | 3h | `test-results/MR-002-skin-tokens.log` |
| MR-003 | Create `MatericRosterHeader` (sort/filter/i18n) | UI Agent | 4h | `test-results/MR-003-header.log` |
| MR-004 | Create `MatericRosterGrid` and responsive layout | UI Agent | 4h | `test-results/MR-004-grid.log` |
| MR-005 | Skinned `WanderlustRosterCard` Materic variant | UI Agent | 6h | `test-results/MR-005-card.log` |
| MR-006 | Skinned `CustomDragOverlay` and `DragOutcomeFlight` | UI Agent | 5h | `test-results/MR-006-drag.log` |
| MR-007 | Slot compatibility preview (badge + overlay hint) | UI Agent | 4h | `test-results/MR-007-compat.log` |
| MR-008 | Telemetry hooks (`useMatericRosterTelemetry`) | UI Agent | 3h | `test-results/MR-008-telemetry.log` |
| MR-009 | Persistence of sort/filter prefs via `PersistenceService` | UI Agent | 2h | `test-results/MR-009-persistence.log` |
| MR-010 | Isolation route `/materic-roster` + navigation link | UI Agent | 2h | `test-results/MR-010-route.log` |
| MR-011 | Unit + RTL + visual regression tests | UI Agent | 6h | `test-results/MR-011-tests.log` |
| MR-012 | Final review, Kanban update, documentation | Coordinator | 2h | `test-results/MR-012-closeout.log` |

**Total estimated effort:** ~43h (≈ 1 dev-week).

---

## 8. Phase Details

### Phase 1 — Spec & Tokens (MR-001 / MR-002)

- Lock the visual recipe: stone track, sap HP, golden-sand stamina, rust fatigue, etched bronze borders.
- Add `roster*` tokens to `MATERIC_SKIN_CONFIG`:
  - `card.background`, `card.border`, `card.borderHover`, `card.shadow`, `card.grainOpacity`
  - `drag.overlayBorder`, `drag.glow`, `drag.grainShift`
  - `emptyState.*`
- Validate with Zod schema; fail closed on missing keys.

### Phase 2 — Roster Chrome & Layout (MR-003 / MR-004 / MR-010)

- Build `MatericRosterHeader` using existing atoms (`src/ui/atoms` / `src/ui/fantasy/atoms`).
- `MatericRosterGrid`: CSS Grid → horizontal strip on desktop, vertical stack on mobile.
- Add route and link in the dev/test navigation.

### Phase 3 — Card & Drag Skin (MR-005 / MR-006)

- `WanderlustRosterCard` reads `useMatericSkin` and swaps to sharp-cornered, grain-textured card.
- `CustomDragOverlay` uses Materic border glow while dragging.
- `DragOutcomeFlight` adds a brief "ember spark" trail when landing in a slot.

### Phase 4 — Compatibility & Feedback (MR-007)

- Reuse `useResidentDropValidation` and `residentSlotRules` to compute per-card compatibility.
- Render badge on card (✓ / ⚠ / ✗) and overlay hint on drag hover.
- Integrate existing `DropFeedbackUI` for blocked/invalid drops.

### Phase 5 — Telemetry & Persistence (MR-008 / MR-009)

- `useMatericRosterTelemetry` wraps `trackTelemetryEvent`.
- Persist sort/filter via `PersistenceService` (`saveData`/`loadData`).
- No `localStorage` direct access.

### Phase 6 — Testing & Closeout (MR-011 / MR-012)

- RTL tests: render grid, change sort, filter, drag start/end, flight complete.
- Visual regression: snapshot `/materic-roster` with 3, 6, and 12 residents.
- Run safeguards and update `agent_assignments.md` / `strategy_tasks.md`.

---

## 9. Safeguards & Evidence

Before marking the slice complete, the assigned agent must run and pass:

```bash
npm run lint -- src/ui/idleVillage src/ui/wanderlust-surface
npm run test -- src/ui/idleVillage
npm run build:check
npm run kanban:lint
```

All failures must be fixed and logged to `test-results/MR-011-tests-YYYY-MM-DD.log`.

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `VillageRosterSection` is frozen/certified; skin changes could break contract. | High | Extend via props (`isMateric`, `skinVariant`), do not mutate default behavior. Run `rosterKit.cert.json` contract checks. |
| Grain/texture assets not ready. | Medium | Use CSS-generated noise + tokenized `backgroundImage` fallbacks; swap URL when assets arrive. |
| Mobile drag-and-drop conflicts with touch scroll. | Medium | Keep `TouchSensor` delay/tolerance; add a dedicated drag handle if needed. |
| Compatibility preview overloads the drop validation hook. | Medium | Memoize per-card compatibility; debounce drag hover events. |

---

## 11. Open Questions

1. Should `/materic-roster` be exposed in production navigation or kept as a dev/test page?
2. Is the target roster size cap 8, 12, or 16? (affects grid breakpoints)
3. Do we need a dedicated `MatericRosterCard` primitive, or should `WanderlustRosterCard` own the variant?
4. Which audio events (if any) should be wired for drag/start/drop?

---

## 12. Related Plans & Docs

- `src/docs/docs/plans/idle_village_plan.md`
- `src/docs/docs/plans/village_sandbox_refactor_plan.md`
- `src/docs/docs/plans/world_surface_v3_strategic_plan.md`
- `src/docs/docs/idle_village/roster_trusted_components.md`
- `src/ui/idleVillage/frozen/kits/rosterKit.md`
