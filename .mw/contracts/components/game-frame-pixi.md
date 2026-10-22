---
id: game-frame-pixi
kind: component
role: ui-component
tier: 1
root_file: src/pages/game-frame-pixi.tsx
scope_files:
  - src/pages/game-frame-pixi.tsx
  - src/ui/designSystem/primitives/index.ts
  - src/ui/idleVillage/archetypeDirectory.ts
  - src/ui/idleVillage/components/gameFrame/GameFrameDragCursor.tsx
  - src/ui/idleVillage/components/gameFrame/heroSheetMachine.ts
  - src/ui/idleVillage/components/gameFrame/heroSheetViewModel.ts
  - src/ui/idleVillage/components/gameFrame/hudPanelRegistry.ts
  - src/ui/idleVillage/components/gameFrame/hudTones.ts
  - src/ui/idleVillage/components/gameFrame/index.ts
  - src/ui/idleVillage/components/gameFrame/poiSigillo.ts
  - src/ui/idleVillage/components/gameFrame/questAvailability.ts
  - src/ui/idleVillage/components/gameFrame/questRevealSchedule.ts
  - src/ui/idleVillage/components/gameFrame/questShellLayout.ts
  - src/ui/idleVillage/components/gameFrame/questSkillCheckWarm.ts
  - src/ui/idleVillage/components/gameFrame/resolveWorldManifest.ts
  - src/ui/idleVillage/components/gameFrame/stageZones/solveStageLayout.ts
  - src/ui/idleVillage/components/gameFrame/useCompactTop.ts
  - src/ui/idleVillage/components/gameFrame/useHudMaterial.ts
  - src/ui/idleVillage/components/gameFrame/useHudPanels.ts
  - src/ui/idleVillage/components/gameFrame/useHudScale.ts
  - src/ui/idleVillage/components/gameFrame/usePanelWhileOpen.ts
  - src/ui/idleVillage/components/gameFrame/usePoiTypeIcon.ts
  - src/ui/idleVillage/components/gameFrame/villageStashViewModel.ts
  - src/ui/idleVillage/config/gamePerfBudgets.ts
  - src/ui/idleVillage/config/worldSurfaceConfig.ts
  - src/ui/idleVillage/frozen/_infra/CanonicalDataBridge.ts
  - src/ui/idleVillage/hooks/useFrameMetrics.ts
  - src/ui/idleVillage/hooks/useReducedMotion.ts
  - src/ui/idleVillage/hooks/useThrottledValue.ts
  - src/ui/idleVillage/interaction/dragSensors.ts
  - src/ui/idleVillage/interaction/magneticCollision.ts
  - src/ui/idleVillage/interaction/useDragOutcome.ts
  - src/ui/idleVillage/pixiSpike/pixiDestroy.ts
  - src/ui/idleVillage/questS1Lab/questArt.ts
  - src/ui/idleVillage/questS1Lab/questForecast.worker.ts
  - src/ui/idleVillage/questS1Lab/questOffer.ts
  - src/ui/idleVillage/questS1Lab/questPhaseRecord.ts
  - src/ui/idleVillage/questS1Lab/questSchedule.ts
  - src/ui/idleVillage/questS1Lab/questSimulation.ts
  - src/ui/idleVillage/questS1Lab/questTickCounter.ts
  - src/ui/idleVillage/questS1Lab/useQuestRun.ts
  - src/ui/idleVillage/quests/rosterCompatibility.ts
  - src/ui/idleVillage/rosterV2/heroLevelCue.ts
  - src/ui/idleVillage/rosterV2/heroLevelUpEvents.ts
  - src/ui/idleVillage/rosterV2/heroLevelViewModel.ts
  - src/ui/idleVillage/rosterV2/index.ts
  - src/ui/idleVillage/rosterV2/mountedCardRegistry.ts
  - src/ui/idleVillage/rosterV2/runHeroLevelUpStaging.ts
  - src/ui/idleVillage/skins/dayNightPoiSkinConfig.ts
  - src/ui/idleVillage/skins/resolveInitialSkin.ts
  - src/ui/idleVillage/slots/useResidentSlotController.ts
  - src/ui/idleVillage/store/useVillageStashStore.ts
  - src/ui/idleVillage/utils/gameAssetWarmup.ts
  - src/ui/idleVillage/utils/gamePerfProbe.ts
