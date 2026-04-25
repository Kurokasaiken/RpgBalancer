/**
 * Marginal Utility Report Exporter
 * 
 * Comprehensive export system for Phase 10.5 marginal utility analysis reports.
 * Supports JSON, CSV, and Markdown export formats with schema validation,
 * file download, and metadata tracking.
 */

import type { 
  MarginalUtilityAnalysis, 
  ExportData, 
  ExportFormat,
  SimulationBatch,
  MarginalUtilityMetrics,
  SynergyAnalysis
} from './MarginalUtilityTypes';
import type { MarginalUtilityConfig } from '../config/stressTesting/marginalUtilityConfig';
import { DEFAULT_MARGINAL_UTILITY_CONFIG } from '../config/stressTesting/marginalUtilityConfig';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';

/**
 * Export configuration options
 */
export interface ExportConfig {
  /** Export format */
  format: ExportFormat;
  /** Include raw simulation data */
  includeRawData: boolean;
  /** Include metadata and configuration */
  includeMetadata: boolean;
  /** CSV delimiter (for CSV format) */
  csvDelimiter: string;
  /** Number formatting precision */
  precision: number;
  /** Include confidence intervals */
  includeConfidenceIntervals: boolean;
  /** Include statistical significance tests */
  includeSignificanceTests: boolean;
  /** Custom filename template */
  filenameTemplate?: string;
}

/**
 * Export result with metadata
 */
export interface ExportResult {
  /** Exported content as string */
  content: string;
  /** Generated filename */
  filename: string;
  /** File size in bytes */
  fileSize: number;
  /** Export format */
  format: ExportFormat;
  /** Export timestamp */
  timestamp: number;
  /** Export metadata */
  metadata: {
    exportDuration: number;
    recordCount: number;
    formatVersion: string;
    checksum: string;
  };
}

/**
 * Validation schema for export data
 */
export interface ExportSchema {
  /** Schema version */
  version: string;
  /** Required fields */
  required: string[];
  /** Field types */
  fieldTypes: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object'>;
  /** Validation rules */
  validation: Record<string, {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  }>;
}

/**
 * Marginal Utility Report Exporter
 */
export class MarginalUtilityReportExporter {
  private config: ExportConfig;
  private diagnostics = createHeadlessDiagnostics('MarginalUtilityExporter');

  constructor(config: Partial<ExportConfig> = {}) {
    this.config = {
      format: 'json',
      includeRawData: false,
      includeMetadata: true,
      csvDelimiter: ',',
      precision: 4,
      includeConfidenceIntervals: true,
      includeSignificanceTests: true,
      ...config,
    };
  }

  /**
   * Export analysis results to specified format
   */
  async exportAnalysis(
    analysis: MarginalUtilityAnalysis,
    customConfig?: Partial<ExportConfig>
  ): Promise<ExportResult> {
    const startTime = Date.now();
    const exportConfig = { ...this.config, ...customConfig };
    
    this.diagnostics.info(`Starting export to ${exportConfig.format} format`);

    try {
      let content: string;
      let filename: string;

      switch (exportConfig.format) {
        case 'json':
          ({ content, filename } = this.exportToJSON(analysis, exportConfig));
          break;
        case 'csv':
          ({ content, filename } = this.exportToCSV(analysis, exportConfig));
          break;
        case 'markdown':
          ({ content, filename } = this.exportToMarkdown(analysis, exportConfig));
          break;
        default:
          throw new Error(`Unsupported export format: ${exportConfig.format}`);
      }

      const exportDuration = Date.now() - startTime;
      const fileSize = new Blob([content]).size;
      const checksum = this.calculateChecksum(content);

      const result: ExportResult = {
        content,
        filename,
        fileSize,
        format: exportConfig.format,
        timestamp: Date.now(),
        metadata: {
          exportDuration,
          recordCount: this.calculateRecordCount(analysis),
          formatVersion: '1.0.0',
          checksum,
        },
      };

      this.diagnostics.info(`Export completed: ${filename} (${fileSize} bytes, ${exportDuration}ms)`);
      return result;

    } catch (error) {
      this.diagnostics.error('Export failed', error);
      throw error;
    }
  }

