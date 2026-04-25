/**
 * Idle Village Risk Stripe Calibration Export/Import System
 * 
 * Comprehensive export and import functionality for calibration sessions
 * with JSON, CSV, and XML support, validation, and backup management.
 * 
 * @module riskStripeCalibrationExport
 * @since 2026-01-13
 * @author Cascade
 */

import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import {
  CalibrationSession,
  CalibrationExport,
  CalibrationPreset,
  CalibrationValidationResults,
  type CalibrationPoint,
  type CalibrationCurveParams,
  type RiskStripeConfig,
} from '@/balancing/config/idleVillage/riskStripeCalibrationConfig';

const diagnostics = createHeadlessDiagnostics('RiskStripeCalibrationExport', 'calibration');

/**
 * Export format types
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  XML = 'xml',
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat;
  /** Include metadata */
  includeMetadata: boolean;
  /** Include validation results */
  includeValidation: boolean;
  /** Include chart data */
  includeChartData: boolean;
  /** Compression */
  compression: boolean;
  /** Pretty print (JSON only) */
  prettyPrint: boolean;
  /** Date format */
  dateFormat: 'iso' | 'timestamp' | 'readable';
}

/**
 * Import options
 */
export interface ImportOptions {
  /** Validate on import */
  validate: boolean;
  /** Merge with existing session */
  merge: boolean;
  /** Override existing points */
  overridePoints: boolean;
  /** Import validation results */
  importValidationResults: boolean;
  /** Strict validation */
  strictValidation: boolean;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Success status */
  success: boolean;
  /** Export data */
  data: string | ArrayBuffer;
  /** File name */
  fileName: string;
  /** MIME type */
  mimeType: string;
  /** File size */
  fileSize: number;
  /** Export timestamp */
  exportedAt: number;
  /** Error message */
  error?: string;
}

/**
 * Import result
 */
export interface ImportResult {
  /** Success status */
  success: boolean;
  /** Imported session */
  session?: CalibrationSession;
  /** Validation warnings */
  warnings: string[];
  /** Validation errors */
  errors: string[];
  /** Import timestamp */
  importedAt: number;
  /** Original data */
  originalData: any;
}

/**
 * Backup manager
 */
export class CalibrationBackupManager {
  private static instance: CalibrationBackupManager;
  private backups: Map<string, CalibrationSession> = new Map();
  private maxBackups = 10;

  private constructor() {}

  static getInstance(): CalibrationBackupManager {
    if (!CalibrationBackupManager.instance) {
      CalibrationBackupManager.instance = new CalibrationBackupManager();
    }
    return CalibrationBackupManager.instance;
  }

  /**
   * Create backup
   */
  createBackup(session: CalibrationSession): string {
    const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const backupSession = {
      ...session,
      sessionId: backupId,
      name: `${session.name} (Backup)`,
      metadata: {
        ...session.metadata,
        tags: [...session.metadata.tags, 'backup'],
      },
    };

    this.backups.set(backupId, backupSession);

    // Remove oldest backup if limit exceeded
    if (this.backups.size > this.maxBackups) {
      const oldestKey = this.backups.keys().next().value;
      if (oldestKey) {
        this.backups.delete(oldestKey);
      }
    }

    return backupId;
  }

  /**
   * Get backup
   */
  getBackup(backupId: string): CalibrationSession | null {
    return this.backups.get(backupId) || null;
  }

  /**
   * List all backups
   */
  listBackups(): Array<{ id: string; session: CalibrationSession }> {
    return Array.from(this.backups.entries()).map(([id, session]) => ({ id, session }));
  }

  /**
   * Delete backup
   */
  deleteBackup(backupId: string): boolean {
    return this.backups.delete(backupId);
  }

  /**
   * Clear all backups
   */
  clearBackups(): void {
    this.backups.clear();
  }
}

/**
 * Export/Import manager
 */
export class CalibrationExportImportManager {
  private static instance: CalibrationExportImportManager;
  private backupManager: CalibrationBackupManager;

