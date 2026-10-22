---
id: use-game-stage-zones
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/stageZones/useGameStageZones.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/stageZones/stageZonesReducer.ts
  - src/ui/idleVillage/components/gameFrame/stageZones/useGameStageZones.tsx
fast_checks:
  - tests/unit/idleVillage/questShellLayout.test.ts
  - tests/unit/idleVillage/stageStripsLayer.test.tsx
  - tests/unit/idleVillage/stageZonesSolver.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-253-chrome-overlap
    source: director-bug
    source_ref: R-253
    statement: >-
      Il cluster quest in regime run era confinato tra le bande chrome (topPx 92/bottomPx 100): la finestra non aveva
      spazio per art+testo+scelte insieme. Fix: clusterEnvelope si estende sul chrome per questChromeOverlap (config,
      ruling Director 'il componente quest puo' andare sopra l'HUD')
    test_refs:
      - tests/unit/idleVillage/stageZonesSolver.test.ts
---
# use-game-stage-zones

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/stageZones/useGameStageZones.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Infra tre-zone stage: occupancy, strip, drag claim, suspension.

## Scope

- `src/ui/idleVillage/components/gameFrame/stageZones/stageZonesReducer.ts`
- `src/ui/idleVillage/components/gameFrame/stageZones/useGameStageZones.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `stage-chrome` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — freeze; solo la voce questForecast va riconciliata (WS-4?); stato — boundary — questForecast dichiarato ma mai mountato/aperto; riconciliazione WS-3/WS-4 o D9 Director.
- PLAN-043 WS-5 scheda `stage-chrome` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — freeze; solo la voce questForecast va riconciliata (WS-4?); stato — boundary — questForecast dichiarato ma mai mountato/aperto; riconciliazione WS-3/WS-4 o D9 Director.

<!-- /plan054:generated -->
