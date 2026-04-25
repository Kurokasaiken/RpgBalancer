/**
 * Drop Validation Telemetry Export Functionality
 * 
 * Provides export utilities for drop validation telemetry data in multiple formats.
 * Supports JSON, Markdown, and CSV exports with customizable filtering and formatting.
 * 
 * @since NP-067
 * @author Coordinator-Bot – Analytics
 */

import type { DropValidationTelemetryExport, ExportConfig } from './dropValidationTelemetryExportSchema';
import type { DropValidationTelemetryCollector } from './dropValidationTelemetryCollector';

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'markdown' | 'csv';

/**
 * Export options for formatting
 */
export interface ExportOptions {
  /** Include raw events */
  includeRawEvents?: boolean;
  /** Include detailed breakdowns */
  includeBreakdowns?: boolean;
  /** Include charts data */
  includeCharts?: boolean;
  /** Date format for timestamps */
  dateFormat?: 'iso' | 'readable';
  /** Number precision for metrics */
  precision?: number;
  /** Include export metadata */
  includeMetadata?: boolean;
}

/**
 * Export result with file information
 */
export interface ExportResult {
  /** Success status */
  success: boolean;
  /** Exported content */
  content: string;
  /** File extension */
  extension: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** Export duration in milliseconds */
  duration: number;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Drop Validation Telemetry Exporter
 * 
 * Handles exporting drop validation telemetry data in multiple formats.
 * Provides comprehensive formatting options and error handling.
 */
export class DropValidationTelemetryExporter {
  private collector: DropValidationTelemetryCollector;

  constructor(collector: DropValidationTelemetryCollector) {
    this.collector = collector;
  }

  /**
   * Format timestamp for export
   */
  private formatTimestamp(timestamp: number, format: 'iso' | 'readable' = 'iso'): string {
    if (format === 'iso') {
      return new Date(timestamp).toISOString();
    } else {
      return new Date(timestamp).toLocaleString();
    }
  }

  /**
   * Format number with precision
   */
  private formatNumber(value: number, precision: number = 2): string {
    return value.toFixed(precision);
  }

  /**
   * Export data to JSON format
   */
  async exportToJson(data: DropValidationTelemetryExport, options: ExportOptions = {}): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      // Create export data with options applied
      const exportData = { ...data };
      
      if (!options.includeRawEvents) {
        exportData.rawEvents = undefined;
      }
      
      if (!options.includeBreakdowns) {
        exportData.residentBreakdown = [];
        exportData.activityBreakdown = [];
        exportData.timeBreakdown = [];
      }
      
      const content = JSON.stringify(exportData, null, 2);
      const fileSize = new Blob([content]).size;
      const duration = Date.now() - startTime;

