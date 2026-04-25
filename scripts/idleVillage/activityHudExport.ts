#!/usr/bin/env node

/**
 * NP-087 – Idle Village Activity HUD KPI Exporter CLI
 * 
 * CLI tool for exporting Activity HUD KPI data in JSON/CSV formats
 * with filtering, telemetry integration, and comprehensive reporting.
 * 
 * @since 2026-01-21
 * @author Atlas-Idle – HUD Analytics
 */

import { Command } from 'commander';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
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
  createDefaultActivityKPI,
  type ActivityKPI,
  type ResidentActivitySummary,
  type LocationActivitySummary
} from '@/ui/idleVillage/activeHud/ActivityHudKPIExporter';

// === CLI Configuration ===

const program = new Command();

program
  .name('activityHudExport')
  .description('CLI tool for exporting Activity HUD KPI data')
  .version('1.0.0');

// === Command Options ===

program
  .option('-f, --format <format>', 'Export format (json|csv)', 'json')
  .option('-o, --output <path>', 'Output file path')
  .option('--output-dir <dir>', 'Output directory', 'test-results')
  .option('--activity-types <types>', 'Filter by activity types (comma-separated)', (value: string) => value.split(','))
  .option('--activity-statuses <statuses>', 'Filter by activity statuses (comma-separated)', (value: string) => value.split(','))
  .option('--location-ids <ids>', 'Filter by location IDs (comma-separated)', (value: string) => value.split(','))
  .option('--resident-ids <ids>', 'Filter by resident IDs (comma-separated)', (value: string) => value.split(','))
  .option('--progress-min <percentage>', 'Minimum progress percentage (0-100)', (value: string) => parseFloat(value))
  .option('--progress-max <percentage>', 'Maximum progress percentage (0-100)', (value: string) => parseFloat(value))
  .option('--success-rate-min <percentage>', 'Minimum success rate percentage (0-100)', (value: string) => parseFloat(value))
  .option('--success-rate-max <percentage>', 'Maximum success rate percentage (0-100)', (value: string) => parseFloat(value))
  .option('--priority-min <priority>', 'Minimum priority (1-10)', (value: string) => parseInt(value, 10))
  .option('--priority-max <priority>', 'Maximum priority (1-10)', (value: string) => parseInt(value, 10))
  .option('--tags <tags>', 'Filter by tags (comma-separated)', (value: string) => value.split(','))
  .option('--performance-min <score>', 'Minimum performance score (0-100)', (value: string) => parseFloat(value))
  .option('--performance-max <score>', 'Maximum performance score (0-100)', (value: string) => parseFloat(value))
  .option('--sort-by <field>', 'Sort by field (name|progress|successRate|priority|startedAt|elapsedTimeMin)', 'name')
  .option('--sort-order <order>', 'Sort order (asc|desc)', 'asc')
  .option('--limit <number>', 'Limit number of records', (value: string) => parseInt(value, 10))
  .option('--offset <number>', 'Offset for pagination', (value: string) => parseInt(value, 10))
  .option('--include-inactive', 'Include inactive activities', false)
  .option('--no-completed', 'Exclude completed activities', false)
  .option('--no-failed', 'Exclude failed activities', false)
  .option('--no-metadata', 'Exclude metadata', false)
  .option('--no-resident-summaries', 'Exclude resident summaries', false)
  .option('--no-location-summaries', 'Exclude location summaries', false)
  .option('--sample', 'Generate sample data instead of loading from store', false)
  .option('--sample-size <size>', 'Number of sample records to generate', '50', (value: string) => parseInt(value, 10))
  .option('--no-telemetry', 'Disable telemetry events')
  .option('--telemetry-dir <dir>', 'Telemetry output directory', 'test-results')
  .option('--verbose', 'Enable verbose logging');

// === Main Command Implementation ===

