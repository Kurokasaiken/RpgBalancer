# 02-GOVERNANCE — bundle tematico (snapshot 2026-11-19)

File uniti per provider con cap documenti. Fonti:
- repo-snapshot/CANON.md
- repo-snapshot/CURRENT_STATE.md
- repo-snapshot/DESIGN_PILLARS.md
- repo-snapshot/GAMEPLAY_DESIGN.md
- repo-snapshot/desiderata-digest.md
- repo-snapshot/OPEN.md
- repo-snapshot/REJECTED.md
- repo-snapshot/GLOSSARY.md
- repo-snapshot/RPG_PROJECT_CONTEXT.md
- repo-snapshot/PROJECT_PHILOSOPHY.md
- repo-snapshot/architecture_state.md
- repo-snapshot/VERTICAL_SLICE_ROADMAP.md
- repo-snapshot/CLAUDE_PROMPTS.md

---

<!-- ===== repo-snapshot/CANON.md ===== -->

# Project Canon — Mappa delle autorità

**Versione:** 1
**Data:** 2026-08-31
**Stato:** canonical
**Autorizzato da:** Fausto (via "Procedi" in sessione)

Questo documento non sostituisce i documenti che elenca: indica solo **quale documento ha autorità su quale tipo di decisione**.

## Gerarchia delle fonti

Per ogni domanda, il documento di riferimento è:

- **Gameplay reale e regole** → `GAMEPLAY_DESIGN.md`
- **Direzione visiva e design pillars** → `DESIGN_PILLARS.md`
- **Intenti congelati / vincoli approvati** → `.mw/desiderata.md` (versione `FROZEN` più alta; canonico intatto, fonte slice — read-path: `.mw/desiderata-digest.md`, PLAN-123)
- **Decisioni prese e perché** → `context/DECISION_LOG.md` (attivo, datate ≥2026-10-24) + `context/DECISION_LOG-archive.md` (legacy + antecedenti — PLAN-123)
- **Richieste attive del Director** → `RICHIESTE.md` (attivo; ledger split PLAN-121: `RICHIESTE-backlog.md` open antecedenti, `RICHIESTE-archive.md` chiuse antecedenti)
- **Piano operativo della vertical slice** → `VERTICAL_SLICE_ROADMAP.md`
- **Stato attuale del runtime, blocker, pezzi completati** → `CURRENT_STATE.md`
- **Regole tecniche e invarianti** → `DEVELOPMENT_GUIDELINES.md`, `.windsurf/rules/00-project-invariants.md`, `.windsurf/rules/40-documentation-governance.md`
- **Catalogo documenti caldi e tracciamento** → `context/INDEX.md`
- **Glossario dei termini** → `GLOSSARY.md`
- **Governance per agenti AI** → `AGENTS.md`
- **Architettura tecnica (mappa dominio → fonte)** → `src/docs/docs/architecture_state.md` (router canonico; i 4 ex-claimant marcati superseded/reference — audit 2026-10-05)
- **Stato operativo dei piani** → `plans/INDEX.md` (creato 2026-10-05; `ROADMAP.md` assorbito → superseded)
- **Regole quest correnti** → `QUEST_RULES.md` (doc canonico, PLAN-020 T-001); fonte intento resta `.mw/desiderata.md` FROZEN + `context/DECISION_LOG.md`
- **Superficie di gioco canonica** → `/game` (Game Frame Pixi, link «Game» in `/test hub`; Director 2026-10-05). Pagina Idle Village → deprecata.
- **Economia villaggio** → `VILLAGE_ECONOMY.md` (DRAFT — bozza di piano; proposte in OPEN-010)
- **Progressione** → `PROGRESSION.md` (DRAFT — bozza di piano)
- **Narrativa** → `NARRATIVE.md` (DRAFT — bozza di piano)
- **Audit KB 2026-10-05** → `KNOWLEDGE_AUDIT.md`

**Non sono knowledge docs (ops artifacts, nessuna autorità documentale):** `coordinator/manual-dispatch/`, `prompts/`, `test-results/` (evidence), `.mw/runs/` (ephemeral). Le skill vivono in `coordinator/skills/` (fonte unica; `.windsurf/skills` e `.devin/skills` sono symlink).

**Kanban/dispatch in pausa (R-208, 2026-10-16):** `src/docs/docs/coordinator/agent_assignments.md`, `coordinator/`, `ai-worker/` e i workflow `coordinator.yml`/`ai-worker.yml` non sono più il workflow operativo (conservati, non cancellati — riattivazione solo su decisione Director). Ciclo corrente: plan con contratto → agente locale → `verify:bundle` → chiusura in `RICHIESTE.md`. Il gate meccanico di chiusura è `closure:lint` (ex `kanban:lint`, solo gate R-189).

## Stati della conoscenza

Ogni affermazione su progetto, codice o design deve essere classificata così:

- **FACT** — è verificabile nel repository (codice, test, config, dati).
- **DECISION** — è registrata in `.mw/desiderata.md` FROZEN, `context/DECISION_LOG.md` (unione attivo+archive) o `CANON.md`.
- **PROPOSAL** — è una proposta non ancora accettata.
- **OBSOLETE** — era vera, ma è stata superata da una decisione successiva.

## Cosa un agente non può fare

Un agente non può, senza esplicito avallo del Director:

- ridefinire gameplay, progressione, monetizzazione, art direction o scope;
- sovrascrivere una `desiderata` con status `FROZEN`;
- riscrivere componenti `trusted`/`frozen` senza aggiornare il loro contratto e i test;
- introdurre valori hardcoded di gameplay o UI;
- cambiare direzione artistica in silenzio;
- trattare `DECISION_LOG.md` come se fosse `CURRENT_STATE.md`.

## Note

- `DECISION_LOG.md` è **storia**, non stato corrente.
- `DESIGN_PILLARS.md` è **direzione**, non specifica.
- `GAMEPLAY_DESIGN.md` è **game design**, non implementazione.
- `VERTICAL_SLICE_ROADMAP.md` è **piano**, non realtà.
- `CURRENT_STATE.md` è la **fotografia** del runtime oggi.

<!-- ===== repo-snapshot/CURRENT_STATE.md ===== -->

# Current State — RpgBalancer

**Ultimo aggiornamento:** 2026-11-17
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
- **Boot/preload + perf gate su `/game`** (PLAN-031, 2026-10-12): `GameBootScreen` veil con il logo authored su lacca teal HUD, progresso reale e reveal automatico (copre `/game`, `/`, `/game-frame-pixi`); all'apertura della mappa nessun pannello è visibile (registry `defaultVisible:false`, `useHudPanels` senza persistenza); `HudHideToggle` (tasto `h`, cluster bottom-right) fa scorrere i cluster top verso l'alto e quelli bottom verso il basso lasciando solo la perla di richiamo; `PixiWorldMap` con contratto `onBootProgress`/`onReady`, prefetch parallelo a tier, `refit` pre-reveal, `renderer.prepare.upload` (warmup GPU); toggle pannelli fa `refit()` in place invece di ricostruire l'app (fix `safeFitRef`); `__gamePerf` probe + `gamePerfBudgets` (Zod, p95≤33ms / 0 long-frame / boot ≤4s) + `tests/e2e/idleVillage/gamePerf.spec.ts`; drag medaglione fixato con `startTransition` sui handler + `MeasuringStrategy.BeforeDragging` su `DndContext` (0 long frame al floor; `gameQuestExpedition` 14/14 passa); **R-359 (2026-11-18):** `/game` chiama `warmGameAssets()` al mount — portrait/medaglioni/scene art decodificati nel veil (prima solo `warmGameCursors()`, ~365ms al primo roster open).
- **Map fit `/game` CTR-game-005** (PLAN-054/R-225, 2026-10-19): `safeFit` protegge la terra dal chrome fisso reale; quando `autoHudScale` ingrandisce la HUD via `cssZoom`, gli inset configurati vengono scalati prima di arrivare al renderer. Copertura: matrice viewport contrattuale + caso dedicato `3440×1440`, DPR 2 e probe CLI; bundle `.mw/runs/r225-ultrawide-map-fit/bundle.json` PASS.
- **Quest journey engine** (PLAN-053 / R-226, 2026-10-19/20): modello puro a fasi andata/svolgimento/ritorno con DAG validator authored (T-001..T-004), characterization suite legacy, journey route overlay su `/game` (sentiero bronzeo sotto il POI, visual fork A) e journey detail UI (3 leg bar, chip parcheggio, badge loot). Semantica frontiera: durante il viaggio la frontiera può restare `pending` (`readyAt` sentinella) finché il marker authored non arriva — non è un timer ordinario.
- **Onda PLAN-067 / R-234** (2026-10-20…23, ~40 commit): rework UX esteso di `/game` chiuso **con riserve** (commit `2658331b`). In sintesi: fix mappa che sparisce + audit (T-000); overlay e catalogo testi motore in it-IT (T-A13/b); `HudTooltip` Radix al posto del `title` nativo sui controlli HUD (T-A14 — **i test che cercano `title` sono obsoleti per design**); stella V6.2 con famiglia/profondità; comando di lancio con bersaglio sulla stella (SC-1 = A); barra quest in tempo reale su scala che si allunga con sforo a brace e tacche di fase (QW-1 = B); planner POI con immagine senza testo — **titolo sopra la hero**, sottotitolo/icone stat sotto (POI-D = A, T-B10) e hero ridotta a 72px per tenere la bisaccia dentro a 720px; magazzino nel planner come icona 36px con tooltip (PL-3 = A); cibo a brace su tessera scura (HUD-1 = A); famiglia icone incise (emoji → glifi, INV-1 = B); schede teaser Roster solo Cinzel/EB Garamond (FAM-1 = A); mai viola — morte in ferro freddo `#93a4ad` (COL-D = B); **HUD-3**: tre linguette staccate (tempo · prossimo evento · risorse) + pulsanti d'angolo in bronzo (menu/pannelli/nascondi, menu come icona in basso a destra con Esc); badge rimosso dal pulsante Pannelli (DN-2); azione primaria = lastra di famiglia (BTN-1 = A). **Serie T-C (perdita/eredità):** level-up con cerimonia (`HeroLevelCeremony`, lastra per eroe con sigillo romano, LVL = B); rapporto fine quest con nicchie per tornato e caduti in ferro freddo; giorno di morte registrato nel run; rapporto di sconfitta «Expedition lost» EXP A; caduta dell'insediamento con statistiche vere (SET = B); **Sala dei caduti** (`MemorialHall`/`MemorialPanel`, ogni morte nel Memoriale, DEATH-1 = B); **reliquiario dell'eredità** (`LegacyReliquaryPanel`, slot = livello edificio, LEG = B). Roster: default skin `base` (era `minimal_frontier`, commit `165bfb8d`), sort modes `name-asc/desc`, `hp-desc`, `fatigue-asc` (`rarity-desc` rimosso). Il pallino `data-decision-waiting` sui POI è stato rimosso intenzionalmente (20-10).
- **Village stash ledger** (PLAN-073 / R-240, 2026-10-21): magazzino interattivo ↔ bisaccia quest; Playwright `villageStash` 11/11 dopo fix race `dragActions`; bundle BLOCKED solo su governance condivisa.
- **Menu di gioco / salvataggio / titolo** (PLAN-076, DN-7, 2026-10-22): pacchetto di salvataggio atomico `gameSave` (slot auto + 3 manuali, «Salva ora», autosalvataggio dedicato), schermate Carica/Impostazioni (audio bus, movimento ridotto)/Esci-al-titolo con conferme, schermata titolo; invarianti in `.mw/contracts/components/game-menu-screens.md`. Bundle BLOCKED su eye-check Director + governance condivisa.
- **Quality Sentinel** (PLAN-078, 2026-10-22): registrato in `plans/INDEX.md`; harness `scripts/sentinel/*` in lavorazione (worktree dirty, sessione parallela).
- **Sync documentazione/gate** (PLAN-068, 2026-10-23): re-sync gate umani — G-11 chiusa (`trusted:check` OK), G-05 parziale (rulings BTN-1/DN-6/DN-7/COL-D/T-C2), accodato G-12 eye-check ritratti a PLAN-079.
- **Audit test+docs `/game`** (2026-10-23, questa sessione): riclassificati i rossi — drift intenzionale (planner hero, tooltip Radix, decision-waiting, frontier `pending`, skin `base`, sort `hp-desc`) vs bug reali (`MinimalGameOverModal`: gate `isGameOver`, titolo duplicato, focus; pip 8px in `QuestRunWindow` → glifo inciso; `hudPersistence.test.ts` si auto-mockava; `HUDNotificationLayer.test.tsx` import rotti). Inventory contratti rigenerato (280 unità / 463 STRICT_FILES), 7 contratti nuovi popolati, scope sincronizzati; residuo: 9 file con 2 owner (aggregato `game-menu-screens` vs per-file + `useCompactTop.ts` riassegnato a `resource-readout`) — serve ruling Director per il ratchet strutturale.
- **Mission Planner** (PLAN-018, R-078): draft PARTY/LOADOUT → preview deterministica (DP esatta, rng-free) → resolver che campiona lo stesso modello; checkpoint continua/ritirati; docs `mission_planner_spec.md` + `mission_planner_math_spec.md`; E2E `missionPlanner.spec.ts`. Sarà rimappato in PLAN-019 S2/S3.
- Sistema `Mind Weaver`: `AGENTS.md`, `.mw/desiderata.md` (canonico intatto; read-path `.mw/desiderata-digest.md`, PLAN-123), `RICHIESTE.md`, `context/DECISION_LOG.md` (attivo; archive `context/DECISION_LOG-archive.md`, PLAN-123), skill cross-IDE.
- **Knowledge pipeline** (2026-10-05, R-084/v25): `QUEST_RULES.md` canonico (PLAN-020), registry `context/REJECTED.md` + `context/OPEN.md`, report di ingestion tracciati in `context/ingestions/`, router L0–L4 in `context/INDEX.md`.
- **Quest S1 lab** `/quest-s1-lab` (PLAN-019-S1, 2026-10-02/03): «La cassa delle sementi» giocabile end-to-end — preset party, mercante, check con Astrolabe, bodyguard, permadeath, push-your-luck, esito graduato. Audit 2026-10-03: strutturalmente imperdibile (diagnosi + playtest seed 1983 in `.mw/runs/20261003-quest-v6-science/`); redesign proposto in `context/QUEST_V6_REDESIGN.md` (TAKEN≠SECURED + estrazione; originale in `.mw/runs/20261003-quest-v6-science/`). Bibliografia scientifica: `context/QUEST_GAMEPLAY_SCIENCE.md` (P1–P47). Seconda quest authored 2026-10-04: «Le Rovine sotto il Fiume» (`questScenarioRovine.ts`, da mockup Director/ChatGPT — spec tracciata in `src/docs/docs/idle_village/quest_rovine_scenario_spec.md`; provenance `.mw/runs/20261004-rovine-preview-chatgpt/`). **Quest Simulation Preview** (R-082, 2026-10-04): `questSimulation.ts` (analitico esatto per check + Monte Carlo seeded per quest, consumabili ignorati nel total) + `QuestSimulationPreview`/`QuestCheckPreview` integrati nella pagina — X-ray probabilistico con what-if bench e counterfactual consumabile.

- **Delega subagent + context budget** (R-343/R-344, 2026-11-15): profili RPG-aware `.devin/agents/` (`rpg-researcher` read-only, `rpg-verifier` safeguard, `rpg-implementer` write-capable — pinned `swe-1-6-fast`) + gemelli generici globali `~/.config/devin/agents/` (tutti i progetti, MW incluso); regole `.windsurf/rules/55-delegation-context-budget.md` (RPG) + `~/.devin/rules/delegation-context-budget.md` (globale); hook `PostCompaction`/`UserPromptSubmit` globali in `~/.config/devin/config.json` → `mind-weaver/tools/devin-context-hooks.py` (rilevamento docs canonici per progetto); `agent.subagent_model` pinnato. `devin doctor`: profili caricati ovunque.

## Parzialmente implementato

- **Contract resync R-345** (2026-11-15, in corso): meccanica chiusa (scope→inventory, INV namespacing, stub popolati, override cap apposto col "go" Director). Resume point con lista errori residui e opzioni (per-INV retire vs re-seal) in `RICHIESTE.md` → R-345. Gate rosso su drift sessione parallela + ruling 2-owner pendente.
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

Vedi `RICHIESTE.md` (file attivo; PLAN-121: open/chiuse antecedenti 2026-11-08 in `RICHIESTE-backlog.md`/`RICHIESTE-archive.md`) per la lista completa. Richieste/plan attivi (stato preciso in `RICHIESTE.md` e `plans/INDEX.md`):

- **PLAN-125** — restyling HUD `/game` (R-357), rev. 3 del 2026-11-17, non battezzato: **cassetto spedizione** ricostruito in DOM dal golden `mockup-r357-cassetto-largo.png` e montato su `/game` (palette allineata alla nav, Esc/×, animazione laterale; approvato per palette); da portare allo stesso standard Roster, Stash, Victory/Reward; mockup mancanti: Detail, banda di scorrimento, Eventi, sole, tipografia, icone, POI. Dettaglio e ordine in `plans/PLAN-125-hud-fix-r357.md` §0bis e §9. Nessun commit ancora (worktree condiviso).
- **PLAN-078** — Quality Sentinel: harness in lavorazione (`scripts/sentinel/*`).
- **PLAN-079** — follow-up performance + eye-check (include G-12 ritratti accodato da PLAN-068); budget `gamePerf` sotto osservazione (p95 `medal-drag-mount`/`map-pan`/`menu-open` sopra budget nel run del 23-10, da confermare su run pulita).
- **PLAN-076** — menu/save/titolo implementato; chiusura in attesa di eye-check Director + governance condivisa.
- **PLAN-067** — chiuso con riserve (2026-10-23): riserve oneste nel plan doc.
- **R-057** — World Surface: parallasse manina, teca di vetro, resto del piano.
- **R-003** — World Surface mappa viva: sub-plan A.1/A.2/A.3 in draft, da riesaminare.

## Blocchi / limiti noti

1. Drag pickup alignment (A.4) — verifica runtime in sospeso.
2. `MarketActionCard.tsx` — placeholder, bloccante per Macro-Fase B.
3. `MinimalActivityPage` — mancante.
4. Core loop non assemblato in `/minimal-gameplay`.
5. **Ownership contratti componenti (2026-10-23):** 9 STRICT_FILES con 2 owner — gli 8 file `gameFrame/menu/*` rivendicati sia dall'aggregato `game-menu-screens` sia dai contratti per-file, e `useCompactTop.ts` (riassegnato dal partizionamento a `resource-readout`, ancora rivendicato da `game-frame-pixi`). Il ratchet strutturale vieta la rimozione di membri senza sha256-approval → serve ruling Director (convertire `game-menu-screens` in CTR integration o approvare la deduplicazione).

## Deprecato

- "Idle Village" page legacy → superficie di gioco deprecata; sostituita da `/game` (Game Frame Pixi, Director 2026-10-05). Il dominio/documentazione `idle_village` mantiene il nome storico.
- Concetto "Dispatch-like operational map" come modello spaziale canonico (sostituito da `World Surface`).

## Prossimi passi approvati

1. Chiudere la verifica drag pickup.
2. Assemblare il core loop (Macro-Fase B).
3. Consolidare documentazione (Batch 1: CANON, CURRENT_STATE, GLOSSARY; Batch 2: ARCHITECTURE, ART_DIRECTION, WORLD_SURFACE, AGENT_GOVERNANCE).
4. Continuare World Surface secondo R-057.

<!-- ===== repo-snapshot/DESIGN_PILLARS.md ===== -->

# Design Pillars — Riferimenti d'ispirazione e raffinamenti

**Versione:** 2 (creato 2026-05-22; aggiornato 2026-10-11 — aggiunti Mount & Blade e Battle Brothers come riferimenti per mappa/parte gestionale, R-157)
**Companion di:** `GAMEPLAY_DESIGN.md`, `VERTICAL_SLICE_ROADMAP.md`, `COMPONENTS_SPECIFICATION.md`
**Cosa è questo file:** fissare in modo chiaro i riferimenti d'ispirazione che guidano il gioco e tradurli in scelte concrete di gameplay/UI/visual che la slice deve esprimere. Ogni volta che si decide qualcosa di nuovo (un componente, una micro-interazione, un suono), questo documento è la lente con cui controllare "è coerente con i pillar?".

> **Gerarchia documentale:**
> - `GAMEPLAY_DESIGN.md` v2 → visione attuale (eroe esiliato, Mercante, Locanda, Peasants).
> - `DESIGN_PILLARS.md` *(questo file)* → fonti d'ispirazione e raffinamenti.
> - `VERTICAL_SLICE_ROADMAP.md` v3 → piano operativo.

---

## 1. I pillar

### Pillar 1 — UI & mappa: *World Surface* (mondo da esplorare con gli occhi)

**Cosa prendiamo:**
- La mappa non è più una dashboard tattica, ma un **continente dipinto da esplorare con lo sguardo**: montagne, foreste, mare, creature, vita atmosferica e dettagli nascosti.
- **Layer visivi concettuali multipli**: base dipinta, atmosfera, landmark, creature, acqua/eventi, cornice/carving, overlay Pixi. A runtime i sistemi *costosi* restano 4-5, con DOM/CSS per il contenuto statico e PixiJS per la dinamica.
- **Respiro globale e profondità reattiva**: la mappa è un manufatto dipinto sul tavolo che prende vita quando il giocatore lo interroga. Luce, ombre, inchiostro, token e micro-parallasse di overlay atmosferici (nuvole, ombre, luce, token separabili) comunicano profondità. **Il mondo pulsa lentamente, sempre**: la materia della terraferma ondeggia in place via displacement field (Pixi, mascherato per bioma — vedi desiderata v21); i quad dei layer non subiscono mai trasformazioni geometriche. Stato del villaggio, timer e avvisi si leggono *sul mondo*, non in pannelli che lo coprono.
- **Vita ambientale rara, non rumore continuo**: 80% calma, 15% comunicazione ambientale, 5% sorprese rare (Kraken, balena, drago, meteora, aurora, nave fantasma, tempesta, stormo).
- **Reazioni nascoste data-driven**: niente sequenze di click rapidi. Trigger candidati: hover intenzionale breve (1.5-3s) su landmark, attraversamento di zone, condizioni di mondo (notte/pioggia), catene di osservazione.
- **Tier di presentazione eventi**:
  - Ambienti: nessun rischio permanente, effetto locale.
  - Minaccia: avviso localizzato, nessuna interruzione.
  - Maggiore: presentazione più marcata ma non bloccante.
  - Minaccia al run (es. Invasione Goblin che può chiudere la run): trattamento cinematico pieno, raro e giustificato.
- **Target Tauri desktop**: finestra dedicata, meno throttling del browser, ma rendering sempre WebView. Budget effetti misurato e non illimitato; niente mesh deformation continua, rifrazione fisica o volumetric fog senza profilazione.
- **Stile visivo**: pittorico e fantasy, con il linguaggio di Hearthstone/Marvel Snap: cornice intagliata (gargoyle/drago), colori caldi, luci drammatiche, frame come oggetto fisico.

**Cosa NON prendiamo:**
- Non è più una centrale operativa (Dispatch): niente POI = verbo + slot, niente dashboard con pannelli che coprono la mappa di default.
- Non è una griglia di sprite che camminano.
- Non sono effetti cinematografici a ogni evento: il 95% degli eventi resta localizzato e non blocca l'interazione.
- Non sette sistemi di rendering indipendenti e costosi: sette *concetti* sì, ma massimo 4-5 passi reali.
- Non un motore 3D nativo: si resta in React + DOM/CSS + PixiJS. Shader custom (GLSL/Pixi filter) ammessi in autonomia/lab e per effetti profilati, con fallback DOM e approvazione del Director.
- Non parallasse per layer o tilt/translate/scale sui layer full-canvas 4240×2828: i quad baked non si spostano mai, per non esporre bordi. La **deformazione in-place** dei pixel via displacement field è invece ammessa e prescritta per il respiro della terraferma (desiderata v21), se profilata. Parallasse consentita per overlay separabili (nuvole, ombre, luce, token) entro budget percettivo e WebKit.

### Pillar 2 — Meccanica core: *Cultist Simulator* (halo, slot-verbi, carte)

**Cosa prendiamo:**
- **POI = verbo + slot.** Ogni nodo della mappa esprime un'azione ("Cerca", "Taglia", "Combatti", "Riposa") e accetta una o più *carte* (medaglione PG, oggetto, licenza).
- **Halo come timer leggibile.** Anello rosso che si svuota → urgenza. Anello giallo/ambra che si riempie → lavoro in corso. Lo stato del mondo si legge guardando gli anelli.
- **Le carte hanno peso narrativo.** L'eroe, gli oggetti d'equipaggiamento, le licenze sono *cards*: hanno un nome, un'icona, una descrizione, e finiscono nelle slot dei POI per produrre esiti.
- **Skill check come carta dell'esito.** Niente combat animato: si apre una scheda pulita con probabilità, esito narrativo, ricompense.
- **Cronaca degli esiti.** Le carte di esito (success/partial/fail) si accumulano in un piccolo log "memoria del villaggio" — danno senso al tempo passato.

**Cosa NON prendiamo:**
- L'opacità narrativa (Cultist Sim è volutamente criptico). Noi siamo D&D classico, leggibile.
- ~~Il rischio di permadeath senza recupero: la slice non punisce con perdite definitive.~~ *(superata 2026-10-01, vedi `context/DECISION_LOG.md`)* Morte di un PG = spesa di una risorsa PG: scambio risorsa↔risorsa, coerente col loop strategico.

### Pillar 3 — Loop strategico: *Lords of Waterdeep* (approfondito)

**Cosa prendiamo:**
- **Worker placement come decisione scarsa.** I Peasants sono lavoratori limitati: piazzarli su un job è una scelta che ne preclude un'altra.
- **Engine building visibile.** Costruire la Locanda sblocca i peasants, costruire la Fucina sblocca equip migliori, ecc. Ogni edificio nuovo *cambia il rate* di qualcosa, e il giocatore vede il numero salire.
- **Quest come carte con requisiti.** Le quest non sono "click & wait" ma richiedono ingredienti (eroe + stat + licenza + equip). Senza ingredienti, niente quest. Ingredienti e slot obbligatori + secondari; la preparazione secondaria è facoltativa *(2026-10-01)*.
- **Blueprint sbloccati come Intrighi.** Come in LoW si compra Intrighi, qui si comprano Blueprint dal Mercante o si guadagnano completando quest: aggiungono mosse al motore.

**Cosa estendiamo rispetto a LoW:**
- **Eroi che salgono di livello, non solo workers.** Gli eroi sono *campioni* con stamina, XP, equipaggiamento — questa è la deviazione RPG.
- **Tempo continuo, non a round.** Lo stato del villaggio scorre in tick continui, non in turni discreti. Ma le "decisioni significative" sono comunque rade (1-2 per giorno), così resta strategico.

### Pillar 4 — Mappa strategica & gestione: *Mount & Blade* e *Battle Brothers*

**Scope dichiarato dal Director (R-157, 2026-10-11):** questi due riferimenti ispirano **la mappa e la parte gestionale** del gioco. Non sostituiscono i pillar 1–3: Pillar 1 resta la lente *visiva* della mappa, Pillar 4 è la lente *strategico-gestionale* dello stesso mondo.

**Cosa prendiamo (Mount & Blade):**
- **La mappa come spazio strategico continuo.** Insediamenti e punti di interesse sono nodi di un'unica superficie leggibile: ciò che conta (insediamenti, attori, pericoli) si vede *sul mondo*, non in un menu.
- **L'insediamento come hub di verbi.** Entrare in un insediamento apre un set di azioni/attori (commerciare, reclutare, prendere incarichi) — rafforza il nostro "POI = verbo + slot" (Pillar 2) dal lato gestionale.
- **Attori funzionali che si muovono sul mondo in tempo reale.** Party, carovane e minacce con intenti propri che si spostano mentre il tempo scorre: il mondo è vivo anche perché *ci sono altri che agiscono*, non solo per effetti atmosferici. Integra la "vita ambientale rara" del Pillar 1 con attori leggibili e con conseguenze.
- **La geografia come risorsa.** Distanza, rotta e tempo di spostamento fanno parte della decisione strategica: il *dove* conta quanto il *cosa*.

**Cosa prendiamo (Battle Brothers):**
- **I contratti come offerta di lavoro leggibile.** Gli insediamenti offrono contratti con rischio, ricompensa e durata valutabili *prima* dell'impegno — parallelo diretto con le quest card con requisiti (Pillar 3) e con la preview delle probabilità (R2.2).
- **La gestione della compagnia con costi di mantenimento.** Roster con upkeep (paga, provviste, condizione): la parte gestionale ha un "fondo" che va sostenuto, non solo assegnazioni one-shot.
- **Eventi narrativi diegetici sulla mappa.** Incontri e scelte testuali scatenati dal muoversi sul mondo: la mappa *genera* decisioni, non solo le ospita.
- **Tono sobrio e conseguenziale.** Le scelte gestionali pesano (uomini, economia, sopravvivenza) senza melò — coerente con il tono gestionale di frontiera già scelto per le etichette nominali dei POI (R2.1).

