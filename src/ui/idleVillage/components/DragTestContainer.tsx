import { useState, useMemo } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import WorkerDragToken from './WorkerDragToken';

interface FilterOptions {
  status: 'all' | 'available' | 'away' | 'exhausted' | 'injured' | 'dead';
  hasTags: boolean;
  minHp: number;
  maxFatigue: number;
}

interface DragTestContainerProps {
  residents: ResidentState[];
  onDragStart?: (residentId: string) => void;
  onDragEnd?: (residentId: string) => void;
  onDragStateChange?: (residentId: string, isDragging: boolean) => void;
}

const DragTestContainer = ({ 
  residents, 
  onDragStart, 
  onDragEnd, 
  onDragStateChange 
}: DragTestContainerProps) => {
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    hasTags: false,
    minHp: 0,
    maxFatigue: 100,
  });

  const filteredResidents = useMemo(() => {
    return residents.filter(resident => {
      if (filters.status !== 'all' && resident.status !== filters.status) return false;
      if (filters.hasTags && (!resident.statTags || resident.statTags.length === 0)) return false;
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

  return (
    <div className="space-y-3 rounded-lg border border-slate-700/50 bg-slate-900/20 backdrop-blur-sm p-3 shadow-lg max-w-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs uppercase tracking-[0.35em] text-slate-400 whitespace-nowrap">
          Residenti ({filteredResidents.length}/{residents.length})
        </h3>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-900 text-slate-300"
          >
            <option value="all">Tutti</option>
            <option value="available">Disponibili</option>
            <option value="away">Assenti</option>
            <option value="exhausted">Esausti</option>
            <option value="injured">Feriti</option>
            <option value="dead">Morti</option>
          </select>
          
          <label className="flex items-center gap-1 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={filters.hasTags}
              onChange={(e) => setFilters(prev => ({ ...prev, hasTags: e.target.checked }))}
              className="rounded"
            />
            Con tag
          </label>
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto scroll-smooth hover:scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {filteredResidents.length === 0 ? (
          <div className="text-slate-500 text-sm italic text-center py-8">
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
              disabled={resident.status === 'exhausted' || resident.isInjured}
              horizontal={true}
              onDragStateChange={handleDragStateChange}
              onDragStart={(event) => {
                event.dataTransfer.setData('text/resident-id', resident.id);
                event.dataTransfer.effectAllowed = 'move';
                handleDragStart(resident.id);
              }}
              onDragEnd={() => handleDragEnd(resident.id)}
            />
          ))
        )}
      </div>
      
      {draggingResidentId && (
        <div className="text-xs text-amber-400 bg-amber-950/30 px-3 py-2 rounded border border-amber-800/50">
          Trascinando: {formatResidentLabel(residents.find(r => r.id === draggingResidentId)!)}
        </div>
      )}
    </div>
  );
};

export default DragTestContainer;
