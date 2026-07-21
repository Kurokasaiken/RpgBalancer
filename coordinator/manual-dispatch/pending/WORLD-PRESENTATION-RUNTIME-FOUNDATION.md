# WORLD-PRESENTATION-RUNTIME-FOUNDATION — World Presentation Runtime Foundation

## Title
World Presentation Runtime Foundation — primo organo sensoriale di Wanderlust

## Description
Costruire il primo loop end-to-end che traduce lo stato del mondo di Wanderlust in una rappresentazione visiva leggibile e deterministica: WorldState → WorldPresentationModel → WorldPresentationRuntime → PresentationOutput → WorldSurfaceRenderer.

## Prompt

```text
AGENT
Idle Village Task — World Presentation Runtime Foundation

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` e `idle-village-task` prima di iniziare, segui i mandati, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Costruire il primo organo sensoriale di Wanderlust: il loop determinista che traduce WorldState in PresentationOutput e lo renderizza con WorldSurfaceRenderer.

FILE TARGET
- [nuovo] src/engine/world/presentation/types.ts
- [nuovo] src/engine/world/presentation/PresentationRules.ts
- [nuovo] src/engine/world/presentation/WorldPresentationModel.ts
- [nuovo] src/engine/world/presentation/buildWorldPresentationModel.ts
- [nuovo] src/engine/world/presentation/PresentationContext.ts
- [nuovo] src/engine/world/presentation/PresentationEffect.ts
- [nuovo] src/engine/world/presentation/PresentationSequence.ts
- [nuovo] src/engine/world/presentation/PresentationOutput.ts
- [nuovo] src/engine/world/presentation/OutputComposer.ts
- [nuovo] src/engine/world/presentation/PresentationRandom.ts
- [nuovo] src/engine/world/presentation/WorldPresentationRuntime.ts
- [nuovo] src/engine/world/presentation/config/presentationRulesRegistry.ts
- [nuovo] src/ui/idleVillage/config/presentationConfig.ts
- [nuovo] src/ui/idleVillage/hooks/useWorldPresentationRuntime.ts
- [nuovo] src/ui/idleVillage/pages/WorldPresentationDirectorPage.tsx
- [nuovo] src/ui/idleVillage/components/presentation/PresentationDirectorShell.tsx
- [nuovo] src/ui/idleVillage/components/presentation/ScenarioSelector.tsx
- [nuovo] src/ui/idleVillage/components/presentation/PlaybackControls.tsx
- [nuovo] tests/unit/idleVillage/buildWorldPresentationModel.test.ts
- [nuovo] tests/unit/idleVillage/WorldPresentationRuntime.replay.test.ts
- [nuovo] tests/unit/idleVillage/WorldPresentationRuntime.translation.test.ts
- [nuovo] tests/unit/idleVillage/OutputComposer.test.ts
- [esistente] src/ui/idleVillage/TestHub.tsx
- [esistente] public/locales/en/idleVillage.json
- [esistente] src/docs/docs/coordinator/strategy_tasks.md
- [nuovo] src/docs/docs/idle_village/trusted/world_presentation_runtime_trusted.md
- [esistente] src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md

DIPENDENZE
- IV-WORLD-SURFACE-001 (Completato)
- IV-WORLD-SURFACE-002 (Completato)
- TimeEngine contract

OPERAZIONI DA ESEGUIRE
1. Implementare contratti, schemi Zod e tipi in src/engine/world/presentation/.
2. Implementare buildWorldPresentationModel funzione pura.
3. Implementare WorldPresentationRuntime con registry effects, OutputComposer e PresentationRandom seeded.
4. Collegare TimeEngine come clock deterministico con interpolation separato per rendering smooth.
5. Creare adapter useWorldPresentationRuntime che mappa PresentationOutput su WorldSurfaceRenderer.
6. Creare WorldPresentationDirectorPage con shell minimale: viewport, scenario selector, play/pause/seed/tick, static preset loader.
7. Aggiungere /world-presentation-director in TestHub.tsx EXTRA_PAGES.
8. Scrivere i test unitari richiesti.
9. Aggiungere chiavi i18n presentation.* in public/locales/en/idleVillage.json.
10. Eseguire safeguard suite: lint, test, build:check, kanban:lint.
11. Aggiornare strategy_tasks.md, COMPONENT_MASTER_INDEX.md e creare trusted doc.

OPERAZIONI VIETATE
- Non mutare WorldState dal runtime di presentazione.
- PresentationOutput deve essere JSON-serializzabile (no DOM refs, no class instances).
- No ad-hoc CSS files; usare skin system e token esistenti.
- No stringhe hardcoded; usare i18n namespace idleVillage.
- No Timeline editing, capture frame, dnd-kit, undo/redo, preset import/export.

ASSUNZIONI
- WorldSurfaceRenderer supporta già activeVisualStateId, visualStateOverrides, runtimeObjects, camera, visibleLayerIds, layerScales/offsets.
- TimeEngine.ts fornisce tick deterministici; se necessario creare un PresentationClock adapter minimale.
- Il manifest di Wanderlust base esiste e contiene uno stato visivo "threatened" o simile, altrimenti fallback a default.

REGRESSION SAFEGUARDS
- npm run lint -- src/engine/world/presentation src/ui/idleVillage
- npm run test -- tests/unit/idleVillage
- npm run build:check
- npm run kanban:lint

KANBAN COMPLETION
1. Stato Kanban → "Completato" con data.
2. Evidence `test-results/WORLD-PRESENTATION-RUNTIME-FOUNDATION-<date>.log`.
3. Changelog in `src/docs/docs/plans/world_presentation_runtime_implementation_plan.md`.

NOTE
- Piano di riferimento: `src/docs/docs/plans/world_presentation_runtime_implementation_plan.md`.
- RFC di riferimento: `src/docs/docs/plans/world_presentation_runtime_rfc.md` v1.4.
- Execution hint: architectural.

EVIDENCE LOG
- test-results/WORLD-PRESENTATION-RUNTIME-FOUNDATION-YYYY-MM-DD.log
```

## Expected Output
- Contratti e schemi Zod in src/engine/world/presentation/
- Runtime core deterministico testato
- UI Director page esposta in /world-presentation-director
- Hook useWorldPresentationRuntime che collega runtime e renderer
- Test unitari passanti
- Evidence log
- Trusted doc e COMPONENT_MASTER_INDEX aggiornati

## Dependencies
- IV-WORLD-SURFACE-001
- IV-WORLD-SURFACE-002
- TimeEngine contract

## Timestamp
2026-07-20T15:34:00+02:00

## Executor
Cascade (manual)
