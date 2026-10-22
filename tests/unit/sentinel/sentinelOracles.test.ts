/**
 * T-002 unit tests — pure oracle evaluation functions + repeat gate
 * (no browser: synthetic samples and generated PNG frames).
 */
import { describe, it, expect } from 'vitest';
import { PNG } from 'pngjs';
import { DEFAULT_SENTINEL_CONFIG } from '../../../scripts/sentinel/sentinelConfig';
import { evaluateTemporalPerf, type TemporalPerfSamples } from '../../../scripts/sentinel/oracles/temporalPerf';
import { analyzeFrames, evaluateTemporalPixel } from '../../../scripts/sentinel/oracles/temporalPixel';
import { evaluateText } from '../../../scripts/sentinel/oracles/domainTextOracle';
import { evaluateRuntimeDiagnostics } from '../../../scripts/sentinel/oracles/runtimeOracle';
import { applyRepeatGate, type OracleFinding } from '../../../scripts/sentinel/oracles/index';

const CFG = DEFAULT_SENTINEL_CONFIG;

function frames(n: number, partial: Partial<TemporalPerfSamples['frames'][number]> = {}) {
  return Array.from({ length: n }, (_, i) => ({
    t: i * 16.7,
    deltaMs: 16.7,
    runningAnimations: 0,
    astroIdle: null,
    heading: null,
    activeImg: null,
    ...partial,
  }));
}

