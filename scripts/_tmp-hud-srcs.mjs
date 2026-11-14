import { chromium } from 'playwright';
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage();
await pg.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded' });
await pg.waitForSelector('[data-hudslot="time"]', { timeout: 120000 });
const srcs = await pg.evaluate(() => {
  const out = {};
  document.querySelectorAll('[data-hudslot]').forEach(el => {
    const img = el.querySelector('img');
    out[el.dataset.hudslot] = img ? img.src : null;
  });
  return out;
});
console.log(JSON.stringify(srcs));
await b.close();
