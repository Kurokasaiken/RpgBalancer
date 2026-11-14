---
id: c1-medallion
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/C1Medallion.tsx
scope_files:
  - src/ui/idleVillage/components/C1Medallion.tsx
  - src/ui/idleVillage/hudReal/c1RowModGeometry.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: c1-medallion.INV-1
    source: director-bug
    source_ref: R-335
    statement: >-
      medaglione mozzato: C1Medallion montava ring-fused.webp (pezzo row-module con fascia gemme tagliata al bordo sx);
      l'asset corretto e' ring.webp + C1_GEOMETRY (ornamento completo, come le colonne roster)
    test_refs: []
---
# c1-medallion

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/C1Medallion.tsx`.

## Scope

- `src/ui/idleVillage/components/C1Medallion.tsx`
- `src/ui/idleVillage/hudReal/c1RowModGeometry.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
