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
  - src/ui/idleVillage/components/destinyAstrolabeV62/starProfile.ts
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
    statement: >-
      The silhouette family is board-uniform (v37/R-275, majority vote over raw stat/difficulty margins);
      each valley still reads its two neighbouring tips — for DEPTH only, inside the family band
    test_refs:
      - tests/unit/destinyAstrolabeV62/starProfile.test.ts
  - id: R-234-astrolabe-no-ghost
    source: director-bug
    source_ref: R-234
    statement: 'No hollow ghost petal past the tar wall: the out-of-arena outline is clipped to the tar mask'
    test_refs:
      - tests/unit/destinyAstrolabeV62/starProfile.test.ts
  - id: destiny-astrolabe-v62.INV-1
    source: director-bug
    source_ref: R-275
    statement: >-
      Mezzo-fiore nelle quest: valleyProfiles disaccoppia mix/depth (valle 0.3675 + punta tonda) e lascia famiglie miste
      per valle; v37 impone famiglia uniforme per board a maggioranza (10%/35%) con morph accoppiato
    test_refs:
      - tests/unit/destinyAstrolabeV62/starProfile.test.ts
  - id: R-275-astrolabe-no-hybrid
    source: director-bug
    source_ref: R-275
    statement: >-
      No half-flower and no mixed board: valley depth is morph-coupled to the tip family (rounded tip only on
      a high valley, sharp tip only on a low valley) and the mix is identical on every valley of the board
    test_refs:
      - tests/unit/destinyAstrolabeV62/starProfile.test.ts
  - id: R-275-astrolabe-family-thresholds
    source: director-bug
    source_ref: R-275
    statement: >-
      Board family by majority over raw stat/difficulty margins (v37): flower at or below +10%, star strictly
      above +10%, lean star strictly above +35%; the lean star stays in the admissible set
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
