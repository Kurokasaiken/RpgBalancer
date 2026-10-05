# Current State — RpgBalancer

**Ultimo aggiornamento:** 2026-10-05
**Superficie canonica:** `/minimal-gameplay`
**Repo remoto:** `https://github.com/Kurokasaiken/RpgBalancer`

## Stato di sintesi

Il progetto è un **Village/incremental management RPG con drag & drop**, con un laboratorio di combat/balancing integrato. La superficie di runtime canonica è `/minimal-gameplay`; il lavoro attivo è su Idle Village, World Surface e POI Quest. Il core loop completo non è ancora assemblato.

Questa è una fotografia; per lo stato più aggiornato verificare `SESSION_HANDOFF.md` (journal), `RICHIESTE.md` e i test. Regola di sync: `.windsurf/rules/70-state-docs-sync.md`.

## Implementato

- React + Vite + TypeScript + Tailwind base.
- `TimeEngine` (day/night, tick, pause).
- `JobResolver`, `QuestResolver`, `QuestEngine`, `QuestPowerEngine`.
- `ProductionEngine`, `EconomyEngine`, `MarketEngine`, `InjuryEngine`, `SurvivalEngine`.
- `CharacterToResidentBootstrap`, `VillageStateStore`, `PersistenceService` (versioni da consolidare).
- `SlottedMedal`, `ActionCardBase`, `ActionHalo`, `JobActionCard`, `QuestActionCard`, `MarketActionCard`.
- `QuestChronicle` (card a fasi, rope, raccolta ricompense).
- `MagicCircleHalo` (iscrizione dalle ore 12, stop + pulsazione).
- `MilestoneCheckModal` con `Destiny Astrolabe V1`.
- `FloatingPanel` per detail / quest card / skill check (pannelli flottanti, spostabili, riducibili a icona).
- `WorldSurfaceRenderer` con layer DOM/Pixi, onde, uccelli, nuvole, parallasse sulle nuvole, `Window` primitivo.
- Sistema di skin/config-first, `IdleVillageConfig` editor, `dynamicConfig.json`.
- Playwright E2E per drag, POI quest, component hub.
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
- Village Screen overlay con blueprint/upgrade.
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

- "Idle Village" page legacy (sostituita da `Village Sandbox`).
- Concetto "Dispatch-like operational map" come modello spaziale canonico (sostituito da `World Surface`).

## Prossimi passi approvati

1. Chiudere la verifica drag pickup.
2. Assemblare il core loop (Macro-Fase B).
3. Consolidare documentazione (Batch 1: CANON, CURRENT_STATE, GLOSSARY; Batch 2: ARCHITECTURE, ART_DIRECTION, WORLD_SURFACE, AGENT_GOVERNANCE).
4. Continuare World Surface secondo R-057.
