import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
let navs = 0;
page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs++; });
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
const evalSafe = (fn) => page.evaluate(fn).catch(() => null);
let lastPhase = null;
const deadline = Date.now() + 300000;
let veilGone = false;
while (Date.now() < deadline && !veilGone) {
  const s = await evalSafe(() => {
    const veil = document.querySelector('[data-testid="game-boot-screen"]');
    return {
      veil: !!veil,
      phase: veil?.getAttribute('data-boot-phase') ?? null,
      mapReady: document.querySelector('[data-map-ready]')?.getAttribute('data-map-ready') ?? null,
    };
  });
  if (s && s.phase !== lastPhase) { lastPhase = s.phase; console.log(`t+${((300000 - (deadline - Date.now())) / 1000) | 0}s navs=${navs}`, JSON.stringify(s)); }
  if (s && !s.veil && s.mapReady === '') { veilGone = true; break; }
  if (s && !s.veil) { /* veil absent pre-mount or gone — keep polling a bit */ }
  await page.waitForTimeout(2000);
}
console.log('veilGone:', veilGone, 'navs:', navs, 'lastPhase:', lastPhase);
await page.waitForTimeout(1500);
const box = await page.locator('[data-quest-poi-id="poi-goblin"]:visible').first().boundingBox().catch(() => null);
console.log('poi box:', JSON.stringify(box));
if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
let opened = await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 8000 }).then(() => true).catch(() => false);
console.log('cassetto opened:', opened);
if (!opened) {
  await page.screenshot({ path: 'test-results/r339-cta-fail.png' });
  console.log('errors:', errors.slice(0, 8));
  await b.close(); process.exit(1);
}
await page.waitForTimeout(900);
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
    textShadow: text ? getComputedStyle(text).textShadow : null,
    sheenBackground: sheen ? getComputedStyle(sheen).backgroundImage.slice(0, 90) : null,
    scopedHasTokens: (styleEl?.textContent ?? '').includes('var(--skin-cassetto-cta-'),
    tokenOnRoot: getComputedStyle(document.documentElement).getPropertyValue('--skin-cassetto-cta-muted-opacity').trim(),
    reason: c?.querySelector('[data-testid="cassetto-confirm-reason"]')?.textContent ?? null,
  };
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: 'test-results/r339-cta-tokens-1440.png' });
console.log('errors:', errors.length, errors.slice(0, 5));
await b.close();
