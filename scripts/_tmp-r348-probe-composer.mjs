import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
for (const ctx of b.contexts()) for (const p of ctx.pages()) {
  if (!/chatgpt\.com/.test(p.url())) continue;
  console.log('TAB:', p.url().slice(0, 90));
  const info = await p.evaluate(() => ({
    fileInputs: [...document.querySelectorAll('input[type=file]')].map(i => ({accept: i.accept, hidden: i.hidden, cls: i.className.slice(0,60)})),
    buttons: [...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width>0 && r.bottom > innerHeight-200; }).map(b => ({al: b.getAttribute('aria-label'), dt: b.getAttribute('data-testid'), txt: (b.textContent||'').trim().slice(0,30)})),
    contenteditable: [...document.querySelectorAll('[contenteditable=true]')].length,
  }));
  console.log(JSON.stringify(info, null, 1).slice(0, 4000));
}
await b.close();
