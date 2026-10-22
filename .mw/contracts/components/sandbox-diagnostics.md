---
id: sandbox-diagnostics
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/utils/sandboxDiagnostics.ts
scope_files:
  - src/ui/idleVillage/utils/sandboxDiagnostics.ts
fast_checks:
  - tests/unit/idleVillage/LocationDeck.test.tsx
  - tests/unit/idleVillage/useTheaterController.test.ts
  - tests/utils/sandboxDiagnostics.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: sandbox-diagnostics.INV-1
    source: plan
    source_ref: PLAN-054
    statement: Le diagnostiche sandbox renderizzano i log per canale, filtrano per tab selezionata e supportano export/clear.
    test_refs:
      - tests/utils/sandboxDiagnostics.test.tsx
---

# sandbox-diagnostics

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/utils/sandboxDiagnostics.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/utils/sandboxDiagnostics.ts`.

## Scope

- `src/ui/idleVillage/utils/sandboxDiagnostics.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
