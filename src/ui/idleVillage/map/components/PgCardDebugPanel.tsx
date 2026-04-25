import { useCallback } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useDragContext } from '@/ui/idleVillage/components/DragContextStore';
import PgCard from '@/ui/idleVillage/components/PgCard';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';

interface PgCardDebugPanelProps {
  resident: ResidentState;
}

export function PgCardDebugPanel({ resident }: PgCardDebugPanelProps) {
  const { activeId, setActiveId } = useDragContext();
  const dragState = activeId === resident.id ? 'dragging' : 'idle';

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.dataTransfer.setData(RESIDENT_DRAG_MIME, resident.id);
      event.dataTransfer.setData('text/plain', resident.id);
      event.dataTransfer.effectAllowed = 'copy';
      setActiveId(resident.id);
    },
    [resident.id, setActiveId],
  );

  const handleDragEnd = useCallback(() => {
    setActiveId(null);
  }, [setActiveId]);

  return (
    <section
      className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[0_12px_35px_rgba(0,0,0,0.45)] backdrop-blur-sm space-y-3"
      data-testid="pg-card-debug-panel"
      data-drag-state={dragState}
    >
      <header className="text-[11px] uppercase tracking-[0.4em] text-slate-400">
        Debug · PG Drag Test (Worker Token)
      </header>
      <p className="text-sm text-slate-300">
        Questo pannello usa lo stesso <code>WorkerDragToken</code> del roster per verificare che il PG sia draggable con preview circolare.
      </p>
      <div className="flex justify-center">
        <PgCard
          workerId={resident.id}
          label={formatResidentLabel(resident)}
          hp={resident.currentHp}
          fatigue={resident.fatigue}
          maxHp={resident.maxHp}
          portraitUrl={getResidentPortraitUrl(resident)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          horizontal={false}
        />
      </div>
      <p className="text-xs text-slate-400">
        Suggerimento: tieni premuto e trascina per vedere il badge diventare semi-trasparente e il token apparire sotto
        il cursore. Rilascia per far sparire il token e tornare allo stato idle.
      </p>
    </section>
  );
}
