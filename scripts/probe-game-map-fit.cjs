/**
 * probe-game-map-fit.cjs — fail-closed CLI check of the /game map-fit contract
 * (CTR-game-005, PLAN-054 T-001).
 *
 * For each viewport it loads /game?capture=1, reads `window.__worldCam` (test
 * seam emitted by PixiWorldMap in dev/playwright builds), projects the land
 * bounds, the painted-canvas edges and the deep-sea quad extent into screen
 * space, collects the rects of the fixed HUD chrome (top plaques, bottom nav
 * plinth) and the floating panels, then VERIFIES the contract:
 *
 *   - land disjoint from FIXED chrome (INV-1),
 *   - south-pin / zero fixed-chrome violations after user-zoom + resize (INV-2),
 *   - sea quad covers the viewport at the pan bounds + scanline pixel check
 *     for stage-leak / canvas-edge seams (INV-3).
 *
 * All constants come from `tests/helpers/mapFitContract.ts` (config + renderer
 * module — nothing hardcoded here may drift from them). Exits 0 on green,
 * 1 on any violation or precheck failure (fail-closed).
 *
 * Usage: node scripts/probe-game-map-fit.cjs [baseUrl] [outDir] [only,labels]
 */
require('tsx/cjs');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const {
  MAP_FIT_MEASURE_ARGS,
  MAP_FIT_STAGE_COLOR,
  MAP_FIT_VIEWPORTS,
  evaluateMapFit,
  measureMapFitInPage,
  scanlineCheckPng,
} = require('../tests/helpers/mapFitContract.ts');

/** Extra diagnostic viewports beyond the contract matrix (not part of CTR-game-005).
 * 3440x1440 was promoted into the contract matrix (Director ruling 2026-10-19). */
const EXTRA_VIEWPORTS = [
  { w: 1512, h: 982, label: '1512x982', extra: true },
  { w: 480, h: 700, label: '480x700', extra: true },
];

const VIEWPORTS = [...MAP_FIT_VIEWPORTS, ...EXTRA_VIEWPORTS];

const baseUrl = process.argv[2] || 'http://localhost:5173';
const outDir = process.argv[3] || path.resolve('test-results/probe-game-map-fit');
const only = (process.argv[4] || '').split(',').filter(Boolean);
fs.mkdirSync(outDir, { recursive: true });

