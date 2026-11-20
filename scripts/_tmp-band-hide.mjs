import { chromium } from 'playwright';
const b = await chromium.launch({ timeout: 240000, headless: true, args: ['--use-angle=metal', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
await p.goto('http://localhost:5173/?frame=thin', { timeout: 120000 });
await p.locator('[data-testid="game-mappa2"]').waitFor({ state: 'visible', timeout: 120000 });
await p.locator('[data-testid="game-boot-screen"]').waitFor({ state: 'detached', timeout: 240000 });
await p.waitForTimeout(2000);
await p.keyboard.press('r'); await p.waitForTimeout(600);
await p.keyboard.press('v'); await p.waitForTimeout(1500);
const info = await p.evaluate(() => {
  return [...document.querySelectorAll('[data-hud-scroll-band]')].map((s) => {
    const band = s.parentElement?.querySelector('[data-hud-band]') ?? document.querySelector('[data-hud-band]');
    return {
      panel: s.closest('[data-stage-panel]')?.getAttribute('data-stage-panel') ?? s.closest('[data-hud-panel]')?.getAttribute('data-hud-panel') ?? '?',
      scrollH: s.scrollHeight,
      clientH: s.clientHeight,
      overflows: s.scrollHeight > s.clientHeight + 1,
      bandVisible: band ? getComputedStyle(band).visibility : 'missing',
    };
  });
});
console.log(JSON.stringify(info, null, 1));
await p.screenshot({ path: '.mw/runs/20261120-verify-frame7/gemma-1440.png', timeout: 60000 });
await b.close();
