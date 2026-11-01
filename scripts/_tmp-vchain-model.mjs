import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const p = await ctx.newPage();
await p.goto('https://gemini.google.com/app/62fef4ba9be16c58', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(5000);
// open the model picker
await p.click('button:has-text("Gemini Auto"), [aria-label*="model" i]:has-text("Auto")').catch(async () => {
  await p.click('text=Gemini Auto').catch(() => {});
});
await p.waitForTimeout(1200);
await p.screenshot({ path: 'out/village-chain/model-picker.png' });
const items = await p.evaluate(() => [...document.querySelectorAll('[role="menuitem"], [role="option"], mat-option, li')].map((el) => el.textContent?.trim().slice(0, 80)).filter(Boolean));
console.log(JSON.stringify(items.slice(0, 20), null, 1));
await p.close();
await b.close();
