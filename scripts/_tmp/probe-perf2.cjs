const { chromium } = require('playwright');
const fs = require('fs');
const ls = JSON.parse(fs.readFileSync('/tmp/ldbreader/p1-ls-5173.json', 'utf8'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' || /warn/i.test(t)) console.log('[console]', m.type(), t.slice(0, 200)); });
  await page.addInitScript((entries) => {
    for (const [k, v] of Object.entries(entries)) {
      try { window.localStorage.setItem(k, v); } catch (e) {}
    }
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

  // open quest planner by clicking the POI marker
  const marker = page.locator('[data-quest-poi-id]').first();
  console.log('marker count:', await page.locator('[data-quest-poi-id]').count());
  console.log('marker box:', JSON.stringify(await marker.boundingBox()));
  await marker.click();
  await page.waitForTimeout(2500);
  let detail = await page.$('[data-testid="quest-expedition-detail"]');
  console.log('detail after click:', !!detail);
  if (!detail) {
    await marker.press('Enter');
    await page.waitForTimeout(2000);
    detail = await page.$('[data-testid="quest-expedition-detail"]');
    console.log('detail after Enter:', !!detail);
  }
  if (!detail) {
    // maybe floating panel list
    const fps = await page.evaluate(() => Array.from(document.querySelectorAll('[data-testid^="floating-panel"]')).map(e => e.getAttribute('data-testid')));
    console.log('floating panels:', JSON.stringify(fps));
    await page.screenshot({ path: '/tmp/ldbreader/perf2-nodetail.png' });
  }

  // open roster
  await page.keyboard.press('r');
  await page.waitForSelector('[data-resident-count]', { timeout: 15000 }).catch(() => console.log('roster count missing'));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/ldbreader/perf2-planner.png' });

  const snap = () => page.evaluate(() => {
    const lt = window.__lt.splice(0);
    const raf = window.__rafJank.splice(0);
    return { lt, raf };
  });
  await snap();

  const cards = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-resident-id]')).map(e => e.getAttribute('data-resident-id')));
  console.log('cards:', JSON.stringify(cards));

  for (const id of cards) {
    await page.locator(`[data-resident-id="${id}"]`).first().click().catch(e => console.log('click fail', id, String(e).slice(0, 80)));
    await page.waitForTimeout(3000);
    const m = await snap();
    const busy = m.lt.reduce((a, e) => a + e.d, 0);
    const rafLost = m.raf.reduce((a, e) => a + e.d, 0);
    console.log(`click ${id}: longtasks=${m.lt.length} busy=${busy.toFixed(0)}ms max=${Math.max(0, ...m.lt.map(e => e.d)).toFixed(0)}ms rafLost=${rafLost.toFixed(0)}ms`,
      JSON.stringify(m.lt.map(e => Math.round(e.d))));
  }
  await page.screenshot({ path: '/tmp/ldbreader/perf2-after.png' });
  await browser.close();
})().catch(e => { console.error('ERR', e); process.exit(1); });
