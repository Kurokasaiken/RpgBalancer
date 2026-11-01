import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:5173/';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e.stack ?? e).slice(0, 800)));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
let out = null;
for (let i = 0; i < 90; i++) {
  out = await p.evaluate(() => ({
    path: window.location.pathname,
    alert: document.querySelector('[role="alert"]')?.textContent ?? null,
    bootPhase: document.querySelector('[data-boot-phase]')?.getAttribute('data-boot-phase') ?? null,
    canvas: !!document.querySelector('canvas'),
    labHud: !!document.querySelector('[data-boot-phase], [class*="lab"], canvas'),
    manifestLine: document.body.innerText.includes('/assets/world/mappa2/base/manifest.json'),
  }));
  if (out.alert || (out.canvas && out.manifestLine)) break;
  await p.waitForTimeout(2000);
}
console.log('FINAL', JSON.stringify(out));
await p.screenshot({ path: 'test-results/landing-desktop.png' });
await b.close();
