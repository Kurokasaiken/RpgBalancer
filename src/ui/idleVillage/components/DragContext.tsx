import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { DragContext, useDragContext, type DragCursorOffset, type DragPreviewCenter } from './DragContextStore';

export function DragProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [dragCursorOffset, setDragCursorOffset] = useState<DragCursorOffset | null>(null);
  const [dragPreviewCenter, setDragPreviewCenter] = useState<DragPreviewCenter | null>(null);
  const [dragHomeCenter, setDragHomeCenter] = useState<DragPreviewCenter | null>(null);
  const [magnetTargetCenter, setMagnetTargetCenter] = useState<DragPreviewCenter | null>(null);

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id);
    if (id === null) {
      setDragCursorOffset(null);
      setDragPreviewCenter(null);
      setDragHomeCenter(null);
      setMagnetTargetCenter(null);
    }
  }, []);
  
  return (
    <DragContext.Provider value={{ activeId, setActiveId, dragCursorOffset, setDragCursorOffset, dragPreviewCenter, setDragPreviewCenter, dragHomeCenter, setDragHomeCenter, magnetTargetCenter, setMagnetTargetCenter }}>
      {children}
    </DragContext.Provider>
  );
}

// Re-export useDragContext for convenience
export { useDragContext };
