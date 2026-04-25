# Archetype Balancing System - Task Checklist

> **Executable Tasks** for Week 6-10 Archetype System  
> 📋 **Design Context:** [implementation_plan.md](implementation_plan.md)

**Status:** 77/200+ tasks complete (Week 6 DONE ✅, Week 7 Phase 2.1-2.2 DONE ✅)  
**Current Week:** Week 7

---

## WEEK 6: Foundation & Data Models

### Phase 1.1: Core Data Structures (2 days)

- [x] Create `src/balancing/archetype/types.ts`
  - [x] `ArchetypeTemplate` interface
  - [x] `ArchetypeInstance` interface
  - [x] `TTKTarget` interface
  - [x] `BalanceConfiguration` interface
  - [x] `SpellCost` interface (SpellPoints + Tier)

- [x] Create `src/balancing/archetype/constants.ts`
  - [x] Default archetype templates (16 total)
  - [x] Default TTK targets matrix
  - [x] Budget tier definitions (10/20/50/75/100)

- [x] Write `ArchetypeTypes.test.ts` (14 tests - EXPANDED)
  - [x] Should create valid template
  - [x] Should validate stat allocation sums to 100%
  - [x] Should reject negative allocations
  - [x] Should enforce minBudget < maxBudget
  - [x] Should create valid TTK target
  - [x] Should enforce round constraints
  - [x] Should calculate spell points from HP
  - [x] Should assign correct tier

### Phase 1.2: Archetype Builder Service (2 days)

- [x] Create `src/balancing/archetype/ArchetypeBuilder.ts`
  - [x] `buildArchetype(template, budget): StatBlock`
  - [x] `validateAllocation(allocation): boolean`
  - [x] `calculateStatValues(allocation, budget, weights): StatBlock`
  - [x] `optimizeAllocation(template, budget): StatBlock`

- [x] Create `src/balancing/archetype/ArchetypeRegistry.ts`
  - [x] CRUD operations for templates
  - [x] Save/load from JSON
  - [x] Search/filter archetypes
  - [x] Tag system

- [x] Write `ArchetypeBuilder.test.ts` (12 tests)
  - [x] Should build StatBlock at 50 budget
  - [x] Should build StatBlock at 100 budget
  - [x] Should scale stats proportionally
  - [x] Should respect allocation percentages
  - [x] Should throw error if allocation > 100%
  - [x] Should throw error if budget < minBudget
  - [x] Should accept valid 100% allocation
  - [x] Should reject 90% allocation (under)
  - [x] Should reject 110% allocation (over)
  - [x] Should distribute unallocated % intelligently
  - [x] Should not exceed 100% total
  - [x] Should respect locked stats

- [x] Write `ArchetypeRegistry.test.ts` (10 tests)
  - [x] Should add archetype template
  - [x] Should get archetype by ID
  - [x] Should update existing archetype
  - [x] Should delete archetype
  - [x] Should list all archetypes
  - [x] Should filter by category
  - [x] Should search by name
  - [x] Should filter by tags
  - [x] Should save to JSON file
  - [x] Should load from JSON file

### Phase 1.3: Spell Cost Currency System (1 day)

- [x] Update `src/balancing/modules/spellcost.ts`
  - [x] Add `calculateSpellPoints(spell): number`
  - [x] Add `calculateTier(spellPoints): 1|2|3|4|5`
  - [x] Add `getSpellCost(spell): SpellCost`

- [x] Create spell tier constants
  - [x] Tier boundaries (Common/Uncommon/Rare/Epic/Legendary)
  - [x] Visual metadata (colors, icons)

- [x] Write `SpellCost.test.ts` (+7 tests - EXPANDED)
  - [x] Should calculate spell points
  - [x] Should assign tier based on points
  - [x] Should return complete SpellCost object

---

## WEEK 7: Frontend Archetype Builder

### Phase 2.1: Builder UI Components (3 days)

