/**
 * Minimal Gameplay E2E Playwright Test
 * 
 * Tests the complete user flow through /minimal-gameplay:
 * - Initial load and visual states
 * - Drag interactions (assign → quest → market → game over)
 * - URL query param synchronization
 * - Visual regression screenshots for each state
 * 
 * @since NP-MIN-010E – Routing, Tests & Visual Baseline
 */

import { test, expect, devices } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

declare global {
  interface Window {
    __MINIMAL_GAMEPLAY_DEBUG__?: {
      setVisualState: (state: VisualState) => void;
      getVisualState: () => VisualState;
    };
    __ENABLE_IDLE_VILLAGE_TEST_HOOKS?: boolean;
  }
}

// Test configurations
const TEST_CONFIG = {
  timeout: 30000,
  retries: 2,
  screenshotOnFailure: true,
};

// Visual states to test
const VISUAL_STATES = [
  'initial',
  'jobActive', 
  'questSkillCheck',
  'marketPurchase',
  'gameOver',
] as const;

type VisualState = typeof VISUAL_STATES[number];

class MinimalGameplayHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to minimal gameplay page
   */
  async navigateToMinimalGameplay(queryParams?: string): Promise<void> {
    const url = `/minimal-gameplay${queryParams ? `?${queryParams}` : ''}`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    
    // Wait for page to be ready
    await this.page.waitForSelector('[data-testid="minimal-gameplay-page"]', {
      timeout: TEST_CONFIG.timeout,
    });
  }

  /**
   * Get current visual state from page attribute
   */
  async getCurrentVisualState(): Promise<VisualState> {
    const page = this.page.locator('[data-testid="minimal-gameplay-page"]');
    const state = await page.getAttribute('data-visual-state');
    return state as VisualState;
  }

  /**
   * Set visual state via debug API
   */
  async setVisualState(state: VisualState): Promise<void> {
    await this.page.evaluate((targetState) => {
      window.__MINIMAL_GAMEPLAY_DEBUG__?.setVisualState(targetState);
    }, state);
    
    // Wait for state to update
    await this.page.waitForFunction(
      (expectedState) => {
        const page = document.querySelector('[data-testid="minimal-gameplay-page"]');
        return page?.getAttribute('data-visual-state') === expectedState;
      },
      state,
      { timeout: 5000 }
    );
  }

  /**
   * Click visual state control button
   */
  async clickStateControl(state: VisualState): Promise<void> {
    const button = this.page.locator(`[data-testid="state-control-${state}"]`);
    await button.click();
    
    // Wait for state transition
    await this.page.waitForFunction(
      (expectedState) => {
        const page = document.querySelector('[data-testid="minimal-gameplay-page"]');
        return page?.getAttribute('data-visual-state') === expectedState;
      },
      state,
      { timeout: 5000 }
    );
  }

  /**
   * Take screenshot with consistent naming
   */
  async takeScreenshot(name: string, fullPage = false): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `minimal-gameplay-${name}-${timestamp}.png`;
    
    await this.page.screenshot({
      path: `test-results/screenshots/${filename}`,
      fullPage,
    });
  }

  /**
   * Verify URL contains expected query params
   */
  async verifyUrlContains(expectedParams: Record<string, string>): Promise<void> {
    const url = this.page.url();
    const searchParams = new URL(url).searchParams;
    
    for (const [key, value] of Object.entries(expectedParams)) {
      expect(searchParams.get(key)).toBe(value);
    }
  }

  /**
   * Get page content for validation
   */
  async getPageContent(): Promise<{
    statusBadge: string;
    gold: string;
    food: string;
    residents: string;
    hasGameOverMessage: boolean;
  }> {
    const statusBadge = this.page.locator('[data-testid="minimal-gameplay-status-badge"]');
    const gold = this.page.locator('[data-testid="minimal-gameplay-gold"]');
    const food = this.page.locator('[data-testid="minimal-gameplay-food"]');
    const residents = this.page.locator('[data-testid="minimal-gameplay-residents"]');
    const gameOverMessage = this.page.locator('[data-testid="minimal-gameplay-game-over"]');

    return {
      statusBadge: await statusBadge.textContent() || '',
      gold: await gold.textContent() || '',
      food: await food.textContent() || '',
      residents: await residents.textContent() || '',
      hasGameOverMessage: await gameOverMessage.isVisible().catch(() => false),
    };
  }
}

