---
id: engraved-icons
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/engravedIcons.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/engravedIcons.tsx
fast_checks:
  - tests/unit/idleVillage/hudGuards.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: engraved-icons.INV-1
    source: code-baseline
    statement: >-
      Il set engraved disegna glyph solidi: fill="currentColor", nessuno stroke e
      nessun colore letterale; ENGRAVED_ICON_IDS copre ogni entry incisa del
      registro icone della HUD.
    test_refs:
      - tests/unit/idleVillage/hudGuards.test.ts
---

# engraved-icons

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/engravedIcons.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/engravedIcons.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/engravedIcons.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
