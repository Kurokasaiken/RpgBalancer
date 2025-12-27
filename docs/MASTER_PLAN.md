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
│- **Phase 12: Idle Incremental RPG – Implementation Plan** (`docs/plans/idle_village_plan.md`)
- **Phase 12.E: Atomic Sandbox Refactor** (`docs/plans/idle_village_atomic_sandbox_plan.md`, tasks in `docs/plans/idle_village_tasks.md#phase-12e`)
- **Idle Village Resident Slot Expansion Plan** (`docs/plans/idle_village_resident_slot_plan.md`)
 │
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

### 🎨 **Art Direction – “Il Drago” (New)**

| Document | Purpose |
|----------|---------|
| **📋 Plan** | [plans/il_drago_art_direction_plan.md](plans/il_drago_art_direction_plan.md) |
| **🖼️ Moodboard** | [moodboards/combat_viewer_visual/README.md](../docs/moodboards/combat_viewer_visual/README.md) |

**Overview:**
- Missione creativa “Libertà, Gloria e Trionfo Solare”: antitesi del Dark Fantasy con saturazione tropicale e materiali nobili.
- Direzione gerarchica per razze/biomi (Huang Guangjian, Ruan Jia, Justin Gerard/Jesper Ejsing) e tecnica di rendering stile Jaime Jones.
- Specifica componenti chiave (`HeroMarker`, map markers, VerbTokens, Astrolabe) con API/config-first via `themeTokens.ilDrago`.
- Stack confermato: React + Vite + Tailwind v4, SVG configurati, Framer Motion per animazioni “pesanti”, LaTeX solo per formule tecniche.

**Status:** Draft v0.2 – HeroMarker definito e moodboard aggiornato; prossimi step: introdurre token `goldBevel/ivoryPlate/obsidianGlass` e libreria componenti `heroicRealism`.

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
- ✅ Implement `ItemCreator`
- ✅ Implement `CharacterCreator`

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

### 🧹 **SAFE Cleanup Audit (24 Dec 2025)**

**Status:** ✅ COMPLETED  
**Scope:** Phases 1-3 (Audit + Asset relocation + Build fix)

| Document | Purpose |
|----------|---------|
| ** Report** | [docs/reports/safe-audit-2025-12-24.md](../docs/reports/safe-audit-2025-12-24.md) |

**Highlights:**
- Architettura SAFE confermata
- Asset obsoleti spostati in `/archive`
- Build di Vite/Playwright ripristinata senza regressioni

### **Skill Check Preview Lab Refactor (24 Dec 2025)**

**Status:** PLANNING  
**Scope:** Skill Check Preview Lab UI + V6 integration

| Document | Purpose |
| --- | --- |
| ** Plan** | [plans/skill_check_preview_lab_plan.md](plans/skill_check_preview_lab_plan.md) |
| ** Tasks** | [plans/skill_check_preview_lab_tasks.md](plans/skill_check_preview_lab_tasks.md) |

**Key Objectives:**
- Eliminare la tab “Alt Visuals” e usare AltVisuals V6 come unica visualizzazione del Dispatch Polygon.
- Sostituire i controlli legacy (Shot Power, Spin Bias, Lancia pallina) con “Riavvia scena” e “Ritira dado”.
- Implementare la logica di cardinalità per distribuire le icone stat (derivate dal balancer) sui 5 punti cardinali.
- Garantire compliance alle regole config-first + JSDoc e aggiornare i test UI.

**Ownership:** Testing Tools / Balancer UI Team (Skill Check Preview stream)

---

## **PRIORITY ALERTS**
VerbDetail sandbox ora generano `ResidentState` validi.
- AltVisuals V6 ripristinato con schema axisMeta + `hasSettled`.
- Build `npm run build` pulita (warn asset size solo informativi).

