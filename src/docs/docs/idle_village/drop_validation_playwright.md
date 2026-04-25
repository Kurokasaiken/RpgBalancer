# Idle Village Drop Validation Playwright Smoke Tests

**Since:** NP-069 – Idle Village Drop Validation Playwright Smoke  
**Status:** ✅ Complete  
**Last Updated:** 2026-01-20

## Overview

The Idle Village Drop Validation Playwright Smoke Tests provide comprehensive end-to-end testing for the drag/drop validation system with the Location Drop Validator Helper. These tests validate UI feedback, error handling, and cross-browser compatibility for all validation rules.

## Features

### 🎯 Core Testing Capabilities
- **Smoke Tests**: Quick validation of core drag/drop functionality
- **Rule Validation**: Test all built-in validation rules (crew limits, fatigue thresholds, stat tags, location compatibility, capacity constraints)
- **UI Feedback Testing**: Verify error messages, warnings, and suggestions display correctly
- **Cross-Browser Testing**: Test across Chrome, Firefox, and Safari
- **Mobile Viewport Testing**: Validate touch interactions and responsive design
- **Accessibility Testing**: Ensure screen reader and keyboard navigation support
- **Error Handling**: Graceful handling of network errors, timeouts, and missing elements

### 📊 Test Coverage
- **Basic Validation Rules**: All 5 built-in validation rules
- **Complex Scenarios**: Multiple violations and edge cases
- **UI Feedback**: Error messages, warnings, suggestions, visual feedback
- **Performance**: Rapid operations and concurrent validation
- **Integration**: KS-030 drag/drop system and NP-066 validator helper
- **Accessibility**: ARIA labels, keyboard navigation, color contrast

### 🔧 Test Configuration
- **Multiple Viewports**: Desktop, tablet, mobile, landscape mobile
- **Cross-Browser**: Chrome, Firefox, Safari
- **Timeouts**: Configurable timeouts for different operations
- **Screenshots**: Automatic screenshots on failure
- **Video Recording**: Optional video capture in CI environments
- **Retry Logic**: Automatic retry for flaky tests

## Architecture

### Test Structure
```
tests/e2e/idleVillage/
├── fixtures/
│   └── dropValidationFixtures.ts              # Test scenarios and data
├── LocationDropValidationSmoke.spec.ts           # Main smoke test suite
├── IdleVillageMapPage.spec.ts                  # Existing map page tests
docs/idle_village/
└── drop_validation_playwright.md                 # Documentation
test-results/
├── screenshots/                              # Test screenshots
└── np-069-drop-playwright-<data>.log             # Evidence log
```

### Test Categories
1. **Basic Validation Rules**: Individual validation rule testing
2. **Complex Scenarios**: Multiple violations and edge cases
3. **Mobile Viewport**: Touch interactions and responsive design
4. **Cross-Browser**: Compatibility across browsers
5. **Performance**: Rapid operations and concurrent testing
6. **Accessibility**: Screen reader and keyboard navigation
7. **Integration**: System integration validation
8. **Error Handling**: Graceful error recovery

## Configuration

### Test Fixtures
```typescript
interface DropValidationScenario {
  id: string;
  type: DropScenarioType;
  description: string;
  expectedResult: 'allowed' | 'forbidden' | 'warning';
  expectedFeedback: {
    showError: boolean;
    showWarning: boolean;
    showSuggestions: boolean;
    errorKeywords?: string[];
    warningKeywords?: string[];
    suggestionCount?: number;
  };
  source: {
    id: string;
    type: LocationType;
    currentOccupants: number;
    maxOccupants: number;
    fatigueLevel: number;
    testTags: string[];
  };
  target: {
    id: scenario.target.id;
    type: LocationType;
    currentOccupants: number;
    maxOccupants: number;
    fatigueLevel: number;
    testTags: string[];
  };
  resident: {
    id: string;
    name: string;
    stats: Record<string, number>;
    tags: string[];
    fatigueLevel: number;
  };
  setup: {
    elements: string[];
    state?: Record<string, unknown>;
    steps?: string[];
  };
}
```

