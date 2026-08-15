/**
 * PoiMarkerQuest — clean, heavy quest seal inspired by the MapToken design.
 *
 * Addresses four visual problems:
 *  - the magic ring is a coloured glow, not a dark shadow
 *  - the central icon is large, extruded and never clipped
 *  - the toothed crown is a perfect 1:1 circle with overflow visible
 *  - the gem core uses a radial gradient + inset-style shading
 *
 * Same props as PoiMarker: drop-in interchangeable.
 *
 * Reference page: src/ui/idleVillage/pages/PoiMarkerLabPage.tsx (route /poi-marker-lab)
 */
import React, { CSSProperties, useEffect, useId, useMemo, useState } from 'react';
import type { PoiMarkerProps, PoiType } from './PoiMarker';

type QuestPalette = {
  ring: string;
  glow: string;
  coreLight: string;
  coreDark: string;
  icon: string;
  iconShadow: string;
  iconDeep: string;
};

const PALETTES: Record<PoiType, QuestPalette> = {
  quest: {
    ring: '#d4af37',
    glow: 'rgba(230, 194, 128, 0.65)',
    coreLight: '#1a2b2b',
    coreDark: '#0b1515',
    icon: '#f5e0b3',
    iconShadow: '#8a6d3b',
    iconDeep: '#2e220e',
  },
  job: {
    ring: '#2dd4bf',
    glow: 'rgba(74, 222, 128, 0.65)',
    coreLight: '#0f2b20',
    coreDark: '#05140e',
    icon: '#a7f3d0',
    iconShadow: '#15803d',
    iconDeep: '#14532d',
  },
  event: {
    ring: '#d9534f',
    glow: 'rgba(255, 99, 71, 0.65)',
    coreLight: '#2b1717',
    coreDark: '#140a0a',
    icon: '#ffc0b3',
    iconShadow: '#8a3b3b',
    iconDeep: '#2e0e0e',
  },
};

const LABELS: Record<PoiType, string> = { quest: 'Quest', job: 'Job', event: 'Event' };

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

