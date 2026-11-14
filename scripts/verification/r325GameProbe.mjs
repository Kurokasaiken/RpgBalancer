/* R-325 verification probe — /game (mappa2): map drag/wheel, brass cursor, Director
 * panel, centred time bar. Headless; exits 1 on any failed check so verify:bundle
 * can gate on it. The dev server full-reloads on stray file writes (other sessions
 * write .mw/** — T-13), so each check re-boots and retries on mid-run navigation.
 * Run: node scripts/verification/r325GameProbe.mjs [url] */
import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:5173/game';
const failures = [];
const ok = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name} ${detail}`);
  if (!cond) failures.push(name);
};

const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', (e) => console.log(`[pageerror] ${String(e).slice(0, 140)}`));

async function boot() {
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('[data-map-ready]', { timeout: 120000 });
  await p.waitForSelector('[data-testid="game-boot-screen"]', { state: 'detached', timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(300);
}
/* Retry a check when a stray vite reload destroys the execution context. */
async function guard(name, fn) {
  for (let i = 0; i < 5; i += 1) {
    try { await fn(); return; } catch (e) {
      const msg = String(e);
      if (!/Execution context|navigation|Target closed|frame was detached/i.test(msg) || i === 4) {
        console.log(`ERROR ${name}: ${msg.slice(0, 140)}`); failures.push(name); return;
      }
      console.log(`  (reload during ${name}, retry ${i + 1})`);
      try { await boot(); } catch { /* next retry re-boots again */ }
    }
  }
}
const cam = () => p.evaluate(() => window.__worldCam ?? null);
/* A stray vite reload can leave a *silent* dead page (null seams, no exception):
 * checks call this before asserting so a corpse becomes a retryable error. */
const alive = async () => {
  await p.waitForSelector('[data-map-ready]', { timeout: 90000 }).catch(() => {
    throw new Error('frame was detached (map not live)');
  });
  const live = await p.evaluate(() => !!(window.__worldCam && document.querySelector('canvas'))).catch(() => false);
  if (!live) throw new Error('frame was detached (map not live)');
};

await boot();
await p.setViewportSize({ width: 1600, height: 900 });

/* 1. The full-frame HUD layer must not eat pointer events: the map canvas is hit. */
await guard('map-canvas-hit', async () => {
  await alive();
  const hit = await p.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.tagName);
  ok('map-canvas-hit', hit === 'CANVAS', `(elementFromPoint: ${hit})`);
});

/* 2. Drag pans the camera. */
await guard('map-drag-pan', async () => {
  const c0 = await cam();
  await p.mouse.move(800, 450); await p.mouse.down(); await p.mouse.move(950, 500, { steps: 8 }); await p.mouse.up();
  await p.waitForTimeout(200);
  const c1 = await cam();
  if (!c0 || !c1) await alive();
  const moved = Math.abs(c1.panX - c0.panX) > 1 || Math.abs(c1.panY - c0.panY) > 1;
  ok('map-drag-pan', moved, `(${JSON.stringify(c0)} -> ${JSON.stringify(c1)})`);
});

/* 3. Wheel zooms the camera. */
await guard('map-wheel-zoom', async () => {
  const c0 = await cam();
  await p.mouse.move(800, 450); await p.mouse.wheel(0, -300); await p.waitForTimeout(200);
  const c1 = await cam();
  if (!c0 || !c1) await alive();
  ok('map-wheel-zoom', c1.zoom !== c0.zoom, `(zoom ${c0?.zoom} -> ${c1?.zoom})`);
});

/* 4. Fantasy cursor: .game-frame scope + computed cursor is the brass image-set. */
await guard('brass-cursor', async () => {
  const cur = await p.evaluate(() => ({
    scoped: !!document.querySelector('.game-frame'),
    css: document.querySelector('canvas') ? getComputedStyle(document.querySelector('canvas')).cursor : null,
  }));
  if (!cur.css) await alive();
  ok('brass-cursor', cur.scoped && cur.css.includes('assets/ui/cursors/game-'), `(${String(cur.css).slice(0, 90)})`);
});

/* 5. Director: button opens the panel with the ported actions; 'd' toggles it. */
await guard('director-panel-open', async () => {
  await alive();
  try {
    await p.click('[data-testid="hud-director-trigger"]', { timeout: 8000 });
  } catch (e) {
    /* Page died mid-click → alive() waits for re-boot, then retry the click once. */
    await alive();
    await p.click('[data-testid="hud-director-trigger"]', { timeout: 8000 });
  }
  await p.waitForTimeout(300);
  const labels = await p.evaluate(() => [...document.querySelectorAll('button')].map((x) => x.textContent?.trim()));
  ok('director-panel-open', labels.includes('Initial state') && labels.includes('Settlement lost'),
    `(${labels.filter((a) => /state|wonder|Legacy|lost|fallen|Skin/.test(a ?? '')).join(', ')})`);
});
await guard('director-d-toggle', async () => {
  const openNow = await p.evaluate(() => [...document.querySelectorAll('button')].some((x) => /Initial state/.test(x.textContent ?? '')));
  if (openNow) { await p.keyboard.press('d'); await p.waitForTimeout(250); }
  await p.keyboard.press('d'); await p.waitForTimeout(300);
  const labels = await p.evaluate(() => [...document.querySelectorAll('button')].map((x) => x.textContent?.trim()));
  ok('director-d-toggle', labels.includes('Initial state'), '');
  await p.keyboard.press('d'); await p.waitForTimeout(200);
});

/* 6. Time bar centred at every blueprint width, reflow widths included. */
for (const w of [1600, 1280, 1150, 1000, 820]) {
  await guard(`time-centred-${w}`, async () => {
    await alive();
    await p.setViewportSize({ width: w, height: 900 });
    await p.waitForTimeout(250);
    const cx = await p.evaluate(() => {
      const el = document.querySelector('[data-hudslot="time"]');
      const r = (el?.firstElementChild ?? el)?.getBoundingClientRect();
      return r ? r.left + r.width / 2 : null;
    });
    if (cx === null) await alive();
    ok(`time-centred-${w}`, cx !== null && Math.abs(cx - w / 2) < 4, `(cx=${cx?.toFixed(1)} vs ${w / 2})`);
    await p.setViewportSize({ width: 1600, height: 900 });
  });
}
/* 7. Ported panels (R-325 slice 2): roster / events / stash / merchant open on
 * their registry keys and show real content. */
const bigEl = (sel) => p.evaluate((s) => {
  const el = [...document.querySelectorAll(s)].find((x) => {
    const r = x.getBoundingClientRect(); return r.width > 40 && r.height > 30;
  });
  return el ? { w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height } : null;
}, sel);
for (const [key, sels, name] of [
  ['r', ['[data-panel="roster"]'], 'panel-roster'],
  ['e', ['section[aria-label]'], 'panel-events'],
  ['v', ['[data-hud-panel="villageStash"]'], 'panel-stash'],
  ['m', ['[data-hud-panel="merchant"]'], 'panel-merchant'],
]) {
  await guard(name, async () => {
    await alive();
    await p.keyboard.press(key);
    await p.waitForTimeout(600);
    let found = null;
    for (const s of sels) found = found ?? (await bigEl(s));
    if (!found) await alive();
    ok(name, found !== null, found ? `(${Math.round(found.w)}x${Math.round(found.h)})` : '(not visible)');
    await p.keyboard.press(key);
    await p.waitForTimeout(250);
  });
}

/* 7b. Hero sheet (R-325 slice 3): hover intent on a roster card opens the
 * plaque beside it (`#hero-sheet`, role=region). `p` is unlisted by ruling
 * (PLAN-043 T1.3) — dead key on /gameOld too — so the check drives the real
 * surface: roster rail hover. */