- [x] Create `src/components/balancing/archetype/ArchetypeBuilder.tsx`
  - [x] Category selector (Tank/DPS/Assassin/Bruiser/Support)
  - [x] Budget slider (10-100 points)
  - [x] Stat allocation sliders with pie chart
  - [x] Real-time stat preview panel
  - [x] Save/cancel buttons

- [x] Create `src/components/balancing/archetype/StatAllocationPie.tsx`
  - [x] Interactive pie chart (Recharts)
  - [x] Color coding per stat category
  - [x] Hover tooltips

- [x] Create `src/components/balancing/archetype/ArchetypePreview.tsx`
  - [x] Show final StatBlock values
  - [x] Show estimated power level
  - [x] Warning indicators (imbalanced allocations)

- [x] Write `ArchetypeBuilder.integration.test.tsx` (7 tests)
  - [x] Should render category selector
  - [x] Should render budget slider
  - [x] Should render stat allocation sliders
  - [x] Should update pie chart on allocation change
  - [x] Should show real-time stat preview
  - [x] Should validate before save
  - [x] Should save to registry on submit

### Phase 2.2: Archetype List & Management UI (2 days)

- [x] Create `src/components/balancing/archetype/ArchetypeList.tsx`
  - [x] Category filter dropdown
  - [x] Search bar (filter by name/description)
  - [x] Grid/List toggle
  - [x] Archetype cards (show top 3 stats)
  - [x] Click to view details

- [x] Create `src/components/balancing/archetype/ArchetypeDetail.tsx`
  - [x] Full stat breakdown at multiple budgets
  - [x] Stat allocation pie chart
  - [x] Edit/Delete/Clone buttons
  - [x] Metadata display (version, author, tags)

- [x] Create `src/components/balancing/archetype/ArchetypeManager.tsx`
  - [x] View routing (List/Builder/Detail)
  - [x] Import/Export JSON
  - [x] Delete confirmation
  - [x] Clone archetype featurechup outcome

- [ ] Write `ArchetypeList.test.tsx` (5 tests)
  - [ ] Should render list of archetypes
  - [ ] Should filter by category
  - [ ] Should search by name
  - [ ] Should sort by metrics
  - [ ] Should open editor on click

- [ ] Write `ArchetypeCard.test.tsx` (3 tests)
  - [ ] Should display archetype summary
  - [ ] Should show edit/delete buttons
  - [ ] Should show test results badge

---

## WEEK 7-8: TTK Testing Engine

### Phase 3.1: TTK Test Runner & Validator (3 days)

- [x] Create `src/balancing/archetype/TTKTestRunner.ts`
  - [x] Monte Carlo simulation loop
  - [x] Stat collection (avg, median, min, max)
  - [x] Win rate calculation
  - [x] Stalemate detection

- [x] Create `src/balancing/archetype/TTKValidator.ts`
  - [x] Validate against `TTKTarget`
  - [x] Check rounds within tolerance
  - [x] Verify winner
  - [x] Generate warnings/errors

- [x] Write `TTKTestRunner.test.ts` (12 tests)
  - [x] Should run single matchup (Tank vs DPS)
  - [x] Should calculate average over 1000 sims
  - [x] Should handle stalemate (max rounds timeout)
  - [x] Should test all archetypes vs all archetypes
  - [x] Should return N × N results
  - [x] Should be symmetric (A vs B ≈ inverse of B vs A)
  - [x] Should test at 5 budget levels
  - [x] Should show scaling trends
  - [x] Should identify budget-dependent imbalances
  - [x] Should validate rounds within target ± tolerance
  - [x] Should validate correct winner
  - [x] Should mark out-of-range as invalid
  - [x] Should calculate deviation metrics

- [x] Write `TTKValidator.test.ts` (8 tests)
  - [x] Should pass if rounds in range
  - [x] Should fail if rounds too low
  - [x] Should fail if rounds too high
  - [x] Should pass if winner correct
  - [x] Should fail if wrong winner
  - [x] Should calculate deviation from target
  - [x] Should calculate deviation percentage
  - [x] Should generate warning/error messages

### Phase 3.2: Batch Testing & Reports (2 days)

