/**
 * Crew Scheduler Export Controller
 * 
 * Provides service for exporting crew scheduler state with filters and telemetry.
 * Integrates with CLI and UI export functionality.
 * 
 * @since NP-018
 */

import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type { AssignmentFactors, QueuedAssignment } from '../hooks/useCrewScheduler';
import type { CrewSchedulerConfig } from '@/balancing/config/idleVillage/crewScheduler';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { SchedulerSnapshot } from '@/balancing/config/idleVillage/crewSchedulerDeterminismGuard';

/**
 * Export options interface
 */
export interface ExportOptions {
  format: 'json' | 'csv';
  outputPath: string;
  slot?: string;
  resident?: string;
  timeframe?: string;
  compress?: boolean;
  pretty?: boolean;
}

/**
 * Scheduler export data structure
 */
export interface SchedulerExport {
  metadata: {
    exportTime: string;
    version: string;
    totalAssignments: number;
    filters: Partial<ExportOptions>;
    exportDuration: number;
  };
  config: CrewSchedulerConfig;
  queue: QueuedAssignment[];
  residents: Record<string, ResidentState>;
  activities: Record<string, ActivityDefinition>;
  timeline: AssignmentTimelineEntry[];
  rejections: RejectionEntry[];
  statistics: ExportStatistics;
}

/**
 * Assignment timeline entry
 */
export interface AssignmentTimelineEntry {
  timestamp: number;
  residentId: string;
  activityId: string;
  action: 'assigned' | 'completed' | 'cancelled';
  reason?: string;
  priorityScore?: number;
  factors?: ExportAssignmentFactors;
}

/**
 * Rejection entry
 */
export interface RejectionEntry {
  timestamp: number;
  residentId: string;
  activityId: string;
  reason: string;
  factors: ExportAssignmentFactors;
}

/**
 * Assignment factors (re-exported from useCrewScheduler)
 */
export type ExportAssignmentFactors = AssignmentFactors;

/**
 * Export statistics
 */
export interface ExportStatistics {
  totalAssignments: number;
  totalRejections: number;
  averagePriorityScore: number;
  mostActiveResident: string;
  mostRequestedActivity: string;
  rejectionRate: number;
  timeRange: { start: number; end: number };
}

/**
 * Export telemetry data
 */
export interface ExportTelemetry {
  eventType: 'crew_scheduler_export';
  data: {
    exportId: string;
    format: string;
    totalRecords: number;
    fileSize: number;
    duration: number;
    filters: Partial<ExportOptions>;
    timestamp: number;
  };
}

/**
 * Crew Scheduler Export Controller
 */
export class CrewSchedulerExporter {
  private diagnostics = createSandboxDiagnostics('CrewSchedulerExporter', 'export');
  
