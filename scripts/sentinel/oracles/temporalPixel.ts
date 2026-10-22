/**
 * temporalPixel — Pass-1b isolated visual-replay oracle (PLAN-078 T-002).
 *
 * Pixel readback is deliberately separated from Pass-1 so the TemporalPerf
 * probe never pays for it: the same state transition is replayed in
 * isolation and frames are captured as PNGs, then analyzed offline in Node.
 *
 * Detects:
 *  - `black-frame`: a run of frames whose dark-pixel fraction exceeds
 *    `darkFraction` lasting longer than `blackFrameThresholdMs` (T-A4);
 *  - `title-art-desync`: the heading strip repaints to the new node while the
 *    artwork region still serves the previous image (T-A3 at pixel level);
 *  - `flicker`: a contiguous changed region that reverts within ≤2 frames —
 *    a transient repaint (one-frame stale snap and friends).
 *
 * `analyzeFrames`/`evaluateTemporalPixel` are pure functions over decoded
 * frame buffers — fully unit-testable without a browser.
 */
import { PNG } from 'pngjs';
import { createHash } from 'node:crypto';
import type { HarnessCtx } from '../gameSurfaceHarness';
import type { SentinelConfig } from '../sentinelConfig';
import type { OracleFinding, AuditPerturbation } from './index';

export interface PixelFrame {
  /** Capture timestamp (ms since epoch — page time). */
  t: number;
  png: Buffer;
}

/**
 * Captures a PNG frame sequence for `durationMs` at `intervalMs` intervals.
 * `clip` restricts the readback region (a full-viewport capture is fine;
 * screencast-cheap). Real intervals are recorded — the analysis uses actual
 * timestamps, never nominal ones.
 */
export async function captureTemporalSequence(
  ctx: HarnessCtx,
  { durationMs, intervalMs }: { durationMs: number; intervalMs: number },
): Promise<PixelFrame[]> {
  const frames: PixelFrame[] = [];
  const deadline = Date.now() + durationMs;
  while (Date.now() < deadline) {
    frames.push({ t: Date.now(), png: await ctx.page.screenshot({ type: 'png' }) });
    const left = intervalMs - (Date.now() - frames[frames.length - 1].t);
    if (left > 0) await ctx.page.waitForTimeout(left);
  }
  return frames;
}

interface DecodedFrame {
  t: number;
  w: number;
  h: number;
  /** 4-bit-downsampled mean luminance per cell — `rows*cols` cells. */
  cells: Float32Array;
  darkFraction: number;
}

function decode(f: PixelFrame, grid: number): DecodedFrame {
  const png = PNG.sync.read(f.png);
  const cols = Math.ceil(png.width / grid);
  const rows = Math.ceil(png.height / grid);
  const sums = new Float64Array(rows * cols);
  const counts = new Uint32Array(rows * cols);
  let dark = 0;
  const data = png.data;
  for (let y = 0; y < png.height; y++) {
    const cellY = Math.floor(y / grid);
    for (let x = 0; x < png.width; x++) {
      const i = (y * png.width + x) * 4;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      const c = cellY * cols + Math.floor(x / grid);
      sums[c] += lum;
      counts[c]++;
      if (lum < 26) dark++;
    }
  }
  const cells = new Float32Array(rows * cols);
  for (let i = 0; i < cells.length; i++) cells[i] = counts[i] ? sums[i] / counts[i] : 0;
  return { t: f.t, w: cols, h: rows, cells, darkFraction: dark / (png.width * png.height) };
}

export interface PixelAnalysis {
  /** Longest consecutive run of dark frames and its duration. */
  blackRunFrames: number;
  blackRunMs: number;
  blackRunStartT: number | null;
  /** Frames where the title strip changed while artwork stayed identical. */
  desyncFrames: number;
  /** Largest flicker region (cells that changed then reverted within 2 frames). */
  flickerCells: number;
  flickerBounds: [number, number, number, number] | null;
}

