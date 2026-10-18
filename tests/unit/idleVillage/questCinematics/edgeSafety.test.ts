/**
 * Edge-safety certification tests (PLAN-046 §5, artifact-r011).
 *
 * The proof is analytic — endpoint evaluation on the convex composite —
 * and runs here at test time against EVERY resolved shot in the shipped
 * config, at BOTH viewAspect-range endpoints and BOTH manifest scenes.
 * A failure reports the derived required zoom, not just a boolean.
 */

import { describe, expect, it } from 'vitest';
import { DEFAULT_QUEST_THEATRE_FX, type CameraShot } from '@/balancing/config/idleVillage/quests/questTheatreFx';
import { EASINGS } from '@/balancing/config/idleVillage/quests/questCameraEasings';
import {
  cameraAt,
  certifyDomEdge,
  certifyShaderEdge,
  certifyShot,
  coverFit,
  domTransform,
  halfExtent,
  maxDisp,
  progressRange,
  shaderUniforms,
  THEATER_ANCHOR,
  windowCenter,
} from '@/ui/idleVillage/questS1Lab/render/depthTransform';
import { DEPTH_FRAG } from '@/ui/idleVillage/questS1Lab/render/depthShader';
import { SCENE_CINEMATICS } from '@/ui/idleVillage/questS1Lab/render/sceneManifest';

const FX = DEFAULT_QUEST_THEATRE_FX;
const CFG = { ...FX.depth, enabled: true };

/** All resolved shots the runtime can reach: every preset + idleDrift. */
const ALL_SHOTS: Record<string, CameraShot> = { idle: FX.camera.idleDrift, ...FX.camera.shots };

describe('cover-fit geometry', () => {
  it('wider image crops x only', () => {
    const f = coverFit(3.0, 2.4);
    expect(f.extent[1]).toBe(1);
    expect(f.extent[0]).toBeCloseTo(1.25);
    expect(f.crop[1]).toBe(0);
    expect(f.crop[0]).toBeCloseTo(0.1);
  });
  it('narrower image crops y only (the shipped scene case)', () => {
    const f = coverFit(2.357, 2.4);
    expect(f.extent[0]).toBe(1);
    expect(f.extent[1]).toBeCloseTo(2.4 / 2.357);
    expect(f.crop[0]).toBe(0);
    expect(f.crop[1]).toBeGreaterThan(0);
  });
  it('anchor 0.5 centers the window; anchor 0.4 shifts it', () => {
    const w1 = windowCenter([0, 0.05], [0.5, 0.5]);
    expect(w1[1]).toBeCloseTo(0.5);
    const w2 = windowCenter([0, 0.05], THEATER_ANCHOR);
    expect(w2[1]).toBeLessThan(0.5);
  });
});

describe('shader edge bound — every shipped shot, both scenes, both aspect endpoints', () => {
  for (const [name, shot] of Object.entries(ALL_SHOTS)) {
    for (const [sceneId, entry] of Object.entries(SCENE_CINEMATICS)) {
      const effShot = { ...shot, ampMul: shot.ampMul * entry.ampMul };
      it(`${name} @ ${sceneId} keeps the sampled window inside [ε, 1−ε]`, () => {
        const r = certifyShot(effShot, CFG, entry.imgAspect, THEATER_ANCHOR);
        expect(r.shader.failures).toEqual([]);
        expect(r.dom.failures).toEqual([]);
        expect(r.shader.minMargin).toBeGreaterThan(0);
        expect(r.dom.minMargin).toBeGreaterThan(0);
      });
    }
  }

  it('rejects a shot that would expose the edge — with derived required zoom', () => {
    const bad: CameraShot = { ...FX.camera.shots['pan-lateral'], zoomFrom: 1, zoomTo: 1, panTo: [0.06, 0] };
    const r = certifyShaderEdge(bad, CFG, 2.357, 2.4, THEATER_ANCHOR);
    expect(r.ok).toBe(false);
    expect(r.failures.join('\n')).toMatch(/needs zoom ≥ \d/);
  });

  it('a pure pan at zoom 1 cannot be safe beyond the crop margin', () => {
    const bad: CameraShot = { ...FX.camera.shots.hold, panTo: [0.06, 0], durMs: 4000 };
    expect(certifyShaderEdge(bad, CFG, 2.357, 2.4, THEATER_ANCHOR).ok).toBe(false);
  });
});

describe('easing bounds — certified constants hold under dense diagnostic sweep', () => {
  for (const [id, e] of Object.entries(EASINGS)) {
    it(`${id}: valueRange + dmax contain the swept truth`, () => {
      let vMin = Infinity;
      let vMax = -Infinity;
      let dMax = 0;
      const N = 4000;
      for (let i = 0; i <= N; i += 1) {
        const t = i / N;
        const v = e.fn(t);
        vMin = Math.min(vMin, v);
        vMax = Math.max(vMax, v);
        if (i > 0) {
          const dv = Math.abs(e.fn(t) - e.fn((i - 1) / N)) * N;
          dMax = Math.max(dMax, dv);
        }
      }
      expect(vMin).toBeGreaterThanOrEqual(e.valueRange[0] - 1e-9);
      expect(vMax).toBeLessThanOrEqual(e.valueRange[1] + 1e-9);
      expect(dMax).toBeLessThanOrEqual(e.dmax * 1.02); // numeric derivative under-estimates near cusps
      // endpoints are inside the reachable range the proof relies on
      expect(e.fn(0)).toBeCloseTo(0, 9);
      expect(e.fn(1)).toBeCloseTo(1, 9);
    });
  }
});

