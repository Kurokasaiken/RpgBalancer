import { Container, Sprite, Texture } from 'pixi.js';
import type { Admission, AmbientDirectorConfig, ShoalZone } from './ambientDirector';
import { hash01 } from './ambientDirector';
import { animateRig, buildRig, type RigInst, type RigSpec } from './ambientRig';

/**
 * PLAN-094 (visual v2, Director 2026-10-29): sea life as DEEP-WATER SILHOUETTES.
 * A shoal is a school of small dark fish that swim together over the turquoise
 * shallows, drawn in the colour of the deep sea so they read against the light
 * water; now and then the admission becomes one giant slow shadow (manta-like)
 * instead; rarer still, a turtle rowing along, or a pair of dolphins leaping with splashes. Owns rendering; the AmbientDirector only admits spawn events.
 * Canvas-safe: plain Sprites sharing two procedural textures, no shader/mesh/mask.
 */

const POOL = 3;
const FADE_SEC = 3;
const FISH_PER_SCHOOL = 16;
/** Silhouette colour: the painted deep sea. */
const DEEP = 'rgb(7, 46, 72)';
/** The Director's alpha slider is tuned for faint overlays; silhouettes need more. */
const ALPHA_GAIN = 2.4;
const ALPHA_MAX = 0.7;
/** Admission odds (cumulative, only while no other special is active): giant shadow, turtle, dolphin pair; else a school. */
const GIANT_CHANCE = 0.1;
const TURTLE_CHANCE = 0.17;
const DOLPHIN_CHANCE = 0.25;
const BUBBLES = 10;
const RINGS = 6;
const DOLPHIN_LIFE = 6;
type Kind = 'school' | 'giant' | 'turtle' | 'dolphin';

interface FishState {
  sp: Sprite;
  tail: Sprite;
  ox: number;
  oy: number;
  ph: number;
  sz: number;
}

interface BlobState {
  school: Container;
  fish: FishState[];
  giant: Sprite;
  isGiant: boolean;
  kind: Kind;
  turtle: Container;
  flippers: Sprite[];
  dolphins: Sprite[];
  fx: Container;
  rings: Sprite[];
  ringAt: number[];
  ringX: number[];
  ringY: number[];
  bubbles: Sprite[];
  rigFish: RigInst[];
  rigGiants: Record<string, RigInst>;
  rigTurtle: RigInst | null;
  rigDolphins: RigInst[];
  rig: RigInst | null;
  bubbleBorn: number[];
  bubbleNext: number;
  lastBubble: number;
  active: boolean;
  born: number;
  life: number;
  size: number;
  hx: number;
  hy: number;
  speed: number;
  baseAlpha: number;
  zoneId: string;
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): Texture {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d');
  if (g) draw(g);
  return Texture.from(cv);
}

/** Top-down fish body pointing +x (head right): a tapered spindle with small pectoral fins. */
function makeFishBodyTexture(): Texture {
  return canvasTexture(36, 16, (g) => {
    g.fillStyle = DEEP;
    g.beginPath();
    g.moveTo(35, 8);
    g.bezierCurveTo(30, 1.5, 18, 0.5, 6, 6.5);
    g.lineTo(1, 7);
    g.lineTo(1, 9);
    g.lineTo(6, 9.5);
    g.bezierCurveTo(18, 15.5, 30, 14.5, 35, 8);
    g.fill();
    g.beginPath(); // pectoral fins, swept back
    g.moveTo(24, 3);
    g.lineTo(15, 0);
    g.lineTo(19, 4.5);
    g.closePath();
    g.moveTo(24, 13);
    g.lineTo(15, 16);
    g.lineTo(19, 11.5);
    g.closePath();
    g.fill();
  });
}

/** Top-down tail fin (forked), hinged at its right edge so it can sway behind the body. */
function makeFishTailTexture(): Texture {
  return canvasTexture(14, 16, (g) => {
    g.fillStyle = DEEP;
    g.beginPath();
    g.moveTo(14, 7);
    g.lineTo(1, 0);
    g.lineTo(5, 8);
    g.lineTo(1, 16);
    g.lineTo(14, 9);
    g.closePath();
    g.fill();
  });
}

