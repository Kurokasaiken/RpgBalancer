/**
 * PoiMatericV1 — fantasy variant of the opportunity marker.
 *
 * Driven by the arcane-seal reference: a solid forged medallion sitting on the
 * map, with a circle of magic hanging in the AIR around it.
 *
 *  1. THE TIMER IS A SUMMONED CIRCLE, NOT A PROGRESS BAR. A thin ring of light
 *     draws itself around the medallion, and glyphs materialise out of nothing
 *     along it as it passes them. Nothing is carved into the metal: unlit
 *     glyphs do not exist yet, so the circle reads as being conjured rather
 *     than filled in. Burning down a deadline un-summons it the other way.
 *  2. THE GLYPHS FLOAT. They sit outside the medallion's rim, scale up out of
 *     nothing and drift, so they are clearly not part of the object.
 *  3. THE METAL IS METAL. Ornate engraved rim, faceted dark core, glyph in
 *     bas-relief. The type colour is the light in the seal and the patina in
 *     the stone — the bronze structure is shared by all three.
 *
 * Same props as PoiMarker: the two are drop-in interchangeable.
 *
 * Reference page: src/ui/idleVillage/pages/PoiMarkerLabPage.tsx (route /poi-marker-lab)
 */
import React, { CSSProperties, useEffect, useId, useMemo, useState } from 'react';
import type { PoiMarkerProps, PoiType } from './PoiMarker';

/** Type colour = the light of the seal, never the alloy. */
type Ember = { core: string; light: string; deep: string; patina: string };

const EMBERS: Record<PoiType, Ember> = {
  // Candle-lit honey.
  quest: { core: '#E3A93C', light: '#FFE9B0', deep: '#5E3A0F', patina: '#3A2A10' },
  // Oxidised copper lit from within — patina, not cyan.
  job: { core: '#5FC7A2', light: '#E2F0C6', deep: '#12463A', patina: '#13322C' },
  // Banked forge coal.
  event: { core: '#D9452F', light: '#FFB08A', deep: '#4E120C', patina: '#33110D' },
};

const LABELS: Record<PoiType, string> = { quest: 'Quest', job: 'Job', event: 'Event' };

/** Where the summoned circle hangs, clear of the medallion's rim. */
const SEAL_RADIUS = 50;
const GLYPH_COUNT = 14;

/**
 * Inscription vocabulary — Maou Gakuin-inspired magical script.
 * Flowing, connected strokes with loops, diacritics and ligatures;
 * every glyph reads as a unit of writing rather than a detached stick.
 * Shapes are deliberately dense so they remain legible as script around
 * the narrow seal band.
 */
