# 🎯 RPG Balancer - MASTER PLAN

> **Navigator + Governance** - Single source of truth for project organization

**Last Updated:** 2025-12-02  
**Total Tasks:** 740+ (across dedicated task files)  
**Current Phase:** Phase 10: Config-Driven Balancer (Active)

---

## 📋 DOCUMENTATION GOVERNANCE

### **Separation of Concerns (NO OVERLAP)**

To avoid duplication and inconsistencies:

#### **PLANS (`plans/*_plan.md`)** - Strategy & Design
- **Contains:** Design rationale, architecture, phases, deliverables
- **Does NOT contain:** Detailed checkbox tasks
- **Purpose:** Explain WHAT and WHY
- **Example:** `implementation_plan.md` describes archetype system design

#### **TASKS (`plans/*_tasks.md`)** - Execution Checklist
- **Contains:** ONLY actionable checkbox tasks `- [ ]`
- **Does NOT contain:** Long explanations, design decisions
- **Purpose:** Track WHAT TO DO
- **Example:** `archetype_tasks.md` has 200+ executable checkboxes

#### **Relationship:**
```
implementation_plan.md  (design doc)
    ↓ references ↓
archetype_tasks.md     (200+ checkboxes)
    ↓ links back ↓
implementation_plan.md (for context)
```

### **Update Workflow**

1. **Planning Phase:**
   - Create `*_plan.md` with design + phases
   - Extract tasks → create `*_tasks.md`
   - Link plan ↔ tasks bidirectionally

2. **Execution Phase:**
   - Work from `*_tasks.md` (checkbox by checkbox)
   - Mark `[x]` as complete
   - Update `task.md` (aggregate tracker)

3. **Modification:**
   - Design change? → Update `*_plan.md` first
   - New task? → Add to `*_tasks.md` ONLY
   - Never duplicate same task in multiple files

### **File Naming Convention**

```
plans/
├─ {phase}_plan.md          # Design document
└─ {phase}_tasks.md         # Task checklist

Example:
├─ implementation_plan.md   # Archetype system design
├─ archetype_tasks.md       # Archetype checkboxes
├─ scenario_ui_plan.md      # Scenario UI design
└─ scenario_ui_tasks.md     # Scenario UI checkboxes
```

### **Validation Rules**

✅ **Correct:**
- Plan describes "Phase 1.1: Data Structures (2 days)" with deliverables
- Tasks list `- [ ] Create ArchetypeTemplate interface`

❌ **Incorrect:**
- Plan has checkbox `- [ ] Create interface` (should be in tasks)
- Tasks have long paragraph explaining why (should be in plan)

---

## 📊 OVERALL PROGRESS

```
┌──────────────────────────────────────────────────────┐
│ PHASE                     STATUS      TASKS          │
├──────────────────────────────────────────────────────┤
│ Phase 1: Foundation       ✅ DONE    ~160 tasks     │
│ Phase 2: Archetypes       🔄 ACTIVE  ~200 tasks     │
│ Phase 3: Scenario UI      📋 TODO    ~50 tasks      │
│ Phase 4: Atomic UI        ✅ DONE    ~60 tasks      │
│ Phase 5: Universal        ⏸️ PAUSED  ~40 tasks      │
│ Phase 6: Logic Sep.       📋 TODO    ~30 tasks      │
│ Phase 7: Persistence      ✅ DONE    ~25 tasks      │
│ Phase 8: Fantasy UI       ✅ DONE    ~50 tasks      │
│ Phase 9: Combat Exp.      ✅ DONE    ~100 tasks     │
│ Phase 10: Config Balancer 🔥 ACTIVE  ~140 tasks     │
│ Phase 10.5: Stat Testing  🔥 NEXT    ~80 tasks      │
│ Phase 11: Tactical Miss.  📋 TODO    ~100 tasks     │
│ Phase 12: Idle Village    📋 TODO    ~120 tasks     │
├──────────────────────────────────────────────────────┤
│ TOTAL PROGRESS: ███████████████░░░░░ 75%            │
└──────────────────────────────────────────────────────┘
```

---

## 🎮 COMBAT SYSTEM & ENCOUNTER DESIGN