program.action(async (options) => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting Activity HUD KPI Export...');
    console.log(`📊 Format: ${options.format}`);
    console.log(`🔍 Filters:`, getFilterSummary(options));
    
    // Parse and validate options
    const filters = parseFilters(options);
    const exportOptions = parseExportOptions(options);
    
    console.log(`⚙️ Export options:`, {
      format: exportOptions.format,
      sortBy: exportOptions.sortBy,
      sortOrder: exportOptions.sortOrder,
      limit: exportOptions.limit,
    });
    
    // Generate or load data
    const exportData = options.sample 
      ? await generateSampleData(filters, exportOptions, options.sampleSize)
      : await loadFromStore(filters, exportOptions);
    
    console.log(`📦 Generated/loaded ${exportData.activities.length} activities`);
    console.log(`👥 ${exportData.residentSummaries.length} resident summaries`);
    console.log(`📍 ${exportData.locationSummaries.length} location summaries`);
    
    // Apply sorting and pagination
    const processedData = applySortingAndPagination(exportData, exportOptions);
    
    // Export data
    const exportResult = await exportData(processedData, exportOptions, options);
    console.log(`📄 Exported: ${exportResult.filePath}`);
    
    // Generate telemetry
    if (!options.noTelemetry) {
      await generateTelemetry(processedData, startTime, exportResult, filters, exportOptions, options);
    }
    
    console.log('✅ Export completed successfully!');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
});

// === Helper Functions ===

/**
 * Gets a summary of active filters for logging.
 */
function getFilterSummary(options: any): string {
  const filters = [];
  if (options.activityTypes) filters.push(`types:${options.activityTypes.join(',')}`);
  if (options.activityStatuses) filters.push(`statuses:${options.activityStatuses.join(',')}`);
  if (options.locationIds) filters.push(`locations:${options.locationIds.join(',')}`);
  if (options.residentIds) filters.push(`residents:${options.residentIds.join(',')}`);
  if (options.progressMin !== undefined || options.progressMax !== undefined) {
    filters.push(`progress:${options.progressMin || 0}-${options.progressMax || 100}`);
  }
  if (options.successRateMin !== undefined || options.successRateMax !== undefined) {
    filters.push(`success:${options.successRateMin || 0}-${options.successRateMax || 100}`);
  }
  if (options.priorityMin !== undefined || options.priorityMax !== undefined) {
    filters.push(`priority:${options.priorityMin || 1}-${options.priorityMax || 10}`);
  }
  if (options.tags) filters.push(`tags:${options.tags.join(',')}`);
  if (options.performanceMin !== undefined || options.performanceMax !== undefined) {
    filters.push(`performance:${options.performanceMin || 0}-${options.performanceMax || 100}`);
  }
  return filters.length > 0 ? filters.join(', ') : 'none';
}

/**
 * Parses CLI options into filter configuration.
 */
function parseFilters(options: any): ActivityHUDKPIFilter {
  const filterConfig = {
    activityTypes: options.activityTypes,
    activityStatuses: options.activityStatuses,
    locationIds: options.locationIds,
    residentIds: options.residentIds,
    progressRange: {
      min: options.progressMin,
      max: options.progressMax,
    },
    successRateRange: {
      min: options.successRateMin,
      max: options.successRateMax,
    },
    priorityRange: {
      min: options.priorityMin,
      max: options.priorityMax,
    },
    tags: options.tags,
    performanceScoreRange: {
      min: options.performanceMin,
      max: options.performanceMax,
    },
  };
  
  // Remove undefined values
  Object.keys(filterConfig).forEach(key => {
    const value = (filterConfig as any)[key];
    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach(subKey => {
        if (value[subKey] === undefined) {
          delete value[subKey];
        }
      });
      if (Object.keys(value).length === 0) {
        delete (filterConfig as any)[key];
      }
    } else if (value === undefined) {
      delete (filterConfig as any)[key];
    }
  });
  
  return validateActivityHUDKPIFilter(filterConfig);
}

/**
 * Parses CLI options into export configuration.
 */
function parseExportOptions(options: any): ActivityHUDKPIExportOptions {
  const exportConfig = {
    format: options.format as 'json' | 'csv',
    includeMetadata: !options.noMetadata,
    includeResidentSummaries: !options.noResidentSummaries,
    includeLocationSummaries: !options.noLocationSummaries,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
    limit: options.limit,
    offset: options.offset,
    includeInactive: options.includeInactive,
    includeCompleted: !options.noCompleted,
    includeFailed: !options.noFailed,
  };
  
  return validateActivityHUDKPIExportOptions(exportConfig);
}

/**
 * Generates sample data for testing.
 */
