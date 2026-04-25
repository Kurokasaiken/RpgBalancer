import { createContext, useContext } from 'react';

/**
 * Represents the relative cursor offset captured when a resident drag starts.
 */
export interface DragCursorOffset {
  /** Horizontal distance (px) between the pointer and the card's left edge */
  x: number;
  /** Vertical distance (px) between the pointer and the card's top edge */
  y: number;
  /** Width of the draggable card when the pointer down occurred */
  width?: number;
  /** Height of the draggable card when the pointer down occurred */
  height?: number;
}

export interface DragPreviewCenter {
  /** Absolute clientX coordinate for the center of the drag overlay */
  x: number;
  /** Absolute clientY coordinate for the center of the drag overlay */
  y: number;
}

export interface DragContextState {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  dragCursorOffset: DragCursorOffset | null;
  setDragCursorOffset: (offset: DragCursorOffset | null) => void;
  dragPreviewCenter: DragPreviewCenter | null;
  setDragPreviewCenter: (center: DragPreviewCenter | null) => void;
  dragHomeCenter: DragPreviewCenter | null;
  setDragHomeCenter: (center: DragPreviewCenter | null) => void;
  magnetTargetCenter: DragPreviewCenter | null;
  setMagnetTargetCenter: (center: DragPreviewCenter | null) => void;
}

export const DragContext = createContext<DragContextState | undefined>(undefined);

export function useDragContext(): DragContextState {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDragContext must be used within DragProvider');
  }
  return context;
}
