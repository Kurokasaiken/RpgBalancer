import { useMemo, useCallback, useEffect } from 'react';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';
import type { ActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';
import { useActivityTelemetry } from '@/ui/idleVillage/hooks/useActivityTelemetry';
import { useActiveHUDTelemetry } from '@/ui/idleVillage/hooks/useActiveHUDTelemetry';
import { useActivityAnalytics } from '@/ui/idleVillage/hooks/useActivityAnalytics';
import { useActiveHUDHaptics } from '@/ui/idleVillage/hooks/useActiveHUDHaptics';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { CrewSchedulerHUDCard } from './CrewSchedulerHUDCard';
import type { UseCrewHUDStateReturn } from '../hooks/useCrewHUDState';

/**
 * Visual density variants supported by {@link ActiveHUD}.
 */
export type ActiveHUDVariant = 'default' | 'compact';

/**
 * Props for the Observatory-styled ActiveHUD component.
 * Supports both legacy activeSlots interface and new Phase 12 hudState interface.
 */
export interface ActiveHUDProps {
  /** [Legacy] Scheduler entries that are currently running. */
  activeSlots?: { slot: ActivitySlotData; state: ScheduledActivityState }[];
  /** [Phase 12] Aggregated HUD state from useActiveHUDState hook. */
  hudState?: ActiveHUDState;
  /** [Phase 12] Village state for telemetry snapshots. */
  villageState?: VillageState;
  /** [NP-017] Crew HUD state for crew scheduler integration. */
  crewHUDState?: UseCrewHUDStateReturn;
  /** Seconds contained inside one Idle Village time unit (config-driven). */
  secondsPerTimeUnit: number;
  /** Density preset; compact is used for sticky sidebars. */
  variant?: ActiveHUDVariant;
  /** Optional clamp to avoid rendering an excessively long list. */
  maxVisible?: number;
  /** Enable telemetry tracking (Phase 12). */
  enableTelemetry?: boolean;
}

interface HudEntryViewModel {
  key: string;
  icon: string;
  label: string;
  assignedResident: string;
  progressFraction: number;
  timeLabel: string;
}

const diagnostics = createSandboxDiagnostics('ActiveHUD', 'component');

/**
 * Observatory HUD summarizing currently running activities with compact timers and progress bars.
 * Phase 12: Supports both legacy activeSlots and new hudState with telemetry.
 */
const ActiveHUD: React.FC<ActiveHUDProps> = ({
  activeSlots,
  hudState,
  villageState,
  crewHUDState,
  secondsPerTimeUnit,
  variant = 'default',
  maxVisible,
  enableTelemetry = false,
}) => {
  // Enable activity telemetry for Phase 12
  useActivityTelemetry({
    hudState: hudState ?? { activities: [], counts: { jobs: 0, quests: 0, maintenance: 0, total: 0 }, hasActiveActivities: false },
    villageState: villageState ?? { currentTime: 0, resources: {}, residents: {}, activities: {}, eventLog: [], questOffers: {} },
    enabled: enableTelemetry && !!hudState && !!villageState,
  });

  // Enable Active HUD telemetry for render and interaction tracking
  useActiveHUDTelemetry({
    hudState,
    activeSlots,
    villageState,
    variant,
    maxVisible,
    enabled: enableTelemetry,
  });

  // Enable activity analytics for performance metrics
  const analytics = useActivityAnalytics({
    hudState: hudState ?? { activities: [], counts: { jobs: 0, quests: 0, maintenance: 0, total: 0 }, hasActiveActivities: false },
    villageState: villageState ?? { currentTime: 0, resources: {}, residents: {}, activities: {}, eventLog: [], questOffers: {} },
    config: {
      enableRealTimeUpdates: true,
      enableEfficiencyMetrics: true,
      enableResidentAnalytics: true,
      collectionInterval: 10000, // 10 seconds
      maxHistoricalPoints: 50,
    },
    onAnalyticsUpdate: enableTelemetry ? (metrics) => {
      // Log analytics updates for debugging
      console.log('[ActiveHUD Analytics]', metrics);
    } : undefined,
  });

  // Enable haptics and audio feedback for Phase 12
  const haptics = useActiveHUDHaptics({
    activities: hudState?.activities ?? [],
    enabled: enableTelemetry,
    testMode: false,
    onHapticEvent: (eventType, activity) => {
      // Log haptic events for debugging
      console.log('[ActiveHUD Haptics]', { eventType, activityKey: activity?.key });
    },
  });

  // Use Phase 12 hudState if available, otherwise fall back to legacy activeSlots
  const entryViewModels = useMemo<HudEntryViewModel[]>(() => {
    if (hudState) {
      // Phase 12: Use new hudState
      const activities = typeof maxVisible === 'number' ? hudState.activities.slice(0, maxVisible) : hudState.activities;
      return activities.map((activity) => {
        const timeUnitsRemaining = Math.floor(activity.remainingSeconds / secondsPerTimeUnit);
        const secondsRemainder = Math.floor(activity.remainingSeconds % secondsPerTimeUnit)
          .toString()
          .padStart(2, '0');
        return {
          key: activity.key,
          icon: activity.icon,
          label: activity.label,
          assignedResident: activity.residentName,
          progressFraction: activity.progress,
          timeLabel: `${timeUnitsRemaining}:${secondsRemainder}`,
        };
      });
    } else if (activeSlots) {
      // Legacy: Use activeSlots
      const visibleSlots = typeof maxVisible === 'number' ? activeSlots.slice(0, maxVisible) : activeSlots;
      return visibleSlots.map(({ slot, state }) => {
        const progressFraction = Math.min(1, Math.max(0, state.progress));
        const remainingSeconds = Math.max(0, state.duration - state.elapsed);
        const timeUnitsRemaining = Math.floor(remainingSeconds / secondsPerTimeUnit);
        const secondsRemainder = Math.floor(remainingSeconds % secondsPerTimeUnit)
          .toString()
          .padStart(2, '0');
        return {
          key: `${slot.slotId}-${state.residentId}`,
          icon: slot.iconName,
          label: slot.label,
          assignedResident: state.residentId,
          progressFraction,
          timeLabel: `${timeUnitsRemaining}:${secondsRemainder}`,
        };
      });
    }
    return [];
  }, [hudState, activeSlots, secondsPerTimeUnit, maxVisible]);

  const totalCount = hudState ? hudState.activities.length : (activeSlots?.length ?? 0);

  // Handle activity card clicks for telemetry and haptics
  const handleActivityClick = useCallback((activityKey: string, activityType?: string, residentName?: string) => {
    // Trigger haptic feedback for card selection
    haptics.triggerHaptic('card_select');
    
    // Call existing handler
    if (window.__activeHUDHandlers?.handleCardSelection) {
      window.__activeHUDHandlers.handleCardSelection(activityKey, activityType, residentName);
    }
  }, [haptics]);

  // Handle activity card hover for haptics
  const handleActivityHover = useCallback((activityKey: string) => {
    // Trigger subtle haptic feedback for hover
    haptics.triggerHaptic('card_hover');
  }, [haptics]);
  
  // Handle crew card interactions for telemetry
  const handleCrewCardInteraction = useCallback((crewId: string, action: string) => {
    if (enableTelemetry) {
      diagnostics.info('Telemetry: hud_crew_card_interaction', {
        crewId,
        action,
        timestamp: Date.now(),
      });
    }
  }, [enableTelemetry]);
  
  const hasOverflow = typeof maxVisible === 'number' ? totalCount > maxVisible : false;
  
  // Trigger overflow warning haptic when applicable
  useEffect(() => {
    if (hasOverflow && haptics.isHapticsAvailable) {
      haptics.triggerHaptic('overflow_warning');
    }
  }, [hasOverflow, haptics.isHapticsAvailable, haptics]);
  const containerClass =
    variant === 'compact'
      ? 'default-card border border-amber-300/30 bg-black/70 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.45)]'
      : 'bg-black/80 backdrop-blur-sm rounded-2xl border border-amber-300/30 p-4 max-w-md';

  if (entryViewModels.length === 0) {
    return (
      <section data-testid="active-hud" data-variant={variant} className={containerClass}>
        <header className="mb-2 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.35em] text-amber-200/80">Active HUD</span>
          <span className="text-[10px] text-slate-400">0</span>
        </header>
        <div className="text-xs text-slate-400">Nessuna attività in corso</div>
      </section>
    );
  }

  return (
    <section data-testid="active-hud" data-variant={variant} className={containerClass}>
      <header className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-amber-200/80">
            {variant === 'compact' ? 'Mission Log' : 'Active Activities'}
          </p>
          <p className="text-sm font-semibold text-ivory">Monitoraggio attività</p>
        </div>
        <span className="rounded-full border border-amber-200/30 px-2 py-0.5 text-[10px] text-amber-100">
          {totalCount}
        </span>
      </header>

      <div className={variant === 'compact' ? 'space-y-2' : 'space-y-3'}>
        {entryViewModels.map((entry) => (
          <article
            key={entry.key}
            data-activity-key={entry.key}
            className={
              variant === 'compact'
                ? 'rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100 cursor-pointer hover:border-amber-300/30 transition-colors'
                : 'flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 cursor-pointer hover:border-amber-300/20 hover:bg-white/10 transition-colors'
            }
            onClick={() => handleActivityClick(
              entry.key,
              hudState?.activities.find(a => a.key === entry.key)?.activityType,
              entry.assignedResident
            )}
            onMouseEnter={() => handleActivityHover(entry.key)}
          >
            <div className="text-lg" aria-hidden>
              {entry.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[12px] text-slate-200">
                <span>{entry.label}</span>
                <span className="text-[11px] text-slate-400">{entry.timeLabel}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-400 to-amber-200 transition-all"
                  style={{ width: `${entry.progressFraction * 100}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                {entry.assignedResident}
              </p>
            </div>
          </article>
        ))}
      </div>

      {hasOverflow && (
        <div className="mt-3 rounded-lg border border-dashed border-amber-200/40 px-3 py-2 text-[11px] text-amber-100/80">
          +{totalCount - (maxVisible ?? 0)} attività aggiuntive in coda
        </div>
      )}

      {/* Crew Scheduler HUD Integration - NP-017 */}
      {crewHUDState && crewHUDState.crewEntries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <header className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-amber-200/80">
                Crew Status
              </p>
              <p className="text-sm font-semibold text-ivory">Monitoraggio equipaggio</p>
            </div>
            <span className="rounded-full border border-amber-200/30 px-2 py-0.5 text-[10px] text-amber-100">
              {crewHUDState.metrics.totalCrew}
            </span>
          </header>

          <div className={`grid gap-3 ${variant === 'compact' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {crewHUDState.crewEntries.map((crewEntry) => (
              <CrewSchedulerHUDCard
                key={crewEntry.crewId}
                crewEntry={crewEntry}
                config={crewHUDState.config}
                metrics={crewHUDState.metrics}
                onPauseToggle={crewHUDState.toggleCrewPause}
                onPriorityAdjust={crewHUDState.adjustCrewPriority}
                compact={variant === 'compact'}
              />
            ))}
          </div>

          {crewHUDState.crewEntries.length > (variant === 'compact' ? 1 : 2) && (
            <div className="mt-3 rounded-lg border border-dashed border-amber-200/40 px-3 py-2 text-[11px] text-amber-100/80">
              +{crewHUDState.crewEntries.length - (variant === 'compact' ? 1 : 2)} membri equipaggio aggiuntivi
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ActiveHUD;
