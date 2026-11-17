import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/chatgpt\.com/.test(p.url())) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
const state = await page.evaluate(() => {
  const ce = document.querySelector('[contenteditable=true]');
  const btn = document.querySelector('button[aria-label*="Invia" i], button[data-testid="send-button"]');
  return { textLen: ce ? ce.textContent.length : -1, btnExists: !!btn, btnDisabled: btn?.disabled,
    overlays: [...document.querySelectorAll('[role=dialog], .modal, [data-testid*="modal" i]')].length };
});
console.log('state:', JSON.stringify(state));
/* try force click first, fallback Enter */
try {
  await page.locator('button[aria-label*="Invia" i], button[data-testid="send-button"]').first().click({ force: true, timeout: 8000 });
  console.log('force-clicked send');
} catch (e) {
  console.log('force click failed, trying Enter');
  await page.locator('[contenteditable=true]').first().focus();
  await page.keyboard.press('Enter');
}
await page.waitForTimeout(5000);
const streaming = await page.locator('button[aria-label*="Stop" i], button[data-testid="stop-button"]').count();
const ceText = await page.evaluate(() => document.querySelector('[contenteditable=true]')?.textContent?.length ?? -1);
console.log('after: streaming btns:', streaming, 'composer text len:', ceText);
await b.close();
