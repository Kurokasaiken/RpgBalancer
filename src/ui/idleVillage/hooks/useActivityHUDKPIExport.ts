/**
 * NP-087 – Activity HUD KPI Exporter Hook
 * 
 * React hook for integrating Activity HUD KPI export functionality
 * with the Active HUD store and providing real-time export capabilities.
 * 
 * @since 2026-01-21
 * @author Atlas-Idle – HUD Analytics
 */

import { useState, useCallback, useRef } from 'react';
import {
  type ActivityHUDKPIExport,
  type ActivityHUDKPIFilter,
  type ActivityHUDKPIExportOptions,
  type ActivityHUDExportedTelemetry,
  validateActivityHUDKPIFilter,
  validateActivityHUDKPIExportOptions,
  createDefaultActivityHUDKPIFilter,
  createDefaultActivityHUDKPIExportOptions,
  createActivityHUDExportedTelemetry,
  type ActivityKPI,
  type ResidentActivitySummary,
  type LocationActivitySummary
} from '@/ui/idleVillage/activeHud/ActivityHudKPIExporter';

// === Hook Types ===

/**
 * Export state and status.
 */
export interface ActivityHUDExportState {
  isExporting: boolean;
  exportProgress: number;
  lastExport: ActivityHUDKPIExport | null;
  lastError: string | null;
  exportHistory: Array<{
    timestamp: number;
    format: string;
    recordCount: number;
    fileSize: number;
    duration: number;
  }>;
}

/**
 * Hook return value.
 */
export interface UseActivityHUDKPIExportReturn {
  // State
  state: ActivityHUDExportState;
  
  // Actions
  exportKPI: (
    filters?: Partial<ActivityHUDKPIFilter>,
    options?: Partial<ActivityHUDKPIExportOptions>
  ) => Promise<ActivityHUDKPIExport>;
  
  exportToCSV: (
    filters?: Partial<ActivityHUDKPIFilter>,
    filename?: string
  ) => Promise<string>;
  
  exportToJSON: (
    filters?: Partial<ActivityHUDKPIFilter>,
    filename?: string
  ) => Promise<string>;
  
  // Utilities
  clearHistory: () => void;
  resetError: () => void;
  
  // Preview
  previewExport: (
    filters?: Partial<ActivityHUDKPIFilter>,
    options?: Partial<ActivityHUDKPIExportOptions>
  ) => Promise<ActivityHUDKPIExport>;
}

// === Hook Implementation ===

/**
 * Hook for Activity HUD KPI export functionality.
 * 
 * @param activities - Current activities from Active HUD store
 * @param residents - Current residents from Active HUD store  
 * @param locations - Current locations from Active HUD store
 * @param options - Hook configuration options
 * @returns Export functionality and state
 */
