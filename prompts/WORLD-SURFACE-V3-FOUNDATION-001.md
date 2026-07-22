# WORLD-SURFACE-V3-FOUNDATION-001 — World Surface V3 Foundation (Parallax + Breath)

## Header

- **Task ID:** WORLD-SURFACE-V3-FOUNDATION-001
- **Title:** World Surface V3 Foundation — Parallax + Breathing Animation
- **Plan reference:** `src/docs/docs/plans/world_surface_v3_strategic_plan.md` §Phase 1
- **Estimated duration:** 45–60 min
- **Execution hint:** verified

## Objectives

1. Scaffold the `src/ui/idleVillage/worldSurface/` folder structure for the 5-layer perception hierarchy.
2. Implement `WorldSurface.tsx` composing `WorldLayer`, `BreathLayer` and stub `EventLayer`, `WonderLayer`, `UnderwaterLayer`.
3. Implement `ParallaxController.ts` and `useParallax.ts` for camera-relative depth multipliers (clouds 1.20×, atmosphere 1.10×, frame 1.02×, world 1.00×, water depth 0.90×, underwater 0.75×).
4. Implement `useBreathAnimation.ts` and `BreathLayer.tsx` for unconscious cloud/fog/water/tree motion (4–8 s cycles, ±2–4 px amplitude, ±10–15 % opacity).
5. Define `worldSurfaceConfig.ts` with a Zod schema covering parallax, breath timings, calibration (80/15/5), and placeholder config slots for events/wonders/underwater.
6. Create `useWorldSurfaceState.ts` Zustand store exposing `mousePos`, `parallaxOffset`, `breathPhase`, and stub arrays `events`, `wonders`, `underwater` with typed setters.
7. Add `/world-surface-v3` test page (`WorldSurfaceV3Page.tsx`) and wire it into `TestHub.tsx` EXTRA_PAGES.
8. Add i18n keys under `worldSurface.*` in `public/locales/en/idleVillage.json`.
9. Write unit/RTL tests for `ParallaxController`, `useBreathAnimation` and `BreathLayer`.

## Success criteria and KPI targets

- `/world-surface-v3` renders the base world layer and breathing overlay without console errors.
- Parallax offset follows mouse position and stays clamped within ±40 px.
- Breathing cycles are deterministic and do not exceed 16 ms per frame.
- Zod schema validates the exported `WORLD_SURFACE_CONFIG` object.
- `useWorldSurfaceState` initializes with typed empty slices for events/wonders/underwater.
- Safeguards pass: `build:check`, lint, targeted unit tests, `kanban:lint`.
- Evidence log: `test-results/world-surface-v3-foundation-001-<YYYY-MM-DD>.log`.

## Integration points and dependencies

- No hard dependencies; this is Phase 1.
- Reuses `@dnd-kit` only if the test page needs drag handles later; not required here.
- Integrates with `TestHub.tsx` EXTRA_PAGES for runtime verification.

## Guardrails

- `.windsurf/rules/00-project-invariants.md`: `PersistenceService` if state is persisted (store may be runtime-only for now), config-first with Zod, i18n (`idleVillage`), JSDoc.
- `.windsurf/rules/10-ui-invariants.md`: Gilded Observatory tokens, `<16 ms/frame`, no standalone `.css` files.
- No continuous animation outside `BreathLayer`; WorldLayer stays static.
- No hardcoded timing/colors; read from `worldSurfaceConfig.ts`.

## Implementation Scope

### Files to create/modify

