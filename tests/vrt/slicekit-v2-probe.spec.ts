/**
 * PLAN-127 §5 — V2 content-invariant probe (slice-kit pipeline).
 *
 * Structural DOM assertions against a real mounted HUD surface — the `/`
 * (game) surface roster panel (`resident-roster-panel` → `DragTestContainerV2`
 * scroll list, density=compact, mounted via `panels.set('roster')` / the `r`
 * HUD shortcut) — loaded under adversarial max-content.
 *
 * Max-content strategy: this surface's roster is bound to the static
 * canonical bundle (`canonicalResidentData`, 6 residents) — the
 * `seedResidents` hook only exists inside the unmounted VillageSandbox — so
 * the probe grows the list by DOM injection (cloning rendered rows inside
 * the scroll layer, PLAN-127-sanctioned "fixture normali + max-content
 * avversarie"). The injected clones are measured facts about the LAYOUT
 * (scroll routing, clip, rects), not about React state.
 *
 * This is a MEASUREMENT probe: V2 verdicts are collected and attached as
 * structured evidence, never turned into hard test assertions. First-pass
 * failures on the baked implementation are expected — they are the evidence
 * the pipeline needs (PLAN-127 §5 "V1/V2/V3 first-pass failures → final
 * pass").
 *
 * NOTE: intentionally does NOT import `tests/fixtures/villageSandbox` — that
 * fixture crashes at module load (`DEFAULT_IDLE_VILLAGE_CONFIG.activities.
 * job_punch_training` moved to `verbSandboxPreset`, pre-existing breakage).
 *
 * Run:
 *   npm run dev   # canonical dev server on :5173
 *   npx playwright test --config tests/vrt/playwright.v2-probe.config.ts
 *
 * Artifacts:
 *   - test-results/slicekit/night-shift/v2-probe-results.json (full verdict matrix)
 *   - test.info() attachment "v2-probe-results"
 */

import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  assertScrollEngagement,
  assertTextFloor,
  assertNoHorizontalOverflow,
  assertLastItemReachable,
  assertContainerDimsStable,
  type V2ProbeResult,
  type ContainerDimsBaseline,
} from '../helpers/v2-invariants';

const ROSTER_PANEL_SELECTOR = '[data-testid="resident-roster-panel"]';
/** The scrollable list layer inside DragTestContainerV2 (carries data-resident-count). */
const SCROLL_CONTAINER_SELECTOR = `${ROSTER_PANEL_SELECTOR} [data-resident-count]`;
const ITEM_SELECTOR = '[data-resident-id]';
const MAX_CONTENT_COUNT = 60;
/** PLAN-127 §5 floor for functional text: 11px. */
const TEXT_FLOOR_PX = 11;
const RESULTS_DIR = join(process.cwd(), 'test-results', 'slicekit', 'night-shift');
const RESULTS_FILE = join(RESULTS_DIR, 'v2-probe-results.json');

/** Adversarial long strings (localized-length + one unbroken token). */
const ADVERSARIAL_STRINGS = [
  'Alessandro della Lunga Veglia Notturna del Presidio Orientale',
  'Sentinella-Della-Lunga-Veglia-Notturna-E-Oltre-I-Confini-Del-Regno',
];

/**
 * Boots `/` (game landing, R-328) and opens the roster panel via the `r`
 * HUD shortcut (hudPanelRegistry → stage.api.toggle('roster')).
 */
async function bootGameSurfaceWithRoster(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Wait for the game surface boot (Pixi map + HUD chrome). The roster panel
  // mounts only after panels.set('roster', true) — pressed via the keyboard
  // registry so we exercise the real path.
  await page.keyboard.press('r');
  const panel = page.locator(ROSTER_PANEL_SELECTOR);
  try {
    await expect(panel).toBeVisible({ timeout: 20_000 });
  } catch (error) {
    const stage = await page.evaluate(() => ({
      url: window.location.href,
      ready: (window as { __idleVillageReady?: boolean }).__idleVillageReady ?? null,
      panels: Array.from(document.querySelectorAll('[data-panel]')).map((el) =>
        el.getAttribute('data-panel'),
      ),
    }));
    console.warn('[V2-PROBE] roster panel did not open via `r`; page state:', stage);
    throw error;
  }
}

/**
 * Grows the scroll layer to `targetCount` items by cloning rendered rows,
 * then injects adversarial long strings into two clones (first text-bearing
 * descendant each) to stress horizontal overflow / text floor.
 */
