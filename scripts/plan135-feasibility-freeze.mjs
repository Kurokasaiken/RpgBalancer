#!/usr/bin/env node
/**
 * PLAN-135 T1.5 feasibility freeze. Measures live /game fixed chrome, captures the
 * pre-apron render baseline, validates the deterministic crop plan and writes the
 * generation gate. This script never calls a generative provider.
 */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
require('tsx/cjs');
const { restingFit } = require('../src/ui/idleVillage/pixiSpike/restingFit.ts');
const { MAPPA2_APRON, MAPPA2_FIT_CHROME_SLOTS, MAPPA2_FIT_MEASUREMENTS } = require('../src/ui/idleVillage/config/mappa2FitConfig.ts');

const root = process.cwd();
const outDir = path.join(root, '.mw/specs/mappa2-apron');
const verifyOnly = process.argv[2] === '--verify-only';
const verifyPath = process.argv[3];
const shaFile = (p) => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const shaText = (s) => createHash('sha256').update(s).digest('hex');

const viewports = [
  [1280, 720], [1366, 768], [1440, 900], [1536, 864], [1920, 1080], [1920, 1200],
  [2000, 1024], [2560, 1440], [2560, 1080], [3440, 1440],
].map(([width, height]) => ({ width, height, label: `${width}x${height}` }));

function validateCropPlan(plan) {
  const errors = [];
  if (!plan.validation?.ok) errors.push('crop plan validation is not ok');
  if (!plan.joinClassification?.canvasApron || !plan.joinClassification?.stripStrip || !plan.joinClassification?.sourceAlpha?.path) errors.push('join classification rule is incomplete');
  for (const c of plan.crops ?? []) {
    if (!Number.isFinite(c.canvasBoundaryLandFraction)) errors.push(`${c.id}: missing measured canvas-boundary land fraction`);
    if (c.worldToCropScaleX !== 1 || c.worldToCropScaleY !== 1) errors.push(`${c.id}: scale lock broken`);
    if (c.outputSizePx?.width !== 1024 || c.outputSizePx?.height !== 572) errors.push(`${c.id}: unexpected output size`);
  }
  if (!plan.ownership?.exclusive || plan.ownership?.coverage !== 'complete') errors.push('ownership is not exclusive+complete');
  const joinClasses = new Set();
  for (const j of plan.joins ?? []) {
    if (!j.boundary?.orientation || j.bandWidthPx !== 4) errors.push(`${j.id}: missing frozen boundary/band geometry`);
    if (!['coast-crossing', 'open-water', 'corner'].includes(j.joinClass)) errors.push(`${j.id}: missing/invalid joinClass`);
    else joinClasses.add(j.joinClass);
    if (j.kind === 'strip-strip' && !j.sourceOverlapWorldPx) errors.push(`${j.id}: missing source overlap rect`);
  }
  for (const joinClass of ['coast-crossing', 'open-water', 'corner']) {
    if (!joinClasses.has(joinClass)) errors.push(`crop plan has no ${joinClass} join`);
  }
  return errors;
}

