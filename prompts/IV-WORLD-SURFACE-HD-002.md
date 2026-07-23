# IV-WORLD-SURFACE-HD-002 — World Surface HD Asset Migration & Runtime Hardening

## Header

- **Task ID:** IV-WORLD-SURFACE-HD-002
- **Title:** World Surface HD Asset Migration & Runtime Hardening
- **Plan reference:** `src/docs/docs/plans/world_surface_hd_asset_migration_plan.md`
- **Estimated duration:** 90 min
- **Execution hint:** `verified`

## Objectives

1. Replace obsolete `public/assets/world/wanderlust/base/layers/` content with the new HD cut-out source from `hd-photo-Map finale/`.
2. Remove `Livello 1.png` and `mare.png` from the runtime layer folder (obsolete in the new cut-out set).
3. Normalize filenames: remove trailing spaces, align casing, and ensure URL-safe names.
4. Update `public/assets/world/wanderlust/base/manifest.json` to reflect the real HD layer set.
5. Add image load error handling in `WorldSurfaceRenderer.tsx` so a missing file does not break the whole map.
6. Add a semantic validation utility that checks every `layer.file` referenced in the manifest exists on disk.
7. Update/add `public/assets/world/wanderlust/base/README.md` documenting the artist drop-in workflow.

## Success criteria and KPI targets

- `/world-surface` renders the new HD cut-out map without `Livello 1.png` and `mare.png`.
- All layer filenames are free of trailing spaces and casing inconsistencies.
- `manifest.json` passes Zod validation and a semantic file-existence check.
- If a referenced image is missing, the renderer logs a telemetry event and keeps the other layers visible.
- Safeguards pass: lint, build:check, unit tests, kanban:lint.
- Evidence log: `test-results/iv-world-surface-hd-002-<YYYY-MM-DD>.log`.

## Integration points and dependencies

- Depends on `IV-WORLD-SURFACE-001` (completed) and supersedes `IV-WORLD-SURFACE-HD-001` asset-path assumptions.
- Uses `PersistenceService` only for existing layer order/offset persistence.
- Uses `react-i18next` `useTranslation` namespace `idleVillage`.

## Guardrails

- `.windsurf/rules/00-project-invariants.md`: `PersistenceService`, config-first, i18n, JSDoc.
- `.windsurf/rules/10-ui-invariants.md`: Gilded Observatory theme, no standalone `.css` files.
- Do not modify `engine/world` models or `WorldState`.
- `WorldSurfaceRenderer` is `candidate`; extending its props is allowed.
- The runtime must remain asset-agnostic: no hardcoded filenames outside `manifest.json`.

## Implementation Scope

### Files to create/modify

1. `public/assets/world/wanderlust/base/layers/*` — replace/remove/add PNGs to match `hd-photo-Map finale/`.
2. `public/assets/world/wanderlust/base/manifest.json` — update layer list, remove obsolete entries, bump version to `1.1.1`.
3. `src/ui/idleVillage/components/WorldSurfaceRenderer.tsx` — add `onError` to layer `<img>` and telemetry fallback.
4. `src/ui/idleVillage/utils/validateWorldSurfaceAssets.ts` — new semantic validation utility.
5. `public/assets/world/wanderlust/base/README.md` — new or updated artist workflow doc.
6. `src/docs/docs/plans/world_surface_hd_asset_migration_plan.md` — update status/changelog if implementation diverges.

### Asset mapping (HD source → runtime)

