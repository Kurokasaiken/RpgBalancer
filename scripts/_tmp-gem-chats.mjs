import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
const p = await ctx.newPage();
await p.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(5000);
const icons = await p.locator('bard-sidenav button, bard-sidenav [role="button"], bard-sidenav a, bard-sidenav mat-icon').all();
await icons[2].click().catch(() => {});
await p.waitForTimeout(2000);
const link = p.locator('a[href*="/app/"]').filter({ hasText: 'Fantasy HUD Crest' }).first();
const href = await link.getAttribute('href');
console.log('href', href);
await link.click();
await p.waitForTimeout(5000);
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(1500);
// collect all generated imgs + prompts text
const data = await p.evaluate(() => {
  const imgs = [...document.querySelectorAll('GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, .generated-image img')].map(i => ({ src: (i.src || '').slice(0, 60), w: i.naturalWidth }));
  const txt = document.body.innerText.slice(0, 4000);
  return { n: imgs.length, imgs: imgs.slice(0, 20), txt };
});
console.log('imgs', data.n, JSON.stringify(data.imgs));
console.log('--- TEXT ---');
console.log(data.txt);
await p.screenshot({ path: '.mw/runs/20261124-time-sun-restore/gemini-chat.png', fullPage: false });
await p.close();
await b.close();
