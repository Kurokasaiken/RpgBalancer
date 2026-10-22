/**
 * /game invasion — the whole scene after the player confirms, sampled frame by frame (R-185, incident 2026-10-14).
 * The older specs check the curtains, the card position and the clock; none of them looked at what the Director saw
 * in the screen recording: one goblin, a visible peel, a steady map, the card folding into the ledger row.
 */
import { expect, test, type Page } from '@playwright/test';

type HooksWindow = Window & {
  __idleVillageTestHooks?: { startInvasion?: () => void; getInvasion?: () => { currentDay: number } | null };
};

interface Sample {
  t: number;
  /** Game day at the sample: the goblin's own march steps once per day, so the camera is judged within one day. */
  day: number;
  /** Visible goblin sprites outside the case: the detached sticker and the map marker. */
  sticker: { cx: number; cy: number; w: number } | null;
  marker: { cx: number; cy: number; visible: boolean } | null;
  caseGoblin: { cx: number; cy: number } | null;
  card: { w: number; h: number; opacity: number } | null;
  row: { w: number; opacity: number } | null;
}

const sample = (page: Page, t0: number): Promise<Sample> =>
  page.evaluate((start) => {
    const rect = (el: Element | null) => (el ? el.getBoundingClientRect() : null);
    const visible = (el: Element) => Number(getComputedStyle(el).opacity) > 0.05;
    const imgs = [...document.querySelectorAll('img')].filter((i) => /goblin-march|no-sticker/.test(i.src));
    const outside = imgs.filter((i) => !i.closest('[data-testid="world-event-card-body"]') && i.dataset.testid !== 'invasion-goblin-marker');
    const stickerEl = outside.find(visible);
    const sr = rect(stickerEl ?? null);
    const markerEl = document.querySelector('[data-testid="invasion-goblin-marker"]');
    const mr = rect(markerEl);
    const caseEl = imgs.find((i) => i.dataset.testid === 'goblin-window-sticker' && visible(i));
    const cr = rect(caseEl ?? null);
    const cardEl = document.querySelector('[data-testid="world-event-card-body"]');
    const kr = rect(cardEl);
    const rowEl = document.querySelector('[data-event-id="invasion"]');
    const rr = rect(rowEl);
    return {
      t: Date.now() - start,
      day: (window as HooksWindow).__idleVillageTestHooks?.getInvasion?.()?.currentDay ?? -1,
      sticker: sr ? { cx: sr.x + sr.width / 2, cy: sr.y + sr.height / 2, w: sr.width } : null,
      marker: mr && markerEl ? { cx: mr.x + mr.width / 2, cy: mr.y + mr.height / 2, visible: visible(markerEl) } : null,
      caseGoblin: cr ? { cx: cr.x + cr.width / 2, cy: cr.y + cr.height / 2 } : null,
      card: kr && cardEl ? { w: kr.width, h: kr.height, opacity: Number(getComputedStyle(cardEl).opacity) } : null,
      row: rr && rowEl ? { w: rr.width, opacity: Number(getComputedStyle(rowEl).opacity) } : null,
    };
  }, t0);

test.describe('invasion scene after the confirmation', () => {
  test.use({ locale: 'en-US', viewport: { width: 1440, height: 900 } });

  // INV:CTR-game-004.INV-1
  // INV:CTR-game-004.INV-2
  // INV:CTR-game-004.INV-3
  // INV:CTR-game-004.INV-4
  // INV:CTR-game-004.INV-5
  // INV:goblin-invasion-window.INV-1
  test('one goblin at a time, a steady map, and the card folds into a ledger row that stays', async ({ page }) => {
    await page.goto('/game');
    await page.waitForFunction(() => (window as HooksWindow).__idleVillageTestHooks?.startInvasion, { timeout: 60_000 });
    // Boot + warm-up of the card, as a player would have by the time an invasion arrives.
    await page.waitForTimeout(8_000);
    await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.startInvasion?.());
    const button = page.locator('[data-testid="world-event-card-body"] button');
    await button.waitFor({ timeout: 15_000 });
    await page.waitForTimeout(1_200);

    const before = await sample(page, Date.now());
    expect(before.marker, 'no goblin on the map before the player confirms').toBeNull();

    const t0 = Date.now();
    await button.click();
    const samples: Sample[] = [];
    while (Date.now() - t0 < 4_500) {
      samples.push(await sample(page, t0));
      await page.waitForTimeout(80);
    }
    const last = samples[samples.length - 1];

    // 1. One goblin: the detached sticker and the map marker are never visible together.
    for (const s of samples) {
      expect(Boolean(s.sticker) && Boolean(s.marker?.visible), `sticker and marker together at ${s.t}ms`).toBe(false);
    }
    // ...and the marker is hidden until the sticker lands, then it is the only goblin left.
    expect(last.marker?.visible).toBe(true);
    expect(last.sticker).toBeNull();

    // 2. The sticker starts exactly where the case's own goblin was (no pop to another size or place).
    const firstSticker = samples.find((s) => s.sticker);
    const lastCase = [...samples].reverse().find((s) => s.caseGoblin);
    expect(firstSticker, 'the goblin detaches as a sticker').toBeTruthy();
    expect(lastCase, 'the case shows the goblin while it peels').toBeTruthy();
    expect(Math.hypot(firstSticker!.sticker!.cx - lastCase!.caseGoblin!.cx, firstSticker!.sticker!.cy - lastCase!.caseGoblin!.cy)).toBeLessThan(12);

    // 3. The map does not move: the marker's (hidden or visible) screen position holds still through the scene.
    // (The marker itself steps once per game day; compare only samples taken within the same day.)
    const day0 = samples.find((s) => s.marker && s.day >= 0)?.day;
    const still = samples.filter((s) => s.marker && s.day === day0);
    expect(still.length, 'enough samples within one game day').toBeGreaterThan(10);
    const xs = still.map((s) => s.marker!.cx);
    const ys = still.map((s) => s.marker!.cy);
    expect(Math.max(...xs) - Math.min(...xs), 'camera moved horizontally').toBeLessThan(4);
    expect(Math.max(...ys) - Math.min(...ys), 'camera moved vertically').toBeLessThan(4);

    // 4. The ledger row is there at the end, fully shown, and still there a moment later.
    expect(last.row?.opacity).toBeGreaterThan(0.95);
    await page.waitForTimeout(2_500);
    const later = await sample(page, t0);
    expect(later.row?.opacity, 'the ledger stays open after the scene').toBeGreaterThan(0.95);

    // 5. The card folded into the row: it shrank to the row's size before fading, instead of fading where it stood.
    const smallestCard = Math.min(...samples.filter((s) => s.card && s.card.opacity > 0.9).map((s) => s.card!.h));
    expect(smallestCard, 'the card collapses toward the row').toBeLessThan(90);
  });
});
