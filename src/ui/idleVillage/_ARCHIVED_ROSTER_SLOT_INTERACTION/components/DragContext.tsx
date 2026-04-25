import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { DragContext, type DragCursorOffset, type DragPreviewCenter } from './DragContextStore';

export function DragProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [dragCursorOffset, setDragCursorOffset] = useState<DragCursorOffset | null>(null);
  const [dragPreviewCenter, setDragPreviewCenter] = useState<DragPreviewCenter | null>(null);

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id);
    if (id === null) {
      setDragCursorOffset(null);
      setDragPreviewCenter(null);
    }
  }, []);
  
  return (
    <DragContext.Provider value={{ activeId, setActiveId, dragCursorOffset, setDragCursorOffset, dragPreviewCenter, setDragPreviewCenter }}>
      {children}
    </DragContext.Provider>
  );
}
