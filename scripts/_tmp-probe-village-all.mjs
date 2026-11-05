import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__worldCamCtl, null, { timeout: 90000 });
await p.waitForTimeout(5000);
await p.getByRole('button', { name: 'village', exact: true }).click();
await p.waitForTimeout(400);
// camera: zone 1260-1770 x 505-895 at zoom 2 -> screen x410-1430, y60-840
await p.evaluate(() => window.__worldCamCtl.set({ panX: 1055, panY: 475, zoom: 2 }));
await p.waitForTimeout(500);
const labels = (await p.locator('button').allTextContents()).map((t) => t.trim());
const plates = labels.filter((t) => /^(meadow|cottages|straw|stone) · /.test(t));
console.log('plates:', plates.length);
const fs = await import('node:fs');
fs.mkdirSync('/tmp/vill-all', { recursive: true });
for (const lab of plates) {
  await p.getByRole('button', { name: lab, exact: true }).first().click();
  await p.waitForTimeout(700); // fade 0.15s + margin
  const f = `/tmp/vill-all/${lab.replaceAll(' ', '_').replaceAll('·', '').replaceAll('+', '-')}.png`;
  await p.screenshot({ path: f, clip: { x: 410, y: 60, width: 1020, height: 780 } });
}
console.log(JSON.stringify(plates));
await b.close();
console.log('done');
