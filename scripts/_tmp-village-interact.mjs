import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__worldCam && window.__worldCamCtl), undefined, { timeout: 150_000 });
await page.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 640 / 1.4, panY: 700 - 400 / 1.4, zoom: 1.4 }));
await page.waitForTimeout(4000);
// 1) hover sul villaggio → scheda avorio (HudRealPanel)
const vs = await page.evaluate(() => {
  const cam = window.__worldCam;
  return { x: (1515 - cam.panX) * cam.zoom, y: (700 - cam.panY) * cam.zoom };
});
await page.mouse.move(vs.x, vs.y);
await page.waitForTimeout(600);
await page.screenshot({ path: 'test-results/poi-luogo-radial/v3-hover.png' });
const card = await page.evaluate(() => {
  const el = document.querySelector('[data-lab="place-card"], .hud-real-panel, [class*="HudReal"]');
  return el ? { found: true, cls: el.className.slice(0, 80) } : { found: false };
});
console.log('HOVER CARD:', JSON.stringify(card));
// 2) click sul villaggio → radiale
await page.mouse.move(200, 700);
await page.mouse.click(vs.x, vs.y);
await page.waitForTimeout(500);
const radial = await page.evaluate(() => {
  const menu = document.querySelector('[role="menu"], [data-lab="place-radial"]');
  const items = document.querySelectorAll('[role="menuitem"]').length;
  return { menu: !!menu, items };
});
console.log('RADIAL:', JSON.stringify(radial));
await page.screenshot({ path: 'test-results/poi-luogo-radial/v3-radial-vetro.png' });
// 3) dwell su una slice → card della slice
if (radial.menu) {
  const el = await page.evaluate(() => {
    const m = document.querySelectorAll('[role="menuitem"]')[2];
    if (!m) return null;
    const r = m.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (el) {
    await page.mouse.move(el.x, el.y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/poi-luogo-radial/v3-radial-dwell.png' });
  }
}
// 4) modalità "aperto" (vuoti nascosti)
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const b = btns.find((x) => x.textContent.trim() === 'aperto');
  b?.click();
});
await page.waitForTimeout(400);
await page.screenshot({ path: 'test-results/poi-luogo-radial/v3-radial-aperto.png' });
// 5) modalità "arco"
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const b = btns.find((x) => x.textContent.trim() === 'arco');
  b?.click();
});
await page.waitForTimeout(400);
await page.screenshot({ path: 'test-results/poi-luogo-radial/v3-radial-arco.png' });
await browser.close();
console.log('DONE');
