---
id: quest-expedition-detail
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/quests/QuestExpeditionDetail.tsx
scope_files:
  - src/ui/idleVillage/quests/QuestExpeditionDetail.tsx
fast_checks:
  - tests/unit/idleVillage/questExpeditionBag.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: PLAN-073-bag-ledger-binding
    source: plan
    source_ref: PLAN-073
    statement: >-
      La bisaccia del planner è una vista del ledger globale `useVillageStashStore.bags[poi.id]`: click su slot
      occupato = release; slot = droppable `bag-slot:{poi}:{i}` (assign su libero, swap atomico su occupato);
      item packed = draggable `bag-item:{poi}:{i}` verso `stash-dropzone`; header espone release-all per-owner;
      le bozze persistono alla chiusura fino a release-all/commitRun.
    test_refs:
      - tests/unit/idleVillage/villageStashLedger.test.ts
      - tests/unit/idleVillage/questExpeditionBag.test.tsx
  - id: PLAN-073-loadout-header-no-overlap
    source: plan
    source_ref: PLAN-073
    statement: >-
      L'header LOADOUT è una grid esplicita (label|actions, coverage sotto): il pulsante «Apri magazzino» non
      può sovrapporsi al contatore «Sacca — n/max» sotto espansione di lingua (fix overlap PLAN-068).
    test_refs: []
  - id: R-234-planner-tooltip-inside
    source: director-bug
    source_ref: R-234
    statement: >-
      I tooltip degli oggetti del planner collidono con il guscio del planner: si spostano/ribaltano dentro, non escono
      sul roster (T-03, PLAN-067 T-A9)
    test_refs:
      - tests/unit/idleVillage/questPlanner.tooltipBoundary.test.tsx
---
# quest-expedition-detail

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/quests/QuestExpeditionDetail.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/quests/QuestExpeditionDetail.tsx`.

## Scope

- `src/ui/idleVillage/quests/QuestExpeditionDetail.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-073 (R-240, artifact-r003 5/5 ACCEPT): bisaccia ledger-bound (bags[poi.id]), DnD tipizzato warehouse↔bag (assign/swap/release), release-all per-owner (D-2), header LOADOUT in grid anti-overlap.

<!-- /plan054:generated -->
