/**
 * Service Worker Version Manager Hook
 * 
 * React hook for using SW Version Manager in components
 */

import { useState, useEffect } from 'react';
import { getSWVersionManager, isServiceWorkerRuntimeEnabled, type SWUpdateStatus, type SWPerformanceMetrics } from '../SWVersionManager';

/**
 * Hook for using SW Version Manager in React components
 */
export function useSWVersionManager() {
  const [manager] = useState(() => getSWVersionManager());
  const [updateStatus, setUpdateStatus] = useState<SWUpdateStatus | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<SWPerformanceMetrics | null>(null);

  useEffect(() => {
    if (!isServiceWorkerRuntimeEnabled()) {
      return undefined;
    }

    // Initialize manager
    manager.initialize().catch(error => {
      console.error('Failed to initialize SW Version Manager:', error);
    });

    // Listen for update events
    const handleUpdateAvailable = (event: CustomEvent) => {
      setUpdateStatus(prev => ({
        ...prev,
        updateAvailable: true,
        availableVersion: event.detail.availableVersion,
      }));
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable as EventListener);

    // Update status periodically
    const statusInterval = setInterval(async () => {
      const status = await manager.getUpdateStatus();
      setUpdateStatus(status);
      
      const metrics = manager.getPerformanceMetrics();
      setPerformanceMetrics(metrics);
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable as EventListener);
      clearInterval(statusInterval);
    };
  }, [manager]);

  return {
    manager,
    updateStatus,
    performanceMetrics,
    forceUpdate: () => manager.forceUpdate(),
    checkForUpdates: () => manager.checkForUpdates(),
    cleanupOldCaches: () => manager.cleanupOldCaches(),
    getCacheInfo: () => manager.getCacheInfo(),
  };
}
