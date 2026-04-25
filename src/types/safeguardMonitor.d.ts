declare module '../../../scripts/coordinator/safeguardMonitor' {
  export type CheckStatus = {
    status: 'pass' | 'fail' | 'warning' | 'skip' | 'unknown';
    duration?: number;
    error?: string;
    issues?: number;
    timestamp: number;
  };

  export interface SafeguardCheckResult {
    promptId: string;
    title: string;
    status: 'pass' | 'fail' | 'warning' | 'unknown';
    checks: Record<'lint' | 'test' | 'build' | 'kanban', CheckStatus>;
    lastEvidence: number;
    evidencePath: string;
    severity: number;
    issues: string[];
    metadata: Record<string, unknown>;
  }

  export interface SafeguardReport {
    generatedAt: number;
    version: string;
    summary: {
      totalPrompts: number;
      passed: number;
      failed: number;
      warnings: number;
      unknown: number;
      averageSeverity: number;
      worstSeverity: number;
    };
    results: SafeguardCheckResult[];
    globalIssues: string[];
    period: {
      start: number;
      end: number;
    };
  }

  export interface SafeguardMonitorConfig {
    evidenceDirs: string[];
    promptIds?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    severityThresholds: {
      warning: number;
      critical: number;
    };
    outputFormat: 'json' | 'csv' | 'both';
    outputPath?: string;
  }

  export class SafeguardMonitor {
    constructor(config?: Partial<SafeguardMonitorConfig>);
    run(): Promise<SafeguardReport>;
  }
}