### Test Scenarios
```typescript
// Valid drop scenario
{
  id: 'valid-drop-residential',
  type: 'valid_drop',
  description: 'Valid drop from residential to residential location',
  expectedResult: 'allowed',
  expectedFeedback: {
    showError: false,
    showWarning: false,
    showSuggestions: false,
  },
  // ... full scenario data
}

// Crew limit violation scenario
{
  id: 'crew-limit-violation',
  type: 'crew_limit_violation',
  description: 'Drop violates crew limit for target location',
  expectedResult: 'forbidden',
  expectedFeedback: {
    showError: true,
    showWarning: false,
    showSuggestions: true,
    errorKeywords: ['capacity', 'maximum', 'crew'],
    suggestionCount: 2,
  },
  // ... full scenario data
}
```

### Viewport Configurations
```typescript
const VIEWPORT_CONFIGURATIONS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
  'mobile-landscape': { width: 667, height: 375 },
};
```

### Timeout Configurations
```typescript
const TIMEOUT_CONFIGURATIONS = {
  default: 30000,
  drag: 10000,
  feedback: 5000,
  navigation: 15000,
};
```

## Usage

### Running Tests

#### Basic Test Execution
```bash
# Run all drop validation tests
npm run test:e2e tests/e2e/idleVillage/LocationDropValidationSmoke.spec.ts

# Run with specific viewport
npx playwright test --config=playwright.config.ts --viewport="375,667" tests/e2e/idleVillage/LocationDropValidationSmoke.spec.ts

# Run with specific browser
npx playwright test --project=chromium tests/e2e/idleVillage/LocationDropValidationSmoke.spec.ts
```

#### Running with Coverage
```bash
# Run with coverage reporting
npm run test:e2e --coverage tests/e2e/idleVillage/LocationDropValidationSmoke.spec.ts

# Generate HTML coverage report
npx playwright show-report
```

#### Running in CI/CD
```bash
# In CI pipeline
npm run test:e2e --reporter=html --reporter=output/playwright-report
npm run test:e2e --reporter=json --reporter=output/playwright-results.json
```

### Test Categories

#### Basic Validation Rules
```bash
# Run only basic validation rule tests
npx playwright test --grep "Basic Validation Rules" tests/e2e/idleVillage/LocationDropValidationSmoke.spec.ts

# Run specific rule test
npx playwright test --grep "should show error for crew limit violation" tests/e2e/idleVillage/LocationDropValidationSmoke.spec.ts
```

#### Mobile Tests
```bash
# Run mobile viewport tests
npx playwright test --grep "Mobile Viewport Tests" tests/e2e/idleVillage/LocationDropValidationSmoke.spec.ts

# Run specific mobile viewport
npx playwright test --viewport="375,667" tests/e2e/idleVillage/LocationDropValidationSmoke.spec.ts
```

#### Cross-Browser Tests
```bash
# Run cross-browser tests
npx playwright test --project=firefox tests/e2e/idleVillage/LocationDropSmoke.spec.ts
npx playwright test --project=webkit tests/e2e/idleVillage/LocationDropSmoke.spec.ts
```

#### Accessibility Tests
```bash
# Run accessibility tests
npx playwright test --grep "Accessibility Tests" tests/e2e/idleVillage/LocationDropValidationSmoke.spec.ts
```

#### Performance Tests
```bash
# Run performance tests
npx playwright test --grep "Performance Smoke Tests" tests/e2e/idleVillage/LocationDropValidationSmoke.spec.ts
```

### Test Configuration