fast_checks:
  - tests/integration/idleVillage/minimalGameplayFlow.test.tsx
  - tests/unit/frozen/KitShell.test.tsx
  - tests/unit/idleVillage/WorkerPanel.test.tsx
  - tests/unit/idleVillage/combatStrip.test.tsx
  - tests/unit/idleVillage/gameBootPerf.test.tsx
  - tests/unit/idleVillage/gameFrameCursors.test.ts
  - tests/unit/idleVillage/heroLevelUp.test.tsx
  - tests/unit/idleVillage/heroSheet.test.tsx
  - tests/unit/idleVillage/hudGameMenu.test.tsx
  - tests/unit/idleVillage/hudGuards.test.ts
  - tests/unit/idleVillage/magneticCollision.test.ts
  - tests/unit/idleVillage/mapQuestPoi.test.ts
  - tests/unit/idleVillage/merchantPanel.test.tsx
  - tests/unit/idleVillage/poiSigillo.test.tsx
  - tests/unit/idleVillage/questAvailability.test.ts
  - tests/unit/idleVillage/questBag.test.tsx
  - tests/unit/idleVillage/questCheckOptions.test.tsx
  - tests/unit/idleVillage/questCinematics/sceneManifest.test.ts
  - tests/unit/idleVillage/questJourneyCharacterization.test.ts
  - tests/unit/idleVillage/questOffer.test.ts
  - tests/unit/idleVillage/questOutcomeToast.test.tsx
  - tests/unit/idleVillage/questPartyCalibration.test.ts
  - tests/unit/idleVillage/questPartyReal.test.ts
  - tests/unit/idleVillage/questPhaseRecord.test.ts
  - tests/unit/idleVillage/questRevealSchedule.test.ts
  - tests/unit/idleVillage/questRunWindow.test.tsx
  - tests/unit/idleVillage/questS1Lab/questExpedition.test.ts
  - tests/unit/idleVillage/questS1Lab/questOverlayIdentity.test.ts
  - tests/unit/idleVillage/questS1Lab/questSchedule.test.ts
  - tests/unit/idleVillage/questS1Lab/questSimAsync.test.ts
  - tests/unit/idleVillage/questS1Lab/questSimulation.test.ts
  - tests/unit/idleVillage/questS1Lab/questTradeoffSweep.test.ts
  - tests/unit/idleVillage/questScenarioConfig.test.ts
  - tests/unit/idleVillage/questShellLayout.test.ts
  - tests/unit/idleVillage/quests/floodVault.test.ts
  - tests/unit/idleVillage/quests/generatedCatalog.bench.test.ts
  - tests/unit/idleVillage/quests/imprintCompagno.test.ts
  - tests/unit/idleVillage/quests/imprintCompagnoMare.test.ts
  - tests/unit/idleVillage/quests/imprintCompagnoMiniera.test.ts
  - tests/unit/idleVillage/quests/imprintLocale.test.ts
  - tests/unit/idleVillage/quests/questGenLab.test.ts
  - tests/unit/idleVillage/quests/questSettlement.test.ts
  - tests/unit/idleVillage/quests/raceToPass.test.ts
  - tests/unit/idleVillage/residentConsequences.test.ts
  - tests/unit/idleVillage/slotFlightTarget.test.ts
  - tests/unit/idleVillage/stageZonesSolver.test.ts
  - tests/unit/idleVillage/villageStash.test.tsx
  - tests/unit/questS1Lab/questGoblin.test.ts
e2e_checks:
  - tests/e2e/idleVillage/gamePerf.spec.ts
  - tests/e2e/idleVillage/questJourneyRoute.spec.ts
