---
id: poi-sigillo
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/components/gameFrame/poiSigillo.ts"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/poiSigillo.ts"
fast_checks:
  - tests/unit/idleVillage/poiSigillo.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: poi-sigillo.INV-1
    source: plan
    source_ref: PLAN-117
    statement: >-
      Le classi di taglia del Sigillo sono un fattore sulla base authored (55 px = M): `poiSizePx`
      mappa S/M/L a 44 / 55 / 69 px, i token `--skin-poi-size-s/-m/-l`.
    test_refs:
      - tests/unit/idleVillage/poiSigillo.test.tsx
---
# poi-sigillo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/poiSigillo.ts`.

## Scope

- `src/ui/idleVillage/components/gameFrame/poiSigillo.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
