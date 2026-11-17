import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const out = {};

const waitBoot = async (page) => {
  await page.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), null, { timeout: 300000, polling: 1000 });
  for (let i = 0; i < 40; i++) {
    const ok = await page.evaluate(() => document.querySelector('[data-testid="game-top-chrome"]') !== null);
    if (ok) return;
    await page.waitForTimeout(1500);
  }
};

for (const [name, width, height] of [['desktop', 1440, 900], ['wide', 1920, 1080]]) {
  const p = await b.newPage({ viewport: { width, height } });
  p.on('pageerror', e => console.log(`[${name} pageerror]`, String(e).slice(0, 300)));
  p.on('console', m => { if (m.type() === 'error') console.log(`[${name} console.error]`, m.text().slice(0, 300)); });
  await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(5000);
  await waitBoot(p);
  await p.waitForTimeout(3000);
  out[name] = await p.evaluate(() => {
    const res = document.querySelector('[data-testid="chrome-resources"]')?.getBoundingClientRect();
    const banner = document.querySelector('[data-testid="chrome-day-banner"]')?.getBoundingClientRect();
    if (!res || !banner) return null;
    const centre = res.left + res.width / 2;
    return {
      viewportW: window.innerWidth,
      resCenter: Math.round(centre),
      frameCenter: window.innerWidth / 2,
      centreDelta: Math.round(centre - window.innerWidth / 2),
      resLeft: Math.round(res.left), resRight: Math.round(res.right),
      bannerLeft: Math.round(banner.left), bannerRight: Math.round(banner.right),
      clearsReserve: res.right <= window.innerWidth - 360 + 0.5,
      /* R-350 fix: the pair is adjacent — banner right + gapPx = bar left. */
      pairGap: Math.round(res.left - banner.right),
      isPair: Math.abs(res.left - banner.right - 10) <= 1.5,
      noOverlap: banner.right <= res.left + 0.5,
      chips: document.querySelectorAll('[data-hr-res]').length,
    };
  });
  await p.evaluate(() => document.querySelector('[data-testid="game-boot-screen"]')?.remove());
  await p.screenshot({ path: `test-results/r350-resources-centre-${width}.png`, clip: { x: 0, y: 0, width, height: 130 } });
  await p.close();
}
console.log(JSON.stringify(out, null, 2));
await b.close();
