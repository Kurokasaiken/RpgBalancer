# Stat Stress Testing - Task Checklist

**Reference Plan:** [stat_stress_testing_plan.md](stat_stress_testing_plan.md)

---

## PHASE 1: Archetype Generation Engine

### 1.1 Core Data Structures
- [ ] Create `src/balancing/testing/types.ts` with interfaces:
  - [ ] `StressTestArchetype` interface
  - [ ] `ArchetypeGenerationConfig` interface
  - [ ] `TestResult` interface

### 1.2 Generator Service
- [ ] Create `src/balancing/testing/StressTestArchetypeGenerator.ts`
- [ ] Implement `generateSingleStatArchetipi()` method
  - [ ] Read stats from BalancerConfig (no hardcoding)
  - [ ] Skip derived stats (formulas)
  - [ ] Calculate point allocation: weight * 25
  - [ ] Generate StatBlock for each stat
  - [ ] Return array of StressTestArchetype
- [ ] Implement `generatePairStatArchetipi()` method
  - [ ] Generate all C(n,2) combinations
  - [ ] For each pair: baseline + (weightA * 25) + (weightB * 25)
  - [ ] Return array of pair archetipi
- [ ] Add validation:
  - [ ] Ensure all stats present in generated archetipi
  - [ ] Validate point allocations match weights
  - [ ] Check for missing required stat fields

### 1.3 Integration Tests
- [ ] Test generator with mock BalancerConfig
- [ ] Verify single-stat archetipi count = number of non-derived stats
- [ ] Verify pair-stat archetipi count = C(n,2) where n = non-derived stats
- [ ] Validate generated StatBlocks have all required fields
- [ ] Test with real BalancerConfig from useBalancerConfig hook

---

## PHASE 2: Simulation & Metrics Collection

### 2.1 Metrics Interfaces
- [ ] Create `src/balancing/testing/metrics.ts`
- [ ] Define `MarginalUtilityMetrics` interface
- [ ] Define `PairSynergyMetrics` interface
- [ ] Define `TestRunResult` interface

### 2.2 Marginal Utility Calculator
- [ ] Create `src/balancing/testing/MarginalUtilityCalculator.ts`
- [ ] Implement `calculateStatUtility()` method
  - [ ] Run archetype vs baseline (10k iterations default)
  - [ ] Extract win rate, kill time, survival time
  - [ ] Calculate damage efficiency (damage dealt / damage taken)
  - [ ] Compute utility score (composite metric)
  - [ ] Calculate confidence based on variance
  - [ ] Return MarginalUtilityMetrics
- [ ] Implement `calculatePairSynergy()` method
  - [ ] Run pair archetype vs baseline
  - [ ] Get individual metrics from single-stat results
  - [ ] Calculate expected win rate (average of individuals)
  - [ ] Calculate synergy bonus and ratio
  - [ ] Assess synergy level (OP/synergistic/neutral/weak)
  - [ ] Return PairSynergyMetrics

### 2.3 Batch Processing
- [ ] Implement `runAllSingleStatTests()` method
  - [ ] Accept iterations parameter (default 10000)
  - [ ] Run all single-stat archetipi in sequence
  - [ ] Collect results in array
  - [ ] Return Map<statId, MarginalUtilityMetrics>
- [ ] Implement `runAllPairTests()` method
  - [ ] Accept iterations parameter
  - [ ] Run all pair archetipi
  - [ ] Use single-stat results for synergy calculation
  - [ ] Return array of PairSynergyMetrics

### 2.4 Determinism & Seeding
- [ ] Ensure LCG is properly seeded for reproducibility
- [ ] Add seed parameter to all simulation methods
- [ ] Validate results are identical with same seed
- [ ] Document seed usage in comments

### 2.5 Integration Tests
- [ ] Test calculator with mock CombatSimulator
- [ ] Verify metrics are calculated correctly
- [ ] Test synergy ratio calculations
- [ ] Validate assessment thresholds (OP > 1.15, etc.)
- [ ] Test with real simulator

---

## PHASE 3: Presentation Layer