/** A long manta/whale-like shadow pointing +x, soft edges. */
function makeGiantTexture(): Texture {
  return canvasTexture(256, 96, (g) => {
    g.filter = 'blur(2px)';
    g.fillStyle = DEEP;
    g.beginPath(); // body
    g.moveTo(250, 48);
    g.bezierCurveTo(215, 30, 150, 28, 100, 40);
    g.bezierCurveTo(150, 68, 215, 66, 250, 48);
    g.fill();
    g.beginPath(); // pectoral fins
    g.moveTo(170, 40);
    g.bezierCurveTo(140, 20, 100, 6, 70, 8);
    g.bezierCurveTo(100, 26, 120, 40, 135, 46);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(170, 56);
    g.bezierCurveTo(140, 76, 100, 90, 70, 88);
    g.bezierCurveTo(100, 70, 120, 56, 135, 50);
    g.closePath();
    g.fill();
    g.beginPath(); // tail
    g.moveTo(104, 46);
    g.lineTo(6, 48);
    g.lineTo(104, 50);
    g.closePath();
    g.fill();
  });
}

/** A big generic fish seen from above (tuna/shark-like), pointing +x: spindle body, swept fins, crescent tail. */
function makeBigFishTexture(): Texture {
  return canvasTexture(256, 96, (g) => {
    g.filter = 'blur(1.5px)';
    g.fillStyle = DEEP;
    g.beginPath(); // body
    g.moveTo(254, 48);
    g.bezierCurveTo(220, 28, 150, 28, 80, 42);
    g.lineTo(60, 44);
    g.lineTo(60, 52);
    g.lineTo(80, 54);
    g.bezierCurveTo(150, 68, 220, 68, 254, 48);
    g.fill();
    g.beginPath(); // pectoral fins, swept back
    g.moveTo(190, 36);
    g.lineTo(140, 8);
    g.lineTo(150, 38);
    g.closePath();
    g.moveTo(190, 60);
    g.lineTo(140, 88);
    g.lineTo(150, 58);
    g.closePath();
    g.fill();
    g.beginPath(); // crescent tail
    g.moveTo(64, 48);
    g.lineTo(30, 40);
    g.lineTo(6, 14);
    g.lineTo(22, 48);
    g.lineTo(6, 82);
    g.lineTo(30, 56);
    g.closePath();
    g.fill();
  });
}

