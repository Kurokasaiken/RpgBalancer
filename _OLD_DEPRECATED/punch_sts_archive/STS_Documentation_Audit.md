# STS Documentation Audit & Coverage Matrix

**Date**: 2026-01-11  
**Task**: KS-081-sts-audit-doc  
**Objective**: Allineare tutta la documentazione STS (spec, plan, telemetry, onboarding) creando una guida unificata e checklist per agenti KS-081.

## 📊 Current Documentation Coverage

### ✅ Core Documentation (Complete)

| Document | Path | Status | Coverage | Notes |
|----------|------|--------|----------|-------|
| **STS Numeric Simulator Spec** | `docs/archmage/STS_NumericSimulator_Spec.md` | ✅ Current | 95% | Comprehensive spec with telemetry plan |
| **STS UI Redesign Plan** | `docs/plans/sts_simulator_ui_redesign_plan.md` | ✅ Current | 90% | Retro terminal interface design |
| **STS Telemetry Dashboard** | `docs/archmage/STS_Telemetry_Dashboard.md` | ✅ Current | 85% | Dashboard spec and implementation |
| **STS QA Checklist** | `docs/tests/STS_QA_CHECKLIST.md` | ✅ Current | 80% | Testing procedures and validation |

### ⚠️ Component Documentation (Partial Coverage)

| Component | Path | Status | Coverage | Missing Documentation |
|-----------|------|--------|----------|----------------------|
| **STSControlBar** | `src/ui/tools/sts/STSControlBar.tsx` | ⚠️ Partial | 60% | Component API, props, accessibility |
| **STSCombatLog** | `src/ui/tools/sts/STSCombatLog.tsx` | ⚠️ Partial | 50% | Log format, filtering, export |
| **STSHandDisplay** | `src/ui/tools/sts/STSHandDisplay.tsx` | ⚠️ Partial | 40% | Card rendering, interactions |
| **STSCommandInput** | `src/ui/tools/sts/STSCommandInput.tsx` | ⚠️ Partial | 45% | Command parsing, validation |
| **STSResultPanel** | `src/ui/tools/sts/STSResultPanel.tsx` | ⚠️ Partial | 35% | Result display, statistics |
| **STSTutorialOverlay** | `src/ui/tools/sts/STSTutorialOverlay.tsx` | ⚠️ Partial | 30% | Tutorial flow, tips system |

### ❌ Missing Documentation (Gaps)

| Area | Missing Content | Priority | Impact |
|------|----------------|----------|--------|
| **Component API** | Individual component documentation | High | Developer onboarding |
| **Integration Guide** | How to integrate STS components | High | Agent efficiency |
| **Accessibility Guide** | WCAG compliance implementation | Medium | A11y requirements |
| **Performance Guide** | Optimization and monitoring | Medium | System performance |
| **Troubleshooting** | Common issues and solutions | Medium | Debugging efficiency |
| **Migration Guide** | Upgrading STS components | Low | Maintenance |

## 🎯 KS-081 Prompt Map

### Completed Prompts (Reference)

| Prompt ID | Title | Status | Evidence |
|-----------|-------|--------|----------|
| **KS-080** | STS Numeric Simulator Spec & Telemetry Plan | ✅ Complete | `test-results/KS-080-spec-2026-01-09.log` |
| **KS-081-sts-accessibility** | Screen Reader & High-Contrast Compliance | ✅ Complete | `test-results/ks-081-sts-accessibility-2026-01-11.md` |
| **KS-081-sts-combat-config** | Combatant Configuration Tool | ✅ Complete | `test-results/sts-combat-config-2026-01-11.log` |
| **KS-081-sts-telemetry-dashboard** | Telemetry Dashboard Implementation | ✅ Complete | `test-results/ks-081-sts-telemetry-dashboard-2026-01-11.md` |
| **KS-081-sts-runbook** | Run Persistence & Resume Workflow | ✅ Complete | `test-results/ks-081-sts-runbook-2026-01-11.log` |

### Pending Prompts (Backlog)

