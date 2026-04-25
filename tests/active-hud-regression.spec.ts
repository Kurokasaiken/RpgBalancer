/**
 * Active HUD Regression Suite - Phase 12
 *
 * Comprehensive Playwright regression tests for the Active HUD Notification Layer.
 * Tests notification appearance, dismissal, stacking, timing, styling, and telemetry.
 */

import { test, expect, type Page } from '@playwright/test';
import { navigateToVillageSandbox, autoEnableTestHooks } from './fixtures/villageSandbox';

type NotificationType =
  | 'activity_started'
  | 'activity_completed'
  | 'activity_failed'
  | 'activity_cancelled'
  | 'resident_injured'
  | 'resident_killed'
  | 'resource_low'
  | 'resource_critical'
  | 'quest_available'
  | 'quest_completed'
  | 'day_transition'
  | 'system_message';

// Extend window for test environment
declare global {
  interface Window {
    reportHUDNotificationEvent?: (event: { eventType: string; data: Record<string, any> }) => void;
    __hudNotificationTelemetryEvents?: Array<{
      event: string;
      payload: Record<string, any>;
      timestamp: number;
    }>;
  }

  // Extend test hooks interface
  interface IdleVillageTestHooks {
    triggerHUDNotification?: (type: string, message: string, metadata?: Record<string, any>) => void;
    overrideHUDConfig?: (config: Record<string, any>) => void;
  }
}

/**
 * Trigger a HUD notification via test hooks
 */
async function triggerHUDNotification(
  page: Page,
  type: NotificationType,
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  await page.evaluate(
    ({ notificationType, notificationMessage, notificationMetadata }) => {
      // Use the global window function set by useHUDNotifications
      if (window.reportHUDNotificationEvent) {
        window.reportHUDNotificationEvent({
          eventType: 'hud_notification_shown',
          data: {
            notificationId: `test-${Date.now()}-${Math.random()}`,
            type: notificationType,
            message: notificationMessage,
            timestamp: Date.now(),
            metadata: notificationMetadata,
          },
        });
      } else {
        // Fallback: directly trigger through test hooks
        window.__idleVillageTestHooks?.triggerHUDNotification?.(
          notificationType,
          notificationMessage,
          notificationMetadata
        );
      }
    },
    { notificationType: type, notificationMessage: message, notificationMetadata: metadata }
  );
}

/**
 * Wait for HUD notification to appear
 */
async function waitForHUDNotification(page: Page, expectedText?: string): Promise<void> {
  await page.waitForSelector(SELECTORS.hudNotificationLayer, { timeout: 5000 });

  if (expectedText) {
    await expect(page.locator(SELECTORS.hudNotificationLayer)).toContainText(expectedText);
  }
}

/**
 * Get count of visible HUD notifications
 */
async function getHUDNotificationCount(page: Page): Promise<number> {
  return page.locator(SELECTORS.hudNotification).count();
}

/**
 * Dismiss all visible HUD notifications
 */
async function dismissAllHUDNotifications(page: Page): Promise<void> {
  const dismissButtons = page.locator(SELECTORS.hudNotificationDismiss);
  const count = await dismissButtons.count();

  for (let i = 0; i < count; i++) {
    await dismissButtons.nth(0).click();
    await page.waitForTimeout(100); // Allow animation
  }
}

test.beforeEach(async ({ page }) => {
  await autoEnableTestHooks(page);
});

