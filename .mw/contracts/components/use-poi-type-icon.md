---
id: use-poi-type-icon
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/components/gameFrame/usePoiTypeIcon.ts"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/usePoiTypeIcon.ts"
fast_checks:
  - tests/unit/idleVillage/usePoiTypeIcon.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: use-poi-type-icon.INV-1
    source: plan
    source_ref: PLAN-117
    statement: >-
      Il glifo dipinto di ogni famiglia POI vive a `/assets/ui/poi/icon_<type>.webp`; i file assenti
      ricadono sulla croce dentro l'hook.
    test_refs:
      - tests/unit/idleVillage/usePoiTypeIcon.test.ts
---
# use-poi-type-icon

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/usePoiTypeIcon.ts`.

## Scope

- `src/ui/idleVillage/components/gameFrame/usePoiTypeIcon.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
