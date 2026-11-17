import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/chatgpt\.com/.test(p.url())) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
await page.screenshot({ path: 'test-results/gpt-tab-state.png' });
const info = await page.evaluate(() => ({
  url: location.href.slice(0, 100),
  dialogs: [...document.querySelectorAll('[role=dialog]')].map(d => d.textContent.slice(0, 120)),
  h1: [...document.querySelectorAll('h1,h2')].map(h => h.textContent.slice(0, 80)).slice(0, 6),
  buttons: [...document.querySelectorAll('button')].map(x => x.getAttribute('aria-label') || x.textContent.slice(0, 30)).filter(Boolean).slice(0, 15),
}));
console.log(JSON.stringify(info, null, 1));
await b.close();
