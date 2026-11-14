import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().filter(pg => pg.url().includes('grok.com')).pop();
await p.goto('https://grok.com/c/b9b22485-c9e2-4f3d-a1ca-7ba64f4d03b9?rid=7a5218b8-0f22-48e2-ac7d-78c3de07690a', {waitUntil:'domcontentloaded'});
await p.waitForTimeout(12000);
await p.screenshot({path:'/tmp/grok-conv.png'});
const srcs = await p.evaluate(() => [...document.querySelectorAll('img')].map(i=>({src:i.src.slice(0,140),w:i.naturalWidth})).filter(i=>i.w>150));
console.log(JSON.stringify(srcs.slice(-10)));
