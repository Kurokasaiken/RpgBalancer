import React, { useMemo } from 'react';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * Props for the Training Tracker component.
 */
export interface TrainingTrackerProps {
  /** Current village state */
  villageState: VillageState;
  /** Optional filter for specific resident ID */
  residentId?: string;
}

/**
 * Training Tracker component for Punch Club stat progress.
 *
 * Shows small badges for edge/discipline stats gained from completed Gym Shifts.
 * Tracks progress for all residents or a specific resident.
 */
const TrainingTracker: React.FC<TrainingTrackerProps> = ({
  villageState,
  residentId,
}) => {
  // Calculate training progress from completed activities
  const trainingProgress = useMemo(() => {
    const progress: Record<string, { edge: number; discipline: number; totalShifts: number }> = {};

    // Count completed gym shifts per resident
    Object.values(villageState.activities).forEach(activity => {
      if (activity.activityId === 'job_punch_training' && activity.status === 'completed') {
        activity.characterIds.forEach(charId => {
          if (!residentId || charId === residentId) {
            if (!progress[charId]) {
              progress[charId] = { edge: 0, discipline: 0, totalShifts: 0 };
            }
            progress[charId].totalShifts += 1;

            // Simulate stat gains (in real implementation, this would come from activity outcomes)
            // Edge: improves with experience
            progress[charId].edge += Math.min(2, Math.floor(progress[charId].totalShifts / 3) + 1);
            // Discipline: consistent improvement
            progress[charId].discipline += 1;
          }
        });
      }
    });

    return progress;
  }, [villageState.activities, residentId]);

  const residents = useMemo(() => {
    if (residentId) {
      const resident = villageState.residents[residentId];
      return resident ? { [residentId]: resident } : {};
    }
    return villageState.residents;
  }, [villageState.residents, residentId]);

  const totalStats = useMemo(() => {
    return Object.entries(trainingProgress).reduce(
      (total, [id, stats]) => {
        if (residents[id]) {
          total.edge += stats.edge;
          total.discipline += stats.discipline;
          total.totalShifts += stats.totalShifts;
        }
        return total;
      },
      { edge: 0, discipline: 0, totalShifts: 0 }
    );
  }, [trainingProgress, residents]);

  if (totalStats.totalShifts === 0) {
    return null; // No training completed yet
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-600/30">
      {/* Edge stat badge */}
      {totalStats.edge > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-900/40 border border-purple-500/40">
          <span className="text-xs text-purple-300">⚔️</span>
          <span className="text-xs font-semibold text-purple-200">
            Edge +{totalStats.edge}
          </span>
        </div>
      )}

      {/* Discipline stat badge */}
      {totalStats.discipline > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-900/40 border border-blue-500/40">
          <span className="text-xs text-blue-300">🛡️</span>
          <span className="text-xs font-semibold text-blue-200">
            Discipline +{totalStats.discipline}
          </span>
        </div>
      )}

      {/* Total shifts badge */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-900/40 border border-amber-500/40">
        <span className="text-xs text-amber-300">🏋️</span>
        <span className="text-xs font-semibold text-amber-200">
          {totalStats.totalShifts} shifts
        </span>
      </div>
    </div>
  );
};

export default TrainingTracker;
