# Phase 11: Tactical Engagement Missions - Implementation Plan

**Status:** Planning  
**Type:** Tactical Layer / Mission System  
**Depends On:** Phase 9 (Combat Expansion), Phase 3 (Scenario UI), Phase 10 (Config-Driven Balancer)

---

## 1. Overview

Obiettivo di questa fase è introdurre un **tactical layer stile XCOM** sopra il sistema di combat esistente:

- Missioni di **ingaggio tattico** su griglia (trovi i nemici, decidi come avvicinarti, gestisci coperture e AP).
- Sistema di **movement + action economy** (AP) configurabile, integrato con le stat e i moduli di balancing.
- **Mission config** riusabili come scenari per simulazioni e analisi di bilanciamento.

Questa fase **non** è focalizzata sul contenuto (campagna, storia), ma sulla **struttura tecnica** del tactical layer e sulla sua integrazione con il Balancer.

---

## 2. Goals

- **Config-First Tactical Layer**: nessuna logica magica nei componenti UI; missioni, azioni e parametri vivono in `src/balancing/config/*`.
- **Engagement Missions**: supporto nativo per missioni di eliminazione/ingaggio ("trova ed elimina tutti i nemici") come primo tipo di missione.
- **Reusable Mission Config**: le missioni diventano preset configurabili e riusabili per simulazioni Monte Carlo.
- **No Regression**: non rompere 1v1, grid combat esistente o le fasi già completate.

---

## 3. Architecture Overview

### 3.1 High-Level

```text
Phase 9: Combat Expansion
  └─ GridCombatSimulator, RangeCalculator, AIController, AoEModule, A*

Phase 11: Tactical Engagement Missions (THIS)
  ├─ Tactical Domain & Config (11.1)
  ├─ AP & Tactical Turn Engine (11.2)
  ├─ Fog of War & Detection (11.3)
  ├─ Mission Runner & Objectives (11.4)
  ├─ Tactical Mission UI (11.5)
  └─ Tactical Simulation Hooks (11.6)
```

### 3.2 Core Concepts

- **Tactical Actions**: `move`, `attack`, `overwatch`, `hunker`, `interact`, ecc. con costi AP e requisiti.
- **Cover & Terrain**: metadata per tile (none/half/full cover, high ground, difficult terrain).
- **Vision & Detection**: campo visivo e line of sight basati su `RangeCalculator`.
- **Mission Config**: definisce mappa, squadre, obiettivi e regole (turn limit, reinforcements, ecc.).
- **Mission Runner**: esegue turni tattici usando le config e il combat engine esistente.

---

## 4. Phase 11.1 – Tactical Domain & Config (Step 1)

**Obiettivo:** definire il **modello di dominio** e la **configurazione centrale** per il tactical layer, senza ancora implementare la logica di simulazione.

### 4.1 Domain Types (Engine Layer)

File target: `src/engine/game/tactical/TacticalTypes.ts`

- **Tactical Actions**
  - `TacticalActionKind`: union di stringhe (`move`, `attack`, `overwatch`, `hunker`, `interact`, `ability`).
  - `TacticalActionDefinition`: id, kind, label, descrizione, `baseApCost`, range min/max opzionale, flag `requiresLineOfSight`, `endsTurn`, ecc.
- **Cover & Terrain**
  - `CoverType`: `none | half | full`.
  - `TileTerrainType`: `normal | highGround | lowGround | difficult | hazard`.
- **Visibility**
  - `VisibilityState`: `unknown | fogged | visible`.
- **Mission Structure** (runtime)
  - `TacticalMissionKind`: include almeno `engagement` (elimina tutti i nemici), estendibile.
  - `TacticalObjectiveType`: `eliminateAllEnemies`, `extractUnit`, `survive`, `reachArea`, ecc.
  - `TacticalObjectiveConfig` (runtime-friendly): id, type, descrizione, flag `isPrimary`.
  - `TacticalSquadMemberRef`: riferimento a archetype/personaggio (string id) + spawn opzionale.
  - `TacticalSquadConfig`: id, team (`player`/`enemy`), membri.
  - `TacticalMissionConfig` (runtime view): id, name, kind, mapId, squads, objectives, `turnLimit?`, `allowReinforcements?`.

### 4.2 Config Types (Config Layer)

Estendere `src/balancing/config/types.ts` con interfacce di configurazione tattica (senza logica):

- `TacticalActionConfig`: equivalente config-driven di `TacticalActionDefinition` (id, label, description, apCost, range, flags).
- `TacticalObjectiveConfig`: id, type, descrizione, `isPrimary`.
- `TacticalSquadMemberConfig`: id del reference (archetype / saved character) + info spawn opzionali.
- `TacticalSquadConfig`: id, label, team, membri.
- `TacticalMissionConfig`: id, name, kind, mapId (string), squads, objectives, turnLimit opzionale.

> Nota: in questa fase **non** si estende ancora `BalancerConfig`. La config tattica vive in un modulo separato.

### 4.3 Tactical Config Skeleton

File target: `src/balancing/config/tacticalConfig.ts`

- `TACTICAL_ACTIONS`: `Record<string, TacticalActionConfig>`
  - Definire almeno:
    - `move`: 1 AP, nessun LoS richiesto, nessun danno.
    - `attack`: 2 AP, richiede target + LoS, usa le formule esistenti di combat (in fasi successive).
    - `overwatch`/`hunker`: placeholder con AP cost definito ma senza logica.
