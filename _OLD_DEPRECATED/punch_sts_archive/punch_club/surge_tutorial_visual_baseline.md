# Punch Club Surge Tutorial Visual Baseline

**NP-091 – Punch Club Surge Tutorial Visual Baseline**

Config-first visual regression testing suite for the Punch Club Surge Tutorial FTUE flow, ensuring visual consistency with "Il Drago" art direction and GT-3 FTUE copy requirements.

## Overview

The visual baseline system provides deterministic screenshot capture and comparison for the Surge Tutorial, covering all tutorial steps, interactions, mobile views, and FTUE copy validation. The system integrates with E2E-VRT-001 framework and emits telemetry for baseline validation tracking.

## Architecture

### Core Components

- **Playwright Visual Tests** (`tests/visual/punchClub/SurgeTutorial.spec.ts`)
  - 18 comprehensive test cases covering all tutorial states
  - Animation disabling for deterministic screenshots
  - Mobile viewport testing (375x812)
  - FTUE copy validation scenarios

- **Unit Test Suite** (`tests/unit/punchClub/SurgeTutorialVisual.test.tsx`)
  - Visual testing utilities validation
  - Screenshot capture and comparison logic
  - Scenario configuration testing
  - Telemetry integration verification

- **Baseline Runner CLI** (`scripts/visual/punchClubSurgeBaselineRunner.ts`)
  - Automated baseline capture and update
  - Comparison mode for regression detection
  - Report generation with diff analysis
  - Baseline copying to documentation

- **Visual Test Utilities** (`src/shared/testing/visualTestUtils.ts`)
  - Animation disabling for consistent screenshots
  - Screenshot capture with naming conventions
  - Image comparison with diff metrics
  - Baseline hash generation

- **Tutorial Test Utils** (`src/ui/punchClub/testing/surgeTutorialVisualTestUtils.ts`)
  - Tutorial scenario creation (first-run, resumed, completed, locked, mobile)
  - Test step definitions with interactions
  - Visual state validation
  - Environment setup/cleanup

## Test Coverage

### Tutorial Steps (6 steps)

| Step | Test ID | Description | Viewport |
|------|---------|-------------|----------|
| Welcome | `welcome` | Initial tutorial welcome screen | Desktop |
| Step 1 | `step-1-introduction` | Introduction to Surge concept | Desktop + Mobile |
| Step 2 | `step-2-resource-overview` | Resource types and management | Desktop |
| Step 3 | `step-3-surge-basics` | Basic surge mechanics | Desktop |
| Step 4 | `step-4-first-surge` | First surge interaction (critical FTUE) | Desktop + Mobile |
| Step 5 | `step-5-advanced-usage` | Advanced surge techniques | Desktop |
| Step 6 | `step-6-completion` | Tutorial completion and celebration | Desktop + Mobile |

### Interactive States (7 states)

| State | Test ID | Description | Validation |
|-------|---------|-------------|------------|
| Progress | `progress-indicator` | Tutorial progress bar | Visual consistency |
| Skip Button | `skip-button-hover` | Skip button hover state | Interaction feedback |
| Keyboard | `keyboard-focus` | Keyboard navigation focus | Accessibility |
| Haptic | `haptic-feedback` | Haptic feedback visual indicator | Mobile interaction |
| Celebration | `celebration-effects` | Completion celebration effects | Visual polish |
| Full Page | `complete-flow-full-page` | Complete tutorial flow | Layout validation |
| Export | `telemetry-export` | Telemetry export modal | Data export UI |

### Mobile Views (3 views)

| View | Test ID | Viewport | Focus |
|------|---------|----------|-------|
| Welcome | `mobile-welcome` | 375x812 | Mobile entry point |
| Step 1 | `mobile-step-1` | 375x812 | Mobile tutorial flow |
| Banner | `compact-banner` | 375x812 | Compact banner mode |

### FTUE Copy Validation (2 critical steps)

| Step | Test ID | GT-3 Alignment | Critical Content |
|------|---------|----------------|------------------|
| Step 1 | `ftue-copy-step-1` | Introduction copy | Welcome message, instructions |
| Step 4 | `ftue-copy-step-4` | First surge copy | Critical interaction instructions |

### Additional States (2 states)

| State | Test ID | Purpose |
|-------|---------|---------|
| Locked | `locked-state` | Resource gating validation |
| Banner | `compact-banner` | Non-intrusive tutorial entry |

## Configuration

### Visual Test Config

```typescript
interface VisualTestConfig {
  disableAnimations?: boolean;
  viewport?: { width: number; height: number };
  screenshotOptions?: {
    fullPage?: boolean;
    quality?: number;
    animations?: 'disabled' | 'enabled';
  };
  comparison?: {
    threshold?: number;
    antialiasing?: number;
  };
}
```

