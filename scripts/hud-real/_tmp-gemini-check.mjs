import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const pages = b.contexts()[0].pages();
const p = pages.find(pg => pg.url().includes('gemini.google.com'));
if (!p) { console.log('NO GEMINI TAB'); process.exit(0); }
console.log('URL:', p.url().slice(0,140));
const txt = await p.evaluate(() => document.body.innerText.slice(-800));
console.log(txt);
process.exit(0);
