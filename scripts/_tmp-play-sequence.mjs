import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 750 } });
p.setDefaultTimeout(90000);
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => window.__worldCamCtl, { timeout: 90000 });
await p.waitForTimeout(4000);
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'village')?.click());
await p.waitForTimeout(500);
await p.evaluate(() => {
  window.__seq = [];
  const r = [...document.querySelectorAll('input[type=range]')].find((i) => i.parentElement?.previousElementSibling?.textContent?.includes('timeline:'));
  window.__r = r;
  setInterval(() => { const v = window.__r?.value; const s = window.__seq; if (s[s.length-1]?.v !== v) s.push({ t: Math.round(performance.now()), v }); }, 20);
  [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'play')?.click();
});
await p.waitForTimeout(9000);
console.log(JSON.stringify(await p.evaluate(() => ({ max: window.__r?.max, seq: window.__seq }))));
await b.close();
