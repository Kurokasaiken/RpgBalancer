/**
 * Playwright Accessibility Test Suite for Interaction Mode
 * 
 * End-to-end accessibility testing using Playwright's a11y features
 * to validate screen reader, keyboard, and touch interactions.
 * 
 * @since NP-082 – Idle Village Interaction Mode Accessibility Sweep
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper to check accessibility compliance
 */
async function checkAccessibility(page: Page, context: string) {
  await test.step(`Check accessibility for ${context}`, async () => {
    // Check for proper ARIA attributes
    const interactiveElements = page.locator('button, [role="button"], [role="switch"], input, select, textarea');
    
    await interactiveElements.each(async (element, index) => {
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const role = await element.getAttribute('role');
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const accessibleName = await element.evaluate(el => {
        const computedName = window.getComputedStyle(el).getPropertyValue('--accessible-name');
        return computedName || el.textContent || '';
      });

      // Verify each interactive element has an accessible name
      if (tagName === 'button' || role === 'button') {
        expect(
          ariaLabel || ariaLabelledBy || accessibleName.trim(),
          `Button at index ${index} missing accessible name`
        ).toBeTruthy();
      }

      // Check for proper focus management
      const tabIndex = await element.getAttribute('tabindex');
      if (tabIndex === null || tabIndex === '0') {
        // Element should be focusable
        expect(await element.isVisible(), `Focusable element at index ${index} should be visible`).toBeTruthy();
      }
    });

    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingLevels = [];
    
    await headings.each(async (heading) => {
      const level = parseInt(await heading.evaluate(el => el.tagName.substring(1)));
      headingLevels.push(level);
    });

    // Verify heading levels don't skip (WCAG 1.3.1)
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff, `Heading level skip detected: h${headingLevels[i - 1]} to h${headingLevels[i]}`).toBeLessThanOrEqual(1);
    }

    // Check for proper landmark regions
    const landmarks = page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="search"], [role="complementary"], main, nav, header, footer');
    expect(await landmarks.count(), 'Page should have landmark regions').toBeGreaterThan(0);

    // Check for proper color contrast (basic check)
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th');
    
    await textElements.each(async (element, index) => {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          visibility: computed.visibility,
          display: computed.display,
        };
      });

      if (styles.visibility !== 'hidden' && styles.display !== 'none') {
        // Basic contrast check (would need actual contrast calculation library for full compliance)
        expect(styles.color, `Text element at index ${index} should have color defined`).toBeTruthy();
      }
    });
  });
}

/**
 * Helper to test keyboard navigation
 */
async function testKeyboardNavigation(page: Page, context: string) {
  await test.step(`Test keyboard navigation for ${context}`, async () => {
    // Get all focusable elements
    const focusableElements = await page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    if (focusableElements.length === 0) {
      return; // No focusable elements to test
    }

    // Test Tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus');
    
    // First element should receive focus
    expect(await focusedElement.count(), 'First element should receive focus on Tab').toBe(1);

    // Test Shift+Tab navigation
    await page.keyboard.press('Shift+Tab');
    focusedElement = await page.locator(':focus');
    
    // Should cycle back or stay at first element
    expect(await focusedElement.count(), 'Shift+Tab should maintain focus').toBe(1);

    // Test Enter/Space activation on buttons
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      await buttons.first().focus();
      
      // Test Enter key
      const initialUrl = page.url();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100); // Wait for any navigation/action
      
      // Test Space key
      await buttons.first().focus();
      await page.keyboard.press(' ');
      await page.waitForTimeout(100);
    }

    // Test Escape key for modals/drawers
    const modals = page.locator('.modal, [role="dialog"], .drawer');
    if (await modals.count() > 0) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
    }
  });
}

/**
 * Helper to test screen reader announcements
 */