async function generateSampleData(
  filters: ActivityHUDKPIFilter,
  exportOptions: ActivityHUDKPIExportOptions,
  sampleSize: number
): Promise<ActivityHUDKPIExport> {
  console.log(`🎲 Generating ${sampleSize} sample records...`);
  
  const activities: ActivityKPI[] = [];
  const residentSummaries: ResidentActivitySummary[] = [];
  const locationSummaries: LocationActivitySummary[] = [];
  
  const activityTypes = ['job', 'quest', 'maintenance', 'exploration', 'social', 'training'] as const;
  const activityStatuses = ['idle', 'active', 'paused', 'completed', 'failed', 'cancelled'] as const;
  const locations = ['village-square', 'forest', 'mine', 'farm', 'workshop', 'temple'];
  const residents = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  
  // Generate activities
  for (let i = 0; i < sampleSize; i++) {
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const activityStatus = activityStatuses[Math.floor(Math.random() * activityStatuses.length)];
    const locationId = locations[Math.floor(Math.random() * locations.length)];
    
    const activity = createDefaultActivityKPI({
      id: `activity-${i + 1}`,
      name: `Sample Activity ${i + 1}`,
      type: activityType,
      status: activityStatus,
      locationId,
      locationName: locationId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      assignedResidents: residents.slice(0, Math.floor(Math.random() * 3) + 1),
      assignedResidentNames: residents.slice(0, Math.floor(Math.random() * 3) + 1),
      progress: Math.random() * 100,
      estimatedTimeRemainingMin: Math.floor(Math.random() * 120),
      elapsedTimeMin: Math.floor(Math.random() * 60),
      successRate: Math.random() * 100,
      dropSuccessRate: Math.random() * 100,
      totalDrops: Math.floor(Math.random() * 20),
      successfulDrops: Math.floor(Math.random() * 15),
      failedDrops: Math.floor(Math.random() * 5),
      priority: Math.floor(Math.random() * 10) + 1,
      tags: ['sample', 'test', activityType],
      startedAt: Date.now() - Math.floor(Math.random() * 86400000), // Last 24 hours
      lastUpdated: Date.now() - Math.floor(Math.random() * 3600000), // Last hour
      completedAt: activityStatus === 'completed' ? Date.now() - Math.floor(Math.random() * 3600000) : null,
      performanceScore: Math.random() * 100,
      efficiencyScore: Math.random() * 100,
    });
    
    activities.push(activity);
  }
  
  // Generate resident summaries
  for (const resident of residents) {
    const residentActivities = activities.filter(a => a.assignedResidents.includes(resident));
    const completedActivities = residentActivities.filter(a => a.status === 'completed');
    const failedActivities = residentActivities.filter(a => a.status === 'failed');
    
    residentSummaries.push({
      id: resident.toLowerCase(),
      name: resident,
      currentActivityId: residentActivities.find(a => a.status === 'active')?.id || null,
      currentActivityName: residentActivities.find(a => a.status === 'active')?.name || null,
      totalCompleted: completedActivities.length,
      totalFailed: failedActivities.length,
      averageSuccessRate: residentActivities.length > 0 
        ? residentActivities.reduce((sum, a) => sum + a.successRate, 0) / residentActivities.length 
        : 0,
      averageCompletionTimeMin: completedActivities.length > 0
        ? completedActivities.reduce((sum, a) => sum + a.elapsedTimeMin, 0) / completedActivities.length
        : 0,
      currentFatigue: Math.random() * 100,
      currentHappiness: Math.random() * 100,
      activeSkills: ['strength', 'agility', 'intelligence'].slice(0, Math.floor(Math.random() * 3) + 1),
      performanceTrend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any,
    });
  }
  
  // Generate location summaries
  for (const locationId of locations) {
    const locationActivities = activities.filter(a => a.locationId === locationId);
    const activeActivities = locationActivities.filter(a => a.status === 'active');
    
    locationSummaries.push({
      id: locationId,
      name: locationId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: locationId.includes('village') ? 'village' : 
            locationId.includes('forest') ? 'forest' :
            locationId.includes('mine') ? 'mine' :
            locationId.includes('farm') ? 'farm' :
            locationId.includes('workshop') ? 'workshop' : 'temple',
      totalActivities: locationActivities.length,
      activeActivities: activeActivities.length,
      averageSuccessRate: locationActivities.length > 0
        ? locationActivities.reduce((sum, a) => sum + a.successRate, 0) / locationActivities.length
        : 0,
      utilizationRate: (activeActivities.length / Math.max(locationActivities.length, 1)) * 100,
      dominantActivityType: activityTypes[Math.floor(Math.random() * activityTypes.length)],
      efficiencyScore: Math.random() * 100,
    });
  }
  
  // Calculate summary statistics
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
  const totalActiveResidents = residentSummaries.filter(r => r.currentActivityId).length;
  const totalUtilizedLocations = locationSummaries.filter(l => l.activeActivities > 0).length;
  const globalEfficiencyScore = (overallSuccessRate + overallDropSuccessRate) / 2;
  
  return {
    exportMetadata: {
      exportedAt: Date.now(),
      version: '1.0.0',
      source: 'sample-generator',
      format: exportOptions.format,
      totalRecords: activities.length,
    },
    summary: {
      totalActiveActivities,
      totalCompletedActivities,
      overallSuccessRate,
      overallDropSuccessRate,
      averageActivityDurationMin,
      totalActiveResidents,
      totalUtilizedLocations,
      globalEfficiencyScore,
    },
    activities,
    residentSummaries,
    locationSummaries,
  };
}

