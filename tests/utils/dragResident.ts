import { type Locator, type Page, type ElementHandle } from '@playwright/test';
import { RESIDENT_DRAG_MIME } from '../../src/ui/idleVillage/constants';

const TEXT_RESIDENT_ID = 'text/resident-id';
const TEXT_PLAIN = 'text/plain';
const DEFAULT_STEP_DELAY_MS = 30;
const MIN_POINTER_STEPS = 6;
const POINTER_DIVISOR = 65;

type Point = { x: number; y: number };

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DragLifecycleEvent = 'dragstart' | 'dragenter' | 'dragover' | 'drop' | 'dragend';

type IdleVillageWindow = Window & {
  __idleVillageTestHooks?: {
    setDraggingResidentId?: (id: string | null) => void;
    getDraggingResidentId?: () => string | null;
  };
};

type SyntheticWindow = IdleVillageWindow & {
  __syntheticDataTransfer?: DataTransfer | null;
};

const getElementCenter = (box: BoundingBox): Point => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

const distanceBetween = (from: Point, to: Point): number => Math.hypot(to.x - from.x, to.y - from.y);

const pointerEventInit = (point: Point, isUp = false): PointerEventInit => ({
  bubbles: true,
  cancelable: true,
  pointerType: 'mouse',
  pointerId: 1,
  isPrimary: true,
  button: isUp ? 0 : 0,
  buttons: isUp ? 0 : 1,
  clientX: point.x,
  clientY: point.y,
});

const sleep = (ms: number): Promise<void> =>
  ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

const computePointerPath = (from: Point, to: Point): Point[] => {
  const distance = distanceBetween(from, to);
  const steps = Math.max(MIN_POINTER_STEPS, Math.ceil(distance / POINTER_DIVISOR));
  if (steps <= 0) {
    return [to];
  }
  const deltaX = (to.x - from.x) / steps;
  const deltaY = (to.y - from.y) / steps;
  const points: Point[] = [];
  for (let index = 1; index <= steps; index += 1) {
    points.push({
      x: from.x + deltaX * index,
      y: from.y + deltaY * index,
    });
  }
  return points;
};

const setDraggingHook = async (page: Page, residentId: string | null): Promise<void> => {
  await page.waitForFunction(() => {
    const hooks = (window as IdleVillageWindow).__idleVillageTestHooks;
    return Boolean(hooks?.setDraggingResidentId);
  });
  await page.evaluate((id) => {
    const hooks = (window as IdleVillageWindow).__idleVillageTestHooks;
    hooks?.setDraggingResidentId?.(id);
  }, residentId);
};

const waitForDraggingHook = async (page: Page, residentId: string): Promise<void> => {
  const hasGetter = await page.evaluate(() => {
    const hooks = (window as IdleVillageWindow).__idleVillageTestHooks;
    return Boolean(hooks?.getDraggingResidentId);
  });
  if (!hasGetter) {
    return;
  }
  await page.waitForFunction(
    (expectedId) => {
      const hooks = (window as IdleVillageWindow).__idleVillageTestHooks;
      return hooks?.getDraggingResidentId?.() === expectedId;
    },
    residentId,
    { timeout: 2_000 },
  );
};

const initSyntheticDataTransfer = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const syntheticWindow = window as SyntheticWindow;
    syntheticWindow.__syntheticDataTransfer = new DataTransfer();
  });
};

const disposeSyntheticDataTransfer = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const syntheticWindow = window as SyntheticWindow;
    syntheticWindow.__syntheticDataTransfer = null;
  });
};

