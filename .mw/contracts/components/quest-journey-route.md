---
id: quest-journey-route
kind: component
role: ui-component
tier: 2
root_file: "src/ui/idleVillage/components/gameFrame/QuestJourneyRoute.tsx"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/QuestJourneyRoute.tsx"
  - "src/ui/idleVillage/config/questJourneyRouteConfig.ts"
fast_checks:
  - tests/unit/idleVillage/questJourneyRoute.test.tsx
e2e_checks:
  - tests/e2e/idleVillage/questJourneyRoute.spec.ts
e2e_trigger_globs:
  - src/ui/idleVillage/components/gameFrame/QuestJourneyRoute.tsx
invariants:
  - id: quest-journey-route.INV-1
    source: plan
    source_ref: PLAN-053
    statement: >-
      A live journey route draws a monotone continuous fill from the journey journal with the party at its exact
      frontier; the party stays at the POI during svolgimento, reverses over the same polyline in ritorno, and no
      route is rendered for legacy or terminal runs.
    test_refs:
      - tests/unit/idleVillage/questJourneyRoute.test.tsx
      - tests/e2e/idleVillage/questJourneyRoute.spec.ts
---
# quest-journey-route

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/QuestJourneyRoute.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/QuestJourneyRoute.tsx`
- `src/ui/idleVillage/config/questJourneyRouteConfig.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
