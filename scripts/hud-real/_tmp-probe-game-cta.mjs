import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const evalSafe = (fn) => page.evaluate(fn).catch(() => null);
const deadline = Date.now() + 420000;
let opened = false;
try {
  while (Date.now() < deadline && !opened) {
    try { await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 15000 }); }
    catch { await page.waitForTimeout(1500); continue; }
    let ready = false;
    for (let i = 0; i < 100 && !ready; i++) {
      const s = await evalSafe(() => ({
        veil: !!document.querySelector('[data-testid="game-boot-screen"]'),
        r: document.querySelector('[data-map-ready]')?.getAttribute('data-map-ready') ?? null,
      }));
      if (s === null) { await page.waitForTimeout(1500); continue; } // nav mid-eval
      if (!s.veil && s.r === '') { ready = true; break; }
      await page.waitForTimeout(1500);
    }
    if (!ready) { console.log('no ready this round'); continue; }
    const box = await page.locator('[data-quest-poi-id="poi-goblin"]:visible').first().boundingBox().catch(() => null);
    if (!box) { console.log('no poi'); continue; }
    for (let k = 0; k < 5 && !opened; k++) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2).catch(() => {});
      opened = await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 3500 }).then(() => true).catch(() => false);
    }
    if (opened) {
      await page.waitForTimeout(700);
      const info = await evalSafe(() => {
        const c = document.querySelector('[data-hudreal-cassetto]');
        const confirm = c?.querySelector('[data-testid="cassetto-confirm"]');
        return {
          disabled: confirm?.disabled ?? null,
          opacity: confirm ? getComputedStyle(confirm).opacity : null,
          reason: c?.querySelector('[data-testid="cassetto-confirm-reason"]')?.textContent?.slice(0, 60) ?? null,
        };
      });
      console.log('GAME:', JSON.stringify(info));
      await page.screenshot({ path: 'test-results/r339-cta-tokens-1440.png' }).catch((e) => console.log('shot fail', String(e).slice(0, 80)));
      break;
    }
  }
  if (!opened) console.log('never opened');
} catch (e) { console.log('probe died:', String(e).slice(0, 120)); }
await b.close().catch(() => {});
