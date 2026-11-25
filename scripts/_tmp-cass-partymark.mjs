import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&pcts=96,4&risk=3', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-block="party-slots"]', { timeout: 60000 });

const variants = {
  A: `w.appendChild(Object.assign(document.createElement('div'),{id:'mock-mark'}));`,
};

const mk = {
  A: `const c=document.createElement('div');c.id='mock-mark';
    c.style.cssText='position:absolute;top:-9px;left:50%;transform:translateX(-50%);z-index:5;padding:2px 12px;background:#062a24;border:1px solid rgba(214,178,94,.75);border-radius:9px;box-shadow:0 1px 3px rgba(0,0,0,.7)';
    c.innerHTML='<span style="font-family:Marcellus,serif;font-size:10.5px;font-weight:700;letter-spacing:.22em;color:#f3e193;text-shadow:0 1px 2px rgba(0,0,0,.9)">LA COMPAGNIA</span>';w.appendChild(c);`,
  B: `const c=document.createElement('div');c.id='mock-mark';
    c.style.cssText='position:absolute;top:-18px;left:50%;transform:translateX(-50%);z-index:5;width:36px;height:36px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#3d2f14,#17100a 70%);border:1.5px solid rgba(214,178,94,.85);box-shadow:0 1px 4px rgba(0,0,0,.8),inset 0 0 5px rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center';
    c.innerHTML='<img src="/assets/ui/hud-real/slicekit/cassetto/journey-ico-atsite.webp" style="width:23px;height:23px;object-fit:contain"/>';w.appendChild(c);`,
  C: `const c=document.createElement('div');c.id='mock-mark';
    c.style.cssText='position:absolute;top:8px;left:-6px;z-index:5;display:flex;flex-direction:column;align-items:center;gap:4px;padding:7px 5px 9px;background:linear-gradient(180deg,#7a5b1e,#4a340f);border:1px solid rgba(230,196,110,.9);border-radius:0 0 5px 5px;box-shadow:1px 2px 5px rgba(0,0,0,.75)';
    c.innerHTML='<img src="/assets/ui/hud-real/slicekit/cassetto/journey-ico-atsite.webp" style="width:15px;height:15px;object-fit:contain"/><span style="font-family:Marcellus,serif;font-size:8.5px;font-weight:700;letter-spacing:.14em;color:#ffe9ad;writing-mode:vertical-rl;text-shadow:0 1px 2px rgba(0,0,0,.9)">EROI</span>';w.appendChild(c);`,
  D: `const sc=w.querySelector('[data-cassetto-party-scroll]');
    const c=document.createElement('div');c.id='mock-mark';
    c.style.cssText='position:absolute;bottom:2px;left:50%;transform:translateX(-50%);z-index:6;display:flex;align-items:center;gap:5px;padding:0 10px;pointer-events:none';
    c.innerHTML='<span style="font-family:Marcellus,serif;font-size:8px;font-weight:700;letter-spacing:.3em;color:#c8a94e;text-shadow:0 1px 2px rgba(0,0,0,.95)">— LA COMPAGNIA —</span>';
    w.appendChild(c);`,
};

async function inject(body) {
  for (let att = 0; att < 5; att++) {
    try {
      await p.evaluate(`(()=>{const w=document.querySelector('[data-block="party-slots"]');const m=document.getElementById('mock-mark');if(m)m.remove();${body}})()`);
      return;
    } catch (e) { await p.waitForSelector('[data-block="party-slots"]', { timeout: 30000 }); await p.waitForTimeout(1200); }
  }
  throw new Error('inject failed');
}
async function shot(k) {
  for (let att = 0; att < 5; att++) {
    try {
      const col = await p.$('[data-cassetto-column]');
      const well = await p.$('[data-block="party-slots"]');
      const cb = await col.boundingBox(), wb = await well.boundingBox();
      await p.screenshot({ path: `.mw/runs/r378-cassetto-party-mark/${k}.png`, clip: { x: cb.x, y: Math.max(0, wb.y - 46), width: cb.width, height: wb.height + 92 } });
      return;
    } catch (e) { await p.waitForSelector('[data-block="party-slots"]', { timeout: 30000 }); await p.waitForTimeout(1200); }
  }
  throw new Error('shot failed ' + k);
}
await p.waitForTimeout(2000);
for (const [k, body] of Object.entries(mk)) { await inject(body); await p.waitForTimeout(400); await shot(k); }
await b.close();
console.log('done');
