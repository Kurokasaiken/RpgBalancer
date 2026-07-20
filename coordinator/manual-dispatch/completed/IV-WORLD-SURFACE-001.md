# IV-WORLD-SURFACE-001 — World Surface Runtime Step 1-3

## Title
World Surface Runtime — asset pipeline, Zod schemas, engine models, loader and /world-surface TestHub page

## Description
Implement the base World Surface Runtime for Wanderlust: multi-layer animated world map, config-driven, exposed in the Test Hub at /world-surface. This covers the approved plan Step 1-3 (asset pipeline, schemas/contracts, loader/renderer/TestHub page). Runtime objects and event lifecycle are out of scope.

## Prompt

AGENT
Idle Village Task — World Surface Runtime

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` e `idle-village-task` prima di iniziare, segui i mandati, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire il World Surface Runtime base per Wanderlust: mappa multistrato DOM+CSS transform, pan/zoom, toggle layer, switch stato visivo, debug panel, esposta in /world-surface.

PROMPT READINESS
FILE TARGET
- [nuovo] public/assets/world/wanderlust/base/manifest.json
- [nuovo] public/assets/world/wanderlust/base/README.md
- [nuovo] public/assets/world/wanderlust/base/source/.gitkeep
- [nuovo] public/assets/world/wanderlust/base/source/exports/.gitkeep
- [nuovo] src/ui/idleVillage/config/worldSurfaceConfig.ts
- [nuovo] src/engine/world/model/RuntimeObject.ts
- [nuovo] src/engine/world/model/WorldEvent.ts
- [nuovo] src/engine/world/model/WorldSurfaceRegion.ts
- [nuovo] src/engine/world/model/WorldCoordinate.ts
- [nuovo] src/engine/world/config/worldEventRegistry.ts
- [nuovo] src/engine/world/systems/WorldState.ts
- [nuovo] src/ui/idleVillage/config/worldSurfaceDebugContract.ts
- [nuovo] src/ui/idleVillage/hooks/useWorldSurface.ts
- [nuovo] src/ui/idleVillage/components/WorldSurfaceRenderer.tsx
- [nuovo] src/ui/idleVillage/components/WorldSurfaceDebugPanel.tsx
- [nuovo] src/ui/idleVillage/pages/WorldSurfaceTestPage.tsx
- [nuovo] tests/unit/idleVillage/useWorldSurface.test.ts
- [esistente] src/ui/idleVillage/TestHub.tsx

DIPENDENZE
-

OPERAZIONI DA ESEGUIRE
1. Asset pipeline: creare source/ e source/exports/ con .gitkeep, README.md con naming convention, manifest.json secondo WorldSurfaceManifestSchema.
2. Schemi Zod: implementare worldSurfaceConfig.ts, RuntimeObject.ts, WorldEvent.ts, WorldSurfaceRegion.ts, WorldCoordinate.ts, worldEventRegistry.ts, WorldState.ts, worldSurfaceDebugContract.ts usando esattamente i contratti forniti dal piano.
3. Loader: implementare useWorldSurface.ts con fetch manifest, validazione Zod, stati loading/error/ready, activeVisualStateId, helpers worldToViewport/viewportToWorld.
4. Renderer DOM: implementare WorldSurfaceRenderer.tsx con layer assoluti, ordine z-index, parallax, opacity/blendMode/conditions, animazione wave CSS, ancore e regioni opzionali.
5. Debug panel: implementare WorldSurfaceDebugPanel.tsx con coordinate mouse in world, stato visivo attivo, lista layer attivi, ancore, regioni.
6. TestHub page: implementare WorldSurfaceTestPage.tsx con pan/zoom, toggle layer, switch visual state default/corrupted, debug panel, link a TestHub.
7. Registrare /world-surface in EXTRA_PAGES di TestHub.tsx.
8. Test unitario: useWorldSurface.test.ts con mock fetch, validazione manifest, coordinate conversion.
9. Safeguard suite: lint, test, build:check, kanban:lint.
10. Evidence log in test-results/iv-world-surface-001-2026-07-19.log.

OPERAZIONI VIETATE
- Non usare canvas/WebGL in questa fase (MVP DOM+CSS transform).
- Non creare file .css standalone per skin/tema; usare skinConfigRegistry e token CSS esistenti.
- Non hardcodare stringhe UI; usare i18n namespace idleVillage.
- Non usare localStorage/sessionStorage diretto; PersistenceService-only.

ASSUNZIONI
- Gli asset PNG esistono in public/assets/world/wanderlust/base/layers/.
- Il renderer DOM è sufficiente per lo slice verticale; Pixi/WebGL è fuori scope.
- Il manifest fornito è la single source of truth per layer, parallax, stati visivi, ancore.

REGRESSION SAFEGUARDS
- npm run lint -- src/ui/idleVillage/config src/ui/idleVillage/hooks src/ui/idleVillage/components src/ui/idleVillage/pages src/engine/world tests/unit/idleVillage
- npm run test -- tests/unit/idleVillage/useWorldSurface.test.ts
- npm run build:check
- npm run kanban:lint

AUTONOMIA & CHECK-IN
Alta; se l'architettura del renderer richiede scelte che escono dal piano, documentare nel log.

KANBAN COMPLETION
1. Stato Kanban → "Completato" con data.
2. Evidence `test-results/iv-world-surface-001-2026-07-19.log`.
3. Changelog in `src/docs/docs/plans/world_surface_runtime_implementation_plan.md`.

NOTE
- Piano di riferimento: `src/docs/docs/plans/world_surface_runtime_implementation_plan.md`.
- Schemi forniti nello handoff Strategia → Coordinator.

EVIDENCE LOG
- test-results/iv-world-surface-001-2026-07-19.log

## Expected Output
- Manifest + README asset in public/assets/world/wanderlust/base/
- Schemi e tipi Zod in src/ui/idleVillage/config/ e src/engine/world/
- Hook useWorldSurface con loader e conversioni coordinate
- WorldSurfaceRenderer DOM con parallax, layer conditions, stati visivi
- WorldSurfaceDebugPanel
- WorldSurfaceTestPage con pan/zoom/toggle/switch
- Entry /world-surface in TestHub
- Test unitario useWorldSurface.test.ts
- Evidence log

## Dependencies
- None

## Timestamp
2026-07-19T12:18:00+02:00

## Executor
Cascade (manual)
