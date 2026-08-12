/**
 * PoiMarkerRunic — fantasy variant of the opportunity marker.
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
  job: { core: '#5FC7A2', light: '#CFF6E2', deep: '#12463A', patina: '#13322C' },
  // Banked forge coal.
  event: { core: '#D9452F', light: '#FFB08A', deep: '#4E120C', patina: '#33110D' },
};

const LABELS: Record<PoiType, string> = { quest: 'Quest', job: 'Job', event: 'Event' };

/** Where the summoned circle hangs, clear of the medallion's rim. */
const SEAL_RADIUS = 50;
const GLYPH_COUNT = 14;

/**
 * Small arcane marks. Deliberately not an alphabet: they should read as
 * "something is being written here", not as text to decipher.
 */
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

export const PoiMarkerRunic: React.FC<PoiMarkerProps> = ({
  type,
  state = 'available',
  progress = 1,
  durationMs,
  autoStart = true,
  onExpire,
  timerDirection = 'counterclockwise',
  importance = 'normal',
  size = 112,
  selected = false,
  disabled = false,
  className = '',
  style,
  onClick,
  onPointerEnter,
  onPointerLeave,
}) => {
  const reactId = useId();
  const id = `poir-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ember = EMBERS[type];

  const [currentProgress, setCurrentProgress] = useState(clamp(progress));

  useEffect(() => {
    setCurrentProgress(clamp(progress));
  }, [progress]);

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

  const cssVars = {
    '--poir-core': ember.core,
    '--poir-light': ember.light,
    '--poir-deep': ember.deep,
    '--poir-size': `${size}px`,
  } as CSSProperties;

  const ambientOpacity = isExpired
    ? 0
    : importance === 'critical'
      ? 0.2
      : importance === 'important'
        ? 0.13
        : 0.08;

  return (
    <button
      type="button"
      aria-label={`${LABELS[type]} ${isExpired ? 'expired' : 'available'}`}
      className={[
        'poir',
        `poir--${type}`,
        `poir--${state}`,
        importance !== 'normal' ? `poir--${importance}` : '',
        selected ? 'poir--selected' : '',
        disabled ? 'poir--disabled' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...cssVars, ...style }}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      disabled={disabled}
    >
      <svg className="poir__svg" viewBox="0 0 120 120" role="img" aria-hidden="true">
        <defs>
          {/* Shared alloy: what makes the three types one family of objects. */}
          <linearGradient id={`${id}-bronze`} x1="18%" y1="0%" x2="82%" y2="100%">
            <stop offset="0%" stopColor="#D6B478" />
            <stop offset="14%" stopColor="#9A7539" />
            <stop offset="36%" stopColor="#5C401F" />
            <stop offset="56%" stopColor="#2E200F" />
            <stop offset="78%" stopColor="#87642E" />
            <stop offset="100%" stopColor="#1C1409" />
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
            <stop offset="46%" stopColor="#150F09" />
            <stop offset="100%" stopColor="#070504" />
          </radialGradient>

          <radialGradient id={`${id}-hearth`} cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor={ember.light} stopOpacity="0.42" />
            <stop offset="28%" stopColor={ember.core} stopOpacity="0.24" />
            <stop offset="66%" stopColor={ember.core} stopOpacity="0.08" />
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

          <filter id={`${id}-drop`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3.2" result="blur" />
            <feOffset dy="3" result="off" />
            <feColorMatrix
              in="off"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 .6 0"
            />
            <feBlend in="SourceGraphic" />
          </filter>
        </defs>

        {/* Contact shadow: what stops it floating above the map. */}
        <ellipse cx="60" cy="103" rx="24" ry="4.4" fill="#000" opacity="0.5" filter={`url(#${id}-drop)`} />

        <circle
          cx="60"
          cy="60"
          r="58"
          fill={`url(#${id}-ambient)`}
          opacity={ambientOpacity}
          className="poir__ambient"
        />

        {/* ── The summoned circle, hanging in the air ─────────────────────── */}
        {!isExpired && (
          <g className="poir__seal">
            {/* Bloom under a thin hot core: one light stroke blows out to white
                and reads as neon rather than as conjured light. */}
            <path
              d={seal}
              fill="none"
              stroke={ember.core}
              strokeWidth="3.4"
              strokeLinecap="round"
              opacity={urgent ? 0.6 : 0.44}
              filter={`url(#${id}-arcane)`}
            />
            <path
              d={seal}
              fill="none"
              stroke={ember.light}
              strokeWidth="1"
              strokeLinecap="round"
              opacity={urgent ? 0.95 : 0.82}
            />
            {/* Faint outer echo — the circle disturbing the air around it. */}
            <path
              d={arcPath(60, 60, SEAL_RADIUS + 5.5, sealProgress, ccw)}
              fill="none"
              stroke={ember.core}
              strokeWidth="0.7"
              opacity={0.3}
              className="poir__echo"
            />

            {flares.map((f) => (
              <g
                key={`flare-${f.i}`}
                transform={`translate(60 60) rotate(${f.angle}) translate(0 ${-SEAL_RADIUS}) scale(${0.5 + 0.5 * f.lit})`}
                opacity={f.lit * (urgent ? 1 : 0.9)}
                className="poir__flare"
              >
                <path d={FLARE} fill={ember.light} filter={`url(#${id}-arcane)`} />
              </g>
            ))}

            {glyphs.map((g) => (
              <g
                key={`glyph-${g.i}`}
                transform={`translate(60 60) rotate(${g.angle}) translate(0 ${-(SEAL_RADIUS + 7.5)})`}
                className="poir__glyph-mark"
              >
                <g transform={`scale(${0.55 + 0.45 * g.lit})`} opacity={g.lit}>
                  <path
                    d={g.d}
                    fill="none"
                    stroke={ember.core}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    opacity="0.55"
                    filter={`url(#${id}-arcane)`}
                  />
                  <path
                    d={g.d}
                    fill="none"
                    stroke={ember.light}
                    strokeWidth="1"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                </g>
              </g>
            ))}

            {/* The spark doing the summoning. */}
            {sealProgress > 0.001 && sealProgress < 0.999 && (
              <circle
                cx={tip.x}
                cy={tip.y}
                r="2.4"
                fill={ember.light}
                filter={`url(#${id}-arcane)`}
                className="poir__spark"
              />
            )}
          </g>
        )}

        {/* ── The physical medallion ──────────────────────────────────────── */}
        <circle
          cx="60"
          cy="60"
          r="37"
          fill={`url(#${id}-bronze)`}
          stroke="#120C06"
          strokeWidth="1.4"
          filter={`url(#${id}-cast)`}
          className="poir__body"
        />

        {/* Engraved ornament band. Repeated marks read as interlace at size. */}
        <circle cx="60" cy="60" r="33.5" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="7" filter={`url(#${id}-cast)`} />
        <circle cx="60" cy="60" r="36.6" fill="none" stroke="#F0D9A4" strokeWidth="0.5" opacity="0.28" />
        <g stroke="#0D0904" strokeWidth="1.1" strokeLinecap="round" opacity="0.7">
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * Math.PI * 2) / 24;
            const c = Math.cos(a);
            const s = Math.sin(a);
            return (
              <path
                key={i}
                d={`M ${60 + 31 * c} ${60 + 31 * s} L ${60 + 36 * c} ${60 + 36 * s}`}
              />
            );
          })}
        </g>
        <g fill="#C9A45E" opacity="0.32">
          {Array.from({ length: 12 }, (_, i) => {
            const a = ((i + 0.5) * Math.PI * 2) / 12;
            return <circle key={i} cx={60 + 33.5 * Math.cos(a)} cy={60 + 33.5 * Math.sin(a)} r="1.5" />;
          })}
        </g>
        <circle cx="60" cy="60" r="30" fill="none" stroke="#0B0703" strokeWidth="1.6" opacity="0.9" />

        {/* Faceted dark stone. */}
        <circle cx="60" cy="60" r="29" fill={`url(#${id}-stone)`} filter={`url(#${id}-cast)`} />
        <g fill="#000" opacity="0.3">
          {Array.from({ length: 7 }, (_, i) => {
            const a = -Math.PI / 2 + (i * Math.PI * 2) / 7;
            const b = a + 0.72;
            const r1 = 28.5;
            const r2 = 12 + (i % 3) * 4;
            return (
              <path
                key={i}
                d={`M 60 60 L ${60 + r1 * Math.cos(a)} ${60 + r1 * Math.sin(a)} L ${60 + r2 * Math.cos(b)} ${60 + r2 * Math.sin(b)} Z`}
              />
            );
          })}
        </g>
        <circle
          cx="60"
          cy="60"
          r="29"
          fill={`url(#${id}-hearth)`}
          opacity={isExpired ? 0.12 : 1}
          className="poir__hearth"
        />

        {/* Bas-relief glyph: sunken copy first, lit copy on top. */}
        <g transform="translate(60 60)" className="poir__emblem" opacity={isExpired ? 0.35 : 1}>
          <g fill="#070402" opacity="0.85" transform="translate(1 1.4)">
            {glyphFor(type)}
          </g>
          <g fill={`url(#${id}-relief)`} stroke={ember.deep} strokeWidth="0.6" strokeLinejoin="round">
            {glyphFor(type)}
          </g>
        </g>

        {/* Struck highlight along the top-left rim. */}
        <path
          d="M35 46 C43 31, 62 29, 78 37"
          fill="none"
          stroke="#FFF3CE"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.26"
        />

        {selected && (
          <g fill="none" stroke={ember.light} strokeWidth="1.4" opacity="0.9" className="poir__selection">
            <path d="M12 44 L12 30 L26 30" />
            <path d="M108 44 L108 30 L94 30" />
            <path d="M12 76 L12 90 L26 90" />
            <path d="M108 76 L108 90 L94 90" />
          </g>
        )}
      </svg>
    </button>
  );
};

