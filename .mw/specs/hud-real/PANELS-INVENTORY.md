# PANELS-INVENTORY — tutte le superfici di `/game` (PLAN-113 F0)

**Stato:** seed verificato sul codice 2026-11-06 (dimensioni da `gameFrameConfig.ts` RAW defaults, file componenti da scan repo). Le catture vivono in `test-results/plan113-inventory/` (da produrre).
**Fonti:** `src/balancing/config/idleVillage/gameFrameConfig.ts` (stageZones + panels + questWindow + questCluster + zLevels), `src/pages/game-frame-pixi.tsx`, `src/ui/idleVillage/components/gameFrame/GameFrame.tsx`, `.mw/specs/hud-real/HUD-INVENTORY.md` (E-40).

## Contratto stage-zone (sorgente dei numeri)

Chrome: `topPx 92 / bottomPx 100`; questChromeOverlap `84/88`; outer `edge 24 / gutter 8`; `budgetPx 1216`, `contractViewportPx 1280`. Zone: `leftWing 260–400`, `centerStage 616–1040`, `rightWing 340` (fisso). `authorizedPairs: [['roster','villageStash']]`. Strip collassata: tab 32×160 ala, 160×28 centro, max 4 per zona; hysteresis 24px.

| Panel | Zona | Ruolo | runPolicy | minW | natW | minH | natH | overlay |
|---|---|---|---|---|---|---|---|---|
| roster | leftWing | home | suspend | 200 | 400 (zone-fill) | 240 | 300 | — |
| villageStash | leftWing | persistent-transient | suspend | 236 | 320 (zone-fill) | 200 | 360 | — |
| events | rightWing | home | suspend | 280 | 300 (zone-fill) | 160 | 320 | — |
| merchant | rightWing | persistent-transient | suspend | 320 | 360 (zone-fill) | 240 | 420 | — |
| questDetail | centerStage | home | retire | 460 | 680 | 300 | 520 | — |
| quest (run window/cluster) | centerStage | session | suspend | 640 | 820 | 400 | 600 | — |
| heroSheet | rightWing | persistent-transient | suspend | 280 | 380 | 200 | 400 | **overlay** |

Quest cluster (PLAN-043 WS-4/5): window `widthMinPx 760 – vwFraction – widthMaxPx 1040`, `expandedWidthPx 1180`; companionLeft `280/320px` (wide@1920, neverBelow 1100, foldedTab 40); skillCheckColumn `340/420px` (wide@1920, neverBelow 1100, astrolabe max 480); `bothWingsBelowPx 1440`. Forecast = colonna interna del planner (questForecast tenant rimosso, DEF-02). RewardPopup 400; outcomeToast 320. HeroSheet rail `widthPx 380, offsetX 14, anchorTolerance 24`. Boot veil logo 560, bar 320×3.

## Inventario per famiglia

### A. Compagnia (triade — convivono: roster+stash authorizedPairs, planner centerStage)

| ID | File | Trigger / dati reali | Stati | Min → nat (px) | Notes |
|---|---|---|---|---|---|
| A1 roster aperto | `roster/VillageRosterSection` (+ colonna hudReal montata su placca provvisoria in `rosterOpen`) | click roster ribbon → panel; rosterStore heroes | vuoto/1/5/14, selezione, drag | 200×240 → 400×300+ (zone-fill); lab: slot 620 | Già in hud-compose (ruling 2026-11-06). Reskin-dal-kit. |
| A2 magazzino | `components/VillageStashPanel` | bottone stash / edificio; stashStore | vuoto/parziale/pieno, categorie | 236×200 → 320×360 (zone-fill) | Co-espanso con A1 su /game. |
| A3 planner spedizione | `components/QuestExpeditionDetail` + forecast column interna | click quest POI card / nav quest; questStore active+forecast | draft/party-assigned/forecast/committed | 460×300 → 680×520 | `retire` su run. Centro-scena, NON slot 340. |
| A4 scheda eroe | `components/heroSheet/HeroSheetPanel` | hover/focus roster card (rail, offsetX 14); heroStore | empty/idle/fatigue/injured | 280×200 → 380×400 | **zone-exempt overlay**, priorità 9. |

### B. Quest in corso (centerStage session + overlay + companions)

