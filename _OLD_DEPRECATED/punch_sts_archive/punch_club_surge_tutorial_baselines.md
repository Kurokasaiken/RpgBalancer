# Punch Club Surge Tutorial Visual Baselines

**Document ID:** NP-091-surge-tutorial-baselines  
**Version:** 1.0  
**Last Updated:** 2026-01-23  
**Owner:** Lumen-PC (Visual QA)

## Overview

This document describes the visual regression baseline system for the Punch Club Surge Resource Tutorial FTUE flow. The baselines ensure consistent visual presentation across tutorial steps, interactions, and mobile/desktop views.

## Scope

### Tutorial Coverage
- **6 Tutorial Steps**: Introduction, Resource Overview, Surge Basics, First Surge, Advanced Usage, Completion
- **Interactive States**: Progress indicators, hover states, keyboard focus, haptic feedback
- **Mobile Optimization**: Responsive layouts, compact banner mode
- **FTUE Copy Validation**: Critical copy validation for GT-3 playtest requirements

### Platform Coverage
- **Desktop**: 1280x720 viewport (Desktop Chrome)
- **Mobile**: 375x812 viewport (iPhone 14 Pro)

## Baseline Screenshots

### Desktop Views (18 screenshots)

#### Tutorial Steps
1. **surge-tutorial-welcome.png**
   - Welcome screen before tutorial start
   - Validates: Layout, copy, CTA button, branding

2. **surge-tutorial-step-1-introduction.png**
   - Step 1: Introduction to Surge concept
   - Validates: Step content, navigation buttons, progress indicator

3. **surge-tutorial-step-2-resource-overview.png**
   - Step 2: Surge UI elements overview
   - Validates: UI element highlighting, instructional copy

4. **surge-tutorial-step-3-surge-basics.png**
   - Step 3: Fundamental Surge mechanics
   - Validates: Mechanics explanation, visual aids

5. **surge-tutorial-step-4-first-surge.png**
   - Step 4: First Surge activation (critical FTUE step)
   - Validates: Interactive guidance, activation UI

6. **surge-tutorial-step-5-advanced-usage.png**
   - Step 5: Advanced strategies
   - Validates: Advanced content, strategy tips

7. **surge-tutorial-step-6-completion.png**
   - Step 6: Completion celebration
   - Validates: Achievement summary, next steps

#### Interactive States
8. **surge-tutorial-progress-indicator.png**
   - Progress indicator showing current step
   - Validates: Step counter, visual progress bar

9. **surge-tutorial-skip-button-hover.png**
   - Skip button hover state
   - Validates: Hover styling, tooltip display

10. **surge-tutorial-keyboard-focus.png**
    - Keyboard navigation focus state
    - Validates: Focus ring, accessibility indicators

11. **surge-tutorial-haptic-indicator.png**
    - Haptic feedback visual indicator
    - Validates: Feedback animation, timing

12. **surge-tutorial-celebration.png**
    - Completion celebration effects
    - Validates: Celebration animation, confetti effects

#### Additional Views
13. **surge-tutorial-compact-banner.png**
    - Compact banner mode (non-intrusive)
    - Validates: Banner layout, dismiss button

14. **surge-tutorial-ftue-copy-step-1.png**
    - FTUE copy validation for Step 1
    - Validates: Copy length, readability, tone

15. **surge-tutorial-ftue-copy-step-4.png**
    - FTUE copy validation for Step 4 (critical)
    - Validates: Critical instructions, clarity

16. **surge-tutorial-locked-state.png**
    - Resource gating locked state
    - Validates: Lock indicator, unlock requirements

17. **surge-tutorial-telemetry-export.png**
    - Telemetry export modal
    - Validates: Export UI, data preview

18. **surge-tutorial-complete-flow-full-page.png**
    - Full page screenshot of complete flow
    - Validates: Overall layout, page composition

### Mobile Views (2 screenshots)

19. **surge-tutorial-mobile-welcome.png**
    - Mobile welcome screen (375x812)
    - Validates: Mobile layout, touch targets, responsive design

20. **surge-tutorial-mobile-step-1.png**
    - Mobile Step 1 view
    - Validates: Mobile step layout, swipe indicators

## Test Execution

### Running Baseline Capture

```bash
# Capture initial baselines
npm run visual:surge-baseline

# Update existing baselines
npm run visual:surge-baseline -- --update

# Compare against baselines
npm run visual:surge-baseline -- --compare

# Verbose output
npm run visual:surge-baseline -- --verbose
```

### Manual Playwright Execution

```bash
# Run visual tests directly
npx playwright test tests/visual/punchClub/SurgeTutorial.spec.ts --project="Desktop Chrome" --grep @visual

# Update snapshots
npx playwright test tests/visual/punchClub/SurgeTutorial.spec.ts --project="Desktop Chrome" --grep @visual --update-snapshots

# Run specific test
npx playwright test tests/visual/punchClub/SurgeTutorial.spec.ts --project="Desktop Chrome" --grep "Welcome Screen"
```

