---
id: use-style-lab-tokens
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/styleLab/hooks/useStyleLabTokens.ts
scope_files:
  - src/ui/styleLab/hooks/useStyleLabTokens.ts
  - src/ui/styleLab/presets/wanderlust.ts
  - src/ui/styleLab/tokens/defaultStyleLabPreset.ts
  - src/ui/styleLab/tokens/wanderlustStyleLabPreset.ts
fast_checks:
  - tests/unit/idleVillage/DayNightPOI.test.tsx
  - tests/unit/idleVillage/WL-STY-006-SurfaceIntegration.test.tsx
  - tests/unit/styleLab/StyleLabTokens.test.tsx
  - tests/unit/styleLab/WanderlustPreset.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: use-style-lab-tokens.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      I token style-lab del preset default includono le sezioni authored (actionCardFrame, actionHalo, progressInlay,
      materialFeel.detail) e si esportano come variabili CSS.
    test_refs:
      - tests/unit/styleLab/StyleLabTokens.test.tsx
---

# use-style-lab-tokens

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/styleLab/hooks/useStyleLabTokens.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/styleLab/hooks/useStyleLabTokens.ts`.

## Scope

- `src/ui/styleLab/hooks/useStyleLabTokens.ts`
- `src/ui/styleLab/presets/wanderlust.ts`
- `src/ui/styleLab/tokens/defaultStyleLabPreset.ts`
- `src/ui/styleLab/tokens/wanderlustStyleLabPreset.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