  /**
   * Export to JSON format with schema validation
   */
  private exportToJSON(
    analysis: MarginalUtilityAnalysis,
    config: ExportConfig
  ): { content: string; filename: string } {
    const exportData: ExportData = {
      format: 'json',
      exportedAt: new Date().toISOString(),
      analysis: this.sanitizeAnalysisForJSON(analysis, config),
      metadata: {
        version: '1.0.0',
        config: DEFAULT_MARGINAL_UTILITY_CONFIG,
        exportPath: this.generateFilename('json', config),
      },
    };

    // Validate against schema
    this.validateExportData(exportData, this.getJSONSchema());

    const content = JSON.stringify(exportData, null, 2);
    const filename = this.generateFilename('json', config);

    return { content, filename };
  }

  /**
   * Export to CSV format with proper formatting
   */
  private exportToCSV(
    analysis: MarginalUtilityAnalysis,
    config: ExportConfig
  ): { content: string; filename: string } {
    const lines: string[] = [];

    // Add header metadata as comments
    if (config.includeMetadata) {
      lines.push('# Marginal Utility Analysis Export');
      lines.push(`# Generated: ${new Date().toISOString()}`);
      lines.push(`# Analysis ID: ${analysis.id}`);
      lines.push(`# Total Simulations: ${analysis.summary.totalSimulations.toLocaleString()}`);
      lines.push(`# Runtime: ${analysis.summary.totalRuntimeMs}ms`);
      lines.push('');
    }

    // Stat Metrics Table
    lines.push('# Stat Metrics');
    const statHeaders = [
      'Rank',
      'Stat ID',
      'Win Rate',
      'Std Deviation',
      'Matchup Count',
      'Best Opponent',
      'Best Win Rate',
      'Worst Opponent',
      'Worst Win Rate',
      'Confidence Lower',
      'Confidence Upper',
    ];

    if (config.includeConfidenceIntervals) {
      lines.push(statHeaders.join(config.csvDelimiter));
      
      for (const metric of analysis.statMetrics) {
        const row = [
          metric.ranking.toString(),
          metric.statId,
          metric.avgWinRate.toFixed(config.precision),
          metric.stdDeviation.toFixed(config.precision),
          metric.matchupCount.toString(),
          metric.bestMatchup.opponentStat,
          metric.bestMatchup.winRate.toFixed(config.precision),
          metric.worstMatchup.opponentStat,
          metric.worstMatchup.winRate.toFixed(config.precision),
          metric.confidenceInterval.lower.toFixed(config.precision),
          metric.confidenceInterval.upper.toFixed(config.precision),
        ];
        lines.push(row.join(config.csvDelimiter));
      }
    } else {
      // Exclude confidence intervals
      const headersWithoutCI = statHeaders.filter(h => !h.includes('Confidence'));
      lines.push(headersWithoutCI.join(config.csvDelimiter));
      
      for (const metric of analysis.statMetrics) {
        const row = [
          metric.ranking.toString(),
          metric.statId,
          metric.avgWinRate.toFixed(config.precision),
          metric.stdDeviation.toFixed(config.precision),
          metric.matchupCount.toString(),
          metric.bestMatchup.opponentStat,
          metric.bestMatchup.winRate.toFixed(config.precision),
          metric.worstMatchup.opponentStat,
          metric.worstMatchup.winRate.toFixed(config.precision),
        ];
        lines.push(row.join(config.csvDelimiter));
      }
    }

    lines.push('');

    // Synergy Analysis Table
    lines.push('# Synergy Analysis');
    const synergyHeaders = [
      'Pair ID',
      'Stat A',
      'Stat B',
      'Observed Win Rate',
      'Expected Win Rate',
      'Synergy Multiplier',
      'Is OP Synergy',
      'Is Weak Synergy',
      'Is Significant',
    ];

    if (config.includeSignificanceTests) {
      synergyHeaders.push('P-Value', 'Effect Size');
      lines.push(synergyHeaders.join(config.csvDelimiter));
      
      for (const synergy of analysis.synergyAnalyses) {
        const row = [
          synergy.pairId,
          synergy.statIds[0],
          synergy.statIds[1],
          synergy.observedWinRate.toFixed(config.precision),
          synergy.expectedWinRate.toFixed(config.precision),
          synergy.synergyMultiplier.toFixed(config.precision),
          synergy.isOpSynergy.toString(),
          synergy.isWeakSynergy.toString(),
          synergy.isSignificant.toString(),
          synergy.pValue.toFixed(config.precision),
          synergy.effectSize.toFixed(config.precision),
        ];
        lines.push(row.join(config.csvDelimiter));
      }
    } else {
      lines.push(synergyHeaders.join(config.csvDelimiter));
      
      for (const synergy of analysis.synergyAnalyses) {
        const row = [
          synergy.pairId,
          synergy.statIds[0],
          synergy.statIds[1],
          synergy.observedWinRate.toFixed(config.precision),
          synergy.expectedWinRate.toFixed(config.precision),
          synergy.synergyMultiplier.toFixed(config.precision),
          synergy.isOpSynergy.toString(),
          synergy.isWeakSynergy.toString(),
          synergy.isSignificant.toString(),
        ];
        lines.push(row.join(config.csvDelimiter));
      }
    }

    // Summary Statistics
    lines.push('');
    lines.push('# Summary Statistics');
    const summaryHeaders = ['Metric', 'Value'];
    lines.push(summaryHeaders.join(config.csvDelimiter));
    
    const summaryRows = [
      ['Total Simulations', analysis.summary.totalSimulations.toString()],
      ['Total Runtime (ms)', analysis.summary.totalRuntimeMs.toString()],
      ['Avg Simulations/Second', analysis.summary.avgSimulationsPerSecond.toFixed(2)],
      ['OP Synergies Count', analysis.summary.opSynergiesCount.toString()],
      ['Weak Synergies Count', analysis.summary.weakSynergiesCount.toString()],
      ['Significant Synergies Count', analysis.summary.significantSynergiesCount.toString()],
      ['Stat Metrics Count', analysis.statMetrics.length.toString()],
      ['Synergy Analyses Count', analysis.synergyAnalyses.length.toString()],
    ];

    for (const [metric, value] of summaryRows) {
      lines.push([metric, value].join(config.csvDelimiter));
    }

    const content = lines.join('\n');
    const filename = this.generateFilename('csv', config);

    return { content, filename };
  }

