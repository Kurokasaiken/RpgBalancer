import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://127.0.0.1:5174/mappa2-lab';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e.stack ?? e).slice(0, 600)));
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.type(), m.text().slice(0, 300)); });
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 60; i++) {
  const ready = await p.evaluate(() => document.body.innerText.includes('ready: yes'));
  if (ready) break;
  await p.waitForTimeout(2000);
}
// hide lab controls
await p.keyboard.press('h');
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/probe-full.png' });
// zoom into the northern massif: wheel over map center-top
await p.mouse.move(800, 300);
for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, -240); await p.waitForTimeout(250); }
await p.waitForTimeout(1500);
await p.screenshot({ path: '/tmp/probe-zoom.png' });
// report which renderer got used
const info = await p.evaluate(() => ({
  dbg: typeof window.__regionalWeatherDebug,
  layers: window.__regionalWeatherDebug ? window.__regionalWeatherDebug.order() : null,
}));
console.log(JSON.stringify(info, null, 1));
await b.close();
