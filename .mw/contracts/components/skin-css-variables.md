---
id: skin-css-variables
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/skins/skinCssVariables.ts
scope_files:
  - src/ui/idleVillage/skins/skinCssVariables.ts
fast_checks:
  - tests/unit/idleVillage/hudGuards.test.ts
  - tests/unit/idleVillage/poiSigillo.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: skin-css-variables.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Ogni token --skin-hud-* letto dai file HUD è definito nel CSS delle skin; nessun letterale colore nei file HUD
      costruiti sul materiale; nessun testo sotto 12px.
    test_refs:
      - tests/unit/idleVillage/hudGuards.test.ts
  - id: R-234-no-violet
    source: director-bug
    source_ref: R-234
    statement: >-
      Never violet: the fallen state is cold iron #93a4ad in every skin and the colour sources hold no violet hex (COL-D
      = B)
    test_refs:
      - tests/unit/idleVillage/noViolet.test.ts
  - id: skin-css-variables.INV-2
    source: director-bug
    source_ref: R-270
    statement: >-
      Token --skin-hud-control-height 26px sotto il minimo interattivo 32px: pill pin edificio 40x26, chip registry
      157x26, filter chips (Sentinel small-target, run 0829)
    test_refs: 
      - tests/unit/idleVillage/skinControlHeight.min32.test.ts
---
# skin-css-variables

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/skins/skinCssVariables.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/skins/skinCssVariables.ts`.

## Scope

- `src/ui/idleVillage/skins/skinCssVariables.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
