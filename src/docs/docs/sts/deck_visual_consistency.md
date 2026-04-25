# STS Deck Visual Consistency Documentation

**NP-095 – STS Deck Consistency Visual Regression Suite**  
**Author:** Lumen-STS – Deck Visual QA  
**Created:** 2026-01-21  
**Version:** 1.0.0

## Overview

This document outlines the visual regression testing framework for STS (Slay the Spire) deck components. The suite ensures consistent rendering across different states, themes, and viewport sizes to prevent visual regressions in the deck display, buff panels, and intent previews.

## Architecture

### Test Components

```
tests/
├── visual/sts/
│   └── deck-consistency.spec.ts          # Playwright visual tests
├── unit/sts/
│   └── DeckConsistency.test.tsx          # RTL snapshot tests
└── ui/tools/sts/telemetry/
    └── useSTSDeckVisualTelemetry.ts      # Telemetry integration
```

### Component Coverage

| Component | Visual Tests | RTL Tests | Telemetry |
|-----------|--------------|-----------|-----------|
| STSHandDisplay | ✅ | ✅ | ✅ |
| STSPresetLoader | ✅ | ✅ | ✅ |
| STSBuffPanel | ✅ | ✅ | ✅ |
| STSManaCurveChart | ✅ | ✅ | ✅ |
| STSConfigPanel | ✅ | ❌ | ✅ |

## State Grid

### Hand Display States

| State | Description | Test Coverage | Visual Baseline |
|-------|-------------|----------------|-----------------|
| `empty` | No cards in hand | Playwright + RTL | ✅ |
| `playable` | All cards playable | Playwright + RTL | ✅ |
| `unplayable` | Cards with insufficient mana | Playwright + RTL | ✅ |
| `timer` | Cards with turn timers | Playwright + RTL | ✅ |
| `mixed` | Mixed playable/unplayable | Playwright + RTL | ✅ |

### Deck Display States

| State | Description | Test Coverage | Visual Baseline |
|-------|-------------|----------------|-----------------|
| `full` | Complete deck (10+ cards) | Playwright | ✅ |
| `partial` | Partial deck (5-9 cards) | Playwright | ✅ |
| `minimal` | Minimal deck (1-4 cards) | Playwright | ✅ |
| `empty` | No cards | Playwright + RTL | ✅ |

### Buff Panel States

| State | Description | Test Coverage | Visual Baseline |
|-------|-------------|----------------|-----------------|
| `active` | Multiple active buffs | Playwright + RTL | ✅ |
| `temporary` | Time-limited buffs | Playwright + RTL | ✅ |
| `permanent` | Permanent buffs | Playwright + RTL | ✅ |
| `debuffs` | Negative effects | Playwright | ✅ |
| `empty` | No active buffs | Playwright + RTL | ✅ |

### Mana Curve States

| State | Description | Test Coverage | Visual Baseline |
|-------|-------------|----------------|-----------------|
| `balanced` | Even cost distribution | Playwright + RTL | ✅ |
| `low-cost` | Heavy 0-1 cost cards | Playwright + RTL | ✅ |
| `high-cost` | Heavy 3+ cost cards | Playwright + RTL | ✅ |
| `empty` | No cards | Playwright + RTL | ✅ |

## Visual Guidelines

### Color Palette

```css
/* Retro Terminal Theme */
--terminal-green: #00ff41;
--terminal-amber: #ffb000;
--terminal-red: #ff0040;
--terminal-blue: #00d4ff;
--terminal-bg: #0a0a0a;
--terminal-border: #333333;

/* Card Types */
--attack-color: #dc2626;
--skill-color: #059669;
--power-color: #7c3aed;
--curse-color: #6b7280;

/* Playability States */
--playable: #00ff41;
--unplayable: #ff0040;
--timer: #ffb000;
```

### Typography

```css
/* Terminal Font Stack */
font-family: 'Courier New', monospace;

/* Card Name */
font-size: 14px;
font-weight: bold;
text-transform: uppercase;

/* Card Effect */
font-size: 12px;
line-height: 1.4;

/* Mana Cost */
font-size: 16px;
font-weight: bold;
```

### Spacing & Layout

```css
/* Card Dimensions */
.card-width: 280px;
.card-height: 120px;
.card-margin: 8px;

/* Hand Layout */
.hand-gap: 12px;
.hand-padding: 16px;

/* Deck Grid */
.deck-columns: 3;
.deck-gap: 16px;
```