### Tutorial Scenarios

```typescript
type SurgeTutorialScenario = 'first-run' | 'resumed' | 'completed' | 'locked' | 'mobile';

const scenario = createSurgeTutorialScenario('first-run', {
  viewport: { width: 1920, height: 1080 },
  disableAnimations: true,
  currentStep: 0,
  skipIntro: false,
});
```

### Test Step Definition

```typescript
interface TutorialTestStep {
  id: string;
  name: string;
  selector: string;
  category: 'desktop' | 'mobile' | 'copy-validation' | 'interaction' | 'state';
  tags: string[];
  expectedContent?: string[];
  interactions?: Array<{
    action: 'click' | 'hover' | 'focus' | 'type';
    selector: string;
    value?: string;
  }>;
  waitConditions?: Array<{
    type: 'selector' | 'timeout' | 'networkidle';
    value: string | number;
  }>;
}
```

## Usage

### Running Visual Tests

```bash
# Capture new baselines
npm run visual:surge-baseline

# Update existing baselines
npm run visual:surge-baseline -- --update

# Compare against baselines
npm run visual:surge-baseline -- --compare

# Verbose output
npm run visual:surge-baseline -- --verbose

# Specific project
npm run visual:surge-baseline -- --project "Desktop Chrome"

# Custom output directory
npm run visual:surge-baseline -- --output ./custom-output
```

### Running Unit Tests

```bash
# Run visual baseline unit tests
npm run test -- tests/unit/punchClub/SurgeTutorialVisual.test.tsx

# Run with coverage
npm run test -- tests/unit/punchClub/SurgeTutorialVisual.test.tsx --coverage
```

### Running Playwright Tests Directly

```bash
# Run specific visual test
npm run test:e2e -- tests/visual/punchClub/SurgeTutorial.spec.ts

# Run with update snapshots
npm run test:e2e -- tests/visual/punchClub/SurgeTutorial.spec.ts --update-snapshots

# Run specific test case
npm run test:e2e -- tests/visual/punchClub/SurgeTutorial.spec.ts --grep "Welcome Screen"
```

## Integration Points

### GT-3 Playtest Checklist

The visual baseline validates FTUE copy requirements from GT-3:

- **Copy Accuracy**: All tutorial text matches GT-3 specifications
- **Mobile Optimization**: Copy legibility on 375px width
- **Critical Path**: Step 4 (First Surge) copy validation
- **Progression Flow**: Clear instructions for each step

### E2E-VRT-001 Framework

Integration with physical E2E testing system:

- **Baseline Storage**: Standardized baseline directory structure
- **Diff Generation**: Automated diff image creation
- **CI Integration**: Automated baseline validation in pipeline
- **Docker Consistency**: Containerized test environment

### Style Laboratory Tokens

Visual consistency with "Il Drago" art direction:

- **Color Palette**: Gilded Observatory theme colors
- **Typography**: Consistent font rendering and sizing
- **Spacing**: Layout consistency across viewports
- **Component States**: Hover, focus, and active states

### Telemetry Integration

Automatic telemetry emission for baseline validation:

```typescript
// Telemetry event structure
{
  event: 'pc_surge_visual_baseline_checked',
  data: {
    scenario: 'first-run',
    steps: 18,
    passed: 18,
    failed: 0,
    duration: 2500,
    baselineHash: 'abc123def456',
    failures?: Array<{ step: string; error: string }>,
    timestamp: 1642694400000,
  }
}
```

## Baseline Management

### Directory Structure

```
tests/visual/punchClub/
├── SurgeTutorial.spec.ts          # Playwright test file
└── baselines/                     # Generated screenshots
    ├── surge-tutorial-welcome.png
    ├── surge-tutorial-step-1-introduction.png
    └── ...

docs/tests/baselines/surge-tutorial/  # Documentation copies
├── surge-tutorial-welcome.png
└── ...

test-results/.artifacts/              # Report output
└── surge-tutorial-baseline-report.md
```

### Baseline Updates

When updating tutorial UI:

1. **Update Baselines**: Run `npm run visual:surge-baseline -- --update`
2. **Review Changes**: Check generated report for differences
3. **Validate Copy**: Ensure FTUE copy still meets GT-3 requirements
4. **Commit Changes**: Include updated baselines in PR
5. **CI Validation**: Ensure pipeline passes visual tests

### Regression Detection

The system detects regressions through:

- **Pixel Comparison**: Configurable threshold (default 1%)
- **Content Validation**: FTUE copy presence verification
- **Layout Consistency**: Element positioning and sizing
- **Interaction States**: Hover, focus, and active states

## Performance Considerations

