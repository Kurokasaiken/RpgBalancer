# WORLD-SURFACE-V3-EVENTS-002 — World Surface V3 Events (4-Phase Presage)

## Header

- **Task ID:** WORLD-SURFACE-V3-EVENTS-002
- **Title:** World Surface V3 Events — 4-Phase Presage System
- **Plan reference:** `src/docs/docs/plans/world_surface_v3_strategic_plan.md` §Phase 2
- **Estimated duration:** 60–75 min
- **Execution hint:** verified

## Objectives

1. Replace the `EventLayer.tsx` stub with a full event lifecycle layer.
2. Implement `eventPresageSystem.ts` managing Presage → Threat → Event → Consequence phases.
3. Create `config/eventConfig.ts` with Zod schemas for `WorldEventType`, `EventPhase`, durations, visuals, and telemetry flags.
4. Implement `useEventSystem.ts` hook for event queue, cooldown timers, max 2 active events, and phase transitions.
5. Extend `useWorldSurfaceState.ts` with `activeEvents` and `eventQueue` managed through `useEventSystem` (or merge into the store).
6. Render visual overrides for each phase (distant smoke, fire glow, region desaturation, burned aftermath) in `EventLayer.tsx`.
7. Add i18n keys for event labels and presage messages under `worldSurface.events.*`.
8. Write unit/RTL tests covering the 4-phase lifecycle, queue limits, and `WorldEventType` Zod validation.

## Success criteria and KPI targets

- `/world-surface-v3` displays a test event cycling through Presage/Threat/Event/Consequence when triggered via the debug page.
- No more than 2 events are `active` or `presage` at the same time.
- Phase transitions follow the configured durations (Presage 5–15 min, Threat 1–5 min, etc.) and are deterministic in tests.
- `eventConfig.ts` Zod schema rejects invalid event types or phases.
- Telemetry events `event_presaged`, `event_active`, `event_consequence` are emitted.
- Safeguards pass: `build:check`, lint, targeted tests, `kanban:lint`.
- Evidence log: `test-results/world-surface-v3-events-002-<YYYY-MM-DD>.log`.

## Integration points and dependencies

- **Depends on:** `WORLD-SURFACE-V3-FOUNDATION-001` (must be `Completato`).
- Reuses `useWorldSurfaceState.ts`, `worldSurfaceConfig.ts`, `WorldSurface.tsx` from Phase 1.
- Adds `event_*` telemetry through the existing `sandboxDiagnostics` or analytics system.

## Guardrails

- `.windsurf/rules/00-project-invariants.md`: config-first, Zod, i18n, JSDoc, `PersistenceService` if event queue needs persistence.
- `.windsurf/rules/10-ui-invariants.md`: Gilded Observatory tokens, `<16 ms/frame`, `@dnd-kit` not required here.
- No continuous event spam; enforce `maxActive: 2` and cooldown timers from `eventConfig.ts`.
- No page-level state transformations; keep event logic inside hooks/utils.

## Implementation Scope

### Files to create/modify

1. `src/ui/idleVillage/worldSurface/layers/EventLayer.tsx` — replace stub with phase-driven visual overlay.
2. `src/ui/idleVillage/worldSurface/utils/eventPresageSystem.ts` — `tickEvent(event, deltaMs)`, `advancePhase(event)`, `shouldPresage(event, region)`, pure lifecycle functions.
3. `src/ui/idleVillage/worldSurface/hooks/useEventSystem.ts` — queue management, spawn, tick, cleanup; consumes `useWorldSurfaceState`.
4. `src/ui/idleVillage/worldSurface/config/eventConfig.ts` — Zod schema + `WORLD_EVENT_TYPES`, `EVENT_PHASE_DURATIONS`, visual overrides.
5. `src/ui/idleVillage/worldSurface/hooks/useWorldSurfaceState.ts` — extend with `activeEvents`/`eventQueue` typed arrays and actions (or keep setters and let `useEventSystem` own slice).
6. `public/locales/en/idleVillage.json` — add `worldSurface.events.presage`, `worldSurface.events.threat`, `worldSurface.events.active`, `worldSurface.events.consequence` labels.
7. `tests/unit/idleVillage/WorldSurfaceV3Events.test.tsx` — lifecycle, queue limits, Zod validation.
8. `src/docs/docs/plans/world_surface_v3_strategic_plan.md` — tick Phase 2 checklist.

### Component reuse

- Check `src/ui/idleVillage/skins/primitives/` for overlay/backdrop primitives before creating new components.
- Reuse existing CSS animation utilities from `src/index.css` for glow/smoke effects.

### Testing

- Unit: `eventPresageSystem` phase transitions and duration calculations.
- Unit: `useEventSystem` enforces max active events and cooldown.
- Zod: `eventConfig.ts` rejects invalid configs.
- RTL: `EventLayer` renders correct visual class for `threat` phase.

## Safeguards

- `npm run lint -- src/ui/idleVillage/worldSurface tests/unit/idleVillage/WorldSurfaceV3Events.test.tsx public/locales/en/idleVillage.json` (120 s)
- `npm run test -- tests/unit/idleVillage/WorldSurfaceV3Events.test.tsx` (300 s)
- `npm run build:check` (180 s)
- `npm run kanban:lint` (30 s)
- Evidence log: `test-results/world-surface-v3-events-002-<YYYY-MM-DD>.log`

## Documentation updates

- Update `src/docs/docs/plans/world_surface_v3_strategic_plan.md` Phase 2 status and add ASCII lifecycle diagram if not present.
- Update `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` with `EventLayer` and `eventPresageSystem` status.

## Evidence log requirements

- Save full output of lint, test, build:check, kanban:lint to `test-results/world-surface-v3-events-002-<YYYY-MM-DD>.log`.

## Notes

- When picking this prompt, set the Kanban row to `In corso` with agent name and date.
- On completion, close with: `KANBAN STATUS: WORLD-SURFACE-V3-EVENTS-002 – Completato (Evidence: test-results/world-surface-v3-events-002-<YYYY-MM-DD>.log)`.
- Phase durations may be compressed in the test page for fast iteration; keep production defaults in config.
