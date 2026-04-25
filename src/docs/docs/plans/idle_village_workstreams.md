# Idle Village Workstreams

## WS3: Crew Scheduler Deterministic Queue _(Status: COMPLETED)_

- **Scope**: Implementare un sistema di scheduling deterministico con code di priorità basate su stat tags, fatigue, e urgenza quest.
- **Deliverables**:
  1. `crewScheduler.ts` - Config-first con priority weights, seeding LCG, thresholds
  2. `useCrewScheduler.ts` - Hook React con queue management, fattori assignment, API completa
  3. `CrewSchedulerController.ts` - Controller abstraction per integrazione VillageSandbox
  4. Unit tests con fake timers per determinismo e priority calculation
  5. Integrazione in `useMapContext` con API esposta (`enqueueCrewTask`, `processCrewQueue`, etc.)
- **State & Metrics**:
  - Queue state mantenuto in React state con priorità dinamica
  - Diagnostics logging via `createSandboxDiagnostics` per decision tracking
  - Priority factors: statTagMatch (0-1), fatigue (0-1), questUrgency (time units), specialization (0-1), difficulty (0-1)
  - Config weights: statTagMatchWeight, fatigueWeight, questUrgencyWeight, specializationWeight, difficultyWeight, baseWeight
- **Rollback Strategy**:
  1. Rimuovere import crew scheduler da `useMapContext`
  2. Rimuovere `crewScheduler` properties dal return object
  3. Ripristinare logica scheduling legacy in `useActivityScheduler`
  4. Disabilitare diagnostics per crew scheduler
- **Evidence**:
  - Config validation e deterministic RNG con LCG seed 42
  - Unit tests coprono priority order, fatigue thresholds, time-based determinism
  - Integration in useMapContext con controller pattern

## WS4: Theater Controller Extraction _(Status: COMPLETED)_

- **Scope**: Estrarre tutta la logica dell'overlay Theater da `useMapContext` in un hook dedicato e configurabile.
- **Deliverable**: `useTheaterController` @src/ui/idleVillage/hooks/useTheaterController.ts#150-349
  - Legge i timer (`hoverOpenMs`, `hoverCloseMs`, `maxPreviewCount`) da config tramite `ensureTheaterTimers`.
  - Gestisce `theaterPreviewIds`, `isTheaterOpen`, `theaterSlotId` e i timer `hover-open` / `delayed-close` (500 ms default).
  - Espone API `openTheaterForSlot`, `handleLocationInspect`, `handleLocationResidentDragEnter/Leave/Drop`, `closeTheater`, `selectTheaterPreviewIds`.
  - Include diagnostica (`logTheaterEvent`) per hover-open, delayed-close, selection pipeline.
- **Evidence**:
  1. Hover timers configurabili confermati dai log `[useTheaterController] config:init` e test `useTheaterController.test.ts`.
  2. Diagnostics `schedule-hover-open`, `hover-close-fired` attivi in Dev mode per Playwright.
  3. Vitest suite `src/ui/idleVillage/hooks/__tests__/useTheaterController.test.ts` copre hover delay e randomness preview.

## WS5: _Placeholder_

- (Da definire) — usare questa sezione per il prossimo workstream Idle Village.

## WS6: _Placeholder_

- (Da definire)
