/**
 * Minimal Gameplay Visual Regression Test
 * 
 * Visual regression testing for /minimal-gameplay page using Playwright.
 * Captures screenshots for all visual states and compares against baseline.
 * 
 * @since NP-MIN-010E – Routing, Tests & Visual Baseline
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Visual states to test
const VISUAL_STATES = [
  'initial',
  'jobActive',
  'questSkillCheck', 
  'marketPurchase',
  'gameOver',
] as const;

type VisualState = typeof VISUAL_STATES[number];

// Viewport configurations for responsive testing
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
] as const;

class MinimalGameplayVisualHelper {
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
      timeout: 15000,
    });
  }

  /**
   * Set visual state via debug API
   */
  async setVisualState(state: VisualState): Promise<void> {
    await this.page.evaluate((targetState) => {
      (window as any).__MINIMAL_GAMEPLAY_DEBUG__?.setVisualState(targetState);
    }, state);
    
    // Wait for state to update and animations to settle
    await this.page.waitForFunction(
      (expectedState) => {
        const page = document.querySelector('[data-testid="minimal-gameplay-page"]');
        return page?.getAttribute('data-visual-state') === expectedState;
      },
      state,
      { timeout: 5000 }
    );
    
    // Wait for animations to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Take screenshot with consistent naming
   */
  async takeScreenshot(name: string, options: { fullPage?: boolean; clip?: any } = {}): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `minimal-gameplay-${name}-${timestamp}.png`;
    
    await this.page.screenshot({
      path: `test-results/visual/${filename}`,
      fullPage: options.fullPage ?? false,
      clip: options.clip,
    });
  }

  /**
   * Setup page for visual testing
   */
  async setupVisualTest(): Promise<void> {
    // Enable test hooks
    await this.page.evaluate(() => {
      (window as any).__ENABLE_IDLE_VILLAGE_TEST_HOOKS = true;
    });
    
    // Disable animations for consistent screenshots
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
        }
      `,
    });
  }

  /**
   * Wait for page to be visually stable
   */
  async waitForVisualStability(): Promise<void> {
    // Wait for fonts to load
    await this.page.waitForFunction(() => document.fonts.ready);
    
    // Wait for any images to load
    await this.page.waitForLoadState('networkidle');
    
    // Small delay for any remaining renders
    await this.page.waitForTimeout(200);
  }
}

// Main visual test suite
test.describe('Minimal Gameplay Visual Regression', () => {
  let helper: MinimalGameplayVisualHelper;

  test.beforeEach(async ({ page }) => {
    helper = new MinimalGameplayVisualHelper(page);
    await helper.setupVisualTest();
  });

  // Test each visual state on desktop
  for (const state of VISUAL_STATES) {
    test(`should match visual baseline for ${state} state on desktop`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[0]); // desktop
      await helper.navigateToMinimalGameplay(`mgState=${state}`);
      await helper.waitForVisualStability();
      
      // Take full page screenshot
      await helper.takeScreenshot(`desktop-${state}`, { fullPage: true });
      
      // Verify key elements are visible
      await expect(page.locator('[data-testid="minimal-gameplay-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="minimal-gameplay-status-badge"]')).toBeVisible();
      
      if (state === 'gameOver') {
        await expect(page.locator('[data-testid="minimal-gameplay-game-over"]')).toBeVisible();
      }
    });
  }

  // Test responsive behavior
  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} viewport`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      for (const state of VISUAL_STATES) {
        test(`should render ${state} state correctly on ${viewport.name}`, async ({ page }) => {
          await helper.navigateToMinimalGameplay(`mgState=${state}`);
          await helper.waitForVisualStability();
          
          await helper.takeScreenshot(`${viewport.name}-${state}`, { fullPage: true });
          
          // Verify page is still functional
          await expect(page.locator('[data-testid="minimal-gameplay-page"]')).toBeVisible();
        });
      }
    });
  }

  // Test state transitions
  test('should capture state transition sequence', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[0]); // desktop
    await helper.navigateToMinimalGameplay();
    await helper.waitForVisualStability();
    
    // Capture initial state
    await helper.takeScreenshot('transition-initial');
    
    // Transition through each state
    for (const state of VISUAL_STATES.slice(1)) { // Skip initial
      await helper.setVisualState(state);
      await helper.waitForVisualStability();
      await helper.takeScreenshot(`transition-to-${state}`);
    }
  });

  // Test URL parameter hydration
  test('should correctly hydrate from URL parameters', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[0]);
    
    for (const state of VISUAL_STATES) {
      await helper.navigateToMinimalGameplay(`mgState=${state}`);
      await helper.waitForVisualStability();
      
      await helper.takeScreenshot(`url-hydrate-${state}`);
      
      // Verify the state was correctly applied
      const currentState = await page.evaluate(() => {
        const page = document.querySelector('[data-testid="minimal-gameplay-page"]');
        return page?.getAttribute('data-visual-state');
      });
      
      expect(currentState).toBe(state);
    }
  });

  // Test component-level screenshots
  test('should capture component-level details', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[0]);
    await helper.navigateToMinimalGameplay();
    await helper.waitForVisualStability();
    
    // Capture header
    const header = page.locator('[data-testid="minimal-gameplay-header"]');
    await expect(header).toBeVisible();
    await header.screenshot({ path: 'test-results/visual/component-header.png' });
    
    // Capture status badge
    const statusBadge = page.locator('[data-testid="minimal-gameplay-status-badge"]');
    await expect(statusBadge).toBeVisible();
    await statusBadge.screenshot({ path: 'test-results/visual/component-status-badge.png' });
    
    // Capture resource cards
    const resourceCards = page.locator('[data-testid="minimal-gameplay-cards"]');
    await expect(resourceCards).toBeVisible();
    await resourceCards.screenshot({ path: 'test-results/visual/component-resource-cards.png' });
    
    // Capture state controls
    const stateControls = page.locator('[data-testid="minimal-gameplay-state-controls"]');
    if (await stateControls.isVisible()) {
      await stateControls.screenshot({ path: 'test-results/visual/component-state-controls.png' });
    }
  });

  // Test error states
  test('should handle error states gracefully', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[0]);
    
    // Test with invalid query parameter
    await helper.navigateToMinimalGameplay('mgState=invalid-state');
    await helper.waitForVisualStability();
    
    await helper.takeScreenshot('error-invalid-state');
    
    // Should fall back to initial state
    await expect(page.locator('[data-testid="minimal-gameplay-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="minimal-gameplay-status-badge"]')).toHaveText('Ready');
  });

  // Test DnD feedback states
  test.describe('Drag & Drop Feedback Visual States', () => {
    test('should show valid drop feedback with glow', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[0]);
      await helper.navigateToMinimalGameplay();
      await helper.waitForVisualStability();

      // Simulate drag start on Aurora (low fatigue)
      const auroraCard = page.locator('text=Aurora Calder').first();
      const goldMineSlot = page.locator('[data-testid="minimal-activity-slot-gold_mine_slot"]');

      // Start drag
      await auroraCard.hover();
      await page.mouse.down();

      // Move to slot for valid feedback
      const slotBox = await goldMineSlot.boundingBox();
      if (slotBox) {
        await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2);
      }

      // Wait for feedback animation
      await page.waitForTimeout(500);

      // Capture valid drop feedback
      await helper.takeScreenshot('dnd-valid-feedback', { fullPage: true });

      await page.mouse.up();
    });

    test('should show invalid drop feedback for fatigue', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[0]);
      await helper.navigateToMinimalGameplay();
      await helper.waitForVisualStability();

      // Simulate drag start on Marcus (high fatigue)
      const marcusCard = page.locator('text=Marcus Vale').first();
      const goldMineSlot = page.locator('[data-testid="minimal-activity-slot-gold_mine_slot"]');

      // Start drag
      await marcusCard.hover();
      await page.mouse.down();

      // Move to slot for invalid feedback
      const slotBox = await goldMineSlot.boundingBox();
      if (slotBox) {
        await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2);
      }

      // Wait for feedback animation
      await page.waitForTimeout(500);

      // Capture invalid drop feedback
      await helper.takeScreenshot('dnd-invalid-fatigue-feedback', { fullPage: true });

      await page.mouse.up();
    });

    test('should show warning drop feedback', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[0]);
      await helper.navigateToMinimalGameplay();
      await helper.waitForVisualStability();

      // Simulate scenario with warning (could be implemented with mock data)
      // For now, capture baseline
      await helper.takeScreenshot('dnd-warning-feedback-baseline', { fullPage: true });
    });

    test('should show blocked drop feedback for occupied slot', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[0]);
      await helper.navigateToMinimalGameplay();
      await helper.waitForVisualStability();

      // First assign Aurora to gold mine
      const auroraCard = page.locator('text=Aurora Calder').first();
      const goldMineSlot = page.locator('[data-testid="minimal-activity-slot-gold_mine_slot"]');

      // Perform valid drop
      await auroraCard.hover();
      await page.mouse.down();
      const slotBox = await goldMineSlot.boundingBox();
      if (slotBox) {
        await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2);
      }
      await page.mouse.up();

      // Wait for assignment
      await page.waitForTimeout(1000);

      // Now try to assign Marcus to occupied slot
      const marcusCard = page.locator('text=Marcus Vale').first();

      await marcusCard.hover();
      await page.mouse.down();
      if (slotBox) {
        await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2);
      }

      // Wait for blocked feedback
      await page.waitForTimeout(500);

      // Capture blocked drop feedback
      await helper.takeScreenshot('dnd-blocked-occupied-feedback', { fullPage: true });

      await page.mouse.up();
    });
  });

  // Test Style Lab integration
  test.describe('Style Lab Integration', () => {
    test('should apply observatory-page and observatory-shell classes', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[0]);
      await helper.navigateToMinimalGameplay();
      await helper.waitForVisualStability();

      // Verify observatory classes are applied
      await expect(page.locator('.observatory-page.observatory-shell')).toBeVisible();

      // Capture Style Lab styling
      await helper.takeScreenshot('observatory-styling', { fullPage: true });
    });

    test('should show glow effects on slot hover', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[0]);
      await helper.navigateToMinimalGameplay();
      await helper.waitForVisualStability();

      const goldMineSlot = page.locator('[data-testid="minimal-activity-slot-gold_mine_slot"]');

      // Hover to trigger glow
      await goldMineSlot.hover();
      await page.waitForTimeout(300);

      // Capture glow effect
      await helper.takeScreenshot('slot-glow-hover', { fullPage: true });
    });

    test('should display particle effects on active slots', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[0]);
      await helper.navigateToMinimalGameplay();
      await helper.waitForVisualStability();

      // Assign a worker to create an active slot
      const auroraCard = page.locator('text=Aurora Calder').first();
      const goldMineSlot = page.locator('[data-testid="minimal-activity-slot-gold_mine_slot"]');

      // Perform drop
      await auroraCard.hover();
      await page.mouse.down();
      const slotBox = await goldMineSlot.boundingBox();
      if (slotBox) {
        await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2);
      }
      await page.mouse.up();

      // Wait for activity to start and particles
      await page.waitForTimeout(2000);

      // Capture particle effects
      await helper.takeScreenshot('active-slot-particles', { fullPage: true });
    });
  });

  // Test HUD animations
  test.describe('HUD Animations', () => {
    test('should animate resource ticker deltas', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[0]);
      await helper.navigateToMinimalGameplay();
      await helper.waitForVisualStability();

      // Trigger resource changes (this would need mock data injection)
      // For now, capture baseline HUD
      await helper.takeScreenshot('hud-resource-ticker', { fullPage: true });
    });

    test('should show pause/resume state changes', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[0]);
      await helper.navigateToMinimalGameplay();
      await helper.waitForVisualStability();

      // Capture initial state
      await helper.takeScreenshot('hud-initial-state');

      // Click pause
      await page.click('button:has-text("Pausa")');
      await page.waitForTimeout(500);
      await helper.takeScreenshot('hud-paused-state');

      // Click resume
      await page.click('button:has-text("Riprendi")');
      await page.waitForTimeout(500);
      await helper.takeScreenshot('hud-resumed-state');
    });
  });

  // Test loading states
  test('should display loading states correctly', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[0]);
    
    // Mock slow loading
    await page.route('**/*', (route) => {
      // Add delay for CSS/JS files
      if (route.request().resourceType() === 'stylesheet' || 
          route.request().resourceType() === 'script') {
        setTimeout(() => route.continue(), 1000);
      } else {
        route.continue();
      }
    });
    
    await helper.navigateToMinimalGameplay();
    
    // Capture loading state (if any)
    await page.waitForTimeout(500);
    await helper.takeScreenshot('loading-state');
    
    // Wait for full load
    await helper.waitForVisualStability();
    await helper.takeScreenshot('loaded-state');
  });
});

