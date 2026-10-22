---
id: quest-skill-check-overlay
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/QuestSkillCheckOverlay.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/QuestSkillCheckOverlay.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: quest-skill-check-overlay.INV-1
    source: director-bug
    source_ref: R-241
    statement: 'R-241 B3b: idem sull''overlay — board click incondizionato su skipToResult; deve essere throw-then-skip'
    test_refs: 
      - tests/unit/idleVillage/questSkillCheckOverlay.throwClick.test.tsx
---
# quest-skill-check-overlay

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/QuestSkillCheckOverlay.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/QuestSkillCheckOverlay.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/QuestSkillCheckOverlay.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
