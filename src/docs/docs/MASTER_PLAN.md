---
title: RPG Balancer – Master Plan
status: active
owner: Strategy-Lead
last_reviewed: 2026-07-13
domain: core
description: "Single source of truth for roadmap, documentation governance, and phase tracking"
---

# 🎯 RPG Balancer - MASTER PLAN

> **Navigator + Governance** - Single source of truth for project
> organization

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
- **Example:** `implementation_plan.md` describes archetype system
  design

#### **TASKS (`plans/*_tasks.md`)** - Execution Checklist

- **Contains:** ONLY actionable checkbox tasks `- [ ]`
- **Does NOT contain:** Long explanations, design decisions
- **Purpose:** Track WHAT TO DO
- **Example:** `archetype_tasks.md` has 200+ executable checkboxes

#### **Relationship:**

```text
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

```text
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

### **Trusted Component Registry**

- **Source:** `src/docs/docs/idle_village/roster_trusted_components.md`
- **Mandate:** Before creare qualunque nuova superficie roster/list PG o modificare componenti esistenti, verifica se il componente richiesto è già presente/approvato nella registry. Solo se non esiste, apri un prompt IV-CLP per estrarlo.
- **Imports obbligatori:** Tutti i consumer devono importare attraverso `src/ui/idleVillage/roster/index.ts`. I componenti legacy rimangono in `_OLD_DEPRECATED/` e non possono essere referenziati nelle nuove implementazioni.

### **Vertical Slice Documentation Governance**

- **Source:** `src/docs/docs/DOCUMENTATION_GOVERNANCE.md` - Single source of truth rules for documentation
- **Source:** `context/VERTICAL_SLICE_REFERENCE.md` - Versioning and governance for vertical slice components
- **Mandate:** Vertical slice documentation follows strict single source of truth principles. All general documentation must link to trusted component docs, not duplicate contracts.
- **Freeze Governance:** See `context/RPG_PROJECT_CONTEXT.md` §3.1 for freezing semantics rules
- **Update Workflow:** When changing frozen components, update trusted docs, tests, and code comments in same commit

---

## 📊 OVERALL PROGRESS

- Phase 1: Foundation — ✅ DONE (~160 tasks)
- Phase 2: Archetypes — 🔄 ACTIVE (~200 tasks)
- Phase 3: Scenario UI — 📋 TODO (~50 tasks)
- Phase 4: Atomic UI — ✅ DONE (~60 tasks)
- Phase 5: Universal — ⏸️ PAUSED (~40 tasks)
- Phase 6: Logic Sep. — 📋 TODO (~30 tasks)
- Phase 7: Persistence — ✅ DONE (~25 tasks)
- Phase 8: Fantasy UI — ✅ DONE (~50 tasks)
- Phase 9: Combat Exp. — ✅ DONE (~100 tasks)
- Phase 10: Config Balancer — 🔥 ACTIVE (~140 tasks)
- Phase 10.5: Stat Testing — 🔥 NEXT (~80 tasks)
- Phase 11: Tactical Miss. — 📋 TODO (~100 tasks)
- Phase 12 references:
  - Idle Incremental RPG – Implementation Plan
    (`docs/plans/idle_village_plan.md`)
  - Tick Fatigue Plan
    (`docs/plans/idle_village_tick_fatigue_plan.md`)
  - Atomic Sandbox Refactor
    (`docs/plans/idle_village_atomic_sandbox_plan.md`)
    (see `docs/plans/idle_village_tasks.md#phase-12e`)
  - Resident Slot Expansion Plan
    (`docs/plans/idle_village_resident_slot_plan.md`)
  - Vertical Slice Implementation Plan
    (`src/docs/docs/plans/vertical_slice_implementation_plan.md`)
  - Card System Description
    (`src/docs/docs/idle_village/card_system_description.md`)
  - Vertical Slice Entities
    (`context/VERTICAL_SLICE_ENTITIES_FULL.md`)

**Total progress:** ███████████████░░░░░ 75%

---

### ⚙️ Gameplay Modifier System (GM-REG → GM-MP)

The Gameplay Modifier Registry is now the canonical source for every Idle Village buff/debuff. All roadmap surfaces that mention reward boosts, fatigue gates, or UI previews must explicitly reference [`docs/plans/idle_village_modifiers_plan.md`](../plans/idle_village_modifiers_plan.md) instead of ad-hoc multipliers.

- **Design Mandate:** Plans touching Idle Village progression, fatigue, Style Lab HUD, or builders must cite the registry schema (`GameplayModifier`, `GameplayStatId`, scope order) and forbid inline multipliers.
- **Document Owners:**
  - `GM-MP` updates to `MASTER_PLAN`, `idle_village_progression_system_plan.md`, `idle_village_tick_fatigue_plan.md`, `.windsurf/plans/style-lab-flexibility-1a9890.md` keep the spec in sync.
  - `GM-BLD` and `GM-MIG` inherit this mandate for tooling/migrations; they should link back to the same spec rather than redefining schema.
- **UI Contract:** Any HUD/tooltip (e.g., StatModifierDisplay, Quest telemetry panels) must read modifier metadata (`scope`, `operation`, `owner`) from registry selectors; Style Lab docs now include TODOs to color-code entries by scope using registry metadata.

> **Rule of thumb:** if a plan mentions "+X%" to a stat, it must also name the `GameplayModifier.id`, scope bucket, and source config ID defined in the registry.

### 🎬 Skill Check Ritual – Asterism V2

- **Plan:** `.windsurf/plans/asterism-v2-blizzard-plan-8c890c.md`
- **Scope:** Blizzard-style upgrade of the Skill Check Preview (AltVisuals V6) with physical pillars, chain links, dust/particle FX, audio cues, and readable stat plaques.
- **Dependencies:** Pull tokens and FX modules from `design-system-build-8c890c.md`, `style-lab-flexibility-1a9890.md`, `ui-fx-expansion-8c890c.md`, and Chapters 8–10 of the Game Feel Bible. Any Skill Check or Idle Village plan referencing the ritual must cite this plan to stay aligned with the cinematic mandate.

---

## 🎮 COMBAT SYSTEM & ENCOUNTER DESIGN

**Status:** Design Complete  
**Full Specification:**
[COMBAT_SYSTEM_DESIGN.md](COMBAT_SYSTEM_DESIGN.md)

### Quick Reference

This project implements a roguelike combat system with:

- **5 Core Archetypes** (Tank, DPS, Assassin, Support, Bruiser)
- **Turn-based grid combat** (1v1 → 5v5 → 5vMany progression)
- **Encounter Check System** (Elite fights with unique mechanics)
- **Drop-based build variability** (adapt to random spell drops)

**Key Design Principles:**

1. **No Perfect Builds** - Players must adapt to available drops
2. **Multiple Solutions** - Each encounter has 2-3 viable strategies
3. **Situational Value** - "Bad" drops can become optimal in specific
   scenarios
4. **Automated Testing** - All balance validated through 1000+
   simulations

**Implementation Phases:**

