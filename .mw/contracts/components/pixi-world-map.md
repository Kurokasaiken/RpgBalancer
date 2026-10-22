---
id: pixi-world-map
kind: component
role: ui-component
tier: 1
root_file: src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx
scope_files:
  - src/ui/idleVillage/config/atmosphereAssets.ts
  - src/ui/idleVillage/config/generatedClouds.ts
  - src/ui/idleVillage/config/seaMarksConfig.ts
  - src/ui/idleVillage/config/seaWonders.ts
  - src/ui/idleVillage/hooks/useWorldSurface.ts
  - src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx
  - src/ui/idleVillage/pixiSpike/mapFitRuntime.ts
  - src/ui/idleVillage/pixiSpike/regionOutline.ts
  - src/ui/idleVillage/pixiSpike/seabedTexture.ts
fast_checks:
  - tests/unit/idleVillage/WorldSurfaceLayerOrder.test.tsx
  - tests/unit/idleVillage/WorldSurfaceRenderer.test.tsx
  - tests/unit/idleVillage/regionOutline.test.ts
  - tests/unit/idleVillage/useWorldSurface.test.ts
  - tests/unit/idleVillage/validateWorldSurfaceAssets.test.ts
  - tests/unit/idleVillage/worldSurfaceRendererStrategy.test.ts
e2e_checks:
  - tests/e2e/idleVillage/questJourneyRoute.spec.ts
e2e_trigger_globs:
  - src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx
invariants:
  - id: pixi-world-map.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      La world-surface della mappa carica e valida il manifest via useWorldSurface: manifest invalido o fetch fallito →
      errore esplicito; cameraConfig esposta dal manifest.
    test_refs:
      - tests/unit/idleVillage/useWorldSurface.test.ts
  - id: pixi-world-map.INV-2
    source: plan
    source_ref: PLAN-053
    statement: >-
      World-space route overlays use the same camera transform as the map and render below the event shroud.
    test_refs:
      - tests/e2e/idleVillage/questJourneyRoute.spec.ts
---

# pixi-world-map

Unità `ui-component` (tier 1, ctr-reference) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 1, ctr-reference) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`.

## Scope

- `src/ui/idleVillage/config/atmosphereAssets.ts`
- `src/ui/idleVillage/config/generatedClouds.ts`
- `src/ui/idleVillage/config/seaMarksConfig.ts`
- `src/ui/idleVillage/config/seaWonders.ts`
- `src/ui/idleVillage/config/worldSurfaceConfig.ts`
- `src/ui/idleVillage/hooks/useWorldSurface.ts`
- `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`
- `src/ui/idleVillage/pixiSpike/mapFitRuntime.ts`
- `src/ui/idleVillage/pixiSpike/regionOutline.ts`
- `src/ui/idleVillage/pixiSpike/seabedTexture.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
