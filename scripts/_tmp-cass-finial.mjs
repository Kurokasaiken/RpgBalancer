import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&pcts=96,4&risk=3', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-block="party-slots"]', { timeout: 60000 });
await p.waitForTimeout(2000);
const F = { 'crest-1': 210, 'crest-2': 200, 'helm-1': 150, 'helm-2': 132 };
const H = { 'crest-1': 510/1708, 'crest-2': 472/1727, 'helm-1': 626/1366, 'helm-2': 623/969 };
for (const [k, wpx] of Object.entries(F)) {
  for (let att = 0; att < 6; att++) {
    try {
      await p.evaluate(`(()=>{const w=document.querySelector('[data-block="party-slots"]');const m=document.getElementById('mock-mark');if(m)m.remove();
        const c=document.createElement('img');c.id='mock-mark';
        c.src='/assets/ui/hud-real/tmp-mock/${k}.png';
        c.style.cssText='position:absolute;top:${Math.round(-wpx * H[k] * 0.5)}px;left:50%;transform:translateX(-50%);width:${wpx}px;z-index:60;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.75))';
        w.appendChild(c);return c.complete;})()`);
      await p.waitForTimeout(500);
      const col = await p.$('[data-cassetto-column]');
      const well = await p.$('[data-block="party-slots"]');
      const cb = await col.boundingBox(), wb = await well.boundingBox();
      await p.screenshot({ path: `.mw/runs/r378-cassetto-party-mark/fin-${k}.png`, clip: { x: cb.x, y: Math.max(0, wb.y - 60), width: cb.width, height: wb.height + 110 } });
      break;
    } catch (e) { await p.waitForSelector('[data-block="party-slots"]', { timeout: 30000 }); await p.waitForTimeout(1500); }
  }
}
await b.close();
console.log('done');