| id | source filename | proposed runtime filename | zIndex | type | notes |
|---|---|---|---|---|---|
| background | `Background.png` | `Background.png` | 5 | texture | keep |
| sea | *(removed)* | — | — | — | `mare.png` no longer in HD set |
| island_bottom_left | `Isola basso sinistra.png` | `Isola basso sinistra.png` | 15 | texture | keep |
| island_bottom_right | `Isola basso a destra.png` | `Isola basso a destra.png` | 20 | texture | keep |
| mountain_island_bottom_left | `Montagna isola basso sinistra.png` | `Montagna isola basso sinistra.png` | 25 | texture | keep |
| mountains_dark_bottom | `Montagne scure basso.png` | `Montagne scure basso.png` | 30 | texture | keep |
| mountains_light_bottom_right | `Montagne chiare basso destra.png` | `Montagne chiare basso destra.png` | 35 | texture | keep |
| mountains_dark_right | `Montagne scure destra.png` | `Montagne scure destra.png` | 40 | texture | keep |
| mountain_zone_north | `Zona montana nord.png` | `Zona montana nord.png` | 45 | texture | keep |
| trees_brown_hills_center | `Alberi e colline marroni al centro.png` | `Alberi e colline marroni al centro.png` | 50 | texture | keep |
| small_trees_center | `Alberelli centro mappa.png` | `Alberelli centro mappa.png` | 55 | texture | keep |
| trees_center_right | `Alberi destra centrali.png` | `Alberi destra centrali.png` | 60 | texture | keep |
| forest_1_top_left | `Foresta 1 Alto Sin.png` | `Foresta 1 Alto Sin.png` | 65 | texture | keep |
| forest_1_light_top_left | `Foresta 1 chiara alto sin .png` | `Foresta 1 chiara alto sin.png` | 70 | texture | normalize trailing space |
| forest_2_dark_bottom_left | `Foresta 2 scura basso sin.png` | `Foresta 2 scura basso sin.png` | 75 | texture | keep |
| forest_3_dark_bottom | `Foresta 3 scura basso.png` | `Foresta 3 scura basso.png` | 80 | texture | keep |
| forest_light_right_center | `Foresta chiara destra centro.png` | `Foresta chiara destra centro.png` | 85 | texture | keep |
| forest_dark_north | `Foresta scura nord.png` | `Foresta scura nord.png` | 90 | texture | keep |
| village | `Villaggio.png` | `Villaggio.png` | 95 | texture | keep |
| level_1 | *(removed)* | — | — | — | `Livello 1.png` no longer in HD set |
| frame | `Frame.png` | `Frame.png` | 99 | ui_overlay | align casing to HD source |
| border | `Bordo.png` | `Bordo.png` | 97 | ui_overlay | new |
| full_composition | `map finale no frame no nuvole.png` | `map-finale-no-frame-no-nuvole.png` | 1 | debug/optional | normalize spaces; load only in debug mode if needed |

> **Note:** The `full_composition` layer is optional. If it is not needed at runtime, keep it in the source folder for reference and do not add it to the manifest.

### Component reuse

- Check `src/ui/atoms/`, `src/ui/fantasy/atoms/`, `src/ui/idleVillage/skins/primitives/` before creating new debug UI. Reuse existing telemetry hook if available.

### Testing

- Unit test: `validateWorldSurfaceAssets` reports missing files correctly.
- Unit test: `WorldSurfaceRenderer` does not crash when an image fails to load.
- Manual: open `/world-surface`, verify HD cut-out map, check no 404 in network tab.

## Safeguards

```bash
npm run lint -- src/ui/idleVillage/components/WorldSurfaceRenderer.tsx src/ui/idleVillage/utils/validateWorldSurfaceAssets.ts public/assets/world/wanderlust/base/manifest.json
npm run test -- tests/unit/idleVillage/WorldSurfaceRenderer.test.tsx tests/unit/idleVillage/validateWorldSurfaceAssets.test.ts
npm run build:check
npm run kanban:lint
```

Evidence log: `test-results/iv-world-surface-hd-002-<YYYY-MM-DD>.log`

## Documentation updates

- Update `src/docs/docs/plans/world_surface_hd_asset_migration_plan.md` status to `approved` if implementation matches.
- Update `src/docs/docs/plans/world_surface_runtime_implementation_plan.md` changelog.
- Update `public/assets/world/wanderlust/base/README.md` with naming conventions and artist workflow.

## Evidence log requirements

- Save full output of lint, test, build:check, kanban:lint to `test-results/iv-world-surface-hd-002-<YYYY-MM-DD>.log`.

## Notes

- When picking this prompt, set `src/docs/docs/coordinator/agent_assignments.md` row to "In corso" with date and agent name.
- On completion, close with: `KANBAN STATUS: IV-WORLD-SURFACE-HD-002 – Completato (Evidence: test-results/iv-world-surface-hd-002-<YYYY-MM-DD>.log)`.
- Coordinate with the artist on `Frame.png` vs `frame.png` casing before finalizing the manifest.
- Do not delete `hd-photo-Map finale/`; it remains the authoritative HD source archive.