1. `src/ui/idleVillage/worldSurface/WorldSurface.tsx` — main orchestrator, renders layer stack and propagates `parallaxOffset` + `breathPhase`.
2. `src/ui/idleVillage/worldSurface/layers/WorldLayer.tsx` — static terrain/cities/roads layer, reads `worldSurfaceConfig` for base opacity.
3. `src/ui/idleVillage/worldSurface/layers/BreathLayer.tsx` — clouds/fog/water/tree canopy motion layer, uses `useBreathAnimation`.
4. `src/ui/idleVillage/worldSurface/layers/EventLayer.tsx` — stub (render `null`) so later phases replace it without editing `WorldSurface.tsx`.
5. `src/ui/idleVillage/worldSurface/layers/WonderLayer.tsx` — stub.
6. `src/ui/idleVillage/worldSurface/layers/UnderwaterLayer.tsx` — stub.
7. `src/ui/idleVillage/worldSurface/layers/ParallaxController.ts` — pure functions `calculateParallaxOffset(clamped mouse position, multipliers, bounds)`.
8. `src/ui/idleVillage/worldSurface/hooks/useParallax.ts` — mouse listener + `requestAnimationFrame` throttling.
9. `src/ui/idleVillage/worldSurface/hooks/useBreathAnimation.ts` — sine/cosine phase driver, returns `breathPhase` 0–1 per element.
10. `src/ui/idleVillage/worldSurface/hooks/useWorldSurfaceState.ts` — Zustand store with `setEvents`, `setWonders`, `setUnderwater` typed setters.
11. `src/ui/idleVillage/worldSurface/config/worldSurfaceConfig.ts` — Zod schema + exported default config (parallax, breath, calibration, event/wonder/underwater optional placeholders).
12. `src/ui/idleVillage/worldSurface/config/worldSurfaceTypes.ts` — shared interfaces for `EventInstance`, `WonderInstance`, `UnderwaterState` so later phases import them.
13. `src/ui/idleVillage/worldSurface/pages/WorldSurfaceV3Page.tsx` — test page wrapping `WorldSurface`.
14. `src/ui/idleVillage/TestHub.tsx` — add `/world-surface-v3` to EXTRA_PAGES.
15. `public/locales/en/idleVillage.json` — add `worldSurface.title`, `worldSurface.breath.*`, `worldSurface.parallax.*` keys.
16. `tests/unit/idleVillage/WorldSurfaceV3Foundation.test.tsx` — RTL + unit coverage.

### Component reuse

- Check `src/ui/atoms/`, `src/ui/fantasy/atoms/`, `src/ui/idleVillage/skins/primitives/` before creating wrappers.
- Reuse existing `FantasyLayout` or `observatory-page` container classes from `src/index.css`.

### Testing

- Unit: `ParallaxController` multipliers and clamping.
- Unit: `useBreathAnimation` deterministic phase progression.
- RTL: `WorldSurfaceV3Page` renders layers and breathing element.
- Zod: `WORLD_SURFACE_CONFIG` passes/fails validation with bad data.

## Safeguards

- `npm run lint -- src/ui/idleVillage/worldSurface src/ui/idleVillage/TestHub.tsx tests/unit/idleVillage/WorldSurfaceV3Foundation.test.tsx public/locales/en/idleVillage.json` (120 s)
- `npm run test -- tests/unit/idleVillage/WorldSurfaceV3Foundation.test.tsx` (300 s)
- `npm run build:check` (180 s)
- `npm run kanban:lint` (30 s)
- Evidence log: `test-results/world-surface-v3-foundation-001-<YYYY-MM-DD>.log`

## Documentation updates

- Update `src/docs/docs/plans/world_surface_v3_strategic_plan.md` Phase 1 checkboxes and status.
- Update `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` if new components reach `candidate` status after verification.

## Evidence log requirements

- Save full output of lint, test, build:check, kanban:lint to `test-results/world-surface-v3-foundation-001-<YYYY-MM-DD>.log`.

## Notes

- When picking this prompt, set the Kanban row to `In corso` with agent name and date.
- On completion, close with: `KANBAN STATUS: WORLD-SURFACE-V3-FOUNDATION-001 – Completato (Evidence: test-results/world-surface-v3-foundation-001-<YYYY-MM-DD>.log)`.