await guard('hero-sheet', async () => {
  await alive();
  await p.keyboard.press('r');
  await p.waitForTimeout(700);
  const card = await p.evaluate(() => {
    const el = document.querySelector('[data-panel="roster"] [data-resident-id]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (!card) { await alive(); }
  ok('hero-sheet-card', card !== null, card ? `(${Math.round(card.x)},${Math.round(card.y)})` : '(no roster card)');
  if (!card) return;
  await p.mouse.move(card.x + 30, card.y + 30);
  await p.waitForTimeout(150);
  await p.mouse.move(card.x, card.y);
  await p.waitForTimeout(1200); /* hoverIntentMs=350 + anchor/vm settle */
  const sheet = await p.evaluate(() => {
    const el = document.querySelector('#hero-sheet');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width > 40 && r.height > 30 ? { w: r.width, h: r.height } : null;
  });
  if (!sheet) await alive();
  ok('hero-sheet', sheet !== null, sheet ? `(${Math.round(sheet.w)}x${Math.round(sheet.h)})` : '(hover did not open)');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  await p.keyboard.press('r');
  await p.waitForTimeout(250);
});

/* 7c. Invasion theatre (R-325 slice 4): the E2E seam stages shroud → card →
 * confirm → march marker on the west coast + threat row in the ledger. */
await guard('invasion', async () => {
  await alive();
  await p.evaluate(() => window.__idleVillageTestHooks?.startInvasion?.());
  await p.waitForSelector('[data-testid="world-event-card-body"]', { timeout: 15000 });
  await p.waitForTimeout(2500); /* fade-in + arm */
  const clicked = await p.evaluate(() => {
    const btn = document.querySelector('[data-testid="world-event-card-body"] button');
    if (!btn || btn.disabled) return false;
    btn.click();
    return true;
  });
  ok('invasion-card-confirm', clicked, '');
  await p.waitForTimeout(1200);
  const inv = await p.evaluate(() => window.__idleVillageTestHooks?.getInvasion?.() ?? null);
  ok('invasion-state', !!inv && inv.dueDay > inv.startDay, inv ? `(due day ${inv.dueDay})` : '(null)');
  /* The sticker flies to the marker (seconds); wait for the landed hand-off. */
  let marker = null;
  for (let i = 0; i < 16 && !marker; i += 1) {
    marker = await p.evaluate(() => {
      const el = document.querySelector('[data-testid="invasion-goblin-marker"]');
      if (!el || getComputedStyle(el).opacity !== '1') return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!marker) await p.waitForTimeout(500);
  }
  ok('invasion-marker', marker !== null, marker ? `(${Math.round(marker.x)},${Math.round(marker.y)})` : '(not landed)');
  const row = await p.evaluate(() => document.querySelector('[data-event-id="invasion"]')?.textContent ?? null);
  ok('invasion-ledger-row', row !== null, row ? `(${row.slice(0, 50)})` : '(missing)');
});

/* 8. Region hover: dwell on a territory → translated name plaque (i18n key must
 * resolve, not echo `gameFrame.regions.*`). */
await guard('region-tooltip', async () => {
  await alive();
  const pt = await p.evaluate(async () => {
    const cam = window.__worldCam;
    const meta = await fetch('/assets/world/mappa2/base/regions.json').then((r) => r.json());
    const c = document.querySelector('canvas');
    for (const rg of meta.regions) {
      const sx = (rg.center[0] * c.width - cam.panX) * cam.zoom;
      const sy = (rg.center[1] * c.height - cam.panY) * cam.zoom;
      if (sx > 60 && sx < innerWidth - 60 && sy > 120 && sy < innerHeight - 160) return { sx, sy };
    }
    return null;
  });
  ok('region-tooltip-point', pt !== null, pt ? `(${Math.round(pt.sx)},${Math.round(pt.sy)})` : '(no on-screen region)');
  if (!pt) return;
  let tip = null;
  for (let attempt = 0; attempt < 2 && !tip; attempt += 1) {
    await p.mouse.move(pt.sx + 40, pt.sy + 40);
    await p.waitForTimeout(120);
    await p.mouse.move(pt.sx, pt.sy);
    await p.waitForTimeout(1800);
    tip = await p.evaluate(() => document.querySelector('[role="tooltip"]')?.textContent ?? null);
    if (!tip) await alive();
  }
  ok('region-tooltip', tip !== null && !tip.includes('gameFrame.regions.'), `(${JSON.stringify(tip)})`);
});

/* 9. Quest system (R-325 slice 5): authored POIs auto-reveal on the stagger,
 *  the medallion opens the real expedition planner, the Director's
 *  «Start goblin quest» crosses the canonical launch → run window. */
await guard('quest-poi-markers', async () => {
  await alive();
  const t0 = Date.now();
  let n = 0;
  while (Date.now() - t0 < 30000) {
    n = await p.evaluate(() => document.querySelectorAll('[data-map-quest-poi-target]').length);
    if (n >= 1) break;
    await p.waitForTimeout(800);
  }
  ok('quest-poi-markers', n >= 1, `(${n} markers)`);
});
await guard('quest-detail-opens', async () => {
  await p.evaluate(() => document.querySelector('[data-map-quest-poi-target]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForSelector('[data-testid="quest-expedition-detail"]', { timeout: 10000 }).catch(() => null);
  const open = await p.evaluate(() => !!document.querySelector('[data-testid="quest-expedition-detail"]'));
  ok('quest-detail-opens', open, '');
  ok('quest-roster-auto-open', !!(await p.evaluate(() => document.querySelector('[data-panel="roster"]'))), '');
});
await guard('quest-run-window', async () => {
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  await p.click('[data-testid="hud-director-trigger"]', { timeout: 8000 });
  await p.waitForTimeout(500);
  await p.click('[data-testid="director-panel"] [data-action-id="questRun"]', { timeout: 5000 }).catch(() => {});
  const t0 = Date.now();
  let open = false;
  while (Date.now() - t0 < 20000) {
    open = await p.evaluate(() => !!document.querySelector('[data-hud-panel="quest"]'));
    if (open) break;
    await p.waitForTimeout(500);
  }
  ok('quest-run-window', open, '');
  await p.screenshot({ path: 'test-results/r325-game-restore/w-quest-run.png' }).catch(() => {});
});

await p.screenshot({ path: 'test-results/r325-game-restore/game-page.png' }).catch(() => {});
await b.close();
if (failures.length) { console.log(`FAILURES: ${failures.join(', ')}`); process.exit(1); }
console.log('r325 probe: all checks passed');
