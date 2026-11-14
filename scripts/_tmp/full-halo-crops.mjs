import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 160)); });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForFunction(() => window.__worldCam, null, { timeout: 240000 });
await page.waitForTimeout(9000); // auto-reveal stagger
const started = await page.evaluate(async () => {
  const store = (await import('/src/store/useMinimalGameplay.ts')).useMinimalGameplayStore;
  const st = store.getState();
  const jobs = st.config.activities.filter(a => a.type === 'job' && a.durationTicks > 60);
  const job = jobs[0];
  if (!job) return { ok: false };
  const rem = Math.max(1, Math.floor(job.durationTicks * 0.02)); // ~98% elapsed → halo nearly full
  store.setState((s) => ({ state: { ...s.state, activeActivities: [...s.state.activeActivities, { activityId: job.id, residentId: '__probe__', ticksRemaining: rem }] } }));
  return { ok: true, job: job.id, rem, dur: job.durationTicks };
});
console.log('INJECTED', JSON.stringify(started));
await page.waitForTimeout(2500);
const info = await page.evaluate(() => [...document.querySelectorAll('[data-poi-zanara]')].map(e => ({ f: e.getAttribute('data-poi-zanara'), r: e.getBoundingClientRect() })));
console.log(JSON.stringify(info.map(i => ({ f: i.f, x: Math.round(i.r.x), y: Math.round(i.r.y) }))));
for (const m of info) {
  const cx = m.r.x + m.r.width / 2, cy = m.r.y + m.r.height / 2;
  const name = `test-results/poi-zanara-live/full-${m.f}-${Math.round(cx)}x${Math.round(cy)}.png`;
  await page.screenshot({ path: name, clip: { x: Math.max(0, cx - 110), y: Math.max(0, cy - 110), width: 220, height: 220 }, timeout: 120000 });
  console.log('saved', name);
}
await browser.close();
