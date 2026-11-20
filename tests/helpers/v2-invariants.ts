import type { Locator } from '@playwright/test';

/**
 * V2 content-invariant probe helpers (PLAN-127 §5).
 *
 * Structural DOM assertions — NOT pixel checks. Every helper returns a
 * structured {@link V2ProbeResult} (pass/fail + measured evidence + per-node
 * violations) instead of throwing, so a probe spec can collect a full verdict
 * matrix in a single run.
 *
 * Canonical reference: `plans/PLAN-127-slicekit-pipeline.md` §5, "V2 invarianti
 * contenuto — fatti DOM".
 */

/** Machine-readable identifier for each V2 assertion family. */
export type V2AssertionId =
  | 'scroll-engagement'
  | 'text-floor'
  | 'no-horizontal-overflow'
  | 'last-item-reachable'
  | 'container-dims-stable';

/** A single measured violation against a DOM node. */
export interface V2Violation {
  /** Human/debug descriptor of the offending node (tag, testid, classes). */
  node: string;
  /** What the invariant expected. */
  expected: string;
  /** What was actually measured. */
  actual: string;
}

/** Structured result of one V2 assertion run. */
export interface V2ProbeResult {
  /** Assertion family identifier. */
  assertion: V2AssertionId;
  /** Overall pass/fail verdict for the assertion. */
  pass: boolean;
  /** Free-form measured evidence (dims, styles, counts, rects). */
  evidence: Record<string, unknown>;
  /** Per-node violations, empty when {@link V2ProbeResult.pass} is true. */
  violations: V2Violation[];
}

/** Default sub-check tolerances shared by the helpers. */
export interface V2ProbeOptions {
  /** Pixel tolerance for rect/dims comparisons. Defaults to 1 CSS px. */
  tolerancePx?: number;
}

const DEFAULT_TOLERANCE_PX = 1;

/**
 * V2 §"scrollHeight|scrollWidth > clientHeight|clientWidth" +
 * "overflowY ∈ {auto, scroll}" + "scrollTop settabile e rileggibile >0".
 *
 * Verifies that overflowing content is actually routed through a scrollable
 * layer: the container must (a) have more content than it shows, (b) declare
 * a scrollable overflowY, and (c) accept and report a non-zero scrollTop.
 * The original scrollTop is restored before returning.
 *
 * @param locator Scroll container under max-content load.
 * @returns Structured pass/fail plus all measured scroll metrics.
 */
export async function assertScrollEngagement(locator: Locator): Promise<V2ProbeResult> {
  const evidence = await locator.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    const originalScrollTop = el.scrollTop;
    const slack = el.scrollHeight - el.clientHeight;
    const target = slack > 0 ? Math.max(1, Math.floor(slack / 2)) : 0;
    // `scroll-behavior: smooth` (e.g. Tailwind `scroll-smooth`) turns a
    // scrollTop assignment into an animation — a synchronous read-back would
    // measure the animation's start (0), not scrollability. Force instant
    // behavior for the measurement, then restore.
    const previousBehavior = el.style.scrollBehavior;
    el.style.scrollBehavior = 'auto';
    el.scrollTop = target;
    const readBack = el.scrollTop;
    el.scrollTop = originalScrollTop;
    el.style.scrollBehavior = previousBehavior;
    return {
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      overflowY: cs.overflowY,
      overflowX: cs.overflowX,
      scrollTopTarget: target,
      scrollTopReadBack: readBack,
      originalScrollTop,
    };
  });

  const violations: V2Violation[] = [];
  if (!(evidence.scrollHeight > evidence.clientHeight)) {
    violations.push({
      node: 'container',
      expected: 'scrollHeight > clientHeight (overflow routed under max-content)',
      actual: `scrollHeight=${evidence.scrollHeight} clientHeight=${evidence.clientHeight}`,
    });
  }
  if (!['auto', 'scroll'].includes(String(evidence.overflowY))) {
    violations.push({
      node: 'container',
      expected: 'computed overflowY ∈ {auto, scroll}',
      actual: `overflowY=${String(evidence.overflowY)}`,
    });
  }
  if (!(evidence.scrollTopTarget > 0 && evidence.scrollTopReadBack > 0)) {
    violations.push({
      node: 'container',
      expected: 'scrollTop settable and reads back > 0',
      actual: `target=${evidence.scrollTopTarget} readBack=${evidence.scrollTopReadBack}`,
    });
  }

  return {
    assertion: 'scroll-engagement',
    pass: violations.length === 0,
    evidence,
    violations,
  };
}

/** Evidence rows produced by {@link assertTextFloor}. */
interface TextFloorSample {
  node: string;
  textSnippet: string;
  fontSizePx: number;
}