- Phase 1: Core 1v1 (✅ Complete)
- Phase 2: Advanced Spells & Resources (🔄 In Progress)
- Phase 3: Grid & AI (📋 Planned)
- Phase 4: Multi-Unit & Encounters (📋 Planned)
- Phase 5: Drop System & Polish (📋 Planned)

See full spec for archetype stats, encounter templates, and drop
mechanics.

---

---

## 🗺️ DETAILED PLANS & TASKS

### 🔄 **PHASE 2: Archetype Balancing System (Active)**

**Status:** 70% (In Progress)

### 🎨 **Art Direction – “Il Drago” (New)**

#### Documents

- **📋 Plan:**
  [plans/il_drago_art_direction_plan.md](plans/il_drago_art_direction_plan.md)
- **🖼️ Moodboard:**
  [moodboards/combat_viewer_visual/README.md](../docs/moodboards/combat_viewer_visual/README.md)

**Overview:**

- Missione creativa “Libertà, Gloria e Trionfo Solare”: antitesi del
  Dark Fantasy con saturazione tropicale e materiali nobili.
- Direzione gerarchica per razze/biomi (Huang Guangjian, Ruan Jia,
  Justin Gerard/Jesper Ejsing) e tecnica di rendering stile Jaime Jones.
- Specifica componenti chiave (`HeroMarker`, map markers, VerbTokens,
  Astrolabe) con API/config-first via `themeTokens.ilDrago`.
- Stack confermato: React + Vite + Tailwind v4, SVG configurati, Framer
  Motion per animazioni “pesanti”, LaTeX solo per formule tecniche.

**Status:** Draft v0.2 – HeroMarker definito e moodboard aggiornato;
prossimi step: introdurre token `goldBevel/ivoryPlate/obsidianGlass` e
libreria componenti `heroicRealism`.

#### **2.1: Combat Simulation Testing (In Progress)**

##### Combat Simulation Documents

- **📋 Plan:**  
  [plans/combat_simulation_plan.md](plans/combat_simulation_plan.md)
- **✅ Tasks:**  
  [plans/combat_simulation_tasks.md](plans/combat_simulation_tasks.md)

**Overview:**

- Monte Carlo simulation engine (10k+ combat iterations)
- Statistical analysis (win rates, confidence intervals, TTK)
- Stat value equivalency calculator (HP as currency)
- Turn-based 1v1 combat testing framework

**Status:** Phase 3.2 Complete - Engine & Reporting Ready

#### **2.2: Archetype Definition (Planned)**

##### Archetype Definition Docs

- **📋 Plan:**  
  [plans/archetype_balancing_plan.md](plans/archetype_balancing_plan.md)
- **✅ Tasks:**  
  [plans/archetype_tasks.md](plans/archetype_tasks.md)
- **🎨 Design:**  
  [design/archetype_system_v2.md](design/archetype_system_v2.md)

**Nota 2025-12:** Il piano è stato aggiornato con requisiti di authoring
completo (CRUD via UI + richieste dirette), persistenza JSON
(`data/archetypes.json`) e priorità assoluta per il restyle Gilded
Observatory della pagina Archetype Balancer.

**Overview:**

- 16 base archetypes (Tank×5, DPS×4, Assassin×2, etc.)
- TTK-based validation using simulation system
- Interactive dashboard (heatmaps, charts)

#### **2.3: 1v1 Balancing Module (In Progress)**

##### 1v1 Balancing Docs

- **📋 Plan:**  
  [Session da16ef3e: implementation_plan.md](../../.gemini/antigravity/brain/da16ef3e-de83-4980-8e04-0dac67057a6b/implementation_plan.md)
- **✅ Tasks:**  
  [Session da16ef3e: task.md](../../.gemini/antigravity/brain/da16ef3e-de83-4980-8e04-0dac67057a6b/task.md)

**Overview:**

- Pure math engine (EDPT, TTK, EHP calculations)
- Deterministic + Monte Carlo simulators for matchup analysis
- SWI (Stat Weight Index) per matchup cell
- NxN matrix runner with full metrics
- Auto-balancer with versioning and automatic nerf/buff proposals
- UI: ArchetypeBuilder, MatchupMatrix, DetailPanel, RunBrowser,
  AutoBalanceConsole

**Status:** ✅ Phase 3.3 Complete - Balance Tuning & Architecture
Unification Done

**Recently Completed (2025-11-30):**

- ✅ Combat Simulator Determinism & Regression Pack (20+ tests)
- ✅ Matrix Reproducibility Verification
- ✅ CLI Enhancement (matrix command with seed support)
- ✅ **Balance Tuning Analysis** - Identified imbalances, applied
  adjustments
  - Created 6 test archetypes (Tank, DPS, Assassin, Bruiser, Evasive,
    Sustain)
  - Ran baseline 6x6 matrix simulations
  - Balance score improved from 34.45% → 14.00% (59% improvement)
  - All archetypes now within 35-65% win rate range
- ✅ **Architecture Unification** - Enforced Single Source of Truth
  - Created `ARCHITECTURE_REFERENCE.md` with mandatory design principles
  - Replaced hardcoded test archetypes with ArchetypeRegistry
  - Integrated ArchetypeRegistry in CharacterCreator (useEffect loading)
  - **Formula Audit:** NO violations found - all UI uses balancing
    modules correctly

---

### 🔥 **PHASE 10.5: Stat Stress Testing & Auto Stat Balancer (PRIORITY)**

**Status:** 🔥 NEXT (Ready to Start)

| Document | Purpose |
| --- | --- |
| **📋 Plan** | [Stat Stress Testing Plan][stat-stress-plan] |
| **✅ Tasks** | [Stat Stress Testing Tasks][stat-stress-tasks] (to be created) |

[stat-stress-plan]: plans/stat_stress_testing_plan.md
[stat-stress-tasks]: plans/stat_stress_testing_tasks.md

**Overview:** Dynamic stress-testing system for validating stat weights
and identifying synergies, extended with an **Auto Stat Balancer** that
can propose and (optionally) apply weight adjustments directly on the
live Balancer config.

**Key Features:**

- **Single-Stat Archetipi:** Generate archetipi with +N points in ONE
  stat (weighted by current weight)
- **Pair-Stat Archetipi:** Test ALL stat combinations (C(n,2) pairs)
- **Marginal Utility Scoring:** Empirical value of each stat via Monte
  Carlo simulations
- **Synergy Heatmap:** Identify OP/weak stat combinations
- **Dynamic Generation:** Read stats from Balancer config, zero
  hardcoding
- **Interesting Presentation:** Table + heatmap + radar charts
- **Inline Weight Suggestions:** For each stat, show suggested weight
  adjustments based on Round-Robin efficiency (e.g. "OP" → nerf, "weak"
  → buff), wired to `useBalancerConfig`.
- **Auto Stat Balancer Sessions:** Optional multi-iteration loop that
  runs Round-Robin, updates weights within safe bounds, and records each
  iteration as a session step.
- **Balance History:** Dedicated history of stat-balance runs/sessions
  (weights + key metrics) with the ability to inspect and compare past
  runs.

**Deliverables:**

- `StressTestArchetypeGenerator.ts` - Dynamic archetype creation
- `RoundRobinRunner.ts` + helpers - Round-Robin NxN stat efficiency
  engine