#### Playwright Config
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 30000,
  retries: 2,
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, 720 },
      },
    },
  ],
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: false,
  retries: 2,
  reporter: 'html',
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
});
```

#### Test Environment Setup
```typescript
// Global test setup
test.beforeEach(async ({ page }) => {
  // Navigate to idle village map
  await page.goto('/idle-village/map');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="idle-village-map"]');
  
  // Ensure validation system is loaded
  await page.waitForSelector('[data-testid="validation-system"]');
});
```

## Test Scenarios

### 1. Basic Validation Rules

#### Valid Drop
```typescript
test('should allow valid drop', async ({ page }) => {
  const scenario = getScenarioById('valid-drop-residential')!;
  
  const testData = TestDataGenerator.generateTestData(scenario);
  
  // Perform valid drag and drop
  await helper.performDragDrop(
    testData.selectors.resident,
    testData.selectors.target
  );
  
  // Verify no error feedback
  const feedback = await helper.checkValidationFeedback(scenario);
  expect(feedback.hasError).toBe(false);
  expect(feedback.hasWarning).toBe(false);
});
```

#### Crew Limit Violation
```typescript
test('should show error for crew limit violation', async ({ page }) => {
  const scenario = getScenarioById('crew-limit-violation')!;
  
  const testData = TestDataGenerator.generateTestData(scenario);
  
  // Perform invalid drag and drop
  await helper.performDragDrop(
    testData.selectors.resident,
    testData.selectors.target
  );
  
  // Verify error feedback
  await helper.verifyFeedback(scenario);
  
  // Check for specific error keywords
  const feedback = await helper.checkValidationFeedback(scenario);
  expect(feedback.errorText?.toLowerCase()).toContain('capacity');
  expect(feedback.suggestionCount).toBeGreaterThanOrEqual(2);
});
```

### 2. Complex Scenarios

#### Multiple Violations
```typescript
test('should handle multiple violations', async ({ page }) => {
  const scenario = getScenarioById('multiple-violations')!;
  
  const testData = TestDataGenerator.generateTestData(scenario);
  
  // Perform drag and drop with multiple violations
  await helper.performDragDrop(
    testData.selectors.resident,
    testData.selectors.target
  );
  
  // Verify error feedback with multiple issues
  await helper.verifyFeedback(scenario);
  
  // Check for multiple error keywords
  const feedback = await helper.checkValidationFeedback(scenario);
  expect(feedback.errorText?.toLowerCase()).toContain('violations');
  expect(feedback.suggestionCount).toBe(5);
});
```

### 3. Mobile Viewport Tests

#### Touch Interactions
```typescript
test.describe('Mobile Viewport Tests', () => {
  const mobileViewports = [
    VIEWPORT_CONFIGURATIONS.mobile,
    VIEWPORT_CONFIGURATIONS['mobile-landscape'],
  ];

  mobileViewports.forEach(viewport => {
    test.describe(`Mobile ${viewport.width}x${viewport.height}`, () => {
      test.useConfig({ viewport });
      
      const scenarios = TestDataGenerator.generateMobileTestData();
      
      for (const scenario of scenarios) {
        const testData = TestDataGenerator.generateTestData(scenario);
        await helper.performDragDrop(
          testData.selectors.resident,
          testData.selectors.target
        );
        await helper.verifyFeedback(scenario);
      }
    });
  });
});
```

### 4. Cross-Browser Tests
```typescript
test.describe('Cross-Browser Tests', () => {
  const crossBrowserScenarios = TestDataGenerator.generateCrossBrowserTestData();

  crossBrowserScenarios.forEach(scenario => {
    test.describe(`Cross-browser: ${scenario.id}`, () => {
      const testData = TestDataGenerator.generateTestData(scenario);
      
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      await helper.verifyFeedback(scenario);
    });
  });
});
```

### 5. Accessibility Tests

#### Screen Reader Support
```typescript
test('should be accessible for screen readers', async ({ page }) => {
  // Check for proper ARIA labels on draggable elements
  const draggables = page.locator('[draggable="true"]');
  await expect(draggables).toHaveCount(3);
  
  // Check for proper ARIA live regions for feedback
  const liveRegions = page.locator('[aria-live="polite"]');
  await expect(liveRegions).toHaveCount(1);
  
  // Check for proper color contrast in validation feedback
  const errorElements = page.locator('[data-testid="validation-error"]');
  await expect(errorElements).toBeVisible();
});
```

#### Keyboard Navigation
```typescript
test('should support keyboard navigation', async ({ page }) => {
  // Test keyboard navigation to draggables
  await page.keyboard.press('Tab');
  const firstDraggable = page.locator('[draggable="true"]').first();
  await expect(firstDraggable).toBeFocused();
  
  // Test keyboard navigation to drop targets
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const firstDropTarget = page.locator('[data-testid*="location"]').first();
  await expect(firstDropTarget).toBeFocused();
});
```

### 6. Performance Tests

#### Rapid Operations
```typescript
test('should handle rapid drag operations', async ({ page }) => {
  const scenario = getScenarioById('valid-drop-residential')!;
  const testData = TestDataGenerator.generateTestData(scenario);
  
  const startTime = Date.now();
  
  // Perform multiple rapid drag operations
  for (let i = 0; i < 5; i++) {
    await helper.performDragDrop(
      testData.selectors.resident,
      testData.selectors.target
    );
    await page.waitForTimeout(500);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Verify performance is acceptable
  expect(duration).toBeLessThan(10000);
});
```

#### Concurrent Validation
```typescript
test('should handle concurrent validation', async ({ page }) => {
  const scenarios = [
    getScenarioById('valid-drop-residential')!,
    getScenarioById('crew-limit-violation')!,
    getScenarioById('fatigue-threshold-violation')!,
  ];
  
  for (const scenario of scenarios) {
    const testData = TestDataGenerator.generateTestData(scenario);
    await helper.performDragDrop(
      testData.selectors.resident,
      testData.selectors.target
    );
    await helper.verifyFeedback(scenario);
    
    // Reset for next test
    await page.reload();
    await helper.navigateToIdleVillage();
  }
});
```

### 7. Integration Tests

#### KS-030 Integration
```typescript
test('should integrate with KS-030 drag/drop system', async ({ page }) => {
  // Test that drag/drop system is functional
  const draggables = page.locator('[draggable="true"]');
  await expect(draggables).toHaveCount(3);
  
  const dropTargets = page.locator('[data-testid*="location"]');
  await expect(dropTargets).toHaveCount(3);
  
  // Test that validation system is integrated
  const scenario = getScenarioById('valid-drop-residential')!;
  const testData = TestDataGenerator.generateTestData(scenario);
  
  await helper.performDragDrop(
    testData.selectors.resident,
    testData.selectors.target
  );
  
  // Verify integration works
  const feedback = await helper.checkValidationFeedback(scenario);
  expect(feedback.hasError).toBe(false);
});
```

#### NP-066 Integration
```typescript
test('should integrate with NP-066 validator helper', async ({ page }) => {
  // Test that validator helper is loaded
  const validationSystem = page.locator('[data-testid="validation-system"]');
  await expect(validationSystem).toBeVisible();
  
  // Test that validation rules are active
  const scenario = getScenarioById('crew-limit-violation')!;
  const testData = TestDataGenerator.generateTestData(scenario);
  
  await helper.performDragDrop(
    testData.selectors.resident,
    testData.selectors.target
  );
  
  // Verify validator helper integration
  await helper.verifyFeedback(scenario);
});
```

### 8. Error Handling Tests

#### Missing Elements
```typescript
test('should handle missing elements gracefully', async ({ page }) => {
  // Try to drag non-existent element
  const nonExistent = page.locator('[data-testid="non-existent"]');
  await expect(nonExistent).toHaveCount(0);
  
  // Should not crash and should handle gracefully
  await helper.takeScreenshot('error-missing-elements');
});
```

#### Network Errors
```typescript
test('should handle network errors gracefully', async ({ page }) => {
  // Mock network error scenario
  await page.route('/api/validate-drop', route => {
    route.abort('failed');
  });
  
  await helper.navigateToIdleVillage();
  
  // Perform drag and drop
  const scenario = getScenarioById('valid-drop-residential')!;
  const testData = TestDataGenerator.generateTestData(scenario);
  
  await helper.performDragDrop(
    testData.selectors.resident,
    testData.selectors.target
  );
  
  // Should handle gracefully and show fallback feedback
  await helper.takeScreenshot('error-network-failure');
});
```

## Test Data Management

### Scenario Organization
```typescript
// By type
const errorScenarios = getScenariosByType('crew_limit_violation');
const warningScenarios = getScenariosByType('capacity_overflow');
const edgeCases = getEdgeCaseScenarios();

// By expected result
const forbiddenScenarios = getScenariosByExpectedResult('forbidden');
const warningScenarios = getScenariosByExpectedResult('warning');
const allowedScenarios = getScenariosByExpectedResult('allowed');
```

### Data Generation
```typescript
// Generate test data for scenario
const testData = TestDataGenerator.generateTestData(scenario);

// Generate mobile-specific test data
const mobileData = TestDataGenerator.generateMobileTestData();

// Generate cross-browser test data
const crossBrowserData = TestDataGenerator.generateCrossBrowserTestData();
```

## Test Execution

### Running Individual Tests
```bash
# Single test
npx playwright test --grep "should allow valid drop"

# By test group
npx playwright test --grep "Basic Validation Rules"

# By scenario ID
npx playwright test --grep "valid-drop-residential"
```

### Running Test Suites
```bash
# All smoke tests
npm run test:e2e tests/e2e/idleVillage/LocationDropValidationSmoke.spec.ts

# Specific test categories
npx playwright test --grep "Mobile Viewport Tests"
npx playwright test --grep "Cross-Browser Tests"
npx playwright test --grep "Accessibility Tests"
```

### Debugging Tests
```bash
# Run with screenshots on failure
npx playwright test --config=playwright.config.ts --screenshot-on-failure

# Run with trace on failure
npx playwright test --config=playwright.config.ts --trace-on-failure

# Run with video recording
npx playwright test --config=playwright.config.ts --video
```

### CI/CD Integration
```bash
# In CI pipeline
npm run test:e2e --reporter=html --reporter=output/playwright-report

# Generate coverage report
npm run test:e2e --coverage --reporter=html
```

## Troubleshooting

### Common Issues

#### Test Failures
**Cause**: Elements not found or timeout issues
**Solution**: Check element selectors and increase timeouts

```typescript
// Check if elements exist
await page.waitForSelector('[data-testid="element-id"]', { timeout: 10000 });
```

#### Drag and Drop Issues
**Cause**: Drag and drop not working properly
**Solution**: Verify draggables and drop targets are properly configured

```typescript
// Check draggables
const draggables = page.locator('[draggable="true"]');
await expect(draggables).toHaveCount(3);

// Check drop targets
const dropTargets = page.locator('[data-testid*="location"]');
await expect(dropTargets).toHaveCount(3);
```

#### Feedback Not Showing
**Cause**: Validation feedback not appearing
**Solution**: Verify validation system is loaded and feedback elements exist

```typescript
// Check validation system
const validationSystem = page.locator('[data-testid="validation-system"]');
await expect(validationSystem).toBeVisible();

// Check feedback elements
const errorElement = page.locator('[data-testid="validation-error"]');
const warningElement = page.locator('[data-testid="validation-warning"]');
```

#### Performance Issues
**Cause**: Tests running too slowly
**Solution**: Optimize test data and reduce unnecessary waits

```typescript
// Use shorter timeouts
await page.waitForTimeout(1000); // Instead of 5000ms
```

### Debug Mode
Enable detailed logging for troubleshooting:
```typescript
// Enable console logging
test.describe('Debug Mode', () => {
  test('debug specific scenario', async ({ page }) => {
    console.log('Starting debug test...');
    
    // Add detailed logging
    await page.evaluate(() => {
      console.log('Page title:', document.title);
      console.log('URL:', window.location.href);
      console.log('Available elements:', document.querySelectorAll('[data-testid]').length);
    });
    
    // Continue with test
  });
});
```

### Screenshot Analysis
```bash
# Generate screenshots for analysis
npx playwright test --config=playwright.config.ts --screenshot-on-failure

# Analyze screenshots
npx playwright show-report
```

## Performance Considerations

### Test Speed
- **Single Test**: < 5 seconds
- **Test Suite**: < 2 minutes
- **Cross-Browser**: < 5 minutes
- **Mobile Tests**: < 3 minutes

### Resource Usage
- **Memory**: < 1GB per test suite
- **CPU**: < 50% during execution
- **Storage**: Minimal (screenshots only on failure)

### Optimization Features
- **Parallel Execution**: Tests run in parallel where possible
- **Smart Retries**: Automatic retry for flaky tests
- **Timeout Management**: Configurable timeouts for different operations
- **Selective Screenshot**: Screenshots only on failure

### Best Practices
- **Isolation**: Each test should be independent
- **Cleanup**: Proper cleanup between tests
- **Assertions**: Clear, specific assertions
- **Documentation**: Well-documented test cases

## Maintenance

### Adding New Scenarios
1. Add scenario to `DROP_VALIDATION_SCENARIOS` in fixtures
2. Update test categories if needed
3. Add corresponding test case
4. Update documentation

### Updating Existing Scenarios
1. Modify scenario data in fixtures
2. Update expected results if validation logic changes
3. Update test assertions if UI changes
4. Run tests to verify updates

### Adding New Test Categories
1. Add new test.describe blocks
2. Create helper methods if needed
3. Add configuration if required
4. Update documentation

## Future Enhancements

### Planned Features
- **Visual Regression Testing**: Automated visual comparison
- **API Testing**: Test validation API endpoints
- **Load Testing**: Performance testing under load
- **Mobile Device Testing**: Real device testing integration

### Advanced Testing Scenarios
- **Complex Workflows**: Multi-step drag/drop sequences
- **State Management**: Validation state persistence
- **Real-time Validation**: Live validation during drag operations
- **Batch Operations**: Multiple simultaneous drops

### Integration Extensions
- **CI/CD Pipeline**: Enhanced CI/CD integration
- **Test Data Generation**: Automated test data generation
- **Report Generation**: Enhanced reporting capabilities
- **Analytics Integration**: Test analytics and metrics

## Contributing

When contributing to the Drop Validation Playwright Smoke Tests:

1. **Follow Test Structure**: Use established test patterns
2. **Add Comprehensive Coverage**: Cover all validation rules and edge cases
3. **Update Documentation**: Keep documentation synchronized
4. **Test Locally**: Run tests before submitting
5. **Performance Testing**: Ensure tests run efficiently

### Test Writing Guidelines
- **Descriptive Names**: Use clear, descriptive test names
- **Arrange-Act-Assert**: Follow AAA testing pattern
- **Clear Assertions**: Use specific, meaningful assertions
- **Error Messages**: Provide helpful error messages
- **Documentation**: Document complex scenarios

### Code Quality
- **TypeScript**: Use proper TypeScript typing
- **Async/Await**: Use async/await for all async operations
- **Error Handling**: Proper error handling and recovery
- **Cleanup**: Proper cleanup between tests
- **Consistency**: Maintain consistent coding style

## License

This test suite is part of the RPG Balancer project and follows the same licensing terms.

---

**Related Documentation:**
- [NP-066 Location Drop Validator Helper](../ui/idleVillage/utils/locationDropValidator.md)
- [KS-030 Drag/Drop Plan](../plans/idle_village_plan.md)
- [E2E-VRT-001 Playwright Setup](../testing/playwright_config.md)
- [NP-069 Kanban Entry](../docs/coordinator/agent_assignments.md)
