# WORLD-SURFACE-V3-UNDERWATER-004 — World Surface V3 Underwater (Depth & Caustics)

## Header

- **Task ID:** WORLD-SURFACE-V3-UNDERWATER-004
- **Title:** World Surface V3 Underwater — Depth, Caustics & Silhouettes
- **Plan reference:** `src/docs/docs/plans/world_surface_v3_strategic_plan.md` §Phase 4
- **Estimated duration:** 45–60 min
- **Execution hint:** verified

## Objectives

1. Replace the `UnderwaterLayer.tsx` stub with an underwater depth visualization.
2. Implement `causticEffects.ts` for moving light refraction patterns and depth-based color shifts (blue → dark blue → black).
3. Create `config/underwaterConfig.ts` with Zod schemas for surface ripples, caustics, depth layers, and rare underwater wonders (Kraken shadow, whale breach, ghost ship, sunken ruins).
4. Implement `useUnderwaterSystem.ts` hook driving surface ripples, caustic animation cycle, and underwater rare events.
5. Render surface ripples, foam, caustics, depth silhouettes, and seaweed sway in `UnderwaterLayer.tsx`.
6. Integrate underwater wonders (Kraken, Whale, Ghost Ship) with `useWonderSystem` (reuse wonder registry with `underwater` biome).
7. Add i18n keys under `worldSurface.underwater.*` for depth labels and rare discovery messages.
8. Write unit/RTL tests for caustic determinism, depth color interpolation, and underwater rare event triggers.

## Success criteria and KPI targets

- `/world-surface-v3` renders an `UnderwaterLayer` with animated surface ripples and caustic overlay when the viewport is over ocean tiles.
- Depth color shift is smooth across configured depth levels.
- Caustic cycles follow `underwaterConfig.ts` timing (0.5–1.0 opacity, moving patterns).
- Underwater wonders spawn via the shared `wonderSpawner` with `biome: 'underwater'` and last 3–8 s.
- `underwaterConfig.ts` Zod schema validates depth thresholds and caustic parameters.
- No standalone `.css` files; all visual tokens come from skin config or `src/index.css`.
- Safeguards pass: `build:check`, lint, targeted tests, `kanban:lint`.
- Evidence log: `test-results/world-surface-v3-underwater-004-<YYYY-MM-DD>.log`.

## Integration points and dependencies

- **Depends on:** `WORLD-SURFACE-V3-FOUNDATION-001` (must be `Completato`).
- Optional synergy with `WORLD-SURFACE-V3-WONDERS-003` for shared `wonderSpawner` underwater entries.
- Reuses `useWorldSurfaceState.ts`, `WorldSurface.tsx`, `worldSurfaceConfig.ts` from Phase 1.

## Guardrails

- `.windsurf/rules/00-project-invariants.md`: config-first, Zod, i18n, JSDoc.
- `.windsurf/rules/10-ui-invariants.md`: Gilded Observatory tokens, `<16 ms/frame`, no standalone `.css` files.
- Underwater effects must be subtle; caustics should not dominate the map.
- No gameplay impact from underwater visuals.

## Implementation Scope

### Files to create/modify

1. `src/ui/idleVillage/worldSurface/layers/UnderwaterLayer.tsx` — replace stub with surface, caustic, depth, silhouette sublayers.
2. `src/ui/idleVillage/worldSurface/utils/causticEffects.ts` — pure functions for caustic grid/phase and depth color interpolation.
3. `src/ui/idleVillage/worldSurface/hooks/useUnderwaterSystem.ts` — ripple/caustic animation loop, rare event scheduling; consumes `useWorldSurfaceState`.
4. `src/ui/idleVillage/worldSurface/config/underwaterConfig.ts` — Zod schema + `UNDERWATER_CONFIG` for surface, caustics, depth thresholds, underwater wonder allowlist.
5. `src/ui/idleVillage/worldSurface/hooks/useWorldSurfaceState.ts` — add `underwater` slice (ripples, caustic phase, active underwater wonder) and setters.
6. `public/locales/en/idleVillage.json` — add `worldSurface.underwater.surface`, `worldSurface.underwater.caustics`, `worldSurface.underwater.depth.*` keys.
7. `tests/unit/idleVillage/WorldSurfaceV3Underwater.test.tsx` — caustic determinism, depth color, underwater wonder triggers.
8. `src/docs/docs/plans/world_surface_v3_strategic_plan.md` — tick Phase 4 checklist.

### Component reuse

- Check `src/ui/idleVillage/skins/primitives/` for overlay/backdrop primitives before creating new components.
- Reuse existing CSS gradient/animation utilities from `src/index.css`.

### Testing

- Unit: `causticEffects` returns deterministic phases and depth colors.
- Unit: `useUnderwaterSystem` respects `UNDERWATER_CONFIG` animation cycles.
- Zod: `underwaterConfig.ts` rejects invalid depth or caustic values.
- RTL: `UnderwaterLayer` renders caustic overlay and active wonder.

## Safeguards

- `npm run lint -- src/ui/idleVillage/worldSurface tests/unit/idleVillage/WorldSurfaceV3Underwater.test.tsx public/locales/en/idleVillage.json` (120 s)
- `npm run test -- tests/unit/idleVillage/WorldSurfaceV3Underwater.test.tsx` (300 s)
- `npm run build:check` (180 s)
- `npm run kanban:lint` (30 s)
- Evidence log: `test-results/world-surface-v3-underwater-004-<YYYY-MM-DD>.log`

## Documentation updates

- Update `src/docs/docs/plans/world_surface_v3_strategic_plan.md` Phase 4 status.
- Update `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` with `UnderwaterLayer` and `causticEffects` status.

## Evidence log requirements

- Save full output of lint, test, build:check, kanban:lint to `test-results/world-surface-v3-underwater-004-<YYYY-MM-DD>.log`.

## Notes

- When picking this prompt, set the Kanban row to `In corso` with agent name and date.
- On completion, close with: `KANBAN STATUS: WORLD-SURFACE-V3-UNDERWATER-004 – Completato (Evidence: test-results/world-surface-v3-underwater-004-<YYYY-MM-DD>.log)`.
- Keep `UnderwaterLayer` behind the water depth parallax multiplier so it moves subtly with the world.
