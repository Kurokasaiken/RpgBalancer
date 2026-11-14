import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__worldCam), undefined, { timeout: 150_000 });
const info = await page.evaluate(() => {
  const out = { layers: window.__worldLayers?.() ?? null, village: [] };
  const app = window.__pixiApp;
  const walk = (n, path) => {
    const rec = { path: path + '/' + (n.label || n.constructor.name), visible: n.visible, x: Math.round(n.x), y: Math.round(n.y), z: n.zIndex, alpha: n.alpha, w: Math.round(n.width), h: Math.round(n.height), kids: n.children?.length };
    if ((n.label || '').includes('village')) out.village.push(rec);
    n.children?.forEach((c) => walk(c, rec.path));
  };
  if (app) walk(app.stage, 'stage');
  return out;
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
