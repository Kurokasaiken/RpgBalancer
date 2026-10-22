---
id: quest-epilogue
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/QuestEpilogue.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/QuestEpilogue.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-epilogue-per-person
    source: director-bug
    source_ref: R-234
    statement: >-
      Titles and diseases are granted to a person: the authored grant names its recipient and the report line carries
      the member id (T-C6)
    test_refs:
      - tests/unit/idleVillage/questEpilogue.recipient.test.ts
---
# quest-epilogue

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/QuestEpilogue.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/QuestEpilogue.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/QuestEpilogue.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
