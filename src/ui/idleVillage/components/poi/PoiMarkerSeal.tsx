/**
 * PoiMarkerSeal — small, forged medallion variant of the opportunity marker.
 *
 * Tighter and quieter than the baseline: a solid metal seal sitting on the map,
 * a single thin halo for the timer, and a clear central icon. Colour still
 * reads as the light trapped inside the metal, not as UI chrome.
 *
 * Same props as PoiMarker: the two are drop-in interchangeable.
 *
 * Reference page: src/ui/idleVillage/pages/PoiMarkerLabPage.tsx (route /poi-marker-lab)
 */
import React, { CSSProperties, useEffect, useId, useMemo, useState } from 'react';
import type { PoiMarkerProps, PoiType } from './PoiMarker';

type SealPalette = {
  base: string;
  light: string;
  dark: string;
  glow: string;
  glowSoft: string;
};

const PALETTES: Record<PoiType, SealPalette> = {
  // Honey amber with a bronze rim.
  quest: {
    base: '#D4A017',
    light: '#F0D878',
    dark: '#5C3A0C',
    glow: '#EAC048',
    glowSoft: '#B08020',
  },
  // Oxidised copper / verdigris.
  job: {
    base: '#4A7C6F',
    light: '#A8DCC8',
    dark: '#183B35',
    glow: '#6EB8A0',
    glowSoft: '#3E6B5C',
  },
  // Deep ember, not LED red.
  event: {
    base: '#A63D2F',
    light: '#F0A070',
    dark: '#421713',
    glow: '#D85E40',
    glowSoft: '#8C2E22',
  },
};

const LABELS: Record<PoiType, string> = { quest: 'Quest', job: 'Job', event: 'Event' };

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

function arcPath(
  cx: number,
  cy: number,
  radius: number,
  progress: number,
  direction: 'clockwise' | 'counterclockwise'
) {
  const p = clamp(progress);

  if (p >= 0.9999) {
    const sweep = direction === 'clockwise' ? 1 : 0;
    return [
      `M ${cx} ${cy - radius}`,
      `A ${radius} ${radius} 0 1 ${sweep} ${cx} ${cy + radius}`,
      `A ${radius} ${radius} 0 1 ${sweep} ${cx} ${cy - radius}`,
    ].join(' ');
  }

  if (p <= 0.0001) return '';

  const startAngle = -Math.PI / 2;
  const delta = (Math.PI * 2 - 0.0001) * p;
  const endAngle = startAngle + (direction === 'clockwise' ? delta : -delta);

  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);

  const largeArc = p > 0.5 ? 1 : 0;
  const sweep = direction === 'clockwise' ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}

function arcEndpoint(
  cx: number,
  cy: number,
  radius: number,
  progress: number,
  direction: 'clockwise' | 'counterclockwise'
) {
  const p = clamp(progress);
  const startAngle = -Math.PI / 2;
  const delta = (Math.PI * 2 - 0.0001) * p;
  const angle = startAngle + (direction === 'clockwise' ? delta : -delta);

  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function iconFor(type: PoiType, color: string, light: string) {
  if (type === 'quest') {
    // Four-point cross fleury — the cleanest "seal" symbol.
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M60 28 L60 42 M60 78 L60 92 M32 60 L46 60 M74 60 L88 60"
          stroke={light}
          strokeWidth="5.5"
        />
        <path
          d="M60 22 L60 38 M60 82 L60 98 M22 60 L38 60 M82 60 L98 60"
          stroke={color}
          strokeWidth="4"
        />
        <circle cx="60" cy="60" r="6" fill={light} opacity="0.9" />
      </g>
    );
  }

  if (type === 'job') {
    // Anvil glyph.
    return (
      <g fill="none" stroke={light} strokeLinecap="round" strokeLinejoin="round">
        <path d="M36 54 L84 54 L84 62 L72 62 L66 70 L54 70 L48 62 L36 62 Z" fill={color} strokeWidth="2" />
        <path d="M45 70 L75 70 L80 82 L40 82 Z" fill={color} strokeWidth="2" />
        <path d="M60 54 L60 46" strokeWidth="3" />
      </g>
    );
  }

  // Event: eight-point spark.
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M60 24 L64 48 L86 38 L70 56 L92 60 L70 64 L86 82 L64 72 L60 96 L56 72 L34 82 L50 64 L28 60 L50 56 L34 38 L56 48 Z"
        fill={color}
        stroke={light}
        strokeWidth="2"
      />
      <circle cx="60" cy="60" r="4" fill={light} />
    </g>
  );
}

