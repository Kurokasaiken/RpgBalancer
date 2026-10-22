---
id: depth-scene
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/questS1Lab/render/DepthScene.tsx
scope_files:
  - src/ui/idleVillage/questS1Lab/render/DepthScene.tsx
  - src/ui/idleVillage/questS1Lab/render/atmosphereOverlay.ts
  - src/ui/idleVillage/questS1Lab/render/depthShader.ts
fast_checks:
  - tests/unit/idleVillage/questCinematics/atmosphereLayer.test.tsx
  - tests/unit/idleVillage/questCinematics/depthShader.test.ts
  - tests/unit/idleVillage/questCinematics/edgeSafety.test.ts
  - tests/unit/idleVillage/questCinematics/runtimeInvariants.test.tsx
  - tests/unit/idleVillage/questCinematics/sceneManifest.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: depth-scene.INV-1
    source: director-bug
    source_ref: R-242
    statement: >-
      viewAspect deve essere l'aspect REALE misurato del box host (shrink reservoir: box ~3.85 vs prop config 2.4) — DOM
      img e GPU devono campionare la stessa finestra, e il transform DOM va applicato prima del primo paint
    test_refs:
      - tests/unit/idleVillage/questCinematics/runtimeInvariants.test.tsx
---
# depth-scene

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/questS1Lab/render/DepthScene.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/questS1Lab/render/DepthScene.tsx`.

## Scope

- `src/ui/idleVillage/questS1Lab/render/DepthScene.tsx`
- `src/ui/idleVillage/questS1Lab/render/atmosphereOverlay.ts`
- `src/ui/idleVillage/questS1Lab/render/depthShader.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
