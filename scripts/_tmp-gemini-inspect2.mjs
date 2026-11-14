import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url() === 'https://gemini.google.com/app' || p.url().endsWith('/app'));
const btn = page.locator('button[aria-label*="Caricamento e strumenti" i], button[aria-label*="pload" i]').first();
await btn.click();
await page.waitForTimeout(1200);
const info = await page.evaluate(() => {
  const items = [...document.querySelectorAll('[role="menuitem"], [role="menu"] *, mat-menu *, button')].filter(e => {
    const t = (e.textContent || '').trim();
    return t && t.length < 80 && /upload|carica|file|foto|immagin|video|drive|canvas|strumenti|strumento/i.test(t);
  }).map(e => ({ role: e.getAttribute('role'), tag: e.tagName, text: e.textContent.trim().slice(0, 70) }));
  return items.slice(0, 20);
});
console.log(JSON.stringify(info, null, 1));
const nfi = await page.locator('input[type="file"]').count();
console.log('file inputs now:', nfi);
await page.screenshot({ path: '/tmp/gemini-menu.png' });
process.exit(0);
