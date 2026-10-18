# Idle Village Component Index

## Scopo

Indice unico dei componenti e integration contracts rilevanti per la vertical slice.

## Regole

- Questo file NON definisce i contratti.
- Questo file linka i documenti trusted.
- Ogni riga deve puntare a una sola source of truth.

## Tabella componenti

| Component / Contract | Area | Status | Source of Truth | Runtime/Test Page | Last Certified | Owner / Notes |
|---|---|---|---|---|---|---|
| Time Engine Contract | time | trusted | `src/docs/docs/idle_village/trusted/time_engine_trusted.md` | `/minimal-gameplay` | 2026-04-25 | Single tick source - INT-TIME-DAYNIGHT-001 completed, dual-layer verified |
| POI Standard Contract | poi | trusted | `src/docs/docs/idle_village/trusted/poi_standard_trusted.md` | dedicated page | 2026-04-22 | ActivityCapsule family |
| POI Detail Contract | poi-detail | trusted | `src/docs/docs/idle_village/trusted/poi_detail_trusted.md` | dedicated page | 2026-04-25 | PoiDetailSkinWrapper - TEST-POI-D-ALIGN-001 completed, integration verified |
| Day/Night Contract | day-night | trusted | `src/docs/docs/idle_village/trusted/daynight_trusted.md` | `/minimal-gameplay`, `/minimal-clock`, `/poi-quest-detail-roster-time-clock` | 2026-08-15 | Metal-noise square alpha-bleed fixed; `feComposite` clip to `SourceGraphic` verified. Progress halo `stroke-linecap` switched to `butt`. DayNightPoiSkin outer guide (binario) and progress halo track ring removed to eliminate the visible track around the medallion |
| Roster/Drag Contract | roster-drag | trusted | `src/docs/docs/idle_village/trusted/roster_drag_trusted.md` + `src/ui/idleVillage/roster/index.ts` | `/test`, `/minimal-gameplay` | 2026-07-15 | VillageRosterSection, DragContext, statMatching - INT-DRAG-POI-ASSIGNMENT-001 completed, assignment verified. Shared bundle adopted by MinimalGameplayPage (RT-MG-ROSTER-ADOPT-007). Single source of truth for roster UI across all pages. |
| WorldSurface Component Contract | world-surface-component | candidate | `src/docs/docs/plans/component_based_world_surface_plan.md` | `/world-surface-components` | 2026-07-21 | Component-based map with semantic grouping; candidate contract supersedes layer-centric manifest v1. Trusted doc TBD after Phase 6 close-out. |
| Interaction Core (drag outcome, flight, extraction, bloom) | interaction-core | trusted | `src/docs/docs/idle_village/interaction_core_spec.md` | `/slot`, `/minimal-roster-slot-integration`, `/minimal-job-poi-roster-integration`, `/game` (planner token swap) | 2026-10-15 | useDragOutcome, DragOutcomeFlight, useExtractionSequence, bloomEffect, RosterDropVerdict, lockedResidentIds; slot blueprints now support role/emptyPenalty/residentRiskModifiers; `useExtractionSequence.cancel` a `progress===0` ora abortisce la sequenza schedulata (fix R-195: token-drag che arma prima del primo frame non deve estrarre) |
| POI Quest System (questPoiKit) | poi-quest | draft | `src/ui/idleVillage/frozen/kits/questPoiKit.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-14 | MagicCircleHalo (iscrizione che si scrive dalle ore 12, timer della quest), useMilestoneEngine (una milestone per fase, equispaziate), MilestoneCheckModal (consumabili → Destiny Astrolabe V1), FloatingPanel (pannelli spostabili/riducibili, non bloccanti — desiderata v4), QuestRewardPanel (schermata ricompensa sui ruoli del design system), QuestChronicle esteso con rope luminosa; durata da `QuestPhase.durationValue` (non da `durationFormula`), difficoltà da `questSkillCheckConfig`. R-005 / desiderata v3 + v4. Kit `draft`: manca il contract per `certified`. Evidence: `test-results/poi-quest-system-r005-2026-08-11.md` |
| Quest Assignment Rework | quest-assignment | deprecated | `src/docs/docs/plans/quest_role_assignment_rework_strategy.md` | `/poi-quest-detail-roster-integration` | 2026-10-01 | Preview path (`useQuestAssignmentPreview`/`QuestAssignmentPreview`, QuestPowerEngine preview) superseded by Mission Planner; wired on `PoiDetailQuestRosterIntegrationPage` only as legacy. Surviving canonical inputs: `slotBlueprints` fields `role`/`emptyPenalty`/`residentRiskModifiers` |
| Mission Planner | mission-planner | candidate | `src/docs/docs/idle_village/mission_planner_spec.md` + `mission_planner_math_spec.md` | `/poi-quest-detail-roster-time-clock` | 2026-10-01 | Draft→preview→resolver on one DP (rng-free), per-member risk, checkpoint dual preview (D2). Promotion criterion → `trusted`: E2E suite `missionPlanner.spec.ts` green + spec survives the PLAN-019 S2/S3 quest-model remap without contract breaks |
| Quest Run Window (quest in corso) | quest | candidate | `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx` + `{QuestPartyRosterPanel,QuestBeltPlaque,QuestLogPanel,QuestCheckOptionsPanel,questShellLayout,engravedIcons,villageStashItemIcons}.tsx/ts` + `src/docs/docs/idle_village/quest_theatre_spec.md` + `quest_ui_component_guide.md` §10-§11 | `/game`, `/quest-window-lab` (isolato) | 2026-10-16 | **Componente battezzato** per la quest in corso su `/game` (Director 2026-10-09, PLAN-019-S2 D-F; R-106) — **unica superficie** dopo T-012 (teardown totale di `QuestTheatre`/`/game-frame-theatre`/tab primitives). Pannello HUD fluttuante (`HudPlaque` + `useHudPanelDrag`): teatro cinema, scelte, barra tempo, tile fasi; owner del run = `useQuestRun`/`questRun.ts` (grafo v27, frontiera `submitCommand`/`matureReady`, persistenza `engineSchemaVersion=2`). PLAN-025 T-004…T-012 convergenti: `beatSequencer`, `cinemaFx`, `CombatStrip`. Budget rinegoziato 2026-10-09: vincolo = percorso skip ≤ +10% baseline. **R-196 (2026-10-15, artifact-r006 CONVERGED, «procedi»):** redesign cinematografico — `widthPx 640`/`theaterAspect 2.9`/`topPx 88` da `gameFrameConfig`; colonne compagne co-visibili (`QuestPartyRosterPanel` a sinistra con solo `run.party` dentro `RosterKitShell`, `QuestBeltPlaque` sotto, `QuestLogPanel` a destra con `ico-scroll`), predicato condiviso `resolveQuestShellLayout` (auto-collapse < 1052px), clamp d'unione in `useHudPanelDrag` + ResizeObserver; Belt icona-pura `nav-bag` con arm/disarm per-item (`armedFlags`, `aria-pressed`, passivi `data-belt-status="passive"` non-toggle); `stepArmedActionItems` unica routine preview(clone)/esecuzione(live) — consumo solo su commit check/combat validati, mai su scelte narrative; `consumableBonusFor` tie-break copertura stat → bonus → catalogo; `skipAll` rimosso, `BeatStage` con vero `<button>` Continue; trigger testata `aria-expanded`/`aria-controls`, focus-return alla chiusura. Override R-196: supera SP-4 `BagStrip` inline (strip resta per l'HUD del lab), Popover mutuamente esclusivo (R-133), `widthPx` 460 (PLAN-025 D-7). Evidence: `.mw/runs/r196-quest-window/` (manifest, bundle, metrics-dom.json, signoff BV-1, screenshot), `test-results/r196-quest-window/`; storici `t011`/`t012`. **R-199 (2026-10-15):** rev.2 — `widthPx 820`/`stageMaxHeightPx`, `companionsDefaultOpen false` (revoca il «tutto visibile» R-196), skip senza pulsante (click/tasto su stage, filtro `isInteractiveTarget`), esiti/economia spostati a `QuestRewardPopup` esterno page-level (non-modale, staged/skippabile, `Esc`→focus-return), astrolabe `DestinyAstrolabeV62Standalone` docked sul teatro ai check (verdetto engine-only, `checkHoldMs`/`checkVerdictMs` beats), `QuestCheckOptionsPanel` (skip intro/skip check, PersistenceService `questCheckOpts`), frontier `waiting` con `readyAt` (fasi future visibili ma non committabili, pace da `durationDays` config), `abandon()`→`flee` con conferma inline (header, `ico-gust`), belt trigger accanto alle scelte. Evidence: `.mw/runs/r199-quest-window-rev2/` |
| Quest Reward Popup (esito quest) | quest | candidate | `src/ui/idleVillage/components/gameFrame/QuestRewardPopup.tsx` + `QuestEpilogue.tsx` (corpo) + `quest_ui_component_guide.md` §11 | `/game` | 2026-10-16 | Schermata di esito/ricompensa come componente **esterno** alla quest window (R-199 punto 14, Director): placca `HudPlaque` fluttuante montata a livello pagina in `game-frame-pixi`, **non modale** (no backdrop/`aria-modal`, mappa visibile, Pillar 1), draggable via `useHudPanelDrag`. Reveal staged da `questWindow.rewardPopup.stageMs` (banner esito → sezioni `QuestEpilogue` → riga Chiudi), click/tasto anticipa lo stadio (stesso contratto skip dei beat), `Esc` chiude con focus-return; il dismiss riusa le semantiche del report (settled-run clear, release loadout, consumo POI — repeatable restano). Apertura: `run.ended` + beat presentati. `QuestEpilogue` è il corpo condiviso (sezioni `data-epilogue-section` rivelate per indice). Tests `questRewardPopup.test.tsx` 6/6. |
| Test Roster Population | roster-data | trusted | `scripts/populate-test-roster.js` | N/A | 2026-04-27 | Script ufficiale per popolare roster di test con 3 PG (Sir Spaccaculi 280HP, Salvatrice 210HP, Giggiolillo 195HP) |
| Character-to-Resident Contract | character-resident | trusted | `src/docs/docs/idle_village/trusted/character_resident_trusted.md` | `/test`, `/minimal-gameplay` | 2026-07-15 | CR-005 verified both surfaces consume the same canonical Village Resident Store; StoreConsistencyChecker + CanonicalStoreVerification tests pass |
| World Presentation Runtime Contract | world-presentation | trusted | `src/docs/docs/idle_village/trusted/world_presentation_runtime_trusted.md` | `/world-presentation-director` | 2026-07-22 | WorldState → PresentationOutput deterministic runtime; Foundation + DEMO verified. |
|| POI Family Contract | poi-family | candidate | `src/docs/docs/idle_village/poi_family_spec.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-15 | AI-friendly root spec; children: `poi_job_spec.md`, `poi_training_spec.md`, `poi_maintenance_spec.md`, `poi_cooldown_spec.md`, `quest_spec.md`. v7. Selector + quest start-pending verified. |
|| POI Job Contract | poi-job | draft | `src/docs/docs/idle_village/poi_job_spec.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-15 | One-shot / continuous jobs, stamina, auto-collect, resource HUD. |
|| POI Cooldown Contract | poi-cooldown | draft | `src/docs/docs/idle_village/poi_cooldown_spec.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-15 | Time-limited / expiring POIs. |
|| POI Training Contract | poi-training | draft | `src/docs/docs/idle_village/poi_training_spec.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-15 | Stat/XP training, low risk. |
|| POI Maintenance Contract | poi-maintenance | draft | `src/docs/docs/idle_village/poi_maintenance_spec.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-15 | Resource upkeep / building condition. |
|| clockKit Day/Night Time Engine | time-clock | candidate | `src/ui/idleVillage/frozen/kits/clockKit.md` | `/minimal-clock`, `/poi-quest-detail-roster-time-clock` | 2026-08-15 | `DayNightTimeEngineStrip` one-line drop-in; owns canonical `tick()` loop; `DayNightTimeEngineStripStandalone` mounts providers; Space is a global page-wide play/pause shortcut. No local timers in pages. Tests: `poiQuestRegressions.spec.ts` and `clockKitSpaceControl.spec.ts`. |
||| DayNightTimeEngineStrip | time | trusted | `src/docs/docs/idle_village/trusted/day_night_time_engine_strip_trusted.md` | `/minimal-clock`, `/poi-quest-detail-roster-time-clock` | 2026-08-15 | Component that owns the canonical `tick()` loop and the global `Space` play/pause shortcut. Display from `useMinimalGameplay` store; no local time state. Tests: `clockKitSpaceControl.spec.ts`. |
|||| PgCard / PgToken | roster | trusted | `src/docs/docs/idle_village/trusted/pgcard_trusted.md` | `/minimal-pgcard`, `/test`, `/minimal-gameplay` | 2026-08-17 | Draggable resident card/token: portrait, frame, drag/freeze semantics, spring-back, magnetic tilt. Hardcoded `border` on base card removed. Kit: `pgcardKit.md`. |
| Hero Sheet (scheda PG hover) | game-frame | candidate | `plans/PLAN-032-SP-1-hero-sheet.md` + `src/ui/idleVillage/components/gameFrame/{HeroSheetPanel,useHeroSheet,heroSheetMachine,heroSheetViewModel}` | `/game` | 2026-10-14 | PLAN-032 SP-1 (R-167): HudPlaque singleton ancorata al rail roster, apre su hover-intent (click = auto-assegnazione invariato, rosterV2/kit zero-touch). `useHeroSheet` single transition owner; registry `heroSheet` shortcut `p` solo riflette. Evidence: `test-results/PLAN-032-SP1-2026-10-14.log`, bundle `.mw/runs/plan032-sp1-2026-10-14/` |
| Village Stash (magazzino villaggio) | game-frame | candidate | `plans/PLAN-032-SP-2-village-stash.md` + `src/ui/idleVillage/components/gameFrame/{VillageStashPanel,MapBuildingPoi,villageStashViewModel,villageStashItemIcons}` + `src/balancing/config/idleVillage/villageStashConfig.ts` | `/game` | 2026-10-15 | PLAN-032 SP-2 (R-167): HudPlaque mock-backed da config Zod (non-goal: nessun inventario reale); registry `villageStash` shortcut `v` toggle. **PLAN-035 (R-194):** il marker `building-stash` sul continente è stato rimosso — il pannello si apre dal tooltip dell'edificio Magazzino dentro `VillageScreenView` (`village-open-stash`) e dal menu Pannelli; `villageStashConfig.marker` eliminato. Evidence: `test-results/PLAN-032-SP2-2026-10-14.log`, `test-results/plan-035-village-view/` |
| Merchant (mercante mock) | game-frame | candidate | `plans/PLAN-032-SP-3-merchant-panel.md` + `src/ui/idleVillage/components/gameFrame/{MerchantPanel,MockBuyControl,merchantOfferIcons}` + `src/balancing/config/idleVillage/merchantConfig.ts` | `/game` | 2026-10-15 | PLAN-032 SP-3 (R-167): HudPlaque mock-backed da `merchantConfig` Zod deepFrozen — `MockBuyControl` disabled nativo, zero prop callback; registry `merchant` shortcut `m`. **PLAN-035 (R-194):** il marker `building-merchant` sul continente è stato rimosso — il pannello si apre dal tooltip dell'Emporio dentro `VillageScreenView` (`village-open-merchant`) e dal menu Pannelli; `merchantConfig.marker` eliminato. Evidence: `test-results/PLAN-032-SP3-2026-10-14.log`, `test-results/plan-035-village-view/` |
| Village Screen View (menu edifici) | game-frame | candidate | `plans/PLAN-035-village-view-buildings.md` + `plans/PLAN-042-village-registry.md` + `src/ui/idleVillage/components/gameFrame/{VillageScreenView,VillageSlotOverlay,VillageRegistry,MockUpgradeControl,villageBuildingIcons}` + `src/balancing/config/idleVillage/villageBuildingsConfig.ts` | `/game` | 2026-10-16 | PLAN-035 (R-194, desiderata v30, artifact-r005 CONVERGED): view-mode `village` a tutta area dentro GameFrame — dual entry nav `Village` + regione dipinta, mappa Pixi inerte ma viva (`aria-hidden`/`inert`, ticker WebGL attivo). 11 pin icon-first da config Zod deep-frozen su `villaggio.png` (watermark rimosso, 3168×1344); toolbar roving tabindex; tooltip hover-pinnabile (grace 140ms, geometria misurata con flip/clamp/isteresi 16px, scroll-fallback corpo, focus-return al pin); `MockUpgradeControl` disabled nativo inerte; azioni `villageStash`/`merchant` dai tooltip; arbitro Escape unico window-bubble in `game-frame-pixi.tsx` (hero-sheet capture → quest → tooltip → exit). **PLAN-038 (R-202, artifact-r003 CONVERGED sha d5342089):** pin = etichetta di stato — `VillagePinFrame` per categoria (roundel/banner/shield) + badge tab (romano/`+`/lock) + `data-pin-frame`/`data-pin-state`; `VillageSlotOverlay` (nuovo) SVG viewBox 3168×1344 paint-first — ellissi footprint a due layer per `buildable`, vignetta+dotted per `locked`, pennant ≥II, glow `:has()` pin→regione; plaque insediamento + legenda visiva + aria-label stato/categoria/livello; config `region`/`ellipseOverride`/`stakeTicks`/`anchorNudge` con lint geometrici. Evidence: `test-results/plan-035-village-view/` (9/9 E2E headed, 4 witness en/it) + `test-results/plan-038-village-lots/` (spike + zoom), manifest `.mw/runs/plan-035-village-view/` + `.mw/runs/plan-038-village-lots/`. **PLAN-042 (R-206, artifact-r005 CONVERGED sha 4dac8cdb):** Settlement Registry — catalogo a `slotKind` discriminated union (`painted` con `region`/`anchor` obbligatori vs `registry` senza geometria), 11 painted + 5 registry-only (mageTower/adventurersGuild/sanctuary/alchemist/cemetery) + categoria `arcane` con frame `spire`; `VillageRegistry` drawer slide-over (chip «Registro» con badge + hotkey `r`, filter chips stato, sezioni per categoria, drill-in detail card view-state con focus trap e back, focus return alla riga by-id); `activeBuildingId` condiviso in `VillageScreenView` con precedenza selected>hovered e fallback a tre livelli (footprint → pin → riga); report `occludedAt{1280,1440,1920}` per painted; Escape focus-scoped (card→drawer→tooltip→map); seam `overlayArt` tipizzata ma inerte (nessuna entry v1). Evidence: `test-results/plan-042-village-registry/` (witness drawer/card en+it @1280/1440/1920), manifest `.mw/runs/plan-042-village-registry/` |
| Bag Strip (consumabili in viaggio) | game-frame | candidate | `plans/PLAN-032-SP-4-bag-strip.md` + `src/ui/idleVillage/components/gameFrame/{questBag.ts,BagStrip.tsx}` + HUD lab `questS1Lab/hud/{ActionZone,ConsumableBelt}.tsx` | `/game` (storico), lab S1 | 2026-10-15 | **R-196:** l'integrazione in `QuestRunWindow` (slot `data-bag-slot`) è stata ritirata a favore di `QuestBeltPlaque` (Belt icona-pura + arm/disarm per-item); il componente resta per l'HUD del lab S1. PLAN-032 SP-4 (R-167): strip read-only dei consumabili durante stati non-decisione (transit/pending + beat playback incl. replay finale). `questBagItems` unica derivazione strip+popover title-row; `bagStripVisible` predicato puro (mutua esclusione strutturale col `ConsumableBelt`, intoccato); slot wrapper ritenuto finché `bagEverPacked` — empty-slot tiene la baseline 1-row (`BAG_CHIP_ROW_PX` da `PRES.type.labelPx`) senza chrome; accessible name = label piena + qualificatore via template ICU `chipName`; marker armed aria-hidden sui check; i18n ICU `{label}` (divergenza documentata da `{{…}}`). Evidence: `test-results/PLAN-032-SP4-2026-10-14.log` + `plan-032-sp4-smoke-2026-10-14/` (en+it @900×640), bundle `.mw/runs/plan032-sp4-2026-10-14/` |
| Hero Level Decor (level-up mock) | rosterV2 | candidate | `plans/PLAN-032-SP-5-hero-levelup.md` + `src/ui/idleVillage/rosterV2/{HeroLevelDecor,heroLevelViewModel,heroLevelUpEvents,mountedCardRegistry,runHeroLevelUpStaging,heroLevelCue}` + `src/balancing/config/idleVillage/heroLevelConfig.ts` | `/game` | 2026-10-14 | PLAN-032 SP-5 (R-167): layer decorativo montato dentro il wrapper `data-resident-id` (pgcardKit/rosterKit intoccati) — slot sempre presente, badge `Lv {n}` ancorato top-right del `data-wanderlust-portrait`, ring resting, ignition overlay keyed per eventId, `TextFloater` portaled (mai clipato). Command `runHeroLevelUpStaging`: reject senza telemetria/cue su config invalida / target non-hero / zero card montate; accept → N flares + UNA `feature_action hero_levelup_mock` + UNA cue `playLevelUpCue` (WebAudio arpeggio). Bus tipato + `useHeroLevelUp` stub per la seam PROGRESSION.md; `mountedCardRegistry` unico owner del predicato on-screen. i18n ICU `{n}` (divergenza documentata da `{{n}}`). Evidence: `test-results/PLAN-032-SP5-2026-10-14.log` + `plan-032-sp5-smoke-2026-10-14/`, bundle `.mw/runs/plan032-sp5-2026-10-14/` |

