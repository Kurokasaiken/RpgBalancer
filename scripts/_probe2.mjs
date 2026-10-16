import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--use-angle=metal'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text().slice(0,200)); });
await p.goto('http://localhost:5173/quest-window-lab?seed=42', { waitUntil: 'domcontentloaded' });
await p.getByRole('button', { name: /Avvia quest goblin|Start goblin quest/ }).click();
await p.locator('[data-testid="quest-window"]').waitFor();
// advance until overflow
for (let i=0;i<6;i++){
  const ov = await p.evaluate(()=>{const pl=document.querySelector('[data-testid="quest-window"]');return pl.scrollHeight-pl.clientHeight;});
  if (ov>2) break;
  const enabled = await p.evaluate(()=>[...document.querySelectorAll('[data-hud-choices] button[data-skin="choice"]')].filter(b=>!b.disabled).length);
  if (!enabled){ const dl=Date.now()+30000; while(Date.now()<dl){ const st=await p.evaluate(()=>({armed:!!document.querySelector('.da-tira'),ch:[...document.querySelectorAll('[data-hud-choices] button[data-skin="choice"]')].filter(b=>!b.disabled).length})); if(st.armed) await p.locator('.da-tira').click().catch(()=>{}); if(st.ch) break; await p.waitForTimeout(400);} continue; }
  await p.keyboard.press('1'); await p.waitForTimeout(700);
}
const out = await p.evaluate(() => {
  const pl = document.querySelector('[data-testid="quest-window"]');
  const pr = pl.getBoundingClientRect();
  const res = { plaqueBottom: pr.bottom, plaqueH: Math.round(pr.height), kids: [] };
  for (const el of pl.children) {
    const r = el.getBoundingClientRect();
    res.kids.push({ tag: el.tagName, bottom: Math.round(r.bottom), overBottom: Math.round(r.bottom - pr.bottom), offParent: el.offsetParent === null });
  }
  return res;
});
console.log(JSON.stringify(out,null,1));
await b.close();
