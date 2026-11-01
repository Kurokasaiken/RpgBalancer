import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:5173/game';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e.stack ?? e).slice(0, 800)));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
// poll for __meshOk or alert up to 60s
let out = null;
for (let i = 0; i < 60; i++) {
  out = await p.evaluate(() => ({
    meshOk: window.__meshOk ?? null,
    pipes: window.__renderPipes ?? null,
    alert: document.querySelector('[role="alert"]')?.textContent ?? null,
    bootPhase: document.querySelector('[data-boot-phase]')?.getAttribute('data-boot-phase') ?? null,
    webgl: (() => { try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; } })(),
  }));
  if (out.alert || out.meshOk !== null) break;
  await p.waitForTimeout(2000);
}
console.log('FINAL', JSON.stringify(out));
await b.close();
