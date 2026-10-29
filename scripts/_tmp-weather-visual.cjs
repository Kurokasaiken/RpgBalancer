const { chromium } = require('playwright');
const { mkdirSync, writeFileSync } = require('fs');
const DIR = 'test-results/plan-098-mappa2-regional-weather';
mkdirSync(DIR, { recursive: true });
const shot = (page, name) => page.screenshot({ path: `${DIR}/${name}.png` });
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://127.0.0.1:5173/mappa2-lab');
  await page.waitForFunction(() => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'), null, { timeout: 240000 });
  const setCfg = (p) => page.evaluate((pp) => window.__regionalWeatherDebug.set(pp), p);
  const cam = (p) => page.evaluate((pp) => window.__worldCamCtl.set(pp), p);
  // mist cluster ~ (1200,960): pan = wx - viewW/zoom/2 ; view 1600x900, zoom 2.2
  const focus = async (wx, wy, z) => { await cam({ panX: wx - 800 / z, panY: wy - 450 / z, zoom: z }); await page.waitForTimeout(400); };
  await page.evaluate(() => { window.__regionalWeatherDebug.freeze(); window.__regionalWeatherDebug.setTime(6000); });
  await page.waitForTimeout(200);
  await setCfg({ enabled: true, opacity: 0.9 });
  await focus(1200, 960, 2.2); await shot(page, 'mist-on');
  await setCfg({ enabled: false }); await page.waitForTimeout(250); await shot(page, 'mist-off');
  await setCfg({ enabled: true });
  await focus(2147, 1260, 1.2); await shot(page, 'ember-on');
  await setCfg({ enabled: false }); await page.waitForTimeout(250); await shot(page, 'ember-off');
  await setCfg({ enabled: true });
  await browser.close();
  console.log('VISUAL OK');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
