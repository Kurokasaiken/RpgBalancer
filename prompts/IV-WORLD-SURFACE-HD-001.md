# IV-WORLD-SURFACE-HD-001 — World Surface HD Layer Migration + Drag-and-Drop Reorder

## Header

- **Task ID:** IV-WORLD-SURFACE-HD-001
- **Title:** World Surface HD Layer Migration + Drag-and-Drop Reorder
- **Plan reference:** `src/docs/docs/plans/world_surface_runtime_implementation_plan.md`
- **Estimated duration:** 60 min
- **Execution hint:** verified

## Objectives

1. Replace the 21 existing `surfaceLayers` assets in `public/assets/world/wanderlust/base/layers/` with the new HD exports from `public/assets/world/wanderlust/base/source/exports/hd-photo-map-finale/`.
2. Update `manifest.json` to reference the new filenames, set `coordinateSystem` / `resolutionHint` to the natural map size (4240×2828), and bump version.
3. Add drag-and-drop reordering for `surfaceLayers` in `WorldSurfaceDebugPanel`, backed by `@dnd-kit/sortable`.
4. Preserve existing offset X/Y and scale controls for each layer.
5. Persist the custom layer order via `PersistenceService` and restore it on page load.
6. Maintain i18n coverage (no hardcoded strings) and follow Gilded Observatory theme.

## Success criteria and KPI targets

- `/world-surface` loads the new HD map at natural size with all 21 layers in the correct z-order.
- Debug panel allows dragging layer rows to reorder the render stack.
- Offset X/Y sliders remain functional and independent of drag order.
- Custom order survives reload (`PersistenceService`).
- Safeguards pass: `build:check`, lint, unit tests, `kanban:lint`.
- Evidence log: `test-results/iv-world-surface-hd-001-<YYYY-MM-DD>.log`.

## Integration points and dependencies

