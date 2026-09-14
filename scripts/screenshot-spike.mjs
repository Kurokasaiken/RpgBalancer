import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const url = process.argv[2] || 'http://localhost:5174/voronoi-sea-spike.html';
const out = process.argv[3] || 'test-results/sea-spike-screenshot.png';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.goto(url, { waitUntil: 'networkidle' });
// wait for the render loop to start and FPS to update
await page.waitForFunction(() => document.getElementById('fps')?.textContent.includes('fps'));
await page.waitForTimeout(800);
// Increase magnification to inspect the pattern
await page.evaluate(() => {
  if (window.__debugState) {
    window.__debugState.magnification = 2;
    if (typeof layoutStage === 'function') layoutStage();
  }
});
await page.waitForTimeout(500);

const outPath = fileURLToPath(new URL(`file://${path.resolve(out)}`));
await page.screenshot({ path: outPath, fullPage: false });
console.log('screenshot saved to', outPath);
await browser.close();