  /**
   * Export to Markdown format with tables and formatting
   */
  private exportToMarkdown(
    analysis: MarginalUtilityAnalysis,
    config: ExportConfig
  ): { content: string; filename: string } {
    const lines: string[] = [];

    // Header
    lines.push('# Marginal Utility Analysis Report');
    lines.push('');
    lines.push('## Overview');
    lines.push(`**Analysis ID:** \`${analysis.id}\``);
    lines.push(`**Generated:** ${new Date(analysis.timestamp).toLocaleString()}`);
    lines.push(`**Total Simulations:** ${analysis.summary.totalSimulations.toLocaleString()}`);
    lines.push(`**Runtime:** ${analysis.summary.totalRuntimeMs}ms`);
    lines.push(`**Performance:** ${analysis.summary.avgSimulationsPerSecond.toFixed(2)} simulations/second`);
    lines.push('');

    // Executive Summary
    lines.push('## Executive Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| OP Synergies | **${analysis.summary.opSynergiesCount}** |`);
    lines.push(`| Weak Synergies | **${analysis.summary.weakSynergiesCount}** |`);
    lines.push(`| Significant Synergies | **${analysis.summary.significantSynergiesCount}** |`);
    lines.push(`| Stats Analyzed | **${analysis.statMetrics.length}** |`);
    lines.push(`| Pair Combinations | **${analysis.synergyAnalyses.length}** |`);
    lines.push('');

    // Configuration
    if (config.includeMetadata) {
      lines.push('## Analysis Configuration');
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify(analysis.config, null, 2));
      lines.push('```');
      lines.push('');
    }

    // Stat Rankings
    lines.push('## Stat Performance Rankings');
    lines.push('');
    lines.push('Stats ranked by average win rate against all other stats:');
    lines.push('');

    const statTableHeaders = ['Rank', 'Stat', 'Win Rate', 'Std Dev', 'Best vs', 'Worst vs'];
    if (config.includeConfidenceIntervals) {
      statTableHeaders.push('95% CI');
    }
    
    lines.push('| ' + statTableHeaders.join(' | ') + ' |');
    lines.push('| ' + statTableHeaders.map(() => '---').join(' | ') + ' |');

    for (const metric of analysis.statMetrics.sort((a, b) => a.ranking - b.ranking)) {
      const row = [
        metric.ranking.toString(),
        `\`${metric.statId}\``,
        `${(metric.avgWinRate * 100).toFixed(1)}%`,
        metric.stdDeviation.toFixed(config.precision),
        `${metric.bestMatchup.opponentStat} (${(metric.bestMatchup.winRate * 100).toFixed(1)}%)`,
        `${metric.worstMatchup.opponentStat} (${(metric.worstMatchup.winRate * 100).toFixed(1)}%)`,
      ];

      if (config.includeConfidenceIntervals) {
        row.push(`[${(metric.confidenceInterval.lower * 100).toFixed(1)}%, ${(metric.confidenceInterval.upper * 100).toFixed(1)}%]`);
      }

      lines.push('| ' + row.join(' | ') + ' |');
    }
    lines.push('');

    // Synergy Analysis
    lines.push('## Synergy Analysis');
    lines.push('');
    lines.push('Stat pair combinations showing synergistic effects:');
    lines.push('');

    const synergyTableHeaders = ['Pair', 'Observed', 'Expected', 'Multiplier', 'Type'];
    if (config.includeSignificanceTests) {
      synergyTableHeaders.push('P-Value', 'Effect Size');
    }

    lines.push('| ' + synergyTableHeaders.join(' | ') + ' |');
    lines.push('| ' + synergyTableHeaders.map(() => '---').join(' | ') + ' |');

    // Sort synergies by multiplier (OP first)
    const sortedSynergies = analysis.synergyAnalyses.sort((a, b) => b.synergyMultiplier - a.synergyMultiplier);

    for (const synergy of sortedSynergies) {
      const type = synergy.isOpSynergy ? '🔥 **OP**' : synergy.isWeakSynergy ? '⚠️ **Weak**' : 'Normal';
      const row = [
        `\`${synergy.statIds.join(' + ')}\``,
        `${(synergy.observedWinRate * 100).toFixed(1)}%`,
        `${(synergy.expectedWinRate * 100).toFixed(1)}%`,
        synergy.synergyMultiplier.toFixed(config.precision),
        type,
      ];

      if (config.includeSignificanceTests) {
        row.push(
          synergy.pValue < 0.05 ? `**${synergy.pValue.toFixed(4)}**` : synergy.pValue.toFixed(4),
          synergy.effectSize.toFixed(config.precision)
        );
      }

      lines.push('| ' + row.join(' | ') + ' |');
    }
    lines.push('');

    // Key Insights
    lines.push('## Key Insights');
    lines.push('');
    
    // Top performing stats
    const topStats = analysis.statMetrics.slice(0, 3);
    lines.push(`### 🏆 Top Performing Stats`);
    for (const stat of topStats) {
      lines.push(`- **${stat.statId}**: ${(stat.avgWinRate * 100).toFixed(1)}% win rate`);
    }
    lines.push('');

    // OP Synergies
    const opSynergies = analysis.synergyAnalyses.filter(s => s.isOpSynergy);
    if (opSynergies.length > 0) {
      lines.push(`### 🔥 Overpowered Synergies (${opSynergies.length})`);
      for (const synergy of opSynergies.slice(0, 5)) {
        lines.push(`- **${synergy.statIds.join(' + ')}**: ${synergy.synergyMultiplier.toFixed(2)}x multiplier`);
      }
      lines.push('');
    }

    // Weak Synergies
    const weakSynergies = analysis.synergyAnalyses.filter(s => s.isWeakSynergy);
    if (weakSynergies.length > 0) {
      lines.push(`### ⚠️ Weak Synergies (${weakSynergies.length})`);
      for (const synergy of weakSynergies.slice(0, 5)) {
        lines.push(`- **${synergy.statIds.join(' + ')}**: ${synergy.synergyMultiplier.toFixed(2)}x multiplier`);
      }
      lines.push('');
    }

    // Statistical Notes
    if (config.includeSignificanceTests) {
      lines.push('## Statistical Notes');
      lines.push('');
      lines.push('- **Significance Threshold**: p < 0.05');
      lines.push(`- **Significant Synergies**: ${analysis.summary.significantSynergiesCount}/${analysis.synergyAnalyses.length}`);
      lines.push(`- **OP Threshold**: > ${DEFAULT_MARGINAL_UTILITY_CONFIG.thresholds.opThreshold}x multiplier`);
      lines.push(`- **Weak Threshold**: < ${DEFAULT_MARGINAL_UTILITY_CONFIG.thresholds.weakThreshold}x multiplier`);
      lines.push('');
    }

    // Footer
    lines.push('---');
    lines.push(`*Report generated by Marginal Utility Report Exporter v1.0.0*`);
    lines.push(`*Export format: Markdown | Timestamp: ${new Date().toISOString()}*`);

    const content = lines.join('\n');
    const filename = this.generateFilename('md', config);

    return { content, filename };
  }

