---
id: wanderlust-roster-card-v2
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/rosterV2/WanderlustRosterCardV2.tsx
scope_files:
  - src/ui/idleVillage/rosterV2/WanderlustRosterCardV2.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: wanderlust-roster-card-v2.INV-1
    source: plan
    source_ref: R-353
    statement: >-
      R-353 mockup row (mockup-stash-grid.jpg, ruling: restyle estetico, pannelli flottanti):
      la strip compact monta il medaglione firmato C1 (data-wanderlust-portrait wrappa
      C1Medallion ring+ritratto), nome oro display, doppia barra valori HP/stamina e
      hairline incisa — nessun filetto-box; `data-density="compact"` marca la riga per
      l'anchor badge del decor.
    test_refs:
      - tests/unit/idleVillage/r353RosterRow.test.tsx
---

# wanderlust-roster-card-v2

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/rosterV2/WanderlustRosterCardV2.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/rosterV2/WanderlustRosterCardV2.tsx`.

## Scope

- `src/ui/idleVillage/rosterV2/WanderlustRosterCardV2.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
