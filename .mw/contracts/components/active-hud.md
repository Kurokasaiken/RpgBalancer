---
id: active-hud
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/ActiveHUD.tsx
scope_files:
  - src/ui/idleVillage/components/ActiveHUD.tsx
  - src/ui/idleVillage/config/hudCrewConfig.ts
  - src/ui/idleVillage/controllers/CrewSchedulerController.ts
  - src/ui/idleVillage/hooks/useActiveHUDHaptics.ts
  - src/ui/idleVillage/hooks/useActiveHUDTelemetry.ts
  - src/ui/idleVillage/hooks/useActivityAnalytics.ts
  - src/ui/idleVillage/hooks/useActivityTelemetry.ts
  - src/ui/idleVillage/hooks/useCrewHUDState.ts
  - src/ui/idleVillage/hooks/useCrewScheduler.ts
  - src/ui/idleVillage/hooks/useCrewSchedulerTimeTravel.ts
  - src/ui/idleVillage/skins/activeHUDSkinConfig.ts
  - src/ui/idleVillage/utils/crewSchedulerAnalyticsChannel.ts
fast_checks:
  - tests/unit/idleVillage/ActiveHUD.analytics.test.tsx
  - tests/unit/idleVillage/ActiveHUD.skin.test.tsx
  - tests/unit/idleVillage/ActiveHUD.test.tsx
  - tests/unit/idleVillage/AdvancedMaintenanceOptimizer.test.ts
  - tests/unit/idleVillage/CrewSchedulerController.test.ts
  - tests/unit/idleVillage/CrewSchedulerDebug.test.tsx
  - tests/unit/idleVillage/CrewSchedulerDebugPanel.test.tsx
  - tests/unit/idleVillage/CrewSchedulerHUDCard.test.tsx
  - tests/unit/idleVillage/MaintenanceOptimizer.test.ts
  - tests/unit/idleVillage/crewSchedulerDeterminism.test.ts
  - tests/unit/idleVillage/useActiveHUDHaptics.test.tsx
  - tests/unit/idleVillage/useActiveHUDTelemetry.test.tsx
  - tests/unit/idleVillage/useCrewScheduler.test.tsx
  - tests/unit/idleVillage/useCrewSchedulerAnalytics.test.ts
  - tests/unit/idleVillage/useCrewSchedulerTimeTravel.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants: []
---

# active-hud

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/ActiveHUD.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/ActiveHUD.tsx`.

## Scope

- `src/ui/idleVillage/components/ActiveHUD.tsx`
- `src/ui/idleVillage/config/hudCrewConfig.ts`
- `src/ui/idleVillage/controllers/CrewSchedulerController.ts`
- `src/ui/idleVillage/hooks/useActiveHUDHaptics.ts`
- `src/ui/idleVillage/hooks/useActiveHUDTelemetry.ts`
- `src/ui/idleVillage/hooks/useActivityAnalytics.ts`
- `src/ui/idleVillage/hooks/useActivityTelemetry.ts`
- `src/ui/idleVillage/hooks/useCrewHUDState.ts`
- `src/ui/idleVillage/hooks/useCrewScheduler.ts`
- `src/ui/idleVillage/hooks/useCrewSchedulerTimeTravel.ts`
- `src/ui/idleVillage/skins/activeHUDSkinConfig.ts`
- `src/ui/idleVillage/utils/crewSchedulerAnalyticsChannel.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
