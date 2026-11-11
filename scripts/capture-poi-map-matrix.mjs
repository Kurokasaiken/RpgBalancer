#!/usr/bin/env node
/**
 * capture-poi-map-matrix.mjs — PLAN-117 F0/T0.1.
 *
 * Headless captures of the real `/game` map (PixiWorldMap) at the zones where
 * POIs and Luoghi will land: village + 4 biomes + sea, at the two contract
 * viewports (1440×900 desktop, 1280×800 compact). Three zoom tiers per zone:
 *   zfloor — the camera coverage floor (the `floorZoom()` the plan's D-8 cites),
 *            measured by asking zoom 0.01 and reading the clamped value back;
 *   zmin   — the manifest minZoom (0.18, whole map on screen);
 *   zmid   — 1.0, a typical resting zoom.
 * Every zone gets a full shot plus a 400×400 centre crop (POI-landing area).
 * Closes with the current Sigillo POIs on `/gameOld` (old-language baseline).
 *
 * Zone world coords: `public/assets/world/mappa2/base/regions.json` centres
 * (normalized × 2752×1536 canvas) and `fx/village/village.json` zone.
 * Camera via the dev seam `window.__worldCamCtl.set` (CTR-game-005).
 *
 * Usage: node scripts/capture-poi-map-matrix.mjs [baseUrl]
 * Requires the dev server at http://localhost:5173 (or the URL passed).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'test-results/poi-zanara-f0');
const BASE_URL = process.argv[2] ?? 'http://localhost:5173';

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
];

/** World-pixel centres: village zone + region centres from regions.json. */
const ZONES = [
  { id: 'village', wx: 1515, wy: 700, note: 'village zone 1260,505 +510x390 (village.json) — futuro Luogo' },
  { id: 'ridge_forest', wx: 912, wy: 568, note: 'foresta' },
  { id: 'snow_peaks', wx: 1427, wy: 301, note: 'alpe/neve' },
  { id: 'red_canyons', wx: 1975, wy: 739, note: 'canyon/deserto rosso' },
  { id: 'volcanic_massif', wx: 1819, wy: 1054, note: 'vulcano' },
  { id: 'coral_lagoon', wx: 1272, wy: 1295, note: 'mare/laguna sud' },
  { id: 'sea_west', wx: 404, wy: 742, note: 'mare aperto ovest' },
];

const CROP = 400; // px, centred on the zone point — the POI-landing area

const waitForMap = async (page) => {
  await page.waitForFunction(() => Boolean(window.__worldCam && window.__worldCamCtl), undefined, { timeout: 90_000 });
  await page.waitForTimeout(2500); // let layers/tiles paint after boot
};

const centreOn = async (page, zone, zoom, vw, vh) => {
  await page.evaluate(
    ([wx, wy, z, w, h]) => window.__worldCamCtl.set({ panX: wx - w / (2 * z), panY: wy - h / (2 * z), zoom: z }),
    [zone.wx, zone.wy, zoom, vw, vh],
  );
  await page.waitForTimeout(1200); // tiles + atmosphere settle
};

const clipFor = (vw, vh) => ({
  x: Math.max(0, Math.floor(vw / 2 - CROP / 2)),
  y: Math.max(0, Math.floor(vh / 2 - CROP / 2)),
  width: Math.min(CROP, vw),
  height: Math.min(CROP, vh),
});

const main = async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const log = [];

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    page.on('console', (m) => { if (m.type() === 'error') log.push(`[${vp.name}] ${m.text().slice(0, 140)}`); });
    await page.goto(`${BASE_URL}/game`, { waitUntil: 'domcontentloaded' });
    await waitForMap(page);

    // Coverage floor: ask for an impossible zoom-out, read back the clamp.
    await page.evaluate(() => window.__worldCamCtl.set({ zoom: 0.01 }));
    const floorZoom = (await page.evaluate(() => window.__worldCam.zoom)) ?? 0.5;
    const bounds = await page.evaluate(() => window.__worldCamBounds);
    const zooms = [
      { name: 'floor', z: floorZoom },
      { name: 'min', z: bounds?.min ?? 0.18 },
      { name: 'mid', z: Math.min(1.0, bounds?.max ?? 3) },
    ];
    log.push(`viewport ${vp.name}: coverageFloor=${floorZoom.toFixed(3)} manifestBounds=${JSON.stringify(bounds)}`);

    for (const zm of zooms) {
      for (const zone of ZONES) {
        await centreOn(page, zone, zm.z, vp.width, vp.height);
        const stem = `${vp.name}-${zone.id}-z${zm.name}`;
        await page.screenshot({ path: join(OUT, `${stem}.png`) });
        await page.screenshot({ path: join(OUT, `${stem}-crop.png`), clip: clipFor(vp.width, vp.height) });
        console.log(`${stem}.png + crop`);
      }
    }
    await page.close();
  }

  // Old-language baseline: the Sigillo POIs on /gameOld.
  const old = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await old.goto(`${BASE_URL}/gameOld`, { waitUntil: 'domcontentloaded' });
  await old.waitForFunction(() => {
    const exp = window.__idleVillageTestHooks?.expedition;
    return Boolean(exp && exp['poi-goblin'] && exp['poi-rovine']);
  }, undefined, { timeout: 45_000 });
  await old.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), undefined, { timeout: 30_000 }).catch(() => {});
  await old.waitForTimeout(2500);
  await old.screenshot({ path: join(OUT, 'gameold-sigillo-base.png') });
  const pois = await old.locator('[data-testid="map-quest-poi"]').all();
  for (const [i, loc] of pois.entries()) {
    const box = await loc.boundingBox().catch(() => null);
    if (box) {
      const pad = 80;
      await old.screenshot({
        path: join(OUT, `gameold-sigillo-${i}.png`),
        clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 },
      });
      console.log(`gameold-sigillo-${i}.png`);
    }
  }
  if (pois.length === 0) console.warn('no map-quest-poi elements found');
  await old.close();
  await browser.close();

  console.log(`\n=== ${OUT} ===`);
  console.log(log.join('\n') || 'no console errors');
};

main().catch((e) => { console.error(e); process.exit(1); });
