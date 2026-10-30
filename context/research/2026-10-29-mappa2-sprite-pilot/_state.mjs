import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('0b99710d00e37e5e')) || ctx.pages()[0];
console.log('url:', page.url().slice(0,80));
const st = await page.evaluate(() => {
  const box = document.querySelector('div[contenteditable="true"], .ql-editor');
  const chips = [...document.querySelectorAll('[aria-label*="allegato" i], [aria-label*="attachment" i]')].map(e=>e.getAttribute('aria-label'));
  const inputs = document.querySelectorAll('input[type=file]').length;
  return { hasBox: !!box, boxText: box ? box.textContent.trim().slice(0,80) : null, chips, inputs,
    busy: !!document.querySelector('[class*="loading"], [aria-busy="true"]') };
});
console.log(JSON.stringify(st, null, 1));
await b.close();
