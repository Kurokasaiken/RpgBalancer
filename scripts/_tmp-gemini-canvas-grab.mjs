import { chromium } from 'playwright';
import fs from 'fs';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 60000 });
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('gemini.google.com/app/39b93234'));
if (!page) { console.error('tab not found'); process.exit(1); }
const dataUrl = await page.evaluate(() => {
  const img = [...document.querySelectorAll('MODEL-RESPONSE img, model-response img')].filter(e => e.naturalWidth > 64).pop();
  if (!img) return null;
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0);
  return c.toDataURL('image/png');
});
if (!dataUrl) { console.error('no img'); process.exit(2); }
fs.writeFileSync('test-results/slicekit/frame-smeraldo/stash-interior/gen/stash-icons-sheet.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
console.log('saved clean sheet');
process.exit(0);
