import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pg.goto('http://localhost:5173/icon-gallery', { waitUntil: 'networkidle', timeout: 45000 });
await pg.waitForTimeout(4000);
const y = await pg.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => /^POI — con POI/.test((e.textContent||'').trim()));
  if (!el) return -1;
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, top - 10);
  return top;
});
console.log('section y:', y);
await pg.waitForTimeout(2000);
await pg.screenshot({ path: '.mw/runs/20261124-poi-nav-icone/gen/emblems2/gallery-con-senza.png' });
await b.close();
console.log('done');
