/**
 * PoiMarkerArcane — heavy, ornate fantasy seal for high-importance POIs.
 *
 * Builds on the anime-magic mockup: a verdigris/cast-metal frame, faceted
 * obsidian/crystal core, extruded 3D type icon, and an outer magic circle that
 * writes itself glyph by glyph as the deadline approaches. The glyphs stay
 * still; only the lit count grows.
 *
 * Same props as PoiMarker: drop-in interchangeable.
 *
 * Reference page: src/ui/idleVillage/pages/PoiMarkerLabPage.tsx (route /poi-marker-lab)
 */
import React, { CSSProperties, useEffect, useId, useState } from 'react';
import type { PoiMarkerProps, PoiType } from './PoiMarker';
import { MagicCircleHalo } from '@/ui/idleVillage/components/MagicCircleHalo';

/** Type colour = the light trapped inside the crystal, not the metal. */
type ArcanePalette = {
  core: string;
  light: string;
  deep: string;
  patina: string;
  frame: string;
};

const PALETTES: Record<PoiType, ArcanePalette> = {
  // Warm amber arcane.
  quest: {
    core: '#D4A017',
    light: '#F9E4A0',
    deep: '#5C3A0C',
    patina: '#2E1B08',
    frame: '#7d9c6b',
  },
  // Oxidised copper / verdigris.
  job: {
    core: '#4A7C6F',
    light: '#CFF6E2',
    deep: '#12463A',
    patina: '#0f1f1a',
    frame: '#5a8a7a',
  },
  // Deep ember.
  event: {
    core: '#A63D2F',
    light: '#FFC08B',
    deep: '#421713',
    patina: '#1f0d0b',
    frame: '#7d6b4a',
  },
};

const LABELS: Record<PoiType, string> = { quest: 'Quest', job: 'Job', event: 'Event' };

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

/** Extruded 3D icon, centred on the origin, in a 200x200 viewBox. */
function iconFor(type: PoiType, palette: ArcanePalette) {
  if (type === 'quest') {
    return (
      <g filter="url(#extrusion-3d)">
        {/* Cross depth */}
        <path d="M90 68 L110 68 L110 88 L90 88 Z" fill="#16211b" />
        {/* Cross front */}
        <path d="M88 66 L112 66 L112 90 L88 90 Z" fill={palette.frame} stroke={palette.light} strokeWidth="1.2" />
        <path d="M86 84 L114 84 L114 110 L86 110 Z" fill={palette.frame} stroke={palette.light} strokeWidth="1.2" />
        {/* Highlights */}
        <polygon points="88,66 112,66 108,70 92,70" fill={palette.light} opacity="0.8" />
        <polygon points="86,84 90,88 90,106 86,110" fill={palette.light} opacity="0.6" />
      </g>
    );
  }

  if (type === 'job') {
    // Hammer as in the mockup, with type-coloured metal.
    return (
      <g filter="url(#extrusion-3d)">
        {/* Base / extrusion */}
        <path d="M58 82 L142 82 L146 98 L54 98 Z" fill="#16211b" />
        <path d="M60 80 L140 80 L144 96 L56 96 Z" fill={palette.frame} stroke={palette.light} strokeWidth="1.5" />
        <polygon points="60,80 140,80 136,84 64,84" fill={palette.light} opacity="0.8" />
        {/* Handle */}
        <rect x="95" y="96" width="10" height="38" rx="2" fill="#1f1813" stroke={palette.frame} strokeWidth="1" />
        {/* Bands */}
        <line x1="95" y1="104" x2="105" y2="108" stroke={palette.light} strokeWidth="1.5" />
        <line x1="95" y1="116" x2="105" y2="120" stroke={palette.light} strokeWidth="1.5" />
        <line x1="95" y1="128" x2="105" y2="132" stroke={palette.light} strokeWidth="1.5" />
      </g>
    );
  }

  // Event: eight-point spark.
  return (
    <g filter="url(#extrusion-3d)">
      {/* Back spark */}
      <path d="M100 40 L108 84 L156 76 L120 110 L152 156 L100 124 L48 156 L80 110 L44 76 L92 84 Z" fill="#16211b" />
      {/* Front spark */}
      <path d="M100 38 L108 82 L156 74 L120 108 L152 154 L100 122 L48 154 L80 108 L44 74 L92 82 Z" fill={palette.frame} stroke={palette.light} strokeWidth="1.2" />
      {/* Highlights */}
      <polygon points="100,38 108,82 96,82 92,38" fill={palette.light} opacity="0.8" />
    </g>
  );
}

