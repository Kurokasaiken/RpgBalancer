import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().find(pg => pg.url().includes('gemini.google.com'));
// find the generated image, hover its container, click download icon
const img = p.locator('img[src*="4738ab21"]').first();
await img.scrollIntoViewIfNeeded();
await img.hover();
await p.waitForTimeout(800);
// the download button is in the image action bar
const dl = p.locator('button[aria-label*="ownload"], button[aria-label*="Scarica"], [aria-label*="ownload"], [aria-label*="Scarica"]').last();
const [download] = await Promise.all([
  p.waitForEvent('download', {timeout:20000}),
  dl.click({timeout:10000}),
]);
await download.saveAs('/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/gen/gemini-dentini.png');
console.log('saved:', download.suggestedFilename());
process.exit(0);
