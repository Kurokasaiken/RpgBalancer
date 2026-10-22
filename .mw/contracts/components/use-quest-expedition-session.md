---
id: use-quest-expedition-session
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/quests/useQuestExpeditionSession.tsx
scope_files:
  - src/ui/idleVillage/config/presentationConfig.ts
  - src/ui/idleVillage/config/wanderlustBaseManifest.json
  - src/ui/idleVillage/questS1Lab/questCertainty.ts
  - src/ui/idleVillage/questS1Lab/questEligibility.ts
  - src/ui/idleVillage/questS1Lab/residentToQuestMember.ts
  - src/ui/idleVillage/quests/questExpedition.ts
  - src/ui/idleVillage/quests/questJourneyAuthoring.ts
  - src/ui/idleVillage/quests/useQuestExpeditionSession.tsx
fast_checks:
  - tests/unit/idleVillage/questExpeditionBag.test.tsx
  - tests/unit/idleVillage/questExpeditionReturnFlight.test.tsx
  - tests/unit/idleVillage/questPartyCalibration.test.ts
  - tests/unit/idleVillage/questPartyReal.test.ts
  - tests/unit/idleVillage/questS1Lab/questCertainty.test.ts
  - tests/unit/idleVillage/questS1Lab/questEligibility.test.ts
  - tests/unit/idleVillage/questS1Lab/questExpedition.test.ts
  - tests/unit/idleVillage/quests/residentXpAndSwap.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: use-quest-expedition-session.INV-1
    source: director-bug
    source_ref: R-248
    statement: >-
      Estrazione press-hold su slot quest: alla fine dell'operazione il medaglione non torna alla card roster —
      onSlotClear fa solo clearSlot, nessun return flight (useQuestPoiSession.handleSlotClear e' il riferimento).
    test_refs:
      - tests/unit/idleVillage/questExpeditionReturnFlight.test.tsx
  - id: use-quest-expedition-session.INV-2
    source: director-bug
    source_ref: R-257
    statement: >-
      Estrazione sotto filtro roster 'available': la card del pg slottato e' filtrata fuori dal DOM —
      querySelector(data-resident-id) risolve null e la return flight viene saltata (pop istantaneo). Il clear deve
      comunque lanciare il volo con fallback sul contenitore lista roster, ed esporre flyingResidentId per la
      soppressione della medaglia in sede.
    test_refs:
      - tests/unit/idleVillage/questExpeditionReturnFlight.test.tsx
  - id: use-quest-expedition-session.INV-3
    source: director-bug
    source_ref: R-260
    statement: >-
      Il commit del settlement appartiene al ciclo del report, non a `ended`: l'arrivo non muove risorse; il primo frame
      dipinto del report (rewardAck) persiste `settling`; il dismiss (ogni path, convogliato su onClose) chiama
      `commitSettlement` che applica gli effetti una volta, marca `settled` e pubblica il delta transiente per la HUD;
      un run idratato con `settling` auto-committa al mount senza cerimonia.
    test_refs:
      - tests/unit/idleVillage/questCollectCommit.test.tsx
  - id: use-quest-expedition-session.INV-4
    source: director-bug
    source_ref: R-269
    statement: >-
      Extraction medallion never vanishes: seat suppression and the return-flight proxy mount in one commit
      (clear+suppression+flight are one transition; landing unmounts the proxy and unlocks the roster card in one
      commit)
    test_refs:
      - tests/unit/idleVillage/questExpeditionReturnFlight.test.tsx
---
# use-quest-expedition-session

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/quests/useQuestExpeditionSession.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/quests/useQuestExpeditionSession.tsx`.

## Scope

- `src/ui/idleVillage/questS1Lab/questCertainty.ts`
- `src/ui/idleVillage/questS1Lab/questEligibility.ts`
- `src/ui/idleVillage/questS1Lab/residentToQuestMember.ts`
- `src/ui/idleVillage/quests/questExpedition.ts`
- `src/ui/idleVillage/quests/useQuestExpeditionSession.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
