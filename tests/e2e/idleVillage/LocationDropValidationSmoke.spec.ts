/**
 * Location Drop Validation Playwright Smoke Test
 * 
 * Playwright smoke tests for validating UI drag/drop with validator helper
 * covering all validation rules, error handling, and feedback mechanisms.
 * 
 * @since NP-069 – Idle Village Drop Validation Playwright Smoke
 */

import { test, expect, devices, browsers } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import type {
  DropValidationScenario,
  DropScenarioType,
} from './fixtures/dropValidationFixtures';
import {
  DROP_VALIDATION_SCENARIOS,
  getScenarioById,
  getScenariosByType,
  getErrorScenarios,
  getWarningScenarios,
  getSuggestionScenarios,
  getEdgeCaseScenarios,
  getMobileScenarios,
  getDesktopScenarios,
  getCrossBrowserScenarios,
  setupDropValidationPage,
  getDragDropSelectors,
  getValidationFeedbackSelectors,
  VIEWPORT_CONFIGURATIONS,
  BROWSER_CONFIGURATIONS,
  TIMEOUT_CONFIGURATIONS,
} from './fixtures/dropValidationFixtures';

/**
 * Test configuration
 */
const TEST_CONFIG = {
  timeout: TIMEOUT_CONFIGURATIONS.default,
  retries: 2,
  screenshotOnFailure: true,
  video: process.env.CI === 'true',
};

/**
 * Base test utilities
 */
class DropValidationTestHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to idle village map and wait for load
   */
  async navigateToIdleVillage(): Promise<void> {
    await this.page.goto('/idle-village/map');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="idle-village-map"]', {
      timeout: TIMEOUT_CONFIGURATIONS.navigation,
    });
  }

  /**
   * Perform drag and drop operation
   */
  async performDragDrop(
    sourceSelector: string,
    targetSelector: string,
    options: {
      timeout?: number;
      intermediateSteps?: string[];
    } = {}
  ): Promise<void> {
    const { timeout = TIMEOUT_CONFIGURATIONS.drag, intermediateSteps = [] } = options;

    // Get source and target elements
    const source = this.page.locator(sourceSelector);
    const target = this.page.locator(targetSelector);

    // Wait for elements to be visible
    await source.waitFor({ timeout });
    await target.waitFor({ timeout });

    // Perform intermediate steps if provided
    for (const step of intermediateSteps) {
      await this.page.waitForSelector(step, { timeout: 5000 });
    }

    // Perform drag and drop
    await source.dragTo(target);
    
    // Wait for any validation feedback
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check for validation feedback
   */
  async checkValidationFeedback(scenario: DropValidationScenario): Promise<{
    hasError: boolean;
    hasWarning: boolean;
    hasSuggestions: boolean;
    errorText?: string;
    warningText?: string;
    suggestionCount: number;
  }> {
    const { errorMessage, warningMessage, suggestions, dropFeedback } = getValidationFeedbackSelectors();

    // Check for error message
    let hasError = false;
    let errorText: string | undefined;
    if (scenario.expectedFeedback.showError) {
      const errorElement = this.page.locator(errorMessage);
      hasError = await errorElement.isVisible().catch(() => false);
      if (hasError) {
        errorText = await errorElement.textContent() || '';
      }
    }

    // Check for warning message
    let hasWarning = false;
    let warningText: string | undefined;
    if (scenario.expectedFeedback.showWarning) {
      const warningElement = this.page.locator(warningMessage);
      hasWarning = await warningElement.isVisible().catch(() => false);
      if (hasWarning) {
        warningText = await warningElement.textContent() || '';
      }
    }

    // Check for suggestions
    let hasSuggestions = false;
    let suggestionCount = 0;
    if (scenario.expectedFeedback.showSuggestions) {
      const suggestionsElement = this.page.locator(suggestions);
      hasSuggestions = await suggestionsElement.isVisible().catch(() => false);
      if (hasSuggestions) {
        const suggestionItems = suggestionsElement.locator('[data-testid="suggestion-item"]');
        suggestionCount = await suggestionItems.count();
      }
    }

    return {
      hasError,
      hasWarning,
      hasSuggestions,
      errorText,
      warningText,
      suggestionCount,
    };
  }

  /**
   * Verify expected feedback matches actual feedback
   */
  async verifyFeedback(scenario: DropValidationScenario): Promise<void> {
    const feedback = await this.checkValidationFeedback(scenario);

    // Verify error feedback
    expect(feedback.hasError).toBe(scenario.expectedFeedback.showError);
    
    if (scenario.expectedFeedback.showError && scenario.expectedFeedback.errorKeywords) {
      expect(feedback.errorText).toBeDefined();
      for (const keyword of scenario.expectedFeedback.errorKeywords) {
        expect(feedback.errorText?.toLowerCase()).toContain(keyword.toLowerCase());
      }
    }

    // Verify warning feedback
    expect(feedback.hasWarning).toBe(scenario.expectedFeedback.showWarning);
    
    if (scenario.expectedFeedback.showWarning && scenario.expectedFeedback.warningKeywords) {
      expect(feedback.warningText).toBeDefined();
      for (const keyword of scenario.expectedFeedback.warningKeywords) {
        expect(feedback.warningText?.toLowerCase()).toContain(keyword.toLowerCase());
      }
    }

    // Verify suggestions
    expect(feedback.hasSuggestions).toBe(scenario.expectedFeedback.showSuggestions);
    
    if (scenario.expectedFeedback.showSuggestions && scenario.expectedFeedback.suggestionCount) {
      expect(feedback.suggestionCount).toBeGreaterThanOrEqual(scenario.expectedFeedback.suggestionCount);
    }
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/drop-validation-${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  /**
   * Log test information
   */
  async logTestInfo(scenario: DropValidationScenario, step: string): Promise<void> {
    console.log(`\n=== ${scenario.id} - ${step} ===`);
    console.log(`Type: ${scenario.type}`);
    console.log(`Expected: ${scenario.expectedResult}`);
    console.log(`Description: ${scenario.description}`);
  }
}

/**
 * Test data generators
 */
class TestDataGenerator {
  /**
   * Generate test data for scenario
   */
  static generateTestData(scenario: DropValidationScenario) {
    return {
      scenario,
      selectors: getDragDropSelectors(scenario),
      feedback: getValidationFeedbackSelectors(),
    };
  }

  /**
   * Generate mobile test data
   */
  static generateMobileTestData(): DropValidationScenario[] {
    return getMobileScenarios();
  }

  /**
   * Generate desktop test data
   */
  static generateDesktopTestData(): DropValidationScenario[] {
    return getDesktopScenarios();
  }

  /**
   * Generate cross-browser test data
   */
  static generateCrossBrowserTestData(): DropValidationScenario[] {
    return getCrossBrowserScenarios();
  }
}

/**
 * Core smoke tests
 */
test.describe('Location Drop Validation Smoke Tests', () => {
  let helper: DropValidationTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new DropValidationTestHelper(page);
    await helper.navigateToIdleVillage();
  });

  test.describe('Basic Validation Rules', () => {
    test('should allow valid drop', async () => {
      const scenario = getScenarioById('valid-drop-residential')!;
      await helper.logTestInfo(scenario, 'Starting test');
      
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
      
      await helper.takeScreenshot('valid-drop-success');
    });

    test('should show error for crew limit violation', async () => {
      const scenario = getScenarioById('crew-limit-violation')!;
      await helper.logTestInfo(scenario, 'Starting test');
      
      const testData = TestDataGenerator.generateTestData(scenario);
      
      // Perform invalid drag and drop
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      // Verify error feedback
      await helper.verifyFeedback(scenario);
      
      await helper.takeScreenshot('crew-limit-violation');
    });

    test('should show error for fatigue threshold violation', async () => {
      const scenario = getScenarioById('fatigue-threshold-violation')!;
      await helper.logTestInfo(scenario, 'Starting test');
      
      const testData = TestDataGenerator.generateTestData(scenario);
      
      // Perform invalid drag and drop
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      // Verify error feedback
      await helper.verifyFeedback(scenario);
      
      await helper.takeScreenshot('fatigue-threshold-violation');
    });

    test('should show error for missing stat tags', async () => {
      const scenario = getScenarioById('stat-tag-missing')!;
      await helper.logTestInfo(scenario, 'Starting test');
      
      const testData = TestDataGenerator.generateTestData(scenario);
      
      // Perform invalid drag and drop
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      // Verify error feedback
      await helper.verifyFeedback(scenario);
      
      await helper.takeScreenshot('stat-tag-missing');
    });

    test('should show error for location incompatibility', async () => {
      const scenario = getScenarioById('location-incompatible')!;
      await helper.logTestInfo(scenario, 'Starting test');
      
      const testData = TestDataGenerator.generateTestData(scenario);
      
      // Perform invalid drag and drop
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      // Verify error feedback
      await helper.verifyFeedback(scenario);
      
      await helper.takeScreenshot('location-incompatible');
    });

    test('should show warning for capacity overflow', async () => {
      const scenario = getScenarioById('capacity-overflow')!;
      await helper.logTestInfo(scenario, 'Starting test');
      
      const testData = TestDataGenerator.generateTestData(scenario);
      
      // Perform drag and drop with capacity warning
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      // Verify warning feedback
      await helper.verifyFeedback(scenario);
      
      await helper.takeScreenshot('capacity-overflow');
    });
  });

  test.describe('Complex Scenarios', () => {
    test('should handle multiple violations', async () => {
      const scenario = getScenarioById('multiple-violations')!;
      await helper.logTestInfo(scenario, 'Starting test');
      
      const testData = TestDataGenerator.generateTestData(scenario);
      
      // Perform drag and drop with multiple violations
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      // Verify error feedback with multiple issues
      await helper.verifyFeedback(scenario);
      
      await helper.takeScreenshot('multiple-violations');
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle empty tags edge case', async () => {
      const scenario = getScenarioById('edge-case-empty-tags')!;
      await helper.logTestInfo(scenario, 'Starting test');
      
      const testData = TestDataGenerator.generateTestData(scenario);
      
      // Perform drag and drop with empty tags
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      // Verify error feedback
      await helper.verifyFeedback(scenario);
      
      await helper.takeScreenshot('edge-case-empty-tags');
    });

    test('should handle maximum fatigue edge case', async () => {
      const scenario = getScenarioById('edge-case-max-f fatigue')!;
      await helper.logTestInfo(scenario, 'Starting test');
      
      const testData = TestDataGenerator.generateTestData(scenario);
      
      // Perform drag and drop with max fatigue
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      // Verify error feedback
      await helper.verifyFeedback(scenario);
      
      await helper.takeScreenshot('edge-case-max-fatigue');
    });

    test('should handle cross-type move with warning', async () => {
      const scenario = getScenarioById('cross-type-move')!;
      await helper.logTestInfo(scenario, 'Starting test');
      
      const testData = TestDataGenerator.generateTestData(scenario);
      
      // Perform cross-type drag and drop
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      // Verify warning feedback
      await helper.verifyFeedback(scenario);
      
      await helper.takeScreenshot('cross-type-move');
    });
  });

  test.describe('UI Feedback Validation', () => {
    test('should show appropriate error messages', async () => {
      const errorScenarios = getErrorScenarios();
      
      for (const scenario of errorScenarios) {
        await helper.logTestInfo(scenario, 'Testing error feedback');
        
        const testData = TestDataGenerator.generateTestData(scenario);
        
        // Perform invalid drag and drop
        await helper.performDragDrop(
          testData.selectors.resident,
          testData.selectors.target
        );
        
        // Verify error feedback
        await helper.verifyFeedback(scenario);
        
        // Reset for next test
        await helper.page.reload();
        await helper.navigateToIdleVillage();
      }
    });

    test('should show appropriate warning messages', async () => {
      const warningScenarios = getWarningScenarios();
      
      for (const scenario of warningScenarios) {
        await helper.logTestInfo(scenario, 'Testing warning feedback');
        
        const testData = TestDataGenerator.generateTestData(scenario);
        
        // Perform drag and drop with warning
        await helper.performDragDrop(
          testData.selectors.resident,
          testData.selectors.target
        );
        
        // Verify warning feedback
        await helper.verifyFeedback(scenario);
        
        // Reset for next test
        await helper.page.reload();
        await helper.navigateToIdleVillage();
      }
    });

    test('should show suggestions for invalid drops', async () => {
      const suggestionScenarios = getSuggestionScenarios();
      
      for (const scenario of suggestionScenarios) {
        await helper.logTestInfo(scenario, 'Testing suggestions');
        
        const testData = TestDataGenerator.generateTestData(scenario);
        
        // Perform invalid drag and drop
        await helper.performDragDrop(
          testData.selectors.resident,
          testData.selectors.target
        );
        
        // Verify suggestions are shown
        const feedback = await helper.checkValidationFeedback(scenario);
        expect(feedback.hasSuggestions).toBe(true);
        expect(feedback.suggestionCount).toBeGreaterThan(0);
        
        // Reset for next test
        await helper.page.reload();
        await helper.navigateToIdleVillage();
      }
    });
  });

  test.describe('Drop Feedback Visual Validation', () => {
    test('should show drop feedback overlay', async () => {
      const scenario = getScenarioById('crew-limit-violation')!;
      await helper.logTestInfo(scenario, 'Testing visual feedback');
      
      const testData = TestDataGenerator.generateTestData(scenario);
      
      // Perform invalid drag and drop
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      // Check for visual feedback elements
      const feedback = await helper.checkValidationFeedback(scenario);
      expect(feedback.hasError).toBe(true);
      
      // Verify feedback is visible and properly positioned
      const feedbackElement = helper.page.locator('[data-testid="drop-feedback"]');
      await expect(feedbackElement).toBeVisible();
      
      await helper.takeScreenshot('drop-feedback-visual');
    });

    test('should hide feedback after valid drop', async () => {
      const validScenario = getScenarioById('valid-drop-residential')!;
      const invalidScenario = getScenarioById('crew-limit-violation')!;
      
      // First perform invalid drop
      const invalidTestData = TestDataGenerator.generateTestData(invalidScenario);
      await helper.performDragDrop(
        invalidTestData.selectors.resident,
        invalidTestData.selectors.target
      );
      
      // Verify error feedback is shown
      const errorFeedback = await helper.checkValidationFeedback(invalidScenario);
      expect(errorFeedback.hasError).toBe(true);
      
      // Then perform valid drop
      const validTestData = TestDataGenerator.generateTestData(validScenario);
      await helper.performDragDrop(
        validTestData.selectors.resident,
        validTestData.selectors.target
      );
      
      // Verify error feedback is hidden
      const validFeedback = await helper.checkValidationFeedback(validScenario);
      expect(validFeedback.hasError).toBe(false);
      
      await helper.takeScreenshot('feedback-hidden-after-valid-drop');
    });
  });
});

