---
id: portrait-decode-cache
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/utils/portraitDecodeCache.ts
scope_files:
  - src/ui/idleVillage/utils/portraitDecodeCache.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: portrait-decode-cache.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      portraitDecodeCache: preload mette in cache l'immagine (stessa istanza al secondo preload) e isPortraitDecoded
      riflette lo stato decode.
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# portrait-decode-cache

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/utils/portraitDecodeCache.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/utils/portraitDecodeCache.ts`.

## Scope

- `src/ui/idleVillage/utils/portraitDecodeCache.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
