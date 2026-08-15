/**
 * PoiMarkerRunicV3 — heavy ornate runic seal.
 *
 * V3 adds the anime magic ring (thin geometry, cardinal axes, six-point star,
 * energy nodes and a writing formula), an extruded 3D icon, a crystalline
 * obsidian core and a cast-metal pointed crown (Heavy Metal Bezel).
 *
 * Same props as PoiMarker: drop-in interchangeable.
 *
 * Reference page: src/ui/idleVillage/pages/PoiMarkerLabPage.tsx (route /poi-marker-lab)
 */
import React, { CSSProperties, useEffect, useId, useMemo, useState } from 'react';
import type { PoiMarkerProps, PoiType } from './PoiMarker';

type Ember = { core: string; light: string; deep: string; patina: string; metal: 'bronze' | 'verdigris' | 'gold' };

const EMBERS: Record<PoiType, Ember> = {
  // Warm gold.
  quest: { core: '#E3A93C', light: '#FFE9B0', deep: '#5E3A0F', patina: '#3A2A10', metal: 'gold' },
  // Oxidised copper.
  job: { core: '#5FC7A2', light: '#CFF6E2', deep: '#12463A', patina: '#13322C', metal: 'verdigris' },
  // Ember bronze.
  event: { core: '#D9452F', light: '#FFB08A', deep: '#4E120C', patina: '#33110D', metal: 'bronze' },
};

const LABELS: Record<PoiType, string> = { quest: 'Quest', job: 'Job', event: 'Event' };

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

const CROWN_PALETTES = {
  bronze: { main: '#a05c18', light: '#fce890', dark: '#341604', accent: '#602c08' },
  verdigris: { main: '#3d6655', light: '#84b8a1', dark: '#081410', accent: '#183329' },
  gold: { main: '#c9a227', light: '#fff2a1', dark: '#4a3806', accent: '#785b0d' },
};

/** Six-point star / mandala. */
const SIX_POINT_STAR =
  'M100 30 L112 70 L156 70 L120 96 L132 138 L100 112 L68 138 L80 96 L44 70 L88 70 Z';

const INNER_HEXAGON = 'M100 52 L123 65 L123 91 L100 104 L77 91 L77 65 Z';

function glyphFor(type: PoiType) {
  if (type === 'quest') {
    return (
      <g>
        <path d="M0,-16 L0,12 M-12,-2 L12,-2" strokeWidth="5" />
        <circle cx="0" cy="0" r="5" />
      </g>
    );
  }
  if (type === 'job') {
    return (
      <g>
        <path d="M-18 -10 L18 -10 L22 6 L-22 6 Z" />
        <rect x="-4" y="6" width="8" height="22" rx="1" />
      </g>
    );
  }
  return (
    <g>
      <path d="M0 -20 L4 -4 L20 0 L4 4 L0 20 L-4 4 L-20 0 L-4 -4 Z" />
      <circle cx="0" cy="0" r="4" />
    </g>
  );
}