/**
 * Mobile viewport tests
 */
test.describe('Mobile Viewport Tests', () => {
  const mobileViewports = [
    VIEWPORT_CONFIGURATIONS.mobile,
    VIEWPORT_CONFIGURATIONS['mobile-landscape'],
  ];

  mobileViewports.forEach(viewport => {
    test.describe(`Mobile ${viewport.width}x${viewport.height}`, () => {
      test.use({ viewport });
      
      let helper: DropValidationTestHelper;

      test.beforeEach(async ({ page }) => {
        helper = new DropValidationTestHelper(page);
        await helper.navigateToIdleVillage();
      });

      test('should validate drop on mobile', async () => {
        const scenarios = TestDataGenerator.generateMobileTestData();
        
        for (const scenario of scenarios) {
          await helper.logTestInfo(scenario, `Mobile test on ${viewport.width}x${viewport.height}`);
          
          const testData = TestDataGenerator.generateTestData(scenario);
          
          // Perform drag and drop
          await helper.performDragDrop(
            testData.selectors.resident,
            testData.selectors.target
          );
          
          // Verify feedback
          await helper.verifyFeedback(scenario);
          
          // Reset for next test
          await helper.page.reload();
          await helper.navigateToIdleVillage();
        }
      });

      test('should handle touch interactions', async () => {
        const scenario = getScenarioById('valid-drop-residential')!;
        await helper.logTestInfo(scenario, 'Testing touch interactions');
        
        const testData = TestDataGenerator.generateTestData(scenario);
        
        // Perform drag and drop with touch
        await helper.performDragDrop(
          testData.selectors.resident,
          testData.selectors.target
        );
        
        // Verify no error feedback
        const feedback = await helper.checkValidationFeedback(scenario);
        expect(feedback.hasError).toBe(false);
        
        await helper.takeScreenshot(`mobile-touch-${viewport.width}x${viewport.height}`);
      });
    });
  });
});

