---
id: quest-stage-cluster
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/QuestStageCluster.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/QuestStageCluster.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-239-drag-release
    source: director-bug
    source_ref: R-239
    statement: >-
      Release flicker drag cluster: pointerup azzerava il translate prima del commit intent -> >=1 frame al rect
      pre-drag (scatto). Fix: commit prima, translate mantenuto fino al paint della geometria committata (layout
      effect), transizioni rect a 0ms durante il gesto
    test_refs:
      - tests/unit/idleVillage/questStageCluster.release.test.tsx
---
# quest-stage-cluster

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/QuestStageCluster.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/QuestStageCluster.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/QuestStageCluster.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
