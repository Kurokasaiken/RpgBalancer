# STS Intent Overlay Visual Baseline Documentation

## Overview
This document outlines the visual regression testing setup for the STS Intent Overlay system, including baseline capture, interaction testing, and maintenance procedures.

## Test Coverage

### Baseline Screenshots
The visual regression suite captures the following baseline scenarios:

1. **Default View** - Initial state of the intent overlay
2. **With Timeline Data** - Overlay populated with timeline data
3. **Diff View** - Comparison view with diff indicators
4. **Interactive States** - Hover and focus states
5. **Keyboard Navigation** - Focus indicators and ARIA states
6. **Responsive Mobile** - Mobile viewport layout
7. **Color Scheme Variants** - Retro, modern, and high-contrast themes
8. **Complete Flow** - End-to-end user interaction flow

### Interaction Testing
Comprehensive interaction tests cover:

- **Hover Interactions** - Tooltip behavior and visual feedback
- **Click Interactions** - Round selection and intent details
- **Keyboard Navigation** - Tab, arrow keys, and Enter key
- **Toggle Controls** - Diff view, buffs, and damage toggles
- **Color Scheme Switching** - Theme changes and visual consistency
- **Zoom and Pan** - Timeline navigation and scaling
- **Accessibility** - ARIA labels and screen reader support
- **Mobile Touch** - Tap gestures and swipe interactions
- **Performance** - Large dataset handling and responsiveness

## File Structure

```
tests/visual/sts/
├── IntentOverlay.spec.ts              # Baseline screenshot tests
├── intent-overlay-interactions.spec.ts # Interaction tests
└── baselines/                          # Baseline screenshots
    ├── sts-intent-overlay-default.png
    ├── sts-intent-overlay-with-data.png
    ├── sts-intent-overlay-diff-view.png
    ├── sts-intent-overlay-hover-state.png
    ├── sts-intent-overlay-focus-state.png
    ├── sts-intent-overlay-mobile.png
    ├── sts-intent-overlay-retro.png
    ├── sts-intent-overlay-modern.png
    ├── sts-intent-overlay-high-contrast.png
    └── sts-intent-overlay-complete-flow.png

tests/utils/visualInteraction/
└── stsIntentOverlay.ts                 # Utility functions for testing
```

## Test Configuration

### Viewport Sizes
- **Desktop**: 1280x720 (default)
- **Mobile**: 375x812 (iPhone X)
- **Tablet**: 768x1024 (iPad)

### Color Schemes
- **Retro**: Green-on-black terminal theme
- **Modern**: Clean contemporary design
- **High Contrast**: WCAG compliant high contrast

### Animation Settings
All animations are disabled during testing for consistent screenshots:
```css
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
}
```

## Data Test Fixtures

### Standard Timeline Data
```typescript
{
  rounds: [
    { round: 1, intents: ['attack', 'defend'], buffs: [], damage: 12 },
    { round: 2, intents: ['skill', 'attack'], buffs: ['power'], damage: 18 },
    { round: 3, intents: ['defend', 'heal'], buffs: ['shield'], damage: 8 }
  ]
}
```

### Large Dataset (Performance Testing)
```typescript
{
  rounds: Array.from({ length: 100 }, (_, i) => ({
    round: i + 1,
    intents: ['attack', 'defend', 'skill', 'heal'],
    buffs: ['power', 'shield', 'speed'],
    damage: Math.floor(Math.random() * 50)
  }))
}
```

## Running Tests

### Baseline Capture
```bash
# Capture all baseline screenshots
npm run test:visual -- tests/visual/sts/IntentOverlay.spec.ts

# Update existing baselines
npm run test:visual:update -- tests/visual/sts/IntentOverlay.spec.ts
```

### Interaction Testing
```bash
# Run interaction tests
npm run test:e2e -- tests/visual/sts/intent-overlay-interactions.spec.ts
```

### Using Utility Functions
```typescript
import { STSIntentOverlayUtils } from '../utils/visualInteraction/stsIntentOverlay';

const utils = new STSIntentOverlayUtils(page);
await utils.navigateToIntentVisualizer();
await utils.simulateTimelineData(5);
await utils.toggleDiffView();
```