- Depends on `IV-WORLD-SURFACE-001` (completed).
- Uses `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (already in project).
- Uses `PersistenceService` for order persistence.
- Uses `react-i18next` `useTranslation` namespace `idleVillage`.

## Guardrails

- `.windsurf/rules/00-project-invariants.md`: `PersistenceService`, config-first, i18n, JSDoc.
- `.windsurf/rules/10-ui-invariants.md`: `@dnd-kit` drag & drop, Gilded Observatory theme, <16ms/frame.
- No standalone `.css` files.
- Do not modify `engine/world` models or `WorldState`.
- `WorldSurfaceRenderer` is candidate (not trusted); extending its props is allowed.

## Implementation Scope

### Files to create/modify

1. `public/assets/world/wanderlust/base/manifest.json` — update layer list, canvas, `resolutionHint`, camera bounds, version.
2. `public/assets/world/wanderlust/base/layers/` — delete old PNGs; copy new HD PNGs from `source/exports/hd-photo-map-finale/`.
3. `src/ui/idleVillage/components/WorldSurfaceRenderer.tsx` — add optional `surfaceLayerOrder?: string[]` prop. When provided, surface layers are sorted by that order (fallback to `zIndex`); atmosphere layers remain sorted by `zIndex`. Ensure `layer.file` is URL-encoded when building the image `src` to handle spaces/special characters.
4. `src/ui/idleVillage/components/WorldSurfaceDebugPanel.tsx` — wrap the surface layer list in a `@dnd-kit/sortable` context; add drag handles to each row; preserve scale/offset/visibility controls.
5. `src/ui/idleVillage/pages/WorldSurfaceTestPage.tsx` — maintain `surfaceLayerOrder` state; load from/save to `PersistenceService` key `worldSurfaceLayerOrder`; pass to `WorldSurfaceRenderer` and `WorldSurfaceDebugPanel`.
6. `public/locales/en/idleVillage.json` and `pseudo` — add keys for drag handle labels (e.g. `world.layers.dragHandle`, `world.layers.reorderHint`) if needed.
7. `src/ui/idleVillage/config/worldSurfaceConfig.ts` — no schema changes expected; if a new optional prop is added to renderer types, update interfaces with JSDoc.
8. `tests/unit/idleVillage/WorldSurfaceLayerOrder.test.tsx` (new) — unit test for layer order sorting and persistence round-trip.

### Component reuse

- Check `src/ui/atoms/`, `src/ui/fantasy/atoms/`, `src/ui/idleVillage/skins/primitives/` before creating new drag-handle/reorder components. If no primitive covers sortable list rows, add a small primitive or inline in `WorldSurfaceDebugPanel` (debug-only UI).

### HD layer mapping (preserve zIndex from back to front)

| old id | new filename | zIndex |
| --- | --- | --- |
| background | `Background.png` | 5 |
| sea | `mare.png` | 10 |
| island_bottom_left | `Isola basso sinistra.png` | 15 |
| island_bottom_right | `Isola basso a destra.png` | 20 |
| mountain_island_bottom_left | `Montagna isola basso sinistra.png` | 25 |
| mountains_dark_bottom | `Montagne scure basso.png` | 30 |
| mountains_light_bottom_right | `Montagne chiare basso destra.png` | 35 |
| mountains_dark_right | `Montagne scure destra.png` | 40 |
| mountain_zone_north | `Zona montana nord.png` | 45 |
| trees_brown_hills_center | `Alberi e colline marroni al centro.png` | 50 |
| small_trees_center | `Alberelli centro mappa.png` | 55 |
| trees_center_right | `Alberi destra centrali.png` | 60 |
| forest_1_top_left | `Foresta 1 Alto Sin.png` | 65 |
| forest_1_light_top_left | `Foresta 1 chiara alto sin .png` | 70 |
| forest_2_dark_bottom_left | `Foresta 2 scura basso sin.png` | 75 |
| forest_3_dark_bottom | `Foresta 3 scura basso.png` | 80 |
| forest_light_right_center | `Foresta chiara destra centro.png` | 85 |
| forest_dark_north | `Foresta scura nord.png` | 90 |
| village | `Villaggio.png` | 95 |
| level_1 | `Livello 1.png` | 98 |
| frame | `frame.png` | 99 (type: `ui_overlay`) |

### Testing

- Unit test: `WorldSurfaceRenderer` respects `surfaceLayerOrder` and falls back to `zIndex` order when prop is absent.
- Unit test: `WorldSurfaceTestPage` loads/saves layer order via `PersistenceService`.
- RTL test: `WorldSurfaceDebugPanel` renders drag handles and emits reorder events.
- Manual: open `/world-surface`, verify new map, drag layers, refresh, verify order persists, verify offset X/Y still work.

## Safeguards

- `npm run lint -- src/ui/idleVillage/pages/WorldSurfaceTestPage.tsx src/ui/idleVillage/components/WorldSurfaceRenderer.tsx src/ui/idleVillage/components/WorldSurfaceDebugPanel.tsx public/locales/en/idleVillage.json tests/unit/idleVillage/WorldSurfaceLayerOrder.test.tsx` (timeout 120s)
- `npm run test -- tests/unit/idleVillage/WorldSurfaceLayerOrder.test.tsx` (timeout 300s; expand scope if only this test is too narrow)
- `npm run build:check` (timeout 180s)
- `npm run kanban:lint` (timeout 30s)
- Evidence log: `test-results/iv-world-surface-hd-001-<YYYY-MM-DD>.log`

## Documentation updates

- Update `src/docs/docs/plans/world_surface_runtime_implementation_plan.md` changelog/note section to mention HD layer migration and drag-and-drop.
- Update `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` if `WorldSurfaceRenderer` status changes (candidate → candidate + order prop documented).

## Evidence log requirements

- Save full output of lint, test, build:check, kanban:lint to `test-results/iv-world-surface-hd-001-<YYYY-MM-DD>.log`.

## Notes

- When picking this prompt, set `src/docs/docs/coordinator/agent_assignments.md` row to "In corso" with date and agent name.
- On completion, close with: `KANBAN STATUS: IV-WORLD-SURFACE-HD-001 – Completato (Evidence: test-results/iv-world-surface-hd-001-<YYYY-MM-DD>.log)`.
- The filename `Foresta 1 chiara alto sin .png` has a trailing space before `.png`; if it causes load failures, rename to remove the trailing space and update the manifest accordingly.
