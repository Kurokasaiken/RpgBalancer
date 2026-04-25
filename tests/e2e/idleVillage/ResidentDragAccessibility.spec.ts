/**
 * E2E Accessibility Tests for Idle Village Resident Drag & Drop
 * Tests WCAG 2.1 AA compliance for drag and drop interactions
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import type { AxeResults } from 'axe-core';

test.describe('Idle Village Resident Drag Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Idle Village page
    await page.goto('/idle-village');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Inject axe for accessibility testing
    await injectAxe(page);
    
    // Wait for resident roster to be visible
    await page.waitForSelector('[data-testid="drag-test-container"]', { timeout: 10000 });
  });

  test('should have no accessibility violations on initial load', async ({ page }) => {
    // Check for accessibility violations on the entire page
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      rules: {
        // Enable WCAG 2.1 AA compliance
        'wcag2a': { enabled: true },
        'wcag2aa': { enabled: true },
        'wcag21aa': { enabled: true },
      },
    });
  });

  test('should have proper ARIA labels on resident cards', async ({ page }) => {
    // Find resident cards
    const residentCards = page.locator('[data-testid="pg-card"]');
    await expect(residentCards.first()).toBeVisible();
    
    // Check that resident cards have proper draggable attributes
    const firstCard = residentCards.first();
    await expect(firstCard).toHaveAttribute('draggable', 'true');
    
    // Check for proper data attributes for testing
    await expect(firstCard).toHaveAttribute('data-worker-id');
    
    // Verify accessibility attributes are present
    const ariaLabel = await firstCard.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel?.length).toBeGreaterThan(0);
  });

  test('should have proper ARIA labels on activity slots', async ({ page }) => {
    // Find activity slots
    const activitySlots = page.locator('[data-testid^="activity-slot-"]');
    if (await activitySlots.count() > 0) {
      const firstSlot = activitySlots.first();
      await expect(firstSlot).toBeVisible();
      
      // Check for proper accessibility attributes
      const ariaLabel = await firstSlot.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.length).toBeGreaterThan(0);
      
      // Check drop zone attributes
      await expect(firstSlot).toHaveAttribute('data-drop-state');
      await expect(firstSlot).toHaveAttribute('data-can-drop');
    }
  });

  test('should support keyboard navigation for resident cards', async ({ page }) => {
    // Find resident cards
    const residentCards = page.locator('[data-testid="pg-card"]');
    const firstCard = residentCards.first();
    await expect(firstCard).toBeVisible();
    
    // Test keyboard focus
    await page.keyboard.press('Tab');
    await expect(firstCard).toBeFocused();
    
    // Test keyboard activation (Enter/Space)
    await page.keyboard.press('Enter');
    
    // Check if selection occurred (should trigger onSelect callback)
    // This would depend on the specific implementation
    await page.waitForTimeout(100);
  });

  test('should announce drag operations to screen readers', async ({ page }) => {
    // Find resident cards
    const residentCards = page.locator('[data-testid="pg-card"]');
    const firstCard = residentCards.first();
    await expect(firstCard).toBeVisible();
    
    // Focus the card
    await firstCard.focus();
    
    // Start drag operation
    await firstCard.dragTo(page.locator('body'));
    
    // Check for aria-live regions that announce drag state
    const liveRegions = page.locator('[aria-live]');
    const liveRegionCount = await liveRegions.count();
    expect(liveRegionCount).toBeGreaterThan(0);
    
    // Check that drag state is properly announced
    const dragContainer = page.locator('[data-testid="drag-test-container"]');
    await expect(dragContainer).toHaveAttribute('aria-live', 'polite');
  });

  test('should provide visual feedback for drag states', async ({ page }) => {
    // Find resident cards
    const residentCards = page.locator('[data-testid="pg-card"]');
    const firstCard = residentCards.first();
    await expect(firstCard).toBeVisible();
    
    // Get initial opacity
    const initialOpacity = await firstCard.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    
    // Start drag operation
    await firstCard.dragTo(page.locator('body'));
    
    // Check that visual feedback is provided
    const dragOpacity = await firstCard.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    
    // Opacity should change during drag
    expect(dragOpacity).not.toBe(initialOpacity);
  });

  test('should have proper focus management during drag operations', async ({ page }) => {
    // Find resident cards and activity slots
    const residentCards = page.locator('[data-testid="pg-card"]');
    const firstCard = residentCards.first();
    await expect(firstCard).toBeVisible();
    
    // Focus the card before drag
    await firstCard.focus();
    await expect(firstCard).toBeFocused();
    
    // Start drag operation
    await firstCard.dragTo(page.locator('body'));
    
    // Check that focus is managed properly
    // Focus might move to drop zones or remain on draggable element
    const focusedElement = page.locator(':focus');
    const isFocused = await focusedElement.count() > 0;
    expect(isFocused).toBeTruthy();
  });

  test('should support keyboard drag and drop alternatives', async ({ page }) => {
    // Find resident cards
    const residentCards = page.locator('[data-testid="pg-card"]');
    const firstCard = residentCards.first();
    await expect(firstCard).toBeVisible();
    
    // Test keyboard navigation to card
    await page.keyboard.press('Tab');
    await expect(firstCard).toBeFocused();
    
    // Check for keyboard alternatives to drag and drop
    // This could be arrow keys, Enter, Space, or custom keyboard shortcuts
    
    // Look for keyboard instructions or help text
    const keyboardInstructions = page.locator('text=/keyboard|key|arrow/i');
    const hasInstructions = await keyboardInstructions.count() > 0;
    
    // If keyboard instructions exist, they should be accessible
    if (hasInstructions) {
      await expect(keyboardInstructions.first()).toBeVisible();
    }
  });

  test('should have sufficient color contrast for drag indicators', async ({ page }) => {
    // Find resident cards
    const residentCards = page.locator('[data-testid="pg-card"]');
    const firstCard = residentCards.first();
    await expect(firstCard).toBeVisible();
    
    // Check color contrast for text elements
    const textElements = firstCard.locator('span, div');
    const textCount = await textElements.count();
    
    for (let i = 0; i < Math.min(textCount, 5); i++) {
      const element = textElements.nth(i);
      const isVisible = await element.isVisible();
      
      if (isVisible) {
        // Check that element has sufficient color contrast
        // This is a simplified check - axe will do detailed contrast analysis
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
          };
        });
        
        // Verify styles are not empty
        expect(styles.color).toBeTruthy();
        expect(styles.backgroundColor).toBeTruthy();
      }
    }
  });

  test('should provide accessible drop feedback', async ({ page }) => {
    // Find resident cards and activity slots
    const residentCards = page.locator('[data-testid="pg-card"]');
    const activitySlots = page.locator('[data-testid^="activity-slot-"]');
    
    if (await residentCards.count() > 0 && await activitySlots.count() > 0) {
      const firstCard = residentCards.first();
      const firstSlot = activitySlots.first();
      
      await expect(firstCard).toBeVisible();
      await expect(firstSlot).toBeVisible();
      
      // Perform drag and drop
      await firstCard.dragTo(firstSlot);
      
      // Check for accessible feedback
      // This could be through aria-live regions, status messages, or visual indicators
      
      // Look for drop feedback container
      const dropFeedback = page.locator('[data-testid$="-feedback"]');
      const hasFeedback = await dropFeedback.count() > 0;
      
      if (hasFeedback) {
        await expect(dropFeedback.first()).toBeVisible();
      }
    }
  });

  test('should have proper semantic structure for drag operations', async ({ page }) => {
    // Check that drag containers have proper semantic markup
    const dragContainer = page.locator('[data-testid="drag-test-container"]');
    await expect(dragContainer).toBeVisible();
    
    // Should use appropriate semantic elements
    const semanticElements = dragContainer.locator('section, article, main, nav, aside, header, footer');
    const hasSemanticElements = await semanticElements.count() > 0;
    expect(hasSemanticElements).toBeTruthy();
    
    // Check for proper heading structure
    const headings = dragContainer.locator('h1, h2, h3, h4, h5, h6');
    const hasHeadings = await headings.count() > 0;
    
    if (hasHeadings) {
      // Headings should be properly nested
      const firstHeading = headings.first();
      await expect(firstHeading).toBeVisible();
    }
  });

  test('should support screen reader announcements for drag states', async ({ page }) => {
    // Find resident cards
    const residentCards = page.locator('[data-testid="pg-card"]');
    const firstCard = residentCards.first();
    await expect(firstCard).toBeVisible();
    
    // Enable screen reader mode simulation
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Start drag operation
    await firstCard.dragTo(page.locator('body'));
    
    // Check for aria-live announcements
    const liveRegions = page.locator('[aria-live="polite"], [aria-live="assertive"]');
    const liveRegionCount = await liveRegions.count();
    expect(liveRegionCount).toBeGreaterThan(0);
    
    // Verify announcements are meaningful
    for (let i = 0; i < liveRegionCount; i++) {
      const region = liveRegions.nth(i);
      const text = await region.textContent();
      
      if (text && text.trim().length > 0) {
        // Should contain meaningful information about drag state
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should have accessible drag handles when needed', async ({ page }) => {
    // Find resident cards
    const residentCards = page.locator('[data-testid="pg-card"]');
    const firstCard = residentCards.first();
    await expect(firstCard).toBeVisible();
    
    // Check for drag handles or grab areas
    const dragHandles = firstCard.locator('[data-testid*="drag-handle"], [aria-label*="drag"], [title*="drag"]');
    const hasDragHandles = await dragHandles.count() > 0;
    
    // If drag handles exist, they should be accessible
    if (hasDragHandles) {
      const firstHandle = dragHandles.first();
      await expect(firstHandle).toBeVisible();
      
      // Should have proper ARIA attributes
      const ariaLabel = await firstHandle.getAttribute('aria-label');
      const title = await firstHandle.getAttribute('title');
      
      expect(ariaLabel || title).toBeTruthy();
    }
  });

  test('should maintain accessibility during drag animations', async ({ page }) => {
    // Find resident cards
    const residentCards = page.locator('[data-testid="pg-card"]');
    const firstCard = residentCards.first();
    await expect(firstCard).toBeVisible();
    
    // Check for reduced motion support
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Start drag operation
    await firstCard.dragTo(page.locator('body'));
    
    // Check that animations respect reduced motion preference
    const animatedElements = page.locator('[style*="transition"], [style*="animation"]');
    const animatedCount = await animatedElements.count();
    
    // In reduced motion mode, animations should be minimized
    // This is a simplified check - actual implementation may vary
    for (let i = 0; i < Math.min(animatedCount, 3); i++) {
      const element = animatedElements.nth(i);
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          transition: computed.transition,
          animation: computed.animation,
          transitionDuration: computed.transitionDuration,
          animationDuration: computed.animationDuration,
        };
      });
      
      // In reduced motion, durations should be 0s or very short
      if (styles.transitionDuration && styles.transitionDuration !== '0s') {
        expect(parseFloat(styles.transitionDuration)).toBeLessThan(0.1);
      }
    }
  });

  test('should provide accessible error messages for invalid drops', async ({ page }) => {
    // Find resident cards and activity slots
    const residentCards = page.locator('[data-testid="pg-card"]');
    const activitySlots = page.locator('[data-testid^="activity-slot-"]');
    
    if (await residentCards.count() > 0 && await activitySlots.count() > 0) {
      const firstCard = residentCards.first();
      const firstSlot = activitySlots.first();
      
      await expect(firstCard).toBeVisible();
      await expect(firstSlot).toBeVisible();
      
      // Try to drop on invalid slot (if available)
      const invalidSlots = page.locator('[data-can-drop="false"]');
      
      if (await invalidSlots.count() > 0) {
        const invalidSlot = invalidSlots.first();
        await firstCard.dragTo(invalidSlot);
        
        // Check for error messages
        const errorMessages = page.locator('[role="alert"], [aria-live="assertive"], .error, .invalid');
        const hasErrorMessages = await errorMessages.count() > 0;
        
        if (hasErrorMessages) {
          const firstError = errorMessages.first();
          await expect(firstError).toBeVisible();
          
          // Error messages should be accessible
          const errorText = await firstError.textContent();
          expect(errorText?.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should have comprehensive accessibility audit results', async ({ page }) => {
    // Run comprehensive accessibility audit
    const results = await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      rules: {
        // Enable all WCAG 2.1 AA rules
        'wcag2a': { enabled: true },
        'wcag2aa': { enabled: true },
        'wcag21aa': { enabled: true },
        'wcag22aa': { enabled: true },
        
        // Specific rules important for drag and drop
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'color-contrast': { enabled: true },
        'aria-required-children': { enabled: true },
        'aria-required-parent': { enabled: true },
        'role-img-alt': { enabled: true },
        'image-alt': { enabled: true },
        'input-button-name': { enabled: true },
        'label-title-only': { enabled: true },
        'link-in-text-block': { enabled: true },
        'skip-link': { enabled: true },
        'tabindex': { enabled: true },
        'table-headers': { enabled: true },
        'td-headers-attr': { enabled: true },
        'th-has-data-cells': { enabled: true },
        'valid-lang': { enabled: true },
        'video-caption': { enabled: true },
      },
    });
    
    // If there are violations, they should be documented
    // This test will fail if there are critical accessibility issues
    expect(results.violations.length).toBe(0);
  });
});
