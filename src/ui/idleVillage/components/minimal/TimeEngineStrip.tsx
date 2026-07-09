/**
 * TimeEngineStrip Component
 * 
 * Consolidated strip combining Day/Night cycle, ClockWidget, and ActiveHUD
 * for TestRosterPage and other minimal gameplay surfaces.
 */

import React from 'react';
import type { ReactNode } from 'react';
import { PauseCircle } from 'lucide-react';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';
import { ActionCard } from '@/ui/idleVillage/map/actionCards/ActionCard';
import { formatMiniCardCountdown } from '@/ui/idleVillage/map/actionCards/cardFormatting';
import type { ActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';
import { ClockWidget, type ClockWidgetProps } from './ClockWidget';
import ActiveHUD from '@/ui/idleVillage/components/ActiveHUD';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { TimeEngineSkinConfig } from '@/ui/idleVillage/skins/timeEngineSkinConfig';
import { createTimeEngineSkinConfig } from '@/ui/idleVillage/skins/timeEngineSkinConfig';

/**
 * Elegant Play/Pause mechanical toggle icon
 */
const PlayPauseIcon = ({ isPlaying }: { isPlaying: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    {isPlaying ? (
      <>
        <rect x="4" y="3" width="2.5" height="10" rx="0.5" fill="currentColor" />
        <rect x="9.5" y="3" width="2.5" height="10" rx="0.5" fill="currentColor" />
      </>
    ) : (
      <path d="M5 3.5L12 8L5 12.5V3.5Z" fill="currentColor" />
    )}
  </svg>
);

/**
 * Single bronze chevron for 1X speed
 */
const Speed1XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Double chiseled bronze chevron for 2X speed
 */
const Speed2XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M3 6L7 10L11 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 4L9 8L13 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Triple chevron / stylized comet for 4X speed
 */
const Speed4XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M2 6L6 10L10 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 4L8 8L12 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 2L10 6L14 2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


interface TimeEngineStripProps {
  /** Day/Night cycle properties */
  phaseIcon: ReactNode;
  isPlaying: boolean;
  progressFraction: number;
  totalSeconds: number;
  onToggle: () => void;
  variant?: VerbVisualVariant;
  label?: string;
  pauseIcon?: ReactNode;
  
  /** ClockWidget properties */
  clockProps: Omit<ClockWidgetProps, 'onTogglePause'>;
  
  /** ActiveHUD properties */
  hudState: ActiveHUDState;
  villageState: any;
  secondsPerTimeUnit: number;
  
  /** Temporal display data (Year, Season, Time) */
  temporalDisplay?: {
    year?: string;
    season?: string;
    time?: string;
  };
  
  /** Strip layout options */
  compact?: boolean;
  showClockDetails?: boolean;
  maxVisibleActivities?: number;
  className?: string;
  
  /** Skin configuration */
  skinPresetId?: string;
  pillar?: 'frontier' | 'wilderness' | 'empire';
  skinConfig?: Partial<TimeEngineSkinConfig>;
}

export default TimeEngineStrip;

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const clamp = (value: number, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
};

export function TimeEngineStrip({
  phaseIcon,
  isPlaying,
  progressFraction,
  totalSeconds,
  onToggle,
  variant = 'solar',
  label = 'Day/Night Cycle',
  pauseIcon = <PauseCircle aria-hidden data-testid="day-night-pause-icon" className="h-8 w-8" />,
  clockProps,
  hudState,
  villageState,
  secondsPerTimeUnit,
  temporalDisplay,
  compact = false,
  showClockDetails = false,
  maxVisibleActivities = 4,
  className,
  skinPresetId = 'base',
  pillar = 'frontier',
  skinConfig,
}: TimeEngineStripProps) {
  // Create skin configuration
  const config = createTimeEngineSkinConfig(skinPresetId, pillar);
  const finalConfig: TimeEngineSkinConfig = { ...config, ...skinConfig };

  // Emit telemetry event when skin is rendered
  React.useEffect(() => {
    trackTelemetryEvent('time_engine_skin_rendered', {
      skinPresetId,
      pillar,
      componentTheme: finalConfig.componentTheme,
      clockStyle: finalConfig.clockStyle.displayMode,
      hasAccentGlow: !!finalConfig.accentGlow.glowToken,
      isCompact: compact,
      showClockDetails,
      maxVisibleActivities,
      activeActivities: hudState?.activities?.length || 0,
    });
  }, [
    skinPresetId,
    pillar,
    finalConfig.componentTheme,
    finalConfig.clockStyle.displayMode,
    finalConfig.accentGlow.glowToken,
    compact,
    showClockDetails,
    maxVisibleActivities,
    hudState?.activities?.length,
  ]);

  // Apply CSS variables for skin styling
  const cssVariables = React.useMemo(() => {
    const vars: Record<string, string> = {};
    
    // Clock style variables
    vars['--time-clock-face'] = `var(${finalConfig.clockStyle.faceToken})`;
    vars['--time-clock-hands'] = `var(${finalConfig.clockStyle.handsToken})`;
    vars['--time-clock-numbers'] = `var(${finalConfig.clockStyle.numbersToken})`;
    
    // Accent glow variables
    vars['--time-glow-color'] = `var(${finalConfig.accentGlow.glowToken})`;
    vars['--time-glow-intensity'] = String(finalConfig.accentGlow.intensity);
    vars['--time-glow-radius'] = `${finalConfig.accentGlow.radius}px`;
    
    // Progress bar variables
    vars['--time-progress-fill'] = `var(${finalConfig.progressBar.fillToken})`;
    vars['--time-progress-background'] = `var(${finalConfig.progressBar.backgroundToken})`;
    vars['--time-progress-border'] = `var(${finalConfig.progressBar.borderToken})`;
    vars['--time-progress-height'] = `${finalConfig.progressBar.height}px`;
    
    // Typography variables
    vars['--time-font-display'] = `var(${finalConfig.typography.timeFont})`;
    vars['--time-font-label'] = `var(${finalConfig.typography.labelFont})`;
    vars['--time-font-caption'] = `var(${finalConfig.typography.captionFont})`;
    
    // Animation variables
    vars['--time-animation-tick'] = `var(${finalConfig.animations.tickAnimation})`;
    vars['--time-animation-transition'] = `var(${finalConfig.animations.transitionAnimation})`;
    vars['--time-animation-pulse'] = `var(${finalConfig.animations.pulseAnimation})`;
    
    return vars;
  }, [finalConfig]);

  const clampedProgress = clamp01(progressFraction);
  const elapsedSeconds = clampedProgress * totalSeconds;
  const icon = phaseIcon; // Always use phaseIcon; skin handles pause state internally
  
  // Day/Night card sizing
  const haloSizePx = compact ? 80 : 160;
  const haloSize = clamp(haloSizePx, 80, 360, 160);
  const haloStrokeWidth = compact ? 3 : 6;
  const haloStroke = clamp(haloStrokeWidth, 2, 16, 6);
  const innerSizePercent = compact ? 40 : 55;
  const innerPercent = clamp(innerSizePercent, 10, 90, 55);

  const resolvedSpeedMultiplier = clockProps?.speedMultiplier ?? 1;

  if (compact) {
    const activeCount = hudState?.activities.length ?? 0;
    const speeds = clockProps?.availableSpeeds ?? [1, 2, 4, 8];

    return (
      <div
        className={`flex w-full items-center gap-4 rounded-xl border border-white/10 bg-black/45 px-4 py-2 text-xs text-white/80 ${
          className || ''
        }`}
        data-testid="time-engine-strip-compact"
        data-skin-preset={skinPresetId}
        data-style-lab-pillar={pillar}
        data-component-theme={finalConfig.componentTheme}
        style={cssVariables}
      >
        <div className="flex items-center gap-3">
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40"
            style={{
              background: `conic-gradient(from -90deg, rgba(255,255,255,0.18) ${clampedProgress * 360}deg, rgba(255,255,255,0.05) 0deg)`,
            }}
            aria-label={`Cycle progress ${Math.round(clampedProgress * 100)}%`}
          >
            <div className="text-base" aria-hidden>
              {icon}
            </div>
          </div>
          <div className="flex flex-col text-[10px] uppercase tracking-[0.35em] text-white/60">
            <span>{label}</span>
            <span className="text-[9px] tracking-[0.25em] text-white/40">
              Day {clockProps.currentDay}
            </span>
          </div>
        </div>


        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="relative flex h-8 w-8 items-center justify-center text-amber-200/70 transition-all hover:text-amber-100"
            aria-label={isPlaying ? 'Pausa' : 'Play'}
          >
            <div
              className="absolute inset-0 rounded-full bg-amber-500/20 blur-md opacity-0 transition-opacity"
              style={{ opacity: isPlaying ? 0 : 0.6 }}
            />
            <PlayPauseIcon isPlaying={isPlaying} />
          </button>
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (!isPlaying) onToggle?.();
                clockProps.onSpeedChange?.(s);
              }}
              className={`relative flex h-8 w-8 items-center justify-center text-xs font-semibold transition-all ${
                resolvedSpeedMultiplier === s
                  ? 'text-amber-100'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
              aria-label={`${s}x velocità`}
            >
              <div
                className="absolute inset-0 rounded-full bg-amber-500/20 blur-md opacity-0 transition-opacity"
                style={{ opacity: isPlaying && resolvedSpeedMultiplier === s ? 0.6 : 0 }}
              />
              x{s}
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end gap-4 text-[10px] uppercase tracking-[0.3em] text-white/50">
          <div className="flex items-center gap-3">
            <span>Attive {activeCount}</span>
            <span>{formatMiniCardCountdown(Math.max(totalSeconds - elapsedSeconds, 0))}</span>
          </div>
          {temporalDisplay && (
            <div className="flex items-center gap-3 font-serif text-amber-200/80">
              {temporalDisplay.year && <span>{temporalDisplay.year}</span>}
              {temporalDisplay.season && <span>{temporalDisplay.season}</span>}
              {temporalDisplay.time && <span>{temporalDisplay.time}</span>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full layout: grid with Day/Night card, Clock, and ActiveHUD
  return (
    <div 
      className={`grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] ${className || ''}`}
      data-testid="time-engine-strip-full"
      data-skin-preset={skinPresetId}
      data-style-lab-pillar={pillar}
      data-component-theme={finalConfig.componentTheme}
      style={cssVariables}
    >
      {/* Day/Night Action Card */}
      <ActionCard
        label={label}
        icon={icon}
        progressFraction={clampedProgress}
        elapsedSeconds={elapsedSeconds}
        totalDurationSeconds={totalSeconds}
        isPlaying={isPlaying}
        variant={variant}
        onToggle={onToggle}
        className="mx-auto scale-75 sm:scale-90"
        haloSizePx={haloSize}
        haloStrokeWidth={haloStroke}
        innerSizePercent={innerPercent}
      />
      
      {/* Clock and ActiveHUD column */}
      <div className="flex flex-col gap-4">
        <ClockWidget
          {...clockProps}
          onTogglePause={onToggle}
          showTimingDetails={showClockDetails}
        />
        <ActiveHUD
          hudState={hudState}
          villageState={villageState}
          secondsPerTimeUnit={secondsPerTimeUnit}
          variant="default"
          maxVisible={maxVisibleActivities}
          enableTelemetry={false}
        />
      </div>
    </div>
  );
}
