import { chromium } from 'playwright';
const IMGS = [
  '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/opzione-A.png',
  '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/medaglione-da-solo.png',
  '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/cassetto-open-right.png',
  '/Users/faustoboni/progetti_personali/mind-weaver/.mw/runs/20261110-chatgpt-ghiera/game-full.png',
];
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().filter(pg => pg.url().includes('gemini.google.com')).pop();
await p.locator('button[aria-label="Caricamento e strumenti"]').first().click();
await p.waitForTimeout(1200);
await p.screenshot({path:'/tmp/gemini-menu.png'});
// menu items
const items = await p.locator('[role="menuitem"], [role="option"], button').all();
for (const it of items.slice(-20)) {
  const al = await it.getAttribute('aria-label').catch(()=>null);
  const txt = (await it.innerText().catch(()=>'')).slice(0,60).replace(/\n/g,' ');
  if (al || txt) console.log(JSON.stringify({al, txt}));
}