export const PoiMarkerSeal: React.FC<PoiMarkerProps> = ({
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
  const id = `pois-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const palette = PALETTES[type];

  const [currentProgress, setCurrentProgress] = useState(clamp(progress));

  useEffect(() => {
    setCurrentProgress(clamp(progress));
  }, [progress]);

  useEffect(() => {
    if (!autoStart || !durationMs) return;
    if (state !== 'assigned' && state !== 'expiring') return;
    if (currentProgress <= 0) return;

    const startedAt = performance.now();
    const initial = currentProgress;
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const next = clamp(initial - elapsed / durationMs);
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
    // A new countdown starts only when duration or state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, durationMs, state]);

  const ringProgress = state === 'available' || state === 'new' ? 1 : currentProgress;
  const isExpired = state === 'expired' || currentProgress <= 0;
  const urgent = state === 'expiring';

  const ring = useMemo(
    () => arcPath(60, 60, 52, ringProgress, timerDirection),
    [ringProgress, timerDirection]
  );

  const timerTip = useMemo(
    () => arcEndpoint(60, 60, 52, ringProgress, timerDirection),
    [ringProgress, timerDirection]
  );

  const cssVars = {
    '--pois-base': palette.base,
    '--pois-light': palette.light,
    '--pois-dark': palette.dark,
    '--pois-glow': palette.glow,
    '--pois-glow-soft': palette.glowSoft,
    '--pois-size': `${size}px`,
  } as CSSProperties;

  return (
    <button
      type="button"
      aria-label={`${LABELS[type]} ${isExpired ? 'expired' : 'available'}`}
      className={[
        'pois',
        `pois--${type}`,
        `pois--${state}`,
        importance !== 'normal' ? `pois--${importance}` : '',
        selected ? 'pois--selected' : '',
        disabled ? 'pois--disabled' : '',
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
      <svg className="pois__svg" viewBox="0 0 120 120" role="img" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}-core`} cx="36%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#3A3226" />
            <stop offset="30%" stopColor="#1A1712" />
            <stop offset="72%" stopColor="#0A0907" />
            <stop offset="100%" stopColor="#020202" />
          </radialGradient>

          <linearGradient id={`${id}-bronze`} x1="22%" y1="5%" x2="78%" y2="95%">
            <stop offset="0%" stopColor={palette.light} />
            <stop offset="12%" stopColor={palette.base} />
            <stop offset="40%" stopColor={palette.dark} />
            <stop offset="70%" stopColor="#120B07" />
            <stop offset="88%" stopColor={palette.base} />
            <stop offset="100%" stopColor="#050403" />
          </linearGradient>

          <radialGradient id={`${id}-innerGlow`} cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor={palette.glow} stopOpacity="0.32" />
            <stop offset="45%" stopColor={palette.glow} stopOpacity="0.10" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`${id}-ambient`} cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor={palette.glow} stopOpacity="1" />
            <stop offset="80%" stopColor={palette.glow} stopOpacity="0.35" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </radialGradient>

          <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="220%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="blur" />
            <feOffset dy="3" result="offset" />
            <feColorMatrix
              in="offset"
              type="matrix"
              values="
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 .65 0"
            />
            <feBlend in="SourceGraphic" />
          </filter>

          <filter id={`${id}-metal`} x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="17" result="noise" />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="
                0.18 0 0 0 0
                0 0.14 0 0 0
                0 0 0.10 0 0
                0 0 0 0.22 0"
              result="tintNoise"
            />
            <feComposite in="tintNoise" in2="SourceAlpha" operator="in" result="tintInside" />
            <feBlend in="SourceGraphic" in2="tintInside" mode="soft-light" />
          </filter>

          <filter id={`${id}-edgeGlow`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="60" cy="108" rx="26" ry="4.5" fill="#000" opacity="0.55" filter={`url(#${id}-shadow)`} />

        {/* Subtle ambient halo */}
        <circle
          cx="60"
          cy="60"
          r="58"
          fill={`url(#${id}-ambient)`}
          opacity={
            state === 'expired'
              ? 0
              : importance === 'critical'
                ? 0.18
                : importance === 'important'
                  ? 0.11
                  : 0.06
          }
          className="pois__ambient"
        />

        {/* Thin timer glow */}
        {!isExpired && (
          <path
            d={ring}
            fill="none"
            stroke={palette.glow}
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity={urgent ? 0.38 : 0.20}
            className="pois__timer-glow"
          />
        )}

        {/* Timer ring */}
        {!isExpired && (
          <path
            d={ring}
            fill="none"
            stroke={palette.light}
            strokeWidth={urgent ? 2.4 : 1.8}
            strokeLinecap="round"
            opacity={urgent ? 0.95 : 0.85}
            className="pois__timer"
          />
        )}

        {/* Timer leading dot */}
        {!isExpired && (
          <circle
            cx={timerTip.x}
            cy={timerTip.y}
            r={urgent ? 3 : 2.2}
            fill={palette.light}
            filter={`url(#${id}-edgeGlow)`}
            className="pois__timer-edge"
          />
        )}

        {/* Outer seal body */}
        <circle
          cx="60"
          cy="60"
          r="38"
          fill={`url(#${id}-bronze)`}
          stroke="#080806"
          strokeWidth="2.2"
          filter={`url(#${id}-metal)`}
          className="pois__body"
        />

        {/* Inner bevel ring */}
        <circle
          cx="60"
          cy="60"
          r="34"
          fill="none"
          stroke={palette.light}
          strokeWidth="1"
          opacity="0.55"
        />
        <circle
          cx="60"
          cy="60"
          r="31"
          fill="none"
          stroke="#0A0805"
          strokeWidth="1.8"
          opacity="0.9"
        />

        {/* Dark core */}
        <circle cx="60" cy="60" r="28" fill={`url(#${id}-core)`} stroke="#000" strokeWidth="1" />

        {/* Trapped inner light */}
        <circle
          cx="60"
          cy="60"
          r="27"
          fill={`url(#${id}-innerGlow)`}
          opacity={isExpired ? 0.15 : 1}
          className="pois__hearth"
        />

        {/* Icon */}
        <g opacity={isExpired ? 0.32 : 1} className="pois__icon">
          {iconFor(type, palette.base, palette.light)}
        </g>

        {selected && (
          <g fill="none" stroke={palette.light} strokeWidth="1.4" opacity="0.92" className="pois__selection">
            <path d="M20 44 L20 34 L30 34" />
            <path d="M100 44 L100 34 L90 34" />
            <path d="M20 76 L20 86 L30 86" />
            <path d="M100 76 L100 86 L90 86" />
          </g>
        )}
      </svg>
    </button>
  );
};

