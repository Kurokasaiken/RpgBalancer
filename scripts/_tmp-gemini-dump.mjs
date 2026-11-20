import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 60000 });
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('gemini.google.com'));
if (!page) { console.error('no gemini tab'); process.exit(1); }
const info = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].map(e => ({ src: (e.src||'').slice(0,80), w: e.naturalWidth, alt: (e.alt||'').slice(0,40) })).filter(i => i.w > 64);
  const els = [...document.querySelectorAll('*')].map(e => e.tagName).filter(t => t.includes('-')).filter((v,i,a)=>a.indexOf(v)===i);
  return { imgs, custom: els.filter(t => /image|response|message/i.test(t)).slice(0,30) };
});
console.log(JSON.stringify(info, null, 1).slice(0, 4000));
process.exit(0);
