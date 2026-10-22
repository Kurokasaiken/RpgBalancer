---
id: atoms
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/questS1Lab/hud/atoms.tsx
scope_files:
  - src/ui/idleVillage/questS1Lab/hud/atoms.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-chip-text-contrast
    source: director-bug
    source_ref: R-234
    statement: >-
      Ogni tono di HudChip raggiunge 4.5:1 tra testo e fondo del proprio chip sulla skin base (niente rosso su rosso,
      PLAN-067 T-A11)
    test_refs:
      - tests/unit/idleVillage/hudChip.contrast.test.tsx
---
# atoms

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/questS1Lab/hud/atoms.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/questS1Lab/hud/atoms.tsx`.

## Scope

- `src/ui/idleVillage/questS1Lab/hud/atoms.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
