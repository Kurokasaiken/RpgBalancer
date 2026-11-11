import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().filter(pg => pg.url().includes('gemini.google.com')).pop();
await p.locator('button[aria-label="Invia messaggio"]').first().click();
console.log('sent, waiting for response...');
await p.waitForTimeout(90000);
await p.screenshot({path:'/tmp/gemini-response.png'});
// extract any generated images
const imgs = await p.locator('img').all();
const srcs = [];
for (const im of imgs) { const s = await im.getAttribute('src').catch(()=>null); if (s && (s.includes('generated') || s.includes('image') || s.startsWith('blob'))) srcs.push(s); }
console.log('imgs:', srcs.slice(-10));