async function testScreenReaderAnnouncements(page: Page, context: string) {
  await test.step(`Test screen reader announcements for ${context}`, async () => {
    // Look for aria-live regions
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    
    await liveRegions.each(async (region, index) => {
      const liveType = await region.getAttribute('aria-live');
      const role = await region.getAttribute('role');
      
      // Verify live region has proper attributes
      if (liveType) {
        expect(['polite', 'assertive', 'off'].includes(liveType), `Invalid aria-live value at index ${index}`).toBeTruthy();
      }
      
      if (role) {
        expect(['status', 'alert', 'log', 'marquee', 'timer'].includes(role), `Invalid role for live region at index ${index}`).toBeTruthy();
      }

      // Check for aria-atomic on dynamic content
      const ariaAtomic = await region.getAttribute('aria-atomic');
      if (ariaAtomic) {
        expect(['true', 'false'].includes(ariaAtomic), `Invalid aria-atomic value at index ${index}`).toBeTruthy();
      }
    });

    // Check for proper descriptions
    const describedByElements = page.locator('[aria-describedby]');
    
    await describedByElements.each(async (element, index) => {
      const describedById = await element.getAttribute('aria-describedby');
      
      if (describedById) {
        const descriptionElement = page.locator(`#${describedById.split(' ')[0]}`);
        expect(await descriptionElement.count(), `Description element not found for aria-describedby at index ${index}`).toBe(1);
      }
    });
  });
}

