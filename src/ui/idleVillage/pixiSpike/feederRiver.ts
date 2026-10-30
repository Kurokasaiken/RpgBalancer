import { Graphics } from 'pixi.js';

/**
 * The water chain of the north (Director 2026-10-30): snow-melt streams -> the small fall -> the alpine lake -> the
 * big waterfall. The painting has them frozen; this animates them with the same idiom as the rest of the map
 * (pale painted-looking streaks carried along the real channels, no blur, no filters):
 *  - meltwater streams: thin pale dashes flowing down the channels, quicker where the slope is steeper,
 *  - the small fall: short vertical bright dashes + a soft foam breath at its foot,
 *  - inflow rings where it enters the lake, and a faint drift across the lake toward the outlet (the head of the
 *    big waterfall, which has its own animation).
 * Paths are traced on the painting (world px). Deterministic: no random; everything is a function of simT (frames).
 */

type Pt = [number, number];


export const FEEDER_PATHS = {
  /** East snow-melt stream: follows the white water down-left to the head of the small fall (traced at 7x zoom). */
  eastStream: [[1496, 192], [1474, 213], [1452, 229], [1432, 239], [1410, 244], [1391, 248], [1374, 245], [1370, 243]] as Pt[],
  /** West snow-melt stream. */
  westStream: [[1347, 211], [1352, 224], [1364, 236], [1370, 242]] as Pt[],
  /** The small fall into the lake (steep: fast). */
  smallFall: [[1369, 246], [1366.5, 258], [1368.5, 273], [1373, 284], [1376, 291]] as Pt[],
  /** Across the lake, from the inflow to the outlet above the big waterfall. */
  lakeDrift: [[1372, 293], [1360, 322], [1352, 346], [1340, 370]] as Pt[],
};

/** Inflow point of the small fall into the lake. */
export const LAKE_INFLOW: Pt = [1372, 292];

function lengths(pts: Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < pts.length; i += 1) out.push(out[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return out;
}

/** Point and unit tangent at arc-length fraction `u` (0..1) along a polyline. */
export function along(pts: Pt[], cum: number[], u: number): { x: number; y: number; tx: number; ty: number } {
  const total = cum[cum.length - 1];
  const d = Math.min(Math.max(u, 0), 1) * total;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i += 1;
  const seg = cum[i] - cum[i - 1] || 1;
  const k = (d - cum[i - 1]) / seg;
  const [x0, y0] = pts[i - 1];
  const [x1, y1] = pts[i];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const m = Math.hypot(dx, dy) || 1;
  return { x: x0 + dx * k, y: y0 + dy * k, tx: dx / m, ty: dy / m };
}

export interface FeederRiver {
  g: Graphics;
  tick: (simT: number, amount: number, opacity: number, reduced: boolean) => void;
}

interface Chan {
  pts: Pt[];
  cum: number[];
  dashes: number;
  /** progress per frame */
  speed: number;
  len: number;
  width: number;
  color: number;
  alpha: number;
}

export function createFeederRiver(wsx: number, wsy: number): FeederRiver {
  const g = new Graphics();
  g.label = 'feeder-river';
  const mk = (pts: Pt[], dashes: number, perSecond: number, len: number, width: number, color: number, alpha: number): Chan => ({
    pts,
    cum: lengths(pts),
    dashes,
    speed: perSecond / 60,
    len,
    width,
    color,
    alpha,
  });
  const chans: Chan[] = [
    // Director 2026-10-30: animate ONLY the white sliver that touches the lake; nothing else along the streams.
    mk(FEEDER_PATHS.smallFall, 9, 0.42, 5, 1.3, 0xffffff, 0.8),
  ];

  const tick = (simT: number, amount: number, opacity: number, reduced: boolean) => {
    g.clear();
    g.visible = amount > 0.01;
    if (!g.visible) return;
    const a0 = Math.min(1, opacity * 1.6 * amount);
    for (const c of chans) {
      const total = c.cum[c.cum.length - 1];
      for (let i = 0; i < c.dashes; i += 1) {
        const base = i / c.dashes;
        const u = reduced ? base : (base + simT * c.speed) % 1;
        const head = along(c.pts, c.cum, u);
        const tail = along(c.pts, c.cum, Math.max(0, u - c.len / total));
        // fade in at the source, out at the end of the channel (smooth, no pop)
        const env = Math.min(1, u / 0.12) * Math.min(1, (1 - u) / 0.12);
        // a little lateral shimmer so it reads as water, not a conveyor
        const sh = reduced ? 0 : Math.sin(simT * 0.05 + i * 2.1) * 0.5;
        g.moveTo((tail.x - head.ty * sh) * wsx, (tail.y + head.tx * sh) * wsy);
        g.lineTo((head.x - head.ty * sh) * wsx, (head.y + head.tx * sh) * wsy);
        g.moveTo((tail.x - head.ty * sh) * wsx, (tail.y + head.tx * sh) * wsy);
        g.lineTo((head.x - head.ty * sh) * wsx, (head.y + head.tx * sh) * wsy);
        g.stroke({ width: c.width * wsx, color: c.color, alpha: c.alpha * a0 * env * (reduced ? 0.8 : 0.55 + 0.45 * Math.sin(simT * 0.09 + i * 1.7)) , cap: 'round' });
      }
    }
    const [ix, iy] = LAKE_INFLOW;
    // foam breath at the foot of the small fall
    const breath = reduced ? 0.6 : 0.55 + 0.25 * Math.sin(simT * 0.03);
    g.ellipse(ix * wsx, (iy - 1) * wsy, 5.5 * wsx, 2.4 * wsy);
    g.fill({ color: 0xf2fcff, alpha: 0.4 * a0 * breath });
  };

  return { g, tick };
}