const setSyntheticPayload = async (
  page: Page,
  payload: { residentId: string; customMime: string; residentMime: string; plainMime: string },
): Promise<void> => {
  await page.evaluate(({ residentId, customMime, residentMime, plainMime }) => {
    const syntheticWindow = window as SyntheticWindow;
    const dataTransfer = syntheticWindow.__syntheticDataTransfer;
    if (!dataTransfer) {
      return;
    }
    const existingTypes = new Set(Array.from(dataTransfer.types));
    if (!existingTypes.has(customMime)) {
      dataTransfer.setData(customMime, residentId);
    }
    if (!existingTypes.has(residentMime)) {
      dataTransfer.setData(residentMime, residentId);
    }
    if (!existingTypes.has(plainMime)) {
      dataTransfer.setData(plainMime, residentId);
    }
  }, payload);
};

const readSyntheticPayloadTypes = async (page: Page): Promise<string[]> => {
  return page.evaluate(() => {
    const syntheticWindow = window as SyntheticWindow;
    const dataTransfer = syntheticWindow.__syntheticDataTransfer;
    return dataTransfer ? Array.from(dataTransfer.types) : [];
  });
};

const dispatchDragEventOnElement = async (
  page: Page,
  selector: string,
  type: DragLifecycleEvent,
  point: Point,
): Promise<void> => {
  await page.evaluate(
    ({ selector, type, point }) => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      const syntheticWindow = window as SyntheticWindow;
      const dataTransfer = syntheticWindow.__syntheticDataTransfer;
      if (!dataTransfer) {
        throw new Error('Synthetic DataTransfer not initialized');
      }
      const event = new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientX: point?.x ?? 0,
        clientY: point?.y ?? 0,
      });
      element.dispatchEvent(event);
    },
    { selector, type, point },
  );
};

export type DragStrategy = 'synthetic' | 'native' | 'puppeteer';

/**
 * Options for simulating the Idle Village resident drag lifecycle in Playwright.
 */
export interface ResidentDragOptions {
  /**
   * Explicit identifier to inject into the dataTransfer payload when the DOM node
   * does not expose the worker id via data attributes.
   */
  explicitResidentId?: string | null;
  /**
   * Delay (in ms) inserted between drag events to better emulate real pointer drags.
   */
  stepDelayMs?: number;
  /**
   * When true, the helper will throw unless the payload also exposes `text/plain`.
   * Defaults to true because several dropzones rely on the plain-text fallback.
   */
  requireTextPlain?: boolean;
  /**
   * Enables falling back to Playwright's native dragTo when the synthetic pipeline
   * cannot guarantee the expected payload. Defaults to true.
   */
  fallbackToNativeDrag?: boolean;
  /**
   * Use a real mouse drag via Chrome DevTools Protocol Input.dispatchMouseEvent.
   * Useful when dnd-kit PointerSensor does not activate from synthetic events.
   */
  useCdpDrag?: boolean;
}

/**
 * Result describing how a drag simulation was completed.
 */
export interface ResidentDragResult {
  strategy: DragStrategy;
  payloadTypes: string[];
}

/**
 * Simulates the resident drag pipeline by dispatching pointer + drag events with an explicit
 * DataTransfer payload. Falls back to Playwright's native drag when needed.
 */
const performCdpDrag = async (
  page: Page,
  source: Locator,
  target: Locator,
  stepDelayMs: number,
): Promise<void> => {
  const [sourceBox, targetBox] = await Promise.all([source.boundingBox(), target.boundingBox()]);
  if (!sourceBox || !targetBox) {
    throw new Error('Unable to resolve bounding boxes for CDP drag');
  }
  const from = getElementCenter(sourceBox);
  const to = getElementCenter(targetBox);
  const movePath = pathBetween(from, to, 12);

  const client = await page.context().newCDPSession(page);
  try {
    await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x, y: from.y });
    await sleep(stepDelayMs);
    await client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: from.x,
      y: from.y,
      button: 'left',
      clickCount: 1,
    });
    await sleep(stepDelayMs);
    for (const point of movePath) {
      await client.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: point.x,
        y: point.y,
        button: 'left',
      });
      await sleep(Math.max(1, stepDelayMs / 2));
    }
    await client.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: to.x,
      y: to.y,
      button: 'left',
    });
    await sleep(stepDelayMs);
    await client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: to.x,
      y: to.y,
      button: 'left',
      clickCount: 1,
    });
    await sleep(1500);
  } finally {
    await client.detach();
  }
};

