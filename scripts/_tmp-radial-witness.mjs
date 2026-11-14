// Temp witness probe for PlaceRadial on /lab/poi-luogo. Headless, never foreground.
import { chromium } from 'playwright';

const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('PAGEERR:', e.message.slice(0, 200)));

await p.goto('http://localhost:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForSelector('[data-testid="place-village-hit"]', { timeout: 90000 });
await p.waitForTimeout(4000);

// The open-on-click can race Pixi warmup — retry until the disc mounts.
for (let i = 0; i < 5; i += 1) {
  await p.evaluate(() => document.querySelector('[data-testid="place-village-hit"]').click());
  try {
    await p.waitForSelector('[data-testid="place-radial-disc"]', { state: 'attached', timeout: 4000 });
    break;
  } catch { await p.waitForTimeout(1500); }
}

await p.evaluate(() => {
  const disc = document.querySelector('[data-testid="place-radial-disc"]');
  if (!disc) return;
  let n = disc;
  while (n && n !== document.body) { n.style.visibility = 'visible'; n = n.parentElement; }
  const root = document.querySelector('[data-testid="place-radial"]');
  root.style.position = 'fixed';
  root.style.left = '700px';
  root.style.top = '470px';
  root.style.zIndex = '9999';
});

await p.waitForTimeout(800);
const disc = await p.$('[data-testid="place-radial-disc"]');
const box = await disc.boundingBox();
console.log('BOX', JSON.stringify(box));
if (box) {
  await p.screenshot({
    path: '/tmp/radial-witness.png',
    clip: { x: Math.max(0, box.x - 60), y: Math.max(0, box.y - 80), width: box.width + 120, height: box.height + 200 },
    timeout: 90000,
  });
}
await b.close();
