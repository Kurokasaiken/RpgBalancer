import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const pages = b.contexts()[0].pages();
const p = pages.find(pg => pg.url().includes('chatgpt.com'));
await p.goto('https://chatgpt.com/c/6af38465-7160-83eb-b00a-aab86ea3a723', {waitUntil:'domcontentloaded'});
await p.waitForTimeout(8000);
const txt = await p.evaluate(() => document.body.innerText.slice(-2000));
console.log(txt);
process.exit(0);
