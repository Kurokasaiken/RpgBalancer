/**
 * Physical Interaction Utilities for E2E Testing
 * 
 * Enhanced utilities for drag-drop, hover, keyboard navigation
 * and other physical interactions in Playwright tests.
 * 
 * @since 2026-01-23
 * @author Guardian-VRT
 */

import type { Page, Locator, ElementHandle } from '@playwright/test';

/**
 * Physical interaction configuration
 */
export interface PhysicalInteractionConfig {
  /** Duration in milliseconds for drag operations */
  dragDuration?: number;
  /** Delay between interactions in milliseconds */
  interactionDelay?: number;
  /** Number of steps for smooth drag operations */
  dragSteps?: number;
  /** Whether to wait for animations between steps */
  waitForAnimations?: boolean;
  /** Timeout for element visibility */
  elementTimeout?: number;
}

/**
 * Drag and drop path coordinates
 */
export interface DragPath {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  steps?: number;
}

/**
 * Keyboard navigation options
 */
export interface KeyboardNavigationOptions {
  /** Direction of navigation */
  direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'shift+tab';
  /** Number of steps to navigate */
  steps?: number;
  /** Delay between key presses in milliseconds */
  keyDelay?: number;
}

/**
 * Hover interaction options
 */
export interface HoverOptions {
  /** Duration to hover in milliseconds */
  duration?: number;
  /** Whether to move mouse smoothly */
  smooth?: boolean;
  /** Offset from element center */
  offset?: { x: number; y: number };
}

/**
 * Legacy interface for backward compatibility
 */
export interface PhysicalDragOptions {
  /** Number of intermediate steps for smooth drag (default: 10) */
  steps?: number;
  /** Pause at middle of drag for screenshot/verification (default: false) */
  pauseAtMiddle?: boolean;
  /** Capture screenshots during drag (default: false) */
  captureScreenshots?: boolean;
  /** Delay in ms at each step (default: 0) */
  stepDelay?: number;
}

/**
 * Legacy interface for backward compatibility
 */
export interface PhysicalDragResult {
  /** Screenshots captured during drag (if captureScreenshots=true) */
  screenshots: Buffer[];
}

/**
 * Default configuration for physical interactions
 */
const DEFAULT_CONFIG: Required<PhysicalInteractionConfig> = {
  dragDuration: 500,
  interactionDelay: 100,
  dragSteps: 10,
  waitForAnimations: true,
  elementTimeout: 5000,
};

/**
 * Physical Interaction Utilities Class
 */
export class PhysicalInteractionUtils {
  constructor(private page: Page, private config: PhysicalInteractionConfig = {}) {}

  /**
   * Get merged configuration
   */
  private getConfig(): Required<PhysicalInteractionConfig> {
    return { ...DEFAULT_CONFIG, ...this.config };
  }

  /**
   * Wait for element to be ready for interaction
   */
  async waitForElement(locator: Locator): Promise<ElementHandle<SVGElement | HTMLElement>> {
    const config = this.getConfig();
    await locator.waitFor({ state: 'visible', timeout: config.elementTimeout });
    return await locator.elementHandle();
  }

  /**
   * Perform smooth drag and drop operation
   */
  async dragAndDrop(
    source: Locator,
    target: Locator,
    options: Partial<DragPath> = {}
  ): Promise<void> {
    const config = this.getConfig();
    const sourceElement = await this.waitForElement(source);
    const targetElement = await this.waitForElement(target);

    // Get element positions
    const sourceBox = await sourceElement.boundingBox();
    const targetBox = await targetElement.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Could not get element bounding boxes for drag operation');
    }

    // Calculate drag path
    const startX = options.startX ?? sourceBox.x + sourceBox.width / 2;
    const startY = options.startY ?? sourceBox.y + sourceBox.height / 2;
    const endX = options.endX ?? targetBox.x + targetBox.width / 2;
    const endY = options.endY ?? targetBox.y + targetBox.height / 2;
    const steps = options.steps ?? config.dragSteps;

    // Start drag
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();

    // Perform smooth drag
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const x = startX + (endX - startX) * progress;
      const y = startY + (endY - startY) * progress;
      
      await this.page.mouse.move(x, y);
      
