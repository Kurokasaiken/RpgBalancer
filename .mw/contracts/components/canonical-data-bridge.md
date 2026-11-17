---
id: canonical-data-bridge
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/frozen/_infra/CanonicalDataBridge.ts"
scope_files:
  - "src/ui/idleVillage/frozen/_infra/CanonicalDataBridge.ts"
fast_checks:
  - tests/unit/idleVillage/canonicalDataBridge.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: canonical-data-bridge.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il bridge ri-esporta hook, resolver e config canonici per identità (stesso riferimento del modulo
      canonico), così i kit frozen non possono mai derivere su una copia privata — e non pubblica nessun
      fixture mock («no mocks» per costruzione).
    test_refs:
      - tests/unit/idleVillage/canonicalDataBridge.test.ts
---
# canonical-data-bridge

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/frozen/_infra/CanonicalDataBridge.ts`.

## Scope

- `src/ui/idleVillage/frozen/_infra/CanonicalDataBridge.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
