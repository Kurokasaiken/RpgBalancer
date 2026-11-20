import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(9000);
await p.click('[aria-label="Stash"]');
await p.waitForTimeout(2500);
const info = await p.evaluate(() => {
  const cells = [...document.querySelectorAll('[data-hud-panel="villageStash"] [role="listitem"]')];
  return cells.slice(0,3).map(c => ({
    html: c.innerHTML.slice(0, 500),
    cornice: !!c.querySelector('[data-piastrina-cornice]'),
    imgs: [...c.querySelectorAll('img')].map(i => ({ src: i.src.slice(-60), w: i.width, h: i.height, vis: getComputedStyle(i).opacity })),
  }));
});
console.log(JSON.stringify(info, null, 1).slice(0, 3000));
await b.close();
