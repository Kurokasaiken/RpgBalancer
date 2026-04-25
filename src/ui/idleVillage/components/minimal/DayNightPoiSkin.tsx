import type { JSX } from 'react';
import { useId, useMemo } from 'react';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import {
  getDayNightPoiSkinForPreset,
  resolveDayNightPoiPresetId,
} from '@/ui/idleVillage/skins/dayNightPoiSkinConfig';

/**
 * Props for DayNightPoiSkin component
 */
interface DayNightPoiSkinProps {
  /** Current phase (true = day, false = night) from store */
  isDayPhase: boolean;
  /** Progress through current phase (0-1) from store */
  cycleProgress: number;
  /** Whether the cycle is paused from store */
  isPaused: boolean;
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
export default function DayNightPoiSkin(props: DayNightPoiSkinProps): JSX.Element {
  const { isDayPhase, cycleProgress, isPaused } = props;

  const { presetId } = useSkinPreferences();
  const resolvedPresetId = resolveDayNightPoiPresetId(presetId);
  const skinPreset = getDayNightPoiSkinForPreset(resolvedPresetId);
  const config = skinPreset.config;

  const uniqueId = useId().replace(/:/g, '');
  const bloomGradientId = `dn-bloom-${uniqueId}`;
  const bronzeGradientId = `dn-bronze-${uniqueId}`;
  const coreHighlightGradientId = `dn-core-highlight-${uniqueId}`;
  const glowFilterId = `dn-glow-${uniqueId}`;
  const bigBloomFilterId = `dn-bigbloom-${uniqueId}`;
  const clipId = `dn-clip-${uniqueId}`;

  const size = config.size;
  const scaleFactor = size / 80;
  const progress = clamp01(cycleProgress);

  const palette = useMemo(() => {
    if (isPaused) return config.paused;
    return isDayPhase ? config.dayRunning : config.nightRunning;
  }, [config, isDayPhase, isPaused]);

  const ringColor = palette.ringColor;
  const glowColor = palette.glowColor;
  const glowOpacity = palette.glowOpacity;
  const coreColor = palette.coreColor;

  const bloomLayerRadius = size * 0.5;
  const outerGuideRadius = size * 0.4;
  const progressHaloRadius = size * 0.34;
  const decorativeMarksRadius = size * 0.295;
  const coreMedallionOuterRadius = size * 0.22;
  const coreMedallionInnerRadius = size * 0.17;

  const progressStrokeWidth = 5.1 * scaleFactor;
  const progressCircumference = 2 * Math.PI * progressHaloRadius;
  const progressDashArray = progressCircumference;
  const progressDashOffset = progressCircumference * (1 - progress);

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
        width={size}
        height={size}
        viewBox={`-${size / 2} -${size / 2} ${size} ${size}`}
        className="absolute inset-0 transition-transform duration-300 hover:scale-[1.02]"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={bloomGradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity={glowOpacity[1] * palette.bloomIntensity} />
            <stop offset="58%" stopColor={glowColor} stopOpacity={glowOpacity[0] * 0.32 * palette.bloomIntensity} />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </radialGradient>

          <linearGradient id={bronzeGradientId} x1="14%" y1="4%" x2="86%" y2="96%">
            <stop offset="0%" stopColor="#f0d070" />
            <stop offset="35%" stopColor="#b07828" />
            <stop offset="100%" stopColor="#200e02" />
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

          <clipPath id={clipId}>
            <circle cx="0" cy="0" r={coreMedallionInnerRadius * 0.82} />
          </clipPath>
        </defs>

        {/* Layer 1: bloom */}
        <circle
          cx="0"
          cy="0"
          r={bloomLayerRadius}
          fill={`url(#${bloomGradientId})`}
          filter={`url(#${bigBloomFilterId})`}
          opacity={isPaused ? 0.34 : 1}
        />

        {/* Layer 2: outer guide */}
        <circle
          cx="0"
          cy="0"
          r={outerGuideRadius}
          fill="none"
          stroke={ringColor}
          strokeWidth={1.6 * scaleFactor}
          opacity={0.16}
        />

        {/* Layer 3: progress halo track + arc */}
        <g transform="rotate(-90)">
          <circle
            cx="0"
            cy="0"
            r={progressHaloRadius}
            fill="none"
            stroke={ringColor}
            strokeWidth={progressStrokeWidth}
            opacity={0.14}
          />
          <circle
            cx="0"
            cy="0"
            r={progressHaloRadius}
            fill="none"
            stroke={glowColor}
            strokeWidth={progressStrokeWidth}
            strokeDasharray={progressDashArray}
            strokeDashoffset={progressDashOffset}
            strokeLinecap="round"
            opacity={glowOpacity[1]}
            filter={`url(#${glowFilterId})`}
            style={{
              transition: `stroke-dashoffset ${config.animationDuration}ms ease`,
            }}
          />
        </g>

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
              stroke={ringColor}
              strokeOpacity={isCardinal ? 0.24 : 0.14}
              strokeWidth={(isCardinal ? 1.3 : 0.9) * scaleFactor}
              strokeLinecap="round"
            />
          );
        })}

        {/* Layer 5: core medallion */}
        <circle
          cx="0"
          cy="0"
          r={coreMedallionOuterRadius}
          fill={`url(#${bronzeGradientId})`}
          opacity={0.92}
        />

        <circle
          cx="0"
          cy="0"
          r={coreMedallionInnerRadius}
          fill={coreColor}
          opacity={0.98}
        />

        <circle
          cx="0"
          cy="0"
          r={coreMedallionInnerRadius * 0.92}
          fill={`url(#${coreHighlightGradientId})`}
        />

        <circle
          cx="0"
          cy="0"
          r={coreMedallionOuterRadius}
          fill="none"
          stroke={ringColor}
          strokeWidth={1.6 * scaleFactor}
          strokeOpacity={0.34}
          filter={`url(#${glowFilterId})`}
        />

        {/* Day icon */}
        <g
          clipPath={`url(#${clipId})`}
          style={{
            opacity: isDayPhase && !isPaused ? 1 : 0,
            transition: 'opacity 220ms ease',
          }}
        >
          <circle
            cx="0"
            cy="0"
            r={coreMedallionInnerRadius * 0.31}
            fill="rgba(255,215,110,0.92)"
            stroke="rgba(255,239,165,0.72)"
            strokeWidth={0.7 * scaleFactor}
          />
          <line x1="0" y1={-coreMedallionInnerRadius * 0.52} x2="0" y2={-coreMedallionInnerRadius * 0.70} stroke="rgba(255,215,100,0.90)" strokeWidth={1.2 * scaleFactor} strokeLinecap="round" />
          <line x1="0" y1={coreMedallionInnerRadius * 0.52} x2="0" y2={coreMedallionInnerRadius * 0.70} stroke="rgba(255,215,100,0.90)" strokeWidth={1.2 * scaleFactor} strokeLinecap="round" />
          <line x1={-coreMedallionInnerRadius * 0.52} y1="0" x2={-coreMedallionInnerRadius * 0.70} y2="0" stroke="rgba(255,215,100,0.90)" strokeWidth={1.2 * scaleFactor} strokeLinecap="round" />
          <line x1={coreMedallionInnerRadius * 0.52} y1="0" x2={coreMedallionInnerRadius * 0.70} y2="0" stroke="rgba(255,215,100,0.90)" strokeWidth={1.2 * scaleFactor} strokeLinecap="round" />
        </g>

        {/* Night icon */}
        <g
          clipPath={`url(#${clipId})`}
          style={{
            opacity: !isDayPhase && !isPaused ? 1 : 0,
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
            fill="rgba(221,224,255,0.90)"
            stroke="rgba(205,196,255,0.64)"
            strokeWidth={0.7 * scaleFactor}
          />
          <circle
            cx={coreMedallionInnerRadius * 0.42}
            cy={-coreMedallionInnerRadius * 0.24}
            r={0.65 * scaleFactor}
            fill="rgba(220,230,255,0.82)"
          />
        </g>

        {/* Pause icon */}
        <g
          clipPath={`url(#${clipId})`}
          style={{
            opacity: isPaused ? 1 : 0,
            transition: 'opacity 220ms ease',
          }}
        >
          <rect
            x={-coreMedallionInnerRadius * 0.18}
            y={-coreMedallionInnerRadius * 0.28}
            width={coreMedallionInnerRadius * 0.13}
            height={coreMedallionInnerRadius * 0.56}
            rx={coreMedallionInnerRadius * 0.03}
            fill="rgba(255,221,155,0.90)"
          />
          <rect
            x={coreMedallionInnerRadius * 0.05}
            y={-coreMedallionInnerRadius * 0.28}
            width={coreMedallionInnerRadius * 0.13}
            height={coreMedallionInnerRadius * 0.56}
            rx={coreMedallionInnerRadius * 0.03}
            fill="rgba(255,221,155,0.90)"
          />
        </g>
      </svg>
    </div>
  );
}
