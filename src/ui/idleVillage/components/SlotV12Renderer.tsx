import React, { useMemo } from 'react';
import clsx from 'clsx';
import { useTranslation } from '@/localization/useTranslation';
import {
  slotV12SkinData,
  SLOT_WILDERNESS_BRONZE_CONFIG,
} from '@/ui/idleVillage/skins/converted/slotWildernessBronzeConfig';
import type { SlotDebugVisualizationSettings } from '@/balancing/config/idleVillage/slotDebugVisualizationConfig';
import { SlotGemPointer } from './SlotGemPointer';

type SlotState = keyof typeof slotV12SkinData.states;

export interface SlotV12RendererProps {
  letter?: string;
  state?: SlotState;
  className?: string;
  extractionProgress?: number; // 0-1 for press-and-hold extraction animation
  pgTokenVisible?: boolean; // Control PG token visibility
  debugVisualization?: SlotDebugVisualizationSettings;
  /** Override rendered size in px (default: geometry.SZ = 210). Inline style wins over CSS class. */
  sizePx?: number;
}

type TokenValue = string | number | number[];

const colorTokens = SLOT_WILDERNESS_BRONZE_CONFIG.colorTokens as Record<string, TokenValue>;

const getTokenValue = (tokenKey: string): TokenValue => colorTokens[tokenKey] ?? '';

const formatColor = (value: TokenValue): string => {
  if (Array.isArray(value)) {
    return value.join(',');
  }
  return String(value);
};

const createStops = (colors: string[]) =>
  colors.map((color, index) => (
    <stop key={`${color}-${index}`} offset={`${(index / (colors.length - 1)) * 100}%`} stopColor={color} />
  ));