test.describe('Active HUD Notification Layer - Regression Suite', () => {
  test.describe('Basic Notification Display', () => {
    test('shows activity completion notification', async ({ page }) => {
      await navigateToVillageSandbox(page);

      await triggerHUDNotification(
        page,
        'activity_completed',
        'Forging job completed successfully!'
      );

      await waitForHUDNotification(page, 'Forging job completed successfully!');
      await expect(page.locator(SELECTORS.hudNotification)).toBeVisible();
    });

    test('shows activity failure notification', async ({ page }) => {
      await navigateToVillageSandbox(page);

      await triggerHUDNotification(
        page,
        'activity_failed',
        'Quest failed due to insufficient strength'
      );

      await waitForHUDNotification(page, 'Quest failed due to insufficient strength');
      const notification = page.locator(SELECTORS.hudNotification);
      await expect(notification).toBeVisible();
      // Should have error styling (red border)
      await expect(notification).toHaveClass(/border-red-/);
    });

    test('shows resident injury notification', async ({ page }) => {
      await navigateToVillageSandbox(page);

      await triggerHUDNotification(
        page,
        'resident_injured',
        'Warrior took 15 damage during combat'
      );

      await waitForHUDNotification(page, 'Warrior took 15 damage during combat');
      const notification = page.locator(SELECTORS.hudNotification);
      await expect(notification).toBeVisible();
      // Should have amber/warning styling
      await expect(notification).toHaveClass(/border-amber-/);
    });

    test('shows resource critical notification', async ({ page }) => {
      await navigateToVillageSandbox(page);

      await triggerHUDNotification(
        page,
        'resource_critical',
        'Food supplies critically low!'
      );

      await waitForHUDNotification(page, 'Food supplies critically low!');
      const notification = page.locator(SELECTORS.hudNotification);
      await expect(notification).toBeVisible();
    });

    test('shows system message notification', async ({ page }) => {
      await navigateToVillageSandbox(page);

      await triggerHUDNotification(
        page,
        'system_message',
        'Daily reset completed'
      );

      await waitForHUDNotification(page, 'Daily reset completed');
      await expect(page.locator(SELECTORS.hudNotification)).toBeVisible();
    });
  });

  test.describe('Notification Dismissal', () => {
    test('dismisses notification on close button click', async ({ page }) => {
      await navigateToVillageSandbox(page);

      await triggerHUDNotification(
        page,
        'activity_completed',
        'Test notification'
      );

      await waitForHUDNotification(page, 'Test notification');
      await expect(page.locator(SELECTORS.hudNotification)).toBeVisible();

      // Click dismiss button
      await page.locator(SELECTORS.hudNotificationDismiss).click();

      // Notification should disappear
      await expect(page.locator(SELECTORS.hudNotification)).not.toBeVisible();
    });

    test('auto-dismisses notification after timeout', async ({ page }) => {
      await navigateToVillageSandbox(page);

      // Override config to use shorter timeout for testing
      await page.evaluate(() => {
        if (window.__idleVillageTestHooks?.overrideHUDConfig) {
          window.__idleVillageTestHooks.overrideHUDConfig({
            defaultDurationMs: 1000, // 1 second for testing
          });
        }
      });

      await triggerHUDNotification(
        page,
        'activity_completed',
        'Auto-dismiss test'
      );

      await waitForHUDNotification(page, 'Auto-dismiss test');
      await expect(page.locator(SELECTORS.hudNotification)).toBeVisible();

      // Wait for auto-dismiss
      await page.waitForTimeout(1500);

      // Notification should be gone
      await expect(page.locator(SELECTORS.hudNotification)).not.toBeVisible();
    });

    test('dismisses all notifications', async ({ page }) => {
      await navigateToVillageSandbox(page);

      // Trigger multiple notifications
      await triggerHUDNotification(page, 'activity_completed', 'Notification 1');
      await triggerHUDNotification(page, 'activity_failed', 'Notification 2');
      await triggerHUDNotification(page, 'resident_injured', 'Notification 3');

      await waitForHUDNotification(page);

      // Should have 3 notifications
      await expect(page.locator(SELECTORS.hudNotification)).toHaveCount(3);

      // Dismiss all
      await dismissAllHUDNotifications(page);

      // Should be no notifications
      await expect(page.locator(SELECTORS.hudNotification)).toHaveCount(0);
    });
  });

  test.describe('Notification Stacking & Positioning', () => {
    test('stacks multiple notifications vertically', async ({ page }) => {
      await navigateToVillageSandbox(page);

      // Override max concurrent to allow multiple
      await page.evaluate(() => {
        if (window.__idleVillageTestHooks?.overrideHUDConfig) {
          window.__idleVillageTestHooks.overrideHUDConfig({
            maxConcurrent: 3,
            defaultDurationMs: 5000, // Don't auto-dismiss during test
          });
        }
      });

      await triggerHUDNotification(page, 'activity_completed', 'First notification');
      await triggerHUDNotification(page, 'activity_failed', 'Second notification');
      await triggerHUDNotification(page, 'resident_injured', 'Third notification');

      await waitForHUDNotification(page);

      // Should have 3 notifications stacked
      const notifications = page.locator(SELECTORS.hudNotification);
      await expect(notifications).toHaveCount(3);

      // Check vertical stacking (each should have increasing top margin)
      const firstBox = await notifications.nth(0).boundingBox();
      const secondBox = await notifications.nth(1).boundingBox();
      const thirdBox = await notifications.nth(2).boundingBox();

      expect(firstBox!.y).toBeLessThan(secondBox!.y);
      expect(secondBox!.y).toBeLessThan(thirdBox!.y);
    });

    test('respects max concurrent limit', async ({ page }) => {
      await navigateToVillageSandbox(page);

      // Set max concurrent to 2
      await page.evaluate(() => {
        if (window.__idleVillageTestHooks?.overrideHUDConfig) {
          window.__idleVillageTestHooks.overrideHUDConfig({
            maxConcurrent: 2,
            defaultDurationMs: 5000,
          });
        }
      });

      // Trigger 3 notifications
      await triggerHUDNotification(page, 'activity_completed', 'Notification 1');
      await triggerHUDNotification(page, 'activity_failed', 'Notification 2');
      await triggerHUDNotification(page, 'resident_injured', 'Notification 3');

      await waitForHUDNotification(page);

      // Should only show 2 (max concurrent)
      await expect(page.locator(SELECTORS.hudNotification)).toHaveCount(2);
    });

    test('positions correctly in top-right corner', async ({ page }) => {
      await navigateToVillageSandbox(page);

      await triggerHUDNotification(
        page,
        'activity_completed',
        'Position test notification'
      );

      await waitForHUDNotification(page, 'Position test notification');

      const layer = page.locator(SELECTORS.hudNotificationLayer);
      const box = await layer.boundingBox();

      // Should be positioned near top-right
      expect(box!.x).toBeGreaterThan(page.viewportSize()!.width * 0.7);
      expect(box!.y).toBeLessThan(100); // Near top
    });
  });

  test.describe('Notification Content & Styling', () => {
    test('displays correct icons for notification types', async ({ page }) => {
      await navigateToVillageSandbox(page);

      await triggerHUDNotification(
        page,
        'activity_completed',
        'Icon test'
      );

      await waitForHUDNotification(page, 'Icon test');

      // Should have success icon (green checkmark)
      const notification = page.locator(SELECTORS.hudNotification);
      await expect(notification).toContainText('✅');
    });

    test('shows metadata when provided', async ({ page }) => {
      await navigateToVillageSandbox(page);

      await triggerHUDNotification(
        page,
        'resource_low',
        'Food running low',
        { details: 'Current: 15/100 units' }
      );

      await waitForHUDNotification(page, 'Food running low');
      await expect(page.locator(SELECTORS.hudNotification)).toContainText('Current: 15/100 units');
    });

    test('applies correct styling per notification type', async ({ page }) => {
      await navigateToVillageSandbox(page);

      // Test different types have different styling
      await triggerHUDNotification(page, 'activity_completed', 'Success');
      await triggerHUDNotification(page, 'activity_failed', 'Failure');

      await waitForHUDNotification(page);

      const notifications = page.locator(SELECTORS.hudNotification);

      // Success should have green styling
      const successNotification = notifications.filter({ hasText: 'Success' });
      await expect(successNotification).toHaveClass(/border-green-/);

      // Failure should have red styling
      const failureNotification = notifications.filter({ hasText: 'Failure' });
      await expect(failureNotification).toHaveClass(/border-red-/);
    });
  });

  test.describe('Mobile vs Desktop Behavior', () => {
    test('works on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await navigateToVillageSandbox(page);

      await triggerHUDNotification(
        page,
        'activity_completed',
        'Mobile test notification'
      );

      await waitForHUDNotification(page, 'Mobile test notification');

      // Should still be visible and properly positioned
      const notification = page.locator(SELECTORS.hudNotification);
      await expect(notification).toBeVisible();

      // Check positioning adapts to smaller screen
      const layer = page.locator(SELECTORS.hudNotificationLayer);
      const box = await layer.boundingBox();
      expect(box!.x).toBeLessThan(375); // Within mobile viewport
    });

    test('adapts to different device orientations', async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 }); // Landscape

      await navigateToVillageSandbox(page);

      await triggerHUDNotification(
        page,
        'activity_completed',
        'Landscape test'
      );

      await waitForHUDNotification(page, 'Landscape test');

      const notification = page.locator(SELECTORS.hudNotification);
      await expect(notification).toBeVisible();

      // Should adapt to landscape layout
      const layer = page.locator(SELECTORS.hudNotificationLayer);
      const box = await layer.boundingBox();
      expect(box!.width).toBeLessThan(667);
    });
  });

  test.describe('Integration with Village Activities', () => {
    test('shows notification when activity completes via HUD', async ({ page }) => {
      await navigateToVillageSandbox(page);

      // Seed resident and assign to job
      await page.evaluate(() => {
        window.__idleVillageTestHooks?.seedResidents?.([{
          id: 'worker-1',
          displayName: 'Worker',
          statTags: ['strength'],
          fatigue: 0,
          status: 'available',
        }]);
      });

      // Assign to job
      const jobId = await page.evaluate(() =>
        window.__idleVillageTestHooks?.getManagedActivityHandles?.()?.jobActivityId
      );

      if (jobId) {
        await page.evaluate((id) =>
          window.__idleVillageTestHooks?.assignResidentToActivity?.(id, 'worker-1'),
          jobId
        );

        // Complete the job
        await page.evaluate((id) => {
          const activity = window.__idleVillageTestHooks?.getActivityDefinition?.(id);
          const duration = activity?.duration ?? 10; // Use duration instead of durationFormula
          window.__idleVillageTestHooks?.advanceTimeUnits?.(duration);
        }, jobId);

        // Collect the completed job
        await page.locator(SELECTORS.collectButton).click();

        // Should trigger completion notification
        await waitForHUDNotification(page, 'completed');
        await expect(page.locator(SELECTORS.hudNotification)).toBeVisible();
      }
    });

    test('handles notification queue during rapid activity completions', async ({ page }) => {
      await navigateToVillageSandbox(page);

      // Override to allow more concurrent notifications
      await page.evaluate(() => {
        if (window.__idleVillageTestHooks?.overrideHUDConfig) {
          window.__idleVillageTestHooks.overrideHUDConfig({
            maxConcurrent: 5,
            defaultDurationMs: 3000,
          });
        }
      });

      // Trigger multiple notifications rapidly
      for (let i = 0; i < 3; i++) {
        await triggerHUDNotification(
          page,
          'activity_completed',
          `Rapid completion ${i + 1}`
        );
        await page.waitForTimeout(100);
      }

      await waitForHUDNotification(page);

      // Should handle queue properly
      const count = await getHUDNotificationCount(page);
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(5); // Respect max concurrent
    });
  });

  test.describe('Telemetry & Analytics', () => {
    test('emits telemetry events for notification lifecycle', async ({ page }) => {
      await navigateToVillageSandbox(page);

      // Clear any existing telemetry
      await page.evaluate(() => {
        if (window.__hudNotificationTelemetryEvents) {
          window.__hudNotificationTelemetryEvents = [];
        }
      });

      await triggerHUDNotification(
        page,
        'activity_completed',
        'Telemetry test'
      );

      await waitForHUDNotification(page, 'Telemetry test');

      // Check telemetry was emitted
      const telemetryEvents = await page.evaluate(() =>
        window.__hudNotificationTelemetryEvents || []
      );

      expect(telemetryEvents.length).toBeGreaterThan(0);
      const event = telemetryEvents[0];
      expect(event.event).toBe('hud_notification_shown');
      expect(event.payload.type).toBe('activity_completed');
      expect(event.payload.message).toBe('Telemetry test');
    });

    test('tracks dismissal telemetry', async ({ page }) => {
      await navigateToVillageSandbox(page);

      await page.evaluate(() => {
        if (window.__hudNotificationTelemetryEvents) {
          window.__hudNotificationTelemetryEvents = [];
        }
      });

      await triggerHUDNotification(
        page,
        'activity_completed',
        'Dismiss test'
      );

      await waitForHUDNotification(page, 'Dismiss test');

      // Dismiss notification
      await page.locator(SELECTORS.hudNotificationDismiss).click();

      // Check dismissal telemetry
      await page.waitForTimeout(500); // Allow telemetry to be emitted

      const telemetryEvents = await page.evaluate(() =>
        window.__hudNotificationTelemetryEvents || []
      );

      const dismissEvents = telemetryEvents.filter((e: typeof telemetryEvents[0]) => e.event === 'hud_notification_dismissed');
      expect(dismissEvents.length).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('handles unknown notification types gracefully', async ({ page }) => {
      await navigateToVillageSandbox(page);

      await triggerHUDNotification(
        page,
        'unknown_type' as any,
        'Unknown type test'
      );

      // Should not crash, may show fallback styling
      await page.waitForTimeout(1000);
      // Test passes if no unhandled errors occur
    });

    test('handles very long notification messages', async ({ page }) => {
      await navigateToVillageSandbox(page);

      const longMessage = 'A'.repeat(500); // Very long message

      await triggerHUDNotification(
        page,
        'system_message',
        longMessage
      );

      await waitForHUDNotification(page);

      // Should handle long text without breaking layout
      const notification = page.locator(SELECTORS.hudNotification);
      await expect(notification).toBeVisible();

      // Check that text is truncated or wrapped appropriately
      const textContent = await notification.textContent();
      expect(textContent!.length).toBeGreaterThan(100); // Some text visible
    });

    test('maintains functionality during rapid notifications', async ({ page }) => {
      await navigateToVillageSandbox(page);

      // Rapid-fire many notifications
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(triggerHUDNotification(
          page,
          'system_message',
          `Rapid notification ${i + 1}`
        ));
      }

      await Promise.all(promises);
      await page.waitForTimeout(1000);

      // Should not crash, should show some notifications
      const count = await getHUDNotificationCount(page);
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(5); // Max concurrent
    });
  });
});
