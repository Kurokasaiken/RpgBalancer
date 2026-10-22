const { chromium } = require('playwright');
const fs = require('fs');
const ls = JSON.parse(fs.readFileSync('/tmp/ldbreader/p1-ls-5173.json', 'utf8'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
  await page.addInitScript((entries) => {
    for (const [k, v] of Object.entries(entries)) {
      try { window.localStorage.setItem(k, v); } catch (e) {}
    }
    // longtask recorder
    window.__lt = [];
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__lt.push({ t: e.startTime, d: e.duration });
      }).observe({ entryTypes: ['longtask'] });
    } catch (e) {}
    window.__rafJank = [];
    let last = performance.now();
    const loop = (now) => {
      const gap = now - last;
      if (gap > 34) window.__rafJank.push({ t: last, d: gap - 16.7 });
      last = now;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, ls);

  await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=The Eastern Marches', { timeout: 120000 });
  await page.waitForTimeout(4000);

  // open roster
  await page.keyboard.press('r');
  await page.waitForSelector('[data-resident-count]', { timeout: 15000 });
  console.log('roster open');

  // quest POI markers present?
  const poiIds = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-quest-poi-id]')).map(e => e.getAttribute('data-quest-poi-id')));
  console.log('pois:', JSON.stringify(poiIds));

  if (poiIds.length === 0) {
    console.log('NO POIS - need reveal; aborting');
    await page.screenshot({ path: '/tmp/ldbreader/perf-nopoi.png' });
    await browser.close();
    return;
  }

  // click first goblin POI to open the planner
  await page.locator('[data-quest-poi-id]').first().click({ force: true });
  const detail = await page.waitForSelector('[data-testid="quest-expedition-detail"]', { timeout: 10000 }).catch(() => null);
  console.log('planner open:', !!detail);
  if (!detail) {
    await page.screenshot({ path: '/tmp/ldbreader/perf-nodetail.png' });
    await browser.close();
    return;
  }
  await page.waitForTimeout(1500);

  const snap = () => page.evaluate(() => {
    const lt = window.__lt.splice(0);
    const raf = window.__rafJank.splice(0);
    return { lt, raf };
  });
  await snap(); // clear baseline

  // click-assign: click roster cards one by one
  const cards = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-resident-id]')).map(e => e.getAttribute('data-resident-id')));
  console.log('cards:', JSON.stringify(cards));

  for (const id of cards) {
    const before = await page.evaluate(() => performance.now());
    await page.locator(`[data-resident-id="${id}"]`).first().click().catch(e => console.log('click fail', id, String(e).slice(0, 80)));
    await page.waitForTimeout(3000);
    const m = await snap();
    const busy = m.lt.reduce((a, e) => a + e.d, 0);
    const rafLost = m.raf.reduce((a, e) => a + e.d, 0);
    console.log(`click ${id}: longtasks=${m.lt.length} busy=${busy.toFixed(0)}ms max=${Math.max(0, ...m.lt.map(e => e.d)).toFixed(0)}ms rafLost=${rafLost.toFixed(0)}ms`,
      JSON.stringify(m.lt.map(e => Math.round(e.d))));
  }
  await page.screenshot({ path: '/tmp/ldbreader/perf-after.png' });
  await browser.close();
})().catch(e => { console.error('ERR', e); process.exit(1); });
