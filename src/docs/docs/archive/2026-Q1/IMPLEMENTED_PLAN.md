---
status: superseded
superseded_by: docs/IMPLEMENTED_PLAN.md
---

# IMPLEMENTED PLAN – Stato Attuale del Progetto

> Panoramica sintetica di cosa è **implementato**, cosa è **mock/demo** e cosa è solo **plan**, con link ai documenti originali.

---

## Legend

- ✅ **Implementato** – presente nel codice e usato (CLI o UI)
- 🧪 **Parziale / Tech demo** – codice esiste ma non è integrato o completo
- 🎨 **Mock / UI only** – solo mockup o pagina demo, senza logica completa
- 📋 **Solo plan** – esiste solo come documentazione

---

## 1. Core Balancing & Combat Simulation

### 1.1 Combat Simulation Testing System

- **Engine Monte Carlo 1v1**  
  - Stato: ✅ Implementato  
  - Plan: `docs/plans/combat_simulation_plan.md`  
  - Tasks: `docs/plans/combat_simulation_tasks.md` (Phase 1 quasi tutta `[x]`)  
  - Codice chiave (indicativo): `src/balancing/simulation/*`, test sotto `__tests__`  
  - Note: motore deterministico + regression pack già presenti.

- **CLI `calibrate`**  
  - Stato: ✅ Implementato (manca solo export avanzato da CLI)  
  - Tasks: vedi sezione 3.x in `combat_simulation_tasks.md` (comandi creati, export file option ancora `[ ]`).

- **Analysis Tools avanzati (StatValueAnalyzer esteso, ResultsExporter)**  
  - Stato: 🧪 Parziale (struttura base esiste, alcune checkbox `[x]`, export/report completa `[ ]`)  
  - Plan: `combat_simulation_plan.md` (§ Phase 2).

- **Simulation UI Dashboard (tab “Simulation”)**  
  - Stato: 📋 Solo plan (nessun `CombatSimulationDashboard.tsx` presente in `src/ui/testing`)  
  - Plan/Tasks: `combat_simulation_plan.md`, `combat_simulation_tasks.md` (Phase 4 tutta `[ ]`).

---

## 2. Archetype System

### 2.1 Archetype Data Model & Builder

- **ArchetypeTemplate, ArchetypeBuilder, ArchetypeRegistry**  
  - Stato: ✅ Implementato  
  - Plan: `docs/plans/archetype_balancing_plan.md` (Phase 1–2)  
  - Tasks: `docs/plans/archetype_tasks.md` (Week 6–7 quasi tutte `[x]`)  
  - Codice chiave: `src/balancing/archetype/types.ts`, `ArchetypeBuilder.ts`, `ArchetypeRegistry.ts` + relativi test.

- **Frontend Archetype Builder & Manager**  
  - Stato: ✅ Implementato  
  - Plan/Tasks: `archetype_tasks.md` (Phase 2.1–2.2 `ArchetypeBuilder.tsx`, `ArchetypeList.tsx`, `ArchetypeManager.tsx` marcate `[x]`)  
  - Codice chiave: `src/components/balancing/archetype/*` (builder, lista, dettaglio, manager).

### 2.2 TTK Matrix & Batch Testing

- **TTKTestRunner, TTKValidator, BatchTestRunner, ReportGenerator**  
  - Stato: ✅ Implementato a livello di motore e report di base  
  - Tasks: `archetype_tasks.md` Phase 3.1–3.2 quasi tutte `[x]` (mancano solo alcune voci “handle errors gracefully / aggregated results”).

- **CLI di alto livello per archetype balancing + tuning iterativo**  
  - Stato: 📋 Solo plan  
  - Tasks Phase 3.3 (`Archetype CLI`, tuning iterativo, relativi test) tutte `[ ]`.

### 2.3 Archetype Analytics UI (Heatmap, Radar, Dashboard completa)

- **WinRateHeatmap, TTKLineChart, ArchetypeRadar, ArchetypeDashboard**  
  - Stato: 📋 Solo plan (componenti non presenti in `src/components/balancing/archetype/`)  
  - Plan/Tasks: `archetype_tasks.md` Week 8–9 (`Phase 4–5`) tutte `[ ]`.