/** Component-scoped material. Any theming still belongs in skinConfigRegistry. */
export const poiRunicStyles = `
.poir {
  --poir-size: 112px;
  position: relative;
  display: inline-flex;
  width: var(--poir-size);
  height: var(--poir-size);
  padding: 0; margin: 0; border: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
  touch-action: manipulation;
  isolation: isolate;
  transition: transform 180ms ease;
}
.poir:focus-visible { outline: 2px solid var(--poir-light); outline-offset: 4px; }
.poir:hover:not(:disabled) { transform: scale(1.035); }
.poir:active:not(:disabled) { transform: scale(.985); }

.poir__svg { width: 100%; height: 100%; overflow: visible; }

.poir__body { transform-origin: 60px 60px; animation: poir-breathe 8s ease-in-out infinite; }
.poir__hearth { animation: poir-hearth 5.5s ease-in-out infinite; }
.poir__ambient { animation: poir-ambient 6.5s ease-in-out infinite; }
.poir__spark { animation: poir-spark 1.9s ease-in-out infinite; }

/* The circle is in the air, so it drifts very slowly against the object. */
.poir__seal { transform-origin: 60px 60px; animation: poir-drift 42s linear infinite; }
.poir__echo { transform-origin: 60px 60px; animation: poir-counter-drift 34s linear infinite; }
.poir__flare { animation: poir-flare 4.5s ease-in-out infinite; }
.poir__glyph-mark { animation: poir-shimmer 3.6s ease-in-out infinite; }
.poir__glyph-mark:nth-child(even) { animation-delay: -1.8s; }

.poir--new .poir__body {
  animation: poir-arrive 720ms cubic-bezier(.2,.9,.2,1) both,
             poir-breathe 8s ease-in-out 720ms infinite;
}
.poir--new .poir__seal {
  animation: poir-summon 900ms ease-out both,
             poir-drift 42s linear 900ms infinite;
}

.poir--expiring .poir__hearth {
  animation: poir-hearth 1.6s ease-in-out infinite, poir-guttering 3.4s steps(1, end) infinite;
}
.poir--expiring .poir__seal { animation: poir-drift 14s linear infinite; }
.poir--expiring .poir__spark { animation: poir-spark .8s ease-in-out infinite; }

.poir--important { filter: drop-shadow(0 0 4px color-mix(in srgb, var(--poir-core) 22%, transparent)); }
.poir--critical { filter: drop-shadow(0 0 7px color-mix(in srgb, var(--poir-core) 38%, transparent)); }
.poir--critical .poir__hearth {
  animation: poir-hearth 1.8s ease-in-out infinite, poir-guttering 2.6s steps(2, end) infinite;
}

.poir--selected .poir__body { animation: poir-selected 1.9s ease-in-out infinite; }

.poir--disabled, .poir--expired { cursor: default; filter: saturate(.55) brightness(.8); }

@keyframes poir-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.008); } }
@keyframes poir-selected { 0%,100% { transform: scale(1); } 50% { transform: scale(1.022); } }
@keyframes poir-hearth { 0%,100% { opacity: .84; } 50% { opacity: 1; } }
@keyframes poir-ambient { 0%,100% { opacity: .78; } 50% { opacity: 1; } }
@keyframes poir-spark { 0%,100% { opacity: .7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.35); } }
@keyframes poir-flare { 0%,100% { opacity: .72; } 50% { opacity: 1; } }
@keyframes poir-shimmer { 0%,100% { opacity: .78; } 50% { opacity: 1; } }
@keyframes poir-drift { from { rotate: 0deg; } to { rotate: 360deg; } }
@keyframes poir-counter-drift { from { rotate: 0deg; } to { rotate: -360deg; } }
@keyframes poir-guttering {
  0%,100% { opacity: 1; } 46% { opacity: .74; } 48% { opacity: .96; }
  71% { opacity: .66; } 73% { opacity: .94; }
}
@keyframes poir-arrive {
  0% { transform: scale(.6) rotate(-8deg); opacity: 0; }
  62% { transform: scale(1.05) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
@keyframes poir-summon {
  0% { opacity: 0; scale: 1.35; }
  55% { opacity: 1; }
  100% { opacity: 1; scale: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .poir, .poir * { animation: none !important; transition: none !important; }
}
`;

export default PoiMarkerRunic;
