import { useState, useMemo } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import WorkerDragToken from './WorkerDragToken';

interface FilterOptions {
  status: 'all' | 'available' | 'away' | 'exhausted' | 'injured' | 'dead';
  minHp: number;
  maxFatigue: number;
}

interface DragTestContainerProps {
  residents: ResidentState[];
  onDragStart?: (residentId: string) => void;
  onDragEnd?: (residentId: string) => void;
  onDragStateChange?: (residentId: string, isDragging: boolean) => void;
  onCountsChange?: (counts: { filtered: number; total: number }) => void;
  onResidentSelect?: (residentId: string) => void;
}

const DragTestContainer = ({
  residents,
  onDragStart,
  onDragEnd,
  onDragStateChange,
  onCountsChange,
  onResidentSelect,
}: DragTestContainerProps) => {
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    minHp: 0,
    maxFatigue: 100,
  });

  const filteredResidents = useMemo(() => {
    return residents.filter((resident) => {
      if (filters.status !== 'all' && resident.status !== filters.status) return false;
      if (resident.currentHp < filters.minHp) return false;
      if (resident.fatigue > filters.maxFatigue) return false;
      return true;
    });
  }, [residents, filters]);

  const handleDragStart = (residentId: string) => {
    setDraggingResidentId(residentId);
    onDragStart?.(residentId);
  };

  const handleDragEnd = (residentId: string) => {
    setDraggingResidentId(null);
    onDragEnd?.(residentId);
  };

  const handleDragStateChange = (residentId: string, isDragging: boolean) => {
    setDraggingResidentId(isDragging ? residentId : null);
    onDragStateChange?.(residentId, isDragging);
  };

  /**
   * Returns a user-facing status label for the provided resident.
   */
  const describeStatus = (resident: ResidentState): string => {
    if (resident.isInjured) return 'Injured';
    switch (resident.status) {
      case 'available':
        return 'Available';
      case 'working':
        return 'Working';
      case 'away':
        return 'Away';
      case 'exhausted':
        return 'Exhausted';
      case 'injured':
        return 'Injured';
      case 'dead':
        return 'Fallen';
      default:
        return resident.status;
    }
  };

  /**
   * Determines if the resident can currently be assigned/dragged.
   */
  const isResidentInteractive = (resident: ResidentState): boolean =>
    !resident.isInjured && resident.status === 'available';

  return (
    <section className="relative overflow-hidden rounded-[26px] border border-[color:var(--panel-border)] bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),rgba(5,9,18,0.92))] p-4 shadow-[0_25px_45px_rgba(0,0,0,0.55)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          background: 'var(--card-surface-radial, radial-gradient(circle at 30% 0%, rgba(255,255,255,0.2), transparent 55%))',
        }}
      />
      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.45em] text-amber-200/70">
            <span>Roster</span>
            <span className="text-amber-100">{`${filteredResidents.length}/${residents.length}`}</span>
          </div>
          <label
            className="ml-auto flex items-center gap-1.5 rounded-full border border-white/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-slate-200 shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
            style={{
              background:
                'linear-gradient(135deg, rgba(12,16,24,0.78), rgba(5,8,14,0.85)), var(--panel-sheen, rgba(255,255,255,0.06))',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span>Status</span>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as FilterOptions['status'] }))}
              className="bg-transparent text-[9px] uppercase tracking-[0.15em] focus:outline-none"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="away">Away</option>
              <option value="exhausted">Exhausted</option>
              <option value="injured">Injured</option>
              <option value="dead">Fallen</option>
            </select>
          </label>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto scroll-smooth hover:scrollbar-thin scrollbar-thumb-amber-400/60 scrollbar-track-transparent">
          {filteredResidents.length === 0 ? (
            <div className="py-8 text-center text-sm italic text-slate-400">
              Nessun residente corrisponde ai filtri selezionati
            </div>
          ) : (
            filteredResidents.map((resident) => (
              <WorkerDragToken
                key={resident.id}
                workerId={resident.id}
                label={formatResidentLabel(resident)}
                subtitle=""
                hp={resident.currentHp}
                fatigue={resident.fatigue}
                maxHp={resident.maxHp}
                isDragging={draggingResidentId === resident.id}
                disabled={!isResidentInteractive(resident)}
                isInteractive={isResidentInteractive(resident)}
                statusLabel={describeStatus(resident)}
                horizontal={true}
                onDragStateChange={handleDragStateChange}
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/resident-id', resident.id);
                  event.dataTransfer.effectAllowed = 'move';
                  handleDragStart(resident.id);
                }}
                onDragEnd={() => handleDragEnd(resident.id)}
                onSelect={onResidentSelect}
              />
            ))
          )}
        </div>

      </div>
    </section>
  );
};

export default DragTestContainer;
