import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('685d5d8b80949fcf'));
console.log('page:', page?.url());
const info = await page.evaluate(() => ({
  fileInputs: document.querySelectorAll('input[type="file"]').length,
  buttons: [...document.querySelectorAll('button')].map(b => (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 60)).filter(t => /caric|upload|allega|agg|file|foto|\+|immagin|strument/i.test(t)),
  uploader: [...document.querySelectorAll('uploader, images-files-uploader, drive-uploader')].map(e => e.tagName),
}));
console.log(JSON.stringify(info, null, 1));
process.exit(0);