      if (config.waitForAnimations) {
        await this.page.waitForTimeout(config.interactionDelay);
      }
    }

    // Drop
    await this.page.mouse.up();

    // Wait for any animations to complete
    if (config.waitForAnimations) {
      await this.page.waitForTimeout(config.dragDuration);
    }
  }

  /**
   * Perform hover interaction with optional duration
   */
  async hover(locator: Locator, options: HoverOptions = {}): Promise<void> {
    const config = this.getConfig();
    const element = await this.waitForElement(locator);
    const box = await element.boundingBox();

    if (!box) {
      throw new Error('Could not get element bounding box for hover operation');
    }

    // Calculate hover position
    const x = box.x + box.width / 2 + (options.offset?.x ?? 0);
    const y = box.y + box.height / 2 + (options.offset?.y ?? 0);

    // Move to hover position
    if (options.smooth) {
      const currentPos = await this.page.mouse.position();
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const progress = i / steps;
        const moveX = currentPos.x + (x - currentPos.x) * progress;
        const moveY = currentPos.y + (y - currentPos.y) * progress;
        await this.page.mouse.move(moveX, moveY);
        await this.page.waitForTimeout(10);
      }
    } else {
      await this.page.mouse.move(x, y);
    }

    // Hold hover if duration specified
    if (options.duration && options.duration > 0) {
      await this.page.waitForTimeout(options.duration);
    }
  }

  /**
   * Perform keyboard navigation
   */
  async keyboardNavigation(options: KeyboardNavigationOptions): Promise<void> {
    const keyDelay = options.keyDelay ?? this.getConfig().interactionDelay;
    const steps = options.steps ?? 1;

    for (let i = 0; i < steps; i++) {
      switch (options.direction) {
        case 'up':
          await this.page.keyboard.press('ArrowUp');
          break;
        case 'down':
          await this.page.keyboard.press('ArrowDown');
          break;
        case 'left':
          await this.page.keyboard.press('ArrowLeft');
          break;
        case 'right':
          await this.page.keyboard.press('ArrowRight');
          break;
        case 'tab':
          await this.page.keyboard.press('Tab');
          break;
        case 'shift+tab':
          await this.page.keyboard.press('Shift+Tab');
          break;
      }

      if (keyDelay > 0) {
        await this.page.waitForTimeout(keyDelay);
      }
    }
  }

  /**
   * Perform multi-touch gesture (for mobile testing)
   */
  async multiTouchGesture(
    touches: Array<{ locator: Locator; offset?: { x: number; y: number } }>,
    duration: number = 500
  ): Promise<void> {
    const config = this.getConfig();
    
    // Get touch positions
    const positions = await Promise.all(
      touches.map(async ({ locator, offset }) => {
        const element = await this.waitForElement(locator);
        const box = await element.boundingBox();
        if (!box) throw new Error('Could not get element bounding box');
        return {
          x: box.x + box.width / 2 + (offset?.x ?? 0),
          y: box.y + box.height / 2 + (offset?.y ?? 0),
        };
      })
    );

    // Start touches
    for (const pos of positions) {
      await this.page.touchscreen.tap(pos.x, pos.y);
    }

    // Hold duration
    await this.page.waitForTimeout(duration);

    // End touches
    await this.page.touchscreen.tap(0, 0); // Tap away to end touches
  }

  /**
   * Perform scroll interaction
   */
  async scroll(
    locator: Locator,
    direction: 'up' | 'down' | 'left' | 'right',
    distance: number = 100,
    steps: number = 5
  ): Promise<void> {
    const config = this.getConfig();
    const element = await this.waitForElement(locator);
    
    const stepDistance = distance / steps;
    for (let i = 0; i < steps; i++) {
      switch (direction) {
        case 'up':
          await element.evaluate((el, dist) => el.scrollBy(0, -dist), stepDistance);
          break;
        case 'down':
          await element.evaluate((el, dist) => el.scrollBy(0, dist), stepDistance);
          break;
        case 'left':
          await element.evaluate((el, dist) => el.scrollBy(-dist, 0), stepDistance);
          break;
        case 'right':
          await element.evaluate((el, dist) => el.scrollBy(dist, 0), stepDistance);
          break;
      }
      
      await this.page.waitForTimeout(config.interactionDelay);
    }
  }

  /**
   * Perform pinch-to-zoom gesture
   */
  async pinchToZoom(
    locator: Locator,
    scale: number,
    duration: number = 500
  ): Promise<void> {
    const element = await this.waitForElement(locator);
    const box = await element.boundingBox();
    
    if (!box) {
      throw new Error('Could not get element bounding box for pinch-to-zoom');
    }

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const startDistance = 50;
    const endDistance = startDistance * scale;

    // Start touches
    await this.page.touchscreen.tap(centerX - startDistance, centerY);
    await this.page.touchscreen.tap(centerX + startDistance, centerY);

    // Perform pinch
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const currentDistance = startDistance + (endDistance - startDistance) * progress;
      
      await this.page.touchscreen.tap(centerX - currentDistance, centerY);
      await this.page.touchscreen.tap(centerX + currentDistance, centerY);
      
      await this.page.waitForTimeout(duration / steps);
    }
  }

  /**
   * Wait for animations to complete
   */
  async waitForAnimations(locator: Locator, timeout: number = 2000): Promise<void> {
    const element = await this.waitForElement(locator);
    
    // Check for CSS transitions and animations
    const hasAnimations = await element.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return (
        styles.transition !== 'all 0s ease 0s' ||
        styles.animation !== 'none 0s ease 0s 1 normal none running'
      );
    });

    if (hasAnimations) {
      await this.page.waitForTimeout(timeout);
    }
  }

  /**
   * Take screenshot with consistent settings
   */
  async takeScreenshot(options: {
    locator?: Locator;
    path?: string;
    fullPage?: boolean;
  } = {}): Promise<Buffer> {
    const config = this.getConfig();
    
    if (options.locator) {
      const element = await this.waitForElement(options.locator);
      return await element.screenshot({
        path: options.path,
        animations: 'disabled',
      });
    }

    return await this.page.screenshot({
      path: options.path,
      fullPage: options.fullPage ?? false,
      animations: 'disabled',
    });
  }
}

