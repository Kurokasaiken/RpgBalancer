/**
 * Theater Overlay Accessibility Tests – NP-155
 * 
 * Playwright accessibility tests for Theater Overlay using Axe-core.
 * Tests keyboard navigation, focus management, ARIA attributes, and screen reader support.
 * 
 * @since NP-155
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Theater Overlay Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/idle-village');
    
    await page.waitForSelector('[data-testid="theater-trigger"]', { timeout: 10000 });
    await page.click('[data-testid="theater-trigger"]');
    
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  });

  test('should not have any automatically detectable WCAG violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper dialog role and ARIA attributes', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby');
    
    const labelId = await dialog.getAttribute('aria-labelledby');
    const label = page.locator(`#${labelId}`);
    await expect(label).toBeVisible();
  });

  test('should trap focus within the overlay', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    const focusableElements = dialog.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    const firstElement = focusableElements.first();
    const lastElement = focusableElements.last();
    
    await firstElement.focus();
    await expect(firstElement).toBeFocused();
    
    await lastElement.focus();
    await page.keyboard.press('Tab');
    
    await expect(firstElement).toBeFocused();
  });

  test('should close overlay with Escape key', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    await page.keyboard.press('Escape');
    
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  test('should restore focus to trigger element on close', async ({ page }) => {
    const trigger = page.locator('[data-testid="theater-trigger"]');
    
    await page.keyboard.press('Escape');
    
    await expect(trigger).toBeFocused();
  });

  test('should navigate cards with Tab key', async ({ page }) => {
    const cards = page.locator('[role="article"]');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      const firstCard = cards.first();
      await firstCard.focus();
      await expect(firstCard).toBeFocused();
      
      await page.keyboard.press('Tab');
      
      const secondCard = cards.nth(1);
      if (await secondCard.count() > 0) {
        await expect(secondCard).toBeFocused();
      }
    }
  });

  test('should have accessible timers with ARIA attributes', async ({ page }) => {
    const timers = page.locator('[role="timer"]');
    const timerCount = await timers.count();
    
    if (timerCount > 0) {
      const timer = timers.first();
      
      await expect(timer).toHaveAttribute('aria-live', 'polite');
      await expect(timer).toHaveAttribute('aria-atomic', 'true');
      await expect(timer).toHaveAttribute('aria-label');
      
      const label = await timer.getAttribute('aria-label');
      expect(label).toContain('timer');
    }
  });

  test('should have accessible progress bars', async ({ page }) => {
    const progressBars = page.locator('[role="progressbar"]');
    const progressCount = await progressBars.count();
    
    if (progressCount > 0) {
      const progress = progressBars.first();
      
      await expect(progress).toHaveAttribute('aria-valuenow');
      await expect(progress).toHaveAttribute('aria-valuemin');
      await expect(progress).toHaveAttribute('aria-valuemax');
      
      const valueNow = await progress.getAttribute('aria-valuenow');
      const valueMin = await progress.getAttribute('aria-valuemin');
      const valueMax = await progress.getAttribute('aria-valuemax');
      
      expect(Number(valueNow)).toBeGreaterThanOrEqual(Number(valueMin));
      expect(Number(valueNow)).toBeLessThanOrEqual(Number(valueMax));
    }
  });

  test('should have accessible mini-cards with proper labels', async ({ page }) => {
    const cards = page.locator('[role="article"]');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      const card = cards.first();
      
      await expect(card).toHaveAttribute('aria-labelledby');
      
      const labelId = await card.getAttribute('aria-labelledby');
      const label = page.locator(`#${labelId}`);
      await expect(label).toBeVisible();
      
      const images = card.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        const img = images.first();
        await expect(img).toHaveAttribute('alt');
      }
    }
  });

  test('should toggle narration with keyboard shortcut', async ({ page }) => {
    const narrationButton = page.locator('[data-testid="narration-toggle"]');
    
    if (await narrationButton.count() > 0) {
      const initialState = await narrationButton.getAttribute('aria-pressed');
      
      await page.keyboard.press('n');
      
      const newState = await narrationButton.getAttribute('aria-pressed');
      expect(newState).not.toBe(initialState);
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    const focusableElements = page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const elementCount = await focusableElements.count();
    
    if (elementCount > 0) {
      const element = focusableElements.first();
      await element.focus();
      
      const outline = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          boxShadow: styles.boxShadow,
        };
      });
      
      const hasFocusIndicator = 
        outline.outline !== 'none' ||
        outline.outlineWidth !== '0px' ||
        outline.boxShadow !== 'none';
      
      expect(hasFocusIndicator).toBe(true);
    }
  });

  test('should meet color contrast requirements', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('[role="dialog"]')
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingLevels: number[] = [];
    
    const count = await headings.count();
    for (let i = 0; i < count; i++) {
      const heading = headings.nth(i);
      const tagName = await heading.evaluate(el => el.tagName);
      const level = parseInt(tagName.substring(1));
      headingLevels.push(level);
    }
    
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('should have ARIA live regions for dynamic updates', async ({ page }) => {
    const liveRegions = page.locator('[aria-live]');
    const liveCount = await liveRegions.count();
    
    expect(liveCount).toBeGreaterThan(0);
    
    if (liveCount > 0) {
      const liveRegion = liveRegions.first();
      const liveValue = await liveRegion.getAttribute('aria-live');
      
      expect(['polite', 'assertive', 'off']).toContain(liveValue);
    }
  });

  test('should support keyboard navigation with arrow keys', async ({ page }) => {
    const cards = page.locator('[role="article"]');
    const cardCount = await cards.count();
    
    if (cardCount > 1) {
      const firstCard = cards.first();
      await firstCard.focus();
      await expect(firstCard).toBeFocused();
      
      await page.keyboard.press('ArrowRight');
      
      const secondCard = cards.nth(1);
      await expect(secondCard).toBeFocused();
      
      await page.keyboard.press('ArrowLeft');
      await expect(firstCard).toBeFocused();
    }
  });

  test('should support Home and End keys for navigation', async ({ page }) => {
    const cards = page.locator('[role="article"]');
    const cardCount = await cards.count();
    
    if (cardCount > 1) {
      const firstCard = cards.first();
      const lastCard = cards.last();
      
      await page.keyboard.press('End');
      await expect(lastCard).toBeFocused();
      
      await page.keyboard.press('Home');
      await expect(firstCard).toBeFocused();
    }
  });

  test('should respect prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.reload();
    await page.click('[data-testid="theater-trigger"]');
    
    const dialog = page.locator('[role="dialog"]');
    const transition = await dialog.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.transition;
    });
    
    expect(transition).toBe('none');
  });

  test('should emit accessibility telemetry', async ({ page }) => {
    const telemetryEvents: any[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('iv_theater_a11y_checked')) {
        telemetryEvents.push(msg.text());
      }
    });
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    
    expect(telemetryEvents.length).toBeGreaterThan(0);
  });

  test('should have accessible close button', async ({ page }) => {
    const closeButton = page.locator('[data-testid="theater-close"]');
    
    if (await closeButton.count() > 0) {
      await expect(closeButton).toHaveAttribute('aria-label');
      
      const label = await closeButton.getAttribute('aria-label');
      expect(label?.toLowerCase()).toContain('close');
      
      await closeButton.click();
      
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should have proper button roles and labels', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      
      const hasText = await button.evaluate(el => el.textContent?.trim().length ?? 0 > 0);
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasAriaLabelledBy = await button.getAttribute('aria-labelledby');
      
      expect(hasText || hasAriaLabel || hasAriaLabelledBy).toBe(true);
    }
  });

  test('should support zoom up to 200%', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    const isOverflowing = await dialog.evaluate((el) => {
      return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
    });
    
    expect(isOverflowing).toBe(false);
  });
});
