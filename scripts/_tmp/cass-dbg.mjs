import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&risk=3&pcts=28,74&reward=4', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('[data-cassetto-column]', { timeout: 120000 });
await page.waitForTimeout(800);
const out = await page.evaluate(() => {
  const r = (el) => el ? (() => { const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(0), y: +b.y.toFixed(0), w: +b.width.toFixed(0), h: +b.height.toFixed(0) }; })() : null;
  const q = (s) => document.querySelector(s);
  return {
    risk: r(q('[data-testid="cassetto-risk-well"]')),
    reward: r(q('[data-testid="cassetto-reward-well"]')),
    col: r(q('[data-cassetto-column]')),
    scrollH: document.documentElement.scrollHeight,
    vp: { w: innerWidth, h: innerHeight, sy: scrollY },
  };
});
console.log(JSON.stringify(out));
await browser.close();