  /**
   * Sanitize analysis data for JSON export
   */
  private sanitizeAnalysisForJSON(
    analysis: MarginalUtilityAnalysis,
    config: ExportConfig
  ): Partial<MarginalUtilityAnalysis> {
    const sanitized: Partial<MarginalUtilityAnalysis> = {
      id: analysis.id,
      config: analysis.config,
      statMetrics: analysis.statMetrics.map(metric => ({
        ...metric,
        avgWinRate: Number(metric.avgWinRate.toFixed(config.precision)),
        stdDeviation: Number(metric.stdDeviation.toFixed(config.precision)),
        bestMatchup: {
          ...metric.bestMatchup,
          winRate: Number(metric.bestMatchup.winRate.toFixed(config.precision)),
        },
        worstMatchup: {
          ...metric.worstMatchup,
          winRate: Number(metric.worstMatchup.winRate.toFixed(config.precision)),
        },
        confidenceInterval: {
          lower: Number(metric.confidenceInterval.lower.toFixed(config.precision)),
          upper: Number(metric.confidenceInterval.upper.toFixed(config.precision)),
        },
      })),
      synergyAnalyses: analysis.synergyAnalyses.map(synergy => ({
        ...synergy,
        observedWinRate: Number(synergy.observedWinRate.toFixed(config.precision)),
        expectedWinRate: Number(synergy.expectedWinRate.toFixed(config.precision)),
        synergyMultiplier: Number(synergy.synergyMultiplier.toFixed(config.precision)),
        pValue: Number(synergy.pValue.toFixed(config.precision)),
        effectSize: Number(synergy.effectSize.toFixed(config.precision)),
      })),
      summary: analysis.summary,
      timestamp: analysis.timestamp,
    };

    return sanitized;
  }

