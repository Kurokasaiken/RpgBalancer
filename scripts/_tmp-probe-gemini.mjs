import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const cdp = await browser.newBrowserCDPSession();
const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', background: true });
let page;
for (let i = 0; i < 40; i++) { page = ctx.pages().find((p) => p.url() === 'about:blank'); if (page) break; await new Promise((r) => setTimeout(r, 250)); }
await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
console.log('URL:', page.url());
console.log('TITLE:', await page.title());
const info = await page.evaluate(() => ({
  editable: document.querySelectorAll('div[contenteditable="true"]').length,
  ql: document.querySelectorAll('.ql-editor').length,
  ta: document.querySelectorAll('textarea').length,
  taVisible: [...document.querySelectorAll('textarea')].filter(t => t.offsetParent !== null).length,
  bodyText: document.body.innerText.slice(0, 300),
}));
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: 'test-results/gemini-state.png' });
process.exit(0);