/** One of the 12 crown points, placed and rotated around the centre. */
function CrownPoint({ index, ring }: { index: number; ring: string }) {
  const a = (index * 30 * Math.PI) / 180;
  const x = 50 + 44 * Math.cos(a);
  const y = 50 + 44 * Math.sin(a);
  return (
    <polygon
      points="0,-6 2.5,2 -2.5,2"
      fill={ring}
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${index * 30 + 90})`}
    />
  );
}

/** Central icon as a text glyph with 3D extrusion filter. */
function QuestIcon({ type, palette }: { type: PoiType; palette: QuestPalette }) {
  const glyph = type === 'quest' ? '✦' : type === 'job' ? '⚒' : '✶';
  return (
    <text
      x="50"
      y="52"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="26"
      fontWeight="bold"
      fill={palette.icon}
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {glyph}
    </text>
  );
}

export const PoiMarkerQuest: React.FC<PoiMarkerProps> = ({
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
  const id = `poiq-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
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
  const haloProgress = isExpired ? 0 : state === 'available' || state === 'new' ? 0 : 1 - currentProgress;

  const ringDash = useMemo(() => 2 * Math.PI * 42, []);
  const ringGap = useMemo(() => ringDash * 0.08, [ringDash]);

  const cssVars = {
    '--poiq-ring': palette.ring,
    '--poiq-glow': palette.glow,
    '--poiq-size': `${size}px`,
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
      className={['poiq-wrap', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, ...style }}
    >
      <button
        type="button"
        aria-label={`${LABELS[type]} ${isExpired ? 'expired' : 'available'}`}
        className={[
          'poiq',
          `poiq--${type}`,
          `poiq--${state}`,
          importance !== 'normal' ? `poiq--${importance}` : '',
          selected ? 'poiq--selected' : '',
          disabled ? 'poiq--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ ...cssVars }}
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        disabled={disabled}
      >
        <svg
          className="poiq__svg"
          viewBox="0 0 100 100"
          role="img"
          aria-hidden="true"
        >
          <defs>
            {/* Inset-shaded gem core */}
            <radialGradient id={`${id}-core`} cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor={palette.coreLight} />
              <stop offset="60%" stopColor={palette.coreDark} />
              <stop offset="100%" stopColor="#020202" />
            </radialGradient>

            {/* Inner bevel shadow for the gem */}
            <filter id={`${id}-inset`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
              <feOffset dy="2" result="off" />
              <feComposite in="off" in2="SourceAlpha" operator="out" result="outer" />
              <feColorMatrix
                in="outer"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.8 0"
                result="shadow"
              />
              <feComposite in="shadow" in2="SourceAlpha" operator="in" result="innerShadow" />
              <feBlend in="SourceGraphic" in2="innerShadow" mode="normal" />
            </filter>

            {/* 3D extrusion multi-drop-shadow for the icon */}
            <filter id={`${id}-extrude`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="0" floodColor={palette.icon} floodOpacity="0.9" result="s1" />
              <feDropShadow in="s1" dx="0" dy="2" stdDeviation="0" floodColor={palette.iconShadow} floodOpacity="1" result="s2" />
              <feDropShadow in="s2" dx="0" dy="3" stdDeviation="0" floodColor={palette.iconDeep} floodOpacity="1" result="s3" />
              <feDropShadow in="s3" dx="0" dy="5" stdDeviation="2" floodColor="#000000" floodOpacity="0.85" />
            </filter>

            {/* Coloured glow for the magic ring */}
            <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Contact shadow */}
            <filter id={`${id}-drop`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
              <feOffset dy="3" result="off" />
              <feColorMatrix in="off" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0" />
              <feBlend in="SourceGraphic" />
            </filter>

            {/* Pentagonal clip for the inner badge */}
            <clipPath id={`${id}-pentagon`}>
              <polygon points="50,18 81,42 70,82 30,82 19,42" />
            </clipPath>
          </defs>

          {/* Layer 0: contact shadow */}
          <circle cx="50" cy="54" r="44" fill="#000" opacity="0.55" filter={`url(#${id}-drop)`} />

          {/* Layer 1: magic ring — visible only when haloProgress > 0 */}
          {haloProgress > 0.001 && (
            <g className="poiq__ring" opacity={haloProgress} filter={`url(#${id}-glow)`}>
              {/* Dashed ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={palette.ring}
                strokeWidth="0.8"
                strokeDasharray={`${ringDash - ringGap} ${ringGap}`}
                strokeDashoffset={ringDash * (1 - haloProgress)}
                transform="rotate(-90 50 50)"
                className="poiq__ring-path"
              />
              {/* Cardinal nodes */}
              <g fill={palette.glow}>
                <circle cx="50" cy="8" r="2.2" />
                <circle cx="92" cy="50" r="2.2" />
                <circle cx="50" cy="92" r="2.2" />
                <circle cx="8" cy="50" r="2.2" />
              </g>
            </g>
          )}

          {/* Ambient glow */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill={palette.glow}
            opacity={ambientOpacity}
            className="poiq__ambient"
          />

          {/* Layer 2: toothed metal crown */}
          <g filter={`url(#${id}-glow)`} className="poiq__crown">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={palette.ring}
              strokeWidth="3.2"
              opacity="0.92"
            />
            {Array.from({ length: 12 }, (_, i) => (
              <CrownPoint key={i} index={i} ring={palette.ring} />
            ))}
          </g>

          {/* Layer 3: inset gem core */}
          <circle cx="50" cy="50" r="36" fill={`url(#${id}-core)`} filter={`url(#${id}-inset)`} />

          {/* Inner pentagonal badge */}
          <g clipPath={`url(#${id}-pentagon)`}>
            <rect x="0" y="0" width="100" height="100" fill="#050a0a" opacity="0.45" />
          </g>

          {/* Layer 4: extruded 3D icon */}
          <g filter={`url(#${id}-extrude)`} opacity={isExpired ? 0.35 : 1} className="poiq__emblem">
            <QuestIcon type={type} palette={palette} />
          </g>

          {/* Glassy reflection */}
          <path
            d="M 26 38 A 24 24 0 0 1 74 38 A 23 23 0 0 0 26 38 Z"
            fill="#ffffff"
            opacity="0.12"
          />

          {selected && (
            <g fill="none" stroke={palette.ring} strokeWidth="1.2" opacity="0.9" className="poiq__selection">
              <path d="M22 36 L22 24 L34 24" />
              <path d="M78 36 L78 24 L66 24" />
              <path d="M22 64 L22 76 L34 76" />
              <path d="M78 64 L78 76 L66 76" />
            </g>
          )}
        </svg>
      </button>
    </div>
  );
};

/** Component-scoped material. Any theming still belongs in skinConfigRegistry. */
export const poiQuestStyles = `
.poiq-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  overflow: visible;
}

.poiq {
  position: absolute;
  inset: 0;
  --poiq-size: 112px;
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

.poiq:focus-visible { outline: 2px solid var(--poiq-ring); outline-offset: 4px; }
.poiq:hover:not(:disabled) { transform: scale(1.04); }
.poiq:active:not(:disabled) { transform: scale(0.985); }

.poiq__svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.poiq__crown { transform-origin: 50px 50px; animation: poiq-crown-breathe 8s ease-in-out infinite; }
.poiq__emblem { transform-origin: 50px 50px; animation: poiq-emblem-breathe 7s ease-in-out infinite; }
.poiq__ambient { transform-origin: 50px 50px; animation: poiq-ambient-breathe 6s ease-in-out infinite; }

.poiq--new .poiq__crown {
  animation: poiq-arrive 650ms cubic-bezier(.2, .9, .2, 1) both,
             poiq-crown-breathe 8s ease-in-out 650ms infinite;
}

.poiq--expiring .poiq__emblem {
  animation: poiq-emblem-breathe 1.4s ease-in-out infinite,
             poiq-gutter 2.6s steps(1, end) infinite;
}

.poiq--important { filter: drop-shadow(0 0 5px color-mix(in srgb, var(--poiq-ring) 24%, transparent)); }
.poiq--critical { filter: drop-shadow(0 0 9px color-mix(in srgb, var(--poiq-ring) 42%, transparent)); }

.poiq--selected .poiq__crown { animation: poiq-selected 1.8s ease-in-out infinite; }

.poiq--disabled,
.poiq--expired { cursor: default; filter: saturate(0.5) brightness(0.82); }

@keyframes poiq-crown-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.006); } }
@keyframes poiq-emblem-breathe { 0%, 100% { opacity: 0.95; } 50% { opacity: 1; } }
@keyframes poiq-ambient-breathe { 0%, 100% { opacity: 0.78; } 50% { opacity: 1; } }
@keyframes poiq-selected { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }
@keyframes poiq-arrive {
  0% { transform: scale(0.6) rotate(-6deg); opacity: 0; }
  60% { transform: scale(1.04) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
@keyframes poiq-gutter {
  0%, 100% { opacity: 1; } 46% { opacity: 0.76; } 48% { opacity: 0.96; }
  71% { opacity: 0.68; } 73% { opacity: 0.94; }
}

@media (prefers-reduced-motion: reduce) {
  .poiq-wrap,
  .poiq-wrap * { animation: none !important; transition: none !important; }
}
`;

export default PoiMarkerQuest;