  /**
   * Generate filename based on format and configuration
   */
  private generateFilename(format: ExportFormat, config: ExportConfig): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = config.filenameTemplate || 'marginal-utility-analysis';
    return `${baseName}-${timestamp}.${format}`;
  }

  /**
   * Validate export data against schema
   */
  private validateExportData(data: ExportData, schema: ExportSchema): void {
    // Basic validation
    if (!data.analysis || !data.analysis.id) {
      throw new Error('Invalid export data: missing analysis ID');
    }

    if (!data.analysis.statMetrics || data.analysis.statMetrics.length === 0) {
      throw new Error('Invalid export data: no stat metrics found');
    }

    if (!data.analysis.synergyAnalyses) {
      throw new Error('Invalid export data: no synergy analyses found');
    }

    // Validate stat metrics
    for (const metric of data.analysis.statMetrics) {
      if (!metric.statId || typeof metric.avgWinRate !== 'number') {
        throw new Error(`Invalid stat metric: ${JSON.stringify(metric)}`);
      }
    }

    // Validate synergy analyses
    for (const synergy of data.analysis.synergyAnalyses) {
      if (!synergy.pairId || !Array.isArray(synergy.statIds)) {
        throw new Error(`Invalid synergy analysis: ${JSON.stringify(synergy)}`);
      }
    }
  }

  /**
   * Get JSON schema for validation
   */
  private getJSONSchema(): ExportSchema {
    return {
      version: '1.0.0',
      required: ['format', 'exportedAt', 'analysis', 'metadata'],
      fieldTypes: {
        format: 'string',
        exportedAt: 'string',
        analysis: 'object',
        metadata: 'object',
      },
      validation: {
        format: { enum: ['json', 'csv', 'markdown'] },
        exportedAt: { pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}' },
      },
    };
  }

  /**
   * Calculate checksum for content integrity
   */
  private calculateChecksum(content: string): string {
    // Simple checksum implementation
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Calculate total record count for metadata
   */
  private calculateRecordCount(analysis: MarginalUtilityAnalysis): number {
    return analysis.statMetrics.length + analysis.synergyAnalyses.length;
  }

  /**
   * Download file to user's computer
   */
  async downloadFile(result: ExportResult): Promise<void> {
    try {
      const blob = new Blob([result.content], { 
        type: this.getMimeType(result.format) 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.diagnostics.info(`File downloaded: ${result.filename}`);
    } catch (error) {
      this.diagnostics.error('File download failed', error);
      throw error;
    }
  }

  /**
   * Get MIME type for export format
   */
  private getMimeType(format: ExportFormat): string {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'markdown':
        return 'text/markdown';
      default:
        return 'text/plain';
    }
  }

  /**
   * Export and download in one operation
   */
  async exportAndDownload(
    analysis: MarginalUtilityAnalysis,
    customConfig?: Partial<ExportConfig>
  ): Promise<ExportResult> {
    const result = await this.exportAnalysis(analysis, customConfig);
    await this.downloadFile(result);
    return result;
  }

  /**
   * Batch export to multiple formats
   */
  async batchExport(
    analysis: MarginalUtilityAnalysis,
    formats: ExportFormat[],
    customConfig?: Partial<ExportConfig>
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    
    for (const format of formats) {
      const result = await this.exportAnalysis(analysis, { ...customConfig, format });
      results.push(result);
    }

    this.diagnostics.info(`Batch export completed: ${formats.join(', ')}`);
    return results;
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): ExportFormat[] {
    return ['json', 'csv', 'markdown'];
  }

  /**
   * Get default configuration
   */
  getDefaultConfig(): ExportConfig {
    return { ...this.config };
  }
}

/**
 * Convenience function for quick export
 */
export async function exportMarginalUtilityReport(
  analysis: MarginalUtilityAnalysis,
  format: ExportFormat = 'json',
  options?: Partial<ExportConfig>
): Promise<ExportResult> {
  const exporter = new MarginalUtilityReportExporter({ format, ...options });
  return exporter.exportAnalysis(analysis);
}

/**
 * Convenience function for export and download
 */
export async function exportAndDownloadReport(
  analysis: MarginalUtilityAnalysis,
  format: ExportFormat = 'json',
  options?: Partial<ExportConfig>
): Promise<ExportResult> {
  const exporter = new MarginalUtilityReportExporter({ format, ...options });
  return exporter.exportAndDownload(analysis);
}