## Regole di aggiornamento

- Se cambia il contratto di un componente, aggiornare il suo trusted doc.
- Aggiornare qui solo:
  - status
  - link
  - runtime/test page
  - data ultima certificazione
- Non copiare qui i dettagli del contratto.

## Workflow documentale

Per le procedure di freeze, update ed evidence requirements, fare riferimento a:
`idle-village-documentation-governance-pack.md` - Sezioni 1 (Policy ufficiale) e 4 (Procedura operativa)

Questo index segue le regole governative:

- Single source of truth per ogni componente
- Nessuna duplicazione dei contratti
- Aggiornamento solo di status/metadata in questa tabella
- I dettagli del contratto vivono nei documenti trusted linkati

## Navigazione trusted docs

### Time Engine

- **Contract**: `src/docs/docs/idle_village/trusted/time_engine_trusted.md`
- **Status**: trusted
- **Area**: Temporal engine
- **Last Certified**: 2026-04-25
- **Notes**: INT-TIME-DAYNIGHT-001 completed, dual-layer architecture verified

### POI Standard  

- **Contract**: `src/docs/docs/idle_village/trusted/poi_standard_trusted.md`
- **Status**: trusted
- **Area**: Point of Interest base components
- **Last Certified**: 2026-04-22

### POI Detail

