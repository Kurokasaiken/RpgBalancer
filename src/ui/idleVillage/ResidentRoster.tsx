import React, { useMemo } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

interface ResidentRosterProps {
  residents: ResidentState[];
  activeResidentId: string | null;
  onDragStart: (residentId: string) => (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  assignmentFeedback: string | null;
  maxFatigueBeforeExhausted: number;
}

function formatLabel(resident: ResidentState) {
  if (resident.id.startsWith('founder-')) {
    return resident.id.replace('founder-', '');
  }
  return resident.id;
}

function ResidentRoster({
  residents,
  activeResidentId,
  onDragStart,
  onDragEnd,
  assignmentFeedback,
  maxFatigueBeforeExhausted,
}: ResidentRosterProps) {
  const sortedResidents = useMemo(() => {
    return [...residents].sort((a, b) => a.fatigue - b.fatigue || a.id.localeCompare(b.id));
  }, [residents]);

  const fatiguePercentage = (fatigue: number) =>
    Math.min(100, Math.round((fatigue / Math.max(1, maxFatigueBeforeExhausted)) * 100));

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-black/85 border border-gold/40 shadow-md px-4 py-3 text-[11px] min-w-60 max-w-md">
      <div className="flex items-baseline justify-between">
        <span className="uppercase tracking-[0.25em] text-slate-300 text-[10px]">Residenti</span>
        <span className="text-[11px] text-slate-400">{residents.length || '—'} pronti</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sortedResidents.length === 0 && (
          <div className="text-slate-500 text-[10px] italic">Nessun residente disponibile</div>
        )}
        {sortedResidents.map((resident) => {
          const dragState = activeResidentId === resident.id;
          const fatiguePercent = fatiguePercentage(resident.fatigue);
          const fatigueTone =
            fatiguePercent >= 85
              ? 'bg-rose-500/60'
              : fatiguePercent >= 60
              ? 'bg-amber-400/60'
              : 'bg-emerald-400/60';
          const initial =
            resident.statTags?.[0]?.slice(0, 2).toUpperCase() ??
            resident.id
              .split('-')
              .pop()
              ?.slice(0, 2)
              .toUpperCase() ??
            'R';

          return (
            <button
              key={resident.id}
              type="button"
              draggable
              onDragStart={onDragStart(resident.id)}
              onDragEnd={onDragEnd}
              className={`group flex flex-col items-center gap-1 px-2 py-1 rounded-xl border transition-all min-w-[72px] ${
                dragState
                  ? 'border-amber-300 text-amber-100 bg-amber-500/15 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                  : 'border-slate-700 text-slate-100 bg-slate-900/70 hover:border-amber-300/70 hover:text-amber-50'
              }`}
            >
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-[12px] font-semibold tracking-wide border ${
                  dragState ? 'border-amber-200 bg-amber-200/20' : 'border-slate-600 bg-slate-950/80'
                }`}
              >
                {initial}
              </div>
              <span className="text-[10px] font-semibold truncate max-w-[64px]">{formatLabel(resident)}</span>
              <div className="w-full h-1.5 rounded-full bg-slate-700/70 overflow-hidden">
                <div
                  className={`h-full ${fatigueTone} transition-all`}
                  style={{ width: `${fatiguePercent}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400">
                Fat {resident.fatigue}
                <span className="text-slate-500">/{maxFatigueBeforeExhausted}</span>
              </span>
            </button>
          );
        })}
      </div>
      {assignmentFeedback && (
        <div className="text-[10px] text-amber-200 bg-amber-500/10 border border-amber-200/30 rounded-lg px-2 py-1">
          {assignmentFeedback}
        </div>
      )}
    </div>
  );
}

export default ResidentRoster;
