import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&pcts=96,4&risk=3', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-block="party-slots"]', { timeout: 60000 });
await p.waitForTimeout(2000);
const inject = `(()=>{const w=document.querySelector('[data-block="party-slots"]');
  if(!w)return false;
  const m=document.getElementById('mock-mark');if(m)m.remove();
  const cs=getComputedStyle(w);
  w.style.borderImageSource='url(/assets/ui/hud-real/tmp-mock/frame-A-tight.png)';
  w.style.borderImageSlice='95 150 95 150';
  w.style.borderImageWidth=cs.borderImageWidth;
  w.style.borderImageRepeat='stretch';
  w.style.borderStyle='solid';
  w.style.borderColor='transparent';
  const c=document.createElement('div');c.id='mock-mark';
  w.appendChild(c);return cs.borderImageWidth})()`;
let biw = '';
for (let att = 0; att < 6; att++) {
  try {
    biw = await p.evaluate(inject);
    for (let s = 0; s < 10; s++) {
      await p.waitForTimeout(400);
      const alive = await p.evaluate(`!!document.getElementById('mock-mark')`).catch(() => false);
      if (alive) {
        const col = await p.$('[data-cassetto-column]');
        const well = await p.$('[data-block="party-slots"]');
        const cb = await col.boundingBox(), wb = await well.boundingBox();
        await p.screenshot({ path: '.mw/runs/r378-cassetto-party-mark/frame-A-samecoords.png', clip: { x: cb.x, y: Math.max(0, wb.y - 60), width: cb.width, height: wb.height + 120 } });
        break;
      }
      await p.evaluate(inject);
    }
    break;
  } catch (e) { await p.waitForSelector('[data-block="party-slots"]', { timeout: 30000 }); await p.waitForTimeout(1500); }
}
await b.close();
console.log('done biw=' + biw);