/**
 * Loads data from the Active HUD store.
 * Note: This is a placeholder - actual implementation would depend on store structure.
 */
async function loadFromStore(
  filters: ActivityHUDKPIFilter,
  exportOptions: ActivityHUDKPIExportOptions
): Promise<ActivityHUDKPIExport> {
  console.log('📦 Loading data from Active HUD store (not yet implemented)');
  
  // Placeholder implementation - generate sample data
  return await generateSampleData(filters, exportOptions, 25);
}

/**
 * Applies sorting and pagination to export data.
 */
function applySortingAndPagination(
  data: ActivityHUDKPIExport,
  options: ActivityHUDKPIExportOptions
): ActivityHUDKPIExport {
  let activities = [...data.activities];
  
  // Apply sorting
  activities.sort((a, b) => {
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
  
  // Apply pagination
  if (options.offset > 0) {
    activities = activities.slice(options.offset);
  }
  if (options.limit) {
    activities = activities.slice(0, options.limit);
  }
  
  return {
    ...data,
    activities,
    exportMetadata: {
      ...data.exportMetadata,
      totalRecords: activities.length,
    },
  };
}

/**
 * Exports data to file.
 */
async function exportData(
  data: ActivityHUDKPIExport,
  options: ActivityHUDKPIExportOptions,
  cliOptions: any
): Promise<{ filePath: string; fileSize: number }> {
  // Ensure output directory exists
  await mkdir(cliOptions.outputDir, { recursive: true });
  
  let output: string;
  let fileName: string;
  
  if (options.format === 'csv') {
    output = generateCSVExport(data, options);
    fileName = `activity-hud-kpi-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  } else {
    output = JSON.stringify(data, null, 2);
    fileName = `activity-hud-kpi-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  }
  
  // Write to file
  const filePath = cliOptions.output 
    ? cliOptions.output
    : join(cliOptions.outputDir, fileName);
  
  await writeFile(filePath, output, 'utf-8');
  
  return {
    filePath,
    fileSize: Buffer.byteLength(output, 'utf-8'),
  };
}

/**
 * Generates CSV export format.
 */
function generateCSVExport(data: ActivityHUDKPIExport, options: ActivityHUDKPIExportOptions): string {
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

/**
 * Generates telemetry event for export.
 */
async function generateTelemetry(
  data: ActivityHUDKPIExport,
  startTime: number,
  exportResult: { filePath: string; fileSize: number },
  filters: ActivityHUDKPIFilter,
  options: ActivityHUDKPIExportOptions,
  cliOptions: any
): Promise<void> {
  const telemetryDir = cliOptions.telemetryDir;
  await mkdir(telemetryDir, { recursive: true });
  
  const exportDuration = Date.now() - startTime;
  
  const telemetry: ActivityHUDExportedTelemetry = createActivityHUDExportedTelemetry(
    data,
    exportDuration,
    exportResult.fileSize,
    filters,
    options,
    {
      dataCollectionTimeMs: exportDuration * 0.3,
      processingTimeMs: exportDuration * 0.4,
      exportTimeMs: exportDuration * 0.3,
      memoryUsageMB: 25.5, // Placeholder
    }
  );
  
  const telemetryFile = join(telemetryDir, `activity-hud-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(telemetryFile, JSON.stringify(telemetry, null, 2), 'utf-8');
  
  console.log(`📊 Generated telemetry: ${telemetryFile}`);
}

// === CLI Execution ===

if (require.main === module) {
  program.parse();
}

export { program as activityHudExportCLI };
