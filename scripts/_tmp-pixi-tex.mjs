import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => { const t = m.text(); if (t.includes('village')) console.log('[console]', t.slice(0, 200)); });
await page.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__worldCam), undefined, { timeout: 150_000 });
const info = await page.evaluate(() => {
  const app = window.__pixiApp;
  const out = [];
  const walk = (n) => {
    if (n.label === 'village-zone') {
      n.children?.forEach((c) => {
        const t = c.texture;
        out.push({
          child: c.label || c.constructor.name, visible: c.visible, alpha: c.alpha,
          texW: t ? Math.round(t.width) : null, texValid: t ? (t !== undefined && t.width > 2) : null,
          isSprite: !!c.texture,
        });
      });
    }
    n.children?.forEach(walk);
  };
  if (app) walk(app.stage);
  return out;
});
console.log(JSON.stringify(info));
await browser.close();