- [x] Create `src/balancing/archetype/BatchTestRunner.ts`
  - [x] Run all archetypes vs all archetypes
  - [x] Run at all budget levels
  - [x] Parallel execution (via async/await yield)
  - [x] Progress tracking

- [x] Create `src/balancing/archetype/TTKReportGenerator.ts`
  - [x] Generate markdown report
  - [x] Export CSV data
  - [x] Export JSON results
  - [x] Create summary statistics

- [x] Write `BatchTestRunner.test.ts` (5 tests)
  - [x] Should run full matrix
  - [x] Should complete in <5 minutes
  - [x] Should track progress
  - [ ] Should handle errors gracefully
  - [ ] Should return aggregated results

### Phase 3.3: CLI & Tuning (Week 8 - 3 days)

- [ ] Create `src/balancing/archetype/CLI.ts`
  - [ ] Command: `run-balance [preset]`
  - [ ] Command: `compare-presets [presetA] [presetB]`
  - [ ] Command: `analyze-matchup [archA] [archB]`
  - [ ] Interactive mode using `inquirer` or similar

- [ ] Perform Balance Tuning (Iterative)
  - [ ] Run baseline analysis (Standard preset)
  - [ ] Identify top 3 imbalances (e.g., Tank vs DPS)
  - [ ] Create "Experimental" preset with adjustments
  - [ ] Verify improvements with comparative analysis
  - [ ] Promote to "Standard" if successful

- [ ] Write `CLI.test.ts` (3 tests)
  - [ ] Should parse arguments correctly
  - [ ] Should execute correct runner method
  - [ ] Should handle invalid inputs

---

## WEEK 8: Balance Configuration UI

### Phase 4.1: Balance Goals Card (2 days)

- [ ] Create `src/components/balancing/BalanceGoalsCard.tsx`
  - [ ] Tabs component (TTK/Counter/Budget)
  - [ ] Collapsible sections
  - [ ] Save/load configuration

- [ ] Create `src/components/balancing/TTKTargetEditor.tsx`
  - [ ] Add new target button
  - [ ] Edit existing target
  - [ ] Delete target
  - [ ] Matchup selector (dropdowns)
  - [ ] Rounds inputs (min/max/target)
  - [ ] Tolerance slider
  - [ ] Expected winner selector

- [ ] Write `BalanceGoalsCard.test.tsx` (6 tests)
  - [ ] Should render tabs
  - [ ] Should save configuration
  - [ ] Should load configuration
  - [ ] Should validate inputs
  - [ ] Should export/import JSON
  - [ ] Should persist to localStorage

- [ ] Write `TTKTargetEditor.test.tsx` (4 tests)
  - [ ] Should add new target
  - [ ] Should edit target
  - [ ] Should delete target
  - [ ] Should validate constraints

### Phase 4.2: Counter Matrix & Budget Editor (2 days)

- [ ] Create `src/components/balancing/CounterMatrixEditor.tsx`
  - [ ] N × N grid view
  - [ ] Click to set relationship (Strong/Weak/Even)
  - [ ] Color coding (green/red/yellow)
  - [ ] Auto-populate from test results

- [ ] Create `src/components/balancing/BudgetTiersEditor.tsx`
  - [ ] Add new tier button
  - [ ] Edit tier (name, points, description)
  - [ ] Delete tier
  - [ ] Reorder tiers (drag-drop)

- [ ] Write `CounterMatrixEditor.test.tsx` (5 tests)
  - [ ] Should render N×N grid
  - [ ] Should update relationship on click
  - [ ] Should color code cells
  - [ ] Should populate from results
  - [ ] Should save matrix

- [ ] Write `BudgetTiersEditor.test.tsx` (3 tests)
  - [ ] Should add tier
  - [ ] Should edit tier
  - [ ] Should delete tier

---

## WEEK 9: Visualization & Analytics

### Phase 5.1: Result Visualizations (3 days)

- [ ] Create `src/components/balancing/archetype/WinRateHeatmap.tsx`
  - [ ] N × N grid heatmap
  - [ ] Color gradient (red = loss, green = win)
  - [ ] Click cell for details modal
  - [ ] Filter by budget level