### 3.1 Marginal Utility Table Component
- [ ] Create `src/ui/testing/MarginalUtilityTable.tsx`
- [ ] Implement table with columns:
  - [ ] Stat name
  - [ ] Win rate (%)
  - [ ] Kill time (rounds)
  - [ ] Survival time (rounds)
  - [ ] Damage efficiency (multiplier)
  - [ ] Utility score
  - [ ] Confidence bar
- [ ] Add sorting functionality (by utility, win rate, efficiency)
- [ ] Add color coding:
  - [ ] Green for high utility (>1.1)
  - [ ] Yellow for medium (0.9-1.1)
  - [ ] Red for low (<0.9)
- [ ] Add hover tooltips with detailed metrics
- [ ] Style with Gilded Observatory theme

### 3.2 Synergy Heatmap Component
- [ ] Create `src/ui/testing/SynergyHeatmap.tsx`
- [ ] Build NxN matrix from pair synergies
- [ ] Implement cell coloring:
  - [ ] Red for OP (ratio > 1.15)
  - [ ] Amber for synergistic (1.05-1.15)
  - [ ] Gray for neutral (0.95-1.05)
  - [ ] Blue for weak (<0.95)
- [ ] Add hover tooltips showing:
  - [ ] Synergy ratio
  - [ ] Assessment label
  - [ ] Win rate delta
- [ ] Make cells clickable for detailed view
- [ ] Style with Gilded Observatory theme

### 3.3 Radar Chart Component
- [ ] Create `src/ui/testing/StatProfileRadar.tsx`
- [ ] Implement SVG-based radar chart
- [ ] Normalize metrics to 0-1 scale
- [ ] Draw grid circles and axes
- [ ] Draw data polygon (filled + stroked)
- [ ] Add stat labels around perimeter
- [ ] Color gradient from center to edge
- [ ] Add legend showing utility values
- [ ] Make responsive to container size

### 3.4 Component Tests
- [ ] Test table renders all metrics
- [ ] Test table sorting works correctly
- [ ] Test heatmap builds correct matrix
- [ ] Test heatmap cell colors match thresholds
- [ ] Test radar chart draws all stats
- [ ] Test all components with mock data

---

## PHASE 4: Dashboard Page

### 4.1 Main Dashboard Component
- [ ] Create `src/ui/testing/StressTestDashboard.tsx`
- [ ] Add header with title and description
- [ ] Add "Run Tests" button
  - [ ] Show iterations selector (1k, 5k, 10k, 20k)
  - [ ] Show loading state during tests
  - [ ] Show completion time
- [ ] Add results sections:
  - [ ] Single-stat marginal utility table
  - [ ] Pair-stat synergy heatmap
  - [ ] Stat profile radar chart
- [ ] Add export functionality:
  - [ ] Export as JSON
  - [ ] Export as CSV
  - [ ] Export as markdown report
- [ ] Style with Gilded Observatory theme
- [ ] Add responsive layout

### 4.2 Results Display
- [ ] Show timestamp of last test run
- [ ] Show total iterations used
- [ ] Show test duration
- [ ] Show number of stats tested
- [ ] Show number of pairs tested
- [ ] Add "Run Again" button

### 4.3 Export System
- [ ] Implement JSON export:
  - [ ] Include all metrics
  - [ ] Include metadata (timestamp, iterations, duration)
  - [ ] Include configuration snapshot
- [ ] Implement CSV export:
  - [ ] Single-stat metrics table
  - [ ] Pair-stat synergies table
- [ ] Implement markdown report:
  - [ ] Summary statistics
  - [ ] Top 5 stats by utility
  - [ ] Top 5 synergies (OP)
  - [ ] Bottom 5 synergies (weak)
  - [ ] Recommendations

---

## PHASE 5: Integration with Balancer

### 5.1 Hook Creation
- [ ] Create `src/balancing/hooks/useStressTesting.ts`
- [ ] Implement `useStressTesting()` hook
  - [ ] State for results (single + pair metrics)
  - [ ] State for loading/error
  - [ ] Callback `runStressTests(iterations?)`
  - [ ] Callback `exportResults(format)`
  - [ ] Return results, loading, error, callbacks