**Status:** Design Complete  
**Full Specification:** [COMBAT_SYSTEM_DESIGN.md](COMBAT_SYSTEM_DESIGN.md)

### Quick Reference

This project implements a roguelike combat system with:
- **5 Core Archetypes** (Tank, DPS, Assassin, Support, Bruiser)
- **Turn-based grid combat** (1v1 → 5v5 → 5vMany progression)
- **Encounter Check System** (Elite fights with unique mechanics)
- **Drop-based build variability** (adapt to random spell drops)

**Key Design Principles:**
1. **No Perfect Builds** - Players must adapt to available drops
2. **Multiple Solutions** - Each encounter has 2-3 viable strategies
3. **Situational Value** - "Bad" drops can become optimal in specific scenarios
4. **Automated Testing** - All balance validated through 1000+ simulations

**Implementation Phases:**
- Phase 1: Core 1v1 (✅ Complete)
- Phase 2: Advanced Spells & Resources (🔄 In Progress)
- Phase 3: Grid & AI (📋 Planned)
- Phase 4: Multi-Unit & Encounters (📋 Planned)
- Phase 5: Drop System & Polish (📋 Planned)

See full spec for archetype stats, encounter templates, and drop mechanics.

---


---

## 🗺️ DETAILED PLANS & TASKS

### 🔄 **PHASE 2: Archetype Balancing System (Active)**

**Status:** 70% (In Progress)

#### **2.1: Combat Simulation Testing (In Progress)**

| Document | Purpose |
|----------|------------|
| **📋 Plan** | [plans/combat_simulation_plan.md](plans/combat_simulation_plan.md) |
| **✅ Tasks** | [plans/combat_simulation_tasks.md](plans/combat_simulation_tasks.md) |

**Overview:**
- Monte Carlo simulation engine (10k+ combat iterations)
- Statistical analysis (win rates, confidence intervals, TTK)
- Stat value equivalency calculator (HP as currency)
- Turn-based 1v1 combat testing framework

**Status:** Phase 3.2 Complete - Engine & Reporting Ready

#### **2.2: Archetype Definition (Planned)**

| Document | Purpose |
|----------|------------|
| **📋 Plan** | [plans/archetype_balancing_plan.md](plans/archetype_balancing_plan.md) |
| **✅ Tasks** | [plans/archetype_tasks.md](plans/archetype_tasks.md) |
| **🎨 Design** | [design/archetype_system_v2.md](design/archetype_system_v2.md) |

**Nota 2025-12:** Il piano è stato aggiornato con requisiti di authoring completo (CRUD via UI + richieste dirette), persistenza JSON (`data/archetypes.json`) e priorità assoluta per il restyle Gilded Observatory della pagina Archetype Balancer.

**Overview:**
- 16 base archetypes (Tank×5, DPS×4, Assassin×2, etc.)
- TTK-based validation using simulation system
- Interactive dashboard (heatmaps, charts)

#### **2.3: 1v1 Balancing Module (In Progress)**

| Document | Purpose |
|----------|---------|
| **📋 Plan** | [Session da16ef3e: implementation_plan.md](../../.gemini/antigravity/brain/da16ef3e-de83-4980-8e04-0dac67057a6b/implementation_plan.md) |
| **✅ Tasks** | [Session da16ef3e: task.md](../../.gemini/antigravity/brain/da16ef3e-de83-4980-8e04-0dac67057a6b/task.md) |

**Overview:**
- Pure math engine (EDPT, TTK, EHP calculations)
- Deterministic + Monte Carlo simulators for matchup analysis
- SWI (Stat Weight Index) per matchup cell
- NxN matrix runner with full metrics
- Auto-balancer with versioning and automatic nerf/buff proposals
- UI: ArchetypeBuilder, MatchupMatrix, DetailPanel, RunBrowser, AutoBalanceConsole

**Status:** ✅ Phase 3.3 Complete - Balance Tuning & Architecture Unification Done

