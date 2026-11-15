import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:5173/hud-compose?comp=cassetto';
const out = process.argv[3] ?? '/tmp/compose-live.png';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 200)));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 30; i++) {
  const n = await p.evaluate(() => document.querySelectorAll('[data-worker-id]').length);
  if (n > 0) { console.log('cards at', i, '=', n); break; }
  await p.waitForTimeout(1000);
}
await p.waitForTimeout(1500);
try { await p.screenshot({ path: out, timeout: 20000 }); console.log('saved'); } catch (e) { console.log('shot fail', String(e).slice(0, 100)); }
await b.close();
