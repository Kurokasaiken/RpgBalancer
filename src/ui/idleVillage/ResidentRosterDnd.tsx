import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { DraggableWorker } from './components/DraggableWorker';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { useDragContext } from './components/DragContext';

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

function getResidentPortrait(resident: ResidentState): string | undefined {
  const directPortrait = (resident as ResidentState & { portraitUrl?: string }).portraitUrl;
  if (typeof directPortrait === 'string' && directPortrait.length > 0) {
    return directPortrait;
  }
  if (resident.statSnapshot && typeof resident.statSnapshot === 'object') {
    const snapshotPortrait = (resident.statSnapshot as Record<string, unknown>).portraitUrl;
    if (typeof snapshotPortrait === 'string' && snapshotPortrait.length > 0) {
      return snapshotPortrait;
    }
  }
  return undefined;
}

const formatLabel = (resident: ResidentState) => formatResidentLabel(resident);

function ResidentRosterContent({
  residents,
  activeResidentId,
  onDragStart,
  onDragEnd,
  onDragIntent,
  onDragIntentEnd,
  assignmentFeedback,
  maxFatigueBeforeExhausted,
  className,
  listClassName,
}: ResidentRosterProps) {
  const { setActiveId } = useDragContext();
  const [filter, setFilter] = useState<RosterFilter>('all');
  const [heroFlashIds, setHeroFlashIds] = useState<string[]>([]);

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

  useEffect(() => {
    const heroIds = residents.filter((r) => r.isHero).map((r) => r.id);
    setHeroFlashIds(heroIds);
  }, [residents]);

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
        {filteredResidents.map((resident) => (
          <DraggableWorker
            key={resident.id}
            id={resident.id}
            label={formatLabel(resident)}
            subtitle={resident.status === 'exhausted' ? 'ESAUSTO' : undefined}
            hp={Math.round((resident.currentHp / resident.maxHp) * 100)}
            fatigue={Math.round((resident.fatigue / maxFatigueBeforeExhausted) * 100)}
            disabled={resident.status === 'exhausted'}
            className={heroFlashIds.includes(resident.id) ? 'ring-2 ring-amber-400/50' : ''}
          />
        ))}
      </div>
    </div>
  );
}

const ResidentRoster = (props: ResidentRosterProps) => {
  return <ResidentRosterContent {...props} />;
};

export default ResidentRoster;
