import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('console', m => { if (m.type() === 'error') console.log('[err]', m.text().slice(0,150)); });
await p.goto('http://localhost:5173/hud-compose?view=narrative', { waitUntil: 'domcontentloaded', timeout: 30000 });
for (let i = 0; i < 30; i++) {
  if (await p.evaluate(() => !!document.querySelector('[data-hudreal-voce]'))) break;
  await p.waitForTimeout(2000);
}
const box = await p.evaluate(() => {
  const el = document.querySelector('[data-hudreal-voce]');
  const slot = document.querySelector('[data-hudslot="voce"]');
  const nav = document.querySelector('[data-hudslot="nav"]');
  const rr = (e) => { const r = e?.getBoundingClientRect(); return r ? {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)} : null; };
  return { voce: rr(el), slot: rr(slot), nav: rr(nav), url: location.href };
});
console.log(JSON.stringify(box));
await p.screenshot({ path: '/tmp/voce-lab.png' });
await b.close();