**Recently Completed (2025-11-30):**
- ✅ Combat Simulator Determinism & Regression Pack (20+ tests)
- ✅ Matrix Reproducibility Verification
- ✅ CLI Enhancement (matrix command with seed support)
- ✅ **Balance Tuning Analysis** - Identified imbalances, applied adjustments
  - Created 6 test archetypes (Tank, DPS, Assassin, Bruiser, Evasive, Sustain)
  - Ran baseline 6x6 matrix simulations
  - Balance score improved from 34.45% → 14.00% (59% improvement)
  - All archetypes now within 35-65% win rate range
- ✅ **Architecture Unification** - Enforced Single Source of Truth
  - Created `ARCHITECTURE_REFERENCE.md` with mandatory design principles
  - Replaced hardcoded test archetypes with ArchetypeRegistry
  - Integrated ArchetypeRegistry in CharacterCreator (useEffect loading)
  - **Formula Audit:** NO violations found - all UI uses balancing modules correctly

---

### 🔥 **PHASE 10.5: Stat Stress Testing, Marginal Utility & Auto Stat Balancer (PRIORITY)**

**Status:** 🔥 NEXT (Ready to Start)

| Document | Purpose |
|----------|---------|
| **📋 Plan** | [plans/stat_stress_testing_plan.md](plans/stat_stress_testing_plan.md) |
| **✅ Tasks** | [plans/stat_stress_testing_tasks.md](plans/stat_stress_testing_tasks.md) (to be created) |

**Overview:**
Dynamic stress-testing system for validating stat weights and identifying synergies, extended with an **Auto Stat Balancer** that can propose and (optionally) apply weight adjustments directly on the live Balancer config.

**Key Features:**
- **Single-Stat Archetipi:** Generate archetipi with +N points in ONE stat (weighted by current weight)
- **Pair-Stat Archetipi:** Test ALL stat combinations (C(n,2) pairs)
- **Marginal Utility Scoring:** Empirical value of each stat via Monte Carlo simulations
- **Synergy Heatmap:** Identify OP/weak stat combinations
- **Dynamic Generation:** Read stats from Balancer config, zero hardcoding
- **Interesting Presentation:** Table + heatmap + radar charts
- **Inline Weight Suggestions:** For each stat, show suggested weight adjustments based on Round-Robin efficiency (e.g. "OP" → nerf, "weak" → buff), wired to `useBalancerConfig`.
- **Auto Stat Balancer Sessions:** Optional multi-iteration loop that runs Round-Robin, updates weights within safe bounds, and records each iteration as a session step.
- **Balance History:** Dedicated history of stat-balance runs/sessions (weights + key metrics) with the ability to inspect and compare past runs.

**Deliverables:**
- `StressTestArchetypeGenerator.ts` - Dynamic archetype creation
- `RoundRobinRunner.ts` + helpers - Round-Robin NxN stat efficiency engine
- `metrics.ts` - Marginal utility, synergy metrics & factor tables
- UI Components: `StatStressTestingPage`, `StatEfficiencyTable`, `MatchupHeatmap`, `EfficiencyRadar`, `MarginalUtilityTable`, `SynergyHeatmap`, `StatProfileRadar`
- `useRoundRobinTesting()` hook - Integration with Balancer config
- `StatWeightAdvisor` service - Suggest stat weight adjustments from Round-Robin results
- `AutoStatBalancer` engine - Optional multi-iteration auto-balance pipeline on `BalancerConfig.stats[*].weight`
- `StatBalanceHistoryStore` - History of stat-balance runs & sessions (weights + metrics)

**Success Criteria:**
- ✅ All stats tested individually (no hardcoding)
- ✅ All stat pairs tested (C(n,2) combinations)
- ✅ Marginal utility scores calculated via simulation
- ✅ Synergy heatmap identifies OP/weak combinations
- ✅ Deterministic (LCG seeded, reproducible)
- ✅ Results exported for analysis

**Timeline:** 3-4 days (after Phase 10 completion)

---

**Status:** 10% (Paused)

**Goal:** Apply the "Weight-Based Creator" pattern to Items and Characters.
**Note:** Postponed until after core balancing is complete.

**Key Tasks:**
- ✅ Create `WeightBasedCreator` template
- [ ] Implement `ItemCreator`
- [ ] Implement `CharacterCreator`

