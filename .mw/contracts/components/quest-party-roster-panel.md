---
id: quest-party-roster-panel
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/QuestPartyRosterPanel.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/QuestPartyRosterPanel.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-239-roster-counter
    source: director-bug
    source_ref: R-239
    statement: roster counter «N/N» ambiguo (alive vs total senza label) e titolo ala troncato senza nome completo
    test_refs:
      - tests/unit/idleVillage/questPartyRosterCounter.test.tsx
  - id: R-241-roster-status-only
    source: director-bug
    source_ref: R-241
    statement: >-
      R-241 B5: PgCard montata senza compatibilityState (undefined !== 'idle') dipingeva «Nessuno slot compatibile» su
      ogni membro — il party roster della quest e' status-only (away/injured/dead, dead greyed)
    test_refs:
      - tests/unit/idleVillage/questPartyRosterPanel.compat.test.tsx
---
# quest-party-roster-panel

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/QuestPartyRosterPanel.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/QuestPartyRosterPanel.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/QuestPartyRosterPanel.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
