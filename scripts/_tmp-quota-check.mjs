import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 150000 });
const ctx = b.contexts()[0];
const pg = ctx.pages().find((p) => p.url().includes('gemini'));
if (!pg) { console.log('no gemini page'); process.exit(1); }
const txt = await pg.evaluate(() => document.body.innerText.slice(0, 3000));
const q = txt.match(/limit|quota|upgrade|generat/gi);
console.log('matches:', JSON.stringify(q));
console.log('sidebar:', txt.split('\n').filter((l) => /limit|image/i.test(l)).slice(0, 5).join(' | '));