| ID | File | Trigger | Stati | Min → nat | Notes |
|---|---|---|---|---|---|
| B1 finestra quest | `quest/QuestRunWindow` | quest attiva avviata dal planner | teatro/scelte/fasi/epilogo | 640×400 → 820×600 (cluster a vw, 760–1040/1180 exp) | Regime `run`: unico occupante stage. |
| B2 skill check | `quest/QuestSkillCheckOverlay` + `QuestCheckOptionsPanel` + `DestinyAstrolabeV62Standalone` | beat skill-check | idle/rolling/resolved | colonna 340/420, astrolabe ≤480, board 240–680 (vh%) | Ala dx del cluster; `neverBelow 1100`. |
| B3 party roster quest | `quest/QuestPartyRosterPanel` + `QuestBeltPlaque` | dentro B1 | party 0–5 + belt | companionLeft 280/320, folded 40 | Ala sx del cluster. |
| B4 log/cronaca quest | `quest/QuestLogPanel` | dentro B1 | voci accumulate | companionRight ~340 | `bothWingsBelow 1440` → chiude dx prima. |
| B5 fasi viaggio | `quest/QuestJourneyPhaseStrip` + `QuestJourneyRoute` | travel beats | legs progress | strip dentro cluster | Overlay route su mappa (v. I4). |
| B6 verdetto/esito | `quest/QuestVerdictCard` + `QuestEpilogue` + `QuestReturnedCrew` | quest conclusa | success/partial/fail | — | Fixture necessaria (post-run). |
| B7 esiti popup | `quest/QuestRewardPopup` + `QuestOutcomeToast` | reward/outcome event | staged 280ms, autoDismiss 0 | popup 400, toast 320 | Toast → slot toast hudReal. |
| B8 folio amanuense | `quest/AmanuensePage` + `QuestStageCluster` + `QuestSkillCheckColumn` | dentro cluster | — | — | Componenti di montaggio cluster. |

### C. Villaggio (vista a schermo intero — gate fattibilità OB-2c)

| ID | File | Trigger | Stati | Min → nat | Notes |
|---|---|---|---|---|---|
| C1 vista villaggio | `village/VillageScreenView` | nav/ancora villaggio → vista dipinta | dipinto + pin edifici + slot | full-area | NON un pannello DOM: vista + pin. |
| C2 registro | `village/VillageRegistry` | drawer insediamento | lista edifici | drawer dx | |
| C3 overlay slot | `village/VillageSlotOverlay` | click slot edificio | upgrade options | | |
| C4 pin frame | `village/VillagePinFrame` | dentro C1 | states per building | | |
| C5 upgrade control | `village/MockUpgradeControl` | dentro C3 | costi/cta | | Dev-era name; verificare se ancora in uso. |

### D. Commercio (rightWing)

| ID | File | Trigger | Stati | Min → nat | Notes |
|---|---|---|---|---|---|
| D1 emporio | `components/MerchantPanel` | edificio merchant / nav | buy/sell/stock | 320×240 → 360×420 | Min 320 entra nello slot 340 B1 (fit-check ok). |
| D2 market action card | `map/actionCards/MarketActionCard` | click poi mercato | offer | card | placeholder? |
| D3 rotte commerciali | `components/TradeRoutePanel` | da merchant/controller | routes | — | `useTradeRoutes`/`TradeRouteController`. |

### E. Cronaca & memoria (rightWing / panels)

| ID | File | Trigger | Stati | Min → nat | Notes |
|---|---|---|---|---|---|
| E1 ledger eventi | `gameFrame/HudEventLedger` (**montato**, da barrel) | tab eventi chrome | vuoto/storico/long | 280×160 → 300×320 | `ActivityLogPanel`/`EventLogPanel` in `components/` NON montati su /game (legacy). |
| E2 sala dei caduti | `components/MemorialPanel` | nav/registry | fallen heroes | — | |
| E3 reliquiario | `components/LegacyReliquaryPanel` | nav/legacy | reliquie attive | — | |

### F. Cerimonie & esiti (full-screen/moments)

| ID | File | Trigger | Stati | Min → nat | Notes |
|---|---|---|---|---|---|
| F1 level-up | `components/HeroLevelCeremony` | hero level-up | cinematic | full | Fixture (post-XP). |
| F2 insediamento perso | `components/SettlementLostOverlay` | settlement fall | fall state | full | Fixture. |
| F3 game over | `components/MinimalGameOverModal` / `GameOverModal` | defeat | — | modal | In `components/` (non gameFrame) — verificato: **non in barrel gameFrame**; check mount su game-frame-pixi. |
| F4 expedition lost | expedition-lost report | expedition loss | — | | Fixture. |
| F5 evento maggiore | `components/WorldSurfaceEventCard` + `WorldSurfaceEventShroud` + `GoblinInvasionWindow` + `designSystem/MatericEventCard` | evento mondo (invasione) | shroud/card | | MatericEventCard è primitive DS. |

### G. Sistema (boot/menu — PLAN-076 implementato, eye-check in sospeso)

| ID | File | Trigger | Stati | Min → nat | Notes |
|---|---|---|---|---|---|
| G1 titolo | `TitleScreen` + `GameEntry` | entry point | boot→title | full | |
| G2 menu gioco | `components/GameMenuDialog` + `GameMenuConfirm` | comando menu | open/confirm | modal | |
| G3 load | `components/LoadGamePanel` | menu→load | save list | modal | |
| G4 settings | `components/SettingsPanel` | menu→settings | tabs | modal | |
| G5 boot veil | `GameBootScreen` | cold boot | loading | logo 560, bar 320×3 | |

