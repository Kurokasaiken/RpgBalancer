# Current State — RpgBalancer

**Ultimo aggiornamento:** 2026-08-31
**Superficie canonica:** `/minimal-gameplay`
**Repo remoto:** `https://github.com/Kurokasaiken/RpgBalancer`

## Stato di sintesi

Il progetto è un **Village/incremental management RPG con drag & drop**, con un laboratorio di combat/balancing integrato. La superficie di runtime canonica è `/minimal-gameplay`; il lavoro attivo è su Idle Village, World Surface e POI Quest. Il core loop completo non è ancora assemblato.

Questa è una fotografia; per lo stato più aggiornato verificare `RICHIESTE.md`, `VERTICAL_SLICE_PROGRESS.md` e i test.

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
- Sistema `Mind Weaver`: `AGENTS.md`, `.mw/desiderata.md`, `RICHIESTE.md`, `context/DECISION_LOG.md`, skill cross-IDE.

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
