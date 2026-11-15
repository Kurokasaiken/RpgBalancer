/**
 * R-339/PLAN-119 T1 witness — lab + /game probes that the CONFIRM plaque
 * reads the new --skin-cassetto-cta-* tokens (computed style proves the
 * var() chain resolves through applySkinCssVariables on the live page).
 * Headless only (16-no-foreground-windows). Screenshots → test-results/.
 */
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const errors = [];

/* ── Lab witness (deterministic): /hud-compose?comp=cassetto ─────────── */
{
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push('lab: ' + e));
  await page.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 30000 });
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => {
    const c = document.querySelector('[data-hudreal-cassetto]');
    const confirm = c?.querySelector('[data-testid="cassetto-confirm"]');
    const text = confirm?.querySelector('.confirm-text');
    const sheen = confirm?.querySelector('.confirm-sheen');
    const styleEl = c?.querySelector('style');
    return {
      disabled: confirm?.disabled ?? null,
      opacity: confirm ? getComputedStyle(confirm).opacity : null,
      textColor: text ? getComputedStyle(text).color : null,
      sheenBackground: sheen ? getComputedStyle(sheen).backgroundImage.slice(0, 80) : null,
      scopedHasTokens: (styleEl?.textContent ?? '').includes('var(--skin-cassetto-cta-'),
      tokenOnRoot: getComputedStyle(document.documentElement).getPropertyValue('--skin-cassetto-cta-muted-opacity').trim(),
    };
  });
  console.log('LAB:', JSON.stringify(info));
  await page.screenshot({ path: 'test-results/r339-cta-tokens-lab.png' });
  await page.close();
}

/* ── /game witness (best-effort — foreign HMR reloads tolerated) ─────── */
{
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push('game: ' + e));
  const evalSafe = (fn) => page.evaluate(fn).catch(() => null);
  let opened = false;
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline && !opened) {
    try {
      await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch { await page.waitForTimeout(2000); continue; }
    /* veil must mount first, then exit — poll up to 60s */
    let sawReady = false;
    for (let i = 0; i < 40 && !sawReady; i++) {
      const s = await evalSafe(() => ({
        veil: !!document.querySelector('[data-testid="game-boot-screen"]'),
        ready: document.querySelector('[data-map-ready]')?.getAttribute('data-map-ready') ?? null,
      }));
      if (s && !s.veil && s.ready === '') { sawReady = true; break; }
      await page.waitForTimeout(1500);
    }
    if (!sawReady) { console.log('boot not ready, retry'); continue; }
    const box = await page.locator('[data-quest-poi-id="poi-goblin"]:visible').first().boundingBox().catch(() => null);
    if (!box) { console.log('no poi box, retry'); continue; }
    for (let click = 0; click < 4 && !opened; click++) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2).catch(() => {});
      opened = await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 4000 }).then(() => true).catch(() => false);
    }
    if (opened) {
      await page.waitForTimeout(800);
      const info = await evalSafe(() => {
        const c = document.querySelector('[data-hudreal-cassetto]');
        const confirm = c?.querySelector('[data-testid="cassetto-confirm"]');
        const text = confirm?.querySelector('.confirm-text');
        const styleEl = c?.querySelector('style');
        return {
          disabled: confirm?.disabled ?? null,
          opacity: confirm ? getComputedStyle(confirm).opacity : null,
          textColor: text ? getComputedStyle(text).color : null,
          scopedHasTokens: (styleEl?.textContent ?? '').includes('var(--skin-cassetto-cta-'),
          reason: c?.querySelector('[data-testid="cassetto-confirm-reason"]')?.textContent ?? null,
        };
      });
      console.log('GAME:', JSON.stringify(info));
      await page.screenshot({ path: 'test-results/r339-cta-tokens-1440.png' });
    }
  }
  if (!opened) {
    await page.screenshot({ path: 'test-results/r339-cta-fail.png' }).catch(() => {});
    console.log('GAME: cassetto never opened (foreign reloads)');
  }
  await page.close();
}
console.log('errors:', errors.length, errors.slice(0, 6));
await b.close();