e2e_trigger_globs:
  - src/pages/game-frame-pixi.tsx
  - src/ui/designSystem/primitives/index.ts
  - src/ui/idleVillage/archetypeDirectory.ts
  - src/ui/idleVillage/components/gameFrame/GameFrameDragCursor.tsx
  - src/ui/idleVillage/components/gameFrame/heroSheetMachine.ts
  - src/ui/idleVillage/components/gameFrame/heroSheetViewModel.ts
  - src/ui/idleVillage/components/gameFrame/hudPanelRegistry.ts
  - src/ui/idleVillage/components/gameFrame/hudTones.ts
  - src/ui/idleVillage/components/gameFrame/index.ts
  - src/ui/idleVillage/components/gameFrame/poiSigillo.ts
  - src/ui/idleVillage/components/gameFrame/questAvailability.ts
  - src/ui/idleVillage/components/gameFrame/questRevealSchedule.ts
  - src/ui/idleVillage/components/gameFrame/questShellLayout.ts
  - src/ui/idleVillage/components/gameFrame/questSkillCheckWarm.ts
  - src/ui/idleVillage/components/gameFrame/resolveWorldManifest.ts
  - src/ui/idleVillage/components/gameFrame/stageZones/solveStageLayout.ts
  - src/ui/idleVillage/components/gameFrame/useCompactTop.ts
  - src/ui/idleVillage/components/gameFrame/useHudMaterial.ts
  - src/ui/idleVillage/components/gameFrame/useHudPanels.ts
  - src/ui/idleVillage/components/gameFrame/useHudScale.ts
  - src/ui/idleVillage/components/gameFrame/usePanelWhileOpen.ts
  - src/ui/idleVillage/components/gameFrame/usePoiTypeIcon.ts
  - src/ui/idleVillage/components/gameFrame/villageStashViewModel.ts
  - src/ui/idleVillage/config/gamePerfBudgets.ts
  - src/ui/idleVillage/config/worldSurfaceConfig.ts
  - src/ui/idleVillage/frozen/_infra/CanonicalDataBridge.ts
  - src/ui/idleVillage/hooks/useFrameMetrics.ts
  - src/ui/idleVillage/hooks/useReducedMotion.ts
  - src/ui/idleVillage/hooks/useThrottledValue.ts
  - src/ui/idleVillage/interaction/dragSensors.ts
  - src/ui/idleVillage/interaction/magneticCollision.ts
  - src/ui/idleVillage/interaction/useDragOutcome.ts
  - src/ui/idleVillage/pixiSpike/pixiDestroy.ts
  - src/ui/idleVillage/questS1Lab/questArt.ts
  - src/ui/idleVillage/questS1Lab/questForecast.worker.ts
  - src/ui/idleVillage/questS1Lab/questOffer.ts
  - src/ui/idleVillage/questS1Lab/questPhaseRecord.ts
  - src/ui/idleVillage/questS1Lab/questSchedule.ts
  - src/ui/idleVillage/questS1Lab/questSimulation.ts
  - src/ui/idleVillage/questS1Lab/questTickCounter.ts
  - src/ui/idleVillage/questS1Lab/useQuestRun.ts
  - src/ui/idleVillage/quests/rosterCompatibility.ts
  - src/ui/idleVillage/rosterV2/heroLevelCue.ts
  - src/ui/idleVillage/rosterV2/heroLevelUpEvents.ts
  - src/ui/idleVillage/rosterV2/heroLevelViewModel.ts
  - src/ui/idleVillage/rosterV2/index.ts
  - src/ui/idleVillage/rosterV2/mountedCardRegistry.ts
  - src/ui/idleVillage/rosterV2/runHeroLevelUpStaging.ts
  - src/ui/idleVillage/skins/dayNightPoiSkinConfig.ts
  - src/ui/idleVillage/skins/resolveInitialSkin.ts
  - src/ui/idleVillage/slots/useResidentSlotController.ts
  - src/ui/idleVillage/store/useVillageStashStore.ts
  - src/ui/idleVillage/utils/gameAssetWarmup.ts
  - src/ui/idleVillage/utils/gamePerfProbe.ts
