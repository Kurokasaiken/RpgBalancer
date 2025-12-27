import { useMemo } from 'react';
import type { ActivitySlotData } from '../VillageSandbox';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';

interface ActiveHUDProps {
  activeSlots: { slot: ActivitySlotData; state: ScheduledActivityState }[];
  secondsPerTimeUnit: number;
}

const ActiveHUD: React.FC<ActiveHUDProps> = ({ activeSlots, secondsPerTimeUnit }) => {

  if (activeSlots.length === 0) {
    return (
      <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-amber-300/30 p-3 max-w-sm">
        <h3 className="text-xs uppercase tracking-wide text-amber-200 mb-2">Active Activities</h3>
        <div className="text-xs text-slate-400">Nessuna attività in corso</div>
      </div>
    );
  }

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-amber-300/30 p-3 max-w-sm">
      <h3 className="text-xs uppercase tracking-wide text-amber-200 mb-2">Active Activities</h3>
      <div className="space-y-2">
        {activeSlots.map(({ slot, state }) => {
          const progress = Math.min(1, Math.max(0, state.progress));
          const remainingSeconds = Math.max(0, state.duration - state.elapsed);
          const timeUnitsRemaining = Math.floor(remainingSeconds / secondsPerTimeUnit);
          const secondsRemainder = Math.floor(remainingSeconds % secondsPerTimeUnit)
            .toString()
            .padStart(2, '0');

          return (
            <div key={`${slot.slotId}-${state.residentId}`} className="flex items-center gap-2">
              <span className="text-lg">{slot.iconName}</span>
              <div className="flex-1">
                <div className="text-xs text-slate-300">{slot.label}</div>
                <div className="w-full bg-slate-700/70 rounded-full h-1 mt-1">
                  <div className="bg-amber-400 h-1 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {timeUnitsRemaining}:{secondsRemainder} left · {state.residentId}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveHUD;
