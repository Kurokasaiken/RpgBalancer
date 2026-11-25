import { chromium } from 'playwright';
const page = await (await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })).newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => window.__worldCam?.zoom > 0, null, { timeout: 240000 });
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const nav = document.querySelector('[data-hudslot="nav"]');
  const btns = [...nav.querySelectorAll('button, [role="button"]')];
  return btns.map(b => {
    const r = b.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const stack = document.elementsFromPoint(cx, cy).slice(0, 4).map(el =>
      `${el.tagName}${el.id ? '#' + el.id : ''}${el.className?.baseVal !== undefined ? '' : '.' + (el.className || '').toString().slice(0, 50)}${el.getAttribute?.('aria-label') ? ':' + el.getAttribute('aria-label') : ''}${el.dataset && Object.keys(el.dataset).length ? Object.keys(el.dataset).join(',') : ''}`);
    return { label: b.getAttribute('aria-label'), cx: +cx.toFixed(0), cy: +cy.toFixed(0), stack };
  });
});
console.log(JSON.stringify(info, null, 1));
await page.close();
process.exit(0);
