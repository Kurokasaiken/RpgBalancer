import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://127.0.0.1:5174/mappa2-lab';
// NO swiftshader: headless without GPU -> Pixi falls back to Canvas renderer
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e.stack ?? e).slice(0, 600)));
p.on('console', m => { const t = m.text(); if (/canvas|webgl|fallback|renderer/i.test(t)) console.log('[log]', t.slice(0, 300)); });
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 60; i++) {
  const ready = await p.evaluate(() => document.body.innerText.includes('ready: yes'));
  if (ready) break;
  await p.waitForTimeout(2000);
}
await p.keyboard.press('h').catch(() => {});
await p.waitForTimeout(800);
await p.screenshot({ path: '/tmp/canvas-full.png' });
await p.mouse.move(800, 260);
for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, -240); await p.waitForTimeout(250); }
await p.waitForTimeout(1500);
await p.screenshot({ path: '/tmp/canvas-zoom.png' });
await b.close();
