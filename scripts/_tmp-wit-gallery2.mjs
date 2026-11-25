import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pg.goto('http://localhost:5173/icon-gallery', { waitUntil: 'domcontentloaded', timeout: 30000 });
await pg.waitForTimeout(5000);
const scroller = await pg.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 200 && e.clientHeight > 300);
  return el ? (el === document.documentElement ? 'html' : el.tagName + '.' + el.className) : 'none';
});
console.log('scroller:', scroller);
await pg.evaluate(() => {
  const target = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /con POI dietro/.test(e.textContent || ''));
  target?.scrollIntoView({ block: 'start' });
  const scr = [...document.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 200 && e.clientHeight > 300);
  if (scr && target) scr.scrollTop = target.getBoundingClientRect().top - target.parentElement.getBoundingClientRect().top - 20;
});
await pg.waitForTimeout(1200);
await pg.screenshot({ path: '.mw/runs/20261124-poi-nav-icone/gen/emblems2/gallery-con-senza.png' });
await b.close();
console.log('done');
