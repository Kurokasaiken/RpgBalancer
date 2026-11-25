import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pg.goto('http://localhost:5173/icon-gallery', { waitUntil: 'domcontentloaded', timeout: 30000 });
await pg.waitForTimeout(4000);
await pg.evaluate(() => {
  const els = [...document.querySelectorAll('h2, h3, div')].filter(e => e.textContent?.includes('con POI dietro'));
  els[0]?.scrollIntoView({ block: 'start' });
});
await pg.waitForTimeout(1500);
await pg.screenshot({ path: '.mw/runs/20261124-poi-nav-icone/gen/emblems2/gallery-con-senza.png' });
await b.close();
console.log('done');
