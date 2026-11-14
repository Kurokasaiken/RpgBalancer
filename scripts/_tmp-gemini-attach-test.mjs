import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('685d5d8b80949fcf'));
const btn = page.locator('button[aria-label="Caricamento e strumenti"]').first();
await btn.click({ noWaitAfter: true });
await page.waitForTimeout(2000);
let n = await page.evaluate(() => document.querySelectorAll('input[type="file"]').length);
console.log('inputs after click:', n);
if (n === 0) {
  const items = await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"], mat-action-list button, button')].map(e => ({ r: e.getAttribute('role'), t: (e.textContent||'').trim().slice(0,60) })).filter(i => /carica|upload|file|drive/i.test(i.t)));
  console.log('menu items:', JSON.stringify(items));
  const it = page.locator('button:has-text("Carica file")').first();
  if (await it.count()) {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 8000 }),
      it.click({ noWaitAfter: true }),
    ]);
    console.log('chooser opened');
    await chooser.setFiles('.mw/specs/poi-radial/cards/gen/plate-emerald-c0.png');
    await page.waitForTimeout(3000);
    console.log('file set via chooser');
  }
}
process.exit(0);
