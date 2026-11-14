import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
await p.goto('https://rpg-balancer.vercel.app/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
await p.waitForFunction(() => window.__worldCam && window.__worldCamCtl, null, { timeout: 180000 });
await p.waitForTimeout(2500);
const resting = await p.evaluate(() => ({ ...window.__worldCam }));
await p.mouse.move(720, 450);
for (let i = 0; i < 25; i++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(40); }
await p.waitForTimeout(500);
const afterOut = await p.evaluate(() => ({ ...window.__worldCam }));
// wheel-in over HUD chrome
const nav = p.locator('[data-nav-id="village"]');
const box = await nav.boundingBox();
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await p.mouse.wheel(0, -300);
await p.waitForTimeout(300);
const afterIn = await p.evaluate(() => ({ ...window.__worldCam }));
console.log('resting:', resting.zoom.toFixed(4));
console.log('after wheel-out x25:', afterOut.zoom.toFixed(4), '(must equal resting)');
console.log('after wheel-in over HUD:', afterIn.zoom.toFixed(4), '(must be > resting)');
console.log('page errors:', errors.length ? errors : 'none');
await b.close();
