import { Container, Sprite, Texture } from 'pixi.js';
import type { Admission, TakeoffZone } from './ambientDirector';
import { hash01 } from './ambientDirector';
import type { Mappa2StormoConfig } from '../../config/mappa2FaunaConfig';

/**
 * PLAN-108: a flock of painted birds that rises from a takeoff anchor and flies
 * away on a heading — the first land fauna family of the AmbientDirector.
 * Owns rendering; the Director only admits spawn events.
 *
 * Deterministic: flock count, formation offsets, flap phases and speeds are all
 * `hash01(seed, …)` — replay of an admission is identical frame for frame.
 * Canvas-safe: plain Sprites from the atlas, no shader/mesh/mask.
 */

const FADE_SEC = 1.2;
/** First slice of life used for the climb+scale-in that reads as "taking off". */
const CLIMB_SPAN = 0.25;
/** Speed eases in over this time constant (s) — the flock accelerates off the
 * ground instead of snapping to cruise velocity on the first visible frame. */
const TAKEOFF_TAU = 0.9;
/** Seconds the birds take to drift from the takeoff scatter into formation —
 * the V assembles in flight instead of appearing pre-formed. */
const GATHER_SEC = 2.4;
/** Lazy perpendicular meander of the whole path (world px) — flight is not a rail. */
const SWAY_PX = 34;
/** Extra flap rate during the climb — frantic at takeoff, settles in cruise. */
const TAKEOFF_FLAP_BOOST = 0.55;
/** Small body dip synced to the wingbeat (fraction of bird size). */
const FLAP_BOB = 0.05;

const TAU = Math.PI * 2;
/** Smoothstep 0→1: kills the velocity snap a linear ramp leaves at both ends. */
const smooth01 = (k: number): number => k * k * (3 - 2 * k);

interface BirdState {
  sp: Sprite;
  /** Formation anchor in heading-local space: bx = back along heading, by = side. */
  bx: number;
  by: number;
  /** Scatter start (heading-local) — where the bird sits before the flock forms. */
  sx: number;
  sy: number;
  /** Wingbeat phase 0..1 and per-bird rate multiplier. */
  phase: number;
  flapJ: number;
  /** Per-bird wander around the anchor: amplitude px, frequency Hz, phase. */
  wAmpX: number;
  wAmpY: number;
  wFreq: number;
  wPhase: number;
  sizeJitter: number;
}

interface FlockState {
  root: Container;
  birds: BirdState[];
  active: boolean;
  born: number;
  life: number;
  hx: number;
  hy: number;
  speed: number;
  cx: number;
  cy: number;
  /** Whole-path meander: frequency Hz + phase, amplitude is SWAY_PX. */
  swayFreq: number;
  swayPhase: number;
}

export class StormoAdapter {
  readonly container = new Container();
  private flocks: FlockState[] = [];
  private zoneById = new Map<string, TakeoffZone>();

  constructor(
    zones: TakeoffZone[],
    private readonly frames: Texture[],
    private readonly cfg: () => Mappa2StormoConfig,
    private readonly scale: number,
  ) {
    for (const z of zones) this.zoneById.set(z.id, z);
    this.container.eventMode = 'none';
    for (let i = 0; i < 8; i += 1) {
      const root = new Container();
      root.visible = false;
      root.eventMode = 'none';
      const flock: FlockState = {
        root, birds: [], active: false, born: 0, life: 0, hx: 1, hy: 0, speed: 0, cx: 0, cy: 0,
        swayFreq: 0, swayPhase: 0,
      };
      this.flocks.push(flock);
      this.container.addChild(root);
    }
  }

  activeCount(): number {
    return this.flocks.filter((f) => f.active).length;
  }