const verdictOf = (v) => ({
  ok: v.ok,
  precheck: v.precheck,
  fixedChromeViolations: v.fixedChromeViolations,
  seaCoverageViolations: v.seaCoverageViolations,
  southPinViolation: v.southPinViolation,
  panelsOverLand: v.panelsOverLand,
});

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--window-size=3440,1500'],
  });
  const report = { contract: 'CTR-game-005', ok: true, warnings: [], viewports: [] };
  const reportPath = path.join(outDir, 'probe-report.json');
  const fail = (label, detail) => {
    report.ok = false;
    report.warnings.push({ viewport: label, severity: 'blocking', detail });
  };
  const warn = (label, detail) => report.warnings.push({ viewport: label, severity: 'extra-viewport', detail });
  const flush = () => fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const openGame = async (w, h) => {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });
    await page.goto(`${baseUrl}/game?capture=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.__worldCam != null, { timeout: 45000 });
    return page;
  };

  for (const vp of VIEWPORTS.filter((v) => only.length === 0 || only.includes(v.label))) {
    let page;
    try {
      page = await openGame(vp.w, vp.h);
    } catch (err) {
      report.viewports.push({ viewport: vp.label, ok: false, error: `boot/__worldCam failed: ${String(err).slice(0, 200)}` });
      vp.extra === true ? warn(vp.label, 'boot failed (extra viewport)') : fail(vp.label, 'boot/__worldCam failed');
      flush();
      continue;
    }
    await new Promise((r) => setTimeout(r, 2500));
    const m = await page.evaluate(measureMapFitInPage, MAP_FIT_MEASURE_ARGS);
    const shot = path.join(outDir, `game-${vp.label}.png`);
    await page.screenshot({ path: shot });

    const verdict = evaluateMapFit(m, vp);
    const scan = scanlineCheckPng(PNG.sync.read(fs.readFileSync(shot)), m, MAP_FIT_STAGE_COLOR);
    if (!verdict.ok || !scan.ok)
      vp.extra === true
        ? warn(vp.label, { ...verdictOf(verdict), scanline: scan.findings })
        : fail(vp.label, { ...verdictOf(verdict), scanline: scan.findings });

    report.viewports.push({
      viewport: vp.label,
      extra: vp.extra === true,
      ok: verdict.ok && scan.ok,
      zoom: m.cam?.zoom,
      pan: m.cam ? { x: m.cam.panX, y: m.cam.panY } : undefined,
      landScreen: m.land,
      canvasEdge: m.canvasEdge,
      seaQuad: m.seaQuad,
      hudCounts: m.hud
        ? { topPlaques: m.hud.topPlaques.length, navPlinth: m.hud.navPlinth.length, roster: m.hud.roster.length, ledger: m.hud.ledger.length }
        : undefined,
      ...verdictOf(verdict),
      scanline: { ok: scan.ok, findings: scan.findings, metrics: scan.metrics },
      screenshot: shot,
    });
    flush();
    await page.close().catch(() => {});
  }

  // INV-2 scenario: user wheel-zoom (userMoved) → resize → refit path must
  // still hold south-pin + zero fixed-chrome violations.
  {
    const entry = { viewport: 'resize-after-user-zoom' };
    try {
      const page = await openGame(1920, 800);
      await new Promise((r) => setTimeout(r, 1500));
      const before = await page.evaluate(() => ({ ...window.__worldCam }));
      await page.mouse.move(960, 400);
      await page.mouse.wheel({ deltaY: 240 });
      await new Promise((r) => setTimeout(r, 300));
      await page.setViewport({ width: 1440, height: 700 });
      await new Promise((r) => setTimeout(r, 1200));
      const after = await page.evaluate(measureMapFitInPage, MAP_FIT_MEASURE_ARGS);
      await page.screenshot({ path: path.join(outDir, 'game-resize-1440x700-after-zoom.png') });
      const verdict = evaluateMapFit(after, { w: 1440, h: 700 });
      Object.assign(entry, {
        beforeZoom: before.zoom,
        afterZoom: after.cam?.zoom,
        landScreen: after.land,
        ...verdictOf(verdict),
      });
      if (!verdict.ok) fail(entry.viewport, verdictOf(verdict));
      await page.close().catch(() => {});
    } catch (err) {
      Object.assign(entry, { ok: false, error: String(err).slice(0, 200) });
      fail(entry.viewport, String(err).slice(0, 200));
    }
    report.viewports.push(entry);
    flush();
  }

  // INV-3 scenario: deterministic jump to the left+bottom pan bounds at a
  // fractional zoom → sea quad coverage + scanline on the real pixels.
  {
    const entry = { viewport: 'pan-bounds-scanline' };
    try {
      const page = await openGame(1440, 900);
      await new Promise((r) => setTimeout(r, 1500));
      await page.evaluate(
        (marginX) => window.__worldCamCtl?.set({ panX: -marginX, panY: Number.MAX_SAFE_INTEGER, zoom: 0.3733 }),
        MAP_FIT_MEASURE_ARGS.marginX,
      );
      await new Promise((r) => setTimeout(r, 300));
      const m = await page.evaluate(measureMapFitInPage, MAP_FIT_MEASURE_ARGS);
      const shot = path.join(outDir, 'game-pan-bounds.png');
      await page.screenshot({ path: shot });
      const verdict = evaluateMapFit(m, { w: 1440, h: 900 });
      const scan = scanlineCheckPng(PNG.sync.read(fs.readFileSync(shot)), m, MAP_FIT_STAGE_COLOR);
      Object.assign(entry, {
        zoom: m.cam?.zoom,
        pan: m.cam ? { x: m.cam.panX, y: m.cam.panY } : undefined,
        canvasEdge: m.canvasEdge,
        seaQuad: m.seaQuad,
        ...verdictOf(verdict),
        scanline: { ok: scan.ok, findings: scan.findings, metrics: scan.metrics },
        screenshot: shot,
      });
      entry.ok = verdict.ok && scan.ok;
      if (!entry.ok) fail(entry.viewport, { ...verdictOf(verdict), scanline: scan.findings });
      await page.close().catch(() => {});
    } catch (err) {
      Object.assign(entry, { ok: false, error: String(err).slice(0, 200) });
      fail(entry.viewport, String(err).slice(0, 200));
    }
    report.viewports.push(entry);
    flush();
  }

  await browser.close();
  flush();
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nReport: ${reportPath}`);
  console.log(report.ok ? 'CTR-game-005 GREEN' : 'CTR-game-005 RED — see probe-report.json');
  process.exit(report.ok ? 0 : 1);
})();
