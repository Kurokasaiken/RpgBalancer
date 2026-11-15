import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const open = async (url) => {
  for (let a = 0; a < 6; a++) {
    try {
      const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      return p;
    } catch (e) { console.log('goto retry', a, String(e).slice(0, 60)); await new Promise(r => setTimeout(r, 20000)); }
  }
  return null;
};
for (const tod of ['day', 'dusk', 'night']) {
  const p = await open(`http://localhost:5173/game?tod=${tod}`);
  if (!p) { console.log(tod, 'aborted'); continue; }
  for (let i = 0; i < 60; i++) {
    if (await p.evaluate(() => !!document.querySelector('[data-map-ready]')).catch(() => false)) { console.log(tod, 'ready at', i); break; }
    await p.waitForTimeout(2000);
  }
  await p.waitForTimeout(60000);
  const data = await p.evaluate(() => {
    const app = window.__pixiApp;
    if (!app) return null;
    return app.renderer.extract.base64(app.stage);
  }).catch(e => { console.log('extract failed', String(e).slice(0, 120)); return null; });
  if (data) { writeFileSync(`test-results/tod-${tod}.png`, Buffer.from(data.split(',')[1], 'base64')); console.log(tod, 'extracted'); }
  await p.close().catch(() => {});
}
await b.close();
