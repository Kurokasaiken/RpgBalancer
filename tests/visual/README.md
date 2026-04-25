# Visual Regression Tests

This directory contains visual regression tests using Playwright's `toHaveScreenshot()` functionality.

## Structure

```
tests/visual/
├── idleVillage/     # Idle Village component visual tests
├── sts/             # STS component visual tests
├── balancer/        # Balancer component visual tests
├── mobile/          # Mobile-specific visual tests
└── README.md        # This file
```

## Running Tests

### Local (Native)

```bash
# Run all visual tests
npm run test:visual

# Update snapshots (when intentional changes made)
npm run test:visual:update
```

### Docker (Recommended for CI consistency)

```bash
# Build Docker image (first time only)
npm run visual:build-docker

# Run tests in Docker
npm run test:visual:docker

# Update snapshots in Docker
npm run test:visual:docker:update
```

## Writing Visual Tests

### Test Naming Convention

- File: `ComponentName.visual.spec.ts`
- Tag: `@visual` (required)
- Mobile tag: `@visual @mobile` (for mobile-specific tests)

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { seedVillageSandbox } from '../../fixtures/villageSandbox';

test.describe('ActivitySlot Visual Regression @visual', () => {
  test.beforeEach(async ({ page }) => {
    await seedVillageSandbox(page, { tabId: 'punchClub' });
  });

  test('idle state matches baseline', async ({ page }) => {
    const slot = page.locator('[data-testid="activity-slot-job_punch_training"]');
    await expect(slot).toHaveScreenshot('activity-slot-idle.png');
  });

  test('hover state shows bloom effect', async ({ page }) => {
    const slot = page.locator('[data-testid="activity-slot-job_punch_training"]');
    await slot.hover();
    await page.waitForTimeout(100); // Allow CSS transition
    await expect(slot).toHaveScreenshot('activity-slot-hover.png');
  });
});
```

## Snapshot Configuration

Configured in `playwright.config.ts`:

- **maxDiffPixelRatio**: 0.001 (0.1% pixel difference allowed)
- **threshold**: 0.2 (color difference threshold)
- **animations**: disabled (for consistent screenshots)

## Best Practices

1. **Use Docker for baseline generation** - Ensures consistency across environments
2. **Test multiple states** - idle, hover, active, error, etc.
3. **Wait for animations** - Use `page.waitForTimeout()` after state changes
4. **Isolate components** - Test individual components, not full pages
5. **Descriptive names** - Use clear screenshot names like `component-state.png`

## Troubleshooting

### Flaky Screenshots

If screenshots differ between runs:
- Ensure you're using Docker for consistency
- Check for animations (should be disabled)
- Verify fonts are loaded before screenshot
- Use `page.waitForLoadState('networkidle')` if needed

### Updating Baselines

Only update baselines when:
- Intentional visual changes made
- Reviewed and approved by team
- Run in Docker to ensure consistency

```bash
npm run test:visual:docker:update
```

## CI Integration

Visual regression tests run automatically in CI via `.github/workflows/visual-regression.yml`.

Failed tests will:
- Upload diff images as artifacts
- Comment on PR with visual changes
- Block merge if regressions detected
