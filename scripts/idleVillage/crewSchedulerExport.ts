#!/usr/bin/env tsx

/**
 * Crew Scheduler Export CLI
 * 
 * Exports crew scheduler state to JSON/CSV with filters for slot, resident, and timeframe.
 * Includes assignment timeline and rejection reasons.
 * 
 * @since NP-018
 */

import { Command } from 'commander';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { loadData } from '@/shared/persistence/PersistenceService';
import type { CrewSchedulerConfig, QueuedAssignment } from '@/ui/idleVillage/hooks/useCrewScheduler';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';

/**
 * Export options interface
 */
interface ExportOptions {
  format: 'json' | 'csv';
  output: string;
  slot?: string;
  resident?: string;
  timeframe?: string;
  compress?: boolean;
  pretty?: boolean;
}

/**
 * Scheduler export data structure
 */
interface SchedulerExport {
  metadata: {
    exportTime: string;
    version: string;
    totalAssignments: number;
    filters: Partial<ExportOptions>;
  };
  config: CrewSchedulerConfig;
  queue: QueuedAssignment[];
  residents: Record<string, ResidentState>;
  activities: Record<string, ActivityDefinition>;
  timeline: AssignmentTimelineEntry[];
  rejections: RejectionEntry[];
}

/**
 * Assignment timeline entry
 */
interface AssignmentTimelineEntry {
  timestamp: number;
  residentId: string;
  activityId: string;
  action: 'assigned' | 'completed' | 'cancelled';
  reason?: string;
  priorityScore?: number;
}

/**
 * Rejection entry
 */
interface RejectionEntry {
  timestamp: number;
  residentId: string;
  activityId: string;
  reason: string;
  factors: {
    statTagMatch: number;
    fatigue: number;
    questUrgency: number;
    specializationBonus: number;
    difficultyBonus: number;
  };
}

/**
 * Main export function
 */
