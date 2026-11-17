import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
for (const ctx of b.contexts()) for (const p of ctx.pages()) {
  if (!/chatgpt\.com\/c\//.test(p.url())) continue;
  const info = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].map(i => ({src:(i.src||'').slice(0,80), nw:i.naturalWidth, w:i.getBoundingClientRect().width}));
    const roles = [...document.querySelectorAll('[data-message-author-role]')].map(e => e.getAttribute('data-message-author-role'));
    const texts = [...document.querySelectorAll('div.markdown, .markdown, [class*=message]')].map(e => (e.innerText||'').trim().slice(0,200)).filter(t => t.length > 40).slice(-6);
    return {imgs: imgs.filter(i => i.nw >= 200), roles, texts};
  });
  console.log(JSON.stringify(info, null, 1).slice(0, 5000));
}
await b.close();
