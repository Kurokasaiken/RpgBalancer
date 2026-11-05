import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__worldCamCtl, null, { timeout: 90000 });
await p.waitForTimeout(5000);
await p.getByRole('button', { name: 'village', exact: true }).click();
await p.waitForTimeout(400);
await p.evaluate(() => window.__worldCamCtl.set({ panX: 1055, panY: 475, zoom: 2 }));
await p.waitForTimeout(500);
const labels = (await p.locator('button').allTextContents()).map((t) => t.trim());
const plates = labels.filter((t) => /^(meadow|cottages|straw|stone) · /.test(t));
const fs = await import('node:fs');
const have = new Set(fs.readdirSync('/tmp/vill-all'));
const todo = plates.filter((lab) => !have.has(lab.replaceAll(' ', '_').replaceAll('·', '').replaceAll('+', '-') + '.png'));
console.log('todo:', todo.length);
for (const lab of todo) {
  const btn = p.locator('button', { hasText: lab }).filter({ hasText: new RegExp('^' + lab.replace(/[+]/g, '\\+') + '$') }).first();
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await p.waitForTimeout(700);
  const f = `/tmp/vill-all/${lab.replaceAll(' ', '_').replaceAll('·', '').replaceAll('+', '-')}.png`;
  await p.screenshot({ path: f, clip: { x: 410, y: 60, width: 1020, height: 780 } });
}
console.log(JSON.stringify(todo));
await b.close(); console.log('done');
