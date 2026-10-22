---
id: hero-level-decor
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/rosterV2/HeroLevelDecor.tsx
scope_files:
  - src/ui/idleVillage/rosterV2/HeroLevelDecor.tsx
fast_checks:
  - tests/unit/idleVillage/heroLevelUp.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-level-badge-clear-of-name
    source: director-bug
    source_ref: R-234
    statement: >-
      Il badge di livello non copre mai il nome: il suo bordo destro si ferma 2 px prima del nome, può coprire il
      ritratto (PLAN-067 T-A6)
    test_refs:
      - tests/unit/idleVillage/heroLevelDecor.nameClear.test.tsx
---
# hero-level-decor

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/rosterV2/HeroLevelDecor.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/rosterV2/HeroLevelDecor.tsx`.

## Scope

- `src/ui/idleVillage/rosterV2/HeroLevelDecor.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