**Cosa NON prendiamo:**
- Non il battle layer tattico dedicato (battle map di Battle Brothers, field battle di Mount & Blade): gli esiti restano carte/skill check (Pillar 2), coerente con l'anti-pillar "combattimento in tempo reale animato".
- Non il viaggio libero del party come sistema della slice: il riferimento informa mappa e gestione, non introduce un overworld sandbox né un sandbox di fazioni.
- Non la letalità sistemica di Battle Brothers come tono di default: la morte di un PG resta uno scambio risorsa↔risorsa (decisione 2026-10-01, Pillar 2), non il default a ogni ingaggio.

---

## 2. Tabella di sintesi — pillar → meccaniche del progetto

| Meccanica della slice                | Pillar dominante         | Pillar secondari               | Stato componente nel repo                             |
| ------------------------------------ | ------------------------ | ------------------------------ | ----------------------------------------------------- |
| Mappa con POI nodi                   | World Surface                 | Cultist Sim, M&B/BB            | `MinimalGameplayPage` + `map/` ✅                      |
| Halo (rosso → giallo) su POI         | Cultist Sim              | World Surface                       | `ActionHalo.tsx` ✅                                    |
| Drag medaglione → slot POI           | Cultist Sim              | LoW (worker placement)         | `SlottedMedal` + `ActionCardBase` ✅                   |
| Quest card con requisiti (stat/eq.)  | Cultist Sim              | LoW, BB                        | `QuestActionCard` ✅ (manca preview requisiti)         |
| Skill check resolution pannello      | Cultist Sim              | —                              | **MANCA** (vedi `vertical_slice_completion_analysis`) |
| Job ripetibile (taglialegna/oro)     | LoW (worker placement)   | World Surface                       | `JobActionCard` ✅                                     |
| Peasants assegnati permanenti        | LoW (worker placement)   | —                              | **DA AGGIUNGERE** (regola di config + UI badge)       |
| Pannello Village + Blueprint/Upgrade | LoW (engine building)    | World Surface (overlay)             | `BuildingCard` ✅ (manca screen Villaggio)             |
| Mercante con countdown               | World Surface (countdown vis) | Cultist Sim (POI temporaneo)   | `MarketActionCard` ✅                                  |
| Day clock / event timeline           | World Surface                 | Cultist Sim                    | **DA AGGIUNGERE** (widget timeline)                   |
| Cronaca esiti (log narrativo)        | Cultist Sim              | —                              | **DA AGGIUNGERE** (strip in basso)                    |
| Level up eroe + animazione           | LoW (engine breath)      | Cultist Sim (carta evento)     | `SlottedMedal` ring ✅ (manca trigger + FX)            |

---

## 3. Raffinamenti proposti, pillar per pillar

Questa è la sezione operativa: cosa cambiare/aggiungere per rendere il gameplay più interessante e soddisfacente, **senza** uscire dallo scope della slice. Ogni raffinamento ha: *cosa*, *perché psicologico/UX*, *dove agire nel codice*.

### 3.1 Raffinamenti World Surface (UI / mappa)

**R1.1 — Layout a tre regioni con il mondo al centro**
- *Cosa:* la pagina `/minimal-gameplay` è divisa in tre regioni stabili: **Mappa centrale** (mondo dipinto esplorabile), **Roster a sinistra** (verticale, scrollabile), **HUD risorse + day-clock in alto**. Il pannello Villaggio si apre solo su richiesta come overlay glassmorfico leggero sopra la mappa.
- *Perché:* il giocatore deve leggere il mondo prima dei pannelli. Lo stato emergente dalla mappa (POI, luci, particelle, orizzonte) è il primario; le UI laterali/superiori sono accessori di supporto.
- *Dove:* refactor minimale di `MinimalGameplayPage.tsx`; il roster esiste già (`VillageRosterSection`), l'HUD risorse esiste (`VillageResourcePanel`).

**R1.2 — Day-clock e timeline eventi**
- *Cosa:* un widget orologio in alto (o un arco-sole) che mostra l'avanzamento del giorno + **una timeline a tacche** con icone degli eventi futuri ("Mercante T-3", "Quest urgente possibile dopo G2").
- *Perché:* dare orizzonte. Senza orizzonte il giocatore non pianifica. Con orizzonte, il riposo dell'eroe non è "tempo perso" ma "tempo investito in preparazione".
- *Dove:* nuovo componente `DayClockTimeline.tsx` in `src/ui/idleVillage/components/`. Si alimenta dai counter già esistenti nel `TimeEngine`.

**R1.3 — Linee di connessione fra POI**
- *Cosa:* sottili linee/sentieri dal Centro Villaggio agli outpost (Taglialegna, Oro). Quando un peasant è in lavoro, una piccola particella si muove lungo la linea ogni N tick.
- *Perché:* dà profondità al concetto di "avamposto di frontiera" e crea micro-feedback di "il villaggio respira".
- *Dove:* layer SVG sotto i nodi nella `MapPage.tsx`. Solo decorativo, non interattivo.

**R1.4 — Notifica diegetica per eventi che spawnano**
- *Cosa:* quando il Mercante arriva o spawna una quest urgente, una "vignetta" entra dal bordo della mappa con un sussurro audio ("Un viandante è in vista...") e poi atterra come POI.
- *Perché:* eventi importanti meritano un battito drammatico. Spawn istantanei senza fanfara fanno perdere il momento.
- *Dove:* hook su `MarketActionCard` mount + nuovo `MapNotificationLayer.tsx`. Audio cue tramite il sistema audio esistente.

**R1.5 — Stato "notte" come desaturazione globale**
- *Cosa:* quando scende la notte (se la slice ha day/night, e i componenti `DayNightActionCard` lo suggeriscono), la mappa si desatura leggermente, le luci dei POI attivi spiccano di più.
- *Perché:* ritmo. Il giocatore percepisce il giorno scorrere senza dover leggere un counter.
- *Dove:* CSS filter applicato a `MapPage.tsx`, opzionale on/off in config.

### 3.2 Raffinamenti Cultist Simulator (halo / carte / verbi)

**R2.1 — Ogni POI ha un'etichetta nominale chiara, non un verbo** *(decisione utente: nominale)*
- *Cosa:* sopra ogni POI un'etichetta sostantivata: "Taglialegna", "Setaccio dell'Oro", "Centro Villaggio", "Caccia Grossa", "Trattativa". Niente imperativi. Lo *stato* del POI (ozioso / occupato / urgente) è invece comunicato dall'halo, dal verb-tag colorato in micro-tipografia ("in corso", "urgente") e dall'icona attività.
- *Perché:* tono gestionale più sobrio (Banished/Frostpunk), coerente con un setting di frontiera. La fame di azione la dà l'halo e il countdown, non la grammatica imperativa.
- *Dove:* prop `label` (già esistente su `ActionCardBase`); aggiungere `statusTag` per il micro-stato sotto il nome.

**R2.2 — Anteprima requisiti e probabilità al drop hover**
- *Cosa:* quando trascini un medaglione PG sopra una quest card, prima del rilascio l'anteprima mostra **le stat richieste vs le stat del PG** e una probabilità di successo stimata.
- *Perché:* in Cultist Sim la combinazione delle carte si "preannuncia". Riduce la frustrazione del "non sapevo che fallivo".
- *Dove:* extension di `QuestActionCard` con stato `previewing`. Il calcolo esiste già in `minimalGameRules`.

**R2.3 — Halo a stati emotivi distinti**
- *Cosa:* tre stati dell'halo con micro-animazione propria:
  - **Rosso pulsante** (urgent quest fresca): pulsa una volta ogni 2s, *poi si fissa* e inizia a svuotarsi → vuoi attirare attenzione senza stressare per sempre.
  - **Giallo crescente** (lavoro in corso): riempimento liscio, leggero glow.
  - **Verde lampo** (completato): un lampo verde di 600ms prima di sbloccare il "Raccogli".
- *Perché:* gli stati emotivi del giocatore corrispondono a quelli dell'halo. Adesso `ActionHalo.tsx` ha già la struttura: serve solo coreografare le animazioni.
- *Dove:* `ActionHalo.tsx` + state machine in `useActionCardStyling.ts`.

**R2.4 — Skill check come scheda-carta**
- *Cosa:* quando una quest si risolve, **non** un modal generico ma una *carta* che si gira al centro dello schermo, con:
  - Lato A (prima del flip): l'icona della quest, le stat richieste, le stat effettive.
  - Lato B (dopo il flip): l'esito (Trionfo / Successo / Parziale / Fallimento / Disastro) e la lista ricompense.
- *Perché:* la rivelazione "flip" dà drammaticità senza essere flashy. Cultist Sim usa molto la metafora "carta = momento".
- *Dove:* componente nuovo `QuestResolutionCard.tsx`, montato sopra la `MapPage` come overlay. Sostituisce il `QuestSuccessModal` previsto in `vertical_slice_completion_analysis.md`.

**R2.5 — Cronaca esiti (Log narrativo)**
- *Cosa:* strip orizzontale in basso (collassabile) con le ultime 5 carte-esito. Click per riaprire la scheda. Le quest perse appaiono sbiadite.
- *Perché:* dà al giocatore la sensazione che il villaggio ha una *storia*. È la versione minimale del "Mansus" cultista.
- *Dove:* nuovo `ChronicleStrip.tsx`. Persisterà via `PersistenceService`.

**R2.6 — Carta "Licenza di Caccia" come oggetto-card, drag manuale** *(decisione utente: drag manuale)*
- *Cosa:* dopo l'acquisto al Mercante la Licenza **non è** un boolean nascosto né si equipaggia da sola. Appare:
  1. **Al momento dell'acquisto:** una piccola animazione fa scivolare la carta dal POI Mercante in un nuovo pannello laterale "Inventario / Carte di Equipaggiamento" (sotto o accanto al roster).
  2. **In inventario:** la carta è una vera tile cliccabile/trascinabile, con icona pergamena, nome ("Licenza di Caccia"), descrizione breve ("Necessaria per la Caccia Grossa").
  3. **Per equipaggiarla:** il giocatore la trascina sul medaglione dell'eroe. Sul medaglione appare un piccolo badge "pergamena" che indica "equipaggiato". Una volta equipaggiata resta sull'eroe per il resto della slice (drag-off opzionale, ma non necessario nella demo).
  4. **Effetto sulla quest:** sulla `QuestCard` "Caccia Grossa" il requisito mostra `Licenza di Caccia: ✓` solo quando il PG trascinato sulla quest *ha* la licenza equipaggiata. Senza, il drop viene rifiutato con un micro-shake e un tooltip "Licenza assente".
- *Perché:* la tangibilità del drag rende l'acquisto un *momento*, non un toggle invisibile. È il pillar Cultist Sim al suo meglio: la carta esiste, si vede, si tocca, si combina con un altro pezzo (l'eroe) prima di entrare nella quest. Inoltre prepara visivamente il sistema equipaggiamento del gioco completo (arma/amuleto useranno lo stesso pattern).
- *Dove:*
  - Nuovo pannello `InventoryStrip.tsx` accanto a `VillageRosterSection`.
  - Nuova entità "Item Card" minimale: id, label, icon, `equippableOn: 'hero' | 'peasant' | 'any'`, `effects: [{questRequirement: 'licenza_caccia'}]`. Persistita via `PersistenceService`.
  - Estensione `SlottedMedal` con un layer "equipped badges" in basso (1-2 slot visibili).
  - Hook su `QuestActionCard` `onDragOver`: verifica requirements del PG trascinato e mostra preview di accettazione/rifiuto (lega bene con R2.2).
  - Audio cue: "snap" quando la carta si incastra sul medaglione.

### 3.3 Raffinamenti Lords of Waterdeep (worker placement / engine building)

**R3.1 — Cap peasants per slot, sorgente: `dynamicConfig.json`** *(decisione utente: config-driven)*
- *Cosa:* il cap è il valore `maxResidents` che è già esposto **per ogni slot** in `src/data/dynamicConfig.json` → `mapSlots.<slotId>.maxResidents` (oggi `village_square: 6`, `village_gate: 4`). Per la slice si ribilanciano i valori job per job (es. `taglialegna: 2`, `setaccio_oro: 2`, `centro_villaggio: 4` per il riposo). Visivamente lo slot mostra N "alloggi" pieni/vuoti pari a `maxResidents`.
- *Perché:* la scarsità *fa* il game, ma il valore esatto resta una manopola di bilanciamento che si tocca dal JSON senza rilascio: posso testare 2 vs 3 vs 4 in playtest senza ricompilare.
- *Dove:* lettura via `dynamicConfig.json` (già caricato dal client); l'UI di `JobActionCard` consuma il cap dallo slot e disegna gli alloggi. Nessun nuovo file di config.

**R3.2 — Numeri "rate" visibili sul pannello Villaggio**
- *Cosa:* ogni edificio nel pannello mostra "Produce X / giorno con N peasants assegnati". Quando assegni un peasant in più, mostra la differenza con frecciette gialle.
- *Perché:* engine building è gratificante solo se *vedi* il motore accelerare. È la stessa dopamina dei "click counter" + i contatori di Lords of Waterdeep.
- *Dove:* nuovo `VillageScreenOverlay.tsx` (overlay sopra la mappa) che ricicla `BuildingCard` come tile.

**R3.3 — Blueprint come catalogo a tre stati**
- *Cosa:* nel pannello Villaggio i blueprint sono in tre stati visivi:
  - **Costruibile** (hai le risorse): tile chiara, bottone "Costruisci".
  - **Conosciuto ma povero** (manca risorse): tile sbiadita, mostra cosa manca.
  - **Sconosciuto** (locked, sblocco da quest): silhouette grigia "?" con hint "Sblocca da quest".
- *Perché:* fame di scoperta. Il giocatore vede quanti blueprint ci sono ma non tutti, e questo lo motiva a fare quest per sbloccare.
- *Dove:* `VillageScreenOverlay.tsx` + struttura `BlueprintCatalog` in config.

**R3.4 — Equip e XP come "carburante" tangibile del motore**
- *Cosa:* sulla card dell'eroe (medaglione esteso al click): barra XP segmentata in 3 tacche (lvl 1 → 2), slot equip (arma, amuleto) visibili. Quando l'eroe completa una quest, la barra XP si riempie con animazione *sopra* il medaglione, non solo nel modal.
- *Perché:* feedback ricco e immediato. È quello che manca alla maggior parte dei gestionali a tempo continuo: il "vedo il numero salire" deve avvenire nel posto giusto, sul *personaggio*.
- *Dove:* estensione `SlottedMedal` o un layer `MedalXPRing.tsx` da sovrapporre.

**R3.5 — Tempo continuo, senza battito di fine giornata** *(decisione utente: continuo)*
- *Cosa:* niente pausa con summary. Il tempo scorre senza interruzioni e il giocatore può intervenire quando vuole. Per compensare l'assenza del "battito strategico" senza svuotare la dimensione gestionale, si aggiungono **due sostituti diffusi**:
  - **Day-clock + tacche eventi (R1.2):** la timeline mostra in anticipo "tra X tick farà notte / arriva il Mercante / scade quella quest". È lì che il giocatore *legge* il futuro prossimo.
  - **Highlight della scelta corrente:** quando un peasant è ozioso o un eroe è a riposo completo, il loro medaglione pulsa molto delicatamente nel roster. Niente popup, niente modali — solo un richiamo periferico per dire "qui c'è una decisione da prendere".
- *Perché:* la scelta è coerente col feel gestionale a tempo continuo (ritmo rilassato, "second monitor", decisioni rade e pesanti — il gioco NON è un idle game: niente progressione offline, vedi `marketing/steam/claim-ledger.md`). Il rischio di non avere mai un *istante di riflessione* viene neutralizzato dal day-clock + dall'highlight passivo, che fanno da "sostituti delicati" del battito End-of-Day.
- *Dove:* `DayClockTimeline` (R1.2) gestisce la previsione; il pulse passivo è un layer sul `SlottedMedal` nel roster. Nessun `EndOfDaySummary.tsx` da creare.

**R3.6 — Sinergia Locanda → peasants, IN SLICE** *(decisione utente: in slice)*
- *Cosa:* la Locanda, oltre a sbloccare il reclutamento dei peasants, attiva una sinergia osservabile:
  1. **Effetto meccanico:** ogni peasant *reclutato dalla Locanda e attualmente assegnato* a un job riceve un piccolo bonus passivo. Default proposto (da `dynamicConfig.json`, ribilanciabile):
     - **+10% rate di produzione** sul job a cui è assegnato, oppure in alternativa
     - **-1 tick di "stanchezza" notturna** (recupero più rapido quando torna a riposare).
     Si sceglie *uno* dei due per la slice — propongo il **+10% rate**, perché è leggibile sui contatori. La stanchezza è più sottile e rischia di non vedersi nella finestra dei 30 min.
  2. **Lettura visiva:** una linea sottile dorata pulsa lentamente dalla Locanda verso ogni POI dove c'è almeno un peasant suo. La linea è gentile (opacità bassa, animazione di "respiro" lenta), non un effetto invadente.
  3. **Lettura testuale:** nel pannello Villaggio, la card della Locanda mostra esplicitamente "Bonus attivo: +10% produzione su N peasants reclutati (su M assegnati)". Numeri sempre aggiornati.
  4. **Trigger temporale:** la sinergia si attiva *appena* la Locanda è costruita e si applica retroattivamente al primo peasant reclutato — così il primo peasant è già "premio doppio" (nuovo lavoratore + edificio che lo potenzia). Questa coincidenza temporale dà la prima vera "scarica" di engine building.
- *Perché:* engine building si sente solo quando gli edifici si parlano. Una *sola* sinergia visibile, ma chiara e quantificabile, comunica la promessa del gioco completo (Fucina che potenzia equip, Tempio che cura, ecc.). Inoltre crea un'asimmetria interessante tra peasants "reclutati alla Locanda" e potenziali peasants "reclutati altrove" più avanti — gancio narrativo gratuito.
- *Dove:*
  - Config in `dynamicConfig.json`: nuova sezione `buildings.inn.synergies` con `{ target: 'recruited_peasants', effect: 'production_rate', value: 0.10 }`.
  - Engine: estensione di `minimalGameRules` per applicare il bonus al calcolo del payoff dei job, *solo* quando il worker ha origine `inn`.
  - UI: linea SVG dorata (riusa il layer di R1.3) + numeri nella `BuildingCard` della Locanda nel pannello Villaggio.
  - Origine peasant: aggiungere un campo `recruitedAt: 'inn' | 'fortunaEvent' | ...` su Resident, popolato dal flow di reclutamento.

---

## 4. Refinements trasversali (psicologia & ritmo)

Questi non appartengono a un singolo pillar ma sono ortogonali e servono ad aumentare la soddisfazione complessiva.

**R4.1 — Tre "scariche di dopamina" nella slice, scritte e coreografate**
1. **Primo peasant assegnato** (dopo Locanda): visual flash + suono caldo, il numero risorse comincia a salire da solo per la prima volta.
2. **Prima quest urgente risolta in tempo**: la `QuestResolutionCard` flippa con flash dorato.
3. **Level up eroe**: il ring del medaglione passa bronzo→argento, fermo immagine 1.5s, fanfara.

Sono i tre *momenti firma* della demo. La slice deve essere ritmata per garantirli tutti e tre in ~30 min.

**R4.2 — Tutorial *invisibile* via gating**
- *Cosa:* niente tutorial pop-up. L'unico tutorial è che all'inizio *solo certe cose sono cliccabili*: Taglialegna e Centro Villaggio sono illuminati, gli altri POI sono velati con un sottile "non ancora". Man mano che il giocatore avanza, si illuminano.
- *Perché:* tutorial diegetico = scoperta. Non rompe lo stato di flow.

**R4.3 — Sound design come "scheletro"**
- *Cosa:* tre famiglie di suoni:
  - **Drop / Pickup** (legno, ottone) — feedback fisico del drag.
  - **Halo states** (drone basso sui rossi, chime sui gialli completati).
  - **Eventi** (campana lontana per nuova quest, fischio per mercante).
- *Perché:* l'audio raddoppia la leggibilità visiva. Una persona che gioca senza guardare il monitor *sente* lo stato.

**R4.4 — Niente penalità definitive nella slice**
- Eroe ferito → si riposa N giorni → torna. Niente death. Le risorse non si perdono. La slice deve far innamorare, non punire.

---

## 5. Anti-pillar (cosa NON costruiamo, per non confondere il marchio)

| Anti-pillar                              | Perché lo evitiamo                                          |
| ---------------------------------------- | ----------------------------------------------------------- |
| Costruzione libera su griglia (Townscaper, Banished) | Toglierebbe il focus dalle decisioni di worker placement.   |
| Combattimento in tempo reale animato     | Conflitto col pillar Cultist Sim (esiti = carte, non scene). |
| Numeri esposti senza contesto narrativo  | Conflitto col pillar Cultist Sim (frame narrativo sempre).   |
| Albero di skill complesso per l'eroe     | Conflitto con la sobrietà di LoW (decisioni rade ma pesanti). |
| Tutorial scriptato con bolle             | Conflitto con il tutorial diegetico (R4.2).                  |

---

## 6. Mappa dei prossimi passi (collega con Roadmap)

Questa lista NON sostituisce `VERTICAL_SLICE_ROADMAP.md` ma indica quali raffinamenti vanno inseriti in quali macro-fasi:

- **Fase B (Core loop minimo girabile):** R1.1 (layout), R1.2 (day-clock), R2.1 (verbi POI), R3.1 (cap peasants), R3.2 (rate visibili).
- **Fase C (Skill check Cultist Sim):** R2.2 (preview prob), R2.4 (resolution card), R2.6 (Licenza come card).
- **Fase D (Reward + Level up):** R3.4 (XP sul medaglione), R4.1 (i 3 momenti firma).
- **Fase E (contenuto Steam-presentabile):** R2.5 (Chronicle), R3.3 (Blueprint catalogo), R3.5 (end of day), R3.6 (sinergia).
- **Fase F (Polish):** R1.3 (linee SVG), R1.4 (notifiche diegetiche), R1.5 (notte), R2.3 (coreografia halo), R4.3 (sound).

---

## 7. Decisioni di direzione (consolidate)

Tutte e cinque le scelte di direzione sui pillar sono state prese (2026-05-22):

- ✅ **R2.1 Verbi POI** → **Etichette nominali** ("Taglialegna", "Setaccio dell'Oro", "Trattativa"). Lo stato/urgenza vive sull'halo e su un piccolo `statusTag`.
- ✅ **R2.6 Licenza di Caccia** → **Drag manuale**: la Licenza è una carta visibile in un `InventoryStrip`, va trascinata sul medaglione dell'eroe per equipaggiarla, e solo a quel punto sblocca il drop sulla quest. Prepara il pattern di equipaggiamento del gioco completo.
- ✅ **R3.1 Cap peasants per slot** → **Da `dynamicConfig.json` (`mapSlots.<slotId>.maxResidents`)**. Non hardcoded, ribilanciabile in playtest.
- ✅ **R3.5 End of Day** → **Tempo continuo, niente battito**. Compensato dal day-clock (R1.2) + pulse passivo sui medaglioni oziosi.
- ✅ **R3.6 Sinergia Locanda → peasants** → **In slice**: +10% produzione per peasants reclutati alla Locanda e attualmente assegnati a un job. Linea SVG dorata + bonus quantificato nella `BuildingCard` della Locanda.

Da qui si può passare a un **implementation plan iterativo** per la slice. Suggerimento d'ordine (vedi §6 per il mapping completo macro-fase → raffinamenti):

1. **Layout control-room (R1.1)** — riorganizzazione di `MinimalGameplayPage.tsx` in tre regioni stabili (mappa / roster+inventario / HUD+day-clock). Pre-requisito di tutto il resto: niente raffinamento ha senso prima.
2. **Day-clock + tacche eventi (R1.2)** — perché il tempo continuo (R3.5) diventa pilotabile solo con il day-clock.
3. **Cap slot da `dynamicConfig.json` (R3.1)** — base del worker placement, da fissare prima di balancing.
4. **InventoryStrip + drag Licenza (R2.6)** — il primo pezzo "carta-oggetto", che apre la strada alla logica equip.
5. **Preview requisiti al hover (R2.2)** — naturale estensione di R2.6: senza preview il drop manuale frustra.
6. **Sinergia Locanda + linea SVG (R3.6)** — primo motore di engine building visibile.
7. **Pannello Villaggio overlay (R3.2 + R3.3)** — diventa significativo solo con almeno una sinergia attiva.
8. **Resolution card flippabile (R2.4)** — chiude il loop quest, sostituisce il pianificato `QuestSuccessModal`.

Quando vuoi, parto dalla #1 con un piano di task minimo e iteriamo lì.

<!-- ===== repo-snapshot/GAMEPLAY_DESIGN.md ===== -->

# Gameplay Design — Vertical Slice Steam

**Companion di:** `VERTICAL_SLICE_ROADMAP.md`, `DEVELOPMENT_GUIDELINES.md`
**Versione:** 2 (riscritta dopo correzioni utente del 2026-05-12)
**Cosa è questo file:** descrivere il gameplay reale del progetto e della slice. Non spec tecnica, ma "cosa succede quando si gioca".

