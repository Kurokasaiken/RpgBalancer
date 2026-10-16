import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--use-angle=metal'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await p.goto('http://localhost:5173/quest-window-lab?seed=42', { waitUntil: 'domcontentloaded' });
await p.getByRole('button', { name: /Avvia quest goblin|Start goblin quest/ }).click();
await p.locator('[data-testid="quest-window"]').waitFor();
for (let i=0;i<8;i++){
  const ov = await p.evaluate(()=>{const pl=document.querySelector('[data-testid="quest-window"]');return pl?pl.scrollHeight-pl.clientHeight:-1;});
  if (ov>2) break;
  const en = await p.evaluate(()=>[...document.querySelectorAll('[data-hud-choices] button[data-skin="choice"]')].filter(b=>!b.disabled).length);
  if (!en){ const dl=Date.now()+30000; while(Date.now()<dl){ const st=await p.evaluate(()=>({armed:!!document.querySelector('.da-tira'),ch:[...document.querySelectorAll('[data-hud-choices] button[data-skin="choice"]')].filter(b=>!b.disabled).length})); if(st.armed) await p.locator('.da-tira').click().catch(()=>{}); if(st.ch) break; await p.waitForTimeout(400);} continue; }
  await p.keyboard.press('1'); await p.waitForTimeout(700);
}
// EXACT copy of measureOutside's evaluate body (minus TS types)
try {
const out = await p.evaluate(() => {
  const TOL = 2;
  const vw = window.innerWidth, vh = window.innerHeight;
  const viewport = { left: 0, right: vw, top: 0, bottom: vh };
  const plaque = document.querySelector('[data-testid="quest-window"], [data-testid="quest-window-minimised"]');
  const plaqueBox = plaque?.getBoundingClientRect();
  const over = (r, b_) => ({ left: Math.max(0, Math.round(b_.left - r.left)), right: Math.max(0, Math.round(r.right - b_.right)), top: Math.max(0, Math.round(b_.top - r.top)), bottom: Math.max(0, Math.round(r.bottom - b_.bottom)) });
  const exceeds = (o) => o.left > TOL || o.right > TOL || o.top > TOL || o.bottom > TOL;
  const describe = (el) => { const r = el.getBoundingClientRect(); return { tag: el.tagName.toLowerCase(), testid: el.getAttribute('data-testid'), label: (el.textContent ?? '').replace(/\s+/g,' ').trim().slice(0,60), rect: {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)} }; };
  const INTERACTIVE = 'button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const seen = new Set();
  const outsidePlaque = [], outsideViewport = [];
  const push = (list, el, kind, bound) => { const r = el.getBoundingClientRect(); const o = over(r, bound); if (!exceeds(o)) return; if (seen.has(el)) return; seen.add(el); list.push({...describe(el), kind, over: o}); };
  if (plaqueBox && plaque) {
    for (const el of plaque.querySelectorAll(`${INTERACTIVE}, p`)) { if (el.offsetParent === null) continue; push(outsidePlaque, el, 'descendant', plaqueBox); }
    for (const el of plaque.children) { if (el.tagName.toLowerCase()==='svg') continue; if (el.offsetParent === null) continue; push(outsidePlaque, el, 'descendant', plaqueBox); }
  }
  const owned = new Set();
  for (const el of document.querySelectorAll('[data-hud-panel="quest"] *')) owned.add(el);
  for (const el of document.querySelectorAll('[data-quest-owned]')) { owned.add(el); for (const sub of el.querySelectorAll('*')) owned.add(sub); }
  for (const el of owned) {
    const isCompanion = el.closest('[data-hud-companion]') === el || el.hasAttribute('data-hud-companion');
    const measurable = el.matches(INTERACTIVE) || el.tagName==='P' || el.hasAttribute('data-hud-companion') || el.hasAttribute('data-testid');
    if (!measurable) continue;
    if (el.offsetParent === null) continue;
    push(outsideViewport, el, isCompanion ? 'companion':'questOwned', viewport);
  }
  return { outsidePlaque, outsideViewport };
});
console.log(JSON.stringify(out, null, 1).slice(0, 3000));
} catch(e) { console.log('EVAL THREW:', String(e).slice(0,400)); }
await b.close();
