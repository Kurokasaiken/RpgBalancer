import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const p = await ctx.newPage();
await p.goto('https://gemini.google.com/app/62fef4ba9be16c58', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(6000);
for (let i = 0; i < 8; i++) { await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(700); }
const n = await p.evaluate(() => [...document.querySelectorAll('GENERATED-IMAGE img, SINGLE-IMAGE img')].filter((el) => el.naturalWidth > 32).length);
console.log('generated images in chat:', n);
await p.screenshot({ path: 'out/village-chain/chat-state.png' });
await p.close();
await b.close();