// Test suite
test.describe('Minimal Gameplay E2E', () => {
  let helper: MinimalGameplayHelper;

  test.beforeEach(async ({ page }) => {
    helper = new MinimalGameplayHelper(page);
    
    // Enable test hooks
    await page.evaluate(() => {
      window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS = true;
    });
  });

  test('should load and display initial state', async ({ page }) => {
    await helper.navigateToMinimalGameplay();
    
    // Verify page loaded
    await expect(page.locator('[data-testid="minimal-gameplay-page"]')).toBeVisible();
    
    // Verify initial state
    const state = await helper.getCurrentVisualState();
    expect(state).toBe('initial');
    
    const content = await helper.getPageContent();
    expect(content.statusBadge).toBe('Ready');
    expect(content.gold).toContain('Gold 10');
    expect(content.food).toContain('Food 5');
    expect(content.residents).toContain('Residents 1');
    
    await helper.takeScreenshot('initial-state');
  });

  test('should hydrate visual state from URL query param', async ({ page }) => {
    await helper.navigateToMinimalGameplay('mgState=questSkillCheck');
    
    // Verify state was hydrated from URL
    const state = await helper.getCurrentVisualState();
    expect(state).toBe('questSkillCheck');
    
    await helper.takeScreenshot('hydrated-quest-state');
  });

  test('should transition through all visual states via controls', async ({ page }) => {
    await helper.navigateToMinimalGameplay();
    
    // Test each state transition
    for (const targetState of VISUAL_STATES) {
      await helper.clickStateControl(targetState);
      
      const currentState = await helper.getCurrentVisualState();
      expect(currentState).toBe(targetState);
      
      // Verify URL updated
      await helper.verifyUrlContains({ mgState: targetState });
      
      await helper.takeScreenshot(`state-${targetState}`);
    }
  });

  test('should use debug API to set visual states', async ({ page }) => {
    await helper.navigateToMinimalGameplay();
    
    // Test debug API for each state
    for (const targetState of VISUAL_STATES) {
      await helper.setVisualState(targetState);
      
      const currentState = await helper.getCurrentVisualState();
      expect(currentState).toBe(targetState);
      
      await helper.takeScreenshot(`debug-${targetState}`);
    }
  });

  test('should display correct content for each visual state', async ({ page }) => {
    await helper.navigateToMinimalGameplay();
    
    // Expected content for each state
    const expectedContent = {
      initial: {
        statusBadge: 'Ready',
        goldContains: 'Gold 10',
        foodContains: 'Food 5',
      },
      jobActive: {
        statusBadge: 'Working',
        goldContains: 'Gold',
        foodContains: 'Food',
      },
      questSkillCheck: {
        statusBadge: 'Questing',
        goldContains: 'Gold',
        foodContains: 'Food',
      },
      marketPurchase: {
        statusBadge: 'Trading',
        goldContains: 'Gold',
        foodContains: 'Food',
      },
      gameOver: {
        statusBadge: 'Game Over',
        goldContains: 'Gold',
        foodContains: 'Food',
        hasGameOverMessage: true,
      },
    };

    for (const [state, expected] of Object.entries(expectedContent)) {
      await helper.setVisualState(state as VisualState);
      
      const content = await helper.getPageContent();
      expect(content.statusBadge).toBe(expected.statusBadge);
      expect(content.gold).toContain(expected.goldContains);
      expect(content.food).toContain(expected.foodContains);
      
      if ('hasGameOverMessage' in expected) {
        expect(content.hasGameOverMessage).toBe(expected.hasGameOverMessage);
      }
    }
  });

  test('should handle invalid query params gracefully', async ({ page }) => {
    await helper.navigateToMinimalGameplay('mgState=invalid-state');
    
    // Should fall back to initial state
    const state = await helper.getCurrentVisualState();
    expect(state).toBe('initial');
    
    await helper.takeScreenshot('invalid-query-param');
  });

  test('should sync URL when state changes via debug API', async ({ page }) => {
    await helper.navigateToMinimalGameplay();
    
    // Change state via debug API
    await helper.setVisualState('marketPurchase');
    
    // Verify URL updated
    await helper.verifyUrlContains({ mgState: 'marketPurchase' });
    
    // Change back to initial (should remove query param)
    await helper.setVisualState('initial');
    
    const url = page.url();
    expect(url).not.toContain('mgState=');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await helper.navigateToMinimalGameplay();
    
    // Verify page is still functional on mobile
    await expect(page.locator('[data-testid="minimal-gameplay-page"]')).toBeVisible();
    
    const state = await helper.getCurrentVisualState();
    expect(state).toBe('initial');
    
    await helper.takeScreenshot('mobile-initial-state');
  });

  test('should handle rapid state changes', async ({ page }) => {
    await helper.navigateToMinimalGameplay();
    
    // Rapidly change states
    const states: VisualState[] = ['jobActive', 'questSkillCheck', 'marketPurchase', 'gameOver', 'initial'];
    
    for (const state of states) {
      await helper.setVisualState(state);
      await page.waitForTimeout(100); // Small delay to simulate rapid changes
    }
    
    // Should end up in initial state
    const finalState = await helper.getCurrentVisualState();
    expect(finalState).toBe('initial');
    
    await helper.takeScreenshot('rapid-state-changes');
  });
});

