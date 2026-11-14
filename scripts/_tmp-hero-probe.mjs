import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
const t0 = Date.now();
await p.goto('http://localhost:4173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
console.log(`loaded ${Math.round((Date.now() - t0) / 1000)}s`);
for (let i = 0; i < 60; i++) {
  const s = await p.evaluate(() => {
    const bp = document.querySelector('[data-boot-phase], [data-testid="game-boot-screen"]');
    return { ready: !!document.querySelector('[data-map-ready]'), phase: bp?.getAttribute('data-boot-phase') ?? bp?.textContent?.slice(0, 40) ?? null, cam: !!window.__worldCam };
  }).catch(() => null);
  console.log(`t=${Math.round((Date.now() - t0) / 1000)}s`, JSON.stringify(s));
  if (s?.ready) break;
  await p.waitForTimeout(5000);
}
if (!(await p.evaluate(() => !!document.querySelector('[data-map-ready]')))) { console.log('NEVER READY'); await b.close(); process.exit(1); }
await p.waitForSelector('[data-testid="game-boot-screen"]', { state: 'detached', timeout: 30000 }).catch(() => {});
await p.waitForTimeout(1000);
await p.keyboard.press('r'); await p.waitForTimeout(800);
const card = await p.evaluate(() => {
  const el = document.querySelector('[data-panel="roster"] [data-resident-id]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { id: el.dataset.residentId, x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
console.log('card:', JSON.stringify(card));
if (card) {
  await p.mouse.move(card.x + 30, card.y + 30); await p.waitForTimeout(150);
  await p.mouse.move(card.x, card.y); await p.waitForTimeout(1200);
  const sheet = await p.evaluate(() => {
    const el = document.querySelector('[data-hud-panel="heroSheet"], [data-hero-sheet], [role="dialog"], [aria-live] [class*="sheet" i]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), text: el.textContent?.slice(0, 100) };
  });
  console.log('hero sheet:', JSON.stringify(sheet));
  await p.screenshot({ path: 'test-results/r325-game-restore/w-herosheet.png' });
}
await b.close();