- **WeightRefiner & CI automation**  
  - Stato: 📋 Solo plan (file `WeightRefiner.ts`, script CI per archetype-tests non presenti)  
  - Tasks Phase 6.x tutte `[ ]`.

---

## 3. 1v1 Combat Polish

- **DoT / Buff / Debuff / Shield integrazione nel combat engine**  
  - Stato: ✅ Implementato  
  - Tasks: `docs/plans/1v1_tasks.md` – Phase 1.x segnate ✅ (moduli `dot.ts`, `buffs.ts`, integrazione nel motore, test consistenza).

- **Auto-calibrazione pesi (WeightCalibration)**  
  - Stato: ✅ Implementato (tests `WeightCalibration.test.ts`)  
  - Tasks Phase 4.1 `[x]`.

- **Mana System, Status Effects strutturati, Combat Modifiers, log avanzato, ottimizzazioni performance**  
  - Stato: 📋 Solo plan (o prototipi parziali in `engine/combat/**`)  
  - Tasks Phase 2–3 in `1v1_tasks.md` sono quasi tutte `[ ]`.

---

## 4. Spell System & Atomic Evolution

- **Weight-Based Spell Creator (UI moderna + Fantasy)**  
  - Stato: ✅ Implementato e usato  
  - Plan: `docs/plans/atomic_evolution_plan.md`  
  - Tasks: `docs/plans/atomic_evolution_tasks.md` (quasi tutte le voci relative a SpellCreation, EnhancedStatSlider, SpellIdentityCard, ActionsBar sono `[x]`)  
  - Codice chiave: `src/ui/spell/SpellCreation.tsx`, `src/ui/fantasy/FantasySpellCreation.tsx`, `src/ui/spell/components/*`, `src/ui/atoms/*`.

- **Glassmorphic / Atomic UI atoms (GlassCard, GlassButton, GlassInput, GlassSlider, ErrorBoundary)**  
  - Stato: ✅ Implementato  
  - Tasks Phase 4: tutte `[x]` (cartella `src/ui/atoms/`, `ErrorBoundary`).

- **WeightBasedCreator template generico**  
  - Stato: ✅ Implementato  
  - Tasks Phase 5: `Create WeightBasedCreator template` marcato `[x]`.

- **ItemCreator & CharacterCreator basati su WeightBasedCreator**  
  - Stato: 📋 Solo plan  
  - `atomic_evolution_tasks.md`: `Implement ItemCreator` e `Implement CharacterCreator` sono `[ ]`  
  - Plan dedicato: `docs/plans/item_creator_plan.md`.

---

## 5. Combat Expansion (Grid, Multi-Unit, AoE)

- **1v1 foundation (prima della griglia)**  
  - Stato: ✅ implementata (vedi 1v1 tasks sopra).

- **Initiative, StatusEffectManager, GridCombatSimulator, AIController, AoE, team synergies**  
  - Stato: 🧪 Parziale / sperimentale  
  - Plan: `docs/plans/combat_expansion_plan.md`  
  - Codice: esistono alcuni moduli in `src/engine/grid/**` e `src/engine/ai/**`, ma **non risultano integrati come esperienza UI completa** e diversi punti del plan (es. test scenario 5v5/5v10/5v1) non hanno un corrispettivo completo.

---

## 6. Scenario Configuration UI

- **Scenario Configuration UI (ScenarioCard, contextWeights, integrazione nel Balancer)**  
  - Stato: 📋 Solo plan  
  - Plan: `docs/plans/scenario_ui_plan.md`  
  - Tasks: `docs/plans/scenario_ui_tasks.md` → **0/38 completate**, nessun file `src/ui/scenario/*` o `balancing/contextWeights.ts` presente.

---

## 7. Universal Creators (Item / Character)

- **ItemCreator**  
  - Stato: 📋 Solo plan  
  - Plan: `docs/plans/item_creator_plan.md`  
  - Implementazione (`src/ui/items/ItemCreator.tsx`, `itemStatDefinitions.ts`) non presente.

- **CharacterCreator basato su WeightBasedCreator**  
  - Stato: 📋 Solo plan / parziale  
  - Esiste un `CharacterCreator` nella UI (`src/ui/character/CharacterCreator.tsx`), ma **non segue ancora completamente il pattern WeightBasedCreator descritto nel plan**.

---

## 8. Fantasy / Theming / UI

