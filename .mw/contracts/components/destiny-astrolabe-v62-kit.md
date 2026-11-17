---
id: destiny-astrolabe-v62-kit
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit.tsx"
scope_files:
  - "src/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit.tsx"
fast_checks:
  - tests/unit/idleVillage/destinyAstrolabeV62Kit.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: destiny-astrolabe-v62-kit.INV-1
    source: director-spec
    source_ref: R-032
    statement: >-
      Il kit ri-esporta il componente V6.2 canonico per identità, fissa la provider chain su
      `['SkinSystemProvider']` ed espone il wrapper standalone (`DestinyAstrolabeV62KitShell` /
      `DestinyAstrolabeV62Standalone`).
    test_refs:
      - tests/unit/idleVillage/destinyAstrolabeV62Kit.test.ts
---
# destiny-astrolabe-v62-kit

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit.tsx`.

## Scope

- `src/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit.tsx`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
