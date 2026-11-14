import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const p = b.contexts()[0].pages().find(pg => pg.url().includes('gemini.google.com'));
console.log('URL:', p.url());
await p.screenshot({path:'/tmp/gemini-now.png'});
const btns = await p.evaluate(() => [...document.querySelectorAll('button')].map(x => x.getAttribute('aria-label') || x.innerText.slice(0,40)).filter(Boolean).slice(0,40));
console.log(JSON.stringify(btns, null, 0));
process.exit(0);
