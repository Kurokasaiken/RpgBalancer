# Archetype Balancing System - Task Checklist

> **Executable Tasks** for Week 6-10 Archetype System  
> 📋 **Design Context:** [implementation_plan.md](implementation_plan.md)

**Status:** 0/200+ tasks complete  
**Current Week:** Week 6

---

## WEEK 6: Foundation & Data Models

### Phase 1.1: Core Data Structures (2 days)

- [ ] Create `src/balancing/archetype/types.ts`
  - [ ] `ArchetypeTemplate` interface
  - [ ] `ArchetypeInstance` interface
  - [ ] `TTKTarget` interface
  - [ ] `BalanceConfiguration` interface
  - [ ] `SpellCost` interface (SpellPoints + Tier)

- [ ] Create `src/balancing/archetype/constants.ts`
  - [ ] Default archetype templates (16 total)
  - [ ] Default TTK targets matrix
  - [ ] Budget tier definitions (10/20/50/75/100)

- [ ] Write `ArchetypeTypes.test.ts` (8 tests)
  - [ ] Should create valid template
  - [ ] Should validate stat allocation sums to 100%
  - [ ] Should reject negative allocations
  - [ ] Should enforce minBudget < maxBudget
  - [ ] Should create valid TTK target
  - [ ] Should enforce round constraints
  - [ ] Should calculate spell points from HP
  - [ ] Should assign correct tier

### Phase 1.2: Archetype Builder Service (2 days)

- [ ] Create `src/balancing/archetype/ArchetypeBuilder.ts`
  - [ ] `buildArchetype(template, budget): StatBlock`
  - [ ] `validateAllocation(allocation): boolean`
  - [ ] `calculateStatValues(allocation, budget, weights): StatBlock`
  - [ ] `optimizeAllocation(template, budget): StatBlock`

- [ ] Create `src/balancing/archetype/ArchetypeRegistry.ts`
  - [ ] CRUD operations for templates
  - [ ] Save/load from JSON
  - [ ] Search/filter archetypes
  - [ ] Tag system

- [ ] Write `ArchetypeBuilder.test.ts` (12 tests)
  - [ ] Should build StatBlock at 50 budget
  - [ ] Should build StatBlock at 100 budget
  - [ ] Should scale stats proportionally
  - [ ] Should respect allocation percentages
  - [ ] Should throw error if allocation > 100%
  - [ ] Should throw error if budget < minBudget
  - [ ] Should accept valid 100% allocation
  - [ ] Should reject 90% allocation (under)
  - [ ] Should reject 110% allocation (over)
  - [ ] Should distribute unallocated % intelligently
  - [ ] Should not exceed 100% total
  - [ ] Should respect locked stats

- [ ] Write `ArchetypeRegistry.test.ts` (10 tests)
  - [ ] Should add archetype template
  - [ ] Should get archetype by ID
  - [ ] Should update existing archetype
  - [ ] Should delete archetype
  - [ ] Should list all archetypes
  - [ ] Should filter by category
  - [ ] Should search by name
  - [ ] Should filter by tags
  - [ ] Should save to JSON file
  - [ ] Should load from JSON file

### Phase 1.3: Spell Cost Currency System (1 day)

- [ ] Update `src/balancing/modules/spellcost.ts`
  - [ ] Add `calculateSpellPoints(spell): number`
  - [ ] Add `calculateTier(spellPoints): 1|2|3|4|5`
  - [ ] Add `getSpellCost(spell): SpellCost`

- [ ] Create spell tier constants
  - [ ] Tier boundaries (Common/Uncommon/Rare/Epic/Legendary)
  - [ ] Visual metadata (colors, icons)

- [ ] Update `SpellCost.test.ts` (+3 tests)
  - [ ] Should calculate spell points
  - [ ] Should assign tier based on points
  - [ ] Should return complete SpellCost object

---

## WEEK 7: Frontend Archetype Builder

### Phase 2.1: Builder UI Components (3 days)

- [ ] Create `src/components/balancing/archetype/ArchetypeBuilder.tsx`
  - [ ] Category selector (Tank/DPS/Assassin/Bruiser/Support)
  - [ ] Budget slider (10-100 points)
  - [ ] Stat allocation sliders with pie chart
  - [ ] Real-time stat preview panel
  - [ ] Save/cancel buttons

- [ ] Create `src/components/balancing/archetype/StatAllocationPie.tsx`
  - [ ] Interactive pie chart (Recharts)
  - [ ] Color coding per stat category
  - [ ] Hover tooltips

