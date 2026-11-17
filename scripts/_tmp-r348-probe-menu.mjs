import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
for (const ctx of b.contexts()) for (const p of ctx.pages()) {
  if (!/chatgpt\.com\/c\//.test(p.url())) continue;
  const btn = p.locator('button[aria-label*="Aggiungi file" i]').first();
  await btn.click().catch(e => console.log('click err', e.message));
  await p.waitForTimeout(1500);
  const dump = await p.evaluate(() => {
    const sels = '[role=menu],[role=menuitem],[data-radix-popper-content-wrapper] *,[cmdk-item],[role=option],div[class*=popover] *';
    return [...document.querySelectorAll(sels)]
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
      .map(e => ({role: e.getAttribute('role'), al: e.getAttribute('aria-label'), txt: (e.innerText||'').trim().slice(0,60), tag: e.tagName}))
      .filter(i => i.txt || i.al).slice(0, 40);
  });
  console.log('MENU ITEMS:', JSON.stringify(dump, null, 1));
  /* also list file inputs with their DOM ancestry for wiring */
  const fins = await p.evaluate(() => [...document.querySelectorAll('input[type=file]')].map((i,ix) => {
    let a = i, path = [];
    for (let d = 0; d < 5 && a; d++) { path.push(`${a.tagName}${a.id?'#'+a.id:''}${a.getAttribute('data-testid')?'['+a.getAttribute('data-testid')+']':''}`); a = a.parentElement; }
    return {ix, accept: i.accept, path: path.join('<')};
  }));
  console.log('FILE INPUTS:', JSON.stringify(fins, null, 1));
}
await b.close();
