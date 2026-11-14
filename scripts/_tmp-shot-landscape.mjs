import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const pg = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
await pg.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded', timeout: 30000 });
try { await pg.waitForSelector('[data-hudslot="nav"]', { timeout: 90000 }); } catch {}
await pg.waitForTimeout(4000);
await pg.evaluate(() => { const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none'; });
await pg.waitForTimeout(800);
const info = await pg.evaluate(() => [...document.querySelectorAll('[data-hudslot]')].map(e => { const r = e.getBoundingClientRect(); return `${e.dataset.hudslot}: ${Math.round(r.width)}x${Math.round(r.height)} @ ${Math.round(r.left)},${Math.round(r.top)}`; }));
console.log(info.join('\n'));
await pg.screenshot({ path: 'test-results/hud-landscape-current.png' });
await b.close();