### 5.2 Hook Integration
- [ ] Connect to useBalancerConfig for stat definitions
- [ ] Connect to CombatSimulator instance
- [ ] Connect to LCG for determinism
- [ ] Handle errors gracefully
- [ ] Show error messages in UI

### 5.3 Navigation Integration
- [ ] Add "Stat Testing" link to main navigation
- [ ] Add route `/balancer/testing` or `/testing/stats`
- [ ] Integrate with FantasyLayout navigation
- [ ] Add breadcrumbs

### 5.4 State Persistence
- [ ] Save last test results to localStorage
- [ ] Load results on page refresh
- [ ] Add "Clear Results" button
- [ ] Add "Save Results" button with naming

---

## PHASE 6: Testing & Validation

### 6.1 Unit Tests
- [ ] Test StressTestArchetypeGenerator
  - [ ] Single-stat generation
  - [ ] Pair-stat generation
  - [ ] Point allocation correctness
  - [ ] Derived stat filtering
- [ ] Test MarginalUtilityCalculator
  - [ ] Utility score calculation
  - [ ] Synergy ratio calculation
  - [ ] Assessment thresholds
  - [ ] Confidence calculation

### 6.2 Integration Tests
- [ ] Test full pipeline:
  - [ ] Generate archetipi
  - [ ] Run simulations
  - [ ] Calculate metrics
  - [ ] Export results
- [ ] Test with different stat configurations
- [ ] Test with different iteration counts
- [ ] Validate determinism (same seed = same results)

### 6.3 UI Tests
- [ ] Test table renders correctly
- [ ] Test heatmap renders correctly
- [ ] Test radar chart renders correctly
- [ ] Test sorting functionality
- [ ] Test export functionality
- [ ] Test responsive layout

### 6.4 Performance Tests
- [ ] Measure time for 10k iterations
- [ ] Measure time for all pairs (C(n,2))
- [ ] Measure UI render time
- [ ] Optimize if necessary

### 6.5 Validation Tests
- [ ] Run tests with known good data
- [ ] Verify results match expectations
- [ ] Check for outliers or anomalies
- [ ] Validate against manual calculations

---

## PHASE 7: Documentation & Polish

### 7.1 Code Documentation
- [ ] Add JSDoc comments to all functions
- [ ] Document parameters and return types
- [ ] Add examples in comments
- [ ] Document assumptions and limitations

### 7.2 User Documentation
- [ ] Create user guide for stress testing
- [ ] Explain what marginal utility means
- [ ] Explain synergy heatmap interpretation
- [ ] Provide example workflows
- [ ] Add troubleshooting section

### 7.3 Technical Documentation
- [ ] Document architecture decisions
- [ ] Document simulation methodology
- [ ] Document metric calculations
- [ ] Add references to research

### 7.4 Polish
- [ ] Review UI/UX with Gilded Observatory theme
- [ ] Add loading animations
- [ ] Add success/error notifications
- [ ] Add keyboard shortcuts
- [ ] Optimize performance
- [ ] Fix any visual bugs

---

## PHASE 8: Deployment & Monitoring

### 8.1 Deployment
- [ ] Build and test in production environment
- [ ] Verify all features work
- [ ] Check performance in production
- [ ] Monitor for errors

### 8.2 Monitoring
- [ ] Add analytics for feature usage
- [ ] Track test run frequency
- [ ] Monitor export usage
- [ ] Collect user feedback

### 8.3 Post-Launch
- [ ] Gather user feedback
- [ ] Fix reported bugs
- [ ] Optimize based on usage patterns
- [ ] Plan future enhancements

---

## SUMMARY

**Total Tasks:** ~120 checkboxes  
**Estimated Time:** 3-4 days  
**Dependencies:** Phase 10 (Config-Driven Balancer) completion  
**Blockers:** None (architecture ready)

**Key Success Metrics:**
- ✅ All stats tested individually
- ✅ All pairs tested
- ✅ Results reproducible (deterministic)
- ✅ UI displays results clearly
- ✅ Export functionality works
- ✅ No hardcoded values