const LETTERS: string[] = [
  // 1. lo — vertical stem with a top loop
  'M -1.2,-5 L -1.2,5 M -1.2,-1.8 Q 2,-2.8 2,-0.5 Q 2,1.5 -1.2,0.8',

  // 2. ra — tall stem with a right hook and dot
  'M -1.5,-5 L -1.5,5 M -1.5,-2.2 Q 1.5,-2.2 1.5,0.2 Q 1.5,2 -0.8,2.8 M 1.8,3.2 A 0.9 0.9 0 1 1 1.8 4.9 A 0.9 0.9 0 1 1 1.8 3.2',

  // 3. ve — double stem joined by a roof
  'M -3,-5 L -3,5 M 3,-5 L 3,5 M -3,-3 Q 0,-5.2 3,-3',

  // 4. mi — an eye with two descending tails
  'M 0,-2.2 A 2 2 0 1 1 0 1.8 A 2 2 0 1 1 0 -2.2 M -1.6,0.6 Q -2.2,2.8 -2.8,4.5 M 1.6,0.6 Q 2.2,2.8 2.8,4.5',

  // 5. sa — a cursive wave
  'M -2.8,-4.5 Q -0.8,-1.5 1.2,-2.5 Q 3.2,-3.5 2.8,-0.5 Q 2.4,2.5 -1.2,2.5 Q -3.2,2.5 -2.8,4.5',

  // 6. ne — a circle on a stalk
  'M -0.5,2 L -0.5,5 M 0,-2 A 2.2 2.2 0 1 1 -0.1 -2 M -0.5,1.6 Q -2,0.5 -2,-1.5',

  // 7. te — a top bar with a hanging stroke
  'M -3,-4.5 L 3,-4.5 M 0,-4.5 L 0,5 M 0,0 Q 2,0.5 2,2.5',

  // 8. ku — a stroke that loops down and left
  'M -3,-4 L 3,-4 Q 3.6,0 0,2 Q -3.6,4 -3,0.5 Q -2.6,-2.5 0,-2.5',

  // 9. mo — a broad curve with crossbars
  'M -3,-5 Q 0,-1 3,-5 M -3,0 Q 0,3 3,0 M -3,0 L 3,0',

  // 10. shi — a long sweeping curve
  'M -3,-5 Q 0,-2 3,0 Q 0,2 -3,5',

  // 11. ki — two diagonals and a dot
  'M -2.5,-5 L 2.5,5 M 2.5,-5 L -2.5,5 M -1.2,-2 A 0.8 0.8 0 1 1 -1.2 -0.4 A 0.8 0.8 0 1 1 -1.2 -2',

  // 12. no — a bowl with double diacritics
  'M -2.2,-1.5 L 2.2,-1.5 Q 2.2,3.5 0,3.5 Q -2.2,3.5 -2.2,-1.5 M -1,-4.2 A 0.7 0.7 0 1 1 -1 -2.8 A 0.7 0.7 0 1 1 -1 -4.2 M 1,-4.2 A 0.7 0.7 0 1 1 1 -2.8 A 0.7 0.7 0 1 1 1 -4.2',
];

/** Outer band is a continuous ring of 100 letters, one per percent. */
const LETTER_COUNT = 100;

const GLYPHS = [
  'M0 -3.6 L0 3.6 M0 -1.2 L2.2 -3.4 M0 -1.2 L-2.2 -3.4',
  'M-1.8 3.6 L-1.8 -3.6 L2 -1.2 L-1.8 0.9',
  'M-2 3.6 L0 -3.6 L2 3.6 M-1.2 0.9 L1.2 0.9',
  'M-2 -3.6 L2 3.6 M2 -3.6 L-2 3.6',
  'M-1.9 3.6 L-1.9 -3.6 L0 -0.5 L1.9 -3.6 L1.9 3.6',
  'M0 -3.6 L0 3.6 M0 0 L2.2 -2.2 M0 0 L2.2 2.2',
  'M-2 -3.6 L2 -3.6 M0 -3.6 L0 3.6',
  'M-1.8 -3.6 L1.8 -1.6 L-1.8 0.5 L1.8 2.5 L-1.8 3.6',
  'M0 -3.4 A3.4 3.4 0 1 1 -0.1 -3.4 M0 -1 L0 3',
  'M-2 0 L0 -3.4 L2 0 L0 3.4 Z',
];

/** Four-point flare, like the cardinal sparks on the reference seals. */
const FLARE = 'M0 -9 Q0.9 -1.4 8 0 Q0.9 1.4 0 9 Q-0.9 1.4 -8 0 Q-0.9 -1.4 0 -9 Z';

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

/** Arc starting at 12 o'clock; direction-aware. */
function arcPath(cx: number, cy: number, r: number, progress: number, ccw: boolean) {
  const p = clamp(progress);
  if (p <= 0.0001) return '';
  if (p >= 0.9999) {
    const sweep = ccw ? 0 : 1;
    return [
      `M ${cx} ${cy - r}`,
      `A ${r} ${r} 0 1 ${sweep} ${cx} ${cy + r}`,
      `A ${r} ${r} 0 1 ${sweep} ${cx} ${cy - r}`,
    ].join(' ');
  }

  const start = -Math.PI / 2;
  const delta = (Math.PI * 2 - 0.0001) * p * (ccw ? -1 : 1);
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(start + delta);
  const y2 = cy + r * Math.sin(start + delta);

  return `M ${x1} ${y1} A ${r} ${r} 0 ${p > 0.5 ? 1 : 0} ${ccw ? 0 : 1} ${x2} ${y2}`;
}