- **Contract**: `src/docs/docs/idle_village/trusted/poi_detail_trusted.md`
- **Status**: trusted
- **Area**: Point of Interest detail components
- **Last Certified**: 2026-04-25
- **Notes**: TEST-POI-D-ALIGN-001 completed, integration verified

### POI Standard — Verification Harness

- **Contract**: `src/docs/docs/idle_village/trusted/poi_standard_trusted.md`
- **Status**: trusted
- **Area**: ActivityCapsule contract and POI visualization
- **Last Certified**: 2026-04-22
- **Verification**: RT-POI-S-001 completed, 100% compliant
- **Harness**: `src/ui/idleVillage/pages/PoiVerificationPage.tsx`

### Day/Night Cycle

- **Contract**: `src/docs/docs/idle_village/trusted/daynight_trusted.md`
- **Status**: trusted
- **Area**: Temporal cycle system
- **Last Certified**: 2026-08-15
- **Notes**: RT-DAYN-001 audit completed - fully compliant with trusted contract

### Roster/Drag System

- **Contract**: `src/docs/docs/idle_village/trusted/roster_drag_trusted.md` + `src/ui/idleVillage/roster/index.ts`
- **Status**: trusted
- **Area**: Drag & drop system architecture
- **Last Certified**: 2026-07-15
- **Notes**: INT-DRAG-POI-ASSIGNMENT-001 completed, assignment flow verified. Shared bundle adopted by MinimalGameplayPage (RT-MG-ROSTER-ADOPT-007). Single source of truth for roster UI across all pages.

