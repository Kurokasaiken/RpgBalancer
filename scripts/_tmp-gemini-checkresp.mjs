import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 60000 });
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('gemini.google.com'));
if (!page) { console.error('no gemini tab'); process.exit(1); }
const txt = await page.evaluate(() => {
  const r = [...document.querySelectorAll('MODEL-RESPONSE, model-response')].pop();
  return r ? r.innerText.slice(0, 1500) : 'NO RESPONSE EL';
});
console.log(txt);
process.exit(0);
