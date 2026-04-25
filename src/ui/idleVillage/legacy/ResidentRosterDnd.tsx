import React, { useMemo, useState } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { DraggableWorker } from '../components/DraggableWorker';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';

interface ResidentRosterProps {
  residents: ResidentState[];
  activeResidentId: string | null;
  onDragStart: (residentId: string) => (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onDragIntent?: (residentId: string) => void;
  onDragIntentEnd?: (residentId: string) => void;
  assignmentFeedback: string | null;
  maxFatigueBeforeExhausted: number;
  className?: string;
  listClassName?: string;
}

type RosterFilter = 'all' | 'heroes' | 'injured';

const formatLabel = (resident: ResidentState) => formatResidentLabel(resident);

function ResidentRosterContent({
  residents,
  activeResidentId: _activeResidentId,
  onDragStart: _onDragStart,
  onDragEnd: _onDragEnd,
  onDragIntent: _onDragIntent,
  onDragIntentEnd: _onDragIntentEnd,
  assignmentFeedback,
  maxFatigueBeforeExhausted,
  className,
  listClassName,
}: ResidentRosterProps) {
  const [filter, setFilter] = useState<RosterFilter>('all');

  const filteredResidents = useMemo(() => {
    switch (filter) {
      case 'heroes':
        return residents.filter((r) => r.isHero);
      case 'injured':
        return residents.filter((r) => r.isInjured);
      default:
        return residents;
    }
  }, [residents, filter]);

  const heroFlashIds = useMemo(() => residents.filter((r) => r.isHero).map((r) => r.id), [residents]);

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.35em] text-slate-400">Residenti</h3>
        <div className="flex gap-2">
          {(['all', 'heroes', 'injured'] as RosterFilter[]).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                filter === filterOption
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {filterOption === 'all' && 'Tutti'}
              {filterOption === 'heroes' && 'Eroi'}
              {filterOption === 'injured' && 'Feriti'}
            </button>
          ))}
        </div>
      </div>

      {assignmentFeedback && (
        <div className="mb-4 rounded-lg border border-emerald-600/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
          {assignmentFeedback}
        </div>
      )}

      <div className={`grid gap-4 ${listClassName}`}>
        {filteredResidents.map((resident) => {
          const portraitUrl = getResidentPortraitUrl(resident);
          return (
            <DraggableWorker
              key={resident.id}
              id={resident.id}
              label={formatLabel(resident)}
              subtitle={resident.status === 'exhausted' ? 'ESAUSTO' : undefined}
              hp={Math.round((resident.currentHp / resident.maxHp) * 100)}
              fatigue={Math.round((resident.fatigue / maxFatigueBeforeExhausted) * 100)}
              disabled={resident.status === 'exhausted'}
              className={heroFlashIds.includes(resident.id) ? 'ring-2 ring-amber-400/50' : ''}
              portraitUrl={portraitUrl}
            />
          );
        })}
      </div>
    </div>
  );
}

const ResidentRoster = (props: ResidentRosterProps) => {
  return <ResidentRosterContent {...props} />;
};

export default ResidentRoster;
