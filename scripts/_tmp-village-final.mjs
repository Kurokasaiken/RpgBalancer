import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__worldCam && window.__worldCamCtl), undefined, { timeout: 150_000 });
await page.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 640 / 1.4, panY: 700 - 400 / 1.4, zoom: 1.4 }));
// attendi warmup palizzata: upper sprite esce da alpha 0.001 / lower cambia
await page.waitForFunction(() => {
  const app = window.__pixiApp;
  let done = false;
  const walk = (n) => {
    if (n.label === 'village-zone') {
      const up = n.children.find((c) => c.alpha !== 1);
      done = !up || up.alpha === 0;
    }
    n.children?.forEach(walk);
  };
  walk(app.stage);
  return done;
}, undefined, { timeout: 120_000 });
await page.waitForTimeout(2500);
const vs = await page.evaluate(() => {
  const cam = window.__worldCam;
  return { x: (1515 - cam.panX) * cam.zoom, y: (700 - cam.panY) * cam.zoom };
});
await page.mouse.move(vs.x, vs.y);
await page.waitForTimeout(600);
await page.screenshot({ path: 'test-results/poi-luogo-radial/v5-hover.png', timeout: 60000 });
await page.mouse.move(200, 700);
await page.mouse.click(vs.x, vs.y);
await page.waitForTimeout(600);
await page.screenshot({ path: 'test-results/poi-luogo-radial/v5-radial.png', timeout: 60000 });
await browser.close();
console.log('DONE');
