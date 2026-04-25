# SAFE Cleanup Audit — 24 Dec 2025

## Scope

- Repository: RPG Balancer (personal sandbox)
- Moodboard target: **Villaggio di Frontiera** (rustico / ardesia / ambra)
- SAFE procedure phases 1 & 2 complete. Phase 3 pending approval for execution details below.
- Protected files confirmed untouched: `TimeEngine.ts`, `defaultConfig.ts`, `VillageSandbox.tsx`, all Zustand stores.

## Phase 1 — Code Audit

### 1. Orphaned files (from `npx madge src --extensions ts,tsx,css --ts-config tsconfig.json --orphans`)

Grouped by area for readability. These paths are not currently imported into `src/main.tsx` dependency graph.

1. **Balancing + Engine (legacy/tests)**
   - `balancing/modules/__tests__/*.test.ts`
   - `balancing/modules/index.ts`
   - `balancing/persistence/__tests__/*.test.ts`
   - `balancing/simulation/**/*` (analyzeBalance, cli, verify_matrix, tests)
   - `balancing/spell/*` (`SpellBuilder.ts`, `spellSeed.ts`)
   - `balancing/statusEffects/__tests__/*.test.ts`
   - `balancing/synergy/index.ts`
   - `balancing/testing/**/*` (StatPointValuation, runStatStressTests.cli, tests)
   - `balancing/verification/*`
   - `engine/combat/__tests__/*`, `engine/idle/__tests__/combatEngine.test.ts`
   - `engine/game/SurvivalGameMode.ts`, `engine/game/tactical/__tests__/*`, `engine/game/idleVillage/TimeEngine.test.ts`

2. **UI (legacy labs + mockups)**
   - `ui/balancing/*` (legacy demos: `BalancerObservatoryDemo.tsx`, `BalancingLab.tsx`, `SpecularTester.tsx`, etc.)
   - `ui/testing/*` (AltVisuals V3–V7, StressTestDashboard, SynergyMatrix, etc.)
   - `ui/fantasy/mockups/*` (ArcaneTechGlass, GildedObservatory, CelestialLedger, etc.)
   - `ui/arena/*`, `ui/components/GenericParamCard.tsx`, `ui/dashboard/SimulationDashboard.tsx`, `ui/editor/EntityCreator.tsx`
   - `ui/fantasy/atoms/index.ts`, `ui/fantasy/molecules/*`, `ui/fantasy/navConfig.ts`, `ui/theme/FantasyTheme.ts`
   - `ui/grid/GridArena.tsx`, `ui/layout/*`, `ui/overlay/OverlayShell.tsx`, `ui/pages/CompactDemo.tsx`
   - `ui/persistence/ConfigPersistence.tsx`, `ui/spell/SpellCreation.tsx`, `ui/spell/components/*`, `ui/spells/SpellCreatorNewMockup.tsx`
   - `ui/verification/VerificationLab.tsx`
   - `ui/idleVillage/IdleVillageMapPage.full.tsx`, `ui/idleVillage/IdleVillagePage.tsx`, `ui/idleVillage/MarbleVerbCard.tsx`, `ui/idleVillage/dragConstants.ts`

3. **Misc Roots / Config**
   - `components/balancing/archetype/__tests__/ArchetypeBuilder.integration.test.tsx`
   - `components/balancing/archetype/index.ts`
   - `data/characterIcons.ts`
   - `pages/idle-village.tsx`
   - `scripts/rebalanceSpells.ts`
   - `shared/hooks/useWeightedBalance.ts`
   - `shared/storage/createJsonConfigStore.ts`
   - `shared/testing/*` (StorageTestFramework + integration suites)
   - `setupTests.ts`, `vite-env.d.ts`
   - `index.old.css`

CI/test infrastructure files may remain even if orphaned; removal requires separate approval.

### 2. Dead exports

- `npx ts-unused-exports tsconfig.json` → **0 modules with unused exports**. Nessuna funzione/interfaccia risultata orfana.

## Phase 2 — Visual Asset Audit

Target: eliminare riferimenti a palette “Gilded/Celestial/Observatory”. Elementi da spostare o ritematizzare nella fase 3.

1. **Global styles & tokens**
   - `src/styles/color-palette.css`: interamente dedicato ai token “Gilded Observatory Core” (obsidian/gold/teal) → sostituire con palette Villaggio di Frontiera o spostare in `_OLD_DEPRECATED`.
   - `src/styles/fantasy-theme.css`: sezione “Base Styles – Gilded Observatory” + pannelli marmo/oro (linee 182+) → stessa azione.
   - `src/index.old.css`: importa direttamente `fantasy-theme.css` + `color-palette.css` → archiviare se non più necessario.

2. **Componenti React tematici**
   - `src/ui/fantasy/mockups/GildedObservatory.tsx`
   - `src/ui/fantasy/mockups/GildedCardShowcase.tsx`
   - `src/ui/balancing/BalancerObservatoryDemo.tsx`
   - `src/ui/balancing/GildedSmartInput.tsx`
   - `src/ui/balancing/GildedCardWrapper.tsx`
   - Tutte le restanti mockup pages in `src/ui/fantasy/mockups/*` (ArcaneTechGlass, CelestialLedger, AuroraWorkshop, ecc.) ancora puntate dal nav principale.

3. **Navigation / Entry Points**
   - `src/App.tsx` e `src/shared/navigation/navConfig.ts` mantengono tab `mockGildedObservatory`, `mockAuroraWorkshop`, ecc. → se spostiamo i componenti, occorre rimuovere/aggiornare i tab o farli puntare a varianti “Frontier Village”.

## Phase 3 — Pending Execution Plan

1. **Create `_OLD_DEPRECATED/` (repo root)** e spostarvi i file marcati sopra (componenti mockup, CSS dorati, alt visuals obsoleti, etc.).
2. **Aggiornare App/navigation** per eliminare i tab che puntano a componenti spostati oppure sostituirli con placeholder coerenti col moodboard.
3. **Verifica build:** `npm run build` (o almeno `tsc && vite build`) per garantire assenza di `Module not found`.
4. **Documentazione:** aggiornare questo report se emergono altri file durante lo spostamento.

## Approvals & Next Steps

- ✅ Phases 1 & 2 complete.
- ⏳ Phase 3 in corso di esecuzione (con questo documento come riferimento).
- Dopo Phase 3: aggiornare `MASTER_PLAN.md` (sezione “Current Focus” o Phase 10 notes) e il tracker TODO con riferimento a questo report.
