/**
 * NP-147 – Resident Stress Hook
 * 
 * React hook for integrating with the ResidentStressService.
 * Provides real-time stress monitoring, notifications, and UI state management
 * for resident stress levels in Phase E scenarios.
 * 
 * @since 2026-01-14
 * @author Cascade
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import type { 
  ResidentStressData, 
  ResidentStressLevel, 
  StressEventType,
  ResidentStressService 
} from '@/balancing/idleVillage/ResidentStressService';
import { getResidentStressService } from '@/balancing/idleVillage/ResidentStressService';
import type { DropValidationResult } from '../config/residentDropRules';

// === Hook Interface ===

/**
 * Parameters for the useResidentStress hook
 */
export interface UseResidentStressParams {
  /** Configuration override for stress service */
  config?: {
    thresholds?: {
      moderate?: number;
      high?: number;
      critical?: number;
    };
    notifications?: {
      enabled?: boolean;
      minLevel?: ResidentStressLevel;
      cooldownMs?: number;
    };
  };
  /** Enable automatic stress recovery processing */
  enableRecovery?: boolean;
  /** Recovery processing interval in milliseconds */
  recoveryInterval?: number;
  /** Custom notification handler */
  onNotification?: (notification: ResidentStressNotification) => void;
}

/**
 * Return value for the useResidentStress hook
 */
export interface UseResidentStressReturn {
  /** Current stress data for all residents */
  residentStress: Map<string, ResidentStressData>;
  /** Residents with stress levels at or above threshold */
  stressedResidents: Array<{
    residentId: string;
    stressData: ResidentStressData;
  }>;
  /** Overall stress statistics */
  statistics: {
    totalResidents: number;
    stressedResidents: number;
    criticalResidents: number;
    averageStress: number;
    stressLevelDistribution: Record<ResidentStressLevel, number>;
  };
  /** Processing state */
  isLoading: boolean;
  error: string | null;
  /** Actions */
  processDropRejection: (residentId: string, activityId: string | undefined, validation: DropValidationResult | undefined) => Promise<void>;
  processFatigueThreshold: (residentId: string, activityId: string | undefined, fatigue: number) => Promise<void>;
  processMultipleRejections: (residentId: string, activityId: string | undefined, count: number) => Promise<void>;
  processRecovery: (residentId: string, activityId: string | undefined) => Promise<void>;
  resetResidentStress: (residentId: string) => Promise<void>;
  resetAllStress: () => Promise<void>;
  refreshData: () => Promise<void>;
}

/**
 * Stress notification payload
 */
export interface ResidentStressNotification {
  residentId: string;
  stressLevel: ResidentStressLevel;
  currentStress: number;
  recentEvents: Array<{
    id: string;
    eventType: StressEventType;
    timestamp: number;
    stressBefore: number;
    stressAfter: number;
  }>;
  timestamp: number;
}

// === Hook Implementation ===

/**
 * React hook for resident stress monitoring and notifications
 */
