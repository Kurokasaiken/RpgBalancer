---
id: map-building-poi
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/MapBuildingPoi.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/MapBuildingPoi.tsx
fast_checks:
  - tests/unit/idleVillage/villageStash.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants: []
---

# map-building-poi

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/MapBuildingPoi.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Marker POI su mappa: sigilli con silhouette incise, anelli, reveal orchestrato.

## Scope

- `src/ui/idleVillage/components/gameFrame/MapBuildingPoi.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `poi-sigillo` (batch B4-map, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — riplating anelli su palette Roster/sigillo; stato — implemented — rimColors → --skin-hud-brass-crest/low/base, stone → nuovi --skin-poi-stone-*; zero delta visivo; forme/taglie = giudizio Director (F4).

<!-- /plan054:generated -->
