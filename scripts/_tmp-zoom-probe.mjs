// Temp probe for the /game wheel-zoom + HUD + village-recenter bug report.
// Headless, WebGL on (--enable-unsafe-swiftshader, R-304). Dev server :5173.
import { chromium } from 'playwright';

const URL = 'http://localhost:5173/game';
const VP = { width: 1440, height: 900 };

const cam = (page) => page.evaluate(() => (window.__worldCam ? { ...window.__worldCam } : null));
const bounds = (page) => page.evaluate(() => window.__worldCamBounds ?? null);
const vvScale = (page) => page.evaluate(() => window.visualViewport?.scale ?? -1);
const navRect = (page, id) =>
  page.evaluate((navId) => {
    const el = document.querySelector(`[data-nav-id="${navId}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  }, id);

const run = async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: VP });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  const t0 = Date.now();
  await page.waitForFunction(() => window.__worldCam && window.__worldCam.zoom > 0, null, { timeout: 240000 });
  console.log('BOOT took', ((Date.now() - t0) / 1000).toFixed(1), 's');
  await page.waitForTimeout(800);

  const resting = await cam(page);
  const zb = await bounds(page);
  console.log('RESTING', JSON.stringify(resting));
  console.log('BOUNDS', JSON.stringify(zb));

  // 1) Wheel-out over the map centre.
  await page.mouse.move(VP.width / 2, VP.height / 2);
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(120);
  const afterOut = await cam(page);
  console.log('WHEEL-OUT map  deltaY=120 → zoom', resting.zoom, '→', afterOut.zoom);

  // 1b) Magnitude check: deltaY 10 vs 600 — same step?
  await page.mouse.move(VP.width / 2, VP.height / 2);
  await page.mouse.wheel(0, -10);
  await page.waitForTimeout(80);
  const small = await cam(page);
  await page.mouse.wheel(0, -600);
  await page.waitForTimeout(80);
  const big = await cam(page);
  console.log('WHEEL-IN  deltaY=10  zoom', afterOut.zoom, '→', small.zoom);
  console.log('WHEEL-IN  deltaY=600 zoom', small.zoom, '→', big.zoom, '(ratio', (big.zoom / small.zoom).toFixed(3), ')');

  // 2) Wheel-out over the nav plinth (dead zone? page zoom?).
  const navVillage = await navRect(page, 'village');
  console.log('NAV village rect', JSON.stringify(navVillage));
  await page.mouse.move(navVillage.cx, navVillage.cy);
  const beforeHudWheel = await cam(page);
  await page.mouse.wheel(0, 240);
  await page.waitForTimeout(120);
  const afterHudWheel = await cam(page);
  console.log('WHEEL over nav plinth → cam.zoom', beforeHudWheel.zoom, '→', afterHudWheel.zoom, 'vv.scale', await vvScale(page));

  // 3) ctrl+wheel over the HUD (page zoom → HUD scales?).
  const hudBefore = await page.evaluate(() => {
    const el = document.querySelector('nav');
    const r = el?.getBoundingClientRect();
    return r ? { w: r.width, y: r.y } : null;
  });
  await page.keyboard.down('Control');
  await page.mouse.move(navVillage.cx, navVillage.cy);
  await page.mouse.wheel(0, -240);
  await page.keyboard.up('Control');
  await page.waitForTimeout(200);
  const hudAfter = await page.evaluate(() => {
    const el = document.querySelector('nav');
    const r = el?.getBoundingClientRect();
    return r ? { w: r.width, y: r.y } : null;
  });
  console.log('CTRL+WHEEL over nav → vv.scale', await vvScale(page), 'nav rect', JSON.stringify(hudBefore), '→', JSON.stringify(hudAfter));

  // 4) Village button: zoom in, click village nav, come back to map.
  await page.evaluate(() => window.__worldCamCtl?.refit?.());
  await page.waitForTimeout(150);
  const rest2 = await cam(page);
  await page.evaluate(() => window.__worldCamCtl?.set?.({ zoom: (window.__worldCam?.fitZoom ?? 0.5) * 1.8 }));
  await page.waitForTimeout(150);
  const zoomed = await cam(page);
  console.log('USER-ZOOMED →', zoomed.zoom, '(rest', rest2.zoom, ')');
  await page.click('[data-nav-id="village"]');
  await page.waitForTimeout(400);
  const camInVillage = await cam(page);
  console.log('AFTER village click → cam.zoom', camInVillage.zoom);
  await page.click('[data-nav-id="map"]');
  await page.waitForTimeout(400);
  const camBack = await cam(page);
  console.log('BACK on map → cam.zoom', camBack.zoom, 'rest was', rest2.zoom, '→ reset?', Math.abs(camBack.zoom - rest2.zoom) < 0.001);

  console.log('PAGEERRORS', JSON.stringify(errors));
  await browser.close();
};

run().catch((e) => {
  console.error('PROBE FAIL', e);
  process.exit(1);
});