function arcTip(cx: number, cy: number, r: number, progress: number, ccw: boolean) {
  const a = -Math.PI / 2 + (Math.PI * 2 - 0.0001) * clamp(progress) * (ccw ? -1 : 1);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** One heraldic arm, repeated by rotation into a cross fleury. */
const CROSS_ARM =
  'M-3 -5 L-3 -17 L-6.4 -21 L-3.4 -22.2 L0 -18.4 L3.4 -22.2 L6.4 -21 L3 -17 L3 -5 Z';

function burstStarPath(points: number, rOuter: number, rInner: number) {
  const step = Math.PI / points;
  const parts: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = -Math.PI / 2 + i * step;
    parts.push(`${i === 0 ? 'M' : 'L'} ${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`);
  }
  return `${parts.join(' ')} Z`;
}

const BURST = burstStarPath(8, 20, 6.5);

/** Type glyph as a filled shape, centred on the origin. */
function glyphFor(type: PoiType) {
  if (type === 'quest') {
    return (
      <>
        {[0, 90, 180, 270].map((a) => (
          <path key={a} d={CROSS_ARM} transform={`rotate(${a})`} />
        ))}
        <circle cx="0" cy="0" r="4" />
      </>
    );
  }

  if (type === 'job') {
    // Anvil: reads as "work available here" and survives down to 32px, which a
    // hammer in perspective does not.
    return (
      <g transform="translate(0 1)">
        <path d="M-19 -13 L19 -13 L19 -7.5 L10 -7.5 L6.5 -1 L10 3.5 L10 7 L-10 7 L-10 3.5 L-6.5 -1 L-15.5 -7.5 L-19 -7.5 Z" />
        <path d="M-11.5 7 L11.5 7 L14.5 14 L-14.5 14 Z" />
      </g>
    );
  }

  return (
    <>
      <path d={BURST} />
      <circle cx="0" cy="0" r="3.2" />
    </>
  );
}

