import React, { useMemo } from 'react';
import type { ActivityDefinition, IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import { createSandboxDiagnostics, type PickerDiagnosticsPayload } from '@/ui/idleVillage/utils/sandboxDiagnostics';

/**
 * Props for the Gym Shift HUD component.
 */
export interface GymShiftHUDProps {
  /** The Gym Shift activity definition */
  activity: ActivityDefinition;
  /** Current village state */
  villageState: VillageState;
  /** Idle Village config */
  config: IdleVillageConfig;
  /** Assigned resident ID */
  assignedResidentId: string;
  /** Progress fraction (0-1) */
  progressFraction: number;
  /** Elapsed seconds */
  elapsedSeconds: number;
  /** Total duration seconds */
  totalDurationSeconds: number;
}

/**
 * HUD component for Gym Shift activity display.
 *
 * Shows activity progress, resident fatigue, and resource impacts
 * during active Gym Shift. Config-first design.
 */
const GymShiftHUD: React.FC<GymShiftHUDProps> = ({
  activity,
  villageState,
  config,
  assignedResidentId,
  progressFraction,
  elapsedSeconds,
  totalDurationSeconds,
}) => {
  const diagnostics = useMemo(
    () => createSandboxDiagnostics<PickerDiagnosticsPayload>('GymShiftHUD', 'punchclub'),
    [],
  );
  
  const assignedResident = villageState.residents[assignedResidentId];

  // Calculate fatigue impact
  const fatigueImpact = useMemo(() => {
    const meta = activity.metadata as { fatigueGainMin?: number; fatigueGainMax?: number } | undefined;
    const min = meta?.fatigueGainMin ?? 18;
    const max = meta?.fatigueGainMax ?? 22;
    return { min, max };
  }, [activity.metadata]);

  // Current fatigue
  const currentFatigue = assignedResident?.fatigue ?? 0;
  const maxFatigue = config.globalRules.maxFatigueBeforeExhausted;
  const fatigueAfter = Math.min(maxFatigue, currentFatigue + fatigueImpact.max);

  // Progress percentage
  const progressPercent = Math.round(progressFraction * 100);

  // Remaining time
  const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.floor(remainingSeconds % 60);

  return (
    <div className="rounded-2xl bg-black/80 border border-amber-200/30 px-4 py-3 text-ivory shadow-lg backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏋️</span>
          <span className="text-sm font-semibold text-amber-200">Gym Shift</span>
        </div>
        <span className="text-xs text-slate-400">
          {progressPercent}% • {minutes}:{seconds.toString().padStart(2, '0')} left
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-2 w-full rounded-full bg-slate-700/50">
          <div
            className="h-full rounded-full bg-linear-to-r from-amber-500 to-amber-300 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Resident info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300">Resident:</span>
          <span className="font-semibold text-amber-200">{assignedResident?.id ?? 'Unknown'}</span>
        </div>

        {/* Fatigue bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300">Fatigue:</span>
            <span className="text-slate-400">
              {currentFatigue} → {fatigueAfter} (+{fatigueImpact.min}-{fatigueImpact.max})
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-700/50">
            <div
              className="h-full rounded-full bg-linear-to-r from-green-500 to-yellow-500 to-red-500 transition-all duration-300"
              style={{ width: `${(currentFatigue / maxFatigue) * 100}%` }}
            />
          </div>
        </div>

        {/* Resource impacts */}
        <div className="text-xs text-slate-400 pt-1 border-t border-slate-600/50">
          Consuming 1 Food per resident daily • Earning 6 Gold per shift
        </div>
      </div>
    </div>
  );
};

export default GymShiftHUD;