### Character-to-Resident Architecture

- **Contract**: `src/docs/docs/idle_village/trusted/character_resident_trusted.md`
- **Status**: trusted
- **Area**: Character -> Resident conversion pipeline
- **Last Certified**: 2026-07-15
- **Notes**: CR-005 verified both `/test` and `/minimal-gameplay` consume the same canonical Village Resident Store; StoreConsistencyChecker + CanonicalStoreVerification tests pass

### World Presentation Runtime

- **Contract**: `src/docs/docs/idle_village/trusted/world_presentation_runtime_trusted.md`
- **Status**: trusted
- **Area**: World presentation runtime
- **Last Certified**: 2026-07-22
- **Notes**: `WORLD-PRESENTATION-RUNTIME-FOUNDATION` + `WORLD-PRESENTATION-RUNTIME-DEMO` verified; deterministic `WorldState → PresentationOutput` loop.

<!-- GOV-006-FROZEN-KITS-START -->
## Frozen Kits

| Kit ID | Status | Source of Truth | Runtime/Test Page | Last Certified | Owner / Notes |
| --- | --- | --- | --- | --- | --- |
| rosterKit | frozen | src/ui/idleVillage/frozen/kits/rosterKit.md | /minimal-roster | 2026-08-15 | Frozen re-export of VillageRosterSection / RosterDraggable with FULL_PROVIDER_CHAIN shell. |
| pgcardKit | frozen | src/ui/idleVillage/frozen/kits/pgcardKit.md | /minimal-pgcard | 2026-08-15 | Frozen re-export of PgCard with FULL_PROVIDER_CHAIN shell. |
| slotRackKit | frozen | src/ui/idleVillage/frozen/kits/slotRackKit.md | /minimal-slotRack | 2026-08-15 | Frozen re-export of ResidentSlotRack / ResidentSlotRackSkin with FULL_PROVIDER_CHAIN shell. R-214 visual behavior follow-up (2026-10-18): empty seats do not breathe from compatibility alone; valid bloom is active-target-only for occupied swaps. Public API/DOM structure unchanged; contract recheck pending. |
| destinyAstrolabeKit | candidate | `src/ui/idleVillage/frozen/kits/destinyAstrolabeKit.md` | `/minimal-destiny-astrolabe` | 2026-08-15 | Frozen re-export of DestinyAstrolabe with SkinSystemProvider shell; candidate pending full certification. **Superseded as canonical skill-check visual by destinyAstrolabeV62Kit (Director pick 2026-10-02).** |
| destinyAstrolabeV62Kit | candidate | `src/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit.tsx` | `/minimal-destiny-astrolabe-v6-2` | 2026-10-08 | **Canonical skill-check component** (Director-approved): DestinyAstrolabeV62 = V6 markup + viscous tar-goo challenge surface (WebGL2 SDF). Forced verdict via `config.mode` ∈ `bigwin\|win\|almost\|fail\|epicfail\|fail_wound\|fail_dead`; optional `config.harm` ∈ `none\|wound\|death` mirrors the host-resolved harm on the card chips (no second dice roll when mode is forced); `onResolve` fires after the spin lands. **Forced-mode honesty (2026-10-08):** `honestTargetPos` re-parks the landing target when the authored point falls outside its own zone (valley dips shrink the star; high stats push `win` past the wall) — `findZonePoint` in `ballGuidance.ts` scans for a point `spatialVerdict` actually claims, so the ball can never rest on the dark side under a WIN card. **Presentation ext (2026-10-08, PLAN-023):** `config.speed` ∈ `full|fast` scales spin/reveal timings; `skipToResult()` on the handle parks the ball on its resolved target and fires `onResolve` immediately; docked usage = explicit-sized wrapper in the stage band of `/quest-s1-lab` (cockpit). |
| poiKit | candidate | `src/ui/idleVillage/frozen/kits/poiKit.md` | `/minimal-poi` | 2026-08-15 | Frozen re-export of JobPOI/ActivityPOI/QuestPOI/DayNightPOI with DndContext provider chain. |
| clockKit | frozen | src/ui/idleVillage/frozen/kits/clockKit.md | /minimal-clock | 2026-07-14 | KIT_REGISTRY status: certified |
| resourceHudKit | candidate | `src/ui/idleVillage/frozen/kits/resourceHudKit.md` | `/minimal-resourcehud` | 2026-08-15 | Frozen re-export of ResourcePanel with SkinSystemProvider + SandboxTimingProvider shell. |
| questCardKit | candidate | `src/ui/idleVillage/frozen/kits/questCardKit.md` | `/minimal-questcard` | 2026-08-15 | Frozen re-export of QuestCard with SkinSystemProvider + SandboxTimingProvider shell. |
| outcomeKit | draft | src/ui/idleVillage/frozen/kits/outcomeKit.md | /minimal-outcome | 2026-07-14 | KIT_REGISTRY status: draft |
| marketKit | draft | src/ui/idleVillage/frozen/kits/marketKit.md | /minimal-market | 2026-07-14 | KIT_REGISTRY status: draft |
| skillCheckKit | candidate | `src/ui/idleVillage/frozen/kits/skillCheckKit.md` | `/minimal-skillcheck` | 2026-08-15 | Frozen re-export of SkillCheckComponent with SkinSystemProvider + SandboxTimingProvider shell. |
| activeHudKit | candidate | `src/ui/idleVillage/frozen/kits/activeHudKit.md` | N/A | 2026-08-15 | Frozen re-export of ActiveHUD with FULL_PROVIDER_CHAIN shell. |
| activityCapsuleKit | candidate | `src/ui/idleVillage/frozen/kits/activityCapsuleKit.md` | `/minimal-poi` | 2026-08-15 | Frozen re-export of ActivityCapsule with FULL_PROVIDER_CHAIN shell. |
| slottedMedalKit | candidate | `src/ui/idleVillage/frozen/kits/slottedMedalKit.md` | `/minimal-slot` | 2026-08-15 | Frozen re-export of SlottedMedal with FULL_PROVIDER_CHAIN shell. |
| jobDetailKit | candidate | `src/ui/idleVillage/frozen/kits/jobDetailKit.md` | `/minimal-job-detail` | 2026-08-15 | Canonical JobDetail panel with demo jobs and SkinSystemProvider + SandboxTimingProvider shell. |
| locationDetailKit | candidate | `src/ui/idleVillage/frozen/kits/locationDetailKit.md` | `/minimal-location-detail` | 2026-08-15 | Canonical LocationDetail panel; ancient-ruins demo location derived from C2 `ActivityDefinition`. |
| rosterSlotKit | draft | TBD | /minimal-roster-slot-integration | 2026-07-14 | KIT_REGISTRY status: draft |
| jobPoiRosterKit | draft | TBD | /minimal-job-poi-roster-integration | 2026-07-14 | KIT_REGISTRY status: draft |
| jobPoiRosterTimeKit | draft | TBD | /minimal-job-poi-roster-time-integration | 2026-07-14 | KIT_REGISTRY status: draft |

