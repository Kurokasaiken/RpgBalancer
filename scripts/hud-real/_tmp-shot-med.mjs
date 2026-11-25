import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const url = process.argv[2] || 'http://localhost:5173/game';
const out = process.argv[3] || '/tmp/game-med.png';
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('[data-hr-time="phase"]', { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(9000);
const el = await page.$('[data-hr-time="phase"]');
if (el) {
  const box = await el.boundingBox();
  console.log('phase box', JSON.stringify(box));
  const pad = 60;
  await page.screenshot({ path: out, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2 + 140, height: box.height + pad * 2 } });
} else {
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 700, height: 200 } });
}
await b.close();
console.log('done');
