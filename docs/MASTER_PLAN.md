# 🎯 RPG Balancer - MASTER PLAN

> **Navigator + Governance** - Single source of truth for project organization

**Last Updated:** 2025-11-30  
**Total Tasks:** 600+ (across dedicated task files)  
**Current Phase:** Phase 2.3: 1v1 Balancing Module (Balance Tuning Complete)

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
┌─────────────────────────────────────────────────────┐
│ PHASE                    STATUS      TASKS          │
├─────────────────────────────────────────────────────┤
│ Phase 1: Foundation      ✅ DONE    ~160 tasks     │
│ Phase 2: Archetypes      🔄 ACTIVE  ~200 tasks     │
│ Phase 3: Scenario UI     📋 TODO    ~50 tasks      │
│ Phase 4: Atomic UI       ✅ DONE    ~60 tasks      │
│ Phase 5: Universal       ⏸️ PAUSED  ~40 tasks      │
│ Phase 6: Logic Sep.      📋 TODO    ~30 tasks      │
│ Phase 7: Persistence     ✅ DONE    ~25 tasks      │
│ Phase 8: Fantasy UI      ✅ DONE    ~50 tasks      │
│ Phase 9: Combat Exp.     ✅ DONE    ~100 tasks     │
├─────────────────────────────────────────────────────┤
│ TOTAL PROGRESS: ████████████████░░░░ 80%           │
└─────────────────────────────────────────────────────┘
```

---

## 🗺️ DETAILED PLANS & TASKS

### ✅ **PHASE 1: Foundation Systems (Complete)**

**Status:** 100% Done  
**Report:** [reports/walkthrough.md](reports/walkthrough.md)  
**Tasks Completed:** ~160 (including improvements)

<details><summary><b>View Summary</b></summary>

- ✅ Core system (stats, combat, modules)
- ✅ Weight calibration (damage=5.0, armor=5.0, etc.)
- ✅ SpellCostModule + UI integration
- ✅ Test suite (82 tests passing)
- ✅ Critical bug fixes + recalibration
- ✅ **Spell Creation UI refinements**
- ✅ **Node.js v20 upgrade** (.nvmrc created)
- ✅ **Development Guidelines** (MUST READ before coding)
- ✅ **Codebase audit** (Single Source of Truth violations)

### 3.1 Command Line Runner
- [x] Create `src/balancing/simulation/cli.ts` <!-- id: 53 -->
- [x] Add argument parsing (entity configs, iterations) <!-- id: 54 -->
- [x] Add progress display (console output) <!-- id: 55 -->
- [x] Add results summary display <!-- id: 56 -->
- [x] Add export to file option (Console Table) <!-- id: 57 -->

### 3.2 Integration
- [x] Add npm script `npm run simulate` (renamed to `calibrate`) <!-- id: 58 -->
- [x] Document CLI usage in README (Walkthrough) <!-- id: 59 -->

</details>

---

### 🔄 **PHASE 4: Atomic Evolution (Complete)**

**Status:** 100% Done (Foundation for Universal Creators)

| Document | Purpose |
|----------|------------|
| **📋 Plan** | [plans/atomic_evolution_plan.md](plans/atomic_evolution_plan.md) |
| **✅ Tasks** | [plans/atomic_evolution_tasks.md](plans/atomic_evolution_tasks.md) |

**Overview:**
- **Atomic Design** implementation (Atoms, Molecules, Organisms)
- **Glassmorphism** UI standardization
- **Refactoring** of monolithic components (`EnhancedStatSlider`, `SpellIdentityCard`)
- **Error Boundaries** for robustness

**Key Deliverables:**
- `src/ui/atoms/` library (`GlassCard`, `GlassButton`, `GlassInput`, `GlassSlider`)
- Refactored `SpellCreation` UI
- `ErrorBoundary` implementation

---

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

### 📋 **PHASE 5: Universal Creators (Future)**

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

### ✅ **PHASE 8: Fantasy UI Redesign (Complete)**

**Status:** 100% Done
**Report:** [phase8_walkthrough.md](../../.gemini/antigravity/brain/41fb7f12-d062-4270-aae4-b1bb5d18a77f/phase8_walkthrough.md)

**Decision Date:** 2025-11-30

| Document | Purpose |
|----------|---------|
| **📋 Spec** | [Session 886ac1dc: fantasy_ui_final_spec.md](../../.gemini/antigravity/brain/886ac1dc-4b8b-4d7e-82fe-5f57bf201bde/fantasy_ui_final_spec.md) |
| **🎨 Options** | [Session 886ac1dc: ui_visual_options.md](../../.gemini/antigravity/brain/886ac1dc-4b8b-4d7e-82fe-5f57bf201bde/ui_visual_options.md) |

**Approved Specifications:**

#### Visual Style
- **Art Style:** 2D Vector Art
- **Theme:** Medieval Fantasy (Tavern/Library aesthetic)
- **Mood:** Relaxing, adventurous, serene

#### Color Palette (Custom "Enchanted Forest")
- **Primary:** Sage Green (#b8c5b0), Forest Green (#7fa67e), Mint (#c8dfc7)
- **Secondary:** Sky Blue (#a8c7d7), Ocean Blue (#8cb4c9) - from Palette B
- **Tertiary:** Marble White (#ebe7df) - from Palette B
- **Materials:** Parchment (#f5f1e8), Wood Dark (#4a3f35), Wood Light (#8b7355), Leather (#6b4e3d), Bronze (#cd7f32)

#### Typography
- **Display:** Cinzel (medieval serif)
- **Body:** Crimson Text (readable serif)
- **UI/Numbers:** Lato (clarity)
- **Base Size:** 18px (up from 14-16px)
- **Line Height:** 1.8 (up from 1.5)

#### Spacing & Layout
- **Card Padding:** 48px (2x from 24px)
- **Card Gaps:** 32px (2x from 16px)
- **Reduced Info Density:** 5-7 elements per card (from 10-15)
- **Navigation:** Sidebar book-spine style (max 5-6 visible tabs)

#### Components to Create
1. **Atomic:**
   - FantasyCard (replaces GlassCard)
   - FantasyButton (wood + leather)
   - FantasyInput (parchment bg)
   - FantasySlider (wood track, bronze thumb)
   - FantasySelect (parchment dropdown)

2. **Molecules:**
   - FantasyNavigation (sidebar)
   - FantasyModal (ornate frame)
   - FantasyTooltip (scroll style)

3. **Pages:** Redesign all with new components

**Implementation Plan:**
- **Phase 8.1:** Foundation (CSS variables, theme system, fonts) - 2-3h
- **Phase 8.2:** Atomic components - 4-5h
- **Phase 8.3:** Assets (SVG frames, textures) - 2-3h
- **Phase 8.4:** Molecules - 3-4h
- **Phase 8.5:** Page redesign - 6-8h
  - ⚠️ **REQUIRES UX RESEARCH** before starting:
    - Information presentation best practices
    - Fantasy RPG UI navigation patterns
    - Data density optimization
    - User flow analysis
- **Phase 8.6:** Polish & testing - 2-3h

**Total Estimate:** 19-26 hours

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

### This Week: Phase 6 - 1v1 Combat Polish

**Status:** Planned
**Goal:** Finalize the 1v1 combat experience before moving to advanced scenarios.

**Next Tasks:**
1. Implement Mana System
2. Add Cooldown mechanics
3. Refine Status Effects (visuals)

**Deferred:**
- Phase 3 (Scenario UI) - After polish
- Phase 5 (Universal Creators) - Future

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

---

## 📚 RELATED DOCUMENTS

- [README.md](../../README.md) - Documentation index
- [DEVELOPMENT_GUIDELINES.md](../../DEVELOPMENT_GUIDELINES.md) - **⚠️ MUST READ** before coding
- [task.md](task.md) - Aggregate progress tracker

---

**Next Review:** End of Week 8 (2025-12-16)  
**Last Updated:** 2025-11-30 21:23