### Animation Guidelines

```css
/* Hover Effects */
.card-hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 65, 0.3);
  transition: all 0.2s ease;
}

/* Playable Pulse */
.playable-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Timer Warning */
.timer-warning {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.5; }
}
```

## Test Scenarios

### Visual Regression Tests

#### Full Deck Display
- **Purpose:** Verify complete deck rendering
- **Test Data:** 10+ cards with varied types and costs
- **Viewports:** Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- **Themes:** Default, Retro, Dark
- **Assertions:** Layout, card positioning, text rendering

#### Partial Deck Display
- **Purpose:** Verify partial deck handling
- **Test Data:** 5-9 cards
- **States:** Normal, Empty, Loading
- **Assertions:** Grid layout, empty state messaging

#### Intent Preview
- **Purpose:** Verify hand card display
- **Test Data:** 3-5 cards with playability states
- **States:** Playable, Unplayable, Timer
- **Assertions:** Card styling, mana cost display, effect text

#### Buff Panel
- **Purpose:** Verify buff/debuff display
- **Test Data:** Mixed buffs and debuffs
- **States:** Active, Temporary, Permanent, Empty
- **Assertions:** Icon rendering, duration display, color coding

#### Responsive Layout
- **Purpose:** Verify responsive behavior
- **Viewports:** Mobile, Tablet, Desktop
- **Assertions:** Layout adaptation, text wrapping, component stacking

#### Theme Variations
- **Purpose:** Verify theme consistency
- **Themes:** Default, Retro, Dark
- **Assertions:** Color application, contrast, readability

#### Interactive States
- **Purpose:** Verify interaction feedback
- **States:** Hover, Focus, Active, Disabled
- **Assertions:** Visual feedback, accessibility attributes

### RTL Snapshot Tests

#### Component Props
- **Empty States:** No data scenarios
- **Minimal Props:** Required properties only
- **Full Props:** All properties populated
- **Edge Cases:** Invalid data, missing properties

#### Accessibility
- **ARIA Labels:** Screen reader compatibility
- **Keyboard Navigation:** Focus management
- **Color Contrast:** WCAG compliance
- **Role Attributes:** Semantic HTML

#### Error Handling
- **Missing Data:** Graceful degradation
- **Invalid Types:** Error boundaries
- **Network Errors:** Loading states

## Telemetry Integration

### Event Types

| Event | Payload | Purpose |
|-------|---------|---------|
| `sts_deck_visual_checked` | Test suite metadata | Track visual test runs |
| `sts_deck_screenshot_captured` | Screenshot metadata | Monitor screenshot performance |
| `sts_deck_test_completed` | Test results | Track test outcomes |
| `sts_deck_visual_regression_detected` | Regression details | Alert on regressions |
| `sts_deck_component_state_changed` | State changes | Monitor component behavior |
| `sts_deck_theme_changed` | Theme metadata | Track theme usage |
| `sts_deck_viewport_changed` | Viewport metadata | Monitor responsive behavior |

### Performance Metrics

```typescript
interface PerformanceMetrics {
  duration: number;           // Total test duration (ms)
  avgScreenshotTime: number;  // Average screenshot capture (ms)
  memoryUsage: number;        // Memory usage during test (MB)
  screenshotCount: number;    // Number of screenshots taken
  regressionCount: number;    // Number of regressions detected
}
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Test Duration | > 30s | > 60s |
| Screenshot Time | > 500ms | > 1000ms |
| Memory Usage | > 100MB | > 200MB |
| Regression Count | > 0 | > 5 |

## Usage Guide

### Running Visual Tests

```bash
# Run all visual regression tests
npm run test:e2e -- tests/visual/sts/deck-consistency.spec.ts

# Run with specific viewport
npm run test:e2e -- tests/visual/sts/deck-consistency.spec.ts --viewportSize="375,667"

# Update baseline screenshots
npm run test:e2e -- tests/visual/sts/deck-consistency.spec.ts --update-snapshots

# Run with specific theme
npm run test:e2e -- tests/visual/sts/deck-consistency.spec.ts --theme="retro"
```

### Running RTL Tests

```bash
# Run all RTL snapshot tests
npm run test -- tests/unit/sts/DeckConsistency.test.tsx