  /** Consume a stormo admission: a flock rises from the takeoff and flies its heading. */
  spawn(a: Admission, simTime: number): boolean {
    const c = this.cfg();
    const zone = this.zoneById.get(a.zoneId);
    if (!c.enabled || !zone) return false;
    let f = this.flocks.find((q) => !q.active);
    if (!f && a.manual) {
      // a manual lab pick must always show: recycle the oldest live slot
      const oldest = this.flocks.reduce((o, q) => (q.born < o.born ? q : o));
      oldest.active = false;
      oldest.root.visible = false;
      f = oldest;
    }
    if (!f) return false;

    const n = c.flockCount[0] + Math.floor(hash01(a.seed, 'n') * (c.flockCount[1] - c.flockCount[0] + 0.999));
    // rebuild the bird set if this slot's flock is a different size
    while (f.birds.length > n) f.birds.pop()!.sp.destroy();
    while (f.birds.length < n) {
      const sp = new Sprite(this.frames[0] ?? Texture.EMPTY);
      sp.anchor.set(0.5);
      sp.eventMode = 'none';
      f.root.addChild(sp);
      f.birds.push({ sp, bx: 0, by: 0, sx: 0, sy: 0, phase: 0, flapJ: 1, wAmpX: 0, wAmpY: 0, wFreq: 0, wPhase: 0, sizeJitter: 1 });
    }

    f.hx = zone.heading[0];
    f.hy = zone.heading[1];
    const ang = Math.atan2(f.hy, f.hx);
    f.speed = (c.speedPxS[0] + hash01(a.seed, 'v') * (c.speedPxS[1] - c.speedPxS[0])) * this.scale;
    f.life = c.lifeSec[0] + hash01(a.seed, 'l') * (c.lifeSec[1] - c.lifeSec[0]);
    f.swayFreq = 0.1 + hash01(a.seed, 'swf') * 0.12; // ~1 lazy bend over the flight
    f.swayPhase = hash01(a.seed, 'swp') * TAU;
    f.cx = zone.cx * this.scale;
    f.cy = zone.cy * this.scale;
    f.born = simTime;
    f.active = true;

    const birdPx = c.sizeWorldPx * this.scale;
    // V in heading-LOCAL space: bx behind the leader along -heading, by to each
    // side — then the container rotates to `ang`, so a left-flying flock keeps
    // a real V instead of a mirrored one. The V is loose on purpose: per-bird
    // rank/gap variance plus the occasional crossover to the other wing read
    // as birds holding a formation, not a ruled line.
    const gapBack = birdPx * 1.1;
    const gapSide = birdPx * 0.9;
    for (let i = 0; i < n; i += 1) {
      const b = f.birds[i];
      const wing = i === 0 ? 0 : Math.ceil(i / 2);
      const side = i % 2 === 0 ? 1 : -1;
      const rankJ = 0.75 + hash01(a.seed, `rk${i}`) * 0.6;
      const cross = i > 1 && hash01(a.seed, `cw${i}`) < 0.2 ? -1 : 1;
      b.bx = -wing * gapBack * rankJ + (hash01(a.seed, `jx${i}`) - 0.5) * birdPx * 0.9;
      b.by = side * cross * wing * gapSide * (0.7 + hash01(a.seed, `gy${i}`) * 0.65)
        + (hash01(a.seed, `jy${i}`) - 0.5) * birdPx * 0.7;
      // Scatter start around the takeoff point (the leader sits near the anchor):
      // birds converge into formation over GATHER_SEC, like a real takeoff.
      const scat = i === 0 ? 0.35 : 1;
      b.sx = (hash01(a.seed, `sx${i}`) - 0.5) * birdPx * 3 * scat;
      b.sy = (hash01(a.seed, `sy${i}`) - 0.5) * birdPx * 2.2 * scat;
      b.phase = hash01(a.seed, `ph${i}`);
      b.flapJ = 0.85 + hash01(a.seed, `fj${i}`) * 0.3;
      b.wAmpX = birdPx * (0.1 + hash01(a.seed, `wax${i}`) * 0.26);
      b.wAmpY = birdPx * (0.08 + hash01(a.seed, `way${i}`) * 0.2);
      b.wFreq = 0.35 + hash01(a.seed, `wf${i}`) * 0.65;
      b.wPhase = hash01(a.seed, `wp${i}`) * TAU;
      b.sizeJitter = 0.85 + hash01(a.seed, `sz${i}`) * 0.3;
      const cell = this.frames[0] ? this.frames[0].width : 1;
      const s = (birdPx * b.sizeJitter) / cell;
      b.sp.scale.set(s);
      b.sp.position.set(b.sx, b.sy);
      b.sp.texture = this.frames[0] ?? Texture.EMPTY;
      if (f.hx < 0) b.sp.scale.x *= -1; // mirror the frame, not the formation
    }
    f.root.rotation = ang;
    f.root.alpha = 0;
    f.root.position.set(f.cx, f.cy);
    f.root.visible = true;
    return true;
  }

  /** Per-frame update; simTime in seconds. */
  update(simTime: number, reducedMotion: boolean): void {
    const c = this.cfg();
    const on = c.enabled;
    this.container.visible = on;
    for (const f of this.flocks) {
      if (!f.active) continue;
      if (reducedMotion || !on) {
        f.active = false;
        f.root.visible = false;
        continue;
      }
      const age = simTime - f.born;
      if (age >= f.life) {
        f.active = false;
        f.root.visible = false;
        continue;
      }
      const climbK = smooth01(Math.min(1, age / (f.life * CLIMB_SPAN)));
      const fadeIn = Math.min(1, age / FADE_SEC);
      const fadeOut = Math.min(1, (f.life - age) / FADE_SEC);
      f.root.alpha = c.opacity * Math.min(fadeIn, fadeOut);
      // Speed ramps in (v = speed·(1−e^−t/τ)) and the path meanders lazily —
      // neither an instant snap to cruise nor a rail-straight heading.
      const travel = f.speed * Math.max(0, age - TAKEOFF_TAU * (1 - Math.exp(-age / TAKEOFF_TAU)));
      const sway = Math.sin(age * f.swayFreq * TAU + f.swayPhase) * SWAY_PX * this.scale;
      // climb is screen-y (world up), independent of heading
      f.root.position.set(
        f.cx + f.hx * travel - f.hy * sway,
        f.cy + f.hy * travel + f.hx * sway - c.climbPx * this.scale * climbK,
      );
      f.root.rotation = Math.atan2(f.hy, f.hx)
        + Math.sin(age * f.swayFreq * 0.6 * TAU + f.swayPhase * 1.7) * 0.045;
      f.root.scale.set(c.climbScaleIn + (1 - c.climbScaleIn) * climbK);
      const gatherK = smooth01(Math.min(1, age / GATHER_SEC));
      const flapBoost = 1 + TAKEOFF_FLAP_BOOST * (1 - climbK);
      const birdPx = c.sizeWorldPx * this.scale;
      for (const b of f.birds) {
        const flap = simTime * c.flapHz * b.flapJ * flapBoost + b.phase * this.frames.length;
        b.sp.texture = this.frames[Math.floor(flap) % this.frames.length] ?? Texture.EMPTY;
        // scatter → formation drift + per-bird wander + a small wingbeat dip
        b.sp.position.set(
          b.sx + (b.bx - b.sx) * gatherK + Math.sin(age * b.wFreq * TAU + b.wPhase) * b.wAmpX * gatherK,
          b.sy + (b.by - b.sy) * gatherK
            + Math.cos(age * b.wFreq * 0.83 * TAU + b.wPhase * 1.7) * b.wAmpY * gatherK
            + Math.sin(flap * TAU) * birdPx * FLAP_BOB * gatherK,
        );
      }
    }
  }
}
