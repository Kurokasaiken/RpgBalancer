/* R-378 rev2: jewel pulse phase sampling — computed opacity/transform over time. */
import { chromium } from 'playwright';
const URL = 'http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&risk=3&pcts=28,74&reward=4&cansend=1';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForSelector('.cta-jewel', { timeout: 60000 });
const sample = () => p.evaluate(() =>
  [...document.querySelectorAll('.cta-jewel')].map((j) => {
    const s = getComputedStyle(j);
    const r = j.getBoundingClientRect();
    return { op: +s.opacity, tr: s.transform.slice(7, 30), anim: s.animationName, x: r.x | 0, y: r.y | 0, w: r.width | 0 };
  }));
for (const t of [0, 300, 600, 900, 1200, 1600]) {
  if (t) await new Promise((r) => setTimeout(r, 300));
  console.log(`t~${t}:`, JSON.stringify(await sample()));
}
await b.close();
