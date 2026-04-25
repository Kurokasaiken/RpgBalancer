import React from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { useDragContext } from './DragContext';

interface DragOverlayContentProps {
  label: string;
}

export function DragOverlayContent({ label }: DragOverlayContentProps) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/80 bg-slate-900 text-base font-semibold uppercase tracking-[0.2em] text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.55)]">
      {label.charAt(0) || '?'}
    </div>
  );
}

export function CustomDragOverlay() {
  const { activeId } = useDragContext();

  return (
    <DragOverlay>
      {activeId ? (
        <DragOverlayContent label={activeId} />
      ) : null}
    </DragOverlay>
  );
}
