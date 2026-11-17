import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/gemini\.google\.com/.test(p.url())) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
await page.waitForTimeout(4000);
await page.screenshot({ path: 'test-results/gemini-tab-state.png' });
const info = await page.evaluate(() => ({
  url: location.href.slice(0, 80),
  textareas: [...document.querySelectorAll('[contenteditable=true], textarea')].length,
  fileInputs: [...document.querySelectorAll('input[type=file]')].length,
  buttons: [...document.querySelectorAll('button, [role=button]')].map(x => (x.getAttribute('aria-label') || x.textContent).trim().slice(0, 40)).filter(s => s.length > 1 && s.length < 40).slice(0, 20),
}));
console.log(JSON.stringify(info, null, 1));
await b.close();
