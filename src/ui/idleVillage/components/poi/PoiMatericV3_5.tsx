import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { POI_FAMILY_METAL } from './poiSigilloFamilies';
import { useTranslation } from '@/localization/useTranslation';
import { getDefaultPoiColors } from '@/balancing/config/idleVillage/poiColorConfig';
import { POI_MATERIC_V4_TOKENS } from '@/balancing/config/idleVillage/poiMatericV4Tokens';
import { BASE_SKIN_CSS_VARS } from '@/ui/idleVillage/skins/skinCssVariables';
import type { PoiMarkerProps } from './PoiMarker';

export interface PoiMatericV3_5Props extends PoiMarkerProps {
  portraitUrl?: string;
  isDragging?: boolean;
  /** Painted glyph for the medallion's centre (replaces the default cross); one per POI family. */
  iconUrl?: string;
  /** PLAN-058 Sigillo (map markers): no glass, no specular, no gem; neutral bronze rim, lacquer field, double border. Off elsewhere. */
  sigillo?: boolean;
  /** Sigillo only: the run has ended and awaits the player — the halo pulses slowly (period `--skin-poi-pulse-period`) until they act. Static light under reduced motion. */
  pulse?: boolean;
  /** Sigillo only: visual-fork overrides for the B4-map comparison (PLAN-043-S11).
   *  Inert by default — omit it and the seal renders exactly the production palette and the round halo. */
  sigilloTheme?: PoiSigilloTheme;
  cursorVelocity?: { x: number; y: number } | null;
  'data-testid'?: string;
}

/** Optional sigillo overrides (PLAN-043-S11 B4-map visual fork): every field is a
 *  delta over the canonical sigillo palette — production callers pass nothing and
 *  get the identical seal. Used by lab/fork surfaces to audition candidates. */
export interface PoiSigilloTheme {
  /** Rim gradient stops [light, mid, dark] — overrides the shared brass ramp. */
  rimColors?: readonly [string, string, string];
  /** Field gradient stops [light, deep] — overrides the shared stone pair. */
  stoneColors?: readonly [string, string];
  /** Inner border colour and width — overrides the ivory inner edge. */
  borderInner?: string;
  borderInnerPx?: number;
  /** Draw the countdown on the silhouette edge (pathLength progress stroke)
   *  instead of the round magic circle. */
  haloFollowsSilhouette?: boolean;
}

/** Sigillo palette (PLAN-043 WS-5): the rim reads the HUD brass ramp and the
 *  field stone the `--skin-poi-stone-*` tokens — the same bronze and lacquer
 *  for every family (the family is read from the silhouette and glyph, not
 *  from a hue). Channels derive from brass-crest so a palette retune follows. */
const [SIGILLO_BRASS_R, SIGILLO_BRASS_G, SIGILLO_BRASS_B] = (BASE_SKIN_CSS_VARS['--skin-hud-brass-crest'] ?? '#d8bd78')
  .match(/\w\w/g)!
  .map((h) => parseInt(h, 16)) as [number, number, number];
const SIGILLO_COLORS = {
  coronaCore: { r: SIGILLO_BRASS_R, g: SIGILLO_BRASS_G, b: SIGILLO_BRASS_B },
  coronaGlow: { r: 160, g: 118, b: 47 },
  rimColors: [
    BASE_SKIN_CSS_VARS['--skin-hud-brass-crest'] ?? '#d8bd78',
    BASE_SKIN_CSS_VARS['--skin-hud-brass-low'] ?? '#a0762f',
    BASE_SKIN_CSS_VARS['--skin-hud-brass-base'] ?? '#5f3f16',
  ],
  stoneColors: [
    BASE_SKIN_CSS_VARS['--skin-poi-stone-light'] ?? '#173436',
    BASE_SKIN_CSS_VARS['--skin-poi-stone-deep'] ?? '#0a1b1c',
  ],
  stoneAmbient: `rgba(${SIGILLO_BRASS_R},${SIGILLO_BRASS_G},${SIGILLO_BRASS_B},.16)`,
  pinColor: `rgba(${SIGILLO_BRASS_R},${SIGILLO_BRASS_G},${SIGILLO_BRASS_B},.72)`,
} as const;

const SIGILLO_BORDER_OUTER = BASE_SKIN_CSS_VARS['--skin-poi-border-outer'] ?? '#0b0a08';
const SIGILLO_BORDER_INNER = BASE_SKIN_CSS_VARS['--skin-poi-border-inner'] ?? '#efe3c6';
/** Border widths in screen px (the vector-effect keeps them identical at S, M and L). */
const SIGILLO_BORDER_OUTER_PX = parseFloat(BASE_SKIN_CSS_VARS['--skin-poi-border-outer-width'] ?? '2');
const SIGILLO_BORDER_INNER_PX = parseFloat(BASE_SKIN_CSS_VARS['--skin-poi-border-inner-width'] ?? '1.5');
/** Halo tones: ivory = the deadline draining, verdigris = work filling, vermilion = urgency only. */
const SIGILLO_HALO_DEADLINE = BASE_SKIN_CSS_VARS['--skin-poi-halo-deadline'] ?? '#ead9b0';
const SIGILLO_HALO_WORK = BASE_SKIN_CSS_VARS['--skin-poi-halo-work'] ?? '#6fc4a4';
const SIGILLO_URGENT = BASE_SKIN_CSS_VARS['--skin-poi-urgent'] ?? '#e8553a';

/**
 * Silhouette = family (poi_family_spec §Anatomy): round with a tail = enterprise (`quest`),
 * tile = work (`job`), diamond = threat (`event`). `outer` is the dark border path, `inner` the
 * ivory one (inset ~2.7 units); `scale` shrinks the circular medallion to the largest circle the
 * silhouette holds, so every shape stays inside the seal's rails (r >= 45). The tail replaces the gem.
 */
const SIGILLO_SILHOUETTES = {
  quest: {
    scale: 1,
    outer: 'M28.3 83.4 L43 97 L57.7 83.4 A43 43 0 1 0 28.3 83.4 Z',
    inner: 'M29.2 80.9 L43 93 L56.8 80.9 A40.3 40.3 0 1 0 29.2 80.9 Z',
  },
  job: {
    scale: 0.785,
    outer: 'M19 10 H67 A9 9 0 0 1 76 19 V67 A9 9 0 0 1 67 76 H19 A9 9 0 0 1 10 67 V19 A9 9 0 0 1 19 10 Z',
    inner: 'M19 12.7 H67 A6.3 6.3 0 0 1 73.3 19 V67 A6.3 6.3 0 0 1 67 73.3 H19 A6.3 6.3 0 0 1 12.7 67 V19 A6.3 6.3 0 0 1 19 12.7 Z',
  },
  event: {
    scale: 0.7,
    outer: 'M43 0 L86 43 L43 86 L0 43 Z',
    inner: 'M43 3.8 L82.2 43 L43 82.2 L3.8 43 Z',
  },
} as const;