describe('GLSL ↔ JS mirror parity', () => {
  it('the shader reads exactly the uniforms the mirror produces, same formula', () => {
    expect(DEPTH_FRAG).toContain('uniform vec2 uWinCenter');
    expect(DEPTH_FRAG).toContain('uniform vec2 uWinHalf');
    expect(DEPTH_FRAG).toContain('uniform vec2 uCamVec');
    expect(DEPTH_FRAG).toContain('uniform float uAmpEff');
    expect(DEPTH_FRAG).toContain('uniform float uFocal');
    expect(DEPTH_FRAG).toContain('uniform float uEps');
    // the exact composed transform — if either side drifts, this fails
    expect(DEPTH_FRAG).toContain('uWinCenter + (vUV - 0.5) * 2.0 * uWinHalf');
    expect(DEPTH_FRAG).toContain('base + (d - uFocal) * uAmpEff * uCamVec');
  });

  it('sampled window from uniforms matches the mirror math for random states', () => {
    const shot = FX.camera.shots['push-in'];
    const entry = SCENE_CINEMATICS['agguato-foresta'];
    for (const tMs of [0, 401, 800, 1600, 9999]) {
      const s = cameraAt(shot, tMs);
      const u = shaderUniforms(s, CFG, entry.imgAspect, 2.4, THEATER_ANCHOR);
      const fit = coverFit(entry.imgAspect, 2.4);
      const half = halfExtent(fit.crop, s.zoom, CFG.overscan);
      // anchor-pivot center: source(anchor_a) stays at view(anchor_a)
      const wc = [
        THEATER_ANCHOR[0] + (0.5 - THEATER_ANCHOR[0]) * 2 * half[0],
        THEATER_ANCHOR[1] + (0.5 - THEATER_ANCHOR[1]) * 2 * half[1],
      ];
      expect(u.center[0]).toBeCloseTo(wc[0] + s.pan[0], 9);
      expect(u.center[1]).toBeCloseTo(wc[1] + s.pan[1], 9);
      expect(u.half[0]).toBeCloseTo(half[0], 9);
      expect(u.half[1]).toBeCloseTo(half[1], 9);
      // emergency clamp stays inactive: window ± pan ± disp inside bounds
      const disp = maxDisp(s, CFG);
      expect(u.center[0] + u.half[0] + disp[0]).toBeLessThan(1 - CFG.epsilon);
      expect(u.center[0] - u.half[0] - disp[0]).toBeGreaterThan(CFG.epsilon);
    }
  });
});

describe('DOM ↔ shader parity (focal plane)', () => {
  it('the DOM transform samples the identical window', () => {
    const shot = FX.camera.shots['pan-lateral'];
    const entry = SCENE_CINEMATICS['agguato-foresta'];
    for (const tMs of [0, 1500, 3000, 6000]) {
      const s = cameraAt(shot, tMs);
      const d = domTransform(s, CFG, entry.imgAspect, 2.4);
      const u = shaderUniforms(s, CFG, entry.imgAspect, 2.4, THEATER_ANCHOR);
      // DOM scale k = s_base·z must equal the shader's implied zoom 1/((1−o)/z)…
      expect(d.scale).toBeCloseTo(s.zoom / (1 - CFG.overscan), 9);
      // …and the DOM sampled half extent (0.5−c)/k equals the shader's
      const fit = coverFit(entry.imgAspect, 2.4);
      expect((0.5 - fit.crop[0]) / d.scale).toBeCloseTo(u.half[0], 9);
      expect((0.5 - fit.crop[1]) / d.scale).toBeCloseTo(u.half[1], 9);
      // DOM translate −p·E·100 shifts the sampled window by exactly p
      expect(-d.txPct / 100 / fit.extent[0]).toBeCloseTo(s.pan[0], 9);
    }
  });

  it('DOM edge proof holds for every shipped shot', () => {
    for (const [name, shot] of Object.entries(ALL_SHOTS)) {
      const r = certifyDomEdge(shot, CFG, 2.357, 2.4, THEATER_ANCHOR);
      expect(r.failures, name).toEqual([]);
    }
  });
});

describe('depth path vs no-depth parity', () => {
  it('ampEff=0 ⇒ the GPU path samples the plain cover window (same as DOM)', () => {
    const s = cameraAt(FX.camera.idleDrift, 4000);
    const entry = SCENE_CINEMATICS['agguato-foresta'];
    const u = shaderUniforms({ ...s, ampMul: 0 }, CFG, entry.imgAspect, 2.4, THEATER_ANCHOR);
    expect(u.ampEff).toBe(0);
    // at zero amplitude, uv ≡ base — identical sampled window as the DOM path
    expect(u.half[0]).toBeCloseTo(((0.5 - coverFit(entry.imgAspect, 2.4).crop[0]) * (1 - CFG.overscan)) / s.zoom, 9);
  });
});

describe('progress range drives the proof', () => {
  it('backOut overshoot is inside the certified range', () => {
    const shot: CameraShot = { ...FX.camera.shots['push-in'], ease: 'backOut' };
    const [e0, e1] = progressRange(shot);
    expect(e1).toBeGreaterThan(1); // overshoot is proven, not ignored
    expect(e0).toBe(0);
  });
});