### H. Transienti & chrome minore

| ID | File | Trigger | Stati | Min → nat | Notes |
|---|---|---|---|---|---|
| H1 fatigue toast | `components/FatigueAlertToast` | fatigue event | — | toast | |
| H2 rest overlay | `components/RestOverlay` | rest action | sleep | | |
| H3 region tooltip | `map/RegionTooltip` | hover region | region info | tooltip | |
| H4 hud tooltip | `HudTooltip` | hover/focus | generic | tooltip | DS primitive? |
| H5 objective cartouche | `ObjectiveCartouche` | objective set | current objective | | Top chrome su /game (da verificare se nel nuovo chrome). |
| H6 next-event tab | `NextEventTab` | scheduled event | countdown | | Idem: parte delle 3 linguette HUD-3? |
| H7 menu HUD | `HudGameMenu` + `HudPanelsMenu` | comando menu | popover | | Comandi hudReal li sostituiscono? |

### I. Mappa (elementi dentro PixiWorldMap — spec fattibilità OB-2c)

| ID | File | Trigger | Stati | Min → nat | Notes |
|---|---|---|---|---|---|
| I1 POI marker | `map/MapQuestPoi` + `MagicCircleHalo` | quest available | idle/available/active/halo | 55px (questPois config) | Canvas sprite, hit-test. |
| I2 route viaggio | `quest/QuestJourneyRoute` | travel | legs progress | overlay | Canvas line/fx. |
| I3 pin villaggio | pin dentro C1 | hover | states | | Pixi vs DOM da verificare. |
| I4 region labels/tooltip | map tooltip | hover region | | | |
| I5 sea/edge dressing | edgeWash (disabled), seaMargin 3600/1800 | sempre | — | | Config `seaMarginPx`, edgeWash spento. |

### Esclusi

Dev-only: `DirectorPanel`, `TuningPanel`, `ActiveHUDProfilerPanel`, audit/diagnostics, pagine lab (`/hud-lab`, `/mappa2-lab` ecc.). Motivo: non visibili al giocatore.

## Matrice contenuto-estremi (E-06) — da riempire alle catture

Per ogni ID sopra: **vuoto / tipico / massimo** (es. A1: 0 eroi / 5 / 14+n; E1: 0 eventi / ~20 / stress-long; B1: teatro min / tipico / stageMax 260 + scelte 190). Compilata in cattura — vedi `test-results/plan113-inventory/README.md`.

## Fixture seeding (E-14) — superfici non raggiungibili da load pulito

| Superficie | Stato minimo richiesto | Via |
|---|---|---|
| B6 verdetto, B7 popup, F1, F2, F3, F4 | quest/expedition conclusa, XP, sconfitta | saved-state preset via PersistenceService (`idleVillage:save`) seedato a load |
| D1, E2, E3 | edificio merchant / eroi caduti / eredità | fixture con merchant built + caduti + reliquie |
| B1–B5 cluster | quest attiva in run | fixture `quest.active` |
| A2 stash pieno, E1 storico | stash/eventi popolati | fixture | 

Preset da generare in F0: `plan113-preset-<name>.json` + loader `?preset=` su `/game` (o equivalente esistente — verificare se c'è già un meccanismo seed in `game-frame-pixi`).

## Verifiche aperte annotateggi (da chiudere in F0 con cattura + grep)

- E1 **risolto**: `HudEventLedger` (gameFrame) montato; `ActivityLogPanel`/`EventLogPanel` legacy non montati su /game.
- F3 **risolto parziale**: entrambi in `components/` (fuori barrel gameFrame); mount confermato `MinimalGameOverModal`? — check residuo.
- C5: `MockUpgradeControl` è in `gameFrame/` (non village/) — verificato esistenza file; mount da check.
- H5/H6/H7 **risolto**: `ObjectiveCartouche`, `NextEventTab`, `HudGameMenu`, `HudPanelsMenu` tutti in barrel gameFrame = **ancora nel chrome /game corrente** (non sostituiti da hudReal; convivono).
- I3: `MapBuildingPoi.tsx` + `MapDemoPoi.tsx` in gameFrame — i pin edifici/POI mappa sono componenti gameFrame (DOM sopra canvas? verificare in render).
- **Componenti scoperti nel barrel non ancora inventariati**: `HudHideToggle`, `HudRecenterButton`, `HudRibbon`, `ResourceReadout`, `WhenWhereCluster`, `MapBuildingPoi`, `MapDemoPoi`, `VillageDirectorView`, `MockBuyControl`, `expeditionLost`, `menu/` dir. Da assegnare a famiglia in revisione (H transienti / I mappa / G sistema).
