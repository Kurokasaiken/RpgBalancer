---
id: destiny-astrolabe-v62
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62.tsx
scope_files:
  - src/ui/idleVillage/components/destinyAstrolabeV6/astrolabe-ui.css
  - src/ui/idleVillage/components/destinyAstrolabeV6/astrolabe.css
  - src/ui/idleVillage/components/destinyAstrolabeV6/markup.ts
  - src/ui/idleVillage/components/destinyAstrolabeV6/useAstrolabeAudio.ts
  - src/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62.tsx
  - src/ui/idleVillage/components/destinyAstrolabeV62/ballGuidance.ts
  - src/ui/idleVillage/components/destinyAstrolabeV62/engine.ts
  - src/ui/idleVillage/components/destinyAstrolabeV62/tarGooRenderer.ts
  - src/ui/idleVillage/components/destinyAstrolabeV62/tentacles.ts
fast_checks:
  - tests/unit/destinyAstrolabeV62/tarGoo.test.ts
  - tests/unit/idleVillage/astrolabe/ballGuidance.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-241-goo-raster-scale
    source: director-bug
    source_ref: R-241
    statement: >-
      Jank skill check: il tar goo SDF WebGL2 renderizzava a full-res 800px + drawImage sync per frame → stalli GPU (p95
      66-116ms in prod). Fix: rendering.gooScale config (default 0.5), shader lavora in field space via uFieldScale
    test_refs:
      - tests/unit/idleVillage/questS1Lab/tarGooConfig.gooScale.test.ts
  - id: R-234-astrolabe-valley-per-tip
    source: director-bug
    source_ref: R-234
    statement: Each valley of the V6.2 star reads its two neighbouring tips for family and depth (no single global valley)
    test_refs:
      - tests/unit/destinyAstrolabeV62/starProfile.test.ts
  - id: R-234-astrolabe-no-ghost
    source: director-bug
    source_ref: R-234
    statement: 'No hollow ghost petal past the tar wall: the out-of-arena outline is clipped to the tar mask'
    test_refs:
      - tests/unit/destinyAstrolabeV62/starProfile.test.ts
---
# destiny-astrolabe-v62

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62.tsx`.

## Scope

- `src/ui/idleVillage/components/destinyAstrolabeV6/astrolabe-ui.css`
- `src/ui/idleVillage/components/destinyAstrolabeV6/astrolabe.css`
- `src/ui/idleVillage/components/destinyAstrolabeV6/markup.ts`
- `src/ui/idleVillage/components/destinyAstrolabeV6/useAstrolabeAudio.ts`
- `src/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62.tsx`
- `src/ui/idleVillage/components/destinyAstrolabeV62/ballGuidance.ts`
- `src/ui/idleVillage/components/destinyAstrolabeV62/engine.ts`
- `src/ui/idleVillage/components/destinyAstrolabeV62/tarGooRenderer.ts`
- `src/ui/idleVillage/components/destinyAstrolabeV62/tentacles.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