## FTUE Copy Validation

### GT-3 Alignment

The visual baselines support GT-3 playtest requirements by validating:

1. **Copy Length**: Ensure tutorial copy fits mobile constraints
2. **Readability**: Verify font sizes, contrast, line spacing
3. **Tone**: Validate friendly, instructional tone
4. **Clarity**: Confirm instructions are clear and actionable

### Critical Copy Points

#### Step 1: Introduction
- **Target**: 30 seconds reading time
- **Copy Length**: ~50-75 words
- **Validation**: `surge-tutorial-ftue-copy-step-1.png`

#### Step 4: First Surge (Critical)
- **Target**: 90 seconds interaction time
- **Copy Length**: ~100-150 words
- **Validation**: `surge-tutorial-ftue-copy-step-4.png`
- **Note**: Most critical FTUE step, requires extra validation

## Integration Points

### E2E-VRT-001 Framework
- Uses Playwright visual regression testing
- Disables animations for consistent screenshots
- Configurable diff thresholds (maxDiffPixelRatio: 0.001)

### GT-3 Playtest Checklist
- FTUE copy validation aligns with playtest metrics
- Tutorial completion KPIs tracked via telemetry
- Mobile-first design validation

### Style Laboratory
- Validates Gilded Observatory theme consistency
- Verifies color palette adherence
- Confirms typography standards

## Baseline Update Policy

### When to Update Baselines

1. **Intentional UI Changes**: Tutorial redesign, theme updates
2. **Copy Updates**: FTUE copy revisions approved by GT-3
3. **Layout Changes**: Responsive design improvements
4. **Accessibility Improvements**: Focus indicators, contrast adjustments

### Update Process

1. Review proposed UI changes
2. Run baseline comparison to identify diffs
3. Validate changes against GT-3 requirements
4. Update baselines with `--update` flag
5. Commit updated baselines with descriptive message
6. Document changes in CHANGELOG.md

### Approval Required

Baseline updates require approval from:
- **Visual QA Lead**: Lumen-PC
- **FTUE Owner**: GT-3 stakeholder
- **Product Owner**: For copy changes

## Troubleshooting

### Common Issues

#### Flaky Screenshots
**Problem**: Screenshots differ between runs  
**Solution**: Ensure animations disabled, check for dynamic content

#### Missing Test IDs
**Problem**: `data-testid` selectors not found  
**Solution**: Verify tutorial component has proper test IDs

#### Mobile Viewport Issues
**Problem**: Mobile screenshots show desktop layout  
**Solution**: Verify viewport size set correctly (375x812)

#### Baseline Mismatch
**Problem**: Comparison fails with small pixel differences  
**Solution**: Review diff report, adjust threshold if needed

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
npm run visual:surge-baseline -- --verbose
```

## Performance Considerations

### Test Execution Time
- **Full Suite**: ~3-5 minutes (22 tests)
- **Single Test**: ~10-15 seconds
- **Baseline Capture**: ~5-7 minutes (includes report generation)

### Optimization Strategies
- Run tests in parallel when possible
- Use `--grep` to run specific test groups
- Cache dependencies in CI environment
- Use Docker for consistent environments

## CI Integration

### GitHub Actions Workflow

```yaml
name: Surge Tutorial Visual Regression

on:
  pull_request:
    paths:
      - 'src/ui/punchClub/tutorials/**'
      - 'tests/visual/punchClub/SurgeTutorial.spec.ts'

jobs:
  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20.19.6'
      - run: npm ci
      - run: npm run visual:surge-baseline -- --compare
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-diff-report
          path: test-results/.artifacts/
```

## Documentation References

- **FTUE Documentation**: `docs/ftue/punch_club_surge_tutorial.md`
- **GT-3 Playtest Checklist**: `docs/tests/GT-3-mobile-playtest-checklist.md`
- **E2E-VRT-001 Plan**: `docs/plans/physical_e2e_testing_plan.md`
- **Visual Testing Guide**: `docs/tests/PLAYWRIGHT_GUIDE.md`
- **Test Spec**: `tests/visual/punchClub/SurgeTutorial.spec.ts`
- **Baseline Runner**: `scripts/visual/punchClubSurgeBaselineRunner.ts`

## Maintenance

### Regular Tasks
- **Weekly**: Review baseline stability in CI
- **Monthly**: Audit baseline coverage for new features
- **Quarterly**: Update baselines for theme/design changes

### Ownership
- **Primary**: Lumen-PC (Visual QA)
- **Secondary**: GT-3 Team (FTUE validation)
- **Reviewers**: Product, Design, Engineering

---

**Status**: ✅ Active  
**Last Baseline Update**: 2026-01-23  
**Next Review**: 2026-02-23
