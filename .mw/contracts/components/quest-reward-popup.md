---
id: quest-reward-popup
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/QuestRewardPopup.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/QuestRewardPopup.tsx
  - src/ui/idleVillage/quests/questEpilogue.ts
fast_checks:
  - tests/unit/idleVillage/questRewardPopup.test.tsx
  - tests/unit/idleVillage/quests/questEpilogue.test.ts
  - tests/unit/idleVillage/quests/residentXpAndSwap.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-report-one-title
    source: director-bug
    source_ref: R-234
    statement: >-
      Il rapporto di fine run dice il suo titolo una volta: l'epilogo dentro la lastra non lo ripete come etichetta
      (PLAN-067 T-A11)
    test_refs:
      - tests/unit/idleVillage/questRewardPopup.oneTitle.test.tsx
  - id: R-239-reward-viewport
    source: director-bug
    source_ref: R-239
    statement: >-
      Il report di fine run (reveal staged) cresce oltre il bordo superiore dello viewport: placca centrata 50%/50%
      senza cap di altezza né scroll interno — titolo e chiusura escono dallo schermo
    test_refs:
      - tests/unit/idleVillage/questRewardPopup.viewport.test.tsx
  - id: quest-reward-popup.INV-3
    source: plan
    source_ref: R-260
    statement: >-
      Il report mostra il piano pendente: il primo frame dipinto marca `settling` (via rewardAck) e OGNI via di chiusura
      — Collect, Escape, X — convoglia su `onClose`, il boundary di commit che applica il settlement; il popup non
      applica mai effetti di per sé.
    test_refs:
      - tests/unit/idleVillage/questRewardPopup.test.tsx
  - id: R-234-returned-crew
    source: director-bug
    source_ref: R-234
    statement: >-
      Who came back: one niche per person with its state written, per-person tooltip with title/illness/character; group
      lists no longer repeat per-person lines (T-C2)
    test_refs:
      - tests/unit/idleVillage/questReturnedCrew.test.tsx
---
# quest-reward-popup

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/QuestRewardPopup.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/QuestRewardPopup.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/QuestRewardPopup.tsx`
- `src/ui/idleVillage/quests/questEpilogue.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
