---
id: skin-scope
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/skins/primitives/SkinScope.tsx
scope_files:
  - src/ui/idleVillage/skins/primitives/SkinScope.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-focus-ring-skinned
    source: director-bug
    source_ref: R-234
    statement: >-
      Ogni focusabile dentro .skin-scope usa l'anello della skin su :focus-visible, mai l'outline di sistema (foglio
      gemello skinScope.css, PLAN-067 T-A14)
    test_refs:
      - tests/unit/idleVillage/skinScope.focusRing.test.ts
---
# skin-scope

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/skins/primitives/SkinScope.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/skins/primitives/SkinScope.tsx`.

## Scope

- `src/ui/idleVillage/skins/primitives/SkinScope.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