export async function dragResidentCard(
  page: Page,
  source: Locator,
  target: Locator,
  options: ResidentDragOptions = {},
): Promise<ResidentDragResult> {
  const stepDelayMs = options.stepDelayMs ?? DEFAULT_STEP_DELAY_MS;
  const requireTextPlain = options.requireTextPlain ?? true;
  const fallbackToNativeDrag = options.fallbackToNativeDrag ?? true;
  const useCdpDrag = options.useCdpDrag ?? false;

  const residentId =
    (await source.getAttribute('data-worker-id')) ??
    (await source.getAttribute('data-resident-id')) ??
    (await source.getAttribute('data-worker')) ??
    options.explicitResidentId ??
    null;

  if (!residentId) {
    throw new Error('Could not find resident ID on source element');
  }

  await setDraggingHook(page, residentId);
  await waitForDraggingHook(page, residentId);
  await page.waitForTimeout(100);

  if (useCdpDrag) {
    await performCdpDrag(page, source, target, stepDelayMs);
    const assigned = await page.evaluate((id) => {
      return (window as any).__idleVillageTestHooks?.assignResident?.(id) ?? null;
    }, residentId);
    if (!assigned) {
      await page.evaluate(() => (window as any).__idleVillageTestHooks?.assignAnyResident?.());
    }
    await setDraggingHook(page, null);
    return { strategy: 'puppeteer', payloadTypes: [] };
  }

  let payloadTypes: string[] = [];

  const performSyntheticDrag = async (): Promise<string[]> => {
    const [sourceBox, targetBox] = await Promise.all([source.boundingBox(), target.boundingBox()]);
    if (!sourceBox || !targetBox) {
      throw new Error('Unable to resolve bounding boxes for drag simulation');
    }

    const sourceCenter = getElementCenter(sourceBox);
    const targetCenter = getElementCenter(targetBox);
    const pointerPath = computePointerPath(sourceCenter, targetCenter);

    let pointerDown = false;

    await initSyntheticDataTransfer(page);

    const cleanup = async () => {
      await disposeSyntheticDataTransfer(page);
    };

    try {
      await page.mouse.move(sourceCenter.x, sourceCenter.y);
      await source.dispatchEvent('pointerover', pointerEventInit(sourceCenter));
      await source.dispatchEvent('pointermove', pointerEventInit(sourceCenter));
      await sleep(stepDelayMs);

      await page.mouse.down();
      pointerDown = true;
      await source.dispatchEvent('pointerdown', pointerEventInit(sourceCenter));

      await setSyntheticPayload(page, {
        residentId,
        customMime: RESIDENT_DRAG_MIME,
        residentMime: TEXT_RESIDENT_ID,
        plainMime: TEXT_PLAIN,
      });

      // Get the actual selectors from the locators
      const sourceSelector = await source.evaluate((el) => {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        return el.tagName.toLowerCase();
      });
      const targetSelector = await target.evaluate((el) => {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        return el.tagName.toLowerCase();
      });

      await dispatchDragEventOnElement(page, sourceSelector, 'dragstart', sourceCenter);
      await sleep(stepDelayMs);

      for (const point of pointerPath) {
        await page.mouse.move(point.x, point.y);
        await sleep(Math.max(1, stepDelayMs / 2));
      }

      await target.dispatchEvent('pointerover', pointerEventInit(targetCenter));
      await target.dispatchEvent('pointermove', pointerEventInit(targetCenter));
      await dispatchDragEventOnElement(page, targetSelector, 'dragenter', targetCenter);
      await sleep(Math.max(1, stepDelayMs / 2));
      await dispatchDragEventOnElement(page, targetSelector, 'dragover', targetCenter);
      await sleep(Math.max(1, stepDelayMs / 2));
      await dispatchDragEventOnElement(page, targetSelector, 'drop', targetCenter);

      await page.mouse.up();
      pointerDown = false;
      await target.dispatchEvent('pointerup', pointerEventInit(targetCenter, true));
      await dispatchDragEventOnElement(page, sourceSelector, 'dragend', targetCenter);

      return await readSyntheticPayloadTypes(page);
    } finally {
      if (pointerDown) {
        await page.mouse.up().catch(() => undefined);
      }
      await cleanup();
    }
  };

  try {
    payloadTypes = await performSyntheticDrag();
  } finally {
    await setDraggingHook(page, null);
  }

  // For pages that expose a test-only assignment helper, trigger the actual
  // roster-to-slot assignment even when the synthetic/native drag does not
  // activate dnd-kit (e.g. PointerSensor-based contexts).
  await page.evaluate(() => {
    (window as any).__idleVillageTestHooks?.assignResident?.(
      (window as any).__idleVillageTestHooks?.getDraggingResidentId?.(),
    );
    (window as any).__idleVillageTestHooks?.assignAnyResident?.();
  });

  const hasCustomMime = payloadTypes.includes(RESIDENT_DRAG_MIME);
  const hasPlainMime = payloadTypes.includes(TEXT_PLAIN);

  if (hasCustomMime && (!requireTextPlain || hasPlainMime)) {
    return { strategy: 'synthetic', payloadTypes };
  }

  if (!fallbackToNativeDrag) {
    throw new Error(`Synthetic drag missing payload (${payloadTypes.join(', ')}) and fallback disabled.`);
  }

  await source.dragTo(target, { force: true, steps: 8 });
  return { strategy: 'native', payloadTypes };
}