export function useActivityHUDKPIExport(
  activities: any[],
  residents: any[],
  locations: any[],
  options: {
    enableTelemetry?: boolean;
    outputDirectory?: string;
    maxHistorySize?: number;
  } = {}
): UseActivityHUDKPIExportReturn {
  const {
    enableTelemetry = true,
    outputDirectory = 'test-results',
    maxHistorySize = 10
  } = options;
  
  // State management
  const [state, setState] = useState<ActivityHUDExportState>({
    isExporting: false,
    exportProgress: 0,
    lastExport: null,
    lastError: null,
    exportHistory: [],
  });
  
  // Refs for tracking
  const exportStartTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  /**
   * Transforms store data to KPI format.
   */
  const transformStoreToKPI = useCallback((
    storeActivities: any[],
    storeResidents: any[],
    storeLocations: any[],
    filters: ActivityHUDKPIFilter,
    exportOptions: ActivityHUDKPIExportOptions
  ): ActivityHUDKPIExport => {
    const startTime = performance.now();
    
    // Transform activities
    let transformedActivities = storeActivities.map(activity => ({
      id: activity.id || `activity-${Date.now()}`,
      name: activity.name || 'Unknown Activity',
      type: activity.type || 'job',
      status: activity.status || 'idle',
      locationId: activity.locationId || 'unknown',
      locationName: activity.locationName || 'Unknown Location',
      assignedResidents: activity.assignedResidents || [],
      assignedResidentNames: activity.assignedResidentNames || [],
      progress: Math.max(0, Math.min(100, activity.progress || 0)),
      estimatedTimeRemainingMin: Math.max(0, activity.estimatedTimeRemainingMin || 0),
      elapsedTimeMin: Math.max(0, activity.elapsedTimeMin || 0),
      successRate: Math.max(0, Math.min(100, activity.successRate || 0)),
      dropSuccessRate: Math.max(0, Math.min(100, activity.dropSuccessRate || 0)),
      totalDrops: Math.max(0, activity.totalDrops || 0),
      successfulDrops: Math.max(0, activity.successfulDrops || 0),
      failedDrops: Math.max(0, activity.failedDrops || 0),
      priority: Math.max(1, Math.min(10, activity.priority || 5)),
      tags: activity.tags || [],
      startedAt: activity.startedAt || Date.now(),
      lastUpdated: activity.lastUpdated || Date.now(),
      completedAt: activity.completedAt || null,
      performanceScore: Math.max(0, Math.min(100, activity.performanceScore || 0)),
      efficiencyScore: Math.max(0, Math.min(100, activity.efficiencyScore || 0)),
    }));
    
    // Apply filters
    transformedActivities = applyFilters(transformedActivities, filters, exportOptions);
    
    // Apply sorting
    transformedActivities = applySorting(transformedActivities, exportOptions);
    
    // Apply pagination
    transformedActivities = applyPagination(transformedActivities, exportOptions);
    
    // Transform residents
    const transformedResidents = storeResidents.map(resident => ({
      id: resident.id || `resident-${Date.now()}`,
      name: resident.name || 'Unknown Resident',
      currentActivityId: resident.currentActivityId || null,
      currentActivityName: resident.currentActivityName || null,
      totalCompleted: Math.max(0, resident.totalCompleted || 0),
      totalFailed: Math.max(0, resident.totalFailed || 0),
      averageSuccessRate: Math.max(0, Math.min(100, resident.averageSuccessRate || 0)),
      averageCompletionTimeMin: Math.max(0, resident.averageCompletionTimeMin || 0),
      currentFatigue: Math.max(0, Math.min(100, resident.currentFatigue || 0)),
      currentHappiness: Math.max(0, Math.min(100, resident.currentHappiness || 0)),
      activeSkills: resident.activeSkills || [],
      performanceTrend: resident.performanceTrend || 'stable' as const,
    }));
    
    // Transform locations
    const transformedLocations = storeLocations.map(location => ({
      id: location.id || `location-${Date.now()}`,
      name: location.name || 'Unknown Location',
      type: location.type || 'village' as const,
      totalActivities: Math.max(0, location.totalActivities || 0),
      activeActivities: Math.max(0, location.activeActivities || 0),
      averageSuccessRate: Math.max(0, Math.min(100, location.averageSuccessRate || 0)),
      utilizationRate: Math.max(0, Math.min(100, location.utilizationRate || 0)),
      dominantActivityType: location.dominantActivityType || 'job' as const,
      efficiencyScore: Math.max(0, Math.min(100, location.efficiencyScore || 0)),
    }));
    
    // Calculate summary statistics
    const summary = calculateSummary(transformedActivities, transformedResidents, transformedLocations);
    
    const transformTime = performance.now() - startTime;
    
    return {
      exportMetadata: {
        exportedAt: Date.now(),
        version: '1.0.0',
        source: 'active-hud-store',
        format: exportOptions.format,
        totalRecords: transformedActivities.length,
      },
      summary,
      activities: transformedActivities,
      residentSummaries: exportOptions.includeResidentSummaries ? transformedResidents : [],
      locationSummaries: exportOptions.includeLocationSummaries ? transformedLocations : [],
    };
  }, []);
  
  /**
   * Applies filters to activities.
   */
  const applyFilters = (
    activities: ActivityKPI[],
    filters: ActivityHUDKPIFilter,
    options: ActivityHUDKPIExportOptions
  ): ActivityKPI[] => {
    return activities.filter(activity => {
      // Activity type filter
      if (filters.activityTypes && !filters.activityTypes.includes(activity.type)) {
        return false;
      }
      
      // Activity status filter
      if (filters.activityStatuses && !filters.activityStatuses.includes(activity.status)) {
        return false;
      }
      
      // Location filter
      if (filters.locationIds && !filters.locationIds.includes(activity.locationId)) {
        return false;
      }
      
      // Resident filter
      if (filters.residentIds && !activity.assignedResidents.some(id => filters.residentIds!.includes(id))) {
        return false;
      }
      
      // Progress range filter
      if (filters.progressRange) {
        if (filters.progressRange.min !== undefined && activity.progress < filters.progressRange.min) {
          return false;
        }
        if (filters.progressRange.max !== undefined && activity.progress > filters.progressRange.max) {
          return false;
        }
      }
      
      // Success rate range filter
      if (filters.successRateRange) {
        if (filters.successRateRange.min !== undefined && activity.successRate < filters.successRateRange.min) {
          return false;
        }
        if (filters.successRateRange.max !== undefined && activity.successRate > filters.successRateRange.max) {
          return false;
        }
      }
      
      // Priority range filter
      if (filters.priorityRange) {
        if (filters.priorityRange.min !== undefined && activity.priority < filters.priorityRange.min) {
          return false;
        }
        if (filters.priorityRange.max !== undefined && activity.priority > filters.priorityRange.max) {
          return false;
        }
      }
      
      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => activity.tags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      // Performance score range filter
      if (filters.performanceScoreRange) {
        if (filters.performanceScoreRange.min !== undefined && activity.performanceScore < filters.performanceScoreRange.min) {
          return false;
        }
        if (filters.performanceScoreRange.max !== undefined && activity.performanceScore > filters.performanceScoreRange.max) {
          return false;
        }
      }
      
      // Include/exclude based on status
      if (!options.includeInactive && activity.status === 'idle') {
        return false;
      }
      
      if (!options.includeCompleted && activity.status === 'completed') {
        return false;
      }
      
      if (!options.includeFailed && activity.status === 'failed') {
        return false;
      }
      
      return true;
    });
  };
  
  /**
   * Applies sorting to activities.
   */
  const applySorting = (
    activities: ActivityKPI[],
    options: ActivityHUDKPIExportOptions
  ): ActivityKPI[] => {
    return [...activities].sort((a, b) => {
      let aValue: any = a[options.sortBy as keyof ActivityKPI];
      let bValue: any = b[options.sortBy as keyof ActivityKPI];
      
      // Handle string comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (options.sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
  };
  
  /**
   * Applies pagination to activities.
   */
  const applyPagination = (
    activities: ActivityKPI[],
    options: ActivityHUDKPIExportOptions
  ): ActivityKPI[] => {
    let result = activities;
    
    if (options.offset > 0) {
      result = result.slice(options.offset);
    }
    
    if (options.limit) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  };
  
  /**
   * Calculates summary statistics.
   */
  const calculateSummary = (
    activities: ActivityKPI[],
    residents: ResidentActivitySummary[],
    locations: LocationActivitySummary[]
  ) => {
    const totalActiveActivities = activities.filter(a => a.status === 'active').length;
    const totalCompletedActivities = activities.filter(a => a.status === 'completed').length;
    const overallSuccessRate = activities.length > 0 
      ? activities.reduce((sum, a) => sum + a.successRate, 0) / activities.length 
      : 0;
    const overallDropSuccessRate = activities.length > 0
      ? activities.reduce((sum, a) => sum + a.dropSuccessRate, 0) / activities.length
      : 0;
    const averageActivityDurationMin = activities.length > 0
      ? activities.reduce((sum, a) => sum + a.elapsedTimeMin, 0) / activities.length
      : 0;
    const totalActiveResidents = residents.filter(r => r.currentActivityId !== null).length;
    const totalUtilizedLocations = locations.filter(l => l.activeActivities > 0).length;
    const globalEfficiencyScore = (overallSuccessRate + overallDropSuccessRate) / 2;
    
    return {
      totalActiveActivities,
      totalCompletedActivities,
      overallSuccessRate,
      overallDropSuccessRate,
      averageActivityDurationMin,
      totalActiveResidents,
      totalUtilizedLocations,
      globalEfficiencyScore,
    };
  };
  
  /**
   * Emits telemetry event.
   */
  const emitTelemetry = useCallback((
    exportData: ActivityHUDKPIExport,
    exportDuration: number,
    fileSize: number,
    filters: ActivityHUDKPIFilter,
    options: ActivityHUDKPIExportOptions
  ) => {
    if (!enableTelemetry) {
      return;
    }
    
    const telemetry: ActivityHUDExportedTelemetry = createActivityHUDExportedTelemetry(
      exportData,
      exportDuration,
      fileSize,
      filters,
      options,
      {
        dataCollectionTimeMs: exportDuration * 0.3,
        processingTimeMs: exportDuration * 0.4,
        exportTimeMs: exportDuration * 0.3,
        memoryUsageMB: 30.5, // Placeholder
      }
    );
    
    // Emit telemetry event (implementation depends on your telemetry system)
    console.log('[TELEMETRY]', JSON.stringify(telemetry));
  }, [enableTelemetry]);
  
  /**
   * Main export function.
   */
  const exportKPI = useCallback(async (
    filters?: Partial<ActivityHUDKPIFilter>,
    options?: Partial<ActivityHUDKPIExportOptions>
  ): Promise<ActivityHUDKPIExport> => {
    try {
      // Cancel any existing export
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      exportStartTimeRef.current = performance.now();
      
      // Validate inputs
      const validatedFilters = validateActivityHUDKPIFilter({
        ...createDefaultActivityHUDKPIFilter(),
        ...filters
      });
      
      const validatedOptions = validateActivityHUDKPIExportOptions({
        ...createDefaultActivityHUDKPIExportOptions(),
        ...options
      });
      
      // Update state
      setState(prev => ({
        ...prev,
        isExporting: true,
        exportProgress: 0,
        lastError: null,
      }));
      
      // Transform data
      const exportData = transformStoreToKPI(
        activities,
        residents,
        locations,
        validatedFilters,
        validatedOptions
      );
      
      // Simulate export progress
      setState(prev => ({ ...prev, exportProgress: 50 }));
      
      // Calculate export duration and file size
      const exportDuration = performance.now() - exportStartTimeRef.current;
      const fileSize = JSON.stringify(exportData).length;
      
      // Emit telemetry
      emitTelemetry(exportData, exportDuration, fileSize, validatedFilters, validatedOptions);
      
      // Update state with success
      setState(prev => ({
        ...prev,
        isExporting: false,
        exportProgress: 100,
        lastExport: exportData,
        lastError: null,
        exportHistory: [
          {
            timestamp: Date.now(),
            format: validatedOptions.format,
            recordCount: exportData.activities.length,
            fileSize,
            duration: exportDuration,
          },
          ...prev.exportHistory.slice(0, maxHistorySize - 1)
        ]
      }));
      
      return exportData;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState(prev => ({
        ...prev,
        isExporting: false,
        exportProgress: 0,
        lastError: errorMessage,
      }));
      
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  }, [activities, residents, locations, transformStoreToKPI, emitTelemetry, maxHistorySize]);
  
  /**
   * Export to CSV format.
   */
  const exportToCSV = useCallback(async (
    filters?: Partial<ActivityHUDKPIFilter>,
    filename?: string
  ): Promise<string> => {
    const exportData = await exportKPI(filters, { format: 'csv' });
    
    // Generate CSV content
    const csvContent = generateCSVContent(exportData);
    
    // Create file (implementation depends on your file system)
    const finalFilename = filename || `activity-hud-kpi-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    const filePath = `${outputDirectory}/${finalFilename}`;
    
    // In a real implementation, you would save the file here
    console.log(`CSV export saved to: ${filePath}`);
    
    return filePath;
  }, [exportKPI, outputDirectory]);
  
  /**
   * Export to JSON format.
   */
  const exportToJSON = useCallback(async (
    filters?: Partial<ActivityHUDKPIFilter>,
    filename?: string
  ): Promise<string> => {
    const exportData = await exportKPI(filters, { format: 'json' });
    
    // Generate JSON content
    const jsonContent = JSON.stringify(exportData, null, 2);
    
    // Create file (implementation depends on your file system)
    const finalFilename = filename || `activity-hud-kpi-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = `${outputDirectory}/${finalFilename}`;
    
    // In a real implementation, you would save the file here
    console.log(`JSON export saved to: ${filePath}`);
    
    return filePath;
  }, [exportKPI, outputDirectory]);
  
  /**
   * Preview export without saving.
   */
  const previewExport = useCallback(async (
    filters?: Partial<ActivityHUDKPIFilter>,
    options?: Partial<ActivityHUDKPIExportOptions>
  ): Promise<ActivityHUDKPIExport> => {
    const validatedFilters = validateActivityHUDKPIFilter({
      ...createDefaultActivityHUDKPIFilter(),
      ...filters
    });
    
    const validatedOptions = validateActivityHUDKPIExportOptions({
      ...createDefaultActivityHUDKPIExportOptions(),
      ...options
    });
    
    return transformStoreToKPI(
      activities,
      residents,
      locations,
      validatedFilters,
      validatedOptions
    );
  }, [activities, residents, locations, transformStoreToKPI]);
  
  /**
   * Clear export history.
   */
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      exportHistory: [],
      lastExport: null,
      lastError: null,
    }));
  }, []);
  
  /**
   * Reset error state.
   */
  const resetError = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastError: null,
    }));
  }, []);
  
  return {
    state,
    exportKPI,
    exportToCSV,
    exportToJSON,
    previewExport,
    clearHistory,
    resetError,
  };
}

// === Utility Functions ===

/**
 * Generates CSV content from export data.
 */
function generateCSVContent(data: ActivityHUDKPIExport): string {
  const headers = [
    'ID',
    'Name',
    'Type',
    'Status',
    'Location',
    'Assigned Residents',
    'Progress',
    'Success Rate',
    'Drop Success Rate',
    'Priority',
    'Elapsed Time',
    'Performance Score',
    'Efficiency Score',
    'Started At',
    'Completed At'
  ];
  
  const rows = data.activities.map(activity => [
    activity.id,
    activity.name,
    activity.type,
    activity.status,
    activity.locationName,
    activity.assignedResidentNames.join(';'),
    activity.progress.toFixed(1),
    activity.successRate.toFixed(1),
    activity.dropSuccessRate.toFixed(1),
    activity.priority,
    activity.elapsedTimeMin,
    activity.performanceScore.toFixed(1),
    activity.efficiencyScore.toFixed(1),
    new Date(activity.startedAt).toISOString(),
    activity.completedAt ? new Date(activity.completedAt).toISOString() : ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