export function useResidentStress(params: UseResidentStressParams = {}): UseResidentStressReturn {
  const {
    config,
    enableRecovery = true,
    recoveryInterval = 30000, // 30 seconds
    onNotification,
  } = params;

  // State management
  const [residentStress, setResidentStress] = useState<Map<string, ResidentStressData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for service and intervals
  const serviceRef = useRef<ResidentStressService | null>(null);
  const recoveryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh stress data from service
  const refreshStressData = useCallback(async () => {
    if (!serviceRef.current) return;

    try {
      // Get all resident stress data
      const allResidents = Array.from(serviceRef.current.getStressedResidents('low'));
      const stressMap = new Map<string, ResidentStressData>();
      
      allResidents.forEach(({ residentId, stressData }) => {
        stressMap.set(residentId, stressData);
      });

      setResidentStress(stressMap);
    } catch (err) {
      console.warn('Failed to refresh stress data:', err);
    }
  }, []);

  // Initialize service
  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent<ResidentStressNotification>;
      if (onNotification && customEvent.detail) {
        onNotification(customEvent.detail);
      }
      refreshStressData();
    };

    const initializeService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const service = getResidentStressService(config);
        await service.initialize();
        
        serviceRef.current = service;
        
        // Load initial data
        await refreshStressData();

        if (typeof window !== 'undefined') {
          window.addEventListener('resident-stress-notification', handleNotification as EventListener);
        }

        // Set up recovery interval
        if (enableRecovery) {
          recoveryIntervalRef.current = setInterval(async () => {
            if (serviceRef.current) {
              await serviceRef.current.applyRecovery();
              await refreshStressData();
            }
          }, recoveryInterval);
        }

        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize stress service';
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    initializeService();

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resident-stress-notification', handleNotification as EventListener);
      }
      
      if (recoveryIntervalRef.current) {
        clearInterval(recoveryIntervalRef.current);
        recoveryIntervalRef.current = null;
      }
    };
  }, [config, enableRecovery, recoveryInterval, onNotification, refreshStressData]);

  // Process drop rejection event
  const processDropRejection = useCallback(async (
    residentId: string, 
    activityId?: string, 
    validation?: DropValidationResult
  ) => {
    if (!serviceRef.current) return;

    try {
      const residentData = serviceRef.current.getResidentStress(residentId);
      const stressBefore = residentData?.currentStress || 0;

      await serviceRef.current.processStressEvent({
        residentId,
        eventType: 'drop_rejected',
        stressBefore,
        stressAfter: 0, // Will be calculated by service
        activityId,
        context: {
          validation,
          fatigue: validation?.meta?.fatigue?.current,
          consecutiveRejections: 1,
        },
      });

      await refreshStressData();
    } catch (err) {
      console.error('Failed to process drop rejection:', err);
    }
  }, [refreshStressData]);

  // Process fatigue threshold crossing
  const processFatigueThreshold = useCallback(async (
    residentId: string, 
    activityId?: string, 
    fatigue: number
  ) => {
    if (!serviceRef.current) return;

    try {
      const residentData = serviceRef.current.getResidentStress(residentId);
      const stressBefore = residentData?.currentStress || 0;

      await serviceRef.current.processStressEvent({
        residentId,
        eventType: 'fatigue_threshold_crossed',
        stressBefore,
        stressAfter: 0, // Will be calculated by service
        activityId,
        context: {
          fatigue,
          consecutiveRejections: 1,
        },
      });

      await refreshStressData();
    } catch (err) {
      console.error('Failed to process fatigue threshold:', err);
    }
  }, [refreshStressData]);

  // Process multiple rejections
  const processMultipleRejections = useCallback(async (
    residentId: string, 
    activityId?: string, 
    count: number
  ) => {
    if (!serviceRef.current) return;

    try {
      const residentData = serviceRef.current.getResidentStress(residentId);
      const stressBefore = residentData?.currentStress || 0;

      await serviceRef.current.processStressEvent({
        residentId,
        eventType: 'multiple_rejections',
        stressBefore,
        stressAfter: 0, // Will be calculated by service
        activityId,
        context: {
          consecutiveRejections: count,
        },
      });

      await refreshStressData();
    } catch (err) {
      console.error('Failed to process multiple rejections:', err);
    }
  }, [refreshStressData]);

  // Process recovery event
  const processRecovery = useCallback(async (
    residentId: string, 
    activityId?: string
  ) => {
    if (!serviceRef.current) return;

    try {
      const residentData = serviceRef.current.getResidentStress(residentId);
      const stressBefore = residentData?.currentStress || 0;

      await serviceRef.current.processStressEvent({
        residentId,
        eventType: 'recovery_completed',
        stressBefore,
        stressAfter: 0, // Will be calculated by service
        activityId,
        context: {},
      });

      await refreshStressData();
    } catch (err) {
      console.error('Failed to process recovery:', err);
    }
  }, [refreshStressData]);

  // Reset resident stress
  const resetResidentStress = useCallback(async (residentId: string) => {
    if (!serviceRef.current) return;

    try {
      await serviceRef.current.resetResidentStress(residentId);
      await refreshStressData();
    } catch (err) {
      console.error('Failed to reset resident stress:', err);
    }
  }, [refreshStressData]);

  // Reset all stress
  const resetAllStress = useCallback(async () => {
    if (!serviceRef.current) return;

    try {
      await serviceRef.current.resetAllStress();
      await refreshStressData();
    } catch (err) {
      console.error('Failed to reset all stress:', err);
    }
  }, [refreshStressData]);

  // Manual refresh
  const refreshData = useCallback(async () => {
    await refreshStressData();
  }, [refreshStressData]);

  // Calculate derived values
  const stressedResidents = Array.from(residentStress.entries())
    .filter(([, data]) => data.stressLevel !== 'low')
    .map(([residentId, stressData]) => ({ residentId, stressData }));

  const statistics = (() => {
    const residents = Array.from(residentStress.values());
    const levelOrder = { low: 0, moderate: 1, high: 2, critical: 3 };
    
    const stressedCount = residents.filter(r => levelOrder[r.stressLevel] >= levelOrder.moderate).length;
    const criticalCount = residents.filter(r => r.stressLevel === 'critical').length;
    const averageStress = residents.length > 0 
      ? residents.reduce((sum, r) => sum + r.currentStress, 0) / residents.length 
      : 0;

    const distribution: Record<ResidentStressLevel, number> = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    };

    residents.forEach(r => {
      distribution[r.stressLevel]++;
    });

    return {
      totalResidents: residents.length,
      stressedResidents: stressedCount,
      criticalResidents: criticalCount,
      averageStress,
      stressLevelDistribution: distribution,
    };
  })();

  return {
    residentStress,
    stressedResidents,
    statistics,
    isLoading,
    error,
    processDropRejection,
    processFatigueThreshold,
    processMultipleRejections,
    processRecovery,
    resetResidentStress,
    resetAllStress,
    refreshData,
  };
}
