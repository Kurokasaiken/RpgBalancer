import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(8000);
const out = await page.evaluate(async () => {
  const mod = await import('/src/store/useMinimalGameplay.ts');
  const store = mod.useMinimalGameplayStore ?? mod.default;
  const st = store.getState();
  const res = Object.values(st.state.residents ?? {}).map(r => ({ id: r.id, w: r.isWorking, dead: r.isDead, fat: r.fatigue, inj: r.isInjured }));
  const checks = [];
  for (const r of res.slice(0, 3)) {
    try { checks.push({ r: r.id, v: st.canStartActivity(r.id, 'job_wood_gathering_stable') }); } catch (e) { checks.push({ r: r.id, err: String(e).slice(0,120) }); }
  }
  return { res, checks, gold: st.state.gold, food: st.state.food };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
