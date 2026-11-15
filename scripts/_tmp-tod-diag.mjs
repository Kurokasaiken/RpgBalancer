import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 160)); });
await p.goto('http://localhost:5173/game?tod=night', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 60; i++) {
  if (await p.evaluate(() => !!document.querySelector('[data-map-ready]'))) { console.log('ready at', i); break; }
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(4000);
const diag = await p.evaluate(() => {
  const rep = window.__pixiTextureReport?.() ?? [];
  return { nightTex: rep.filter(r => /night|bio/.test(r.url)), totalTex: rep.length };
});
console.log(JSON.stringify(diag));
console.log('errors:', JSON.stringify(errs.slice(0, 12)));
await b.close();
