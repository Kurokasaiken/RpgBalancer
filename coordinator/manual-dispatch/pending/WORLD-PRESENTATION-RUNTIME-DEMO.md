# WORLD-PRESENTATION-RUNTIME-DEMO — World Presentation Runtime Demo

## Title

World Presentation Runtime Demo — primo "hello world" di Sequence + Effect

## Description

Dimostrare che il runtime sa realmente orchestrare un effetto tramite una sequenza: `WorldState → PresentationSequence → ThreatPresenceEffect → PresentationOutput → WorldSurfaceRenderer`.

## Prompt

```text
AGENT
Idle Village Task — World Presentation Runtime Demo

ISTRUZIONI AGENTE
Consulta le skill `agent-execution-mandate` e `idle-village-task` prima di iniziare, segui i mandati, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare il primo effetto concreto del runtime (`ThreatPresenceEffect`) e una `PresentationSequence` (`show_threat_presence`) che lo orchestra. L'effetto deve produrre `visualStateOverrides` deterministiche e replayabili.

FILE TARGET
- [nuovo] src/engine/world/presentation/effects/ThreatPresenceEffect.ts
- [nuovo] src/engine/world/presentation/config/threatPresenceEffectConfig.ts
- [modifica] src/engine/world/presentation/types.ts (opzionale: estendere PresentationEffect con mount/dispose se mancano)
- [modifica] src/engine/world/presentation/WorldPresentationRuntime.ts (supporto sequence attiva e lifecycle degli effetti)
- [modifica] src/engine/world/presentation/PresentationSequence.ts (se necessario: resolver minima sequence -> effect)
- [modifica] src/engine/world/presentation/config/presentationRulesRegistry.ts (opzionale: mapping sequence)
- [modifica] src/ui/idleVillage/config/presentationConfig.ts (scenario `threat` usa sequence `show_threat_presence`)
- [modifica] src/ui/idleVillage/hooks/useWorldPresentationRuntime.ts (passare sequence attiva al runtime)
- [nuovo] tests/unit/idleVillage/WorldPresentationRuntime.demo.test.ts
- [esistente] src/docs/docs/plans/world_presentation_runtime_implementation_plan.md

DIPENDENZE
- WORLD-PRESENTATION-RUNTIME-FOUNDATION (architettura e contracts già in place)
- IV-WORLD-SURFACE-001 / IV-WORLD-SURFACE-002 (renderer e world state)

OPERAZIONI DA ESEGUIRE
1. Definire `ThreatPresenceEffectConfig` con Zod: durata (tick), layer target, tint iniziale/finale, opacity iniziale/finale, nome effetto. Nessun valore hardcoded nell'effetto.
2. Implementare `ThreatPresenceEffect`:
   - `mount(ctx)`: legge `ctx.model.worldState.threat.active` e `ctx.model.worldState.threat.level`; se non attivo l'effetto resta inerte.
   - `update(ctx, tick, deltaTick, interpolation)`: emette `visualStateOverrides` per il layer target (`vignette`) con `tint_layer` e `set_opacity` che interpolano linearmente tra i valori iniziali e finali in `durationTicks`.
   - `dispose(ctx)`: rimuove gli override (restituisce override vuoti o pulisce stato interno).
3. Estendere `PresentationEffect` con `mount` e `dispose` opzionali se non presenti; aggiornare `WorldPresentationRuntime` per chiamare `mount` al primo update e `dispose` quando l'effetto viene unregistered o la sequence cambia.
4. Creare `PresentationSequence` `show_threat_presence` che istanzia e configura `ThreatPresenceEffect`.
5. Aggiornare `presentationConfig.ts` scenario `threat` con `sequenceId: 'show_threat_presence'`.
6. Aggiornare `useWorldPresentationRuntime` per passare la sequence corrente al runtime.
7. Scrivere `WorldPresentationRuntime.demo.test.ts`:
   - scenario `threat`, seed fissato, play 180 tick → `visualStateOverrides` contiene `tint_layer` per `vignette` con tint finale `#4a0a0a` e `set_opacity` con opacity `0.85`.
   - stesso scenario/seed/tick → stesso output.
8. Eseguire safeguard suite: lint, test (scope demo + presentation), build:check, kanban:lint.
9. Salvare evidence log e aggiornare `world_presentation_runtime_implementation_plan.md` changelog.

OPERAZIONI VIETATE
- Non mutare `WorldState` dal runtime o dagli effetti.
- `PresentationOutput` deve rimanere JSON-serializzabile.
- Nessun `Math.random`, `Date.now`, `performance.now` all'interno dell'effetto; il tempo è sempre `ctx.tick` / `ctx.interpolation`.
- No nuovi componenti UI: questo task è engine-only.
- Non toccare i18n, error state o governance in questo task (sono task separati di close-out).

ASSUNZIONI
- `WorldSurfaceRenderer` supporta `visualStateOverrides` e applica correttamente `tint_layer`/`set_opacity`.
- `WorldPresentationRuntime` esiste con registry effetti; può essere esteso per lifecycle/sequence.
- `useWorldPresentationRuntime` è l'unico punto di binding tra scenario e runtime.

REGRESSION SAFEGUARDS
- npm run lint -- src/engine/world/presentation src/ui/idleVillage/hooks/useWorldPresentationRuntime.ts
- npm run test -- tests/unit/idleVillage/WorldPresentationRuntime.demo.test.ts tests/unit/idleVillage/WorldPresentationRuntime.replay.test.ts tests/unit/idleVillage/WorldPresentationRuntime.translation.test.ts tests/unit/idleVillage/OutputComposer.test.ts
- npm run build:check
- npm run kanban:lint

KANBAN COMPLETION
1. Stato Kanban per `WORLD-PRESENTATION-RUNTIME-DEMO` → "Completato" con data.
2. Evidence `test-results/WORLD-PRESENTATION-RUNTIME-DEMO-<date>.log`.
3. Changelog in `src/docs/docs/plans/world_presentation_runtime_implementation_plan.md`.

NOTE
- Piano di riferimento: `src/docs/docs/plans/world_presentation_runtime_implementation_plan.md`.
- RFC di riferimento: `src/docs/docs/plans/world_presentation_runtime_rfc.md` v1.4.
- Execution hint: verified.

EVIDENCE LOG
- test-results/WORLD-PRESENTATION-RUNTIME-DEMO-YYYY-MM-DD.log
```

## Expected Output

- `ThreatPresenceEffect` con lifecycle `mount/update/dispose`
- `PresentationSequence` `show_threat_presence` che orchestra l'effetto
- `WorldPresentationRuntime` aggiornato per sequence e lifecycle
- `WorldPresentationRuntime.demo.test.ts` passante e determinista
- Evidence log

## Dependencies

- WORLD-PRESENTATION-RUNTIME-FOUNDATION
- IV-WORLD-SURFACE-001
- IV-WORLD-SURFACE-002

## Timestamp

2026-07-20T16:59:00+02:00

## Executor

TBD (harness o agente manuale)
