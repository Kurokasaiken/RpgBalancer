---
id: place-fan-geometry
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/components/gameFrame/placeFanGeometry.ts"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/placeFanGeometry.ts"
fast_checks:
  - tests/unit/idleVillage/placeFanGeometry.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: place-fan-geometry.INV-1
    source: plan
    source_ref: PLAN-117
    statement: >-
      I settori contigui dell'anello ellittico coprono i 360° al netto dei gap oro (`gapDeg`, primo
      separatore a `startAngleDeg`) — geometria pura, niente DOM.
    test_refs:
      - tests/unit/idleVillage/placeFanGeometry.test.ts
---
# place-fan-geometry

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/placeFanGeometry.ts`.

## Scope

- `src/ui/idleVillage/components/gameFrame/placeFanGeometry.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
