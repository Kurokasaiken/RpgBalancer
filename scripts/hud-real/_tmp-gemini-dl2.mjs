import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().filter(pg => pg.url().includes('gemini.google.com')).pop();
// download button on the generated image
const dl = p.locator('button[aria-label*="Scarica" i], button[aria-label*="Download" i], button:has-text("download")').last();
const dp = p.waitForEvent('download', {timeout: 15000});
await dl.click().catch(async () => {
  // maybe a mat-icon inside a button
  await p.locator('mat-icon:has-text("download"), [data-mat-icon-name="download"]').last().click();
});
const d = await dp;
await d.saveAs('/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/gen/gemini-ghiera-v2.png');
console.log('saved via download:', d.suggestedFilename());