- `metrics.ts` - Marginal utility, synergy metrics & factor tables
- UI Components: `StatStressTestingPage`, `StatEfficiencyTable`,
  `MatchupHeatmap`, `EfficiencyRadar`, `MarginalUtilityTable`,
  `SynergyHeatmap`, `StatProfileRadar`
- `useRoundRobinTesting()` hook - Integration with Balancer config
- `StatWeightAdvisor` service - Suggest stat weight adjustments from
  Round-Robin results
- `AutoStatBalancer` engine - Optional multi-iteration auto-balance
  pipeline on `BalancerConfig.stats[*].weight`
- `StatBalanceHistoryStore` - History of stat-balance runs & sessions
  (weights + metrics)

**Success Criteria:**

- ✅ All stats tested individually (no hardcoding)
- ✅ All stat pairs tested (C(n,2) combinations)
- ✅ Marginal utility scores calculated via simulation
- ✅ Synergy heatmap identifies OP/weak combinations
- ✅ Deterministic (LCG seeded, reproducible)
- ✅ Results exported for analysis

**Timeline:** 3-4 days (after Phase 10 completion)

---

### 🔥 **PHASE 12.5: VillageSandbox Skeleton-First Refactor (NEW)**

**Status:** 🔄 In Progress  
**Scope:** Refactor VillageSandbox.tsx da 1650+ righe a componenti
modulari piccoli.

**Documenti:**

- **📋 Plan:**  
  [Village Sandbox Refactor Plan][village-sandbox-plan]
- **✅ Tasks:**  
  [Village Sandbox Refactor Tasks][village-sandbox-plan]  
  (sezione TODO)

[village-sandbox-plan]: plans/village_sandbox_refactor_plan.md

**Approccio Skeleton-First:**

1. **Freezare attuale** come `VillageSandbox.reference.tsx` (commentato
   per backup).
2. **Creare scheletro** minimale che compila (layout base, header,
   placeholder colonne).
