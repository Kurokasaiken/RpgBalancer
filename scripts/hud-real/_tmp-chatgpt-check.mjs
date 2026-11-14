import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const pages = b.contexts()[0].pages();
const p = pages.find(pg => pg.url().includes('chatgpt.com')) || pages.find(pg => pg.url().includes('chat.openai.com'));
if (!p) { console.log('NO_CHATGPT_TAB'); process.exit(0); }
console.log('URL:', p.url().slice(0,120));
await p.bringToFront().catch(()=>{});
await p.reload({waitUntil:'domcontentloaded'});
await p.waitForTimeout(6000);
const txt = await p.evaluate(() => document.body.innerText.slice(-1500));
console.log(txt);
process.exit(0);
