---
id: quest-engine-text
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/questS1Lab/questEngineText.ts"
scope_files:
  - "src/ui/idleVillage/questS1Lab/questEngineText.ts"
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: quest-engine-text.INV-1
    source: director-bug
    source_ref: R-258
    statement: >-
      Il catalogo engine text (chiavi en + traduzioni it-IT) è testo player-facing: nessuna entry stampa «pp» — le
      variazioni di probabilità usano «%».
    test_refs:
      - tests/unit/idleVillage/questEngineText.test.ts
      - tests/unit/idleVillage/questPlannerWhyNames.test.tsx
---
# quest-engine-text

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/questS1Lab/questEngineText.ts`.

## Scope

- `src/ui/idleVillage/questS1Lab/questEngineText.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
