#!/usr/bin/env node
// PLAN-126 T-A2 (OB-2): per-phase boot timing — last-byte / image decode /
// GPU upload / scene build / veil-lift — collected in-page on the real boot
// path. Runs on SwiftShader (same as the deploy probe) and, with --gpu, on the
// local real GPU (T-09/T-22: measure on the runtime that shows the symptom —
// use a `vite preview` production build as the URL).
//
// Decode attribution: `createImageBitmap` is wrapped via addInitScript — no app
// code touched. GPU upload: `texImage2D`/`texSubImage2D` (incl. compressed)
// submission is counted on both WebGL prototype chains; the upload *completion*
// bound comes from the `game-boot:uploaded`/`game-boot:ready` marks.
//
// Usage:
//   node scripts/boot-phase-timing.mjs <url> <outPath> [--gpu]
// Env: BOOT_PROBE_TIMEOUT_MS (default 300000)

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const url = process.argv[2];
const outPath = process.argv[3] ?? '.mw/runs/plan126-boot-bytes/timing.json';
const useGpu = process.argv.includes('--gpu');
const TIMEOUT_MS = Number(process.env.BOOT_PROBE_TIMEOUT_MS ?? 300000);
if (!url) {
  console.error('usage: boot-phase-timing.mjs <url> <outPath> [--gpu]');
  process.exit(2);
}
mkdirSync(path.dirname(outPath), { recursive: true });

const HOOKS_INIT = () => {
  const rec = (bucket, t0) => {
    const ms = performance.now() - t0;
    bucket.count += 1;
    bucket.totalMs += ms;
    if (ms > bucket.maxMs) bucket.maxMs = ms;
    if (bucket.first < 0) bucket.first = t0;
    bucket.last = performance.now();
  };
  const hooks = {
    imgBitmap: { count: 0, totalMs: 0, maxMs: 0, first: -1, last: 0 },
    imgDecode: { count: 0, totalMs: 0, maxMs: 0, first: -1, last: 0 },
    tex: { count: 0, totalMs: 0, maxMs: 0, first: -1, last: 0 },
  };
  window.__bootHooks = hooks;
  const origCIB = window.createImageBitmap?.bind(window);
  if (origCIB) {
    window.createImageBitmap = (...args) => {
      const t0 = performance.now();
      return Promise.resolve(origCIB(...args)).then((r) => {
        rec(hooks.imgBitmap, t0);
        return r;
      });
    };
  }
  const origDecode = window.HTMLImageElement?.prototype?.decode;
  if (origDecode && !origDecode.__bootHooked) {
    const wrappedDecode = function (...args) {
      const t0 = performance.now();
      return Promise.resolve(origDecode.apply(this, args)).then((r) => {
        rec(hooks.imgDecode, t0);
        return r;
      }).catch((e) => {
        rec(hooks.imgDecode, t0);
        throw e;
      });
    };
    wrappedDecode.__bootHooked = true;
    window.HTMLImageElement.prototype.decode = wrappedDecode;
  }
  const texFns = ['texImage2D', 'texSubImage2D', 'texImage3D', 'texSubImage3D', 'compressedTexImage2D', 'compressedTexSubImage2D'];
  for (const proto of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype]) {
    if (!proto) continue;
    for (const name of texFns) {
      const orig = proto[name];
      if (typeof orig !== 'function' || orig.__bootHooked) continue;
      const wrapped = function (...args) {
        const t0 = performance.now();
        const r = orig.apply(this, args);
        rec(hooks.tex, t0);
        return r;
      };
      wrapped.__bootHooked = true;
      proto[name] = wrapped;
    }
  }
};

// --gpu: real GPU via ANGLE-Metal (macOS headless). Without it Chromium gets
// NO WebGL at all here (gl=null, canvas fallback) — NOT a GPU measure.
const launchArgs = useGpu ? ['--use-angle=metal'] : ['--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ args: launchArgs });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.addInitScript(HOOKS_INIT);
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));

const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