invariants:
  - id: game-frame-pixi.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      La pagina /game (game-frame-pixi) presenta il boot authored: logo, progress bar etichettata, caption di fase; a
      done la barra forza 100% e chiama onExited dopo la fade.
    test_refs:
      - tests/unit/idleVillage/gameBootPerf.test.tsx
  - id: game-frame-pixi.INV-2
    source: plan
    source_ref: PLAN-053
    statement: >-
      /game passes every unsettled journey-enabled run into PixiWorldMap's worldOverlay; the page does not create a
      route for legacy runs or retain it after settlement/wipe.
    test_refs:
      - tests/e2e/idleVillage/questJourneyRoute.spec.ts
  - id: R-234-phase-hp-once
    source: director-bug
    source_ref: R-234
    statement: >-
      Cronologia fasi: ogni HarmEvent conta una sola volta nella sua fase anche se la stessa finestra di danni viene
      registrata più volte (act(matureReady) a ogni tick). Audit F3: «−600 HP» su un eroe da 93 HP.
    test_refs:
      - tests/unit/idleVillage/questPhaseRecord.test.ts
  - id: R-234-tick-counter-within-total
    source: director-bug
    source_ref: R-234
    statement: >-
      Il contatore dei tick della barra tempo non supera mai il totale, quanto a lungo il gruppo aspetti ordini
      (PLAN-067 T-A16)
    test_refs:
      - tests/unit/idleVillage/questTickCounter.test.ts
  - id: R-234-director-labels-translated
    source: director-bug
    source_ref: R-234
    statement: >-
      Ogni etichetta d'azione del Director chiesta dalla pagina esiste in en e it-IT: niente chiave grezza nel pannello
      (PLAN-067 T-A15)
    test_refs:
      - tests/unit/idleVillage/directorLabels.i18n.test.ts
  - id: R-234-quest-content-translated
    source: director-bug
    source_ref: R-234
    statement: >-
      Con it-IT attivo il motore legge i testi dei nodi in italiano e la UI uno scenario italiano; lo scenario base non
      cambia mai. Una riga del manoscritto nuova o cambiata fa fallire il test e nomina il percorso (PLAN-067 T-A13)
    test_refs:
      - tests/unit/idleVillage/questContentLocale.test.ts
  - id: R-234-engine-text-translated
    source: director-bug
    source_ref: R-234
    statement: >-
      Sotto it-IT le righe che il motore scrive da sé (ferite, prove, bottino, finali, finali composti) sono in
      italiano; ogni letterale del motore ha una voce nel catalogo, quindi una riga nuova non esce non tradotta
      (PLAN-067 T-A13b)
    test_refs:
      - tests/unit/idleVillage/questEngineText.test.ts
---
# game-frame-pixi

