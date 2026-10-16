# Current State — RpgBalancer

**Ultimo aggiornamento:** 2026-10-05
**Superficie canonica:** `/game` (Game Frame Pixi — raggiungibile dal link «Game» in `/test hub`; R-075 v2)
**Repo remoto:** `https://github.com/Kurokasaiken/RpgBalancer`

## Stato di sintesi

Il progetto è un **Village/incremental management RPG con drag & drop**, con un laboratorio di combat/balancing integrato. La superficie di gioco canonica è **`/game` (Game Frame Pixi)**: la vecchia superficie Idle Village è **deprecata** (Director 2026-10-05). Il lavoro attivo è sulla superficie `/game`, World Surface e POI Quest; `/minimal-gameplay` resta il riferimento della vertical slice. Il core loop completo non è ancora assemblato.

Questa è una fotografia; per lo stato più aggiornato verificare `SESSION_HANDOFF.md` (journal), `RICHIESTE.md` e i test. Regola di sync: `.windsurf/rules/70-state-docs-sync.md`.

## Implementato

- React + Vite + TypeScript + Tailwind base.
- `TimeEngine` (day/night, tick, pause).
- `JobResolver`, `QuestResolver`, `QuestEngine`, `QuestPowerEngine`.
- `ProductionEngine`, `EconomyEngine`, `MarketEngine`, `InjuryEngine`, `SurvivalEngine`.
- `CharacterToResidentBootstrap`, `VillageStateStore`, `PersistenceService` (versioni da consolidare).
- `SlottedMedal`, `ActionCardBase`, `ActionHalo`, `JobActionCard`, `QuestActionCard`, `MarketActionCard`.
- `QuestChronicle` (card a fasi, rope, raccolta ricompense — superficie del vecchio path milestone, solo sulla pagina di riferimento deprecata).
- `QuestRunWindow` (`src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx`, R-106/R-107 → rev.1 R-196 → **rev.2 R-199**): **componente battezzato per la quest in corso su `/game`** (Director 2026-10-09) — placca HUD 820px (`questWindow.widthPx`) trascinabile/riducibile, teatro cinema a filo, narrativa ampia (`stageMaxHeightPx`), scelte bordate con trigger bisaccia adiacente, barra fasi su `durationDays` config con tile future visibili-ma-locked (`frontier.readyAt`); si apre dalla Regia («Start goblin quest») e dal menu Pannelli (tasto Q); motore `useQuestRun`/`questRun.ts` (grafo, frontiera v27, `abandon()`→`flee`, persistito via PersistenceService). **Rev.2 (R-199, bundle PASS 8/8):** skip implicito senza pulsante (click/tasto su stage), companions (`QuestPartyRosterPanel`/`QuestBeltPlaque`/`QuestLogPanel`) chiusi di default, `DestinyAstrolabeV62Standalone` docked sul teatro ai check + `QuestCheckOptionsPanel` (salta intro/check — verdetto engine-only), icona abbandona con conferma inline, esiti fuori dalla finestra → `QuestRewardPopup` page-level non-modale staged+skippabile. `QuestTheatre` converge dentro di esso; `QuestEpilogue` è il corpo del popup, non più dello stage.
- **Vista Villaggio su `/game`** (PLAN-035, 2026-10-15): `VillageScreenView` view-mode a tutta area dentro `GameFrame` (sotto le lastre HUD fisse), attivata dalla nav `Village` o dal click sulla regione villaggio dipinta; mappa Pixi resta montata inerte (`aria-hidden`+`inert`, ticker vivo). 11 edifici icon-first su `villaggio.png` (watermark Gemini rimosso) da `villageBuildingsConfig` Zod deep-frozen; tooltip hover-pinnabile con `MockUpgradeControl` inerte; Magazzino ed Emporio aprono `VillageStashPanel`/`MerchantPanel` dall'interno della vista (i marker `building-stash`/`building-merchant` sul continente sono stati rimossi); arbitro Escape unico a livello pagina. **PLAN-038 (2026-10-16, R-202):** i pin sono ora etichette di stato — `VillagePinFrame` per categoria (roundel/banner/shield) + badge tab (livello romano / `+` / lock) + `data-pin-frame`/`data-pin-state`; `VillageSlotOverlay` paint-first dipinge lo stato sul dipinto (ellissi footprint a due layer per buildable, vignetta+dotted per locked, pennant ≥II, glow `:has()` pin→regione); plaque insediamento + legenda visiva; `region`/`ellipseOverride`/`stakeTicks`/`anchorNudge` in config con lint geometrici bloccanti. Bundle `.mw/runs/plan-038-village-lots/` PASS 4/4. **PLAN-042 (2026-10-16, R-206):** Settlement Registry — `VillageRegistry` drawer slide-over da bordo destro (chip «Registro» con badge + hotkey `r`, filter chips stato, sezioni collapsible per categoria, drill-in detail card con focus trap e back); catalogo `slotKind` discriminated union: 11 painted + 5 registry-only (mageTower buildable, guild/sanctuary/alchemist/cemetery locked) + categoria `arcane` con frame `spire`; `activeBuildingId` condiviso (selected>hovered) con highlight a 3 livelli (footprint→pin→riga) e report `occludedAt{1280,1440,1920}`; Escape focus-scoped; seam `overlayArt` inerte per patch img2inpaint future. Bundle `.mw/runs/plan-042-village-registry/` PASS 4/4.
- **Quest Planner redesign su `/game`** (PLAN-036 / R-195, 2026-10-15): `QuestExpeditionDetail` è ora un'assemblea a due lastre `HudPlaque` (wrapper `data-hud-panel`, drag/clamp unico via `useHudPanelDrag` + `resetPosition` + re-clamp su resize): lastra planner (sottotitolo+chip → banner cinema ~2.76:1 `offer.coverArt` → `ResidentSlotRack` → bisaccia 3 slot → CTA «Invia spedizione» ancorata fuori scroll) + sidecar forecast destro `quest-expedition-forecast-column` (Stat Chiave Primarie/Secondarie → aggregato → BY MEMBER → WHY → Intel). `scenario.keyStats {primary, secondary}` root-level hashed (refine disjoint + `primary ⊆ primaryStats`; `primaryStats` frozen resta input di simulazione — **il digest `computeScenarioVersion` cambia una tantum** per gli scenari con `keyStats`, nessun artefatto pinnava il digest); fallback `deriveKeyStats` deterministico. Goblin → Primaria Forza / Secondaria Percezione; Rovine → Primaria Forza / Secondarie Percezione+Costituzione+Destrezza. Bisaccia: 3 `bag-slot` + toggle `quest-bag-picker-toggle` → picker esterno `quest-bag-external-picker` alimentato da `VILLAGE_STASH_CONFIG.items` (6 consumabili unificati, `engineFlag` validi), tessere solo-icona `picker-item-<id>` con tooltip Radix (nome/descrizione/stat coperte/stock), lifecycle Escape/click-outside/focus-return. Regime altezza: `QUEST_PLANNER_INFO.minZeroScrollViewportHeightPx = 720` — zero overflow interno ≥720px, scroll sanzionato sotto. Fix reali trovati dal percorso E2E: (a) `onDragStart` di pagina schedulava i token-slot dentro `startTransition` → bloom swap valid/invalid mai dipinto mid-drag → ora sincrono per `slot-token`; (b) `useExtractionSequence.cancel()` a `progress===0` ritornava senza fermare il rAF hold → il press-and-hold di un token-drag poteva completare l'estrazione e svuotare lo slot sorgente — ora abortisce (`reset()`). Bundle di verifica R-189: `.mw/runs/plan036-quest-planner-2026-10-15/bundle.json` **PASS** (7/7 obbligazioni, incluse CTR-game regression 12/12).
- **Offerte quest auto-rivelate su `/game`** (PLAN-037 / R-200, 2026-10-16): dopo l'uscita del boot veil i marker `QUEST_POIS` compaiono da soli, uno alla volta in ordine authored — `setTimeout` wall-clock da `gameFrameConfig.questReveal` (`initialDelayMs` 1000 / `staggerMs` 5000), reveal **additivo** (mai scomparsi finché la finestra è aperta), run attivo → marker immediato senza aspettare lo slot; «Mostra quest» nella Regia è un trigger one-way «reveal ora», «Reset» ri-arma lo stagger. `poi-goblin` è `repeatable` (mai consumato, torna `available` dopo il report e dopo reload, ignora record `consumedPoiIds` stale); `poi-rovine` resta one-shot. Regola lifecycle in `QUEST_RULES.md` §8b; bundle `.mw/runs/plan037-quest-reveal-2026-10-15/` PASS 7/7.
- `MagicCircleHalo` (iscrizione dalle ore 12, stop + pulsazione).
- `MilestoneCheckModal` con `Destiny Astrolabe V1`.
- `FloatingPanel` per detail / quest card / skill check (pannelli flottanti, spostabili, riducibili a icona).
- `WorldSurfaceRenderer` con layer DOM/Pixi, onde, uccelli, nuvole, parallasse sulle nuvole, `Window` primitivo.
- Sistema di skin/config-first, `IdleVillageConfig` editor, `dynamicConfig.json`.
- Playwright E2E per drag, POI quest, component hub.
- **Boot/preload + perf gate su `/game`** (PLAN-031, 2026-10-12): `GameBootScreen` veil con il logo authored su lacca teal HUD, progresso reale e reveal automatico (copre `/game`, `/`, `/game-frame-pixi`); all'apertura della mappa nessun pannello è visibile (registry `defaultVisible:false`, `useHudPanels` senza persistenza); `HudHideToggle` (tasto `h`, cluster bottom-right) fa scorrere i cluster top verso l'alto e quelli bottom verso il basso lasciando solo la perla di richiamo; `PixiWorldMap` con contratto `onBootProgress`/`onReady`, prefetch parallelo a tier, `refit` pre-reveal, `renderer.prepare.upload` (warmup GPU); toggle pannelli fa `refit()` in place invece di ricostruire l'app (fix `safeFitRef`); `__gamePerf` probe + `gamePerfBudgets` (Zod, p95≤33ms / 0 long-frame / boot ≤4s) + `tests/e2e/idleVillage/gamePerf.spec.ts`; drag medaglione fixato con `startTransition` sui handler + `MeasuringStrategy.BeforeDragging` su `DndContext` (0 long frame al floor; `gameQuestExpedition` 14/14 passa).
- **Mission Planner** (PLAN-018, R-078): draft PARTY/LOADOUT → preview deterministica (DP esatta, rng-free) → resolver che campiona lo stesso modello; checkpoint continua/ritirati; docs `mission_planner_spec.md` + `mission_planner_math_spec.md`; E2E `missionPlanner.spec.ts`. Sarà rimappato in PLAN-019 S2/S3.
- Sistema `Mind Weaver`: `AGENTS.md`, `.mw/desiderata.md`, `RICHIESTE.md`, `context/DECISION_LOG.md`, skill cross-IDE.
- **Knowledge pipeline** (2026-10-05, R-084/v25): `QUEST_RULES.md` canonico (PLAN-020), registry `context/REJECTED.md` + `context/OPEN.md`, report di ingestion tracciati in `context/ingestions/`, router L0–L4 in `context/INDEX.md`.
- **Quest S1 lab** `/quest-s1-lab` (PLAN-019-S1, 2026-10-02/03): «La cassa delle sementi» giocabile end-to-end — preset party, mercante, check con Astrolabe, bodyguard, permadeath, push-your-luck, esito graduato. Audit 2026-10-03: strutturalmente imperdibile (diagnosi + playtest seed 1983 in `.mw/runs/20261003-quest-v6-science/`); redesign proposto in `context/QUEST_V6_REDESIGN.md` (TAKEN≠SECURED + estrazione; originale in `.mw/runs/20261003-quest-v6-science/`). Bibliografia scientifica: `context/QUEST_GAMEPLAY_SCIENCE.md` (P1–P47). Seconda quest authored 2026-10-04: «Le Rovine sotto il Fiume» (`questScenarioRovine.ts`, da mockup Director/ChatGPT — spec tracciata in `src/docs/docs/idle_village/quest_rovine_scenario_spec.md`; provenance `.mw/runs/20261004-rovine-preview-chatgpt/`). **Quest Simulation Preview** (R-082, 2026-10-04): `questSimulation.ts` (analitico esatto per check + Monte Carlo seeded per quest, consumabili ignorati nel total) + `QuestSimulationPreview`/`QuestCheckPreview` integrati nella pagina — X-ray probabilistico con what-if bench e counterfactual consumabile.

