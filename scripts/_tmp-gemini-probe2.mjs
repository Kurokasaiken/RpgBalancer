import { chromium } from 'playwright';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
console.log('pages:', ctx.pages().length);
// browser-level session: ctx.newPage() creates an ACTIVE tab and raises the window (REG-001/CTR-foreground-001)
const cdp = await browser.newBrowserCDPSession();
const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', background: true });
await cdp.detach();
let page = null;
for (let i = 0; i < 20 && !page; i++) { page = ctx.pages().find(p => p.url() === 'about:blank'); if (!page) await sleep(400); }
console.log('target found:', !!page);
await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 30000 });
console.log('loaded');
await sleep(6000);
const state = await page.evaluate(() => ({
  editors: document.querySelectorAll('[contenteditable="true"]').length,
  inputs: document.querySelectorAll('input[type=file]').length,
  url: location.href,
}));
console.log(JSON.stringify(state));
process.exit(0);
