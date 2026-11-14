import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__worldCam && window.__worldCamCtl), undefined, { timeout: 150_000 });
await page.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 640 / 1.4, panY: 700 - 400 / 1.4, zoom: 1.4 }));
for (let i = 0; i < 3; i++) {
  await page.waitForTimeout(3000);
  const st = await page.evaluate(() => {
    const app = window.__pixiApp; const out = {};
    const walk = (n) => {
      if (n.label === 'village-zone') {
        out.zoneVisible = n.visible;
        n.children.forEach((c, i) => { out[`s${i}`] = { a: c.alpha?.toFixed(3), vis: c.visible }; });
      }
      n.children?.forEach(walk);
    };
    walk(app.stage);
    return out;
  });
  console.log(`t+${(i + 1) * 3}s`, JSON.stringify(st));
}
await page.screenshot({ path: 'test-results/poi-luogo-radial/v2-village-zoom14.png' });
await browser.close();