/** Pure analysis of a decoded sequence against the pixel thresholds. */
export function analyzeFrames(frames: PixelFrame[], cfg: SentinelConfig['temporalPixel']): PixelAnalysis {
  const decoded = frames.map((f) => decode(f, cfg.gridSize));
  const out: PixelAnalysis = {
    blackRunFrames: 0,
    blackRunMs: 0,
    blackRunStartT: null,
    desyncFrames: 0,
    flickerCells: 0,
    flickerBounds: null,
  };
  if (decoded.length === 0) return out;

  // black run
  let runStart: number | null = null;
  let runLen = 0;
  for (let i = 0; i < decoded.length; i++) {
    const d = decoded[i];
    const next = decoded[i + 1];
    if (d.darkFraction >= cfg.darkFraction) {
      if (runStart === null) runStart = i;
      runLen++;
      const dur = (next ? next.t : d.t + cfg.sampleIntervalMs) - decoded[runStart].t;
      if (runLen > out.blackRunFrames || dur > out.blackRunMs) {
        out.blackRunFrames = runLen;
        out.blackRunMs = dur;
        out.blackRunStartT = decoded[runStart].t;
      }
    } else {
      runStart = null;
      runLen = 0;
    }
  }

  // title/art desync: title strip changed while the rest stayed identical.
  const cellDelta = (a: Float32Array, b: Float32Array, i: number) => Math.abs(a[i] - b[i]) > 14;
  for (let i = 1; i < decoded.length; i++) {
    const a = decoded[i - 1];
    const b = decoded[i];
    if (a.w !== b.w || a.h !== b.h) continue;
    const titleRows = Math.max(1, Math.floor(b.h * cfg.titleStripFraction));
    let titleChanged = false;
    let artChanged = false;
    for (let c = 0; c < b.cells.length; c++) {
      if (!cellDelta(a.cells, b.cells, c)) continue;
      if (c < titleRows * b.w) titleChanged = true;
      else artChanged = true;
    }
    if (titleChanged && !artChanged) out.desyncFrames++;
  }

  // flicker: cell changes at frame i and reverts to within-tolerance of the
  // frame-(i-1) value at frame i+1 or i+2.
  const flicker = new Set<number>();
  for (let i = 1; i < decoded.length; i++) {
    const prev = decoded[i - 1];
    const cur = decoded[i];
    if (prev.w !== cur.w || prev.h !== cur.h) continue;
    for (let c = 0; c < cur.cells.length; c++) {
      if (!cellDelta(prev.cells, cur.cells, c)) continue;
      for (const k of [1, 2]) {
        const nxt = decoded[i + k];
        if (nxt && nxt.w === cur.w && nxt.h === cur.h && !cellDelta(prev.cells, nxt.cells, c)) {
          flicker.add(c);
          break;
        }
      }
    }
  }
  if (flicker.size > 0) {
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -1,
      y1 = -1;
    for (const c of flicker) {
      const cx = c % decoded[0].w;
      const cy = Math.floor(c / decoded[0].w);
      x0 = Math.min(x0, cx);
      y0 = Math.min(y0, cy);
      x1 = Math.max(x1, cx);
      y1 = Math.max(y1, cy);
    }
    out.flickerCells = flicker.size;
    out.flickerBounds = [x0 * cfg.gridSize, y0 * cfg.gridSize, (x1 + 1) * cfg.gridSize, (y1 + 1) * cfg.gridSize];
  }

  return out;
}

const sig = (parts: (string | number)[]) =>
  createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16);

/** Turns a pixel analysis into findings for the repeat gate. */
export function evaluateTemporalPixel(
  analysis: PixelAnalysis,
  cfg: SentinelConfig,
  stateNode: string,
  perturbation: AuditPerturbation,
): OracleFinding[] {
  const t = cfg.temporalPixel;
  const findings: OracleFinding[] = [];

  if (analysis.blackRunMs > t.blackFrameThresholdMs) {
    findings.push({
      oracle_id: 'temporal-pixel:black-frame',
      signature: `black-frame|${Math.round(analysis.blackRunMs / 50) * 50}ms`,
      signature_family: 'black-frame',
      title: `Dark screen for ${Math.round(analysis.blackRunMs)}ms during ${stateNode}`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { blackRunMs: analysis.blackRunMs, blackRunFrames: analysis.blackRunFrames },
    });
  }
  if (analysis.desyncFrames > 0) {
    findings.push({
      oracle_id: 'temporal-pixel:title-art-desync',
      signature: `px-desync|${analysis.desyncFrames}`,
      signature_family: 'title-art-desync',
      title: `Title strip repainted ${analysis.desyncFrames} frames before artwork`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { desyncFrames: analysis.desyncFrames },
    });
  }
  if (analysis.flickerCells >= 4 && analysis.flickerBounds) {
    findings.push({
      oracle_id: 'temporal-pixel:flicker',
      signature: `flicker|${analysis.flickerBounds.join(',')}`,
      signature_family: 'flicker',
      title: `Transient repaint of ${analysis.flickerCells} cells at ${analysis.flickerBounds.join(',')}`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { flickerCells: analysis.flickerCells, bounds: analysis.flickerBounds },
    });
  }
  return findings;
}
