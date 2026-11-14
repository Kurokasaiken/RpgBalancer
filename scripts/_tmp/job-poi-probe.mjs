import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.log('PAGE_ERROR', String(e).slice(0, 300)));
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 150000 }); } catch { console.log('cam timeout'); }
await page.waitForTimeout(2000);
const started = await page.evaluate(async () => {
  const mod = await import('/src/store/useMinimalGameplay.ts');
  const store = mod.useMinimalGameplayStore ?? mod.default;
  const st = store.getState();
  const residents = st.state.residents ?? {};
  const residentIds = Object.keys(residents);
  const jobDefs = (st.config?.activities ?? []).filter(a => a.type === 'job').map(a => a.id);
  const results = [];
  for (const jobId of ['job_wood_gathering_stable', 'job_gold_mine_minimal', ...jobDefs]) {
    for (const res of residentIds) {
      const r = residents[res];
      if (r.isDead || r.isWorking || r.isOnExpedition) continue;
      try {
        const before = store.getState().state.activeActivities.length;
        st.startActivity(res, jobId);
        const after = store.getState().state.activeActivities;
        results.push({ jobId, res, before, added: after.length - before, sample: after[after.length-1] });
        if (after.length > before) return { started: results, residents: residentIds.length };
      } catch (e) { results.push({ jobId, res, err: String(e).slice(0,150) }); }
    }
  }
  return { results: results.slice(0,6), residentIds, jobDefs };
});
console.log('STARTED', JSON.stringify(started, null, 1));
await page.waitForTimeout(4000);
const info = await page.evaluate(() => [...document.querySelectorAll('[data-poi-zanara]')].map(e => ({ f: e.getAttribute('data-poi-zanara'), r: e.getBoundingClientRect(), v: e.offsetParent !== null })));
console.log(JSON.stringify(info));
await page.screenshot({ path: 'test-results/poi-zanara-live/job-real-full.png', timeout: 120000 });
const job = info.find(e => e.f === 'job');
if (job) {
  const cx = job.r.x + job.r.width / 2, cy = job.r.y + job.r.height / 2;
  await page.screenshot({ path: 'test-results/poi-zanara-live/job-real-crop.png', clip: { x: Math.max(0, cx - 100), y: Math.max(0, cy - 100), width: 200, height: 200 }, timeout: 120000 });
  console.log('crop saved');
}
await browser.close();
