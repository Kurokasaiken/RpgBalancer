import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:5173/hud-lab';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('console', m => console.log(`[${m.type()}]`, m.text().slice(0, 220)));
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 400)));
p.on('requestfailed', r => console.log('[reqfail]', r.url(), r.failure()?.errorText));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(16000);
const state = await p.evaluate(() => ({
  slots: document.querySelectorAll('[data-hud-lab-slot]').length,
  imgs: [...document.images].filter(i => i.src.includes('hud-lab')).map(i => ({ src: i.src.split('/').pop(), ok: i.complete && i.naturalWidth > 0 })),
  canvas: !!document.querySelector('canvas'),
  bodyLen: document.body.innerHTML.length,
}));
console.log('STATE', JSON.stringify(state));
await p.screenshot({ path: 'test-results/hud-lab-debug.png' });
await b.close();