### Screenshot Optimization

- **Animation Disabling**: Eliminates timing variations
- **Deterministic Rendering**: Consistent font and color rendering
- **Viewport Standardization**: Fixed viewport sizes for consistency
- **Network Idle**: Waits for network requests completion

### Test Execution

- **Parallel Execution**: Multiple tests run concurrently
- **Timeout Management**: 10-second timeout for element waits
- **Error Recovery**: Graceful handling of missing elements
- **Resource Cleanup**: Automatic test environment cleanup

## Troubleshooting

### Common Issues

#### Screenshots Not Matching

**Problem**: Baseline comparison fails with pixel differences

**Solutions**:
1. Check if animations are properly disabled
2. Verify viewport sizes match exactly
3. Ensure consistent font loading
4. Check for dynamic content (timestamps, etc.)

#### FTUE Copy Validation Fails

**Problem**: Expected content not found in tutorial steps

**Solutions**:
1. Verify GT-3 copy requirements are implemented
2. Check for text truncation on mobile viewports
3. Ensure proper text rendering and encoding
4. Validate selector accuracy for content elements

#### Mobile View Issues

**Problem**: Mobile screenshots don't match baseline

**Solutions**:
1. Verify exact viewport dimensions (375x812)
2. Check responsive design breakpoints
3. Ensure mobile-specific interactions work
4. Validate touch target sizing

#### Timeout Errors

**Problem**: Tests fail due to element not appearing

**Solutions**:
1. Increase wait timeouts for slow-loading elements
2. Check for network request completion
3. Verify element selectors are correct
4. Ensure proper test data setup

### Debug Mode

Enable verbose logging for detailed test execution:

```bash
npm run visual:surge-baseline -- --verbose
```

This provides:
- Detailed command execution
- Screenshot capture status
- Element visibility information
- Error stack traces

## Development Guidelines

### Adding New Test Cases

When extending visual test coverage:

1. **Define Test Step**: Add to `getSurgeTutorialTestSteps()`
2. **Update Playwright Spec**: Add new test case
3. **Update Unit Tests**: Add validation for new step
4. **Update Documentation**: Include in test coverage table
5. **Update Baselines**: Run baseline capture for new screenshots

### Modifying Tutorial UI

When changing tutorial components:

1. **Update Selectors**: Ensure test selectors match new structure
2. **Update Interactions**: Modify interaction sequences if needed
3. **Update Expected Content**: Refresh FTUE copy validation
4. **Update Baselines**: Capture new screenshots after changes
5. **Validate Integration**: Ensure all test scenarios still pass

### Performance Optimization

For optimal test performance:

1. **Minimize Waits**: Use specific selectors over generic timeouts
2. **Batch Operations**: Group related interactions
3. **Reuse Resources**: Share page instances between tests
4. **Optimize Screenshots**: Capture only necessary elements

## Metrics and KPIs

### Baseline Validation Metrics

- **Coverage**: 18 test cases across 5 categories
- **Success Rate**: Target 100% baseline consistency
- **Execution Time**: < 5 minutes for full suite
- **File Size**: < 2MB total for all screenshots

### Quality Gates

- **Copy Validation**: 100% FTUE copy accuracy
- **Mobile Compatibility**: 100% mobile viewport coverage
- **Interaction States**: 100% interaction state coverage
- **Regression Detection**: < 1% false positive rate

### Telemetry Tracking

- **Baseline Checks**: Track frequency and results
- **Update Frequency**: Monitor baseline update patterns
- **Failure Analysis**: Track common failure modes
- **Performance Metrics**: Execution time trends

## Future Enhancements

### Planned Improvements

1. **AI-Powered Diff Analysis**: Intelligent visual difference detection
2. **Cross-Browser Support**: Extend beyond Chrome testing
3. **Real Device Testing**: Physical mobile device validation
4. **Automated Baseline Updates**: Smart baseline updating based on UI changes

### Integration Opportunities

1. **A/B Testing Integration**: Visual validation for A/B test variants
2. **Accessibility Testing**: Automated accessibility validation
3. **Performance Monitoring**: Visual performance metrics collection
4. **User Journey Testing**: End-to-end user flow validation

## References

- **NP-091**: Punch Club Surge Tutorial Visual Baseline task specification
- **E2E-VRT-001**: Physical E2E Testing System framework
- **GT-3**: Punch Club mobile-first playtest checklist
- **Style Laboratory**: "Il Drago" art direction guidelines
- **FTUE Documentation**: First-time user experience requirements

---

**Status**: ✅ Visual baseline system implemented and validated  
**Last Updated**: 2026-01-23  
**Version**: 1.0.0  
**Dependencies**: E2E-VRT-001, GT-3, Style Laboratory tokens
