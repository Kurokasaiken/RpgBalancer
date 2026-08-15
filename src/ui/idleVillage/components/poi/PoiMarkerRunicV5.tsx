/**
 * PoiMarkerRunicV5 — based on the Gemini mockup and the PoiBadgeSvg reference.
 *
 * A heavy bronze/verdigris/obsidian medallion with:
 *  - an extruded pointed crown (LAYER 3 from the mockup)
 *  - a concentric magic seal that reveals progressively (V4 proven behaviour)
 *  - a faceted obsidian core
 *  - a 3D extruded type icon (shield / hammer / star)
 *  - a convex glass reflection
 *
 * Same props as PoiMarker: drop-in interchangeable.
 *
 * Reference: public/assets/ref/poi-gemini-mockup.png
 * Reference page: src/ui/idleVillage/pages/PoiMarkerLabPage.tsx (route /poi-marker-lab)
 */
import React, { CSSProperties, useEffect, useId, useMemo, useState } from 'react';
import type { PoiMarkerProps, PoiType } from './PoiMarker';
import { getPgCardFrameTokens } from '@/ui/idleVillage/config/pgCardFrameConfig';

type Ember = { core: string; light: string; deep: string; patina: string; metal: 'bronze' | 'verdigris' | 'crimson' };

const EMBERS: Record<PoiType, Ember> = {
  quest: { core: '#E3A93C', light: '#FFE9B0', deep: '#5E3A0F', patina: '#3A2A10', metal: 'bronze' },
  job: { core: '#5FC7A2', light: '#CFF6E2', deep: '#12463A', patina: '#13322C', metal: 'verdigris' },
  event: { core: '#D9452F', light: '#FFB08A', deep: '#4E120C', patina: '#33110D', metal: 'crimson' },
};

const METAL = {
  bronze: { main: '#d4af37', light: '#ffe699', dark: '#593e03', shadow: '#1a1200' },
  verdigris: { main: '#5a9e8a', light: '#9be0c9', dark: '#1e3b33', shadow: '#081410' },
  crimson: { main: '#a83a2a', light: '#ff8c7a', dark: '#4a120c', shadow: '#1a0504' },
};

const LABELS: Record<PoiType, string> = { quest: 'Quest', job: 'Job', event: 'Event' };

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

/** 12 abstract fictional letter forms, none of them Norse or real alphabets. */
const LETTERS: string[] = [
  'M-2,-5 v10 M0,-4 v8 M2,-6 v12',
  'M-4,0 q4,-6 8,0 q-4,6 -8,0',
  'M-3,-4 l6,0 l-3,8 z',
  'M-3,-3 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M-1,-1 l2,2',
  'M0,-5 l-4,10 M0,-5 l4,10',
  'M-4,-3 l4,-2 l4,2 l-4,5 z',
  'M-4,0 l8,0 M-4,-3 l8,0 M-4,3 l8,0',
  'M-3,-4 q6,0 0,8 q-6,0 0,-8',
  'M-4,-2 l8,0 l-4,8 z',
  'M-2,-5 l2,5 l2,-5 M-2,5 l2,-5 l2,5',
  'M-4,-4 l8,0 l0,8 l-8,0 z M-2,-2 l4,4',
  'M0,-5 l-3,5 l6,0 z M-2,2 l4,0',
];

const SEAL_SIGNS: string[] = [
  'M-4,-4 L4,0 L-4,4 Z',
  'M0,-5 L3,0 L0,5 L-3,0 Z',
  'M-3,-3 L3,-3 L3,3 L-3,3 Z',
  'M0,-5 A5,5 0 1,0 0,5 A5,5 0 1,0 0,-5',
  'M-4,0 L4,0 M0,-4 L0,4',
  'M-3,-3 L3,3 M-3,3 L3,-3',
];

function chunkBand<T>(count: number, items: T[]) {
  return Array.from({ length: count }, (_, i) => items[i % items.length]);
}

