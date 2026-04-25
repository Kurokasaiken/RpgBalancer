/**
 * DemoConfig Context
 * 
 * Provides the current demo configuration to child components.
 * Used by the PresetManager to access current configuration state.
 */

import { createContext, useContext } from 'react';
import type { DemoConfig } from '../config/demoConfig';

export interface DemoConfigContextValue {
  config: DemoConfig;
  updateConfig: (updates: Partial<DemoConfig>) => void;
}

export const DemoConfigContext = createContext<DemoConfigContextValue | null>(null);

/**
 * Hook to access demo config context
 */
export function useDemoConfigContext(): DemoConfigContextValue {
  const context = useContext(DemoConfigContext);
  
  if (!context) {
    throw new Error('useDemoConfigContext must be used within a DemoConfigProvider');
  }
  
  return context;
}
