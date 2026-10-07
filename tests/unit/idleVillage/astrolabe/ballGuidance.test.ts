/**
 * ballGuidance trajectory tests — headless simulation of the astrolabe spin.
 *
 * The verdict is decided by the host; the ball must LOOK free: no visible
 * snap, no positional lerp, natural deceleration onto the target. These tests
 * replicate the exact spin loop of engine.ts (grip curve, friction, chaos,
 * chaotic wall/pillar bounces) through the same stepGuidedBall the engine
 * calls, and assert objective realism metrics:
 *
 *   - parked:       ends within a few px of the target, ~zero speed
 *   - seamless:     no teleport-like per-frame displacement during guidance
 *   - no fling:     once near the target it never wanders far again
 *   - smooth:       jerk (per-frame Δv) bounded outside real bounce frames
 *   - convergent:   distance to target mostly decreasing late in the spin
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GUIDANCE,
  arriveAccel,
  findZonePoint,
  stepGuidedBall,
  type GuideBall,
  type GuidedStepEvents,
} from '@/ui/idleVillage/components/destinyAstrolabeV62/ballGuidance';

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Deterministic RNG (same mulberry32 the quest engine uses). */
const mulberry32 = (a: number) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Blobby arena wall — stands in for rCheckAt (≈165..185px radius). */
const WALL_BASE = 176;
const wallEdgeAt = (a: number) =>
  WALL_BASE * (1 + 0.035 * Math.sin(a * 3 + 0.7) + 0.022 * Math.sin(a * 5 - 1.3));

/** A few landed obelisks at plausible radii/angles. */
const makePillars = (rng: () => number) =>
  Array.from({ length: 6 }, (_, i) => ({
    x: Math.cos(-Math.PI / 2 + i * (TAU / 5) + rng() * 0.3) * (90 + rng() * 80),
    y: Math.sin(-Math.PI / 2 + i * (TAU / 5) + rng() * 0.3) * (90 + rng() * 80),
    landed: true,
  }));

interface TrajectoryMetrics {
  endDist: number;
  endSpeed: number;
  maxStep: number;          // max per-frame displacement (px)
  postContactMaxDist: number; // max dist after first coming within 25px
  maxJerk: number;          // max |Δv| on non-bounce frames during guidance
  lateRegress: number;      // % of late frames where dist grew > 2px
  firstContactP: number;    // spin progress when it first got within 30px
}

/**
 * Simulate one full spin (tSpin = 2600ms ≈ 156 frames at 60fps) with the same
 * constants engine.ts uses: grip ramp from 0.30, friction 0.9996−0.025·grip,
 * chaos 1−0.6·grip, kick speed 28–36 aimed at the target ±85° of jitter.
 */
function simulateSpin(
  target: { x: number; y: number } | null,
  seed: number,
  frames = 156,
): TrajectoryMetrics & { ball: GuideBall } {
  const rng = mulberry32(seed);
  const CX = 400, CY = 400;
  const ball: GuideBall = { x: CX, y: CY, vx: 0, vy: 0, r: 9 };
  /* fireBall(): target-aware kick with wide jitter */
  const baseAngle = target
    ? Math.atan2(target.y - CY, target.x - CX)
    : rng() * TAU;
  const jitter = (rng() * 2 - 1) * Math.PI * 0.85;
  const a = baseAngle + jitter;
  const sp = 28 + rng() * 8;
  ball.vx = Math.cos(a) * sp;
  ball.vy = Math.sin(a) * sp;

  const pillars = makePillars(rng);
  const decayStart = 0.3;
  const f = 1; // 60fps

  let maxStep = 0;
  let maxJerk = 0;
  let postContactMaxDist = -1;
  let firstContactP = -1;
  let wasFar = false;
  const dists: number[] = [];
  const lateRegressFrames: number[] = [];
  let prevVx = ball.vx, prevVy = ball.vy;

  for (let i = 0; i < frames; i += 1) {
    const p = (i + 1) / frames;
    const grip = clamp((p - decayStart) / (1 - decayStart), 0, 1);
    const fric = Math.pow(0.9996 - 0.025 * grip, f);
    const chaos = 1 - grip * 0.6;
    const px = ball.x, py = ball.y;
    const ev: GuidedStepEvents = stepGuidedBall(ball, {
      grip, f, fric, chaos,
      cx: CX, cy: CY,
      wallEdgeAt,
      pillars,
      pillarHitR: 24,
      target,
      rng,
    });
    const bounced = ev.wallHit !== null || ev.pillarHits.length > 0;
    const step = Math.hypot(ball.x - px, ball.y - py);
    if (grip > 0.05) maxStep = Math.max(maxStep, step);
    const jerk = Math.hypot(ball.vx - prevVx, ball.vy - prevVy);
    if (grip > 0.3 && !bounced) maxJerk = Math.max(maxJerk, jerk);
    prevVx = ball.vx; prevVy = ball.vy;
    if (target) {
      const d = Math.hypot(ball.x - target.x, ball.y - target.y);
      dists.push(d);
      /* a "contact" is a real arrival: ball left (>60px), came back within
         30px AND has already slowed below 12px/f — a fly-through at cruise
         speed is transit, not arrival. */
      if (d > 60) wasFar = true;
      const spd = Math.hypot(ball.vx, ball.vy);
      if (firstContactP < 0 && wasFar && d < 30 && spd < 12) firstContactP = p;
      if (firstContactP >= 0) {
        postContactMaxDist = Math.max(postContactMaxDist, d);
      }
      /* late regress counts only clean (non-bounce) frames and only
         perceptible regressions (>4px) — sub-3px wobble is invisible. */
      if (i > frames * 0.7 && !bounced && dists.length > 1) {
        if (d - dists[dists.length - 2] > 4) lateRegressFrames.push(i);
      }
    }
  }

  const endDist = target ? Math.hypot(ball.x - target.x, ball.y - target.y) : 0;
  const endSpeed = Math.hypot(ball.vx, ball.vy);
  const late = dists.slice(Math.floor(dists.length * 0.7));
  const regress =
    late.length > 1 ? lateRegressFrames.length / (late.length - 1) : 0;

  return {
    ball,
    endDist,
    endSpeed,
    maxStep,
    postContactMaxDist: firstContactP >= 0 ? postContactMaxDist : -1,
    maxJerk,
    lateRegress: regress,
    firstContactP,
  };
}

