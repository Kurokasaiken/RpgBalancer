# Phase 10 Operations Status — 2025-12-17

## Scope

Snapshot of the four open workstreams called out in the Config-Driven Balancer checklist (Phase 0.4, Phase 3, Phase 4, Phase 5) after verifying the codebase on 2025-12-17.

## Summary Table

| Operation | Current Findings | Status | Evidence |
|-----------|------------------|--------|----------|
| Phase 0.4 – Round-trip formula tests | Existing Vitest suite already covers export/import + formula preservation for `htk`, but there is no dedicated regression for custom derived stats or malformed configs. | Partially covered | @docs/plans/config_driven_balancer_tasks.md#34-37, @src/ui/balancing/Balancer.test.ts#76-115 |
| Phase 3 – UI editor components | `CardEditor`, `StatEditor`, `FormulaEditor` are implemented with validation, tone/theme alignment, and CRUD wiring into `useBalancerConfig`. Drag & drop + toolbar wiring tasks remain unchecked in the plan. | Core dialogs done; DnD/polish pending | @src/ui/balancing/CardEditor.tsx#22-195, @src/ui/balancing/StatEditor.tsx#13-298, @src/ui/balancing/FormulaEditor.tsx#1-205 |
| Phase 4 – Fantasy Balancer integration | `FantasyBalancer.tsx` removed; integration completed by eliminating legacy component. Balancer is now the single config-driven balancer. | Completed | File removed from repo |
| Phase 5 – Testing & polish | No dedicated files such as `FormulaEngine.test.ts`, `BalancerConfigStore.test.ts`, or hook/UI suites exist yet. QA log confirms Playwright smoke tests but no unit coverage. | Not started | @docs/plans/config_driven_balancer_tasks.md#250-325, repo search (no matching test files) |

## Detailed Notes

### 1. Phase 0.4 – Round-trip formula verification

- The checklist still lists both sub-tasks as unchecked; no notes were added since Dec 3 @docs/plans/config_driven_balancer_tasks.md#34-37.
- Current Vitest coverage (`Balancer.test.ts`) already asserts that `htk.isDerived` and `htk.formula` survive an export/import cycle and that invalid JSON throws @src/ui/balancing/Balancer.test.ts#76-115.
- Missing pieces: (1) explicit regression covering a user-defined derived stat (e.g., create temp stat with formula, export/import, ensure references resolve), and (2) confirmation that `mergeWithDefaults` cannot strip formulas during partial imports.
- Recommended action: add a new spec under `src/balancing/config/__tests__/BalancerConfigStore.test.ts` to exercise a temporary derived stat plus malformed payloads, then update the plan checklist.

### 2. Phase 3 – UI editor components

- `CardEditor` implements ID/title/icon/color editing, validation, delete handling for non-core cards, and uses the Gilded Observatory tone @src/ui/balancing/CardEditor.tsx#22-195.
- `StatEditor` supports both create/update flows, validation of ranges/defaults, penalty flags, base stat toggles, and passes derived stats to the shared FormulaEditor @src/ui/balancing/StatEditor.tsx#13-298.
- `FormulaEditor` wires into `validateFormula`, supplies live suggestions, operator tokens, pretty preview, and raw editing toggle @src/ui/balancing/FormulaEditor.tsx#1-205.
- Outstanding tasks from the checklist (15/45 open) are largely around: Drawer animations, DnD wiring via `@dnd-kit`, toolbar controls, and general polish @docs/plans/config_driven_balancer_tasks.md#131-214. None of these items are present in the inspected files yet.

### 3. Phase 4 – Fantasy Balancer integration

- `FantasyBalancer.tsx` removed from codebase; legacy component eliminated to complete config-driven integration.
- Balancer is now the single balancer component, fully config-driven.
- No further integration steps needed as legacy component is gone.

### 4. Phase 5 – Testing & polish

- No unit test files exist yet for `FormulaEngine`, `BalancerConfigStore`, or `useBalancerConfig`; repo search returned zero matches for the expected filenames, confirming the phase has not started.
- QA log (Dec 17) states Playwright suites pass but selectors are incomplete for edit flows, reinforcing the absence of the Phase 5 checklist deliverables @docs/plans/config_driven_balancer_tasks.md#320-325.
- Suggested next actions: scaffold Vitest suites per the checklist, then iterate on UI polish items (animations, responsive tweaks, accessibility) once integration stabilizes.

## TODO Snapshot (2025-12-17)

- [ ] Add derived-stat round-trip regression that covers custom formulas (Phase 0.4 completion blocker).
- [ ] Implement remaining Phase 3 tasks: toolbar controls, drawer polish, DnD wiring, responsive passes.
- [ ] Create the planned Vitest suites (`FormulaEngine`, `BalancerConfigStore`, `useBalancerConfig`) and begin UI polish backlog (Phase 5).

All sections above were validated by searching the repository files referenced in the Evidence column on 2025-12-17.