---

### 📋 **PHASE 3: Scenario Configuration UI (Planned)**

**Status:** 0% (Planned)

| Document | Purpose |
|----------|---------|
| **📋 Plan** | [plans/scenario_ui_plan.md](plans/scenario_ui_plan.md) |
| **✅ Tasks** | [plans/scenario_ui_tasks.md](plans/scenario_ui_tasks.md) |

**Overview:**
- Configure combat scenarios (1v1, Swarm, Boss)
- Stat effectiveness multipliers

---

### 📋 **PHASE 6: 1v1 Combat Polish (Planned)**

**Status:** 80% Done, needs polish

| Document | Purpose |
|----------|---------|
| **📋 Plan** | [plans/1v1_combat_plan.md](plans/1v1_combat_plan.md) |
| **✅ Tasks** | [plans/1v1_tasks.md](plans/1v1_tasks.md) |

**Remaining Work:**
- Mana system integration
- Status effects (stun, slow, silence)

---

### 🔄 **PHASE 7: Balance Configuration Persistence (Planned)**

**Status:** 0% (Design Complete)

| Document | Purpose |
|----------|---------|
| **📋 Plan** | [Session 886ac1dc: balance_persistence_ui_redesign_plan.md](../../.gemini/antigravity/brain/886ac1dc-4b8b-4d7e-82fe-5f57bf201bde/balance_persistence_ui_redesign_plan.md) |

**Overview:**
- **Persistent Storage:** localStorage + JSON export for all balance modifications
- **Version Control:** Semantic versioning with history tracking (last 10 changes)
- **Migration System:** Automatic schema migration with conflict detection
- **Regression Detection:** Mismatch warnings with resolution UI
- **Rollback:** Ability to revert to previous configurations

**Key Features:**
- Save archetype templates from ArchetypeBuilder
- Save matrix run configurations
- Save applied auto-balancer changes
- Version snapshots with checksums
- Conflict resolution modal when loading incompatible versions

**Components:**
- `BalanceConfigStore.ts` - Main storage interface
- `BalanceVersion.ts` - Version management
- `MigrationManager.ts` - Schema change handling

---

### 🔄 **PHASE 9: Combat System Expansion (Planned)**

**Status:** 0% (Design Complete)

| Document | Purpose |
|----------|---------|
| **📋 Plan** | [plans/combat_expansion_plan.md](plans/combat_expansion_plan.md) |
| **✅ Tasks** | [Session 41fb7f12: task.md](../../.gemini/antigravity/brain/41fb7f12-d062-4270-aae4-b1bb5d18a77f/task.md) |
| **📊 Analysis** | [Session 41fb7f12: combat_system_expansion_analysis.md](../../.gemini/antigravity/brain/41fb7f12-d062-4270-aae4-b1bb5d18a77f/combat_system_expansion_analysis.md) |

**Overview:**
Expand combat system from 1v1 to full tactical grid-based multi-unit combat:
- **Phase 9.1:** Foundation - Initiative system + Status effects (stun, buff, debuff)
- **Phase 9.2:** Grid Combat 2D - Pathfinding (A*), range/LOS, basic AI
- **Phase 9.3:** Multi-Unit - AoE mechanics, team synergies (5v5, 5vMany, boss fights)
- **Phase 9.4:** Polish - Performance optimization, advanced AI

**Key Features:**
- Initiative-based turn order (agility stat + variance)
- Status effects: Stun, DoT, Buff/Debuff with duration tracking
- Grid movement: A* pathfinding, Dijkstra range calculation
- AI opponents: Target selection, tactical movement, spell/attack priority
- AoE system: Circle/Line shapes, friendly fire options
- Team synergies: Flanking, focus fire, formation bonuses

**Design Decisions (Default):**
- ✅ New `agility` stat for initiative (weight 0.5 HP/point)
- ✅ Dynamic initiative (re-roll each round)
- ✅ AoE damage formula: Single-target × 0.65, Cost × 2.0
- ✅ Hybrid friendly fire: "Safe" spells (no FF, 0.5× dmg) vs "Dangerous" (with FF, 1.0× dmg)
- ✅ Incremental archetyps: 6 → 10 → 16
- ✅ AI Level 1 (greedy) for Phase 2, Level 2 (tactical) for Phase 3

