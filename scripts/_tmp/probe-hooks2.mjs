import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e).slice(0, 200)));
p.on('console', (m) => m.type() === 'error' && errs.push('CONSOLE ' + m.text().slice(0, 200)));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
for (let i = 0; i < 14; i++) {
  await p.waitForTimeout(3000);
  const info = await p.evaluate(() => {
    const h = window.__idleVillageTestHooks;
    if (!h) return { hooks: 'absent' };
    const ex = h.expedition ? Object.keys(h.expedition) : [];
    return { keys: Object.keys(h).slice(0, 12), expeditionKeys: ex, bootHidden: !document.querySelector('[data-testid="game-boot-screen"]') };
  });
  console.log(`t${(i+1)*3}s`, JSON.stringify(info), errs.length ? `ERRS:${errs.length}` : '');
  if (info.expeditionKeys && info.expeditionKeys.length) break;
}
if (errs.length) console.log('ERRORS:', errs.slice(0, 4).join(' | '));
await b.close();
