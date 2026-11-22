import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto('http://localhost:5173/hud-charter-review', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForSelector('input[type=radio]', { timeout: 60000 });
await p.waitForTimeout(1500);
const n = await p.evaluate(() => document.querySelectorAll('input[type=radio]').length);
const imgs = await p.evaluate(() => [...document.querySelectorAll('img')].map((i) => ({ src: i.src.split('/').pop(), ok: i.complete && i.naturalWidth > 0 })));
const broken = imgs.filter((i) => !i.ok);
// pick one option and copy-ruling smoke
await p.click('label:has-text("Confermo")');
const done = await p.evaluate(() => document.body.innerText.match(/\d+\/\d+ risposte/)?.[0]);
await p.screenshot({ path: 'test-results/charter-review-probe.png', fullPage: false });
console.log(JSON.stringify({ radios: n, imgs: imgs.length, broken, done, errs }, null, 1));
await b.close();