export const PoiMarkerArcane: React.FC<PoiMarkerProps> = ({
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
  const id = `poia-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const palette = PALETTES[type];

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

  // Magic circle writes itself from nothing as the deadline approaches.
  const haloProgress = isExpired ? 0 : state === 'available' || state === 'new' ? 0 : 1 - currentProgress;

  const cssVars = {
    '--poia-core': palette.core,
    '--poia-light': palette.light,
    '--poia-deep': palette.deep,
    '--poia-patina': palette.patina,
    '--poia-frame': palette.frame,
    '--poia-size': `${size}px`,
  } as CSSProperties;

  const ambientOpacity = isExpired
    ? 0
    : importance === 'critical'
      ? 0.22
      : importance === 'important'
        ? 0.14
        : 0.09;

  return (
    <div
      className={['poia-wrap', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, ...style }}
    >
      <button
        type="button"
        aria-label={`${LABELS[type]} ${isExpired ? 'expired' : 'available'}`}
        className={[
          'poia',
          `poia--${type}`,
          `poia--${state}`,
          importance !== 'normal' ? `poia--${importance}` : '',
          selected ? 'poia--selected' : '',
          disabled ? 'poia--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ ...cssVars }}
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        disabled={disabled}
      >
        <svg className="poia__svg" viewBox="0 0 200 200" role="img" aria-hidden="true">
          <defs>
            {/* Verdigris / metal frame gradient */}
            <linearGradient id={`${id}-frame`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.light} />
              <stop offset="30%" stopColor={palette.frame} />
              <stop offset="70%" stopColor={palette.deep} />
              <stop offset="100%" stopColor="#08140f" />
            </linearGradient>

            {/* Crystal / obsidian texture */}
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

            {/* 3D extrusion drop shadows */}
            <filter id="extrusion-3d" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="0" dy="6" stdDeviation="3" floodColor="#000000" floodOpacity="0.95" />
              <feDropShadow dx="3" dy="3" stdDeviation="1" floodColor="#051c14" floodOpacity="0.8" />
            </filter>

            {/* Inner glow gradient */}
            <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.core} stopOpacity="0.55" />
              <stop offset="60%" stopColor={palette.core} stopOpacity="0.15" />
              <stop offset="100%" stopColor={palette.core} stopOpacity="0" />
            </radialGradient>

            {/* Ambient falloff */}
            <radialGradient id={`${id}-ambient`} cx="50%" cy="50%" r="50%">
              <stop offset="45%" stopColor={palette.core} stopOpacity="1" />
              <stop offset="70%" stopColor={palette.core} stopOpacity="0.35" />
              <stop offset="100%" stopColor={palette.core} stopOpacity="0" />
            </radialGradient>

            {/* Contact shadow blur */}
            <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur" />
              <feOffset dy="4" result="off" />
              <feColorMatrix in="off" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.65 0" />
              <feBlend in="SourceGraphic" />
            </filter>

            {/* Convex glass highlight */}
            <linearGradient id={`${id}-glass`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Layer 0: contact shadow */}
          <circle cx="100" cy="108" r="82" fill="#000" opacity="0.55" filter={`url(#${id}-shadow)`} />

          {/* Layer 1: magic ring geometry */}
          <g className="poia__ring">
            {/* Cardinal axes */}
            <g stroke={palette.core} strokeWidth="0.6" opacity="0.55">
              <line x1="10" y1="100" x2="190" y2="100" strokeDasharray="2, 4" />
              <line x1="100" y1="10" x2="100" y2="190" strokeDasharray="2, 4" />
              <circle cx="100" cy="12" r="2" fill={palette.light} />
              <circle cx="100" cy="188" r="2" fill={palette.light} />
              <circle cx="12" cy="100" r="2" fill={palette.light} />
              <circle cx="188" cy="100" r="2" fill={palette.light} />
            </g>

            {/* Concentric circles and geometric marks */}
            <circle cx="100" cy="100" r="88" fill="none" stroke={palette.deep} strokeWidth="0.75" opacity="0.5" />
            <circle cx="100" cy="100" r="84" fill="none" stroke={palette.core} strokeWidth="1" strokeDasharray="12, 4, 2, 4" opacity="0.8" />
            <polygon points="100,16 173,142 27,142" fill="none" stroke={palette.deep} strokeWidth="0.5" opacity="0.35" />
            <polygon points="100,184 27,58 173,58" fill="none" stroke={palette.deep} strokeWidth="0.5" opacity="0.35" />
          </g>

          {/* Ambient color */}
          <circle cx="100" cy="100" r="98" fill={`url(#${id}-ambient)`} opacity={ambientOpacity} className="poia__ambient" />

          {/* Layer 2: metal frame */}
          <circle cx="100" cy="100" r="62" fill={`url(#${id}-frame)`} stroke="#0d1f19" strokeWidth="2" className="poia__frame" />
          <circle cx="100" cy="100" r="58" fill="none" stroke={palette.light} strokeWidth="1" opacity="0.4" />

          {/* Layer 3: obsidian/crystal core */}
          <circle cx="100" cy="100" r="52" fill="#0d1411" />
          <g filter={`url(#${id}-crystal)`} opacity={isExpired ? 0.45 : 1}>
            <polygon points="100,50 135,70 120,110 80,110 65,70" fill={palette.patina} />
            <polygon points="100,50 145,90 130,135 100,150" fill={palette.deep} />
            <polygon points="100,50 55,90 70,135 100,150" fill={palette.frame} opacity="0.6" />
          </g>

          {/* Inner glow */}
          <circle
            cx="100"
            cy="100"
            r="40"
            fill={`url(#${id}-glow)`}
            opacity={isExpired ? 0.2 : 0.5}
            filter="blur(10px)"
            className="poia__glow"
          />

          {/* Layer 4: 3D icon */}
          <g transform="translate(100 100)" opacity={isExpired ? 0.35 : 1} className="poia__emblem">
            {iconFor(type, palette)}
          </g>

          {/* Layer 5: convex glass reflection */}
          <path
            d="M 58 70 A 50 50 0 0 1 142 70 A 48 48 0 0 0 58 70 Z"
            fill={`url(#${id}-glass)`}
            opacity="0.18"
          />

          {/* Selection brackets */}
          {selected && (
            <g fill="none" stroke={palette.light} strokeWidth="1.6" opacity="0.92" className="poia__selection">
              <path d="M42 70 L42 54 L58 54" />
              <path d="M158 70 L158 54 L142 54" />
              <path d="M42 130 L42 146 L58 146" />
              <path d="M158 130 L158 146 L142 146" />
            </g>
          )}
        </svg>
      </button>

      <MagicCircleHalo
        progress={haloProgress}
        isComplete={haloProgress >= 0.999}
        size={Math.round(size * 1.45)}
        className="poia__magic-halo"
      />
    </div>
  );
};

/** Component-scoped material. Any theming still belongs in skinConfigRegistry. */
export const poiArcaneStyles = `
.poia-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.poia {
  position: absolute;
  inset: 0;
  --poia-size: 112px;
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

.poia:focus-visible { outline: 2px solid var(--poia-light); outline-offset: 4px; }
.poia:hover:not(:disabled) { transform: scale(1.03); }
.poia:active:not(:disabled) { transform: scale(0.985); }

.poia__svg { width: 100%; height: 100%; overflow: visible; }

.poia__frame { transform-origin: 100px 100px; animation: poia-frame-breathe 8s ease-in-out infinite; }
.poia__glow { transform-origin: 100px 100px; animation: poia-glow-pulse 3s ease-in-out infinite alternate; }
.poia__ambient { transform-origin: 100px 100px; animation: poia-ambient-breathe 6s ease-in-out infinite; }
.poia__emblem { transform-origin: 0 0; animation: poia-emblem-breathe 7s ease-in-out infinite; }

.poia__magic-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.poia--new .poia__frame {
  animation: poia-arrive 720ms cubic-bezier(.2, .9, .2, 1) both,
             poia-frame-breathe 8s ease-in-out 720ms infinite;
}

.poia--expiring .poia__glow {
  animation: poia-glow-pulse 1.2s ease-in-out infinite alternate,
             poia-gutter 2.6s steps(1, end) infinite;
}

.poia--important { filter: drop-shadow(0 0 5px color-mix(in srgb, var(--poia-core) 24%, transparent)); }
.poia--critical { filter: drop-shadow(0 0 9px color-mix(in srgb, var(--poia-core) 42%, transparent)); }

.poia--selected .poia__frame { animation: poia-selected 1.8s ease-in-out infinite; }

.poia--disabled,
.poia--expired { cursor: default; filter: saturate(0.5) brightness(0.82); }

@keyframes poia-frame-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.006); } }
@keyframes poia-glow-pulse { 0% { opacity: 0.3; } 100% { opacity: 0.7; } }
@keyframes poia-ambient-breathe { 0%, 100% { opacity: 0.78; } 50% { opacity: 1; } }
@keyframes poia-emblem-breathe { 0%, 100% { opacity: 0.95; } 50% { opacity: 1; } }
@keyframes poia-selected { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }
@keyframes poia-arrive {
  0% { transform: scale(0.6) rotate(-6deg); opacity: 0; }
  60% { transform: scale(1.04) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
@keyframes poia-gutter {
  0%, 100% { opacity: 1; } 46% { opacity: 0.76; } 48% { opacity: 0.96; }
  71% { opacity: 0.68; } 73% { opacity: 0.94; }
}

@media (prefers-reduced-motion: reduce) {
  .poia-wrap,
  .poia-wrap * { animation: none !important; transition: none !important; }
}
`;

export default PoiMarkerArcane;
