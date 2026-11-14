import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('c223f539ea039063'));
if (!page) { console.log('chat tab not found'); process.exit(3); }
const info = await page.evaluate(() => {
  const d = document.querySelector('mat-dialog-container, .cdk-overlay-container [role="dialog"], mat-dialog-actions');
  return {
    dialog: d ? d.textContent.trim().slice(0, 300) : null,
    overlayKids: [...document.querySelectorAll('.cdk-overlay-container > *')].map((e) => e.className.slice(0, 60) + '|' + e.textContent.trim().slice(0, 80)),
  };
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: 'test-results/gemini-dialog.png' });
// prova a chiudere: Escape + eventuale bottone annulla/chiudi
await page.keyboard.press('Escape');
await page.waitForTimeout(800);
for (const sel of ['button:has-text("Annulla")', 'button:has-text("Cancel")', 'button:has-text("Chiudi")', 'button:has-text("Close")', 'button[aria-label*="hiudi" i]']) {
  const b = page.locator(sel).first();
  if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await page.waitForTimeout(500); }
}
const after = await page.evaluate(() => document.querySelectorAll('.cdk-overlay-container mat-dialog-container, .cdk-overlay-container [role="dialog"]').length);
console.log('dialogs after dismiss:', after);
process.exit(0);
