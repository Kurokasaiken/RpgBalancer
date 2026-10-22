---
id: atmosphere-layer
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/questS1Lab/render/AtmosphereLayer.tsx
scope_files:
  - src/ui/idleVillage/questS1Lab/render/AtmosphereLayer.tsx
fast_checks:
  - tests/unit/idleVillage/questCinematics/atmosphereLayer.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-241-atmosphere-composited
    source: director-bug
    source_ref: R-241
    statement: >-
      Jank skill check: il layer atmosfera scriveva width/height/mask-* per frame (2443 mutazioni in 10s → layout+paint
      continui, p95 gap 66-116ms). Fix: rAF loop solo transform/opacity compositati + skip maschere identiche
    test_refs:
      - tests/unit/idleVillage/questCinematics/atmosphereLayer.composited.test.tsx
---
# atmosphere-layer

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/questS1Lab/render/AtmosphereLayer.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/questS1Lab/render/AtmosphereLayer.tsx`.

## Scope

- `src/ui/idleVillage/questS1Lab/render/AtmosphereLayer.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
