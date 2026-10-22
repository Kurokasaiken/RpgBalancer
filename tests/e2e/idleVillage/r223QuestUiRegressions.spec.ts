import { test, expect, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { collectEnvAttestation } from '../../../scripts/verification/attestEnv';

const POI = 'poi-goblin';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
const SLOT_MEMBER = `${POI}:goblin-slot-member-1`;
const LEADER = 'hero-sir-spaccaculi';
const MEMBER = 'hero-giggiolillo';

/** Browser seams exposed by the real `/game` expedition session. */
interface QuestTestWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...args: unknown[]) => unknown>>;
    revealQuestPois?: () => void;
  };
}

/**
 * Invoke one typed expedition seam without bypassing the page's real React
 * state, DnD handlers, or panel lifecycle.
 */
const callExpedition = async <T,>(page: Page, action: string, ...args: unknown[]): Promise<T> => {
  const value = await page.evaluate(
    ({ poiId, method, methodArgs }) => {
      const expedition = (window as QuestTestWindow).__idleVillageTestHooks?.expedition?.[poiId];
      const fn = expedition?.[method];
      if (typeof fn !== 'function') throw new Error(`Missing expedition hook ${method} for ${poiId}`);
      return fn(...methodArgs);
    },
    { poiId: POI, method: action, methodArgs: args },
  );
  return value as T;
};

/** Persist run evidence when the bundle runner supplies its output directory. */
const writeEvidence = (testInfo: TestInfo, name: string, content: Buffer | string) => {
  const root = process.env.RUN_DIR;
  const output = root ? path.join(root, name) : testInfo.outputPath(name);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, content);
};

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/game');
  await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'detached', timeout: 60_000 });
  await page.waitForFunction(
    (poiId) => Boolean((window as QuestTestWindow).__idleVillageTestHooks?.expedition?.[poiId]),
    POI,
    { timeout: 30_000 },
  );
  await page.evaluate(() => (window as QuestTestWindow).__idleVillageTestHooks?.revealQuestPois?.());
  await page.keyboard.press('r');
  await expect(page.locator('[data-testid="drag-test-container"], [data-testid="resident-roster-panel"]').first()).toBeVisible({
    timeout: 15_000,
  });
  await callExpedition<void>(page, 'openDetail');
  await expect(page.getByTestId('quest-expedition-detail')).toBeVisible();
});

test('minimized planner is centered, has restore at the right, and remains closable', async ({ page }, testInfo) => {
  const panelId = `quest-expedition-${POI}`;
  const panel = page.getByTestId(`floating-panel-${panelId}`);
  await page.getByTestId(`floating-panel-minimize-${panelId}`).click();
  await expect(panel).toBeVisible();

  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  const centerError = Math.abs(box!.x + box!.width / 2 - viewport!.width / 2);
  const restore = page.getByTestId(`floating-panel-minimize-${panelId}`);
  const restoreBox = await restore.boundingBox();
  expect(restoreBox).not.toBeNull();
  const header = await restore.evaluate((element) => {
    const header = element.closest('[data-hud-controls]')?.parentElement;
    if (!header) throw new Error('Minimized header not found');
    const rect = header.getBoundingClientRect();
    return { x: rect.x, right: rect.right };
  });
  const restoreRightError = Math.abs(header.right - (restoreBox!.x + restoreBox!.width));

  writeEvidence(
    testInfo,
    'frames/minimized-planner.png',
    await page.screenshot(),
  );
  writeEvidence(
    testInfo,
    'minimized-layout.json',
    JSON.stringify({
      panel: box,
      header,
      restore: restoreBox,
      viewport,
      centerError,
      restoreRightError,
    }, null, 2),
  );

  await page.waitForTimeout(80);
  const steadyPanelBox = await panel.boundingBox();
  const env = await collectEnvAttestation(page);
  writeEvidence(
    testInfo,
    'minimized-metrics.json',
    JSON.stringify({
      env,
      samples: [
        { phase: 'after-minimize', panel: box, restore: restoreBox },
        { phase: 'settled', panel: steadyPanelBox, restore: await restore.boundingBox() },
      ],
      centerError,
      restoreRightError,
    }, null, 2),
  );

  expect.soft(centerError).toBeLessThanOrEqual(8);
  expect.soft(restoreRightError).toBeLessThanOrEqual(4);
  await expect.soft(page.getByTestId(`floating-panel-close-${panelId}`)).toBeVisible();
});