  private constructor() {
    this.backupManager = CalibrationBackupManager.getInstance();
  }

  static getInstance(): CalibrationExportImportManager {
    if (!CalibrationExportImportManager.instance) {
      CalibrationExportImportManager.instance = new CalibrationExportImportManager();
    }
    return CalibrationExportImportManager.instance;
  }

  /**
   * Export calibration session
   */
  async exportSession(
    session: CalibrationSession,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    const fullOptions: ExportOptions = {
      format: ExportFormat.JSON,
      includeMetadata: true,
      includeValidation: true,
      includeChartData: false,
      compression: false,
      prettyPrint: true,
      dateFormat: 'iso',
      ...options,
    };

    try {
      let data: string | ArrayBuffer;
      let fileName: string;
      let mimeType: string;

      switch (fullOptions.format) {
        case ExportFormat.JSON:
          const jsonData = await this.exportToJSON(session, fullOptions);
          data = jsonData.data;
          fileName = jsonData.fileName;
          mimeType = jsonData.mimeType;
          break;

        case ExportFormat.CSV:
          const csvData = await this.exportToCSV(session, fullOptions);
          data = csvData.data;
          fileName = csvData.fileName;
          mimeType = csvData.mimeType;
          break;

        case ExportFormat.XML:
          const xmlData = await this.exportToXML(session, fullOptions);
          data = xmlData.data;
          fileName = xmlData.fileName;
          mimeType = xmlData.mimeType;
          break;

        default:
          throw new Error(`Unsupported export format: ${fullOptions.format}`);
      }

      // Apply compression if requested
      if (fullOptions.compression && typeof data === 'string') {
        const compressed = await this.compressData(data);
        data = compressed.data;
        fileName += '.gz';
        mimeType = 'application/gzip';
      }

      const fileSize = typeof data === 'string' ? data.length : data.byteLength;

      return {
        success: true,
        data,
        fileName,
        mimeType,
        fileSize,
        exportedAt: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        data: '',
        fileName: '',
        mimeType: '',
        fileSize: 0,
        exportedAt: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Import calibration session
   */
  async importSession(
    data: string | ArrayBuffer,
    options: Partial<ImportOptions> = {}
  ): Promise<ImportResult> {
    const fullOptions: ImportOptions = {
      validate: true,
      merge: false,
      overridePoints: false,
      importValidationResults: true,
      strictValidation: false,
      ...options,
    };

    try {
      let originalData: any;
      let session: CalibrationSession;

      // Handle compressed data
      if (data instanceof ArrayBuffer) {
        const decompressed = await this.decompressData(data);
        data = decompressed;
      }

      // Parse data based on format
      if (typeof data === 'string') {
        // Try to detect format
        if (data.trim().startsWith('<')) {
          // XML format
          const result = await this.importFromXML(data, fullOptions);
          originalData = result.originalData;
          session = result.session;
        } else if (data.includes(',') && data.includes('\n')) {
          // CSV format
          const result = await this.importFromCSV(data, fullOptions);
          originalData = result.originalData;
          session = result.session;
        } else {
          // JSON format
          const result = await this.importFromJSON(data, fullOptions);
          originalData = result.originalData;
          session = result.session;
        }
      } else {
        throw new Error('Invalid data format');
      }

      // Validate imported session
      const validation = this.validateImportedSession(session, fullOptions);
      
      return {
        success: validation.errors.length === 0,
        session: validation.errors.length === 0 ? session : undefined,
        warnings: validation.warnings,
        errors: validation.errors,
        importedAt: Date.now(),
        originalData,
      };
    } catch (error) {
      return {
        success: false,
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        importedAt: Date.now(),
        originalData: data,
      };
    }
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(
    session: CalibrationSession,
    options: ExportOptions
  ): Promise<{ data: string; fileName: string; mimeType: string }> {
    const exportData: CalibrationExport = {
      metadata: {
        version: '1.0.0',
        exportedAt: Date.now(),
        exportedBy: 'RiskStripeCalibrationTool',
        format: 'json',
        compression: options.compression,
      },
      session,
    };

    // Add additional data if requested
    if (options.includeChartData) {
      exportData.additionalData = {
        chartData: this.generateChartData(session),
        statistics: this.generateStatistics(session),
      };
    }

    // Remove validation results if not requested
    if (!options.includeValidation) {
      delete exportData.session.validationResults;
    }

    // Remove metadata if not requested
    if (!options.includeMetadata) {
      delete exportData.metadata;
    }

    const jsonString = options.prettyPrint 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    const fileName = `calibration-${session.sessionId}-${Date.now()}.json`;

    return {
      data: jsonString,
      fileName,
      mimeType: 'application/json',
    };
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(
    session: CalibrationSession,
    options: ExportOptions
  ): Promise<{ data: string; fileName: string; mimeType: string }> {
    const headers = [
      'sessionId',
      'pointIndex',
      'riskPercentage',
      'stripeHeight',
      'riskLevel',
      'weight',
      'isReference',
      'description',
      'algorithm',
      'createdAt',
      'modifiedAt',
    ];

    const rows = session.calibrationPoints.map((point, index) => [
      session.sessionId,
      index.toString(),
      point.riskPercentage.toString(),
      point.stripeHeight.toString(),
      point.riskLevel,
      point.weight.toString(),
      point.isReference.toString(),
      point.description || '',
      session.curveParams.algorithm,
      new Date(session.createdAt).toISOString(),
      new Date(session.modifiedAt).toISOString(),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const fileName = `calibration-${session.sessionId}-${Date.now()}.csv`;

    return {
      data: csvContent,
      fileName,
      mimeType: 'text/csv',
    };
  }

  /**
   * Export to XML format
   */
  private async exportToXML(
    session: CalibrationSession,
    options: ExportOptions
  ): Promise<{ data: string; fileName: string; mimeType: string }> {
    const xmlContent = this.generateXML(session, options);
    const fileName = `calibration-${session.sessionId}-${Date.now()}.xml`;

    return {
      data: xmlContent,
      fileName,
      mimeType: 'application/xml',
    };
  }

  /**
   * Import from JSON format
   */
  private async importFromJSON(
    data: string,
    options: ImportOptions
  ): Promise<{ session: CalibrationSession; originalData: any }> {
    const originalData = JSON.parse(data);

    // Handle different JSON structures
    let sessionData: any;

    if (originalData.session) {
      // Full export format
      sessionData = originalData.session;
    } else if (originalData.calibrationPoints && originalData.curveParams) {
      // Direct session format
      sessionData = originalData;
    } else {
      throw new Error('Invalid JSON structure for calibration session');
    }

    // Validate and create session
    const session = this.createSessionFromData(sessionData, options);

    return { session, originalData };
  }

  /**
   * Import from CSV format
   */
  private async importFromCSV(
    data: string,
    options: ImportOptions
  ): Promise<{ session: CalibrationSession; originalData: any }> {
    const lines = data.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    const calibrationPoints: CalibrationPoint[] = [];
    let algorithm = CalibrationAlgorithm.LINEAR;
    let sessionId = createCalibrationSessionId();
    let createdAt = Date.now();
    let modifiedAt = Date.now();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
      
      if (values.length < headers.length) continue;

      const pointData: any = {};
      headers.forEach((header, index) => {
        pointData[header] = values[index];
      });

      // Extract point data
      const point: CalibrationPoint = {
        riskPercentage: parseFloat(pointData.riskPercentage || '0'),
        stripeHeight: parseFloat(pointData.stripeHeight || '0'),
        riskLevel: pointData.riskLevel || 'medium',
        weight: parseFloat(pointData.weight || '1'),
        isReference: pointData.isReference === 'true',
        description: pointData.description,
      };

      // Extract session metadata
      if (pointData.algorithm) {
        algorithm = pointData.algorithm as CalibrationAlgorithm;
      }
      if (pointData.sessionId) {
        sessionId = pointData.sessionId;
      }
      if (pointData.createdAt) {
        createdAt = new Date(pointData.createdAt).getTime();
      }
      if (pointData.modifiedAt) {
        modifiedAt = new Date(pointData.modifiedAt).getTime();
      }

      calibrationPoints.push(point);
    }

    const session: CalibrationSession = {
      sessionId,
      name: 'Imported from CSV',
      createdAt,
      modifiedAt,
      calibrationPoints,
      curveParams: {
        algorithm,
        parameters: { slope: 1, intercept: 0 },
        domain: { min: 0, max: 1 },
        range: { min: 0, max: 200 },
      },
      stripeConfig: {
        type: 'injury' as any,
        color: { primary: '#rgb(251, 191, 36)', opacity: 0.8 },
        visual: { minWidth: 20, maxWidth: 60, minHeight: 2, maxHeight: 200, borderRadius: 2, spacing: 4 },
        animation: { enabled: true, duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', delay: 0 },
        label: { show: true, format: 'percentage', precision: 1, position: 'top' },
      },
      metadata: {
        version: '1.0.0',
        author: 'Import',
        tags: ['imported', 'csv'],
        category: 'imported',
      },
    };

    return { session, originalData: { calibrationPoints, algorithm } };
  }

  /**
   * Import from XML format
   */
  private async importFromXML(
    data: string,
    options: ImportOptions
  ): Promise<{ session: CalibrationSession; originalData: any }> {
    // Simple XML parsing (in production, use a proper XML parser)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml');
    
    const sessionNode = xmlDoc.querySelector('session');
    if (!sessionNode) {
      throw new Error('Invalid XML format: missing session element');
    }

    const sessionData = this.parseXMLSession(sessionNode);
    const session = this.createSessionFromData(sessionData, options);

    return { session, originalData: sessionData };
  }

  /**
   * Generate XML content
   */
  private generateXML(session: CalibrationSession, options: ExportOptions): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<calibrationSession>\n';

    // Add metadata
    if (options.includeMetadata) {
      xml += '  <metadata>\n';
      xml += `    <sessionId>${session.sessionId}</sessionId>\n`;
      xml += `    <name>${session.name}</name>\n`;
      xml += `    <createdAt>${session.createdAt}</createdAt>\n`;
      xml += `    <modifiedAt>${session.modifiedAt}</modifiedAt>\n`;
      xml += `    <version>${session.metadata.version}</version>\n`;
      xml += `    <author>${session.metadata.author}</author>\n`;
      xml += `    <category>${session.metadata.category}</category>\n`;
      xml += '    <tags>\n';
      session.metadata.tags.forEach(tag => {
        xml += `      <tag>${tag}</tag>\n`;
      });
      xml += '    </tags>\n';
      xml += '  </metadata>\n';
    }

    // Add curve parameters
    xml += '  <curveParams>\n';
    xml += `    <algorithm>${session.curveParams.algorithm}</algorithm>\n`;
    xml += '    <parameters>\n';
    Object.entries(session.curveParams.parameters).forEach(([key, value]) => {
      if (value !== undefined) {
        xml += `      <${key}>${value}</${key}>\n`;
      }
    });
    xml += '    </parameters>\n';
    xml += '    <domain>\n';
    xml += `      <min>${session.curveParams.domain.min}</min>\n`;
    xml += `      <max>${session.curveParams.domain.max}</max>\n`;
    xml += '    </domain>\n';
    xml += '    <range>\n';
    xml += `      <min>${session.curveParams.range.min}</min>\n`;
    xml += `      <max>${session.curveParams.range.max}</max>\n`;
    xml += '    </range>\n';
    xml += '  </curveParams>\n';

    // Add calibration points
    xml += '  <calibrationPoints>\n';
    session.calibrationPoints.forEach((point, index) => {
      xml += `    <point index="${index}">\n`;
      xml += `      <riskPercentage>${point.riskPercentage}</riskPercentage>\n`;
      xml += `      <stripeHeight>${point.stripeHeight}</stripeHeight>\n`;
      xml += `      <riskLevel>${point.riskLevel}</riskLevel>\n`;
      xml += `      <weight>${point.weight}</weight>\n`;
      xml += `      <isReference>${point.isReference}</isReference>\n`;
      if (point.description) {
        xml += `      <description>${point.description}</description>\n`;
      }
      xml += '    </point>\n';
    });
    xml += '  </calibrationPoints>\n';

    // Add validation results if available
    if (options.includeValidation && session.validationResults) {
      xml += '  <validationResults>\n';
      xml += `    <validationScore>${session.validationResults.validationScore}</validationScore>\n`;
      xml += '    <errors>\n';
      xml += `      <meanAbsoluteError>${session.validationResults.errors.meanAbsoluteError}</meanAbsoluteError>\n`;
      xml += `      <rootMeanSquareError>${session.validationResults.errors.rootMeanSquareError}</rootMeanSquareError>\n`;
      xml += `      <maxAbsoluteError>${session.validationResults.errors.maxAbsoluteError}</maxAbsoluteError>\n`;
      xml += `      <meanAbsolutePercentageError>${session.validationResults.errors.meanAbsolutePercentageError}</meanAbsolutePercentageError>\n`;
      xml += '    </errors>\n';
      xml += '    <fitQuality>\n';
      xml += `      <rSquared>${session.validationResults.fitQuality.rSquared}</rSquared>\n`;
      xml += `      <adjustedRSquared>${session.validationResults.fitQuality.adjustedRSquared}</adjustedRSquared>\n`;
      xml += `      <residualStandardError>${session.validationResults.fitQuality.residualStandardError}</residualStandardError>\n`;
      xml += '    </fitQuality>\n';
      xml += '    <outliers>\n';
      xml += `      <count>${session.validationResults.outliers.count}</count>\n`;
      xml += `      <threshold>${session.validationResults.outliers.threshold}</threshold>\n`;
      xml += '    </outliers>\n';
      xml += '    <recommendations>\n';
      session.validationResults.recommendations.forEach(rec => {
        xml += `      <recommendation>${rec}</recommendation>\n`;
      });
      xml += '    </recommendations>\n';
      xml += `    <validatedAt>${session.validationResults.validatedAt}</validatedAt>\n`;
      xml += '  </validationResults>\n';
    }

    xml += '</calibrationSession>';
    return xml;
  }

  /**
   * Parse XML session
   */
  private parseXMLSession(sessionNode: Element): any {
    const session: any = {
      sessionId: '',
      name: '',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      calibrationPoints: [],
      curveParams: {
        algorithm: CalibrationAlgorithm.LINEAR,
        parameters: {},
        domain: { min: 0, max: 1 },
        range: { min: 0, max: 200 },
      },
      metadata: {
        version: '1.0.0',
        author: 'Import',
        tags: [],
        category: 'imported',
      },
    };

    // Parse metadata
    const metadataNode = sessionNode.querySelector('metadata');
    if (metadataNode) {
      const sessionIdNode = metadataNode.querySelector('sessionId');
      const nameNode = metadataNode.querySelector('name');
      const createdAtNode = metadataNode.querySelector('createdAt');
      const modifiedAtNode = metadataNode.querySelector('modifiedAt');
      const versionNode = metadataNode.querySelector('version');
      const authorNode = metadataNode.querySelector('author');
      const categoryNode = metadataNode.querySelector('category');

      if (sessionIdNode) session.sessionId = sessionIdNode.textContent || '';
      if (nameNode) session.name = nameNode.textContent || '';
      if (createdAtNode) session.createdAt = parseInt(createdAtNode.textContent || '0');
      if (modifiedAtNode) session.modifiedAt = parseInt(modifiedAtNode.textContent || '0');
      if (versionNode) session.metadata.version = versionNode.textContent || '1.0.0';
      if (authorNode) session.metadata.author = authorNode.textContent || 'Import';
      if (categoryNode) session.metadata.category = categoryNode.textContent || 'imported';

      // Parse tags
      const tagsNode = metadataNode.querySelector('tags');
      if (tagsNode) {
        const tagNodes = tagsNode.querySelectorAll('tag');
        session.metadata.tags = Array.from(tagNodes).map(node => node.textContent || '');
      }
    }

    // Parse curve parameters
    const curveParamsNode = sessionNode.querySelector('curveParams');
    if (curveParamsNode) {
      const algorithmNode = curveParamsNode.querySelector('algorithm');
      if (algorithmNode) {
        session.curveParams.algorithm = algorithmNode.textContent as CalibrationAlgorithm;
      }

      const parametersNode = curveParamsNode.querySelector('parameters');
      if (parametersNode) {
        const paramNodes = parametersNode.children;
        Array.from(paramNodes).forEach(paramNode => {
          if (paramNode.textContent) {
            session.curveParams.parameters[paramNode.nodeName] = parseFloat(paramNode.textContent);
          }
        });
      }

      const domainNode = curveParamsNode.querySelector('domain');
      if (domainNode) {
        const minNode = domainNode.querySelector('min');
        const maxNode = domainNode.querySelector('max');
        if (minNode) session.curveParams.domain.min = parseFloat(minNode.textContent || '0');
        if (maxNode) session.curveParams.domain.max = parseFloat(maxNode.textContent || '1');
      }

      const rangeNode = curveParamsNode.querySelector('range');
      if (rangeNode) {
        const minNode = rangeNode.querySelector('min');
        const maxNode = rangeNode.querySelector('max');
        if (minNode) session.curveParams.range.min = parseFloat(minNode.textContent || '0');
        if (maxNode) session.curveParams.range.max = parseFloat(maxNode.textContent || '200');
      }
    }

    // Parse calibration points
    const pointsNode = sessionNode.querySelector('calibrationPoints');
    if (pointsNode) {
      const pointNodes = pointsNode.querySelectorAll('point');
      session.calibrationPoints = Array.from(pointNodes).map(pointNode => {
        const riskPercentageNode = pointNode.querySelector('riskPercentage');
        const stripeHeightNode = pointNode.querySelector('stripeHeight');
        const riskLevelNode = pointNode.querySelector('riskLevel');
        const weightNode = pointNode.querySelector('weight');
        const isReferenceNode = pointNode.querySelector('isReference');
        const descriptionNode = pointNode.querySelector('description');

        return {
          riskPercentage: parseFloat(riskPercentageNode?.textContent || '0'),
          stripeHeight: parseFloat(stripeHeightNode?.textContent || '0'),
          riskLevel: (riskLevelNode?.textContent || 'medium') as any,
          weight: parseFloat(weightNode?.textContent || '1'),
          isReference: isReferenceNode?.textContent === 'true',
          description: descriptionNode?.textContent || undefined,
        };
      });
    }

    return session;
  }

  /**
   * Create session from data
   */
  private createSessionFromData(data: any, options: ImportOptions): CalibrationSession {
    // Validate required fields
    if (!data.calibrationPoints || !Array.isArray(data.calibrationPoints)) {
      throw new Error('Missing or invalid calibration points');
    }

    if (!data.curveParams) {
      throw new Error('Missing curve parameters');
    }

    // Create session with defaults
    const session: CalibrationSession = {
      sessionId: data.sessionId || createCalibrationSessionId(),
      name: data.name || 'Imported Session',
      createdAt: data.createdAt || Date.now(),
      modifiedAt: data.modifiedAt || Date.now(),
      description: data.description,
      calibrationPoints: data.calibrationPoints,
      curveParams: data.curveParams,
      stripeConfig: data.stripeConfig || {
        type: 'injury' as any,
        color: { primary: '#rgb(251, 191, 36)', opacity: 0.8 },
        visual: { minWidth: 20, maxWidth: 60, minHeight: 2, maxHeight: 200, borderRadius: 2, spacing: 4 },
        animation: { enabled: true, duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', delay: 0 },
        label: { show: true, format: 'percentage', precision: 1, position: 'top' },
      },
      validationResults: data.validationResults,
      metadata: {
        version: data.metadata?.version || '1.0.0',
        author: data.metadata?.author || 'Import',
        tags: data.metadata?.tags || ['imported'],
        category: data.metadata?.category || 'imported',
      },
    };

    return session;
  }

  /**
   * Validate imported session
   */
  private validateImportedSession(
    session: CalibrationSession,
    options: ImportOptions
  ): { warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Validate calibration points
    if (session.calibrationPoints.length < 3) {
      errors.push('At least 3 calibration points required');
    }

    if (session.calibrationPoints.length > 20) {
      warnings.push('Large number of calibration points may affect performance');
    }

    // Validate point values
    session.calibrationPoints.forEach((point, index) => {
      if (point.riskPercentage < 0 || point.riskPercentage > 1) {
        errors.push(`Point ${index}: Risk percentage must be between 0 and 1`);
      }
      if (point.stripeHeight < 0 || point.stripeHeight > 300) {
        errors.push(`Point ${index}: Stripe height must be between 0 and 300`);
      }
      if (point.weight < 0 || point.weight > 1) {
        errors.push(`Point ${index}: Weight must be between 0 and 1`);
      }
    });

    // Validate curve parameters
    if (!session.curveParams.algorithm) {
      errors.push('Missing calibration algorithm');
    }

    if (!session.curveParams.domain || session.curveParams.domain.min >= session.curveParams.domain.max) {
      errors.push('Invalid domain parameters');
    }

    if (!session.curveParams.range || session.curveParams.range.min >= session.curveParams.range.max) {
      errors.push('Invalid range parameters');
    }

    // Validate metadata
    if (!session.sessionId) {
      warnings.push('Missing session ID, will generate new one');
    }

    if (!session.name) {
      warnings.push('Missing session name, will use default');
    }

    return { warnings, errors };
  }

  /**
   * Generate chart data
   */
  private generateChartData(session: CalibrationSession): any {
    // Generate curve data points for visualization
    const curveData = [];
    for (let i = 0; i <= 100; i++) {
      const riskPercentage = i / 100;
      // This would use the calibration engine to calculate stripe height
      curveData.push({
        x: riskPercentage,
        y: riskPercentage * 200, // Simplified calculation
      });
    }

    return {
      curve: curveData,
      points: session.calibrationPoints,
    };
  }

  /**
   * Generate statistics
   */
  private generateStatistics(session: CalibrationSession): any {
    const points = session.calibrationPoints;
    
    return {
      totalPoints: points.length,
      referencePoints: points.filter(p => p.isReference).length,
      averageRisk: points.reduce((sum, p) => sum + p.riskPercentage, 0) / points.length,
      averageHeight: points.reduce((sum, p) => sum + p.stripeHeight, 0) / points.length,
      riskDistribution: this.calculateRiskDistribution(points),
    };
  }

  /**
   * Calculate risk distribution
   */
  private calculateRiskDistribution(points: CalibrationPoint[]): any {
    const distribution = {
      very_low: 0,
      low: 0,
      medium: 0,
      high: 0,
      very_high: 0,
      extreme: 0,
    };

    points.forEach(point => {
      distribution[point.riskLevel]++;
    });

    return distribution;
  }

  /**
   * Compress data
   */
  private async compressData(data: string): Promise<{ data: ArrayBuffer }> {
    // Simple compression simulation
    // In production, use proper compression libraries
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(data);
    return { data: uint8Array.buffer };
  }

  /**
   * Decompress data
   */
  private async decompressData(data: ArrayBuffer): Promise<string> {
    // Simple decompression simulation
    // In production, use proper decompression libraries
    const decoder = new TextDecoder();
    return decoder.decode(data);
  }
}

/**
 * Global export/import manager instance
 */
export const calibrationExportImportManager = CalibrationExportImportManager.getInstance();
