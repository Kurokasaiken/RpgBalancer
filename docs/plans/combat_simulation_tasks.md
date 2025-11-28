# Combat Simulation Testing System - Tasks

**Plan Reference:** [combat_simulation_plan.md](combat_simulation_plan.md)  
**Status:** Phase 1 In Progress

---

## Phase 1: Core Engine (ACTIVE)

### 1.1 Setup & Dependencies
- [x] Install `simple-statistics` npm package <!-- id: 1 -->
- [x] Create directory structure `src/balancing/simulation/` <!-- id: 2 -->
- [x] Create `types.ts` with all interfaces <!-- id: 3 -->

### 1.2 CombatSimulator Implementation
- [x] Create `CombatSimulator.ts` skeleton <!-- id: 4 -->
- [x] Implement turn-based combat loop <!-- id: 5 -->
- [x] Import damage calculation from existing balancing <!-- id: 6 -->
- [x] Import defense calculation from existing balancing <!-- id: 7 -->
- [x] Implement HP tracking <!-- id: 8 -->
- [x] Implement turn limit (max 100 turns) <!-- id: 9 -->
- [x] Implement draw detection <!-- id: 10 -->
- [x] Calculate overkill damage <!-- id: 11 -->
- [x] Add optional turn-by-turn logging <!-- id: 12 -->
- [x] Return complete CombatResult <!-- id: 13 -->

### 1.3 CombatSimulator Testing
- [ ] Create `__tests__/CombatSimulator.test.ts` <!-- id: 14 -->
- [ ] Test: known damage → verify HP loss <!-- id: 15 -->
- [ ] Test: turn limit edge case <!-- id: 16 -->
- [ ] Test: draw conditions <!-- id: 17 -->
- [ ] Test: overkill calculation <!-- id: 18 -->
- [ ] Test: winner determination <!-- id: 19 -->
- [ ] Achieve >90% code coverage <!-- id: 20 -->

### 1.4 MonteCarloSimulation Implementation
- [x] Create `MonteCarloSimulation.ts` skeleton <!-- id: 21 -->
- [x] Implement batch runner loop <!-- id: 22 -->
- [x] Add progress callback support <!-- id: 23 -->
- [x] Calculate win rates <!-- id: 24 -->
- [x] Calculate confidence intervals (95% CI) <!-- id: 25 -->
- [x] Calculate average/median/min/max turns <!-- id: 26 -->
- [x] Calculate turn distribution histogram <!-- id: 27 -->
- [x] Calculate DPT (Damage Per Turn) metrics <!-- id: 28 -->
- [x] Calculate overkill averages <!-- id: 29 -->
- [x] Calculate HP efficiency ratios <!-- id: 30 -->
- [x] Store sample combat logs <!-- id: 31 -->
- [ ] Optimize for performance (<5s for 10k sims) <!-- id: 32 -->

### 1.5 MonteCarloSimulation Testing
- [ ] Create `__tests__/MonteCarloSimulation.test.ts` <!-- id: 33 -->
- [ ] Test: 100 sims trend matches 10k sims (within CI) <!-- id: 34 -->
- [ ] Test: known balanced matchup → ~50% win rate <!-- id: 35 -->
- [ ] Test: extreme mismatch → expected win rate <!-- id: 36 -->
- [ ] Test: confidence interval calculations <!-- id: 37 -->
- [ ] Measure performance (10k sims timing) <!-- id: 38 -->

---

## Phase 2: Analysis Tools (PLANNED)

### 2.1 StatValueAnalyzer Implementation
- [ ] Create `StatValueAnalyzer.ts` skeleton <!-- id: 39 -->
- [ ] Implement baseline simulation runner <!-- id: 40 -->
- [ ] Implement single-stat variation testing <!-- id: 41 -->
- [ ] Calculate HP equivalency per stat <!-- id: 42 -->
- [ ] Calculate confidence for HP values <!-- id: 43 -->
- [ ] Generate balance recommendations <!-- id: 44 -->
- [ ] Create comparison report generator <!-- id: 45 -->

### 2.2 ResultsExporter Implementation
- [ ] Create `ResultsExporter.ts` <!-- id: 46 -->
- [ ] Implement JSON export <!-- id: 47 -->
- [ ] Implement CSV export <!-- id: 48 -->
- [ ] Add metadata (timestamp, config) to exports <!-- id: 49 -->

### 2.3 Analysis Tools Testing
- [ ] Test stat value calculations <!-- id: 50 -->
- [ ] Test export formats validity <!-- id: 51 -->
- [ ] Verify HP equivalency formulas <!-- id: 52 -->

---

## Phase 3: CLI Interface (PLANNED)

### 3.1 Command Line Runner
- [ ] Create `src/balancing/simulation/cli.ts` <!-- id: 53 -->
- [ ] Add argument parsing (entity configs, iterations) <!-- id: 54 -->
- [ ] Add progress display (console output) <!-- id: 55 -->
- [ ] Add results summary display <!-- id: 56 -->
- [ ] Add export to file option <!-- id: 57 -->

### 3.2 Integration
- [ ] Add npm script `npm run simulate` <!-- id: 58 -->
- [ ] Document CLI usage in README <!-- id: 59 -->

---

## Phase 4: UI Dashboard (FUTURE - PAUSED)

### 4.1 Dashboard Component
- [ ] Create `src/ui/testing/CombatSimulationDashboard.tsx` <!-- id: 60 -->
- [ ] Implement entity configurator inputs <!-- id: 61 -->
- [ ] Implement simulation controls <!-- id: 62 -->
- [ ] Add progress indicator <!-- id: 63 -->

### 4.2 Visualizations (NO CHARTS - Basic Tables)
- [ ] Results summary table <!-- id: 64 -->
- [ ] Turn distribution table <!-- id: 65 -->
- [ ] Stat value equivalency table <!-- id: 66 -->

### 4.3 Integration
- [ ] Add "Simulation" tab to App navigation <!-- id: 67 -->
- [ ] Export functionality from UI <!-- id: 68 -->

---

## Documentation & Validation

### Documentation
- [ ] Add JSDoc comments to all public functions <!-- id: 69 -->
- [ ] Create usage examples in plan <!-- id: 70 -->
- [ ] Update MASTER_PLAN.md with completion status <!-- id: 71 -->

### Validation
- [ ] Run 10k sim benchmark test <!-- id: 72 -->
- [ ] Verify formula inheritance (zero hardcoding) <!-- id: 73 -->
- [ ] Manual test: balanced matchup validation <!-- id: 74 -->
- [ ] Manual test: extreme mismatch validation <!-- id: 75 -->

---

**Total Tasks:** 75  
**Phase 1 Tasks:** 38  
**Current Status:** Starting Phase 1.1
