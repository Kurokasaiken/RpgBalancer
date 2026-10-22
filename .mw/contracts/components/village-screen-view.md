---
id: village-screen-view
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx
fast_checks:
  - tests/unit/idleVillage/villageBuildings.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-legacy-slots-from-buildings
    source: director-bug
    source_ref: R-234
    statement: >-
      Legacy reliquary slots follow the village buildings: warehouse to items, sanctuary to heroes, mage tower to
      blueprints; slots equal the building level, zero when absent or not built (LEG = B)
    test_refs:
      - tests/unit/idleVillage/legacyReliquary.test.ts
---
# village-screen-view

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Regime village: pins edifici, lotti (ellissi/vignette/pennoni PLAN-038), tooltip, upgrade mock.

## Scope

- `src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `village-screen` (batch B3-village, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — passaggio plating su lotti/ghiere + fix font; il Director ha già bocciato colori attuali; stato — implemented — replating lotti/ghiere/pin/badge/placca/chip a palette Roster (lacquer-base + brass-hi/crest); legend ≥12px; screenshot village-replated-1366x768.png.

<!-- /plan054:generated -->