# Update snapshots
npm run test -- tests/unit/sts/DeckConsistency.test.tsx --update-snapshots

# Run with coverage
npm run test -- tests/unit/sts/DeckConsistency.test.tsx --coverage
```

### Monitoring Telemetry

```bash
# Check recent visual test runs
npm run telemetry:query "sts_deck_visual_checked"

# Monitor performance metrics
npm run telemetry:query "sts_deck_test_completed"

# Check for regressions
npm run telemetry:query "sts_deck_visual_regression_detected"
```

## Maintenance

### Updating Baselines

1. **When to Update:**
   - Intentional design changes
   - New component features
   - Theme updates
   - Layout modifications

2. **Update Process:**
   ```bash
   # Update visual baselines
   npm run test:e2e -- tests/visual/sts/deck-consistency.spec.ts --update-snapshots
   
   # Update RTL snapshots
   npm run test -- tests/unit/sts/DeckConsistency.test.tsx --update-snapshots
   
   # Verify changes
   npm run test:e2e -- tests/visual/sts/deck-consistency.spec.ts
   npm run test -- tests/unit/sts/DeckConsistency.test.tsx
   ```

3. **Review Requirements:**
   - Manual review of all updated screenshots
   - Team approval for visual changes
   - Documentation updates
   - Version bump if needed

### Adding New Tests

1. **Visual Tests:**
   - Add test case to `deck-consistency.spec.ts`
   - Include proper data-testid attributes
   - Add screenshot assertions
   - Update documentation

2. **RTL Tests:**
   - Add test case to `DeckConsistency.test.tsx`
   - Include mock data
   - Add snapshot assertion
   - Update state grid

3. **Telemetry:**
   - Add new event types if needed
   - Update payload interfaces
   - Add tracking calls
   - Update documentation

### Troubleshooting

#### Common Issues

**Flaky Screenshots:**
- Ensure stable test data
- Avoid animations during tests
- Use proper waits and timeouts
- Check for dynamic content

**RTL Test Failures:**
- Verify mock data consistency
- Check component prop types
- Ensure deterministic rendering
- Review snapshot differences

**Telemetry Issues:**
- Verify event payload structure
- Check event listener registration
- Monitor performance impact
- Review data privacy compliance

#### Debug Commands

```bash
# Debug visual test failures
npm run test:e2e -- tests/visual/sts/deck-consistency.spec.ts --debug

# Debug RTL test failures
npm run test -- tests/unit/sts/DeckConsistency.test.tsx --verbose

# Check telemetry events
npm run telemetry:debug "sts_deck_visual_checked"
```

## Best Practices

### Test Design

1. **Deterministic Data:** Use consistent test data across runs
2. **Isolation:** Each test should be independent
3. **Coverage:** Test all critical states and transitions
4. **Performance:** Keep test execution time reasonable
5. **Maintenance:** Write clear, maintainable tests

### Visual Testing

1. **Stable Elements:** Avoid dynamic content in screenshots
2. **Consistent Viewport:** Use standard viewport sizes
3. **Theme Testing:** Test all supported themes
4. **Responsive Design:** Verify mobile/tablet layouts
5. **Accessibility:** Include accessibility testing

### Snapshot Testing

1. **Meaningful Snapshots:** Focus on component structure
2. **Prop Coverage:** Test all prop combinations
3. **Error States:** Include error and edge cases
4. **Accessibility:** Verify ARIA attributes
5. **Performance:** Keep snapshot size reasonable

## Conclusion

The STS Deck Visual Consistency suite provides comprehensive coverage for deck component visual regression testing. By following this documentation and maintaining the test suite, we can ensure consistent user experience across all deck-related components.

### Key Benefits

- **Prevention:** Catch visual regressions before deployment
- **Consistency:** Maintain consistent design across themes
- **Quality:** Ensure high-quality user experience
- **Efficiency:** Automated testing reduces manual effort
- **Monitoring:** Telemetry provides insights into test performance

### Next Steps

1. **Integration:** Integrate with CI/CD pipeline
2. **Expansion:** Add coverage for new components
3. **Optimization:** Improve test performance and reliability
4. **Monitoring:** Set up alerts for regression detection
5. **Documentation:** Keep documentation updated with changes

---

**Last Updated:** 2026-01-21  
**Next Review:** 2026-02-21  
**Maintainers:** Lumen-STS – Deck Visual QA
