import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const p = b.contexts()[0].pages().find(x => x.url().includes('gemini.google.com/app'));
console.log('page:', p.url());
const info = await p.evaluate(() => {
  const btns = [...document.querySelectorAll('button')].map(b => ({
    al: b.getAttribute('aria-label'), js: b.getAttribute('jsname'), cls: (b.className||'').toString().slice(0,60)
  })).filter(b => b.al || b.js);
  return btns.slice(0, 60);
});
console.log(JSON.stringify(info, null, 1));
const editors = await p.evaluate(() => [...document.querySelectorAll('[contenteditable="true"], .ql-editor, textarea')].map(e => e.tagName + '.' + (e.className||'').toString().slice(0,50)));
console.log('editors:', JSON.stringify(editors));
await b.close();
