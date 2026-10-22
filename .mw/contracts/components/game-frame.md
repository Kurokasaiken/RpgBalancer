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