/**
 * V2 §"getComputedStyle.fontSize ≥ floor su ogni nodo testo funzionale".
 *
 * Walks every element under `root` that directly contains a non-whitespace
 * text node ("functional text") and checks its computed fontSize against
 * `floorPx`. Non-rendered text is excluded: `display:none`,
 * `visibility:hidden/collapse`, `aria-hidden="true"`, and visually-hidden /
 * clipped helpers (1px clip-rect / clip-path) which exist for a11y only.
 *
 * @param root Panel/container subtree to audit.
 * @param floorPx Minimum allowed computed font size in CSS px (PLAN-127 floor: 11).
 * @returns Structured pass/fail; violations carry node descriptor + measured size.
 */
export async function assertTextFloor(root: Locator, floorPx: number): Promise<V2ProbeResult> {
  const { samples, checked } = await root.evaluate((rootEl, floor) => {
    const describe = (el: Element): string => {
      const htmlEl = el as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const testid = htmlEl.dataset?.testid ? `[data-testid="${htmlEl.dataset.testid}"]` : '';
      const id = htmlEl.id ? `#${htmlEl.id}` : '';
      const cls =
        typeof htmlEl.className === 'string' && htmlEl.className.trim()
          ? `.${htmlEl.className.trim().split(/\s+/).slice(0, 3).join('.')}`
          : '';
      // Owning item (e.g. roster row) for traceability back to content.
      const owner = htmlEl.closest?.('[data-resident-id]');
      const ownerTag = owner ? ` <- [data-resident-id="${owner.getAttribute('data-resident-id')}"]` : '';
      return `${tag}${id}${testid}${cls}${ownerTag}`;
    };

    const firstTextSnippet = (el: Element): string => {
      for (const node of Array.from(el.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim()) {
          return (node.textContent ?? '').trim().slice(0, 48);
        }
      }
      return '';
    };

    const isVisuallyHidden = (el: Element, cs: CSSStyleDeclaration): boolean => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 1 && rect.height <= 1) return true;
      if (cs.clip && cs.clip.replace(/\s+/g, '').startsWith('rect(0')) return true;
      if (cs.clipPath && cs.clipPath !== 'none' && rect.width <= 1 && rect.height <= 1) return true;
      return false;
    };

    const candidates: Element[] = [rootEl, ...Array.from(rootEl.querySelectorAll('*'))];
    const out: TextFloorSample[] = [];
    let checkedCount = 0;
    for (const el of candidates) {
      const hasDirectText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
      );
      if (!hasDirectText) continue;
      const cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') continue;
      if (el.getAttribute('aria-hidden') === 'true') continue;
      if (isVisuallyHidden(el, cs)) continue;
      checkedCount += 1;
      const fontSizePx = parseFloat(cs.fontSize);
      if (Number.isFinite(fontSizePx) && fontSizePx < floor - 0.01) {
        out.push({ node: describe(el), textSnippet: firstTextSnippet(el), fontSizePx });
      }
    }
    return { samples: out, checked: checkedCount };
  }, floorPx);

  const violations: V2Violation[] = samples.map((sample) => ({
    node: `${sample.node} "${sample.textSnippet}"`,
    expected: `fontSize ≥ ${floorPx}px`,
    actual: `fontSize=${sample.fontSizePx}px`,
  }));

  return {
    assertion: 'text-floor',
    pass: violations.length === 0,
    evidence: {
      floorPx,
      checkedTextNodes: checked,
      violationCount: violations.length,
      minMeasuredFontSizePx: samples.length
        ? Math.min(...samples.map((s) => s.fontSizePx))
        : null,
      samples: samples.slice(0, 25),
    },
    violations,
  };
}

/**
 * V2 §"nessun overflow orizzontale non intenzionale".
 *
 * Fails when `scrollWidth > clientWidth + tolerance` — i.e. some descendant
 * forces the box wider than its clip area. Evidence lists the first
 * descendants whose border box escapes the container rect so the offender is
 * identifiable without a screenshot.
 *
 * @param locator Content container (usually the scrolling layer itself).
 * @param options `tolerancePx` — allowed horizontal slack, default 1px.
 * @returns Structured pass/fail with scrollWidth delta + offender list.
 */