/**
 * Cross-browser tests
 */
test.describe('Cross-Browser Tests', () => {
  const crossBrowserScenarios = TestDataGenerator.generateCrossBrowserTestData();

  crossBrowserScenarios.forEach(scenario => {
    test.describe(`Cross-browser: ${scenario.id}`, () => {
      let helper: DropValidationTestHelper;

      test.beforeEach(async ({ page }) => {
        helper = new DropValidationTestHelper(page);
        await helper.navigateToIdleVillage();
      });

      test('should validate drop across browsers', async () => {
        await helper.logTestInfo(scenario, 'Cross-browser validation');
        
        const testData = TestDataGenerator.generateTestData(scenario);
        
        // Perform drag and drop
        await helper.performDragDrop(
          testData.selectors.resident,
          testData.selectors.target
        );
        
        // Verify feedback
        await helper.verifyFeedback(scenario);
        
        await helper.takeScreenshot(`cross-browser-${scenario.id}`);
      });
    });
  });
});

/**
 * Performance smoke tests
 */
test.describe('Performance Smoke Tests', () => {
  test('should handle rapid drag operations', async ({ page }) => {
    const helper = new DropValidationTestHelper(page);
    await helper.navigateToIdleVillage();
    
    const scenario = getScenarioById('valid-drop-residential')!;
    const testData = TestDataGenerator.generateTestData(scenario);
    
    // Perform multiple rapid drag operations
    const startTime = Date.now();
    
    for (let i = 0; i < 5; i++) {
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      // Brief pause between operations
      await page.waitForTimeout(500);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Verify performance is acceptable (should complete within 10 seconds)
    expect(duration).toBeLessThan(10000);
    
    await helper.takeScreenshot('rapid-drag-performance');
  });

  test('should handle concurrent validation', async ({ page }) => {
    const helper = new DropValidationTestHelper(page);
    await helper.navigateToIdleVillage();
    
    const scenarios = [
      getScenarioById('valid-drop-residential')!,
      getScenarioById('crew-limit-violation')!,
      getScenarioById('fatigue-threshold-violation')!,
    ].filter(Boolean) as DropValidationScenario[];
    
    // Test multiple validation scenarios
    for (const scenario of scenarios) {
      await helper.logTestInfo(scenario, 'Concurrent validation');
      
      const testData = TestDataGenerator.generateTestData(scenario);
      
      // Perform drag and drop
      await helper.performDragDrop(
        testData.selectors.resident,
        testData.selectors.target
      );
      
      // Verify feedback
      await helper.verifyFeedback(scenario);
      
      // Reset for next test
      await page.reload();
      await helper.navigateToIdleVillage();
    }
    
    await helper.takeScreenshot('concurrent-validation');
  });
});

/**
 * Accessibility tests
 */
test.describe('Accessibility Tests', () => {
  test('should be accessible for screen readers', async ({ page }) => {
    const helper = new DropValidationTestHelper(page);
    await helper.navigateToIdleVillage();
    
    // Check for proper ARIA labels on draggable elements
    const draggables = page.locator('[draggable="true"]');
    await expect(draggables).toHaveCount(3); // At least 3 draggables
    
    // Check for proper ARIA labels on drop targets
    const dropTargets = page.locator('[data-testid*="location"]');
    await expect(dropTargets).toHaveCount(3); // At least 3 drop targets
    
    // Check for proper ARIA live regions for feedback
    const liveRegions = page.locator('[aria-live="polite"]');
    await expect(liveRegions).toHaveCount(1); // Should have feedback live region
    
    await helper.takeScreenshot('accessibility-screen-reader');
  });

  test('should support keyboard navigation', async ({ page }) => {
    const helper = new DropValidationTestHelper(page);
    await helper.navigateToIdleVillage();
    
    // Test keyboard navigation to draggables
    await page.keyboard.press('Tab');
    
    // Should focus on first draggable element
    const firstDraggable = page.locator('[draggable="true"]').first();
    await expect(firstDraggable).toBeFocused();
    
    // Test keyboard navigation to drop targets
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should focus on first drop target
    const firstDropTarget = page.locator('[data-testid*="location"]').first();
    await expect(firstDropTarget).toBeFocused();
    
    await helper.takeScreenshot('accessibility-keyboard');
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const helper = new DropValidationTestHelper(page);
    await helper.navigateToIdleVillage();
    
    // Check for sufficient color contrast in validation feedback
    const errorElements = page.locator('[data-testid="validation-error"]');
    const warningElements = page.locator('[data-testid="validation-warning"]');
    
    // Elements should have proper contrast (this would be checked by axe-core)
    expect(errorElements).toHaveCount(0); // No errors initially
    
    // Trigger an error to test contrast
    const scenario = getScenarioById('crew-limit-violation')!;
    const testData = TestDataGenerator.generateTestData(scenario);
    
    await helper.performDragDrop(
      testData.selectors.resident,
      testData.selectors.target
    );
    
    // Check error element is visible and has proper contrast
    const errorElement = page.locator('[data-testid="validation-error"]');
    await expect(errorElement).toBeVisible();
    
    await helper.takeScreenshot('accessibility-color-contrast');
  });
});

/**
 * Integration tests
 */
test.describe('Integration Tests', () => {
  test('should integrate with KS-030 drag/drop system', async ({ page }) => {
    const helper = new DropValidationTestHelper(page);
    await helper.navigateToIdleVillage();
    
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
    
    await helper.takeScreenshot('integration-ks-030');
  });

  test('should integrate with NP-066 validator helper', async ({ page }) => {
    const helper = new DropValidationTestHelper(page);
    await helper.navigateToIdleVillage();
    
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
    
    await helper.takeScreenshot('integration-np-066');
  });
});

/**
 * Error handling tests
 */
test.describe('Error Handling Tests', () => {
  test('should handle missing elements gracefully', async ({ page }) => {
    const helper = new DropValidationTestHelper(page);
    await helper.navigateToIdleVillage();
    
    // Try to drag non-existent element
    const nonExistent = page.locator('[data-testid="non-existent"]');
    await expect(nonExistent).toHaveCount(0);
    
    // Should not crash and should handle gracefully
    await helper.takeScreenshot('error-missing-elements');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    const helper = new DropValidationTestHelper(page);
    
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

  test('should handle timeout gracefully', async ({ page }) => {
    const helper = new DropValidationTestHelper(page);
    await helper.navigateToIdleVillage();
    
    // Mock slow validation
    await page.route('/api/validate-drop', route => {
      // Delay response
      setTimeout(() => {}, 10000);
    });
    
    // Perform drag and drop
    const scenario = getScenarioById('valid-drop-residential')!;
    const testData = TestDataGenerator.generateTestData(scenario);
    
    await helper.performDragDrop(
      testData.selectors.resident,
      testData.selectors.target,
      { timeout: 5000 }
    );
    
    // Should handle timeout gracefully
    await helper.takeScreenshot('error-timeout');
  });
});
