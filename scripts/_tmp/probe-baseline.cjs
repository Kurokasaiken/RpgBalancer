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
    window.__lt = [];
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__lt.push({ t: e.startTime, d: e.duration });
      }).observe({ entryTypes: ['longtask'] });
    } catch (e) {}
  }, ls);

  await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=The Eastern Marches', { timeout: 120000 });
  await page.waitForTimeout(4000);

  const snap = async (label, ms) => {
    const m = await page.evaluate((dur) => new Promise(res => {
      const lt0 = window.__lt.length;
      setTimeout(() => {
        const lt = window.__lt.splice(0);
        res({ lt });
      }, dur);
    }), ms);
    const busy = m.lt.reduce((a, e) => a + e.d, 0);
    console.log(`${label}: window=${ms}ms longtasks=${m.lt.length} busy=${busy.toFixed(0)}ms max=${Math.max(0, ...m.lt.map(e => e.d)).toFixed(0)}`,
      JSON.stringify(m.lt.map(e => Math.round(e.d))));
    return m;
  };

  await page.evaluate(() => { window.__lt.length = 0; });
  await snap('baseline map only', 3000);

  // open planner
  await page.locator('[data-quest-poi-id]').first().click();
  await page.waitForSelector('[data-testid="quest-expedition-detail"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await snap('planner open idle', 3000);

  // open roster too
  await page.keyboard.press('r');
  await page.waitForSelector('[data-resident-count]', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await snap('planner+roster idle', 3000);

  // pause the game clock -> if busy drops, tick renders are the churn
  const paused = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const b = btns.find(x => /pause|⏸|paused/i.test(x.getAttribute('aria-label') || x.title || ''));
    if (b) { b.click(); return true; }
    return false;
  });
  console.log('clicked pause:', paused);
  await snap('paused idle', 3000);

  await browser.close();
})().catch(e => { console.error('ERR', e); process.exit(1); });