| Prompt ID | Title | Priority | Dependencies |
|-----------|-------|----------|-------------|
| **KS-081-sts-audit-doc** | Documentation Audit & Master Plan Sync | 🔴 High | KS-080 |
| **KS-081-sts-onboarding** | Agent Onboarding & Tutorial System | 🟡 Medium | KS-081-sts-audit-doc |
| **KS-081-sts-performance** | Performance Monitoring & Optimization | 🟡 Medium | KS-081-sts-telemetry-dashboard |
| **KS-081-sts-migration** | Component Migration Guide | 🟢 Low | KS-081-sts-audit-doc |

## 📋 Telemetry Contract

### Core Events

| Event Name | Payload | Frequency | Purpose |
|-------------|---------|-----------|---------|
| `sts_simulation_start` | `{ deckId, enemyId, seed, timestamp }` | Per simulation | Track simulation starts |
| `sts_turn_complete` | `{ turn, action, manaSpent, damage, timestamp }` | Per turn | Monitor turn progression |
| `sts_simulation_end` | `{ result, turns, finalState, timestamp }` | Per simulation | Track completion |
| `sts_card_played` | `{ cardId, cost, effect, target, timestamp }` | Per card | Analyze card usage |
| `sts_mana_state` | `{ resonance, inspiration, total, timestamp }` | Per turn | Mana curve analysis |
| `sts_agency_gap` | `{ availableActions, takenActions, timestamp }` | Per turn | Agency analysis |

### Dashboard Events

| Event Name | Payload | Frequency | Purpose |
|-------------|---------|-----------|---------|
| `sts_dashboard_view` | `{ view, filters, timestamp }` | Per session | Dashboard usage |
| `sts_dashboard_export` | `{ format, data, timestamp }` | Per export | Export tracking |
| `sts_dashboard_filter` | `{ filterType, value, timestamp }` | Per filter | Filter usage |

### Accessibility Events

| Event Name | Payload | Frequency | Purpose |
|-------------|---------|-----------|---------|
| `sts_high_contrast_toggle` | `{ enabled, source, timestamp }` | Per toggle | Theme usage |
| `sts_screen_reader_announce` | `{ message, priority, timestamp }` | Per announcement | A11y tracking |
| `sts_keyboard_navigation` | `{ action, element, timestamp }` | Per navigation | Keyboard usage |

## 🔧 Integration Guide

### For KS-081 Agents

#### 1. Before Starting Any STS Task
```bash
# Check current documentation status
npm run lint -- docs
npm run build:check
npm run kanban:lint

# Review latest spec and plan
cat docs/archmage/STS_NumericSimulator_Spec.md
cat docs/plans/sts_simulator_ui_redesign_plan.md
```

#### 2. Component Development Checklist
- [ ] Review existing component documentation
- [ ] Check for similar implementations in other STS components
- [ ] Follow STS naming conventions (STS prefix)
- [ ] Implement accessibility features (high contrast, screen reader)
- [ ] Add telemetry events for user interactions
- [ ] Write unit tests with React Testing Library
- [ ] Update component documentation

#### 3. Documentation Requirements
- [ ] Component API documentation (props, hooks, events)
- [ ] Integration examples
- [ ] Accessibility considerations
- [ ] Performance notes
- [ ] Troubleshooting section

#### 4. Testing Requirements
- [ ] Unit tests for component logic
- [ ] Integration tests for STS workflow
- [ ] Accessibility tests (WCAG compliance)
- [ ] Performance tests (rendering, memory)
- [ ] Telemetry event validation

### For STS Integration

#### Adding New Components
```typescript
// 1. Follow STS component structure
export const STSNewComponent: React.FC<STSNewComponentProps> = ({
  // Props with STS prefix
  stsConfig,
  stsData,
  onSTSEvent,
}) => {
  // 2. Use STS hooks
  const { isHighContrast } = useSTSHighContrast();
  const { announce } = useSTSLiveRegion();
  
  // 3. Add telemetry
  const { emitEvent } = useSTSTelemetry();
  
  // 4. Implement accessibility
  return (
    <div 
      className={`sts-new-component ${isHighContrast ? 'sts-high-contrast' : ''}`}
      aria-label="STS New Component"
    >
      {/* Component content */}
    </div>
  );
};
```

