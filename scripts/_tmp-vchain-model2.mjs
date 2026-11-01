import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const p = await ctx.newPage();
await p.goto('https://gemini.google.com/app/62fef4ba9be16c58', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(5000);
// find the model selector element
const info = await p.evaluate(() => {
  const els = [...document.querySelectorAll('button, [role="button"], [role="combobox"], [aria-haspopup]')];
  return els.filter((el) => /auto|model|flash|thinking/i.test(el.textContent || '') || /model/i.test(el.getAttribute('aria-label') || ''))
    .map((el) => ({ tag: el.tagName, role: el.getAttribute('role'), aria: el.getAttribute('aria-label'), text: (el.textContent || '').trim().slice(0, 60), cls: (el.className || '').toString().slice(0, 80) }));
});
console.log(JSON.stringify(info, null, 1));
await p.close();
await b.close();
