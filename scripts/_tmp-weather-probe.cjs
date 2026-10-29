const { chromium } = require('playwright');
const { mkdirSync, writeFileSync } = require('fs');
const DIR = 'test-results/plan-098-mappa2-regional-weather';
mkdirSync(DIR, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/mappa2-lab');
  await page.waitForFunction(() => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'), null, { timeout: 240000 });
  const d = await page.evaluate(() => {
    const w = window.__regionalWeatherDebug;
    if (!w) return null;
    return { label: w.box.label, z: w.box.zIndex, visible: w.box.visible, counts: w.counts() };
  });
  console.log('mount:', JSON.stringify(d));
  if (!d) { await browser.close(); process.exit(2); }
  const snap = async (ms) => {
    await page.evaluate((m) => { const w = window.__regionalWeatherDebug; w.freeze(); w.setTime(m); }, ms);
    await page.waitForTimeout(150);
    return page.evaluate(() => window.__regionalWeatherDebug.positions());
  };
  const a = await snap(5000), b = await snap(5000), c = await snap(9000);
  console.log('deterministic:', JSON.stringify(a) === JSON.stringify(b), '| moves:', JSON.stringify(a) !== JSON.stringify(c));
  writeFileSync(`${DIR}/probe.json`, JSON.stringify({ mount: d, a, c }, null, 1));
  // live toggle
  await page.getByRole('button', { name: 'sky', exact: true }).click();
  const t = page.getByRole('checkbox', { name: /regional weather/i });
  await t.uncheck();
  const hidden = await page.evaluate(() => window.__regionalWeatherDebug.box.visible);
  await t.check();
  const shown = await page.evaluate(() => window.__regionalWeatherDebug.box.visible);
  console.log('toggle live:', hidden === false && shown === true);
  // reduced motion context
  const ctx2 = await browser.newContext({ reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage();
  await p2.goto('http://127.0.0.1:5173/mappa2-lab');
  await p2.waitForFunction(() => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'), null, { timeout: 240000 });
  const rm = await p2.evaluate(() => {
    const w = window.__regionalWeatherDebug;
    w.freeze(); w.setTime(4000);
    const p1 = w.positions(); w.setTime(40000);
    const p2 = w.positions();
    const emb = p1.filter(x => x.type === 'ember');
    const m1 = p1.filter(x => x.type === 'mist' && x.visible);
    const m2 = p2.filter(x => x.type === 'mist' && x.visible);
    return { emberHidden: emb.every(e => !e.visible), mistN: m1.length,
      mistAlpha: m1[0]?.alpha, mistStatic: JSON.stringify(m1.map(m=>[m.x,m.y])) === JSON.stringify(m2.map(m=>[m.x,m.y])) };
  });
  console.log('reducedMotion:', JSON.stringify(rm));
  writeFileSync(`${DIR}/reduced-motion.json`, JSON.stringify(rm));
  await browser.close();
  console.log('PROBE OK');
})().catch(e => { console.error('PROBE FAIL', e.message); process.exit(1); });