/** Builds a solid-colour PNG of `w×h`; `titleLum` tints the top strip. */
function pngOf(w: number, h: number, lum: number, titleLum?: number): Buffer {
  const png = new PNG({ width: w, height: h });
  const strip = Math.floor(h * 0.18);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const v = titleLum !== undefined && y < strip ? titleLum : lum;
      png.data[i] = png.data[i + 1] = png.data[i + 2] = v;
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

describe('evaluateTemporalPerf', () => {
  const evalPerf = (s: TemporalPerfSamples) =>
    evaluateTemporalPerf(s, CFG, 'S10_QuestSkillCheckArmed', 'baseline');

  it('flags ≥3 long tasks over threshold', () => {
    const out = evalPerf({
      frames: frames(10),
      longTasks: [
        { startTime: 0, duration: 150 },
        { startTime: 100, duration: 200 },
        { startTime: 200, duration: 180 },
      ],
      drags: [],
    });
    expect(out.some((f) => f.oracle_id === 'temporal-perf:longtask')).toBe(true);
  });

  it('does not flag <3 long tasks', () => {
    const out = evalPerf({
      frames: frames(10),
      longTasks: [{ startTime: 0, duration: 500 }],
      drags: [],
    });
    expect(out.some((f) => f.oracle_id === 'temporal-perf:longtask')).toBe(false);
  });

  it('flags p95 frame over budget', () => {
    const f = frames(40);
    f[20]!.deltaMs = 80;
    f[21]!.deltaMs = 90;
    const out = evalPerf({ frames: f, longTasks: [], drags: [] });
    expect(out.some((f) => f.oracle_id === 'temporal-perf:frame-p95')).toBe(true);
  });

  it('flags T-A3 title/art desync (heading commits before artwork)', () => {
    const f = frames(10);
    f[5]!.heading = 'Node B'; f[5]!.activeImg = 'img-A';
    f[6]!.heading = 'Node B'; f[6]!.activeImg = 'img-A';
    f[7]!.heading = 'Node B'; f[7]!.activeImg = 'img-B';
    // frames before 5 keep heading A + img-A implicitly null→ fill
    for (let i = 0; i < 5; i++) { f[i]!.heading = 'Node A'; f[i]!.activeImg = 'img-A'; }
    const out = evalPerf({ frames: f, longTasks: [], drags: [] });
    expect(out.some((o) => o.oracle_id === 'temporal-perf:title-art-desync')).toBe(true);
  });

  it('flags animations running while parked (BV-04)', () => {
    const f = frames(10).map((x, i) => (i >= 3 ? { ...x, astroIdle: 'parked', runningAnimations: 2 } : x));
    const out = evalPerf({ frames: f, longTasks: [], drags: [] });
    expect(out.some((o) => o.oracle_id === 'temporal-perf:parked-animation')).toBe(true);
  });

  it('flags post-release snap-back (T-A6)', () => {
    const out = evalPerf({
      frames: frames(10),
      longTasks: [],
      drags: [
        {
          id: 'medal-res1',
          preDrag: [100, 100, 40, 40],
          rects: [
            [500, 300, 40, 40],
            [480, 280, 40, 40],
          ],
        },
      ],
    });
    expect(out.some((o) => o.oracle_id === 'temporal-perf:drag-ghost')).toBe(true);
  });
});

describe('analyzeFrames + evaluateTemporalPixel', () => {
  const mk = (t: number, png: Buffer) => ({ t, png });
  const DARK = pngOf(160, 90, 5);
  const LIT = pngOf(160, 90, 200);

  it('detects a black frame run over 300ms (T-A4)', () => {
    const frames = [mk(0, LIT), mk(33, DARK), mk(66, DARK), mk(99, DARK), mk(132, DARK), mk(165, DARK), mk(198, DARK), mk(231, DARK), mk(264, DARK), mk(297, DARK), mk(330, DARK), mk(363, LIT)];
    const a = analyzeFrames(frames, CFG.temporalPixel);
    expect(a.blackRunMs).toBeGreaterThan(300);
    const out = evaluateTemporalPixel(a, CFG, 'S8_QuestStageNarrative', 'replay');
    expect(out.some((f) => f.oracle_id === 'temporal-pixel:black-frame')).toBe(true);
  });

  it('does not flag a single dark frame', () => {
    const frames = [mk(0, LIT), mk(33, DARK), mk(66, LIT)];
    const a = analyzeFrames(frames, CFG.temporalPixel);
    expect(a.blackRunMs).toBeLessThanOrEqual(300);
    const out = evaluateTemporalPixel(a, CFG, 'S1_WorldMapIdle', 'replay');
    expect(out.some((f) => f.oracle_id === 'temporal-pixel:black-frame')).toBe(false);
  });

  it('detects title-strip desync (title repaints, artwork waits)', () => {
    const a = pngOf(160, 90, 200, 200);
    const b = pngOf(160, 90, 200, 60); // title strip changed, body same
    const c = pngOf(160, 90, 40, 60); // body catches up
    const frames = [mk(0, a), mk(33, b), mk(66, b), mk(99, c)];
    const res = analyzeFrames(frames, CFG.temporalPixel);
    expect(res.desyncFrames).toBeGreaterThan(0);
  });

  it('detects a flicker region (change → revert within 2 frames)', () => {
    const base = pngOf(160, 90, 200);
    const flick = new PNG({ width: 160, height: 90 });
    base.copy(flick.data);
    // paint a 4x4-cell dark block mid-frame for one frame
    for (let y = 40; y < 56; y++) for (let x = 40; x < 56; x++) {
      const i = (y * 160 + x) * 4;
      flick.data[i] = flick.data[i + 1] = flick.data[i + 2] = 0;
    }
    const frames = [mk(0, base), mk(33, PNG.sync.write(flick)), mk(66, base)];
    const res = analyzeFrames(frames, CFG.temporalPixel);
    expect(res.flickerCells).toBeGreaterThanOrEqual(4);
  });
});

describe('evaluateText', () => {
  const eval_ = (texts: { text: string; target: string }[], locale = 'it-IT') =>
    evaluateText(texts, { locale, allowlist: ['Goblin', 'HP'] }, 'S13_QuestRewardPopup', 'LOCALE_SWEEP');

  it('flags slot-token / pp / TICKS / NaN / undefined leaks', () => {
    const out = eval_([
      { text: 'slot-token:chest opened', target: '[data-testid="quest-reward-popup"]' },
      { text: '+15pp drop', target: '[data-testid="x"]' },
      { text: '120 TICKS remaining', target: '[data-testid="y"]' },
      { text: 'Gold: NaN', target: '[data-testid="z"]' },
    ]);
    expect(out.map((f) => f.oracle_id)).toEqual(
      expect.arrayContaining([
        'domain-text:slot-token',
        'domain-text:pp-unit',
        'domain-text:ticks',
        'domain-text:nan',
      ]),
    );
  });

  it('flags N/M counters where N > M', () => {
    const out = eval_([{ text: 'HP 12/10', target: '[data-testid="hp"]' }]);
    expect(out.some((f) => f.oracle_id === 'domain-text:over-capacity')).toBe(true);
  });

  it('flags untranslated English in it-IT as observation', () => {
    const out = eval_([{ text: 'Click here to send your party', target: '[data-testid="send"]' }]);
    const f = out.find((o) => o.oracle_id === 'domain-text:untranslated');
    expect(f).toBeDefined();
    expect(f!.severity).toBe('observation');
  });

  it('skips the English heuristic outside it-IT', () => {
    const out = eval_([{ text: 'Click here to send your party', target: 'x' }], 'en');
    expect(out.some((f) => f.oracle_id === 'domain-text:untranslated')).toBe(false);
  });

  it('respects the allowlist', () => {
    const out = eval_([{ text: 'Goblin HP', target: 'x' }], 'it-IT');
    expect(out).toHaveLength(0);
  });
});

describe('evaluateRuntimeDiagnostics', () => {
  it('flags console errors, pageerrors and network failures', () => {
    const out = evaluateRuntimeDiagnostics(
      ['Maximum update depth exceeded', 'ResizeObserver loop'],
      ['404 http://x/y.png'],
      'S1_WorldMapIdle',
      'baseline',
    );
    expect(out.map((f) => f.oracle_id)).toEqual(
      expect.arrayContaining(['runtime:react-update-depth', 'runtime:console-error', 'runtime:network-failure']),
    );
  });
});

describe('applyRepeatGate', () => {
  const mk = (signature: string, family: string | undefined, oracle = 'temporal-perf:x'): OracleFinding => ({
    oracle_id: oracle,
    signature,
    signature_family: family,
    title: signature,
    severity: 'defect',
    state_node: 'S10',
    perturbation_kind: 'baseline',
    evidence: {},
  });
  const gate = DEFAULT_SENTINEL_CONFIG.repeatGate;

  it('confirms a temporal signature seen ≥3 of 5 runs', () => {
    const sig = mk('sig-A', 'black-frame');
    const out = applyRepeatGate([[sig], [sig], [sig], [], []], gate);
    expect(out[0].gate).toBe('confirmed');
  });

  it('marks temporal signatures below 3-of-5 as flaky', () => {
    const sig = mk('sig-A', 'black-frame');
    const out = applyRepeatGate([[sig], [sig], [], [], []], gate);
    expect(out[0].gate).toBe('flaky');
  });

  it('confirms structural findings only when in every run', () => {
    const sig = mk('L1|x|y', undefined, 'geometry:L1-collision');
    expect(applyRepeatGate([[sig], [sig]], gate)[0].gate).toBe('confirmed');
    expect(applyRepeatGate([[sig], []], gate)[0].gate).toBe('rejected');
  });

  it('r004: divergent same-family signatures → divergent-observation, never confirmed', () => {
    const a = mk('sig-A', 'black-frame');
    const b = mk('sig-B', 'black-frame');
    // sig-A alone meets 3/5 — but family divergence still blocks ingest.
    const out = applyRepeatGate([[a], [a], [a], [b], [b]], gate);
    expect(out.find((f) => f.signature === 'sig-A')!.gate).toBe('divergent-observation');
    expect(out.find((f) => f.signature === 'sig-A')!.observedSignatures).toContain('sig-B');
  });

  it('never promotes observation-severity findings', () => {
    const obs = { ...mk('untranslated|x', 'untranslated', 'domain-text:untranslated'), severity: 'observation' as const };
    const out = applyRepeatGate([[obs], [obs], [obs], [obs], [obs]], gate);
    expect(out[0].gate).toBe('divergent-observation');
  });
});
