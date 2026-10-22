---
id: hud-panels-menu
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/HudPanelsMenu.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/HudPanelsMenu.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-panels-no-badge
    source: director-bug
    source_ref: R-234
    statement: The Panels button carries no hidden-panels badge (DN-2)
    test_refs:
      - tests/unit/idleVillage/hudPanelsMenu.noBadge.test.tsx
---
# hud-panels-menu

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/HudPanelsMenu.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Menu dei pannelli floating + shortcut; fonte di verità A-set.

## Scope

- `src/ui/idleVillage/components/gameFrame/HudPanelsMenu.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `hud-panels-menu` (batch B1-fixed-hud, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — coerenza open-empty: verificare cosa mostra E/Q/P senza contenuto.

<!-- /plan054:generated -->
