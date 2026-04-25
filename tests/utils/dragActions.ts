/**
 * Drag Actions Utility
 *
 * Helper functions for Playwright drag and drop testing.
 * Provides realistic mouse/touch drag simulation with intermediate steps.
 */

import type { Page, Locator } from '@playwright/test';

export interface DragOptions {
  /** Number of intermediate steps during drag */
  steps?: number;
  /** Delay between steps in milliseconds */
  stepDelay?: number;
  /** Callback called during intermediate moves */
  onIntermediateMove?: (context: { page: Page; current: { x: number; y: number } }) => Promise<void> | void;
}

/**
 * Perform a drag operation from source element to target element
 */
export async function dragElement(
  page: Page,
  source: Locator,
  target: Locator | { x: number; y: number },
  options: DragOptions = {}
): Promise<void> {
  const { steps = 10, stepDelay = 50, onIntermediateMove } = options;

  // Get bounding boxes
  const sourceBox = await source.boundingBox();
  let targetBox: { x: number; y: number; width?: number; height?: number } | null = null;

  if ('boundingBox' in target && typeof target.boundingBox === 'function') {
    targetBox = await target.boundingBox();
  } else if (typeof target === 'object' && 'x' in target && 'y' in target) {
    targetBox = { x: target.x, y: target.y, width: 0, height: 0 };
  }

  if (!sourceBox || !targetBox) {
    throw new Error('Could not get bounding boxes for drag elements');
  }

  // Calculate center points
  const sourceCenter = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  };

  const targetCenter = {
    x: targetBox.x + (targetBox.width || 0) / 2,
    y: targetBox.y + (targetBox.height || 0) / 2,
  };

  // Move to source element
  await page.mouse.move(sourceCenter.x, sourceCenter.y);
  await page.waitForTimeout(100);

  // Press mouse button
  await page.mouse.down();
  await page.waitForTimeout(100);

  // Perform drag with intermediate steps
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const currentX = sourceCenter.x + (targetCenter.x - sourceCenter.x) * progress;
    const currentY = sourceCenter.y + (targetCenter.y - sourceCenter.y) * progress;

    await page.mouse.move(currentX, currentY);
    
    // Call intermediate callback if provided
    if (onIntermediateMove) {
      await onIntermediateMove({ page, current: { x: currentX, y: currentY } });
    }

    // Add small delay for realistic movement
    if (i < steps) {
      await page.waitForTimeout(stepDelay);
    }
  }

  // Release mouse button
  await page.mouse.up();
  await page.waitForTimeout(100);
}

/**
 * Perform a touch drag operation (for mobile testing)
 */
export async function dragElementTouch(
  page: Page,
  source: Locator,
  target: Locator,
  options: DragOptions = {}
): Promise<void> {
  const { steps = 10, stepDelay = 50, onIntermediateMove } = options;

  // Get bounding boxes
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('Could not get bounding boxes for drag elements');
  }

  // Calculate center points
  const sourceCenter = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  };

  const targetCenter = {
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height / 2,
  };

  // Start touch at source
  await page.touchscreen.tap(sourceCenter.x, sourceCenter.y);
  await page.waitForTimeout(100);

  // For touch, we'll use a series of tap operations to simulate drag
  // This is a simplified version since Playwright's touchscreen API is limited
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const currentX = sourceCenter.x + (targetCenter.x - sourceCenter.x) * progress;
    const currentY = sourceCenter.y + (targetCenter.y - sourceCenter.y) * progress;

    // Simulate touch move by tapping at intermediate positions
    if (i < steps) {
      await page.touchscreen.tap(currentX, currentY);
    }
    
    // Call intermediate callback if provided
    if (onIntermediateMove) {
      await onIntermediateMove({ page, current: { x: currentX, y: currentY } });
    }

    // Add small delay for realistic movement
    if (i < steps) {
      await page.waitForTimeout(stepDelay);
    }
  }

  // Final tap at target
  await page.touchscreen.tap(targetCenter.x, targetCenter.y);
  await page.waitForTimeout(100);
}

/**
 * Helper to wait for drag-related visual states
 */
export async function waitForDragState(
  page: Page,
  selector: string,
  state: 'valid' | 'invalid' | 'active',
  timeout = 5000
): Promise<void> {
  await page.waitForSelector(`${selector}[data-drop-state="${state}"]`, { timeout });
}

/**
 * Helper to check if element has drag-related classes
 */
export async function hasDragClass(
  page: Page,
  selector: string,
  className: string
): Promise<boolean> {
  const element = page.locator(selector);
  const classes = await element.getAttribute('class');
  return classes?.includes(className) || false;
}
