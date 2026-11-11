import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().filter(pg => pg.url().includes('gemini.google.com')).pop();
const btns = await p.locator('button, [role="button"]').all();
for (const bt of btns.slice(-25)) {
  const al = await bt.getAttribute('aria-label').catch(()=>null);
  const txt = (await bt.innerText().catch(()=>'')).slice(0,40).replace(/\n/g,' ');
  if (al || txt) console.log(JSON.stringify({al, txt}));
}
