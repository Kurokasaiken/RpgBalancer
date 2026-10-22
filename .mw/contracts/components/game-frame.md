---
id: game-frame
kind: component
role: ui-component
tier: 1
root_file: src/pages/game-frame.tsx
scope_files:
  - src/pages/game-frame.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: game-frame.INV-1
    source: plan
    source_ref: PLAN-054
    statement: La pagina lab /game-frame esporta GameFrameScreen (composizione con slot) e la pagina default.
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
  - id: R-234-tab-order-visual
    source: director-bug
    source_ref: R-234
    statement: 'L''ordine di Tab segue lo schermo: la navigazione in basso precede le utilità nell''angolo (PLAN-067 T-A14)'
    test_refs:
      - tests/unit/idleVillage/gameFrame.tabOrder.test.tsx
  - id: R-234-hud-next-states
    source: director-bug
    source_ref: R-234
    statement: >-
      The centre tab is alarm / quiet / none from the nearest event: threat within 5 days = alarm,
      within 10 = quiet, else it disappears (HUD-3 = P1)
    test_refs:
      - tests/unit/idleVillage/hudTopP1.test.tsx
  - id: R-234-hud-top-p1
    source: director-bug
    source_ref: R-234
    statement: >-
      Top HUD: time, next and resources left to right as detached tabs; the menu lives in the bottom-right corner
      cluster (HUD-3 = P1)
    test_refs:
      - tests/unit/idleVillage/hudTopP1.test.tsx
---
# game-frame

Unità `ui-component` (tier 1, page) — contratto vivo PLAN-054. Root: `src/pages/game-frame.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 1, page) — contratto vivo PLAN-054.
Root: `src/pages/game-frame.tsx`.

## Scope

- `src/pages/game-frame.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
