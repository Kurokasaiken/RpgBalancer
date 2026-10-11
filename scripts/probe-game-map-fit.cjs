/**
 * probe-game-map-fit.cjs — measures the /game map-fit contract at several viewports.
 *
 * For each viewport it loads /game?capture=1, reads `window.__worldCam` (dev hook
 * emitted by PixiWorldMap.apply), projects the land bounds and the painted-canvas
 * edges into screen space, collects the rects of the fixed HUD chrome (top plaques,
 * bottom nav plinth) and the floating panels (roster, ledger), then reports every
 * intersection between FIXED chrome and the visible land rect.
 *
 * The land bounds + sea margins mirror `DEFAULT_GAME_FRAME_CONFIG.worldDressing.safeFit`
 * in src/balancing/config/idleVillage/gameFrameConfig.ts — keep them in sync if the
 * config moves.
 *
 * Usage: node scripts/probe-game-map-fit.cjs [baseUrl] [outDir]
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const LAND = { x0: 271, x1: 3974, y0: 305, y1: 2642 };
const MARGIN_X = 3600;
const MARGIN_Y = 1800;
const INSETS = { top: 87, bottom: 100 }; // safeFit.insets; side insets are computed live below.

const VIEWPORTS = [
  { w: 1920, h: 800, label: '1920x800' },
  { w: 1600, h: 760, label: '1600x760' },
  { w: 1440, h: 900, label: '1440x900' },
  { w: 1280, h: 800, label: '1280x800' },
  { w: 1512, h: 982, label: '1512x982' },
  { w: 3440, h: 1440, label: '3440x1440' },
  { w: 1024, h: 700, label: '1024x700' },
  { w: 480, h: 700, label: '480x700' },
];

const only = (process.argv[4] || '').split(',').filter(Boolean);
const baseUrl = process.argv[2] || 'http://localhost:5173';
const outDir = process.argv[3] || path.resolve('test-results/probe-game-map-fit');
fs.mkdirSync(outDir, { recursive: true });

const MEASURE = `(() => {
  const cam = window.__worldCam;
  if (!cam) return { error: 'no __worldCam' };
  const LAND = ${JSON.stringify(LAND)};
  const z = cam.zoom;
  const toScreen = (x, y) => ({ x: (x - cam.panX) * z, y: (y - cam.panY) * z });
  const a = toScreen(LAND.x0, LAND.y0);
  const b = toScreen(LAND.x1, LAND.y1);
  const land = { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
  const canvasEdge = {
    left: (0 - cam.panX) * z,
    right: (cam.width - cam.panX) * z,
    top: (0 - cam.panY) * z,
    bottom: (cam.height - cam.panY) * z,
  };
  const rects = (sel) => [...document.querySelectorAll(sel)].map((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, label: el.getAttribute('aria-label') || el.dataset.testid || el.tagName };
  });
  const hud = {
    // Fixed chrome only: the top plaques are the section elements living inside
    // the top grid row. Roster/ledger sections are floating panels, measured apart.
    topPlaques: [...document.querySelectorAll('section')].filter((el) => {
      let p = el.parentElement;
      while (p) {
        if (getComputedStyle(p).display === 'grid') return true;
        p = p.parentElement;
      }
      return false;
    }).map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, label: 'top-plaque' };
    }),
    nav: rects('nav').map((r) => {
      return r;
    }),
    navPlinth: (() => {
      const nav = document.querySelector('nav');
      if (!nav) return [];
      let el = nav.parentElement;
      while (el && getComputedStyle(el).position !== 'absolute') el = el.parentElement;
      if (!el) return [];
      const r = el.getBoundingClientRect();
      return [{ x: r.x, y: r.y, w: r.width, h: r.height, label: 'nav-plinth' }];
    })(),
    roster: rects('[data-testid="resident-roster-panel"]'),
    ledger: [...document.querySelectorAll('section')].filter((el) => el.closest('.game-frame') && el.getBoundingClientRect().x > innerWidth * 0.5 && el.getBoundingClientRect().y > 120).map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, label: el.getAttribute('aria-label') || 'section-right' };
    }),
  };
  return { cam, land, canvasEdge, hud, vw: innerWidth, vh: innerHeight };
})()`;

const intersect = (a, b) =>
  a.x0 < b.x + b.w && a.x1 > b.x && a.y0 < b.y + b.h && a.y1 > b.y;

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--window-size=3440,1500'],
  });
  const report = [];
  const reportPath = path.join(outDir, 'probe-report.json');
  const flush = () => fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  for (const vp of VIEWPORTS.filter((v) => only.length === 0 || only.includes(v.label))) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h });
    await page.goto(`${baseUrl}/game?capture=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    try {
      await page.waitForFunction(() => window.__worldCam != null, { timeout: 45000 });
    } catch {
      await page.screenshot({ path: path.join(outDir, `game-${vp.label}-FAILED.png`) }).catch(() => {});
      report.push({ viewport: vp.label, error: '__worldCam never appeared' });
      flush();
      await page.close().catch(() => {});
      continue;
    }
    await new Promise((r) => setTimeout(r, 2500));
    const m = await page.evaluate(MEASURE);
    const shot = path.join(outDir, `game-${vp.label}.png`);
    await page.screenshot({ path: shot });

    if (m.error) {
      report.push({ viewport: vp.label, ...m });
      flush();
      await page.close().catch(() => {});
      continue;
    }
    const fixedHud = [...m.hud.topPlaques, ...m.hud.navPlinth];
    const violations = fixedHud.filter((r) => intersect(m.land, r)).map((r) => ({ over: r.label, hudRect: r }));
    const panelOver = [...m.hud.roster, ...m.hud.ledger].filter((r) => intersect(m.land, r));
    const floor = Math.max(vp.w / (m.cam.width + 2 * MARGIN_X), vp.h / (m.cam.height + 2 * MARGIN_Y));
    const freeW = vp.w; const landScreenW = m.land.x1 - m.land.x0;
    report.push({
      viewport: vp.label,
      zoom: m.cam.zoom,
      floorZoom: Number(floor.toFixed(4)),
      floorBound: m.cam.zoom <= floor + 0.001,
      pan: { x: m.cam.panX, y: m.cam.panY },
      landScreen: m.land,
      landOverflow: {
        left: m.land.x0 < 0 ? -m.land.x0 : 0,
        right: m.land.x1 > vp.w ? m.land.x1 - vp.w : 0,
        top: m.land.y0 < 0 ? -m.land.y0 : 0,
        bottom: m.land.y1 > vp.h ? m.land.y1 - vp.h : 0,
      },
      canvasEdge: m.canvasEdge,
      hudCounts: {
        topPlaques: m.hud.topPlaques.length,
        navPlinth: m.hud.navPlinth.length,
        roster: m.hud.roster.length,
        ledger: m.hud.ledger.length,
      },
      fixedHudViolations: violations,
      panelOverLand: panelOver.map((r) => r.label),
      landWiderThanScreen: landScreenW > freeW,
      screenshot: shot,
    });
    flush();
    await page.close().catch(() => {});
  }

  // Resize probe: keep one page, shrink the window, check the camera re-fits.
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 800 });
    await page.goto(`${baseUrl}/game?capture=1`, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForFunction(() => window.__worldCam != null, { timeout: 45000 });
    } catch {
      report.push({ viewport: 'resize-after-user-zoom', error: '__worldCam never appeared' });
      flush();
      await page.close().catch(() => {});
      await browser.close();
      console.log(JSON.stringify(report, null, 2));
      console.log('\nReport:', reportPath);
      return;
    }
    await new Promise((r) => setTimeout(r, 1500));
    const before = await page.evaluate(() => ({ ...window.__worldCam }));
    // Simulate a user wheel-zoom so userMoved=true, then resize — refit must still protect land.
    await page.mouse.move(960, 400);
    await page.mouse.wheel({ deltaY: 240 });
    await new Promise((r) => setTimeout(r, 300));
    await page.setViewport({ width: 1440, height: 700 });
    await new Promise((r) => setTimeout(r, 1200));
    const after = await page.evaluate(MEASURE);
    await page.screenshot({ path: path.join(outDir, 'game-resize-1440x700-after-zoom.png') });
    report.push({ viewport: 'resize-after-user-zoom', beforeZoom: before.zoom, after: after.land ? {
      zoom: after.cam.zoom, landScreen: after.land,
      fixedHudViolations: [...after.hud.topPlaques, ...after.hud.navPlinth].filter((r) => intersect(after.land, r)).map((r) => r.label),
      landBottomVsNav: after.land.y1,
      vh: after.vh,
    } : after });
    flush();
    await page.close().catch(() => {});
  }

  const out = reportPath;
  console.log(JSON.stringify(report, null, 2));
  console.log('\nReport:', out);
  await browser.close();
})();
