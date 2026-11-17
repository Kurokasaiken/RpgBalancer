---
id: overlay-stack
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/components/gameFrame/overlayStack.ts"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/overlayStack.ts"
fast_checks:
  - tests/unit/idleVillage/overlayStack.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: overlay-stack.INV-1
    source: plan
    source_ref: PLAN-040
    statement: >-
      L'ordine di registrazione È l'ordine di stacking: solo l'overlay topmost riceve Escape;
      `unregisterOverlay` ripristina quello sotto ed è no-op su un id assente.
    test_refs:
      - tests/unit/idleVillage/overlayStack.test.ts
---
# overlay-stack

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/overlayStack.ts`.

## Scope

- `src/ui/idleVillage/components/gameFrame/overlayStack.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