- [ ] Create `src/components/balancing/archetype/ArchetypePreview.tsx`
  - [ ] Show final StatBlock values
  - [ ] Show estimated power level
  - [ ] Warning indicators (imbalanced allocations)

- [ ] Write `ArchetypeBuilder.integration.test.tsx` (7 tests)
  - [ ] Should render category selector
  - [ ] Should render budget slider
  - [ ] Should render stat allocation sliders
  - [ ] Should update pie chart on allocation change
  - [ ] Should show real-time stat preview
  - [ ] Should validate before save
  - [ ] Should save to registry on submit

### Phase 2.2: Archetype List & Management UI (2 days)

- [ ] Create `src/components/balancing/archetype/ArchetypeList.tsx`
  - [ ] Grid/list view toggle
  - [ ] Filter by category
  - [ ] Search by name/tag
  - [ ] Sort by various metrics

- [ ] Create `src/components/balancing/archetype/ArchetypeCard.tsx`
  - [ ] Display archetype summary
  - [ ] Quick stats view
  - [ ] Edit/Delete/Clone buttons
  - [ ] Test results badge (if tested)

- [ ] Create `src/components/balancing/archetype/ArchetypeCompare.tsx`
  - [ ] Side-by-side comparison (2 archetypes)
  - [ ] Stat difference highlight
  - [ ] Predicted matchup outcome

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

### Phase 3.1: TTK Test Runner (3 days)

- [ ] Create `src/balancing/archetype/TTKTestRunner.ts`
  - [ ] `runMatchup(archetypeA, archetypeB, budget, sims): TTKResult`
  - [ ] `runMatrix(archetypes, budget): TTKResult[]`
  - [ ] `runMultiBudget(archetypes, budgets): TTKResult[]`
  - [ ] `validateTTK(result, target): TTKValidation`

- [ ] Create `src/balancing/archetype/TTKValidator.ts`
  - [ ] Compare actual vs target rounds
  - [ ] Validate winner
  - [ ] Calculate deviation metrics
  - [ ] Generate warnings/errors

- [ ] Write `TTKTestRunner.test.ts` (15 tests)
  - [ ] Should run Tank vs DPS at 50 budget
  - [ ] Should return correct winner
  - [ ] Should track rounds to kill
  - [ ] Should calculate average over 1000 sims
  - [ ] Should handle stalemate (max rounds timeout)
  - [ ] Should test all archetypes vs all archetypes
  - [ ] Should return N × N results
  - [ ] Should be symmetric (A vs B ≈ inverse of B vs A)
  - [ ] Should test at 5 budget levels
  - [ ] Should show scaling trends
  - [ ] Should identify budget-dependent imbalances
  - [ ] Should validate rounds within target ± tolerance
  - [ ] Should validate correct winner
  - [ ] Should mark out-of-range as invalid
  - [ ] Should calculate deviation metrics

- [ ] Write `TTKValidator.test.ts` (8 tests)
  - [ ] Should pass if rounds in range
  - [ ] Should fail if rounds too low
  - [ ] Should fail if rounds too high
  - [ ] Should pass if winner correct
  - [ ] Should fail if wrong winner
  - [ ] Should calculate deviation from target
  - [ ] Should calculate deviation percentage
  - [ ] Should generate warning/error messages

### Phase 3.2: Batch Testing & Reports (2 days)

- [ ] Create `src/balancing/archetype/BatchTestRunner.ts`
  - [ ] Run all archetypes vs all archetypes
  - [ ] Run at all budget levels
  - [ ] Parallel execution (if possible)
  - [ ] Progress tracking

- [ ] Create `src/balancing/archetype/TTKReportGenerator.ts`
  - [ ] Generate markdown report
  - [ ] Export CSV data
  - [ ] Export JSON results
  - [ ] Create summary statistics

- [ ] Write `BatchTestRunner.test.ts` (5 tests)
  - [ ] Should run full matrix
  - [ ] Should complete in <5 minutes
  - [ ] Should track progress
  - [ ] Should handle errors gracefully
  - [ ] Should return aggregated results

- [ ] Write `TTKReportGenerator.test.ts` (3 tests)
  - [ ] Should generate markdown report
  - [ ] Should export CSV data
  - [ ] Should export JSON results

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

**Week 6:** [ ] 0/40 tasks  
**Week 7:** [ ] 0/45 tasks  
**Week 7-8:** [ ] 0/35 tasks  
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