/** Component-scoped material. Any theming still belongs in skinConfigRegistry. */
export const poiSealStyles = `
.pois {
  --pois-size: 112px;
  position: relative;
  display: inline-flex;
  width: var(--pois-size);
  height: var(--pois-size);
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
  touch-action: manipulation;
  isolation: isolate;
  transition: transform 180ms ease, filter 180ms ease;
}

.pois:focus-visible { outline: 2px solid var(--pois-light); outline-offset: 4px; }

.pois:hover:not(:disabled) { transform: scale(1.04); }
.pois:active:not(:disabled) { transform: scale(0.985); }

.pois__svg { width: 100%; height: 100%; overflow: visible; }

.pois__body {
  transform-origin: 60px 60px;
  animation: pois-breathe 7s ease-in-out infinite;
}

.pois__hearth {
  transform-origin: 60px 60px;
  animation: pois-hearth 5s ease-in-out infinite;
}

.pois__ambient {
  transform-origin: 60px 60px;
  animation: pois-ambient 6s ease-in-out infinite;
}

.pois__timer-edge {
  transform-origin: 60px 60px;
  animation: pois-edge-pulse 2.6s ease-in-out infinite;
}

.pois--new .pois__body {
  animation: pois-arrive 650ms cubic-bezier(.2, .9, .2, 1) both, pois-breathe 7s ease-in-out 650ms infinite;
}

.pois--new .pois__timer {
  animation: pois-ring-in 750ms cubic-bezier(.18, .72, .2, 1) both;
}

.pois--expiring .pois__hearth {
  animation: pois-hearth 1.4s ease-in-out infinite, pois-flicker 2.8s steps(1, end) infinite;
}

.pois--expiring .pois__timer-edge {
  animation: pois-edge-pulse 0.8s ease-in-out infinite;
}

.pois--important {
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--pois-glow) 22%, transparent));
}

.pois--critical {
  filter: drop-shadow(0 0 7px color-mix(in srgb, var(--pois-glow) 38%, transparent));
}

.pois--selected .pois__body {
  animation: pois-selected 1.8s ease-in-out infinite;
}

.pois--disabled,
.pois--expired {
  cursor: default;
  filter: grayscale(0.4) brightness(0.82);
}

.pois--expired .pois__body { opacity: 0.7; }
.pois--expired .pois__icon { opacity: 0.28; }

@keyframes pois-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.01); }
}

@keyframes pois-hearth {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}

@keyframes pois-ambient {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}

@keyframes pois-edge-pulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes pois-selected {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes pois-flicker {
  0%, 100% { opacity: 1; }
  45% { opacity: 0.86; }
  47% { opacity: 0.98; }
  72% { opacity: 0.78; }
  74% { opacity: 0.96; }
}

@keyframes pois-arrive {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pois-ring-in {
  0% { opacity: 0; stroke-width: 6; }
  100% { opacity: 1; stroke-width: 1.8; }
}

@media (prefers-reduced-motion: reduce) {
  .pois,
  .pois * {
    animation: none !important;
    transition: none !important;
  }
}
`;

export default PoiMarkerSeal;
