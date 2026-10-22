---
id: quest-outcome-toast
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/QuestOutcomeToast.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/QuestOutcomeToast.tsx
fast_checks:
  - tests/unit/idleVillage/questOutcomeToast.test.tsx
  - tests/unit/idleVillage/questRunWindow.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-259-toast-right
    source: director-bug
    source_ref: R-259
    statement: >-
      Le toast esito s'ancre a droite (anchor right + slide-in) comme ne du skill check, contenu identique au check
      resolu
    test_refs:
      - tests/unit/idleVillage/questOutcomeToast.anchor.test.tsx
  - id: R-259-toast-identical
    source: director-bug
    source_ref: R-259
    statement: >-
      «il msg popup deve essere identico all'esito dello skill check»: il toast condivide il body del verdetto
      (QuestVerdictCardBody — chip verdict + chip harm + flavor + authored) con la card della colonna; harmLines mai in
      prosa (R-234)
    test_refs:
      - tests/unit/idleVillage/questOutcomeToast.test.tsx
---
# quest-outcome-toast

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/QuestOutcomeToast.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/QuestOutcomeToast.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/QuestOutcomeToast.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