function validatePaintingBaseline(baseline) {
  const errors = [];
  if (baseline.schema !== 'plan135-painting-baseline/v2') errors.push('painting baseline schema is not v2');
  for (const key of ['painting', 'seaAlpha']) {
    const ref = baseline.sourceImages?.[key];
    if (!ref?.path || !ref?.sha256) errors.push(`source image ${key} lacks path+sha256`);
  }
  const swatches = baseline.classifier?.waterSwatches ?? [];
  if (swatches.length < 6) errors.push('fewer than 6 water swatches');
  for (const [i, swatch] of swatches.entries()) {
    if (!(swatch.radiusDeltaE > 0) || !(swatch.size > 0) || !Array.isArray(swatch.meanLab)) errors.push(`water swatch ${i} is incomplete`);
  }
  for (const key of ['waterMask', 'waterMaskAfterOpening']) {
    const ref = baseline.classifier?.[key];
    if (!ref?.path || !ref?.sha256) errors.push(`classifier ${key} lacks path+sha256`);
    else {
      const full = path.join(root, ref.path);
      if (!fs.existsSync(full)) errors.push(`classifier ${key} artifact missing`);
      else if (shaFile(full) !== ref.sha256) errors.push(`classifier ${key} sha mismatch`);
    }
  }
  const lattice = baseline.seamMetricSet?.lattice;
  if (!(lattice?.stridePx?.x > 0) || !(lattice?.stridePx?.y > 0) || lattice.stripPx !== 4 || lattice.patchLengthPx !== 64) errors.push('seam lattice is incomplete');
  for (const [joinClass, row] of Object.entries(baseline.seamMetricSet?.baselinesByJoinClass ?? {})) {
    if ((row.sampleCount ?? 0) < 4) errors.push(`${joinClass}: insufficient seam baseline`);
    if ((row.positions ?? []).length !== row.sampleCount) errors.push(`${joinClass}: lattice positions do not match sampleCount`);
    if (!row.p95) errors.push(`${joinClass}: missing p95 thresholds`);
  }
  return errors;
}

async function measureStableRects(page, width, height) {
  await page.setViewport({ width, height });
  // Let resize/scale observers settle, then compare the same slots on two consecutive animation frames.
  await new Promise((r) => setTimeout(r, 350));
  const measured = await page.evaluate((slots) => {
    const readRows = () => {
      const rows = {};
      for (const slot of slots) {
        const el = document.querySelector(`[data-hudslot="${slot}"]`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        rows[slot] = { id: slot, x: r.x, y: r.y, width: r.width, height: r.height, visible: r.width > 0 && r.height > 0 };
      }
      return rows;
    };
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const first = readRows();
        requestAnimationFrame(() => resolve({ dpr: window.devicePixelRatio || 1, first, second: readRows() }));
      });
    });
  }, [...MAPPA2_FIT_CHROME_SLOTS]);
  const stable = {};
  for (const [slot, ra] of Object.entries(measured.first)) {
    const rb = measured.second[slot];
    stable[slot] = !!(rb && ra.visible && rb.visible && Math.abs(ra.x - rb.x) < 0.5 && Math.abs(ra.y - rb.y) < 0.5 && Math.abs(ra.width - rb.width) < 0.5 && Math.abs(ra.height - rb.height) < 0.5);
  }
  return { rects: measured.second, stable, dpr: measured.dpr };
}

function installApronCameraHarness(page) {
  let patched = false;
  let enabled = false;
  return {
    async enable() {
      if (enabled) return;
      enabled = true;
      const client = await page.createCDPSession();
      // Pattern-scoped CDP interception: Puppeteer's page-wide request interception
      // starves the large concurrent webp asset fan-out and leaves the map boot in `build`.
      await client.send('Fetch.enable', { patterns: [{ urlPattern: '*mappa2ApprovedLook.ts*', requestStage: 'Request' }] });
      client.on('Fetch.requestPaused', async (event) => {
        try {
          const response = await fetch(event.request.url);
          const source = await response.text();
          const next = source.replace('seaMargin: { xPx: 0, yPx: 0 }', 'seaMargin: { xPx: 560, yPx: 200 }');
          if (next !== source) patched = true;
          await client.send('Fetch.fulfillRequest', {
            requestId: event.requestId,
            responseCode: response.status,
            responseHeaders: [{ name: 'content-type', value: 'text/javascript' }],
            body: Buffer.from(next).toString('base64'),
          });
        } catch {
          await client.send('Fetch.continueRequest', { requestId: event.requestId }).catch(() => {});
        }
      });
    },
    isPatched: () => patched,
  };
}

