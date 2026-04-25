import { useState } from 'react';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';

/**
 * Simple droppable surface used to debug resident drag payloads.
 */
export function ResidentDropDebugPanel() {
  const [isOver, setIsOver] = useState(false);
  const [lastDropId, setLastDropId] = useState<string | null>(null);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const residentId =
      event.dataTransfer.getData(RESIDENT_DRAG_MIME) || event.dataTransfer.getData('text/plain') || null;
    setLastDropId(residentId);
    setIsOver(false);
  };

  return (
    <section
      className="rounded-2xl border border-dashed border-amber-300/40 bg-black/40 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm"
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="resident-drop-debug-panel"
      data-drop-state={isOver ? 'over' : 'idle'}
    >
      <header className="text-[11px] uppercase tracking-[0.35em] text-amber-200/70">
        Drop target · Sandbox replica
      </header>
      <p className="mt-2 text-sm text-slate-200">
        Trascina un residente (dal roster o dal PG) per verificare il payload. Il box si illumina quando un token è
        sopra di esso e mostra l&apos;ultimo ID rilasciato.
      </p>
      <div
        className={[
          'mt-4 flex h-32 items-center justify-center rounded-2xl border-2 border-dashed text-sm font-semibold tracking-[0.3em]',
          isOver
            ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-200 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
            : 'border-slate-600/70 text-slate-400',
        ].join(' ')}
      >
        {isOver ? 'RILASCIA QUI' : 'TRASCINA QUI'}
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-[0.3em] text-slate-400">
        Ultimo drop:{' '}
        <span className="text-amber-200" data-testid="resident-drop-debug-value">
          {lastDropId ?? '—'}
        </span>
      </div>
    </section>
  );
}
