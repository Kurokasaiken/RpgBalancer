---
id: sandbox-timing-context
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/hooks/sandboxTimingContext.ts"
scope_files:
  - "src/ui/idleVillage/hooks/sandboxTimingContext.ts"
fast_checks:
  - tests/unit/idleVillage/sandboxTimingContext.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: sandbox-timing-context.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Senza provider il context risolve a `null` — i consumatori degradano gracefully invece di
      assumere un sandbox clock; un'api fornita arriva verbatim (`scheduleTimeout` inclusa).
    test_refs:
      - tests/unit/idleVillage/sandboxTimingContext.test.tsx
---
# sandbox-timing-context

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/hooks/sandboxTimingContext.ts`.

## Scope

- `src/ui/idleVillage/hooks/sandboxTimingContext.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