**Problemi da risolvere:**
1. Reset non funziona (card, stat, pagina)
2. Pulsante Elimina: posizione sbagliata, manca cerchio rosso
3. Pulsante Occhio: non è il più a destra
4. Icona Lock: stato visivo non chiaro (aperto/chiuso)
5. Pulsanti Lock, Hide, Reset: non fanno nulla
6. Icona Lock troppo grande
7. Import formule: diventano valori secchi
8. Import/Export: non sembrano funzionare
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

### 🗺️ **PHASE 12: Idle Incremental RPG (Village Sandbox Vertical Slice)**

**Status:** 🔄 In Progress  
**Latest Progress (2025-12-20):**

- ✅ Resident roster drag/drop ready: `ResidentRoster` exposes drag handles, fatigue badges, and integrates with the new validation helpers.
- ✅ Map slot drop validation & feedback: `VillageSandbox` + `MapSlotActivityCluster` enforce slot compatibility, stat requirements, fatigue thresholds, and locked-slot rules with localized copy.
- ✅ ActivityCard refactor adopted on the map: scheduled jobs/quests and quest offers render via `buildScheduledVerbSummary`; drop halo/“Drop Resident” affordances polished.
- ✅ Deterministic debug controls: `window.__idleVillageControls` (play/pause/advance/assign/getState/getConfig) surfaced for automated QA and Playwright flows.
- ✅ Config-first mocks: `IdleVillageConfig` now ships sample `statRequirement` + founder `statTags` to exercise validation paths.

**Next Steps (per Master Plan v2.0):**
1. Implement Bloom Reveal + Theater View container so slots expose ActivityCard medaglioni and roster drag tokens drop directly inside the theater panel.
2. Wire RosterSidebar filters (Tutti/Eroi/Carne da Macello/Feriti) and hero promotion hooks (Trial of Fire survivals) into the UI.
3. Surface passive/system verbs (hunger, upkeep) plus quest deadlines on the map using the unified VerbSummary pipeline, then finalize the deterministic Playwright regression (“assign → advance time → verify reward/resource deltas”) leveraging the debug controls described in `docs/plans/idle_village_drag_drop_e2e_plan.md`.
4. Stand up Quest Blueprint + Quest Chronicle system (`docs/plans/quest_chronicle_plan.md`): config schema for multi-phase quests, QuestManager/TimeEngine bridge, QuestChronicle UI, and sandbox quest for verification.

**Canonical Plan:** [Village Sandbox “Gilded Heroism” Master Plan v2.0](plans/idle_village_map_only_plan.md)  
**Supporting Plans:** [Village Sandbox ActivityCard Refactor](plans/village_sandbox_activitycard_refactor_plan.md), [Village Sandbox Theater View & Trial of Fire](plans/idle_village_trial_of_fire_plan.md), [Village Sandbox Drag & Drop E2E](plans/idle_village_drag_drop_e2e_plan.md)  
**Plan Status Snapshot:**  
- Master Plan v2.0: ✅ sections 1–6 aligned (vision, data model, Bloom/Trial of Fire, QA, cross-plan integration).  
- ActivityCard Refactor: Phase A/B ✅, Phases C–E pending (HUD swap, quest-offer polish, Vitest/Playwright).  
- Theater View & Trial of Fire: Phase 0 (schema), Phase 1 (engine) ready to start; Phases 2–4 (UI/Bloom) pending.  
- Drag & Drop E2E: plan finalized, suite partially implemented (needs bloom + hero cases once UI lands).

Linked artifacts: `docs/plans/idle_village_tasks.md`, `docs/plans/idle_village_map_only_plan.md`, `docs/plans/village_sandbox_activitycard_refactor_plan.md`, `docs/plans/idle_village_trial_of_fire_plan.md`, `docs/plans/idle_village_drag_drop_e2e_plan.md`.

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
4. Integrazione Balancer (completata)
5. Testing e Polish

**Tech Stack:**
- Zod per validazione schema
- @dnd-kit per drag & drop
- Drawer laterale per editor
- Tema Gilded Observatory

