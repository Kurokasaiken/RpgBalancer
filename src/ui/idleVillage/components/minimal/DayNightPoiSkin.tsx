import type { JSX } from 'react';
import { useEffect, useId, useMemo, useRef } from 'react';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import {
  getDayNightPoiSkinForPreset,
  resolveDayNightPoiPresetId,
} from '@/ui/idleVillage/skins/dayNightPoiSkinConfig';

/**
 * Props for DayNightPoiSkin component
 */
export interface DayNightDebugLayers {
  darkBaseRing?: boolean;
  bloom?: boolean;
  outerGuide?: boolean;
  progressHalo?: boolean;
  decorativeMarks?: boolean;
  coreMedallionOuter?: boolean;
  metalNoise?: boolean;
  coreInner?: boolean;
  coreHighlight?: boolean;
  outerRim?: boolean;
  dayIcon?: boolean;
  nightIcon?: boolean;
  frost?: boolean;
}

interface DayNightPoiSkinProps {
  /** Current phase (true = day, false = night) from store */
  isDayPhase: boolean;
  /** Progress through current phase (0-1) from store */
  cycleProgress: number;
  /** Whether the cycle is paused from store */
  isPaused: boolean;
  /** Debug layer visibility toggles for isolating visual artifacts */
  debug?: DayNightDebugLayers;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Day/Night POI Skin Component
 * 
 * Renders the visual representation of the day/night cycle state.
 * Implements the POI family visual grammar with:
 * - Progress halo showing 0-1 phase progress
 * - Phase icon (sun/moon/pause)
 * - Color-coded bloom effects
 * - Decorative marks at 8 positions
 * 
 * Uses Style Laboratory tokens for all visual styling.
 * Supports hover effects (1.02x scale) and smooth transitions.
 * 
 * @param props - Component props containing temporal state
 * @returns A styled SVG-based POI indicator
 */
const defaultDebug: Required<DayNightDebugLayers> = {
  darkBaseRing: true,
  bloom: true,
  outerGuide: true,
  progressHalo: true,
  decorativeMarks: true,
  coreMedallionOuter: true,
  metalNoise: true,
  coreInner: true,
  coreHighlight: true,
  outerRim: true,
  dayIcon: true,
  nightIcon: true,
  frost: true,
};

export default function DayNightPoiSkin(props: DayNightPoiSkinProps): JSX.Element {
  const { isDayPhase, cycleProgress, isPaused, debug = {} } = props;
  const d = { ...defaultDebug, ...debug };

  const { presetId } = useSkinPreferences();
  const resolvedPresetId = resolveDayNightPoiPresetId(presetId);
  const skinPreset = getDayNightPoiSkinForPreset(resolvedPresetId);
  const config = skinPreset.config;

  const uniqueId = useId().replace(/:/g, '');
  const bloomGradientId = `dn-bloom-${uniqueId}`;
  const medallionGradientId = `dn-medallion-${uniqueId}`;
  const coreHighlightGradientId = `dn-core-highlight-${uniqueId}`;
  const glowFilterId = `dn-glow-${uniqueId}`;
  const bigBloomFilterId = `dn-bigbloom-${uniqueId}`;
  const metalNoiseId = `dn-noise-${uniqueId}`;
  const frostFilterId = `dn-frost-${uniqueId}`;
  const baseClipId = `dn-baseclip-${uniqueId}`;
  const clipId = `dn-clip-${uniqueId}`;

  const size = config.size;
  const scaleFactor = size / 80;
  const progress = clamp01(cycleProgress);

  /**
   * Instant loop reset: when the progress wraps from near-full back to 0
   * (phase switch), suppress the CSS transition so the arc snaps to 0 like a
   * mechanical gear instead of draining backwards.
   */
  const prevProgressRef = useRef(progress);
  const isLoopReset = progress < prevProgressRef.current - 0.5;
  useEffect(() => {
    prevProgressRef.current = progress;
  }, [progress]);

  const palette = useMemo(() => {
    if (isPaused) return config.paused;
    return isDayPhase ? config.dayRunning : config.nightRunning;
  }, [config, isDayPhase, isPaused]);

  const ringColor = palette.ringColor;
  const glowColor = palette.glowColor;
  const glowOpacity = palette.glowOpacity;
  const coreColor = palette.coreColor;

  // Medallion outer shell gradient — follows palette state
  const medallionGlowStart = isPaused ? '#f5f5f7' : isDayPhase ? '#f0d070' : '#b8a8ff';
  const medallionGlowMid = isPaused ? '#d8dde5' : isDayPhase ? '#b07828' : '#6d4fff';
  const medallionGlowEnd = isPaused ? '#8a8f9f' : isDayPhase ? '#200e02' : '#1a0f4d';

  // Frozen metallic platinum used to "crystallize" the icons while paused.
  const frostColor = '#e0e0e6';
  const sunBodyColor = isPaused ? 'rgba(224,224,230,0.95)' : 'rgba(255,215,110,0.92)';
  const sunRayColor = isPaused ? 'rgba(224,224,230,0.85)' : 'rgba(255,215,100,0.90)';
  const moonBodyColor = isPaused ? 'rgba(224,224,230,0.94)' : 'rgba(221,224,255,0.90)';
  const moonStrokeColor = isPaused ? 'rgba(208,210,220,0.6)' : 'rgba(205,196,255,0.64)';

  // Boundary = dark base ring radius. Nothing may bleed beyond it; all content
  // is wrapped in a master clip at this radius.
  const boundaryRadius = size * 0.475;
  const bloomLayerRadius = size * 0.45;
  const outerGuideRadius = size * 0.4;
  const progressHaloRadius = size * 0.355;
  const decorativeMarksRadius = size * 0.3;
  const coreMedallionOuterRadius = size * 0.22;
  const coreMedallionInnerRadius = size * 0.17;

  const progressStrokeWidth = 5.1 * scaleFactor;
  const progressCircumference = 2 * Math.PI * progressHaloRadius;
  const progressDashArray = progressCircumference;
  const progressDashOffset = progressCircumference * (1 - progress);
  const progressArcTransition = isLoopReset
    ? 'none'
    : `stroke-dashoffset ${config.animationDuration}ms ease, stroke ${config.animationDuration}ms ease`;

  const markAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      aria-hidden="true"
    >
      <svg
        key={`${isDayPhase}-${isPaused}`}
        width={size}
        height={size}
        viewBox={`-${size / 2} -${size / 2} ${size} ${size}`}
        className="absolute inset-0 transition-transform duration-300 hover:scale-[1.02]"
        style={{ overflow: 'hidden' }}
      >
        <defs>
          <radialGradient id={bloomGradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity={glowOpacity[1] * palette.bloomIntensity} />
            <stop offset="58%" stopColor={glowColor} stopOpacity={glowOpacity[0] * 0.32 * palette.bloomIntensity} />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </radialGradient>

          {/* Medallion gradient — changes with palette (bronze day, purple night, silver paused) */}
          <linearGradient id={medallionGradientId} x1="14%" y1="4%" x2="86%" y2="96%">
            <stop offset="0%" stopColor={medallionGlowStart} />
            <stop offset="35%" stopColor={medallionGlowMid} />
            <stop offset="100%" stopColor={medallionGlowEnd} />
          </linearGradient>

          <radialGradient id={coreHighlightGradientId} cx="34%" cy="26%" r="72%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.20)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          <filter id={glowFilterId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id={bigBloomFilterId} x="-140%" y="-140%" width="380%" height="380%">
            <feGaussianBlur stdDeviation={palette.bloomIntensity * 8.5} />
          </filter>

          {/* Antique metal grain: monochrome fractal noise overlaid on the core */}
          <filter id={metalNoiseId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
            <feComposite in="mono" in2="SourceGraphic" operator="in" />
          </filter>

          {/* Frost / brina: magical frosted-glass texture for the paused porthole */}
          <filter id={frostFilterId} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="3" stitchTiles="stitch" result="frost" />
            <feColorMatrix in="frost" type="saturate" values="0" result="frostMono" />
            <feComponentTransfer in="frostMono" result="frostAlpha">
              <feFuncA type="linear" slope="0.55" intercept="0" />
            </feComponentTransfer>
            <feGaussianBlur in="frostAlpha" stdDeviation="0.4" />
          </filter>

          {/* Master boundary clip — nothing may bleed past the dark base ring */}
          <clipPath id={baseClipId}>
            <circle cx="0" cy="0" r={boundaryRadius} />
          </clipPath>

          <clipPath id={clipId}>
            <circle cx="0" cy="0" r={coreMedallionInnerRadius * 0.82} />
          </clipPath>
        </defs>

        {d.darkBaseRing && (
          <>
            {/* Dark base ring — the widget frame and clip boundary */}
            <circle
              cx="0"
              cy="0"
              r={boundaryRadius}
              fill="#0c0a07"
          style={{
            stroke: ringColor,
            strokeWidth: 1.4 * scaleFactor,
            strokeOpacity: 0.3,
            transition: 'stroke 400ms ease',
          }}
            />
          </>
        )}

        {/* All inner content clipped to the dark base ring */}
        <g clipPath={`url(#${baseClipId})`}>
        {d.bloom && (
          <>
            {/* Layer 1: bloom */}
            <circle
              cx="0"
              cy="0"
              r={bloomLayerRadius}
              fill={`url(#${bloomGradientId})`}
          filter={`url(#${bigBloomFilterId})`}
              opacity={isPaused ? 0.55 : 1}
              style={{ transition: 'opacity 320ms ease' }}
            />
          </>
        )}

        {d.outerGuide && (
          <>
            {/* Layer 2: outer guide */}
            <circle
              cx="0"
              cy="0"
              r={outerGuideRadius}
              fill="none"
              style={{
                stroke: ringColor,
                strokeWidth: 1.6 * scaleFactor,
                opacity: 0.16,
                transition: 'stroke 400ms ease',
              }}
            />
          </>
        )}

        {d.progressHalo && (
          <>
            {/* Layer 3: progress halo track + arc (frozen-in-place on pause) */}
            <g transform="rotate(-90)" style={{ opacity: progress < 0.01 ? 0 : 1, transition: 'opacity 200ms ease' }}>
          <circle
            cx="0"
            cy="0"
            r={progressHaloRadius}
            fill="none"
            style={{
              stroke: ringColor,
              strokeWidth: progressStrokeWidth,
              opacity: 0.14,
              transition: 'stroke 400ms ease',
            }}
          />
          <circle
            cx="0"
            cy="0"
            r={progressHaloRadius}
            fill="none"
            strokeDasharray={progressDashArray}
            strokeLinecap="round"
            filter={`url(#${glowFilterId})`}
            style={{
              stroke: glowColor,
              strokeWidth: progressStrokeWidth,
              strokeDashoffset: progressDashOffset,
              opacity: isPaused ? glowOpacity[1] * 0.5 : glowOpacity[1],
              transition: progressArcTransition
                ? `${progressArcTransition}, stroke 400ms ease, opacity 400ms ease`
                : 'stroke 400ms ease, opacity 400ms ease',
            }}
            />
          </g>
        </>
        )}

        {d.decorativeMarks && (
          <>
            {/* Layer 4: decorative marks */}
        {markAngles.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const inner = decorativeMarksRadius - 2.3 * scaleFactor;
          const outer = decorativeMarksRadius + 2.3 * scaleFactor;
          const isCardinal = angle % 90 === 0;
          return (
            <line
              key={angle}
              x1={Math.cos(rad) * inner}
              y1={Math.sin(rad) * inner}
              x2={Math.cos(rad) * outer}
              y2={Math.sin(rad) * outer}
              strokeLinecap="round"
              style={{
                stroke: ringColor,
                strokeOpacity: isCardinal ? 0.24 : 0.14,
                strokeWidth: (isCardinal ? 1.3 : 0.9) * scaleFactor,
                transition: 'stroke 400ms ease',
              }}
                />
              );
            })}
          </>
        )}

        {d.coreMedallionOuter && (
          <>
            {/* Layer 5: core medallion — outer shell follows palette (bronze/purple/silver) */}
            <circle
              cx="0"
              cy="0"
              r={coreMedallionOuterRadius}
              fill={`url(#${medallionGradientId})`}
              opacity={0.92}
              style={{ transition: 'opacity 400ms ease' }}
            />
          </>
        )}

        {d.metalNoise && (
          <>
            {/* Metallic grain on the bronze plating */}
            <g clipPath={`url(#${baseClipId})`}>
              <circle
                cx="0"
                cy="0"
                r={coreMedallionOuterRadius}
                filter={`url(#${metalNoiseId})`}
                opacity={0.1}
                style={{ mixBlendMode: 'overlay' }}
              />
            </g>
          </>
        )}

        {d.coreInner && (
          <>
            <circle
              cx="0"
              cy="0"
              r={coreMedallionInnerRadius}
              style={{
                fill: coreColor,
                opacity: 0.98,
                transition: 'fill 400ms ease',
              }}
            />
          </>
        )}

        {d.coreHighlight && (
          <>
            <circle
              cx="0"
              cy="0"
              r={coreMedallionInnerRadius * 0.92}
              fill={`url(#${coreHighlightGradientId})`}
            />
          </>
        )}

        {d.outerRim && (
          <>
            <circle
              cx="0"
              cy="0"
              r={coreMedallionOuterRadius}
              fill="none"
              filter={`url(#${glowFilterId})`}
              style={{
                stroke: ringColor,
                strokeWidth: 1.6 * scaleFactor,
                strokeOpacity: 0.34,
                transition: 'stroke 400ms ease',
              }}
            />
          </>
        )}

        {d.dayIcon && (
          <>
            {/* Day icon — stays visible by phase; crossfades to platinum when paused */}
            <g
              clipPath={`url(#${clipId})`}
              style={{
                opacity: isDayPhase ? 1 : 0,
                transition: 'opacity 220ms ease',
              }}
            >
              <circle
                cx="0"
                cy="0"
                r={coreMedallionInnerRadius * 0.31}
                strokeWidth={0.7 * scaleFactor}
                style={{
                  fill: sunBodyColor,
                  stroke: isPaused ? 'rgba(236,238,244,0.7)' : 'rgba(255,239,165,0.72)',
                  transition: 'fill 400ms ease, stroke 400ms ease',
                }}
              />
              {[
                [0, -0.52, 0, -0.7],
                [0, 0.52, 0, 0.7],
                [-0.52, 0, -0.7, 0],
                [0.52, 0, 0.7, 0],
              ].map(([x1, y1, x2, y2], i) => (
                <line
                  key={i}
                  x1={coreMedallionInnerRadius * x1}
                  y1={coreMedallionInnerRadius * y1}
                  x2={coreMedallionInnerRadius * x2}
                  y2={coreMedallionInnerRadius * y2}
                  strokeWidth={1.2 * scaleFactor}
                  strokeLinecap="round"
                  style={{ stroke: sunRayColor, transition: 'stroke 400ms ease' }}
                />
              ))}
            </g>
          </>
        )}

        {d.nightIcon && (
          <>
            {/* Night icon — stays visible by phase; crossfades to platinum when paused */}
            <g
              clipPath={`url(#${clipId})`}
              style={{
                opacity: !isDayPhase ? 1 : 0,
                transition: 'opacity 220ms ease',
              }}
            >
              <path
                d={`
                  M ${coreMedallionInnerRadius * 0.08} ${-coreMedallionInnerRadius * 0.34}
                  A ${coreMedallionInnerRadius * 0.34} ${coreMedallionInnerRadius * 0.34} 0 1 0 ${coreMedallionInnerRadius * 0.32} ${coreMedallionInnerRadius * 0.10}
                  A ${coreMedallionInnerRadius * 0.22} ${coreMedallionInnerRadius * 0.22} 0 1 1 ${coreMedallionInnerRadius * 0.08} ${-coreMedallionInnerRadius * 0.34}
                  Z
                `}
                strokeWidth={0.7 * scaleFactor}
                style={{
                  fill: moonBodyColor,
                  stroke: moonStrokeColor,
                  transition: 'fill 400ms ease, stroke 400ms ease',
                }}
              />
              <circle
                cx={coreMedallionInnerRadius * 0.42}
                cy={-coreMedallionInnerRadius * 0.24}
                r={0.65 * scaleFactor}
                style={{
                  fill: isPaused ? 'rgba(228,230,238,0.85)' : 'rgba(220,230,255,0.82)',
                  transition: 'fill 400ms ease',
                }}
              />
            </g>
          </>
        )}

        {d.frost && (
          <>
            {/* Frosted-glass overlay — magical brina that fogs the porthole on pause */}
            <g
              clipPath={`url(#${clipId})`}
              style={{
                opacity: isPaused ? 1 : 0,
                transition: 'opacity 500ms ease',
              }}
            >
              <circle
                cx="0"
                cy="0"
                r={coreMedallionInnerRadius * 0.82}
                fill={frostColor}
                opacity={0.16}
              />
              <g clipPath={`url(#${baseClipId})`}>
                <circle
                  cx="0"
                  cy="0"
                  r={coreMedallionInnerRadius * 0.82}
                  fill={frostColor}
                  filter={`url(#${frostFilterId})`}
                  opacity={0.5}
                />
              </g>
            </g>
          </>
        )}
        </g>
      </svg>
    </div>
  );
}
