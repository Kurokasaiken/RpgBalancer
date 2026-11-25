import { chromium } from 'playwright';
const page = await (await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })).newPage({ viewport: { width: 1600, height: 900 } });
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text().slice(0, 200)); });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => window.__worldCam?.zoom > 0, null, { timeout: 240000 });
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const nav = document.querySelector('[data-hudslot="nav"]');
  const btns = [...nav.querySelectorAll('button, [role="button"]')];
  return btns.map(b => {
    const r = b.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const el = document.elementFromPoint(cx, cy);
    let chain = [];
    let e = el;
    while (e && chain.length < 6) { chain.push(`${e.tagName}${e === b ? '[BUTTON]' : ''}${e.getAttribute?.('aria-label') ? ':' + e.getAttribute('aria-label') : ''}${e.dataset ? Object.keys(e.dataset).map(k => `[data-${k}]`).join('') : ''}`); e = e.parentElement; }
    return { label: b.getAttribute('aria-label'), cx, cy, topHit: chain.join(' < ') };
  });
});
console.log(JSON.stringify(info, null, 1));
await page.close();
process.exit(0);
