import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 60000 });
const ctx = browser.contexts()[0];
const pages = ctx.pages().filter(p => p.url().includes('gemini.google.com'));
console.log('gemini tabs:', pages.length);
for (const page of pages) {
  const info = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].filter(e => e.naturalWidth > 64 && !e.src.includes('gstatic') && !e.src.includes('googleusercontent.com/a/'));
    return imgs.map(e => ({ src: e.src.slice(0, 90), w: e.naturalWidth, h: e.naturalHeight }));
  });
  console.log(page.url().slice(0, 60), JSON.stringify(info, null, 1).slice(0, 1500));
}
process.exit(0);