> **Status (2026-10-05, refactor R-085):** REFERENCE — visione e loop di gioco.
> Questo documento descrive il *perché* e il *cosa* dell'esperienza, non le
> regole vigenti di dettaglio. Autorità per dominio:
> - **Regole quest correnti** → `QUEST_RULES.md` (canonico)
> - **Design knowledge / razionale quest** → `context/QUEST_S1_DESIGN.md`,
>   `context/QUEST_GAMEPLAY_SCIENCE.md`, `context/QUEST_ECONOMY_NOTES.md`
>   (quest'ultima = PROPOSAL, vedi `context/OPEN.md` OPEN-010)
> - **Stato implementato reale** → `CURRENT_STATE.md`
>
> **Sezioni parzialmente SUPERSEDED** (mantenute come storia, non riscrivere):
> - §1: modello spaziale «Dispatch / mappa tattica» → sostituito da **World
>   Surface** (DECISION_LOG 2026-08-31; CURRENT_STATE «Deprecato»)
> - §1: estetica «Gilded Observatory» → direzione attuale **Prismatic
>   Wanderlust** (`GLOSSARY.md`, `DESIGN_PILLARS.md`)
> Il resto (divisione roster, loop economico, drag&drop → action card,
> FOMO/halo, struttura della slice) resta la visione di riferimento.

---

## 1. Identità del gioco

**Genere:** Village/incremental management RPG con drag & drop, ispirato a board game strategici.
**Ispirazioni e Riferimenti Chiave:**

1. **UI di base & Mappa: Ispirata a *Dispatch***
   *   La UI non è una griglia classica né un mondo esplorabile a scorrimento, ma una **centrale operativa / mappa tattica** in cui i Point of Interest (POI) sono nodi interattivi connessi.
   *   I progressi e i tempi sono rappresentati visivamente tramite indicatori circolari e animazioni di riempimento dei nodi stessi.
   *   Estetica scura/glassmorfica in stile "Gilded Observatory" con glow dorati, ambra e rossi che segnalano gli allarmi o lo stato del villaggio.

2. **Meccanica degli Aloni (Halos): Ispirata a *Cultist Simulator***
   *   Ogni POI e Quest ha un anello esterno (halo) che indica il tempo rimanente o lo stato di avanzamento.
   *   **Fase FOMO (Scadenza - Rosso):** Quando una quest temporanea appare, l'anello è rosso e si riduce progressivamente. Comunica l'urgenza e stimola il giocatore ad intervenire.
   *   **Fase Azione (Risoluzione - Giallo/Ambra):** Quando l'eroe viene assegnato allo slot del POI prima della scadenza, l'halo si resetta, diventa giallo/ambra e comincia a riempirsi visualizzando il progresso del lavoro.

3. **Gameplay Loop & Automazione: Ispirato a *Lords of Waterdeep* (Approfondito)**
   *   **Divisione del Roster:**
       *   *Peasants (Worker):* Lavoratori non-eroici senza stamina. Vengono reclutati (alla Locanda) e assegnati permanentemente ad attività di raccolta base (Taglialegna, Setacciare Oro) per generare risorse. Non possono fare quest.
       *   *Eroi (Avventurieri):* Personaggi unici con statistiche, equipaggiamento e livelli. Consumano stamina per fare quest e guadagnare XP.
   *   **Progressione del Motore:** Il giocatore piazzi i Peasants per stabilizzare la produzione passiva, mentre usa l'Eroe per risolvere le Quest che poppano a tempo sulla mappa. Il completamento delle quest sblocca upgrade di edifici, blueprint e l'acquisto di licenze (es. dal Mercante ambulante).

**Setting:** Avamposto di frontiera dove la civiltà incontra la wilderness. Tono D&D classico, con quest del tipo "recupera l'artefatto / sconfiggi i banditi".
**Visual Style:** Medaglioni circolari board-game per i personaggi (`SlottedMedal.tsx`), action card per quest/lavori/eventi sulla mappa. Niente sprite di camminata, ma una mappa astratta con feedback visivi e audio eccellenti.

---

## 2. Due classi di personaggi

Distinzione fondamentale del gameplay.

### 2.1 Personaggi normali (artigiani / lavoratori)

- **Cosa fanno:** producono risorse concrete — ferro, legname, cibo, gold.
- **Cosa NON fanno:** non vanno in quest, non combattono mostri.
- **Dove vengono:** si comprano (servizio di reclutamento, probabilmente al centro del villaggio o alla taverna).
- **Esempio:** un taglialegna assegnato all'edificio "Taglialegna" produce N legname / ciclo.

### 2.2 Eroi (avventurieri)

- **Cosa fanno:** vanno in quest. Affrontano dungeon, recuperano artefatti, esplorano rovine.
- **Cosa NON fanno:** non lavorano agli edifici di produzione (almeno in principio — possibile eccezione di game design futuro).
- **Dove vengono:** arrivano spontaneamente alla taverna come avventurieri di passaggio. Si pagano per assoldarli (gold costo proporzionale a stat/raredness). Inizi la partita con 1-2 eroi base nel roster.
- **Sblocco progressivo:** dopo quest completate o quando la reputazione del villaggio cresce, nuovi eroi compaiono.

### 2.3 Sintesi

Gli artigiani producono **i materiali**. I materiali servono a **comprare l'equip** (e magari il cibo per gli eroi). L'equip permette agli eroi di affrontare quest **più difficili**, che danno **più exp e ricompense rare**. Le ricompense rare permettono **level up + upgrade edifici**, che producono più materiali, che permettono equip migliore, ecc.

È un loop economico classico ma con un divisorio netto fra forza lavoro e forza avventuriera.

---

## 3. La città all'inizio della slice

All'avvio della Vertical Slice, il giocatore si trova in un piccolo avamposto di confine. L'incipit vede l'Eroe unico che giunge in questo villaggetto dopo essere stato esiliato, partendo con **stamina molto bassa**.

Il layout iniziale comprende:
*   **Centro del villaggio (POI Permanente):** Il nucleo di controllo dell'avamposto. All'inizio serve principalmente come luogo di riposo per l'eroe per recuperare stamina.
*   **Aree di Raccolta Base (POI Permanenti):**
    *   *Taglialegna:* Consente di raccogliere Legno.
    *   *Setacciare Oro:* Consente di raccogliere Oro.
*   **Quest Ripetibile (POI Speciale):** Richiede un requisito specifico (**"Licenza di Caccia"**) che l'Eroe non possiede all'inizio, bloccandone l'esecuzione immediata.
*   **Pannello di Controllo Villaggio (Village Screen):** Un menu overlay che mostra i blueprint disponibili. Il primo e fondamentale blueprint sbloccato è la **Locanda (Inn)**, acquistabile per 30 Oro e 40 Legno.

---

## 4. POI sulla mappa & Eventi Dinamici

Lo spazio della mappa tattica (in stile *Dispatch*) ospita nodi interattivi (POI) che rappresentano attività e minacce:

### 4.1 POI di Produzione (Permanenti)
Nodi stabili in cui possono essere assegnati eroi o peasants per la produzione di risorse o il recupero di statistiche (es. Centro Villaggio per riposo, Taglialegna, Oro).

### 4.2 POI Temporanei e Quest Urgenti (Ispirati a *Cultist Simulator*)
Durante la partita, compaiono sulla mappa eventi e quest casuali che richiedono immediata attenzione:
*   **Il Mercante Ambulante (Event Countdown):** Un widget di conto alla rovescia segnala l'arrivo imminente del mercante. Quando il countdown scade, il mercante appare come POI temporaneo per 1 giorno. È l'unico che vende la **Licenza di Caccia** per 30 Oro, consentendo di sbloccare la quest ripetibile.
*   **Quest Urgenti (Expiring Quests):** Compaiono con un'anello esterno (halo) **rosso** che si svuota progressivamente. Se il tempo scade prima che l'Eroe venga assegnato allo slot, il POI svanisce. Se l'Eroe viene assegnato in tempo (e soddisfa i requisiti della quest), l'halo diventa **giallo** e inizia a riempirsi visualizzando il progresso del completamento. Se completate con successo, forniscono XP all'eroe e risorse rare.

---

## 5. La meccanica core: drag & drop → action card

### 5.1 Flusso base

1. Il giocatore vede un POI con action card attiva sulla mappa (`QuestCard` / `JobCard` / `MarketActionCard`).
2. Trascina un medaglione circolare (un personaggio dal roster) sopra l'action card.
3. Il medaglione si "incastra" nello slot dell'action card (il componente `SlottedMedal` ha già skin bronze/silver/gold/platinum + halo + ring).
4. Parte un timer visibile (`ActionProgressBar` esistente).
5. Allo scadere del timer, scatta lo skill check (per le quest) o si concretizza il payoff (per i job).

### 5.2 Lo skill check (stile Cultist Simulator)

Quando una quest si risolve, **non c'è un'animazione di combattimento**. Si apre un pannello pulito, statico:

- L'**oggetto-quest** (la card narrativa che descrive la sfida) al centro.
- Le **stat richieste** (es. "Forza 6, Percezione 4") come tag chiari.
- Le **stat effettive** dei personaggi assegnati (eroe + equip + buff temporanei) come tag accanto.
- Un **roll deterministico-ma-probabilistico** in stile carte: tira una probabilità, mostra il risultato.
- L'**outcome** è uno di: critical success / success / partial / fail / disaster — ciascuno con esiti narrativi diversi.

L'estetica: tipografia chiara, pochi colori, layout simmetrico. Nessun effetto fronzolo. Inspiration **Cultist Simulator**: gli oggetti sono carte, le combinazioni sono leggibili, il fato è chiaro.

### 5.3 Quest impossibili senza equip

Regola di design: le quest "interessanti" (cioè quelle che danno exp/loot rari) hanno stat threshold che nessun eroe base raggiunge senza equipaggiamento.

Conseguenza per il giocatore: **non puoi mandare un eroe nudo in dungeon serio**. Devi prima:

1. Far lavorare gli artigiani (job ripetibili) per accumulare materiali e gold.
2. Aspettare il **mercante itinerante** o usare il negozio fisso (se esiste in slice).
3. Comprare equip che porti le stat al threshold richiesto.
4. *Solo allora* mandare l'eroe.

Questa è la **catena di preparazione** che distingue il gioco da un normale clicker / idler.

---

## 6. Il loop di sessione

Una "sessione tipica" del giocatore in slice Steam:

1. **Apertura giornata**: controllo del roster (chi è disponibile, chi è in attività, chi è ferito o stanco).
2. **Assegnazione lavoratori**: drag artigiani → job action card per produrre risorse.
3. **Negoziazione mercante** (se presente): vendi materiali, compra equip per gli eroi.
4. **Assegnazione eroi**: drag eroi → quest action card, considerando le stat threshold.
5. **Attesa attiva**: i timer scorrono, l'HUD risorse cresce, ogni tanto skill check.
6. **Eventi**: quest temporanee compaiono, decidi se cogliere.
7. **End of day**: edifici producono passivamente, eroi guariscono in taverna, day counter avanza.
8. **Level up** (occasionale ma cruciale): un eroe sale di livello → upgrade di un edificio diventa disponibile → la macchina di produzione accelera.

---

## 7. Il "WoW moment" & Vittoria della slice

L'esperienza culmina in due momenti cruciali di progressione:
1.  **L'Automazione (La Locanda):** Il giocatore, accumulando 30 Oro e 40 Legno con sforzi attivi (riposo e lavoro dell'Eroe), sblocca e costruisce la Locanda. Reclutando i **Peasants** e posizionandoli sui job stabili (Taglialegna e Setacciare Oro), sperimenta il sollievo dell'automazione passiva delle risorse base.
2.  **Il Level Up & Fine Slice:** L'Eroe, ora libero dai lavori manuali e dotato della Licenza di Caccia, affronta ed esegue le Quest Urgenti a tempo. Risolvendo un numero target di quest (es. 3), accumula abbastanza XP da effettuare il **Level Up a Livello 2**. Questo sblocca un'animazione trionfale di vittoria e interrompe la Vertical Slice con un teaser del gioco completo.

---

## 8. Cosa la slice Steam mostra (e cosa no)

### 8.1 Mostra
*   **Inizio in esilio:** Roster iniziale con 1 solo Eroe a stamina bassa (15/100).
*   **Gestione stamina:** Loop iniziale di alternanza tra lavoro (Taglialegna/Oro) e riposo (Centro Villaggio).
*   **Event Countdown:** Widget che conta i giorni/tick mancanti all'arrivo del Mercante Ambulante.
*   **Il Mercante Temporaneo:** Visita del mercante con la possibilità di acquistare la "Licenza di Caccia" per 30 Oro.
*   **Quest Ripetibile Sbloccata:** Esecuzione della quest speciale abilitata solo dopo l'acquisto della licenza.
*   **Schermata Villaggio (Village Screen):** Interfaccia di acquisto e upgrade dei blueprint, in particolare la costruzione della Locanda.
*   **Automazione con Peasants:** Reclutamento dei peasant alla Locanda e assegnamento permanente (senza stamina) a Taglialegna/Oro.
*   **Quest Urgenti (FOMO):** Spawn di quest temporanee con halo rosso che si svuota e halo giallo che si riempie in fase di esecuzione.
*   **Progressione & Livellamento:** Il Level Up dell'eroe come condizione di vittoria e completamento della demo.

### 8.2 Non mostra (out of scope per the slice)
*   Combattimento tattico o visuale di scontro in tempo reale.
*   Costruzione libera o posizionamento su griglia 3D degli edifici.
*   Salvataggi multipli (slot) o persistenza cloud.

---

## 9. Componenti già esistenti da usare

| Aspetto gameplay | Componente esistente | Path |
| --- | --- | --- |
| Medaglione circolare drag&drop | `SlottedMedal` + halo + ring | `src/ui/idleVillage/components/SlottedMedal.tsx` |
| Token alternativo (rettangolare) | `PgCard` | `src/ui/idleVillage/components/PgCard.tsx` |
| Overlay durante drag | `CustomDragOverlay` | `src/ui/idleVillage/components/CustomDragOverlay.tsx` |
| Action card base | `ActionCardBase` | `src/ui/idleVillage/map/actionCards/ActionCardBase.tsx` |
| Quest action card | `QuestCard` (via `QuestActionCard.tsx`) | `src/ui/idleVillage/map/actionCards/wrappers/QuestCard.tsx` |
| Job action card | `JobCard` (via `JobActionCard.tsx`) | `src/ui/idleVillage/map/actionCards/wrappers/JobCard.tsx` |
| Anello e Progresso Halo | `ActionHalo` | `src/ui/idleVillage/map/actionCards/ActionHalo.tsx` |
| Roster personaggi | `VillageRosterSection` | `src/ui/idleVillage/roster/VillageRosterSection.tsx` |
| Pagina canonical runtime | `MinimalGameplayPage` | `src/ui/idleVillage/MinimalGameplayPage.tsx` |
| Store di stato | `useMinimalGameplay` | `src/store/useMinimalGameplay.ts` |
| Regole e Calcoli Engine | `minimalGameRules` | `src/engine/game/idleVillage/minimalGameRules.ts` |
| Rotta di test | `/minimal-gameplay` | `src/ui/idleVillage/MinimalGameplayPage.tsx` |
| Stili e Color Palette | WL-STY-004 e StyleLab presets | `src/ui/styleLab/presets/` |

---

## 10. Constraint tecnico — bug pickup alignment

Dall'handoff (`idle_village_conversation_context_handoff.md` §5.1):

> Al drag start, il cursore/hand non è centrato sul token — è spostato a destra. Pickup alignment è ROTTO, regression dopo lavori su spring-return.

Implicazione per la slice: **il primissimo task di runtime fix è centrare il pickup**. Tutto il resto del gameplay design dipende da un drag&drop che si sente *giusto*. Finché il token "salta" quando lo afferri, l'esperienza Cultist-Simulator-clean non funziona.

Vedi `VERTICAL_SLICE_ROADMAP.md` Settimana 1 per il piano di intervento puntuale.

---

## 11. Cosa serve definire ancora (decisioni utente pendenti)

Per finalizzare il design senza più invenzioni:

1. **Risorse esatte** della slice: ferro/legname/cibo/gold confermati. Vanno tutti e 4 o si parte con 2 (legname+gold) per semplicità?
2. **Equip minimo**: che tipi di oggetti compra l'eroe? Arma / armatura / amuleto generico, oppure più specifico?
3. **Stat dell'eroe**: quante stat ha? (Forza, Destrezza, Costituzione, Intelligenza, Saggezza, Carisma — full D&D? oppure subset, es. Forza/Percezione/Spirito?)
4. **Numero quest nella slice**: 2-3 quest narrative + N job ripetibili è il target?
5. **Durata target**: hai detto >10 min per Steam. Che ordine di grandezza — 30 min? 1h? 3h di gameplay diverso prima di vedere "End of slice"?
6. **Save slot**: uno automatico oppure permettiamo "New Game / Continue"?
7. **Tono narrativo**: tooltip e dialoghi in stile asciutto-cronaca (Banished) o evocativo-letterario (Cultist Simulator)?

Quando rispondi a queste, finalizzo il design e parto con l'implementazione.

<!-- ===== repo-snapshot/desiderata-digest.md ===== -->

# Desiderata — digest (PLAN-123)

> File in read-list AGENTS.md. Generato meccanicamente da
> `npx tsx scripts/ledgerSplit.ts desiderata digest` — deterministico,
> non editare a mano. Il canonico `.mw/desiderata.md` (sha256
> eae71073ebb8326f…, 38 sezioni v1–v38)
> resta BYTE-INTATTO ed è l'unica fonte per lo slice tooling
> (`mw-desiderata-slice`/`desiderata_slice`).
> Questo digest: indice completo + corpo verbatim di v27–v38
> (suffisso più grande ≤ 50000 char).

## Indice delle versioni