test('slot exposure shows readable 100% solo and 20%/80% for head/tail without tags', async ({ page }) => {
  await callExpedition<boolean>(page, 'assignToSlot', SLOT_LEADER, LEADER);

  const soloRisk = page.getByText('100%', { exact: true });
  await expect(soloRisk).toBeVisible();
  await expect(soloRisk).toHaveCSS('font-size', '12px');
  await expect.soft(page.locator('[data-testid^="exposure-tag-"]')).toHaveCount(0);

  await callExpedition<boolean>(page, 'assignToSlot', SLOT_MEMBER, MEMBER);
  const headRisk = page.getByText('20%', { exact: true });
  const tailRisk = page.getByText('80%', { exact: true });
  await expect(headRisk).toBeVisible();
  await expect(tailRisk).toBeVisible();
  await expect(headRisk).toHaveCSS('font-size', '12px');
  await expect(tailRisk).toHaveCSS('font-size', '12px');
});

test('bag opens the Village Stash and residents remain assignable without a companions button', async ({ page }, testInfo) => {
  await expect.soft(page.getByTestId('quest-tray-companions-toggle')).toHaveCount(0);

  await page.getByTestId('quest-open-stash').click();
  const stash = page.locator('[data-hud-panel="villageStash"]');
  await expect.soft(stash).toBeVisible();

  const samples: Array<{ phase: string; stashCount: number; stashVisible: boolean }> = [
    { phase: 'opened', stashCount: await stash.count(), stashVisible: await stash.isVisible().catch(() => false) },
  ];

  if (await stash.count()) {
    await stash.locator('button[data-skin="close"]').click();
    await expect(stash).toHaveCount(0);
  }

  await page.getByTestId('bag-slot-0').locator('button').click();
  await expect(page.getByTestId('quest-selection-tray')).toBeVisible();
  samples.push({ phase: 'tray-opened', stashCount: await stash.count(), stashVisible: await stash.isVisible().catch(() => false) });

  const env = await collectEnvAttestation(page);
  writeEvidence(testInfo, 'bag-stash-metrics.json', JSON.stringify({ env, samples }, null, 2));
});

