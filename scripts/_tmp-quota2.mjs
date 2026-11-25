import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 150000 });
const ctx = b.contexts()[0];
const pages = ctx.pages().filter((p) => p.url().includes('gemini'));
console.log('gemini pages:', pages.length);
for (const pg of pages) {
  const txt = await pg.evaluate(() => document.body.innerText);
  const lim = txt.match(/[^\n]*(limit|reached|quota|upgrade)[^\n]*/gi);
  const url = pg.url().slice(0, 60);
  console.log('---', url, '| limit-lines:', JSON.stringify((lim || []).slice(0, 4)));
}