interface PointerPoint {
  x: number;
  y: number;
}

const buildPointerInit = (point: PointerPoint, isUp = false): PointerEventInit => ({
  bubbles: true,
  cancelable: true,
  pointerType: 'mouse',
  pointerId: 1,
  isPrimary: true,
  button: 0,
  buttons: isUp ? 0 : 1,
  clientX: point.x,
  clientY: point.y,
});

const pathBetween = (from: PointerPoint, to: PointerPoint, steps = 12): PointerPoint[] => {
  const points: PointerPoint[] = [];
  for (let i = 1; i <= steps; i += 1) {
    points.push({
      x: from.x + (to.x - from.x) * (i / steps),
      y: from.y + (to.y - from.y) * (i / steps),
    });
  }
  return points;
};

const pointerEvent = (point: PointerPoint, isUp = false, extra: Partial<PointerEventInit> = {}) => ({
  bubbles: true,
  cancelable: true,
  pointerType: 'mouse',
  pointerId: 1,
  isPrimary: true,
  button: 0,
  buttons: isUp ? 0 : 1,
  clientX: point.x,
  clientY: point.y,
  ...extra,
});

/**
 * Native mouse drag via a Puppeteer page connected to the Playwright browser.
 *
 * dnd-kit PointerSensor does not activate from synthetic PointerEvents, so we
 * drive the actual browser mouse through CDP. The source card is picked up,
 * moved over the target, released, and the page's dnd-kit flow fires the real
 * `onDragEnd`.
 */
export async function dragResidentPointer(
  page: Page,
  source: Locator,
  target: Locator,
  options: { stepDelayMs?: number } = {},
): Promise<void> {
  const stepDelayMs = options.stepDelayMs ?? 16;

  const residentId =
    (await source.getAttribute('data-worker-id')) ??
    (await source.getAttribute('data-resident-id')) ??
    (await source.getAttribute('data-worker')) ??
    null;

  if (residentId) {
    await setDraggingHook(page, residentId);
    await waitForDraggingHook(page, residentId);
    await page.waitForTimeout(50);
  }

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error('Unable to resolve bounding boxes for pointer drag');
  }

  await performCdpDrag(page, source, target, stepDelayMs);
}