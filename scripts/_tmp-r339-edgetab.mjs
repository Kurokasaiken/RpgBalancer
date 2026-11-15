import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 200)));
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 120; i++) {
  const boot = await p.evaluate(() => !!document.querySelector('[data-testid="game-boot-screen"]'));
  const tab = await p.evaluate(() => !!document.querySelector('[data-testid="expedition-edge-tab"]'));
  if (!boot && tab) break;
  await p.waitForTimeout(1500);
}
await p.waitForTimeout(1500);
const tab = await p.evaluate(() => {
  const el = document.querySelector('[data-testid="expedition-edge-tab"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { right: Math.round(r.right), w: window.innerWidth, bootGone: !document.querySelector('[data-testid="game-boot-screen"]'), text: el.textContent.slice(0, 80) };
});
console.log('edgeTab:', JSON.stringify(tab));
await p.screenshot({ path: 'test-results/r339-edge-tab.png' });
await b.close();
