# Punch Club PWA Visual Baselines Documentation

## Overview

This document outlines the visual regression testing setup for Punch Club PWA install flow, including baseline capture, comparison, and maintenance procedures.

## Test Coverage

### Visual Elements Tested

1. **PWA Install Banner**
   - Banner appearance and positioning
   - Install button styling and states
   - Close/dismiss functionality
   - Responsive behavior

2. **Consent Modal**
   - Modal overlay and backdrop
   - Consent options and checkboxes
   - Accept/Reject button states
   - GDPR compliance display

3. **Telemetry Toast**
   - Toast notification appearance
   - Success/error state styling
   - Auto-dismiss behavior
   - Positioning and z-index

4. **Complete Flow**
   - Full page layout with all elements
   - Element stacking and layering
   - Overall visual consistency

## File Structure

```
tests/visual/punchClub/
├── PWAInstallFlow.spec.ts          # Playwright test suite
├── baselines/                      # Baseline screenshots
│   ├── pwa-install-banner.png
│   ├── consent-modal.png
│   ├── telemetry-toast.png
│   ├── pwa-complete-flow.png
│   └── metadata-desktop.json       # Test metadata
└── README.md                        # This documentation
```

## Usage

### Capture Baselines

```bash
# Capture baselines for desktop viewport
npm run visual:punch-club -- capture

# Capture for specific viewport
npm run visual:punch-club -- capture --viewport 375x812 --device mobile

# Capture with custom timeout
npm run visual:punch-club -- capture --timeout 15000
```

### Compare Screenshots

```bash
# Compare current screenshots with baselines
npm run visual:punch-club -- diff

# Compare with custom threshold
npm run visual:punch-club -- diff --threshold 0.05

# Output results as JSON
npm run visual:punch-club -- diff --output json
```

### List Existing Baselines

```bash
npm run visual:punch-club -- list
```

### Clean Current Screenshots

```bash
npm run visual:punch-club -- clean
```

## Configuration

### Viewport Configuration

- **Desktop**: 1280x720 (default)
- **Mobile**: 375x812
- **Tablet**: 768x1024

### Test Settings

- **Animations**: Disabled for consistent screenshots
- **Timeout**: 10 seconds (configurable)
- **Retries**: 3 attempts
- **Threshold**: 0.1% diff tolerance

## Baseline Management

### When to Update Baselines

1. **Intentional UI Changes**: When design updates are approved
2. **New Features**: When new visual elements are added
3. **Bug Fixes**: When visual bugs are corrected
4. **Responsive Changes**: When layout adjustments are made

### Baseline Versioning

- Each baseline capture includes metadata with timestamp
- Previous baselines are archived automatically
- Metadata includes viewport, device, and test configuration

### Review Process

1. Capture new baselines after UI changes
2. Review diff results for unintended changes
3. Update baselines only for approved changes
4. Document reasons for baseline updates

## Integration with CI/CD

### GitHub Actions Integration

```yaml
- name: Run Visual Regression Tests
  run: |
    npm run visual:punch-club -- diff --threshold 0.1 --output json > results.json
    
- name: Upload Visual Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: visual-results
    path: |
      test-results/visual/
      results.json
```

### Failure Conditions

- Visual diff exceeds threshold (default 0.1%)
- Missing baseline files
- Test execution failures
- Screenshot capture errors

## Troubleshooting

### Common Issues

1. **Flaky Tests**: Increase timeout or add retry logic
2. **Animation Artifacts**: Ensure animations are disabled
3. **Font Loading**: Wait for fonts to load before screenshots
4. **Network Issues**: Mock network requests for consistency

### Debug Commands

```bash
# Run tests in headed mode for debugging
npm run test:visual -- tests/visual/punchClub/PWAInstallFlow.spec.ts --headed

# Run with trace for detailed logging
npm run test:visual -- tests/visual/punchClub/PWAInstallFlow.spec.ts --trace on
```

## Best Practices

### Test Stability

1. **Disable Animations**: Use CSS to disable transitions and animations
2. **Mock External Data**: Prevent network variability
3. **Consistent Viewport**: Use fixed viewport sizes
4. **Wait for Stability**: Ensure elements are fully loaded

### Baseline Quality

1. **High Resolution**: Capture at device pixel ratio 1.0 for consistency
2. **Complete Coverage**: Test all relevant states and interactions
3. **Documentation**: Document baseline updates and reasons
4. **Version Control**: Track baseline changes in version control

## Performance Considerations

### Execution Time

- **Single Test**: ~30 seconds
- **Full Suite**: ~2 minutes
- **Baseline Capture**: ~3 minutes

### Storage Requirements

- **Baseline Images**: ~2MB total
- **Diff Images**: ~1MB per run
- **Metadata**: ~1KB per file

## Future Enhancements

### Planned Features

1. **Multi-Device Support**: Automated testing across device profiles
2. **AI-Powered Analysis**: Intelligent change detection
3. **Interactive Reports**: Web-based diff viewer
4. **Regression Detection**: Automatic identification of visual regressions

### Integration Opportunities

1. **Design System**: Sync with design token changes
2. **Component Library**: Test component variations
3. **A/B Testing**: Validate visual experiments
4. **Accessibility**: Combine with accessibility testing

## Related Documentation

- [E2E-VRT-001 Physical E2E Testing System](../plans/physical_e2e_testing_plan.md)
- [PC-M2 PWA Distribution & Telemetry](../strategy/punch_club_playtest.md)
- [Playwright Configuration](../../../playwright.config.ts)
- [Visual Testing Guidelines](../tests/visual_testing_guidelines.md)
