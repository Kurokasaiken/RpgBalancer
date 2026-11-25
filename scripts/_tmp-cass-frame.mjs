import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&pcts=96,4&risk=3', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-block="party-slots"]', { timeout: 60000 });
await p.waitForTimeout(2000);
for (const k of ['frame-top-crest','frame-corner-helms','frame-sword-rail']) {
  for (let att = 0; att < 6; att++) {
    try {
      await p.evaluate(`(()=>{const w=document.querySelector('[data-block="party-slots"]');const m=document.getElementById('mock-mark');if(m)m.remove();
        const rack=w.querySelector('[data-cassetto-rack]');rack.style.position='relative';rack.style.zIndex='1';
        const c=document.createElement('img');c.id='mock-mark';
        c.src='/assets/ui/hud-real/tmp-mock/${k}.png';
        c.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;object-fit:fill';
        w.appendChild(c);})()`);
      await p.waitForTimeout(500);
      const col = await p.$('[data-cassetto-column]');
      const well = await p.$('[data-block="party-slots"]');
      const cb = await col.boundingBox(), wb = await well.boundingBox();
      await p.screenshot({ path: `.mw/runs/r378-cassetto-party-mark/${k}.png`, clip: { x: cb.x, y: Math.max(0, wb.y - 40), width: cb.width, height: wb.height + 90 } });
      break;
    } catch (e) { await p.waitForSelector('[data-block="party-slots"]', { timeout: 30000 }); await p.waitForTimeout(1500); }
  }
}
await b.close();
console.log('done');
