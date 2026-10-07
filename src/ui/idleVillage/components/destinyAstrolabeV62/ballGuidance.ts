/**
 * ballGuidance — pure physics step for the astrolabe ball.
 *
 * Extracted from engine.ts so the trajectory can be simulated headlessly and
 * tested for objective realism. The verdict is decided by the quest engine;
 * the ball's job is to LOOK like it rolls freely and *happens* to stop inside
 * the right zone. The guidance must be seamless: no visible snap, no lerp to
 * a target the player can perceive.
 *
 * Technique — Reynolds "Arrive" steering (GDC'99 steering behaviors):
 *   desired velocity  = direction(target) * maxApproach * min(1, dist/decelRadius)
 *   steering          = (desired − velocity) * dt/timeToTarget, ramped in by `w`
 * The ball decelerates asymptotically and parks itself on the target with
 * ~zero velocity — the same physics as a free roll, just biased. No
 * positional correction is ever applied, so per-frame displacement stays
 * continuous and the trajectory reads as natural.
 */

export interface GuideBall {
  x: number; y: number; vx: number; vy: number; r: number;
}

export interface GuidanceTuning {
  /** grip (spin progress 0..1) at which guidance starts blending in. */
  startGrip: number;
  /** px — below this distance the ball is in "arrival": desired speed scales
      to 0 linearly so the ball brakes to rest exactly on the target. */
  decelRadius: number;
  /** seconds to converge velocity while cruising toward the target —
      gentle, reads as a curve not a yank. */
  timeToTarget: number;
  /** seconds to converge velocity INSIDE decelRadius — stronger braking so
      the ball never overshoots past the target and comes back. */
  arriveTimeToTarget: number;
  /** seconds to converge when the ball is slow AND near the target —
      decisive capture so a nearly-stopped ball can't slide past and
      visibly re-accelerate back (the "magnet" tell). */
  captureTimeToTarget: number;
  /** px/frame — below this speed near the target the capture kicks in. */
  captureSpeed: number;
  /** px/frame — approach cruise speed; also the desired speed at the
      decelRadius boundary, so braking starts with zero jerk. */
  maxApproach: number;
}

export const DEFAULT_GUIDANCE: GuidanceTuning = {
  /* guidance blends in early — by the time anyone can perceive it, the
     trajectory is already committed. */
  startGrip: 0.22,
  /* ~40% of the arena. Outside: the ball cruises and re-aims. Inside:
     desired speed = maxApproach·d/R — continuous at entry (cruise speed),
     decaying to 0 at the target = a natural roll-to-stop. */
  decelRadius: 140,
  /* ~0.25s while cruising — direction bends gradually. */
  timeToTarget: 0.25,
  /* ~0.07s inside the radius — tight tracking of the braking profile so
     the ball can't overshoot through the target. */
  arriveTimeToTarget: 0.07,
  /* ~0.035s when slow-and-near — the ball commits to the pocket instead of
     drifting past it. Only engages below captureSpeed, so a fast
     fly-through still reads ballistic. */
  captureTimeToTarget: 0.035,
  captureSpeed: 12,
  /* cruise ~24px/f: fast enough to look alive, slower than launch (28-36)
     so the re-aim reads as the ball "settling into" its path. */
  maxApproach: 24,
};

export interface GuidedStepOptions {
  /** 0..1 spin progress — drives both the guidance blend and deceleration. */
  grip: number;
  /** frame time factor (dt / 16.7ms). */
  f: number;
  /** per-frame friction multiplier already scaled by f (caller computes). */
  fric: number;
  /** bounce scatter amount — fades as the ball slows. */
  chaos: number;
  cx: number; cy: number;
  /** container edge (radius) at angle — ball is strictly confined inside. */
  wallEdgeAt: (ang: number) => number;
  /** circular obstacles; bounce radius is pillarHitR. */
  pillars: { x: number; y: number; landed: boolean }[];
  /** px — pillar hit distance. */
  pillarHitR: number;
  /** arrival target; null = unguided free physics. */
  target: { x: number; y: number } | null;
  tune?: GuidanceTuning;
  rng?: () => number;
}

export interface GuidedStepEvents {
  wallHit: { x: number; y: number } | null;
  pillarHits: { x: number; y: number; index: number }[];
}