async function waitTwoAnimationFrames(page) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function freeze() {
  fs.mkdirSync(outDir, { recursive: true });
  execFileSync('node', ['scripts/plan135/build-crop-plan.mjs', '.mw/specs/mappa2-apron/crop-plan.json'], { cwd: root, stdio: 'pipe' });
  execFileSync('python3', ['scripts/plan135/measure-painting-baseline.py'], { cwd: root, stdio: 'pipe' });
  const cropPlan = JSON.parse(fs.readFileSync(path.join(outDir, 'crop-plan.json'), 'utf8'));
  const paintingBaseline = JSON.parse(fs.readFileSync(path.join(outDir, 'painting-baseline.json'), 'utf8'));
  const cropErrors = validateCropPlan(cropPlan);
  const paintingErrors = validatePaintingBaseline(paintingBaseline);
  const baseUrl = process.env.PLAN135_BASE_URL ?? 'http://localhost:5173';
  const baselineDir = path.join(outDir, 'baseline-render');
  fs.mkdirSync(baselineDir, { recursive: true });
  const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const useSystemChrome = fs.existsSync(systemChrome);
  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 60000,
    ...(useSystemChrome ? { executablePath: systemChrome } : { args: ['--enable-unsafe-swiftshader'] }),
  });
  const measurements = [];
  const baseline = [];
  const pendingShots = [];
  const fitByViewport = new Map();
  try {
    for (const tod of ['day', 'night']) {
      const page = await browser.newPage();
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      const apronCameraHarness = installApronCameraHarness(page);
      await apronCameraHarness.enable();
      await page.setViewport({ width: 1280, height: 720 });
      await page.goto(`${baseUrl}/game?capture=1&tod=${tod}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      let booted = false;
      for (let attempt = 0; attempt < 3 && !booted; attempt += 1) {
        try {
          await page.waitForFunction(() => window.__worldCam != null && window.__worldCamCtl != null && document.querySelector('[data-hudslot="events"]') != null, { timeout: 90000 });
          await page.waitForFunction(() => document.querySelector('[data-testid="game-boot-screen"]') == null, { timeout: 90000 });
          booted = true;
        } catch (err) {
          if (attempt === 2) throw err;
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
        }
      }
      if (!apronCameraHarness.isPatched()) throw new Error(`apron camera harness did not patch mappa2ApprovedLook for ${tod}`);
      for (const vp of viewports) {
        console.error(`capture ${tod}/${vp.label}: measuring chrome`);
        let measured;
        try {
          measured = await measureStableRects(page, vp.width, vp.height);
        } catch (err) {
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
          await page.waitForFunction(() => window.__worldCam != null && window.__worldCamCtl != null, { timeout: 60000 }).catch(() => {});
          measured = await measureStableRects(page, vp.width, vp.height);
        }
        if (tod === 'day') {
          const chromeRects = Object.values(measured.rects).filter((r) => r.visible);
          const fit = restingFit({
            viewport: { width: vp.width, height: vp.height },
            chromeRects,
            landBounds: MAPPA2_FIT_MEASUREMENTS.landBounds,
            canvas: MAPPA2_FIT_MEASUREMENTS.canvas,
            apron: MAPPA2_APRON,
            chromeGapPx: 8,
          });
          measurements.push({ viewport: vp, dpr: measured.dpr, chromeRects, stable: measured.stable, fit });
          fitByViewport.set(vp.label, fit);
        }
        const cameraFit = fitByViewport.get(vp.label);
        if (!cameraFit) throw new Error(`missing resting fit for baseline capture ${vp.label}`);
        console.error(`capture ${tod}/${vp.label}: setting camera`);
        await page.evaluate((camera) => window.__worldCamCtl.set(camera), { panX: cameraFit.panX, panY: cameraFit.panY, zoom: cameraFit.zoom });
        await waitTwoAnimationFrames(page);
        const camCheck = await page.evaluate(() => window.__worldCam ? { panX: window.__worldCam.panX, panY: window.__worldCam.panY, zoom: window.__worldCam.zoom } : null);
        if (!camCheck || Math.abs(camCheck.panX - cameraFit.panX) > 1e-5 || Math.abs(camCheck.panY - cameraFit.panY) > 1e-5 || Math.abs(camCheck.zoom - cameraFit.zoom) > 1e-5) {
          throw new Error(`camera mismatch for baseline capture ${vp.label}/${tod}: ${JSON.stringify({ wanted: cameraFit, actual: camCheck })}`);
        }
        const canvasScreen = {
          x0: (0 - cameraFit.panX) * cameraFit.zoom,
          y0: (0 - cameraFit.panY) * cameraFit.zoom,
          x1: (MAPPA2_FIT_MEASUREMENTS.canvas.width - cameraFit.panX) * cameraFit.zoom,
          y1: (MAPPA2_FIT_MEASUREMENTS.canvas.height - cameraFit.panY) * cameraFit.zoom,
        };
        const clipX0 = Math.max(0, canvasScreen.x0);
        const clipY0 = Math.max(0, canvasScreen.y0);
        const clipX1 = Math.min(vp.width, canvasScreen.x1);
        const clipY1 = Math.min(vp.height, canvasScreen.y1);
        if (!(clipX1 > clipX0) || !(clipY1 > clipY0)) throw new Error(`original canvas is not visible for ${vp.label}/${tod}`);
        const clip = {
          x: Math.floor(clipX0),
          y: Math.floor(clipY0),
          width: Math.ceil(clipX1) - Math.floor(clipX0),
          height: Math.ceil(clipY1) - Math.floor(clipY0),
        };
        const name = `${vp.label}-${tod}.png`;
        const file = path.join(baselineDir, name);
        await page.evaluate(() => {
          const style = document.createElement('style');
          style.id = 'plan135-canvas-only-capture';
          style.textContent = 'body *{visibility:hidden!important}[data-testid="pixi-world-canvas"]{visibility:visible!important}';
          document.head.appendChild(style);
        });
        let shot;
        try {
          console.error(`capture ${tod}/${vp.label}: screenshot`);
          const fullShot = await page.screenshot();
          shot = await sharp(fullShot).extract({ left: clip.x, top: clip.y, width: clip.width, height: clip.height }).png().toBuffer();
        } finally {
          await page.evaluate(() => document.getElementById('plan135-canvas-only-capture')?.remove());
        }
        pendingShots.push({ file, shot });
        baseline.push({
          viewport: vp.label,
          timeOfDay: tod,
          path: path.relative(root, file),
          sha256: createHash('sha256').update(shot).digest('hex'),
          captureMode: 'renderer-canvas-only: every DOM element hidden except [data-testid="pixi-world-canvas"]; clip is cropped offline from a full-page screenshot to the screen intersection of the original painted canvas; camera clamp harness simulates the frozen 560/200 apron margins without changing canvas assets',
          camera: { panX: cameraFit.panX, panY: cameraFit.panY, zoom: cameraFit.zoom },
          canvasScreen,
          clip,
        });
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  // Writes under .mw trigger a full Vite reload; flush them only after the measured pages are closed.
  for (const { file, shot } of pendingShots) fs.writeFileSync(file, shot);

  const eventsMissing = measurements.filter((m) => !(m.chromeRects.some((r) => r.id === 'events' && r.visible) && m.stable.events));
  const hardStops = measurements.filter((m) =>
    m.fit.apronNeeded.bottom !== 0 || m.fit.apronNeeded.top > MAPPA2_APRON.top || m.fit.apronNeeded.left > MAPPA2_APRON.left || m.fit.apronNeeded.right > MAPPA2_APRON.right || m.fit.status !== 'LAND_CLEAR' || m.fit.landClipPx > 0);
  const slackEntries = measurements.flatMap((m) => ['top', 'right', 'bottom', 'left'].map((side) => ({
    viewport: m.viewport.label,
    side,
    available: MAPPA2_APRON[side],
    required: m.fit.apronNeeded[side],
    slack: m.fit.frameSlack[side],
  })));
  const minSlack = slackEntries.reduce((acc, row) => Math.min(acc, row.slack), Infinity);
  const positiveApronSlacks = slackEntries.filter((row) => row.available > 0);
  const minPositiveApronSlack = positiveApronSlacks.reduce((acc, row) => Math.min(acc, row.slack), Infinity);
  const zeroSlackSides = slackEntries.filter((row) => row.slack === 0).map((row) => `${row.viewport}:${row.side}`);
  const status = cropErrors.length ? 'INVALID_CROP_PLAN' : paintingErrors.length ? 'INVALID_PAINTING_BASELINE' : eventsMissing.length ? 'INCOMPLETE_EVENTS' : hardStops.length ? 'GLOBAL_STOP' : 'FEASIBLE';
  const apronSummary = {
    schema: 'plan135-apron-measurements/v2',
    createdAt: new Date().toISOString(),
    unit: 'CSS px for chrome/viewport; world px for fit, slack and apron',
    canvas: MAPPA2_FIT_MEASUREMENTS.canvas,
    landBounds: MAPPA2_FIT_MEASUREMENTS.landBounds,
    approvedApron: MAPPA2_APRON,
    slots: MAPPA2_FIT_CHROME_SLOTS,
    rows: measurements.map((m) => ({
      viewport: m.viewport.label,
      zoom: m.fit.zoom,
      zLand: m.fit.zLand,
      frameClampMinZoom: m.fit.zFrame,
      status: m.fit.status,
      chromeEnvelope: Object.fromEntries(m.chromeRects.map((r) => [r.id, { x: r.x, y: r.y, width: r.width, height: r.height }])),
      stable: m.stable,
      requiredWorldPx: m.fit.apronNeeded,
      slackWorldPx: m.fit.frameSlack,
    })),
  };
  fs.writeFileSync(path.join(outDir, 'apron.json'), `${JSON.stringify(apronSummary, null, 2)}\n`);

  const payload = {
    schema: 'plan135-feasibility/v1',
    createdAt: new Date().toISOString(),
    generationGate: 'NO_GENERATION_BEFORE_THIS_FILE',
    status,
    decision: { apron: MAPPA2_APRON, apronWorldRect: { x0: -560, y0: -200, x1: 3312, y1: 1536 }, scale: '1 image px = 1 world px' },
    measurementSource: { route: '/game?capture=1', browserZoom: 1, unit: 'CSS px', stableFrames: 2, stabilityRule: 'same nonzero rect on two consecutive animation frames', slots: MAPPA2_FIT_CHROME_SLOTS },
    measurements,
    summary: {
      eventsMissingViewports: eventsMissing.map((m) => m.viewport.label),
      hardStopViewports: hardStops.map((m) => ({ viewport: m.viewport.label, status: m.fit.status, apronNeeded: m.fit.apronNeeded, landClipPx: m.fit.landClipPx })),
      minFrameSlackWorldPx: Number.isFinite(minSlack) ? minSlack : null,
      minPositiveApronFrameSlackWorldPx: Number.isFinite(minPositiveApronSlack) ? minPositiveApronSlack : null,
      zeroSlackSides,
      headroomRisk: minPositiveApronSlack < 24,
    },
    frozenConstants: {
      frameClamp: {
        formula: 'zFrame=max(viewportW/(2752+560+560),viewportH/(1536+200+0)); CSS px, DPR recorded but not used',
        rounding: 'floor(min),ceil(max)',
        apronWorldRect: { x0: -560, y0: -200, x1: 3312, y1: 1536 },
        frameClampMinZoomByViewport: Object.fromEntries(measurements.map((m) => [m.viewport.label, m.fit.zFrame])),
      },
      pilotKillCriteria: { maxRegenerationsPerStrip: 2, pilotCycles: 1, repaintReferenceFail: true, outerWaterFail: true, independentLandFail: true, seamThresholdFail: true },
      outerWaterBands: cropPlan.outerWaterBands,
      deepSeaVeil: { canvasInteriorIntensity: 0, source: 'PLAN-135 §10.11; shader uniform to be pinned before T5' },
    },
    artifacts: {
      cropPlan: { path: '.mw/specs/mappa2-apron/crop-plan.json', sha256: shaFile(path.join(outDir, 'crop-plan.json')) },
      apronMeasurements: { path: '.mw/specs/mappa2-apron/apron.json', sha256: shaFile(path.join(outDir, 'apron.json')) },
      paintingBaseline: { path: '.mw/specs/mappa2-apron/painting-baseline.json', sha256: shaFile(path.join(outDir, 'painting-baseline.json')) },
      waterMaskRaw: paintingBaseline.classifier.waterMask,
      waterMaskOpened: paintingBaseline.classifier.waterMaskAfterOpening,
      baselineRenders: baseline,
    },
    scriptSha256: {
      feasibility: shaFile(path.join(root, 'scripts/plan135-feasibility-freeze.mjs')),
      cropPlanGenerator: shaFile(path.join(root, 'scripts/plan135/build-crop-plan.mjs')),
      paintingBaselineGenerator: shaFile(path.join(root, 'scripts/plan135/measure-painting-baseline.py')),
    },
    classifier: paintingBaseline.classifier,
    seamMetricSet: paintingBaseline.seamMetricSet,
    cropPlanValidation: { ok: cropErrors.length === 0, errors: cropErrors },
    paintingBaselineValidation: { ok: paintingErrors.length === 0, errors: paintingErrors },
  };
  const text = `${JSON.stringify(payload, null, 2)}\n`;
  fs.writeFileSync(path.join(outDir, 'feasibility.json'), text);
  console.log(JSON.stringify({ status, sha256: shaText(text), minPositiveApronFrameSlackWorldPx: payload.summary.minPositiveApronFrameSlackWorldPx, eventsMissing: payload.summary.eventsMissingViewports, hardStops: payload.summary.hardStopViewports.length }));
  if (status !== 'FEASIBLE') process.exit(2);
}

function verifyFrozenFile(ref, label, errors) {
  if (!ref?.path || !ref?.sha256) {
    errors.push(`${label}: missing path+sha256`);
    return null;
  }
  const full = path.join(root, ref.path);
  if (!fs.existsSync(full)) {
    errors.push(`${label}: artifact missing`);
    return null;
  }
  if (shaFile(full) !== ref.sha256) {
    errors.push(`${label}: sha mismatch`);
    return null;
  }
  return full;
}

function verifyFeasibilityFreeze(data) {
  const errors = [];
  if (data.schema !== 'plan135-feasibility/v1') errors.push('schema is not plan135-feasibility/v1');
  if (data.status !== 'FEASIBLE') errors.push(`status is ${data.status}`);
  if (data.generationGate !== 'NO_GENERATION_BEFORE_THIS_FILE') errors.push('generation gate marker missing');
  const expectedViewports = new Set(viewports.map((vp) => vp.label));
  const measuredViewports = new Set((data.measurements ?? []).map((m) => m.viewport?.label));
  if (measuredViewports.size !== expectedViewports.size || [...expectedViewports].some((label) => !measuredViewports.has(label))) errors.push('measurement viewport matrix incomplete');
  for (const m of data.measurements ?? []) {
    for (const slot of MAPPA2_FIT_CHROME_SLOTS) {
      const row = m.chromeRects?.find((r) => r.id === slot);
      if (!row?.visible || !m.stable?.[slot]) errors.push(`${m.viewport?.label}: ${slot} rect missing/unstable`);
    }
    if (m.fit?.status !== 'LAND_CLEAR' || m.fit?.landClipPx > 0) errors.push(`${m.viewport?.label}: fit is not clean LAND_CLEAR`);
  }
  if ((data.summary?.eventsMissingViewports ?? []).length) errors.push('eventsMissingViewports is not empty');
  if ((data.summary?.hardStopViewports ?? []).length) errors.push('hardStopViewports is not empty');
  if (!data.cropPlanValidation?.ok) errors.push('cropPlanValidation is not ok');
  if (!data.paintingBaselineValidation?.ok) errors.push('paintingBaselineValidation is not ok');

  const cropPath = verifyFrozenFile(data.artifacts?.cropPlan, 'cropPlan', errors);
  const paintingPath = verifyFrozenFile(data.artifacts?.paintingBaseline, 'paintingBaseline', errors);
  verifyFrozenFile(data.artifacts?.apronMeasurements, 'apronMeasurements', errors);
  verifyFrozenFile(data.artifacts?.waterMaskRaw, 'waterMaskRaw', errors);
  verifyFrozenFile(data.artifacts?.waterMaskOpened, 'waterMaskOpened', errors);
  if (cropPath) {
    const cropErrors = validateCropPlan(JSON.parse(fs.readFileSync(cropPath, 'utf8')));
    errors.push(...cropErrors.map((e) => `cropPlan revalidation: ${e}`));
  }
  if (paintingPath) {
    const paintingErrors = validatePaintingBaseline(JSON.parse(fs.readFileSync(paintingPath, 'utf8')));
    errors.push(...paintingErrors.map((e) => `paintingBaseline revalidation: ${e}`));
  }

  const renders = data.artifacts?.baselineRenders ?? [];
  const renderKeys = new Set(renders.map((r) => `${r.viewport}/${r.timeOfDay}`));
  for (const vp of viewports) for (const tod of ['day', 'night']) {
    if (!renderKeys.has(`${vp.label}/${tod}`)) errors.push(`missing baseline render ${vp.label}/${tod}`);
  }
  if (renders.length !== viewports.length * 2) errors.push(`expected ${viewports.length * 2} baseline renders, found ${renders.length}`);
  for (const render of renders) {
    verifyFrozenFile(render, `baseline render ${render.viewport}/${render.timeOfDay}`, errors);
    if (!(render.camera?.zoom > 0) || !Number.isFinite(render.camera?.panX) || !Number.isFinite(render.camera?.panY)) errors.push(`baseline render ${render.viewport}/${render.timeOfDay}: missing camera`);
  }
  const scripts = data.scriptSha256 ?? {};
  for (const [label, file] of Object.entries({ feasibility: 'scripts/plan135-feasibility-freeze.mjs', cropPlanGenerator: 'scripts/plan135/build-crop-plan.mjs', paintingBaselineGenerator: 'scripts/plan135/measure-painting-baseline.py' })) {
    if (!scripts[label]) errors.push(`scriptSha256.${label} missing`);
    else if (shaFile(path.join(root, file)) !== scripts[label]) errors.push(`scriptSha256.${label} does not match current generator; rerun the freeze`);
  }
  return errors;
}

if (verifyOnly) {
  const p = path.resolve(root, verifyPath ?? '.mw/specs/mappa2-apron/feasibility.json');
  if (!fs.existsSync(p)) {
    console.error(`missing feasibility freeze: ${p}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const errors = verifyFeasibilityFreeze(data);
  console.log(JSON.stringify({ status: data.status, schema: data.schema, measurements: data.measurements?.length ?? 0, baselineRenders: data.artifacts?.baselineRenders?.length ?? 0, verificationErrors: errors }));
  process.exit(errors.length === 0 && data.status === 'FEASIBLE' ? 0 : 2);
} else {
  freeze().catch((err) => {
    console.error(err?.stack ?? String(err));
    process.exit(1);
  });
}
