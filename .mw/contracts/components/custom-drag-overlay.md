---
id: custom-drag-overlay
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/CustomDragOverlay.tsx
scope_files:
  - src/ui/idleVillage/components/CustomDragOverlay.tsx
fast_checks:
  - tests/unit/idleVillage/CustomDragOverlay.portal.test.tsx
e2e_checks:
  - tests/e2e/idleVillage/gameFirstInteraction.spec.ts
e2e_trigger_globs: []
invariants:
  - id: R-234-no-raw-drag-id
    source: director-bug
    source_ref: R-234
    statement: >-
      Un id di drag non è mai dipinto come testo: lo swap di uno slot-token non disegna nulla nell'overlay condiviso, il
      fantasma del rack porta il ritratto (PLAN-067 T-A5)
    test_refs:
      - tests/unit/idleVillage/CustomDragOverlay.slotToken.test.tsx
  - id: custom-drag-overlay.INV-1
    source: director-bug
    source_ref: R-238
    statement: >-
      Il medaglione di drag appare entro il vincolo del sensore (hold `holdToDragMs` o movimento
      ≥ `minDragDistance`), senza attendere il commit React: il warm-mount nascosto viene flippato
      visibile via DOM al vincolo e cede al vero DragOverlay nello stesso commit (pre-paint).
      pointerdown→marker ≤ budget; il primo hold non paga un delta cold-mount oltre
      `dragOverlayColdDeltaMaxMs` (R-238 Bug A)
    test_refs:
      - tests/e2e/idleVillage/gameFirstInteraction.spec.ts
---
# custom-drag-overlay

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/CustomDragOverlay.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/CustomDragOverlay.tsx`.

## Scope

- `src/ui/idleVillage/components/CustomDragOverlay.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