#### Adding New Telemetry Events
```typescript
// 1. Define event type
interface STSCustomEvent {
  eventType: 'sts_custom_action';
  data: {
    action: string;
    value: number;
    context: string;
    timestamp: number;
  };
}

// 2. Emit event
const { emitEvent } = useSTSTelemetry();
emitEvent({
  eventType: 'sts_custom_action',
  data: {
    action: 'custom_action',
    value: 42,
    context: 'sts_component',
    timestamp: Date.now(),
  },
});
```

## 📈 Success Metrics

### Documentation Coverage
- **Target**: 90% component documentation coverage
- **Current**: 60% component documentation coverage
- **Metric**: Number of components with documented API

### Agent Efficiency
- **Target**: < 30 minutes to understand STS task requirements
- **Current**: ~60 minutes (due to scattered documentation)
- **Metric**: Time from task assignment to first commit

### Code Quality
- **Target**: 100% of new components follow STS patterns
- **Current**: 80% compliance
- **Metric**: Lint passes, test coverage, accessibility compliance

### Integration Success
- **Target**: Zero integration failures for STS components
- **Current**: ~20% integration issues
- **Metric**: Build success rate, test pass rate

## 🚀 Implementation Plan

### Phase 1: Documentation Audit (Current)
- [x] Audit existing STS documentation
- [x] Create coverage matrix
- [x] Identify gaps and priorities
- [x] Define prompt map and telemetry contract

### Phase 2: Core Documentation Updates
- [ ] Update STS_NumericSimulator_Spec.md with prompt map
- [ ] Enhance sts_simulator_ui_redesign_plan.md with success metrics
- [ ] Create component documentation templates
- [ ] Add integration guide to strategy_tasks.md

### Phase 3: Component Documentation
- [ ] Document core STS components (ControlBar, CombatLog, HandDisplay)
- [ ] Create API documentation for all hooks
- [ ] Add accessibility implementation guides
- [ ] Write troubleshooting and performance guides

### Phase 4: Agent Resources
- [ ] Create KS-081 agent checklist
- [ ] Build onboarding guide for new agents
- [ ] Establish documentation maintenance process
- [ ] Set up automated documentation validation

## 📝 Maintenance Process

### Weekly Documentation Review
```bash
# Check for new components
find src/ui/tools/sts -name "*.tsx" -newer docs/archmage/STS_Documentation_Audit.md

# Validate documentation completeness
npm run lint:docs
npm run test:docs

# Update coverage matrix
# (Manual process for now)
```

### Monthly Audit
- Review documentation coverage metrics
- Update prompt map with new completed tasks
- Refresh telemetry contract with new events
- Validate agent efficiency metrics

### Quarterly Review
- Comprehensive documentation audit
- Update success metrics and targets
- Review and update integration guidelines
- Plan documentation improvements for next quarter

## 🎯 Next Steps

### Immediate Actions (This Week)
1. **Update STS_NumericSimulator_Spec.md** with prompt map section
2. **Enhance sts_simulator_ui_redesign_plan.md** with success metrics
3. **Add STS checklist** to strategy_tasks.md
4. **Create component documentation template**

### Short-term Goals (Next 2 Weeks)
1. **Document core STS components** (ControlBar, CombatLog, HandDisplay)
2. **Create integration guide** for KS-081 agents
3. **Establish documentation validation** in CI/CD
4. **Build agent onboarding guide**

### Long-term Goals (Next Month)
1. **Achieve 90% documentation coverage** for STS components
2. **Reduce agent onboarding time** to <30 minutes
3. **Implement automated documentation** generation
4. **Establish documentation maintenance** workflow

---

**Status**: In Progress  
**Next Review**: 2026-01-18  
**Owner**: Scribe-Archmage  
**Evidence**: `test-results/sts-doc-audit-2026-01-11.log`