/**
 * Create physical interaction utilities for a page
 */
export function createPhysicalInteractionUtils(
  page: Page,
  config?: PhysicalInteractionConfig
): PhysicalInteractionUtils {
  return new PhysicalInteractionUtils(page, config);
}

/**
 * Legacy function for backward compatibility
 * Performs a real drag-and-drop with intermediate mouse movements
 */
export async function physicalDragAndDrop(
  page: Page,
  source: Locator,
  target: Locator,
  options: PhysicalDragOptions = {}
): Promise<PhysicalDragResult> {
  const utils = createPhysicalInteractionUtils(page);
  const screenshots: Buffer[] = [];

  const {
    steps = 10,
    pauseAtMiddle = false,
    captureScreenshots = false,
    stepDelay = 0,
  } = options;

  const sourceBBox = await source.boundingBox();
  const targetBBox = await target.boundingBox();

  if (!sourceBBox || !targetBBox) {
    throw new Error('Could not get bounding boxes for drag elements');
  }

  const sourceCenter = {
    x: sourceBBox.x + sourceBBox.width / 2,
    y: sourceBBox.y + sourceBBox.height / 2,
  };
  const targetCenter = {
    x: targetBBox.x + targetBBox.width / 2,
    y: targetBBox.y + targetBBox.height / 2,
  };

  // Move to source and press
  await page.mouse.move(sourceCenter.x, sourceCenter.y);
  await page.mouse.down();

  if (captureScreenshots) {
    screenshots.push(await page.screenshot());
  }

  // Move in steps to trigger dragenter/dragover events
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const x = sourceCenter.x + (targetCenter.x - sourceCenter.x) * progress;
    const y = sourceCenter.y + (targetCenter.y - sourceCenter.y) * progress;
    await page.mouse.move(x, y);

    if (stepDelay > 0) {
      await page.waitForTimeout(stepDelay);
    }

    if (pauseAtMiddle && i === Math.floor(steps / 2)) {
      await page.waitForTimeout(200);
      if (captureScreenshots) {
        screenshots.push(await page.screenshot());
      }
    }
  }

  // Release at target
  await page.mouse.up();

  if (captureScreenshots) {
    screenshots.push(await page.screenshot());
  }

  // Allow drop handlers to complete
  await page.waitForTimeout(100);

  return { screenshots };
}

/**
 * Legacy function for backward compatibility
 * Simulates touch drag for mobile testing
 */
