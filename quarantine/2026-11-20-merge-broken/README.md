# Quarantena — merge 2026-11-20 (backup R-357 → main)

File spostati **fuori da `src/`, `tests/` e `scripts/`** (`git mv`, quindi la storia resta tracciata) perché
contenevano errori di parsing già presenti su `origin/main`, oppure dipendono da quei file.
Nessun file è stato cancellato: per ripristinare basta il percorso inverso con `git mv`.

**Motivo.** Dodici file hanno errori di sintassi (tag JSX non chiusi, stringhe mescolate, righe
troncate). Non esiste una copia pulita: sono identici in `origin/main`, nel backup e in tutti i
worktree sul disco. Il type-check si fermava a questi errori, quindi non ha mai controllato il resto
del progetto. Ricostruirli a mano avrebbe richiesto di indovinare il codice, quindi sono in
quarantena in attesa di una decisione.

**Stato del repository dopo lo spostamento.**
- `npm run build` (Vite): passa.
- `tsc -p tsconfig.app.json`: nessun errore di sintassi. Restano circa 3.900 errori di tipo in 641 file,
  che esistevano già ma erano coperti dagli errori di sintassi.

**Come ripristinare un file.** `git mv quarantine/2026-11-20-merge-broken/<percorso> <percorso>`.

## File in quarantena (percorso originale)

Totale: 81 file.

- `scripts/guardian/guardianAutopushDryRun.ts`
- `scripts/idleVillage/foodChainAlert.ts`
- `src/analytics/guardian/GuardianDryRunAnalyzer.ts`
- `src/analytics/idleVillageMapAssetTelemetry.ts`
- `src/pages/idle-village.tsx`
- `src/ui/balancing/components/ArchetypeComparisonMatrix.tsx`
- `src/ui/idleVillage/VillageSandbox.cycle.test.tsx`
- `src/ui/idleVillage/VillageSandbox.tsx`
- `src/ui/idleVillage/__tests__/VillageSandbox.cycle.test.tsx`
- `src/ui/idleVillage/__tests__/VillageSandbox.skeleton.test.tsx`
- `src/ui/idleVillage/__tests__/VillageSandbox.test.tsx`
- `src/ui/idleVillage/__tests__/testUtils/mockVillageSandboxContext.ts`
- `src/ui/idleVillage/components/CardDetail.tsx`
- `src/ui/idleVillage/components/MapPerformanceProfiler.tsx`
- `src/ui/idleVillage/components/MapPerformanceProfilerHUD.tsx`
- `src/ui/idleVillage/components/MultiVillageMonitorPanel.tsx`
- `src/ui/idleVillage/components/PgCardTS002.tsx`
- `src/ui/idleVillage/components/QuestDecisionHeatmap.tsx`
- `src/ui/idleVillage/components/__tests__/LocationDetail.test.tsx`
- `src/ui/idleVillage/config/mapPerformanceProfilerConfig.ts`
- `src/ui/idleVillage/debug/PortraitDebugPage.tsx`
- `src/ui/idleVillage/hooks/__tests__/useActionDetailHarness.test.ts`
- `src/ui/idleVillage/hooks/__tests__/useSandboxDragController.test.ts`
- `src/ui/idleVillage/hooks/useActionDetailHarness.ts`
- `src/ui/idleVillage/hooks/useDragDropTelemetry.ts`
- `src/ui/idleVillage/hooks/useMapContext.test.ts`
- `src/ui/idleVillage/hooks/useMapContext.ts`
- `src/ui/idleVillage/hooks/useMapPerformanceProfiler.ts`
- `src/ui/idleVillage/hooks/useMultiVillageMonitor.ts`
- `src/ui/idleVillage/hooks/useSandboxCore.ts`
- `src/ui/idleVillage/hooks/useSandboxCoreActionDetail.ts`
- `src/ui/idleVillage/hooks/useSandboxDragController.ts`
- `src/ui/idleVillage/hooks/useVillageSandbox.ts`
- `src/ui/idleVillage/isolation/ExtractionIso.tsx`
- `src/ui/idleVillage/isolation/index.tsx`
- `src/ui/idleVillage/legacy/StyleLabMapPage.tsx`
- `src/ui/idleVillage/map/MapPage.test.tsx`
- `src/ui/idleVillage/map/MapPage.tsx`
- `src/ui/idleVillage/roster/roster.ts`
- `src/ui/idleVillage/services/__tests__/multiVillageSchedulerMonitor.test.ts`
- `src/ui/idleVillage/services/multiVillageSchedulerMonitor.ts`
- `src/ui/idleVillage/tools/IdleVillageToolsPage.tsx`
- `src/ui/idleVillage/tools/ResidentRelationshipGraph.tsx`
- `src/ui/idleVillage/types/IdleVillageTestHooks.ts`
- `src/ui/idleVillage/utils/mapPerformanceProfilerEngine.ts`
- `src/ui/idleVillage/utils/mapPerformanceProfilerExporter.ts`
- `tests/active-hud-regression.spec.ts`
- `tests/activity-cards-parity.spec.ts`
- `tests/components/LocationCard.playwright.spec.ts`
- `tests/components/VillageSandbox.isolation.test.tsx`
- `tests/fixtures/villageSandbox.ts`
- `tests/idle-village-drag.spec.ts`
- `tests/magic-card-capture.spec.ts`
- `tests/skill-check-preview.spec.ts`
- `tests/unit/balancing/ArchetypeComparisonMatrix.test.tsx`
- `tests/unit/guardian/GuardianDryRunAnalyzer.test.ts`
- `tests/unit/idleVillage/FoodChainAlertCLI.test.ts`
- `tests/unit/idleVillage/MapPerformanceProfiler.test.tsx`
- `tests/unit/idleVillage/QuestDecisionHeatmap.test.tsx`
- `tests/unit/idleVillage/ResidentRelationshipGraphTool.test.tsx`
- `tests/unit/idleVillage/useDragDropTelemetry.test.tsx`
- `tests/unit/idleVillage/useMapContext.test.tsx`
- `tests/utils/sandbox.ts`
- `tests/utils/villageSandboxTrade.ts`
- `tests/utils/waitForRosterFeedback.ts`
- `tests/villageSandbox-action-detail-harness.spec.ts`
- `tests/villageSandbox-demo.spec.ts`
- `tests/villageSandbox-drag-assign.spec.ts`
- `tests/villageSandbox-dropstate.spec.ts`
- `tests/villageSandbox-hud.spec.ts`
- `tests/villageSandbox-layout.spec.ts`
- `tests/villageSandbox-location-card.spec.ts`
- `tests/villageSandbox-location.spec.ts`
- `tests/villageSandbox-picker.spec.ts`
- `tests/villageSandbox-quest.spec.ts`
- `tests/villageSandbox-reset.spec.ts`
- `tests/villageSandbox-resource.spec.ts`
- `tests/villageSandbox-roster.spec.ts`
- `tests/villageSandbox-theater.spec.ts`
- `tests/villageSandbox-trade-refactored.spec.ts`
- `tests/villageSandbox-trade.spec.ts`