export async function assertNoHorizontalOverflow(
  locator: Locator,
  options: V2ProbeOptions = {},
): Promise<V2ProbeResult> {
  const tolerancePx = options.tolerancePx ?? DEFAULT_TOLERANCE_PX;
  const evidence = await locator.evaluate((el, tol) => {
    const describe = (node: Element): string => {
      const htmlEl = node as HTMLElement;
      const tag = node.tagName.toLowerCase();
      const testid = htmlEl.dataset?.testid ? `[data-testid="${htmlEl.dataset.testid}"]` : '';
      const id = htmlEl.id ? `#${htmlEl.id}` : '';
      const cls =
        typeof htmlEl.className === 'string' && htmlEl.className.trim()
          ? `.${htmlEl.className.trim().split(/\s+/).slice(0, 3).join('.')}`
          : '';
      return `${tag}${id}${testid}${cls}`;
    };

    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const offenders: Array<Record<string, unknown>> = [];
    for (const child of Array.from(el.querySelectorAll('*'))) {
      const r = child.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const overRight = r.right - rect.right;
      const overLeft = rect.left - r.left;
      if (overRight > tol || overLeft > tol) {
        offenders.push({
          node: describe(child),
          overRightPx: Math.round(overRight * 100) / 100,
          overLeftPx: Math.round(overLeft * 100) / 100,
          widthPx: Math.round(r.width * 100) / 100,
        });
      }
      if (offenders.length >= 15) break;
    }
    return {
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      deltaPx: el.scrollWidth - el.clientWidth,
      overflowX: cs.overflowX,
      offenders,
    };
  }, tolerancePx);

  const pass = evidence.deltaPx <= tolerancePx;
  const violations: V2Violation[] = pass
    ? []
    : [
        {
          node: 'container',
          expected: `scrollWidth ≤ clientWidth + ${tolerancePx}px`,
          actual: `scrollWidth=${evidence.scrollWidth} clientWidth=${evidence.clientWidth} (Δ${evidence.deltaPx}px, overflowX=${String(evidence.overflowX)})`,
        },
      ];

  return {
    assertion: 'no-horizontal-overflow',
    pass,
    evidence: { ...evidence, tolerancePx },
    violations,
  };
}

/**
 * V2 §"ultimo elemento contenuto visibile al massimo offset di scroll".
 *
 * Scrolls the container to `scrollHeight - clientHeight`, waits one paint
 * window (virtualized lists re-render their window on scroll), then verifies
 * that the LAST item matching `itemSelector` is inside the container's
 * visible scrollport — not parked below the fold. Works for both plain and
 * virtualized lists: in a virtualized window the last rendered item at max
 * scroll is the last content item by construction.
 *
 * @param container Scrolling element.
 * @param itemSelector Selector for one content item, relative to `container`.
 * @param options `tolerancePx` — allowed clip slack on the item's bottom edge.
 * @returns Structured pass/fail with rects + item identity evidence.
 */
export async function assertLastItemReachable(
  container: Locator,
  itemSelector: string,
  options: V2ProbeOptions = {},
): Promise<V2ProbeResult> {
  const tolerancePx = options.tolerancePx ?? 2;

  const itemCountBefore = await container.locator(itemSelector).count();
  const scrollMetrics = await container.evaluate((el) => {
    // Force instant scroll — `scroll-behavior: smooth` would animate the
    // assignment and the synchronous read-back would report the start value.
    const previousBehavior = el.style.scrollBehavior;
    el.style.scrollBehavior = 'auto';
    el.scrollTop = el.scrollHeight - el.clientHeight;
    const metrics = {
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollTopAfterSet: el.scrollTop,
      maxScrollTop: el.scrollHeight - el.clientHeight,
      itemCountAttr: el.getAttribute('data-resident-count'),
      virtualized: el.getAttribute('data-virtualized'),
    };
    el.style.scrollBehavior = previousBehavior;
    return metrics;
  });

  // Allow a virtualized window (or lazy rendering) to repaint the tail items.
  await container.page().waitForTimeout(200);

  const itemCountAfter = await container.locator(itemSelector).count();
  const lastItem = container.locator(itemSelector).last();
  const itemBox = (await lastItem.count()) > 0 ? await lastItem.boundingBox() : null;
  const containerRect = await container.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const borderTop = parseFloat(cs.borderTopWidth) || 0;
    const borderBottom = parseFloat(cs.borderBottomWidth) || 0;
    const borderLeft = parseFloat(cs.borderLeftWidth) || 0;
    const borderRight = parseFloat(cs.borderRightWidth) || 0;
    return {
      top: rect.top + borderTop,
      bottom: rect.bottom - borderBottom,
      left: rect.left + borderLeft,
      right: rect.right - borderRight,
    };
  });
  const lastItemDescriptor = (await lastItem.count()) > 0
    ? await lastItem.evaluate((el) => {
        const htmlEl = el as HTMLElement;
        const datasetId = htmlEl.dataset?.residentId ?? htmlEl.dataset?.testid ?? null;
        return {
          residentId: datasetId,
          text: (htmlEl.textContent ?? '').trim().slice(0, 60),
        };
      })
    : null;

  const evidence = {
    itemSelector,
    itemCountBeforeScroll: itemCountBefore,
    itemCountAtMaxScroll: itemCountAfter,
    ...scrollMetrics,
    lastItemBox: itemBox,
    lastItemDescriptor,
    containerClientRect: containerRect,
    tolerancePx,
  };

  const violations: V2Violation[] = [];
  if (!itemBox) {
    violations.push({
      node: itemSelector,
      expected: 'at least one item rendered at max scroll offset',
      actual: `no items matched "${itemSelector}" inside the container`,
    });
  } else {
    const itemBottom = itemBox.y + itemBox.height;
    const intersects = itemBottom > containerRect.top + tolerancePx && itemBox.y < containerRect.bottom - tolerancePx;
    const bottomInside = itemBottom <= containerRect.bottom + tolerancePx;
    if (!intersects) {
      violations.push({
        node: `last ${itemSelector}`,
        expected: 'item intersects the container scrollport at max scroll',
        actual: `itemBottom=${itemBottom.toFixed(1)} itemTop=${itemBox.y.toFixed(1)} viewport=[${containerRect.top.toFixed(1)}, ${containerRect.bottom.toFixed(1)}]`,
      });
    } else if (!bottomInside) {
      violations.push({
        node: `last ${itemSelector}`,
        expected: `item bottom within scrollport + ${tolerancePx}px tolerance`,
        actual: `itemBottom=${itemBottom.toFixed(1)} scrollportBottom=${containerRect.bottom.toFixed(1)}`,
      });
    }
  }

  return {
    assertion: 'last-item-reachable',
    pass: violations.length === 0,
    evidence,
    violations,
  };
}

