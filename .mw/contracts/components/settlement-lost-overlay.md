---
id: settlement-lost-overlay
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/SettlementLostOverlay.tsx
scope_files:
  - src/ui/idleVillage/components/SettlementLostOverlay.tsx
fast_checks:
  - tests/unit/idleVillage/SettlementLostOverlay.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-settlement-tally
    source: director-bug
    source_ref: R-234
    statement: >-
      Settlement tally: gold and completed quests come from settled runs, once per run; a wiped run completes nothing
      (SET = B)
    test_refs:
      - tests/unit/idleVillage/settlementLostSet.test.ts
  - id: R-234-settlement-stats
    source: director-bug
    source_ref: R-234
    statement: 'Game-over stats are true: residents lost counts the dead, days is the displayed day (SET = B)'
    test_refs:
      - tests/unit/idleVillage/settlementLostSet.test.ts
  - id: R-234-settlement-lost-layer
    source: director-bug
    source_ref: R-234
    statement: The settlement-lost overlay paints above the quest check and the reward layer (SET = B)
    test_refs:
      - tests/unit/idleVillage/settlementLostSet.test.ts
---
# settlement-lost-overlay

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/SettlementLostOverlay.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/SettlementLostOverlay.tsx`.

## Scope

- `src/ui/idleVillage/components/SettlementLostOverlay.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
