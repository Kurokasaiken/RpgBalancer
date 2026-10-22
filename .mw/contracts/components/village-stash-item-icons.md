---
id: village-stash-item-icons
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/villageStashItemIcons.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/villageStashItemIcons.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-item-three-kits
    source: director-bug
    source_ref: R-234
    statement: >-
      One item, three dresses, one engraved icon family: catalog emoji render as engraved glyphs, the tray selected tile
      is brass (INV-1 = B)
    test_refs:
      - tests/unit/idleVillage/itemThreeKits.test.tsx
---
# village-stash-item-icons

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/villageStashItemIcons.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Pannello mock scorta — leftWing, coppia autorizzata con roster.

## Scope

- `src/ui/idleVillage/components/gameFrame/villageStashItemIcons.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `village-stash` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep (mock) — allineare plating a Roster.

<!-- /plan054:generated -->