/** 3D extruded shield. */
function shieldIcon() {
  return (
    <g>
      {/* Shadow */}
      <path
        d="M 100,58 C 70,58 58,70 58,92 C 58,122 100,150 100,150 C 100,150 142,122 142,92 C 142,70 130,58 100,58 Z"
        fill="#2a1e02"
        transform="translate(0,3)"
        opacity="0.9"
      />
      {/* Main body */}
      <path
        d="M 100,58 C 70,58 58,70 58,92 C 58,122 100,150 100,150 C 100,150 142,122 142,92 C 142,70 130,58 100,58 Z"
        fill="url(#poi5-gold-metal)"
        stroke="#ffe699"
        strokeWidth="1.2"
      />
      {/* Inner field */}
      <path
        d="M 100,68 C 78,68 70,77 70,93 C 70,116 100,138 100,138 C 100,138 130,116 130,93 C 130,77 122,68 100,68 Z"
        fill="none"
        stroke="#593e03"
        strokeWidth="1.5"
      />
      {/* Highlight */}
      <path
        d="M 75,78 C 85,70 115,70 125,78"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.4"
        opacity="0.45"
        strokeLinecap="round"
      />
    </g>
  );
}

/** 3D extruded hammer. */
function hammerIcon() {
  return (
    <g>
      {/* Shadow */}
      <path
        d="M 78,66 L 122,66 L 126,88 L 74,88 Z M 92,88 L 108,88 L 108,138 L 92,138 Z"
        fill="#0c1a16"
        transform="translate(0,3)"
        opacity="0.9"
      />
      {/* Head */}
      <path
        d="M 78,66 L 122,66 L 126,88 L 74,88 Z"
        fill="url(#poi5-gold-metal)"
        stroke="#9be0c9"
        strokeWidth="1"
      />
      {/* Handle */}
      <rect x="92" y="88" width="16" height="52" fill="#3d2610" stroke="#1a1200" strokeWidth="1" />
      {/* Highlights */}
      <path d="M 80,70 L 120,70" stroke="#ffffff" strokeWidth="1" opacity="0.35" />
      <path d="M 94,90 L 106,90" stroke="#ffffff" strokeWidth="0.8" opacity="0.25" />
    </g>
  );
}

/** 3D extruded crystal star. */
function starIcon() {
  return (
    <g>
      {/* Shadow */}
      <path
        d="M 100,56 L 112,88 L 146,92 L 122,116 L 128,150 L 100,132 L 72,150 L 78,116 L 54,92 L 88,88 Z"
        fill="#2a0805"
        transform="translate(0,3)"
        opacity="0.9"
      />
      {/* Main star */}
      <path
        d="M 100,56 L 112,88 L 146,92 L 122,116 L 128,150 L 100,132 L 72,150 L 78,116 L 54,92 L 88,88 Z"
        fill="url(#poi5-gold-metal)"
        stroke="#ff8c7a"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Inner crystal facets */}
      <path d="M 100,88 L 112,92 L 100,110 L 88,92 Z" fill="#33110d" />
      <path d="M 100,88 L 88,92 L 78,116 L 100,110 Z" fill="#5a1a12" />
      <path d="M 100,88 L 112,92 L 122,116 L 100,110 Z" fill="#3a120c" />
      <path d="M 100,110 L 100,132 L 128,150 L 122,116 Z" fill="#6e2418" />
      <path d="M 100,110 L 100,132 L 72,150 L 78,116 Z" fill="#4e120c" />
      <circle cx="100" cy="100" r="5" fill="#ff8c7a" />
    </g>
  );
}

function iconFor(type: PoiType) {
  if (type === 'quest') return shieldIcon();
  if (type === 'job') return hammerIcon();
  return starIcon();
}

