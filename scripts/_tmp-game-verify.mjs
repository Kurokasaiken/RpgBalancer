import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:5173/game';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const warnings = [];
p.on('pageerror', (e) => errors.push('[pageerror] ' + String(e).slice(0, 300)));
p.on('console', (m) => {
  if (m.type() === 'error') errors.push('[console.error] ' + m.text().slice(0, 250));
  if (m.type() === 'warning') warnings.push('[console.warn] ' + m.text().slice(0, 200));
});
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
// wait for map ready up to 120s
let ready = false;
for (let i = 0; i < 120; i++) {
  ready = await p.evaluate(() => !!document.querySelector('[data-map-ready]'));
  if (ready) break;
  await p.waitForTimeout(1000);
}
await p.waitForTimeout(8000); // let HUD settle
const state = await p.evaluate(() => {
  const q = (s) => document.querySelectorAll(s).length;
  return {
    mapReady: q('[data-map-ready]'),
    canvas: q('canvas'),
    hudControls: q('[data-hud-controls]'),
    bootPhase: document.querySelector('[data-boot-phase]')?.getAttribute('data-boot-phase') ?? 'gone',
    alert: document.querySelector('[role="alert"]')?.textContent?.trim() ?? null,
    bodyTextHead: document.body.innerText.slice(0, 200),
  };
});
console.log('READY:', ready);
console.log(JSON.stringify(state, null, 1));
await p.screenshot({ path: 'test-results/game-verify-1440.png' });
// mobile-ish viewport check
await p.setViewportSize({ width: 390, height: 844 });
await p.waitForTimeout(3000);
await p.screenshot({ path: 'test-results/game-verify-390.png' });
console.log('--- ERRORS (' + errors.length + ') ---');
errors.slice(0, 20).forEach((e) => console.log(e));
console.log('--- WARNINGS (' + warnings.length + ') ---');
warnings.slice(0, 10).forEach((w) => console.log(w));
await b.close();
process.exit(errors.length > 0 || !ready ? 1 : 0);