let interactiveMs = null;
while (Date.now() - t0 < TIMEOUT_MS) {
  interactiveMs = await page.evaluate(() => {
    const b = window.__gameBoot;
    return b && b.interactiveMs > 0 ? b.interactiveMs : null;
  });
  if (interactiveMs !== null) break;
  await page.waitForTimeout(2000);
}

const data = await page.evaluate(() => {
  const marks = {};
  for (const m of performance.getEntriesByType('mark')) {
    if (m.name.startsWith('game-boot:') && !(m.name in marks)) marks[m.name] = Math.round(m.startTime);
  }
  const res = performance.getEntriesByType('resource');
  let lastByte = 0;
  let transfer = 0;
  for (const r of res) {
    if (r.responseEnd > lastByte) lastByte = r.responseEnd;
    transfer += r.transferSize || 0;
  }
  let glRenderer = null;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    glRenderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER) ?? null;
  } catch {
    /* non-fatal */
  }
  const texReport = typeof window.__pixiTextureReport === 'function' ? window.__pixiTextureReport() : null;
  return {
    marks,
    resources: { count: res.length, lastByteMs: Math.round(lastByte), transferBytes: transfer },
    hooks: window.__bootHooks ?? null,
    glRenderer,
    texCount: texReport ? texReport.length : null,
    texMB: texReport ? Math.round(texReport.reduce((s, t) => s + t.mb, 0)) : null,
    nav: performance.getEntriesByType('navigation')[0]?.duration ?? null,
  };
});
await browser.close();

if (interactiveMs === null) {
  console.error(`TIMEOUT after ${TIMEOUT_MS / 1000}s — veil never lifted`);
  process.exit(1);
}

const M = data.marks;
const span = (a, b) => (M[a] != null && M[b] != null ? Math.round(M[b] - M[a]) : null);
const report = {
  meta: {
    url,
    capturedAt: new Date().toISOString(),
    env: useGpu ? 'gpu-local' : 'swiftshader-headless',
    glRenderer: data.glRenderer,
    interactiveMs,
    wallClockMs: Date.now() - t0,
    resources: data.resources,
    texCount: data.texCount,
    texMB: data.texMB,
    pageErrors,
  },
  marks: M,
  phases: {
    // network fan-out: first asset resolved → last (build starts)
    fetchSpanMs: span('game-boot:assets', 'game-boot:build'),
    lastByteMs: data.resources.lastByteMs,
    decodeMs: data.hooks ? Math.round((data.hooks.imgBitmap?.totalMs ?? 0) + (data.hooks.imgDecode?.totalMs ?? 0)) : null,
    decodeCalls: data.hooks ? (data.hooks.imgBitmap?.count ?? 0) + (data.hooks.imgDecode?.count ?? 0) : null,
    decodeWallMs: (() => {
      const parts = [data.hooks?.imgBitmap, data.hooks?.imgDecode].filter((h) => h && h.first >= 0);
      if (!parts.length) return null;
      return Math.round(Math.max(...parts.map((h) => h.last)) - Math.min(...parts.map((h) => h.first)));
    })(),
    // sequential scene build (containers/meshes/masks) — no network wait
    sceneBuildMs: span('game-boot:build', 'game-boot:warmup'),
    // GPU upload: prepare.upload resolution (submission+driver) → 2 frames (completion)
    gpuUploadMs: span('game-boot:warmup', 'game-boot:uploaded'),
    gpuSettleMs: span('game-boot:uploaded', 'game-boot:ready'),
    texSubmitMs: data.hooks?.tex ? Math.round(data.hooks.tex.totalMs) : null,
    texSubmitCalls: data.hooks?.tex?.count ?? null,
    // ready → veil gone (page-level warm gates + exit animation)
    readyToVeilMs: M['game-boot:ready'] != null ? Math.round(interactiveMs - M['game-boot:ready']) : null,
    veilLiftMs: interactiveMs,
  },
};

writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`env=${report.meta.env} gl=${data.glRenderer}`);
console.log(JSON.stringify(report.phases, null, 2));
console.log(`-> ${outPath}`);
