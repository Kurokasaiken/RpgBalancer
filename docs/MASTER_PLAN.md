# 🎯 RPG Balancer - MASTER PLAN

> **Navigator + Governance** - Single source of truth for project organization

**Last Updated:** 2025-11-27  
**Total Tasks:** 500+ (across dedicated task files)  
**Current Phase:** Phase 5: Universal Creators

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
├─────────────────────────────────────────────────────┤
│ TOTAL PROGRESS: ███████████░░░░░░░░░ 45%           │
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

**Status:** 15% (In Progress)

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

**Status:** Phase 1 starting - Core Engine implementation

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

## 🎯 CURRENT FOCUS

### This Week: Phase 2 - Archetype Balancing

**Next 3 Tasks:**
1. Define 16 base archetypes (Tank, DPS, etc.)
2. Build ArchetypeBuilder service
3. Implement TTK Testing Engine

**📋 Full checklist:** [plans/archetype_tasks.md](plans/archetype_tasks.md)

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

**Next Review:** End of Week 7 (2025-12-09)  
**Last Updated:** 2025-11-27 22:30