Unità `ui-component` (tier 1, page) — contratto vivo PLAN-054. Root: `src/pages/game-frame-pixi.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Menu dei pannelli floating + shortcut; fonte di verità A-set.

## Scope

- `src/pages/game-frame-pixi.tsx`
- `src/ui/designSystem/primitives/index.ts`
- `src/ui/idleVillage/archetypeDirectory.ts`
- `src/ui/idleVillage/components/gameFrame/GameFrameDragCursor.tsx`
- `src/ui/idleVillage/components/gameFrame/heroSheetMachine.ts`
- `src/ui/idleVillage/components/gameFrame/heroSheetViewModel.ts`
- `src/ui/idleVillage/components/gameFrame/hudPanelRegistry.ts`
- `src/ui/idleVillage/components/gameFrame/hudTones.ts`
- `src/ui/idleVillage/components/gameFrame/index.ts`
- `src/ui/idleVillage/components/gameFrame/poiSigillo.ts`
- `src/ui/idleVillage/components/gameFrame/questAvailability.ts`
- `src/ui/idleVillage/components/gameFrame/questRevealSchedule.ts`
- `src/ui/idleVillage/components/gameFrame/questShellLayout.ts`
- `src/ui/idleVillage/components/gameFrame/questSkillCheckWarm.ts`
- `src/ui/idleVillage/components/gameFrame/resolveWorldManifest.ts`
- `src/ui/idleVillage/components/gameFrame/stageZones/solveStageLayout.ts`
- `src/ui/idleVillage/components/gameFrame/useCompactTop.ts`
- `src/ui/idleVillage/components/gameFrame/useHudMaterial.ts`
- `src/ui/idleVillage/components/gameFrame/useHudPanels.ts`
- `src/ui/idleVillage/components/gameFrame/useHudScale.ts`
- `src/ui/idleVillage/components/gameFrame/usePanelWhileOpen.ts`
- `src/ui/idleVillage/components/gameFrame/usePoiTypeIcon.ts`
- `src/ui/idleVillage/components/gameFrame/villageStashViewModel.ts`
- `src/ui/idleVillage/config/gamePerfBudgets.ts`
- `src/ui/idleVillage/config/worldSurfaceConfig.ts`
- `src/ui/idleVillage/frozen/_infra/CanonicalDataBridge.ts`
- `src/ui/idleVillage/hooks/useFrameMetrics.ts`
- `src/ui/idleVillage/hooks/useReducedMotion.ts`
- `src/ui/idleVillage/hooks/useThrottledValue.ts`
- `src/ui/idleVillage/interaction/dragSensors.ts`
- `src/ui/idleVillage/interaction/magneticCollision.ts`
- `src/ui/idleVillage/interaction/useDragOutcome.ts`
- `src/ui/idleVillage/pixiSpike/pixiDestroy.ts`
- `src/ui/idleVillage/questS1Lab/questArt.ts`
- `src/ui/idleVillage/questS1Lab/questOffer.ts`
- `src/ui/idleVillage/questS1Lab/questPhaseRecord.ts`
- `src/ui/idleVillage/questS1Lab/questSchedule.ts`
- `src/ui/idleVillage/questS1Lab/questSimulation.ts`
- `src/ui/idleVillage/questS1Lab/questTickCounter.ts`
- `src/ui/idleVillage/questS1Lab/useQuestRun.ts`
- `src/ui/idleVillage/quests/rosterCompatibility.ts`
- `src/ui/idleVillage/rosterV2/heroLevelCue.ts`
- `src/ui/idleVillage/rosterV2/heroLevelUpEvents.ts`
- `src/ui/idleVillage/rosterV2/heroLevelViewModel.ts`
- `src/ui/idleVillage/rosterV2/index.ts`
- `src/ui/idleVillage/rosterV2/mountedCardRegistry.ts`
- `src/ui/idleVillage/rosterV2/runHeroLevelUpStaging.ts`
- `src/ui/idleVillage/skins/dayNightPoiSkinConfig.ts`
- `src/ui/idleVillage/skins/resolveInitialSkin.ts`
- `src/ui/idleVillage/slots/useResidentSlotController.ts`
- `src/ui/idleVillage/store/useVillageStashStore.ts`
- `src/ui/idleVillage/utils/gameAssetWarmup.ts`
- `src/ui/idleVillage/utils/gamePerfProbe.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `hud-panels-menu` (batch B1-fixed-hud, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — coerenza open-empty: verificare cosa mostra E/Q/P senza contenuto.
- PLAN-043 WS-5 scheda `hud-panels-menu` (batch B1-fixed-hud, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — coerenza open-empty: verificare cosa mostra E/Q/P senza contenuto.
- PLAN-043 WS-5 scheda `hero-sheet` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — solo coerenza visiva; overlay contract WS-2 intoccato.
- PLAN-043 WS-5 scheda `hero-sheet` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — solo coerenza visiva; overlay contract WS-2 intoccato.
- PLAN-043 WS-5 scheda `village-stash` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep (mock) — allineare plating a Roster.
- PLAN-043 WS-5 scheda `stage-chrome` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — freeze; solo la voce questForecast va riconciliata (WS-4?); stato — boundary — questForecast dichiarato ma mai mountato/aperto; riconciliazione WS-3/WS-4 o D9 Director.
- PLAN-043 WS-5 scheda `panel-infra` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — investigare scala DOM/chrome (non solo Tauri); stato — documented — scala browser assente per design (useHudScale solo Tauri); decisione Director.
- PLAN-043 WS-5 scheda `panel-infra` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — investigare scala DOM/chrome (non solo Tauri); stato — documented — scala browser assente per design (useHudScale solo Tauri); decisione Director.
- PLAN-043 WS-5 scheda `panel-infra` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — investigare scala DOM/chrome (non solo Tauri); stato — documented — scala browser assente per design (useHudScale solo Tauri); decisione Director.
- PLAN-043 WS-5 scheda `panel-infra` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — investigare scala DOM/chrome (non solo Tauri); stato — documented — scala browser assente per design (useHudScale solo Tauri); decisione Director.
- PLAN-043 WS-5 scheda `panel-infra` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — investigare scala DOM/chrome (non solo Tauri); stato — documented — scala browser assente per design (useHudScale solo Tauri); decisione Director.
- PLAN-043 WS-5 scheda `panel-infra` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — investigare scala DOM/chrome (non solo Tauri); stato — documented — scala browser assente per design (useHudScale solo Tauri); decisione Director.
- PLAN-043 WS-5 scheda `panel-infra` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — investigare scala DOM/chrome (non solo Tauri); stato — documented — scala browser assente per design (useHudScale solo Tauri); decisione Director.
- PLAN-043 WS-5 scheda `panel-infra` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — investigare scala DOM/chrome (non solo Tauri); stato — documented — scala browser assente per design (useHudScale solo Tauri); decisione Director.
- PLAN-043 WS-5 scheda `panel-infra` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — investigare scala DOM/chrome (non solo Tauri); stato — documented — scala browser assente per design (useHudScale solo Tauri); decisione Director.
- PLAN-043 WS-5 scheda `poi-sigillo` (batch B4-map, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — riplating anelli su palette Roster/sigillo; stato — implemented — rimColors → --skin-hud-brass-crest/low/base, stone → nuovi --skin-poi-stone-*; zero delta visivo; forme/taglie = giudizio Director (F4).
- PLAN-043 WS-5 scheda `poi-sigillo` (batch B4-map, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — riplating anelli su palette Roster/sigillo; stato — implemented — rimColors → --skin-hud-brass-crest/low/base, stone → nuovi --skin-poi-stone-*; zero delta visivo; forme/taglie = giudizio Director (F4).
- PLAN-043 WS-5 scheda `poi-sigillo` (batch B4-map, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — riplating anelli su palette Roster/sigillo; stato — implemented — rimColors → --skin-hud-brass-crest/low/base, stone → nuovi --skin-poi-stone-*; zero delta visivo; forme/taglie = giudizio Director (F4).
- PLAN-043 WS-5 scheda `poi-sigillo` (batch B4-map, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — riplating anelli su palette Roster/sigillo; stato — implemented — rimColors → --skin-hud-brass-crest/low/base, stone → nuovi --skin-poi-stone-*; zero delta visivo; forme/taglie = giudizio Director (F4).
- PLAN-043 WS-5 scheda `poi-sigillo` (batch B4-map, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — riplating anelli su palette Roster/sigillo; stato — implemented — rimColors → --skin-hud-brass-crest/low/base, stone → nuovi --skin-poi-stone-*; zero delta visivo; forme/taglie = giudizio Director (F4).
- PLAN-043 WS-5 scheda `cursors` (batch B5-tools, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — pulizia asset post-approvazione; stato — implemented — 21 asset legacy rimossi; manifest+CSS invariati; 8/8 test verdi.

<!-- /plan054:generated -->
