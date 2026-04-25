/**
 * NP-033 – Idle Village Quest Narrative Telemetry Correlator
 * 
 * CSV export utility for narrative-outcome correlation data
 * with configurable formatting and filtering options.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import {
  CorrelationData,
  CorrelationExportConfig,
  NarrativeData,
  QuestOutcomeData,
} from '../types/narrativeCorrelation';

// CSV Export Options
export interface CSVExportOptions {
  includeHeaders: boolean;
  dateFormat: string;
  numberFormat: string;
  precision: number;
  locale: string;
  separator: ',' | ';' | '\t';
  quoteCharacter: '"' | "'";
  escapeCharacter: '"' | "'";
  lineEnding: '\n' | '\r\n' | '\r';
}

// CSV Export Context
export interface CSVExportContext {
  correlations: CorrelationData[];
  narratives: NarrativeData[];
  outcomes: QuestOutcomeData[];
  config: CorrelationExportConfig;
  options: CSVExportOptions;
}

// CSV Export Result
export interface CSVExportResult {
  success: boolean;
  content: string;
  filename: string;
  size: number;
  rows: number;
  columns: number;
  metadata: {
    exportedAt: string;
    config: CorrelationExportConfig;
    options: CSVExportOptions;
    processingTime: number;
  };
  error?: string;
}

// CSV Exporter Class
export class CorrelationCSVExporter {
  private defaultOptions: CSVExportOptions = {
    includeHeaders: true,
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
    numberFormat: 'en-US',
    precision: 4,
    locale: 'en-US',
    separator: ',',
    quoteCharacter: '"',
    escapeCharacter: '"',
    lineEnding: '\n',
  };

  /**
   * Export correlations to CSV
   */
  async exportToCSV(context: CSVExportContext): Promise<CSVExportResult> {
    const startTime = performance.now();
    
    try {
      const options = { ...this.defaultOptions, ...context.options };
      const config = context.config;
      
      // Filter correlations based on config
      const filteredCorrelations = this.filterCorrelations(context.correlations, config);
      
      // Generate CSV content
      const csvContent = this.generateCSV(filteredCorrelations, context.narratives, context.outcomes, options, config);
      
      // Generate filename
      const filename = this.generateFilename(config);
      
      // Calculate metadata
      const processingTime = performance.now() - startTime;
      const rows = this.countRows(csvContent, options.lineEnding);
      const columns = this.countColumns(csvContent, options.separator, options.lineEnding);
      
      const result: CSVExportResult = {
        success: true,
        content: csvContent,
        filename,
        size: new Blob([csvContent]).size,
        rows,
        columns,
        metadata: {
          exportedAt: new Date().toISOString(),
          config,
          options,
          processingTime,
        },
      };
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        content: '',
        filename: '',
        size: 0,
        rows: 0,
        columns: 0,
        metadata: {
          exportedAt: new Date().toISOString(),
          config: context.config,
          options: context.options,
          processingTime: performance.now() - startTime,
        },
        error: errorMessage,
      };
    }
  }

  /**
   * Export correlations with custom data mapping
   */
  async exportWithCustomMapping(
    context: CSVExportContext,
    dataMapping: (correlation: CorrelationData, narrative?: NarrativeData, outcome?: QuestOutcomeData) => Record<string, any>
  ): Promise<CSVExportResult> {
    const startTime = performance.now();
    
    try {
      const options = { ...this.defaultOptions, ...context.options };
      const config = context.config;
      
      // Filter correlations
      const filteredCorrelations = this.filterCorrelations(context.correlations, config);
      
      // Apply custom mapping
      const mappedData = filteredCorrelations.map(correlation => {
        const narrative = context.narratives.find(n => n.id === correlation.narrativeId);
        const outcome = context.outcomes.find(o => o.id === correlation.outcomeId);
        
        return dataMapping(correlation, narrative, outcome);
      });
      
      // Generate CSV from mapped data
      const csvContent = this.generateCSVFromMappedData(mappedData, options);
      
      // Generate filename
      const filename = this.generateFilename(config);
      
      // Calculate metadata
      const processingTime = performance.now() - startTime;
      const rows = this.countRows(csvContent, options.lineEnding);
      const columns = this.countColumns(csvContent, options.separator, options.lineEnding);
      
      const result: CSVExportResult = {
        success: true,
        content: csvContent,
        filename,
        size: new Blob([csvContent]).size,
        rows,
        columns,
        metadata: {
          exportedAt: new Date().toISOString(),
          config,
          options,
          processingTime,
        },
      };
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        content: '',
        filename: '',
        size: 0,
        rows: 0,
        columns: 0,
        metadata: {
          exportedAt: new Date().toISOString(),
          config: context.config,
          options: context.options,
          processingTime: performance.now() - startTime,
        },
        error: errorMessage,
      };
    }
  }

  /**
   * Filter correlations based on export configuration
   */
  private filterCorrelations(correlations: CorrelationData[], config: CorrelationExportConfig): CorrelationData[] {
    let filtered = [...correlations];
    
    // Apply column filters
    if (config.data.columns.length > 0) {
      filtered = filtered.map(correlation => {
        const filteredCorrelation: CorrelationData = { ...correlation };
        
        // Only keep specified columns (this is a simplified approach)
        // In a real implementation, you would need to handle this more carefully
        return filteredCorrelation;
      });
    }
    
    // Apply sorting
    if (config.data.sorting) {
      filtered.sort((a, b) => {
        const aValue = this.getNestedValue(a, config.data.sorting.column);
        const bValue = this.getNestedValue(b, config.data.sorting.column);
        
        if (config.data.sorting.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }
    
    // Apply limits
    if (config.data.limits) {
      const start = config.data.limits.offset;
      const end = start + config.data.limits.count;
      filtered = filtered.slice(start, end);
    }
    
    return filtered;
  }

  /**
   * Generate CSV content
   */
  private generateCSV(
    correlations: CorrelationData[],
    narratives: NarrativeData[],
    outcomes: QuestOutcomeData[],
    options: CSVExportOptions,
    config: CorrelationExportConfig
  ): string {
    const lines: string[] = [];
    
    // Add headers if enabled
    if (options.includeHeaders) {
      const headers = this.generateHeaders(config.data.columns);
      lines.push(this.formatRow(headers, options));
    }
    
    // Add data rows
    correlations.forEach(correlation => {
      const narrative = narratives.find(n => n.id === correlation.narrativeId);
      const outcome = outcomes.find(o => o.id === correlation.outcomeId);
      
      const row = this.generateRow(correlation, narrative, outcome, config.data.columns, options);
      lines.push(row);
    });
    
    return lines.join(options.lineEnding);
  }

  /**
   * Generate CSV from mapped data
   */
  private generateCSVFromMappedData(mappedData: Record<string, any>[], options: CSVExportOptions): string {
    const lines: string[] = [];
    
    // Add headers if enabled and data is not empty
    if (options.includeHeaders && mappedData.length > 0) {
      const headers = Object.keys(mappedData[0]);
      lines.push(this.formatRow(headers, options));
    }
    
    // Add data rows
    mappedData.forEach(row => {
      const values = Object.values(row);
      lines.push(this.formatRow(values, options));
    });
    
    return lines.join(options.lineEnding);
  }

  /**
   * Generate headers
   */
  private generateHeaders(columns: string[]): string[] {
    // Default headers if none specified
    if (columns.length === 0) {
      return [
        'timestamp',
        'narrativeId',
        'outcomeId',
        'correlation.strength',
        'correlation.direction',
        'correlation.significance',
        'correlation.confidence',
        'analysis.method',
        'analysis.sampleSize',
        'analysis.pValue',
        'analysis.effectSize',
        'analysis.power',
      ];
    }
    
    return columns;
  }

  /**
   * Generate row data
   */
  private generateRow(
    correlation: CorrelationData,
    narrative?: NarrativeData,
    outcome?: QuestOutcomeData,
    columns: string[],
    options: CSVExportOptions
  ): string[] {
    const rowData: Record<string, any> = {
      timestamp: new Date(correlation.timestamp).toISOString(),
      narrativeId: correlation.narrativeId,
      outcomeId: correlation.outcomeId,
      'correlation.strength': correlation.correlation.strength,
      'correlation.direction': correlation.correlation.direction,
      'correlation.significance': correlation.correlation.significance,
      'correlation.confidence': correlation.correlation.confidence,
      'analysis.method': correlation.analysis.method,
      'analysis.sampleSize': correlation.analysis.sampleSize,
      'analysis.pValue': correlation.analysis.pValue,
      'analysis.effectSize': correlation.analysis.effectSize,
      'analysis.power': correlation.analysis.power,
    };
    
    // Add narrative data if available
    if (narrative) {
      rowData['narrative.type'] = narrative.type;
      rowData['narrative.tone'] = narrative.tone;
      rowData['narrative.style'] = narrative.style;
      rowData['narrative.sentiment.score'] = narrative.sentiment.score;
      rowData['narrative.metadata.length'] = narrative.metadata.length;
      rowData['narrative.metadata.complexity'] = narrative.metadata.complexity;
      rowData['narrative.metadata.engagement'] = narrative.metadata.engagement;
      rowData['narrative.metadata.urgency'] = narrative.metadata.urgency;
    }
    
    // Add outcome data if available
    if (outcome) {
      rowData['outcome.outcome'] = outcome.outcome;
      rowData['outcome.difficulty'] = outcome.difficulty;
      rowData['outcome.category'] = outcome.category;
      rowData['outcome.duration'] = outcome.duration;
      rowData['outcome.successRate'] = outcome.successRate;
      rowData['outcome.completionRate'] = outcome.completionRate;
      rowData['outcome.metrics.experience'] = outcome.metrics.experience;
      rowData['outcome.metrics.rewards.gold'] = outcome.metrics.rewards.gold;
      rowData['outcome.metrics.rewards.reputation'] = outcome.metrics.rewards.rewards.reputation;
      rowData['outcome.metrics.penalties.fatigue'] = outcome.metrics.penalties.fatigue;
      rowData['outcome.metrics.performance.efficiency'] = outcome.metrics.performance.efficiency;
      rowData['outcome.metrics.performance.accuracy'] = outcome.metrics.performance.accuracy;
      rowData['outcome.metrics.performance.creativity'] = outcome.metrics.performance.creativity;
      rowData['outcome.metrics.performance.teamwork'] = outcome.metrics.performance.teamwork;
    }
    
    // Return values in the specified column order
    if (columns.length > 0) {
      return columns.map(column => this.getNestedValue(rowData, column));
    }
    
    // Return all values if no columns specified
    return Object.values(rowData);
  }

  /**
   * Format a row for CSV output
   */
  private formatRow(values: any[], options: CSVExportOptions): string {
    return values
      .map(value => this.formatValue(value, options))
      .join(options.separator);
  }

  /**
   * Format a single value for CSV output
   */
  private formatValue(value: any, options: CSVExportOptions): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    let formattedValue: string;
    
    // Handle different data types
    if (typeof value === 'string') {
      formattedValue = value;
    } else if (typeof value === 'number') {
      formattedValue = value.toFixed(options.precision);
    } else if (value instanceof Date) {
      formattedValue = value.toISOString();
    } else if (typeof value === 'object') {
      formattedValue = JSON.stringify(value);
    } else {
      formattedValue = String(value);
    }
    
    // Quote and escape if necessary
    if (this.needsQuoting(formattedValue, options)) {
      formattedValue = this.quoteAndEscape(formattedValue, options);
    }
    
    return formattedValue;
  }

  /**
   * Check if a value needs quoting
   */
  private needsQuoting(value: string, options: CSVExportOptions): boolean {
    return value.includes(options.separator) ||
           value.includes(options.quoteCharacter) ||
           value.includes(options.lineEnding) ||
           value.includes('\n') ||
           value.includes('\r') ||
           value.startsWith(' ') ||
           value.endsWith(' ');
  }

  /**
   * Quote and escape a value
   */
  private quoteAndEscape(value: string, options: CSVExportOptions): string {
    let escaped = value;
    
    // Escape quote characters
    escaped = escaped.replace(new RegExp(options.quoteCharacter, 'g'), options.escapeCharacter + options.quoteCharacter);
    
    // Wrap in quotes
    return options.quoteCharacter + escaped + options.quoteCharacter;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  /**
   * Generate filename
   */
  private generateFilename(config: CorrelationExportConfig): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = config.name.replace(/[^a-zA-Z0-9]/g, '_');
    return `${baseName}_correlations_${timestamp}.csv`;
  }

  /**
   * Count rows in CSV content
   */
  private countRows(content: string, lineEnding: string): number {
    if (!content) return 0;
    return content.split(lineEnding).length;
  }

  /**
   * Count columns in CSV content
   */
  private countColumns(content: string, separator: string, lineEnding: string): number {
    if (!content) return 0;
    const firstLine = content.split(lineEnding)[0];
    return firstLine.split(separator).length;
  }

  /**
   * Validate export configuration
   */
  validateConfig(config: CorrelationExportConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate required fields
    if (!config.id) {
      errors.push('Export configuration must have an id');
    }
    
    if (!config.name) {
      errors.push('Export configuration must have a name');
    }
    
    if (!config.format) {
      errors.push('Export configuration must specify a format');
    }
    
    // Validate format
    const validFormats = ['csv', 'json', 'xlsx', 'pdf'];
    if (!validFormats.includes(config.format)) {
      errors.push(`Invalid format: ${config.format}. Must be one of: ${validFormats.join(', ')}`);
    }
    
    // Validate data sources
    if (!config.data.sources || config.data.sources.length === 0) {
      errors.push('Export configuration must specify at least one data source');
    }
    
    // Validate columns
    if (config.data.columns && config.data.columns.length > 0) {
      const validColumns = [
        'timestamp',
        'narrativeId',
        'outcomeId',
        'correlation.strength',
        'correlation.direction',
        'correlation.significance',
        'correlation.confidence',
        'analysis.method',
        'analysis.sampleSize',
        'analysis.pValue',
        'analysis.effectSize',
        'analysis.power',
      ];
      
      const invalidColumns = config.data.columns.filter(col => !validColumns.includes(col));
      if (invalidColumns.length > 0) {
        errors.push(`Invalid columns: ${invalidColumns.join(', ')}. Must be one of: ${validColumns.join(', ')}`);
      }
    }
    
    // Validate limits
    if (config.data.limits) {
      if (config.data.limits.offset < 0) {
        errors.push('Offset must be non-negative');
      }
      
      if (config.data.limits.count < 0) {
        errors.push('Count must be non-negative');
      }
      
      if (config.data.limits.count > 100000) {
        errors.push('Count cannot exceed 100,000 for performance reasons');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get default export configuration
   */
  getDefaultConfig(): CorrelationExportConfig {
    return {
      id: 'default-export',
      name: 'Default Correlation Export',
      format: 'csv',
      data: {
        sources: ['correlations'],
        filters: {},
        columns: [
          'timestamp',
          'narrativeId',
          'outcomeId',
          'correlation.strength',
          'correlation.direction',
          'correlation.significance',
          'analysis.method',
          'analysis.sampleSize',
          'analysis.pValue',
        ],
        aggregations: {},
        sorting: {
          column: 'timestamp',
          direction: 'desc',
        },
        limits: {
          offset: 0,
          count: 10000,
        },
      },
      formatting: {
        headers: true,
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        numberFormat: 'en-US',
        precision: 4,
        locale: 'en-US',
      },
      compression: {
        enabled: false,
        algorithm: 'gzip',
        level: 6,
      },
      delivery: {
        method: 'download',
        destination: '/downloads',
        retry: {
          enabled: true,
          attempts: 3,
          delay: 1000,
        },
      },
      metadata: {
        version: '1.0.0',
        tags: ['default', 'export', 'correlation'],
        category: 'export',
      },
    };
  }

  /**
   * Create export configuration from options
   */
  createConfig(options: Partial<CorrelationExportConfig>): CorrelationExportConfig {
    const defaultConfig = this.getDefaultConfig();
    return { ...defaultConfig, ...options };
  }

  /**
   * Generate sample data for testing
   */
  generateSampleData(count: number = 100): {
    correlations: CorrelationData[];
    narratives: NarrativeData[];
    outcomes: QuestOutcomeData[];
  } {
    // Generate sample correlations
    correlations = Array.from({ length: count }, (_, index) => ({
      id: `correlation-${index}`,
      narrativeId: `narrative-${index}`,
      outcomeId: `outcome-${index}`,
      timestamp: Date.now() - (index * 3600000), // 1 hour apart
      correlation: {
        strength: Math.random(),
        direction: Math.random() > 0.5 ? 'positive' : 'negative',
        significance: Math.random(),
        confidence: Math.random(),
      },
      analysis: {
        method: 'pearson',
        sampleSize: 100 + Math.floor(Math.random() * 900),
        pValue: Math.random(),
        effectSize: Math.random(),
        power: Math.random(),
      },
      factors: {
        narrative: {
          tone: Math.random() * 2 - 1,
          style: Math.random() * 2 - 1,
          sentiment: Math.random() * 2 - 1,
          complexity: Math.random(),
          engagement: Math.random(),
          urgency: Math.random(),
        },
        outcome: {
          successRate: Math.random(),
          completionRate: Math.random(),
          duration: Math.random() * 3600000,
          performance: Math.random(),
          efficiency: Math.random(),
        },
        contextual: {
          weather: Math.random() * 2 - 1,
          timeOfDay: Math.random() * 2 - 1,
          location: Math.random() * 2 - 1,
          participantCount: Math.floor(Math.random() * 10),
        },
      },
      patterns: {
        trends: [],
        anomalies: [],
        clusters: [],
        outliers: [],
      },
      metadata: {
        version: '1.0.0',
        algorithm: 'pearson',
        parameters: {},
        processingTime: Math.random() * 100,
        accuracy: Math.random(),
      },
    }));

    // Generate sample narratives
    narratives = Array.from({ length: count }, (_, index) => ({
      id: `narrative-${index}`,
      questId: `quest-${index}`,
      type: 'quest_start' as any,
      timestamp: Date.now() - (index * 3600000),
      content: `Sample narrative content ${index}`,
      tone: 'neutral' as any,
      style: 'descriptive' as any,
      sentiment: {
        score: Math.random() * 2 - 1,
        confidence: Math.random(),
        emotions: ['happy', 'sad', 'angry'],
        keywords: ['quest', 'adventure', 'danger'],
      },
      metadata: {
        length: 100 + Math.floor(Math.random() * 500),
        complexity: Math.random(),
        readability: Math.random(),
        engagement: Math.random(),
        urgency: Math.random(),
      },
      context: {
        previousNarratives: [],
      },
      variables: {},
      tags: ['sample'],
    }));

    // Generate sample outcomes
    outcomes = Array.from({ length: count }, (_, index) => ({
      id: `outcome-${index}`,
      questId: `quest-${index}`,
      narrativeId: `narrative-${index}`,
      timestamp: Date.now() - (index * 3600000),
      outcome: 'success' as any,
      difficulty: 'normal' as any,
      category: 'exploration' as any,
      duration: 3600000,
      successRate: Math.random(),
      completionRate: Math.random(),
      participantIds: [`resident-${index}`],
      metrics: {
        experience: 100 + Math.floor(Math.random() * 500),
        rewards: {
          gold: 50 + Math.floor(Math.random() * 200),
          items: [`item-${index}`],
          reputation: 10 + Math.floor(Math.random() * 50),
        },
        penalties: {
          fatigue: Math.floor(Math.random() * 50),
          injury: 0,
          morale: Math.floor(Math.random() * 20),
        },
        performance: {
          efficiency: Math.random(),
          accuracy: Math.random(),
          creativity: Math.random(),
          teamwork: Math.random(),
        },
      },
      factors: {
        weather: Math.random() * 2 - 1,
        residentStats: Math.random() * 2 - 1,
        equipment: Math.random() * 2 - 1,
        location: Math.random() * 2 - 1,
        timeOfDay: Math.random() * 2 - 1,
        random: Math.random() * 2 - 1,
      },
      metadata: {
        attempts: 1 + Math.floor(Math.random() * 5),
        hints: Math.floor(Math.random() * 3),
        saves: Math.floor(Math.random() * 2),
        loadTime: 1000 + Math.floor(Math.random() * 5000),
        bugs: 0,
        crashes: 0,
      },
    }));

    return { correlations, narratives, outcomes };
  }

  /**
   * Test export functionality
   */
  async testExport(): Promise<CSVExportResult> {
    const sampleData = this.generateSampleData(50);
    const config = this.getDefaultConfig();
    const options = this.defaultOptions;
    
    const context: CSVExportContext = {
      correlations: sampleData.correlations,
      narratives: sampleData.narratives,
      outcomes: sampleData.outcomes,
      config,
      options,
    };
    
    return this.exportToCSV(context);
  }
}

// Default exporter instance
export const defaultCSVExporter = new CorrelationCSVExporter();

// Utility functions
export function createCSVExporter(options?: Partial<CSVExportOptions>): CorrelationCSVExporter {
  return new CorrelationCSVExporter();
}

export async function exportCorrelationsToCSV(
  correlations: CorrelationData[],
  narratives: NarrativeData[],
  outcomes: QuestOutcomeData[],
  config?: Partial<CorrelationExportConfig>,
  options?: Partial<CSVExportOptions>
): Promise<CSVExportResult> {
  const exporter = new CorrelationCSVExporter();
  const defaultConfig = exporter.getDefaultConfig();
  const defaultOptions = exporter.defaultOptions;
  
  const context: CSVExportContext = {
    correlations,
    narratives,
    outcomes,
    config: { ...defaultConfig, ...config },
    options: { ...defaultOptions, ...options },
  };
  
  return exporter.exportToCSV(context);
}

export async function validateExportConfig(config: CorrelationExportConfig): Promise<{ valid: boolean; errors: string[] }> {
  const exporter = new CorrelationCSVExporter();
  return exporter.validateConfig(config);
}
