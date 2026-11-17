import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://www.tambudigital.com/it/prima-pubblicazione/candidatura', { waitUntil: 'networkidle' });
const info = await page.evaluate(() => {
  const els = [...document.querySelectorAll('input, textarea, select, button, [type="file"]')];
  return els.map(e => ({
    tag: e.tagName, type: e.type, id: e.id, name: e.name,
    label: e.labels?.[0]?.innerText?.trim()?.split('\n')[0]?.slice(0, 60) || null,
    text: (e.innerText || '').split('\n')[0].slice(0, 50),
  }));
});
for (const e of info) console.log(`${e.tag}|${e.type}|${e.id}|${e.label||e.text}`);
await browser.close();
