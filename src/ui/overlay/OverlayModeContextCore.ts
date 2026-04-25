import { createContext } from 'react';
import type { OverlayState, OverlayActions } from './OverlayModeContext';

/**
 * Overlay mode context instance
 */
export const OverlayModeContext = createContext<{
  state: OverlayState;
  actions: OverlayActions;
} | null>(null);