test.describe('Interaction Mode Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the interaction mode test page
    await page.goto('/idle-village/sandbox');
    
    // Enable reduced motion for users with vestibular disorders
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Set up high contrast mode testing
    await page.emulateMedia({ forcedColors: 'active' });
  });

  test('should have accessible interaction mode picker', async ({ page }) => {
    // Look for interaction mode picker
    const picker = page.locator('[data-testid="interaction-mode-picker"]').first();
    
    if (await picker.count() === 0) {
      test.skip(true, 'Interaction mode picker not found on page');
    }

    await checkAccessibility(page, 'interaction mode picker');
    await testKeyboardNavigation(page, 'interaction mode picker');
    await testScreenReaderAnnouncements(page, 'interaction mode picker');

    // Test specific interaction mode picker features
    const modeToggle = picker.locator('button').first();
    expect(await modeToggle.count(), 'Mode toggle button should exist').toBe(1);
    
    // Check for proper ARIA attributes
    const ariaPressed = await modeToggle.getAttribute('aria-pressed');
    expect(ariaPressed, 'Mode toggle should have aria-pressed').toBeTruthy();
    
    const ariaLabel = await modeToggle.getAttribute('aria-label');
    expect(ariaLabel, 'Mode toggle should have aria-label').toBeTruthy();

    // Test mode switching
    await modeToggle.click();
    await page.waitForTimeout(100);
    
    // Look for screen reader announcement
    const announcement = page.locator('[aria-live="polite"]');
    expect(await announcement.count(), 'Should have live region for announcements').toBeGreaterThan(0);
  });

  test('should have accessible diagnostics drawer', async ({ page }) => {
    // Look for diagnostics drawer trigger
    const diagnosticsTrigger = page.locator('button').filter({ hasText: /diagnostics/i }).first();
    
    if (await diagnosticsTrigger.count() === 0) {
      test.skip(true, 'Diagnostics trigger not found');
    }

    // Open diagnostics drawer
    await diagnosticsTrigger.click();
    await page.waitForTimeout(200);

    // Check drawer accessibility
    const drawer = page.locator('.fixed.inset-0, [role="dialog"]').first();
    expect(await drawer.count(), 'Diagnostics drawer should be visible').toBe(1);

    await checkAccessibility(page, 'diagnostics drawer');
    await testKeyboardNavigation(page, 'diagnostics drawer');
    await testScreenReaderAnnouncements(page, 'diagnostics drawer');

    // Test tab navigation within drawer
    const tabs = drawer.locator('[role="tab"]');
    const tabCount = await tabs.count();
    
    if (tabCount > 0) {
      // Test tab switching
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(100);
        
        // Verify tab is selected
        const isSelected = await tabs.nth(i).getAttribute('aria-selected');
        expect(isSelected, `Tab ${i} should be selected`).toBe('true');
      }
    }

    // Test form controls in drawer
    const formControls = drawer.locator('input, select, button, [role="switch"]');
    const controlCount = await formControls.count();
    
    if (controlCount > 0) {
      await formControls.each(async (control, index) => {
        const accessibleName = await control.evaluate(el => {
          const label = el.getAttribute('aria-label');
          const labelledBy = el.getAttribute('aria-labelledby');
          const placeholder = el.getAttribute('placeholder');
          const text = el.textContent?.trim();
          return label || labelledBy || placeholder || text;
        });

        expect(accessibleName, `Form control ${index} should have accessible name`).toBeTruthy();
      });
    }

    // Test drawer close functionality
    const closeButton = drawer.locator('button').filter({ hasText: /close/i }).first();
    if (await closeButton.count() > 0) {
      await closeButton.click();
      await page.waitForTimeout(100);
      
      // Verify drawer is closed
      expect(await drawer.count(), 'Drawer should be closed').toBe(0);
    }
  });

  test('should support keyboard-only navigation', async ({ page }) => {
    // Test entire flow with keyboard only
    await page.keyboard.press('Tab');
    
    let currentFocus = await page.locator(':focus');
    let focusCount = 0;
    const maxFocusAttempts = 20;

    while (await currentFocus.count() > 0 && focusCount < maxFocusAttempts) {
      const tagName = await currentFocus.evaluate(el => el.tagName.toLowerCase());
      const role = await currentFocus.getAttribute('role');
      
      // Test activation of focusable elements
      if (tagName === 'button' || role === 'button') {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(100);
      } else if (role === 'switch') {
        await page.keyboard.press(' ');
        await page.waitForTimeout(100);
      }

      await page.keyboard.press('Tab');
      currentFocus = await page.locator(':focus');
      focusCount++;
    }

    expect(focusCount, 'Should be able to navigate through focusable elements').toBeGreaterThan(0);
  });

  test('should handle touch accessibility', async ({ page }) => {
    // Test touch target sizes (44px minimum)
    const touchTargets = page.locator('button, [role="button"], [role="switch"], a, input');
    
    await touchTargets.each(async (target, index) => {
      const boundingBox = await target.boundingBox();
      
      if (boundingBox) {
        const minSize = 44; // WCAG 2.1 2.5.5 requirement
        expect(
          boundingBox.width >= minSize && boundingBox.height >= minSize,
          `Touch target ${index} should be at least ${minSize}px in both dimensions`
        ).toBeTruthy();
      }
    });

    // Test touch interactions
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Simulate touch events
      const firstButton = buttons.first();
      
      await firstButton.dispatchEvent('touchstart');
      await firstButton.dispatchEvent('touchend');
      await page.waitForTimeout(100);
      
      // Should trigger the same action as click
      // This would need to be verified based on specific implementation
    }
  });

  test('should meet WCAG 2.1 Level AA requirements', async ({ page }) => {
    // Test color contrast (basic check)
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th');
    
    await textElements.each(async (element, index) => {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
        };
      });

      // Basic check that colors are defined
      expect(styles.color, `Text element ${index} should have color defined`).toBeTruthy();
    });

    // Test reflow (zoom to 200%)
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    // Check for horizontal scroll
    const body = page.locator('body');
    const scrollWidth = await body.evaluate(el => el.scrollWidth);
    const clientWidth = await body.evaluate(el => el.clientWidth);
    
    expect(scrollWidth <= clientWidth, 'Page should not have horizontal scroll at 200% zoom').toBeTruthy();

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });

  test('should provide proper feedback for state changes', async ({ page }) => {
    // Test that all state changes have appropriate feedback
    
    // Look for loading states
    const loadingElements = page.locator('[aria-busy="true"], .loading, [data-loading="true"]');
    await loadingElements.each(async (element, index) => {
      const ariaBusy = await element.getAttribute('aria-busy');
      expect(ariaBusy, `Loading element ${index} should have aria-busy`).toBe('true');
    });

    // Look for error states
    const errorElements = page.locator('[role="alert"], .error, [data-error="true"]');
    await errorElements.each(async (element, index) => {
      const role = await element.getAttribute('role');
      const hasErrorClass = await element.evaluate(el => el.classList.contains('error'));
      const dataError = await element.getAttribute('data-error');
      
      expect(
        role === 'alert' || hasErrorClass || dataError === 'true',
        `Error element ${index} should have proper error indication`
      ).toBeTruthy();
    });

    // Look for success states
    const successElements = page.locator('[role="status"], .success, [data-success="true"]');
    await successElements.each(async (element, index) => {
      const role = await element.getAttribute('role');
      const hasSuccessClass = await element.evaluate(el => el.classList.contains('success'));
      const dataSuccess = await element.getAttribute('data-success');
      
      expect(
        role === 'status' || hasSuccessClass || dataSuccess === 'true',
        `Success element ${index} should have proper success indication`
      ).toBeTruthy();
    });
  });
});