export const PoiMarkerRunicV5: React.FC<PoiMarkerProps> = ({
  type,
  state = 'available',
  progress = 1,
  durationMs,
  autoStart = true,
  onExpire,
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
  const id = `poi5-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ember = EMBERS[type];
  const metal = METAL[ember.metal];

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
  const haloProgress = isExpired ? 0 : state === 'available' || state === 'new' ? 0 : 1 - currentProgress;

  const pgCardFrame = useMemo(
    () => getPgCardFrameTokens(type === 'quest' ? 'legendary' : type === 'job' ? 'veteran' : 'heroic'),
    [type],
  );

  // Concentric inscription bands reveal progressively.
  const LETTER_COUNT = 24;
  const letterStep = 360 / LETTER_COUNT;
  const outerBand = useMemo(
    () =>
      chunkBand(LETTER_COUNT, LETTERS).map((d, i) => {
        const a = -90 + i * letterStep;
        const r = 82;
        const rad = (a * Math.PI) / 180;
        const active = i < Math.floor(haloProgress * LETTER_COUNT) ? 1 : 0;
        return { d, a, x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad), active };
      }),
    [haloProgress],
  );

  const INNER_SIGNS = 12;
  const innerBand = useMemo(
    () =>
      chunkBand(INNER_SIGNS, SEAL_SIGNS).map((d, i) => {
        const a = -90 + (i * 360) / INNER_SIGNS;
        const r = 66;
        const rad = (a * Math.PI) / 180;
        const active = i < Math.floor(haloProgress * INNER_SIGNS) ? 1 : 0;
        return { d, a, x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad), active };
      }),
    [haloProgress],
  );

  const outerRingRadius = 86;
  const innerRingRadius = 78;
  const glowRingRadius = 74;
  const outerRingCircumference = useMemo(() => 2 * Math.PI * outerRingRadius, [outerRingRadius]);
  const innerRingCircumference = useMemo(() => 2 * Math.PI * innerRingRadius, [innerRingRadius]);
  const glowCircumference = useMemo(() => 2 * Math.PI * glowRingRadius, [glowRingRadius]);
  const litSteps = Math.max(0, Math.min(LETTER_COUNT, Math.floor(haloProgress * LETTER_COUNT)));
  const arcProgress = litSteps / LETTER_COUNT;
  const outerRingOffset = outerRingCircumference * (1 - arcProgress);
  const innerRingOffset = innerRingCircumference * (1 - arcProgress);
  const glowOffset = glowCircumference * (1 - arcProgress);

  const cssVars = {
    '--poi5-core': ember.core,
    '--poi5-light': ember.light,
    '--poi5-deep': ember.deep,
    '--poi5-size': `${size}px`,
  } as CSSProperties;

  return (
    <div
      className={['poi5-wrap', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, ...style }}
    >
      <button
        type="button"
        aria-label={`${LABELS[type]} ${isExpired ? 'expired' : 'available'}`}
        className={[
          'poi5',
          `poi5--${type}`,
          `poi5--${state}`,
          importance !== 'normal' ? `poi5--${importance}` : '',
          selected ? 'poi5--selected' : '',
          disabled ? 'poi5--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ ...cssVars }}
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        disabled={disabled}
      >
        <svg className="poi5__svg" viewBox="0 0 200 200" role="img" aria-hidden="true">
          <defs>
            <radialGradient id={`${id}-gold-metal`} cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor={metal.light} />
              <stop offset="25%" stopColor={metal.main} />
              <stop offset="60%" stopColor={pgCardFrame.borderColor} />
              <stop offset="85%" stopColor={metal.dark} />
              <stop offset="100%" stopColor={metal.shadow} />
            </radialGradient>

            <radialGradient id={`poi5-gold-metal`} cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor={metal.light} />
              <stop offset="25%" stopColor={metal.main} />
              <stop offset="60%" stopColor={pgCardFrame.borderColor} />
              <stop offset="85%" stopColor={metal.dark} />
              <stop offset="100%" stopColor={metal.shadow} />
            </radialGradient>

            <radialGradient id={`${id}-obsidian-core`} cx="40%" cy="30%" r="60%">
              <stop offset="0%" stopColor={ember.patina} />
              <stop offset="50%" stopColor={ember.deep} />
              <stop offset="100%" stopColor="#050806" />
            </radialGradient>

            <filter id={`${id}-depth-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="3" floodColor="#000000" floodOpacity="0.9" />
              <feDropShadow dx="2" dy="2" stdDeviation="1" floodColor={metal.light} floodOpacity="0.3" />
            </filter>

            <filter id={`${id}-magic-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id={`${id}-rim-bevel`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur" />
              <feSpecularLighting in="blur" surfaceScale="4" specularConstant="1.1" specularExponent="18" lightingColor="#ffffff" result="specular">
                <feDistantLight azimuth="225" elevation="55" />
              </feSpecularLighting>
              <feComposite in="specular" in2="SourceAlpha" operator="in" result="specularCut" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="specularCut" />
              </feMerge>
            </filter>

            <filter id={`${id}-pgcard-shadow`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
              <feOffset dy="3" result="off" />
              <feComponentTransfer in="off" result="offA">
                <feFuncA type="linear" slope="0.65" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="offA" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id={`${id}-pgcard-bevel`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur" />
              <feSpecularLighting in="blur" surfaceScale="4" specularConstant="1.1" specularExponent="18" lightingColor="#ffffff" result="specular">
                <feDistantLight azimuth="225" elevation="55" />
              </feSpecularLighting>
              <feComposite in="specular" in2="SourceAlpha" operator="in" result="specularCut" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="specularCut" />
              </feMerge>
            </filter>
          </defs>

          {/* LAYER 0: base shadow on the map */}
          <circle cx="100" cy="106" r="80" fill="#000" opacity="0.5" filter="blur(6px)" />

          {/* LAYER 1-2: concentric magic seal (proven V4 behaviour) */}
          {haloProgress > 0.001 && (
            <g className="poi5__seal" opacity={Math.min(1, haloProgress * 2)}>
              <circle
                cx="100"
                cy="100"
                r={outerRingRadius}
                fill="none"
                stroke={ember.core}
                strokeWidth="1.2"
                strokeDasharray={outerRingCircumference}
                strokeDashoffset={outerRingOffset}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />

              {outerBand.map((g, i) => (
                <g
                  key={`l-${i}`}
                  transform={`translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.a})`}
                  opacity={g.active}
                >
                  <path
                    d={g.d}
                    fill="none"
                    stroke={ember.light}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={g.active ? `url(#${id}-magic-glow)` : undefined}
                  />
                </g>
              ))}

              <circle
                cx="100"
                cy="100"
                r={innerRingRadius}
                fill="none"
                stroke={ember.light}
                strokeWidth="1.2"
                strokeDasharray={innerRingCircumference}
                strokeDashoffset={innerRingOffset}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />

              <circle
                cx="100"
                cy="100"
                r={glowRingRadius}
                fill="none"
                stroke={ember.core}
                strokeWidth="9"
                strokeDasharray={glowCircumference}
                strokeDashoffset={glowOffset}
                strokeLinecap="round"
                opacity="0.35"
                filter={`url(#${id}-magic-glow)`}
                transform="rotate(-90 100 100)"
              />

              <circle cx="100" cy="100" r={glowRingRadius - 4} fill="none" stroke={ember.core} strokeWidth="0.5" opacity="0.4" />
              <circle cx="100" cy="100" r={glowRingRadius - 14} fill="none" stroke={ember.light} strokeWidth="0.4" opacity="0.3" />

              {innerBand.map((g, i) => (
                <g
                  key={`s-${i}`}
                  transform={`translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.a})`}
                  opacity={g.active}
                >
                  <path
                    d={g.d}
                    fill={ember.core}
                    stroke={ember.light}
                    strokeWidth="0.8"
                    strokeLinejoin="round"
                    filter={g.active ? `url(#${id}-magic-glow)` : undefined}
                  />
                </g>
              ))}
            </g>
          )}

          {/* LAYER 3: extruded pointed crown */}
          <g filter={`url(#${id}-depth-shadow)`} className="poi5__crown">
            <path
              d="
                M 100,20 L 107,35 L 122,25 L 122,41 L 139,37 L 133,52 L 151,55 L 140,69
                L 158,80 L 142,90 L 158,100 L 142,110 L 158,120 L 140,131 L 151,145
                L 133,148 L 139,163 L 122,159 L 122,175 L 107,165 L 100,180 L 93,165
                L 78,175 L 78,159 L 61,163 L 67,148 L 49,145 L 60,131 L 42,120
                L 58,110 L 42,100 L 58,90 L 42,80 L 60,69 L 49,55 L 67,52
                L 61,37 L 78,41 L 78,25 L 93,35 Z
              "
              fill={`url(#${id}-gold-metal)`}
              stroke={metal.dark}
              strokeWidth="1"
            />

            <circle cx="100" cy="100" r="66" fill={`url(#${id}-gold-metal)`} stroke="#2a1e02" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="62" fill="none" stroke={metal.light} strokeWidth="1" opacity="0.6" filter={`url(#${id}-rim-bevel)`} />
            <circle cx="100" cy="100" r="56" fill="#0d0a03" stroke={metal.dark} strokeWidth="2" />

            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke={pgCardFrame.borderColor}
              strokeWidth={pgCardFrame.borderWidth}
              filter={`url(#${id}-pgcard-shadow)`}
            />
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke={pgCardFrame.accentColor}
              strokeWidth="1.2"
              opacity="0.7"
              filter={`url(#${id}-pgcard-bevel)`}
            />
            {pgCardFrame.hasCornerDecorations && (
              <g fill="none" stroke={pgCardFrame.accentColor} strokeWidth="2" strokeLinecap="round" opacity="0.9" filter={`url(#${id}-pgcard-bevel)`}>
                <path d="M64 64 L72 64 L64 72" />
                <path d="M136 64 L128 64 L136 72" />
                <path d="M64 136 L72 136 L64 128" />
                <path d="M136 136 L128 136 L136 128" />
              </g>
            )}
          </g>

          {/* LAYER 4: faceted obsidian core */}
          <g>
            <circle cx="100" cy="100" r="52" fill={`url(#${id}-obsidian-core)`} />
            <polygon points="100,48 130,65 115,100 85,100 70,65" fill={ember.deep} opacity="0.5" />
            <polygon points="100,48 140,85 125,130 100,152" fill={ember.patina} opacity="0.3" />
            <polygon points="100,48 60,85 75,130 100,152" fill={ember.deep} opacity="0.4" />
            <circle cx="100" cy="100" r="52" fill="none" stroke="#000000" strokeWidth="3" opacity="0.8" />
          </g>

          {/* LAYER 5: 3D extruded icon */}
          <g filter={`url(#${id}-depth-shadow)`}>
            {iconFor(type)}
          </g>

          {/* LAYER 6: convex glass reflection */}
          <path d="M 54 75 A 50 50 0 0 1 146 75 A 46 46 0 0 0 54 75 Z" fill="#ffffff" opacity="0.1" />
        </svg>
      </button>
    </div>
  );
};