/** Top-down sea turtle body pointing +x: oval shell, head, short tail. */
function makeShellTexture(): Texture {
  return canvasTexture(48, 32, (g) => {
    g.fillStyle = DEEP;
    g.beginPath();
    g.ellipse(21, 16, 15, 11, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath(); // head
    g.ellipse(41, 16, 6, 4.2, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath(); // tail
    g.moveTo(7, 16);
    g.lineTo(0, 15);
    g.lineTo(0, 17);
    g.closePath();
    g.fill();
  });
}

/** A flipper hinged at its left edge (anchor 0, 0.5), pointing +x. */
function makeFlipperTexture(): Texture {
  return canvasTexture(22, 8, (g) => {
    g.fillStyle = DEEP;
    g.beginPath();
    g.moveTo(0, 3);
    g.bezierCurveTo(8, 0, 16, 1, 21, 4);
    g.bezierCurveTo(16, 8, 8, 8, 0, 5);
    g.fill();
  });
}

/** Dolphin seen from above, pointing +x: slim body, swept flippers, horizontal flukes. */
function makeDolphinTexture(): Texture {
  return canvasTexture(96, 32, (g) => {
    g.filter = 'blur(0.6px)';
    g.fillStyle = DEEP;
    g.beginPath();
    g.moveTo(95, 16);
    g.bezierCurveTo(84, 9, 60, 9, 30, 14);
    g.lineTo(26, 15);
    g.lineTo(26, 17);
    g.lineTo(30, 18);
    g.bezierCurveTo(60, 23, 84, 23, 95, 16);
    g.fill();
    g.beginPath(); // flippers
    g.moveTo(66, 12);
    g.lineTo(52, 2);
    g.lineTo(56, 13);
    g.closePath();
    g.moveTo(66, 20);
    g.lineTo(52, 30);
    g.lineTo(56, 19);
    g.closePath();
    g.fill();
    g.beginPath(); // flukes
    g.moveTo(30, 16);
    g.lineTo(10, 8);
    g.lineTo(2, 4);
    g.lineTo(12, 16);
    g.lineTo(2, 28);
    g.lineTo(10, 24);
    g.closePath();
    g.fill();
  });
}

/** Expanding splash ring (white, soft). */
function makeRingTexture(): Texture {
  return canvasTexture(64, 64, (g) => {
    g.filter = 'blur(1px)';
    g.strokeStyle = 'rgba(235, 250, 255, 0.95)';
    g.lineWidth = 3.5;
    g.beginPath();
    g.arc(32, 32, 24, 0, Math.PI * 2);
    g.stroke();
  });
}

/** A rising bubble. */
function makeBubbleTexture(): Texture {
  return canvasTexture(16, 16, (g) => {
    g.fillStyle = 'rgba(235, 250, 255, 0.35)';
    g.beginPath();
    g.arc(8, 8, 5.5, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(245, 253, 255, 0.95)';
    g.lineWidth = 1.4;
    g.stroke();
  });
}

/** Shoal adapter: consumes admissions, drives the pool per frame. */
export class ShoalAdapter {
  readonly container = new Container();
  /** Lab/test seam: force the next admission to this kind (null = natural odds). */
  forceKind: Kind | null = null;
  private rigsReady = false;

  /** Swap the procedural placeholders for the Director's hinged silhouettes (once the art has loaded). */
  setRigs(specs: Record<string, RigSpec>, tex: (file: string) => Texture | undefined): void {
    const tint = 0x072e48;
    const make = (id: string) => (specs[id] ? buildRig(specs[id], tex, tint) : null);
    if (!make('pesce') || !make('delfino') || !make('tartaruga') || !make('pescione')) return;
    for (const b of this.blobs) {
      for (let k = 0; k < FISH_PER_SCHOOL; k += 1) {
        const r = make('pesce');
        if (r) {
          b.school.addChild(r.root);
          b.rigFish.push(r);
        }
      }
      for (const id of ['manta', 'pescione', 'martello']) {
        const r = make(id);
        if (r) {
          b.school.addChild(r.root);
          b.rigGiants[id] = r;
        }
      }
      const t = make('tartaruga');
      if (t) {
        b.school.addChild(t.root);
        b.rigTurtle = t;
      }
      for (let k = 0; k < 2; k += 1) {
        const d = make('delfino');
        if (d) {
          b.school.addChild(d.root);
          b.rigDolphins.push(d);
        }
      }
    }
    this.rigsReady = true;
  }
  private blobs: BlobState[] = [];
  private zoneById = new Map<string, ShoalZone>();
  private readonly fishTex: Texture;
  private readonly tailTex: Texture;
  private readonly giantTex: Texture;
  private readonly bigFishTex: Texture;
  private readonly shellTex: Texture;
  private readonly flipperTex: Texture;
  private readonly dolphinTex: Texture;
  private readonly ringTex: Texture;
  private readonly bubbleTex: Texture;

  // The atlas argument is kept for call-site compatibility; the silhouettes are procedural.
  constructor(
    zones: ShoalZone[],
    _atlas: Texture | null,
    private readonly cfg: () => AmbientDirectorConfig,
    private readonly scale: number,
  ) {
    for (const z of zones) this.zoneById.set(z.id, z);
    this.fishTex = makeFishBodyTexture();
    this.tailTex = makeFishTailTexture();
    this.giantTex = makeGiantTexture();
    this.bigFishTex = makeBigFishTexture();
    this.shellTex = makeShellTexture();
    this.flipperTex = makeFlipperTexture();
    this.dolphinTex = makeDolphinTexture();
    this.ringTex = makeRingTexture();
    this.bubbleTex = makeBubbleTexture();
    for (let i = 0; i < POOL; i += 1) {
      const school = new Container();
      school.visible = false;
      school.eventMode = 'none';
      const fish: FishState[] = [];
      for (let k = 0; k < FISH_PER_SCHOOL; k += 1) {
        const sp = new Sprite(this.fishTex);
        sp.anchor.set(0.5);
        sp.eventMode = 'none';
        const tail = new Sprite(this.tailTex);
        tail.anchor.set(1, 0.5); // hinge at the body's rear
        tail.position.set(-17, 0); // rear of the body (anchor is its centre)
        sp.addChild(tail);
        school.addChild(sp);
        fish.push({ sp, tail, ox: 0, oy: 0, ph: 0, sz: 1 });
      }
      const giant = new Sprite(this.giantTex);
      giant.anchor.set(0.5);
      giant.visible = false;
      giant.eventMode = 'none';
      school.addChild(giant);
      const turtle = new Container();
      turtle.visible = false;
      const shell = new Sprite(this.shellTex);
      shell.anchor.set(0.5);
      turtle.addChild(shell);
      const flippers: Sprite[] = [];
      for (let k = 0; k < 4; k += 1) {
        const fl = new Sprite(this.flipperTex);
        fl.anchor.set(0, 0.5);
        const front = k < 2;
        const side = k % 2 === 0 ? -1 : 1;
        fl.position.set(front ? 7 : -10, side * (front ? 10 : 8));
        fl.scale.set(front ? 1 : 0.7);
        turtle.addChild(fl);
        flippers.push(fl);
      }
      school.addChild(turtle);
      const dolphins: Sprite[] = [];
      for (let k = 0; k < 2; k += 1) {
        const d = new Sprite(this.dolphinTex);
        d.anchor.set(0.5);
        d.visible = false;
        school.addChild(d);
        dolphins.push(d);
      }
      const fx = new Container();
      fx.visible = false;
      fx.eventMode = 'none';
      const rings: Sprite[] = [];
      for (let k = 0; k < RINGS; k += 1) {
        const r = new Sprite(this.ringTex);
        r.anchor.set(0.5);
        r.visible = false;
        fx.addChild(r);
        rings.push(r);
      }
      const bubbles: Sprite[] = [];
      for (let k = 0; k < BUBBLES; k += 1) {
        const bb = new Sprite(this.bubbleTex);
        bb.anchor.set(0.5);
        bb.visible = false;
        fx.addChild(bb);
        bubbles.push(bb);
      }
      this.container.addChild(school);
      this.container.addChild(fx);
      this.blobs.push({
        school, fish, giant, isGiant: false, kind: 'school', turtle, flippers, dolphins, fx, rings,
        ringAt: new Array(RINGS).fill(-1), ringX: new Array(RINGS).fill(0), ringY: new Array(RINGS).fill(0),
        bubbles, rigFish: [], rigGiants: {}, rigTurtle: null, rigDolphins: [], rig: null, bubbleBorn: new Array(BUBBLES).fill(-1), bubbleNext: 0, lastBubble: -9,
        active: false, born: 0, life: 0, size: 60,
        hx: 0, hy: 0, speed: 5, baseAlpha: 0.3, zoneId: '',
      });
    }
  }

  activeCount(): number {
    return this.blobs.filter((b) => b.active).length;
  }

  /** Consume a director admission: spawn a school (or a giant shadow) in a free pool slot. */
  spawn(a: Admission, simTime: number): boolean {
    const c = this.cfg().families.shoal;
    const zone = this.zoneById.get(a.zoneId);
    const b = this.blobs.find((q) => !q.active);
    if (!zone || !b) return false;
    const specialBusy = this.blobs.some((q) => q.active && q.kind !== 'school');
    const u = hash01(a.seed, 'g');
    b.kind = specialBusy ? 'school' : u < GIANT_CHANCE ? 'giant' : u < TURTLE_CHANCE ? 'turtle' : u < DOLPHIN_CHANCE ? 'dolphin' : 'school';
    if (this.forceKind) b.kind = this.forceKind;
    b.isGiant = b.kind === 'giant';
    const s = c.sizePx[0] + hash01(a.seed, 's') * (c.sizePx[1] - c.sizePx[0]);
    b.size = s * this.scale;
    b.life = (c.lifeSec[0] + hash01(a.seed, 'l') * (c.lifeSec[1] - c.lifeSec[0])) * (b.isGiant ? 1.3 : 1);
    b.speed = (c.speedPxS[0] + hash01(a.seed, 'p') * (c.speedPxS[1] - c.speedPxS[0])) * this.scale * (b.isGiant ? 0.7 : 1);
    if (b.kind === 'dolphin') {
      b.life = DOLPHIN_LIFE;
      b.speed = ((zone.maxTravelPx ?? 96) * this.scale) / (DOLPHIN_LIFE * 0.9); // cross the whole safe path, fast
    }
    b.hx = zone.heading[0];
    b.hy = zone.heading[1];
    const kindGain = b.kind === 'dolphin' ? 1.9 : b.kind === 'turtle' ? 1.7 : b.kind === 'giant' ? 1.4 : 1; // lone shapes need more weight than a school
    b.baseAlpha = Math.min(ALPHA_MAX, c.alpha * ALPHA_GAIN * kindGain);
    b.ringAt.fill(-1);
    b.bubbleBorn.fill(-1);
    b.lastBubble = -9;
    for (const bb of b.bubbles) bb.visible = false;
    for (const r of b.rings) r.visible = false;
    b.born = simTime;
    b.zoneId = a.zoneId;
    b.active = true;
    const ang = Math.atan2(b.hy, b.hx);
    b.giant.visible = b.isGiant && !this.rigsReady;
    if (b.isGiant) {
      b.giant.texture = hash01(a.seed, 'k') < 0.5 ? this.giantTex : this.bigFishTex;
      b.giant.rotation = ang;
      b.giant.scale.set((b.size * 2.6) / 256);
    }
    b.turtle.visible = b.kind === 'turtle' && !this.rigsReady;
    if (b.kind === 'turtle') {
      b.turtle.rotation = ang;
      b.turtle.scale.set((b.size * 0.85) / 48);
    }
    for (let k = 0; k < b.dolphins.length; k += 1) {
      const d = b.dolphins[k];
      d.visible = b.kind === 'dolphin' && !this.rigsReady;
      d.rotation = ang;
      d.scale.set((b.size * 0.8) / 96);
    }
    b.fx.visible = true;
    if (this.rigsReady) this.spawnRigs(b, a);
    const radius = b.size * 0.5;
    for (let k = 0; k < b.fish.length; k += 1) {
      const f = b.fish[k];
      f.sp.visible = b.kind === 'school' && !this.rigsReady;
      // sunflower spiral = even spacing (no overlap blob), stretched along the heading, small jitter
      const r = Math.sqrt((k + 0.5) / b.fish.length);
      const t = k * 2.399963 + hash01(a.seed, `t${k}`) * 0.5;
      f.ox = Math.cos(t) * r * radius * 1.7 + (hash01(a.seed, `j${k}`) - 0.5) * radius * 0.25;
      f.oy = Math.sin(t) * r * radius * 0.85 + (hash01(a.seed, `q${k}`) - 0.5) * radius * 0.25;
      f.ph = hash01(a.seed, `p${k}`) * Math.PI * 2;
      f.sz = (0.9 + hash01(a.seed, `z${k}`) * 0.5) * this.scale * 0.95;
      f.sp.scale.set(f.sz);
      f.sp.rotation = ang;
    }
    b.school.position.set(zone.cx * this.scale, zone.cy * this.scale);
    b.school.alpha = 0;
    b.school.visible = true;
    return true;
  }

  /** Show the rig instances this admission needs and size them. */
  private spawnRigs(b: BlobState, a: Admission): void {
    const ang = Math.atan2(b.hy, b.hx);
    for (const r of b.rigFish) r.root.visible = false;
    for (const r of Object.values(b.rigGiants)) r.root.visible = false;
    if (b.rigTurtle) b.rigTurtle.root.visible = false;
    for (const r of b.rigDolphins) r.root.visible = false;
    b.rig = null;
    if (b.kind === 'school') {
      for (let k = 0; k < b.rigFish.length; k += 1) {
        const r = b.rigFish[k];
        r.root.visible = true;
        r.root.rotation = ang;
        r.root.scale.set(b.fish[k].sz * (48 / (r.lengthPx * 1.25)));
      }
    } else if (b.kind === 'giant') {
      const ids = Object.keys(b.rigGiants);
      const r = b.rigGiants[ids[Math.floor(hash01(a.seed, 'k') * ids.length)]];
      r.root.visible = true;
      r.root.rotation = ang;
      r.root.scale.set((b.size * 1.9) / (r.lengthPx * 1.3));
      b.rig = r;
    } else if (b.kind === 'turtle' && b.rigTurtle) {
      b.rigTurtle.root.visible = true;
      b.rigTurtle.root.rotation = ang;
      b.rigTurtle.root.scale.set((b.size * 0.8) / b.rigTurtle.lengthPx);
      b.rig = b.rigTurtle;
    } else if (b.kind === 'dolphin') {
      for (const r of b.rigDolphins) {
        r.root.visible = true;
        r.root.rotation = ang;
        r.root.scale.set(b.size / (r.lengthPx * 1.2));
      }
    }
  }

  /** Per-frame update; simTime in seconds. */
  update(simTime: number, reducedMotion: boolean): void {
    const c = this.cfg();
    const on = c.enabled && c.families.shoal.enabled;
    this.container.visible = on;
    for (const b of this.blobs) {
      if (!b.active) continue;
      if (reducedMotion || !on) {
        // scheduled-layer freeze: instant hide, no transition
        b.active = false;
        b.school.visible = false;
        b.fx.visible = false;
        continue;
      }
      const age = simTime - b.born;
      if (age >= b.life) {
        b.active = false;
        b.school.visible = false;
        b.fx.visible = false;
        continue;
      }
      const fadeIn = Math.min(1, age / FADE_SEC);
      const fadeOut = Math.min(1, (b.life - age) / FADE_SEC);
      b.school.alpha = b.baseAlpha * Math.min(fadeIn, fadeOut);
      const zone = this.zoneById.get(b.zoneId);
      const travel = Math.min(b.speed * age, zone?.maxTravelPx ?? 96 * this.scale);
      b.school.position.set((zone?.cx ?? 0) * this.scale + b.hx * travel, (zone?.cy ?? 0) * this.scale + b.hy * travel);
      if (b.kind === 'giant' && b.rig) {
        b.rig.root.rotation = Math.atan2(b.hy, b.hx) + 0.03 * Math.sin(simTime * 0.7);
        animateRig(b.rig, simTime, 0, 0.7);
        this.emitBubbles(b, zone, age);
        continue;
      }
      if (b.kind === 'turtle' && b.rig) {
        animateRig(b.rig, simTime, 0);
        continue;
      }
      if (b.kind === 'giant') {
        b.giant.scale.y = ((b.size * 2.6) / 256) * (1 + 0.06 * Math.sin(simTime * 0.8));
        this.emitBubbles(b, zone, age);
        continue;
      }
      if (b.kind === 'turtle') {
        // rowing: front flippers sweep in alternation, rear ones follow lightly, a slow body roll
        for (let k = 0; k < 4; k += 1) {
          const side = k % 2 === 0 ? -1 : 1;
          const front = k < 2;
          const swing = Math.sin(simTime * 2.2 + (k % 2) * Math.PI) * (front ? 0.5 : 0.25);
          b.flippers[k].rotation = side * (front ? 1.1 : 2.2) + swing * side; // out to the side: up (-y) for side -1
        }
        b.turtle.rotation = Math.atan2(b.hy, b.hx) + 0.05 * Math.sin(simTime * 1.1);
        continue;
      }
      if (b.kind === 'dolphin') {
        this.updateDolphins(b, zone, age, simTime);
        continue;
      }
      const ang = Math.atan2(b.hy, b.hx);
      const cx = Math.cos(ang);
      const sx = Math.sin(ang);
      const breathe = 1 + 0.08 * Math.sin(simTime * 0.5 + b.born);
      if (this.rigsReady) {
        for (let k = 0; k < b.rigFish.length; k += 1) {
          const f = b.fish[k];
          const r = b.rigFish[k];
          const wx = f.ox * breathe + Math.sin(simTime * 0.7 + f.ph) * 10 * this.scale;
          const wy = f.oy * breathe + Math.sin(simTime * 1.1 + f.ph * 1.3) * 2.5 * this.scale;
          r.root.position.set(wx * cx - wy * sx, wx * sx + wy * cx);
          r.root.rotation = ang + 0.06 * Math.sin(simTime * 1.1 + f.ph * 1.3);
          animateRig(r, simTime, f.ph);
        }
        continue;
      }
      for (const f of b.fish) {
        // seen from above a fish keeps its heading and swims: it surges/slackens along the heading,
        // weaves a little sideways, and its tail sways behind the body (that is the whole animation)
        const wx = f.ox * breathe + Math.sin(simTime * 0.7 + f.ph) * 10 * this.scale;
        const wy = f.oy * breathe + Math.sin(simTime * 1.1 + f.ph * 1.3) * 2.5 * this.scale;
        f.sp.position.set(wx * cx - wy * sx, wx * sx + wy * cx);
        f.sp.rotation = ang + 0.07 * Math.sin(simTime * 5 + f.ph) + 0.05 * Math.cos(simTime * 1.1 + f.ph * 1.3);
        f.tail.rotation = 0.55 * Math.sin(simTime * 5 + f.ph - 1.2);
      }
    }
  }

  /** Bubbles trailing behind a giant: emitted along its wake, each rises/fades on its own clock. */
  private emitBubbles(b: BlobState, zone: ShoalZone | undefined, age: number): void {
    const zx = (zone?.cx ?? 0) * this.scale;
    const zy = (zone?.cy ?? 0) * this.scale;
    const travel = Math.min(b.speed * age, zone?.maxTravelPx ?? 96 * this.scale);
    if (age - b.lastBubble > 0.5 && age < b.life - FADE_SEC) {
      b.lastBubble = age;
      const k = b.bubbleNext % BUBBLES;
      b.bubbleNext += 1;
      const tail = b.size * 2.6 * 0.42;
      const jit = (hash01(k + 1, `b${Math.floor(age * 10)}`) - 0.5) * 8 * this.scale;
      const bb = b.bubbles[k];
      bb.position.set(zx + b.hx * (travel - tail) - b.hy * jit, zy + b.hy * (travel - tail) + b.hx * jit);
      b.bubbleBorn[k] = age;
    }
    for (let k = 0; k < BUBBLES; k += 1) {
      const bb = b.bubbles[k];
      const t = (age - b.bubbleBorn[k]) / 3.2;
      if (b.bubbleBorn[k] < 0 || t >= 1) {
        bb.visible = false;
        continue;
      }
      bb.visible = true;
      bb.alpha = 0.7 * (1 - t);
      bb.scale.set((0.35 + 0.5 * t) * this.scale);
    }
  }

  /** Two dolphins crossing the safe path, leaping in two arcs; splash rings mark each entry. */
  private updateDolphins(b: BlobState, zone: ShoalZone | undefined, age: number, simTime: number): void {
    const zx = (zone?.cx ?? 0) * this.scale;
    const zy = (zone?.cy ?? 0) * this.scale;
    const maxT = zone?.maxTravelPx ?? 96 * this.scale;
    const posAt = (t: number, side: number): [number, number] => {
      const tr = Math.min(b.speed * Math.max(0, t), maxT);
      const off = side * 13 * this.scale;
      return [zx + b.hx * tr - b.hy * off, zy + b.hy * tr + b.hx * off];
    };
    b.school.position.set(zx, zy); // dolphins are placed absolutely inside the zone frame
    const events = [0, 0.5, 0.98];
    for (let d = 0; d < 2; d += 1) {
      const lag = d * 0.45;
      const t = Math.max(0, age - lag);
      const u = Math.min(1, t / b.life);
      const h = Math.abs(Math.sin(2 * Math.PI * u));
      const rig = this.rigsReady ? b.rigDolphins[d] : null;
      const sp = rig ? rig.root : b.dolphins[d];
      const [px, py] = posAt(t, d === 0 ? -1 : 1);
      // school position is the zone origin: dolphins are placed absolutely inside it
      sp.position.set(px - zx, py - zy);
      sp.scale.set((rig ? b.size / (rig.lengthPx * 1.2) : (b.size * 0.8) / 96) * (1 + 0.5 * h));
      if (rig) animateRig(rig, simTime, d);
      sp.alpha = 0.35 + 0.65 * h;
      sp.rotation = Math.atan2(b.hy, b.hx) + 0.06 * Math.sin(simTime * 3 + d);
      for (let e = 0; e < events.length; e += 1) {
        const k = d * 3 + e;
        if (b.ringAt[k] < 0 && age >= events[e] * b.life + lag) {
          b.ringAt[k] = age;
          const [rx, ry] = posAt(events[e] * b.life, d === 0 ? -1 : 1);
          b.ringX[k] = rx;
          b.ringY[k] = ry;
        }
      }
    }
    for (let k = 0; k < RINGS; k += 1) {
      const r = b.rings[k];
      const tr = (age - b.ringAt[k]) / 1.6;
      if (b.ringAt[k] < 0 || tr >= 1) {
        r.visible = false;
        continue;
      }
      r.visible = true;
      r.position.set(b.ringX[k], b.ringY[k]);
      r.scale.set((0.25 + 1.0 * tr) * (b.size / 64) * 0.6);
      r.alpha = 0.7 * (1 - tr);
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.fishTex.destroy(true);
    this.tailTex.destroy(true);
    this.giantTex.destroy(true);
    this.bigFishTex.destroy(true);
    this.shellTex.destroy(true);
    this.flipperTex.destroy(true);
    this.dolphinTex.destroy(true);
    this.ringTex.destroy(true);
    this.bubbleTex.destroy(true);
  }
}
