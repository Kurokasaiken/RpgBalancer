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

type ResourceSummary = {
  id: string;
  label: string;
  icon?: ReactNode;
};

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
  resourceSummaries?: ResourceSummary[];
  
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
  compact = false,
  showClockDetails = false,
  maxVisibleActivities = 4,
  className,
  resourceSummaries = [],
  skinPresetId = 'minimal_frontier',
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
      resourceCount: resourceSummaries.length,
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
    resourceSummaries.length,
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
  const icon = isPlaying ? phaseIcon : pauseIcon;
  
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
    const speedCycle: (number | 'pause')[] = [1, 2, 3, 5, 'pause'];
    const normalizedSpeed = Number(resolvedSpeedMultiplier.toFixed(2));
    const currentIndex = (() => {
      if (!isPlaying) return speedCycle.indexOf('pause');
      const idx = speedCycle.findIndex((value) => typeof value === 'number' && Math.abs(value - normalizedSpeed) < 0.05);
      return idx >= 0 ? idx : 0;
    })();
    const handleSpeedCycle = () => {
      const nextIndex = (currentIndex + 1) % speedCycle.length;
      const nextValue = speedCycle[nextIndex];
      if (nextValue === 'pause') {
        if (isPlaying) {
          onToggle?.();
        }
        return;
      }
      if (!isPlaying) {
        onToggle?.();
      }
      clockProps.onSpeedChange?.(nextValue);
    };
    const speedButtonLabel = isPlaying ? `${normalizedSpeed}×` : 'Pause';

    const resourceEntries = resourceSummaries.map((summary) => ({
      ...summary,
      value: Math.max(0, Math.floor(Number(villageState?.resources?.[summary.id] ?? 0))),
    }));

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

        <div className="hidden h-2 flex-1 rounded-full bg-white/10 sm:flex" aria-hidden>
          <div
            className="rounded-full bg-linear-to-r from-amber-300 to-amber-100"
            style={{ width: `${clampedProgress * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={handleSpeedCycle}
            className="rounded-full border border-white/20 px-3 py-1 text-white/80 transition-colors hover:border-white/50 hover:text-white"
            aria-label="Cicla velocità (1× → 2× → 3× → 5× → pausa)"
          >
            {speedButtonLabel}
          </button>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 text-[10px] uppercase tracking-[0.3em] text-white/50">
          {resourceEntries.length > 0 && (
            <div className="flex items-center gap-3 rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-[0.25em] text-white/70">
              {resourceEntries.map((entry) => (
                <span key={entry.id} className="flex items-center gap-1 text-white/80">
                  {entry.icon ? (
                    <span aria-hidden className="text-base leading-none">
                      {entry.icon}
                    </span>
                  ) : null}
                  <span>{entry.label}</span>
                  <span className="font-mono text-white">
                    {new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 }).format(entry.value)}
                  </span>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <span>Attive {activeCount}</span>
            <span>{formatMiniCardCountdown(Math.max(totalSeconds - elapsedSeconds, 0))}</span>
          </div>
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
