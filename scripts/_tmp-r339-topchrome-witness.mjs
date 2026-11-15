import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const out = {};

const waitBoot = async (page) => {
  /* The veil mounts after domcontentloaded and can re-mount on HMR reloads:
     poll until it is absent for real (waitForFunction keeps polling). */
  await page.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), null, { timeout: 300000, polling: 1000 });
  for (let i = 0; i < 40; i++) {
    const ok = await page.evaluate(() => document.querySelector('[data-testid="game-top-chrome"]') !== null);
    if (ok) return;
    await page.waitForTimeout(1500);
  }
};

const clickChip = (page, testid) => page.evaluate(
  (id) => { document.querySelector(`[data-testid="${id}"]`)?.click(); }, testid,
);

const stripVeil = (page) => page.evaluate(
  () => { document.querySelector('[data-testid="game-boot-screen"]')?.remove(); },
);

const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
p.on('console', m => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 300)); });
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(5000); // let the veil mount before polling for its absence
await waitBoot(p);
await p.waitForTimeout(3000);

/* A — 1440×900: cluster geometry vs rail inset + Chronicle reserve. */
out.desktop = await p.evaluate(() => {
  const el = document.querySelector('[data-testid="game-top-chrome"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const rail = document.querySelector('[data-testid="roster-stash-rail"]');
  const time = document.querySelector('[data-hudslot="time"]');
  const res = document.querySelector('[data-hudslot="resources"]');
  const dialImg = el.querySelector('[data-hr-time="phase"] img');
  return {
    left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), height: Math.round(r.height),
    railRight: rail ? Math.round(rail.getBoundingClientRect().right) : null,
    clearsReserve: r.right <= window.innerWidth - 360 + 0.5,
    clearsRail: rail ? r.left >= rail.getBoundingClientRect().right - 0.5 : null,
    timeSlot: !!time, resourcesSlot: !!res,
    phase: el.querySelector('[data-hr-time="phase"]')?.getAttribute('data-phase') ?? null,
    dialImg: dialImg ? dialImg.getAttribute('src') : null,
    chips: el.querySelectorAll('[data-hr-res]').length,
  };
});
await stripVeil(p);
await p.screenshot({ path: 'test-results/r339-topchrome-1440.png', clip: { x: 0, y: 0, width: 1440, height: 120 } });
await p.screenshot({ path: 'test-results/r339-topchrome-full.png' });

/* B — collapse the rail via DOM click (veil-proof): chrome slides left with it. */
await clickChip(p, 'rail-collapse-chip');
const folded = await p.waitForSelector('[data-testid="rail-expand-chip"]', { state: 'attached', timeout: 20000 }).then(() => true).catch(() => false);
await p.waitForTimeout(500);
out.afterRailFold = await p.evaluate(() => {
  const r = document.querySelector('[data-testid="game-top-chrome"]')?.getBoundingClientRect();
  return r ? { left: Math.round(r.left), right: Math.round(r.right), folded: !!document.querySelector('[data-testid="rail-expand-chip"]') } : null;
});
if (folded) {
  await stripVeil(p);
  await p.screenshot({ path: 'test-results/r339-topchrome-railfold.png', clip: { x: 0, y: 0, width: 900, height: 120 } });
  await clickChip(p, 'rail-expand-chip');
  await p.waitForTimeout(500);
}
await p.close();

/* C — narrow 1024×768: still inside window, chrome mounted. */
const q = await b.newPage({ viewport: { width: 1024, height: 768 } });
q.on('pageerror', e => console.log('[narrow pageerror]', String(e).slice(0, 300)));
await q.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await q.waitForTimeout(5000);
await waitBoot(q);
await q.waitForTimeout(2500);
out.narrow = await q.evaluate(() => {
  const el = document.querySelector('[data-testid="game-top-chrome"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top),
    insideWindow: r.right <= window.innerWidth + 0.5 && r.left >= -0.5,
    chips: el.querySelectorAll('[data-hr-res]').length,
  };
});
await stripVeil(q);
await q.screenshot({ path: 'test-results/r339-topchrome-1024.png', clip: { x: 0, y: 0, width: 1024, height: 120 } });
await q.close();

console.log(JSON.stringify(out, null, 2));
await b.close();
