import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), null, { timeout: 300000, polling: 1000 }).catch(() => {});
for (let i = 0; i < 40; i++) {
  if (await p.evaluate(() => document.querySelector('[data-testid="game-top-chrome"]') !== null)) break;
  await p.waitForTimeout(1500);
}
await p.waitForTimeout(2000);
const r = await p.evaluate(() => {
  const res = document.querySelector('[data-testid="chrome-resources"]').getBoundingClientRect();
  const mirror = document.querySelector('[data-testid="chrome-res-cap-mirror"]').getBoundingClientRect();
  const chip = document.querySelector('[data-hr-res="gold"]').getBoundingClientRect();
  /* chip content = the inner flex row (icon + text column) */
  const chipEl = document.querySelector('[data-hr-res="gold"]');
  const kids = [...chipEl.children].map(c => c.getBoundingClientRect());
  const contentL = Math.min(...kids.map(k => k.left));
  const contentR = Math.max(...kids.map(k => k.right));
  return {
    barLeft: +res.left.toFixed(1),
    capEnd: +(mirror.right - res.left).toFixed(1),
    glass: { l: +(chip.left - res.left).toFixed(1), r: +(chip.right - res.left).toFixed(1), w: +chip.width.toFixed(1) },
    content: { l: +(contentL - res.left).toFixed(1), r: +(contentR - res.left).toFixed(1) },
    contentCentre: +((contentL + contentR) / 2 - res.left).toFixed(1),
    glassCentre: +((chip.left + chip.right) / 2 - res.left).toFixed(1),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
