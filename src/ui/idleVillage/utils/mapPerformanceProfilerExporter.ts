/**
 * Map Performance Profiler Exporter - NP-024
 * 
 * Export utilities for the Idle Village Map Performance Profiler.
 * Provides CSV and JSON export functionality with customizable formatting.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type MapPerformanceProfilerConfig,
  type PerformanceMetrics,
  type FramePerformanceEntry,
  type PerformanceStatistics,
  type PerformanceRecommendation,
  PerformanceMetricType,
  formatPerformanceValue,
  formatTimestamp,
} from '../config/mapPerformanceProfilerConfig';

const diagnostics = createSandboxDiagnostics('MapPerformanceProfilerExporter', 'exporter');

/**
 * Export format types
 */
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx',
}

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  includeHeaders: boolean;
  includeRecommendations: boolean;
  includeTimestamps: boolean;
  maxRecords: number;
  compression: boolean;
  dateFormat: string;
  timeFormat: string;
  decimalPlaces: number;
  filename: string;
}

/**
 * Export data structure
 */
export interface ExportData {
  entries: FramePerformanceEntry[];
  statistics: PerformanceStatistics;
  recommendations: PerformanceRecommendation[];
  config: MapPerformanceProfilerConfig;
  timestamp: number;
  metadata: {
    version: string;
    generatedAt: number;
    totalRecords: number;
    exportFormat: ExportFormat;
    compression: boolean;
  };
}

/**
 * Performance profiler exporter
 */
export class MapPerformanceProfilerExporter {
  private config: MapPerformanceProfilerConfig;

  constructor(config?: Partial<MapPerformanceProfilerConfig>) {
    this.config = {
      ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
      ...config,
    };
  }

  /**
   * Export performance data to CSV
   */
  public exportToCSV(
    data: ExportData,
    options?: Partial<ExportOptions>
  ): string {
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    const headers = [
      'timestamp',
      'frameNumber',
      'duration',
      'fps',
      'frameTime',
      'memoryUsage',
      'cpuUsage',
      'renderTime',
      'scriptTime',
      'paintTime',
      'layoutShift',
      'longTasks',
      'interactionDelay',
      'networkRequests',
      'animationFrameDrops',
      'jank',
      'severity',
      'recommendations',
    ];

    const rows: string[][] = [headers];

    // Add data rows
    const entries = data.entries.slice(0, exportOptions.maxRecords);
    
    entries.forEach(entry => {
      const row = [
        exportOptions.includeTimestamps ? formatTimestamp(entry.timestamp) : '',
        entry.frameNumber.toString(),
        entry.duration.toFixed(exportOptions.decimalPlaces),
        formatPerformanceValue(PerformanceMetricType.FPS, entry.metrics.fps),
        formatPerformanceValue(PerformanceMetricType.FRAME_TIME, entry.metrics.frameTime),
        formatPerformanceValue(PerformanceMetricType.MEMORY_USAGE, entry.metrics.memoryUsage),
        formatPerformanceValue(PerformanceMetricType.CPU_USAGE, entry.metrics.cpuUsage),
        formatPerformanceValue(PerformanceMetricType.RENDER_TIME, entry.metrics.renderTime),
        formatPerformanceValue(PerformanceMetricType.SCRIPT_TIME, entry.metrics.scriptTime),
        formatPerformanceValue(PerformanceMetricType.PAINT_TIME, entry.metrics.paintTime),
        formatPerformanceValue(PerformanceMetricType.LAYOUT_SHIFT, entry.metrics.layoutShift),
        formatPerformanceValue(PerformanceMetricType.LONG_TASKS, entry.metrics.longTasks),
        formatPerformanceValue(PerformanceMetricType.INTERACTION_DELAY, entry.metrics.interactionDelay),
        formatPerformanceValue(PerformanceMetricType.NETWORK_REQUESTS, entry.metrics.networkRequests),
        formatPerformanceValue(PerformanceMetricType.ANIMATION_FRAME_DROPS, entry.metrics.animationFrameDrops),
        formatPerformanceValue(PerformanceMetricType.JANK, entry.metrics.junk),
        entry.severity,
        exportOptions.includeRecommendations ? entry.recommendations.map(r => r.title).join(';') : '',
      ];
      
      rows.push(row);
    });

    // Convert to CSV string
    const csvContent = rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if needed
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');

    return csvContent;
  }