- `TACTICAL_MISSIONS`: `Record<string, TacticalMissionConfig>`
  - Definire almeno una missione tipo **"engagement"**:
    - Mappa placeholder (`mapId: 'test-urban-engagement'`).
    - Squadra player vs squadra nemica con 2–3 reference a archetypes/personaggi.
    - Obiettivo primario: `eliminateAllEnemies`.

**Deliverables Fase 11.1**

- [ ] Nuovo piano `tactical_missions_plan.md` (questo file).
- [ ] Tipi di dominio tattico definiti in `TacticalTypes.ts`.
- [ ] Tipi di config tattica aggiunti in `config/types.ts`.
- [ ] Skeleton config in `tacticalConfig.ts` con almeno 1 missione di ingaggio.

*(Le checkbox sono linee guida interne per questa fase; la vera checklist operativa vivrà in `plans/tactical_missions_tasks.md` quando verrà creata.)*

---

## 5. Phase 11.2 – AP & Tactical Turn Engine

**Obiettivo:** introdurre un **turn engine a punti azione** sopra `GridCombatSimulator`.

- Definire un `TacticalTurnEngine` (pure TypeScript) in `src/engine/game/tactical/` che:
  - Assegna AP alle unità all'inizio del turno.
  - Valida ed applica azioni tattiche usando `TACTICAL_ACTIONS` (nessun costo hardcoded).
  - Chiama `GridCombatSimulator` per risolvere attacchi/spell.
- Invarianti:
  - Nessuna azione eseguita senza AP sufficiente.
  - Stato di AP tracciato nel turno e persistito in uno state tattico.

Output atteso: API pura che, dato uno stato + una `TacticalAction`, restituisce un nuovo stato e log di eventi.

---

## 6. Phase 11.3 – Fog of War & Detection

**Obiettivo:** modellare **visibilità**, campo visivo e attivazione dei nemici.

- Strutture dati per:
  - `VisibilityState` per tile e unità, per team.
  - Storico `lastSeen` opzionale.
- Funzioni pure per:
  - Calcolo tile visibili per una unità o per una squadra.
  - Aggiornamento stato di visibilità a inizio/fine turno.
  - Attivazione di pod nemici alla prima vista (da "patrol" a "engaged").

Nessuna UI ancora; solo motore e tipi.

---

## 7. Phase 11.4 – Mission Runner & Objectives

**Obiettivo:** trasformare una `TacticalMissionConfig` in una simulazione eseguibile end-to-end.

- `TacticalMissionRunner`:
  - Inizializza griglia, squadre e stato tattico da una `TacticalMissionConfig`.
  - Esegue il loop di turni usando `TacticalTurnEngine`.
  - Valuta obiettivi (success/fail) basati su `TacticalObjectiveConfig`.
  - Produce un `TacticalMissionResult` serializzabile (turni, outcome, metriche principali).

Questa parte è il "bridge" tra config e simulazioni.

---

## 8. Phase 11.5 – Tactical Mission UI

**Obiettivo:** creare una vista UI compatta stile **Gilded Observatory** per giocare/rivedere missioni tattiche.

- Nuova pagina, ad es. `TacticalMissionPage.tsx` (posizione da definire: probabilmente sotto `src/ui/fantasy/` o `src/ui/game/`).
- Reuse di `CombatGrid` / `FantasyGridArena` con estensioni:
  - Highlight delle tile raggiungibili in questo turno (AP-based).
  - Indicazione di cover/terrain sulle tile.
  - Indicatori di visibilità/FoW.
  - Pannello obiettivi e log missione.
- Nessuna formula di combat in React: la pagina chiama solo engine/hooks.

---

## 9. Phase 11.6 – Tactical Simulation Hooks & Balancing

**Obiettivo:** usare le missioni tattiche come **banchi di prova** per il balancing.

- Runner di simulazioni che:
  - Prende una `TacticalMissionConfig`.
  - Lancia N simulazioni (seeded) usando `TacticalMissionRunner`.
  - Aggrega metriche (winrate, TTK, danno preso, turni fino al primo ingaggio, ecc.).
- Integrazione con futuro **Stat Stress Testing (Phase 10.5)**:
  - Possibilità di lanciare stress test su missioni tattiche selezionate.

Output: API e/o servizi che possano essere chiamati da CLI, UI o test.

---

## 10. Dependencies & Non-Goals

### 10.1 Dependencies

- **Phase 9:** Grid combat, A*, RangeCalculator, AI di base – già esistenti e riusati.
- **Phase 3:** Scenario UI – potenziale integrazione futura per selezionare missioni e scenari.
- **Phase 10:** Config-Driven Balancer – fonte principale di stat e pesi.

### 10.2 Non-Goals (per Phase 11)

- Campagna completa o meta-game (base building, città, ecc.).
- Tool di authoring UI per missioni tattiche (potrà venire dopo come extension del Scenario UI plan).
- Sistema completo di IA avanzata (coperture perfette, flanking complesso, ecc.) oltre a quanto richiesto dallo scope minimo di ingaggio.

---

## 11. Success Criteria

- ✅ Tutti i valori tattici (AP cost, tipi di azione, missioni) sono definiti in config centralizzate, non in engine/UI.
- ✅ Esiste almeno una missione di ingaggio `engagement` giocabile/simulabile end-to-end.
- ✅ Il tactical layer usa i moduli di balancing esistenti (hit chance, crit, mitigation) senza duplicare formule.
- ✅ È possibile lanciare simulazioni automatizzate su una missione tattica per misurare metriche di bilanciamento.
- ✅ Nessuna regressione ai sistemi di combat esistenti (1v1, grid arena, survival mode).
