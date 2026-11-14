import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().filter(pg => pg.url().includes('grok.com')).pop();
if (!p) { console.log('no grok tab'); process.exit(1); }
await p.waitForTimeout(25000);
await p.screenshot({path:'/tmp/grok-resp.png', fullPage:false});
const srcs = await p.evaluate(() => [...document.querySelectorAll('img')].map(i=>({src:i.src.slice(0,120),w:i.naturalWidth})).filter(i=>i.w>150));
console.log(JSON.stringify(srcs.slice(-12), null, 1));
