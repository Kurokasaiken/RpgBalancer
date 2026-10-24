---
id: materic-event-card
kind: component
role: ui-component
tier: 2
root_file: src/ui/designSystem/primitives/MatericEventCard.tsx
scope_files:
  - src/ui/designSystem/primitives/MatericEventCard.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: materic-event-card.INV-1
    source: director-bug
    source_ref: R-270
    statement: >-
      CTA 'PREPARE THE DEFENSES' misura 178.6x31.5px dopo cardScale ~0.875 (Sentinel small-target S0/S1): serve
      actionStyle per minHeight 32/cardScale
    test_refs: 
      - tests/unit/idleVillage/matericEventCard.actionStyle.test.tsx
---
# materic-event-card

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/designSystem/primitives/MatericEventCard.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/designSystem/primitives/MatericEventCard.tsx`.

## Scope

- `src/ui/designSystem/primitives/MatericEventCard.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