<!-- GOV-006-FROZEN-KITS-END -->

## Gameplay Component Specs — Catalog Session 2026-08-13

| Component / Contract | Area | Status | Source of Truth | Runtime/Test Page | Last Certified | Owner / Notes |
|---|---|---|---|---|---|---|
| Gameplay Components Inventory | catalog | draft | `src/docs/docs/idle_village/gameplay_components_inventory.md` | N/A | 2026-08-13 | T-001 — master catalog of gameplay components, stores, hooks, configs |
| TimeEngine Spec | time | draft | `src/docs/docs/idle_village/time_engine_spec.md` | `/minimal-gameplay` | 2026-08-13 | T-002 — state machine and scenarios |
| DayNightPOI Spec | time | draft | `src/docs/docs/idle_village/day_night_poi_spec.md` | `/minimal-gameplay`, `/poi-quest-detail-roster-time-clock` | 2026-08-14 | T-002 — POI family day/night visual; data-* contract verified in Playwright |
| FloatingPanel Spec | ui | draft | `src/docs/docs/idle_village/floating_panel_spec.md` | `/design-system` | 2026-08-13 | T-002 — draggable/minimizable panel wrapper |
| Roster Spec | roster | draft | `src/docs/docs/idle_village/roster_spec.md` | `/test`, `/minimal-gameplay` | 2026-08-13 | T-002 — drag state and assignment |
| SlotRack Spec | slots | draft | `src/docs/docs/idle_village/slot_rack_spec.md` | `/minimal-roster-slot-integration` | 2026-08-13 | T-002 — config-driven slot rack |
| POI Spec | poi | draft | `src/docs/docs/idle_village/poi_spec.md` | `/minimal-gameplay`, `/poi-verification` | 2026-08-13 | T-002 — ActivityCapsule behavior |
| Detail Spec | poi-detail | draft | `src/docs/docs/idle_village/detail_spec.md` | `/minimal-poi` | 2026-08-13 | T-002 — floating detail panel |
| Quest Spec | quest | draft | `src/docs/docs/idle_village/quest_spec.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-14 | T-002 — quest lifecycle and milestones; coperto da UI tests Playwright |
| TimeEngine ↔ DayNightPOI | interaction | draft | `src/docs/docs/idle_village/time_engine_day_night_poi_interaction_spec.md` | `/minimal-gameplay`, `/poi-quest-detail-roster-time-clock` | 2026-08-14 | T-N+1 — phase data flow; verified in Playwright |
| TimeEngine ↔ Roster | interaction | draft | `src/docs/docs/idle_village/time_engine_roster_interaction_spec.md` | `/test`, `/minimal-gameplay` | 2026-08-13 | T-N+1 — resident status updates |
| Roster ↔ SlotRack | interaction | draft | `src/docs/docs/idle_village/roster_slot_rack_interaction_spec.md` | `/minimal-roster-slot-integration`, `/poi-quest-detail-roster-time-clock` | 2026-08-14 | T-N+1 — drag validation and bloom; verificato da Playwright: compatibilità grigia, slot valid/invalid, assegnazione in detail |
| SlotRack ↔ POI | interaction | draft | `src/docs/docs/idle_village/slot_rack_poi_interaction_spec.md` | `/minimal-gameplay`, `/poi-quest-detail-roster-time-clock` | 2026-08-14 | T-N+1 — occupancy to start/collect; verificato da Playwright: bloom POI valid/invalid, assegnazione residente compatibile |
| POI ↔ Detail | interaction | draft | `src/docs/docs/idle_village/poi_detail_interaction_spec.md` | `/minimal-poi`, `/poi-quest-detail-roster-time-clock` | 2026-08-14 | T-N+1 — open/assign/close; verificato da Playwright: apertura, pausa, slot rack, drag header |
| POI ↔ Quest | interaction | draft | `src/docs/docs/idle_village/poi_quest_interaction_spec.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-14 | T-N+1 — quest lifecycle; verificato da Playwright end-to-end + astrolabe |
| TimeEngine ↔ Quest | interaction | draft | `src/docs/docs/idle_village/time_engine_quest_interaction_spec.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-14 | T-N+1 — phase/milestone timing; verificato da Playwright pause/resume + speed 8x |
| Gameplay System Complete | system | draft | `src/docs/docs/idle_village/gameplay_system_complete.md` | N/A | 2026-08-13 | T-FINAL — end-to-end narrative |
| POI Quest Detail/Roster/Time/Clock — Page Workflow | page | draft | `src/docs/docs/idle_village/poi_quest_detail_roster_time_clock_page_workflow.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-15 | R-010 — workflow pagina specifica; test hook Playwright esposti; ERR-028/030 chiusi; 6/6 UI tests pass |
| POI Quest Detail/Roster/Time/Clock — Error Registry | page | draft | `src/docs/docs/idle_village/poi_quest_detail_roster_time_clock_error_registry.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-15 | R-010 — registro errori pagina; ERR-010/011/012/013 e ERR-028/029/030/031/032/033 chiusi, ERR-014 confermato |
|| Idle Village Gameplay Math | math | candidate | `src/docs/docs/idle_village/idle_village_gameplay_math_spec.md` | N/A | 2026-08-16 | Gameplay math spec: time, fatigue, injury, quest power, rewards |
|| Skill Check / Spell Resolution Workflow | skill | candidate | `src/docs/docs/idle_village/skill_check_workflow_spec.md` | `/minimal-skillcheck` | 2026-08-16 | D20 and D100 skill-check subsystems, spell creator gap |
|| Village Event System | events | candidate | `src/docs/docs/idle_village/village_event_system_spec.md` | `/minimal-gameplay` | 2026-08-16 | `VillageEvent` lifecycle and world-event integration gaps |
|| Quest Failure, Timeout and Recovery | quest | candidate | `src/docs/docs/idle_village/quest_failure_and_recovery_spec.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-16 | Quest outcomes, failure/recovery UI, timeout behavior |

---

*Last Updated: 2026-08-16*
*Status: Reconciled from KIT_REGISTRY + gameplay catalog session + time engine / POI family / clock docs alignment.*