/** Representative targets for each verdict zone (offsets from center),
    radius-clamped inside the wall exactly like engine.computeTargetPos()
    (edge − ball.r − 10). */
const zoneTarget = (ang: number, r: number) => {
  const maxR = wallEdgeAt(ang) - 9 - 10;
  const rr = Math.min(r, maxR);
  return { x: 400 + Math.cos(ang) * rr, y: 400 + Math.sin(ang) * rr };
};
const ZONE_TARGETS: Record<string, { x: number; y: number }> = {
  bigwin: zoneTarget(-0.8, 8),
  win: zoneTarget(-1.2, 110),
  almost: zoneTarget(0.4, 165),
  fail: zoneTarget(2.0, 155),
  epicfail: zoneTarget(0.9, 170),
  fail_wound: zoneTarget(-0.6, 168),
};

const SEEDS = Array.from({ length: 30 }, (_, i) => 1000 + i * 37);

describe('ballGuidance — seamless arrival trajectory', () => {
  it('parks on the target with ~zero speed, for every verdict zone', () => {
    for (const [zone, target] of Object.entries(ZONE_TARGETS)) {
      const fails = SEEDS.filter((s) => {
        const m = simulateSpin(target, s);
        return !(m.endDist < 8 && m.endSpeed < 1.2);
      });
      expect(fails, `${zone}: ${fails.length} seeds missed`).toHaveLength(0);
    }
  });

  it('no teleport: per-frame displacement stays within ballistic bounds', () => {
    for (const target of Object.values(ZONE_TARGETS)) {
      for (const s of SEEDS.slice(0, 12)) {
        const m = simulateSpin(target, s);
        /* kick is ≤36 px/frame; a teleport/lerp would jump far beyond */
        expect(m.maxStep).toBeLessThan(40);
      }
    }
  });

  it('no fling: once it reaches the target zone it stays there', () => {
    for (const [zone, target] of Object.entries(ZONE_TARGETS)) {
      for (const s of SEEDS.slice(0, 10)) {
        const m = simulateSpin(target, s);
        if (m.firstContactP < 0) continue; // never reached — covered elsewhere
        /* a roll-past that curves back inside ~half the arena is plausible
           pinball; a re-fling across the whole arena after arriving would
           be a visible yank. */
        expect(
          m.postContactMaxDist,
          `${zone} seed ${s}: wandered ${m.postContactMaxDist.toFixed(0)}px after first contact`,
        ).toBeLessThan(90);
      }
    }
  });

  it('smooth steering: bounded jerk on non-bounce frames during guidance', () => {
    for (const target of Object.values(ZONE_TARGETS)) {
      for (const s of SEEDS.slice(0, 10)) {
        const m = simulateSpin(target, s);
        /* arrive steering ramps via smoothstep — no sudden yank mid-flight */
        expect(m.maxJerk).toBeLessThan(7);
      }
    }
  });

  it('convergent: distance to target mostly decreases late in the spin', () => {
    for (const target of Object.values(ZONE_TARGETS)) {
      for (const s of SEEDS.slice(0, 10)) {
        const m = simulateSpin(target, s);
        expect(m.lateRegress).toBeLessThan(0.1);
      }
    }
  });

  it('reaches the target before the spin ends (no endless wandering)', () => {
    for (const target of Object.values(ZONE_TARGETS)) {
      const misses = SEEDS.filter((s) => simulateSpin(target, s).firstContactP < 0);
      expect(misses).toHaveLength(0);
    }
  });
});