const smoothstep = (t: number, a: number, b: number): number => {
  if (t <= a) return 0;
  if (t >= b) return 1;
  const m = (t - a) / (b - a);
  return m * m * (3 - 2 * m);
};

/**
 * Reynolds Arrive — steering acceleration (px/frame²) that brings the ball
 * to rest on `target`. Returns {ax, ay}; w is the 0..1 blend-in weight so the
 * force ramps up imperceptibly instead of popping in mid-flight.
 */
export function arriveAccel(
  ball: GuideBall,
  target: { x: number; y: number },
  f: number,
  w: number,
  tune: GuidanceTuning = DEFAULT_GUIDANCE,
): { ax: number; ay: number } {
  const dx = target.x - ball.x;
  const dy = target.y - ball.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.5 || w <= 0) return { ax: 0, ay: 0 };
  const desiredSpeed = tune.maxApproach * Math.min(1, dist / tune.decelRadius);
  const dvx = (dx / dist) * desiredSpeed - ball.vx;
  const dvy = (dy / dist) * desiredSpeed - ball.vy;
  /* two-regime steering: gentle curve while cruising, tight tracking inside
     the deceleration radius. Desired speed is continuous at the boundary
     (both are maxApproach) so the regime switch produces no jerk.
     Inside the radius, a SLOW ball gets captured harder (tTT shrinks as
     speed drops) — it can't nearly stop, drift past, then re-accelerate
     back, which is the only visibly "forced" pattern left. */
  const dtSec = (f * 16.7) / 1000;
  const spd = Math.hypot(ball.vx, ball.vy);
  const slow = Math.max(0, Math.min(1, 1 - spd / tune.captureSpeed));
  const tTT =
    dist <= tune.decelRadius
      ? tune.arriveTimeToTarget + (tune.captureTimeToTarget - tune.arriveTimeToTarget) * slow
      : tune.timeToTarget;
  const k = Math.min(1, dtSec / tTT) * w;
  return { ax: dvx * k, ay: dvy * k };
}

/**
 * One physics step: friction → arrive steering → integrate → chaotic wall /
 * pillar bounces. Identical dynamics to the legacy engine step minus visual
 * side-effects (trail/sparks), which the caller renders from the returned
 * events. The only behavioral change vs the old soft magnet is that guidance
 * is a velocity-matching steer — the ball slows onto the target instead of
 * being dragged toward it.
 */
export function stepGuidedBall(ball: GuideBall, o: GuidedStepOptions): GuidedStepEvents {
  const rng = o.rng ?? Math.random;
  const b = ball;
  const events: GuidedStepEvents = { wallHit: null, pillarHits: [] };

  /* cinematic deceleration */
  b.vx *= o.fric;
  b.vy *= o.fric;

  /* seamless guidance — blends in by smoothstep over the spin progress */
  if (o.target) {
    const tune = o.tune ?? DEFAULT_GUIDANCE;
    const w = smoothstep(o.grip, tune.startGrip, 1);
    const a = arriveAccel(b, o.target, o.f, w, tune);
    b.vx += a.ax;
    b.vy += a.ay;
  }

  b.x += b.vx * o.f;
  b.y += b.vy * o.f;

  /* NON-SPECULAR bounce — reflect + random scatter so no clean mirror paths */
  const chaoticBounce = (nx: number, ny: number, extra: boolean): boolean => {
    const dot = b.vx * nx + b.vy * ny;
    if (extra && dot >= 0) return false;
    b.vx -= 2 * dot * nx;
    b.vy -= 2 * dot * ny;
    const ang = (rng() * 2 - 1) * 0.55 * o.chaos;
    const cs = Math.cos(ang), sn = Math.sin(ang);
    const rvx = b.vx * cs - b.vy * sn, rvy = b.vx * sn + b.vy * cs;
    b.vx = rvx; b.vy = rvy;
    const tx = -ny, ty = nx;
    const spin = (rng() * 2 - 1) * 2.6 * o.chaos;
    b.vx += tx * spin; b.vy += ty * spin;
    const rest = 0.92 + rng() * 0.08;
    b.vx *= rest; b.vy *= rest;
    const od = b.vx * nx + b.vy * ny;
    if (od > 0) { b.vx -= 2 * od * nx; b.vy -= 2 * od * ny; }
    return true;
  };

  /* challenge-surface bounce — strictly confined inside the arena wall */
  const d = Math.hypot(b.x - o.cx, b.y - o.cy);
  const aB = Math.atan2(b.y - o.cy, b.x - o.cx);
  const edge = o.wallEdgeAt(aB) - b.r;
  if (d > edge) {
    const nx = (b.x - o.cx) / d, ny = (b.y - o.cy) / d;
    chaoticBounce(nx, ny, false);
    b.x = o.cx + nx * edge;
    b.y = o.cy + ny * edge;
    events.wallHit = { x: b.x, y: b.y };
  }

  /* pillar bounce (skipped when ball is nearly stopped, as in the engine) */
  if (o.grip < 0.9) {
    for (let i = 0; i < o.pillars.length; i += 1) {
      const pl = o.pillars[i];
      if (!pl.landed) continue;
      const dx = b.x - pl.x, dy = b.y - pl.y;
      const dd = Math.hypot(dx, dy);
      if (dd < o.pillarHitR) {
        const nx = dx / (dd || 1), ny = dy / (dd || 1);
        if (chaoticBounce(nx, ny, true) !== false) {
          b.x = pl.x + nx * o.pillarHitR;
          b.y = pl.y + ny * o.pillarHitR;
          events.pillarHits.push({ x: b.x, y: b.y, index: i });
        }
      }
    }
  }

  return events;
}