export const PoiMarkerRunicV3: React.FC<PoiMarkerProps> = ({
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
  const id = `poi3-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ember = EMBERS[type];
  const metal = CROWN_PALETTES[ember.metal];

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

  // Halo and formula write themselves as the deadline approaches.
  const haloProgress = isExpired ? 0 : state === 'available' || state === 'new' ? 0 : 1 - currentProgress;

  const formulaCircumference = useMemo(() => 2 * Math.PI * 76, []);
  const formulaMaskOffset = formulaCircumference * (1 - haloProgress);

  const cssVars = {
    '--poi3-core': ember.core,
    '--poi3-light': ember.light,
    '--poi3-deep': ember.deep,
    '--poi3-patina': ember.patina,
    '--poi3-size': `${size}px`,
  } as CSSProperties;

  const ambientOpacity = isExpired
    ? 0
    : importance === 'critical'
      ? 0.22
      : importance === 'important'
        ? 0.13
        : 0.08;

  return (
    <div
      className={['poi3-wrap', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, ...style }}
    >
      <button
        type="button"
        aria-label={`${LABELS[type]} ${isExpired ? 'expired' : 'available'}`}
        className={[
          'poi3',
          `poi3--${type}`,
          `poi3--${state}`,
          importance !== 'normal' ? `poi3--${importance}` : '',
          selected ? 'poi3--selected' : '',
          disabled ? 'poi3--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ ...cssVars }}
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        disabled={disabled}
      >
        <svg className="poi3__svg" viewBox="0 0 200 200" role="img" aria-hidden="true">
          <defs>
            {/* Metal bevel gradient */}
            <radialGradient id={`${id}-metal-bevel`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor={metal.light} />
              <stop offset="15%" stopColor={metal.main} />
              <stop offset="45%" stopColor={metal.dark} />
              <stop offset="70%" stopColor={metal.main} />
              <stop offset="88%" stopColor={metal.accent} />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>

            {/* Heavy metal emboss filter */}
            <filter id={`${id}-heavy-metal`} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="displaced" />
              <feGaussianBlur in="displaced" stdDeviation="1.5" result="blur" />
              <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1.2" specularExponent="15" lightingColor="#ffffff" result="specular">
                <feDistantLight azimuth="225" elevation="45" />
              </feSpecularLighting>
              <feComposite in="specular" in2="displaced" operator="in" result="specularCut" />
              <feBlend in="displaced" in2="specularCut" mode="screen" />
            </filter>

            {/* Crown drop shadow */}
            <filter id={`${id}-crown-shadow`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#000000" floodOpacity="0.85" />
            </filter>

            {/* Crystal / obsidian noise */}
            <filter id={`${id}-crystal`} x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
              <feColorMatrix
                type="matrix"
                values="0.05 0 0 0 0
                        0.15 0 0 0 0
                        0.12 0 0 0 0
                        0 0 0 0.95 0"
                result="colored"
              />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>

            {/* 3D extrusion double shadow */}
            <filter id={`${id}-extrude`} x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="0" dy="6" stdDeviation="3" floodColor="#000000" floodOpacity="0.95" />
              <feDropShadow dx="3" dy="3" stdDeviation="1" floodColor="#051c14" floodOpacity="0.8" />
            </filter>

            {/* Inner glow */}
            <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={ember.core} stopOpacity="0.5" />
              <stop offset="60%" stopColor={ember.core} stopOpacity="0.12" />
              <stop offset="100%" stopColor={ember.core} stopOpacity="0" />
            </radialGradient>

            {/* Ambient falloff */}
            <radialGradient id={`${id}-ambient`} cx="50%" cy="50%" r="50%">
              <stop offset="45%" stopColor={ember.core} stopOpacity="1" />
              <stop offset="70%" stopColor={ember.core} stopOpacity="0.35" />
              <stop offset="100%" stopColor={ember.core} stopOpacity="0" />
            </radialGradient>

            {/* Formula track and mask */}
            <path
              id={`${id}-formula-track`}
              d="M 100,100 m -76,0 a 76,76 0 1,1 152,0 a 76,76 0 1,1 -152,0"
            />
            <mask id={`${id}-formula-mask`}>
              <circle cx="100" cy="100" r="86" fill="black" />
              <path
                d="M 100,100 m -76,0 a 76,76 0 1,1 152,0 a 76,76 0 1,1 -152,0"
                fill="none"
                stroke="white"
                strokeWidth="14"
                strokeDasharray={formulaCircumference}
                strokeDashoffset={formulaMaskOffset}
                strokeLinecap="butt"
                transform="rotate(-90 100 100)"
                className="poi3__formula-mask"
              />
            </mask>

            {/* Convex glass highlight */}
            <linearGradient id={`${id}-glass`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Contact shadow */}
            <filter id={`${id}-drop`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
              <feOffset dy="4" result="off" />
              <feColorMatrix in="off" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.65 0" />
              <feBlend in="SourceGraphic" />
            </filter>
          </defs>

          {/* Layer 0: contact shadow */}
          <circle cx="100" cy="108" r="85" fill="#000" opacity="0.55" filter={`url(#${id}-drop)`} />

          {/* Layer 1: magic ring (anime style) */}
          <g className="poi3__ring" opacity={haloProgress > 0.001 ? 1 : 0}>
            {/* Cardinal axes and energy nodes */}
            <g stroke={ember.core} strokeWidth="0.6" opacity="0.6">
              <line x1="10" y1="100" x2="190" y2="100" strokeDasharray="2, 4" />
              <line x1="100" y1="10" x2="100" y2="190" strokeDasharray="2, 4" />
              <circle cx="100" cy="12" r="2.5" fill={ember.light} />
              <circle cx="100" cy="188" r="2.5" fill={ember.light} />
              <circle cx="12" cy="100" r="2.5" fill={ember.light} />
              <circle cx="188" cy="100" r="2.5" fill={ember.light} />
            </g>

            {/* Six-point star and hexagon */}
            <path d={SIX_POINT_STAR} fill="none" stroke={ember.deep} strokeWidth="0.7" opacity="0.5" />
            <path d={INNER_HEXAGON} fill="none" stroke={ember.core} strokeWidth="0.7" opacity="0.5" />

            {/* Concentric rings */}
            <circle cx="100" cy="100" r="88" fill="none" stroke={ember.deep} strokeWidth="0.75" opacity="0.45" />
            <circle cx="100" cy="100" r="84" fill="none" stroke={ember.core} strokeWidth="1" strokeDasharray="14, 5, 3, 5" opacity="0.8" />

            {/* Animated formula on textPath */}
            <text
              fill={ember.light}
              fontSize="8.5"
              fontFamily="'Courier New', monospace"
              letterSpacing="2"
              mask={`url(#${id}-formula-mask)`}
              className="poi3__formula"
            >
              <textPath href={`#${id}-formula-track`} startOffset="0%">
                ✦ SIGILLUM ✦ ARCANUM ✦ MATERIA CRISTALLI ✦ INCANTATIO ✦
              </textPath>
            </text>
          </g>

          {/* Ambient color */}
          <circle cx="100" cy="100" r="98" fill={`url(#${id}-ambient)`} opacity={ambientOpacity} className="poi3__ambient" />

          {/* Layer A: heavy metal pointed crown */}
          <g filter={`url(#${id}-crown-shadow)`} className="poi3__crown">
            <path
              d="M100,10 L108,30 L126,20 L128,40 L148,36 L142,56 L162,60 L150,78 L170,88 L152,100 L170,112 L150,122 L162,140 L142,144 L148,164 L128,160 L126,180 L108,170 L100,190 L92,170 L74,180 L72,160 L52,164 L58,144 L38,140 L50,122 L30,112 L48,100 L30,88 L50,78 L38,60 L58,56 L52,36 L72,40 L74,20 L92,30 Z"
              fill={`url(#${id}-metal-bevel)`}
              filter={`url(#${id}-heavy-metal)`}
            />
            <circle cx="100" cy="100" r="68" fill="none" stroke={metal.dark} strokeWidth="4" />
            <circle cx="100" cy="100" r="65" fill="none" stroke={metal.light} strokeWidth="1.5" opacity="0.7" />
          </g>

          {/* Layer B: icon housing */}
          <circle cx="100" cy="100" r="58" fill="#0c0a08" stroke={metal.accent} strokeWidth="3" />

          {/* Layer 3: crystalline obsidian core */}
          <g filter={`url(#${id}-crystal)`} opacity={isExpired ? 0.45 : 1}>
            <polygon points="100,48 138,70 124,114 76,114 62,70" fill={ember.patina} />
            <polygon points="100,48 148,92 132,140 100,156" fill={ember.deep} />
            <polygon points="100,48 52,92 68,140 100,156" fill={ember.patina} />
          </g>

          {/* Inner glow */}
          <circle
            cx="100"
            cy="100"
            r="42"
            fill={`url(#${id}-glow)`}
            opacity={isExpired ? 0.18 : 0.5}
            filter="blur(10px)"
            className="poi3__glow"
          />

          {/* Layer 4: extruded 3D icon */}
          <g transform="translate(100 100)" filter={`url(#${id}-extrude)`} opacity={isExpired ? 0.35 : 1} className="poi3__emblem">
            <g fill={ember.light} stroke={ember.deep} strokeWidth="0.8" strokeLinejoin="round">
              {glyphFor(type)}
            </g>
          </g>

          {/* Layer 5: convex glass reflection */}
          <path
            d="M 56 68 A 50 50 0 0 1 144 68 A 48 48 0 0 0 56 68 Z"
            fill={`url(#${id}-glass)`}
            opacity="0.16"
          />

          {selected && (
            <g fill="none" stroke={ember.light} strokeWidth="1.6" opacity="0.9" className="poi3__selection">
              <path d="M42 70 L42 54 L58 54" />
              <path d="M158 70 L158 54 L142 54" />
              <path d="M42 130 L42 146 L58 146" />
              <path d="M158 130 L158 146 L142 146" />
            </g>
          )}
        </svg>
      </button>
    </div>
  );
};

/** Component-scoped material. Any theming still belongs in skinConfigRegistry. */
export const poiRunicV3Styles = `
.poi3-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.poi3 {
  position: absolute;
  inset: 0;
  --poi3-size: 112px;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
  touch-action: manipulation;
  isolation: isolate;
  transition: transform 180ms ease;
}

.poi3:focus-visible { outline: 2px solid var(--poi3-light); outline-offset: 4px; }
.poi3:hover:not(:disabled) { transform: scale(1.03); }
.poi3:active:not(:disabled) { transform: scale(0.985); }

.poi3__svg { width: 100%; height: 100%; overflow: visible; }

.poi3__crown { transform-origin: 100px 100px; animation: poi3-crown-breathe 8s ease-in-out infinite; }
.poi3__glow { transform-origin: 100px 100px; animation: poi3-glow-pulse 3s ease-in-out infinite alternate; }
.poi3__ambient { transform-origin: 100px 100px; animation: poi3-ambient-breathe 6s ease-in-out infinite; }
.poi3__emblem { transform-origin: 0 0; animation: poi3-emblem-breathe 7s ease-in-out infinite; }

.poi3__formula-mask {
  transition: stroke-dashoffset 0.25s linear;
}

.poi3--new .poi3__crown {
  animation: poi3-arrive 720ms cubic-bezier(.2, .9, .2, 1) both,
             poi3-crown-breathe 8s ease-in-out 720ms infinite;
}

.poi3--expiring .poi3__glow {
  animation: poi3-glow-pulse 1.2s ease-in-out infinite alternate,
             poi3-gutter 2.6s steps(1, end) infinite;
}

.poi3--important { filter: drop-shadow(0 0 5px color-mix(in srgb, var(--poi3-core) 24%, transparent)); }
.poi3--critical { filter: drop-shadow(0 0 9px color-mix(in srgb, var(--poi3-core) 42%, transparent)); }

.poi3--selected .poi3__crown { animation: poi3-selected 1.8s ease-in-out infinite; }

.poi3--disabled,
.poi3--expired { cursor: default; filter: saturate(0.5) brightness(0.82); }

@keyframes poi3-crown-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.006); } }
@keyframes poi3-glow-pulse { 0% { opacity: 0.3; } 100% { opacity: 0.7; } }
@keyframes poi3-ambient-breathe { 0%, 100% { opacity: 0.78; } 50% { opacity: 1; } }
@keyframes poi3-emblem-breathe { 0%, 100% { opacity: 0.95; } 50% { opacity: 1; } }
@keyframes poi3-selected { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }
@keyframes poi3-arrive {
  0% { transform: scale(0.6) rotate(-6deg); opacity: 0; }
  60% { transform: scale(1.04) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
@keyframes poi3-gutter {
  0%, 100% { opacity: 1; } 46% { opacity: 0.76; } 48% { opacity: 0.96; }
  71% { opacity: 0.68; } 73% { opacity: 0.94; }
}

@media (prefers-reduced-motion: reduce) {
  .poi3-wrap,
  .poi3-wrap * { animation: none !important; transition: none !important; }
}
`;

export default PoiMarkerRunicV3;
