---
id: index-primitives
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/skins/primitives/index.ts
scope_files:
  - src/ui/idleVillage/skins/primitives/index.ts
fast_checks:
  - tests/unit/idleVillage/cinemaFx.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: index-primitives.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il barrel skins/primitives re-esporta la superficie primitives (EdgeFlash, Letterbox, TypewriterText, fxForBeat):
      i consumer la importano da un solo punto e i primitivi renderizzano il comportamento atteso.
    test_refs:
      - tests/unit/idleVillage/cinemaFx.test.tsx
---

# index-primitives

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/skins/primitives/index.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/skins/primitives/index.ts`.

## Scope

- `src/ui/idleVillage/skins/primitives/index.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