- **Fantasy UI Enchanted Grove (vecchio tema)**  
  - Stato: 🎨 Storico / in parte superato  
  - Plan: Phase 8 nel `MASTER_PLAN.md` (Enchanted Forest, wood/parchment)  
  - Codice: `docs/FANTASY_UI*`, `src/styles/fantasy-theme.css`, alcuni componenti fantasy originali.

- **Nuovo tema Gilded Observatory (obsidian/ivory/teal/gold)**  
  - Stato: ✅ Implementato come tema effettivo dell’app (Tailwind + CSS + layout fantasi)  
  - Non ancora pienamente riflesso nel MASTER_PLAN (che parla ancora di Enchanted Forest come tema principale).

---

## 9. Sintesi per fase (rispetto al MASTER_PLAN)

- **Phase 1: Foundation Systems** – ✅ sostanzialmente completata (come descritto nel MASTER_PLAN).
- **Phase 2: Archetype Balancing** – ✅ motore + runner + report base, UI analytics avanzata ancora 📋 plan.
- **Phase 3: Scenario UI** – 📋 completamente plan (nessuna implementazione).
- **Phase 4: Atomic Evolution** – ✅ core completato (Spell Creator, atoms, error boundary), WeightBasedCreator creato.
- **Phase 5: Universal Creators** – 🧪 parziale (template creato, Item/Character creator mancanti).
- **Phase 6: Logic Separation / 1v1 Polish** – 🧪 base completa (DoT/buff/shield, auto-calibration), mana/status/modifiers ancora 📋.
- **Phase 7: Persistence** – da verificare in dettaglio (localStorage per alcuni moduli esiste, ma l’intero “BalanceConfigStore” del MASTER_PLAN è ancora 📋 in parte).
- **Phase 8: Fantasy UI** – ✅ implementata, ma con tema aggiornato (Gilded Observatory) rispetto a Enchanted Grove.
- **Phase 9: Combat Expansion (Grid)** – 🧪 fondamenti parzialmente presenti in codice, ma non completati come sistema full grid+AI+UI.

---

## 10. Phase 10: Config-Driven Balancer (In Progress)

**Status:** 🔥 In Planning → Implementation  
**Plan:** [plans/config_driven_balancer_plan.md](plans/config_driven_balancer_plan.md)  
**Tasks:** [plans/config_driven_balancer_tasks.md](plans/config_driven_balancer_tasks.md)

### Obiettivo
Trasformare il Balancer in un sistema completamente configurabile da UI:

- **Card** (moduli di combattimento) creabili, rinominabili, riordinabili, eliminabili
- **Stat** aggiungibili dentro le card con nome, peso, min/max/step, valore default
- **Formule derivate** creabili/editabili con validazione real-time
- **Core** (hp, damage, htk) sempre presente, non eliminabile
- **Persistenza** in localStorage; ultimo salvataggio = default
- **History/Undo** (ultimi 10 stati)
- **Drag & drop** card con handle dedicato

### Stato Implementazione

| Componente | Stato |
|------------|-------|
| Schema TypeScript + Zod | 📋 Plan |
| Default Config (Core hardcoded) | 📋 Plan |
| Formula Engine (parser/validator) | 📋 Plan |
| BalancerConfigStore (localStorage) | 📋 Plan |
| useBalancerConfig Hook | 📋 Plan |
| CardEditor Drawer | 📋 Plan |
| StatEditor Drawer | 📋 Plan |
| FormulaEditor | 📋 Plan |
| Drag & Drop (@dnd-kit) | 📋 Plan |
| Balancer Integration | ✅ Completed |

---

## 11. Prossimi passi suggeriti per la documentazione

1. ✅ Aggiornato `docs/MASTER_PLAN.md` con Phase 10 come focus attivo.

2. Archiviare in `docs/archive/` i plan/spec che descrivono solo vecchie scelte estetiche o flussi ormai sostituiti (es. alcuni documenti di Enchanted Forest, eventuali vecchi piani UI superati dal tema Gilded).

3. Per le aree ancora 100% plan (Scenario UI, ItemCreator, parte della Combat Expansion), mantenere i documenti ma segnare esplicitamente nel MASTER_PLAN che sono **non implementati** e opzionali.

4. Dopo Config-Driven Balancer, applicare lo stesso pattern a Spell Creator.