## Parzialmente implementato

- `resourceHudKit`, `jobCardKit`, `questCardKit` (richiedono reskin/rifacimento).
- `skillCheckKit` d20 originale (da sostituire con Asterism V6).
- `marketKit` (`MarketActionCard` è placeholder).
- `outcomeKit` (4 tiers outcome).
- `activeHudKit` (notifiche attive).
- `integrationDragJobKit` e `integrationQuestFlowKit` (flussi non collegati).
- `PersistenceService` (versioni da consolidare).
- `questPoiKit` (status `draft`, da portare a `certified`).

## Progettato / non ancora implementato

- World Surface sub-plans A–M (tutti `Draft`).
- `ActionProcessor`, `TriggerSystem`, `ModuleRegistry`, `SeededRNG` (discussi, non nel main attuale).
- Economia reale del villaggio: upgrade/costruzione edifici con detrazione risorse e persistenza (PLAN-035 li presenta mock/inerti).
- Hero equip / consumabili / skill placeholder.
- Contenuto Steam-presentabile (Macro-Fase E).
- `ARCHITECTURE.md`, `ART_DIRECTION.md` consolidati.

## In corso

Vedi `RICHIESTE.md` per la lista completa. Esempi di richieste recenti (stato preciso in `RICHIESTE.md`):

