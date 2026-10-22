---
id: resource-readout
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/ResourceReadout.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/ResourceReadout.tsx
fast_checks:
  - tests/unit/idleVillage/ResourceOutlook.test.tsx
  - tests/unit/idleVillage/resourceDeltaChip.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: resource-readout.INV-1
    source: plan
    source_ref: R-260
    statement: >-
      Il readout reagisce al commit del settlement: per ogni risorsa con tessera un chip «+N» nella tile (oro), per i
      grant senza tessera un chip «+N» ancorato sotto il readout (XP); ogni chip fa count-up su
      `hud.resourceDelta.countUpMs` e sotto reduced-motion mostra subito l'importo finale; nessuno stamp → nessun chip.
    test_refs:
      - tests/unit/idleVillage/resourceDeltaChip.test.tsx
  - id: R-234-hud-food-ember
    source: director-bug
    source_ref: R-234
    statement: A critical stock tile is an ember border on a dark tile, never a solid danger fill (HUD-1 = A)
    test_refs:
      - tests/unit/idleVillage/resourceReadout.ember.test.tsx
---
# resource-readout

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/ResourceReadout.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Lastra top-right: gold/food/wood con icone incise e valori.

## Scope

- `src/ui/idleVillage/components/gameFrame/ResourceReadout.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `resource-readout` (batch B1-fixed-hud, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — misura token lastre contro Roster V2.

<!-- /plan054:generated -->
