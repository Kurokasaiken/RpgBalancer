---
id: settlement-tally
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/settlement/settlementTally.ts
scope_files:
  - src/ui/idleVillage/settlement/settlementTally.ts
fast_checks:
  - tests/unit/idleVillage/settlementLostSet.test.ts
  - tests/unit/idleVillage/settlementTally.wipe.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: settlement-tally.INV-1
    source: plan
    source_ref: PLAN-067
    statement: >-
      Una run wipe non aggiunge nessuna quest completata al tally — solo una run vinta contribuisce
      oro del villaggio e quest completata, una sola volta per run.
    test_refs:
      - tests/unit/idleVillage/settlementTally.wipe.test.ts
---

# settlement-tally

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/settlement/settlementTally.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/settlement/settlementTally.ts`.

## Scope

- `src/ui/idleVillage/settlement/settlementTally.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