3. **Estrarre incrementalmente** componenti con contratti API chiari
   (unit + e2e test prima dell'integrazione).
4. **Validare ogni passo** mantenendo build verde e test passanti.

**Sezioni da estrarre:**

- `ResidentRosterPanel` (roster + feedback)
- `ActivityArea` (grid attività + LocationCard)
- `DetailPanelStack` (overlay detail)
- `TheaterOverlay` (theater verbs + drop)
- `AncillaryPanels` (HUD, risorse, trade, migrations)

**Timeline:** 1-2 settimane, con possibilità di lavoro parallelo su
componenti indipendenti.

---

### 📋 **PHASE 3: Scenario Configuration UI (Planned)**

**Status:** 0% (Planned)

| Document     | Purpose                                                  |
| ------------ | -------------------------------------------------------- |
| **📋 Plan**  | [plans/scenario_ui_plan.md](plans/scenario_ui_plan.md)   |
| **✅ Tasks** | [plans/scenario_ui_tasks.md](plans/scenario_ui_tasks.md) |

**Overview:**

- Configure combat scenarios (1v1, Swarm, Boss)
- Stat effectiveness multipliers

---

### 📋 **PHASE 6: 1v1 Combat Polish (Planned)**

**Status:** 80% Done, needs polish

| Document     | Purpose                                              |
| ------------ | ---------------------------------------------------- |
| **📋 Plan**  | [plans/1v1_combat_plan.md](plans/1v1_combat_plan.md) |
| **✅ Tasks** | [plans/1v1_tasks.md](plans/1v1_tasks.md)             |

**Remaining Work:**

- Mana system integration
- Status effects (stun, slow, silence)

---

### 🔄 **PHASE 7: Balance Configuration Persistence (Planned)**

**Status:** 0% (Design Complete)

**Documenti:**

- **📋 Plan:**  
  [Session 886ac1dc: balance_persistence_ui_redesign_plan.md](../../.gemini/antigravity/brain/886ac1dc-4b8b-4d7e-82fe-5f57bf201bde/balance_persistence_ui_redesign_plan.md)

**Overview:**

- **Persistent Storage:** localStorage + JSON export for all balance
  modifications
- **Version Control:** Semantic versioning with history tracking (last
  10 changes)
- **Migration System:** Automatic schema migration with conflict
  detection
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

**Documenti:**

- **📋 Plan:**
  [plans/combat_expansion_plan.md](plans/combat_expansion_plan.md)
- **✅ Tasks:**  
  [Session 41fb7f12: task.md](../../.gemini/antigravity/brain/41fb7f12-d062-4270-aae4-b1bb5d18a77f/task.md)
- **📊 Analysis:**  
  [Session 41fb7f12: combat_system_expansion_analysis.md](../../.gemini/antigravity/brain/41fb7f12-d062-4270-aae4-b1bb5d18a77f/combat_system_expansion_analysis.md)

**Overview:** Expand combat system from 1v1 to full tactical grid-based
multi-unit combat:

- **Phase 9.1:** Foundation - Initiative system + Status effects (stun,
  buff, debuff)
- **Phase 9.2:** Grid Combat 2D - Pathfinding (A\*), range/LOS, basic AI
- **Phase 9.3:** Multi-Unit - AoE mechanics, team synergies (5v5,
  5vMany, boss fights)
- **Phase 9.4:** Polish - Performance optimization, advanced AI

**Key Features:**

- Initiative-based turn order (agility stat + variance)
- Status effects: Stun, DoT, Buff/Debuff with duration tracking
- Grid movement: A\* pathfinding, Dijkstra range calculation
- AI opponents: Target selection, tactical movement, spell/attack
  priority
- AoE system: Circle/Line shapes, friendly fire options
- Team synergies: Flanking, focus fire, formation bonuses

**Design Decisions (Default):**

- ✅ New `agility` stat for initiative (weight 0.5 HP/point)
- ✅ Dynamic initiative (re-roll each round)
- ✅ AoE damage formula: Single-target × 0.65, Cost × 2.0
- ✅ Hybrid friendly fire: "Safe" spells (no FF, 0.5× dmg) vs
  "Dangerous" (with FF, 1.0× dmg)
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

## Current Focus

### 🧹 SAFE Cleanup Audit (24 Dec 2025)

- **Status:** ✅ COMPLETED
- **Scope:** Phases 1-3 (audit, asset relocation, build fix)
- **Documenti:**  
  [docs/reports/safe-audit-2025-12-24.md](../docs/reports/safe-audit-2025-12-24.md)

#### Highlights

1. Architettura SAFE confermata.
2. Asset obsoleti spostati in `/archive`.
3. Build Vite/Playwright ripristinata senza regressioni.

### Skill Check Preview Lab Refactor (24 Dec 2025)

- **Status:** PLANNING
- **Scope:** Skill Check Preview Lab UI + V6 integration
- **Documenti:**
  - [plans/skill_check_preview_lab_plan.md](plans/skill_check_preview_lab_plan.md)
  - [plans/skill_check_preview_lab_tasks.md](plans/skill_check_preview_lab_tasks.md)

**Key Objectives:**

- Eliminare la tab “Alt Visuals” e usare AltVisuals V6 come unica
  visualizzazione del Dispatch Polygon.
- Sostituire i controlli legacy (Shot Power, Spin Bias, Lancia pallina)
  con “Riavvia scena” e “Ritira dado”.
- Implementare la logica di cardinalità per distribuire le icone stat
  (derivate dal balancer) sui 5 punti cardinali.
- Garantire compliance alle regole config-first + JSDoc e aggiornare i
  test UI.

**Ownership:** Testing Tools / Balancer UI Team (Skill Check Preview
stream)

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
9. ❌ Pulsante Elimina: posizione sbagliata, manca cerchio rosso
10. ❌ Pulsante Occhio: non è il più a destra
11. ❌ Icona Lock: stato visivo non chiaro (aperto/chiuso)
12. ❌ Pulsanti Lock, Hide, Reset: non fanno nulla
13. ❌ Icona Lock troppo grande
14. ❌ Import formule: diventano valori secchi
15. ❌ Import/Export: non sembrano funzionare

**Fasi:**

1. Fix Critici (Reset, Export/Import) - 2h
2. UX Pulsanti (riordino, stili) - 1.5h
3. Funzionalità Mancanti (Lock, Hide) - 2h
4. Verifica Formule (round-trip test) - 0.5h

---

### 🗺️ **PHASE 12: Idle Incremental RPG (Village Sandbox Vertical Slice)**

**Status:** 🔄 In Progress  
**Nota:** Punch Club è un tool interno sandbox-only e non deve essere incluso nei materiali marketing pubblici.  
**Roadmap Update (2026-02-13):** adottato il percorso `Minimal Gameplay → Vertical Slice` (`/.windsurf/plans/minimal-to-vertical-slice-roadmap-2d36d2.md`) con stage MG-Finalize → VS-Freeze. Ogni prompt Phase 12 deve indicare in quale stage si trova, riportare preset Style Lab e allegare evidence test (lint/test/build/kanban + Playwright/visual quando applicabile).  
**Latest Progress (2026-01-01):**

- Config-first quest chronicle view-model landed via `useQuestChronicle` hook plus Vitest suite, and MapPage now drives the Quest Chronicle modal from blueprint data (Phase 12.3 “Quest Chronicle UI” partial ✅; CTA wiring + theater integration still pending).

- ✅ Resident roster drag/drop ready: `ResidentRoster` exposes drag
  handles, fatigue badges, and integrates with the new validation
  helpers.
- ✅ Map slot drop validation & feedback: `VillageSandbox` +
  `MapSlotActivityCluster` enforce slot compatibility, stat
  requirements, fatigue thresholds, and locked-slot rules with localized
  copy.
- ✅ ActivityCard refactor adopted on the map: scheduled jobs/quests and
  quest offers render via `buildScheduledVerbSummary`; drop halo/“Drop
  Resident” affordances polished.
- ✅ Deterministic debug controls: `window.__idleVillageControls`
  (play/pause/advance/assign/getState/getConfig) surfaced for automated
  QA and Playwright flows.
- ✅ Config-first mocks: `IdleVillageConfig` now ships sample
  `statRequirement` + founder `statTags` to exercise validation paths.

**Next Steps (per Master Plan v2.0 + Roadmap MG→VS):**

1. **MG-Finalize (Gate)** – completare upgrade visibile, night threat, cursor feedback/log cromatico e polish Game Over; loggare risultati in `IMPLEMENTED_PLAN.md` e Kanban.
2. **VS-Core Loop** – consolidare loop sopravvivenza (mercato, upgrade, minaccia notturna, telemetria) + test di integrazione (`tests/integration/idleVillage/minimalGameplayFlow.test.tsx`).
3. **VS-Juice** – applicare richieste “Juice” (hover drag, tooltip narrativi, log colorato, feedback tattile) con snapshot visivi (`tests/visual/idleVillage/minimal-gameplay.spec.ts`).
4. **VS-Structure** – completare autosave soak + hotkeys tempo, usare Storage Testing Framework per persistence, aggiornare `tests/README.md`.
5. **VS-Freeze** – Playwright spec deterministica (`tests/e2e/idleVillage/minimalGameplay.spec.ts`), flag `MINIMAL_UI_FROZEN=true`, evidence `test-results/minimal-vertical-slice-freeze-<date>.log` e comunicazione ai coordinatori.

> **Scope Descope – Cost/Benefit Review (2026-02-13)**
> - **Exploration Map → Darkest Dungeon “Spedizioni” list**: l’interfaccia a nodi viene sostituita da una lista dinamica di zone con livello/barra progresso e CTA “Boss Fight”. Effetto: ~20% effort risparmiato (niente UI mappa, pathfinding, assets dedicati) a fronte di ~5% potenziale revenue perso per minore fantasia “world map”. Priorità MG-Finalize: mock list view in Style Lab, assets statici per zona, progress hook collegato a riskFactor.
> - **Content Tools (Spell/Equip Editors) mantenuti**: gli editor UI restano in scope perché moltiplicano la produttività futura (creazione asset in ore anziché mesi). Zero impatto sul giocatore, quindi nessun costo commerciale; effort aggiuntivo accettato come “factory investment”. Documentare template JSON generati per archetype/equip e mantenere parity con store Balancer.
> - **Socket/Gems System rimosso dal VS-Core Loop**: le build restano profonde grazie a oggetti prefab con affissi (Fire Sword, Frost Grimoire, ecc.) generati dallo stesso creator tool. Risparmio stimato ~10% effort (UI incastonamento + logica ricorsiva) con perdita di 10–15% potenziale revenue high-end. Decisione: posticipato a update gratuito post-launch; pianificare “Affix Table” config (`data/presets/equip_affixes.json`) per mantenere chiarezza.
> **Gemini Combat Integration Review (2026-02-13)**
> - **Stats Resolver (“pre-processore”)**: prima di invocare `CombatSimulator.simulate` occorre introdurre un resolver che combini archetipi Balancer, equip e gemme del giocatore in un `EntityStats` deterministico. Il resolver diventa parte della stage MG-Finalize → VS-Core Loop gate, ed è il ponte tra i sistemi config-first (Balancer/SpellCreator) e il motore fisico.
> - **Skill-driven action phase**: `resolveCombatRound` va esteso per leggere `entity.currentSkill` (o loadout attivo) e delegare a moduli esistenti (HitChance, Critical, Sustain, StatusEffectManager) in base al tipo di skill (damage/heal/buff). Questa refactor è prerequisito per VS-Core Loop, quando il sistema di spell del player deve poter sostituire l’attacco base.
> - **Replay-first UI**: la combat UI del Vertical Slice deve funzionare come “player” della `timeline` prodotta dal simulatore. Il front-end non calcola nulla: riproduce snapshot, HP delta e log per ogni turn frame, garantendo zero divergenza tra motore e presentazione.
> - **Stat snapshot vs. dirty calc**: il motore continua a usare `StatBlock` risolto prima del match; durante il combattimento gli unici ricalcoli sono quelli dei buff/debuff gestiti da `StatusEffectManager` all’inizio del turno (nessun dirty-flag fine-grained). Se servono nuove stats (equip swap), si rigenera il loadout via resolver e si riavvia il match.
> - **Risk-based XP & Loot**: introdurre `riskFactor = enemyPower / heroPower` nel post-processing del `CombatResult` per moltiplicare XP, assegnare “Golden Stat Points” sopra una soglia (es. >1.5) e alimentare un loot generator “statico scalabile” (oggetti prefab che vengono promossi di tier in base al riskFactor / tierMultiplier).
> - **Legacy Vault meta-progression**: il Game Manager mantiene un `LegacyVault` (meta currency, storedItems, hallOfHeroes, unlockedBlueprints) che sopravvive ai wipe. Le run successive possono partire con archetipi/equip/skill/building sbloccati, incentivando il loop “snowball fino a spaccare il gioco”.

**Canonical Plan:**
[Village Sandbox “Gilded Heroism” Master Plan v2.0](plans/idle_village_map_only_plan.md)  
**Supporting
Plans:**
|[Village Sandbox ActivityCard Refactor](plans/village_sandbox_activitycard_refactor_plan.md),
|[Village Sandbox Theater View & Trial of Fire](plans/idle_village_trial_of_fire_plan.md),
|[Village Sandbox Drag & Drop E2E](plans/idle_village_drag_drop_e2e_plan.md),
|[Physical E2E Testing System](plans/physical_e2e_testing_plan.md),
|[Idle Village Progression System](plans/idle_village_progression_system_plan.md) (✅ Phase P0: Production Scaling completato)
  
**Plan
Status Snapshot:**

- Master Plan v2.0: ✅ sections 1–6 aligned (vision, data model,
  Bloom/Trial of Fire, QA, cross-plan integration).
- ActivityCard Refactor: Phase A/B ✅, Phases C–E pending (HUD swap,
  quest-offer polish, Vitest/Playwright).
- Theater View & Trial of Fire: Phase 0 (schema), Phase 1 (engine) ready
  to start; Phases 2–4 (UI/Bloom) pending.
- Drag & Drop E2E: plan finalized, suite partially implemented (needs
  bloom + hero cases once UI lands).

Linked artifacts: `docs/plans/idle_village_tasks.md`,
`docs/plans/idle_village_map_only_plan.md`,
`docs/plans/village_sandbox_activitycard_refactor_plan.md`,
`docs/plans/idle_village_trial_of_fire_plan.md`,
`docs/plans/idle_village_drag_drop_e2e_plan.md`,
`docs/plans/idle_village_progression_system_plan.md`,
`docs/plans/trailer_vertical_slice_plan.md`,
`docs/plans/trailer_vertical_slice_tasks.md`.

---

### 🎬 **Idle Village — Trailer Vertical Slice**

**Status:** 📋 Draft — awaiting component inventory confirmation
**Scope:** 45-second Steam-first cinematic trailer (not a playable build)
**Plan:** `src/docs/docs/plans/trailer_vertical_slice_plan.md`
**Tasks:** `src/docs/docs/plans/trailer_vertical_slice_tasks.md`
**Owner:** Cascade

This is a **marketing artifact** for the Steam page and devlogs. It is intentionally separate from the playable `Idle Village` vertical slice and is not part of the in-game simulation. The trailer uses scripted cinematic sequences, fixed seeds, and deterministic timers.

**Trailer phases (timecoded):**

| Phase | Time | Viewer must see | Key missing components |
|-------|------|-----------------|------------------------|
| **A — Title & Loading** | `00:00 - 00:06` | Title card, deterministic progress bar, living village backdrop | `VillageBackdrop`, `TrailerIntroPage`, `TrailerProgressBar` |
| **B — POI Map** | `00:06 - 00:14` | Map with multiple POI markers appearing; choose one and reject others, then transition to high-risk POI | `PoiMap`, `PoiMapMarker`, `PoiMapRiskBar`, `PoiMapTransition` |
| **C — Three Mock UI Screens** | `00:14 - 00:22` | Forge, Spell, Hero mock UIs with animated numbers and sliders | `ForgeScreen`, `HeroSheet`, `AnimatedNumber`, `MathFlash`, `MockScreenCarousel` |
| **D — Astrolabe Ball** | `00:22 - 00:32` | Scripted astrolabe ball avoiding crimson spikes, loot explosion | `LootExplosion`, `AstrolabeTrailerController` |
| **E — Celestial Forge Unlock & Wishlist CTA** | `00:32 - 00:45` | Village dissolve, Celestial Forge unlock, wishlist sign | `VillageDissolveTransition`, `ParticleField`, `CelestialForgeUnlockAnimation`, `WishlistSign` |

**Component inventory (existing vs missing):**

| Phase | Existing | Missing |
|-------|----------|---------|
| A | `ActionProgressBar`, `MapPage` background | `VillageBackdrop`, `TrailerIntroPage`, `TrailerProgressBar` |
| B | `QuestPOI`, `GenericPoiSkin`, `LocationCard`, `MapPage`, `useMapContext` | `PoiMap`, `PoiMapMarker`, `PoiMapRiskBar`, `PoiMapTransition`, `PoiMapConfig` |
| C | `SpellCreatorNewMockup`, `SpellCreatorNew`, `SpellEditor`, `SpellLibrary`, `SpellBuilder`, `CharacterCreator`, `CharacterBuilder`, `PgDetailCard`, `StatAllocationCard`, `EnhancedStatSlider`, `ConfigurableCard`, `ConfigurableStat` | `ForgeScreen`, `HeroSheet`, `AnimatedNumber`, `MathFlash`, `MockScreenCarousel` |
| D | `DestinyAstrolabe`, `SkillCheckLegend`, `pinballPhysics`, `IdleVillagePinballMonitor` | `LootExplosion`, `AstrolabeTrailerController` |
| E | `VillageDissolveTransition` (particle dissolve overlay) | `ParticleField`, `CelestialForgeUnlockAnimation`, `WishlistSign`, `PostTrailerPage` |

**Specialist feedback:**

- **UI text in the trailer must be at least 20% larger** than the final game UI (e.g. `Day 42`, `+30% Area`, `Blueprint Unlocked`).
- Steam client reduced windows / Steam Deck viewing means counters must be readable at a glance or the “strategic brain” effect is lost.
- The 45-second trailer is high-impact marketing: the goal is the Coming Soon page and collecting niche wishlists.

**Implementation guardrails:**

- Scripted cinematic; fixed seeds, deterministic timers, and pre-baked state machines.
- Config-first: `src/balancing/config/idleVillage/trailerConfig.ts` (or the plan doc until implementation begins) owns all timing, copy, palette, and camera keyframes.
- Reuse existing frozen kits (`pgcardKit`, `slotRackKit`, `skillCheckKit`, `questPoiSkinConfig`) instead of duplicating styling.
- No implementation starts until the user confirms the component inventory.
- Each phase runnable independently in Storybook or `/trailer-phase-<x>` route.
- Telemetry: `trailer_phase_completed`, `trailer_wishlist_cta_shown` (opt-in).

**Next steps:**

1. Confirm the component inventory (existing vs missing) with the user.
2. Create `trailerConfig.ts` with exact timing, copy, and palette.
3. Implement missing components phase by phase using the `trailer_vertical_slice_tasks.md` checklist.
4. Wire phases into a single `/trailer` route and Storybook stories.
5. Visual regression capture after each phase.

**Marketing note:** `Punch Club` is the internal sandbox-only tool and must not appear in this trailer or any public marketing material.

---

### � **Wanderlust Triumph — Steam Concept Slice (55s Gameplay Teaser)**

**Status:** 📋 Planning  
**Scope:** Hollywood-facade gameplay teaser for Steam; not a playable build.  
**Plan:** `src/docs/docs/plans/wanderlust_triumph_steam_concept_slice_plan.md`  
**Owner:** Cascade

A 55-second, deterministic, linear teaser for the Steam Coming Soon page. It reuses existing `Idle Village` and `Wanderlust` UI components as a **facade** with hardcoded mock data and a scene controller. No backend, no engine simulation, no persistence.

**Key beats:**

1. **0:00–0:05** — Map opens, POIs emerge, `GOBLIN INVASION — 5 DAYS REMAIN` banner.
2. **0:05–0:15** — Living village, asymmetric choice: `Training Grounds` vs `Forgotten Ruins`.
3. **0:15–0:25** — Hero sheet (Attack 15, Defense 8, Magic 12), drag into the `Forgotten Ruins` bronze slot.
4. **0:25–0:32** — `DestinyAstrolabe` with forced injury outcome: `FAILED / HERO INJURED`.
5. **0:32–0:40** — Village desaturates to oxidized grey, `SETTLEMENT LOST` overlay.
6. **0:40–0:50** — Legacy screen: `KNOWLEDGE PRESERVED`, unlocked artifacts/blueprints/survivors.
7. **0:50–0:55** — Outro: `WANDERLUST TRIUMPH` + `PREPARE · ENDURE · TRIUMPH` + `WISHLIST NOW ON STEAM`.

**Implementation approach:**

- New `TeaserSceneController` + `TeaserShowcase` page under `/teaser-showcase`.
- Hardcoded `TeaserConfig.ts` for all timing, copy, hero, POIs, astrolabe result, legacy list.
- Reuse `MapPage`, `VillageSandbox`, `WanderlustRosterCard`, `WanderlustSurface`, `DestinyAstrolabe`, `OutcomeModal`, `HUDNotificationLayer`.
- No modification of existing game components; only a new route in `App.tsx` and optional dev tab in `navConfig.ts`.

---

### �🎯 **SlottedMedal Failed State Implementation ✅ COMPLETED**

**Status:** ✅ Completed (2026-03-01)  
**Evidence:** `test-results/slotted-medal-failed-state-2026-03-01.log`

**Overview:** Extended SlottedMedal components with comprehensive failure state handling for Idle Village activities.

**Key Features:**
- Engine → UI state mapping with `resolveSlotState()` utility
- Failed state animations (shake + fade) with sound feedback
- Telemetry integration with `slot_activity_failed` events
- Config-first design with `DEFAULT_SLOTTED_MEDAL_CONFIG`
- Ref-based control access for external components

**Files Modified:**
- `src/ui/idleVillage/slots/types.ts` - Added failed state types
- `src/ui/idleVillage/utils/slotStateMapping.ts` - State mapping utility
- `src/ui/idleVillage/hooks/useSlottedMedalBehavior.ts` - Failed state behavior
- `src/ui/idleVillage/components/SlottedMedal.tsx` - Ref support
- `src/ui/idleVillage/components/ResidentSlotRack.tsx` - Activity state integration

**Integration Points:**
- TimeEngine activity states → UI medal states
- Failure type classification (injury/death/mission_failure)
- Visual and audio feedback systems
- Telemetry event pipeline

**Documentation:** See `docs/SLOTTED_MEDAL_FAILED_STATE_IMPLEMENTATION.md` for complete implementation guide.

---

### 🔥 **PHASE 10: Config-Driven Balancer (ACTIVE)**

**Status:** 📋 In Progress (dopo fix UI)  
**Priority:** Alta  
**Effort:** 12-16 ore

**Documenti:**

- **📋 Plan:**  
  [plans/config_driven_balancer_plan.md](plans/config_driven_balancer_plan.md)
- **✅ Tasks:**  
  [plans/config_driven_balancer_tasks.md](plans/config_driven_balancer_tasks.md)

**Obiettivo:** Trasformare il Balancer in un sistema completamente
configurabile da UI:

- **Card** (moduli di combattimento) creabili, rinominabili,
  riordinabili, eliminabili da UI
- **Stat** aggiungibili dentro le card con nome, peso, min/max/step,
  valore default
- **Formule derivate** creabili/editabili con validazione real-time
  (solo stat esistenti)
- **Core** (hp, damage, htk) sempre presente, non eliminabile, ma
  pesi/range editabili
- **Persistenza** in localStorage; ultimo salvataggio = default al
  reload
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

1. **Break Down EnhancedStatSlider** → Orchestrator +
   `StatSliderHeader`, `StatSliderTrack`, `StatSliderTick`, and
   `useStatSlider` hook (target ≤60 lines per file).
2. **Extract CSS Modules** → Move inline/Tailwind overrides into
   `EnhancedStatSlider/styles.module.css` to keep theme tokens
   centralized.
3. **Add Regression Tests** → Cover tick selection/add/remove and malus
   rendering to stabilize future iterations.

**Next Action:** Implement Point 1 (component split) before
styling/tests.

---

### 🔄 **Async Persistence System Migration (COMPLETED)**

**Status:** ✅ COMPLETED (2025-12-24)  
**Scope:** Complete migration from synchronous localStorage to async
PersistenceService.ts

**What was done:**

- ✅ Created `PersistenceService.ts` with Tauri FS support and
  localStorage fallback
- ✅ Migrated all storage classes: `BalancerConfigStore`,
  `spellStorage`, `presetStorage`, `useDefaultStorage`,
  `createJsonConfigStore`, `VillageStateStore`, `characterPersistence`,
  `ArchetypeStorage`, `StatBalanceHistoryStore`, `SpellConfigStore`,
  `BalanceConfigManager`, `AutoStatBalanceService`
- ✅ Made all storage operations async with proper error handling
- ✅ Mobile-ready fallback (localStorage when Tauri not available)
- ✅ Created and ran verification script - all tests passed ✅
- ✅ Deleted verification script per protocol

**Impact:** All state changes now use async persistence, enabling future
Tauri mobile deployment and ensuring data integrity across browser tabs.

---

### Testing & QA Infrastructure (Cross-Phase)

**Status:** 0% (Planned)

| Document | Purpose |
| --- | --- |
| **Plan** | [Testing Infrastructure Plan][testing-plan] |
| **Tasks** | [Testing Infrastructure Tasks][testing-tasks] |

[testing-plan]: plans/testing_infrastructure_plan.md
[testing-tasks]: plans/testing_infrastructure_tasks.md

**Overview:**

- Unified testing layers (lint, config healthcheck, domain/simulation,
  UI components, Playwright E2E).
- Single entry points via npm scripts (`test:all`, `test:all:quick`).
- Config-first validation of BalancerConfig, solver behavior, and key UI
  surfaces (Balancer, Stat Stress Testing).

---

### 📋 **PHASE 11: Tactical Missions (Narrative Quest System)**

**Status:** 0% (Concept Defined)  
**Concept:** "Darkest Dungeon Curios" meets "Idle Expedition".

**User Vision:** Sistema di quest "D&D-style" a fasi multiple, puramente
testuale/narrativo con reward variabili. _Structure:_ Intro Narrativa →
Skill Check/Combattimento → Scelta → Skill Check/Combattimento → Outro +
Reward.

**Core Mechanics:**

1. **Quest Phases:** Ogni missione è una sequenza di Nodi (3-5 step).
2. **Stat Checks:** I nodi non-combat richiedono check su stat
   specifiche (es. `Stamina` per scalare, `Wisdom` per decifrare).
3. **Risk/Reward:** Successo = loot migliore/buff per il nodo
   successivo. Fallimento = danno/debuff/minor loot.
4. **Narrative Flavor:** Testi brevi saporiti ("You find a glowing
   altar...") invece di cutscene costose.
5. **Partial Success:** Il reward finale dipende dal numero di
   "Successi" accumulati nelle fasi.

**Deliverables:**

- [ ] `QuestEngine`: Gestore di macchine a stati per le quest (Node
      sequence).
- [ ] `SkillCheckSystem`: Calcolatore probabilità basato su stat entità
      vs difficoltà nodo.
- [ ] `QuestUI`: Interfaccia stile "libro/pergamena" con log testuale e
      scelte.
- [ ] `QuestData`: Struttura JSON per definire quest, nodi, testi e
      reward (Config-Driven).

---

### Future Direction (After Config-Driven Balancer)

The next evolution of the project is organized around six macro-goals:

1. **Config-Driven Spell Creator**
   - Applicare lo stesso pattern del Balancer allo Spell Creator.
   - Stat, formule, preset configurabili da UI.
   - Piano di implementazione e migrazione:
     [plans/spell_creator_new_plan.md](plans/spell_creator_new_plan.md).

2. **UI Optimization Page-by-Page (Core First)**
   - Rifinire Balancer e Spell Creator (Tier 1), poi le altre pagine.
   - Interventi solo visivi/UX separati da cambi strutturali.
   - Piano dettagliato in
     [plans/responsive_ui_plan.md](plans/responsive_ui_plan.md), con
     **Balancer** come prima pagina target mobile+desktop.

3. **Page Curation (Keep / Archive)**
   - Classificare tutte le pagine per importanza (Core / Support /
     Demo).
   - Tenere solo le superfici davvero utili; spostare mock vecchi in
     `docs/archive/`.

4. **Reusable Gilded UI Components**
   - Creare una libreria di componenti estetici riciclabili (button,
     card, input, slider, stat row).
   - Copiare tutte le funzionalità dai componenti legacy senza
     modificarle, poi applicare il nuovo stile.
   - Ogni componente rifatto ha una propria pagina di test dedicata.

5. **JSON-Driven Non-Regression for Balancer & Spell Creator**
   - Spostare preset e expected values in JSON; test di non-regressione
     leggono da lì.
   - Ogni modifica a Balancer/Spell Creator o ai loro componenti core
     deve far girare questi test.
   - Stessa logica applicata ai componenti interni chiave.

6. **Idle Incremental RPG (Phase 12, Product Phase One)**
   - Prodotto principale Phase One: meta-gioco idle/incremental
     giocabile sul lungo periodo (mesi), senza progressione offline in
     V1: il tempo avanza solo mentre il gioco è aperto.
   - Focus su un founder "raro" (≈1% rispetto alla popolazione) e su un
     villaggio di lavoratori più scarsi: morte del protagonista e
     collasso del villaggio sono eventi normali che innescano nuove run.
   - Meta-progression persistente tramite edifici/upgrade non
     distruttibili che migliorano lo start delle run successive (più
     risorse iniziali, spell/equip di partenza, possibilità di eredi che
     ripartono da zero con piccoli bonus).
   - Core loop: allenare/mandare in combattimento il founder (jobs di
     combattimento tipo "ratti in città", early explore) mentre i
     lavoratori producono risorse tramite jobs e quest rischiose;
     prepararsi a ondate periodiche stile "They Are Billions" in cui
     tutti i personaggi disponibili difendono il villaggio.
   - Mid/late game: sblocco di quest e raid che richiedono party ampi
     (prima 5, poi fino a ~20 personaggi equipaggiati), mantenendo al
     centro il combat/Entity system esistente e il worker placement
     config-driven (jobs, edifici, quest, rischi definiti in
     `src/balancing/config/*`).
   - Vision & design document:
     [GAME_VISION_IDLE_INCREMENTAL.md](GAME_VISION_IDLE_INCREMENTAL.md).
   - **FTUE & Vertical Slice:** primi 30–60 minuti pianificati in
     [plans/idle_village_ftue_plan.md](plans/idle_village_ftue_plan.md);
     la vertical slice deve permettere almeno un ciclo completo run →
     meta → nuova run.
   - **Art Style & Visual Direction:** linee guida per stile grafico,
     palette e pipeline in
     [plans/idle_village_art_style_plan.md](plans/idle_village_art_style_plan.md).
   - **Village Sandbox ActivityCard Refactor (UI Focus):** plan in
     [plans/village_sandbox_activitycard_refactor_plan.md](plans/village_sandbox_activitycard_refactor_plan.md)
     with tasklist dedicated in
     [plans/idle_village_tasks.md](plans/idle_village_tasks.md) →
     unifica le ActivityCard su mappa/HUD e prepara il refactor dei
     marker.
   - **Idle Village Map-Only Verb System:** nuovo piano dedicato in
     [plans/idle_village_map_only_plan.md](plans/idle_village_map_only_plan.md)
     per integrare verb passivi, job continui e quest expiry sulla
     pagina mappa, con checklist collegata in `idle_village_tasks.md`.
   - **Idle Village Theater View & Trial of Fire:** nuovo piano in
     [plans/idle_village_trial_of_fire_plan.md](plans/idle_village_trial_of_fire_plan.md)
     per introdurre heroism stats, auto-looping activities e il
     contenitore TheaterView; tasklist nella sezione 12.11 di
     `idle_village_tasks.md`.
   - **Idle Village Trial of Fire Runtime Config:** piano operativo in
     [plans/trial_of_fire_runtime_plan.md](plans/trial_of_fire_runtime_plan.md)
     che copre il modulo `villageConfig`, la pagina designer
     `/debug/balancer/village`, e il refactor di
     `resolveActivityOutcome`; tasklist aggiornata in
     `idle_village_tasks.md` (Phase 12.12).

---

### PHASE 12.0: Offline Progress Decision (CRITICAL PRE-LAUNCH)

**Status:** TODO (Blocking per posizionamento marketing)  
**Priority:** Alta - Influenza naming, Steam tags, e aspettative
giocatori

> [!CAUTION] La ricerca di mercato (Dic 2024) indica che **la mancanza
> di offline progress è un deal-breaker** per la maggioranza dei
> giocatori che cercano "idle games" su Steam. Frasi comuni in negative
> reviews: "not a idle game", "when you close it you don't make any
> progress".

**Impatto stimato sulle probabilità di revenue Year 1:**

- 🔴 **Perso soldi (<€3k)** → senza offline: ~20% · con offline: ~12%
- 🟠 **Sopravvissuto (€3-10k)** → senza offline: ~40% · con offline: ~38%
- 🟡 **Decente (€10-25k)** → senza offline: ~25% · con offline: ~30%
- 🟢 **Successo (€25-50k)** → senza offline: ~12% · con offline: ~15%
- 🔵 **Hit (€50k+)** → senza offline: ~3% · con offline: ~5%

**Delta chiave:** Il rischio di "perso soldi" scende da 20% a ~12% con un basic
offline progress. Il rischio combinato di stare sotto €10k scende da 60% a ~50%.

#### Opzioni di Design

- **A. Full Offline:** risorse prodotte mentre l'app è chiusa
  (cap ~24h).  
  - Pro: allineato alle aspettative "idle".  
  - Contro: calcolo retroattivo complesso, rischio abusi.  
  - Effort: 2-3 settimane.
- **B. Limited Offline:** solo alcune risorse (gold base, no XP
  combat), cap 4-8h.  
  - Pro: bilanciamento più facile, monetizzabile (time warp).  
  - Contro: può sembrare "mezzo idle".  
  - Effort: 1-2 settimane.
- **C. Battery Saver Only:** nessun offline, ma modalità low-power in
  background.  
  - Pro: effort minimo.  
  - Contro: non risolve aspettative "idle", rischio review negative.  
  - Effort: 2-3 giorni.
- **D. Rebranding:** rimuovere "Idle" dal titolo/tags, posizione
  "Management Sim".  
  - Pro: evita aspettative sbagliate.  
  - Contro: perde nicchia idle, più competizione con management games.  
  - Effort: decisione (0 giorni).

#### Decisione Raccomandata

**Option B (Limited Offline)** come compromesso:

- Implementa offline progress per risorse base (gold, materiali
  production)
- **NO** offline progress per combattimento/XP (mantiene engagement
  attivo per core loop)
- Cap a 4-8 ore (incentiva check-in regolari)
- Monetizza "Time Warp" per saltare ore di produzione

#### Deliverables (Aggiornamento 2026-02-09)

- ❌ **CANCELLATO – Offline Calculation:** il task viene archiviato; niente `OfflineProgressCalculator.ts` né formule di accumulo finché non verrà presa una nuova decisione strategica.
- ✅ **Decision Document:** resta utile solo per documentare perché il focus è passato al loop live (notare la scelta "niente offline" e i rischi accettati).
- ✅ **UI Copy Refresh:** aggiornare messaging per sottolineare che il gioco va tenuto aperto ("second monitor mode"), evitando promesse di progresso offline.
- ✅ **Loop Engagement Notes:** documentare quali elementi rendono il game loop divertente mentre la finestra è aperta (telemetria di retention, eventi dinamici, audio/FX).

#### Timeline

- Decision: 1-2 giorni (playtesting mentale + revisione design pillars)
- Implementation (se B): 1-2 settimane
- Testing: 2-3 giorni

1. **Updated Philosophy & Guidelines**
   - Allineare `PROJECT_PHILOSOPHY.md` e `DEVELOPMENT_GUIDELINES.md`
     con:
     - approccio **config-first** (formule/layout da config, non da UI),
     - UI come vista sulle config/balancing modules,
     - tema **Gilded Observatory** e token di colore centralizzati.

Questa sezione definisce la direzione strategica; i dettagli di ciò che
è già stato fatto restano in `IMPLEMENTED_PLAN.md`.

**Milestones publishing/marketing (Idle Incremental RPG):**

- Dopo la prima versione stabile del loop base (Phase 12.1–12.5):
  - Creare pagina **itch.io** con build web e descrizione minimale (no
    marketing pesante, solo test/feedback).
- Dopo che il FTUE (primi 60 minuti) è allineato al piano FTUE e testato
  internamente:
  - Iniziare devlog regolari (itch.io + X) usando il flusso
    `share update`.
- Quando la vertical slice permette un ciclo completo run → meta → nuova
  run ed è stabile:
  - Creare pagina **Steam Coming Soon** con trailer breve e materiale
    visivo.
  - Valutare in quale Steam Next Fest targettizzare la demo e
    pianificare indietro 3–6 mesi per preparazione.
  - Allineare calendario e KPI con il nuovo
    [Go-To-Market “Steam First”](strategy/go_to_market_steam_first.md).

### Go-To-Market “Steam First” (H1 2026)

- **Calendario pubblico:** consultare `strategy/go_to_market_steam_first.md#3-calendario-campagne-steam--kpi`
  per le finestre Feb–Giu 2026 (Steam Page, Next Fest, Playtest#1/#2, Devlog Labs, Launch Readiness).
- **KPI condivisi:** wishlist attive (25k), conversione playtest (≥40%), retention sessione 1 (≥55%),
  broadcast CTR (≥8%), installazioni PWA companion (3k). I dati sono raccolti via SteamWorks Dashboard,
  Steam Playtest Analytics, Telemetria interna e PWA analytics.
- **Owner & tooling:** Cascade coordina marketing + telemetry; Art Pod supporta Next Fest kit; BizOps gestisce pricing.
- **Hook doc:** eventuali cambiamenti marketing devono essere aggiornati prima in `go_to_market_steam_first.md`
  e poi riepilogati qui per mantenere single source of truth.

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
- **"Full Checklist?"** →
  [plans/atomic_evolution_tasks.md](plans/atomic_evolution_tasks.md)
- **"How does it work?"** →
  [design/architecture.md](design/architecture.md)
- **"Cosa esiste davvero ora?"** →
  [IMPLEMENTED_PLAN.md](IMPLEMENTED_PLAN.md)

---

## 📚 RELATED DOCUMENTS

- [README.md](../../README.md) - Documentation index
- [DEVELOPMENT_GUIDELINES.md](../../DEVELOPMENT_GUIDELINES.md) - **⚠️
  MUST READ** before coding
- [task.md](task.md) - Aggregate progress tracker
- [GAME_VISION_IDLE_INCREMENTAL.md](GAME_VISION_IDLE_INCREMENTAL.md) -
  Idle Incremental RPG product vision (Phase 12 / Product Phase One)

---

## 🏰 Archmage Milestones

The project has transitioned to the "Archmage: Transcend the Transcendence" direction, focusing on spell-creatures, mental palaces, and incremental/tactical gameplay.

Key milestones:

- Documentation refactor complete (`docs/archmage/`)
- Spell lifecycle implementation
- Mental Palace systems
- Expedition and duel mechanics
- Persistence and telemetry integration

For details, see `docs/archmage/README.md`.

### Immediate Priority (Post-current Prompt)

1. **✅ Punch Club Gameplay Loop Closure** – Reactivated the legacy loop (duels, tutorial, telemetry) and certified via safeguard suite. **COMPLETED** 2026-01-13.
2. **Gatekeeping Rule** – No new Archmage features begin until KS-PUNCH milestone is marked "Completato" on Kanban with evidence logs. **RESOLVED**.

---

**Next Review:** End of Week 8 (2025-12-16)  
**Last Updated:** 2026-01-15 00:00
