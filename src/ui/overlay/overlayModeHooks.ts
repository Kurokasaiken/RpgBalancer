import { useContext } from 'react';
import { OverlayModeContext } from './OverlayModeContextCore';
import type { OverlayState, OverlayActions } from './OverlayModeContext';

/**
 * Hook for accessing overlay mode context
 */
export function useOverlayMode(): { state: OverlayState; actions: OverlayActions } {
  const context = useContext(OverlayModeContext);
  if (!context) {
    throw new Error('useOverlayMode must be used within OverlayModeProvider');
  }
  return context;
}
