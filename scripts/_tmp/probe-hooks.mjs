import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
await p.waitForFunction(() => Boolean(window.__idleVillageTestHooks), null, { timeout: 60000 });
await p.waitForSelector('[data-testid="game-boot-screen"]', { state: 'hidden', timeout: 120000 }).catch(() => {});
await p.waitForTimeout(2500);
const info = await p.evaluate(() => {
  const h = window.__idleVillageTestHooks || {};
  const out = { topKeys: Object.keys(h), expedition: {} };
  if (h.expedition) for (const k of Object.keys(h.expedition)) out.expedition[k] = Object.keys(h.expedition[k] || {});
  return out;
});
console.log(JSON.stringify(info, null, 1).slice(0, 1500));
await b.close();