test('roster drag keeps the medallion visible and leaves no ghost', async ({ page }, testInfo) => {
  const card = page.locator(`[data-resident-id="${MEMBER}"]`).first();
  const forecast = page.getByTestId('quest-expedition-forecast-column');
  const cardBox = await card.boundingBox();
  const forecastBox = await forecast.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(forecastBox).not.toBeNull();
  const activeOverlay = page.locator('[data-dnd-overlay][data-debug-active-id]');
  const forcedOverlay = page.locator('[data-dnd-overlay][data-forced-active-id]');
  const release = {
    x: forecastBox!.x + forecastBox!.width / 2,
    y: forecastBox!.y + forecastBox!.height / 2,
  };
  let activated = false;

  try {
    for (let attempt = 0; attempt < 3 && !activated; attempt += 1) {
      await page.mouse.move(cardBox!.x + cardBox!.width / 2, cardBox!.y + cardBox!.height / 2);
      await page.mouse.down();
      await page.mouse.move(cardBox!.x + cardBox!.width / 2 + 24, cardBox!.y + cardBox!.height / 2, { steps: 4 });
      activated = await activeOverlay.waitFor({ state: 'visible', timeout: 3_000 }).then(() => true).catch(() => false);
      if (!activated) await page.mouse.up();
    }
    expect(activated).toBe(true);
    const medal = activeOverlay.locator('.tok-svg');
    await expect(medal).toBeVisible();
    const state = await medal.evaluate((element) => ({
      visibility: getComputedStyle(element).visibility,
      portraitHref: element.querySelector('image')?.getAttribute('href') ?? null,
    }));
    writeEvidence(testInfo, 'frames/drag-medal-dragging.png', await page.screenshot());
    writeEvidence(testInfo, 'drag-medal-visibility.json', JSON.stringify(state, null, 2));
    expect(state.visibility).toBe('visible');
    expect(state.portraitHref).toBeTruthy();

    await page.mouse.move(release.x, release.y, { steps: 8 });
  } finally {
    await page.evaluate(() => {
      const win = window as Window & {
        __r223ReturnAnimations?: Array<{
          keyframes: Keyframe[] | PropertyIndexedKeyframes;
          options?: KeyframeAnimationOptions | number;
          rect: { x: number; y: number; width: number; height: number };
          medal: { x: number; y: number; width: number; height: number };
          base: { left: number; top: number };
        }>;
        __r223ReturnAnimateOriginal?: typeof Element.prototype.animate;
      };
      win.__r223ReturnAnimations = [];
      if (!win.__r223ReturnAnimateOriginal) win.__r223ReturnAnimateOriginal = Element.prototype.animate;
      Element.prototype.animate = function patchedAnimate(keyframes, options) {
        const rect = this.getBoundingClientRect();
        const medalRect = this.querySelector('.tok-svg')?.getBoundingClientRect() ?? rect;
        win.__r223ReturnAnimations?.push({
          keyframes,
          options,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          medal: { x: medalRect.x, y: medalRect.y, width: medalRect.width, height: medalRect.height },
          base: {
            left: Number.parseFloat(this.style.left || '0'),
            top: Number.parseFloat(this.style.top || '0'),
          },
        });
        return win.__r223ReturnAnimateOriginal!.call(this, keyframes, options);
      };
    });
    await page.mouse.up();
  }

  /* The roster must not mount the centered forced proxy after release: the
   * returning clone, while it exists, starts at the actual release point.
   * The clone may already be mid-flight when Playwright reads the DOM, so the
   * authoritative check is the first Web Animations keyframe, not the live box. */
  await expect(forcedOverlay).toHaveCount(0);
  const returnEvidence = await page.evaluate(() => {
    const overlay = document.querySelector<HTMLElement>('[data-dnd-overlay][data-debug-active-id]');
    const animations = overlay?.getAnimations().map((animation) => {
      const effect = animation.effect;
      const keyframes = effect instanceof KeyframeEffect ? effect.getKeyframes() : [];
      return {
        currentTime: typeof animation.currentTime === 'number' ? animation.currentTime : null,
        keyframes,
      };
    }) ?? [];
    return {
      rect: overlay ? (() => {
        const rect = overlay.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })() : null,
      animations,
      recorded: (window as Window & {
        __r223ReturnAnimations?: Array<{
          keyframes: Keyframe[] | PropertyIndexedKeyframes;
          options?: KeyframeAnimationOptions | number;
          rect: { x: number; y: number; width: number; height: number };
          medal: { x: number; y: number; width: number; height: number };
          base: { left: number; top: number };
        }>;
      }).__r223ReturnAnimations ?? [],
    };
  });
  await page.evaluate(() => {
    const win = window as Window & { __r223ReturnAnimateOriginal?: typeof Element.prototype.animate };
    if (win.__r223ReturnAnimateOriginal) Element.prototype.animate = win.__r223ReturnAnimateOriginal;
  });

  const samples = [
    { phase: 'release', rect: returnEvidence?.rect ?? null },
    { phase: 'settling', rect: await activeOverlay.first().boundingBox().catch(() => null) },
  ];
  await page.waitForTimeout(80);
  samples.push({ phase: 'late', rect: await activeOverlay.first().boundingBox().catch(() => null) });
  const env = await collectEnvAttestation(page);
  writeEvidence(
    testInfo,
    'return-metrics.json',
    JSON.stringify({
      env,
      release,
      samples,
      animations: returnEvidence.recorded.length ? returnEvidence.recorded : returnEvidence.animations,
    }, null, 2),
  );

  const recordedAnimation = returnEvidence.recorded.find((entry) =>
    Array.isArray(entry.keyframes)
    && entry.keyframes.length >= 2
    && /translate(?:3d)?\(/.test(String(entry.keyframes[0]?.transform ?? '')),
  );
  expect(recordedAnimation, 'returning overlay did not expose a Web Animations keyframe pair').toBeTruthy();
  const returnKeyframes = recordedAnimation!.keyframes as Keyframe[];
  const first = returnKeyframes[0];
  const match = String(first.transform).match(/translate(?:3d)?\((-?[\d.]+)px,\s*(-?[\d.]+)px/);
  expect(match, `unexpected return start transform: ${String(first.transform)}`).not.toBeNull();
  const expected = {
    x: release.x - recordedAnimation!.medal.width / 2 - recordedAnimation!.base.left,
    y: release.y - recordedAnimation!.medal.height / 2 - recordedAnimation!.base.top,
  };
  expect(Number(match![1])).toBeCloseTo(expected.x, 0);
  expect(Number(match![2])).toBeCloseTo(expected.y, 0);

  await page.waitForTimeout(350);
  await expect(activeOverlay).toHaveCount(0);
  await expect(forcedOverlay).toHaveCount(0);
});

test('assigned medallion stays visible until the extraction flight starts', async ({ page }, testInfo) => {
  await callExpedition<boolean>(page, 'assignToSlot', SLOT_LEADER, LEADER);
  const slot = page.getByTestId(`slot-button-${SLOT_LEADER}`);
  const box = await slot.boundingBox();
  expect(box).not.toBeNull();
  const medal = page.getByTestId(`slot-medal-${SLOT_LEADER}`);

  await slot.dispatchEvent('mousedown', {
    button: 0,
    clientX: box!.x + box!.width / 2,
    clientY: box!.y + box!.height / 2,
  });
  await expect(slot).toHaveAttribute('data-extracting', 'true');
  await page.waitForTimeout(250);
  const visibility = await medal.evaluate((element) => {
    const computed = getComputedStyle(element);
    const token = element.querySelector<HTMLElement>('.tok-svg');
    return {
      opacity: computed.getPropertyValue('opacity'),
      className: element.getAttribute('class'),
      tokenVisibility: token ? getComputedStyle(token).visibility : null,
      portraitHref: token?.querySelector('image')?.getAttribute('href') ?? null,
    };
  });
  writeEvidence(testInfo, 'frames/extraction-medallion.png', await page.screenshot());
  writeEvidence(testInfo, 'extraction-visibility.json', JSON.stringify(visibility, null, 2));
  expect(Number.parseFloat(visibility.opacity)).toBeGreaterThan(0.95);
  expect(visibility.tokenVisibility).toBe('visible');
  expect(visibility.portraitHref).toBeTruthy();
});

test('forecast recomputes on each party change and records compute timing', async ({ page }, testInfo) => {
  const forecast = page.getByTestId('quest-expedition-forecast');
  await callExpedition<boolean>(page, 'assignToSlot', SLOT_LEADER, LEADER);
  await expect(forecast).toHaveAttribute('data-forecast-state', 'ready', { timeout: 5_000 });

  const samples: Array<{
    totalMs: number;
    computeMs: number;
    attempts: number;
    aborted: number;
    chunks: Array<{ workMs: number; yieldMs: number }>;
  }> = [];
  let memberAssigned = false;
  for (let sample = 0; sample < 5; sample += 1) {
    const startedAt = Date.now();
    if (memberAssigned) await callExpedition<void>(page, 'clearSlot', SLOT_MEMBER);
    else await callExpedition<boolean>(page, 'assignToSlot', SLOT_MEMBER, MEMBER);
    await expect(forecast).toHaveAttribute('data-forecast-state', 'ready', { timeout: 5_000 });
    const timing = await callExpedition<{
      durationMs: number | null;
      attempts: number;
      aborted: number;
      chunks: Array<{ workMs: number; yieldMs: number }>;
    }>(page, 'getForecastTiming');
    expect(timing.durationMs).not.toBeNull();
    expect(timing.attempts).toBe(1);
    samples.push({
      totalMs: Date.now() - startedAt,
      computeMs: timing.durationMs!,
      attempts: timing.attempts,
      aborted: timing.aborted,
      chunks: timing.chunks,
    });
    memberAssigned = !memberAssigned;
  }

  const p95 = (key: 'totalMs' | 'computeMs') =>
    [...samples.map((sample) => sample[key])].sort((a, b) => a - b)[Math.ceil(samples.length * 0.95) - 1];
  const chunks = samples.flatMap((sample) => sample.chunks);
  const env = await collectEnvAttestation(page);
  const metrics = {
    env,
    samples,
    totalP95Ms: p95('totalMs'),
    computeP95Ms: p95('computeMs'),
    maxChunkWorkMs: chunks.length ? Math.max(...chunks.map((chunk) => chunk.workMs)) : 0,
    maxChunkYieldMs: chunks.length ? Math.max(...chunks.map((chunk) => chunk.yieldMs)) : 0,
    headed: false,
  };
  writeEvidence(testInfo, 'forecast-metrics.json', JSON.stringify(metrics, null, 2));
  expect(Number.isFinite(metrics.computeP95Ms)).toBe(true);
  expect(metrics.computeP95Ms).toBeGreaterThan(0);
  expect(chunks.length).toBeGreaterThan(0);
  if (process.env.PLAYWRIGHT_NODE_ENV === 'production') {
    expect(metrics.computeP95Ms).toBeLessThanOrEqual(300);
    expect(metrics.maxChunkWorkMs).toBeLessThan(50);
  }
});
