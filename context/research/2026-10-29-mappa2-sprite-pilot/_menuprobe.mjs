import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('0b99710d00e37e5e')) || ctx.pages()[0];
const ob = page.locator('button[aria-label*="Caricamento" i]').first();
console.log('btn count:', await ob.count(), 'visible:', await ob.isVisible().catch(()=>false));
await ob.click({ timeout: 4000 });
await page.waitForTimeout(1200);
const items = await page.evaluate(() =>
  [...document.querySelectorAll('[role="menu"] *, [role="menuitem"], [role="option"], mat-menu *')]
    .filter(e => e.offsetParent !== null)
    .map(e => `${e.tagName}[role=${e.getAttribute('role')}] "${(e.textContent||'').trim().slice(0,50)}"`)
    .slice(0, 20));
console.log(JSON.stringify(items, null, 1));
// prova il click sulla voce File
const it = page.locator('[role="menu"] button:has-text("File"), [role="menuitem"]:has-text("File")').first();
console.log('file item:', await it.count());
try {
  const [fc] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 6000 }),
    it.click(),
  ]);
  console.log('filechooser OK');
  await fc.setFiles('/Users/faustoboni/progetti_personali/RPG/context/research/2026-10-29-mappa2-sprite-pilot/refs/villaggio-rb.jpg');
  await page.waitForTimeout(8000);
  const chips = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-label]')]
      .filter(e => /allegat|attach|immagine|image|error|riprova/i.test(e.getAttribute('aria-label')||''))
      .map(e => e.getAttribute('aria-label')).slice(0,10));
  console.log('chips:', JSON.stringify(chips));
} catch (e) { console.log('filechooser FAIL:', e.message.slice(0,120)); }
await page.screenshot({ path: '/tmp/menuprobe.png' });
await b.close();