- [ ] Create `src/components/balancing/archetype/TTKLineChart.tsx`
  - [ ] X-axis: Matchups
  - [ ] Y-axis: Rounds to kill
  - [ ] Target range visualization
  - [ ] Highlight out-of-range matchups

- [ ] Create `src/components/balancing/archetype/ArchetypeRadar.tsx`
  - [ ] Radar chart (5-6 axes)
  - [ ] Compare 2 archetypes overlay
  - [ ] Interactive tooltips

### Phase 5.2: Dashboard & Reports UI (2 days)

- [ ] Create `src/components/balancing/archetype/ArchetypeDashboard.tsx`
  - [ ] Layout: filters + heatmap + stats panel
  - [ ] Summary metrics card
  - [ ] Quick filters

- [ ] Create `src/components/balancing/archetype/TestResultsPanel.tsx`
  - [ ] Display for selected archetype
  - [ ] Win rate by matchup table
  - [ ] Average TTK
  - [ ] Counters list
  - [ ] Export button

- [ ] Write `ArchetypeDashboard.integration.test.tsx` (8 tests)
  - [ ] Should render dashboard layout
  - [ ] Should filter by category
  - [ ] Should filter by budget
  - [ ] Should display heatmap
  - [ ] Should show stats panel
  - [ ] Should update on selection
  - [ ] Should export results
  - [ ] Should handle empty data

---

## WEEK 10: Refinement & Automation

### Phase 6.1: Weight Refinement Algorithm (2 days)

- [ ] Create `src/balancing/archetype/WeightRefiner.ts`
  - [ ] `analyzeImbalances(results): ImbalanceReport`
  - [ ] `calculateStatImpact(imbalances): StatImpactMap`
  - [ ] `proposeWeightAdjustments(impact): StatWeights`
  - [ ] `refineWeights(currentWeights, results): StatWeights`

- [ ] Implement convergence criteria
  - [ ] 90%+ matchups within tolerance
  - [ ] Max 10 iterations
  - [ ] Weight change delta threshold

- [ ] Write `WeightRefiner.test.ts` (10 tests)
  - [ ] Should identify matchups outside tolerance
  - [ ] Should categorize by severity
  - [ ] Should group by affected stat
  - [ ] Should correlate stat to imbalance
  - [ ] Should weight by frequency
  - [ ] Should suggest stat to adjust
  - [ ] Should increase weight for underperforming
  - [ ] Should decrease weight for overperforming
  - [ ] Should limit adjustment size
  - [ ] Should converge in <10 iterations

### Phase 6.2: Automation & CI Integration (2 days)

- [ ] Create `scripts/run-archetype-tests.ts`
  - [ ] CLI tool for batch testing
  - [ ] Progress bar
  - [ ] Auto-generate report

- [ ] Add to CI pipeline
  - [ ] Create `.github/workflows/archetype-tests.yml`
  - [ ] Run on PR merge
  - [ ] Fail if >20% imbalance
  - [ ] Post results as comment

### Phase 6.3: Documentation & Examples (1 day)

- [ ] Write `docs/ARCHETYPE_GUIDE.md`
  - [ ] How to create archetypes
  - [ ] How to run tests
  - [ ] How to interpret results

- [ ] Create example archetypes
  - [ ] 5 well-balanced builds
  - [ ] 2 intentionally broken builds

---

## PROGRESS TRACKING

**Week 6:** [x] 40/40 tasks COMPLETE ✅  
**Week 7:** [x] 45/45 tasks COMPLETE ✅  
**Week 7-8:** [x] 35/35 tasks (Phase 3.1-3.2 COMPLETE ✅)  
**Week 8:** [ ] 0/20 tasks  
**Week 9:** [ ] 0/15 tasks  
**Week 10:** [ ] 0/20 tasks  

**Total:** 0/175+ tasks complete

---

## NEXT ACTIONS

1. Start with Week 6 Phase 1.1
2. Create data model files
3. Write initial tests
4. Move to Phase 1.2

📋 **For design context:** See [implementation_plan.md](implementation_plan.md)