export const SlotV12Renderer: React.FC<SlotV12RendererProps> = ({
  letter = 'A',
  state = 'empty',
  className,
  extractionProgress = 0,
  pgTokenVisible = false,
  debugVisualization,
  sizePx,
}) => {
  const { t } = useTranslation('idleVillage');

  const geometry = slotV12SkinData.geometry;
  const stateConfig = slotV12SkinData.states[state] ?? slotV12SkinData.states.occupied;
  const rawToothAngles = getTokenValue('tooth.positions.deg');
  const toothAngles = Array.isArray(rawToothAngles) ? rawToothAngles : [270, 30, 150];
  const segments = Number(getTokenValue('segments.n') ?? 16);

  const gradients = useMemo(
    () => ({
      cavity: [
        formatColor(getTokenValue('obsidian.stop0')),
        formatColor(getTokenValue('obsidian.stop1')),
        formatColor(getTokenValue('obsidian.stop2')),
        formatColor(getTokenValue('obsidian.stop3')),
        formatColor(getTokenValue('obsidian.stop4')),
        formatColor(getTokenValue('obsidian.stop5')),
      ],
      collar: [
        formatColor(getTokenValue('bronze.stop0')),
        formatColor(getTokenValue('bronze.stop1')),
        formatColor(getTokenValue('bronze.stop2')),
        formatColor(getTokenValue('bronze.stop3')),
        formatColor(getTokenValue('bronze.stop4')),
      ],
      bezel: [
        formatColor(getTokenValue('silver.stop0')),
        formatColor(getTokenValue('silver.stop1')),
        formatColor(getTokenValue('silver.stop2')),
        formatColor(getTokenValue('silver.stop3')),
        formatColor(getTokenValue('silver.stop4')),
      ],
      medal: [
        formatColor(getTokenValue('outer.fill.stop0')),
        formatColor(getTokenValue('outer.fill.stop1')),
        formatColor(getTokenValue('outer.fill.stop2')),
        formatColor(getTokenValue('outer.fill.stop3')),
        formatColor(getTokenValue('outer.fill.stop4')),
        formatColor(getTokenValue('outer.fill.stop5')),
      ],
    }),
    [],
  );

  const resolvedState =
    'sealVisible' in stateConfig ? stateConfig : slotV12SkinData.states.occupied;
  const debugViz = debugVisualization?.enabled ? debugVisualization : null;

  // Extraction is a two-phase sequence:
  //   phase 1 (progress 0 -> TEETH_PHASE): the teeth retract into the bezel
  //   phase 2 (TEETH_PHASE -> 1): the bezel counter-rotates/opens
  // Insertion is the inverse handled via CSS (bezel closes, THEN teeth extrude).
  const TEETH_PHASE = 0.35;
  const clampedProgress = Math.min(extractionProgress, 1.0); // Clamp to 1.0 for normal animation

  // Bezel only starts moving after the teeth have fully retracted
  const bezelProgress = extractionProgress > 0
    ? Math.max(0, (clampedProgress - TEETH_PHASE) / (1 - TEETH_PHASE))
    : 0;
  const extractionScale = 1.0 + (bezelProgress * 0.08); // 1.0 -> 1.08 (teeth touch medal)
  const extractionRotation = 0 - (bezelProgress * 30); // 0° -> -30°

  // Add spring effect for overshoot
  const springScale = extractionProgress > 1.0
    ? extractionScale * (1.0 + (extractionProgress - 1.0) * 0.15) // Reduced spring overshoot
    : extractionScale;

  // Teeth are extruded ONLY when the bezel is closed (rotation 0 = seated state).
  // During extraction they retract first (phase 1); while the slot is empty/open
  // they stay retracted.
  const bezelClosed = (resolvedState.bezelRotateDeg ?? 0) === 0;
  const teethExtrusion = extractionProgress > 0
    ? Math.max(0, 1 - clampedProgress / TEETH_PHASE)
    : (bezelClosed ? 1 : 0);
  
  // Override bezel transform if extracting
  const bezelTransform = extractionProgress > 0 
    ? `scale(${springScale}) rotate(${extractionRotation}deg)`
    : `scale(${resolvedState.bezelScale ?? 1}) rotate(${resolvedState.bezelRotateDeg ?? 0}deg)`;

  // Heavy-bronze lock: when the token seats (occupied, not mid-extraction) the
  // bezel doesn't glide to a stop — it SLAMS home, recoils ~2° at high speed,
  // then dead-stops (metal-on-metal). Driven by a keyframe so the impact + elastic
  // micro-rebound reads, instead of the soft ease-out of the plain CSS transition.
  const bezelSlamActive =
    resolvedState.medalVisible && extractionProgress === 0 && (resolvedState.bezelRotateDeg ?? 0) === 0;
  const bezelStartScale = slotV12SkinData.states.empty.bezelScale ?? 1.18;
  const bezelStartRotate = slotV12SkinData.states.empty.bezelRotateDeg ?? -30;

  const cssText = useMemo(
    () => `
      .slot-v12 {
        position: relative;
        width: ${geometry.SZ}px;
        height: ${geometry.SZ}px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        /* Removed drop-shadow to eliminate gray square artifact */
        /* filter: drop-shadow(0 18px 32px rgba(0, 0, 0, 0.75)); */
      }

      .slot-v12__halo {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 200, 55, 0.15), transparent 70%);
        filter: blur(24px);
        opacity: ${resolvedState.haloVisible ? 1 : 0};
        transition: opacity 220ms ease-out;
      }

      .slot-v12__seal {
        opacity: ${resolvedState.sealVisible ? 1 : 0};
        animation: sealPulse 14s ease-in-out infinite;
      }

      .slot-v12__arcane {
        stroke: ${formatColor(getTokenValue('arcane.color'))};
        opacity: ${resolvedState.arcaneAlpha ?? 0.06};
        stroke-width: ${(resolvedState.arcaneStrokeWidth ?? 1.6)}px;
        animation: arcaneBreathe ${resolvedState.arcaneDuration ?? '13s'} ease-in-out infinite;
      }

      .slot-v12__bezel {
        transform: ${bezelTransform};
        transition: transform 560ms cubic-bezier(0.42, 0, 0.2, 1);
      }

      /* Heavy-bronze lock: the ring ACCELERATES into home (peak velocity at
         contact), impacts with a micro scale-compression (the "clunk"), kicks
         back ~2.4° at high speed, does one damped bounce, then dead-stops on a
         linear tail (metal-on-metal). No soft ease-out anywhere near the hit. */
      @keyframes bezelSlam {
        /* approach: accelerate — fastest the instant before contact */
        0% {
          transform: scale(${bezelStartScale}) rotate(${bezelStartRotate}deg);
          animation-timing-function: cubic-bezier(0.66, 0, 0.9, 0.25);
        }
        /* CONTACT at peak velocity + scale compression = the impact */
        48% {
          transform: scale(0.99) rotate(0deg);
          animation-timing-function: cubic-bezier(0.1, 0.9, 0.15, 1);
        }
        /* elastic micro-rebound backward, near-instant kick */
        58% {
          transform: scale(1) rotate(-2.4deg);
          animation-timing-function: cubic-bezier(0.95, 0, 1, 1);
        }
        /* slam back to home, hard (linear) */
        66% {
          transform: scale(1) rotate(0.6deg);
          animation-timing-function: linear;
        }
        /* second damped bounce */
        72% {
          transform: scale(1) rotate(-0.5deg);
          animation-timing-function: linear;
        }
        /* DEAD STOP — no easing tail, freezes */
        76% {
          transform: scale(1) rotate(0deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }

      @keyframes arcaneBreathe {
        0%, 100% { opacity: 0.55; }
        50% { opacity: 1; }
      }

      @keyframes sealPulse {
        0%, 100% { opacity: 0.1; }
        50% { opacity: 0.22; }
      }

      @keyframes segmentSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .slot-v12__segments {
        animation: segmentSpin 65s linear infinite;
      }
    `,
    [
      geometry.SZ,
      resolvedState.arcaneAlpha,
      resolvedState.arcaneDuration,
      resolvedState.arcaneStrokeWidth,
      resolvedState.bezelRotateDeg,
      resolvedState.bezelScale,
      resolvedState.haloVisible,
      resolvedState.sealVisible,
      bezelTransform,
      bezelStartScale,
      bezelStartRotate,
    ],
  );

  const renderDebugLabel = (text: string, translateY: number) => {
    if (!debugViz?.showLabels) return null;
    const width = Math.max(80, text.length * 6);
    const halfWidth = width / 2;
    return (
      <g aria-hidden transform={`translate(0, ${translateY})`}>
        <rect
          x={-halfWidth}
          y={-9}
          width={width}
          height={18}
          rx={18}
          fill={debugViz.colors.labelBackdrop}
          opacity={0.95}
        />
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={8}
          fontWeight={700}
          fill={debugViz.colors.labelText}
        >
          {text}
        </text>
      </g>
    );
  };

  const stateLabel = t('idleVillage:slotRack.states.' + state, state);

  return (
    <div className={clsx('slot-v12', `slot-v12--${state}`, className)} data-slot-state={state} style={sizePx ? { width: sizePx, height: sizePx } : undefined}>
      <style dangerouslySetInnerHTML={{ __html: cssText }} />
      <div className="slot-v12__halo" aria-hidden />
      <svg viewBox="-120 -120 240 240" role="img" aria-label={t('idleVillage:slotRack.ariaLabel', { defaultValue: 'Slot {state}', state: stateLabel })}>
        <defs>
          {/* Complex filters from HTML reference */}
          <filter id="fn-basalt" x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence type="fractalNoise" baseFrequency=".88" numOctaves="4" seed="7" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .014 0 0 0 0 .009 0 0 0 0 .003 0 0 0 .28 0" result="c" />
            <feBlend in="SourceGraphic" in2="c" mode="overlay" />
          </filter>
          <filter id="fn-vein" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="turbulence" baseFrequency=".012 .085" numOctaves="4" seed="5" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .018 0 0 0 0 .010 0 0 0 0 .003 0 0 0 .26 0" result="c" />
            <feBlend in="SourceGraphic" in2="c" mode="overlay" />
          </filter>
          <filter id="fn-silver" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency=".55 .72" numOctaves="5" seed="31" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .032 0 0 0 0 .032 0 0 0 0 .038 0 0 0 .28 0" result="c" />
            <feBlend in="SourceGraphic" in2="c" mode="overlay" />
          </filter>
          <filter id="fn-oxide" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency=".20 .16" numOctaves="4" seed="17" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .008 0 0 0 0 .008 0 0 0 0 .010 0 0 0 .48 0" result="c" />
            <feComposite in="c" in2="SourceGraphic" operator="in" result="masked" />
            <feBlend in="SourceGraphic" in2="masked" mode="multiply" />
          </filter>
          <filter id="fg-arcane" x="-150%" y="-150%" width="400%" height="400%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
            <feColorMatrix in="b" type="matrix" values=".42 0 0 0 .10 0 .52 0 0 .16 0 0 1.0 0 .50 0 0 0 .85 0" />
          </filter>

          {/* Gradients matching HTML reference */}
          <radialGradient id="slot-v12-cavity" cx="38%" cy="34%" r="65%">
            {createStops(gradients.cavity)}
          </radialGradient>
          <radialGradient id="slot-v12-rim" cx="50%" cy="50%" r="50%">
            <stop offset="62%" stopColor="rgba(0,0,0,0)" />
            <stop offset="88%" stopColor="rgba(70,48,20,.45)" />
            <stop offset="97%" stopColor="rgba(88,60,24,.80)" />
            <stop offset="100%" stopColor="rgba(40,24,8,.30)" />
          </radialGradient>
          <radialGradient id="slot-v12-silver" cx="26%" cy="22%" r="74%">
            {createStops(gradients.bezel)}
          </radialGradient>
          <linearGradient id="slot-v12-bevel" x1="20%" y1="16%" x2="80%" y2="84%">
            <stop offset="0%" stopColor="rgba(255,255,255,.22)" />
            <stop offset="26%" stopColor="rgba(255,255,255,.08)" />
            <stop offset="60%" stopColor="rgba(0,0,0,.06)" />
            <stop offset="100%" stopColor="rgba(0,0,0,.26)" />
          </linearGradient>
          <linearGradient id="slot-v12-claw" x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#c0c0ce" />
            <stop offset="38%" stopColor="#808090" />
            <stop offset="100%" stopColor="#3e3e4e" />
          </linearGradient>
          <linearGradient id="slot-v12-collar" x1="14%" y1="4%" x2="86%" y2="96%">
            {createStops(gradients.collar)}
          </linearGradient>
          <radialGradient id="slot-v12-medal-outer" cx="14%" cy="4%" x2="86%" y2="96%">
            {createStops(gradients.medal)}
          </radialGradient>
          <linearGradient id="slot-v12-medal-shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,240,165,.28)" />
            <stop offset="22%" stopColor="rgba(255,225,135,.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,.55)" />
          </linearGradient>
          <linearGradient id="slot-v12-medal-ring" x1="12%" y1="8%" x2="88%" y2="92%">
            <stop offset="0%" stopColor="#f0d070" />
            <stop offset="16%" stopColor="#c88430" />
            <stop offset="46%" stopColor="#7c3e10" />
            <stop offset="80%" stopColor="#3c1c04" />
            <stop offset="100%" stopColor="#160a02" />
          </linearGradient>
          <radialGradient id="slot-v12-medal-field" cx="40%" cy="33%" r="70%">
            <stop offset="0%" stopColor={formatColor(getTokenValue('field.stop0'))} />
            <stop offset="38%" stopColor={formatColor(getTokenValue('field.stop1'))} />
            <stop offset="72%" stopColor={formatColor(getTokenValue('field.stop2'))} />
            <stop offset="100%" stopColor={formatColor(getTokenValue('field.stop3'))} />
          </radialGradient>
          <clipPath id="slot-v12-clip-medal">
            <circle cx="0" cy="0" r={geometry.R_MED_OUT} />
          </clipPath>
          <clipPath id="slot-v12-clip-cavity">
            <circle cx="0" cy="0" r={geometry.R_CAV + 4} />
          </clipPath>
          <clipPath id="slot-v12-clip-bezel">
            <circle cx="0" cy="0" r={geometry.R_BZ_OUT + 2} />
          </clipPath>
        </defs>

        {/* Layer 1: Cavity with complex filters and clipPath */}
        <g clipPath="url(#slot-v12-clip-cavity)">
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="url(#slot-v12-cavity)" />
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="url(#slot-v12-cavity)" filter="url(#fn-vein)" opacity="0.38" />
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="url(#slot-v12-cavity)" filter="url(#fn-basalt)" opacity="0.52" />
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="url(#slot-v12-rim)" />
          
          {/* Arcane circle */}
          <circle 
            cx="0" 
            cy="0" 
            r={geometry.R_ARC} 
            fill="none"
            stroke={`rgba(162,188,255,${resolvedState.arcaneAlpha ?? 0.06})`}
            strokeWidth={resolvedState.arcaneStrokeWidth ?? 1.6}
            filter="url(#fg-arcane)"
            style={{ animation: `arcane-breathe ${resolvedState.arcaneDuration ?? '13s'} ease-in-out infinite` }}
          />
          
          {/* Inset shadows */}
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="none" stroke="rgba(0,0,0,0.96)" strokeWidth="20" transform="translate(5,6)" opacity="0.32" />
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="none" stroke="rgba(0,0,0,0.72)" strokeWidth="9" transform="translate(2.5,3)" opacity="0.28" />
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="none" stroke="rgba(0,0,0,0.36)" strokeWidth="4" transform="translate(1,1.2)" opacity="0.24" />
          
          {/* Specular highlight */}
          <circle cx="0" cy="0" r={geometry.R_CAV - 1} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.0"
            strokeDasharray={`${geometry.R_CAV * 1.06} 999`} strokeDashoffset={`${geometry.R_CAV * 1.28}`} strokeLinecap="round" />
          
          {/* Engraved rings */}
          {[geometry.R_RING1, geometry.R_RING2].map((R, i) => {
            const w = i === 0 ? 2.4 : 1.6;
            return (
              <g key={`ring-${i}`}>
                <circle cx="0" cy="0" r={R} fill="none" stroke="rgba(0,0,0,0.92)" strokeWidth={`${w + 2.6}`} transform="translate(0.65, 0.75)" />
                <circle cx="0" cy="0" r={R} fill="none" stroke="rgba(0,0,0,0.96)" strokeWidth={w} />
                <circle cx="0" cy="0" r={R + w * 0.28} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.50"
                  strokeDasharray={`${R * 1.08} 999`} strokeDashoffset={`${R * 1.35}`} strokeLinecap="round" />
                <circle cx="0" cy="0" r={R - w * 0.28} fill="none" stroke="rgba(0,0,0,0.52)" strokeWidth="0.55"
                  strokeDasharray={`${R * 1.02} 999`} strokeDashoffset={`${R * 0.55}`} strokeLinecap="round" />
              </g>
            );
          })}
          
          {/* Cavity border */}
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="none" stroke="rgba(2,1,1,0.95)" strokeWidth="3.2" />
          <circle cx="0" cy="0" r={geometry.R_CAV + 1.2} fill="none" stroke="rgba(185,140,36,0.18)" strokeWidth="0.8" />
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="0.9"
            strokeDasharray={`${geometry.R_CAV * 0.65} 999`} strokeDashoffset={`${geometry.R_CAV * 0.82}`} strokeLinecap="round" />
          
          {/* Seal - only when empty */}
          {resolvedState.sealVisible && (
            <g className="slot-v12__seal" opacity="0.16">
              <circle cx="0" cy="0" r={geometry.R_SEAL} fill="none" stroke="rgba(162,188,255,0.42)" strokeWidth="0.46" />
              <circle cx="0" cy="0" r={geometry.R_SEAL * 0.54} fill="none" stroke="rgba(162,188,255,0.42)" strokeWidth="0.46" />
              <circle cx="0" cy="0" r={geometry.R_SEAL * 0.16} fill="none" stroke="rgba(162,188,255,0.42)" strokeWidth="0.46" />
              {Array.from({ length: 6 }, (_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                return (
                  <line
                    key={`seal-line-${i}`}
                    x1={geometry.R_SEAL * 0.20 * Math.cos(angle)}
                    y1={geometry.R_SEAL * 0.20 * Math.sin(angle)}
                    x2={geometry.R_SEAL * 0.96 * Math.cos(angle)}
                    y2={geometry.R_SEAL * 0.96 * Math.sin(angle)}
                    stroke="rgba(162,188,255,0.42)"
                    strokeWidth="0.46"
                  />
                );
              })}
              <polygon
                points={Array.from({ length: 6 }, (_, i) => {
                  const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
                  return `${(geometry.R_SEAL * 0.96 * Math.cos(angle)).toFixed(2)},${(geometry.R_SEAL * 0.96 * Math.sin(angle)).toFixed(2)}`;
                }).join(' ')}
                fill="none"
                stroke="rgba(162,188,255,0.42)"
                strokeWidth="0.46"
                opacity="0.55"
              />
            </g>
          )}
        </g>

        {/* Layer 2: Medal - only when occupied */}
        {resolvedState.medalVisible && (
          <g clipPath="url(#slot-v12-clip-medal)" data-layer="medal">
            <circle cx="0" cy="0" r={geometry.R_MED_OUT} fill="#1a0c04" />
            <circle cx="0" cy="0" r={geometry.R_MED_OUT} fill="url(#slot-v12-medal-outer)" opacity="0.90" 
              style={{ animation: 'rim-idle 9.4s ease-in-out infinite' }} />
            <circle cx="0" cy="0" r={geometry.R_MED_OUT} fill="url(#slot-v12-medal-shine)" opacity="0.42" />
            <circle cx="0" cy="0" r={geometry.R_MED_OUT - 1.5} fill="none" stroke="rgba(255,250,178,0.52)" strokeWidth="0.9"
              strokeDasharray={`${geometry.R_MED_OUT * 1.58} 999`} strokeDashoffset={`${geometry.R_MED_OUT * 1.82}`} strokeLinecap="round" />
            <circle cx="0" cy="0" r={geometry.R_MED_RING} fill="#130902" />
            <circle cx="0" cy="0" r={geometry.R_MED_RING} fill="url(#slot-v12-medal-ring)" opacity="0.65" />
            <circle cx="0" cy="0" r={geometry.R_MED_RING} fill="none" stroke="rgba(0,0,0,0.72)" strokeWidth="2.2" transform="translate(0.3, 0.35)" />
            <circle cx="0" cy="0" r={geometry.R_MED_RING - 0.4} fill="none" stroke="rgba(255,222,120,0.14)" strokeWidth="0.7" />
            <circle cx="0" cy="0" r={geometry.R_MED_FLD} fill="url(#slot-v12-medal-field)" />
            {/* PG Token or Letter - unified piece */}
            {pgTokenVisible ? (
              <text
                x="0"
                y="1.5"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize={geometry.R_MED_POR * 0.65}
                fontWeight="700"
                fill="rgba(255,255,255,0.92)"
                style={{ pointerEvents: 'none' }}
              >
                {t('idleVillage:medalOverlay.token', { defaultValue: 'PG' })}
              </text>
            ) : (
              <text
                x="0"
                y="1.5"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Cinzel, Georgia, serif"
                fontSize={geometry.R_MED_POR * 0.80}
                fontWeight="600"
                fill="rgba(200,155,50,0.68)"
                style={{ pointerEvents: 'none' }}
              >
                {letter}
              </text>
            )}
            <circle cx="0" cy="0" r={geometry.R_MED_POR} fill="none" stroke="rgba(180,110,28,0.28)" strokeWidth="1.5" />
            <circle cx="0" cy="0" r={geometry.R_MED_POR} fill="none" stroke="rgba(0,0,0,0.60)" strokeWidth="1.8" transform="translate(0.28, 0.35)" />
            <circle cx="0" cy="0" r={geometry.R_MED_POR - 0.3} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6"
              strokeDasharray={`${geometry.R_MED_POR * 1.90} 999`} strokeDashoffset={`${geometry.R_MED_POR * 2.12}`} strokeLinecap="round" />
            <circle cx="0" cy="0" r={geometry.R_MED_FLD} fill="none" stroke="rgba(0,0,0,0.48)" strokeWidth="4"
              strokeDasharray={`${geometry.R_MED_FLD * Math.PI} ${geometry.R_MED_FLD * Math.PI}`} strokeDashoffset={`-${geometry.R_MED_FLD * Math.PI / 4}`} strokeLinecap="round" />
            
            {/* Debug visualization - moved to the end to appear on top */}
            {debugViz && (
              <>
                <circle cx="0" cy="0" r={geometry.R_MED_OUT + 5} fill={debugViz.colors.medal} opacity="1.0" />
                <circle cx="0" cy="0" r={geometry.R_MED_OUT + 5} fill="none" stroke={debugViz.colors.medal} strokeWidth="3" />
              </>
            )}
          </g>
        )}

        {/* Layer 3: Bezel + Teeth - clipped to prevent filter bounding box artifacts */}
        <g
          className="slot-v12__bezel"
          clipPath="url(#slot-v12-clip-bezel)"
          style={{
            transform: bezelTransform,
            transformOrigin: '0px 0px',
            // Heavy-bronze lock choreography: slam + micro-rebound + dead stop.
            // Skipped while extracting (JS drives the transform there).
            ...(bezelSlamActive ? { animation: 'bezelSlam 440ms both' } : {}),
            // Only apply drop-shadow in debug mode
            ...(debugViz ? {
              filter: `drop-shadow(0 0 24px ${debugViz?.colors?.bezel || '#FF5C8D'})`,
            } : {}),
          }}
          data-layer="bezel"
        >
          {(() => {
            // Use thinner bezel matching HTML reference
            const ringW = 4; // Fixed width like in HTML
            const R_BZ_MID = (geometry.R_BZ_IN + geometry.R_BZ_OUT) / 2;
            return (
              <>
                <circle cx="0" cy="0" r={R_BZ_MID} fill="none" stroke="rgba(6,6,10,0.98)" strokeWidth={ringW + 3} />
                <circle cx="0" cy="0" r={R_BZ_MID} fill="none" stroke="url(#slot-v12-silver)" strokeWidth={ringW} />
                <circle cx="0" cy="0" r={R_BZ_MID} fill="none" stroke="url(#slot-v12-bevel)" strokeWidth={ringW} />
                <circle cx="0" cy="0" r={R_BZ_MID} fill="none" stroke="rgba(10,10,16,0)" strokeWidth={ringW} filter="url(#fn-oxide)" opacity="0.60" />
                
                {/* Oxide spots */}
                {[[28, 5.4, 0.34], [118, 3.0, 0.24], [204, 6.8, 0.18], [312, 3.8, 0.28], [72, 2.4, 0.15], [250, 5.5, 0.22]].map(([angle, size, opacity], i) => {
                  const rad = (angle * Math.PI) / 180;
                  const x = R_BZ_MID * Math.cos(rad);
                  const y = R_BZ_MID * Math.sin(rad);
                  return (
                    <ellipse
                      key={`oxide-${i}`}
                      cx={x.toFixed(2)}
                      cy={y.toFixed(2)}
                      rx={size}
                      ry={size * 0.44}
                      fill={`rgba(8,8,14,${opacity})`}
                      transform={`rotate(${angle + 40}, ${x.toFixed(2)}, ${y.toFixed(2)})`}
                      filter="url(#fn-oxide)"
                    />
                  );
                })}
                
                {/* Decorative lines */}
                {(() => {
                  type LineType = 'curve' | 'line';
                  interface DecorLine {
                    type: LineType;
                    coords: number[];
                  }
                  const decorLines: DecorLine[] = [
                    { type: 'curve', coords: [-0.36, -0.16, -0.16, -0.26, 0.06, -0.10, 0.22, -0.22] },
                    { type: 'line', coords: [0.30, 0.28, 0.44, 0.38] },
                    { type: 'line', coords: [-0.20, 0.44, -0.06, 0.50] }
                  ];
                  return decorLines.map((line, i) => {
                    const [c0, c1, c2, c3, c4, c5, c6, c7] = line.coords;
                    const d = line.type === 'curve'
                      ? `M${R_BZ_MID * c0},${R_BZ_MID * c1} C${R_BZ_MID * c2},${R_BZ_MID * c3} ${R_BZ_MID * c4},${R_BZ_MID * c5} ${R_BZ_MID * c6},${R_BZ_MID * c7}`
                      : `M${R_BZ_MID * c0},${R_BZ_MID * c1} L${R_BZ_MID * c2},${R_BZ_MID * c3}`;
                    return (
                      <g key={`decor-${i}`}>
                        <path d={d} fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="0.44" strokeLinecap="round" />
                        <path d={d} fill="none" stroke="rgba(0,0,0,0.30)" strokeWidth="0.34" strokeLinecap="round" transform="translate(0.25, 0.30)" />
                      </g>
                    );
                  });
                })()}
                
                <circle cx="0" cy="0" r={R_BZ_MID - 1} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.6"
                  strokeDasharray={`${R_BZ_MID * 1.04} 999`} strokeDashoffset={`${R_BZ_MID * 1.30}`} strokeLinecap="round" />
                <circle cx="0" cy="0" r={R_BZ_MID + 0.4} fill="none" stroke="rgba(0,0,0,0.70)" strokeWidth="2.8" transform="translate(1.3, 1.7)" />
                <circle cx="0" cy="0" r={geometry.R_BZ_OUT} fill="none" stroke="rgba(3,2,1,0.92)" strokeWidth="2.2" />
                <circle cx="0" cy="0" r={geometry.R_BZ_OUT + 0.7} fill="none" stroke="rgba(172,134,34,0.12)" strokeWidth="0.65" />
                <circle cx="0" cy="0" r={geometry.R_BZ_IN} fill="none" stroke="rgba(3,2,1,0.85)" strokeWidth="1.6" />
                <circle cx="0" cy="0" r={geometry.R_BZ_IN - 0.4} fill="none" stroke="rgba(255,252,200,0.040)" strokeWidth="0.60" />
                
                {/* Rotating segments */}
                <g style={{ animation: 'seg-spin 65s linear infinite' }}>
                  {Array.from({ length: 16 }, (_, i) => {
                    const angle = (i / 16) * Math.PI * 2;
                    const isLong = i % 4 === 0;
                    const segLength = isLong ? 7.8 : 4.2;
                    const segWidth = isLong ? 1.1 : 0.75;
                    const opacityBase = 0.15 + 0.25 * Math.abs(Math.sin(angle * 2 + 0.4));
                    const x = R_BZ_MID * Math.cos(angle);
                    const y = R_BZ_MID * Math.sin(angle);
                    return (
                      <g key={`seg-${i}`} transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${(angle * 180 / Math.PI + 90).toFixed(1)})`}>
                        <rect x={-segLength / 2} y="-0.48" width={segLength} height={segWidth + 0.55} rx="0.24" 
                          fill={`rgba(0,0,0,${(0.34 + opacityBase * 0.24).toFixed(2)})`} />
                        <rect x={-segLength / 2} y="0" width={segLength} height={segWidth} rx="0.24" 
                          fill={`rgba(5,5,9,${(0.60 + opacityBase * 0.15).toFixed(2)})`} />
                        <rect x={-segLength / 2 + 0.5} y="0.1" width={segLength * 0.48} height="0.48" rx="0.16" 
                          fill={`rgba(255,255,255,${(opacityBase + 0.09).toFixed(2)})`} />
                      </g>
                    );
                  })}
                </g>
                
                {/* Complex teeth - removed fn-silver filter to prevent gray square artifact */}
                {/* Extruded only when the bezel is closed; they retract as phase 1 of extraction */}
                {toothAngles.map((deg, i) => {
                  const angle = (deg * Math.PI) / 180;
                  const x = geometry.R_BZ_IN * Math.cos(angle);
                  const y = geometry.R_BZ_IN * Math.sin(angle);
                  const TH = geometry.TOOTH_HEIGHT;
                  const TW = geometry.TOOTH_WIDTH;
                  const path = `M${-TW/2},0 Q${-TW/2-0.8},${TH*0.12} 0,${TH*0.16} Q${TW/2+0.8},${TH*0.12} ${TW/2},0 L 0.8,${-TH} L -0.8,${-TH} Z`;
                  // Local +y (after the group rotation) points away from the slot
                  // center: translating by (1-extrusion)*(TH+2) slides the tooth
                  // back under the bezel ring.
                  const retractPx = (1 - teethExtrusion) * (TH + 2);
                  const teethStyle: React.CSSProperties = {
                    transform: `translate(0px, ${retractPx.toFixed(2)}px)`,
                    // JS drives per-frame retraction during extraction; on
                    // insertion the teeth SNAP out (70ms, hard) synced to the
                    // ~48% contact frame of the 440ms bezelSlam (≈200ms delay),
                    // so the bite lands ON the impact instead of gliding out late.
                    transition: extractionProgress > 0 ? 'none' : 'transform 70ms cubic-bezier(0.2, 0, 0, 1) 200ms',
                  };
                  return (
                    <g key={`tooth-${i}`} transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${(deg - 90).toFixed(1)})`}>
                    <g style={teethStyle}>
                      <path d={path} fill="rgba(0,0,0,0.75)" transform="translate(0.7, 1.0)" />
                      <path d={path} fill="url(#slot-v12-claw)" />
                      <path d={path} fill="url(#slot-v12-bevel)" opacity="0.75" />
                      <path d={path} fill="none" stroke="rgba(2,2,6,0.88)" strokeWidth="0.9" />
                      <path d={`M${-TW/2+0.7},0 L -0.6,${-TH+2}`} fill="none" stroke="rgba(255,255,255,0.34)" strokeWidth="0.9" strokeLinecap="round" />
                      <ellipse cx="0" cy={`${-TH+1}`} rx="2.2" ry="1.0" fill="rgba(0,0,0,0.48)" />
                      <circle cx="0" cy={`${-TH}`} r="0.9" fill="rgba(175,195,255,0.18)" />
                    </g>
                    </g>
                  );
                })}
              </>
            );
          })()}
        </g>

        {/* Layer 4: Gem pointer at 6 o'clock — the seated counterpart of the
            dragged token's gem. Drawn AFTER the bezel so it is always mounted
            ABOVE the frame and never swallowed when the token snaps home. */}
        {resolvedState.medalVisible && (
          <SlotGemPointer cy={geometry.R_MED_OUT + 4} />
        )}

        {debugViz && renderDebugLabel('MEDAGLIA · layer 2', geometry.R_MED_OUT + 26)}
        {debugViz && renderDebugLabel('GHIERA', -geometry.R_BZ_OUT - 26)}
      </svg>
    </div>
  );
};

export default SlotV12Renderer;
