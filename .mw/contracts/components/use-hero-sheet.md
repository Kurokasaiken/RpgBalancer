---
id: use-hero-sheet
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/useHeroSheet.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/heroSheetPlacement.ts
  - src/ui/idleVillage/components/gameFrame/useHeroSheet.tsx
fast_checks:
  - tests/unit/idleVillage/heroSheet.test.tsx
  - tests/unit/idleVillage/heroSheetPlacement.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants: []
---

# use-hero-sheet

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/useHeroSheet.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Overlay zone-esente: scheda PG rail-adjacent alla card sotto il puntatore.

## Scope

- `src/ui/idleVillage/components/gameFrame/heroSheetPlacement.ts`
- `src/ui/idleVillage/components/gameFrame/useHeroSheet.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `hero-sheet` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — solo coerenza visiva; overlay contract WS-2 intoccato.
- PLAN-043 WS-5 scheda `hero-sheet` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — solo coerenza visiva; overlay contract WS-2 intoccato.

<!-- /plan054:generated -->
