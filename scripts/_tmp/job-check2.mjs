import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(8000);
const out = await page.evaluate(async () => {
  const mod = await import('/src/store/useMinimalGameplay.ts');
  const store = mod.useMinimalGameplayStore ?? mod.default;
  const st = store.getState();
  const cfg = st.config;
  const acts = cfg?.activities;
  return {
    cfgKeys: cfg ? Object.keys(cfg).slice(0, 15) : null,
    actsType: Array.isArray(acts) ? `array len=${acts.length}` : typeof acts,
    wood: acts?.find?.(a => a.id === 'job_wood_gathering_stable') ?? 'NOT FOUND',
    firstIds: Array.isArray(acts) ? acts.slice(0, 8).map(a => a.id) : null,
    storeShape: Object.keys(st).slice(0, 20),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
