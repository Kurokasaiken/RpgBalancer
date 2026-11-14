import { chromium } from 'playwright';
const page = await (await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })).newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__worldCam?.zoom > 0, null, { timeout: 240000 });
await page.waitForTimeout(800);
const nav = await page.evaluate(() => { const el = document.querySelector('[data-nav-id="village"]'); const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; });
const z0 = await page.evaluate(() => window.__worldCam.zoom);
// wheel-out over HUD chrome
await page.mouse.move(nav.x, nav.y);
await page.mouse.wheel(0, 200); await page.waitForTimeout(150);
const z1 = await page.evaluate(() => window.__worldCam.zoom);
console.log('wheel-out over HUD:', z0.toFixed(3), '->', z1.toFixed(3), z1 < z0 ? 'OK' : 'DEAD');
// pinch-style ctrl+wheel over canvas + HUD: page zoom must stay 1, map must zoom
await page.keyboard.down('Control');
await page.mouse.move(nav.x, nav.y); await page.mouse.wheel(0, -150);
await page.mouse.move(720, 450); await page.mouse.wheel(0, -150);
await page.keyboard.up('Control');
await page.waitForTimeout(150);
const z2 = await page.evaluate(() => window.__worldCam.zoom);
const vv = await page.evaluate(() => visualViewport.scale);
console.log('ctrl+wheel (pinch): map zoom', z1.toFixed(3), '->', z2.toFixed(3), '| vv.scale', vv, vv === 1 && z2 > z1 ? 'OK' : 'FAIL');
// HUD bbox unchanged across zoom
const bb = () => page.evaluate(() => { const r = document.querySelector('[data-hudslot="nav"]').getBoundingClientRect(); return r.width.toFixed(1) + 'x' + r.height.toFixed(1); });
await page.evaluate(() => window.__worldCamCtl.set({ zoom: 0.25 })); await page.waitForTimeout(200);
console.log('HUD nav bbox @z=0.25:', await bb(), '@rest:', await page.evaluate(() => { window.__worldCamCtl.refit(); return null; }) && 'skip');
await page.waitForTimeout(200); console.log('HUD nav bbox @rest:', await bb());
process.exit(0);
