import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__worldCam && window.__worldCamCtl), undefined, { timeout: 150_000 });
await page.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 640 / 1.4, panY: 700 - 400 / 1.4, zoom: 1.4 }));
await page.waitForFunction(() => {
  const app = window.__pixiApp; let done = false;
  const walk = (n) => { if (n.label === 'village-zone') { const up = n.children.find((c) => c.alpha !== 1); done = !up || up.alpha === 0; } n.children?.forEach(walk); };
  walk(app.stage); return done;
}, undefined, { timeout: 120_000 });
await page.waitForTimeout(2500);
const vs = await page.evaluate(() => { const cam = window.__worldCam; return { x: (1515 - cam.panX) * cam.zoom, y: (700 - cam.panY) * cam.zoom }; });
await page.mouse.click(vs.x, vs.y);
await page.waitForTimeout(900);
await page.screenshot({ path: 'test-results/poi-luogo-radial/mat-vetro.png', timeout: 60000 });
// modalità aperto
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'aperto'); b?.click(); });
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-results/poi-luogo-radial/mat-aperto.png', timeout: 60000 });
// modalità arco
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'arco'); b?.click(); });
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-results/poi-luogo-radial/mat-arco.png', timeout: 60000 });
await browser.close();
console.log('DONE');
