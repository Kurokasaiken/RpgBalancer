import { useState, useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  const [isRosterCollapsed, setIsRosterCollapsed] = useState(false);

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

  const formatThreshold = (label: string, value: number, unit: '%' | '') => (
    <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.25em] text-slate-300">
      <span>{label}</span>
      <input
        type="number"
        min={0}
        max={unit === '%' ? 100 : undefined}
        value={value}
        onChange={(e) =>
          setFilters((prev) => {
            const next = Number(e.target.value);
            return {
              ...prev,
              [label === 'HP min' ? 'minHp' : 'maxFatigue']: Number.isNaN(next) ? prev[label === 'HP min' ? 'minHp' : 'maxFatigue'] : next,
            };
          })
        }
        className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-mono tracking-[0.15em] text-amber-100 focus:border-amber-300 focus:outline-none"
        aria-label={`${label} threshold`}
      />
    </label>
  );

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
          <div className="ml-auto flex items-center gap-2">
            <label
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-slate-200 shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(12,16,24,0.78), rgba(5,8,14,0.85)), var(--panel-sheen, rgba(255,255,255,0.06))',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span className="text-[8px] tracking-[0.2em]">Stat</span>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as FilterOptions['status'] }))}
                className="bg-transparent text-[9px] uppercase tracking-[0.15em] focus:outline-none"
                aria-label="Filtra residenti per status"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="away">Away</option>
                <option value="exhausted">Exhausted</option>
                <option value="injured">Injured</option>
                <option value="dead">Fallen</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => setIsRosterCollapsed((prev) => !prev)}
              className="rounded-full border border-white/15 bg-white/5 p-1.5 text-slate-200 transition hover:border-amber-300/70 hover:text-amber-200"
              aria-label={isRosterCollapsed ? 'Mostra roster' : 'Nascondi roster'}
              aria-pressed={isRosterCollapsed}
            >
              {isRosterCollapsed ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {!isRosterCollapsed && (
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
        )}

      </div>
    </section>
  );
};

export default DragTestContainer;
