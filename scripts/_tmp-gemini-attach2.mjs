import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const page = browser.contexts()[0].pages().find(p => p.url().includes('685d5d8b80949fcf'));
for (const sel of [
  'button[aria-label*="hidden-local-images-upload-button" i]',
  'button[aria-label*="hidden-local-file-image-selector" i]',
  'button[class*="hidden-local-images-upload" i], button[class*="hidden-local-file-image" i]',
  'button:has-text("Carica file")',
]) {
  const b = page.locator(sel).first();
  if (await b.count() === 0) continue;
  try {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 6000 }),
      b.click({ force: true, noWaitAfter: true }),
    ]);
    await chooser.setFiles('.mw/specs/poi-radial/cards/gen/plate-emerald-c0.png');
    console.log('attached via', sel);
    await page.waitForTimeout(3500);
    await page.screenshot({ path: '.mw/specs/poi-radial/cards/gen/attach-check.png' });
    process.exit(0);
  } catch (e) { console.log('fail', sel.slice(0,50), String(e).slice(0,80)); }
}
console.log('nothing worked');
process.exit(1);
