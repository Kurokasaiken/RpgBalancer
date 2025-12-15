// src/ui/overlay/OverlayModeContext.tsx
// Context for managing overlay mode state and configuration

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { OverlaySettings, OverlayWidget } from '@/balancing/config/idleVillage/types';

export interface OverlayState {
  /** Whether overlay mode is currently active */
  isActive: boolean;
  
  /** Current overlay position */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /** Current overlay size */
  size: 'compact' | 'medium' | 'wide';
  
  /** Current zoom level */
  zoom: number;
  
  /** Whether overlay is always-on-top */
  alwaysOnTop: boolean;
  
  /** Whether overlay has transparency */
  transparency: boolean;
  
  /** Enabled widgets and their order */
  widgets: OverlayWidget[];
  
  /** Auto-hide timeout (0 = disabled) */
  autoHideTimeoutSeconds: number;
  
  /** Whether system tray icon is shown */
  showSystemTrayIcon: boolean;
}

export interface OverlayActions {
  /** Toggle overlay mode on/off */
  toggleOverlay: () => void;
  
  /** Show overlay */
  showOverlay: () => void;
  
  /** Hide overlay */
  hideOverlay: () => void;
  
  /** Update overlay position */
  setPosition: (position: OverlayState['position']) => void;
  
  /** Update overlay size */
  setSize: (size: OverlayState['size']) => void;
  
  /** Update zoom level */
  setZoom: (zoom: number) => void;
  
  /** Toggle always-on-top */
  toggleAlwaysOnTop: () => void;
  
  /** Toggle transparency */
  toggleTransparency: () => void;
  
  /** Update widgets */
  setWidgets: (widgets: OverlayWidget[]) => void;
  
  /** Update auto-hide timeout */
  setAutoHideTimeout: (seconds: number) => void;
  
  /** Toggle system tray icon */
  toggleSystemTrayIcon: () => void;
  
  /** Reset to default settings */
  resetToDefaults: () => void;
}

const OverlayModeContext = createContext<{
  state: OverlayState;
  actions: OverlayActions;
} | null>(null);

interface OverlayModeProviderProps {
  children: ReactNode;
  initialSettings?: OverlaySettings;
}

export function OverlayModeProvider({ children, initialSettings }: OverlayModeProviderProps) {
  const defaultState = useMemo<OverlayState>(() => ({
    isActive: false,
    position: initialSettings?.defaultPosition ?? 'top-right',
    size: initialSettings?.defaultSize ?? 'medium',
    zoom: initialSettings?.defaultZoom ?? 1.0,
    alwaysOnTop: initialSettings?.alwaysOnTop ?? true,
    transparency: initialSettings?.transparency ?? false,
    widgets: initialSettings?.enabledWidgets ?? [],
    autoHideTimeoutSeconds: initialSettings?.autoHideTimeoutSeconds ?? 0,
    showSystemTrayIcon: initialSettings?.showSystemTrayIcon ?? true,
  }), [initialSettings]);

  const [state, setState] = useState<OverlayState>(defaultState);

  const actions: OverlayActions = {
    toggleOverlay: useCallback(() => {
      setState(prev => ({ ...prev, isActive: !prev.isActive }));
    }, []),

    showOverlay: useCallback(() => {
      setState(prev => ({ ...prev, isActive: true }));
    }, []),

    hideOverlay: useCallback(() => {
      setState(prev => ({ ...prev, isActive: false }));
    }, []),

    setPosition: useCallback((position) => {
      setState(prev => ({ ...prev, position }));
    }, []),

    setSize: useCallback((size) => {
      setState(prev => ({ ...prev, size }));
    }, []),

    setZoom: useCallback((zoom) => {
      setState(prev => ({ ...prev, zoom: Math.max(0.5, Math.min(2.0, zoom)) }));
    }, []),

    toggleAlwaysOnTop: useCallback(() => {
      setState(prev => ({ ...prev, alwaysOnTop: !prev.alwaysOnTop }));
    }, []),

    toggleTransparency: useCallback(() => {
      setState(prev => ({ ...prev, transparency: !prev.transparency }));
    }, []),

    setWidgets: useCallback((widgets) => {
      setState(prev => ({ ...prev, widgets }));
    }, []),

    setAutoHideTimeout: useCallback((seconds) => {
      setState(prev => ({ ...prev, autoHideTimeoutSeconds: Math.max(0, seconds) }));
    }, []),

    toggleSystemTrayIcon: useCallback(() => {
      setState(prev => ({ ...prev, showSystemTrayIcon: !prev.showSystemTrayIcon }));
    }, []),

    resetToDefaults: useCallback(() => {
      setState(defaultState);
    }, [defaultState]),
  };

  return (
    <OverlayModeContext.Provider value={{ state, actions }}>
      {children}
    </OverlayModeContext.Provider>
  );
}

export function useOverlayMode(): { state: OverlayState; actions: OverlayActions } {
  const context = useContext(OverlayModeContext);
  if (!context) {
    throw new Error('useOverlayMode must be used within an OverlayModeProvider');
  }
  return context;
}
