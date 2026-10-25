---
id: use-quest-poi-session
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/quests/useQuestPoiSession.tsx
scope_files:
  - src/ui/idleVillage/frozen/_infra/contract.ts
  - src/ui/idleVillage/frozen/kits/clockKit.contract.ts
  - src/ui/idleVillage/frozen/kits/clockKit.tsx
  - src/ui/idleVillage/frozen/kits/poiKit.tsx
  - src/ui/idleVillage/hooks/useActiveHUDState.ts
  - src/ui/idleVillage/hooks/useActiveHUDStateSync.ts
  - src/ui/idleVillage/hooks/useMilestoneEngine.ts
  - src/ui/idleVillage/hooks/useQuestAssignmentPreview.ts
  - src/ui/idleVillage/hooks/useQuestLoreDrop.ts
  - src/ui/idleVillage/quests/useQuestPoiSession.tsx
  - src/ui/idleVillage/utils/hudPersistence.ts
  - src/ui/idleVillage/utils/statRequirementDisplay.ts
fast_checks:
  - tests/unit/frozen/contract.test.ts
  - tests/unit/frozen/rosterKit.dom.test.tsx
  - tests/unit/idleVillage/ActiveHUD.analytics.test.tsx
  - tests/unit/idleVillage/ActiveHUD.skin.test.tsx
  - tests/unit/idleVillage/ActiveHUD.test.tsx
  - tests/unit/idleVillage/ActiveHUDNotifications.test.tsx
  - tests/unit/idleVillage/QuestAssignmentPreview.test.tsx
  - tests/unit/idleVillage/TimeEngineStrip.skin.test.tsx
  - tests/unit/idleVillage/hudPersistence.test.ts
  - tests/unit/idleVillage/useActiveHUDHaptics.test.tsx
  - tests/unit/idleVillage/useActiveHUDTelemetry.test.tsx
  - tests/unit/idleVillage/useMilestoneEngine.test.tsx
  - tests/unit/idleVillage/useQuestAssignmentPreview.test.ts
e2e_checks:
  - tests/contract/minimal-vs-test.spec.ts
e2e_trigger_globs:
  - src/ui/idleVillage/frozen/_infra/contract.ts
  - src/ui/idleVillage/frozen/kits/clockKit.contract.ts
  - src/ui/idleVillage/frozen/kits/clockKit.tsx
  - src/ui/idleVillage/frozen/kits/poiKit.tsx
  - src/ui/idleVillage/hooks/useActiveHUDState.ts
  - src/ui/idleVillage/hooks/useActiveHUDStateSync.ts
  - src/ui/idleVillage/hooks/useMilestoneEngine.ts
  - src/ui/idleVillage/hooks/useQuestAssignmentPreview.ts
  - src/ui/idleVillage/hooks/useQuestLoreDrop.ts
  - src/ui/idleVillage/quests/useQuestPoiSession.tsx
  - src/ui/idleVillage/utils/hudPersistence.ts
  - src/ui/idleVillage/utils/statRequirementDisplay.ts
invariants:
  - id: use-quest-poi-session.INV-1
    source: director-bug
    source_ref: R-241
    statement: >-
      R-241 B5: getResidentCompatibility senza guard di contesto restituiva 'Nessuno slot compatibile' anche mentre la
      quest era in corso — deve astenersi finche' il ciclo quest e' attivo (isQuestRunning || embarkResult)
    test_refs:
      - tests/unit/idleVillage/useQuestPoiSession.compatibilityGuard.test.tsx
  - id: use-quest-poi-session.INV-2
    source: director-bug
    source_ref: R-283
    statement: >-
      R-283: (a) getResidentCompatibility marca 'invalid' quando nessun castone LIBERO accetta il residente → card non
      trascinabile → swap roster→castone occupato irraggiungibile; un castone occupato compatibile
      (evaluateStatRequirement) deve contare. (b) handleResidentSelect non rilascia flyingResidentId quando l'anchor del
      castone manca → click-assign morti per tutto il roster.
    test_refs: []
---
# use-quest-poi-session

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/quests/useQuestPoiSession.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/quests/useQuestPoiSession.tsx`.

## Scope

- `src/ui/idleVillage/frozen/_infra/contract.ts`
- `src/ui/idleVillage/frozen/kits/clockKit.contract.ts`
- `src/ui/idleVillage/frozen/kits/clockKit.tsx`
- `src/ui/idleVillage/frozen/kits/poiKit.tsx`
- `src/ui/idleVillage/hooks/useActiveHUDState.ts`
- `src/ui/idleVillage/hooks/useActiveHUDStateSync.ts`
- `src/ui/idleVillage/hooks/useMilestoneEngine.ts`
- `src/ui/idleVillage/hooks/useQuestAssignmentPreview.ts`
- `src/ui/idleVillage/hooks/useQuestLoreDrop.ts`
- `src/ui/idleVillage/quests/useQuestPoiSession.tsx`
- `src/ui/idleVillage/utils/hudPersistence.ts`
- `src/ui/idleVillage/utils/statRequirementDisplay.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
