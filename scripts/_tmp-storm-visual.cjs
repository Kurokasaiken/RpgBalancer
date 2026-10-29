const { chromium } = require('playwright');
const { mkdirSync } = require('fs');
const DIR = 'test-results/plan-098-mappa2-regional-weather';
mkdirSync(DIR, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://127.0.0.1:5173/mappa2-lab');
  await page.waitForFunction(() => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'), null, { timeout: 240000 });
  const setCfg = (p) => page.evaluate((pp) => window.__regionalWeatherDebug.set(pp), p);
  const cam = (p) => page.evaluate((pp) => window.__worldCamCtl.set(pp), p);
  // alpine massif ~ (1400,300): view 1600x900 zoom 1.3
  await setCfg({ enabled: true, opacity: 0.8 });
  await page.evaluate(() => { window.__regionalWeatherDebug.setTime(420 * 16.7); }); // push past first bolt window
  await cam({ panX: 1400 - 800 / 1.3, panY: 300 - 450 / 1.3, zoom: 1.3 });
  await page.waitForTimeout(600);
  // catch a bolt if one fires naturally: freeze near boltNext boundary — simplest: sample a few frames
  for (let i = 0; i < 3; i++) {
    await page.evaluate((ms) => window.__regionalWeatherDebug.setTime(ms), (450 + i * 40) * 16.7);
    await page.waitForTimeout(150);
  }
  await page.screenshot({ path: `${DIR}/storm-on.png` });
  const dbg = await page.evaluate(() => {
    const w = window.__regionalWeatherDebug;
    return { counts: w.counts(), boltA: document ? undefined : 0 };
  });
  console.log('counts:', JSON.stringify(dbg.counts));
  await setCfg({ enabled: false });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${DIR}/storm-off.png` });
  await browser.close();
  console.log('STORM OK');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
