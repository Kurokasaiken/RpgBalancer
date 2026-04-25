import React, { useMemo, useCallback } from 'react';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * Props for the Rest Overlay component.
 */
export interface RestOverlayProps {
  /** Current village state */
  villageState: VillageState;
  /** Idle Village config */
  config: IdleVillageConfig;
  /** Whether the overlay is currently visible */
  isVisible: boolean;
  /** Whether the rest period is active (clock paused) */
  isResting: boolean;
  /** Callback to toggle rest mode */
  onToggleRest: () => void;
  /** Callback to close the overlay */
  onClose: () => void;
}

/**
 * Rest Overlay component for Punch Club realistic rest periods.
 *
 * Shows fatigue recovery visualization during night phases,
 * with resource consumption and recovery tracking.
 * Config-first design using globalRules.fatigueRecoveryPerDay.
 */
const RestOverlay: React.FC<RestOverlayProps> = ({
  villageState,
  config,
  isVisible,
  isResting,
  onToggleRest,
  onClose,
}) => {
  // Calculate fatigue recovery per day from config
  const fatigueRecoveryPerDay = config.globalRules.fatigueRecoveryPerDay ?? 45;

  // Calculate total recovery possible
  const totalRecoveryPossible = useMemo(() => {
    let total = 0;
    Object.values(villageState.residents).forEach(resident => {
      if (resident.status === 'available') {
        const recoverable = Math.max(0, resident.fatigue);
        total += recoverable;
      }
    });
    return Math.min(total, fatigueRecoveryPerDay * Object.keys(villageState.residents).length);
  }, [villageState.residents, fatigueRecoveryPerDay]);

  // Current total fatigue
  const currentTotalFatigue = useMemo(() => {
    return Object.values(villageState.residents).reduce(
      (sum, resident) => sum + (resident.fatigue ?? 0),
      0
    );
  }, [villageState.residents]);

  // Residents by fatigue level
  const residentsByFatigue = useMemo(() => {
    const available = Object.values(villageState.residents).filter(r => r.status === 'available');
    const exhausted = available.filter(r => r.fatigue >= config.globalRules.maxFatigueBeforeExhausted);
    const tired = available.filter(r =>
      r.fatigue > 0 && r.fatigue < config.globalRules.maxFatigueBeforeExhausted
    );
    const fresh = available.filter(r => r.fatigue <= 0);

    return { exhausted, tired, fresh };
  }, [villageState.residents, config.globalRules.maxFatigueBeforeExhausted]);

  const handleToggleRest = useCallback(() => {
    onToggleRest();
  }, [onToggleRest]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-md w-full mx-4">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Close rest overlay"
        >
          ✕
        </button>

        {/* Main card */}
        <div className="rounded-3xl border border-blue-300/30 bg-black/90 p-6 text-ivory shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🌙</div>
            <h2 className="text-xl font-bold text-blue-200 mb-1">Rest Period</h2>
            <p className="text-sm text-slate-400">
              {isResting ? 'Night phase active - recovering fatigue' : 'Ready for rest period'}
            </p>
          </div>

          {/* Fatigue overview */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Total Fatigue:</span>
              <span className="font-semibold text-amber-300">{currentTotalFatigue}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Recovery Rate:</span>
              <span className="font-semibold text-green-300">+{fatigueRecoveryPerDay}/day</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Available Recovery:</span>
              <span className="font-semibold text-blue-300">{totalRecoveryPossible}</span>
            </div>
          </div>

          {/* Resident breakdown */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Resident Status
            </h3>

            {residentsByFatigue.exhausted.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-900/20 border border-red-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-red-400">😵</span>
                  <span className="text-sm text-red-300">Exhausted</span>
                </div>
                <span className="text-sm font-semibold text-red-300">
                  {residentsByFatigue.exhausted.length}
                </span>
              </div>
            )}

            {residentsByFatigue.tired.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">😴</span>
                  <span className="text-sm text-yellow-300">Tired</span>
                </div>
                <span className="text-sm font-semibold text-yellow-300">
                  {residentsByFatigue.tired.length}
                </span>
              </div>
            )}

            {residentsByFatigue.fresh.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-900/20 border border-green-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">⚡</span>
                  <span className="text-sm text-green-300">Fresh</span>
                </div>
                <span className="text-sm font-semibold text-green-300">
                  {residentsByFatigue.fresh.length}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleToggleRest}
              className={`
                flex-1 py-3 px-4 rounded-2xl font-semibold text-sm uppercase tracking-wide transition-all duration-200
                ${isResting
                  ? 'bg-blue-600 hover:bg-blue-500 text-blue-50 shadow-lg shadow-blue-500/25'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }
              `}
            >
              {isResting ? 'End Rest' : 'Start Rest'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm uppercase tracking-wide transition-colors"
            >
              Close
            </button>
          </div>

          {/* Footer info */}
          <div className="mt-4 text-xs text-slate-500 text-center">
            Rest recovers {fatigueRecoveryPerDay} fatigue per resident per day
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestOverlay;