  /**
   * Export scheduler data with filters
   */
  async exportData(options: ExportOptions): Promise<SchedulerExport> {
    const startTime = Date.now();
    const exportId = `export_${startTime}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.diagnostics.info('Starting scheduler export', {
      exportId,
      format: options.format,
      outputPath: options.outputPath
    });
    
    try {
      // Load scheduler state
      const schedulerState = await this.loadSchedulerState();
      
      // Apply filters
      const filteredState = this.applyFilters(schedulerState, options);
      
      // Generate export data
      const exportData = this.generateExportData(filteredState, options, startTime);
      
      // Save export to persistence
      await this.saveExportToPersistence(exportId, exportData);
      
      // Emit telemetry
      await this.emitTelemetry(exportId, exportData, options, Date.now() - startTime);
      
      this.diagnostics.info('Export completed successfully', {
        exportId,
        totalAssignments: exportData.metadata.totalAssignments,
        duration: exportData.metadata.exportDuration
      });
      
      return exportData;
      
    } catch (error) {
      this.diagnostics.error('Export failed', { exportId, error: String(error) });
      throw error;
    }
  }
  
  /**
   * Load scheduler state from persistence
   */
  private async loadSchedulerState(): Promise<SchedulerExport> {
    // Try to load latest scheduler snapshot
    const latestSnapshot = await loadData<SchedulerSnapshot>('crew_scheduler_snapshot_latest', null);
    
    if (!latestSnapshot) {
      throw new Error('No scheduler snapshot found. Ensure scheduler has run and snapshots are enabled.');
    }
    
    return {
      metadata: {
        exportTime: new Date().toISOString(),
        version: '1.0.0',
        totalAssignments: latestSnapshot.queue?.length || 0,
        filters: {},
        exportDuration: 0
      },
      config: latestSnapshot.config,
      queue: latestSnapshot.queue || [],
      residents: latestSnapshot.villageState?.residents || {},
      activities: latestSnapshot.villageState?.activities || {},
      timeline: this.generateTimelineFromQueue(latestSnapshot.queue || []),
      rejections: this.generateRejectionsFromQueue(latestSnapshot.queue || []),
      statistics: this.calculateStatistics(latestSnapshot.queue || [])
    };
  }
  
  /**
   * Apply filters to scheduler state
   */
  private applyFilters(state: SchedulerExport, options: ExportOptions): SchedulerExport {
    let filteredQueue = [...state.queue];
    let filteredTimeline = [...state.timeline];
    let filteredRejections = [...state.rejections];
    
    // Filter by slot
    if (options.slot) {
      const slotFilter = options.slot.toLowerCase();
      filteredQueue = filteredQueue.filter(a => 
        a.activityId.toLowerCase().includes(slotFilter)
      );
      filteredTimeline = filteredTimeline.filter(t => 
        t.activityId.toLowerCase().includes(slotFilter)
      );
      filteredRejections = filteredRejections.filter(r => 
        r.activityId.toLowerCase().includes(slotFilter)
      );
    }
    
    // Filter by resident
    if (options.resident) {
      const residentFilter = options.resident.toLowerCase();
      filteredQueue = filteredQueue.filter(a => 
        a.residentId.toLowerCase().includes(residentFilter)
      );
      filteredTimeline = filteredTimeline.filter(t => 
        t.residentId.toLowerCase().includes(residentFilter)
      );
      filteredRejections = filteredRejections.filter(r => 
        r.residentId.toLowerCase().includes(residentFilter)
      );
    }
    
    // Filter by timeframe
    if (options.timeframe) {
      const timeRange = this.parseTimeframe(options.timeframe);
      filteredTimeline = filteredTimeline.filter(t => 
        t.timestamp >= timeRange.start && t.timestamp <= timeRange.end
      );
      filteredRejections = filteredRejections.filter(r => 
        r.timestamp >= timeRange.start && r.timestamp <= timeRange.end
      );
    }
    
    return {
      ...state,
      metadata: {
        ...state.metadata,
        totalAssignments: filteredQueue.length,
        filters: options
      },
      queue: filteredQueue,
      timeline: filteredTimeline,
      rejections: filteredRejections,
      statistics: this.calculateStatistics(filteredQueue)
    };
  }
  
  /**
   * Parse timeframe string
   */
  private parseTimeframe(timeframe: string): { start: number; end: number } {
    const now = Date.now();
    
    if (timeframe === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      return { start: startOfDay.getTime(), end: now };
    }
    
    if (timeframe === 'week') {
      const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
      return { start: weekAgo, end: now };
    }
    
    if (timeframe === 'month') {
      const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
      return { start: monthAgo, end: now };
    }
    
    // Try to parse as ISO date range: "2024-01-01,2024-01-31"
    const match = timeframe.match(/(\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return {
        start: new Date(match[1]).getTime(),
        end: new Date(match[2]).getTime()
      };
    }
    
    throw new Error(`Invalid timeframe format: ${timeframe}. Use: today, week, month, or YYYY-MM-DD,YYYY-MM-DD`);
  }
  
  /**
   * Generate export data structure
   */
  private generateExportData(state: SchedulerExport, options: ExportOptions, startTime: number): SchedulerExport {
    const endTime = Date.now();
    
    return {
      ...state,
      metadata: {
        ...state.metadata,
        filters: options,
        exportDuration: endTime - startTime
      }
    };
  }
  
  /**
   * Generate timeline from queue
   */
  private generateTimelineFromQueue(queue: QueuedAssignment[]): AssignmentTimelineEntry[] {
    return queue.map(assignment => ({
      timestamp: assignment.timestamp,
      residentId: assignment.residentId,
      activityId: assignment.activityId,
      action: 'assigned' as const,
      priorityScore: assignment.priorityScore,
      factors: assignment.factors
    }));
  }
  
  /**
   * Generate rejections from queue
   */
  private generateRejectionsFromQueue(_queue: QueuedAssignment[]): RejectionEntry[] {
    // This would be populated from actual rejection tracking
    // For now, return empty array
    return [];
  }
  
  /**
   * Calculate export statistics
   */
  private calculateStatistics(queue: QueuedAssignment[]): ExportStatistics {
    const totalAssignments = queue.length;
    const totalRejections = 0; // Would be calculated from rejection data
    
    const priorityScores = queue.map(a => a.priorityScore).filter(Boolean);
    const averagePriorityScore = priorityScores.length > 0 
      ? priorityScores.reduce((sum, score) => sum + score, 0) / priorityScores.length 
      : 0;
    
    // Count assignments by resident
    const residentCounts: Record<string, number> = {};
    queue.forEach(assignment => {
      residentCounts[assignment.residentId] = (residentCounts[assignment.residentId] || 0) + 1;
    });
    
    const mostActiveResident = Object.entries(residentCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
    
    // Count assignments by activity
    const activityCounts: Record<string, number> = {};
    queue.forEach(assignment => {
      activityCounts[assignment.activityId] = (activityCounts[assignment.activityId] || 0) + 1;
    });
    
    const mostRequestedActivity = Object.entries(activityCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
    
    const timestamps = queue.map(a => a.timestamp).filter(Boolean);
    const timeRange = timestamps.length > 0 
      ? { start: Math.min(...timestamps), end: Math.max(...timestamps) }
      : { start: Date.now(), end: Date.now() };
    
    return {
      totalAssignments,
      totalRejections,
      averagePriorityScore,
      mostActiveResident,
      mostRequestedActivity,
      rejectionRate: totalAssignments > 0 ? totalRejections / totalAssignments : 0,
      timeRange
    };
  }
  
  /**
   * Save export to persistence
   */
  private async saveExportToPersistence(exportId: string, data: SchedulerExport): Promise<void> {
    const key = `crew_scheduler_export_${exportId}`;
    await saveData(key, data);
  }
  
  /**
   * Emit telemetry event
   */
  private async emitTelemetry(
    exportId: string, 
    data: SchedulerExport, 
    options: ExportOptions, 
    duration: number
  ): Promise<void> {
    const telemetry: ExportTelemetry = {
      eventType: 'crew_scheduler_export',
      data: {
        exportId,
        format: options.format,
        totalRecords: data.metadata.totalAssignments,
        fileSize: JSON.stringify(data).length,
        duration,
        filters: options,
        timestamp: Date.now()
      }
    };
    
    // Save telemetry to persistence
    const telemetryKey = `telemetry_crew_scheduler_export_${exportId}`;
    await saveData(telemetryKey, telemetry);
    
    this.diagnostics.info('Telemetry emitted', { exportId, duration, totalRecords: data.metadata.totalAssignments });
  }
  
  /**
   * Get list of available exports
   */
  async getAvailableExports(): Promise<string[]> {
    // This would need to be implemented in PersistenceService to list keys
    // For now, return empty array
    return [];
  }
  
  /**
   * Load specific export
   */
  async loadExport(exportId: string): Promise<SchedulerExport | null> {
    const key = `crew_scheduler_export_${exportId}`;
    return await loadData<SchedulerExport>(key, null);
  }
}

/**
 * Create exporter instance
 */
export function createCrewSchedulerExporter(): CrewSchedulerExporter {
  return new CrewSchedulerExporter();
}

/**
 * Export data utility function
 */
export async function exportSchedulerData(options: ExportOptions): Promise<SchedulerExport> {
  const exporter = createCrewSchedulerExporter();
  return await exporter.exportData(options);
}
