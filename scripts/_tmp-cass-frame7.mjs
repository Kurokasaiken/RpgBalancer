import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&pcts=96,4&risk=3', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-block="party-slots"]', { timeout: 60000 });
await p.waitForTimeout(2000);
const inject = `(()=>{const w=document.querySelector('[data-block="party-slots"]');
  if(!w)return false;
  const m=document.getElementById('mock-mark');if(m)m.remove();
  w.style.borderImageSource='none';
  const f=document.createElement('div');f.id='mock-mark';
  /* slice piu stretta: la banda disegnata ~ tutto rail solido -> labbro interno bacia il verde */
  f.style.cssText='position:absolute;inset:-26px -30px;border:26px solid transparent;border-width:26px 30px;border-image:url(/assets/ui/hud-real/tmp-mock/frame-A-tight.png) 82 55 40 55 / 26px 30px stretch;pointer-events:none;z-index:2';
  w.appendChild(f);
  const c=document.createElement('img');
  c.src='/assets/ui/hud-real/tmp-mock/frame-A-crest.png';
  c.style.cssText='position:absolute;left:50%;top:0;transform:translate(-50%,-58%);width:104px;height:auto;z-index:3;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))';
  w.appendChild(c);return true})()`;
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
        await p.screenshot({ path: '.mw/runs/r378-cassetto-party-mark/frame-A-outside2.png', clip: { x: cb.x, y: Math.max(0, wb.y - 90), width: cb.width, height: wb.height + 150 } });
        break;
      }
      await p.evaluate(inject);
    }
    break;
  } catch (e) { await p.waitForSelector('[data-block="party-slots"]', { timeout: 30000 }); await p.waitForTimeout(1500); }
}
await b.close();
console.log('done');
