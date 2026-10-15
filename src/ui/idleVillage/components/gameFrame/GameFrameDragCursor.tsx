import { useEffect } from 'react';
import { useDndMonitor } from '@dnd-kit/core';

export const GAME_DRAG_ATTRIBUTE = 'data-game-drag';

/** Flags the document while a dnd-kit drag is in progress; gameFrameCursors.css turns the flag into the grip cursors. */
export const setGameDragActive = (active: boolean): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (active) root.setAttribute(GAME_DRAG_ATTRIBUTE, '');
  else root.removeAttribute(GAME_DRAG_ATTRIBUTE);
};

/** Renders nothing. Mount once inside the /game DndContext so drag-start, drop and cancel all clear the flag. */
export const GameFrameDragCursor: React.FC = () => {
  useDndMonitor({
    onDragStart: () => setGameDragActive(true),
    onDragEnd: () => setGameDragActive(false),
    onDragCancel: () => setGameDragActive(false),
  });
  useEffect(() => () => setGameDragActive(false), []);
  return null;
};
