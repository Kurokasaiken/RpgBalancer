---
id: world-surface-clouds
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/WorldSurfaceClouds.tsx
scope_files:
  - src/ui/idleVillage/components/WorldSurfaceClouds.tsx
fast_checks:
  - tests/unit/idleVillage/WorldSurfaceClouds.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: world-surface-clouds.INV-1
    source: director-spec
    source_ref: session 2026-10-24 (prova A)
    statement: >-
      Ogni sprite nuvola è renderizzato attraverso il trattamento di
      armonizzazione dichiarato in `atmosphereAssets.cloudsLook`
      (opacity = band.opacity × opacityScale, CSS filter applicato);
      gli sprite ombra (`cloud-shadows`) restano non trattati.
    test_refs:
      - tests/unit/idleVillage/WorldSurfaceClouds.test.tsx
---

# world-surface-clouds

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/WorldSurfaceClouds.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/WorldSurfaceClouds.tsx`.

## Scope

- `src/ui/idleVillage/components/WorldSurfaceClouds.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
