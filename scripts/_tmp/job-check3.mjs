import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(8000);
const out = await page.evaluate(async () => {
  const store = (await import('/src/store/useMinimalGameplay.ts')).useMinimalGameplayStore;
  const rules = await import('/src/engine/game/idleVillage/minimalGameRules.ts');
  const st = store.getState();
  const res = st.state.residents ?? {};
  const residentArr = Array.isArray(res) ? res : Object.values(res);
  const free = residentArr.filter(r => !r.isDead && !r.isWorking && !r.isOnExpedition && !r.isInjured);
  const engineState = { ...st.state, residents: residentArr };
  const out = { freeCount: free.length, checks: [] };
  for (const r of free.slice(0, 4)) {
    try { out.checks.push({ id: r.id, str: r.stats?.strength, v: rules.canStartActivity(r.id, 'job_wood_gathering_stable', engineState, st.config) }); }
    catch (e) { out.checks.push({ id: r.id, err: String(e).slice(0, 150) }); }
  }
  return out;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
