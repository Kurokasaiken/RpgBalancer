import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => { const t = m.text(); if (/boot|ready|manifest|texture|error|fail/i.test(t)) console.log('CON>', t.slice(0, 160)); });
page.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 200)));
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(10000);
  const st = await page.evaluate(() => ({
    ready: document.querySelector('[data-testid="game-mappa2"]')?.getAttribute('data-map-ready'),
    markers: Array.from(document.querySelectorAll('[data-map-quest-poi-target]')).map(el => {
      const r = el.getBoundingClientRect();
      return `${Math.round(r.x)},${Math.round(r.y)} ${getComputedStyle(el).visibility}`;
    }),
  }));
  console.log(`t+${(i + 1) * 10}s`, JSON.stringify(st));
  if (st.markers.some(m => m.includes('visible'))) break;
}
const info = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[data-map-quest-poi-target]')).map((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, vis: getComputedStyle(el).visibility };
  }).filter(m => m.vis === 'visible'),
);
for (const m of info) {
  await page.mouse.click(m.x + m.w / 2, m.y + m.w / 2);
  await page.waitForTimeout(700);
  if (await page.evaluate(() => !!document.querySelector('[data-hudreal-cassetto]'))) break;
}
await page.waitForTimeout(500);
const geo = await page.evaluate(() => {
  const res = document.querySelector('[data-hudreal-cassetto] [data-cassetto-resources]');
  const bar = res?.querySelector('[data-hudreal-resources]');
  return { cass: !!document.querySelector('[data-hudreal-cassetto]'), well: res?.getBoundingClientRect(), bar: bar?.getBoundingClientRect() };
});
console.log(JSON.stringify(geo));
await page.screenshot({ path: '/tmp/game-cass.png', timeout: 60000 });
await browser.close();
