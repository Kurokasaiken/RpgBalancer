---
id: temporary-skin-config
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/skins/temporary/TemporarySkinConfig.ts
scope_files:
  - src/ui/idleVillage/skins/temporary/TemporarySkinConfig.ts
fast_checks:
  - tests/unit/idleVillage/skins/poiAmberSkinConfig.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: temporary-skin-config.INV-1
    source: plan
    source_ref: PLAN-054
    statement: La config skin temporanea valida lo schema TemporarySkinConfig, espone binding slot attesi e metadata coerenti.
    test_refs:
      - tests/unit/idleVillage/skins/poiAmberSkinConfig.test.tsx
---

# temporary-skin-config

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/skins/temporary/TemporarySkinConfig.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/skins/temporary/TemporarySkinConfig.ts`.

## Scope

- `src/ui/idleVillage/skins/temporary/TemporarySkinConfig.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