**Timeline:** 8-12 weeks total
- Phase 9.1: 1-2 weeks
- Phase 9.2: 3-4 weeks
- Phase 9.3: 4-6 weeks
- Phase 9.4: 1-2 weeks

**Notes:**
- ⚠️ Mana and cooldown systems deferred to post-expansion
- ✅ Maintains 1v1 compatibility (GridCombatSimulator extends base)
- ✅ All existing tests must continue passing

---

## 🎯 CURRENT FOCUS

### 🚨 **PRIORITY FIX: Balancer UI Bugs (BLOCKING)**

**Status:** 🔥 CRITICO - Blocca usabilità  
**Priority:** Massima  
**Effort:** 4-6 ore

| Document | Purpose |
|----------|---------|
| **📋 Fix Plan** | [plans/balancer_ui_fix_plan.md](plans/balancer_ui_fix_plan.md) |

**Problemi da risolvere:**
1. ❌ Reset non funziona (card, stat, pagina)
2. ❌ Pulsante Elimina: posizione sbagliata, manca cerchio rosso
3. ❌ Pulsante Occhio: non è il più a destra
4. ❌ Icona Lock: stato visivo non chiaro (aperto/chiuso)
5. ❌ Pulsanti Lock, Hide, Reset: non fanno nulla
6. ❌ Icona Lock troppo grande
7. ❌ Import formule: diventano valori secchi
8. ❌ Import/Export: non sembrano funzionare

**Fasi:**
1. Fix Critici (Reset, Export/Import) - 2h
2. UX Pulsanti (riordino, stili) - 1.5h
3. Funzionalità Mancanti (Lock, Hide) - 2h
4. Verifica Formule (round-trip test) - 0.5h

---

### 🔥 **PHASE 10: Config-Driven Balancer (ACTIVE)**

**Status:** 📋 In Progress (dopo fix UI)  
**Priority:** Alta  
**Effort:** 12-16 ore

| Document | Purpose |
|----------|---------|
| **📋 Plan** | [plans/config_driven_balancer_plan.md](plans/config_driven_balancer_plan.md) |
| **✅ Tasks** | [plans/config_driven_balancer_tasks.md](plans/config_driven_balancer_tasks.md) |

**Obiettivo:** Trasformare il Balancer in un sistema completamente configurabile da UI:

- **Card** (moduli di combattimento) creabili, rinominabili, riordinabili, eliminabili da UI
- **Stat** aggiungibili dentro le card con nome, peso, min/max/step, valore default
- **Formule derivate** creabili/editabili con validazione real-time (solo stat esistenti)
- **Core** (hp, damage, htk) sempre presente, non eliminabile, ma pesi/range editabili
- **Persistenza** in localStorage; ultimo salvataggio = default al reload
- **Preset** gestibili (switch, crea, duplica, elimina)
- **History/Undo** (ultimi 10 stati)
- **Drag & drop** card con handle dedicato (⋮⋮)
- **Validazione real-time** con feedback visivo (bordo rosso se errore)

**Fasi:**
1. Schema e Store (Zod + localStorage + history)
2. React Hook (`useBalancerConfig`)
3. UI Editor Components (CardEditor, StatEditor, FormulaEditor drawers)
4. Integrazione FantasyBalancer
5. Testing e Polish

**Tech Stack:**
- Zod per validazione schema
- @dnd-kit per drag & drop
- Drawer laterale per editor
- Tema Gilded Observatory

---

### Testing & QA Infrastructure (Cross-Phase)

**Status:** 0% (Planned)

| Document | Purpose |
|----------|---------|
| ** Plan** | [plans/testing_infrastructure_plan.md](plans/testing_infrastructure_plan.md) |
| ** Tasks** | [plans/testing_infrastructure_tasks.md](plans/testing_infrastructure_tasks.md) |

