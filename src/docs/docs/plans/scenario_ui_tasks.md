# Scenario Configuration UI - Task Checklist

> **Executable Tasks** for Scenario UI Implementation  
> 📋 **Design Context:** [scenario_ui_plan.md](scenario_ui_plan.md)

**Status:** 0/50+ tasks complete  
**Estimated Time:** 10-14 hours  
**Can run parallel:** Week 8-9

---

## Phase 1: Data Model (2-3 hours)

- [ ] Create `src/balancing/contextWeights.ts`
  - [ ] Define `ScenarioType` enum
    - [ ] DUEL_1V1
    - [ ] TEAMFIGHT_5V5
    - [ ] SWARM_1VMANY
    - [ ] BOSS_1V1_LONG
  - [ ] Define `ScenarioConfig` interface
    - [ ] type, name, icon, description
    - [ ] expectedTurns, enemyCount, enemyAvgHP
    - [ ] statEffectiveness (multipliers)
    - [ ] relevantStats (display list)
  - [ ] Create `SCENARIO_CONFIGS` constant
    - [ ] Duel 1v1 config (baseline, all stats 1.0x)
    - [ ] Swarm config (AoE 5.0x, Damage 0.5x, etc.)
    - [ ] Boss Fight config (Lifesteal 2.5x, Regen 3.0x, %Damage 10.0x)
    - [ ] Team Fight 5v5 config (AoE 2.5x, Damage 0.8x)
  - [ ] Add TypeScript types
  - [ ] Export all interfaces and constants

---

## Phase 2: UI Component (4-5 hours)

- [ ] Create `src/ui/scenario/ScenarioCard.tsx`
  - [ ] Import dependencies (CardWrapper, SmartInput, types)
  - [ ] Define ScenarioCardProps interface
  - [ ] Implement scenario parameters section
    - [ ] Expected turns slider (1-50)
    - [ ] Enemy count input (1-50)
    - [ ] Enemy HP input (10-5000)
  - [ ] Implement stat effectiveness sliders
    - [ ] Map over config.relevantStats
    - [ ] Render slider for each stat (0-10x range)
    - [ ] Display current multiplier value
    - [ ] Show effective stat value calculation
  - [ ] Add visual indicators
    - [ ] Color code by effectiveness
      - [ ] >1.5x → green (★★★)
      - [ ] 1.0-1.5x → yellow (★)
      - [ ] ~1.0x → gray (neutral)
      - [ ] <0.5x → red (weak)
  - [ ] Add tooltips with descriptions
  - [ ] Wire up event handlers (onConfigChange)

- [ ] Create `src/ui/scenario/EffectivenessSlider.tsx` (optional reusable component)
  - [ ] Props: stat, effectiveness, onChange
  - [ ] Render slider + label + stars
  - [ ] Color coding logic

---

## Phase 3: Integration (2-3 hours)

- [ ] Update `src/ui/Balancer.tsx`
  - [ ] Import ScenarioCard and types
  - [ ] Add state management
    - [ ] `const [scenarioConfigs, setScenarioConfigs] = useState(SCENARIO_CONFIGS)`
  - [ ] Add handler function
    - [ ] `handleScenarioConfigChange(type, updates)`
    - [ ] Merge updates into config
  - [ ] Add to JSX (after existing cards)
    - [ ] New section: "🎯 Configurazione Scenari"
    - [ ] Grid layout (2 columns on large screens)
    - [ ] Map over `Object.values(scenarioConfigs)`
    - [ ] Render ScenarioCard for each
  - [ ] Pass props to ScenarioCard
    - [ ] config, stats, handlers, etc.
  - [ ] Implement reset handler
    - [ ] Reset to default SCENARIO_CONFIGS

- [ ] Add persistence (localStorage)
  - [ ] Define storage key: `'balancer_scenarios'`
  - [ ] useEffect on mount
    - [ ] Load from localStorage
    - [ ] Parse JSON with error handling
  - [ ] useEffect on change
    - [ ] Auto-save to localStorage

- [ ] Add export/import functionality
  - [ ] Export button → download JSON
  - [ ] Import button → upload JSON
  - [ ] Validation on import

---

## Phase 4: Styling & Polish (1-2 hours)

- [ ] Color code effectiveness
  - [ ] Apply green/yellow/red classes based on multiplier
  - [ ] Smooth transitions on change

- [ ] Add scenario icons (emojis)
  - [ ] ⚔️ Duel
  - [ ] 🐝 Swarm
  - [ ] 👹 Boss
  - [ ] 👥 Team Fight

- [ ] Responsive layout
  - [ ] 1 column on mobile
  - [ ] 2 columns on desktop
  - [ ] Test on different screen sizes

- [ ] Hover effects
  - [ ] Highlight slider on hover
  - [ ] Tooltip appears on hover

- [ ] Accessibility (ARIA labels)
  - [ ] aria-label for sliders
  - [ ] aria-describedby for tooltips
  - [ ] Keyboard navigation support

---

## Phase 5: Documentation (1 hour)

- [ ] Update user guide
  - [ ] Add section on scenario configuration
  - [ ] Explain each scenario type
  - [ ] Show example use cases

- [ ] Add inline help tooltips
  - [ ] Hover over scenario name → description
  - [ ] Hover over stat → what it does
  - [ ] Hover over multiplier → impact explanation

- [ ] Create example configurations
  - [ ] Save 3-5 example configs as JSON
  - [ ] Include in docs folder
  - [ ] Document when to use each

---

## Testing & Validation

- [ ] Manual testing
  - [ ] Test all 4 scenarios render correctly
  - [ ] Test sliders update values
  - [ ] Test persistence (reload page)
  - [ ] Test export/import

- [ ] Visual testing
  - [ ] Check color coding
  - [ ] Verify responsive layout
  - [ ] Test on mobile device

- [ ] Integration testing
  - [ ] Ensure no conflicts with existing Balancer features
  - [ ] Test stat changes propagate correctly

---

## File Structure Verification

- [ ] Verify files created:
  ```
  src/
  ├── balancing/
  │   └── contextWeights.ts         ✅ NEW
  ├── ui/
  │   ├── Balancer.tsx              ✅ MODIFIED
  │   └── scenario/
  │       ├── ScenarioCard.tsx      ✅ NEW
  │       └── EffectivenessSlider.tsx ✅ NEW (optional)
  ```

---

## PROGRESS TRACKING

- [ ] Phase 1: Data Model (0/6 tasks)
- [ ] Phase 2: UI Component (0/10 tasks)
- [ ] Phase 3: Integration (0/8 tasks)
- [ ] Phase 4: Styling (0/5 tasks)
- [ ] Phase 5: Documentation (0/3 tasks)
- [ ] Testing (0/6 tasks)

**Total:** 0/38+ tasks complete

---

## NEXT ACTIONS

1. Start with Phase 1: Create `contextWeights.ts`
2. Define all 4 scenario configs
3. Move to Phase 2: Build `ScenarioCard.tsx`

📋 **For design mockups:** See [scenario_ui_plan.md](scenario_ui_plan.md)
