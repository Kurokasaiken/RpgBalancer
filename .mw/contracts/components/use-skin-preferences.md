---
id: use-skin-preferences
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/hooks/useSkinPreferences.ts
scope_files:
  - src/ui/idleVillage/hooks/useSkinPreferences.ts
fast_checks:
  - tests/unit/idleVillage/DayNightPOI.test.tsx
  - tests/unit/idleVillage/ResidentSlotRack.skin.integration.test.tsx
  - tests/unit/idleVillage/useSkinPreferences.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: use-skin-preferences.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Le preferenze skin persistite caricano e validano al mount; caricamento fallito → default; set preset/pillar con
      validazione e fallback su pillar non supportato.
    test_refs:
      - tests/unit/idleVillage/useSkinPreferences.test.ts
---

# use-skin-preferences

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/hooks/useSkinPreferences.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/hooks/useSkinPreferences.ts`.

## Scope

- `src/ui/idleVillage/hooks/useSkinPreferences.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
