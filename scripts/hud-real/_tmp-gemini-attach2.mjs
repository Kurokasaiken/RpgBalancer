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
let chooser;
try {
  const cp = p.waitForEvent('filechooser', {timeout: 5000});
  await p.locator('button[aria-label*="Carica file"]').first().click();
  chooser = await cp;
} catch(e) {
  // menu may have closed — reopen
  await p.locator('button[aria-label="Caricamento e strumenti"]').first().click();
  await p.waitForTimeout(900);
  const cp = p.waitForEvent('filechooser', {timeout: 5000});
  await p.locator('button[aria-label*="Carica file"]').first().click();
  chooser = await cp;
}
await chooser.setFiles(IMGS);
console.log('attached 4');
await p.waitForTimeout(6000);
await p.screenshot({path:'/tmp/gemini-attached.png'});
