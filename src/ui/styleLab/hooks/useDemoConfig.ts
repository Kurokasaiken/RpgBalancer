/**
 * useDemoConfig Hook
 * 
 * Provides access to the current demo configuration for preset management.
 * This hook extracts the current state from the StyleLabDemo component.
 */

import { useContext } from 'react';
import { DemoConfigContext } from '../contexts/DemoConfigContext';
import type { DemoConfig } from '../config/demoConfig';

/**
 * Hook to access current demo configuration
 */
export function useDemoConfig(): {
  config: DemoConfig;
  updateConfig: (updates: Partial<DemoConfig>) => void;
} {
  const context = useContext(DemoConfigContext);
  
  if (!context) {
    throw new Error('useDemoConfig must be used within a DemoConfigProvider');
  }
  
  return context;
}