/** Mix a #rrggbb colour toward white — the crisp core of a halo is a lighter shade of its tone. */
function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, '0')).join('')}`;
}

/** One heraldic arm, repeated by rotation into a cross fleury. */
const CROSS_ARM =
  'M-3 -5 L-3 -17 L-6.4 -21 L-3.4 -22.2 L0 -18.4 L3.4 -22.2 L6.4 -21 L3 -17 L3 -5 Z';

/** Inscription vocabulary — Maou Gakuin-inspired magical script. */
const LETTERS: string[] = [
  'M -1.2,-5 L -1.2,5 M -1.2,-1.8 Q 2,-2.8 2,-0.5 Q 2,1.5 -1.2,0.8',
  'M -1.5,-5 L -1.5,5 M -1.5,-2.2 Q 1.5,-2.2 1.5,0.2 Q 1.5,2 -0.8,2.8 M 1.8,3.2 A 0.9 0.9 0 1 1 1.8 4.9 A 0.9 0.9 0 1 1 1.8 3.2',
  'M -3,-5 L -3,5 M 3,-5 L 3,5 M -3,-3 Q 0,-5.2 3,-3',
  'M 0,-2.2 A 2 2 0 1 1 0 1.8 A 2 2 0 1 1 0 -2.2 M -1.6,0.6 Q -2.2,2.8 -2.8,4.5 M 1.6,0.6 Q 2.2,2.8 2.8,4.5',
  'M -2.8,-4.5 Q -0.8,-1.5 1.2,-2.5 Q 3.2,-3.5 2.8,-0.5 Q 2.4,2.5 -1.2,2.5 Q -3.2,2.5 -2.8,4.5',
  'M -0.5,2 L -0.5,5 M 0,-2 A 2.2 2.2 0 1 1 -0.1 -2 M -0.5,1.6 Q -2,0.5 -2,-1.5',
  'M -3,-4.5 L 3,-4.5 M 0,-4.5 L 0,5 M 0,0 Q 2,0.5 2,2.5',
  'M -3,-4 L 3,-4 Q 3.6,0 0,2 Q -3.6,4 -3,0.5 Q -2.6,-2.5 0,-2.5',
  'M -3,-5 Q 0,-1 3,-5 M -3,0 Q 0,3 3,0 M -3,0 L 3,0',
  'M -3,-5 Q 0,-2 3,0 Q 0,2 -3,5',
  'M -2.5,-5 L 2.5,5 M 2.5,-5 L -2.5,5 M -1.2,-2 A 0.8 0.8 0 1 1 -1.2 -0.4 A 0.8 0.8 0 1 1 -1.2 -2',
  'M -2.2,-1.5 L 2.2,-1.5 Q 2.2,3.5 0,3.5 Q -2.2,3.5 -2.2,-1.5 M -1,-4.2 A 0.7 0.7 0 1 1 -1 -2.8 A 0.7 0.7 0 1 1 -1 -4.2 M 1,-4.2 A 0.7 0.7 0 1 1 1 -2.8 A 0.7 0.7 0 1 1 1 -4.2',
];
const RIM_LETTER_COUNT = 24;

/** Warn accent of the deadline countdown — the skin's `--skin-status-unmet` token. */
const WARN_ACCENT = BASE_SKIN_CSS_VARS['--skin-status-unmet'] ?? '#d98a4a';
/** Lightened shade of the warn accent for the crisp letter core (keeps the countdown readable). */
const WARN_ACCENT_LIGHT = '#ffe1b8';

const T4 = POI_MATERIC_V4_TOKENS;

const WAKE_STEPS = [0, 0.35, 0.62, 0.82, 0.94];

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Split a hex colour into the 0..1 channels an feColorMatrix expects. */
function channels(hex: string): [string, string, string] {
  const n = parseInt(hex.slice(1), 16);
  return [
    (((n >> 16) & 255) / 255).toFixed(3),
    (((n >> 8) & 255) / 255).toFixed(3),
    ((n & 255) / 255).toFixed(3),
  ];
}

/** -1 writes counter-clockwise from twelve o'clock, +1 clockwise. */
type Sweep = -1 | 1;

interface SealLetter {
  d: string;
  angle: number;
  x: number;
  y: number;
  /** 0 at the liquid front, growing as the letter settles behind it. */
  age: number;
}

function sealPoint(radius: number, fraction: number, sweep: Sweep): [number, number] {
  const { center } = T4.geometry;
  const rad = ((-90 + sweep * Math.min(fraction, 0.999) * 360) * Math.PI) / 180;
  return [center + radius * Math.cos(rad), center + radius * Math.sin(rad)];
}

function sealArcSpan(radius: number, from: number, to: number, sweep: Sweep): string {
  const [x1, y1] = sealPoint(radius, from, sweep);
  const [x2, y2] = sealPoint(radius, to, sweep);
  const large = (Math.min(to, 0.999) - from) * 360 > 180 ? 1 : 0;
  const flag = sweep > 0 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${large} ${flag} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function sealArcPath(radius: number, written: number, sweep: Sweep): string {
  return sealArcSpan(radius, 0, written, sweep);
}

function buildBand(radius: number, half: boolean, written: number, sweep: Sweep): SealLetter[] {
  const { center } = T4.geometry;
  const step = 360 / T4.seal.letterCount;
  const out: SealLetter[] = [];
  for (let i = 0; i < T4.seal.letterCount; i++) {
    const age = written - i;
    if (age <= 0) break;
    const angle = -90 + sweep * (i + (half ? 0.5 : 0)) * step;
    const rad = (angle * Math.PI) / 180;
    out.push({
      d: LETTERS[i % LETTERS.length],
      angle,
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
      age,
    });
  }
  return out;
}

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

/** Convert a hex colour to an 'r,g,b' string for rgba construction. */
function hexToRgb(hex: string) {
  const n = parseInt(hex.replace(/^#/, ''), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** Random visual wear for one medallion instance. Tints are taken from the type's base palette. */
function generateImperfections(base: {
  patina: string;
  scratchLight: string;
  scratchDark: string;
}) {
  const patinaSpots: { cx: number; cy: number; r: number; opacity: number; color: string }[] = [];
  const scratches: { x1: number; y1: number; x2: number; y2: number; width: number; opacity: number; color: string }[] = [];

  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 36 + Math.random() * 5; // ring band, outside the field stone
    const cx = 43 + dist * Math.cos(angle);
    const cy = 43 + dist * Math.sin(angle);
    const r = 1.4 + Math.random() * 4.2;
    const opacity = 0.18 + Math.random() * 0.24;
    patinaSpots.push({ cx, cy, r, opacity, color: `rgba(${base.patina},${opacity.toFixed(2)})` });
  }

  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 35 + Math.random() * 5;
    const cx = 43 + dist * Math.cos(angle);
    const cy = 43 + dist * Math.sin(angle);
    const length = 4 + Math.random() * 9;
    const dir = angle + (Math.random() - 0.5) * 0.6;
    const x1 = cx - (length / 2) * Math.cos(dir);
    const y1 = cy - (length / 2) * Math.sin(dir);
    const x2 = cx + (length / 2) * Math.cos(dir);
    const y2 = cy + (length / 2) * Math.sin(dir);
    const width = 0.7 + Math.random() * 0.9;
    const opacity = 0.1 + Math.random() * 0.14;
    const c = Math.random() > 0.4 ? base.scratchLight : base.scratchDark;
    scratches.push({ x1, y1, x2, y2, width, opacity, color: `rgba(${c},${opacity.toFixed(2)})` });
  }

  return { patinaSpots, scratches };
}

const PoiMatericV3_5Inner: React.FC<PoiMatericV3_5Props> = ({
  type,
  iconUrl,
  sigillo = false,
  sigilloTheme,
  pulse = false,
  state = 'available',
  progress = 1,
  timerDirection = 'counterclockwise',
  isDragging = false,
  size: sizePx = 112,
  className = '',
  style,
  onClick,
  onPointerEnter,
  onPointerLeave,
  cursorVelocity = null,
  'data-testid': dataTestId,
}) => {
  const { t } = useTranslation('idleVillage');
  /** Explicit theme (lab/fork) wins; otherwise the family metal of the Sigillo. */
  const theme: PoiSigilloTheme | undefined = useMemo(() => sigilloTheme ?? (sigillo ? POI_FAMILY_METAL[type] : undefined), [sigilloTheme, sigillo, type]);
  const colors = useMemo(() => {
    if (!sigillo) return getDefaultPoiColors(type);
    if (!theme) return SIGILLO_COLORS;
    return {
      ...SIGILLO_COLORS,
      rimColors: (theme.rimColors ?? SIGILLO_COLORS.rimColors) as typeof SIGILLO_COLORS.rimColors,
      stoneColors: (theme.stoneColors ?? SIGILLO_COLORS.stoneColors) as typeof SIGILLO_COLORS.stoneColors,
    };
  }, [type, sigillo, theme]);
  const [ringLight, ringMid, ringDark] = colors.rimColors;
  const [stoneLight, stoneDark] = colors.stoneColors;
  const uid = useId();
  const gid = (id: string) => `${uid}-${id}`;
  const accent = 'rgb(240, 207, 106)';
  const { r, g: greenCh, b } = { r: 240, g: 207, b: 106 };
  const rgba = (a: number) => `rgba(${r}, ${greenCh}, ${b}, ${a})`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rimAngleTargetRef = useRef(0);
  const rimIntensityRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [highlight, setHighlight] = useState({ x: 0, y: 0 });
  const [rimLit, setRimLit] = useState(false);
  const [rimProgress, setRimProgress] = useState(0);
  const [burst, setBurst] = useState(0);
  const prevSealProgressRef = useRef(0);

  // Randomise wear per medallion instance so the matrix does not look cloned.
  const imperfections = useMemo(
    () =>
      generateImperfections({
        patina: hexToRgb(stoneDark),
        scratchLight: hexToRgb(ringMid),
        scratchDark: hexToRgb(ringDark),
      }),
    [stoneDark, ringMid, ringDark],
  );

  // One clockwise pass over the medallion rim glyphs, starting at 12 o'clock.
  useEffect(() => {
    if (!rimLit) {
      setRimProgress(0);
      return;
    }
    const start = performance.now();
    const duration = 1600;
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(1, (now - start) / duration);
      setRimProgress(next);
      if (next < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [rimLit]);

  const handlePointerEnter = () => {
    setRimLit(true);
    onPointerEnter?.();
  };
  const handlePointerLeave = () => {
    setRimLit(false);
    setHighlight({ x: 0, y: 0 });
    onPointerLeave?.();
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const node = containerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const rx = (e.clientX - rect.left - rect.width / 2) * (86 / rect.width) * 0.08;
    const ry = (e.clientY - rect.top - rect.height / 2) * (86 / rect.height) * 0.08;
    setHighlight({
      x: Math.max(-5, Math.min(5, rx)),
      y: Math.max(-5, Math.min(5, ry)),
    });
  };

  // Sigillo hover = a glitter, not a full lap of light: a few rim letters twinkle one after the other.
  const SPARKLES = [[3, 0], [14, 0.14], [8, 0.3], [20, 0.44], [11, 0.6]] as const;
  const SPARKLE_SPAN = 0.3;
  const sparkleAt = (t: number, i: number) => {
    let v = 0;
    for (const [idx, delay] of SPARKLES) {
      const x = (t - delay) / SPARKLE_SPAN;
      if (idx === i && x > 0 && x < 1) v = Math.max(v, Math.sin(Math.PI * x));
    }
    return v;
  };

  // Medallion rim script — engraved letters that light up on hover.
  const rimBand = useMemo(() => {
    const rimStep = 360 / RIM_LETTER_COUNT;
    const rimRadius = 38;
    const activeRim = Math.max(rimProgress, burst);
    const t = activeRim * RIM_LETTER_COUNT;
    let letterCursor = 0;
    return Array.from({ length: RIM_LETTER_COUNT }, (_, i) => {
      const a = -90 + i * rimStep;
      const rad = (a * Math.PI) / 180;
      const d = LETTERS[letterCursor++ % LETTERS.length];
      const dist = Math.abs(i - t);
      // At rest the sweep has not started: no letter is lit (not even the one at 12).
      const sparkle = sigillo && burst <= 0.001;
      const star = sparkle && activeRim > 0 ? sparkleAt(activeRim, i) : 0;
      const lit = sparkle ? star : activeRim <= 0 ? 0 : clamp(1.5 - 2 * dist);
      return {
        d,
        a,
        lit,
        star,
        x: 43 + rimRadius * Math.cos(rad),
        y: 43 + rimRadius * Math.sin(rad),
      };
    });
  }, [rimProgress, burst, sigillo]);

  // MAGIC CIRCLE: written by the passage of time.
  const isExpired = state === 'expired';
  /* `expiring` = the deadline countdown (poi_cooldown_spec): the seal reads in
   * the warn palette — amber instead of the medallion gold — and unwrites
   * counter-clockwise (the caller pairs it with `timerDirection`). */
  const isExpiring = state === 'expiring';
  const ccw = timerDirection === 'counterclockwise';
  const sweep: Sweep = ccw ? -1 : 1;
  const sealProgress = isExpired ? 0 : state === 'available' || state === 'new' ? 1 : clamp(progress);

  const geo = T4.geometry;
  const alloyMid = ringMid;
  /* Sigillo: the halo's tone says what the time is — ivory while a deadline drains, verdigris while work
   * fills, vermilion only once the deadline is urgent. Same direction/progress as always (view-model). */
  const sigilloTone = sigillo ? (isExpiring ? SIGILLO_URGENT : ccw ? SIGILLO_HALO_DEADLINE : SIGILLO_HALO_WORK) : null;
  const sealLight = sigilloTone ?? (isExpiring ? WARN_ACCENT : ringLight);
  const sealMid = sigilloTone ?? (isExpiring ? WARN_ACCENT : ringMid);
  const sealInk = sigilloTone ? lighten(sigilloTone, 0.55) : isExpiring ? WARN_ACCENT_LIGHT : T4.seal.coreInk;
  const [gr, gg, gb] = channels(sigilloTone ?? (isExpiring ? WARN_ACCENT : ringMid));
  const silhouette = sigillo ? SIGILLO_SILHOUETTES[type] : null;

  const upperBand = useMemo(
    () => buildBand(geo.sealUpperBand, false, sealProgress * T4.seal.letterCount, sweep),
    [geo.sealUpperBand, sealProgress, sweep],
  );
  const lowerBand = useMemo(
    () => buildBand(geo.sealLowerBand, true, sealProgress * T4.seal.letterCount, sweep),
    [geo.sealLowerBand, sealProgress, sweep],
  );

  const cardinals = useMemo(
    () =>
      T4.cardinals.fractions.map((fraction) => {
        const crossed = sealProgress - fraction;
        const [x, y] = sealPoint(T4.cardinals.radius, fraction, sweep);
        return {
          fraction,
          x,
          y,
          lit: clamp01(crossed / T4.cardinals.riseSpan),
          flare: crossed >= 0 ? clamp01(1 - crossed / T4.cardinals.flareSpan) : 0,
        };
      }),
    [sealProgress, sweep],
  );

  const headPoint = useMemo(() => {
    const [x, y] = sealPoint((geo.sealOuterRail + geo.sealInnerRail) / 2, sealProgress, sweep);
    return { x, y };
  }, [sealProgress, sweep, geo.sealInnerRail, geo.sealOuterRail]);

  const flare = (age: number) => clamp01(1 - age / T4.seal.flow.flareLetters);
  const reveal = (age: number) => clamp01(age);

  const wakeStart = Math.max(0, sealProgress - sealProgress * T4.seal.flow.wakeFraction);
  const headStart = Math.max(0, sealProgress - sealProgress * T4.seal.flow.headFraction);

  // 100% completion burst: glow + runes flash for 200 ms.
  useEffect(() => {
    const prev = prevSealProgressRef.current;
    prevSealProgressRef.current = sealProgress;
    if (sealProgress >= 1 && prev < 1) {
      setBurst(1);
      const start = performance.now();
      const duration = 200;
      let frame = 0;
      const tick = (now: number) => {
        const next = Math.max(0, 1 - (now - start) / duration);
        setBurst(next);
        if (next > 0) {
          frame = requestAnimationFrame(tick);
        }
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }
  }, [sealProgress]);

  useEffect(() => {
    if (!cursorVelocity) return;
    const { x, y } = cursorVelocity;
    const speed = Math.hypot(x, y);
    if (speed < 0.02) {
      rimIntensityRef.current *= 0.92;
      return;
    }
    rimAngleTargetRef.current = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    rimIntensityRef.current = Math.min(1, speed * 12); // amplify small velocities for visual impact
  }, [cursorVelocity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rimAngleCurrent = rimAngleTargetRef.current;
    let currentOp = 0;
    let animationFrameId: number;

    const drawRim = (angleDeg: number, opacity: number) => {
      ctx.clearRect(0, 0, 86, 86);
      if (opacity < 0.005) return;
      const cx = 43, cy = 43, r = 40;
      const a0 = (angleDeg - 22) * Math.PI / 180;
      const a1 = (angleDeg + 22) * Math.PI / 180;
      
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0, a1);
      ctx.strokeStyle = rgba(opacity * 0.28);
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, r, a0 + (a1 - a0) * 0.35, a1 - (a1 - a0) * 0.35);
      ctx.strokeStyle = `rgba(245,242,232,${opacity * 0.55})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const animRim = () => {
      const diff = rimAngleTargetRef.current - rimAngleCurrent;
      let delta = diff;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      rimAngleCurrent += delta * 0.15; // increased follow speed for less visual lag
      
      const targetOp = isDragging ? Math.min(1, Math.max(0.25, rimIntensityRef.current)) : 0;
      currentOp += (targetOp - currentOp) * 0.15;
      
      if (canvas) {
        canvas.style.opacity = currentOp.toString();
      }
      drawRim(rimAngleCurrent, currentOp);
      
      animationFrameId = requestAnimationFrame(animRim);
    };

    animRim();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDragging]);

  // Fallback gradient if no portrait is provided
  const fallbackPortrait = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCARCB9ADASIAAhEBAxEB/8QAHQAAAQUBAQEBAAAAAAAAAAAABAECAwUGAAcICf/EAEsQAAEDAwIEBAMGBAQFBAACCwEAAgMEESEFMQYSQVETImFxBzKBFCNCkaGxUmLB0RUzcuEIJEPw8RY0U4KSJaKyNWNz0hcmVMJE/8QAGwEAAgMBAQEAAAAAAAAAAAAAAgMAAQQFBgf/xAAzEQACAwACAgICAgEEAgEDBQEAAQIDEQQhEjETQQUiMlFhFCNCcQYzgRVSYhY0kaGxQ//aAAwDAQACEQMRAD8A89m/zn+5TMlPl/zn2PUpgX0BHnTikuTlKVwsM/ooyHBKdkoHdcLHoq0sTKT32TiLHCQ2VEG7YSrrEpDfZWQ4HPZLuusF2AVZR3RIbBLdduoQQ4SYLkp32XDdQo7lzdd1v0XZXWyrLYpyEt+y7I2XbKyHFI0XclsO6c0Z3UIdsndFy6xseihBMrrpQDa11xB+isgh9Su/NLb1Xbb9FRZ1he647Ltze67rZQh1vVIDhLhcRsoUMJylK4A5XW7Z6KyCYulSgE9PRLZTSDbDulH6pQ1KAqIc25PTZKD2KXl2Fl1goQ62LlPGMdUgFuqXKhYo3ylsm53S37WUKOtYpricJxPdNcdlGRoafVcT3KUhdbO6oghsF26W2crgrINK62bpy4BUQQZKkb2XNbsngdbWQtkOb6p/S64D2TsqtKEFvqnCyQDO3VPA7qyCALrFO36Jwbi37qiyK21v1S8vZTclxZJy9lEyDAL7KRoSgXG1lKxuM2UbK0SNv5p4b+Sc0JxtfZLbItG26BdbqnfokIPZAWd6Lu5XXXdSVZBrjnITfS+3dPPfCa4Z+iNFCf8AZXZIOFwC4dVCI5qUDouv6JTY9UIQnX6Jric2S7Jryp7INSdOq4ZITgMg9kWEG7905g/Nd1TtsKFCbmyVKey62FChL4Sj8ku2LLgoQ7ltuutbulC4KEwQ4Cba6VwzfdIFCjh6LgeyW2Lrh7KEOykue6W2MruqogrR/unhoSAZ26p2LFQs4ggCyTHqEueiRoyqIOAP0Sj8l2ACuCjKFAPquJBwN+qaXW9U5rLgvmIYwC5zZBKSSLSI3SHNiL';

  return (
    <div
      ref={containerRef}
      role="img"
      data-testid={dataTestId}
      aria-label={t('idleVillage:medalOverlay.ariaLabel', { defaultValue: 'Resident medal' })}
      className={`poiv3_5 tok-svg ${className}${burst > 0.001 ? ' poiv3_5--burst' : ''}${isExpiring ? ' poiv3_5--expiring' : ''}${sigillo ? ' poiv3_5--sigillo' : ''}${sigillo && pulse ? ' poiv3_5--pulse' : ''}`}
      data-silhouette={sigillo ? type : undefined}
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={{
        position: 'relative',
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        visibility: 'visible',
        '--poi-accent-rgb': sigilloTone ? hexToRgb(sigilloTone) : isExpiring ? hexToRgb(WARN_ACCENT) : `${r}, ${greenCh}, ${b}`,
        ...style,
      } as React.CSSProperties}
    >
      <div className="poiv3_5__vignette" aria-hidden="true" />
      <div className="poiv3_5__fog" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        width={sizePx}
        height={sizePx}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: sizePx,
          height: sizePx,
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: sizePx,
          height: sizePx,
          zIndex: 4,
          pointerEvents: 'none',
          willChange: isDragging ? 'transform' : 'auto',
          transform: isDragging ? 'translateZ(0)' : 'none',
          backfaceVisibility: isDragging ? 'hidden' : 'visible',
        }}
      >
        <svg
          className="poiv3_5__svg"
          width={sizePx}
          height={sizePx}
          viewBox="0 0 86 86"
          overflow="visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Outer ring metal */}
            <linearGradient id={gid('g-b')} x1="14%" y1="4%" x2="86%" y2="96%">
              <stop offset="0%" stopColor={ringLight} />
              <stop offset="6%" stopColor={ringLight} />
              <stop offset="22%" stopColor={ringMid} />
              <stop offset="72%" stopColor={ringMid} />
              <stop offset="90%" stopColor={ringDark} />
              <stop offset="100%" stopColor={ringDark} />
            </linearGradient>

            {/* Bevel diagonal */}
            <linearGradient id={gid('g-bv')} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={ringLight} stopOpacity="0.30" />
              <stop offset="22%" stopColor={ringLight} stopOpacity="0.09" />
              <stop offset="58%" stopColor={ringLight} stopOpacity="0.02" />
              <stop offset="100%" stopColor={ringDark} stopOpacity="0.75" />
            </linearGradient>

            {/* Outer vitrified glaze: bright where the light lands, fading to nearly nothing. */}
            <radialGradient id={gid('glaze')} cx="30%" cy="22%" r="86%">
              <stop offset="0%" stopColor={ringLight} stopOpacity="0.92" />
              <stop offset="42%" stopColor={ringLight} stopOpacity="0.44" />
              <stop offset="100%" stopColor={ringLight} stopOpacity={T4.surface.glazeFadeOpacity} />
            </radialGradient>

            {/* Inner ring */}
            <linearGradient id={gid('g-ri')} x1="12%" y1="8%" x2="88%" y2="92%">
              <stop offset="0%" stopColor={ringLight} />
              <stop offset="8%" stopColor={ringLight} />
              <stop offset="24%" stopColor={ringMid} />
              <stop offset="78%" stopColor={ringMid} />
              <stop offset="92%" stopColor={ringDark} />
              <stop offset="100%" stopColor={ringDark} />
            </linearGradient>

            {/* Field: very dark green borrowed from the astrolabe arena */}
            <radialGradient id={gid('field')} cx="38%" cy="30%" r="78%">
              <stop offset="0%" stopColor={theme?.stoneColors ? stoneLight : '#08121f'} />
              <stop offset="100%" stopColor={theme?.stoneColors ? stoneDark : '#020405'} />
            </radialGradient>

            {/* Bounce light on the lower inner rim of the field */}
            <radialGradient id={gid('bounce')} cx="50%" cy="82%" r="62%">
              <stop offset="0%" stopColor={alloyMid} stopOpacity={T4.surface.bounceOpacity} />
              <stop offset="55%" stopColor={alloyMid} stopOpacity={T4.surface.bounceOpacity * 0.35} />
              <stop offset="100%" stopColor={alloyMid} stopOpacity="0" />
            </radialGradient>

            {/* Glass: single sheet from highlight to shadow */}
            <radialGradient id={gid('glass')} cx="30%" cy="22%" r="70%">
              <stop offset="0%" stopColor={T4.surface.glassHighlight} />
              <stop offset="45%" stopColor={T4.surface.glassHighlight} stopOpacity="0.2" />
              <stop offset="100%" stopColor={T4.surface.glassShadow} />
            </radialGradient>
            
            <filter id="f-dp" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="turbulence" baseFrequency="0.030" numOctaves={3} seed="7" result="t" />
              <feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            
            <filter id="f-gl" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <filter id="f-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="g1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="g2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="g3" />
              <feMerge>
                <feMergeNode in="g1" />
                <feMergeNode in="g2" />
                <feMergeNode in="g3" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Patina deformation - makes circles irregular */}
            <filter id="f-patina" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves={3} seed="42" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>

            {/* Dark backing track for light-surface contrast */}
            <filter id="f-back" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Meniscus bead for V4 seal. */}
            <radialGradient id={gid('bead')} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={sealInk} stopOpacity="0.95" />
              <stop offset="45%" stopColor={sealLight} stopOpacity="0.55" />
              <stop offset="100%" stopColor={sealMid} stopOpacity="0" />
            </radialGradient>

            {/* Bloom for V4 seal: derived from SourceAlpha so it never inherits the ink. */}
            <filter
              id={gid('bloom')}
              x="-120%"
              y="-120%"
              width="340%"
              height="340%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur in="SourceAlpha" stdDeviation={T4.bloom.radii[0]} result="b1" />
              <feGaussianBlur in="SourceAlpha" stdDeviation={T4.bloom.radii[1]} result="b2" />
              <feGaussianBlur in="SourceAlpha" stdDeviation={T4.bloom.radii[2]} result="b3" />
              <feMerge result="halo">
                <feMergeNode in="b3" />
                <feMergeNode in="b2" />
                <feMergeNode in="b1" />
              </feMerge>
              <feColorMatrix
                in="halo"
                type="matrix"
                result="tint"
                values={`0 0 0 0 ${gr} 0 0 0 0 ${gg} 0 0 0 0 ${gb} 0 0 0 ${T4.bloom.strength} 0`}
              />
              <feMerge>
                <feMergeNode in="tint" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Clips */}
            <clipPath id="c-port">
              <circle cx="43" cy="43" r="27.5" />
            </clipPath>

            <clipPath id="c-medal">
              <circle cx="43" cy="43" r="42" />
            </clipPath>
          </defs>

          {/* ---------- MAGIC CIRCLE: written by the passage of time ---------- */}
          {sealProgress > 0.001 && !(sigilloTheme?.haloFollowsSilhouette && silhouette) && (
            <>
              <path
                className="poiv3_5__track"
                d={sealArcPath((geo.sealOuterRail + geo.sealInnerRail) / 2, sealProgress, sweep)}
                fill="none"
                stroke={T4.seal.trackColor}
                strokeWidth={T4.seal.trackWidth}
                strokeLinecap="butt"
              />

              <g className="poiv3_5__seal-halo" filter={`url(#${gid('bloom')})`}>
                {[geo.sealOuterRail, geo.sealInnerRail].map((radius) => (
                  <React.Fragment key={`halo-rail-${radius}`}>
                    <path
                      d={sealArcPath(radius, sealProgress, sweep)}
                      fill="none"
                      stroke={sealLight}
                      strokeOpacity={T4.seal.flow.settledOpacity}
                      strokeWidth={T4.seal.railWidth}
                      strokeLinecap="butt"
                      vectorEffect="non-scaling-stroke"
                    />
                    {WAKE_STEPS.map((step, i) => (
                      <path
                        key={`wake-${radius}-${i}`}
                        d={sealArcSpan(radius, wakeStart + (sealProgress - wakeStart) * step, sealProgress, sweep)}
                        fill="none"
                        stroke={sealLight}
                        strokeOpacity={0.16}
                        strokeWidth={T4.seal.railWidth}
                        strokeLinecap="butt"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                    <path
                      d={sealArcSpan(radius, headStart, sealProgress, sweep)}
                      fill="none"
                      stroke={sealLight}
                      strokeWidth={T4.seal.railWidth * 1.15}
                      strokeLinecap="butt"
                      vectorEffect="non-scaling-stroke"
                    />
                  </React.Fragment>
                ))}
                {cardinals.map(
                  (c) =>
                    c.lit > 0.001 && (
                      <g
                        key={`card-halo-${c.fraction}`}
                        transform={`translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) scale(${T4.cardinals.scale})`}
                        opacity={
                          (T4.cardinals.settledOpacity +
                            (1 - T4.cardinals.settledOpacity) * c.flare) *
                          c.lit
                        }
                      >
                        <path d={T4.cardinals.path} fill={sealLight} />
                      </g>
                    ),
                )}

                {sealProgress < 0.999 && (
                  <circle
                    cx={headPoint.x}
                    cy={headPoint.y}
                    r={T4.seal.flow.headRadius}
                    fill={`url(#${gid('bead')})`}
                  />
                )}
                {[...upperBand, ...lowerBand].map((l, i) => (
                  <g key={`halo-${i}`} transform={`translate(${l.x.toFixed(2)} ${l.y.toFixed(2)}) rotate(${l.angle.toFixed(1)})`}>
                    <g transform={`scale(${T4.seal.letterScale})`}>
                      <path
                        d={l.d}
                        fill="none"
                        stroke={sealMid}
                        strokeOpacity={
                          (T4.seal.flow.settledOpacity + (1 - T4.seal.flow.settledOpacity) * flare(l.age)) *
                          reveal(l.age)
                        }
                        strokeWidth={T4.seal.letterWidth * (1 + 0.45 * flare(l.age))}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  </g>
                ))}
              </g>

              <g className="poiv3_5__seal-core">
                {[geo.sealOuterRail, geo.sealInnerRail].map((radius) => (
                  <path
                    key={`core-rail-${radius}`}
                    d={sealArcPath(radius, sealProgress, sweep)}
                    fill="none"
                    stroke={sealLight}
                    strokeWidth={T4.seal.coreRailWidth}
                    strokeLinecap="butt"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {cardinals.map(
                  (c) =>
                    c.lit > 0.001 && (
                      <g
                        key={`card-core-${c.fraction}`}
                        transform={`translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) scale(${T4.cardinals.coreScale})`}
                        opacity={c.lit}
                      >
                        <path d={T4.cardinals.path} fill={sealInk} />
                      </g>
                    ),
                )}

                {[...upperBand, ...lowerBand].map((l, i) => (
                  <g key={`core-${i}`} transform={`translate(${l.x.toFixed(2)} ${l.y.toFixed(2)}) rotate(${l.angle.toFixed(1)})`}>
                    <g transform={`scale(${T4.seal.letterScale})`}>
                      <path
                        d={l.d}
                        fill="none"
                        stroke={sealInk}
                        strokeOpacity={(0.72 + 0.28 * flare(l.age)) * reveal(l.age)}
                        strokeWidth={T4.seal.coreLetterWidth * (1 + 0.3 * flare(l.age))}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  </g>
                ))}
              </g>
            </>
          )}

          {/* Fork candidate (B4-map): the countdown is traced on the silhouette edge itself —
              a progress stroke on the plate outline (halo + ink), direction-mirrored like the seal. */}
          {sealProgress > 0.001 && sigilloTheme?.haloFollowsSilhouette && silhouette && (
            <>
              <g filter={`url(#${gid('bloom')})`} aria-hidden="true">
                <path
                  d={silhouette.outer}
                  fill="none"
                  stroke={sealLight}
                  strokeWidth={T4.seal.railWidth * 1.5}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  strokeDasharray={`${sealProgress} 1`}
                  transform={timerDirection === 'counterclockwise' ? 'matrix(-1 0 0 1 86 0)' : undefined}
                />
              </g>
              <path
                d={silhouette.outer}
                fill="none"
                stroke={sealInk}
                strokeWidth={T4.seal.coreRailWidth}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray={`${sealProgress} 1`}
                transform={timerDirection === 'counterclockwise' ? 'matrix(-1 0 0 1 86 0)' : undefined}
                data-testid="sigillo-edge-progress"
              />
            </>
          )}

          {/* Sigillo plate: the silhouette (tail / tile / diamond) in bronze, behind the round medallion */}
          {silhouette && (
            <path d={silhouette.outer} fill={`url(#${gid('g-b')})`} stroke="none" aria-hidden="true" data-testid="sigillo-plate" />
          )}

          {/* MEDALLION BODY */}
          <g
            className="poiv3_5__medal"
            clipPath="url(#c-medal)"
            transform={silhouette && silhouette.scale !== 1 ? `translate(43 43) scale(${silhouette.scale}) translate(-43 -43)` : undefined}
          >
            {/* L1: Bronze outer body + texture + bevel */}
            <circle cx="43" cy="43" r="42" fill="#060f16" />
            <circle className="poiv3_5__body" cx="43" cy="43" r="42" fill={`url(#${gid('g-b')})`} opacity=".90" />
            <circle className="poiv3_5__bevel" cx="43" cy="43" r="42" fill={`url(#${gid('g-bv')})`} filter={isDragging ? undefined : "url(#f-dp)"} opacity=".48" />

            {/* L1.5: Outer glaze lip */}
            <circle
              className="poiv3_5__glaze"
              cx={geo.center}
              cy={geo.center}
              r={geo.glazeRadius}
              fill="none"
              stroke={`url(#${gid('glaze')})`}
              strokeWidth={geo.glazeWidth}
            />

            {/* L2: Rim top - arc of warm light */}
            <circle cx="43" cy="43" r="40.5" fill="none"
              stroke={ringLight} strokeOpacity={0.26} strokeWidth="3.5"
              strokeDasharray="108 148" strokeDashoffset="72"
              strokeLinecap="round" filter={isDragging ? undefined : "url(#f-gl)"} />
            <circle cx="43" cy="43" r="41" fill="none"
              stroke={ringLight} strokeOpacity={0.68} strokeWidth=".9"
              strokeDasharray="76 178" strokeDashoffset="82"
              strokeLinecap="round" />

            {/* L3: Inner ring separator */}
            <circle cx="43" cy="43" r="34" fill="#060f16" />
            <circle cx="43" cy="43" r="34" fill={`url(#${gid('g-ri')})`} opacity=".68" />
            <circle cx="43" cy="43" r="34" fill="none"
              stroke="rgba(0,0,0,.75)" strokeWidth="2.2"
              transform="translate(.3,.35)" />
            <circle cx="43" cy="43" r="33.4" fill="none"
              stroke={ringLight} strokeOpacity={0.18} strokeWidth=".8" />

            {/* L4: Field stone with V4 light + bounce */}
            <circle cx={geo.center} cy={geo.center} r={geo.fieldRadius} fill={`url(#${gid('field')})`} />
            <circle cx={geo.center} cy={geo.center} r={geo.fieldRadius} fill={`url(#${gid('bounce')})`} />

            {/* L4.5: Engraved rim script */}
            <g className="poiv3_5__rim">
              {rimBand.map((g, i) => (
                <g
                  key={`r-${i}`}
                  transform={`translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.a})`}
                  opacity={0.8 + 0.2 * g.lit}
                >
                  <g transform="scale(0.66)">
                    {/* Lower lip of the incision: a hair of bronze light under the cut */}
                    {g.lit <= 0.01 && (
                      <path
                        d={g.d}
                        fill="none"
                        stroke={ringLight}
                        strokeOpacity={0.22}
                        strokeWidth={1.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        transform="translate(0.45 0.55)"
                      />
                    )}
                    <path
                      d={g.d}
                      fill="none"
                      stroke={g.lit > 0.01 ? accent : 'rgba(4,9,13,.88)'}
                      strokeWidth={1.4 + 1.1 * g.lit}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      filter={g.lit > 0.01 ? 'url(#f-glow)' : undefined}
                    />
                    {g.star > 0.02 && (
                      <path
                        data-testid="sigillo-sparkle"
                        d="M0 -5 L1 -1 L5 0 L1 1 L0 5 L-1 1 L-5 0 L-1 -1 Z"
                        fill="#fff6dc"
                        opacity={0.95}
                        transform={`scale(${(g.star * 1.6).toFixed(2)})`}
                      />
                    )}
                  </g>
                </g>
              ))}
            </g>

            {/* L5: V1 cross icon */}
            {!iconUrl && (
              <g className="poiv3_5__cross" transform="translate(43 43) scale(0.9)">
                {[0, 90, 180, 270].map((a) => (
                  <path key={a} d={CROSS_ARM} fill="#f0cf6a" transform={`rotate(${a})`} />
                ))}
                <circle cx="0" cy="0" r="4" fill="#f0cf6a" />
              </g>
            )}

            {/* Portrait rim - bronze ring */}
            <circle cx="43" cy="43" r="27.5" fill="none"
              stroke="rgba(180,110,28,.30)" strokeWidth="1.5" />
            <circle cx="43" cy="43" r="27.5" fill="none"
              stroke="rgba(0,0,0,.65)" strokeWidth="1.9"
              transform="translate(.28,.35)" />

            {/* L6: Glass - V4 single sheet with specular (removed by the Sigillo, D5) */}
            {!sigillo && (
            <g className="poiv3_5__glass">
              <circle
                cx={geo.center}
                cy={geo.center}
                r={geo.glassRadius}
                fill="none"
                stroke={T4.surface.innerShadow}
                strokeWidth="1.8"
                transform="translate(.28,.35)"
              />
              <circle cx={geo.center} cy={geo.center} r={geo.glassRadius} fill={`url(#${gid('glass')})`} />
              <ellipse
                className="poiv3_5__specular"
                cx="31"
                cy="23"
                rx="11"
                ry="4.6"
                fill={T4.surface.specularFill}
              />
            </g>
            )}


            {/* L7: Patina / random wear per instance */}
            {imperfections.patinaSpots.map((p, i) => (
              <circle
                key={`patina-${i}`}
                cx={p.cx.toFixed(2)}
                cy={p.cy.toFixed(2)}
                r={p.r.toFixed(2)}
                fill={p.color}
                filter={isDragging ? undefined : "url(#f-patina)"}
              />
            ))}
            {imperfections.scratches.map((s, i) => (
              <line
                key={`scratch-${i}`}
                x1={s.x1.toFixed(2)}
                y1={s.y1.toFixed(2)}
                x2={s.x2.toFixed(2)}
                y2={s.y2.toFixed(2)}
                stroke={s.color}
                strokeWidth={s.width.toFixed(2)}
                strokeLinecap="round"
              />
            ))}

            {/* L8: Bottom AO on field */}
            <circle cx="43" cy="43" r="30.5" fill="none"
              stroke="rgba(0,0,0,.52)" strokeWidth="4"
              strokeDasharray="96 96" strokeDashoffset="-48"
              strokeLinecap="round" />
            {/* L5b: painted glyph — above the glass (L6) and AO (L8), or it reads dim */}
            {iconUrl && (
              /* Sigillo: the glyph fills ~57% of the field (35 of its 61-unit diameter); elsewhere the original 38 */
              <image className="poiv3_5__cross" href={iconUrl} x={sigillo ? 22 : 24} y={sigillo ? 22 : 24} width={sigillo ? 42 : 38} height={sigillo ? 42 : 38} preserveAspectRatio="xMidYMid meet" />
            )}

          </g>

          {/* Sigillo border on the silhouette: dark 2 px outside, ivory 1.5 px inside it; screen pixels, identical for every family, state and size */}
          {silhouette && (
            <g aria-hidden="true" data-testid="sigillo-border" fill="none" strokeLinejoin="round">
              <path d={silhouette.outer} stroke={SIGILLO_BORDER_OUTER} strokeWidth={SIGILLO_BORDER_OUTER_PX} vectorEffect="non-scaling-stroke" />
              <path d={silhouette.inner} stroke={theme?.borderInner ?? SIGILLO_BORDER_INNER} strokeWidth={theme?.borderInnerPx ?? SIGILLO_BORDER_INNER_PX} vectorEffect="non-scaling-stroke" />
            </g>
          )}
        </svg>
      </div>

      {/* GEM - absolutely positioned below medal center (removed by the Sigillo, D5) */}
      {!sigillo && (
      <div className="poiv3_5__gem" style={{ position: 'absolute', left: '50%', bottom: '-14px', transform: 'translateX(-50%)', zIndex: 5, pointerEvents: 'none' }}>
        <svg width="40" height="32" viewBox="-20 -14 40 32" xmlns="http://www.w3.org/2000/svg" overflow="visible">
          <defs>
            <linearGradient id="g2-b" x1="14%" y1="4%" x2="86%" y2="96%">
              <stop offset="0%" stopColor="#fce890" /><stop offset="9%" stopColor="#e4b048" />
              <stop offset="28%" stopColor="#a05c18" /><stop offset="52%" stopColor="#602c08" />
              <stop offset="76%" stopColor="#341604" /><stop offset="100%" stopColor="#0e0602" />
            </linearGradient>
            <linearGradient id="g2-ri" x1="12%" y1="8%" x2="88%" y2="92%">
              <stop offset="0%" stopColor="#f0d070" /><stop offset="16%" stopColor="#c88430" />
              <stop offset="46%" stopColor="#7c3e10" /><stop offset="80%" stopColor="#3c1c04" />
              <stop offset="100%" stopColor="#160a02" />
            </linearGradient>
            <linearGradient id="g2-top" x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#d8ffd8" /><stop offset="40%" stopColor="#72ee82" />
              <stop offset="100%" stopColor="#1a7830" />
            </linearGradient>
            <linearGradient id="g2-lu" x1="0%" y1="20%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#58d868" /><stop offset="100%" stopColor="#0e5c20" />
            </linearGradient>
            <linearGradient id="g2-ru" x1="100%" y1="20%" x2="0%" y2="80%">
              <stop offset="0%" stopColor="#88ee98" /><stop offset="100%" stopColor="#1a6828" />
            </linearGradient>
            <linearGradient id="g2-ll" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a6828" /><stop offset="100%" stopColor="#083c14" />
            </linearGradient>
            <linearGradient id="g2-rl" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a8838" /><stop offset="100%" stopColor="#0a4818" />
            </linearGradient>
            <linearGradient id="g2-bot" x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#0e5020" /><stop offset="100%" stopColor="#042810" />
            </linearGradient>
            <radialGradient id="g2-caus" cx="68%" cy="72%" r="44%">
              <stop offset="0%" stopColor="rgba(140,255,160,.30)" /><stop offset="100%" stopColor="rgba(80,220,100,0)" />
            </radialGradient>
            <radialGradient id="g2-flash" cx="32%" cy="22%" r="28%">
              <stop offset="0%" stopColor="rgba(255,255,255,.88)" /><stop offset="50%" stopColor="rgba(255,255,255,.26)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <radialGradient id="g2-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(58,215,80,.32)" /><stop offset="100%" stopColor="rgba(38,180,60,0)" />
            </radialGradient>
            <radialGradient id="g2-ao" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="rgba(0,0,0,0)" /><stop offset="80%" stopColor="rgba(0,0,0,.52)" />
              <stop offset="100%" stopColor="rgba(0,0,0,.86)" />
            </radialGradient>
            <filter id="g2-fn" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.52" numOctaves={4} seed="3" stitchTiles="stitch" result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 .068  0 0 0 0 .046  0 0 0 0 .021  0 0 0 .25 0" result="c" />
              <feBlend in="SourceGraphic" in2="c" mode="overlay" />
            </filter>
          </defs>

          {/* Glow */}
          <ellipse cx="0" cy="0" rx="10" ry="8" fill="url(#g2-glow)" style={{ filter: 'blur(3.5px)' }} />

          {/* 6 claws */}
          <path d="M-1,-9.5 C-.7,-8 -.5,-6.5 -.8,-5.2 C-.5,-4.5 0,-4.2 .8,-5.2 C.5,-6.5 .7,-8 1,-9.5 C.5,-10.2 -.5,-10.2 -1,-9.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".92" />
          <path d="M7.2,-5.5 C6,-4.5 5.4,-3.6 4.8,-2.6 C5.1,-2 5.8,-1.8 6.5,-2.6 C7,-3.6 7.5,-4.5 8.2,-5.3 C7.6,-6.2 6.8,-6 7.2,-5.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".90" />
          <path d="M7.2,5.5 C6,4.5 5.4,3.6 4.8,2.6 C5.1,2 5.8,1.8 6.5,2.6 C7,3.6 7.5,4.5 8.2,5.3 C7.6,6.2 6.8,6 7.2,5.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".90" />
          <path d="M-1,9.5 C-.7,8 -.5,6.5 -.8,5.2 C-.5,4.5 0,4.2 .8,5.2 C.5,6.5 .7,8 1,9.5 C.5,10.2 -.5,10.2 -1,9.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".88" />
          <path d="M-7.2,5.5 C-6,4.5 -5.4,3.6 -4.8,2.6 C-5.1,2 -5.8,1.8 -6.5,2.6 C-7,3.6 -7.5,4.5 -8.2,5.3 C-7.6,6.2 -6.8,6 -7.2,5.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".90" />
          <path d="M-7.2,-5.5 C-6,-4.5 -5.4,-3.6 -4.8,-2.6 C-5.1,-2 -5.8,-1.8 -6.5,-2.6 C-7,-3.6 -7.5,-4.5 -8.2,-5.3 C-7.6,-6.2 -6.8,-6 -7.2,-5.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".90" />

          {/* Base ring */}
          <circle cx="0" cy="0" r="6.2" fill="none" stroke="url(#g2-ri)" strokeWidth="1.4" filter="url(#g2-fn)" opacity=".80" />
          <circle cx="0" cy="0" r="6.2" fill="none" stroke="rgba(0,0,0,.65)" strokeWidth="1.6" transform="translate(.2,.3)" />
          <circle cx="0" cy="0" r="5.8" fill="none" stroke="rgba(255,218,110,.18)" strokeWidth=".6" />

          {/* Gem bed */}
          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="#060402" />
          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="url(#g2-ao)" />

          {/* Facets marquise */}
          <polygon points="0,-6.5 -4.2,0 0,6.5" fill="url(#g2-ll)" opacity=".88" />
          <polygon points="0,-6.5  4.2,0 0,6.5" fill="url(#g2-rl)" opacity=".88" />
          <polygon points="-2.2,3.5 2.2,3.5 0,6.5" fill="url(#g2-bot)" opacity=".95" />
          <polygon points="0,-6.5 -2.8,-2.8 0,-1.4 2.8,-2.8" fill="url(#g2-top)" opacity=".95" />
          <polygon points="0,-6.5 -4.2,0 -2.8,-2.8" fill="url(#g2-lu)" opacity=".90" />
          <polygon points="0,-6.5  4.2,0  2.8,-2.8" fill="url(#g2-ru)" opacity=".90" />
          <polygon points="-2.8,-2.8 0,-1.4 2.8,-2.8 4.2,0 0,2.2 -4.2,0" fill="url(#g2-top)" opacity=".85" />

          {/* Facet lines */}
          <line x1="0" y1="-6.5" x2="-4.2" y2="0" stroke="rgba(255,255,255,.28)" strokeWidth=".4" />
          <line x1="0" y1="-6.5" x2="4.2"  y2="0" stroke="rgba(255,255,255,.22)" strokeWidth=".4" />
          <line x1="0" y1="-6.5" x2="0"    y2="-1.4" stroke="rgba(255,255,255,.35)" strokeWidth=".4" />
          <line x1="-2.8" y1="-2.8" x2="2.8" y2="-2.8" stroke="rgba(255,255,255,.18)" strokeWidth=".35" />
          <line x1="-4.2" y1="0"    x2="4.2" y2="0" stroke="rgba(255,255,255,.14)" strokeWidth=".35" />
          <line x1="0"    y1="2.2"  x2="-4.2" y2="0" stroke="rgba(0,0,0,.20)" strokeWidth=".35" />
          <line x1="0"    y1="2.2"  x2="4.2"  y2="0" stroke="rgba(0,0,0,.16)" strokeWidth=".35" />
          <line x1="0"    y1="2.2"  x2="0"    y2="6.5" stroke="rgba(0,0,0,.24)" strokeWidth=".35" />

          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="url(#g2-caus)" />
          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="url(#g2-flash)" />
          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="rgba(50,210,75,.0)">
            <animate attributeName="rx" values="6.5;9;6.5" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="ry" values="8.5;12;8.5" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.055;0;0.055" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="fill" values="rgba(50,210,75,1);rgba(50,210,75,1);rgba(50,210,75,1)" dur="3.2s" repeatCount="indefinite" />
          </ellipse>
        </svg>
      </div>
      )}
    </div>
  );
};

/* Memoised: the medallion is the heaviest leaf in the map subtree — every
 * re-render rewrites ~50 seal attributes (the `map-quest-poi` mutation storm of
 * the PLAN-034 T-004 trace). Parents that re-render per clock tick bail out of
 * the whole SVG when the props are unchanged. */
export const PoiMatericV3_5: React.FC<PoiMatericV3_5Props> = React.memo(PoiMatericV3_5Inner);

export const poiMatericV3_5Styles = `
.poiv3_5 {
  position: relative;
  display: inline-flex;
  cursor: pointer;
  overflow: visible;
  border-radius: 50%;
}
.poiv3_5__svg { position: relative; width: 100%; height: 100%; overflow: visible; z-index: 4; }
.poiv3_5__seal { filter: url(#f-glow); opacity: 0.85; }
.poiv3_5__medal { filter: url(#f-glow); }
.poiv3_5--burst .poiv3_5__seal { opacity: 1; filter: url(#f-glow) drop-shadow(0 0 24px rgba(var(--poi-accent-rgb),0.55)); }
.poiv3_5--burst .poiv3_5__medal { filter: url(#f-glow) drop-shadow(0 0 28px rgba(var(--poi-accent-rgb),0.35)); }
.poiv3_5__body { transition: filter 250ms ease; }
.poiv3_5:hover .poiv3_5__body { filter: brightness(1.14); }
.poiv3_5__bevel { transition: filter 250ms ease; }
.poiv3_5:hover .poiv3_5__bevel { filter: brightness(1.2); }
.poiv3_5__cross { transition: filter 250ms ease; }
.poiv3_5:hover .poiv3_5__cross { filter: contrast(1.15) brightness(1.15); }
.poiv3_5__glass { transition: opacity 250ms ease; }
.poiv3_5:hover .poiv3_5__glass { opacity: 1; }
.poiv3_5__gem { transition: transform 250ms ease, filter 250ms ease; }
.poiv3_5:hover .poiv3_5__gem { transform: translateX(-50%) scale(1.08); filter: brightness(1.15); }
.poiv3_5__specular { transition: transform 80ms ease-out; }
/* Deadline countdown (expiring): a slow readable breath on the seal — C-004 wants
   a pulse near expiration, not a continuous strobe. */
.poiv3_5--expiring .poiv3_5__seal-halo,
.poiv3_5--expiring .poiv3_5__seal-core { animation: poiv3_5-expiring-breath 2.8s ease-in-out infinite; }
@keyframes poiv3_5-expiring-breath { 0%,100% { opacity: 1; } 50% { opacity: 0.62; } }
/* Sigillo (poi_family_spec §Halo grammar): urgency lands ONCE (a snap), never loops; a finished run pulses
   slowly until the player acts. Reduced motion: no snap, no pulse — steady light. */
.poiv3_5--sigillo.poiv3_5--expiring .poiv3_5__seal-halo,
.poiv3_5--sigillo.poiv3_5--expiring .poiv3_5__seal-core { animation: none; }
.poiv3_5--sigillo.poiv3_5--expiring .poiv3_5__svg { animation: poiv3_5-urgent-snap 400ms ease-out 1; transform-origin: 50% 50%; }
@keyframes poiv3_5-urgent-snap { 0% { transform: scale(1); filter: brightness(1); } 40% { transform: scale(1.06); filter: brightness(1.5); } 100% { transform: scale(1); filter: brightness(1); } }
.poiv3_5--sigillo.poiv3_5--pulse .poiv3_5__seal-halo,
.poiv3_5--sigillo.poiv3_5--pulse .poiv3_5__seal-core { animation: poiv3_5-done-pulse var(--skin-poi-pulse-period, 2s) ease-in-out infinite; }
@keyframes poiv3_5-done-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
@media (prefers-reduced-motion: reduce) {
  .poiv3_5--sigillo.poiv3_5--expiring .poiv3_5__svg,
  .poiv3_5--sigillo.poiv3_5--pulse .poiv3_5__seal-halo,
  .poiv3_5--sigillo.poiv3_5--pulse .poiv3_5__seal-core { animation: none; }
}
.poiv3_5__vignette {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 150px;
  height: 150px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  opacity: 0;
}
.poiv3_5__fog {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  background: radial-gradient(circle at 50% 46%,
    rgba(var(--poi-accent-rgb),0.12) 0%,
    rgba(var(--poi-accent-rgb),0.05) 45%,
    transparent 72%
  );
}
`;


export default PoiMatericV3_5;