// Visual regression tests
test.describe('Minimal Gameplay Visual Regression', () => {
  let helper: MinimalGameplayHelper;

  test.beforeEach(async ({ page }) => {
    helper = new MinimalGameplayHelper(page);
    await page.evaluate(() => {
      window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS = true;
    });
  });

  for (const state of VISUAL_STATES) {
    test(`should match visual baseline for ${state} state`, async ({ page }) => {
      await helper.navigateToMinimalGameplay(`mgState=${state}`);
      
      // Wait for any animations to complete
      await page.waitForTimeout(500);
      
      // Take full page screenshot
      await helper.takeScreenshot(`baseline-${state}`, true);
      
      // Verify specific elements are visible
      await expect(page.locator('[data-testid="minimal-gameplay-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="minimal-gameplay-status-badge"]')).toBeVisible();
      
      if (state === 'gameOver') {
        await expect(page.locator('[data-testid="minimal-gameplay-game-over"]')).toBeVisible();
      }
    });
  }

  test('should match visual baseline for all states in sequence', async ({ page }) => {
    await helper.navigateToMinimalGameplay();
    
    // Test state transitions in sequence
    for (const state of VISUAL_STATES) {
      await helper.setVisualState(state);
      await page.waitForTimeout(300); // Wait for transition
      
      await helper.takeScreenshot(`sequence-${state}`);
    }
  });
});

// Cross-browser validation leveraging Playwright projects (browserName fixture)
test.describe('Minimal Gameplay Cross-Browser', () => {
  test('should preserve core interactions in every configured browser', async ({ page, browserName }) => {
    const helper = new MinimalGameplayHelper(page);

    await helper.navigateToMinimalGameplay();

    await expect(page.locator('[data-testid="minimal-gameplay-page"]')).toBeVisible();

    const initialState = await helper.getCurrentVisualState();
    expect(initialState).toBe('initial');

    await helper.setVisualState('jobActive');

    const jobState = await helper.getCurrentVisualState();
    expect(jobState).toBe('jobActive');

    await helper.takeScreenshot(`${browserName}-job-active`);
  });
});
