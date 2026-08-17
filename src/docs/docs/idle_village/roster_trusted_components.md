# Idle Village Roster – Canonical Snapshot (2026-03-03)

- **Component entrypoint**: `src/ui/idleVillage/roster/index.ts`
  - Re-exports `VillageRosterSection` (primary surface) and `ResidentRosterPanel`.

- **Implementation files** (do NOT fork/duplicate):
  - `src/ui/idleVillage/components/VillageRosterSection.tsx`
  - `src/ui/idleVillage/components/ResidentRosterPanel.tsx`
  - `src/ui/idleVillage/components/DragTestContainer.tsx`
  - `src/ui/idleVillage/components/WorkerCard.tsx`
  - `src/ui/idleVillage/components/PgCard.tsx` (skin binding enabled)

- **Style tokens**: relies on Style Lab vars (`--halo-color`, `--panel-border`, `--hp-bar-start` …). Any palette tweak must flow through Style Lab presets/hooks.

- **Skin Binding System**: All certified components now support dynamic skin binding via `SkinBindingRegistry`:
  - `src/ui/idleVillage/skins/SkinBindingRegistry.ts` - Central registry for component skin configurations
  - `src/ui/idleVillage/hooks/useSkinHarness.ts` - Hook for skin preferences and telemetry management
  - Certified components: PgCard, ResidentSlotRack, TimeEngineStrip, ActiveHUD, ActivityCapsule, ActionHalo, SlottedMedal, VillageRosterSection
  - See `docs/SKIN_BINDING_REGISTRY_GUIDE.md` and `docs/COMPONENT_SKIN_INTEGRATION_GUIDE.md` for integration patterns

## Freeze reference
- Snapshot commit hash: tracked via git tags; use the latest tag in `git tag --list '*roster*'`.

- To restore quickly:

  ```bash
  git checkout <hash> -- \
    src/ui/idleVillage/components/VillageRosterSection.tsx \
    src/ui/idleVillage/components/ResidentRosterPanel.tsx \
    src/ui/idleVillage/components/DragTestContainer.tsx \
    src/ui/idleVillage/components/WorkerCard.tsx \
    src/ui/idleVillage/components/PgCard.tsx \
    src/ui/idleVillage/skins/SkinBindingRegistry.ts
  ```

- Create a git tag once verified (e.g., `git tag roster-canonical-2026-03-03 <hash>`).

## Usage policy

- All roster/list PG surfaces **must** import from `src/ui/idleVillage/roster`.
- Legacy implementations (`legacy/ResidentRoster.tsx`, ad-hoc lists) are deprecated and should be removed or refactored to point to this module.
- Playwright/RTL suites: `tests/unit/idleVillage/ResidentRosterPanel.test.tsx`, `tests/unit/testRosterPage/TestRosterPage.integration.test.tsx` validate regressions; expand here if new features touch the roster.
- When mounting `VillageRosterSection`, pass `componentId="roster-component"` (or equivalent stable id) to enable the positional drag handle; omitting it disables window dragging entirely.
- The only draggable surface for the roster window is the inline GripVertical handle that sits before the "Roster" label. PgCard dragging must stay isolated.
- Quick filter buttons (`ALL / HEROES / INJURED`) are deprecated. The only allowed filter UI is the pill-shaped select + eye/collapse buttons documented in `DragTestContainer`.
- PgCard interactions must forward `onDragStateChange` and rely on `CustomDragOverlay` (circular preview) for drag feedback. No alternative overlay implementations are permitted.

## Interaction contract with Slot Rack

- The roster **only** exposes drag metadata via `RESIDENT_DRAG_MIME`. Slot racks (`ResidentSlotRack`) pull assignments from `useResidentSlotController` and never mutate roster state directly.
- Drag feedback (`DropState`, bloom halos, audio cues) must reuse the controller outputs documented in `src/docs/docs/plans/idle_village_resident_slot_plan.md`.
- `getResidentCompatibility` implementations should thread diagnostics from `useSandboxDragController` so `CertifiedWorkerPickerSheet` and `ResidentSlotRack` agree on validation reasons.
- When a resident is dropped into a slot, the roster is responsible for clearing its own activeId/alpha state within 16 ms to avoid the “ghost” cards reported on 2026‑02‑17.

## Known gaps vs legacy snapshot (2026‑02‑17)

| Area | Legacy behavior | Certified status | Notes/tests to add |
| --- | --- | --- | --- |
| Hero flash + vertical overlay | Cards flash + overlay “Recupero necessario” when blocked | ✅ Ported: `DragTestContainer` emits hero flash + blocked overlay; `PgCard` now disables drag + audio cues while returning | Guarded by `DragTestContainer.test.tsx` (hero flash + overlay) and `PgCard.interactions.test.tsx` (returning state + cues). |
| Filters UI | Buttons `ALL / HEROES / INJURED` with sticky selection | ✅ Replaced: only dropdown select + eye/collapse buttons remain (no quick buttons) | Guarded by `DragTestContainer.test.tsx` filter select test and `ResidentRosterPanel.test.tsx` cardVariant forwarder. |
| Drag reset | Dropped/failed drags immediately revert opacity + pointer events | ✅ Implemented via `setListPointerEvents` + PgCard returning state reset | Guarded by `DragTestContainer.resetSignal` test (drag state clears) and PgCard returning-state suite. |
| PgCard sizing | Vertical cards fixed height (legacy) | ⚠ Still varies when `cardVariant="vertical"` | Need visual regression (snapshot) once Style Lab exposes fixed-height tokens. |
| Name rendering | `formatResidentLabel` always used | ✅ Certified now always pipes through formatter | Guarded by `DragTestContainer.test.tsx` “formatted resident labels” test. |

Document any new gap found during QA directly in this table and link the guarding test case once implemented.