async function injectMaxContent(page: Page, targetCount: number) {
  return page
    .locator(SCROLL_CONTAINER_SELECTOR)
    .evaluate(
      (el, { target, strings }) => {
        const items = Array.from(el.querySelectorAll<HTMLElement>('[data-resident-id]'));
        const base = items.length;
        if (!base) return { base: 0, total: 0 };
        const clones: HTMLElement[] = [];
        let total = base;
        let sourceIndex = 0;
        while (total < target) {
          const source = items[sourceIndex % base];
          const clone = source.cloneNode(true) as HTMLElement;
          clone.setAttribute('data-resident-id', `v2probe-clone-${total}`);
          clones.push(clone);
          el.appendChild(clone);
          total += 1;
          sourceIndex += 1;
        }
        // Adversarial long strings into the first text-bearing descendant of
        // two clones — stresses wrap/clip behaviour on real layout.
        const overwriteText = (root: HTMLElement, text: string) => {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          const first = walker.nextNode();
          if (first) first.textContent = text;
        };
        if (clones[0]) overwriteText(clones[0], strings[0]);
        if (clones[1]) overwriteText(clones[1], strings[1]);
        return { base, total };
      },
      { target: targetCount, strings: ADVERSARIAL_STRINGS },
    );
}

const snapshotDims = async (page: Page): Promise<ContainerDimsBaseline | null> => {
  const container = page.locator(SCROLL_CONTAINER_SELECTOR);
  if ((await container.count()) === 0) return null;
  return container.evaluate((el) => ({
    clientWidth: el.clientWidth,
    clientHeight: el.clientHeight,
  }));
};

test.describe('PLAN-127 V2 content invariants — roster panel probe', () => {
  test('roster scroll layer under max-content load', async ({ page }, testInfo) => {
    await bootGameSurfaceWithRoster(page);

    const scrollContainer = page.locator(SCROLL_CONTAINER_SELECTOR);
    const rosterPanel = page.locator(ROSTER_PANEL_SELECTOR);
    await expect(scrollContainer).toBeVisible({ timeout: 10_000 });

    // Baseline dims at shipped content (6 residents), for the growth check.
    const baselineDims = await snapshotDims(page);

    // Inject adversarial max-content.
    const injection = await injectMaxContent(page, MAX_CONTENT_COUNT);
    console.log(`[V2-PROBE] DOM injection: ${injection.base} base → ${injection.total} rows`);
    // Give layout a beat to settle after the DOM growth.
    await page.waitForTimeout(150);

    const results: V2ProbeResult[] = [];

    await test.step('assertScrollEngagement', async () => {
      results.push(await assertScrollEngagement(scrollContainer));
    });

    await test.step('assertTextFloor (roster panel, floor=11px)', async () => {
      results.push(await assertTextFloor(rosterPanel, TEXT_FLOOR_PX));
    });

    await test.step('assertNoHorizontalOverflow (scroll layer)', async () => {
      results.push(await assertNoHorizontalOverflow(scrollContainer));
    });

    await test.step('assertNoHorizontalOverflow (whole panel)', async () => {
      results.push(await assertNoHorizontalOverflow(rosterPanel));
    });

    await test.step('assertLastItemReachable', async () => {
      results.push(await assertLastItemReachable(scrollContainer, ITEM_SELECTOR));
      // Restore scroll position for subsequent evidence/screenshots.
      await scrollContainer.evaluate((el) => {
        el.scrollTop = 0;
      });
    });

    await test.step('assertContainerDimsStable', async () => {
      results.push(
        await assertContainerDimsStable(scrollContainer, baselineDims ?? undefined),
      );
    });

    const summary = results.map((r) => ({
      assertion: r.assertion,
      pass: r.pass,
      violations: r.violations.length,
    }));

    // Persist the full verdict matrix for the night-shift report.
    const payload = {
      surface: 'game landing roster panel (resident-roster-panel → DragTestContainerV2, density=compact)',
      scrollContainer: SCROLL_CONTAINER_SELECTOR,
      itemSelector: ITEM_SELECTOR,
      maxContent: { mode: 'dom-injection (row cloning)', ...injection, adversarialStrings: ADVERSARIAL_STRINGS },
      textFloorPx: TEXT_FLOOR_PX,
      viewport: page.viewportSize(),
      timestamp: new Date().toISOString(),
      summary,
      results,
    };
    mkdirSync(RESULTS_DIR, { recursive: true });
    writeFileSync(RESULTS_FILE, JSON.stringify(payload, null, 2));
    await testInfo.attach('v2-probe-results', {
      body: JSON.stringify(payload, null, 2),
      contentType: 'application/json',
    });

    // Console verdict table — the probe itself stays green; V2 verdicts are evidence.
    console.log('[V2-PROBE] verdict matrix:');
    for (const row of summary) {
      console.log(
        `[V2-PROBE]   ${row.pass ? 'PASS' : 'FAIL'}  ${row.assertion}  (violations: ${row.violations})`,
      );
    }
    console.log(`[V2-PROBE] results written to ${RESULTS_FILE}`);

    testInfo.annotations.push({
      type: 'v2-probe-verdicts',
      description: JSON.stringify(summary),
    });

    // Harness sanity (not a V2 verdict): the probe must have actually measured something.
    expect(injection.total, 'max-content injection reached target').toBe(MAX_CONTENT_COUNT);
    expect(results.length, 'all V2 assertions executed').toBe(6);
    expect(
      results.every((r) => r.evidence && Object.keys(r.evidence).length > 0),
      'every assertion produced evidence',
    ).toBe(true);
  });
});
