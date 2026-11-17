import { chromium } from 'playwright';
const IMG = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261115-r348-victory-mockup/witness-popup.png';
const b = await chromium.connectOverCDP('http://localhost:9222');
for (const ctx of b.contexts()) for (const p of ctx.pages()) {
  if (!/chatgpt\.com\/c\//.test(p.url())) continue;
  for (const ix of [0]) {
    const fi = p.locator('input[type=file]').nth(ix);
    await fi.setInputFiles(IMG).catch(e => console.log(`input ${ix} set err`, e.message.slice(0,80)));
    await p.waitForTimeout(2500);
    const state = await p.evaluate(() => ({
      chips: [...document.querySelectorAll('img[src^="blob:"],img[src^="data:image"],[data-testid*=attachment],[class*=attachment] img,[class*=thumbnail] img')].map(e => ({tag:e.tagName, src:(e.src||'').slice(0,40), dt:e.getAttribute('data-testid'), cls:(e.className||'').toString().slice(0,60)})),
      composerTxt: document.querySelector('[contenteditable=true]')?.innerText?.slice(0,50),
    }));
    console.log(`input ${ix}:`, JSON.stringify(state, null, 1));
  }
}
await b.close();