### 🧩 **EnhancedStatSlider Refactor (Atomic Evolution Phase 2)**

**Status:** 🔥 CRITICAL – Blocking Spell Creator UX  
**Plan:** [plans/atomic_evolution_plan.md](plans/atomic_evolution_plan.md#phase-2-component-restructuring)  

**Implementation Points:**
1. **Break Down EnhancedStatSlider** → Orchestrator + `StatSliderHeader`, `StatSliderTrack`, `StatSliderTick`, and `useStatSlider` hook (target ≤60 lines per file).  
2. **Extract CSS Modules** → Move inline/Tailwind overrides into `EnhancedStatSlider/styles.module.css` to keep theme tokens centralized.  
3. **Add Regression Tests** → Cover tick selection/add/remove and malus rendering to stabilize future iterations.

**Next Action:** Implement Point 1 (component split) before styling/tests.

---

### 🔄 **Async Persistence System Migration (COMPLETED)**

**Status:** ✅ COMPLETED (2025-12-24)  
**Scope:** Complete migration from synchronous localStorage to async PersistenceService.ts

**What was done:**
- ✅ Created `PersistenceService.ts` with Tauri FS support and localStorage fallback
- ✅ Migrated all storage classes: `BalancerConfigStore`, `spellStorage`, `presetStorage`, `useDefaultStorage`, `createJsonConfigStore`, `VillageStateStore`, `characterPersistence`, `ArchetypeStorage`, `StatBalanceHistoryStore`, `SpellConfigStore`, `BalanceConfigManager`, `AutoStatBalanceService`
- ✅ Made all storage operations async with proper error handling
- ✅ Mobile-ready fallback (localStorage when Tauri not available)
- ✅ Created and ran verification script - all tests passed ✅
- ✅ Deleted verification script per protocol

**Impact:** All state changes now use async persistence, enabling future Tauri mobile deployment and ensuring data integrity across browser tabs.

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
- Config-first validation of BalancerConfig, solver behavior, and key UI surfaces (Balancer, Stat Stress Testing).

---

### 📋 **PHASE 11: Tactical Missions (Narrative Quest System)**

**Status:** 0% (Concept Defined)  
**Concept:** "Darkest Dungeon Curios" meets "Idle Expedition".

**User Vision:**
Sistema di quest "D&D-style" a fasi multiple, puramente testuale/narrativo con reward variabili.
*Structure:* Intro Narrativa → Skill Check/Combattimento → Scelta → Skill Check/Combattimento → Outro + Reward.

**Core Mechanics:**
1.  **Quest Phases:** Ogni missione è una sequenza di Nodi (3-5 step).
2.  **Stat Checks:** I nodi non-combat richiedono check su stat specifiche (es. `Stamina` per scalare, `Wisdom` per decifrare).
3.  **Risk/Reward:** Successo = loot migliore/buff per il nodo successivo. Fallimento = danno/debuff/minor loot.
4.  **Narrative Flavor:** Testi brevi saporiti ("You find a glowing altar...") invece di cutscene costose.
5.  **Partial Success:** Il reward finale dipende dal numero di "Successi" accumulati nelle fasi.

**Deliverables:**
- [ ] `QuestEngine`: Gestore di macchine a stati per le quest (Node sequence).
- [ ] `SkillCheckSystem`: Calcolatore probabilità basato su stat entità vs difficoltà nodo.
- [ ] `QuestUI`: Interfaccia stile "libro/pergamena" con log testuale e scelte.
- [ ] `QuestData`: Struttura JSON per definire quest, nodi, testi e reward (Config-Driven).

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
   - Piano dettagliato in [plans/responsive_ui_plan.md](plans/responsive_ui_plan.md), con **Balancer** come prima pagina target mobile+desktop.

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

6. **Idle Incremental RPG (Phase 12, Product Phase One)**  
   - Prodotto principale Phase One: meta-gioco idle/incremental giocabile sul lungo periodo (mesi), senza progressione offline in V1: il tempo avanza solo mentre il gioco è aperto.  
   - Focus su un founder "raro" (≈1% rispetto alla popolazione) e su un villaggio di lavoratori più scarsi: morte del protagonista e collasso del villaggio sono eventi normali che innescano nuove run.  
   - Meta-progression persistente tramite edifici/upgrade non distruttibili che migliorano lo start delle run successive (più risorse iniziali, spell/equip di partenza, possibilità di eredi che ripartono da zero con piccoli bonus).  
   - Core loop: allenare/mandare in combattimento il founder (jobs di combattimento tipo "ratti in città", early explore) mentre i lavoratori producono risorse tramite jobs e quest rischiose; prepararsi a ondate periodiche stile "They Are Billions" in cui tutti i personaggi disponibili difendono il villaggio.  
   - Mid/late game: sblocco di quest e raid che richiedono party ampi (prima 5, poi fino a ~20 personaggi equipaggiati), mantenendo al centro il combat/Entity system esistente e il worker placement config-driven (jobs, edifici, quest, rischi definiti in `src/balancing/config/*`).  
   - Vision & design document: [GAME_VISION_IDLE_INCREMENTAL.md](GAME_VISION_IDLE_INCREMENTAL.md).  
   - **FTUE & Vertical Slice:** primi 30–60 minuti pianificati in [plans/idle_village_ftue_plan.md](plans/idle_village_ftue_plan.md); la vertical slice deve permettere almeno un ciclo completo run → meta → nuova run.  
   - **Art Style & Visual Direction:** linee guida per stile grafico, palette e pipeline in [plans/idle_village_art_style_plan.md](plans/idle_village_art_style_plan.md).
   - **Village Sandbox ActivityCard Refactor (UI Focus):** plan in [plans/village_sandbox_activitycard_refactor_plan.md](plans/village_sandbox_activitycard_refactor_plan.md) with tasklist dedicated in [plans/idle_village_tasks.md](plans/idle_village_tasks.md) → unifica le ActivityCard su mappa/HUD e prepara il refactor dei marker.
   - **Idle Village Map-Only Verb System:** nuovo piano dedicato in [plans/idle_village_map_only_plan.md](plans/idle_village_map_only_plan.md) per integrare verb passivi, job continui e quest expiry sulla pagina mappa, con checklist collegata in `idle_village_tasks.md`.
   - **Idle Village Theater View & Trial of Fire:** nuovo piano in [plans/idle_village_trial_of_fire_plan.md](plans/idle_village_trial_of_fire_plan.md) per introdurre heroism stats, auto-looping activities e il contenitore TheaterView; tasklist nella sezione 12.11 di `idle_village_tasks.md`.
   - **Idle Village Trial of Fire Runtime Config:** piano operativo in [plans/trial_of_fire_runtime_plan.md](plans/trial_of_fire_runtime_plan.md) che copre il modulo `villageConfig`, la pagina designer `/debug/balancer/village`, e il refactor di `resolveActivityOutcome`; tasklist aggiornata in `idle_village_tasks.md` (Phase 12.12).

---

### PHASE 12.0: Offline Progress Decision (CRITICAL PRE-LAUNCH)

**Status:** TODO (Blocking per posizionamento marketing)  
**Priority:** Alta - Influenza naming, Steam tags, e aspettative giocatori

> [!CAUTION]
> La ricerca di mercato (Dic 2024) indica che **la mancanza di offline progress è un deal-breaker** per la maggioranza dei giocatori che cercano "idle games" su Steam. Frasi comuni in negative reviews: "not a idle game", "when you close it you don't make any progress".

**Impatto stimato sulle probabilità di revenue Year 1:**

| Scenario | Senza Offline Progress | Con Offline Progress (base) |
|----------|------------------------|------------------------------|
| 🔴 Perso soldi (<€3k) | **~20%** | **~12%** |
| 🟠 Sopravvissuto (€3-10k) | ~40% | ~38% |
| 🟡 Decente (€10-25k) | ~25% | ~30% |
| 🟢 Successo (€25-50k) | ~12% | ~15% |
| 🔵 Hit (€50k+) | ~3% | ~5% |

**Delta chiave:** Il rischio di "perso soldi" scende da 20% a ~12% implementando anche solo un basic offline progress. Il rischio combinato di stare sotto €10k scende da 60% a ~50%.

#### Opzioni di Design

| Opzione | Descrizione | Pro | Contro | Effort |
|---------|-------------|-----|--------|--------|
| **A. Full Offline** | Risorse prodotte mentre app chiusa, cap a ~24h | Allineato aspettative "idle" | Complessità calcolo retroattivo, abuse potential | 2-3 settimane |
| **B. Limited Offline** | Solo alcune risorse (gold base, no XP combat), cap 4-8h | Bilanciamento più facile, monetizzabile (time warp) | Può sembrare "mezzo idle" | 1-2 settimane |
| **C. Battery Saver Only** | Nessun offline, ma modalità low-power per running in background | Minimo effort | NON risolve aspettative "idle", rischio review negative | 2-3 giorni |
| **D. Rebranding** | Rimuovere "Idle" dal titolo/tags, posizionarsi come "Management Sim" | Evita aspettative sbagliate | Perde nicchia idle, più competizione con management games | 0 (solo decisione) |

#### Decisione Raccomandata

**Option B (Limited Offline)** come compromesso:
- Implementa offline progress per risorse base (gold, materiali production)
- **NO** offline progress per combattimento/XP (mantiene engagement attivo per core loop)
- Cap a 4-8 ore (incentiva check-in regolari)
- Monetizza "Time Warp" per saltare ore di produzione

#### Deliverables

- [ ] **Decision Document:** Scelta formale tra opzioni A/B/C/D
- [ ] **Design Spec:** Se A/B, documento tecnico con formule di accumulo offline
- [ ] **UI Mockup:** Come comunicare il progresso offline al rientro
- [ ] **Steam Page Copy:** Testo che chiarisca le aspettative (se C/D)
- [ ] **Implementazione** (se A/B): `OfflineProgressCalculator.ts`, integrazione con save/load

#### Timeline

- Decision: 1-2 giorni (playtesting mentale + revisione design pillars)
- Implementation (se B): 1-2 settimane
- Testing: 2-3 giorni

7. **Updated Philosophy & Guidelines**  
   - Allineare `PROJECT_PHILOSOPHY.md` e `DEVELOPMENT_GUIDELINES.md` con:  
     - approccio **config-first** (formule/layout da config, non da UI),  
     - UI come vista sulle config/balancing modules,  
     - tema **Gilded Observatory** e token di colore centralizzati.

Questa sezione definisce la direzione strategica; i dettagli di ciò che è già stato fatto restano in `IMPLEMENTED_PLAN.md`.

**Milestones publishing/marketing (Idle Incremental RPG):**

- Dopo la prima versione stabile del loop base (Phase 12.1–12.5):
  - Creare pagina **itch.io** con build web e descrizione minimale (no marketing pesante, solo test/feedback).
- Dopo che il FTUE (primi 60 minuti) è allineato al piano FTUE e testato internamente:
  - Iniziare devlog regolari (itch.io + X) usando il flusso `share update`.
- Quando la vertical slice permette un ciclo completo run → meta → nuova run ed è stabile:
  - Creare pagina **Steam Coming Soon** con trailer breve e materiale visivo.
  - Valutare in quale Steam Next Fest targettizzare la demo e pianificare indietro 3–6 mesi per preparazione.

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
 - [GAME_VISION_IDLE_INCREMENTAL.md](GAME_VISION_IDLE_INCREMENTAL.md) - Idle Incremental RPG product vision (Phase 12 / Product Phase One)

---

**Next Review:** End of Week 8 (2025-12-16)  
**Last Updated:** 2025-12-03 00:00
