/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DESTINY ASTROLABE — V2 engine (hand-authored, skin-driven)
 *
 *  A ground-up rewrite of the V1 skill-check for the V9 Obsidian skin.
 *  Differences vs V1 (auto-generated from public/destiny-astrolabe.html):
 *   • Colours are read from the live `--skin-*` CSS variables → follows the
 *     active skin (V9 Obsidian by default). No hardcoded emerald/red/purple.
 *   • The "enemy" is a faceted obsidian CRYSTAL (its radius = failure frontier),
 *     not an amorphous goo blob.
 *   • The stat markers are slim celestial/compass NEEDLES in gold, not
 *     wireframe neon spikes.
 *   • Feel: the outcome is a decelerating POINTER sweeping a threshold DIAL
 *     (near-miss dopamine), not a hidden-magnet pinball.
 *   • Hero-number payoff: the D100 roll + delta is surfaced by the React host;
 *     no full-screen "piss filter".
 *
 *  Everything is drawn on a single <canvas> the engine owns. Text (hero number,
 *  verdict) and the gem button live in the React overlay for crisp typography.
 * ═══════════════════════════════════════════════════════════════════════════
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AstrolabeSkill { name: string; stat: number; difficulty: number; }
export interface AstrolabeConfig {
  crit?: number; wound?: number; dead?: number; mode?: string;
  tSlam?: number; tBurst?: number; tSpin?: number; tSnap?: number;
}
export interface AstrolabeResult {
  verdict: string; roll: number; riskRoll: number;
  skillIndex: number; skillName: string; wounded: boolean; dead: boolean;
  tst: number; delta: number;
}
export interface AstrolabeV2EngineOpts {
  skills: AstrolabeSkill[];
  config?: AstrolabeConfig;
  onResolve?: (r: AstrolabeResult) => void;
  onState?: (state: string) => void;
  onArmed?: (armed: boolean) => void;
  /** fires once at magnetic-snap for the impact hit-stop / shake */
  onSnap?: () => void;
}
export interface AstrolabeV2Handle {
  roll: () => void;
  throw: () => void;
  setConfig: (skills: AstrolabeSkill[], config?: AstrolabeConfig) => void;
  destroy: () => void;
}

type Palette = {
  obsidian: string; azure: string; gold: string; warmGold: string;
  ivory: string; danger: string; success: string;
};