/* ------------------------------------------------------------------ */
/* Forced-verdict landing spots                                        */
/* ------------------------------------------------------------------ */

export interface ZonePointOptions {
  /** zone id the parked point must claim — the forced verdict ('win',
   *  'fail_wound', …) exactly as `zoneOf` reports it. */
  want: string;
  /** zone classifier at canvas point — the engine's spatialVerdict. */
  zoneOf: (x: number, y: number) => string;
  cx: number;
  cy: number;
  /** inner radius bound (core edge) — bigwin targets live inside it. */
  inner: number;
  /** container wall radius at angle — candidate points must stay inside. */
  wallEdgeAt: (ang: number) => number;
  /** preferred angle — the scan starts here and spirals outward, so the
   *  returned point stays visually near the authored composition. */
  preferAngle?: number;
  /** ball radius — kept inside the wall with margin. */
  ballR?: number;
}

/**
 * Scan the arena for a point whose `zoneOf` matches the forced verdict.
 * Forced-mode honesty: when the authored target lands in the goo (valley
 * dips shrink the star) or beyond the wall (high stat → long tip), the ball
 * must still park where the card says it landed — never on the dark side
 * with a WIN card over it.
 *
 * Deterministic scan: 48 angles spiralling from `preferAngle`, radius
 * sampled in 4px steps from `inner` to the wall. Returns null when the
 * zone is empty everywhere — caller keeps the authored target and the
 * forced verdict still wins the card.
 */
export function findZonePoint(o: ZonePointOptions): { x: number; y: number } | null {
  const ballR = o.ballR ?? 9;
  const TAU = Math.PI * 2;
  const GOLDEN = TAU * 0.61803398875; // irrational step → angles spread evenly
  const start = o.preferAngle ?? -Math.PI / 2;
  for (let k = 0; k < 48; k += 1) {
    const a = start + k * GOLDEN;
    const wall = o.wallEdgeAt(a) - ballR - 2;
    for (let r = Math.max(2, o.inner + 2); r <= wall; r += 4) {
      const x = o.cx + Math.cos(a) * r;
      const y = o.cy + Math.sin(a) * r;
      if (o.zoneOf(x, y) === o.want) return { x, y };
    }
  }
  /* bigwin lives INSIDE `inner` — rescan the core disk when that's the want */
  if (o.want === 'bigwin') {
    for (let k = 0; k < 24; k += 1) {
      const a = start + k * GOLDEN;
      for (let r = 2; r <= o.inner - 2; r += 4) {
        const x = o.cx + Math.cos(a) * r;
        const y = o.cy + Math.sin(a) * r;
        if (o.zoneOf(x, y) === o.want) return { x, y };
      }
    }
  }
  return null;
}