  /**
   * Export performance data to JSON
   */
  public exportToJSON(
    data: ExportData,
    options?: Partial<ExportOptions>
  ): string {
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    const exportData = {
      metadata: {
        version: '1.0.0',
        generatedAt: Date.now(),
        totalRecords: data.entries.length,
        exportFormat: ExportFormat.JSON,
        compression: exportOptions.compression,
      },
      config: data.config,
      statistics: data.statistics,
      recommendations: exportOptions.includeRecommendations ? data.recommendations : [],
      entries: data.entries.slice(0, exportOptions.maxRecords),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export performance data to XLSX (placeholder)
   */
  public exportToXLSX(
    data: ExportData,
    options?: Partial<ExportOptions>
  ): ArrayBuffer {
    // This would require a library like xlsx
    // For now, return empty ArrayBuffer
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    diagnostics.warn('XLSX export not implemented yet', {
      records: data.entries.length,
      compression: exportOptions.compression,
    });

    return new ArrayBuffer();
  }

  /**
   * Export performance data with format auto-detection
   */
  public export(
    data: ExportData,
    options?: Partial<ExportOptions>
  ): string | ArrayBuffer {
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    switch (exportOptions.format) {
      case ExportFormat.CSV:
        return this.exportToCSV(data, exportOptions);
      case ExportFormat.JSON:
        return this.exportToJSON(data, exportOptions);
      case ExportFormat.XLSX:
        return this.exportToXLSX(data, exportOptions);
      default:
        throw new Error(`Unsupported export format: ${exportOptions.format}`);
    }
  }

  /**
   * Export statistics summary
   */
  public exportStatisticsSummary(
    statistics: PerformanceStatistics,
    options?: Partial<ExportOptions>
  ): string {
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    const summary = {
      timestamp: Date.now(),
      sessionDuration: statistics.sessionDuration,
      totalFrames: statistics.totalFrames,
      averageFps: statistics.averageFps,
      averageFrameTime: statistics.averageFrameTime,
      maxFrameTime: statistics.maxFrameTime,
      minFrameTime: statistics.minFrameTime,
      p95FrameTime: statistics.p95FrameTime,
      p99FrameTime: statistics.p99FrameTime,
      averageMemoryUsage: statistics.averageMemoryUsage,
      peakMemoryUsage: statistics.peakMemoryUsage,
      averageCpuUsage: statistics.averageCpuUsage,
      totalJank: statistics.totalJank,
      totalLongTasks: statistics.totalLongTasks,
      totalAnimationDrops: statistics.totalAnimationDrops,
      recommendations: statistics.recommendations,
    };

    return JSON.stringify(summary, null, 2);
  }

  /**
   * Export performance recommendations
   */
  public exportRecommendations(
    recommendations: PerformanceRecommendation[],
    options?: Partial<ExportOptions>
  ): string {
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    const recommendationsData = {
      timestamp: Date.now(),
      totalRecommendations: recommendations.length,
      recommendations: recommendations.map(r => ({
        id: r.id,
        type: r.type,
        severity: r.severity,
        title: r.title,
        description: r.description,
        suggestion: r.suggestion,
        impact: r.impact,
        automated: r.automated,
        applied: r.applied,
      })),
    };

    return JSON.stringify(recommendationsData, null, 2);
  }

  /**
   * Export performance metrics time series
   */
  public exportTimeSeries(
    entries: FramePerformanceEntry[],
    options?: Partial<ExportOptions>
  ): string {
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    const timeSeriesData = {
      metadata: {
        version: '1.0.0',
        generatedAt: Date.now(),
        totalRecords: entries.length,
        exportFormat: ExportFormat.JSON,
        type: 'time_series',
      },
      entries: entries.map(entry => ({
        timestamp: entry.timestamp,
        frameNumber: entry.frameNumber,
        metrics: entry.metrics,
        severity: entry.severity,
      })),
    };

    return JSON.stringify(timeSeriesData, null, 2);
  }

  /**
   * Export performance metrics as chart data
   */
  public exportChartData(
    entries: FramePerformanceEntry[],
    options?: Partial<ExportOptions>
  ): string {
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    const chartData = {
      metadata: {
        version: '1.0.0',
        generatedAt: Date.now(),
        totalRecords: entries.length,
        exportFormat: ExportFormat.JSON,
        type: 'chart_data',
      },
      datasets: {
        fps: entries.map(entry => ({
          x: entry.timestamp,
          y: entry.metrics.fps,
        })),
        frameTime: entries.map(entry => ({
          x: entry.timestamp,
          y: entry.metrics.frameTime,
        })),
        memoryUsage: entries.map(entry => ({
          x: entry.timestamp,
          y: entry.metrics.memoryUsage,
        })),
        cpuUsage: entries.map(entry => ({
          x: entry.timestamp,
          y: entry.metrics.cpuUsage,
        })),
      },
    };

    return JSON.stringify(chartData, null, 2);
  }

  /**
   * Export performance metrics as table data
   */
  public exportTableData(
    entries: FramePerformanceEntry[],
    options?: Partial<ExportOptions>
  ): string {
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    const tableData = {
      metadata: {
        version: '1.0.0',
        generatedAt: Date.now(),
        totalRecords: entries.length,
        exportFormat: ExportFormat.JSON,
        type: 'table_data',
      },
      columns: [
        { key: 'timestamp', label: 'Timestamp', type: 'datetime' },
        { key: 'frameNumber', label: 'Frame', type: 'number' },
        { key: 'fps', label: 'FPS', type: 'number' },
        { key: 'frameTime', label: 'Frame Time (ms)', type: 'number' },
        { key: 'memoryUsage', label: 'Memory (MB)', type: 'number' },
        { key: 'cpuUsage', label: 'CPU (%)', type: 'number' },
        { key: 'renderTime', label: 'Render Time (ms)', type: 'number' },
        { key: 'scriptTime', label: 'Script Time (ms)', type: 'number' },
        { key: 'paintTime', label: 'Paint Time (ms)', type: 'number' },
        { key: 'layoutShift', label: 'Layout Shift', type: 'number' },
        { key: 'longTasks', label: 'Long Tasks', type: 'number' },
        { key: 'interactionDelay', label: 'Interaction Delay (ms)', type: 'number' },
        { key: 'networkRequests', label: 'Network Requests', type: 'number' },
        { key: 'animationFrameDrops', label: 'Animation Drops', type: 'number' },
        { key: 'jank', label: 'Jank (%)', type: 'number' },
        { key: 'severity', label: 'Severity', type: 'string' },
      ],
      rows: entries.map(entry => ({
        timestamp: entry.timestamp,
        frameNumber: entry.frameNumber,
        fps: entry.metrics.fps,
        frameTime: entry.metrics.frameTime,
        memoryUsage: entry.metrics.memoryUsage,
        cpuUsage: entry.metrics.cpuUsage,
        renderTime: entry.metrics.renderTime,
        scriptTime: entry.metrics.scriptTime,
        paintTime: entry.metrics.paintTime,
        layoutShift: entry.metrics.layoutShift,
        longTasks: entry.metrics.longTasks,
        interactionDelay: entry.metrics.interactionDelay,
        networkRequests: entry.metrics.networkRequests,
        animationFrameDrops: entry.metrics.animationFrameDrops,
        jank: entry.metrics.junk,
        severity: entry.severity,
      })),
    };

    return JSON.stringify(tableData, null, 2);
  }

  /**
   * Export performance metrics as aggregated data
   */
  public exportAggregatedData(
    entries: FramePerformanceEntry[],
    options?: Partial<ExportOptions>
  ): string {
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    // Calculate aggregated metrics
    const aggregatedData = {
      metadata: {
        version: '1.0.0',
        generatedAt: Date.now(),
        totalRecords: entries.length,
        exportFormat: ExportFormat.JSON,
        type: 'aggregated_data',
      },
      timeRange: {
        start: entries.length > 0 ? entries[0].timestamp : 0,
        end: entries.length > 0 ? entries[entries.length - 1].timestamp : 0,
        duration: entries.length > 0 ? 
          entries[entries.length - 1].timestamp - entries[0].timestamp : 0,
      },
      metrics: {
        fps: {
          min: Math.min(...entries.map(e => e.metrics.fps)),
          max: Math.max(...entries.map(e => e.metrics.fps)),
          average: entries.reduce((sum, e) => sum + e.metrics.fps, 0) / entries.length,
          median: this.calculateMedian(entries.map(e => e.metrics.fps)),
          p95: this.calculatePercentile(entries.map(e => e.metrics.fps), 95),
          p99: this.calculatePercentile(entries.map(e => e.metrics.fps), 99),
        },
        frameTime: {
          min: Math.min(...entries.map(e => e.metrics.frameTime)),
          max: Math.max(...entries.map(e => e.metrics.frameTime)),
          average: entries.reduce((sum, e) => sum + e.metrics.frameTime, 0) / entries.length,
          median: this.calculateMedian(entries.map(e => e.metrics.frameTime)),
          p95: this.calculatePercentile(entries.map(e => e.metrics.frameTime), 95),
          p99: this.calculatePercentile(entries.map(e => e.metrics.frameTime), 99),
        },
        memoryUsage: {
          min: Math.min(...entries.map(e => e.metrics.memoryUsage)),
          max: Math.max(...entries.map(e => e.metrics.memoryUsage)),
          average: entries.reduce((sum, e) => sum + e.metrics.memoryUsage, 0) / entries.length,
          median: this.calculateMedian(entries.map(e => e.metrics.memoryUsage)),
          p95: this.calculatePercentile(entries.map(e => e.metrics.memoryUsage), 95),
          p99: this.calculatePercentile(entries.map(e => e.metrics.memoryUsage), 99),
        },
        cpuUsage: {
          min: Math.min(...entries.map(e => e.metrics.cpuUsage)),
          max: Math.max(...entries.map(e => e.metrics.cpuUsage)),
          average: entries.reduce((sum, e) => sum + e.metrics.cpuUsage, 0) / entries.length,
          median: this.calculateMedian(entries.map(e => e.metrics.cpuUsage)),
          p95: this.calculatePercentile(entries.map(e => e.metrics.cpuUsage), 95),
          p99: this.calculatePercentile(entries.map(e => e.metrics.cpuUsage), 99),
        },
      },
    };

    return JSON.stringify(aggregatedData, null, 2);
  }

  /**
   * Calculate median value
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid];
  }

  /**
   * Calculate percentile value
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Generate filename for export
   */
  public generateFilename(
    format: ExportFormat,
    customName?: string
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = customName || this.config.export.filename;
    return `${name}-${timestamp}.${format}`;
  }

  /**
   * Download file to user's computer
   */
  public downloadFile(
    content: string | ArrayBuffer,
    filename: string,
    mimeType?: string
  ): void {
    const blob = new Blob([content], { 
      type: mimeType || 'text/plain' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    diagnostics.info('File downloaded successfully', { filename });
  }

  /**
   * Export and download file
   */
  public exportAndDownload(
    data: ExportData,
    options?: Partial<ExportOptions>
  ): void {
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    try {
      const content = this.export(data, exportOptions);
      const filename = this.generateFilename(exportOptions.format, exportOptions.filename);
      
      this.downloadFile(content, filename);
      
      diagnostics.info('Export completed successfully', {
        format: exportOptions.format,
        filename,
        records: data.entries.length,
      });
    } catch (error) {
      diagnostics.error('Export failed', { error });
      throw error;
    }
  }

  /**
   * Export performance report
   */
  public exportPerformanceReport(
    data: ExportData,
    options?: Partial<ExportOptions>
  ): string {
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    const report = {
      metadata: {
        version: '1.0.0',
        generatedAt: Date.now(),
        exportFormat: ExportFormat.JSON,
        type: 'performance_report',
      },
      summary: {
        sessionDuration: data.statistics.sessionDuration,
        totalFrames: data.statistics.totalFrames,
        averageFps: data.statistics.averageFps,
        averageFrameTime: data.statistics.averageFrameTime,
        maxFrameTime: data.statistics.maxFrameTime,
        minFrameTime: data.statistics.minFrameTime,
        p95FrameTime: data.statistics.p95FrameTime,
        p99FrameTime: data.statistics.p99FrameTime,
        averageMemoryUsage: data.statistics.averageMemoryUsage,
        peakMemoryUsage: data.statistics.peakMemoryUsage,
        averageCpuUsage: data.statistics.averageCpuUsage,
        totalJank: data.statistics.totalJank,
        totalLongTasks: data.statistics.totalLongTasks,
        totalAnimationDrops: data.statistics.totalAnimationDrops,
      },
      recommendations: data.recommendations,
      config: data.config,
      entries: data.entries.slice(0, exportOptions.maxRecords),
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Export performance metrics as CSV with custom headers
   */
  public exportToCSVWithCustomHeaders(
    data: ExportData,
    customHeaders: string[],
    valueFormatters?: Record<string, (value: any) => string>,
    options?: Partial<ExportOptions>
  ): string {
    const exportOptions = {
      ...this.config.export,
      ...options,
    };

    const rows: string[][] = [customHeaders];

    const entries = data.entries.slice(0, exportOptions.maxRecords);
    
    entries.forEach(entry => {
      const row = customHeaders.map(header => {
        const formatter = valueFormatters?.[header];
        const value = this.getValueByHeader(entry, header);
        return formatter ? formatter(value) : String(value);
      });
      
      rows.push(row);
    });

    const csvContent = rows.map(row => 
      row.map(cell => {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');

    return csvContent;
  }

  /**
   * Get value by header name
   */
  private getValueByHeader(entry: FramePerformanceEntry, header: string): any {
    switch (header.toLowerCase()) {
      case 'timestamp':
        return entry.timestamp;
      case 'framenumber':
        return entry.frameNumber;
      case 'duration':
        return entry.duration;
      case 'fps':
        return entry.metrics.fps;
      case 'frametime':
        return entry.metrics.frameTime;
      case 'memoryusage':
        return entry.metrics.memoryUsage;
      case 'cpuusage':
        return entry.metrics.cpuUsage;
      case 'rendertime':
        return entry.metrics.renderTime;
      case 'scripttime':
        return entry.metrics.scriptTime;
      case 'painttime':
        return entry.metrics.paintTime;
      case 'layoutshift':
        return entry.metrics.layoutShift;
      case 'longtasks':
        return entry.metrics.longTasks;
      case 'interactiondelay':
        return entry.metrics.interactionDelay;
      case 'networkrequests':
        return entry.metrics.networkRequests;
      case 'animationframedrops':
        return entry.metrics.animationFrameDrops;
      case 'jank':
        return entry.metrics.jank;
      case 'severity':
        return entry.severity;
      case 'recommendations':
        return entry.recommendations.map(r => r.title).join(';');
      default:
        return '';
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MapPerformanceProfilerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get configuration
   */
  public getConfig(): MapPerformanceProfilerConfig {
    return { ...this.config };
  }
}
