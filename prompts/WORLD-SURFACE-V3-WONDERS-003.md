# WORLD-SURFACE-V3-WONDERS-003 — World Surface V3 Wonders (Rare Moments)

## Header

- **Task ID:** WORLD-SURFACE-V3-WONDERS-003
- **Title:** World Surface V3 Wonders — Rare Moments & Discoveries
- **Plan reference:** `src/docs/docs/plans/world_surface_v3_strategic_plan.md` §Phase 3
- **Estimated duration:** 45–60 min
- **Execution hint:** verified

## Objectives

1. Replace the `WonderLayer.tsx` stub with a seeded, rare-spawn wonder renderer.
2. Implement `wonderSpawner.ts` RNG-driven spawner (Kraken, Whale, Dragon, Meteor, Aurora, Ghost Ship, Massive Storm, Flock of Birds) using a deterministic seed.
3. Create `config/wonderConfig.ts` with Zod schemas for wonder types, rarity intervals (10–45 min), durations (2–20 s), biome constraints, and telemetry flags.
4. Implement `useWonderSystem.ts` hook tracking `nextWonderTime`, `wonderHistory`, and active wonder; no gameplay impact.
5. Render wonder visuals in `WonderLayer.tsx` with short CSS animation sequences.
6. Emit `wonder_spotted` telemetry when a wonder becomes visible.
7. Add i18n keys under `worldSurface.wonders.*` for type labels and discovery messages.
8. Write unit/RTL tests for spawn timing, biome filtering, and Zod config validation.

## Success criteria and KPI targets

- A wonder spawns no more than once per configured interval and lasts between 2–20 s.
- Wonders may be missed entirely (no guarantee they are visible).
- `wonderSpawner.ts` is deterministic given a seed; tests reproduce the same spawn schedule.
- No more than one wonder active at a time (spatial + rarity rule).
- `wonderConfig.ts` Zod schema validates intervals, durations, and biome allowlists.
- `wonder_spotted` telemetry payload includes `wonderType`, `biome`, `duration`, `timestamp`.
- Safeguards pass: `build:check`, lint, targeted tests, `kanban:lint`.
- Evidence log: `test-results/world-surface-v3-wonders-003-<YYYY-MM-DD>.log`.

## Integration points and dependencies

- **Depends on:** `WORLD-SURFACE-V3-FOUNDATION-001` (must be `Completato`).
- Reuses `useWorldSurfaceState.ts`, `WorldSurface.tsx`, `worldSurfaceConfig.ts` from Phase 1.
- Wonders are pure visual; no gameplay state mutation.

## Guardrails

- `.windsurf/rules/00-project-invariants.md`: config-first, Zod, i18n, JSDoc.
- `.windsurf/rules/10-ui-invariants.md`: Gilded Observatory tokens, `<16 ms/frame`, no standalone `.css` files.
- Wonders have no gameplay impact and do not trigger events/quests.
- No wonder visibility guarantee; spawn locations may be off-screen.
- Use seeded RNG so replays are deterministic.

## Implementation Scope

### Files to create/modify

1. `src/ui/idleVillage/worldSurface/layers/WonderLayer.tsx` — replace stub with active wonder animation layer.
2. `src/ui/idleVillage/worldSurface/utils/wonderSpawner.ts` — `getNextWonder(seed, now, biome)`, `selectWonderType(config, rng)`, `isWonderVisible(state)`.
3. `src/ui/idleVillage/worldSurface/hooks/useWonderSystem.ts` — spawn scheduling, history, active wonder state; consumes `useWorldSurfaceState`.
4. `src/ui/idleVillage/worldSurface/config/wonderConfig.ts` — Zod schema + `WONDER_TYPES` registry with intervals/durations/biomes.
5. `src/ui/idleVillage/worldSurface/hooks/useWorldSurfaceState.ts` — add `nextWonderTime`, `wonderHistory`, `activeWonder` fields and setters.
6. `public/locales/en/idleVillage.json` — add `worldSurface.wonders.*` labels and discovery messages.
7. `tests/unit/idleVillage/WorldSurfaceV3Wonders.test.tsx` — spawn determinism, interval enforcement, biome filtering.
8. `src/docs/docs/plans/world_surface_v3_strategic_plan.md` — tick Phase 3 checklist.

### Component reuse

- Check `src/ui/atoms/` and `src/ui/idleVillage/skins/primitives/` for overlay/portal primitives before creating new wrappers.
- Reuse existing CSS animation classes (fade, scale, translate) from `src/index.css` for wonder sequences.

### Testing

- Unit: `wonderSpawner` returns same schedule for same seed.
- Unit: `wonderSpawner` filters wonders by biome and enforces cooldown intervals.
- Zod: `wonderConfig.ts` rejects invalid rarity/duration combinations.
- RTL: `WonderLayer` renders an active wonder and disappears after duration.

## Safeguards

- `npm run lint -- src/ui/idleVillage/worldSurface tests/unit/idleVillage/WorldSurfaceV3Wonders.test.tsx public/locales/en/idleVillage.json` (120 s)
- `npm run test -- tests/unit/idleVillage/WorldSurfaceV3Wonders.test.tsx` (300 s)
- `npm run build:check` (180 s)
- `npm run kanban:lint` (30 s)
- Evidence log: `test-results/world-surface-v3-wonders-003-<YYYY-MM-DD>.log`

## Documentation updates

- Update `src/docs/docs/plans/world_surface_v3_strategic_plan.md` Phase 3 status.
- Update `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` with `WonderLayer` and `wonderSpawner` status.

## Evidence log requirements

- Save full output of lint, test, build:check, kanban:lint to `test-results/world-surface-v3-wonders-003-<YYYY-MM-DD>.log`.

## Notes

- When picking this prompt, set the Kanban row to `In corso` with agent name and date.
- On completion, close with: `KANBAN STATUS: WORLD-SURFACE-V3-WONDERS-003 – Completato (Evidence: test-results/world-surface-v3-wonders-003-<YYYY-MM-DD>.log)`.
- Keep wonder durations configurable for trailer capture if needed.