- **R-057** — World Surface: parallasse manina, teca di vetro, resto del piano.
- **R-003** — World Surface mappa viva: sub-plan A.1/A.2/A.3 in draft, da riesaminare.
- **R-028** — Golden UI Foundation: Phase 1 Forensic UI/Art Audit.
- **R-026** — Documentazione AI-friendly + suite di test per integrazione componenti.
- **R-029/R-030** — Hero components placeholder.

## Blocchi / limiti noti

1. Drag pickup alignment (A.4) — verifica runtime in sospeso.
2. `MarketActionCard.tsx` — placeholder, bloccante per Macro-Fase B.
3. `MinimalActivityPage` — mancante.
4. Core loop non assemblato in `/minimal-gameplay`.

## Deprecato

- "Idle Village" page legacy → superficie di gioco deprecata; sostituita da `/game` (Game Frame Pixi, Director 2026-10-05). Il dominio/documentazione `idle_village` mantiene il nome storico.
- Concetto "Dispatch-like operational map" come modello spaziale canonico (sostituito da `World Surface`).

## Prossimi passi approvati

1. Chiudere la verifica drag pickup.
2. Assemblare il core loop (Macro-Fase B).
3. Consolidare documentazione (Batch 1: CANON, CURRENT_STATE, GLOSSARY; Batch 2: ARCHITECTURE, ART_DIRECTION, WORLD_SURFACE, AGENT_GOVERNANCE).
4. Continuare World Surface secondo R-057.
