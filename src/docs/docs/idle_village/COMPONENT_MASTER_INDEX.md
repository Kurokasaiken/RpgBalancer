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
| POI Quest System (questPoiKit) | poi-quest | superseded | `src/ui/idleVillage/frozen/kits/questPoiKit.md` | `/poi-quest-detail-roster-time-clock` (harness deprecato) | 2026-10-19 | **PLAN-054 T-003:** kit harness-era superseded su `/game` da `QuestRunWindow`/`QuestRewardPopup` + `CTR-game-008`/`CTR-game-009` (MagicCircleHalo→Sigillo halo, QuestChronicle→run window, MilestoneCheckModal→DestinyAstrolabeV62, QuestRewardPanel→QuestRewardPopup). Storico: MagicCircleHalo, useMilestoneEngine, FloatingPanel, durata da `QuestPhase.durationValue`, R-005/desiderata v3+v4. Evidence storica: `test-results/poi-quest-system-r005-2026-08-11.md` |
| Quest Assignment Rework | quest-assignment | deprecated | `src/docs/docs/plans/quest_role_assignment_rework_strategy.md` | `/poi-quest-detail-roster-integration` | 2026-10-01 | Preview path (`useQuestAssignmentPreview`/`QuestAssignmentPreview`, QuestPowerEngine preview) superseded by Mission Planner; wired on `PoiDetailQuestRosterIntegrationPage` only as legacy. Surviving canonical inputs: `slotBlueprints` fields `role`/`emptyPenalty`/`residentRiskModifiers` |
| Mission Planner | mission-planner | candidate | `src/docs/docs/idle_village/mission_planner_spec.md` + `mission_planner_math_spec.md` | `/game` (planner quest expedition); `/poi-quest-detail-roster-time-clock` deprecated | 2026-10-19 | Draft→preview→resolver on one DP (rng-free), per-member risk, checkpoint dual preview (D2). **PLAN-054 T-003:** scenari `/game` mappati su `CTR-game-007.INV-1/INV-2` + `CTR-game-008.INV-1`. Promotion criterion → `trusted`: E2E suite `missionPlanner.spec.ts` green + spec survives the PLAN-019 S2/S3 quest-model remap without contract breaks |
| Quest Run Window (quest in corso) | quest | candidate | `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx` + `{QuestPartyRosterPanel,QuestBeltPlaque,QuestLogPanel,QuestCheckOptionsPanel,questShellLayout,engravedIcons,villageStashItemIcons}.tsx/ts` + `src/docs/docs/idle_village/quest_theatre_spec.md` + `quest_ui_component_guide.md` §10-§11 | `/game`, `/quest-window-lab` (isolato) | 2026-10-21 | **Componente battezzato** per la quest in corso su `/game` (Director 2026-10-09, PLAN-019-S2 D-F; R-106) — **unica superficie** dopo T-012 (teardown totale di `QuestTheatre`/`/game-frame-theatre`/tab primitives). Pannello HUD fluttuante (`HudPlaque` + `useHudPanelDrag`): teatro cinema, scelte, barra tempo, tile fasi; owner del run = `useQuestRun`/`questRun.ts` (grafo v27, frontiera `submitCommand`/`matureReady`, persistenza `engineSchemaVersion=2`). PLAN-025 T-004…T-012 convergenti: `beatSequencer`, `cinemaFx`, `CombatStrip`. Budget rinegoziato 2026-10-09: vincolo = percorso skip ≤ +10% baseline. **R-196 (2026-10-15, artifact-r006 CONVERGED, «procedi»):** redesign cinematografico — `widthPx 640`/`theaterAspect 2.9`/`topPx 88` da `gameFrameConfig`; colonne compagne co-visibili (`QuestPartyRosterPanel` a sinistra con solo `run.party` dentro `RosterKitShell`, `QuestBeltPlaque` sotto, `QuestLogPanel` a destra con `ico-scroll`), predicato condiviso `resolveQuestShellLayout` (auto-collapse < 1052px), clamp d'unione in `useHudPanelDrag` + ResizeObserver; Belt icona-pura `nav-bag` con arm/disarm per-item (`armedFlags`, `aria-pressed`, passivi `data-belt-status="passive"` non-toggle); `stepArmedActionItems` unica routine preview(clone)/esecuzione(live) — consumo solo su commit check/combat validati, mai su scelte narrative; `consumableBonusFor` tie-break copertura stat → bonus → catalogo; `skipAll` rimosso, `BeatStage` con vero `<button>` Continue; trigger testata `aria-expanded`/`aria-controls`, focus-return alla chiusura. Override R-196: supera SP-4 `BagStrip` inline (strip resta per l'HUD del lab), Popover mutuamente esclusivo (R-133), `widthPx` 460 (PLAN-025 D-7). Evidence: `.mw/runs/r196-quest-window/` (manifest, bundle, metrics-dom.json, signoff BV-1, screenshot), `test-results/r196-quest-window/`; storici `t011`/`t012`. **R-199 (2026-10-15):** rev.2 — `widthPx 820`/`stageMaxHeightPx`, `companionsDefaultOpen false` (revoca il «tutto visibile» R-196), skip senza pulsante (click/tasto su stage, filtro `isInteractiveTarget`), esiti/economia spostati a `QuestRewardPopup` esterno page-level (non-modale, staged/skippabile, `Esc`→focus-return), astrolabe `DestinyAstrolabeV62Standalone` docked sul teatro ai check (verdetto engine-only, `checkHoldMs`/`checkVerdictMs` beats), `QuestCheckOptionsPanel` (skip intro/skip check, PersistenceService `questCheckOpts`), frontier `waiting` con `readyAt` (fasi future visibili ma non committabili, pace da `durationDays` config), `abandon()`→`flee` con conferma inline (header, `ico-gust`), belt trigger accanto alle scelte. Evidence: `.mw/runs/r199-quest-window-rev2/`. **R-231 (2026-10-19, artifact-r009 `2f02ef4e`, debate multi-AI):** overhaul 9 punti Director — (1) `immediate:true` su `gob-bottino` (`readyAt=arrival`, zero-wait discovery), durata spedizione da `poi.ticksPerNode`/`estimatedDurationTicks` (110 tick, non `durationDays×dayLength`); (2) arbitraggio tastiera: listener quest in capture phase, `defaultPrevented` onorato da `game-frame`/`useTimeEngineLoop`, avanzamento beat ristretto a Space/Enter/ArrowRight; (3) `PreVerdictBreath` nella catena flex (`flex:1 1 auto; minHeight:0`), stage non-compressibile (`flexShrink:0`), `phaseLocked` deduplicato; (4) camera latched per scena (`sceneVisitKey`) — nessuno snap a `idleDrift` su `presenting→false`, `postSettle` C1-continuo in `depthTransform.cameraAtWithPostSettle` (camVec cosinusoidale nell'inviluppo certificato + breathZoom one-sided), ticker/rAF restano vivi su scene ambient, alpha ambient raddoppiata; (5) `HeaderPill` icon-only + tooltip, abandon = `ico-banner` icon + `Tooltip` + conferma inline, plancia minimizzata `space-between` con restore ancorato a destra, `TimeBar` con `questPhaseCheckpoints` (tacche per fase). Test: `questRunWindow.test.tsx` 23/23 (6 INV nuovi). Visual-fork card in `.mw/runs/r231-quest-run-window/`. **R-241 (2026-10-21, bugfix×5):** NODE log per `CHECK:<id>` + scene beat solo su nodi non-check + `activeSceneNodeId` latched (art/caption atomiche, mai swap al click); stage ad altezza fissa `stageMaxHeightPx`; board click = `progress()` throw-then-skip (colonna+overlay+bridge); `.rays` animate lente (`skillCheck.parkedRaysDurationMs`) con `data-astro-idle="parked"`; roster in quest astenuto via `composeRosterCompatibility` (status, non «Nessuno slot compatibile»). Bug doc `.mw/bugs/20261021-quest-run-window-five/`; test red-first `.mw/red-first.jsonl`; e2e `tests/e2e/idleVillage/r241QuestWorkflow.spec.ts` **R-244 (2026-10-21):** `QuestBeltPlaque` da icona-pura a righe ricche (icona+nome+effetto `descKey`+qualifier; riga = hit-area arm/disarm; passivi non-toggle; contatore in header; opt-out `[data-belt-rows]` in skinScope); micro-belt inline invariato icon-only. **R-245 (2026-10-21, ruling Director):** caption diegetica PLAN-050 §6 rimossa dal `Theater` — mai testo sopra l'artwork; latch `activeSceneNodeId` solo per l'art, titolo scena nella colonna `BeatStage`. |
| Quest Reward Popup (esito quest) | quest | candidate | `src/ui/idleVillage/components/gameFrame/QuestRewardPopup.tsx` + `QuestEpilogue.tsx` (corpo) + `quest_ui_component_guide.md` §11 | `/game` | 2026-10-16 | Schermata di esito/ricompensa come componente **esterno** alla quest window (R-199 punto 14, Director): placca `HudPlaque` fluttuante montata a livello pagina in `game-frame-pixi`, **non modale** (no backdrop/`aria-modal`, mappa visibile, Pillar 1), draggable via `useHudPanelDrag`. Reveal staged da `questWindow.rewardPopup.stageMs` (banner esito → sezioni `QuestEpilogue` → riga Chiudi), click/tasto anticipa lo stadio (stesso contratto skip dei beat), `Esc` chiude con focus-return; il dismiss riusa le semantiche del report (settled-run clear, release loadout, consumo POI — repeatable restano). Apertura: `run.ended` + beat presentati. `QuestEpilogue` è il corpo condiviso (sezioni `data-epilogue-section` rivelate per indice). Tests `questRewardPopup.test.tsx` 6/6. |
| Test Roster Population | roster-data | trusted | `scripts/populate-test-roster.js` | N/A | 2026-04-27 | Script ufficiale per popolare roster di test con 3 PG (Sir Spaccaculi 280HP, Salvatrice 210HP, Giggiolillo 195HP) |
| Character-to-Resident Contract | character-resident | trusted | `src/docs/docs/idle_village/trusted/character_resident_trusted.md` | `/test`, `/minimal-gameplay` | 2026-07-15 | CR-005 verified both surfaces consume the same canonical Village Resident Store; StoreConsistencyChecker + CanonicalStoreVerification tests pass |
| World Presentation Runtime Contract | world-presentation | trusted | `src/docs/docs/idle_village/trusted/world_presentation_runtime_trusted.md` | `/world-presentation-director` | 2026-07-22 | WorldState → PresentationOutput deterministic runtime; Foundation + DEMO verified. |
|| POI Family Contract | poi-family | superseded | `src/docs/docs/idle_village/poi_family_spec.md` | `/poi-quest-detail-roster-time-clock` (harness deprecato) | 2026-10-19 | **PLAN-054 T-003:** su `/game` esiste solo la famiglia `quest` (MapQuestPoi Sigillo) → `CTR-game-008`; children non-quest deprecated, `quest_spec.md` superseded — triage in `poi_quest_detail_roster_time_clock_error_registry.md`. Storico: AI-friendly root spec; children: `poi_job_spec.md`, `poi_training_spec.md`, `poi_maintenance_spec.md`, `poi_cooldown_spec.md`, `quest_spec.md`. v7. Selector + quest start-pending verified. |
|| POI Job Contract | poi-job | deprecated | `src/docs/docs/idle_village/poi_job_spec.md` | `/poi-quest-detail-roster-time-clock` (harness deprecato) | 2026-10-19 | PLAN-054 T-003: famiglia `job` mai rilasciata su `/game`. One-shot / continuous jobs, stamina, auto-collect, resource HUD. |
|| POI Cooldown Contract | poi-cooldown | deprecated | `src/docs/docs/idle_village/poi_cooldown_spec.md` | `/poi-quest-detail-roster-time-clock` (harness deprecato) | 2026-10-19 | PLAN-054 T-003: famiglia `cooldown` mai rilasciata su `/game`. Time-limited / expiring POIs. |
|| POI Training Contract | poi-training | deprecated | `src/docs/docs/idle_village/poi_training_spec.md` | `/poi-quest-detail-roster-time-clock` (harness deprecato) | 2026-10-19 | PLAN-054 T-003: famiglia `training` mai rilasciata su `/game`. Stat/XP training, low risk. |
|| POI Maintenance Contract | poi-maintenance | deprecated | `src/docs/docs/idle_village/poi_maintenance_spec.md` | `/poi-quest-detail-roster-time-clock` (harness deprecato) | 2026-10-19 | PLAN-054 T-003: famiglia `maintenance` mai rilasciata su `/game`. Resource upkeep / building condition. |
|| clockKit Day/Night Time Engine | time-clock | candidate | `src/ui/idleVillage/frozen/kits/clockKit.md` | `/minimal-clock`, `/poi-quest-detail-roster-time-clock` | 2026-08-15 | `DayNightTimeEngineStrip` one-line drop-in; owns canonical `tick()` loop; `DayNightTimeEngineStripStandalone` mounts providers; Space is a global page-wide play/pause shortcut. No local timers in pages. Tests: `poiQuestRegressions.spec.ts` and `clockKitSpaceControl.spec.ts`. |
||| DayNightTimeEngineStrip | time | trusted | `src/docs/docs/idle_village/trusted/day_night_time_engine_strip_trusted.md` | `/minimal-clock`, `/poi-quest-detail-roster-time-clock` | 2026-08-15 | Component that owns the canonical `tick()` loop and the global `Space` play/pause shortcut. Display from `useMinimalGameplay` store; no local time state. Tests: `clockKitSpaceControl.spec.ts`. |
|||| PgCard / PgToken | roster | trusted | `src/docs/docs/idle_village/trusted/pgcard_trusted.md` | `/minimal-pgcard`, `/test`, `/minimal-gameplay` | 2026-10-18 | Draggable resident card/token: portrait, frame, drag/freeze semantics, spring-back, magnetic tilt. R-223: drag medallion stays visible with a fallback while the square portrait decodes; PgCard API/contract subtree unchanged. Kit: `pgcardKit.md`. |
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
| slotRackKit | frozen | src/ui/idleVillage/frozen/kits/slotRackKit.md | /minimal-slotRack | 2026-10-18 | Frozen re-export of ResidentSlotRack / ResidentSlotRackSkin with FULL_PROVIDER_CHAIN shell. R-214: empty seats do not breathe from compatibility alone; valid bloom is active-target-only for occupied swaps. R-223: shared medal uses a visible fallback while the portrait crop decodes; rack API/DOM unchanged. Contract recheck pending. |
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

<!-- plan054:index-begin -->

## Contratti vivi PLAN-054 (sezione generata — NON editare a mano)

Rigenerare con `npm run contracts:index-sync`; verificata da `contracts:check` (drift = FAIL).
La fonte normativa è `.mw/contracts/**` + `.mw/contracts/components/inventory.json`.

### Integration contracts

| CTR | Componenti legati | INV |
|---|---|---|
| `CTR-game-001` | 2 | 4 |
| `CTR-game-002` | 2 | 5 |
| `CTR-game-003` | 4 | 6 |
| `CTR-game-004` | 5 | 6 |
| `CTR-game-005` | 3 | 3 |
| `CTR-game-006` | 8 | 3 |
| `CTR-game-007` | 7 | 3 |
| `CTR-game-008` | 6 | 5 |
| `CTR-game-009` | 7 | 4 |
| `CTR-game-010` | 2 | 4 |

### Component units

| Unit | Ruolo | Tier | Root | Contratto |
|---|---|---|---|---|
| `action-card` | ui-component | 2 | `src/ui/idleVillage/map/actionCards/ActionCard.tsx` | `.mw/contracts/components/action-card.md` |
| `action-zone` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/ActionZone.tsx` | `.mw/contracts/components/action-zone.md` |
| `active-hud` | ui-component | 2 | `src/ui/idleVillage/components/ActiveHUD.tsx` | `.mw/contracts/components/active-hud.md` |
| `activity-capsule-detail-skin-aware` | ui-component | 2 | `src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware.tsx` | `.mw/contracts/components/activity-capsule-detail-skin-aware.md` |
| `activity-log-panel-config` | shared-kernel | 1 | `src/ui/idleVillage/config/activityLogPanelConfig.ts` | `.mw/contracts/components/activity-log-panel-config.md` |
| `activity-poi` | ui-component | 2 | `src/ui/idleVillage/components/minimal/ActivityPOI.tsx` | `.mw/contracts/components/activity-poi.md` |
| `activity-slot-data` | shared-kernel | 1 | `src/ui/idleVillage/types/ActivitySlotData.ts` | `.mw/contracts/components/activity-slot-data.md` |
| `ambient-layer` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/render/AmbientLayer.tsx` | `.mw/contracts/components/ambient-layer.md` |
| `astro-overlay` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/AstroOverlay.tsx` | `.mw/contracts/components/astro-overlay.md` |
| `atmosphere-layer` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/render/AtmosphereLayer.tsx` | `.mw/contracts/components/atmosphere-layer.md` |
| `atoms` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/atoms.tsx` | `.mw/contracts/components/atoms.md` |
| `beat-sequencer` | shared-kernel | 1 | `src/ui/idleVillage/questS1Lab/beatSequencer.ts` | `.mw/contracts/components/beat-sequencer.md` |
| `bloom-effect` | shared-kernel | 1 | `src/ui/idleVillage/interaction/bloomEffect.ts` | `.mw/contracts/components/bloom-effect.md` |
| `canonical-roster-bundle` | shared-kernel | 1 | `src/ui/idleVillage/roster/CanonicalRosterBundle.ts` | `.mw/contracts/components/canonical-roster-bundle.md` |
| `carved-bar` | ui-component | 2 | `src/ui/visualFidelityLab/CarvedBar.tsx` | `.mw/contracts/components/carved-bar.md` |
| `chronicle-drawer` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/ChronicleDrawer.tsx` | `.mw/contracts/components/chronicle-drawer.md` |
| `cinema-fx` | ui-component | 2 | `src/ui/idleVillage/skins/primitives/cinemaFx.tsx` | `.mw/contracts/components/cinema-fx.md` |
| `clock-widget` | ui-component | 2 | `src/ui/idleVillage/components/minimal/ClockWidget.tsx` | `.mw/contracts/components/clock-widget.md` |
| `consumable-belt` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/ConsumableBelt.tsx` | `.mw/contracts/components/consumable-belt.md` |
| `context-strip` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/ContextStrip.tsx` | `.mw/contracts/components/context-strip.md` |
| `crew-scheduler-hudcard` | ui-component | 2 | `src/ui/idleVillage/components/CrewSchedulerHUDCard.tsx` | `.mw/contracts/components/crew-scheduler-hudcard.md` |
| `custom-drag-overlay` | ui-component | 2 | `src/ui/idleVillage/components/CustomDragOverlay.tsx` | `.mw/contracts/components/custom-drag-overlay.md` |
| `damage-channel` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/DamageChannel.tsx` | `.mw/contracts/components/damage-channel.md` |
| `day-night-poi` | ui-component | 2 | `src/ui/idleVillage/components/minimal/DayNightPOI.tsx` | `.mw/contracts/components/day-night-poi.md` |
| `day-night-poi-skin` | ui-component | 2 | `src/ui/idleVillage/components/minimal/DayNightPoiSkin.tsx` | `.mw/contracts/components/day-night-poi-skin.md` |
| `day-night-time-engine-strip` | ui-component | 2 | `src/ui/idleVillage/components/minimal/DayNightTimeEngineStrip.tsx` | `.mw/contracts/components/day-night-time-engine-strip.md` |
| `demo-config` | shared-kernel | 1 | `src/ui/styleLab/config/demoConfig.ts` | `.mw/contracts/components/demo-config.md` |
| `depth-scene` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/render/DepthScene.tsx` | `.mw/contracts/components/depth-scene.md` |
| `destiny-astrolabe` | ui-component | 2 | `src/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe.tsx` | `.mw/contracts/components/destiny-astrolabe.md` |
| `destiny-astrolabe-v62` | ui-component | 2 | `src/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62.tsx` | `.mw/contracts/components/destiny-astrolabe-v62.md` |
| `destiny-astrolabe-v62-kit` | shared-kernel | 1 | `src/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit.tsx` | `.mw/contracts/components/destiny-astrolabe-v62-kit.md` |
| `director-panel` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/DirectorPanel.tsx` | `.mw/contracts/components/director-panel.md` |
| `drag-config` | shared-kernel | 1 | `src/ui/idleVillage/config/dragConfig.ts` | `.mw/contracts/components/drag-config.md` |
| `drag-context` | ui-component | 2 | `src/ui/idleVillage/components/DragContext.tsx` | `.mw/contracts/components/drag-context.md` |
| `drag-context-store` | shared-kernel | 1 | `src/ui/idleVillage/components/DragContextStore.ts` | `.mw/contracts/components/drag-context-store.md` |
| `drag-outcome-flight` | ui-component | 2 | `src/ui/idleVillage/interaction/DragOutcomeFlight.tsx` | `.mw/contracts/components/drag-outcome-flight.md` |
| `drag-preview-instrumentation-config` | shared-kernel | 1 | `src/ui/idleVillage/config/dragPreviewInstrumentationConfig.ts` | `.mw/contracts/components/drag-preview-instrumentation-config.md` |
| `drag-test-container` | ui-component | 2 | `src/ui/idleVillage/components/DragTestContainer.tsx` | `.mw/contracts/components/drag-test-container.md` |
| `drag-test-container-v2` | ui-component | 2 | `src/ui/idleVillage/rosterV2/DragTestContainerV2.tsx` | `.mw/contracts/components/drag-test-container-v2.md` |
| `drag-test-container.module` | shared-kernel | 1 | `src/ui/idleVillage/components/DragTestContainer.module.css` | `.mw/contracts/components/drag-test-container.module.md` |
| `drop-feedback-config` | shared-kernel | 1 | `src/ui/idleVillage/config/dropFeedbackConfig.ts` | `.mw/contracts/components/drop-feedback-config.md` |
| `drop-feedback-ui` | ui-component | 2 | `src/ui/idleVillage/components/DropFeedbackUI.tsx` | `.mw/contracts/components/drop-feedback-ui.md` |
| `engraved-icons` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/engravedIcons.tsx` | `.mw/contracts/components/engraved-icons.md` |
| `field-grain` | ui-component | 2 | `src/ui/visualFidelityLab/FieldGrain.tsx` | `.mw/contracts/components/field-grain.md` |
| `flight-proxy` | ui-component | 2 | `src/ui/idleVillage/components/FlightProxy.tsx` | `.mw/contracts/components/flight-proxy.md` |
| `floating-panel` | ui-component | 2 | `src/ui/idleVillage/components/FloatingPanel.tsx` | `.mw/contracts/components/floating-panel.md` |
| `game-boot-screen` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/GameBootScreen.tsx` | `.mw/contracts/components/game-boot-screen.md` |
| `game-entry` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/menu/GameEntry.tsx` | `.mw/contracts/components/game-entry.md` |
| `game-frame` | ui-component | 1 | `src/pages/game-frame.tsx` | `.mw/contracts/components/game-frame.md` |
| `game-frame-game-frame` | ui-component | 1 | `src/ui/idleVillage/components/gameFrame/GameFrame.tsx` | `.mw/contracts/components/game-frame-game-frame.md` |
| `game-frame-pixi` | ui-component | 1 | `src/pages/game-frame-pixi.tsx` | `.mw/contracts/components/game-frame-pixi.md` |
| `game-icons` | ui-component | 2 | `src/ui/idleVillage/components/gameIcons.tsx` | `.mw/contracts/components/game-icons.md` |
| `game-intent` | shared-kernel | 1 | `src/ui/idleVillage/intent/GameIntent.ts` | `.mw/contracts/components/game-intent.md` |
| `game-menu-confirm` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/menu/GameMenuConfirm.tsx` | `.mw/contracts/components/game-menu-confirm.md` |
| `game-menu-dialog` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/menu/GameMenuDialog.tsx` | `.mw/contracts/components/game-menu-dialog.md` |
| `gameplay-store` | shared-kernel | 1 | `src/ui/idleVillage/store/gameplayStore.ts` | `.mw/contracts/components/gameplay-store.md` |
| `generic-poi-skin` | ui-component | 2 | `src/ui/idleVillage/components/minimal/GenericPoiSkin.tsx` | `.mw/contracts/components/generic-poi-skin.md` |
| `gilded-event-frame` | ui-component | 2 | `src/ui/idleVillage/components/GildedEventFrame.tsx` | `.mw/contracts/components/gilded-event-frame.md` |
| `glow-progress` | ui-component | 2 | `src/ui/fantasy/atoms/GlowProgress.tsx` | `.mw/contracts/components/glow-progress.md` |
| `goblin-invasion-window` | ui-component | 1 | `src/ui/idleVillage/components/GoblinInvasionWindow.tsx` | `.mw/contracts/components/goblin-invasion-window.md` |
| `hearthstone-card` | ui-component | 2 | `src/ui/fantasy/atoms/HearthstoneCard.tsx` | `.mw/contracts/components/hearthstone-card.md` |
| `hero-level-ceremony` | ui-component | 2 | `src/ui/idleVillage/rosterV2/HeroLevelCeremony.tsx` | `.mw/contracts/components/hero-level-ceremony.md` |
| `hero-level-decor` | ui-component | 2 | `src/ui/idleVillage/rosterV2/HeroLevelDecor.tsx` | `.mw/contracts/components/hero-level-decor.md` |
| `hero-sheet-panel` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/HeroSheetPanel.tsx` | `.mw/contracts/components/hero-sheet-panel.md` |
| `hud-band` | shared-kernel | 1 | `src/ui/idleVillage/skins/primitives/hudBand.ts` | `.mw/contracts/components/hud-band.md` |
| `hud-event-ledger` | ui-component | 1 | `src/ui/idleVillage/components/gameFrame/HudEventLedger.tsx` | `.mw/contracts/components/hud-event-ledger.md` |
| `hud-game-menu` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/HudGameMenu.tsx` | `.mw/contracts/components/hud-game-menu.md` |
| `hud-hide-toggle` | ui-component | 1 | `src/ui/idleVillage/components/gameFrame/HudHideToggle.tsx` | `.mw/contracts/components/hud-hide-toggle.md` |
| `hud-icons` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/hudIcons.tsx` | `.mw/contracts/components/hud-icons.md` |
| `hud-panel` | ui-component | 2 | `src/ui/idleVillage/skins/primitives/HudPanel.tsx` | `.mw/contracts/components/hud-panel.md` |
| `hud-panels-menu` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/HudPanelsMenu.tsx` | `.mw/contracts/components/hud-panels-menu.md` |
| `hud-plaque` | ui-component | 2 | `src/ui/idleVillage/skins/primitives/HudPlaque.tsx` | `.mw/contracts/components/hud-plaque.md` |
| `hud-recenter-button` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/HudRecenterButton.tsx` | `.mw/contracts/components/hud-recenter-button.md` |
| `hud-ribbon` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/HudRibbon.tsx` | `.mw/contracts/components/hud-ribbon.md` |
| `hud-scale` | shared-kernel | 1 | `src/ui/idleVillage/components/gameFrame/hudScale.ts` | `.mw/contracts/components/hud-scale.md` |
| `hud-tooltip` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/HudTooltip.tsx` | `.mw/contracts/components/hud-tooltip.md` |
| `index` | shared-kernel | 1 | `src/ui/idleVillage/roster/index.ts` | `.mw/contracts/components/index.md` |
| `index-primitives` | shared-kernel | 1 | `src/ui/idleVillage/skins/primitives/index.ts` | `.mw/contracts/components/index-primitives.md` |
| `inset-panel` | ui-component | 2 | `src/ui/wanderlust-surface/InsetPanel.tsx` | `.mw/contracts/components/inset-panel.md` |
| `job-poi` | ui-component | 2 | `src/ui/idleVillage/components/minimal/JobPOI.tsx` | `.mw/contracts/components/job-poi.md` |
| `kit-shell` | ui-component | 2 | `src/ui/idleVillage/frozen/_infra/KitShell.tsx` | `.mw/contracts/components/kit-shell.md` |
| `legacy-reliquary-panel` | ui-component | 2 | `src/ui/idleVillage/legacy/LegacyReliquaryPanel.tsx` | `.mw/contracts/components/legacy-reliquary-panel.md` |
| `load-game-panel` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/menu/LoadGamePanel.tsx` | `.mw/contracts/components/load-game-panel.md` |
| `location-drop-validators` | shared-kernel | 1 | `src/ui/idleVillage/map/validators/locationDropValidators.ts` | `.mw/contracts/components/location-drop-validators.md` |
| `magic-circle-halo` | ui-component | 2 | `src/ui/idleVillage/components/MagicCircleHalo.tsx` | `.mw/contracts/components/magic-circle-halo.md` |
| `map-building-poi` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/MapBuildingPoi.tsx` | `.mw/contracts/components/map-building-poi.md` |
| `map-demo-poi` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/MapDemoPoi.tsx` | `.mw/contracts/components/map-demo-poi.md` |
| `map-quest-poi` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/MapQuestPoi.tsx` | `.mw/contracts/components/map-quest-poi.md` |
| `material-presets` | shared-kernel | 1 | `src/ui/wanderlust-surface/materialPresets.ts` | `.mw/contracts/components/material-presets.md` |
| `materic-ambient-field` | ui-component | 2 | `src/ui/designSystem/primitives/MatericAmbientField.tsx` | `.mw/contracts/components/materic-ambient-field.md` |
| `materic-badge` | ui-component | 2 | `src/ui/designSystem/primitives/MatericBadge.tsx` | `.mw/contracts/components/materic-badge.md` |
| `materic-button` | ui-component | 2 | `src/ui/designSystem/primitives/MatericButton.tsx` | `.mw/contracts/components/materic-button.md` |
| `materic-carved-bar` | ui-component | 2 | `src/ui/designSystem/primitives/MatericCarvedBar.tsx` | `.mw/contracts/components/materic-carved-bar.md` |
| `materic-close-button` | ui-component | 2 | `src/ui/designSystem/primitives/MatericCloseButton.tsx` | `.mw/contracts/components/materic-close-button.md` |
| `materic-cloud-wall` | ui-component | 2 | `src/ui/designSystem/primitives/MatericCloudWall.tsx` | `.mw/contracts/components/materic-cloud-wall.md` |
| `materic-divider` | ui-component | 2 | `src/ui/designSystem/primitives/MatericDivider.tsx` | `.mw/contracts/components/materic-divider.md` |
| `materic-event-card` | ui-component | 2 | `src/ui/designSystem/primitives/MatericEventCard.tsx` | `.mw/contracts/components/materic-event-card.md` |
| `materic-field` | ui-component | 2 | `src/ui/designSystem/primitives/MatericField.tsx` | `.mw/contracts/components/materic-field.md` |
| `materic-field-group` | ui-component | 2 | `src/ui/designSystem/primitives/MatericFieldGroup.tsx` | `.mw/contracts/components/materic-field-group.md` |
| `materic-frame` | ui-component | 2 | `src/ui/designSystem/primitives/MatericFrame.tsx` | `.mw/contracts/components/materic-frame.md` |
| `materic-grain` | ui-component | 2 | `src/ui/designSystem/primitives/MatericGrain.tsx` | `.mw/contracts/components/materic-grain.md` |
| `materic-heading` | ui-component | 2 | `src/ui/designSystem/primitives/MatericHeading.tsx` | `.mw/contracts/components/materic-heading.md` |
| `materic-inset` | ui-component | 2 | `src/ui/designSystem/primitives/MatericInset.tsx` | `.mw/contracts/components/materic-inset.md` |
| `materic-plaque` | ui-component | 2 | `src/ui/designSystem/primitives/MatericPlaque.tsx` | `.mw/contracts/components/materic-plaque.md` |
| `materic-portrait` | ui-component | 2 | `src/ui/designSystem/primitives/MatericPortrait.tsx` | `.mw/contracts/components/materic-portrait.md` |
| `materic-record-list` | ui-component | 2 | `src/ui/designSystem/primitives/MatericRecordList.tsx` | `.mw/contracts/components/materic-record-list.md` |
| `materic-requirement-list` | ui-component | 2 | `src/ui/designSystem/primitives/MatericRequirementList.tsx` | `.mw/contracts/components/materic-requirement-list.md` |
| `materic-roster-component-v2` | ui-component | 2 | `src/ui/idleVillage/rosterV2/MatericRosterComponentV2.tsx` | `.mw/contracts/components/materic-roster-component-v2.md` |
| `materic-section-header` | ui-component | 2 | `src/ui/designSystem/primitives/MatericSectionHeader.tsx` | `.mw/contracts/components/materic-section-header.md` |
| `materic-skin-config` | shared-kernel | 1 | `src/ui/wanderlust-surface/matericSkinConfig.ts` | `.mw/contracts/components/materic-skin-config.md` |
| `materic-skin-context` | shared-kernel | 1 | `src/ui/wanderlust-surface/MatericSkinContext.tsx` | `.mw/contracts/components/materic-skin-context.md` |
| `materic-skin-provider` | ui-component | 2 | `src/ui/wanderlust-surface/MatericSkinProvider.tsx` | `.mw/contracts/components/materic-skin-provider.md` |
| `materic-slot` | ui-component | 2 | `src/ui/designSystem/primitives/MatericSlot.tsx` | `.mw/contracts/components/materic-slot.md` |
| `materic-stat-bar` | ui-component | 2 | `src/ui/designSystem/primitives/MatericStatBar.tsx` | `.mw/contracts/components/materic-stat-bar.md` |
| `materic-surface` | ui-component | 2 | `src/ui/designSystem/primitives/MatericSurface.tsx` | `.mw/contracts/components/materic-surface.md` |
| `materic-threat-aura` | ui-component | 2 | `src/ui/designSystem/primitives/MatericThreatAura.tsx` | `.mw/contracts/components/materic-threat-aura.md` |
| `materic-title-sep` | ui-component | 2 | `src/ui/designSystem/primitives/MatericTitleSep.tsx` | `.mw/contracts/components/materic-title-sep.md` |
| `memorial-hall` | shared-kernel | 1 | `src/ui/idleVillage/memorial/memorialHall.ts` | `.mw/contracts/components/memorial-hall.md` |
| `memorial-panel` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/menu/MemorialPanel.tsx` | `.mw/contracts/components/memorial-panel.md` |
| `menu-flow` | shared-kernel | 1 | `src/ui/idleVillage/components/gameFrame/menu/menuFlow.ts` | `.mw/contracts/components/menu-flow.md` |
| `merchant-offer-icons` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/merchantOfferIcons.tsx` | `.mw/contracts/components/merchant-offer-icons.md` |
| `merchant-panel` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/MerchantPanel.tsx` | `.mw/contracts/components/merchant-panel.md` |
| `milestone-check-modal` | ui-component | 2 | `src/ui/idleVillage/components/MilestoneCheckModal.tsx` | `.mw/contracts/components/milestone-check-modal.md` |
| `minimal-feedback-config` | shared-kernel | 1 | `src/ui/idleVillage/config/minimalFeedbackConfig.ts` | `.mw/contracts/components/minimal-feedback-config.md` |
| `mock-buy-control` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/MockBuyControl.tsx` | `.mw/contracts/components/mock-buy-control.md` |
| `mock-upgrade-control` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/MockUpgradeControl.tsx` | `.mw/contracts/components/mock-upgrade-control.md` |
| `next-event-tab` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/NextEventTab.tsx` | `.mw/contracts/components/next-event-tab.md` |
| `objective-cartouche` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/ObjectiveCartouche.tsx` | `.mw/contracts/components/objective-cartouche.md` |
| `orb-icon` | ui-component | 2 | `src/ui/fantasy/atoms/OrbIcon.tsx` | `.mw/contracts/components/orb-icon.md` |
| `overlay-stack` | shared-kernel | 1 | `src/ui/idleVillage/components/gameFrame/overlayStack.ts` | `.mw/contracts/components/overlay-stack.md` |
| `oxidized-grade-filter` | ui-component | 2 | `src/ui/idleVillage/components/OxidizedGradeFilter.tsx` | `.mw/contracts/components/oxidized-grade-filter.md` |
| `pg-card` | ui-component | 2 | `src/ui/idleVillage/components/PgCard.tsx` | `.mw/contracts/components/pg-card.md` |
| `physics-defaults` | shared-kernel | 1 | `src/ui/styleLab/config/physicsDefaults.ts` | `.mw/contracts/components/physics-defaults.md` |
| `pixi-world-map` | ui-component | 1 | `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx` | `.mw/contracts/components/pixi-world-map.md` |
| `plate-variants` | ui-component | 2 | `src/ui/visualFidelityLab/plateVariants.tsx` | `.mw/contracts/components/plate-variants.md` |
| `poi-marker` | ui-component | 2 | `src/ui/idleVillage/components/poi/PoiMarker.tsx` | `.mw/contracts/components/poi-marker.md` |
| `poi-materic-v3-5` | ui-component | 2 | `src/ui/idleVillage/components/poi/PoiMatericV3_5.tsx` | `.mw/contracts/components/poi-materic-v3-5.md` |
| `poi-particles` | ui-component | 2 | `src/ui/idleVillage/components/minimal/PoiParticles.tsx` | `.mw/contracts/components/poi-particles.md` |
| `portrait-decode-cache` | shared-kernel | 1 | `src/ui/idleVillage/utils/portraitDecodeCache.ts` | `.mw/contracts/components/portrait-decode-cache.md` |
| `preset-screen` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/PresetScreen.tsx` | `.mw/contracts/components/preset-screen.md` |
| `quest-assignment-preview` | ui-component | 2 | `src/ui/idleVillage/components/QuestAssignmentPreview.tsx` | `.mw/contracts/components/quest-assignment-preview.md` |
| `quest-belt-plaque` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestBeltPlaque.tsx` | `.mw/contracts/components/quest-belt-plaque.md` |
| `quest-check-options-panel` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestCheckOptionsPanel.tsx` | `.mw/contracts/components/quest-check-options-panel.md` |
| `quest-chronicle` | ui-component | 2 | `src/ui/idleVillage/components/QuestChronicle.tsx` | `.mw/contracts/components/quest-chronicle.md` |
| `quest-engine-text` | shared-kernel | 1 | `src/ui/idleVillage/questS1Lab/questEngineText.ts` | `.mw/contracts/components/quest-engine-text.md` |
| `quest-epilogue` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestEpilogue.tsx` | `.mw/contracts/components/quest-epilogue.md` |
| `quest-expedition-detail` | ui-component | 2 | `src/ui/idleVillage/quests/QuestExpeditionDetail.tsx` | `.mw/contracts/components/quest-expedition-detail.md` |
| `quest-initial-state` | shared-kernel | 1 | `src/ui/idleVillage/components/gameFrame/questInitialState.ts` | `.mw/contracts/components/quest-initial-state.md` |
| `quest-journey` | shared-kernel | 1 | `src/ui/idleVillage/quests/questJourney.ts` | `.mw/contracts/components/quest-journey.md` |
| `quest-journey-engine` | shared-kernel | 1 | `src/ui/idleVillage/quests/questJourneyEngine.ts` | `.mw/contracts/components/quest-journey-engine.md` |
| `quest-journey-phase-strip` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestJourneyPhaseStrip.tsx` | `.mw/contracts/components/quest-journey-phase-strip.md` |
| `quest-journey-route` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestJourneyRoute.tsx` | `.mw/contracts/components/quest-journey-route.md` |
| `quest-lab-presets` | shared-kernel | 1 | `src/ui/idleVillage/questS1Lab/questLabPresets.ts` | `.mw/contracts/components/quest-lab-presets.md` |
| `quest-log-panel` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestLogPanel.tsx` | `.mw/contracts/components/quest-log-panel.md` |
| `quest-outcome-toast` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestOutcomeToast.tsx` | `.mw/contracts/components/quest-outcome-toast.md` |
| `quest-overlays` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/questOverlays.tsx` | `.mw/contracts/components/quest-overlays.md` |
| `quest-party-roster-panel` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestPartyRosterPanel.tsx` | `.mw/contracts/components/quest-party-roster-panel.md` |
| `quest-poi` | ui-component | 2 | `src/ui/idleVillage/components/minimal/QuestPOI.tsx` | `.mw/contracts/components/quest-poi.md` |
| `quest-returned-crew` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestReturnedCrew.tsx` | `.mw/contracts/components/quest-returned-crew.md` |
| `quest-reward-panel` | ui-component | 2 | `src/ui/idleVillage/components/QuestRewardPanel.tsx` | `.mw/contracts/components/quest-reward-panel.md` |
| `quest-reward-popup` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestRewardPopup.tsx` | `.mw/contracts/components/quest-reward-popup.md` |
| `quest-run` | shared-kernel | 1 | `src/ui/idleVillage/questS1Lab/questRun.ts` | `.mw/contracts/components/quest-run.md` |
| `quest-run-store` | shared-kernel | 1 | `src/ui/idleVillage/questS1Lab/questRunStore.ts` | `.mw/contracts/components/quest-run-store.md` |
| `quest-run-window` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx` | `.mw/contracts/components/quest-run-window.md` |
| `quest-scenario` | shared-kernel | 1 | `src/ui/idleVillage/questS1Lab/questScenario.ts` | `.mw/contracts/components/quest-scenario.md` |
| `quest-select-screen` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/QuestSelectScreen.tsx` | `.mw/contracts/components/quest-select-screen.md` |
| `quest-settlement` | shared-kernel | 1 | `src/ui/idleVillage/quests/questSettlement.ts` | `.mw/contracts/components/quest-settlement.md` |
| `quest-skill-check-column` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn.tsx` | `.mw/contracts/components/quest-skill-check-column.md` |
| `quest-skill-check-overlay` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestSkillCheckOverlay.tsx` | `.mw/contracts/components/quest-skill-check-overlay.md` |
| `quest-stage-cluster` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestStageCluster.tsx` | `.mw/contracts/components/quest-stage-cluster.md` |
| `quest-verdict-card` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/QuestVerdictCard.tsx` | `.mw/contracts/components/quest-verdict-card.md` |
| `region-tooltip` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/RegionTooltip.tsx` | `.mw/contracts/components/region-tooltip.md` |
| `reminder-component` | ui-component | 2 | `src/ui/idleVillage/components/ReminderComponent.tsx` | `.mw/contracts/components/reminder-component.md` |
| `renderer-stack-instrumentation` | shared-kernel | 1 | `src/ui/idleVillage/utils/rendererStackInstrumentation.ts` | `.mw/contracts/components/renderer-stack-instrumentation.md` |
| `resident-drop-rules` | shared-kernel | 1 | `src/ui/idleVillage/config/residentDropRules.ts` | `.mw/contracts/components/resident-drop-rules.md` |
| `resident-name` | shared-kernel | 1 | `src/ui/idleVillage/residentName.ts` | `.mw/contracts/components/resident-name.md` |
| `resident-roster-panel` | ui-component | 2 | `src/ui/idleVillage/components/ResidentRosterPanel.tsx` | `.mw/contracts/components/resident-roster-panel.md` |
| `resident-roster-panel-v2` | ui-component | 2 | `src/ui/idleVillage/rosterV2/ResidentRosterPanelV2.tsx` | `.mw/contracts/components/resident-roster-panel-v2.md` |
| `resident-roster-types` | shared-kernel | 1 | `src/ui/idleVillage/components/ResidentRosterTypes.ts` | `.mw/contracts/components/resident-roster-types.md` |
| `resident-slot-rack` | ui-component | 2 | `src/ui/idleVillage/components/ResidentSlotRack.tsx` | `.mw/contracts/components/resident-slot-rack.md` |
| `resident-slot-validators` | shared-kernel | 1 | `src/ui/idleVillage/slots/residentSlotValidators.ts` | `.mw/contracts/components/resident-slot-validators.md` |
| `resolve-slot-requirements` | shared-kernel | 1 | `src/ui/idleVillage/drag/resolveSlotRequirements.ts` | `.mw/contracts/components/resolve-slot-requirements.md` |
| `resource-readout` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/ResourceReadout.tsx` | `.mw/contracts/components/resource-readout.md` |
| `resource-readout-items` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/resourceReadoutItems.tsx` | `.mw/contracts/components/resource-readout-items.md` |
| `roster-draggable-v2` | ui-component | 2 | `src/ui/idleVillage/rosterV2/RosterDraggableV2.tsx` | `.mw/contracts/components/roster-draggable-v2.md` |
| `roster-filter-config` | shared-kernel | 1 | `src/ui/idleVillage/config/rosterFilterConfig.ts` | `.mw/contracts/components/roster-filter-config.md` |
| `roster-kit` | ui-component | 2 | `src/ui/idleVillage/frozen/kits/rosterKit.tsx` | `.mw/contracts/components/roster-kit.md` |
| `roster-sort-config` | shared-kernel | 1 | `src/ui/idleVillage/config/rosterSortConfig.ts` | `.mw/contracts/components/roster-sort-config.md` |
| `roster-sort-icon` | ui-component | 2 | `src/ui/idleVillage/components/RosterSortIcon.tsx` | `.mw/contracts/components/roster-sort-icon.md` |
| `sandbox-diagnostics` | shared-kernel | 1 | `src/ui/idleVillage/utils/sandboxDiagnostics.ts` | `.mw/contracts/components/sandbox-diagnostics.md` |
| `sandbox-timing-context` | shared-kernel | 1 | `src/ui/idleVillage/hooks/sandboxTimingContext.ts` | `.mw/contracts/components/sandbox-timing-context.md` |
| `settings-panel` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/menu/SettingsPanel.tsx` | `.mw/contracts/components/settings-panel.md` |
| `settlement-lost-overlay` | ui-component | 2 | `src/ui/idleVillage/components/SettlementLostOverlay.tsx` | `.mw/contracts/components/settlement-lost-overlay.md` |
| `settlement-tally` | shared-kernel | 1 | `src/ui/idleVillage/settlement/settlementTally.ts` | `.mw/contracts/components/settlement-tally.md` |
| `skill-check-legend` | ui-component | 2 | `src/ui/idleVillage/components/destinyAstrolabe/SkillCheckLegend.tsx` | `.mw/contracts/components/skill-check-legend.md` |
| `skin-badge` | ui-component | 2 | `src/ui/idleVillage/skins/primitives/SkinBadge.tsx` | `.mw/contracts/components/skin-badge.md` |
| `skin-button` | ui-component | 2 | `src/ui/idleVillage/skins/primitives/SkinButton.tsx` | `.mw/contracts/components/skin-button.md` |
| `skin-close-button` | ui-component | 2 | `src/ui/idleVillage/skins/primitives/SkinCloseButton.tsx` | `.mw/contracts/components/skin-close-button.md` |
| `skin-config-registry` | shared-kernel | 1 | `src/ui/idleVillage/skins/skinConfigRegistry.ts` | `.mw/contracts/components/skin-config-registry.md` |
| `skin-css-variables` | shared-kernel | 1 | `src/ui/idleVillage/skins/skinCssVariables.ts` | `.mw/contracts/components/skin-css-variables.md` |
| `skin-manager` | shared-kernel | 1 | `src/ui/idleVillage/skins/SkinManager.ts` | `.mw/contracts/components/skin-manager.md` |
| `skin-schema` | shared-kernel | 1 | `src/ui/idleVillage/skins/types/SkinSchema.ts` | `.mw/contracts/components/skin-schema.md` |
| `skin-schemas` | shared-kernel | 1 | `src/ui/idleVillage/skins/skinSchemas.ts` | `.mw/contracts/components/skin-schemas.md` |
| `skin-scope` | ui-component | 2 | `src/ui/idleVillage/skins/primitives/SkinScope.tsx` | `.mw/contracts/components/skin-scope.md` |
| `skin-title` | ui-component | 2 | `src/ui/idleVillage/skins/primitives/SkinTitle.tsx` | `.mw/contracts/components/skin-title.md` |
| `slot` | ui-component | 2 | `src/ui/idleVillage/components/Slot.tsx` | `.mw/contracts/components/slot.md` |
| `slot-gem-pointer` | ui-component | 2 | `src/ui/idleVillage/components/SlotGemPointer.tsx` | `.mw/contracts/components/slot-gem-pointer.md` |
| `slot-rack-skin-config` | shared-kernel | 1 | `src/ui/idleVillage/skins/slotRackSkinConfig.ts` | `.mw/contracts/components/slot-rack-skin-config.md` |
| `slot-v12-renderer` | ui-component | 2 | `src/ui/idleVillage/components/SlotV12Renderer.tsx` | `.mw/contracts/components/slot-v12-renderer.md` |
| `slot-wilderness-bronze-config` | shared-kernel | 1 | `src/ui/idleVillage/skins/converted/slotWildernessBronzeConfig.ts` | `.mw/contracts/components/slot-wilderness-bronze-config.md` |
| `stage-band` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/StageBand.tsx` | `.mw/contracts/components/stage-band.md` |
| `stash-item-face` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/stashItemFace.tsx` | `.mw/contracts/components/stash-item-face.md` |
| `stash-picker` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/StashPicker.tsx` | `.mw/contracts/components/stash-picker.md` |
| `stat-icon-utils` | shared-kernel | 1 | `src/ui/shared/statIconUtils.ts` | `.mw/contracts/components/stat-icon-utils.md` |
| `stat-icons` | ui-component | 2 | `src/ui/idleVillage/icons/statIcons.tsx` | `.mw/contracts/components/stat-icons.md` |
| `sticker-frame` | ui-component | 2 | `src/ui/designSystem/primitives/StickerFrame.tsx` | `.mw/contracts/components/sticker-frame.md` |
| `style-lab-surface` | ui-component | 2 | `src/ui/styleLab/StyleLabSurface.tsx` | `.mw/contracts/components/style-lab-surface.md` |
| `tab-window` | ui-component | 2 | `src/ui/designSystem/primitives/TabWindow.tsx` | `.mw/contracts/components/tab-window.md` |
| `temporary-skin-config` | shared-kernel | 1 | `src/ui/idleVillage/skins/temporary/TemporarySkinConfig.ts` | `.mw/contracts/components/temporary-skin-config.md` |
| `time-engine-strip` | ui-component | 2 | `src/ui/idleVillage/components/minimal/TimeEngineStrip.tsx` | `.mw/contracts/components/time-engine-strip.md` |
| `title-screen` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/menu/TitleScreen.tsx` | `.mw/contracts/components/title-screen.md` |
| `transit-view` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/TransitView.tsx` | `.mw/contracts/components/transit-view.md` |
| `tuning-panel` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/TuningPanel.tsx` | `.mw/contracts/components/tuning-panel.md` |
| `types` | shared-kernel | 1 | `src/ui/idleVillage/slots/types.ts` | `.mw/contracts/components/types.md` |
| `use-activity-scheduler` | shared-kernel | 1 | `src/ui/idleVillage/hooks/useActivityScheduler.ts` | `.mw/contracts/components/use-activity-scheduler.md` |
| `use-drag-preview-instrumentation` | shared-kernel | 1 | `src/ui/idleVillage/hooks/useDragPreviewInstrumentation.ts` | `.mw/contracts/components/use-drag-preview-instrumentation.md` |
| `use-game-menu-flow` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/menu/useGameMenuFlow.tsx` | `.mw/contracts/components/use-game-menu-flow.md` |
| `use-game-stage-zones` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/stageZones/useGameStageZones.tsx` | `.mw/contracts/components/use-game-stage-zones.md` |
| `use-hero-sheet` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/useHeroSheet.tsx` | `.mw/contracts/components/use-hero-sheet.md` |
| `use-hud-panel-drag` | shared-kernel | 1 | `src/ui/idleVillage/components/gameFrame/useHudPanelDrag.ts` | `.mw/contracts/components/use-hud-panel-drag.md` |
| `use-quest-expedition-session` | ui-component | 2 | `src/ui/idleVillage/quests/useQuestExpeditionSession.tsx` | `.mw/contracts/components/use-quest-expedition-session.md` |
| `use-quest-poi-session` | ui-component | 2 | `src/ui/idleVillage/quests/useQuestPoiSession.tsx` | `.mw/contracts/components/use-quest-poi-session.md` |
| `use-sandbox-timing-bridge` | ui-component | 2 | `src/ui/idleVillage/hooks/useSandboxTimingBridge.tsx` | `.mw/contracts/components/use-sandbox-timing-bridge.md` |
| `use-sensory-audio` | shared-kernel | 1 | `src/ui/idleVillage/hooks/useSensoryAudio.ts` | `.mw/contracts/components/use-sensory-audio.md` |
| `use-skin-binding` | shared-kernel | 1 | `src/ui/idleVillage/hooks/useSkinBinding.ts` | `.mw/contracts/components/use-skin-binding.md` |
| `use-skin-preferences` | shared-kernel | 1 | `src/ui/idleVillage/hooks/useSkinPreferences.ts` | `.mw/contracts/components/use-skin-preferences.md` |
| `use-skin-system` | shared-kernel | 1 | `src/ui/idleVillage/hooks/useSkinSystem.ts` | `.mw/contracts/components/use-skin-system.md` |
| `use-style-lab-tokens` | shared-kernel | 1 | `src/ui/styleLab/hooks/useStyleLabTokens.ts` | `.mw/contracts/components/use-style-lab-tokens.md` |
| `v9-glass-layers-only` | ui-component | 2 | `src/ui/v9-skin/V9GlassLayersOnly.tsx` | `.mw/contracts/components/v9-glass-layers-only.md` |
| `verb-card` | ui-component | 2 | `src/ui/idleVillage/legacy/VerbCard.tsx` | `.mw/contracts/components/verb-card.md` |
| `verdict-card` | ui-component | 2 | `src/ui/idleVillage/questS1Lab/hud/VerdictCard.tsx` | `.mw/contracts/components/verdict-card.md` |
| `village-building-icons` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/villageBuildingIcons.tsx` | `.mw/contracts/components/village-building-icons.md` |
| `village-registry` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/VillageRegistry.tsx` | `.mw/contracts/components/village-registry.md` |
| `village-roster-section` | ui-component | 2 | `src/ui/idleVillage/components/VillageRosterSection.tsx` | `.mw/contracts/components/village-roster-section.md` |
| `village-roster-section-v2` | ui-component | 2 | `src/ui/idleVillage/rosterV2/VillageRosterSectionV2.tsx` | `.mw/contracts/components/village-roster-section-v2.md` |
| `village-screen-view` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx` | `.mw/contracts/components/village-screen-view.md` |
| `village-slot-overlay` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/VillageSlotOverlay.tsx` | `.mw/contracts/components/village-slot-overlay.md` |
| `village-stash-item-icons` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/villageStashItemIcons.tsx` | `.mw/contracts/components/village-stash-item-icons.md` |
| `village-stash-panel` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx` | `.mw/contracts/components/village-stash-panel.md` |
| `wanderlust-ambient-field` | ui-component | 2 | `src/ui/wanderlust-surface/layout/WanderlustAmbientField.tsx` | `.mw/contracts/components/wanderlust-ambient-field.md` |
| `wanderlust-inner-surface` | ui-component | 2 | `src/ui/wanderlust-surface/WanderlustInnerSurface.tsx` | `.mw/contracts/components/wanderlust-inner-surface.md` |
| `wanderlust-layout` | ui-component | 2 | `src/ui/wanderlust-surface/layout/WanderlustLayout.tsx` | `.mw/contracts/components/wanderlust-layout.md` |
| `wanderlust-material-context` | shared-kernel | 1 | `src/ui/wanderlust-surface/WanderlustMaterialContext.tsx` | `.mw/contracts/components/wanderlust-material-context.md` |
| `wanderlust-medal-overlay` | ui-component | 2 | `src/ui/idleVillage/components/WanderlustMedalOverlay.tsx` | `.mw/contracts/components/wanderlust-medal-overlay.md` |
| `wanderlust-portrait` | ui-component | 2 | `src/ui/wanderlust-surface/layout/WanderlustPortrait.tsx` | `.mw/contracts/components/wanderlust-portrait.md` |
| `wanderlust-roster-card` | ui-component | 2 | `src/ui/idleVillage/components/WanderlustRosterCard.tsx` | `.mw/contracts/components/wanderlust-roster-card.md` |
| `wanderlust-roster-card-v2` | ui-component | 2 | `src/ui/idleVillage/rosterV2/WanderlustRosterCardV2.tsx` | `.mw/contracts/components/wanderlust-roster-card-v2.md` |
| `wanderlust-stat-bar` | ui-component | 2 | `src/ui/wanderlust-surface/layout/WanderlustStatBar.tsx` | `.mw/contracts/components/wanderlust-stat-bar.md` |
| `wanderlust-surface` | ui-component | 2 | `src/ui/wanderlust-surface/WanderlustSurface.tsx` | `.mw/contracts/components/wanderlust-surface.md` |
| `when-where-cluster` | ui-component | 2 | `src/ui/idleVillage/components/gameFrame/WhenWhereCluster.tsx` | `.mw/contracts/components/when-where-cluster.md` |
| `window` | ui-component | 2 | `src/ui/designSystem/primitives/Window.tsx` | `.mw/contracts/components/window.md` |
| `worker-card` | ui-component | 2 | `src/ui/idleVillage/components/WorkerCard.tsx` | `.mw/contracts/components/worker-card.md` |
| `world-surface-atmosphere` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceAtmosphere.tsx` | `.mw/contracts/components/world-surface-atmosphere.md` |
| `world-surface-birds` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceBirds.tsx` | `.mw/contracts/components/world-surface-birds.md` |
| `world-surface-cloud-shadows` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceCloudShadows.tsx` | `.mw/contracts/components/world-surface-cloud-shadows.md` |
| `world-surface-clouds` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceClouds.tsx` | `.mw/contracts/components/world-surface-clouds.md` |
| `world-surface-coast-foam` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceCoastFoam.tsx` | `.mw/contracts/components/world-surface-coast-foam.md` |
| `world-surface-creatures` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceCreatures.tsx` | `.mw/contracts/components/world-surface-creatures.md` |
| `world-surface-event-card` | ui-component | 1 | `src/ui/idleVillage/components/WorldSurfaceEventCard.tsx` | `.mw/contracts/components/world-surface-event-card.md` |
| `world-surface-event-shroud` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceEventShroud.tsx` | `.mw/contracts/components/world-surface-event-shroud.md` |
| `world-surface-foam` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceFoam.tsx` | `.mw/contracts/components/world-surface-foam.md` |
| `world-surface-glass-overlay` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceGlassOverlay.tsx` | `.mw/contracts/components/world-surface-glass-overlay.md` |
| `world-surface-kit` | ui-component | 2 | `src/ui/idleVillage/frozen/kits/worldSurfaceKit.tsx` | `.mw/contracts/components/world-surface-kit.md` |
| `world-surface-renderer` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceRenderer.tsx` | `.mw/contracts/components/world-surface-renderer.md` |
| `world-surface-river-glint` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceRiverGlint.tsx` | `.mw/contracts/components/world-surface-river-glint.md` |
| `world-surface-sea-margin` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceSeaMargin.tsx` | `.mw/contracts/components/world-surface-sea-margin.md` |
| `world-surface-sea-marks` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceSeaMarks.tsx` | `.mw/contracts/components/world-surface-sea-marks.md` |
| `world-surface-sea-pattern-overlay` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceSeaPatternOverlay.tsx` | `.mw/contracts/components/world-surface-sea-pattern-overlay.md` |
| `world-surface-sea-ripple` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceSeaRipple.tsx` | `.mw/contracts/components/world-surface-sea-ripple.md` |
| `world-surface-water-field` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceWaterField.tsx` | `.mw/contracts/components/world-surface-water-field.md` |
| `world-surface-waves` | ui-component | 2 | `src/ui/idleVillage/components/WorldSurfaceWaves.tsx` | `.mw/contracts/components/world-surface-waves.md` |

<!-- plan054:index-end -->
