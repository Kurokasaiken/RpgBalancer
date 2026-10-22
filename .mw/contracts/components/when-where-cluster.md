---
id: when-where-cluster
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/WhenWhereCluster.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/WhenWhereCluster.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-hud-no-native-title
    source: director-bug
    source_ref: R-234
    statement: >-
      I controlli della HUD (tempo, nav, angolo) si presentano col tooltip della HUD, non col title del browser: nome,
      tasto, riga di spiegazione (PLAN-067 T-A14)
    test_refs:
      - tests/unit/idleVillage/hudTooltip.test.tsx
---
# when-where-cluster

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/WhenWhereCluster.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Lastra chrome top-center: giorno, nome regione, controlli velocità (pausa/1×/2×/4×).

## Scope

- `src/ui/idleVillage/components/gameFrame/WhenWhereCluster.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `when-where-cluster` (batch B1-fixed-hud, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — allineare a Roster (font ≥12px, scala hud); stato — implemented — Day caption → 12px via labelStyle prop (probe: 12px computed).

<!-- /plan054:generated -->