## Baseline Management

### Adding New Baselines
1. Update `IntentOverlay.spec.ts` with new test cases
2. Run baseline capture with `--update-snapshots`
3. Review generated screenshots for accuracy
4. Commit new baselines to version control

### Updating Existing Baselines
1. Make UI changes that require baseline updates
2. Run `npm run test:visual:update` to regenerate baselines
3. Review diff output for unintended changes
4. Commit updated baselines with descriptive message

### Baseline Storage
- Baselines are stored in `tests/visual/sts/baselines/`
- Each baseline is a PNG file with descriptive naming
- Baselines are version controlled alongside test code

## Performance Benchmarks

### Interaction Response Times
- **Hover Tooltip**: < 100ms
- **Click Selection**: < 200ms
- **Keyboard Navigation**: < 50ms
- **Color Scheme Switch**: < 300ms
- **Zoom/Pan**: < 150ms

### Large Dataset Performance
- **100 Rounds Rendering**: < 1 second
- **Scroll Performance**: < 16ms per frame
- **Interaction Response**: < 500ms

## Accessibility Testing

### ARIA Coverage
- All interactive elements have `aria-label`
- Proper `role` attributes for semantic elements
- Keyboard navigation support for all features
- Screen reader announcements for state changes

### WCAG Compliance
- Color contrast ratios meet AA standards
- Focus indicators clearly visible
- Text alternatives for visual information
- Keyboard-only navigation possible

## Troubleshooting

### Common Issues

**Baseline Flakiness**
- Ensure animations are disabled
- Check for dynamic content (timestamps, random data)
- Verify consistent viewport sizes
- Use deterministic test data

**Screenshot Differences**
- Review UI changes for intentional modifications
- Check for font rendering differences
- Verify color scheme consistency
- Ensure proper element positioning

**Performance Test Failures**
- Check system resource usage
- Verify test environment consistency
- Review large dataset implementation
- Optimize rendering bottlenecks

### Debug Commands
```bash
# Run tests with debugging
npm run test:visual -- tests/visual/sts/IntentOverlay.spec.ts --debug

# Run specific test case
npm run test:visual -- tests/visual/sts/IntentOverlay.spec.ts -g "Default View"

# Run with trace files
npm run test:visual -- tests/visual/sts/IntentOverlay.spec.ts --trace on
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run STS Visual Tests
  run: |
    npm run test:visual -- tests/visual/sts/IntentOverlay.spec.ts
    npm run test:e2e -- tests/visual/sts/intent-overlay-interactions.spec.ts
```

### Docker Configuration
Visual tests run in Docker containers for consistency:
```dockerfile
FROM mcr.microsoft.com/playwright:v1.41.0
COPY . /app
WORKDIR /app
RUN npm ci
RUN npm run test:visual -- tests/visual/sts/IntentOverlay.spec.ts
```

## Maintenance Schedule

### Regular Tasks
- **Weekly**: Review baseline stability
- **Monthly**: Update performance benchmarks
- **Quarterly**: Audit accessibility compliance
- **As Needed**: Update baselines for UI changes

### Version Control
- Tag releases with baseline versions
- Track baseline changes in commit messages
- Maintain changelog for visual test updates

## Future Enhancements

### Planned Improvements
- **AI-Powered Diff Analysis**: Automated categorization of visual changes
- **Cross-Browser Testing**: Support for Chrome, Firefox, Safari
- **Mobile Device Matrix**: Testing across various mobile devices
- **Performance Regression Detection**: Automated performance monitoring

### Integration Opportunities
- **Design System Sync**: Auto-update baselines for design token changes
- **Component Library**: Reusable visual test patterns
- **Analytics Dashboard**: Visual test metrics and trends

## References

- [E2E-VRT-001 Physical E2E Testing System](../plans/physical_e2e_testing_plan.md)
- [NP-001 STS Intent Overlay Implementation](../../balancing/sts/intent_overlay.md)
- [Style Laboratory Tokens](../../ui/style_lab/tokens.md)
- [Accessibility Guidelines](../../accessibility/wcag_compliance.md)