export async function physicalTouchDrag(
  page: Page,
  source: Locator,
  target: Locator
): Promise<void> {
  const utils = createPhysicalInteractionUtils(page);
  
  const sourceBBox = await source.boundingBox();
  const targetBBox = await target.boundingBox();

  if (!sourceBBox || !targetBBox) {
    throw new Error('Could not get bounding boxes for touch drag');
  }

  const sourceX = sourceBBox.x + sourceBBox.width / 2;
  const sourceY = sourceBBox.y + sourceBBox.height / 2;
  const targetX = targetBBox.x + targetBBox.width / 2;
  const targetY = targetBBox.y + targetBBox.height / 2;

  await page.evaluate(
    ({ sx, sy, tx, ty }) => {
      const sourceEl = document.elementFromPoint(sx, sy);
      const targetEl = document.elementFromPoint(tx, ty);

      if (!sourceEl || !targetEl) {
        throw new Error('Could not find elements at touch coordinates');
      }

      // Create touch start event
      const touch = new Touch({
        identifier: 1,
        target: sourceEl,
        clientX: sx,
        clientY: sy,
        screenX: sx,
        screenY: sy,
        pageX: sx,
        pageY: sy,
      });

      sourceEl.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch],
          bubbles: true,
          cancelable: true,
        })
      );

      // Simulate move to target
      const moveTouch = new Touch({
        identifier: 1,
        target: targetEl,
        clientX: tx,
        clientY: ty,
        screenX: tx,
        screenY: ty,
        pageX: tx,
        pageY: ty,
      });

      document.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [moveTouch],
          targetTouches: [moveTouch],
          changedTouches: [moveTouch],
          bubbles: true,
          cancelable: true,
        })
      );

      // Touch end
      targetEl.dispatchEvent(
        new TouchEvent('touchend', {
          touches: [],
          targetTouches: [],
          changedTouches: [moveTouch],
          bubbles: true,
          cancelable: true,
        })
      );
    },
    { sx: sourceX, sy: sourceY, tx: targetX, ty: targetY }
  );

  // Allow touch handlers to complete
  await page.waitForTimeout(100);
}

/**
 * Legacy function for backward compatibility
 * Simulates a real hover with configurable timing
 */
export async function physicalHover(
  page: Page,
  element: Locator,
  options: { duration?: number } = {}
): Promise<void> {
  const utils = createPhysicalInteractionUtils(page);
  await utils.hover(element, { duration: options.duration });
}

/**
 * Legacy function for backward compatibility
 * Simulates keyboard navigation for accessibility testing
 */
export async function physicalKeyboardNav(
  page: Page,
  key: string,
  options: { repeat?: number; delay?: number } = {}
): Promise<void> {
  const utils = createPhysicalInteractionUtils(page);
  
  // Map legacy key format to navigation options
  const directionMap: Record<string, KeyboardNavigationOptions['direction']> = {
    'Tab': 'tab',
    'Shift+Tab': 'shift+tab',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
  };

  const direction = directionMap[key];
  if (direction) {
    await utils.keyboardNavigation({
      direction,
      steps: options.repeat ?? 1,
      keyDelay: options.delay,
    });
  } else {
    // Handle single key press
    for (let i = 0; i < (options.repeat ?? 1); i++) {
      await page.keyboard.press(key);
      if (options.delay && options.delay > 0 && i < (options.repeat ?? 1) - 1) {
        await page.waitForTimeout(options.delay);
      }
    }
  }
}

/**
 * Legacy function for backward compatibility
 * Captures element screenshot with scroll-into-view
 */
export async function captureElementScreenshot(
  page: Page,
  element: Locator
): Promise<Buffer> {
  const utils = createPhysicalInteractionUtils(page);
  return await utils.takeScreenshot({ locator: element });
}

/**
 * Legacy function for backward compatibility
 * Waits for CSS transition to complete
 */
export async function waitForTransition(
  page: Page,
  duration: number
): Promise<void> {
  await page.waitForTimeout(duration);
}

/**
 * Utility function for common drag patterns
 */
export async function dragToDropZone(
  page: Page,
  dragItemSelector: string,
  dropZoneSelector: string,
  config?: PhysicalInteractionConfig
): Promise<void> {
  const utils = createPhysicalInteractionUtils(page, config);
  const dragItem = page.locator(dragItemSelector);
  const dropZone = page.locator(dropZoneSelector);
  
  await utils.dragAndDrop(dragItem, dropZone);
}

/**
 * Utility function for hover and click
 */
export async function hoverAndClick(
  page: Page,
  selector: string,
  hoverOptions?: HoverOptions,
  config?: PhysicalInteractionConfig
): Promise<void> {
  const utils = createPhysicalInteractionUtils(page, config);
  const element = page.locator(selector);
  
  await utils.hover(element, hoverOptions);
  await element.click();
}
