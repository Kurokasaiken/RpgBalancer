import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.log('PAGE_ERROR', String(e).slice(0, 200)));
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 150000 }); } catch { console.log('cam timeout'); }
await page.waitForTimeout(2000);
const started = await page.evaluate(async () => {
  const store = (await import('/src/store/useMinimalGameplay.ts')).useMinimalGameplayStore;
  const rules = await import('/src/engine/game/idleVillage/minimalGameRules.ts');
  const st = store.getState();
  const residentArr = Array.isArray(st.state.residents) ? st.state.residents : Object.values(st.state.residents);
  const free = residentArr.filter(r => !r.isDead && !r.isWorking && !r.isOnExpedition && !r.isInjured);
  const engineState = () => ({ ...store.getState().state, residents: Array.isArray(store.getState().state.residents) ? store.getState().state.residents : Object.values(store.getState().state.residents) });
  const jobs = st.config.activities.filter(a => a.type === 'job');
  for (const job of jobs) {
    for (const r of free) {
      try {
        const v = rules.canStartActivity(r.id, job.id, engineState(), st.config);
        if (v.canStart) {
          st.startActivity(r.id, job.id);
          const acts = store.getState().state.activeActivities;
          return { ok: true, job: job.id, res: r.id, dur: job.durationTicks, acts: acts.map(a => ({ id: a.activityId, rem: a.ticksRemaining })) };
        }
      } catch { /* next */ }
    }
  }
  return { ok: false };
});
console.log('STARTED', JSON.stringify(started));
await page.waitForTimeout(3000);
const info = await page.evaluate(() => [...document.querySelectorAll('[data-poi-zanara]')].map(e => ({ f: e.getAttribute('data-poi-zanara'), r: e.getBoundingClientRect(), v: e.offsetParent !== null })));
console.log(JSON.stringify(info.map(i => ({ f: i.f, x: Math.round(i.r.x), y: Math.round(i.r.y) }))));
await page.screenshot({ path: 'test-results/poi-zanara-live/job-real-full.png', timeout: 120000 });
const job = info.find(e => e.f === 'job');
if (job) {
  const cx = job.r.x + job.r.width / 2, cy = job.r.y + job.r.height / 2;
  await page.screenshot({ path: 'test-results/poi-zanara-live/job-real-crop.png', clip: { x: Math.max(0, cx - 110), y: Math.max(0, cy - 110), width: 220, height: 220 }, timeout: 120000 });
  console.log('crop saved');
}
await browser.close();