/** Baseline dims for the growth-stability check, see {@link assertContainerDimsStable}. */
export interface ContainerDimsBaseline {
  clientWidth: number;
  clientHeight: number;
}

/**
 * V2 §"dims del container stabili al crescere del contenuto".
 *
 * Two responsibilities:
 * 1. Evidence: the container must be height-bounded (a `max-height` or fixed
 *    height cap) so content growth routes to scroll instead of box growth.
 * 2. When a `baseline` (captured before content growth) is supplied, the
 *    container's client dims must not drift beyond `tolerancePx`.
 *
 * @param locator Content container.
 * @param baseline Optional dims measured before max-content was injected.
 * @param options `tolerancePx` — allowed dims drift, default 1px.
 * @returns Structured pass/fail with boundedness + dims drift evidence.
 */
export async function assertContainerDimsStable(
  locator: Locator,
  baseline?: ContainerDimsBaseline,
  options: V2ProbeOptions = {},
): Promise<V2ProbeResult> {
  const tolerancePx = options.tolerancePx ?? DEFAULT_TOLERANCE_PX;
  const evidence = await locator.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      clientWidth: el.clientWidth,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      scrollWidth: el.scrollWidth,
      computedMaxHeight: cs.maxHeight,
      inlineMaxHeight: (el as HTMLElement).style.maxHeight || null,
      computedHeight: cs.height,
    };
  });

  const maxHeightValue = evidence.inlineMaxHeight ?? evidence.computedMaxHeight;
  const maxHeightPx = maxHeightValue && maxHeightValue !== 'none' ? parseFloat(String(maxHeightValue)) : null;
  const bounded = maxHeightPx !== null && Number.isFinite(maxHeightPx);

  const violations: V2Violation[] = [];
  if (!bounded) {
    violations.push({
      node: 'container',
      expected: 'height-bounded container (max-height or fixed height)',
      actual: `maxHeight=${String(maxHeightValue)}`,
    });
  } else if (evidence.clientHeight > maxHeightPx + tolerancePx) {
    violations.push({
      node: 'container',
      expected: `clientHeight ≤ maxHeight (${maxHeightPx}px + ${tolerancePx}px tol)`,
      actual: `clientHeight=${evidence.clientHeight}`,
    });
  }

  let dimsDrift: { width: number; height: number } | null = null;
  if (baseline) {
    dimsDrift = {
      width: Math.abs(evidence.clientWidth - baseline.clientWidth),
      height: Math.abs(evidence.clientHeight - baseline.clientHeight),
    };
    if (dimsDrift.width > tolerancePx || dimsDrift.height > tolerancePx) {
      violations.push({
        node: 'container',
        expected: `client dims within ${tolerancePx}px of baseline ${baseline.clientWidth}×${baseline.clientHeight}`,
        actual: `client=${evidence.clientWidth}×${evidence.clientHeight} (Δw=${dimsDrift.width}, Δh=${dimsDrift.height})`,
      });
    }
  }

  return {
    assertion: 'container-dims-stable',
    pass: violations.length === 0,
    evidence: { ...evidence, bounded, baseline: baseline ?? null, dimsDrift, tolerancePx },
    violations,
  };
}