**Overview:**
- Unified testing layers (lint, config healthcheck, domain/simulation, UI components, Playwright E2E).
- Single entry points via npm scripts (`test:all`, `test:all:quick`).
- Config-first validation of BalancerConfig, solver behavior, and key UI surfaces (BalancerNew, Stat Stress Testing).

---

### Future Direction (After Config-Driven Balancer)

The next evolution of the project is organized around six macro-goals:

1. **Config-Driven Spell Creator**  
   - Applicare lo stesso pattern del Balancer allo Spell Creator.
   - Stat, formule, preset configurabili da UI.
   - Piano di implementazione e migrazione: [plans/spell_creator_new_plan.md](plans/spell_creator_new_plan.md).

2. **UI Optimization Page-by-Page (Core First)**  
   - Rifinire Balancer e Spell Creator (Tier 1), poi le altre pagine.  
   - Interventi solo visivi/UX separati da cambi strutturali.
   - Piano dettagliato in [plans/responsive_ui_plan.md](plans/responsive_ui_plan.md), con **BalancerNew** come prima pagina target mobile+desktop.

3. **Page Curation (Keep / Archive)**  
   - Classificare tutte le pagine per importanza (Core / Support / Demo).  
   - Tenere solo le superfici davvero utili; spostare mock vecchi in `docs/archive/`.

4. **Reusable Gilded UI Components**  
   - Creare una libreria di componenti estetici riciclabili (button, card, input, slider, stat row).  
   - Copiare tutte le funzionalità dai componenti legacy senza modificarle, poi applicare il nuovo stile.  
   - Ogni componente rifatto ha una propria pagina di test dedicata.

5. **JSON-Driven Non-Regression for Balancer & Spell Creator**  
   - Spostare preset e expected values in JSON; test di non-regressione leggono da lì.  
   - Ogni modifica a Balancer/Spell Creator o ai loro componenti core deve far girare questi test.  
   - Stessa logica applicata ai componenti interni chiave.

6. **Idle Village Autobattler (Phase 12)**  
   - Meta-gioco idle senza progressione offline: villaggio con lavori, quest e combattimenti auto basati sul combat engine esistente.  
   - Worker placement config-driven: jobs, edifici, quest e rischi definiti in `src/balancing/config/*`.  
   - Loop high risk / high reward: injury & death fin dall'inizio, personaggi forti davvero preziosi.

7. **Updated Philosophy & Guidelines**  
   - Allineare `PROJECT_PHILOSOPHY.md` e `DEVELOPMENT_GUIDELINES.md` con:  
     - approccio **config-first** (formule/layout da config, non da UI),  
     - UI come vista sulle config/balancing modules,  
     - tema **Gilded Observatory** e token di colore centralizzati.

Questa sezione definisce la direzione strategica; i dettagli di ciò che è già stato fatto restano in `IMPLEMENTED_PLAN.md`.

---

## 📈 SUCCESS METRICS

- **UI Consistency:** 100% Atomic Components
- **Code Quality:** Zero `any` types, CSS Modules
- **Test Coverage:** Target 90%+
- **Documentation:** All phases documented ✅

---

## 🔗 QUICK NAVIGATION

### By Category
- **📂 Design:** [design/](design/) - Architecture & research
- **📋 Plans:** [plans/](plans/) - Implementation roadmaps
- **✅ Tasks:** [plans/](plans/) - Executable checklists
- **📝 Reports:** [reports/](reports/) - Completed work

### By Purpose
- **"What's next?"** → [Current Focus](#current-focus)
- **"Full Checklist?"** → [plans/atomic_evolution_tasks.md](plans/atomic_evolution_tasks.md)
- **"How does it work?"** → [design/architecture.md](design/architecture.md)
- **"Cosa esiste davvero ora?"** → [IMPLEMENTED_PLAN.md](IMPLEMENTED_PLAN.md)

---

## 📚 RELATED DOCUMENTS

- [README.md](../../README.md) - Documentation index
- [DEVELOPMENT_GUIDELINES.md](../../DEVELOPMENT_GUIDELINES.md) - **⚠️ MUST READ** before coding
- [task.md](task.md) - Aggregate progress tracker

---

**Next Review:** End of Week 8 (2025-12-16)  
**Last Updated:** 2025-12-03 00:00