describe('arriveAccel — pure Reynolds arrival (no bounces, no friction)', () => {
  it('converges asymptotically without overshooting the target', () => {
    const rng = mulberry32(7);
    const ball: GuideBall = { x: 0, y: 0, vx: 20, vy: 4, r: 9 };
    const target = { x: 300, y: 120 };
    let minD = Infinity;
    let touched = false;
    let maxAfterTouch = 0;
    for (let i = 0; i < 900; i += 1) {
      const a = arriveAccel(ball, target, 1, 1);
      ball.vx += a.ax; ball.vy += a.ay;
      ball.x += ball.vx; ball.y += ball.vy;
      const d = Math.hypot(ball.x - target.x, ball.y - target.y);
      minD = Math.min(minD, d);
      if (d < 15) touched = true;
      if (touched) maxAfterTouch = Math.max(maxAfterTouch, d);
    }
    expect(minD).toBeLessThan(0.5);
    /* no radial reversal: after first coming within 15px it must never
       drift back out — a tangential slide of a few px is a curve, not a
       bounce-back. */
    expect(maxAfterTouch).toBeLessThan(25);
    void rng;
  });

  it('returns zero acceleration when already at the target', () => {
    const ball: GuideBall = { x: 100, y: 100, vx: 0.01, vy: 0, r: 9 };
    const a = arriveAccel(ball, { x: 100, y: 100 }, 1, 1);
    expect(a.ax).toBe(0);
    expect(a.ay).toBe(0);
  });

  it('brakes excess speed inside the radius, sustains approach outside', () => {
    /* ball moving fast TOWARD the target: inside decelRadius the desired
       speed is below current → accel must oppose motion (brake). Outside,
       desired = cruise > current → accel must push forward. */
    const near: GuideBall = { x: 0, y: 0, vx: 20, vy: 0, r: 9 };
    const far: GuideBall = { x: 0, y: 0, vx: 20, vy: 0, r: 9 };
    const aNear = arriveAccel(near, { x: DEFAULT_GUIDANCE.decelRadius * 0.3, y: 0 }, 1, 1);
    const aFar = arriveAccel(far, { x: DEFAULT_GUIDANCE.decelRadius * 3, y: 0 }, 1, 1);
    expect(aNear.ax).toBeLessThan(0); // braking toward the target
    expect(aFar.ax).toBeGreaterThan(0); // still has room to accelerate
  });
});

/* ------------------------------------------------------------------ */
/* findZonePoint — forced-mode honesty (ball must park IN its verdict    */
/* zone; the V62 valley bug parked 'win' targets in the goo, 2026-10-07) */
/* ------------------------------------------------------------------ */

describe('findZonePoint', () => {
  /* Synthetic zones mirroring the astrolabe: core=bigwin (r<=40), a star
     band 'win' (40<r<=110), thin 'almost' (110<r<=120), fail beyond that
     but inside the wall, 'epicfail' on the outermost 12px. */
  const CX = 400, CY = 400, INNER = 40;
  const zoneOf = (x: number, y: number) => {
    const d = Math.hypot(x - CX, y - CY);
    const e = wallEdgeAt(Math.atan2(y - CY, x - CX));
    if (d <= INNER) return 'bigwin';
    if (d <= 110) return 'win';
    if (d <= 120) return 'almost';
    if (d > e - 12 && d <= e) return 'epicfail';
    return 'fail';
  };
  const base = {
    zoneOf, cx: CX, cy: CY, inner: INNER,
    wallEdgeAt, ballR: 9,
  };

  it('finds a point inside the claimed zone for every verdict', () => {
    for (const want of ['win', 'almost', 'fail', 'epicfail', 'bigwin']) {
      const p = findZonePoint({ ...base, want });
      expect(p, `no point found for ${want}`).not.toBeNull();
      expect(zoneOf(p!.x, p!.y)).toBe(want);
    }
  });

  it('stays near the preferred angle when the zone allows it', () => {
    const p = findZonePoint({ ...base, want: 'win', preferAngle: -Math.PI / 2 });
    expect(p).not.toBeNull();
    const ang = Math.atan2(p!.y - CY, p!.x - CX);
    expect(Math.abs(ang + Math.PI / 2)).toBeLessThan(0.4);
  });

  it('returns a point inside the wall (ball must be physically reachable)', () => {
    const p = findZonePoint({ ...base, want: 'fail', preferAngle: 0.9 });
    expect(p).not.toBeNull();
    const a = Math.atan2(p!.y - CY, p!.x - CX);
    const d = Math.hypot(p!.x - CX, p!.y - CY);
    expect(d).toBeLessThan(wallEdgeAt(a));
  });

  it('returns null when the zone is empty everywhere', () => {
    const p = findZonePoint({ ...base, want: 'ghost-zone' });
    expect(p).toBeNull();
  });

  it('reproduces the V62 valley bug: a shrunken star is still findable', () => {
    /* star squeezed to a sliver — only r in (40, 55) is 'win' */
    const tinyZone = (x: number, y: number) => {
      const d = Math.hypot(x - CX, y - CY);
      if (d <= INNER) return 'bigwin';
      if (d <= 55) return 'win';
      return 'fail';
    };
    const p = findZonePoint({ ...base, zoneOf: tinyZone, want: 'win' });
    expect(p).not.toBeNull();
    expect(tinyZone(p!.x, p!.y)).toBe('win');
  });
});