async function exportSchedulerData(options: ExportOptions): Promise<void> {
  console.log('🚀 Starting crew scheduler export...');
  
  try {
    // Load scheduler state from persistence
    const schedulerState = await loadSchedulerState();
    
    // Apply filters
    const filteredState = applyFilters(schedulerState, options);
    
    // Generate export data
    const exportData = generateExportData(filteredState, options);
    
    // Ensure output directory exists
    await ensureOutputDirectory(options.output);
    
    // Write export file
    await writeExportFile(exportData, options);
    
    console.log(`✅ Export completed: ${options.output}`);
    console.log(`📊 Total assignments: ${exportData.metadata.totalAssignments}`);
    console.log(`📝 Timeline entries: ${exportData.timeline.length}`);
    console.log(`❌ Rejections: ${exportData.rejections.length}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

/**
 * Load scheduler state from persistence
 */
async function loadSchedulerState(): Promise<SchedulerExport> {
  // Load scheduler snapshots from persistence
  const snapshots = await loadSchedulerSnapshots();
  
  if (snapshots.length === 0) {
    throw new Error('No scheduler snapshots found in persistence');
  }
  
  // Use the most recent snapshot
  const latestSnapshot = snapshots[snapshots.length - 1];
  
  return {
    metadata: {
      exportTime: new Date().toISOString(),
      version: '1.0.0',
      totalAssignments: latestSnapshot.queue.length,
      filters: {}
    },
    config: latestSnapshot.config,
    queue: latestSnapshot.queue,
    residents: latestSnapshot.villageState.residents,
    activities: latestSnapshot.villageState.activities,
    timeline: generateTimelineFromQueue(latestSnapshot.queue),
    rejections: generateRejectionsFromQueue(latestSnapshot.queue)
  };
}

/**
 * Load scheduler snapshots from persistence
 */
async function loadSchedulerSnapshots(): Promise<any[]> {
  const snapshots: any[] = [];
  
  // Try to load recent snapshots (last 24 hours)
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  // Look for snapshot keys in persistence
  const snapshotKeys = [
    'crew_scheduler_snapshot_latest',
    'scheduler_snapshot_',
    'crew_scheduler_state'
  ];
  
  for (const keyPrefix of snapshotKeys) {
    try {
      // This would need to be implemented in PersistenceService to list keys
      // For now, we'll try common snapshot keys
      const snapshot = await loadData(keyPrefix + '_latest', null);
      if (snapshot && snapshot.timestamp > oneDayAgo) {
        snapshots.push(snapshot);
      }
    } catch (error) {
      // Key doesn't exist, continue
    }
  }
  
  return snapshots;
}

/**
 * Apply filters to scheduler state
 */
function applyFilters(state: SchedulerExport, options: ExportOptions): SchedulerExport {
  let filteredQueue = [...state.queue];
  let filteredTimeline = [...state.timeline];
  let filteredRejections = [...state.rejections];
  
  // Filter by slot
  if (options.slot) {
    filteredQueue = filteredQueue.filter(a => a.activityId.includes(options.slot!));
    filteredTimeline = filteredTimeline.filter(t => t.activityId.includes(options.slot!));
    filteredRejections = filteredRejections.filter(r => r.activityId.includes(options.slot!));
  }
  
  // Filter by resident
  if (options.resident) {
    filteredQueue = filteredQueue.filter(a => a.residentId.includes(options.resident!));
    filteredTimeline = filteredTimeline.filter(t => t.residentId.includes(options.resident!));
    filteredRejections = filteredRejections.filter(r => r.residentId.includes(options.resident!));
  }
  
  // Filter by timeframe
  if (options.timeframe) {
    const timeRange = parseTimeframe(options.timeframe);
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
    rejections: filteredRejections
  };
}

/**
 * Parse timeframe string
 */
function parseTimeframe(timeframe: string): { start: number; end: number } {
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
  
  throw new Error(`Invalid timeframe format: ${timeframe}`);
}

/**
 * Generate export data structure
 */
function generateExportData(state: SchedulerExport, options: ExportOptions): SchedulerExport {
  return {
    ...state,
    metadata: {
      ...state.metadata,
      filters: options
    }
  };
}

/**
 * Generate timeline from queue
 */
function generateTimelineFromQueue(queue: QueuedAssignment[]): AssignmentTimelineEntry[] {
  return queue.map(assignment => ({
    timestamp: assignment.timestamp,
    residentId: assignment.residentId,
    activityId: assignment.activityId,
    action: 'assigned' as const,
    priorityScore: assignment.priorityScore
  }));
}

/**
 * Generate rejections from queue
 */
function generateRejectionsFromQueue(queue: QueuedAssignment[]): RejectionEntry[] {
  // This would need to be populated from actual rejection data
  // For now, return empty array
  return [];
}

/**
 * Ensure output directory exists
 */
async function ensureOutputDirectory(outputPath: string): Promise<void> {
  const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
  if (dir && dir !== outputPath) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Write export file
 */
async function writeExportFile(data: SchedulerExport, options: ExportOptions): Promise<void> {
  const content = options.format === 'json' 
    ? JSON.stringify(data, null, options.pretty ? 2 : 0)
    : convertToCSV(data);
  
  await writeFile(options.output, content, 'utf-8');
}

/**
 * Convert export data to CSV
 */
function convertToCSV(data: SchedulerExport): string {
  const headers = [
    'timestamp',
    'residentId',
    'activityId',
    'action',
    'reason',
    'priorityScore',
    'statTagMatch',
    'fatigue',
    'questUrgency',
    'specializationBonus',
    'difficultyBonus'
  ];
  
  const rows = [
    headers.join(','),
    ...data.timeline.map(entry => [
      entry.timestamp,
      entry.residentId,
      entry.activityId,
      entry.action,
      entry.reason || '',
      entry.priorityScore || '',
      '', // factors would need to be populated
      '',
      '',
      '',
      '',
      ''
    ].join(','))
  ];
  
  return rows.join('\n');
}

/**
 * CLI setup
 */
const program = new Command();

program
  .name('crew-scheduler-export')
  .description('Export crew scheduler state to JSON/CSV')
  .version('1.0.0');

program
  .option('-f, --format <format>', 'Output format (json|csv)', 'json')
  .option('-o, --output <path>', 'Output file path', 'data/exports/idleVillage/crew_scheduler/export.json')
  .option('-s, --slot <slot>', 'Filter by activity slot')
  .option('-r, --resident <resident>', 'Filter by resident ID')
  .option('-t, --timeframe <timeframe>', 'Filter by timeframe (today|week|month|YYYY-MM-DD,YYYY-MM-DD)')
  .option('-c, --compress', 'Compress output file')
  .option('-p, --pretty', 'Pretty print JSON output')
  .action(exportSchedulerData);

/**
 * Run CLI if called directly
 */
if (require.main === module) {
  program.parse();
}

export { exportSchedulerData, ExportOptions, SchedulerExport };
