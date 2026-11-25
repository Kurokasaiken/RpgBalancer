import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&pcts=96,4&risk=3', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-block="party-slots"]', { timeout: 60000 });
await p.waitForTimeout(2000);
const inject = `(()=>{const w=document.querySelector('[data-block="party-slots"]');
  if(!w)return false;
  const m=document.getElementById('mock-mark');if(m)m.remove();
  /* pozzo identico a prima, solo il filetto originale spento */
  w.style.borderImageSource='none';
  /* il frame e' un anello ESTERNO: apertura interna = rettangolo del verde */
  const f=document.createElement('div');f.id='mock-mark';
  f.style.cssText='position:absolute;inset:-26px -30px;border:26px solid transparent;border-width:26px 30px;border-image:url(/assets/ui/hud-real/tmp-mock/frame-A-tight.png) 95 118 95 118 / 26px 30px stretch;pointer-events:none;z-index:2';
  w.appendChild(f);return true})()`;
for (let att = 0; att < 6; att++) {
  try {
    await p.evaluate(inject);
    for (let s = 0; s < 10; s++) {
      await p.waitForTimeout(400);
      const alive = await p.evaluate(`!!document.getElementById('mock-mark')`).catch(() => false);
      if (alive) {
        const col = await p.$('[data-cassetto-column]');
        const well = await p.$('[data-block="party-slots"]');
        const cb = await col.boundingBox(), wb = await well.boundingBox();
        await p.screenshot({ path: '.mw/runs/r378-cassetto-party-mark/frame-A-outside.png', clip: { x: cb.x, y: Math.max(0, wb.y - 90), width: cb.width, height: wb.height + 150 } });
        break;
      }
      await p.evaluate(inject);
    }
    break;
  } catch (e) { await p.waitForSelector('[data-block="party-slots"]', { timeout: 30000 }); await p.waitForTimeout(1500); }
}
await b.close();
console.log('done');