      return {
        success: true,
        content,
        extension: 'json',
        mimeType: 'application/json',
        fileSize,
        duration,
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        extension: 'json',
        mimeType: 'application/json',
        fileSize: 0,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Export data to Markdown format
   */
  async exportToMarkdown(data: DropValidationTelemetryExport, options: ExportOptions = {}): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      const lines: string[] = [];
      
      // Header
      lines.push('# Drop Validation Telemetry Export');
      lines.push('');
      
      if (options.includeMetadata) {
        lines.push('## Export Metadata');
        lines.push('');
        lines.push(`**Exported At:** ${this.formatTimestamp(data.metadata.exportedAt, 'readable')}`);
        lines.push(`**Version:** ${data.metadata.version}`);
        lines.push(`**Source:** ${data.metadata.source}`);
        lines.push(`**Collection Period:** ${this.formatTimestamp(data.metadata.collectionPeriod.startTimestamp, 'readable')} - ${this.formatTimestamp(data.metadata.collectionPeriod.endTimestamp, 'readable')}`);
        lines.push(`**Duration:** ${this.formatDuration(data.metadata.collectionPeriod.duration)}`);
        lines.push(`**Total Events:** ${data.metadata.collectionPeriod.eventCount}`);
        lines.push('');
      }

      // Session Summary
      lines.push('## Session Summary');
      lines.push('');
      lines.push(`**Total Sessions:** ${data.sessionSummary.totalSessions}`);
      lines.push(`**Unique Users:** ${data.sessionSummary.uniqueUsers}`);
      lines.push(`**Average Session Duration:** ${this.formatDuration(data.sessionSummary.sessionDurations.average)}`);
      lines.push(`**Min Session Duration:** ${this.formatDuration(data.sessionSummary.sessionDurations.min)}`);
      lines.push(`**Max Session Duration:** ${this.formatDuration(data.sessionSummary.sessionDurations.max)}`);
      lines.push('');

      // Key Metrics
      lines.push('## Key Metrics');
      lines.push('');
      
      // Drop Validation Metrics
      lines.push('### Drop Validation');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push(`| Total Drops | ${data.metrics.dropValidation.totalDrops} |`);
      lines.push(`| Successful Drops | ${data.metrics.dropValidation.successfulDrops} |`);
      lines.push(`| Failed Drops | ${data.metrics.dropValidation.failedDrops} |`);
      lines.push(`| Success Rate | ${this.formatNumber(data.metrics.dropValidation.successRate)}% |`);
      lines.push(`| Average Drop Time | ${this.formatNumber(data.metrics.dropValidation.averageDropTime)}ms |`);
      lines.push('');

      // Feedback Interaction Metrics
      lines.push('### Feedback Interaction');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push(`| Total Feedback Shown | ${data.metrics.feedbackInteraction.totalFeedbackShown} |`);
      lines.push(`| Total Interactions | ${data.metrics.feedbackInteraction.totalInteractions} |`);
      lines.push(`| Interaction Rate | ${this.formatNumber(data.metrics.feedbackInteraction.interactionRate)}% |`);
      lines.push(`| Average Time to Interact | ${this.formatNumber(data.metrics.feedbackInteraction.averageTimeToInteract)}ms |`);
      lines.push('');

      // AI Suggestion Metrics
      lines.push('### AI Suggestions');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push(`| Total Suggestions | ${data.metrics.aiSuggestions.totalSuggestions} |`);
      lines.push(`| Accepted Suggestions | ${data.metrics.aiSuggestions.acceptedSuggestions} |`);
      lines.push(`| Rejected Suggestions | ${data.metrics.aiSuggestions.rejectedSuggestions} |`);
      lines.push(`| Acceptance Rate | ${this.formatNumber(data.metrics.aiSuggestions.acceptanceRate)}% |`);
      lines.push(`| Average Confidence | ${this.formatNumber(data.metrics.aiSuggestions.averageConfidence)} |`);
      lines.push('');

      // Performance Metrics
      lines.push('### Performance');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push(`| Average Validation Time | ${this.formatNumber(data.metrics.performance.averageValidationTime)}ms |`);
      lines.push(`| Average Suggestion Time | ${this.formatNumber(data.metrics.performance.averageSuggestionTime)}ms |`);
      lines.push(`| Memory Usage | ${this.formatNumber(data.metrics.performance.memoryUsage / 1024 / 1024, 2)}MB |`);
      lines.push(`| Cache Hit Rate | ${this.formatNumber(data.metrics.performance.cacheHitRate)}% |`);
      lines.push(`| Error Rate | ${this.formatNumber(data.metrics.performance.errorRate)}% |`);
      lines.push('');

      // Validation Failures
      if (Object.keys(data.metrics.dropValidation.validationFailures).length > 0) {
        lines.push('### Validation Failures');
        lines.push('');
        lines.push('| Rule | Count |');
        lines.push('|------|-------|');
        for (const [rule, count] of Object.entries(data.metrics.dropValidation.validationFailures)) {
          lines.push(`| ${rule} | ${count} |`);
        }
        lines.push('');
      }

      // Feedback Type Breakdown
      if (Object.keys(data.metrics.feedbackInteraction.feedbackTypeBreakdown).length > 0) {
        lines.push('### Feedback Type Breakdown');
        lines.push('');
        lines.push('| Type | Count |');
        lines.push('|------|-------|');
        for (const [type, count] of Object.entries(data.metrics.feedbackInteraction.feedbackTypeBreakdown)) {
          lines.push(`| ${type} | ${count} |`);
        }
        lines.push('');
      }

      // Resident Breakdown
      if (options.includeBreakdowns && data.residentBreakdown.length > 0) {
        lines.push('## Resident Breakdown');
        lines.push('');
        lines.push('| Resident ID | Drops | Success Rate | Most Common Activities | Avg Fatigue |');
        lines.push('|------------|-------|-------------|---------------------|------------|');
        
        for (const resident of data.residentBreakdown.slice(0, 20)) {
          lines.push(`| ${resident.residentId} | ${resident.dropCount} | ${this.formatNumber(resident.successRate)}% | ${resident.mostCommonActivities.slice(0, 3).join(', ')} | ${this.formatNumber(resident.averageFatigueLevel)} |`);
        }
        lines.push('');
      }

      // Activity Breakdown
      if (options.includeBreakdowns && data.activityBreakdown.length > 0) {
        lines.push('## Activity Breakdown');
        lines.push('');
        lines.push('| Activity ID | Drops | Success Rate | Most Common Residents | Avg Crew Utilization |');
        lines.push('|------------|-------|-------------|----------------------|-------------------|');
        
        for (const activity of data.activityBreakdown.slice(0, 20)) {
          lines.push(`| ${activity.activityId} | ${activity.dropCount} | ${this.formatNumber(activity.successRate)}% | ${activity.mostCommonResidents.slice(0, 3).join(', ')} | ${this.formatNumber(activity.averageCrewUtilization)}% |`);
        }
        lines.push('');
      }

      // Time Breakdown
      if (options.includeBreakdowns && data.timeBreakdown.length > 0) {
        lines.push('## Time-Based Breakdown');
        lines.push('');
        lines.push('| Period | Events | Duration | Events/Sec |');
        lines.push('|--------|--------|----------|-----------|');
        
        for (const period of data.timeBreakdown.slice(0, 24)) {
          const startTime = this.formatTimestamp(period.startTimestamp, 'readable');
          lines.push(`| ${startTime} | ${period.eventCount} | ${this.formatDuration(period.duration)} | ${this.formatNumber(period.eventsPerSecond)} |`);
        }
        lines.push('');
      }

      // Export Statistics
      if (options.includeMetadata) {
        lines.push('## Export Statistics');
        lines.push('');
        lines.push(`**Total Events:** ${data.exportStats.totalEvents}`);
        lines.push(`**Events Exported:** ${data.exportStats.eventsExported}`);
        lines.push(`**File Size:** ${this.formatFileSize(data.exportStats.fileSize)}`);
        lines.push(`**Export Duration:** ${data.exportStats.exportDuration}ms`);
        lines.push('');
      }

      const content = lines.join('\n');
      const fileSize = new Blob([content]).size;
      const duration = Date.now() - startTime;

      return {
        success: true,
        content,
        extension: 'md',
        mimeType: 'text/markdown',
        fileSize,
        duration,
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        extension: 'md',
        mimeType: 'text/markdown',
        fileSize: 0,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Export data to CSV format
   */
  async exportToCsv(data: DropValidationTelemetryExport, options: ExportOptions = {}): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      const lines: string[] = [];
      
      // Header
      lines.push('Export Field,Value');
      lines.push('Exported At,' + this.formatTimestamp(data.metadata.exportedAt, 'readable'));
      lines.push('Version,' + data.metadata.version);
      lines.push('Source,' + data.metadata.source);
      lines.push('Total Sessions,' + data.sessionSummary.totalSessions);
      lines.push('Unique Users,' + data.sessionSummary.uniqueUsers);
      lines.push('Total Drops,' + data.metrics.dropValidation.totalDrops);
      lines.push('Successful Drops,' + data.metrics.dropValidation.successfulDrops);
      lines.push('Failed Drops,' + data.metrics.dropValidation.failedDrops);
      lines.push('Success Rate,' + this.formatNumber(data.metrics.dropValidation.successRate));
      lines.push('Average Drop Time,' + this.formatNumber(data.metrics.dropValidation.averageDropTime));
      lines.push('Total Feedback Shown,' + data.metrics.feedbackInteraction.totalFeedbackShown);
      lines.push('Total Interactions,' + data.metrics.feedbackInteraction.totalInteractions);
      lines.push('Interaction Rate,' + this.formatNumber(data.metrics.feedbackInteraction.interactionRate));
      lines.push('Average Time to Interact,' + this.formatNumber(data.metrics.feedbackInteraction.averageTimeToInteract));
      lines.push('Total Suggestions,' + data.metrics.aiSuggestions.totalSuggestions);
      lines.push('Accepted Suggestions,' + data.metrics.aiSuggestions.acceptedSuggestions);
      lines.push('Rejected Suggestions,' + data.metrics.aiSuggestions.rejectedSuggestions);
      lines.push('Acceptance Rate,' + this.formatNumber(data.metrics.aiSuggestions.acceptanceRate));
      lines.push('Average Confidence,' + this.formatNumber(data.metrics.aiSuggestions.averageConfidence));
      lines.push('Average Validation Time,' + this.formatNumber(data.metrics.performance.averageValidationTime));
      lines.push('Average Suggestion Time,' + this.formatNumber(data.metrics.performance.averageSuggestionTime));
      lines.push('Memory Usage (MB),' + this.formatNumber(data.metrics.performance.memoryUsage / 1024 / 1024));
      lines.push('Cache Hit Rate,' + this.formatNumber(data.metrics.performance.cacheHitRate));
      lines.push('Error Rate,' + this.formatNumber(data.metrics.performance.errorRate));
      lines.push('Total Events,' + data.exportStats.totalEvents);
      lines.push('Events Exported,' + data.exportStats.eventsExported);
      lines.push('File Size (bytes),' + data.exportStats.fileSize);
      lines.push('Export Duration (ms),' + data.exportStats.exportDuration);

      // Validation Failures
      for (const [rule, count] of Object.entries(data.metrics.dropValidation.validationFailures)) {
        lines.push(`Validation Failure - ${rule},${count}`);
      }

      // Feedback Type Breakdown
      for (const [type, count] of Object.entries(data.metrics.feedbackInteraction.feedbackTypeBreakdown)) {
        lines.push(`Feedback Type - ${type},${count}`);
      }

      // Resident Breakdown
      if (options.includeBreakdowns) {
        for (const resident of data.residentBreakdown) {
          lines.push(`Resident - ${resident.residentId},${resident.dropCount},${this.formatNumber(resident.successRate)},${resident.mostCommonActivities.join(';')},${this.formatNumber(resident.averageFatigueLevel)}`);
        }
      }

      // Activity Breakdown
      if (options.includeBreakdowns) {
        for (const activity of data.activityBreakdown) {
          lines.push(`Activity - ${activity.activityId},${activity.dropCount},${this.formatNumber(activity.successRate)},${activity.mostCommonResidents.join(';')},${this.formatNumber(activity.averageCrewUtilization)}`);
        }
      }

      // Time Breakdown
      if (options.includeBreakdowns) {
        for (const period of data.timeBreakdown) {
          const startTime = this.formatTimestamp(period.startTimestamp, 'readable');
          lines.push(`Period - ${startTime},${period.eventCount},${this.formatDuration(period.duration)},${this.formatNumber(period.eventsPerSecond)}`);
        }
      }

      const content = lines.join('\n');
      const fileSize = new Blob([content]).size;
      const duration = Date.now() - startTime;

      return {
        success: true,
        content,
        extension: 'csv',
        mimeType: 'text/csv',
        fileSize,
        duration,
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        extension: 'csv',
        mimeType: 'text/csv',
        fileSize: 0,
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(duration: number): string {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format file size in human-readable format
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${this.formatNumber(size)} ${units[unitIndex]}`;
  }

  /**
   * Export data with automatic format detection
   */
  async export(data: DropValidationTelemetryExport, format: ExportFormat, options: ExportOptions = {}): Promise<ExportResult> {
    switch (format) {
      case 'json':
        return this.exportToJson(data, options);
      case 'markdown':
        return this.exportToMarkdown(data, options);
      case 'csv':
        return this.exportToCsv(data, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export data and save to file
   */
  async exportToFile(
    data: DropValidationTelemetryExport,
    format: ExportFormat,
    filePath: string,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const result = await this.export(data, format, options);
    
    if (!result.success) {
      return result;
    }

    try {
      // In a real implementation, this would save to file system
      // For now, we'll just return the content for the caller to save
      console.log(`Would save to ${filePath}:`);
      console.log(`Content preview: ${result.content.substring(0, 200)}...`);
      
      return result;
    } catch (error) {
      return {
        success: false,
        content: '',
        extension: result.extension,
        mimeType: result.mimeType,
        fileSize: 0,
        duration: result.duration,
        error: `Failed to save file: ${(error as Error).message}`,
      };
    }
  }
}

/**
 * Utility functions for export operations
 */
export const DropValidationTelemetryExportUtils = {
  /**
   * Create default export options
   */
  createDefaultOptions(): ExportOptions {
    return {
      includeRawEvents: false,
      includeBreakdowns: true,
      includeCharts: false,
      dateFormat: 'readable',
      precision: 2,
      includeMetadata: true,
    };
  },

  /**
   * Validate export configuration
   */
  validateExportConfig(config: any): boolean {
    return config && 
           typeof config.format === 'string' &&
           ['json', 'markdown', 'csv'].includes(config.format);
  },

  /**
   * Get file extension for format
   */
  getFileExtension(format: ExportFormat): string {
    switch (format) {
      case 'json': return '.json';
      case 'markdown': return '.md';
      case 'csv': return '.csv';
      default: return '.txt';
    }
  },

  /**
   * Get MIME type for format
   */
  getMimeType(format: ExportFormat): string {
    switch (format) {
      case 'json': return 'application/json';
      case 'markdown': return 'text/markdown';
      case 'csv': return 'text/csv';
      default: return 'text/plain';
    }
  },
};