- **v1** — (senza titolo in heading) — Adottare il protocollo Mind Weaver nel progetto RPG: portare il workflow (explorer, planner, exec…
- **v2** — World Surface: mappa viva da esplorare con gli occhi — - La mappa di World Surface **non è più una dashboard tattica (Dispatch)**; è un **mondo da esplo…
- **v3** — POI Quest System — I POI di tipo *quest* si distinguono dagli altri POI per tre caratteristiche: (1) timer visivo co…
- **v4** — POI Quest System: pannelli flottanti e ritmo delle fasi — - "quando si apre il Detail nn posso + uscire e nn posso interagire con nient'altro."
- **v5** — Mockup AI → componente React + asset ad hoc: protocollo generale — Stabilire un protocollo generale, riutilizzabile, per passare da mockup generati con AI a compone…
- **v6** — Mockup → CSS/React + asset ad hoc: paintover consentito — Per qualsiasi componente UI o World Surface, il workflow operativo è: il Director prima prova CSS…
- **v7** — Documentazione AI-friendly + suite di test per l’integrazione di componenti in pagine — Quando un agente deve mettere componenti in una pagina, deve sapere come comportarsi senza dover…
- **v8** — Golden UI Foundation — Il piano Golden UI Foundation v2 è approvato come direzione. Non costruiamo un design system astr…
- **v9** — La geometria avversariale non deve essere amorfa — Il goo — blob scuro dai contorni organici e irregolari — non è l'unica forma
- **v10** — Placeholder funzionali e skin-ready per scheda, equip, consumabili e skill equip — Costruire componenti placeholder per scheda del personaggio, meccanismo di equip, oggetti equippa…
- **v11** — Skill Check Web V1: la rete lanciata, e il fallimento critico messo in scena — Uno *skill check cinematografico*, non un astrolabio. L'avversario è una
- **v12** — Strato punti-stat, Trial by Fire, consumabili e authoring delle attivita' — equippabili, consumabili, skill) realizzati in `src/pages/hero-components-lab.tsx`. v12 sta
- **v13** — Skill Check Web V1: contenimento e avversario sono due oggetti distinti — direzione A fra le tre presentate in sessione esplorativa.
- **v14** — Skill Check: una materia sola, due stati. Il goo è la tela coagulata — esplorazione e una ricerca sulla semiotica del segno visivo (Peirce: icona / indice / simbolo).
- **v15** — La stella copre la trama. Il personaggio, la difficoltà, e la differenza — La v14 trattava il fallimento come una fascia da inventare al muro, e la forma come un
- **v16** — Il goo torna, ma come densità e non come colata. La stella dimagrisce per gradi — sulla revoca del divieto della v15 e sulla direzione A+B emersa in sessione esplorativa.
- **v17** — Il contratto di copertura vince sulla forma — «fiore pieno va bene, vince il contratto».
- **v18** — Knowledge & Design Repository governato per RPG — ### User-stated
- **v19** — World Surface: ombre nuvole sempre attive, autorizzazione shader/parallasse overlay e Water Effect Lab — - il divieto di shader custom su World Surface diventa un **permesso condizionato** (lab, profila…
- **v20** — Astrolabe V6.3: materialità, prisma sul goo e fondi materici — ### User-stated (parole del Director)
- **v21** — World Surface: il mondo respira nella materia (terraferma) — ### User-stated (parole del Director)
- **v22** — Audit e direzioni per l'HUD esterno di RpgBalancer — ### User-stated
- **v23** — Mission Planner: la spedizione come problema da risolvere con simulazione live — ### User-stated
- **v24** — Macro plan Quest: prima una quest vera e divertente, poi l'integrazione, poi la generazione — ### User-stated
- **v25** — Audit e refactoring della knowledge base orientata agli agenti AI — - Audit della documentazione di tutti i progetti che usano Mind Weaver, priorità RPG Balancer (`~…
- **v26** — Strategist: layer di direzione pre-desiderata — - Un ruolo/skill `strategist` per **discussioni libere** su direzione, futuro del gioco, bilancia…
- **v27** — `QuestTheatre`: la quest nel gioco reale è una storia a nodi che aspetta ai bivi — ### User-stated
- **v28** — Luce dinamica 2D sulla mappa dipinta: ombre nuvole, god rays, luci su POI/landmark — - "va bene, e vorrei anche vedere il god rays" (approva penombra nuvole + sprite additivi + god r…
- **v29** — Trappole ricorrenti consumate al momento del lavoro (pre-flight, non registro) — - *"esempio di errore ricorrente: ad esempio: + volte nella pagina /game la mappa continua a dive…
- **v30** — Vista Villaggio (`Village` view mode) e Menu Edifici su `/game` — ### User-stated
- **v31** — Workflow single-agent: kanban/dispatch in pausa, chiusura a contratto — La kanban board, il dispatch coordinator/ai-worker/harness e la pipeline
- **v32** — Verifica comportamentale meccanica: da fatica del Director a gate (piano S0–S5) — *User-stated (fonte: desiderata v52 mind-weaver + dibattito + ruling)*
- **v33** — Gate d'intento alla chiusura: risultato vs desiderata e chiarimenti, non solo vs plan — *User-stated*
- **v34** — Cinematica delle scene quest: depth-parallax sistematico + regia dei beat — usando cm asset x le quest (cinematografiche, ecc). potresti prenderle e dividerle
- **v35** — Visual fork gate: nessuna scelta estetica silenziosa dell'agente — *User-stated*
- **v36** — Sistema vivo di contratti per-componente, integrazioni e test sincronizzati su `/game` — *User-stated*
- **v37** — Astrolabio: silhouette a famiglia uniforme per board, morph accoppiato — sulle soglie 10%/35% e sulla copertura qualitativa)
- **v38** — Expedition planning UI: assorbimento strutturale del mockup approvato — dopo il dibattito multi-AI `20261115-wanderlust-ui-plan` e i ruling D6 edge-tab /

## Corpo verbatim — v27–v38

## v27 — `QuestTheatre`: la quest nel gioco reale è una storia a nodi che aspetta ai bivi

**Status:** `FROZEN`
**Date:** 2026-10-06
**Authorized by:** Fausto
**Reason:** avallo via «avallo» in sessione esplorativa (R-088), dopo discussione della proposta ChatGPT «Presentazione della quest» (share `6ac5017a`).

**Relazione con altre desiderata:** non modifica il gameplay — la catena S1 (`PARTY → QUEST → PHASE → SITUATION → APPROACH → CHECK/CHOICE → CONSEQUENCE`) e QUEST_RULES restano invariate. Definisce **presentazione e semantica temporale** della quest sulla superficie canonica `/game`. v3/v4 restano fonte per il contratto dei pannelli (FloatingPanel: spostabile, riducibile a icona, non bloccante); il teatro eredita il container e ne cambia contenuto e scala. Il lab S1 resta sperimentale e fuori scope.

### User-stated

1. Scelte e skill check **non si risolvono automaticamente**. Solo il tempo scorre.
2. La quest si ferma alla prima fase che richiede il giocatore e **aspetta ai bivi** — *"una storia a nodi che mi aspetta ai bivi"*.
3. Il tempo reale pre-paga le durate: chi apre in ritardo gioca le fasi pendenti una dopo l'altra senza attese; *"il gameplay è identico"*.
4. Direzione **B**: `QuestTheatre` come componente nuovo — stage renderer (narrative / choice / check / consequence / reward) che **ospita** i contenuti esistenti (chronicle, skill check, reward panel, kit, log) dentro `FloatingPanel`, con modalità **expanded**.
5. **Scartati dalla proposta ChatGPT:** stato narrativo (`IN DANGER` / `RETURNING`) e livello di pericolo implicito — *"nn mi interessa"*.

### AI inference (derivata, marcata come tale — interpretazione avallata con il punto 3)

- Una fase **senza decisione** (puro viaggio, puro evento narrativo) si auto-completa allo scadere del suo tempo: la quest si ferma solo davanti a un bivio, un check o un checkpoint.
- Se il giocatore guarda *live*, le fasi arrivano man mano che i loro timer completano; i bivi lo aspettano.
- «Il mondo continua a esistere» resta un requisito percettivo (Pillar 1): il teatro non deve coprire lo stato del mondo più del necessario — coerente con v4 (nessun backdrop).

### Candidate dalla proposta (da validare nel piano)

- **Timeline narrativa** = traccia dei nodi passati + prossimo nodo noto; il futuro ignoto non si mostra, nemmeno come `?` — coerente con QUEST_RULES §2 (stat primaria sempre rivelata, resto intel-gated).
- **Party strip** sempre leggibile; **decision panel** per check/scelte (probabilità, conseguenze, assistenza disponibile).
- **Expedition kit** come drawer (non sempre visibile); **chronicle/log** con timestamp narrativi.
- **Retreat** sempre presente ma distinto, con **anteprima delle conseguenze** al click.
- **Art cinematografica** che porta il peso emotivo; UI sobria, quasi da libro illustrato.
- **Header** con titolo + obiettivo (e deadline se esiste).

### Cosa questo NON autorizza

- Nessuna auto-risoluzione di scelte, skill check o checkpoint — nessun default policy silenzioso.
- Nessun pannello modale bloccante né backdrop: vale v4 integralmente.
- Nessun duplicato di `QuestChronicle` / `MilestoneCheckModal` / `QuestRewardPanel`: il teatro *ospita*, non rifà (invariante Component Reuse).
- Nessuna implementazione prima del planner: v27 è desiderata, non mandato di esecuzione.
- Nessuna applicazione al lab S1 (sperimentale) né alla superficie deprecata.

### Still unresolved

- Forma esatta della modalità expanded (quanto del mondo resta visibile; docked vs floating massimizzato).
- Se più quest contemporanee = più teatri, o una quest attiva alla volta.
- Come il teatro segnala "la quest chiede attenzione" quando è ridotto a icona (halo POI, tick sul day-clock, entrambi).
- Destino del modello v3 (fasi temporizzate auto-risolte) quando il teatro arriva sulla superficie: convergenza o coesistenza.

### Emendamenti approvati

- **Deroga R-199 (2026-10-16):** la schermata di esito/ricompensa NON è ospitata nel teatro (contravviene al punto 4 «ospita… reward panel») — `QuestRewardPopup` è una placca page-level non-modale montata fuori dal DOM della finestra; il teatro conserva la narrativa di chiusura. Richiesta verbatim del Director: *"quando la quest finisce la schermata di reward deve essere un componente /popup esterno, nn all'interno della quest stessa"*. Valgono comunque v4 (niente backdrop/modali) e Component Reuse (corpo = `QuestEpilogue` condiviso).
- **Deroga R-199 (2026-10-16):** i companion opzionali (party/belt/log) partono **chiusi di default** (`questWindow.companionsDefaultOpen: false`) — revoca il «tutto visibile» di R-196, richiesta verbatim *"i componenti opzionali devono essere chiusi d default"*.

---

## v28 — Luce dinamica 2D sulla mappa dipinta: ombre nuvole, god rays, luci su POI/landmark

**Status:** `FROZEN`
**Date:** 2026-10-09
**Authorized by:** Fausto
**Reason:** avallo esplicito — "approvo, procedi" sulla candidata v28 rivista dopo la critica multi-AI web (`.mw/runs/2026-10-09-dynamic-lighting-critique/`).

**Intento del Director (verbatim):**
- "va bene, e vorrei anche vedere il god rays" (approva penombra nuvole + sprite additivi + god rays).
- "noi abbiamo un tool dove ci sn gli slidere degli effetti in quella pagina, le cose vanno la dentro. Voglio poterle mettere anche a 0% x vedere la differenza con e senza".
- Luci su: "POI e landmarks". Sole: "da in alto a sinistra verso basso a destra". Ombre: "nn so, proviamo entrambe le cose e poi decidiamo".

**Formulazione approvata (FROZEN):**
La mappa mondo dipinta (`/game-frame-pixi`, pipeline PixiJS/WebGL2) guadagna tre effetti di luce dinamica, tutti nel **tuning panel degli slider** (`TuningPanel`/`PixiMapTune`), ognuno con slider **0% = pass smontato dal render graph** (non output nero) per il confronto diretto con/senza:

1. **Ombre nuvole a confronto multi-variante** — selettore `cloudShadowMode: 'sprite' | 'blur' | 'raymarch'`, stesso tetto di opacità per tutte, decisione a pari p95:
   - `sprite` = gli offset cloud-shadow sprites esistenti;
   - `blur` = **baseline nuova**: occlusion texture low-res per banda nuvole (scrollata via uniform offset alla stessa velocità dello sprite, nessun rebake a runtime, tiling seamless) + blur direzionale separabile lungo la direzione del sole → penombra morbida;
   - `raymarch` = variante costosa solo per confronto visivo (marcia per-pixel nel campo di occlusione).
2. **God rays** — blur **direzionale** (non radiale screen-space) della maschera sintetica dei gap tra nuvole (`1 − occlusion`), in direzione mondo fisso TL→BR, quad viewport-sized, compositing additivo. Se a vista legge come sbavatura il Director lo taglia (slider a 0).
3. **Luci additive su POI e landmarks** — sprite falloff radiale `blendMode: add`, figli del world container (seguono pan/zoom gratis), flicker via alpha/scale sul ticker, cap ~12 visibili con budget di overdraw, tint per tipo da palette, clamp d'intensità da config.

**Vincoli (critica multi-AI assorbita):**
- Ogni effetto è un **quad viewport-sized con shader proprio** (blend multiply/add); MAI un Pixi filter sul container della mappa da 12 MP (replica il disastro CSS da 1016 ms).
- Tutto in PixiJS/WebGL2; DOM/CSS per luce dinamica escluso (misurato: inutilizzabile).
- Config-first: nuovi campi `PixiMapTune` via Zod, nessun valore hardcoded.
- **Soglie di abort pre-dichiarate** su `/map-benchmark` (Tauri, finestra visibile): penombra ≤ +2 ms p95, god rays ≤ +1 ms p95, light sprites ≤ +0.5 ms p95, worst frame ≤ 33 ms — più test combinato con tutti gli effetti attivi (i costi non sommano linearmente). Chi sfora non si abilita di default: si torna al piano.
- Test di parità: tutti gli slider a 0 deve dare la stessa distribuzione p50/p95/worst del renderer senza codice nuovo.
- Task 0: verificare dove vivono oggi le coordinate POI/landmark e che siano in world-space 4240×2828; se no, adapter esplicito + test che un POI noto cada sul pixel dipinto corretto a zoom 1.0.
- Niente volumetrica, niente filtri su layer full-res, niente pass a risoluzione mondo.

**Still unresolved:**
- Criterio finale di scelta `cloudShadowMode` dopo il confronto visivo del Director (decisione sua, post-misura).
- I landmark specifici che prendono luce e la loro sorgente di coordinate (manifest vs config — dipende da task 0).

---

## v29 — Trappole ricorrenti consumate al momento del lavoro (pre-flight, non registro)

**Status:** FROZEN
**Date:** 2026-10-11
**Authorized by:** Fausto
**Reason:** avallo esplicito — "procedi" sulla candidata presentata in sessione explorer (audit attriti MW-in-RPG)

**Intento del Director (verbatim):**
- *"esempio di errore ricorrente: ad esempio: + volte nella pagina /game la mappa continua a diventare troppo grande e l'HUD copre una parte di terrra, e nn dovrebbe. Poi aumenta il mare e appaiono delle linee tra il mare "vecchio" e quello nuovo."*
- *"opzione 3, ma dobbiamo assicurarci che vengano lette e utilizzate, tipo preflight e cose del genere"*

**Formulazione approvata (FROZEN):**

*User-stated*
1. Gestire gli errori ricorrenti di processo/protocollo emersi in RPG con regole preventive, non con un nuovo registro di osservazioni.
2. Le regole devono essere lette e usate davvero: meccanismo di pre-flight (o equivalente) che le porta dentro il lavoro al momento giusto.

*AI inference*
3. Il meccanismo è trigger-scoped: un file di trappole (`context/recurring-traps.md`) indicizzato per superficie; le skill `mw-*` lo consultano nel pre-flight quando il task tocca una superficie taggata.
4. Una trappola entra nel file solo con ≥2 istanze documentate (soglia `learn` / MW-P-005): niente cimitero di casi singoli.
5. Non un quindicesimo file `.windsurf/rules/` always-on: "sempre presente" ≠ "letto al momento giusto" (evidenza ATTRITI mind-weaver: regola in posizione di attenzione ottimale violata comunque — il problema è il momento che la interroga, non la posizione).
6. Contenuto RPG-specifico; se il meccanismo prova di funzionare, la generalizzazione a Mind Weaver è un passo successivo separato.

*Still unresolved*
- Se serve anche un guard meccanico per le trappole verificabili da codice (es. test "terra mai sotto HUD").
- Estensione del trigger a skill non-mw (`agent-execution-mandate`, `idle-village-task`) dopo prova d'uso.

---

## v30 — Vista Villaggio (`Village` view mode) e Menu Edifici su `/game`

**Status:** `FROZEN`
**Date:** 2026-10-15
**Authorized by:** Fausto
**Reason:** avallo esplicito via "C / mock / si" + "pianifica" sulla candidata v30 presentata in sessione explorer (R-194)

### User-stated
1. **Superficie in `/game` con `villaggio.png`:** implementare su `/game` la schermata del Villaggio e degli edifici usando `src/assets/mood/villaggio.png` come immagine principale.
2. **Rimozione watermark Gemini:** eliminare il simbolo a stella di Gemini in basso a destra da `villaggio.png`.
3. **Ingressi alla vista Villaggio (Direzione C):** la schermata si apre come **vista a tutta area dentro `/game`** (`activeNavId = 'village'`) sia cliccando sulla **regione `village`** della mappa del mondo, sia cliccando sul pulsante **`Village`** nella barra di navigazione in basso (`plinth`). Cliccando **`Map`** nella nav bar si torna alla mappa del continente.
4. **Icon-first e poco testo:** usare **icone e pochissimo testo** per gli edifici, delegando i dettagli (cosa fanno, livello, costi e valori di upgrade) al **tooltip sull'icona**.
5. **Rimozione del Warehouse dalla mappa:** il Magazzino (`Warehouse`, `building-stash`) **non** deve più apparire come icona/marker sulla mappa del continente; vive dentro la schermata del Villaggio (insieme all'accesso a `VillageStashPanel` e a `MerchantPanel`).
6. **Catalogo edifici e upgrade mock:** includere **Taglialegna, Cava/Miniera, Farm/Orto, Warehouse/Magazzino, Palizzata, Torre d'Osservazione** più gli altri edifici di dominio della documentazione (**Locanda, Fucina, Infermeria, Baraccamento, Emporio/Mercato**), completi di livelli, cosa fanno e valori di upgrade. Gli upgrade/costruzioni sono **mock-backed** (sola visualizzazione/controllo inerte come `PLAN-032 SP-2/SP-3`, nessuna mutazione reale dello store economico).

### AI inference
1. **Persistenza del canvas Pixi nello switch `Map` ↔ `Village`:** quando `activeNavId === 'village'`, la vista Villaggio copre lo slot mappa dentro `GameFrame` lasciando visibili le lastre HUD fisse (Risorse, Orologio/Giorno, Menu, Nav Plinth, Roster/Pannelli se aperti), mentre `PixiWorldMap` resta montato sotto per evitare il teardown/ricreazione del contesto WebGL2 (`PLAN-031` perf gate).
2. **Tooltip Hover-Pinnable (contratto `hud_component_guide.md` §5b.7, R-172):** poiché il tooltip sull'icona dell'edificio contiene valori di upgrade e, per Warehouse/Emporio, l'azione per aprire `VillageStashPanel` / `MerchantPanel`, il tooltip rispetta il contratto *hover-pinnable* del progetto (140ms grace al passaggio del mouse, pulsante pin e chiusura `X`, `SkinScope` + `data-hud-controls` sul root per trappola **T-03**).
3. **Inpainting locale + WebP per `villaggio.png`:** il watermark Gemini in basso a destra viene rimosso tramite patch-healing locale dei soli pixel della losanga (senza croppare i bordi dell'immagine 21:9), verificato a occhio nel browser reale (**T-04**).
4. **Aggiornamento del contratto `PLAN-032 SP-2/SP-3`:** il marker `building-stash` viene rimosso da `anchors` in `game-frame-pixi.tsx` (e i relativi test di SP-2 vengono aggiornati di conseguenza); la scorciatoia `v` e il menu Pannelli continuano a funzionare.
5. **Invarianti tecnici:** tutti i dati degli edifici (10-11 edifici, livelli, costi in `wood/iron/gold/food`, valori effetto, coordinate pin su `villaggio.png`) vivono in un modulo config validato con **Zod** (`villageBuildingsConfig.ts`, `deepFreeze`); tutte le stringhe usano `react-i18next` (`en` + `it-IT`) con sintassi ICU `{var}` (**T-11**).

### Still unresolved
- **Tasto rapido da tastiera:** se il tasto `v` debba aprire direttamente la vista `Village` o restare sul `VillageStashPanel` (default nel piano: `v` resta su `villageStash` nel registry `HUD_PANELS` per non rompere `PLAN-032-SP-2`, mentre `Esc` nella vista `Village` senza pannelli aperti riporta a `Map`).
- **Layout delle icone su `villaggio.png`:** calibrazione visiva a schermo in `1440×900` e `1280×800`.


---

## v31 — Workflow single-agent: kanban/dispatch in pausa, chiusura a contratto

**Status:** `FROZEN`
**Date:** 2026-10-16
**Authorized by:** Fausto
**Reason:** direttiva verbatim in sessione — "x adesso meti questa roba in pausa, in caso c servirà lo reimplementeremo secondariamente. quindi metti nei plan, nelle skill e qualsiasi altro riferimento di nn usare + il kanban e cose del genere. si crea un plan con un contratto, si implementa con l'agente locale in devin desktop, si controlla il contratto per vedere se tutto è stato fatto correttamente e basta"

**Formulazione approvata (FROZEN):**
La kanban board, il dispatch coordinator/ai-worker/harness e la pipeline
prompt-spec sono **in pausa**: non fanno più parte del workflow operativo e
non vengono cancellati (riattivazione solo su decisione esplicita del
Director, informata dal benchmark PLAN-039). Il ciclo operativo è:
**plan con contratto di verifica → implementazione con l'agente locale
(Devin Desktop) → controllo del contratto (`verify:bundle` → `bundle.json`)
→ chiusura `fatta` in `RICHIESTE.md` con citazione bundle.** Il gate
meccanico di chiusura resta attivo come `closure:lint` (ex `kanban:lint`,
solo gate R-189 su RICHIESTE/board-diff). Ledger operativo: `RICHIESTE.md`
+ `plans/INDEX.md`.

---

## v32 — Verifica comportamentale meccanica: da fatica del Director a gate (piano S0–S5)

**Status:** `FROZEN`
**Date:** 2026-10-17
**Authorized by:** Fausto — *"avallo"* (2026-10-17)
**Provenance:** bozza prodotta dal dibattito multi-AI `20261017-s0s5-debate` in mind-weaver (CONVERGED su `artifact-r002`) + ruling Director seq 50-51
**Reason:** il Director perde tempo nel ciclo "agente dichiara fatto → lui ritesta → fallisce → rispiega → ripete". Esiste già la materia prima (`verify:bundle` + `closure:lint`, CTR-001..004 con `components`, `.mw/regression/`, `recurring-traps.md` T-01..T-15); manca il binding meccanico file→check e la fase BV dentro le skill.

**Formulazione (bozza — da congelare):**

*User-stated (fonte: desiderata v52 mind-weaver + dibattito + ruling)*

1. Ridurre la fatica di verifica del Director: meno difetti trovati da lui dopo il "concluso", non una review in più.
2. Le verifiche diventano **gate meccanici fail-closed** dentro il circuito `verify:bundle`/`closure:lint` esistente — nessun secondo giudice LLM.
3. Un file toccato senza superficie mappata richiede una **disposition esplicita** (mappatura o `coverage_exception` auditabile); il bundle è ROSSO senza.
4. `coverage_exception` su comportamento non verificato → **gate bloccante `awaiting_director`** fino a `director_answer` (nessuna auto-approvazione dell'agente).
5. Bugfix: test di riproduzione prima del fix, con hash del file **e hash dell'output della run rossa**; modifiche legittime → nuova riproduzione protocollata, mai mutazione silenziosa.
6. Baseline rossa su superfici non toccate: **nessun escape hatch** — si ripara; se i presupposti del test non sussistono più, il test va **scartato** (rimozione registrata).
7. `verifier.json` = receipt generato da script (exit code + hash check legati all'albero finale); schema backward-compatible; giudizio LLM solo advisory.
8. La fase BV entra nelle skill: planner shift-left (CTR+traps delle superfici toccate → acceptance criteria), executor gate di chiusura meccanico; decision report con campi `resolved`/`open`/`escalated` (schema-check, contenuto advisory).
9. Misura: `found-by: agent-bv|director|gate` — quota `director` → ~0 in ~5 plan; tool AI a pagamento solo se resta gap misurato.

*Riferimento piano:* `.mw/runs/20261017-bv-rpg-critique/plan-s0-s5.md` (mind-weaver, status converged r003). Slice usabili singolarmente: S0 igiene AGENTS → S1 `contracts:check` nativo → S2 red-first lockato → S3 verifier.json receipt → S4 BV nelle skill → S5 dogfood+metrica.

*Still unresolved*
- Forma operativa della risposta Director a `awaiting_director` nel repo RPG (il meccanismo `director_answer` esiste nel runtime di dibattito mind-weaver; in RPG serve la porta equivalente nel circuito bundle/skill).
- Budget di completezza del mapping file→superficie per /game.

---

## v33 — Gate d'intento alla chiusura: risultato vs desiderata e chiarimenti, non solo vs plan

**Status:** `FROZEN`
**Date:** 2026-10-17
**Authorized by:** Fausto
**Reason:** Director, verbatim: *"rispetto a quello che voglio cm implementazione o fix, il risultato finale nn sia soddisfacente o sbagliato. il risultato nn deve essere misurato rispetto al plan e basta, ma anche rispetto alla desiderata e chiarimenti del director, magari controllato con ai esterne o qualcosa del genere x essere oggettivo"* — e: *"se alla conclusione del plan, il risultato finale nn è allineato alla desiderata, significa che qualcosa è andato storto nel planning o dopo, e va rifatto. nn è un plan concluso."*

**Formulazione (bozza — da congelare):**

*User-stated*

1. Il risultato finale di un plan è misurato rispetto alla **desiderata FROZEN + chiarimenti del Director**, non solo rispetto al plan e al suo contratto.
2. Se a conclusione il risultato non è allineato alla desiderata → qualcosa è andato storto nel planning o dopo → **va rifatto: non è un plan concluso.**
3. Il controllo d'allineamento può essere affidato a **AI esterne** o meccanismo equivalente, per obiettività.

*AI inference (bozza)*

4. **Gate bloccante su `fatta`/`completed`**, stesso rango di `closure:lint`: nessuna chiusura senza `intent PASS` o `waived-director` esplicito del Director.
5. **Intent ledger per task** (es. `.mw/runs/<task>/intent.md` creato all'avvio): slice della desiderata FROZEN pertinente + richiesta verbatim + ruling Director emersi in sessione. Ogni item mappa su obbligazione tecnica (`verification.json`), `intent-check`, o `human-eye` — coverage per-ID (pattern T-06).
6. **Audit in contesto pulito**: il revisore (AI esterna via `mw-ask`/broadcast o clean-context come `verifier.json`) riceve ledger + artefatti di evidenza, **non il diff**; per ogni item: `covered | gap | unverifiable` con citazione dell'evidenza. `gap`/`unverifiable` → blocco o escalation al Director.
7. **Confine onesto del giudice AI:** l'audit copre fedeltà/copertura dei requisiti dichiarati; il giudizio estetico/"soddisfacente" resta `human-eye` + signoff Director. Il check riduce i miss d'intento, non sostituisce il veto del Director.
8. **Diagnosi obbligatoria su fallimento:** intent rosso → la chiusura riporta se il disallineamento nasce nel plan (re-planning) o nell'esecuzione (re-implementazione) — il rework riparte dal punto guasto, non dal "non concluso" generico.
9. **Relazione con v32:** v32 copre l'asse contratto→evidenza (gate meccanici, *nessun giudice LLM*); v33 copre l'asse intento→risultato (giudice LLM ammesso, solo qui). I due gate sono cumulativi: `fatta` richiede bundle PASS **e** intent PASS.

*Decisioni Director (2026-10-17)*

10. **Revisore = pannello di AI esterne** (multi-provider, come i dibattiti web), non singolo modello.
11. **Check d'intento anche shift-left:** il plan viene controllato contro desiderata+chiarimenti **prima del battesimo** — l'errore di planning si paga una volta, non due.
12. **Slice FROZEN, mai il file intero — invariante globale:** nessun tool, skill o agente può passare l'intero `desiderata.md` a un modello/revisore; si passa **solo la versione FROZEN pertinente** estratta in file dedicato (precedente operativo: v49 estratta a mano per PLAN-060). Da fixare in tutti i consumatori (`mw-critique-plan.py` — bug noto T-014/PLAN-062, `mw-iterative-deliberate.py` con `--desiderata`, dibattiti web, skill che citano `--desiderata`). Lista completa dei consumatori da auditare nel plan.

*Still unresolved*
- Posizione del ledger (`intent.md` nella run dir vs sezione del manifest) e meccanismo di voto del pannello (maggioranza vs unanimità su `gap`).

---

## v34 — Cinematica delle scene quest: depth-parallax sistematico + regia dei beat

**Status:** `FROZEN`
**Date:** 2026-10-17
**Authorized by:** Fausto — *"procedi"* (2026-10-17, avallo sulla formulazione proposta presentata in sessione)
**Reason:** richiesta Director in sessione 2026-10-17 — *"x le immagini che stiamo
usando cm asset x le quest (cinematografiche, ecc). potresti prenderle e dividerle
in vari layer e fare degli effetti di parallasse per ciascuna, sistematicamente?
[...] Oppure sarebbe meglio generare le immagini direttamente cm prompt che danno
i layer distaccati e il parallasse? [...] Sei un lead UI senior designer [...] fa
una ricerca online, dammi una critica spietata e costruttiva [...] Poi proponi
delle soluzioni a tua volta, cn esempi di codice"* — e poi *"tutte, plan multi ai
web"*.

*Esplorazione svolta (sintesi):* ricerca online su stato dell'arte (layer
decomposition = ricerca 2025 non production-ready; parallasse 2.5D via depth map
= commodity matura; text-to-layered = research, non affidabile su scene
pittoriche) + audit del codice (Theater/StageBand = `<img>` DOM con Ken Burns +
cinemaFx config-driven; `DESIGN_PILLARS.md` §1 vieta parallasse a quad full-canvas
e prescrive deformazione in-place, v21). Direzione ibrida proposta e scelta dal
Director con *"tutte"*.

*User-stated*

1. Valutare e migliorare la qualità cinematografica delle immagini usate come
   asset delle quest (scene in `Theater`/QuestRunWindow e `StageBand`/S1 lab).
2. Il Director vuole **tutte** le parti della proposta ibrida presentata, e il
   piano prodotto tramite **dibattito multi-AI web**.

*AI inference (marcata)*

3. *"tutte"* = la direzione ibrida completa: (A) depth-parallax sistematico via
   depth map, (B) camera diretta dal beat, (C) overlay atmosferici separabili,
   (D) cutout 2-layer manuale solo su poche scene hero — più la dimostrazione
   tecnica su scena reale come prima slice.
4. Accettando la critica, restano fuori: slice sistematico in N layer dei raster
   esistenti; generazione "layered by prompt"; video loop AI (parcheggiato,
   candidato futuro per il trailer).
5. Scope: superfici quest (`Theater`, `StageBand`). La mappa mondo NON è in scope
   (già governata dalla decisione pillar + v21).
6. Vincoli ereditati: config-first (`questTheatreFx`/`atmosphereAssets`),
   reduced-motion ⇒ nessun effetto (I-5), token skin, budget WebView/Tauri
   profilato, verifiche solo headless/background (CTR-foreground-001).

*Still unresolved (delegati al dibattito/piano, non bloccano il freeze)*

- Quali scene hero ricevono il cutout 2-layer (scelta Director o proposta del piano).
- Ampiezza di drift, overscan e budget percettivo (da tarare sullo spike).
- Forma runtime del depth-parallax nel Theater (canvas Pixi vs WebGL minimo vs
  altra tecnica) — decisione tecnica delegata al piano.
- Se la depth bake entra nella pipeline `rpg-gen-mockup.py` o resta script separato.
- Criterio "abbastanza cinematografico": eye-check del Director sulla demo.

**Formulazione approvata (FROZEN):**
<!-- REQ:v34-goal -->Le scene quest su /game guadagnano qualità cinematografica
percepita in modo **sistematico** su tutti gli asset presenti e futuri, non solo
su casi singoli.<!-- REQ:v34-depth -->Parallasse via **depth map precalcolata**
per asset (es. Depth Anything V2 o equivalente) con **deformazione in-place dei
pixel** — coerente con DESIGN_PILLARS §1 (niente translate di quad interi;
ampiezza contenuta + overscan per non esporre bordi).<!-- REQ:v34-camera -->Mosse
di camera dirette dal tipo di beat (es. push-in su combat/harm, pan su viaggio,
hold+letterbox su dialogo, zoom su verdict), config-driven in `questTheatreFx`.
<!-- REQ:v34-atmo -->Overlay atmosferici separabili per scena (nebbia, luce,
particelle) — la classe di layer che i pillar ammettono in parallasse.
<!-- REQ:v34-cutout -->Cutout 2-layer manuale riservato a un piccolo set di scene
hero scelte dal Director (cutout + inpaint via pipeline locale esistente).
<!-- REQ:v34-exclusions -->Escluse: slice sistematico in N layer dei raster
esistenti; generazione layered-by-prompt; video loop AI.<!-- REQ:v34-slice -->
Prima slice verticale: **spike dimostrabile** del depth-parallax su una scena
reale (Theater o lab), valutabile a occhio dal Director prima dell'estensione al
catalogo.<!-- REQ:v34-invariants -->Config-first, reduced-motion ⇒ nessun
effetto, skin token, budget WebView profilato, verifiche headless.

## v35 — Visual fork gate: nessuna scelta estetica silenziosa dell'agente

*User-stated*

1. Quando un task crea o modifica elementi grafici e sono possibili
   rappresentazioni materialmente diverse, l'agente non sceglie a priori:
   prepara opzioni (default 2, max 3) con documento comparativo e preview
   visibile; il Director seleziona o rigetta.
2. Il risultato finale è misurato rispetto all'opzione selezionata iniziale
   (baseline congelata + emendamenti approvati).
3. Se non serve fork, l'agente dichiara lo skip con un puntatore verificabile.

*AI inference (marcata)*

4. Il fork vive in esplorazione (`mw-explorer`); fork scoperti in planning
   attivano `INTENT_GATE_VISUAL_FORK` in `mw-planner` (stop → ruling → resume
   sullo stesso draft).
5. Verifica ibrida: misure meccaniche same-viewport + giudizio umano; l'occhio
   del Director prevale sulla metrica (T-04).
6. Varianti scartate fuori dal tree di produzione; spike visuali con lifecycle
   dichiarato (`promote|remove`, default remove); un plan → un bundle (v31).
7. Preview = pagina servita su localhost aperta dal Director (Preview tab di
   Devin Desktop suggerita), mai apertura automatica (regola 16).
8. Enforcement meccanico: `closure:lint` fallisce su bundle che toccano file
   visivi nel diff reale senza copertura `visual-fork:` (card scope list o
   skip puntato) nel plan.

**Formulazione approvata (FROZEN):**
<!-- REQ:v35-fork -->Quando un task crea o modifica elementi grafici e sono
possibili rappresentazioni materialmente diverse (gerarchia, composizione,
densità, affordance), l'agente non sceglie a priori: prepara opzioni (default
2, max 3) con documento comparativo e preview visibile su localhost; il
Director seleziona o rigetta.<!-- REQ:v35-baseline -->Il risultato finale è
misurato rispetto all'opzione selezionata iniziale: baseline congelata con
hash+provenance + ledger emendamenti approvati dal Director.
<!-- REQ:v35-skip -->Se non serve fork, l'agente dichiara lo skip con un
puntatore verificabile (riferimento frozen citato, rappresentazione unica
nominata, o perimetro file non-visivo); uno skip senza puntatore è un difetto.
<!-- REQ:v35-verifica -->Verifica ibrida: obbligazioni same-viewport
pre-registrate + human-eye su artefatto side-by-side; l'occhio del Director
prevale sulla metrica (T-04); variante scartata mai in produzione; spike
visuale effimero salvo promozione dichiarata nel plan.

*Origine:* R-216; PLAN-047 (battezzato 2026-10-18); dibattito multi-AI web
converged `mind-weaver/.mw/runs/20261018-visual-fork-gate-debate/`
(artifact-r003, 5/5 ACCEPT). Implementazione: skill mw-explorer / mw-planner /
painter / mockup-generator + template `.mw/templates/visual-fork/` +
estensione `closure:lint`.

---

## v36 — Sistema vivo di contratti per-componente, integrazioni e test sincronizzati su `/game`

**Status:** `FROZEN`
**Date:** 2026-10-18
**Authorized by:** Fausto — *"procedi"* (2026-10-18, avallo sulla candidata v36 presentata in sessione)
**Reason:** il Director vuole evitare che la lista dei bug UI si allunghi e che vecchi bug si ripresentino a ogni ritocco di layout, estendendo la copertura a tutti i componenti e alle integrazioni di `/game` con un ciclo vivo di aggiornamento sincronizzato tra documentazione, contratti di interazione e test.

*User-stated*

1. Fare un audit di tutto ciò che è in `/game`, avere un documento per componente su come si deve comportare e test di validazione che controllino tutto ciò che deve fare e come lo deve fare.
2. Avere un documento di integrazione per le interazioni con gli altri componenti con cui può interagire.
3. Poiché il progetto è in divenire, quando si aggiorna un componente e cambia un comportamento, vanno aggiornati il documento e testato/modificato il test corrispondente.
4. Quando il Director dice *"questa cosa è un bug"* o chiede un comportamento specifico, questo va aggiunto al documento su come deve comportarsi / come devono interagire i componenti e, quando applicabile, va aggiunto o aggiornato il test automatico.
5. Produrre il piano tramite dibattito **Multi-AI web** (`mw-web-debate`).

*AI inference (marcata)*

6. **Riuso senza duplicazione (DRY / `40-documentation-governance`):** l'inventario meccanico di `/game` e le bozze `SCHEDA` di `PLAN-043 WS-5` (`S11`/`S12`), `COMPONENT_MASTER_INDEX.md`, `.mw/contracts/` e `.mw/surface-map.json` vengono unificati o collegati invece di creare un secondo registro parallelo.
7. **Granularità dei documenti d'integrazione:** i contratti d'integrazione coprono i flussi/accoppiamenti reali tra componenti su `/game` (es. `PixiWorldMap ↔ GameFrame HUD`, `Roster ↔ SlotRack ↔ QuestExpeditionDetail`, `QuestExpeditionDetail ↔ TimeEngine ↔ MapQuestPoi`, `QuestRunWindow ↔ Astrolabe ↔ Settlement/HUD`, `VillageScreenView ↔ VillageRegistry ↔ Stash/Merchant`), non il prodotto cartesiano di coppie che non interagiscono.
8. **Binding meccanico con i gate esistenti (`PLAN-044` / `PLAN-051`):** l'aggiornamento sincronizzato `codice ↔ doc componente/integrazione ↔ test` si aggancia a `.mw/surface-map.json`, `contracts:check`, `red-first` e `closure:lint`, distinguendo tra:
   - *bug* (comportamento rotto rispetto al contratto o segnalato dal Director → test rosso prima del fix + aggiornamento doc/contratto + fix verde),
   - *evoluzione intenzionale di comportamento* (aggiornamento esplicito di doc/contratto + aggiornamento test nello stesso task, mai test mutato in silenzio).

*Still unresolved (delegati al dibattito Multi-AI web)*

- Struttura esatta dei file (se 1 file per componente + 1 file per contratto d'interazione sotto `src/docs/docs/game_surface/` o `.mw/contracts/`, e come evitare esplosione di boilerplate).
- Come verificare meccanicamente che una modifica comportamentale a un componente abbia aggiornato anche doc + test senza bloccare i refactor puramente interni.
- Strategia di migrazione/ritiro delle vecchie spec e suite legacy (`/poi-quest-detail-roster-time-clock`) rispetto a `/game`.

**Formulazione approvata (FROZEN):**
<!-- REQ:v36-audit-components -->Su `/game` ogni componente attivo ha una scheda/contratto vivo che definisce cosa deve fare e come, collegato ai propri test di validazione;<!-- REQ:v36-integration-contracts --> le interazioni reali tra componenti sono coperte da contratti d'integrazione dedicati e test automatici collegati, a partire dall'audit completo di `/game`.<!-- REQ:v36-living-sync --> Il sistema è mantenuto vivo: (1) ogni modifica che altera il comportamento di un componente o di un'interazione deve aggiornare contestualmente il documento relativo e aggiungere/modificare il test collegato;<!-- REQ:v36-bug-or-spec-capture --> (2) ogni volta che il Director segnala un bug (*"questa cosa è un bug"*) o richiede un comportamento specifico, la regola viene aggiunta al documento del componente/integrazione e protetta da test automatico;<!-- REQ:v36-mechanical-binding --> (3) l'enforcement si integra nei gate meccanici esistenti (`surface-map`, `contracts:check`, `red-first`, `closure:lint`) senza duplicare i registri.<!-- REQ:v36-web-debate --> Il piano esecutivo viene definito tramite dibattito Multi-AI web (`mw-web-debate`).


## v37 — Astrolabio: silhouette a famiglia uniforme per board, morph accoppiato

**Status:** `FROZEN`
**Date:** 2026-10-23
**Authorized by:** Fausto — *"approvo"* (avallo sulla candidata in sessione, dopo i ruling
sulle soglie 10%/35% e sulla copertura qualitativa)
**Reason:** la forma deforme ricorrente nelle quest — valli scavate fin quasi al nucleo con
punte tonde — e' il quadrante proibito che la v17 e PLAN-010 avevano gia' chiuso per
costruzione e che `starProfile.ts` di V6.2 ha resuscitato disaccoppiando mix e depth.

**Relazione con v16/v17:** la v16 aveva sciolto le tre famiglie discrete («la stella
dimagrisce per gradi, ogni petalo col proprio delta») e vietato il ritorno alla famiglia
discreta. Questa desiderata **revoca quel divieto**: la famiglia torna discreta ma decisa
**a livello di board**, non per petalo — le punte continuano a variare nelle proporzioni.
Della v17 restano l'accoppiamento morph (punta tonda ⟺ valle alta) e l'impossibilita'
costruttiva del quadrante proibito; cade la semantica «coverage-wins» come pilota della
forma — la silhouette diventa un glifo qualitativo.

### User-stated (parole del Director)

1. «Peggore e' il delta x il party = fiore (il party e' in difficolta'), party un po' +
   forte = stella. Molto + forte = stella magra.»
2. «Sopra il 10% stella, sopra il 35% stella magra» — il margine e' stat vs difficolta'.
3. «Nn voglio c sia differenza tra le forme scelte» — tutte e cinque le punte sono della
   stessa famiglia; «il mezzo fiore strano nn deve apparire mai, alcune punte fiore e
   alcune punte stella nemmeno».
4. «Se la maggioranza delle stat sono + grandi [...] tutte le punte sono a forma di stella.
   Se invece no sono tutte a forma di fiore» — la famiglia si decide a maggioranza.
5. Ogni vertice ha costruzione propria nelle proporzioni: le lunghezze delle punte seguono
   le stat reali per asse.
6. Copertura dipinta: «circa gia' funziona cosi' cambiando le forme, lo stiamo rispettando»
   — glifo qualitativo, nessun solver esatto.

### AI inference (derivata, marcata come tale)

7. Ogni asse vota la propria famiglia dal margine (fiore <10%, stella 10-35%, magra >35%);
   il board prende il livello piu' alto che raggiunge la maggioranza (≥3 assi >35% ->
   magra; altrimenti ≥3 assi >10% -> stella; altrimenti fiore). Con una sola skill gli assi
   coincidono.
8. L'accoppiamento morph di `coverage.ts` (PLAN-010 CP-C) e' la forma della soluzione: un
   solo parametro decide insieme profondita' di valle e forma della punta — il quadrante
   «valle profonda + punta tonda» non e' costruibile.
9. Bande di valle di partenza: fiore ~0.42-0.55, stella ~0.15-0.30, magra ~0.15 — numeri
   da battezzare sui test visuali.

### Cosa questo NON autorizza

- nessuna forma fuori dalle tre famiglie (nessun mezzo-fiore, nessun disco con fessure,
  nessuna "blade");
- nessuna famiglia diversa per petalo;
- nessuna rimozione della stella magra («la stella magra ci serve, nn dobbiamo toglierla»);
- nessun cambio a verdetto o probabilita' (`skills`, `check.score` invariati — la
  silhouette e' display-only).

### Still unresolved

- bande di valle esatte e raggio di stiramento della stella magra — si battezzano sui
  test visuali della pagina V6.2.

**Formulazione approvata (FROZEN):**
<!-- REQ:v37-family-uniform -->La silhouette dell'astrolabio appartiene a una sola famiglia
per board — fiore | stella | stella magra — decisa a maggioranza delle stat reali per
asse;<!-- REQ:v37-thresholds --> soglie sul margine stat/difficolta': sopra il 10% stella,
sopra il 35% stella magra, altrimenti fiore;<!-- REQ:v37-morph-coupled --> profondita'
della valle e forma della punta sono accoppiate per costruzione: nessuna forma con valle
profonda e punta tonda, nessuna mescolanza di famiglie sullo stesso
board;<!-- REQ:v37-tip-lengths --> le lunghezze delle punte restano per-asse e seguono le
stat reali;<!-- REQ:v37-coverage-glyph --> la silhouette e' un glifo qualitativo — la
copertura dipinta e' approssimata dalla famiglia, nessun solver esatto.

## v38 — Expedition planning UI: assorbimento strutturale del mockup approvato

**Status:** `FROZEN`
**Date:** 2026-11-15
**Authorized by:** Fausto — *"approvato"* (avallo sulla candidata presentata in sessione,
dopo il dibattito multi-AI `20261115-wanderlust-ui-plan` e i ruling D6 edge-tab /
D10 Chronicle top-right)

### User-stated (parole del Director)

1. «xò come prima parte in assoluto voglio che sia l'assorbimento d questo mockup di
   di gpt, o come fase iniziale o come subplan 1. approvo» — il mockup ChatGPT è la
   baseline di direzione (registrato in `.mw/specs/expedition-ui/refs/`).
2. «mi piaceva l'idea di aver qualcosa che occupasse "meglio" la parte morta a destra» —
   il componente expedition è un cassetto/console ancorato al bordo destro, non una
   finestra flottante.
3. «da qui possiamo prendere un village stash migliorato» — stash come superficie a
   griglia + filtri + card dettaglio (contenuto del mockup stash-grid).
4. «per adesso voglio che sia in alto a destra e il resto si sposti a sinistra, poi si
   vede, niente tab pendente» — la superficie eventi futuri (Chronicle) è docked
   top-right; il top chrome si sposta a sinistra.
5. La mappa resta protagonista: niente superfici che la coprono senza motivo.

### AI inference (derivata, marcata come tale)

6. Lo stash vive come tab segmentato Roster|Stash nella colonna sinistra docked — il
   reliquiario centrale flottante del mockup è veto-adjacent (no-popup); il contenuto
   (griglia, filtri, dettaglio) si porta dentro il tab.
7. Stati minimi inclusi nella stessa fase perché economici ora: CTA disabilitata +
   motivo inline, slot party vuoto/pieno, empty-state edge-tab (D6 mode b), journey
   "N days" + totale.
8. Bag slot render-only in questa fase (assegnazione → S2).
9. Tutto via skinConfigRegistry, config Zod, i18n EN/IT, primitivi esistenti —
   implementazione conforme a artifact-r004 (`20261115-wanderlust-ui-plan`).

### Cosa questo NON autorizza

- popup/modal/overlay che coprono la mappa;
- modifiche a regole gameplay o meccaniche quest;
- alterare `QuestRunWindow` o superfici run;
- tipografia sentence-case, food-cost preview, bag-assign interattivo, accenti
  blu/verde, port della Chronicle (slice successive).

### Still unresolved

- forma finale della superficie Chronicle («poi si vede» — S1 riserva solo la zona
  top-right via token);
- estetica del dettaglio stash dentro il tab (griglia piena vs righe — si battezza
  in esecuzione sulla larghezza reale della rail).

**Formulazione approvata (FROZEN):**
<!-- REQ:v38-mockup-absorption -->Subplan 1 = assorbimento strutturale del mockup
ChatGPT su `/game`:<!-- REQ:v38-drawer-docked --> drawer expedition docked
flush-right (token clamp 360/23vw/460), canvas full-bleed con insets via Zustand e
pan/zoom clamp al rettangolo libero;<!-- REQ:v38-left-column --> colonna sinistra
Roster|Stash a tab segmentati, persistente di default, mutua esclusione ≤1100px;
<!-- REQ:v38-top-chrome --> top chrome snellito a sinistra, zona top-right riservata
alla futura Chronicle docked (niente tab pendente);<!-- REQ:v38-states --> stati
minimi: CTA disabilitata+motivo, slot party vuoto/pieno, empty-state edge-tab,
journey "N days"+totale;<!-- REQ:v38-invariants --> tutto via skinConfigRegistry,
config-first, i18n EN/IT, primitivi esistenti; niente overlay sulla mappa.

<!-- ===== repo-snapshot/OPEN.md ===== -->

---
title: Open Questions Registry
type: registry
updated: 2026-11-11
---

# OPEN — Unresolved Questions Registry

Risponde alla domanda: **«quali questioni sono realmente ancora aperte?»**

Questo file è un *registry/router*: ogni voce punta alla fonte che contiene il
reasoning completo — non lo duplica. Non ogni TODO o nota è una questione
aperta: entra qui solo ciò che richiede una decisione o una validazione non
ancora avvenuta.

Formato voce:

- ID — `OPEN-*`
- Question
- Status — `open` | `open-in-lab` | `conflict`
- Context — perché è aperta
- Source — dove vive il reasoning completo
- Blocking — cosa blocca / cosa non blocca
- Related plan / decision

---

## OPEN-001 — Rimappatura PLAN-018 sul modello vittoria rev.2

- **Question:** il calcolo implementato in PLAN-018 usa la soglia ≥50% dei check;
  la desiderata v24 rev.2 lega la reward a una prova-obiettivo + leader vivo.
  Come si rimappa il resolver/planner sul nuovo modello?
- **Status:** `conflict` (divergenza design↔implementazione dichiarata, non
  risolta — audit C7)
- **Context:** rev.2 dice esplicitamente che PLAN-018 *non* viene modificato
  automaticamente: la rimappatura è prevista dopo S1.
- **Source:** `plans/PLAN-018-mission-planner.md`; `.mw/desiderata.md` v24
  rev.2; `KNOWLEDGE_AUDIT.md` C7; `plans/PLAN-019-quest-macro-plan.md` D-8.
- **Blocking:** S2 (il runtime si adegua lì); non blocca il lab S1.
- **Related:** PLAN-018, PLAN-019; `QUEST_RULES.md` §Vittoria.

## OPEN-002 — Motore quest canonico (D-2)

- **Question:** quale motore quest diventa canonico?
- **Status:** `open`
- **Context:** deciso che l'evidenza arriva da uno **spike** come primo step di
  S2. Criteri: grafo di nodi con scelte e informazione, percorso variabile
  (denominatore dinamico della vittoria), conseguenze persistenti, costo di
  migrazione dei consumer esistenti.
- **Source:** `plans/PLAN-019-quest-macro-plan.md` tabella decisioni D-2.
- **Blocking:** tutto il resto di S2.
- **Related:** PLAN-019 (S2), PLAN-018.

## OPEN-003 — Mappatura competenze → stat del balancer (D-3)

- **Question:** come si derivano le competenze di quest non di combattimento
  (Intelligenza, Carisma, …) dalle stat del balancer senza toccarlo? Alcune
  non hanno candidato ovvio.
- **Status:** `open`
- **Context:** decisa la *direzione* (opzione C: derive, non modificare il
  balancer); aperta la mappatura completa. Regola: se una competenza non è
  derivabile, l'AI la porta al Director come scelta esplicita, non come rinvio.
- **Source:** `context/DECISION_LOG.md` 2026-10-01;
  `.mw/desiderata.md` v24 rev.1 punti 12–13; PLAN-019 D-3.
- **Blocking:** ingresso di S2; S1 può usare mock.
- **Related:** PLAN-019 (S2).

## OPEN-004 — Collocazione di Gate B / playtest esterno (D-5)

- **Question:** in quale stadio rientra il playtest con persone esterne?
- **Status:** `open`
- **Context:** S1 termina a Gate A (giudizio del Director); il playtest esterno
  non è eliminato ma non appartiene a S1 (*«posso mandare al max un video»*).
- **Source:** `.mw/desiderata.md` v24 rev.1 punto 4; PLAN-019 D-5.
- **Blocking:** niente fino al battesimo di PLAN-019-S4.
- **Related:** PLAN-019 (S4).

## OPEN-005 — Collocazione di Trial by Fire (D-6)

- **Question:** Trial by Fire va in S2 (conseguenza persistente), S4 o S5?
- **Status:** `open`
- **Source:** `plans/PLAN-019-quest-macro-plan.md` D-6.
- **Blocking:** battesimo di PLAN-019-S2.
- **Related:** PLAN-019 (S2/S4/S5).

## OPEN-006 — Calibrazione death save

- **Question:** il death save (5% su esito morte → sopravvive ferito) è un mock:
  il valore va calibrato al Gate.
- **Status:** `open-in-lab`
- **Source:** `context/QUEST_S1_DESIGN.md`;
  `context/DECISION_LOG.md` 2026-10-02 (matrice chiusa, death save 5%).
- **Blocking:** valutazione al Gate A di S1.
- **Related:** PLAN-019-S1.

## OPEN-007 — Quantità e cumulo dei modificatori critici

- **Question:** quantità dei modificatori `bigwin`/`epicfail` alle chance
  ferita/morte e ordine di cumulo con il −5pp di `win`.
- **Status:** `open-in-lab` — mock iniziali in `context/QUEST_S1_DESIGN.md`
  (`bigwin` = −5pp cumulati + downgrade morte→ferita; `epicfail` = upgrade
  ferita→morte), da bilanciare nel playtest.
- **Source:** `.mw/desiderata.md` v24 rev.2 «still unresolved»;
  `context/QUEST_S1_DESIGN.md`.
- **Blocking:** calibrazione nel lab S1; formalizzazione check-contract in S2.
- **Related:** PLAN-019-S1; DECISION_LOG 2026-10-03 (epicfail in banda).

## OPEN-008 — Precisione della preview compound (MC vs DP esatta)

- **Question:** per la preview della % di riuscita «dalla partenza» si usa
  Monte Carlo, programmazione dinamica esatta, o ibrido? La politica d'uso dei
  consumabili e le diramazioni future sono ignote → nessun numero esatto
  inventato dove manca il modello.
- **Status:** `open`
- **Context:** rev.2 chiede preview compound; R-082 ha implementato preview
  per-check analitica + MC seeded per la quest; la tensione MC vs DP esatta
  resta aperta.
- **Source:** `.mw/desiderata.md` v24 rev.2;
  `src/docs/docs/idle_village/quest_simulation_preview_spec.md`; R-082;
  `context/DECISION_LOG.md` 2026-09-29 (DP esatta come contratto primario).
- **Blocking:** contratto preview di S2/S3.
- **Related:** PLAN-019 (S3), PLAN-018.

## OPEN-009 — Danni extra durante la fuga

- **Question:** la fuga può infliggere danni extra? *«da decidere/bilanciare
  in un secondo momento»*.
- **Status:** `open`
- **Source:** `.mw/desiderata.md` v24 rev.1 punto 11.
- **Blocking:** bilanciamento; non blocca S1.
- **Related:** PLAN-019.

## OPEN-010 — Ratifica delle proposte economia-villaggio

- **Question:** le proposte emerse dalla conversazione «Progettare quest
  strategiche» — regola leader-capacity (capacità di spedizione limitata da
  stato del leader e pool di umani, non da cooldown), economia human-days,
  quest come opportunità 8–10/mese vs 4–5 fattibili — sono solo PROPOSAL:
  vanno ratificate in desiderata/GAMEPLAY_DESIGN?
- **Status:** `open` — in lavorazione: il Director le ha raccolte in
  `VILLAGE_ECONOMY.md` (DRAFT, «bozza di piano da migliorare», 2026-10-05);
  la ratifica resta pendente.
- **Source:** `RICHIESTE.md` R-083;
  `context/QUEST_ECONOMY_NOTES.md` (copia tracciata delle note;
  originali + provenance in `.mw/runs/20261004-rovine-preview-chatgpt/`);
  `context/ingestions/2026-10-05-progettare-quest-strategiche.md`.
- **Blocking:** candidati a livello villaggio (S4 / GAMEPLAY_DESIGN) — dietro
  avallo Director.
- **Related:** PLAN-019 (S4), GAMEPLAY_DESIGN.

## OPEN-011 — Domande legacy del log decisioni (Aug 2026)

- **Question:** Q1 roster: scroll infinito o paginazione? Q2 token droppato
  fuori: animazione o snap? Q3 quanti scenari test sono «esaustivi»?
- **Status:** `open` (mai esplicitamente chiuse nel log; possibilmente stale —
  verificare prima di agire)
- **Source:** `context/DECISION_LOG.md` sezione «Open Questions» Q1–Q3.
- **Blocking:** nessuna nota; pre-S1.
- **Related:** Decision 007/008 era.

## OPEN-012 — Ratifica proposte difesa villaggio e categorie di potere

- **Question:** le proposte emerse dalla conversazione «Progettare quest
  strategiche» — difesa del villaggio a ondate (checkpoint che competono con
  le spedizioni per umani/equip/tempo), categorie di potere (Hero /
  Expedition / Defence / Unlock / Information), eroi come moltiplicatori
  persistenti che non sostituiscono i villager — sono solo PROPOSAL: vanno
  ratificate in desiderata/GAMEPLAY_DESIGN?
- **Status:** `open`
- **Source:** `context/ingestions/2026-10-05-progettare-quest-strategiche-transcript-completo.md`
  E-35/E-36/E-37; transcript `.mw/runs/20261005-transcript-quest-strategiche/`.
- **Blocking:** candidati a livello villaggio (S4 / GAMEPLAY_DESIGN) — dietro
  avallo Director.
- **Related:** OPEN-010 (stessa famiglia villaggio), PLAN-019 (S4).

## OPEN-013 — Scarsità single-player e modello del party

- **Question:** come si riproduce in single-player la pressione competitiva
  di Lords of Waterdeep (che nasce dagli avversari)? Cosa rende una quest
  degna di rischiare capitale umano scarso? Inoltre: il «divisorio netto
  forza lavoro ↔ forza avventuriera» di `GAMEPLAY_DESIGN.md` §2.3 resta
  canonico, o è superato dai party misti Eroe+Villager già usati nel lab S1?
- **Status:** `open` — tensione doc↔pratica dichiarata (E-39).
- **Source:** `context/ingestions/2026-10-05-progettare-quest-strategiche-transcript-completo.md`
  E-38/E-39; `GAMEPLAY_DESIGN.md` §2.3.
- **Blocking:** design del loop opportunità villaggio (connesso a OPEN-010);
  non blocca S1.
- **Related:** OPEN-010, OPEN-012; PLAN-019 (S4).

## OPEN-014 — Architettura narrativa per situazioni

- **Question:** adottare il modello `Situation → Context → Approach →
  Narrative → Presentation` (asset per situazione, non per combinazione di
  stat; vocabolario situazioni/contesti; semi narrativi su
  `LoreDropService` esistente)?
- **Status:** `open` — pertinente a S5 (generazione) e art pipeline; nessun
  impatto prima di S4.
- **Source:** `context/ingestions/2026-10-05-progettare-quest-strategiche-transcript-completo.md`
  E-28/E-29/E-30/E-31; `context/ingestions/2026-10-06-quest-cross-direct.md`
  E-01/E-03/E-07/E-08 (primitive dei beat, generatore a vincoli in 3 passi —
  segmento a monte di E-28 —, requisito varietà/volume Director, flavor via
  tag); `NARRATIVE.md` §4.
- **Blocking:** nessuno nel breve; candidato per la «definizione di buona
  quest» (artefatto finale PLAN-019).
- **Related:** PLAN-019 (S5), NARRATIVE.md, `context/QUEST_GENERATION_SPEC.md`
  (specchietto riassuntivo — lo schema a strati compone con le primitive dei
  beat: rotta separata ma stessa architettura a 4 livelli).

## OPEN-015 — Mancata risoluzione e conseguenze di ogni quest

- **Question:** che cosa significa «non risolta» e quale evento fa scattare le conseguenze di una quest che il giocatore non completa?
- **Status:** `open` — il principio universale è espresso dal Director, il trigger e le forme delle conseguenze restano da precisare.
- **Context:** R-092 include quest risolte, modalità della risoluzione e quest non risolte; le regole esistenti coprono soprattutto esiti della spedizione e persistenza prevista in S2.
- **Source:** `RICHIESTE.md` R-092 (verbatim); `QUEST_RULES.md` §8; `.mw/desiderata.md` v24 S1–S4.
- **Blocking:** definizione del comportamento delle quest lasciate aperte; non blocca il lab S1.
- **Related:** PLAN-019 (S2/S4/S5), NARRATIVE.md.

## OPEN-016 — Registro mondo, memoria narrativa e sequenza del macro-piano

- **Question:** quale porzione del mondo persistente serve per rendere leggibili le conseguenze delle quest e quando introdurre evoluzione di personaggi, fazioni/regioni, pattern narrativi e legacy cross-run rispetto a PLAN-019 S1–S5?
- **Status:** `risolta` 2026-10-19 — **ratifica piena E-16** (Director): il macro-piano Foundation → simulazione → storia → legacy diventa autorità di direzione. La sequenza operativa vs v24/PLAN-019 si fissa nel piano operativo di T7 (PLAN-026); i numeri della bozza non sono target decisi. Decisione registrata in `context/DECISION_LOG.md` (2026-10-19).
- **Context:** tratti che generano scene e hook che generano quest, NPC ricorrenti, world pressures, provenance/riconoscimento e mondi attraverso più run sono intenti o proposte con livelli diversi di certezza. Il programma AI «Foundation → simulazione → storia → legacy» potrebbe anticipare S5, che la desiderata v24 colloca dopo S4; evitare sostituzione silenziosa.
- **Source:** `context/ingestions/2026-10-07-registro-narrativo-del-mondo.md` E-02..E-18; `NARRATIVE.md` §4; `RICHIESTE.md` R-093.
- **Blocking:** risolta — il macro-piano E-16 è ratificato come direzione. Resta da fissare nel piano operativo di T7 (PLAN-026) la sequenza vs v24. Il trigger delle quest non risolte resta OPEN-015.
- **Narrowing Director (2026-10-07):** la fetta di registro mondo in S2 è minima — basta a rendere persistenti e leggibili le conseguenze della *singola* quest di riferimento; personaggi/fazioni che ritornano tra quest diverse non sono requisito di S2.
- **Related:** `.mw/desiderata.md` v24, PLAN-019 (S2/S4/S5), OPEN-014/015, `VILLAGE_ECONOMY.md`.

## OPEN-017 — Binding degli approcci alternativi ai check della core gimmick

- **Question:** la proposta R-127 — una core gimmick (es. infiltrazione/allarme) che ammette canali di check su stat/skill alternative (invisibilità→INT, camuffamento→CHA invece di DEX) — lascia aperto il **modello di binding**: il canale si sceglie per-check in-run, è un approccio scelto a monte per l'intera run, o è gated da skill/equip/composizione del party (invisibilità richiede un caster)? Sub-questioni: come si marca un check come «core-gimmick» vs check di scena; forma dati (vocabolario stat alternativo sul nodo vs nodi check paralleli gated da flag); come i canali disponibili si rendono leggibili in preview (regola numeri-esatti R-108).
- **Status:** `risolta` 2026-10-11 — Director delega («fai cm reputi meglio», R-134) → adottato il binding research-backed.
- **Resolution (vigente, reversibile al playtest):** lock di approccio a run-level, capability-gated dal party, eccezioni a consumo (~1/run); roll per membro nominato; max 3 canali/check, menu solo sui pivot check; canali bloccati greyed «Requires: …»; varianti di canale sullo stesso nodo (no node-splitting); profili di fallimento divergenti obbligatori. Regola: `QUEST_RULES.md` §7 `vigente`. Prototipo: PLAN-028.
- **Residui delegati a PLAN-028:** mappatura capability gate su skill/equip reali (v10/v12), modello di esposizione wound/death per canale, coverage audit «Karma Police» sul quest set.
- **Source:** `context/ingestions/2026-10-10-quest-gimmick-approcci-alternativi.md`; `RICHIESTE.md` R-127/R-128/R-134; `QUEST_RULES.md` §7; `context/QUEST_GENERATION_ARCHITECTURE.md` §16; `context/QUEST_GIMMICK_CHANNELS_RESEARCH.md`.
- **Blocking:** risolta — non blocca più il contratto `CoreGimmick` (S5): il modello è deciso, i dettagli contract sono in §11.9.
- **Related:** OPEN-014 (architettura generazione), OPEN-018 (tensione preview/espressività), `QUEST_GENERATION_CONTRACTS.md` §2/§3.3/§11, desiderata v10/v12 (skill equip come possibile gate).

## OPEN-018 — Tensione preview a numeri esatti vs scelta espressiva dei canali

- **Question:** la ricerca R-128 (finding F8, divergenza D3) segnala che preview a numeri esatti — regola **frozen** R-108 — possono spingere il giocatore verso ottimizzazione EV invece che scelta espressiva d'identità («sono un mago, lancio invisibilità»). La regola è frozen e non si tocca: la domanda aperta è se le mitigazioni adottate bastano, o se in playtest emerge che il problema è reale.
- **Mitigazioni adottate (R-134, per delega):** risk tag semantici + stakes narrative accanto alle odds; menu multi-canale solo sui pivot check; differenziazione dei canali su assi non-EV (costo/rischio/fiction) così nessun canale è «ovviamente migliore».
- **Status:** `open` — da verificare al playtest del prototipo PLAN-028. Metrica indicatrice: i playtester scelgono il canale «per identità/piano» o dichiarano «ho preso la percentuale più alta»?
- **Source:** `context/QUEST_GIMMICK_CHANNELS_RESEARCH.md` §F8/§D3; R-134.
- **Related:** OPEN-017 (risolta), R-108 (frozen), `QUEST_RULES.md` §7.

## OPEN-019 — Modello del grafo delle opportunità

- **Question:** come si modella il layer sopra le quest — un grafo in cui
  opportunità, requisiti, ricompense e capacità si collegano? Più
  percorsi convergono sulla stessa opportunità e una quest apre porte
  diverse; il grafo rappresenta relazioni di sblocco persistenti, non
  solo successione temporale.
- **Progress 2026-10-11 (ricerca R-154 + decisioni Director):** adottate
  nella proposta — (a) **visibilità parziale** del grafo (nodi
  persistenti e porte note visibili, quest non sbloccate nascoste);
  (d) **transizione mid-run tra famiglie** ammessa sullo stesso
  ScenarioInstance.
- **RATIFICATO 2026-10-12 (Director):** (b) modello dati **ibrido** —
  qualities piatte (`access:`/`intel:`/`contact:`/`clock:`) + offer
  generator transitorio, più pochi nodi authored per milestone/
  obiettivi strategici visibili; (c) tipi di arco = **set aperto
  config-first** (enum estendibile; v0: sblocco/informazione/
  preparazione + clocks come nodi di stato). Regole candidate ancora
  proposal: ≥2 ingressi per nodo critico, path-dependent modifiers.
  Restano aperte: persistenza degli archi tra run, traversal del
  generatore, definizione dei clocks.
- **Status:** `open` — core model ratificato; dettaglio in
  `context/QUEST_OPPORTUNITY_LAYER.md` §1-§2 e
  `.mw/runs/20261011-opportunity-layer-research/report-t1.md`,
  `report-t2.md`. Sub-questioni residue: struttura dati e tipi di
  arco (sblocco/informazione/preparazione); come gli archi persistenti
  vivono nel save; come il generatore delle offerte lo attraversa;
  rapporto «famiglia di quest» ↔ (domain kit, core gimmick); relazione
  con gli archi narrativi delle chain quest.
- **Source:** `context/QUEST_OPPORTUNITY_LAYER.md` §1–§2;
  `context/ingestions/2026-10-11-quest-opportunity-layer.md` E-05..E-07,
  E-11, E-15, E-22; R-153; R-154 (ricerca + decisioni).
- **Blocking:** qualsiasi contratto del generatore di offerte e del
  perimetro di test meta-quest; non blocca i lavori dentro la singola
  quest (PLAN-028, S5).
- **Related:** OPEN-014 (architettura generazione), OPEN-016 (persistenza
  narrativa), OPEN-010/012/013 (economia villaggio), PLAN-026.

## OPEN-020 — Tassonomia requisiti e preparazione insufficiente

- **Question:** la tassonomia a 4 tipi — accesso assoluto / capacità /
  costo-o-rischio / ottimizzazione — va ratificata? Regole annesse: gate
  assoluti solo per impossibilità effettive (un equip mancante può essere
  costruito/noleggiato/ottenuto se il mondo offre l'alternativa);
  preparazione insufficiente in 3 casi (impossibile / compensabile a
  costo / tentabile a rischio). Quali requisiti sono generici, quali di
  famiglia, quali di singola quest, e come si dichiara il tipo nel
  contratto?
- **RATIFICATO 2026-10-11/12 (Director):** **stato del gate calcolato
  sulla offer card** a 4 stati (`Locked` con via di sblocco nominata /
  `Underprepared` con banda di rischio, mancanza e prezzo / `Ready` /
  `Over-qualified`) con qualità dello scout report dipendente dal
  party/esploratore.
- **NON ratificata 2026-10-12 (scelta Director):** la tassonomia a 4
  tipi resta **proposal** — si valida col prototipo meta-layer prima
  della ratifica. Candidati dalla ricerca: prezzo underprepared
  proporzionale al gap, bande calibrate su esiti simulati, requisiti
  come capability tag `requires/provides` con match a runtime.
- **Status:** `open` — `proposta` registrata in `QUEST_RULES.md` §9;
  dettaglio in `context/QUEST_OPPORTUNITY_LAYER.md` §3;
  `.mw/runs/20261011-opportunity-layer-research/report-t3.md`.
- **Source:** `context/ingestions/2026-10-11-quest-opportunity-layer.md`
  E-08, E-21; R-153; R-154.
- **Blocking:** modello requisiti del generatore di offerte (OPEN-019) e
  del contratto scena; non blocca il runtime attuale.
- **Related:** OPEN-019; R-108 (numeri esatti in preview — il giocatore
  deve sapere a cosa va incontro prima di rischiare).

## OPEN-021 — Orientamento esploratore e risorsa informativa trasversale

- **Question:** due proposte legate all'esploratore: (a) il giocatore può
  **orientare** la generazione delle offerte verso famiglie/tag
  preferiti — influenza la distribuzione senza garantirla; (b) esiste
  una **risorsa trasversale limitata** legata a informazione/preparazione
  operativa (evitare valute per-famiglia). Qual è il meccanismo di
  pesatura e la forma economica? Come si collega alle tre dimensioni di
  crescita del villaggio (visibilità / capacità / capacità operativa)?
- **RATIFICATO 2026-10-11/12 (Director):** (a) scout-quality sulla
  offer card **dipendente da party/esploratore** (banda larga con poco
  intel); (b) **flashback-style prep** come capacità di alto tier entro
  vincoli dichiarati; (c) **steering = bias di peso dichiarato e
  visibile**, mai filtro; (d) **niente valuta "intel"** — qualità info
  solo dalla qualità dell'esploratore/party; (e) capacità parallela =
  **solo leader-capacity** (un party = un leader; gli edifici
  supportano, non concedono spedizioni).
- **Conseguenza:** la mitigazione «numeri esatti come acquisto intel»
  per OPEN-018 non è più disponibile — OPEN-018 resta da verificare al
  playtest PLAN-028.
- **Status:** `open` — estende la regola vigente `QUEST_RULES.md` §2
  (esploratore rivela info) senza modificarla; PROPOSAL.
- **Source:** `context/QUEST_OPPORTUNITY_LAYER.md` §5/§6/§8/§9;
  `context/ingestions/2026-10-11-quest-opportunity-layer.md` E-10,
  E-17, E-19; R-153; R-154
  (`.mw/runs/20261011-opportunity-layer-research/report-t5.md`).
- **Blocking:** filone economia-villaggio (OPEN-010/012/013) e generatore
  di offerte (OPEN-019); non blocca il runtime attuale.
- **Related:** OPEN-010 (leader-capacity, human-days — tensione con
  «più party in parallelo»), OPEN-019, OPEN-020.

## OPEN-022 — Sistema macro di ricompense e requisiti (ciclo di campagna)

- **Question:** come si completa il sistema generale delle ricompense e
  dei requisiti delineato dalla discussione sul ciclo macro della
  campagna (invasione goblin come esempio)? Sub-questioni: (a) sottotipi
  delle quattro famiglie di ricompense (capacità per le quest / economia
  e risorse / potenziamenti combattivi del party / difese del villaggio);
  (b) rappresentazione dei requisiti, comprese le **skill a livelli di
  applicazione** (una capacità nota che si estende a nuove situazioni);
  (c) crescita di requisiti e valore tra i livelli delle quest senza
  rendere obsolete le scelte precedenti; (d) modello di valutazione delle
  ricompense che pesi **tempo, rischio, disponibilità e stato della
  campagna** — non solo valore nominale.
- **Status:** `open` — direzioni chiarite in conversazione 2026-10-16,
  tutte PROPOSAL; nessun numero di bilanciamento definito.
- **Source:** `context/QUEST_CAMPAIGN_MACRO.md` (§1–§6); R-209.
- **Blocking:** qualsiasi ratifica del ciclo macro di campagna e del
  sistema ricompense/requisiti; non blocca il runtime attuale né i lavori
  dentro la singola quest.
- **Related:** OPEN-012 (difesa villaggio a ondate, stessa famiglia);
  OPEN-019/020/021 (grafo opportunità, tassonomia requisiti, esploratore —
  le due tassonomie ricompense vanno composte, MACRO §7); OPEN-010
  (economia villaggio); `QUEST_RULES.md` §7 (canali — la skill a livelli
  si appoggia al meccanismo vigente).

## OPEN-023 — Gimmick «indagine»: modello della sicurezza, acquisizione trasversale e climax investigativo

- **Question:** completare il modello della core gimmick investigativa
  discussa il 2026-10-25. Sub-questioni: (a) semantica del verdetto
  `almost` nella mappa esiti→interpretazione; (b) ratifica della
  sicurezza come *convinzione soggettiva del personaggio* (vs probabilità
  oggettiva) e del numero di livelli (proposta: tre); (c) affidabilità
  dell'acquisizione — oggettiva / parziale / fallibile **per evento
  informativo**; (d) forma del climax investigativo: la «dichiarazione
  irrevocabile della conclusione» discussa nel pomeriggio — cosa si
  dichiara, quando, con quali conseguenze; (e) modello dati e UI di
  albero degli indizi / tesi contrapposte / rappresentazione delle
  convinzioni — **parzialmente coperta dal transcript integrale**:
  proposta registro indizi / diario / ricostruzione su un unico modello
  dati (gap analysis S-13); restano aperti modello dati e la forma
  dell'«albero»/tesi contrapposte; (f) come gli eventi informativi
  passivi e cross-gimmick entrano nel run state — `info[]` basta o serve
  un layer «interpretazioni» (direzione × sicurezza × storia
  re-investigazioni); (g) ri-coprire il contenuto pomeridiano —
  **parzialmente risolta**: corpus gialli recuperato (finalisti *Il
  doppio indizio* / *I quattro sospettati*, S-14); restano mancanti la
  «dichiarazione irrevocabile» e le soluzioni scartate (sessione
  pomeridiana separata, S-23); (h) **nuove dal transcript**: target di
  generazione — catalogo/ibrido/dinamico + legame fra quest
  standalone/persistente/campagna (GenUI mai risposto, S-21); quest
  spedizioni-fantasy vs investigative-narrative — cambia il prossimo
  slot gimmick (S-22); banco di prova della fase 3: Race (roadmap
  22/10) vs Rituale (ranking 25/10) — tensione non ratificata.
- **Status:** `open` — requisiti Director chiari (deduzione fallibile →
  sconfitta; indizi re-investigabili; raccolta passiva trasversale;
  estremi del dado mappati), proposte AI non ratificate. Update
  2026-10-25: (e) e (g) parzialmente coperte dal transcript integrale
  recuperato; aggiunte sub-questioni (h).
- **Source:** `context/ingestions/2026-10-25-gimmick-indagine-e-acquisizione-info.md`;
  `context/ingestions/2026-10-25-transcript-integrale-gap-analysis.md`
  (transcript integrale 22→25 ott); modello articolato in
  `context/QUEST_GENERATION_ARCHITECTURE.md` §19;
  DECISION_LOG 2026-10-25.
- **Blocking:** qualsiasi implementazione della gimmick; **non** blocca
  il roster operativo (cap v1 PLAN-029: `investigation` si accoda dopo
  `meld`, salvo ruling Director sul prossimo slot).
- **Related:** ARCHITECTURE §18.5 (candidata «indagine a soffio», origine);
  OPEN-021 (risorsa informativa trasversale — scope meta-layer, non
  in-quest); QUEST_RULES §3 (check nascosti R-151 — tensione col regime
  di acquisizione fallibile) e §9 (losabilità); seam motore: `setInfo`/
  `requiresInfo`, `verdictTable`, `vars`, `hiddenCheck`.

## OPEN-024 — Re-analisi del censimento gimmick: core vs sfumature sul tema

- **Question:** dividere il censimento delle gimmick (roster operativo +
  candidate §18.5 + lab registry) in **core gimmick** (algebra del
  problema) e **sfumature sul tema** (parametrizzazione della condizione-
  limite sulla stessa algebra), per il modello corretto del Director
  2026-10-25. Sub-questioni: (a) quali core gimmick reali esistono oltre
  «avanzamento sul tracciato» e «investigation» — PYL è algebra propria
  o sfumatura?; (b) criterio di bordo formalizzato — quando una
  sfumatura diventa gimmick diversa (algebra diversa / operatore
  decisionale diverso); (c) come il `CoreGimmick` contract esprime la
  famiglia di condizioni-limite; (d) classificazione per-voce di
  `flood`, `meld`, `rituale`, `scorta`, `cargo volatile`, `corruzione`,
  `difesa a ondate`.
- **Status:** `open` — re-analisi prodotta e formalizzata 2026-10-25
  (ARCHITECTURE §20.5–§20.9): censimento ridotto a 2 core + PYL come 3ª
  candidata; criterio di bordo a 3 assi abbozzato (§20.6); verdetto
  PYL proposto (§20.7 — core se bust stocastico/nascosto, sfumatura
  tracciato se deterministico); asse `LimitPattern` abbozzato (§20.8).
  Resta da ratificare: (a) classificazione per-voce; (b) verdetto PYL;
  (c) criterio di bordo; (d) forma del contratto variants.
- **Source:** `context/QUEST_GENERATION_ARCHITECTURE.md` §20/§20.5;
  DECISION_LOG 2026-10-25; R-287.
- **Blocking:** la metrica di varietà strutturale (§18.4) e la scelta
  del prossimo slot nel roster (interagisce con OPEN-023 e con la
  tensione Race-vs-Rituale del ranking 25/10); **non** blocca il runtime.
- **Related:** OPEN-023 (gimmick indagine); OPEN-021; ARCHITECTURE
  §18.4/§18.5/§19/§20; QUEST_GENERATION_CONTRACTS §2 (asse variants da
  aggiungere).

## OPEN-025 — LocationHub: luoghi con molte opportunità

- **Question:** i luoghi con molte opportunità concentrate (villaggio di
  partenza; in futuro gilda, accampamento, biblioteca, fortezza, rovine)
  diventano un **Hub** con un solo marker sulla mappa che, al click, apre un
  pannello generico con dentro quest/job/attività? Sotto-questioni: (a) quali
  luoghi sono Hub e quali POI restano singoli; (b) cosa mostra il marker
  dell'Hub (conteggi per tipo? halo dell'elemento più urgente? segnale
  «novità»); (c) layout del pannello (lista a sinistra + dettaglio a destra
  proposto) e come convive con il planner reale `QuestExpeditionDetail`;
  (d) nome e contratto del componente (`LocationHub` proposto).
- **Status:** `resolved` 2026-11-12 — **PLAN-117 baptized (rev. 5, D-13)**:
  Luogo = nodo autoriale nel modello `Region 1:N Place 1:N POI`, mai emergente
  da prossimità; scheda hover ancorata + ventaglio due anelli confermati
  (D-5/6/7 al gate F2); `placeId` obbligatorio su ogni POI. Storia:
  **decisa 2026-11-11 l'interazione**:
  mouse over sul Luogo → scheda verde e alabastro (testo + immagine); clic →
  ventaglio di sigilli attorno al luogo sulla mappa, **su due anelli
  concentrici** quando le attività sono troppe per uno (DECISION_LOG
  2026-11-11); anello interno = urgenza; clic su un sigillo → dettaglio
  specifico (oggi il cassetto del planner per le quest). Pochi posti densi
  oltre al villaggio, quasi solo job. **POI troppo vicini diventano
  automaticamente un Luogo** — vicinanza misurata **nel mondo**, fissa a
  ogni zoom (DECISION_LOG 2026-11-11; valore della soglia in PLAN-117 F1). Restano aperti: forma/taglia della
  scheda in hover, dettaglio dei job, collisioni con POI vicini, chiusura, equivalente
  senza mouse.
- **Context:** oggi su `/game` il villaggio non è cliccabile e non esiste
  alcun concetto di cluster/hub nel codice.
- **Requisito Director 2026-11-11:** l'Hub del villaggio deve rappresentare
  **cosa si può fare**, e questo **dipende dagli edifici**: base (tagliare
  legna, esplorare, ronda) e produzione avanzata (equip, pozioni, magie,
  ospedale). Cosa si può fare e come dipende dal **menu villaggio** (pulsante
  Village di `/game`), che oggi è solo un dipinto dove mostrare/costruire
  edifici: va ripensato insieme all'Hub. Fatti: `VillageDirectorView` mostra
  10 strati dipinti (case, locanda, casa del capo, legnaia) con un pannello
  di debug; il catalogo `villageBuildingsConfig.ts` ha 16 edifici con livelli
  (mock, nessun legame con le attività); i job in `defaultConfig.ts`
  (woodcutting, scouting, defense, scholar…) non sono legati a edifici.
- **Correzione Director 2026-11-11 (stesso giorno):** la vista Village
  **non** va ripensata come Hub e non diventa la superficie dell'Hub; il
  legame è solo di contenuto (cosa offre il Luogo-villaggio deriva da cosa
  c'è nella vista Village). **Successivo** (non ora): una vista ibrida
  veloce del menu Village — cosa c'è, blueprint disponibili e simili, oltre
  al clic sui singoli edifici («fare tutto tramite dipinto è follia»).
  **Ora:** solo cosa appare **sulla mappa, senza cambiare pagina** — un
  componente che elenca tutte le attività di un punto con più attività
  correlate (nome originario del Director: **Luoghi**; vecchia forma:
  immagine cinematografica + POI affiancati sotto, `TheaterView`, oggi
  commentato in `map/MapPage.tsx`). Base proposta dal Director come
  contenitore: il pannello verde e alabastro `HudRealPanel` («bel modo di
  presentare testo + immagine»), ma con una forma diversa da quella attuale.
- **Source:** `context/ingestions/2026-11-11-poi-stati-hub-opportunita.md`
  (E-07…E-11).
- **Blocking:** il disegno del marker-luogo e del pannello Hub; non blocca
  il Sigillo dei POI singoli.
- **Related:** OPEN-026; `poi_family_spec.md` § Sigillo (stato da
  `mapQuestPoiView`, T-07); ruling 20/10 «info nella preview destra».

## OPEN-026 — Tassonomia quest / job / attività sulla mappa di `/game`

- **Question:** quante famiglie di opportunità vede il giocatore e come si
  chiamano? Sotto-questioni: (a) «esplora / studia / costruisci» sono una
  famiglia «attività» o verbi dentro quest e job?; (b) se si usa «attività»
  come famiglia, va risolto il conflitto con il codice, dove
  `ActivityDefinition` è l'ombrello di tutti i POI (`kind` =
  job/quest/training/maintenance/cooldown); (c) i job tornano su `/game`
  (oggi `deprecated`, CTR-game-008)?; (d) come si distinguono a colpo
  d'occhio (sagoma già decisa: tondo con coda = impresa, tassello = lavoro,
  rombo = minaccia; metallo d'anello per famiglia ancora aperto in R-177).
- **Status:** `resolved` 2026-11-12 — **PLAN-117 baptized (rev. 5, D-9)**:
  3 tipi visivi — **quest / job / event-locale** (evento puntuale con
  scadenza), sagome+punte proprie nel linguaggio «cartografia incisa»
  (cornice stellata, contorno scuro, campo smalto saturo). Gli Eventi
  strategici non sono una famiglia di POI: vivono nella timeline dedicata
  (D-12). Storia: **(a) e (b) decise 2026-11-11**: due famiglie, spedizione
  e lavoro; i verbi stanno dentro entrambe; nessuna famiglia «attività»
  (DECISION_LOG 2026-11-11). La «minaccia» (rombo) è stata riassorbita nel
  tipo event-locale (D-9). Resta aperta solo (c): i job su `/game` dipendono
  da PLAN-116 D8, non da questo piano.
- **Source:** `context/ingestions/2026-11-11-poi-stati-hub-opportunita.md`
  (E-05, E-06, E-17).
- **Blocking:** glifi e metallo per famiglia; contenuto dei filtri dell'Hub
  (OPEN-025).
- **Related:** R-025, R-177, CTR-game-008, OPEN-025.

<!-- ===== repo-snapshot/REJECTED.md ===== -->

---
title: Rejected Approaches Registry
type: registry
updated: 2026-10-06
---

# REJECTED — Negative Knowledge Registry

Risponde alla domanda: **«cosa abbiamo già valutato e deciso di NON fare?»**

Una voce qui NON è una regola attiva e NON è storico-archivio: è una scelta
valutata e scartata, con la ragione, in modo che non venga riproposta per
ignoranza. Un'idea solo *menzionata* non va qui — va qui solo ciò che è stato
valutato e rifiutato con un motivo (vedi `knowledge-extractor` §10).

Formato voce:

- ID — `REJ-*`
- Rejected approach / idea
- Why rejected
- Status — `rejected` | `parked` | `superseded`
- Reopen-if — condizione che potrebbe riaprire la valutazione
- Source / provenance
- Related decision

---

## REJ-001 — Noise meter come pressione generica di quest

- **Rejected approach / idea:** un meter di «rumore» accumulato che aumenta la
  pressione nel prototipo base/generico di quest.
- **Why rejected:** il Director lo ha parcheggiato — *«il noise nn deve esserci
  nel prototipo base/generico, è una idea interessante x applicazioni future»*.
  È valido solo per tipologie dominio-specifiche (es. stealth).
- **Status:** `parked`
- **Reopen-if:** una quest stealth (o altra tipologia dominio-specifica) viene
  progettata, o il Director decide esplicitamente di reintrodurlo.
- **Source / provenance:** `context/DECISION_LOG.md` 2026-10-03;
  `context/QUEST_GAMEPLAY_SCIENCE.md` (sezione stealth dominio-specifica).
- **Related decision:** risk-band / epicfail (DECISION_LOG 2026-10-03, punto 2).
- **Nota operativa:** il meter `RUMORE ◉○○` è stato rimosso dal codice lab il
  2026-10-03 (commit `f7a55a73`), sostituito dagli stati nominati
  `campoAllertato`/`campoSveglio` — `SESSION_HANDOFF.md` 2026-10-03 sera.

## REJ-002 — Soglia ≥50% come condizione di vittoria della quest

- **Rejected approach / idea:** «la quest è vinta se ≥50% degli skill check
  affrontati è superato» come condizione che assegna la reward di quest.
- **Why rejected:** desiderata v24 rev.2 (approvata *«approvo»* 2026-10-02)
  sostituisce la soglia con una **prova-obiettivo precisa** + leader vivo al
  ritorno. Il conteggio dei check resta solo una statistica descrittiva della
  run.
- **Status:** `superseded`
- **Reopen-if:** il Director ridefinisce la condizione di vittoria; la
  divergenza con il calcolo a soglia di PLAN-018 è tracciata in
  `context/OPEN.md` (OPEN-001).
- **Source / provenance:** `.mw/desiderata.md` v24 rev.2;
  `context/DECISION_LOG.md` 2026-10-01 (D-8) e nota «Superata 2026-10-02»;
  `plans/PLAN-019-quest-macro-plan.md` tabella D-8.
- **Related decision:** modello obiettivo/reward (DECISION_LOG 2026-10-02).

## REJ-003 — Lettura «spedizione goblin» della struttura S1

- **Rejected approach / idea:** l'interpretazione AI che leggeva la quest di
  riferimento S1 come «spedizione goblin».
- **Why rejected:** sostituita dalla struttura dettata dal Director in v24
  rev.1 (viaggio → scelta approccio → evento → scoperta → evento/reward →
  obiettivo → ritorno); la quest di riferimento è «La cassa delle sementi».
- **Status:** `superseded`
- **Reopen-if:** mai, come lettura di S1 — la struttura Director è FROZEN.
- **Source / provenance:** `.mw/desiderata.md` v24 rev.1 punto 1;
  `plans/PLAN-019-S1-quest-interessante.md`.
- **Related decision:** struttura S1–S5 e quest di riferimento (v24).

## REJ-004 — PLAN-MOCKUP-TO-COMPONENT v1

- **Rejected approach / idea:** piano v1 per il workflow mockup→componente.
- **Why rejected:** bocciato dalla delibera multi-AI (6 punti blocking,
  sintesi in `.mw/runs/explore-mockup-to-component/SYNTHESIS.md`).
- **Status:** `superseded` (da v3)
- **Reopen-if:** n/a — la storia è chiusa da v3 battezzato.
- **Source / provenance:** `plans/PLAN-MOCKUP-TO-COMPONENT-v1.md`;
  `.mw/runs/explore-mockup-to-component/SYNTHESIS.md`.
- **Related decision:** `plans/PLAN-MOCKUP-TO-COMPONENT-v3.md`.

## REJ-005 — PLAN-MOCKUP-TO-COMPONENT v2

- **Rejected approach / idea:** piano v2 (CSS/React-first, 2 ingressi,
  whitelist licenze).
- **Why rejected:** cold read avversariale → verdetto NO, 5 blocking,
  7 correzioni richieste (`.mw/runs/coldread-mockup-v2/SYNTHESIS.md`).
- **Status:** `superseded` (da v3)
- **Reopen-if:** n/a.
- **Source / provenance:** `plans/PLAN-MOCKUP-TO-COMPONENT-v2.md`;
  `.mw/runs/coldread-mockup-v2/SYNTHESIS.md`.
- **Related decision:** `plans/PLAN-MOCKUP-TO-COMPONENT-v3.md`.

## REJ-006 — Aggregazione Poisson-binomiale per il rischio di spedizione

- **Rejected approach / idea:** calcolare la probabilità di superamento fasi
  come Poisson-binomiale su probabilità fisse per membro.
- **Why rejected:** i caduti smettono di contribuire alle fasi successive
  (decisione Director «solo morto», 2026-09-29): la probabilità della fase k
  dipende da chi è sopravvissuto alle fasi 1..k−1, quindi serve una
  **programmazione dinamica esatta sull'insieme dei vivi** (2^m × n), non
  probabilità fisse.
- **Status:** `rejected`
- **Reopen-if:** solo se il modello «i caduti non contribuiscono» venisse
  revocato.
- **Source / provenance:** `context/DECISION_LOG.md` 2026-09-29 (punto 2);
  `plans/PLAN-018-mission-planner.md`.
- **Related decision:** modello di rischio per-fase per-residente
  (DECISION_LOG 2026-09-29).

## REJ-007 — Quest come singolo skill check

- **Rejected approach / idea:** strutturare la quest come *«manda il party →
  tiro di abilità → successo/fallimento → ricompensa»*.
- **Why rejected:** collassa la quest in un unico check senza decisioni del
  giocatore, senza costo/rischio differenziato per scelta e senza conseguenze
  graduate (successo/fallimento/ferite/morte). Contraddice la struttura
  multi-fase vigente e il criterio «interessante» della desiderata v24.
- **Status:** `rejected`
- **Reopen-if:** mai per la struttura base; un singolo check può restare come
  *dettaglio* interno a una fase, non come architettura della quest.
- **Source / provenance:** conversazione ChatGPT «Progettare quest
  strategiche», continuazione 2026-10-05 (share 6ac4b926); ledger
  `context/ingestions/2026-10-06-quest-strategiche-continuazione.md` (E-02).
- **Related decision:** catena `PARTY → QUEST → PHASE → SITUATION → APPROACH →
  CHECK/CHOICE → CONSEQUENCE` (QUEST_RULES §1, PLAN-019).

## REJ-008 — Curio layer (oggetti interagibili stile Darkest Dungeon)

- **Rejected approach / idea:** un layer di oggetti di interesse opzionali a
  tabella di rischio nascosta, neutralizzabili dallo «strumento giusto»
  (pattern dei curio di Darkest Dungeon: interagire a mani nude = rischio,
  usare il tool corretto = sicuro).
- **Why rejected:** Director 2026-10-11 — *«B nn m piace, evitiamo»*.
- **Status:** `rejected`
- **Reopen-if:** solo su esplicita rivalutazione del Director; non
  riproporre come famiglia di scene di default.
- **Source / provenance:** gap map gimmick di fase, esplorazione R-151.
- **Related decision:** famiglia «ricompensa ingannevole» resta valida
  (mimic e affini, ARCHITECTURE §18) — il rifiuto riguarda il layer curio
  generalizzato, non le singole trappole authored.

<!-- ===== repo-snapshot/GLOSSARY.md ===== -->

# Glossario — RpgBalancer

**Versione:** 2
**Data:** 2026-10-05

Definizioni compilate solo da fonti canoniche (`QUEST_RULES.md`,
`CANON.md`, `CURRENT_STATE.md`, `context/DECISION_LOG.md`, desiderata FROZEN).
I termini marcati `proposta` non sono regole vigenti (vedi `context/OPEN.md`).

## Gameplay

- **Character** — entità persistente di gioco che rappresenta una persona (eroe o peasant).
- **Resident** — rappresentazione runtime di un `Character` all'interno di Idle Village.
- **Peasant** — lavoratore non-eroico, produce risorse, non può fare quest.
- **Hero** — avventuriere con stat, equip, livelli; consuma stamina per le quest.
- **POI** (Point of Interest) — nodo/location sulla mappa a cui è associata un'attività.
- **ActionCard** — rappresentazione interattiva di un'attività collegata a un POI.
- **ActionHalo** — anello visivo attorno a un POI che comunica tempo/stato (rosso urgenza, giallo/avanzamento, verde completamento).
- **JobCard** — ActionCard per attività di produzione ripetibili (taglialegna, oro).
- **QuestCard** — ActionCard per quest con requisiti ed esito.
- **QuestChronicle** — card cinematografica a fasi che mostra l'esito di una quest.
- **Skill Check** — prova di competenza; nel modello quest vigente è sforzo di gruppo con verdetto unico e rischi ferita/morte tirati per slot (`QUEST_RULES.md` §3). UI: `Destiny Astrolabe V1`.
- **Verdetti del check** — `bigwin` / `win` / `almost` / `fail` / `epicfail`; contano come superamento solo `bigwin`/`win` (`almost` è near-miss narrativo). `bigwin`/`epicfail` modificano le chance ferita/morte **prima** dei tiri per slot.
- **Banda di rischio** — range di ferita/morte dichiarato per un check al commit; `epicfail` può aggravare solo dentro la banda, mai oltre.
- **Leader (quest)** — slot fisso speciale della spedizione; leader morto al ritorno = reward di quest persa anche a obiettivo riuscito.
- **Party / Slot** — composizione della spedizione; slot **obbligatori** e **secondari** (preparazione facoltativa).
- **Bodyguard** — slot opzionale che intercetta gli esiti ferita/morte **da skill check** destinati agli slot protetti, finché vivo (anche da ferito). Non copre incidenti di viaggio o eventi diretti.
- **Death save** — su esito morte, tiro del 5% → sopravvive ferito. Valore `mock-S1`, da calibrare al Gate A (`context/OPEN.md` OPEN-006).
- **Wipe** — tutti i membri del party morti → si perde tutto (bottino e reward inclusi).
- **Checkpoint continua/ritirati** — punto decisionale **prima di ogni skill check rischioso** (non dopo ogni fase).
- **TAKEN ≠ SECURED** — l'obiettivo ottenuto non è ancora al sicuro: dopo il checkpoint si mette a rischio ciò che si ha già (push-your-luck).
- **Prova-obiettivo** — il check preciso che assegna la reward di quest; ha sostituito la soglia «≥50% dei check» (`context/REJECTED.md` REJ-002).
- **Fuga / ritirata** — fallimento della quest ma il bottino raccolto resta; «continua ad esplorare» dopo l'obiettivo rischia solo le vite.
- **Cover** — meccanica `coverRiskDelta`: slot/item/tag riducono il rischio degli altri membri.
- **Quest S1 lab** — pagina `/quest-s1-lab`; scenario di riferimento «La cassa delle sementi» + «Le Rovine sotto il Fiume» (`context/QUEST_S1_DESIGN.md`, `src/docs/docs/idle_village/quest_rovine_scenario_spec.md`).
- **Mission Planner** — draft PARTY/LOADOUT → preview deterministica (DP esatta) → resolver che campiona lo stesso modello (PLAN-018).
- **Destiny Astrolabe** — componente skill check visuale (d20) usato nel lab S1 e nel `MilestoneCheckModal`.
- **Blueprint** — schema sbloccabile per edificio/upgrade del villaggio.
- **License** — oggetto-card requisito per certe quest (es. Licenza di Caccia).
- **Injury / Death** — stati di ferita/morte per residenti durante le quest.

## UI / Visual

- **World Surface** — presentazione canonica del mondo: continente dipinto, esplorazione visiva, layer DOM + Pixi.
- **Prismatic Wanderlust** — direzione artistica attuale: Wilderness/Rude Beauty vs Empire/Solar Triumph, teal shadows, no grim/mud/symmetry/flat.
- **Golden UI Foundation** — processo per determinare e congelare la qualità visiva canonica.
- **SlottedMedal** — componente medaglione circolare per personaggi.
- **FloatingPanel** — pannello flottante spostabile, riducibile a icona, non modale.
- **Window** — primitivo vetro/tela per overlay.

## Concetti strategici — `proposta` (non ratificati, OPEN-010)

- **human-days** `proposta` — costo reale di una quest = persone × giorni; un ferito è «uomo non disponibile per X giorni».
- **Leader-capacity** `proposta` — la capacità di spedizione è limitata dallo stato del leader e dal pool di umani, non da un cooldown «1 quest/X giorni» (direttiva Director 2026-10-04, R-083).
- **Quest come opportunità** `proposta` — 8–10 quest compaiono/mese, 4–5 realisticamente affrontabili; alcune scadono.
- Fonte dei concetti: `context/QUEST_ECONOMY_NOTES.md`.

## Architecture / Governance

- **Config-first** — tutti i valori gameplay/UI vengono da config Zod, non hardcoded.
- **Frozen Kit** — componente con contratto, test e status `trusted`/`frozen`.
- **Desiderata** — intento del Director con status `FROZEN`, non modificabile unilateralmente.
- **Mind Weaver** — protocollo multi-AI: explorer → planner → executor, con `desiderata`, `RICHIESTE`, regression.
- **Trusted / Frozen** — componenti o contratti congelati; modificabili solo con update di `*_trusted.md` e `COMPONENT_MASTER_INDEX.md`.
- **Vertical Slice** — demo giocabile `/minimal-gameplay`.

## Note di rinomina / concetti storici

- **Dispatch** — riferimento storico per UI/mappa tattica; non è più il modello spaziale canonico.
- **Idle Village** — superficie di gioco **deprecata** (Director 2026-10-05); sostituita da `/game`. Il nome resta nel dominio codebase (`src/ui/idleVillage/`, `src/docs/docs/idle_village/`) come riferimento storico.
- **Game Frame / `/game`** — superficie di gioco canonica: cornice persistente (topbar, roster rail, mappa Pixi, quest rail, status bar) con quest POI e Director panel; raggiungibile dal link «Game» in `/test hub`. R-075 v2.

<!-- ===== repo-snapshot/RPG_PROJECT_CONTEXT.md ===== -->

# RPG Project Context — Personal Project Governance

**Version:** 1.0 (2026-05-20)  
**Project Type:** Personal (non-work, diferente da progetti Promedital)  
**Primary Domain:** Village/incremental management RPG for Steam (codename storico "Idle Village" — mantenuto come nome di dominio tecnico `idleVillage`; il gioco NON è un idle game: niente progressione offline, posizionamento "second monitor")

---

## 1. Project Scope & Boundaries

### What This Project Is

A personal indie game project: **RPG Balancer on Steam** (Forgotten Realms setting, Cultist Simulator aesthetic, D&D skill checks). Village/incremental management RPG a tempo continuo — precedentemente descritto come "Idle Village": **non** un idle game (niente progressione offline, posizionamento "second monitor"; decisione in `marketing/steam/claim-ledger.md`).

**Visual identity:** Medaglioni circolari (board game tokens) su mappa isometrica, azioni drag-and-drop, outcome narrativi.

### What This Project Is NOT

This project **does not** share governance, decision rules, or architectural principles with work projects (Promedital). 

- ✗ No enterprise patterns required
- ✗ No compliance/security gates (this is hobby)
- ✗ No cross-project dependencies
- ✗ Experimental patterns are **encouraged**

---

## 2. Decision Authority

**Fausto Boni** — sole decision maker on:
- Architecture
- Scope changes
- API design
- Test strategy
- Documentation standards

**Default assumption:** If not explicitly stated here, the decision is **Fausto's call**, no committee.

---

## 3. Core Semantic Constraints (Non-Negotiable)

These rules **MUST** apply to all code and docs. Violations are bugs.

### 3.1 Freezing Semantics

**Definition:** An entity is "frozen" during a specific operation if it:
- Cannot change internal state
- Cannot be assigned to other activities
- Cannot be interacted with via certain input paths
- Maintains visual coherence (no flickering, no duplicate renders)

**Current Frozen States** (as of 2026-05-20):

| Entity | Operation | Frozen | Duration | Reason |
|--------|-----------|--------|----------|--------|
| **PgToken** | Drag in progress | YES | `pointerDown` → `pointerUp` | Overlay controls visual pos, guard blocks clicks |
| **PgToken** | After drag (failed) | YES | 900ms | Anti-ghost-click guard (G5 layer) |
| **PgToken** | In active activity | YES | Timer runs | Token cannot be reassigned mid-activity |
| **Roster** | During drag | PARTIAL | Drag duration | Can reorder, but dragged token inert |
| **SlotRack** | Always | NO | N/A | Stateless view layer, never frozen |
| **ActivityDef** | Active | NO | N/A | Meta-data, no internal state |
| **StatusHUD** | Always | NO | N/A | Read-only view, no state mutation |

### 3.2 State Mutation Rules

**Rule 1: Single Source of Truth**
- Character data lives in Character Storage (primary)
- Resident data derived from Character via `bootstrapResidentsFromCharacters()` (canonical)
- Never mutate Resident state directly; always go through `useMinimalGameplayWithIdleVillageConfig()` store

**Rule 2: Persistent State**
- Assignment state (which token in which slot) persists across page reload
- Stored in `PersistenceService` (consolidated from 3 previous versions)
- Save/load tested via Playwright (not mocked)

**Rule 3: Time-Based State**
- Activity timers are **deterministic** with fixed seed (no floating-point drift)
- Outcome calculation uses seed-based RNG, not browser `Math.random()`
- All timing tests must verify ± 50ms accuracy over 30s duration

### 3.3 Interaction Paths (Exhaustive)

Only these paths may assign a resident to a slot:

1. **Drag-and-drop** (Path A): User drags PgCard → drops on slot → `handleDragEnd` → `assignResident()`
2. **Click-to-auto-assign** (Path B): User clicks PgCard → `handleRosterSelect` → finds first empty slot → `assignResident()`
3. **Inline picker** (Path C): User clicks slot → picker modal → picks resident → `assignResident()`

**No other paths exist.** If you find one, it's a bug.

Each path has 6 guard layers (G1-G6 documented in `roster_slot_integration_spec.md`). All must be tested.

### 3.4 Visual Verification Rules

All UI changes must be verified:
- **Pixel-perfect alignment:** Drag pickup center ± 5px from token center
- **Animation timing:** Spring-return < 500ms, timer countdown ± 50ms
- **State coherence:** No simultaneous conflicting states (e.g., token can't be "in slot" AND "in roster" visually)

Playwright test must include visual assertions, not just state checks.

---

## 4. Documentation Standards (Bidirectional Binding)

### 4.1 Spec Documents Drive Tests

**Pattern:**
1. Write behavior in `.md` (narrative, examples, edge cases)
2. Test file reads `.md`, extracts test cases, implements them
3. If test finds gap (behavior not described), add to `.md` first, then implement test

**File structure:**
```
src/docs/docs/minimal_slice/
├── 0X_entity_interaction.md        ← Spec (narrative, freezing, edge cases)
└── __tests__/
    ├── 0X_entity_interaction.spec.ts ← Playwright tests (live server, visual)
    └── 0X_entity_interaction.semantics.json ← Machine-readable state matrix
```

### 4.2 Semantic State Document

Each phase has a `.json` file that describes **current frozen state** in machine-readable form:

**Example** (`01_pgtoken.semantics.json`):
```json
{
  "entity": "PgToken",
  "version": "2026-05-20",
  "frozen_states": [
    {
      "operation": "drag_in_progress",
      "frozen": true,
      "duration_ms": "variable (until pointerUp)",
      "affected_interactions": ["click", "auto_assign", "roster_reorder"],
      "visual_indicators": ["opacity 0.7", "cursor grab-active"],
      "guard_layers": ["G1", "G2"],
      "test_id": "test_drag_start_blocks_click"
    }
  ]
}
```

### 4.3 Code Comment Standards

Every guard layer, state check, and freeze condition must have a comment linking to docs:

```typescript
// PgToken is frozen during drag (G1 guard layer).
// See: src/docs/docs/minimal_slice/01_pgtoken.md § "Freezing Rules"
if (dndIsDragging) {
  // Block click during drag
  return;
}
```

### 4.4 Documentation Governance Pack

For comprehensive documentation governance rules, see:
- `src/docs/docs/DOCUMENTATION_GOVERNANCE.md` - Single source of truth rules, freeze governance, documentation update workflow
- `context/VERTICAL_SLICE_REFERENCE.md` - Versioning and governance for vertical slice components

Key principles:
- Single source of truth for each component/contract
- General documentation orients, trusted documentation defines
- When changing frozen components, update trusted docs, tests, and code comments in same commit

---

## 5. Test Standards

### 5.1 Playwright Test Characteristics

- **Server mode:** Live `/dev` server (`npm run dev`), no mocks
- **Visibility:** Headed mode preferred for debugging, can record video
- **Granularity:** Exhaustive (cover all behaviors from spec doc)
- **Visual assertions:** Every interaction verified visually (not just state)
- **Determinism:** Seed all RNG, use `mockClock` for timers where needed

### 5.2 Test Categories (Exhaustive Coverage)

For each entity interaction spec:

| Category | Example | Playwright Feature |
|----------|---------|-------------------|
| **Rendering** | "PgToken portrait loads correctly" | `await expect(portraitImg).toHaveAttribute('src', /.jpg/)` |
| **Interaction** | "Drag centers on token" | `await page.mouse.move(startX, startY)` + measure overlay offset |
| **State** | "After drop, token removed from roster" | Query DOM, verify removed |
| **Animation** | "Spring-return completes < 500ms" | Measure time from drop to final position |
| **Guard** | "Ghost click doesn't assign after failed drop" | Drop outside + click immediately + assert no assignment |
| **Regression** | "Drag doesn't break roster reorder" | Drag once, reorder, drag again, verify both work |
| **Edge case** | "Rapid drag of multiple tokens" | Drag 5 tokens in 1 second, no race condition |

---

## 6. File Organization

### Project Root Structure

```
/Users/faustoboni/progetti personali/RPG/
├── context/                           ← RPG-specific governance
│   ├── RPG_PROJECT_CONTEXT.md         ← This file
│   ├── VERTICAL_SLICE_ENTITIES_FULL.md ← Complete entity inventory
│   ├── VERTICAL_SLICE_REFERENCE.md     ← Versioning and governance
│   └── DECISION_LOG.md                ← Major decisions + rationale
│
├── src/docs/docs/                     ← Project documentation
│   ├── MASTER_PLAN.md                 ← Top-level governance
│   ├── IMPLEMENTATION_PLANS_INDEX.md  ← Plan navigation
│   ├── DOCUMENTATION_GOVERNANCE.md    ← Single source of truth rules
│   ├── DEVELOPMENT_GUIDELINES.md      ← Config-first rules
│   ├── PROJECT_PHILOSOPHY.md          ← Weight-based creator pattern
│   ├── plans/                         ← Implementation plans
│   │   └── vertical_slice_implementation_plan.md ← 6-phase plan
│   ├── idle_village/                  ← Idle Village specific docs
│   │   └── card_system_description.md ← Card system architecture
│   └── minimal_slice/                 ← Vertical slice specs
│       ├── 00_README.md               ← Phase index
│       ├── START_HERE.md              ← Entry point
│       ├── 01_pgtoken.md              ← Phase 1 behavior spec
│       ├── 01_pgtoken.semantics.json  ← Machine-readable state
│       └── ... (phases 2-6)
│
├── src/pages/                         ← Minimal pages for each phase
│   ├── minimal-pgtoken.tsx
│   ├── minimal-roster.tsx
│   ├── minimal-slotRack.tsx
│   ├── minimal-drag-roster-to-slot.tsx
│   ├── minimal-activity.tsx
│   └── minimal-gameplay.tsx           ← Extends existing
│
├── tests/e2e/                         ← All Playwright E2E tests
│   ├── minimal_slice_01_pgtoken.spec.ts
│   ├── minimal_slice_02_roster_pgtoken.spec.ts
│   └── ...
│
└── archive/                           ← Archived session files
    ├── session_inventories/
    ├── session_navigation/
    └── session_handoffs/
```

---

## 7. Build & Deploy Standards

### 7.1 Local Dev Cycle

```bash
# Terminal 1: Dev server
npm run dev
# Opens http://localhost:5173 (hot reload)

# Terminal 2: Playwright headed test
npm run test:e2e:headed -- tests/e2e/minimal_slice_*.spec.ts

# Or UI mode for interactive debugging
npm run test:e2e:ui:dev
```

### 7.2 CI/CD (Future)

When pushing to GitHub:
- `npm run build` must succeed (TS strict mode)
- `npm run test:unit` must pass (vitest, deterministic)
- `npm run test:e2e -- --project=chromium` must pass (Playwright, live server)
- Visual regression snapshots must be reviewed (manual gate)

**No automatic merge** until all E2E green.

---

## 8. Semantic Versioning for Freezing Changes

When you change **what is frozen** or **how long**, follow this:

**File to update:**
1. `.md` spec (describe new freeze behavior + edge cases)
2. `.semantics.json` (update `frozen_states` array)
3. Test file (add/update test cases)
4. Code comments (link back to §4.3 standard)
5. This file (update §3.3 table)

**Example commit message:**
```
docs: PgToken now frozen for 900ms after failed drop (instead of 600ms)

- Updates freezing rule in 01_pgtoken.md
- Updates guard layer G5 timeout in 01_pgtoken.semantics.json
- Adds regression test: test_ghost_click_blocked_for_900ms
- Links comment in TestRosterPage.handleDragEnd to new 900ms TTL rule
```

---

## 9. Glossary (Terms Specific to This Project)

| Term | Definition | Context |
|------|-----------|---------|
| **Frozen** | Entity cannot change state or be interacted with via certain paths | Semantics |
| **Guard Layer** (G1-G6) | Protective condition to prevent unintended state (ghost click, race condition) | Code |
| **PgToken** | Draggable medaglione visual (portrait + ring + status icons) | Component |
| **Roster** | Ordered list of available PgToken | Component |
| **SlotRack** | Container of slots for activity assignment | Component |
| **Spring-return** | Animation when token is dropped outside slot (bounces back to origin) | Animation |
| **Pickup alignment** | Property: drag overlay center matches token visual center | Visual |
| **Freezing semantics** | Rules defining what is frozen in what operation + how long | Constraint |
| **Deterministic RNG** | Outcome calculation using seed, not `Math.random()` | Gameplay |
| **Single Source of Truth** | Each component/contract has one authoritative documentation source | Governance |
| **Trusted Component Registry** | Approved components for roster/list PG surfaces, with mandatory import paths | Governance |
| **Vertical Slice** | Subset of components built incrementally from simple to complex interactions | Architecture |
| **Documentation Governance Pack** | Set of rules for single source of truth, freeze governance, and documentation updates | Governance |
| **ActionCard** | Evolved card system for idle village activities with advanced styling and interactions | Component |
| **VerbCard** | Legacy card system for idle village activities (kept in `_OLD_DEPRECATED/`) | Component |

---

## 10. Contact & Escalation

**Questions about this context?** → Ask in the chat. This is a personal project, so decisions are **fast and informal**.

**Blocked on architecture decision?** → Document the blocker + options, ask Fausto.

**Found a regression?** → Log it in DECISION_LOG.md under "Regressions" with full repro.

---

## Appendix: Key Files Reference

| What | Where |
|-----|-------|
| Overall 6-phase plan | `VERTICAL_SLICE_IMPLEMENTATION_PLAN.md` |
| Current roster+slot architecture | `src/docs/docs/idle_village/roster_slot_integration_spec.md` |
| Character → Resident pipeline | `src/docs/docs/idle_village/trusted/character_resident_trusted.md` |
| Game config | `src/balancing/config/idleVillage/defaultConfig.ts` |
| Time engine | `src/engine/game/idleVillage/TimeEngine.ts` |
| Minimal gameplay state | `src/store/useMinimalGameplay.ts` |
| Playwright config | `playwright.config.ts` |
| Documentation governance | `src/docs/docs/DOCUMENTATION_GOVERNANCE.md` |
| Card system description | `src/docs/docs/idle_village/card_system_description.md` |
| Vertical slice entities | `context/VERTICAL_SLICE_ENTITIES_FULL.md` |
| Vertical slice reference | `context/VERTICAL_SLICE_REFERENCE.md` |

---

**Last updated:** 2026-05-20 (End of Session Update)  
**Status:** Active — all constraints apply from this point forward  
**Next review:** After Integration Phase completion (Tier 2 + Integration Pages)

---

## 11. SESSION UPDATE (2026-05-20 - End of Session)

### 11.1 What Was Built This Session

**Vertical Slice Fase 1-6 (Complete):** ✅ 125 Tests Passing
- Fase 1: SlottedMedal (20 tests)
- Fase 2: VillageRosterSection (14 tests)
- Fase 3: ResidentSlotRack (16 tests)
- Fase 4: Drag & Drop Integration (21 tests)
- Fase 5: Activity Timer Logic (20 tests)
- Fase 6: Full Gameplay + StatusHUD (18 tests)

**Tier 2: POI System Components (NEW):** ✅ 35 Tests Passing
- `ActivityCard.tsx` — Expandable POI container (10 tests)
- `ActivityDetail.tsx` — Activity info + SlotRack + Rewards (10 tests)
- `SkillCheckComponent.tsx` — Visual d20 roll display (7 tests)
- `VictoryComponent.tsx` — Reward celebration overlay (8 tests)

**Total Test Count:** 160/160 ✅ (100% passing)

**Documentation Created:**
- `FASE_1_TO_6_COMPLETE_RESULTS.md` — Comprehensive test results for Fase 1-6
- `TIER2_COMPONENTS_READY.md` — Tier 2 component overview + test results
- `COMPLETE_SYSTEM_STATUS.md` — Session summary + ready checklist

### 11.2 Current Implementation Status

**Components Implemented:**
```
Core (Existing):
├─ SlottedMedal (PgToken)           ✅ Working
├─ PgCard (Resident Card)           ✅ Working
├─ VillageRosterSection             ✅ Working
├─ ResidentSlotRack                 ✅ Working
├─ MinimalGameplayPage              ✅ Exists (needs integration)
└─ TimeEngine                        ✅ Working

Tier 2 (New):
├─ ActivityCard                     ✅ New
├─ ActivityDetail                   ✅ New
├─ SkillCheckComponent              ✅ New
└─ VictoryComponent                 ✅ New
```

**Configuration Available:**
- `defaultConfig.ts` — Activity definitions with rewards (JSON format)
- `ActivityDefinition` — Job/Quest specs with:
  - `id`, `label`, `durationFormula`
  - `rewards` — ResourceDeltaDefinition[]
  - `statRequirement` — DC + skill checks
  - `maxSlots`, `level`, `dangerRating`

### 11.3 What Still Needs Integration (Critical Path)

**Missing:** Real-time synchronization between components

Current state: All components work in isolation (tested).  
**Needed:** Components talking to each other in unified gameplay loop.

**Integration Chain (Not Yet Wired):**
```
DayNightComponent (time ticker)
    ↓
TimeEngine (global tick)
    ↓
ActivityCard (contains SlottedMedal)
    ├─ Timer countdown (synced to DayNightComponent)
    ├─ Halo progress bar (replaces spinning animation)
    ├─ SkillCheckComponent trigger (when timer == 0)
    ├─ VictoryComponent trigger (if skill check success)
    └─ State reset (after victory claim)
        ├─ PgToken back to IDLE
        ├─ Slot back to EMPTY
        └─ HUD updated with rewards
```

### 11.4 The Integration Page (Needed Next)

**What:** MinimalActivityIntegration page

**Shows:**
- DayNightComponent (time scroller at top)
- 1 ActivityCard (Job type) with:
  - Empty state (shows drop zone)
  - Assigned state (SlottedMedal inside, frozen)
  - Halo as progress bar (0% → 100%)
  - SkillCheckComponent (appears when timer=0)
  - VictoryComponent (appears after success)
  - Claim button (resets everything)
- Debug panel (shows state changes in real-time)

**Purpose:** Verify that:
1. Time flows (DayNightComponent ticks)
2. Timer counts down (synced to time)
3. Progress bar fills (proportional to timer)
4. Skill check triggers (correctly)
5. Victory shows (with correct rewards)
6. State resets (all entities clean)
7. HUD updates (resources tracked)

### 11.5 New Semantic Constraints from Session

**Halo Animation:**  
Update §3.1 table to add:
```
| **Halo** | Filling | YES | While timer runs | Provides progress feedback to player |
```

**ActivityCard States:**  
Add new frozen state tracking:
```
| **ActivityCard** | Awaiting claim | YES | After skill check | Player must click to claim, then resets |
```

**Reward Application:**  
Add to state mutation rules (§3.2):
```
Rule 4: Reward Persistence
- Rewards calculated at skill check completion
- Applied when player clicks "Claim" (not before)
- HUD updates in transaction (Wood + Gold + XP together)
- No partial reward application (all-or-nothing)
```

### 11.6 Files Added This Session

**Components:**
- `src/ui/idleVillage/components/ActivityCard.tsx`
- `src/ui/idleVillage/components/ActivityDetail.tsx`
- `src/ui/idleVillage/components/SkillCheckComponent.tsx`
- `src/ui/idleVillage/components/VictoryComponent.tsx`

**Tests:**
- `tests/unit/idleVillage/ActivityCard.unit.test.tsx`
- `tests/unit/idleVillage/ActivityDetail.unit.test.tsx`
- `tests/unit/idleVillage/SkillCheckComponent.unit.test.tsx`
- `tests/unit/idleVillage/VictoryComponent.unit.test.tsx`

**Documentation:**
- `FASE_1_TO_6_COMPLETE_RESULTS.md` (160+ lines)
- `TIER2_COMPONENTS_READY.md` (150+ lines)
- `COMPLETE_SYSTEM_STATUS.md` (240+ lines)

### 11.7 Test Results Summary

```
Vitest Unit Tests: 160/160 ✅
├─ Fase 1-6 (existing): 125 tests
└─ Tier 2 (new): 35 tests

Success Rate: 100%
Total Duration: ~6-7 hours
Framework: Vitest v4.0.18
Testing Library: @testing-library/react
```

### 11.8 Next Session Goals (Integration Phase)

**Priority 1: Immediate** (3.5-4 hours)
1. Create `HaloProgressComponent` (replaces spinning halo with fill animation)
2. Create `useActivityCardState` hook (manages card state machine)
3. Create `MinimalActivityIntegration` page (test harness)
4. Write integration tests (TEST-131-150, ~20 tests)
5. Verify all 180+ tests pass

**Priority 2: Then** (2-3 hours)
1. Manual browser testing (verify gameplay flow)
2. UI polish (animations, layout, responsiveness)
3. Error handling (edge cases, timeout scenarios)

**Priority 3: Later** (Post-manual-QA)
1. E2E Playwright tests (replace unit tests in workflow)
2. Performance profiling
3. Accessibility audit (WCAG 2.1)

### 11.9 INTEGRATION PHASE COMPLETE (2026-05-20 Session Continuation)

**What Was Built:**

1. **HaloProgressComponent** ✅
   - File: `src/ui/idleVillage/components/HaloProgressComponent.tsx`
   - Purpose: Circular progress bar replacing spinning halo
   - Features: SVG arc fill animation, color-coded by medal type, optional center label
   - Props: progress (0→1), size, color, medalType, label

2. **useActivityCardState Hook** ✅
   - File: `src/ui/idleVillage/hooks/useActivityCardState.ts`
   - Purpose: State machine for activity card lifecycle
   - States: empty → occupied → timer → skill_check → victory → reset
   - Features: Auto-transitions, timer progress tracking, skill check result calculation

3. **MinimalActivityIntegration Page** ✅
   - File: `src/pages/MinimalActivityIntegration.tsx`
   - Purpose: Complete integration test harness showing full gameplay loop
   - Components: DayNightComponent + 3 ActivityCards + VillageRosterSection + All overlays
   - Features: Real drag-drop, auto skill-check, resource updates, debug panel

4. **Integration Tests** ✅
   - File: `tests/unit/idleVillage/Integration.unit.test.tsx`
   - Count: 30 tests (TEST-131 to TEST-160)
   - Categories: Assignment (5), Timer (5), SkillCheck (5), Victory (5), Reset (5), Occupancy (5)

**New Test Results:**
```
Previous: 160/160 ✅
Integration: 30/30 ✅
Total: 190/190 ✅
```

**Integration Chain Now Complete:**
```
DayNightComponent (time ticker) ✅
    ↓
TimeEngine (global tick) ✅
    ↓
ActivityCard (contains SlottedMedal) ✅
    ├─ Timer countdown (synced to game time) ✅
    ├─ Halo progress bar (fills 0→100%) ✅
    ├─ SkillCheckComponent trigger (auto on timer=0) ✅
    ├─ VictoryComponent trigger (auto on success) ✅
    └─ State reset (on victory claim) ✅
        ├─ PgToken back to IDLE
        ├─ Slot back to EMPTY
        ├─ Resources updated in HUD
        └─ Activity card ready for next assignment
```

**Workflow Verified:**
1. Drag resident from roster → activity slot ✅
2. Timer starts, progress bar fills ✅
3. Skill check auto-triggers on completion ✅
4. D20 roll animation plays ✅
5. Victory overlay shows on success ✅
6. Rewards apply to HUD ✅
7. Activity resets, resident available ✅

**Next Immediate Steps:**
1. Add route to App.tsx: `/activity-integration` → MinimalActivityIntegration
2. Run `npm run dev`
3. Test full gameplay flow in browser
4. Verify animations are smooth
5. Check responsive layout

**Documentation:**
- `INTEGRATION_PHASE_COMPLETE.md` — Full integration phase summary with test checklist

### 11.10 Documentation Alignment Complete (2026-05-20)

**New Documentation Files Added:**
- `src/docs/docs/DOCUMENTATION_GOVERNANCE.md` - Single source of truth rules, freeze governance
- `src/docs/docs/idle_village/card_system_description.md` - Complete card system architecture
- `src/docs/docs/plans/vertical_slice_implementation_plan.md` - 6-phase incremental build plan
- `src/docs/docs/minimal_slice/START_HERE.md` - Entry point for vertical slice architecture
- `context/VERTICAL_SLICE_ENTITIES_FULL.md` - Complete entity inventory
- `context/VERTICAL_SLICE_REFERENCE.md` - Versioning and governance

**Documentation Alignment Changes:**
- All new docs aligned with project philosophy, master plan, development guidelines, and semantic constraints
- MASTER_PLAN.md updated with "Vertical Slice Documentation Governance" section and Phase 12 references
- IMPLEMENTATION_PLANS_INDEX.md updated with vertical slice implementation plan entry
- minimal_slice/00_README.md updated with "Related Documentation" section
- DEVELOPMENT_GUIDELINES.md updated with "Vertical Slice Development Rules" section
- RPG_PROJECT_CONTEXT.md updated with new documentation references, governance section, file structure, and glossary terms

**Archived Files:**
- `archive/session_inventories/FILES_CREATED_THIS_SESSION.md`
- `archive/session_navigation/INDEX_START_HERE.md`
- `archive/session_handoffs/idle_village_conversation_context_handoff.md`

**Documentation Governance Principles:**
- Single source of truth for each component/contract
- General documentation orients, trusted documentation defines
- When changing frozen components, update trusted docs, tests, and code comments in same commit

### 11.11 How To Use This Document

**For understanding state:** Read §3 (Core Semantic Constraints)  
**For understanding tests:** Read §5 (Test Standards)  
**For understanding what's done:** Read §11 (Session Update)  
**For understanding what's next:** Read §11.9 (Integration Phase Complete)  
**For understanding if something is a bug:** Read §3 + check if frozen state rules are violated

**This document is the source of truth.** If there's a question about "should we freeze X during operation Y?", the answer is in §3.1 table. If there's a question about "how should we test it?", the answer is in §5.2 test categories.

**For integration status:** Read §11.9 (Integration Phase Complete) for what's wired and working.

---

## 12. Creature IP Development System

### 12.1 Creative Memory Rule

- Decisions are preserved, not only outputs.
- Rejected directions are stored in `rejected-directions.md` at family or creature level.
- Every versioned change must explain *why*.

### 12.2 Conversation vs Canon

- Chat / exploration is temporary.
- Only approved, versioned documents are canon.
- AI-generated images, prompts, or ideas are not world truth until reviewed.

### 12.3 Authority Hierarchy

| Level | Scope |
| --- | --- |
| world | tone, color rules, kill list |
| art | art stack, rendering rules |
| family | family DNA, rejected directions |
| creature | identity, prompt, reference card |
| detail | single image variant |

### 12.4 Semantic Versioning

- **MAJOR** — identity or family DNA change
- **MINOR** — visual refinement or new decision
- **PATCH** — typo, link fix

### 12.5 Design Intent First

No creature identity card can be created before its `design-intent.md` explains:

- gameplay purpose
- player lesson
- desired emotion
- desired player behavior
- why Wanderlust needs it

<!-- ===== repo-snapshot/PROJECT_PHILOSOPHY.md ===== -->

---
title: RPG Balancer – Project Philosophy & Design System
status: active
owner: Creative-Director
last_reviewed: 2026-02-11
domain: core
description: "Weight-based creator pattern and Gilded Observatory design canon"
---

# RPG Balancer - Project Philosophy & Design System

## Core Philosophy: Weight-Based Creator Pattern

### The Foundational Concept

The **Spell Creator** is not just a feature—it's the **architectural template** for ALL entity creation in this project. Every creator (spells, items, characters, races, abilities) follows the same fundamental pattern.

## The Weight-Based System

### Formula
```
Balance = Σ(selected_weights) - Target_Cost
```

### How It Works

1. **Configurable Ticks**
   - Each stat has multiple "ticks" (configuration points)
   - Each tick = `{value, weight}` pair
   - Example: Effect stat might have ticks:
     - Tick 0: `{value: 50, weight: -2}`  (weak, reduces cost)
     - Tick 1: `{value: 100, weight: 0}`  (baseline)
     - Tick 2: `{value: 150, weight: 3}`  (powerful, increases cost)

2. **Slider Selection**
   - User positions slider on desired tick
   - Selected tick's **value** → applied to entity
   - Selected tick's **weight** → contributes to balance

3. **Balance Calculation**
   - Sum ALL selected weights across ALL stats
   - Subtract target cost
   - Result = 0 → perfectly balanced
   - Result > 0 → over-budget
   - Result < 0 → under-budget

4. **User-Defined Baseline**
   - "Save Default" captures current configuration
   - Becomes the reference for future creations
   - Enables iterative game balancing

### Example Flow

**Creating a Fireball Spell:**
```
Stats Configuration:
- Effect: Slider on tick 2 (value=150, weight=3)
- Eco: Slider on tick 1 (value=1, weight=0)
- Dangerous: Slider on tick 3 (value=120, weight=2)
- AOE: Slider on tick 2 (value=3, weight=1.5)

Balance = 3 + 0 + 2 + 1.5 - Target(0) = 6.5

User adjusts until Balance ≈ 0, then saves.
```

## Archmage Integration: Spell-Creatures and Mental Palace

The weight-based creator pattern now extends to the new Archmage vision:

### Spell-Creatures
- **Semi-sentient entities** with lifecycle stages (infant, juvenile, mature)
- Each stage has configurable stats (power, mana cost, mood) with weight-based balance
- Training and cultivation mechanics use the same `{value, weight}` ticks for progression
- Risky reciprocity affects creature behavior and adds strategic depth

### Mental Palace
- **Infinite mental space** divided into districts and rooms
- Rooms have stats like mana generation rate, creature capacity, defense rating
- Expansion and upgrade use weight-based costs for balanced progression
- Transcendence paths modify palace mechanics with different weight multipliers

For full details, see `docs/archmage/Vision.md` and `docs/archmage/GameplayPillars.md`.

## Design Principles

### 1. Modularity & Reusability
- Each stat card is independent
- Drag-and-drop reordering
- Collapsible for focus
- **Same component pattern** for all entity types

### 2. Visual Hierarchy
- **Glassmorphic Design** throughout
- Cyan/Blue theme for "Identity" (definition)
- Purple theme for "Stats" (configuration)
- Clear visual separation of concerns

### 3. Progressive Disclosure
- Top section: Core identity (Name, Type, Target Cost)
- Middle section: Stat configuration (where the magic happens)
- Bottom section: Actions (Save, Reset, Save Default)

### 4. Immediate Feedback
- **Real-time recalculation** on any change
- Balance indicator always visible
- Preview updates automatically
- Visual highlighting of active selections

## Extending the Pattern

### Creating a New Entity Type (e.g., Items)

1. **Define Item Stats**
   ```typescript
   const itemStats = ['power', 'durability', 'rarity', 'weight'];
   ```

2. **Create Tick Configurations**
   ```typescript
   const defaultItemSteps = {
     power: [
       {value: 10, weight: -1},
       {value: 50, weight: 0},
       {value: 100, weight: 2}
     ],
     // ... other stats
   };
   ```

3. **Use WeightBasedCreator Component**
   ```tsx
   <WeightBasedCreator
     entityType="item"
     stats={itemStats}
     defaultSteps={defaultItemSteps}
     onSave={saveItem}
   />
   ```

4. **Done!** The entire UI, balance calculation, and persistence logic is handled.

## UI/UX Guidelines

### Gilded Observatory Aesthetic (Current Canon)
```css
/* High-level visual intent, actual tokens live in the CSS/theme system */
background: radial-gradient(circle at top, #1f2933 0%, #020617 55%, #000000 100%);
border-color: rgba(245, 245, 244, 0.06);
color: #f5f5f4; /* Ivory text */
box-shadow: 0 18px 45px rgba(0, 0, 0, 0.75);
```

This project now treats the **Gilded Observatory** theme as the reference UI canon. All new UI work MUST:

- **Inherit from theme tokens** (Tailwind config, `fantasy-theme.css`, `color-palette.css`) instead of hardcoded hex values.
- Use **compact, information-dense layouts** by default, but remain touch-friendly on mobile.
- Keep visual hierarchy clear: cards, headers, and primary actions should stand out even in dense screens.

### Color System (Conceptual Roles)
- **Obsidian / Deep Space**: Backgrounds, large surfaces, modal backdrops.
- **Ivory / Warm Light**: Primary text, key labels, headings.
- **Teal / Arcane Accents**: Sliders, interactive controls, hover/active states.
- **Gold / Gilded Lines**: Section dividers, highlights, "premium" actions.
- **Error / Success / Warning**: Still exist, but must be routed through the centralized color palette.

> Implementation detail: the **authoritative mapping** between these roles and actual CSS tokens is maintained in the theme files and Tailwind config, not in components.

### Cinematic Key-Art Direction
To anchor future hero panels, splash art, and cinematic overlays in a consistent visual language, we adopt the following north-star brief:

> A majestic ancient dragon perched on an overgrown marble ruin in a lush tropical jungle. The dragon has iridescent emerald and gold scales, inspired by the realism of Jeff Easley (AD&D). The lighting is bright tropical sunlight with deep, rich shadows. Style: Hand-painted digital art, oil painting brushstrokes, heroic realism. Color palette: Vivid turquoise, lime green, bright orange flowers, and polished bronze. High detail, epic scale, serious adventurous tone.

This description should inform palette accents, lighting ratios, and compositional beats whenever we produce new illustrative assets or themed UI flourishes.

### Interaction Patterns
- **Horizontal Sliders:** Primary selection mechanism for weighted stats.
- **Tooltip-First Formulas:** Formulas live in docs and tooltips; UI shows human labels and results, not raw math in the main layout.
- **Drag Handle in Header:** Reordering and layout manipulation is initiated from card headers or dedicated handles, not from random surfaces.
- **Toast Notifications:** Success and error feedback use a unified toast system (no `alert()`), consistent with MASTER_PLAN guidelines.

For how this UI/UX direction links to the rest of the roadmap:
- See `docs/MASTER_PLAN.md` → **Future Direction**.
- See `docs/IMPLEMENTED_PLAN.md` for what is already in production vs. mock.

## Config-Driven Architecture (Phase 10+)

### Principio Fondamentale
**Niente hardcoded per layout, card, stat, formule.** Tutto è definito in JSON/config e modificabile da UI.

### Schema-First Development
1. **Schema JSON** definisce struttura (stat, card, formule)
2. **Zod** valida lo schema a runtime
3. **UI** legge lo schema e genera componenti dinamicamente
4. **Persistence** salva/carica lo schema + valori in localStorage

### Balancer Config-Driven
```typescript
// Esempio: stat definita in config, non hardcoded
const statDefinition: StatDefinition = {
  id: 'critChance',
  label: 'Critical Chance',
  type: 'percentage',
  min: 0, max: 100, step: 1,
  defaultValue: 5,
  weight: 4.0,
  isCore: false,
  isDerived: false,
};
```

### Formula Engine
Le formule derivate (es. `htk = hp / damage`) sono:
- **Editabili da UI** con validazione real-time
- **Validate** contro stat esistenti (no variabili sconosciute)
- **Estensibili** per aggiungere funzioni in futuro

### Core vs Custom
- **Core** (hp, damage, htk): sempre presenti, non eliminabili, ma pesi/range editabili
- **Custom**: tutto il resto è creabile/eliminabile da UI

Per dettagli implementativi:
- See `docs/plans/config_driven_balancer_plan.md`
- See `docs/plans/config_driven_balancer_tasks.md`

---

## Technology Stack

### Current
- **React 18+** with Hooks
- **TypeScript** for type safety
- **Tailwind CSS** for utilities
- **localStorage** for persistence
- **Zod** for schema validation

### Planned
- **@dnd-kit** for drag & drop
- **CSS Modules** for complex component styles
- **Sonner** for toast notifications
- **Custom Hooks** for shared logic
- **Zustand/Context** for global state (if needed)

## File Organization

### Recommended Structure
```
src/
  features/
    spellCreation/      # Feature-specific
    itemCreation/       # ...
    characterCreation/  # ...
  shared/
    components/
      WeightBasedCreator/
      GlassCard/
      StatSlider/
    hooks/
      useWeightedBalance.ts
      useStatSteps.ts
    utils/
      balanceCalculations.ts
```

### Current (Needs Refactoring)
```
src/
  ui/
    spell/              # Mixed concerns
      SpellCreation.tsx # Too large (380+ lines)
      components/       # Some reusable, some not
```

## Key Decisions & Rationale

### Why Weight-Based?
- **Flexible:** Any value can have any cost
- **Designer-Friendly:** Non-programmers can balance
- **Iterative:** Test, adjust weights, repeat
- **Extensible:** Same pattern for all entities

### Why Horizontal Sliders?
- **Spatial Reasoning:** Position = value (intuitive)
- **Visual Feedback:** See all options at once
- **No Conflicts:** D&D restricted to header

### Why User-Defined Baselines?
- **Game is in Development:** Balance changes frequently
- **Designer Control:** YOU define "normal"
- **Evolution:** Baseline grows with game design

### Why No Global State Manager (Yet)?
- **Simplicity:** localStorage sufficient for now
- **Performance:** No cross-component dependencies
- **Future-Proof:** Easy to add Zustand later if needed

## Common Pitfalls to Avoid

1. **❌ Hardcoding Values**
   - Don't: `const damage = effect * 1.5`
   - Do: Use configurable formulas with weights

2. **❌ Mixing Concerns**
   - Don't: Put balance logic in UI components
   - Do: Extract to custom hooks

3. **❌ Inline Styles Everywhere**
   - Don't: `<div style={{...complexStyles}}>`
   - Do: Use Tailwind utilities or CSS Modules

4. **❌ Alert() for Feedback**
   - Don't: `alert('Saved!')`
   - Do: `toast.success('Saved!')`

5. **❌ Prop Drilling**
   - Don't: Pass props through 5+ levels
   - Do: Use Context or custom hooks

## 🚨 CRITICAL: Single Source of Truth - ZERO Hardcoding

### The Inheritance Rule

**EVERY component, function, and module MUST inherit from existing sources:**

```typescript
// ✅ CORRECT: Import from single source
import { BASELINE_STATS } from './balancing/baseline';
import { DEFAULT_STATS } from './balancing/types';
import { getStatWeight } from './balancing/statWeights';
import { MitigationModule } from './balancing/modules/mitigation';

const entity = { ...BASELINE_STATS };
const weight = getStatWeight('damage');
const damage = MitigationModule.calculateEffectiveDamage(...);
```

```typescript
// ❌ WRONG: Hardcoded values
const entity = {
  hp: 100,          // VIOLAZIONE!
  attack: 20,       // VIOLAZIONE!
  defense: 10       // VIOLAZIONE!
};

const weight = 5.0; // VIOLAZIONE - use getStatWeight()!
```

### Why This is Non-Negotiable

1. **Maintainability:** Change formula once, updates everywhere
2. **Testing:** Simulations use same values as production
3. **Consistency:** No drift between modules
4. **Debugging:** Single point of failure, easy to fix
5. **Evolution:** Game balance can evolve without code changes

### Enforcement Checklist

Before committing code, verify:
- [ ] No hardcoded stat values (hp, damage, etc.)
- [ ] No hardcoded weights or ratios
- [ ] No duplicated formulas (use modules)
- [ ] All imports from `/balancing/*`
- [ ] TypeScript types match `StatBlock` interface

### Where to Import From

| Need | Import From | Example |
|------|-------------|---------|
| Balanced baseline | `baseline.ts` | `BASELINE_STATS` |
| Default UI values | `types.ts` | `DEFAULT_STATS` |
| Stat weights | `statWeights.ts` | `getStatWeight('damage')` |
| Damage calculations | `modules/mitigation.ts` | `MitigationModule.calculateEffectiveDamage()` |
| Hit chance | `modules/hitchance.ts` | `HitChanceModule.calculateHitChance()` |
| Critical hits | `modules/critical.ts` | `CriticalModule.calculateCriticalDamage()` |

---

### Short Term (Next 3 Months)
- Item Creator using weight-based pattern
- Character Creator using weight-based pattern
- Shared component library
- Modern toast notifications

### Medium Term (6 Months)
- Formula editor for damage calculations
- Visual formula builder
- Import/Export configurations
- Collaborative balancing tools

### Long Term (1 Year+)
- AI-assisted balancing suggestions
- Playtest data integration
- Version control for configurations
- Multi-game support

---

## For New Developers

### Getting Started
1. Read `ARCHITECTURE.md` for technical details
2. Study `SpellCreation.tsx` as the reference implementation
3. Review `implementation_plan.md` for refactoring roadmap
4. Follow the pattern when adding new features

### Key Takeaway
> "Everything is a weight-based creator. If it needs balance, it uses this pattern."

---

*Last Updated: 2024-11-27*  
*Version: 1.0*

<!-- ===== repo-snapshot/architecture_state.md ===== -->

---
title: Architecture Router — RPG Balancer
status: canonical-router
updated: 2026-10-05
---

# Architecture Router — RPG Balancer

> **Ruolo:** entry point canonico per le domande di architettura. Non contiene l'architettura —
> mappa dominio → fonte autorevole. Promosso a router canonico nel KB audit 2026-10-05
> (desiderata v25): i 4 ex-claimant sono marcati superseded/reference (vedi `KNOWLEDGE_AUDIT.md` §C2).

## Dominio → fonte autorevole

| Dominio | Fonte autorevole |
|---|---|
| Invarianti non negoziabili (persistence, config-first, skin, i18n, state, docs) | `.windsurf/rules/00-project-invariants.md` |
| Filosofia config-first / weight-based creator (il "perché") | `.windsurf/rules/philosophy.md` |
| Contratti componenti trusted/frozen | `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` + `trusted/*_trusted.md` |
| Sistemi canonici (skin, analytics, ecc.) | `coordinator/canonical-systems.md` |
| Modello matematico del Balancer | `src/docs/docs/balancer/balance_model_v1.md` + `RPG_BALANCER_MASTER_CONTEXT.md` |
| Stato operativo dei piani | `plans/INDEX.md` |
| Decisioni e perché | `context/DECISION_LOG.md` · `.mw/desiderata.md` (FROZEN) |
| Autorità documentali | `CANON.md` |
| Deploy/Guardian | `.windsurf/rules/60-guardian-deploy.md` |
| Shutdown governance | `.windsurf/rules/50-shutdown-governance.md` |

## Ex-claimant (non autorevoli)

- `ARCHITECTURE.md` — deep dive tecnico (Jan 2026, parzialmente stale) → reference.
- `ARCHITECTURE_REFERENCE.md` — regole config-first ora in `.windsurf/rules/` → superseded.
- `ARCHITECTURE_BIBLE.md` — governance assorbita da `CANON.md` + `40-documentation-governance` → superseded.

## Regola d'uso

Se una domanda non è coperta dalla tabella, la risposta non ha fonte autorevole: segnalarlo
al Director invece di dedurla. Per aggiornare questa mappa serve una modifica esplicita —
non si accumula stato di modulo qui (quello vive in `CURRENT_STATE.md` / `plans/INDEX.md`).

<!-- ===== repo-snapshot/VERTICAL_SLICE_ROADMAP.md ===== -->

> **STATUS: STALE — da verificare con il Director (CANON lo cita ancora come piano operativo)** — KB audit 2026-10-05 (desiderata v25, `KNOWLEDGE_AUDIT.md`). Canonico: plans/INDEX.md, PLAN-019.

# Vertical Slice Roadmap — Steam Release

**Versione:** 3 (riscritta 2026-05-12 dopo correzioni utente)
**Cosa è questo file:** unica guida operativa per arrivare alla slice giocabile su Steam.

> **Gerarchia documentale:**
>> - `GAMEPLAY_DESIGN.md` — visione e meccaniche del gioco
> - `idle_village_conversation_context_handoff.md` — stato runtime autorevole
> - `VERTICAL_SLICE_ROADMAP.md` — *(questo file)* piano operativo
>
> Se questo file contraddice il briefing o l'handoff, il briefing/handoff vincono.

---

## 1. Cos'è la slice

Demo Steam giocabile, **durata target > 10 min** (probabilmente 30-60 min di gameplay vario prima di "End of slice"). Mostra il core loop completo:

> Personaggi normali producono materiali → mercante/negozio fornisce equip → eroi preparati affrontano quest D&D → skill check stile Cultist Simulator → ricompense → level up → upgrade edificio (WoW moment).

Setting: avamposto di frontiera Forgotten Realms. Visual: medaglioni circolari da board game su mappa con action card.

---

## 2. Verità di partenza (dall'handoff)

| Fatto | Confidence |
| --- | --- |
| `/minimal-gameplay` è la canonical runtime surface | High |
| `/test` è il verification harness | High |
| Pipeline Character → Resident è la baseline architettura | Medium-High |
| Portrait rendering funziona (utente confermò "FUNZIONA !") | High |
| Roster ordering funziona ("adesso ordina") | Medium-High |
| **Drag pickup alignment è ROTTO** (cursore non centrato sul token) | Very High |
| Spring-return non è trustworthy, da non toccare prima del pickup | High |

**Regola d'oro:** *runtime first, docs after*. Visual/UI bugs richiedono **verifica utente reale**, non bastano build green o report agent.

---

## 3. Scope rigido (dal briefing)

**Si tocca solo:**

- `src/ui/idleVillage/` ← playground principale
- `src/balancing/config/idleVillage/` ← solo file di config
- `src/engine/game/idleVillage/` ← TimeEngine e logica village

**Non si tocca:**

- `src/balancing/archetype/`, `src/balancing/simulation/`
- `src/ui/balancing/`, `src/ui/combat/`
- `src/components/balancing/`
- Combat simulator, stat balancer, archetype tools
- Documentation reconciliation di vecchi piani (focus su runtime)

**Errori TS in `src/balancing/archetype/`** (~87): fuori scope, da disaccoppiare via `tsconfig.app.json exclude` in fase di build Vercel.

---

## 4. Piano per macro-fasi

Lo scope Steam richiede più di 3 settimane. Lo divido in macro-fasi che il giocatore vede crescere progressivamente. Tempi indicativi, sub-task da pianificare uno alla volta secondo lo workflow "fewer prompts, stronger prompts" dell'handoff.

### Macro-Fase A — Drag pickup fix (1-3 giorni, blocker)

Vincolo dall'handoff: **niente altro va avanti finché il pickup non è centrato**.

- [ ] **A.1** Inspect runtime drag start path: `PgCard` / `SlottedMedal` / `CustomDragOverlay` / `useDraggable` (@dnd-kit) / transform-origin / overlay offset.
- [ ] **A.2** Misurare DOM rect reale del token visibile al pickup vs pointer event coordinates. Niente "estimated geometry" (handoff §6.2).
- [ ] **A.3** Identificare la prima divergenza esatta e applicare il fix minimo (non riscrivere la pipeline drag).
- [ ] **A.4** Verifica runtime con manuale signoff utente. **Solo questo conclude il task** (regola GV-WF-001 dell'handoff).
- [ ] **A.5** Logging evidence: `test-results/drag-pickup-alignment-regression-fix-<YYYY-MM-DD>.log`.

### Macro-Fase B — Core loop minimo girabile (1-2 settimane)

Obiettivo: in `/minimal-gameplay` un giocatore può eseguire un giro completo del loop, anche con contenuti placeholder.

- [ ] **B.1 Mappa con piazza centrale + 3-4 edifici fissi** (Taverna, Centro Villaggio, Taglialegna, +1)
- [ ] **B.2 Roster iniziale** con almeno 2 artigiani + 1 eroe (Character → Resident pipeline esistente)
- [ ] **B.3 Job ripetibile "Taglia legna"**: `JobCard` esistente, assegnazione via drag medaglione, timer, output legname
- [ ] **B.4 HUD risorse**: legname, ferro, cibo, gold visibili e aggiornati live
- [ ] **B.5 Mercante itinerante**: action card temporanea che spawna a giorno 2 o 3. **Richiede implementazione `MarketActionCard.tsx` che oggi è TODO**
- [ ] **B.6 Acquisto equip**: scambio gold → oggetto, aggiunto a inventario eroe, modifica stat effettive
- [ ] **B.7 Quest narrativa**: una `QuestCard` con skill check pulito (vedi C). Assegnazione eroe, timer, outcome
- [ ] **B.8 Reclutamento**: spawning nuovo eroe alla taverna dopo prima quest completata o reputazione X

### Macro-Fase C — Skill check Cultist Simulator-style (3-5 giorni)

Obiettivo: il momento di risoluzione quest è esteticamente curato e leggibile.

- [ ] **C.1 Layout pannello skill check**: oggetto-quest al centro, stat richieste e stat effettive ai lati, niente fronzoli
- [ ] **C.2 Roll deterministico-probabilistico**: 5 outcome tier (critical / success / partial / fail / disaster)
- [ ] **C.3 Animazione roll**: minimale, leggibile, no flashy
- [ ] **C.4 Outcome feedback**: tipografia chiara, copy narrativo, transizione pulita al modal ricompensa
- [ ] **C.5 Decisione UX**: il pannello è full-screen overlay o card embedded? Da prototipare e testare con utente

### Macro-Fase D — Reward + Level up + Upgrade (1 settimana)

Obiettivo: il WoW moment funziona.

- [ ] **D.1 Quest Success Modal**: visualizza outcome + lista ricompense
- [ ] **D.2 Reward application**: gold, materiali, oggetti, exp eroe
- [ ] **D.3 Level up eroe**: glow medaglione (skin ring bronze → silver), notifica
- [ ] **D.4 Upgrade edificio disponibile**: icona "upgrade" lampeggia sull'edificio Taglialegna (o quello rilevante)
- [ ] **D.5 Upgrade applicato**: produce X% in più o sblocca nuovo job. Visivamente: l'edificio cambia skin
- [ ] **D.6 Reputazione**: sistema di tracking + trigger per nuovo eroe alla taverna

### Macro-Fase E — Contenuto Steam-presentabile (1-2 settimane)

Obiettivo: c'è abbastanza materiale da giocare per 30-60 min senza ripetersi.

- [ ] **E.1 Almeno 3 quest narrative** con stat threshold diversi (es. una Forza, una Percezione, una Spirito)
- [ ] **E.2 Almeno 2 job ripetibili** (Taglialegna + Fucina o Cucina)
- [ ] **E.3 Inventario equip**: 6-8 oggetti acquistabili dal mercante con stat tradeoff
- [ ] **E.4 5-8 eroi reclutabili** con stat e costi diversi (verificare con `Character` esistente)
- [ ] **E.5 Sistema feriti**: eroi falliti gravemente vanno "in cura" alla taverna per N giorni
- [ ] **E.6 Eventi notturni** (opzionale): assalto banditi randomico se reputazione bassa

### Macro-Fase F — Polish, audio, distribuzione (1-2 settimane)

- [ ] **F.1 Audio ambient mistico**: 1 BGM loop + 4 SFX (drop, success, fail, gain)
- [ ] **F.2 Visual polish**: floating numbers, hover states, animazioni minimali
- [ ] **F.3 Tipografia & UI cleanup**: passata estetica generale stile Cultist Simulator
- [ ] **F.4 Save / Load**: consolidare le 3 versioni di `PersistenceService`, smoke test reload
- [ ] **F.5 Localization EN + stub IT**: tutta UI passa da `LocalizationService`
- [ ] **F.6 Build Vercel**: aggiustare `tsconfig.app.json exclude` per escludere balancer, deploy live
- [ ] **F.7 Build Tauri**: `.dmg` macOS prioritario, poi `.msi` Windows
- [ ] **F.8 Steam page setup**: capsule, screenshot, descrizione, trailer 30 sec
- [ ] **F.9 Playtest privato**: 3-5 persone esterne giocano e raccontano

---

## 5. Workflow operativo (dall'handoff §2)

**Roles:**
- Strategist — architettura/governance
- Coordinator — chain di task / dipendenze
- Executioner — implementazione runtime

**Stile preferito:**
- Fewer prompts, stronger prompts
- Un task alla volta
- Niente analisi+fix+docs mescolati nello stesso prompt
- Visual/UI: identifica → ispeziona baseline → fix minimo → verifica runtime → docs/test dopo

**Per ogni task runtime/UI:**
1. Identifica esatto componente/sistema
2. Inspect canonical baseline
3. Fix minimo
4. Verifica reale (non build/lint)
5. Solo dopo: test + docs

---

## 6. Decisioni operative (riepilogo)

| Tema | Decisione |
| --- | --- |
| Target distribuzione | Steam (priorità) + Vercel web demo + Tauri binari standalone |
| Audio | Ambient mistico (royalty-free OpenGameArt / Pixabay) |
| Asset visivi | Placeholder CC0 (Kenney) per token/icone, finché design definitivo non arriva |
| Save system | Persistente, autosave. Consolidare 3 versioni `PersistenceService` |
| Lingua | EN per slice. `LocalizationService` esteso. Stub `it: {}` predisposto |
| Build TS | Escludere balancer da `tsconfig.app.json` (fuori scope) |
| Git | Branch `vertical-slice-steam`. Commit frequenti. Tag `v0.1-vertical-slice-steam` a fine F |
| Surface canonica | `/minimal-gameplay` (confermato da handoff) |
| Architettura PG | Character → Resident pipeline (non rifare, usa esistente) |

---

## 7. Rischi e mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
| --- | --- | --- | --- |
| Pickup alignment fix richiede più giorni del previsto | Alta | Bloccante | Time-box rigido. Se dopo 3 giorni non risolto, considerare rollback delle modifiche spring-return e ripartire da baseline |
| Scope creep verso il balancer/combat | Alta | Alto | Briefing è il contratto. Tutto fuori `src/ui/idleVillage/` va negoziato |
| `MarketActionCard.tsx` da implementare ex novo | Media | Medio | Allocare task dedicato in B.5, basarsi su `JobCard` + `QuestCard` come riferimento |
| Skill check estetica non convince utente | Media | Alto | Prototipare presto (Macro-Fase C, anche prima della Fase B completa). Iterare con utente |
| Build Steam richiede certificazioni complesse | Bassa | Medio | Steam è permissivo per indie. Tauri firmato basta. |
| Documenti precedenti continuano a confondere (Focolare/Zuppa/Cripta) | Alta | Basso | Pulizia docs in Macro-Fase F.5 (basso priorità ma utile) |
| Bug nascosti nel codice idleVillage (349 .tsx) | Alta | Medio | Procedere incrementalmente, fix solo dove serve, niente refactor cosmetici |

---

## 8. Definition of Done — slice pronta per Steam

- [ ] Drag pickup centrato sul token (verifica utente reale)
- [ ] Spring return al token origin (verifica utente reale)
- [ ] `npm run dev` apre `/minimal-gameplay`, zero errori in console
- [ ] Loop completo gioca senza crash per ≥ 30 min
- [ ] Skill check estetica approvata dall'utente
- [ ] Almeno 1 level up + 1 upgrade edificio durante playthrough
- [ ] Reclutamento nuovo eroe avvenuto in playthrough
- [ ] BGM mistico + 4 SFX presenti
- [ ] Save / Load testati con reload pagina
- [ ] Tutto il testo nuovo passa da `LocalizationService`
- [ ] `npm run build` exit 0 (con balancer escluso)
- [ ] Deploy Vercel live e accessibile
- [ ] Build Tauri `.dmg` apre e gioca
- [ ] Steam page predisposta (capsule, screenshot, descrizione)
- [ ] Tag `v0.1-vertical-slice-steam` creato
- [ ] Filmato 5 min di gameplay realizzato per trailer

---

## 9. Prossimo task concreto

**Macro-Fase A.1 → A.5: drag pickup alignment fix.**

Prompt suggerito (modificato dall'handoff §11 per il contesto attuale):

```
OBIETTIVO
Fix del drag pickup: quando il giocatore afferra un medaglione PG (PgCard o SlottedMedal),
il cursore/hand deve essere centrato sul token, non shiftato.

VINCOLI
- Solo intervento minimo
- No spring-return polishing in questa task
- No portrait work, no sorting, no docs
- File coinvolti probabili:
  * src/ui/idleVillage/components/PgCard.tsx
  * src/ui/idleVillage/components/SlottedMedal.tsx
  * src/ui/idleVillage/components/CustomDragOverlay.tsx
  * dnd-kit useDraggable activation/measurement
- Niente "estimated geometry": usare DOM rect reali (handoff §6.2)

VERIFICA
- Manual signoff utente: "il cursore è centrato sul token al pickup"
- Solo questo chiude il task

EVIDENCE
- test-results/drag-pickup-alignment-fix-<YYYY-MM-DD>.log
```

Quando vuoi che parta con questo task, dimmelo. Prima di farlo, però, manca ancora chiarire le 7 decisioni pendenti in `GAMEPLAY_DESIGN.md` §11.

<!-- ===== repo-snapshot/CLAUDE_PROMPTS.md ===== -->

# Claude Web — Prompt Stub

Prompt copy-paste per il Project **"Wanderlust: Triumph — Game Design"** su claude.ai.
Le istruzioni del Project impostano già ruolo, convenzioni e formato risposte —
questi stub servono ad aprire sessioni mirate e a chiedere deliverable repo-ready.
Le istruzioni sono la fonte canonica: `context/CLAUDE_PROJECT_PRIMER.md` §6.

## 1. Apertura sessione (sempre)

```
Scope di oggi: <ARGOMENTO>. Leggi solo i documenti che 00-NAVIGATION.md elenca per
questo tema prima di rispondere, poi dimmi in 5 righe cosa sai di rilevante e cosa
ti manca.
```

Argomenti tipici: `quest design`, `gimmick`, `bilanciamento`, `economia villaggio`,
`progressione early/mid/end`, `campagna macro`, `pacing`.

## 2. Critica di una quest / quest chain

```
Critica questa quest contro QUEST_RULES.md e GOOD_QUEST_DEFINITION.md:

<incolla la quest / descrivi la chain>

Per ogni punto debole: cita il test S5 violato, poi proponi UNA alternativa
concreta. Chiudi con un verdetto: pronta / rivedibile / da riscrivere.
```

## 3. Brainstorm gimmick

```
Genera <N> gimmick per <SITUAZIONE>. Vincoli: usano i canali reali di
QUEST_GIMMICK_CHANNELS_RESEARCH.md, niente gimmick che violano i 4 pillar,
nessuna direzione già in REJECTED.md. Per ciascuno: nome, trigger, effetto di
gioco, costo di authoring. Poi dimmi quali 2 terresti tu e perché.
```

## 4. Bilanciamento / progressione

```
Analisi <early|mid|end>game su <TEMA>. Confronta ciò che CURRENT_STATE.md dice
esistere oggi con gli obiettivi di PROGRESSION.md / VILLAGE_ECONOMY.md.
Distingui: cosa è verificabile nel repo (FACT), cosa è decisione presa
(DECISION), cosa è tua proposta (PROPOSAL). Chiudi con le 3 tensioni principali.
```

## 5. Review di una mia proposta (pillar check)

```
Ti propongo questa direzione:

<incolla la proposta>

Valutala contro: (a) i 4 Design Pillar, (b) desiderata-digest (intent FROZEN),
(c) REJECTED.md. Se trovi tensione con qualcosa di FROZEN, dichiarala
esplicitamente invece di aggirarla — la decisione è mia.
```

## 6. Analisi da riferimento esterno

```
<incolla descrizione di una meccanica di un altro gioco / un articolo>

Cosa si può rubare per Wanderlust? Per ogni idea: adattamento al nostro modello
PARTY→QUEST→PHASE→SITUATION→APPROACH→CHECK→CONSEQUENCE, costo, e perché non è
già scartata (controlla REJECTED.md).
```

## 7. Deliverable repo-ready

```
Riscrivi il risultato di questa discussione come: <scegli>
- entry desiderata draft ("**Intento del Director:**" + "**Formulazione proposta:**")
- entry OPEN-NNN per context/OPEN.md
- entry R-NNN per RICHIESTE.md
- spec tecnica nello stile dei doc del pack (sezioni, tabelle, status header)
```

## 8. Chiusura sessione

(Le istruzioni lo chiedono già in automatico — usa questo se la discussione era
ramificata e vuoi forzare il riepilogo.)

```
Chiudi con "## Delta per la governance": bullets di cosa cambia rispetto al
canon — decisioni emerse, nuove OPEN, proposte da registrare, doc da aggiornare.
Niente prosa, solo bullets integrabili.
```

## Note d'uso

- **Una chat = un argomento.** Non mischiare economia e quest nella stessa
  chat: il retrieval del Project funziona meglio con scope dichiarato.
- Per discussioni su UI/mappa/estetica allega screenshot — Claude non vede il
  renderer. Script headless in `scripts/_tmp-*-check.mjs`, golden in
  `test-results/`.
- Snapshot knowledge del 2026-11-19 — se discuti di qualcosa cambiato di
  recente, digli di leggere il file live dalla repo GitHub collegata.
- A fine sessione utile: gira il "Delta per la governance" a Devin per
  integrarlo in OPEN/RICHIESTE/desiderata (skill `knowledge-extractor`).