/* ── colour helpers ─────────────────────────────────────────────────────── */
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex: string, a: number): string {
  // pass rgba()/hsl() strings straight through with alpha ignored fallback
  if (!hex.startsWith('#')) return hex;
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function readPalette(el: HTMLElement): Palette {
  const cs = getComputedStyle(el);
  const g = (name: string, fb: string) => {
    const v = cs.getPropertyValue(name).trim();
    return v || fb;
  };
  return {
    obsidian: g('--skin-surface-base', '#060f16'),
    azure:    g('--skin-icon-accent',  '#00e5ff'),
    gold:     g('--skin-icon-color',   '#dfb857'),
    warmGold: g('--skin-close-color',  '#f7dd80'),
    ivory:    g('--skin-text-primary', '#F5F2E8'),
    danger:   g('--skin-status-unmet', '#d98a4a'),
    success:  g('--skin-status-met',   '#7bc96f'),
  };
}

/* ── easing ─────────────────────────────────────────────────────────────── */
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
// spin: launch fast, long dramatic decel (the near-miss curve)
const easeSpin = (t: number) => {
  if (t < 0.28) return 0.55 * (t / 0.28) * (t / 0.28); // accelerate
  const u = (t - 0.28) / 0.72;
  return 0.043 + 0.957 * (1 - Math.pow(1 - u, 4)); // long glide to a stop
};

/* ── geometry helpers ───────────────────────────────────────────────────── */
const TAU = Math.PI * 2;
const TOP = -Math.PI / 2;

interface Phase { name: string; dur: number; gate?: boolean; }

export function createDestinyAstrolabeV2Engine(
  root: HTMLElement,
  opts: AstrolabeV2EngineOpts,
): AstrolabeV2Handle {
  let palette = readPalette(root);

  const canvas = document.createElement('canvas');
  canvas.className = 'da2-canvas';
  root.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  let W = 800, H = 800, cx = 400, cy = 400, R = 380, dpr = 1;
  function resize() {
    const rect = root.getBoundingClientRect();
    const size = Math.max(120, Math.min(rect.width, rect.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    W = canvas.width; H = canvas.height;
    cx = W / 2; cy = H / 2;
    R = Math.min(W, H) * 0.46;
  }
  resize();
  const ro = new ResizeObserver(() => resize());
  ro.observe(root);

  /* ── config / mechanics ───────────────────────────────────────────────── */
  const cfg = Object.assign(
    { crit: 5, wound: 10, dead: 5, mode: 'random', tSlam: 900, tBurst: 900, tSpin: 2400, tSnap: 520 },
    opts.config || {},
  );
  let skills: AstrolabeSkill[] = (opts.skills && opts.skills.length)
    ? opts.skills.slice() : [{ name: 'Skill', stat: 60, difficulty: 50 }];

  const computeTST = (s: AstrolabeSkill) => Math.max(1, Math.min(99, 50 + (s.stat - s.difficulty)));

  function needleCount(): number {
    const n = skills.length;
    if (n <= 1) return 5;
    if (n === 2) return 5;
    if (n === 3) return 5;
    if (n === 4) return 5;
    return Math.min(8, n + 2);
  }

  // Pointer / mouse for parallax
  let mx = 0, my = 0; // -1..1
  function onPointer(e: PointerEvent) {
    const rect = root.getBoundingClientRect();
    mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }
  root.addEventListener('pointermove', onPointer);

  /* ── run state ────────────────────────────────────────────────────────── */
  const TIMELINE: Phase[] = [
    { name: 'ring-lock', dur: 620 },
    { name: 'threat-slam', dur: cfg.tSlam },
    { name: 'agency-burst', dur: cfg.tBurst },
    { name: 'action-trigger', dur: 0, gate: true },
    { name: 'the-spin', dur: cfg.tSpin },
    { name: 'magnetic-snap', dur: cfg.tSnap },
    { name: 'resolution', dur: 999999 },
  ];
  let phaseIdx = -1;
  let phaseStart = 0;
  let state = 'idle';
  let gateReleased = false;
  let resolved = false;
  let snapFired = false;

  // per-roll decided outcome
  let tst = 65;
  let rollValue = 50;
  let riskRoll = 0;
  let verdict = 'win';
  let wounded = false, dead = false;
  let skillIndex = 0;
  let targetAngle = TOP;

  // crystal shard particles
  interface Shard { a: number; d: number; vd: number; life: number; max: number; size: number; }
  let shards: Shard[] = [];
  // starfield
  interface Star { x: number; y: number; r: number; layer: number; ph: number; sp: number; }
  let stars: Star[] = [];
  function buildStars() {
    stars = [];
    const N = 90;
    for (let i = 0; i < N; i++) {
      const layer = i < 40 ? 0 : i < 70 ? 1 : 2;
      stars.push({
        x: (hash(i * 3.1) - 0.5) * 2,
        y: (hash(i * 7.7 + 1) - 0.5) * 2,
        r: 0.4 + hash(i * 2.3) * (layer === 2 ? 1.7 : 1.0),
        layer,
        ph: hash(i * 5.5) * TAU,
        sp: 0.6 + hash(i * 1.9) * 1.8,
      });
    }
  }
  function hash(n: number) { const s = Math.sin(n) * 43758.5453; return s - Math.floor(s); }
  buildStars();

  function decideOutcome() {
    skillIndex = 0;
    const s = skills[skillIndex] || { name: 'Skill', stat: 60, difficulty: 50 };
    tst = computeTST(s);
    const crit = Math.max(1, cfg.crit | 0);

    const mode = cfg.mode || 'random';
    const rnd = () => 1 + Math.floor(Math.random() * 100);
    const pick = (lo: number, hi: number) => Math.max(1, Math.min(100, lo + Math.floor(Math.random() * (hi - lo + 1))));

    if (mode === 'bigwin')      rollValue = pick(1, Math.max(1, Math.floor(tst * 0.22)));
    else if (mode === 'win')    rollValue = pick(Math.max(1, Math.floor(tst * 0.22) + 1), Math.max(2, tst - 5));
    else if (mode === 'almost') rollValue = pick(Math.max(1, tst - 4), tst);
    else if (mode === 'fail')   rollValue = pick(tst + 1, Math.max(tst + 2, 100 - crit - 1));
    else if (mode === 'epicfail') rollValue = pick(Math.max(tst + 1, 100 - crit + 1), 100);
    else rollValue = rnd();

    // classify
    if (rollValue <= tst) {
      if (rollValue <= Math.max(1, Math.floor(tst * 0.22))) verdict = 'bigwin';
      else if (rollValue >= tst - 4) verdict = 'almost';
      else verdict = 'win';
    } else {
      if (rollValue > 100 - crit) verdict = 'epicfail';
      else verdict = 'fail';
    }

    // risk on failure
    wounded = false; dead = false; riskRoll = 0;
    if (verdict === 'fail' || verdict === 'epicfail') {
      riskRoll = rnd();
      if (riskRoll <= Math.max(0, cfg.dead | 0) || verdict === 'epicfail') dead = riskRoll <= Math.max(1, cfg.dead | 0);
      if (!dead && riskRoll <= Math.max(0, cfg.wound | 0)) wounded = true;
    }

    // pointer target angle: roll mapped clockwise from top
    targetAngle = TOP + (rollValue / 100) * TAU;
  }

  function setState(next: string) {
    if (state === next) return;
    state = next;
    root.setAttribute('data-da2-state', next);
    opts.onState?.(next);
    if (next === 'action-trigger') opts.onArmed?.(true);
    if (next === 'threat-slam') spawnShards(10);
  }

  function spawnShards(n: number) {
    for (let i = 0; i < n; i++) {
      shards.push({
        a: Math.random() * TAU,
        d: R * 0.12,
        vd: R * (0.010 + Math.random() * 0.020),
        life: 0, max: 40 + Math.random() * 30,
        size: 3 + Math.random() * 6,
      });
    }
  }

  function launchRoll() {
    decideOutcome();
    resolved = false; gateReleased = false; snapFired = false; shards = [];
    phaseIdx = 0;
    phaseStart = now();
    opts.onArmed?.(false);
    setState('ring-lock');
  }
  function throwBall() {
    if (state === 'ring-lock' || state === 'threat-slam' || state === 'agency-burst') {
      // warp to the gate then release
      phaseIdx = TIMELINE.findIndex((p) => p.name === 'action-trigger');
      gateReleased = true;
      phaseStart = now();
      setState('action-trigger');
      return;
    }
    if (state === 'action-trigger') gateReleased = true;
  }

  const now = () => performance.now();

  /* ── timeline tick ────────────────────────────────────────────────────── */
  function tick(t: number) {
    if (phaseIdx < 0) return;
    const ph = TIMELINE[phaseIdx];
    if (ph.name !== state && !(ph.gate && state === 'action-trigger')) setState(ph.name);
    const el = t - phaseStart;

    if (ph.gate) {
      if (state !== 'action-trigger') setState('action-trigger');
      if (gateReleased) { opts.onArmed?.(false); phaseIdx++; phaseStart = t; setState(TIMELINE[phaseIdx].name); }
      return;
    }
    if (ph.name === 'magnetic-snap' && !snapFired) { snapFired = true; opts.onSnap?.(); }
    if (ph.name === 'resolution' && !resolved) {
      resolved = true;
      const s = skills[skillIndex] || { name: 'Skill', stat: 60, difficulty: 50 };
      opts.onResolve?.({
        verdict, roll: rollValue, riskRoll, skillIndex, skillName: s.name,
        wounded, dead, tst, delta: tst - rollValue,
      });
    }
    if (el >= ph.dur && phaseIdx < TIMELINE.length - 1) {
      phaseIdx++;
      phaseStart = t;
      setState(TIMELINE[phaseIdx].name);
    }
  }

  /* ── phase progress helpers ───────────────────────────────────────────── */
  function phaseProg(name: string, t: number): number {
    const idx = TIMELINE.findIndex((p) => p.name === name);
    if (phaseIdx < idx) return 0;
    if (phaseIdx > idx) return 1;
    const ph = TIMELINE[idx];
    return clamp01((t - phaseStart) / Math.max(1, ph.dur));
  }
  const reached = (name: string) => phaseIdx >= TIMELINE.findIndex((p) => p.name === name);

  /* ── drawing ──────────────────────────────────────────────────────────── */
  function draw(t: number) {
    ctx.clearRect(0, 0, W, H);

    const slamP = phaseProg('threat-slam', t);
    const burstP = phaseProg('agency-burst', t);
    const spinP = phaseProg('the-spin', t);
    const snapP = phaseProg('magnetic-snap', t);
    const isResolved = reached('resolution');
    const success = verdict === 'bigwin' || verdict === 'win' || verdict === 'almost';

    drawBackdrop(t, isResolved, success);
    drawDial(burstP);
    drawSafeGlow(t, burstP);
    drawCrystal(t, slamP, snapP, isResolved, success);
    drawShards();
    drawNeedles(t, burstP);
    // pointer sweep
    if (reached('the-spin')) drawPointer(spinP);
  }

  function drawBackdrop(t: number, isResolved: boolean, success: boolean) {
    ctx.save();
    // obsidian base
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.15);
    bg.addColorStop(0, mix(palette.obsidian, palette.azure, 0.05));
    bg.addColorStop(1, palette.obsidian);
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, TAU); ctx.fill();

    // azure light-leak from top-left (V9 signature)
    const leak = ctx.createRadialGradient(cx - R * 0.7, cy - R * 0.7, 0, cx - R * 0.7, cy - R * 0.7, R * 1.4);
    leak.addColorStop(0, rgba(palette.azure, 0.16));
    leak.addColorStop(0.5, rgba(palette.azure, 0.03));
    leak.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = leak;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, TAU); ctx.fill();

    // parallax starfield (3 depth layers, tilt with pointer)
    ctx.globalCompositeOperation = 'lighter';
    for (const s of stars) {
      const depth = [0.35, 0.6, 1.0][s.layer];
      const px = cx + s.x * R * 0.95 + mx * 10 * depth;
      const py = cy + s.y * R * 0.95 + my * 10 * depth;
      const d = Math.hypot(px - cx, py - cy);
      if (d > R) continue;
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.sp + s.ph));
      const col = s.layer === 2 ? palette.warmGold : palette.azure;
      ctx.fillStyle = rgba(col, tw * (s.layer === 2 ? 0.9 : 0.5));
      ctx.beginPath(); ctx.arc(px, py, s.r * dpr, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    // lens vignette — inner rim refraction, sells the "inside a mechanism" feel
    ctx.save();
    const vig = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.08);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.82, 'rgba(0,0,0,0)');
    vig.addColorStop(1, rgba(palette.obsidian, 0.95));
    ctx.fillStyle = vig;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.1, 0, TAU); ctx.fill();
    // gold refraction ring on the inner bezel
    ctx.lineWidth = 2 * dpr;
    ctx.strokeStyle = rgba(palette.gold, 0.25);
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.02, 0, TAU); ctx.stroke();
    ctx.restore();

    // resolution wash: success = azure/gold bloom, fail = cool dim (NO piss filter)
    if (isResolved) {
      ctx.save();
      if (success) {
        const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        gl.addColorStop(0, rgba(palette.warmGold, 0.10));
        gl.addColorStop(0.5, rgba(palette.azure, 0.05));
        gl.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gl;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      } else {
        const dm = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 1.1);
        dm.addColorStop(0, 'rgba(0,0,0,0)');
        dm.addColorStop(1, rgba(mix(palette.obsidian, palette.danger, 0.15), 0.75));
        ctx.fillStyle = dm;
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.1, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  // The threshold dial: safe arc (gold/success) + fail arc (danger). The star of anticipation.
  function drawDial(burstP: number) {
    const appear = easeOutCubic(burstP);
    if (appear <= 0.001) return;
    const rDial = R * 0.9;
    ctx.save();
    ctx.globalAlpha = appear;

    // track
    ctx.lineWidth = R * 0.055;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = rgba(palette.obsidian, 0.9);
    ctx.beginPath(); ctx.arc(cx, cy, rDial, 0, TAU); ctx.stroke();

    const safeSpan = (tst / 100) * TAU;
    const safeEnd = TOP + safeSpan;

    // fail arc (danger, warm orange)
    ctx.strokeStyle = rgba(palette.danger, 0.7);
    ctx.beginPath(); ctx.arc(cx, cy, rDial, safeEnd, TOP + TAU, false); ctx.stroke();
    // safe arc (gold → success green gradient feel via gold, lit)
    ctx.strokeStyle = rgba(palette.gold, 0.92);
    ctx.beginPath(); ctx.arc(cx, cy, rDial, TOP, safeEnd, false); ctx.stroke();
    // safe arc inner sheen
    ctx.lineWidth = R * 0.02;
    ctx.strokeStyle = rgba(palette.warmGold, 0.6);
    ctx.beginPath(); ctx.arc(cx, cy, rDial - R * 0.017, TOP, safeEnd, false); ctx.stroke();

    // boundary marker between safe & fail (the line the player sweats over)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(safeEnd);
    ctx.strokeStyle = rgba(palette.ivory, 0.85);
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(rDial - R * 0.05, 0); ctx.lineTo(rDial + R * 0.05, 0); ctx.stroke();
    ctx.restore();

    // degree ticks (mechanical quadrant)
    ctx.strokeStyle = rgba(palette.gold, 0.35);
    ctx.lineWidth = 1 * dpr;
    for (let i = 0; i < 100; i += 2) {
      const a = TOP + (i / 100) * TAU;
      const big = i % 10 === 0;
      const r1 = rDial + R * 0.032;
      const r2 = rDial + R * (big ? 0.06 : 0.045);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // soft luminous "safe" field behind the safe sector — sober, replaces blinding ivory star
  function drawSafeGlow(t: number, burstP: number) {
    const appear = easeOutCubic(burstP);
    if (appear <= 0.02) return;
    const safeEnd = TOP + (tst / 100) * TAU;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = appear * (0.5 + 0.2 * Math.sin(t * 0.003));
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R * 0.86, TOP, safeEnd, false);
    ctx.closePath();
    const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.86);
    gl.addColorStop(0, rgba(palette.warmGold, 0.10));
    gl.addColorStop(0.7, rgba(palette.gold, 0.06));
    gl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gl;
    ctx.fill();
    ctx.restore();
  }

  // Faceted obsidian crystal — its radius encodes the FAILURE frontier.
  function drawCrystal(t: number, slamP: number, snapP: number, isResolved: boolean, success: boolean) {
    const slam = easeOutBack(clamp01(slamP));
    if (slam <= 0.001) return;
    // radius grows with failure fraction (harder check = bigger, more menacing crystal)
    const failFrac = 1 - tst / 100;
    const baseR = R * (0.16 + 0.22 * failFrac);
    const breathe = 1 + 0.03 * Math.sin(t * 0.004);
    let scale = (0.6 + 0.4 * slam) * breathe;
    // reaction on snap
    if (isResolved) {
      scale *= success ? (1 - 0.35 * easeOutCubic(snapP)) : (1 + 0.15 * easeOutCubic(snapP));
    }
    const rad = baseR * scale;
    const spin = t * 0.00016;

    const verts = 7;
    const pts: [number, number][] = [];
    for (let i = 0; i < verts; i++) {
      const a = spin + (i / verts) * TAU;
      const wob = 0.86 + 0.14 * Math.sin(a * 3 + t * 0.002);
      pts.push([cx + Math.cos(a) * rad * wob, cy + Math.sin(a) * rad * wob]);
    }

    ctx.save();
    // ambient shadow / danger halo
    const halo = ctx.createRadialGradient(cx, cy, rad * 0.3, cx, cy, rad * 1.7);
    const haloCol = isResolved && !success ? palette.danger : palette.azure;
    halo.addColorStop(0, rgba(haloCol, isResolved && !success ? 0.30 : 0.18));
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, rad * 1.7, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // facets: each triangle center→edge, shaded by facing the top-left light
    for (let i = 0; i < verts; i++) {
      const p1 = pts[i], p2 = pts[(i + 1) % verts];
      const mxp = (p1[0] + p2[0]) / 2, myp = (p1[1] + p2[1]) / 2;
      // light from top-left
      const nx = mxp - cx, ny = myp - cy;
      const nl = Math.hypot(nx, ny) || 1;
      const light = clamp01(0.5 - (nx / nl) * 0.5 - (ny / nl) * 0.5);
      const face = mix(palette.obsidian, mix(palette.azure, palette.gold, 0.4), 0.10 + light * 0.35);
      const g = ctx.createLinearGradient(cx, cy, mxp, myp);
      g.addColorStop(0, mix(palette.obsidian, '#000000', 0.3));
      g.addColorStop(1, face);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.closePath();
      ctx.fill();
      // facet edge — catches gold/azure rim light
      ctx.strokeStyle = rgba(light > 0.5 ? palette.warmGold : palette.azure, 0.35 + light * 0.4);
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    }
    // bright core spark
    const core = ctx.createRadialGradient(cx - rad * 0.15, cy - rad * 0.15, 0, cx, cy, rad * 0.5);
    core.addColorStop(0, rgba(isResolved && !success ? palette.danger : palette.azure, 0.5));
    core.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(cx, cy, rad * 0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawShards() {
    if (!shards.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    shards = shards.filter((s) => s.life < s.max);
    for (const s of shards) {
      s.life++; s.d += s.vd; s.vd *= 0.97;
      const a = 1 - s.life / s.max;
      const x = cx + Math.cos(s.a) * s.d, y = cy + Math.sin(s.a) * s.d;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(s.a);
      ctx.fillStyle = rgba(palette.azure, a * 0.8);
      ctx.beginPath();
      ctx.moveTo(-s.size, 0); ctx.lineTo(0, -s.size * 0.5); ctx.lineTo(s.size, 0); ctx.lineTo(0, s.size * 0.5);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // slim celestial/compass needles marking stat points, in gold
  function drawNeedles(t: number, burstP: number) {
    const rise = easeOutCubic(burstP);
    if (rise <= 0.01) return;
    const n = needleCount();
    const rTip = R * 0.82;
    const len = R * 0.3 * rise;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const a = TOP + (i / n) * TAU + Math.PI / n; // offset so they don't sit on the boundary marker
      const bx = cx + Math.cos(a) * rTip;
      const by = cy + Math.sin(a) * rTip;
      const tx = cx + Math.cos(a) * (rTip - len);
      const ty = cy + Math.sin(a) * (rTip - len);
      // shaft
      ctx.strokeStyle = rgba(palette.gold, 0.55 * rise);
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      // diamond tip (compass-point)
      const perp = a + Math.PI / 2;
      const w = 4 * dpr;
      ctx.fillStyle = rgba(palette.warmGold, 0.9 * rise);
      ctx.beginPath();
      ctx.moveTo(tx + Math.cos(a) * -6, ty + Math.sin(a) * -6);
      ctx.lineTo(tx + Math.cos(perp) * w, ty + Math.sin(perp) * w);
      ctx.lineTo(tx + Math.cos(a) * 6, ty + Math.sin(a) * 6);
      ctx.lineTo(tx - Math.cos(perp) * w, ty - Math.sin(perp) * w);
      ctx.closePath(); ctx.fill();
      // tip glow
      ctx.fillStyle = rgba(palette.warmGold, 0.25 * rise);
      ctx.beginPath(); ctx.arc(tx, ty, 6 * dpr, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // decelerating pointer sweeping the dial — the near-miss climax
  function drawPointer(spinP: number) {
    const rDial = R * 0.9;
    const startA = TOP;
    const spins = 2;
    // total travel: full spins + delta to target (normalized forward)
    let delta = (targetAngle - startA) % TAU; if (delta < 0) delta += TAU;
    const total = spins * TAU + delta;
    let ang: number;
    if (reached('magnetic-snap')) {
      ang = targetAngle;
    } else {
      const e = easeSpin(spinP);
      // damped wobble that vanishes at the end (near-miss flirt with the line)
      const wob = (1 - e) * 0.06 * Math.sin(spinP * 26);
      ang = startA + e * total + wob;
    }

    const tipR = rDial + R * 0.03;
    const tailR = R * 0.5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    // motion-blur trail
    if (!reached('magnetic-snap')) {
      ctx.strokeStyle = rgba(palette.warmGold, 0.12);
      ctx.lineWidth = 4 * dpr;
      ctx.beginPath(); ctx.arc(0, 0, tipR, -0.5, 0, false); ctx.stroke();
    }
    // needle
    const grad = ctx.createLinearGradient(tailR, 0, tipR, 0);
    grad.addColorStop(0, rgba(palette.gold, 0.2));
    grad.addColorStop(1, palette.warmGold);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(tailR, 0);
    ctx.lineTo(tipR - 6, -3 * dpr);
    ctx.lineTo(tipR, 0);
    ctx.lineTo(tipR - 6, 3 * dpr);
    ctx.closePath(); ctx.fill();
    // glowing tip spark
    ctx.globalCompositeOperation = 'lighter';
    const spark = ctx.createRadialGradient(tipR, 0, 0, tipR, 0, R * 0.06);
    spark.addColorStop(0, rgba(palette.warmGold, 0.9));
    spark.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spark;
    ctx.beginPath(); ctx.arc(tipR, 0, R * 0.06, 0, TAU); ctx.fill();
    ctx.restore();

    // hub
    ctx.save();
    const hub = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.05);
    hub.addColorStop(0, palette.warmGold);
    hub.addColorStop(1, mix(palette.gold, palette.obsidian, 0.5));
    ctx.fillStyle = hub;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.045, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(palette.warmGold, 0.6);
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.045, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  /* ── main loop ────────────────────────────────────────────────────────── */
  let rafId = 0;
  function frame() {
    const t = now();
    tick(t);
    draw(t);
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  /* ── public handle ────────────────────────────────────────────────────── */
  function setConfig(newSkills?: AstrolabeSkill[], newConfig?: AstrolabeConfig) {
    if (newSkills) skills = newSkills.slice();
    if (newConfig) Object.assign(cfg, newConfig);
    palette = readPalette(root);
  }
  function destroy() {
    cancelAnimationFrame(rafId);
    ro.disconnect();
    root.removeEventListener('pointermove', onPointer);
    if (canvas.parentElement === root) root.removeChild(canvas);
  }
  return { roll: launchRoll, throw: throwBall, setConfig, destroy };
}