/** Component-scoped material. Any theming still belongs in skinConfigRegistry. */
export const poiRunicV5Styles = `
.poi5-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.poi5 {
  position: absolute;
  inset: 0;
  --poi5-size: 112px;
  width: 100%;
  height: 100%;
  padding: 0; margin: 0; border: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
  touch-action: manipulation;
  isolation: isolate;
  transition: transform 180ms ease;
}

.poi5:focus-visible { outline: 2px solid var(--poi5-light); outline-offset: 4px; }
.poi5:hover:not(:disabled) { transform: scale(1.035); }
.poi5:active:not(:disabled) { transform: scale(.985); }

.poi5__svg { width: 100%; height: 100%; overflow: visible; }

.poi5__crown { transform-origin: 100px 100px; animation: poi5-crown-breathe 8s ease-in-out infinite; }

.poi5--new .poi5__crown {
  animation: poi5-arrive 720ms cubic-bezier(.2,.9,.2,1) both,
             poi5-crown-breathe 8s ease-in-out 720ms infinite;
}

.poi5--important { filter: drop-shadow(0 0 5px color-mix(in srgb, var(--poi5-core) 24%, transparent)); }
.poi5--critical { filter: drop-shadow(0 0 9px color-mix(in srgb, var(--poi5-core) 42%, transparent)); }

.poi5--selected .poi5__crown { animation: poi5-selected 1.9s ease-in-out infinite; }

.poi5--disabled,
.poi5--expired { cursor: default; filter: saturate(.55) brightness(.82); }

@keyframes poi5-crown-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.004); } }
@keyframes poi5-selected { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.022); } }
@keyframes poi5-arrive {
  0% { transform: scale(.6) rotate(-8deg); opacity: 0; }
  62% { transform: scale(1.05) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .poi5-wrap,
  .poi5-wrap * { animation: none !important; transition: none !important; }
}
`;

export default PoiMarkerRunicV5;