export const PoiMatericV1: React.FC<PoiMarkerProps> = ({
  type,
  state = 'available',
  progress = 1,
  durationMs,
  autoStart = true,
  onExpire,
  timerDirection = 'counterclockwise',
  importance = 'normal',
  size = 112,
  disabled = false,
  className = '',
  style,
  onClick,
  onPointerEnter,
  onPointerLeave,
}) => {
  const reactId = useId();
  const id = `poim1-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ember = EMBERS[type];

  const [currentProgress, setCurrentProgress] = useState(clamp(progress));
  const [rimProgress, setRimProgress] = useState(0);
  const [isRimHovered, setIsRimHovered] = useState(false);

  useEffect(() => {
    setCurrentProgress(clamp(progress));
  }, [progress]);

  // One clockwise pass over the medallion rim glyphs, starting at 12 o'clock.
  useEffect(() => {
    if (!isRimHovered) {
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
  }, [isRimHovered]);

  useEffect(() => {
    if (!autoStart || !durationMs) return;
    if (state !== 'assigned' && state !== 'expiring') return;

    const startedAt = performance.now();
    const initial = clamp(progress);
    let frame = 0;

    const tick = (now: number) => {
      const next = clamp(initial - (now - startedAt) / durationMs);
      setCurrentProgress(next);
      if (next <= 0) {
        cancelAnimationFrame(frame);
        onExpire?.();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // A new countdown starts only when the duration or the state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, durationMs, state]);

  const isExpired =
    state === 'expired' || (state !== 'available' && state !== 'new' && currentProgress <= 0);
  const urgent = state === 'expiring';
  const ccw = timerDirection === 'counterclockwise';
  const sealProgress = isExpired ? 0 : state === 'available' || state === 'new' ? 1 : currentProgress;

  const seal = useMemo(() => arcPath(60, 60, SEAL_RADIUS, sealProgress, ccw), [sealProgress, ccw]);
  const tip = useMemo(() => arcTip(60, 60, SEAL_RADIUS, sealProgress, ccw), [sealProgress, ccw]);

  /**
   * Each glyph materialises as the circle sweeps past it. `lit` drives both
   * opacity and scale, so it grows out of nothing instead of fading in flat.
   */
  const glyphs = useMemo(() => {
    const written = sealProgress * GLYPH_COUNT;
    const sweep = ccw ? -1 : 1;
    return Array.from({ length: GLYPH_COUNT }, (_, i) => ({
      i,
      angle: sweep * (i + 0.5) * (360 / GLYPH_COUNT),
      lit: clamp(written - i),
      d: GLYPHS[i % GLYPHS.length],
    })).filter((g) => g.lit > 0.001);
  }, [sealProgress, ccw]);

  /** Cardinal flares light up as the circle reaches them. */
  const flares = useMemo(
    () =>
      [0, 1, 2, 3]
        .map((i) => ({ i, angle: (ccw ? -1 : 1) * i * 90, lit: clamp((sealProgress - i / 4) * 4) }))
        .filter((f) => f.lit > 0.001),
    [sealProgress, ccw],
  );

  // One hundred letter slots, each with matching outer/inner ring segments.
  // A slot lights up discretely at each 1% of seal progress.
  const letterStep = 360 / LETTER_COUNT;
  const outerRingRadius = 54;
  const innerRingRadius = 45;
  const upperBandRadius = 51.5;
  const lowerBandRadius = 47.5;

  function ringSegmentPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  const outerBand = useMemo(() => {
    const litCount = Math.floor(sealProgress * LETTER_COUNT);
    const stepRad = (letterStep * Math.PI) / 180;
    const halfStep = stepRad / 2;
    let letterCursor = 0;
    return Array.from({ length: LETTER_COUNT }, (_, i) => {
      const a = -90 + i * letterStep;
      const rad = (a * Math.PI) / 180;
      const lit = i < litCount ? 1 : 0;
      const d = LETTERS[letterCursor++ % LETTERS.length];
      return {
        d,
        a,
        lit,
        x: 60 + upperBandRadius * Math.cos(rad),
        y: 60 + upperBandRadius * Math.sin(rad),
        outerD: ringSegmentPath(60, 60, outerRingRadius, rad - halfStep, rad + halfStep),
        innerD: ringSegmentPath(60, 60, innerRingRadius, rad - halfStep, rad + halfStep),
      };
    }).filter((g) => g.lit > 0.001);
  }, [sealProgress]);

  // Lower strip: same letters, half a step ahead (staggered).
  const lowerBand = useMemo(() => {
    const litCount = Math.floor(sealProgress * LETTER_COUNT);
    let letterCursor = 0;
    return Array.from({ length: LETTER_COUNT }, (_, i) => {
      const a = -90 + (i + 0.5) * letterStep;
      const rad = (a * Math.PI) / 180;
      const lit = i < litCount ? 1 : 0;
      const d = LETTERS[letterCursor++ % LETTERS.length];
      return {
        d,
        a,
        lit,
        x: 60 + lowerBandRadius * Math.cos(rad),
        y: 60 + lowerBandRadius * Math.sin(rad),
      };
    }).filter((g) => g.lit > 0.001);
  }, [sealProgress]);

  // Medallion rim script — replaces the engraved tick marks.
  const RIM_LETTER_COUNT = 24;
  const rimBand = useMemo(() => {
    const rimStep = 360 / RIM_LETTER_COUNT;
    const rimRadius = 33.5;
    const t = isRimHovered ? rimProgress * RIM_LETTER_COUNT : -2 * RIM_LETTER_COUNT;
    let letterCursor = 0;
    return Array.from({ length: RIM_LETTER_COUNT }, (_, i) => {
      const a = -90 + i * rimStep;
      const rad = (a * Math.PI) / 180;
      const d = LETTERS[letterCursor++ % LETTERS.length];
      const dist = Math.abs(i - t);
      const lit = clamp(1.5 - 2 * dist);
      return {
        d,
        a,
        lit,
        x: 60 + rimRadius * Math.cos(rad),
        y: 60 + rimRadius * Math.sin(rad),
      };
    });
  }, [rimProgress, isRimHovered]);

  // Four cardinal starbursts that grow stronger as the ring reaches them.
  const cardinals = useMemo(() => {
    const flareRadius = 54;
    return [
      { x: 60, y: 60 - flareRadius, lit: clamp(sealProgress * 4) },
      { x: 60 + flareRadius, y: 60, lit: clamp((sealProgress - 0.25) * 4) },
      { x: 60, y: 60 + flareRadius, lit: clamp((sealProgress - 0.5) * 4) },
      { x: 60 - flareRadius, y: 60, lit: clamp((sealProgress - 0.75) * 4) },
    ];
  }, [sealProgress]);

  const cssVars = {
    '--poim1-core': ember.core,
    '--poim1-light': ember.light,
    '--poim1-deep': ember.deep,
    '--poim1-size': `${size}px`,
  } as CSSProperties;

  return (
    <button
      type="button"
      aria-label={`${LABELS[type]} ${isExpired ? 'expired' : 'available'}`}
      className={[
        'poim1',
        `poim1--${type}`,
        `poim1--${state}`,
        importance !== 'normal' ? `poim1--${importance}` : '',
        disabled ? 'poim1--disabled' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...cssVars, ...style }}
      onClick={onClick}
      onPointerEnter={(e) => {
        setIsRimHovered(true);
        onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        setIsRimHovered(false);
        onPointerLeave?.(e);
      }}
      disabled={disabled}
    >
      <svg className="poim1__svg" viewBox="0 0 120 120" role="img" aria-hidden="true">
        <defs>
          {/* Shared alloy: what makes the three types one family of objects. */}
          <linearGradient id={`${id}-bronze`} x1="18%" y1="0%" x2="82%" y2="100%">
            <stop offset="0%" stopColor="#FFF0BE" />
            <stop offset="7%" stopColor="#D8AE62" />
            <stop offset="18%" stopColor="#805021" />
            <stop offset="52%" stopColor="#3A210C" />
            <stop offset="76%" stopColor="#74471B" />
            <stop offset="100%" stopColor="#160C05" />
          </linearGradient>

          <linearGradient id={`${id}-rim`} x1="25%" y1="0%" x2="75%" y2="100%">
            <stop offset="0%" stopColor="#E0C084" />
            <stop offset="30%" stopColor="#8A6730" />
            <stop offset="62%" stopColor="#3B2915" />
            <stop offset="100%" stopColor="#A57F3C" />
          </linearGradient>

          {/* Faceted stone, tinted by the type's patina. */}
          <radialGradient id={`${id}-stone`} cx="38%" cy="28%" r="84%">
            <stop offset="0%" stopColor={ember.patina} />
            <stop offset="46%" stopColor="#1E140A" />
            <stop offset="100%" stopColor="#0A0705" />
          </radialGradient>

          {/* Off-centre focus, like a hearth sitting inside a volume rather
              than an emissive disc glued on top of it. */}
          <radialGradient id={`${id}-hearth`} cx="45%" cy="42%" r="74%">
            <stop offset="0%" stopColor={ember.light} stopOpacity="0.62" />
            <stop offset="30%" stopColor={ember.core} stopOpacity="0.38" />
            <stop offset="65%" stopColor={ember.core} stopOpacity="0.16" />
            <stop offset="100%" stopColor={ember.core} stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`${id}-relief`} x1="22%" y1="0%" x2="72%" y2="100%">
            <stop offset="0%" stopColor={ember.light} />
            <stop offset="40%" stopColor={ember.core} />
            <stop offset="100%" stopColor={ember.deep} />
          </linearGradient>

          {/* Ambient falloff as a gradient: a blurred solid disc gets clipped by
              the filter region and leaves a square on the map. */}
          <radialGradient id={`${id}-ambient`} cx="50%" cy="50%" r="50%">
            <stop offset="46%" stopColor={ember.core} stopOpacity="1" />
            <stop offset="74%" stopColor={ember.core} stopOpacity="0.4" />
            <stop offset="100%" stopColor={ember.core} stopOpacity="0" />
          </radialGradient>

          {/* Cast metal: noise into soft-light kills the vector flatness.
              feTurbulence fills the WHOLE filter region, and feBlend emits it
              even where the source is transparent — that paints a translucent
              noise square around the marker. The feComposite clips the grain to
              the source's own alpha, which is the only thing keeping this
              filter inside the medallion. Do not remove it. */}
          <filter id={`${id}-cast`} x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="4" seed="23" result="n" />
            <feColorMatrix
              in="n"
              type="matrix"
              values="0.20 0 0 0 0
                      0 0.16 0 0 0
                      0 0 0.10 0 0
                      0 0 0 0.34 0"
              result="grain"
            />
            <feComposite in="grain" in2="SourceAlpha" operator="in" result="grainInside" />
            <feBlend in="SourceGraphic" in2="grainInside" mode="soft-light" />
          </filter>

          {/* Airborne light: wide enough to feel like a glow in the air rather
              than a stroke on a surface. */}
          <filter id={`${id}-arcane`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`${id}-drop`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5.2" result="blur" />
            <feOffset dy="5" result="off" />
            <feColorMatrix
              in="off"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 .5 0"
            />
            <feBlend in="SourceGraphic" />
          </filter>

          {/* Mystical bloom: a tight crisp blur plus a separately-tinted wide
              halo (halation), instead of one flat Gaussian smear. The warm
              flood is masked to the wide blur's own alpha, so the halo takes
              the ember colour rather than bleaching toward white. */}
          <filter id={`${id}-magic-glow`} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.0" result="blurTight" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="7.5" result="blurWide" />
            <feFlood floodColor={ember.core} result="warmFlood" />
            <feComposite in="warmFlood" in2="blurWide" operator="in" result="warmHalo" />
            <feComponentTransfer in="warmHalo" result="warmHaloSoft">
              <feFuncA type="linear" slope="0.75" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="warmHaloSoft" />
              <feMergeNode in="blurTight" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Runic engraving: a small drop-shadow that makes the rune sit inside the metal. */}
          <filter id={`${id}-runic-engrave`} x="-40%" y="-40%" width="180%" height="180%">
            <feOffset in="SourceAlpha" dx="0" dy="0.7" result="off" />
            <feGaussianBlur in="off" stdDeviation="0.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* A little grain over the seal keeps the write-on from reading as
              a perfectly clean vector sweep. */}
          <filter id={`${id}-seal-grain`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="grain" />
            <feColorMatrix
              in="grain"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0.3 0.3 0.3 0 0"
              result="grainAlpha"
            />
            <feComposite in="grainAlpha" in2="SourceAlpha" operator="in" result="grainInside" />
            <feBlend in="SourceGraphic" in2="grainInside" mode="soft-light" />
          </filter>
        {/* Enamel inlay: a coloured vitreous glaze on top of the stone. */}
        <radialGradient id={`${id}-enamel`} cx="45%" cy="42%" r="65%">
          <stop offset="0%" stopColor={ember.light} stopOpacity="0.18" />
          <stop offset="40%" stopColor={ember.core} stopOpacity="0.10" />
          <stop offset="100%" stopColor={ember.deep} stopOpacity="0.06" />
        </radialGradient>

        {/* Glass dome: a convex lens that encases the inner seal. */}
        <radialGradient id={`${id}-glass`} cx="38%" cy="28%" r="78%">
          <stop offset="0%" stopColor={ember.light} stopOpacity="0.16" />
          <stop offset="18%" stopColor={ember.core} stopOpacity="0.08" />
          <stop offset="60%" stopColor={ember.core} stopOpacity="0.03" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
        </radialGradient>
      </defs>

        {/* Contact shadow: what stops it floating above the map. */}
        <ellipse cx="60" cy="106" rx="27" ry="5.5" fill="#000" opacity="0.55" filter={`url(#${id}-drop)`} />

        {/* ── The summoned circle, hanging in the air ────────────────────────
            Two staggered rows of 100 glyphs, ring segments, and four
            cardinal starbursts — all wrapped in a warm, mystical glow. */}
        {sealProgress > 0.001 && (
          <g className="poim1__seal" filter={`url(#${id}-magic-glow)`}>
            {outerBand.map((g, i) => (
              <g key={`s-${i}`}>
                <path
                  d={g.outerD}
                  fill="none"
                  stroke={ember.light}
                  strokeWidth="2.4"
                  strokeLinecap="butt"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={g.innerD}
                  fill="none"
                  stroke={ember.light}
                  strokeWidth="2.4"
                  strokeLinecap="butt"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}

            {outerBand.map((g, i) => (
              <g
                key={`u-${i}`}
                transform={`translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.a})`}
              >
                <g transform="scale(0.28)">
                  <path
                    d={g.d}
                    fill="none"
                    stroke={ember.light}
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              </g>
            ))}

            {lowerBand.map((g, i) => (
              <g
                key={`o-${i}`}
                transform={`translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.a})`}
              >
                <g transform="scale(0.28)">
                  <path
                    d={g.d}
                    fill="none"
                    stroke={ember.light}
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              </g>
            ))}

            {cardinals.map((c, i) => (
              <g
                key={`c-${i}`}
                transform={`translate(${c.x} ${c.y}) scale(0.7)`}
                opacity={c.lit}
              >
                <path d={FLARE} fill={ember.light} />
              </g>
            ))}
          </g>
        )}

        {/* ── The physical medallion ──────────────────────────────────────── */}
        <circle
          cx="60"
          cy="60"
          r="37"
          fill={`url(#${id}-bronze)`}
          filter={`url(#${id}-cast)`}
          className="poim1__body"
        />

        {/* Engraved ornament band — replaced by a ring of rim script. */}
        <circle cx="60" cy="60" r="33.5" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="7" filter={`url(#${id}-cast)`} />

        {/* Highlight ridge: a warm arc from 10 to 2 o'clock. */}
        <circle
          cx="60"
          cy="60"
          r="36.6"
          fill="none"
          stroke="#C49043"
          strokeWidth="3.2"
          strokeDasharray="38 229"
          opacity="0.35"
          transform="rotate(-120 60 60)"
        />
        <circle
          cx="60"
          cy="60"
          r="36.6"
          fill="none"
          stroke="#FFF1C0"
          strokeWidth="1.4"
          strokeDasharray="38 229"
          opacity="0.58"
          transform="rotate(-120 60 60)"
        />
        <g className="poim1__rim">
          {rimBand.map((g, i) => (
            <g
              key={`r-${i}`}
              transform={`translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.a})`}
              opacity={0.7 + 0.3 * g.lit}
              filter={g.lit > 0 ? `url(#${id}-magic-glow)` : `url(#${id}-runic-engrave)`}
            >
              <g transform="scale(0.66)">
                <path
                  d={g.d}
                  fill="none"
                  stroke={g.lit > 0 ? ember.light : '#4A3B22'}
                  strokeWidth={2.1 + 1.1 * g.lit}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            </g>
          ))}
        </g>

        {/* Inner groove that separates the bronze rim from the stone core. */}
        <circle cx="60" cy="60" r="30.8" fill="none" stroke="#160B04" strokeWidth="3.2" opacity="0.95" />
        <circle cx="60" cy="60" r="30.4" fill="none" stroke="#B88238" strokeWidth="0.7" opacity="0.38" />

        {/* Faceted dark stone. Apex offset off-centre so the facets don't
            converge into a solid black point directly under the hearth. */}
        <circle cx="60" cy="60" r="29" fill={`url(#${id}-stone)`} filter={`url(#${id}-cast)`} />
        <g fill="#000" opacity="0.2">
          {Array.from({ length: 7 }, (_, i) => {
            const a = -Math.PI / 2 + (i * Math.PI * 2) / 7;
            const b = a + 0.72;
            const r0 = 7;
            const r1 = 28.5;
            const r2 = 12 + (i % 3) * 4;
            return (
              <path
                key={i}
                d={`M ${60 + r0 * Math.cos(a)} ${60 + r0 * Math.sin(a)} L ${60 + r1 * Math.cos(a)} ${60 + r1 * Math.sin(a)} L ${60 + r2 * Math.cos(b)} ${60 + r2 * Math.sin(b)} Z`}
              />
            );
          })}
        </g>
        <circle
          cx="60"
          cy="60"
          r="29"
          fill={`url(#${id}-hearth)`}
          opacity={1}
          className="poim1__hearth"
        />

        {/* Enamel inlay: a coloured vitreous glaze between the stone and the icon. */}
        <circle
          cx="60"
          cy="60"
          r="28"
          fill={`url(#${id}-enamel)`}
          opacity="0.55"
          className="poim1__enamel"
          pointerEvents="none"
        />

        {/* Sculpted glyph: four stacked layers give the icon its own mass. */}
        <g transform="translate(60 60) scale(1.25)" className="poim1__emblem" opacity={1}>
          <g fill="#100804" stroke="#070402" strokeWidth="1.3" strokeLinejoin="round" transform="translate(1.35 1.65)">
            {glyphFor(type)}
          </g>
          <g fill={ember.deep} stroke="#2A1607" strokeWidth="1.1" strokeLinejoin="round" transform="translate(0.55 0.7)">
            {glyphFor(type)}
          </g>
          <g fill={`url(#${id}-relief)`} stroke={ember.deep} strokeWidth="0.95" strokeLinejoin="round">
            {glyphFor(type)}
          </g>
          <g fill="none" stroke="#FFE7A2" strokeWidth="0.7" strokeLinejoin="round" opacity="0.42" transform="translate(-0.38 -0.52)">
            {glyphFor(type)}
          </g>
        </g>

        {/* Glass dome: convex lens reflection over the inner seal. */}
        <circle
          cx="60"
          cy="60"
          r="27.5"
          fill={`url(#${id}-glass)`}
          opacity="0.28"
          className="poim1__glass"
          pointerEvents="none"
        />

        {/* Asymmetric specular: a bright top-left glint off the glass. */}
        <ellipse
          cx="44"
          cy="36"
          rx="9"
          ry="4.5"
          fill={ember.light}
          opacity="0.18"
          transform="rotate(-30 44 36)"
          filter={`url(#${id}-arcane)`}
          pointerEvents="none"
        />

        {/* Struck highlight along the top-left rim. */}
        <path
          d="M35 46 C43 31, 62 29, 78 37"
          fill="none"
          stroke="#FFF3CE"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.26"
        />

        {/* Selected visual state intentionally omitted — this POI is hover-only. */}
      </svg>
    </button>
  );
};

/** Component-scoped material. Any theming still belongs in skinConfigRegistry. */
export const poiMatericV1Styles = `
.poim1 {
  --poim1-size: 112px;
  position: relative;
  display: inline-flex;
  width: var(--poim1-size);
  height: var(--poim1-size);
  padding: 0; margin: 0; border: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
  touch-action: manipulation;
  isolation: isolate;
  transition: transform 180ms ease;
}
.poim1:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--poim1-light); border-radius: 50%; }
.poim1:hover:not(:disabled) { transform: scale(1.035); }
.poim1:active:not(:disabled) { transform: scale(.985); }

.poim1__svg { width: 100%; height: 100%; overflow: visible; }

.poim1__body { transform-origin: 60px 60px; animation: poim1-breathe 8s ease-in-out infinite; }

/* The magic seal reveals progressively as time passes. */
.poim1__seal { transform-origin: 60px 60px; }

.poim1--new .poim1__body {
  animation: poim1-arrive 720ms cubic-bezier(.2,.9,.2,1) both,
             poim1-breathe 8s ease-in-out 720ms infinite;
}
.poim1--new .poim1__seal {
  animation: poim1-summon 900ms ease-out both,
             poim1-drift 42s linear 900ms infinite;
}

/* Completed POI: the inner hearth pulses with a slow bloom instead of resetting. */
.poim1--available .poim1__hearth {
  animation: poim1-glow-pulse 2.8s ease-in-out infinite;
}

.poim1--disabled, .poim1--expired { cursor: default; filter: saturate(.55) brightness(.8); }

@keyframes poim1-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.008); } }

@keyframes poim1-glow-pulse { 0%,100% { opacity: 0.82; } 50% { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .poim1, .poim1 * { animation: none !important; transition: none !important; }
}
`;

export default PoiMatericV1;