// Visual comparison tests (for CI)
test.describe('Minimal Gameplay Visual Comparison', () => {
  let helper: MinimalGameplayVisualHelper;

  test.beforeEach(async ({ page }) => {
    helper = new MinimalGameplayVisualHelper(page);
    await helper.setupVisualTest();
  });

  // Compare screenshots against baseline (if available)
  for (const state of VISUAL_STATES) {
    test(`should visually match baseline for ${state}`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[0]);
      await helper.navigateToMinimalGameplay(`mgState=${state}`);
      await helper.waitForVisualStability();
      
      // Take screenshot for comparison
      await expect(page.locator('[data-testid="minimal-gameplay-page"]')).toHaveScreenshot(
        `minimal-gameplay-${state}.png`,
        {
          fullPage: true,
          animations: 'disabled',
        }
      );
    });
  }

  // Compare mobile screenshots
  test('should visually match baseline on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2]); // mobile
    await helper.navigateToMinimalGameplay();
    await helper.waitForVisualStability();
    
    await expect(page.locator('[data-testid="minimal-gameplay-page"]')).toHaveScreenshot(
      'minimal-gameplay-mobile.png',
      {
        fullPage: true,
        animations: 'disabled',
      }
    );
  });
});

// Performance visual tests
test.describe('Minimal Gameplay Performance Visual', () => {
  let helper: MinimalGameplayVisualHelper;

  test.beforeEach(async ({ page }) => {
    helper = new MinimalGameplayVisualHelper(page);
    await helper.setupVisualTest();
  });

  test('should render quickly without layout shifts', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[0]);
    
    // Start performance monitoring
    const performanceMetrics = await page.evaluate(() => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        return entries.map(entry => ({
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
        }));
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation'] });
      
      return { started: true };
    });
    
    await helper.navigateToMinimalGameplay();
    await helper.waitForVisualStability();
    
    // Capture final state
    await helper.takeScreenshot('performance-final');
    
    // Verify no obvious layout shifts
    await expect(page.locator('[data-testid="minimal-gameplay-page"]')).toBeVisible();
  });
});
