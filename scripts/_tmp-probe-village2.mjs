import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__worldCamCtl && window.__pixiApp, null, { timeout: 90000 });
await p.waitForTimeout(4000);
const info = await p.evaluate(() => {
  const find = (c, out = []) => {
    for (const ch of c.children) {
      if (ch.label === 'village-zone' || ch.label === 'regional-weather') out.push({ label: ch.label, z: ch.zIndex, visible: ch.visible, alpha: ch.alpha, kids: ch.children.length, kidsVis: ch.children.map(k => ({ t: k.texture?.label || 'tex', a: k.alpha, v: k.visible })).slice(0, 4) });
      find(ch, out);
    }
    return out;
  };
  return find(window.__pixiApp.stage);
});
console.log(JSON.stringify(info, null, 1));
await b.close();
