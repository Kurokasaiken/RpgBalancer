import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:5173/game?poiDemo=1';
const out = process.argv[3] ?? '/tmp/game-roster-full.png';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 200)));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 100; i++) {
  const st = await p.evaluate(() => ({
    phase: document.querySelector('[data-boot-phase]')?.getAttribute('data-boot-phase') ?? null,
    canvas: !!document.querySelector('canvas'),
  }));
  if (st.phase === null && st.canvas) { console.log('booted at', i * 2, 's'); break; }
  await p.waitForTimeout(2000);
}
await p.keyboard.press('r');
await p.waitForTimeout(1500);
console.log('roster panel:', !!(await p.$('[data-panel="roster"]')));
console.log('cards:', await p.evaluate(() => document.querySelectorAll('[data-worker-id]').length));
await p.evaluate(() => document.fonts.ready).catch(() => {});
try { await p.screenshot({ path: out, timeout: 20000 }); console.log('shot saved'); } catch (e) { console.log('shot failed', String(e).slice(0, 120)); }
// crop roster panel
const panel = await p.$('[data-panel="roster"]');
if (panel) {
  const box = await panel.boundingBox();
  console.log('panel box:', JSON.stringify(box));
  if (box) { try { await p.screenshot({ path: out.replace('.png','-crop.png'), clip: { x: Math.max(0,box.x-10), y: Math.max(0,box.y-10), width: Math.min(1440-Math.max(0,box.x-10), box.width+20), height: Math.min(900-Math.max(0,box.y-10), box.height+20) }, timeout: 20000 }); console.log('crop saved'); } catch(e) { console.log('crop failed', String(e).slice(0,120)); } }
}
await b.close();
