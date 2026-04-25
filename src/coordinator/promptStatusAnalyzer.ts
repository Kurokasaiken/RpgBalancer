/**
 * Coordinator Prompt Status Analyzer
 * Analyzes coordinator prompt status for audit and reporting
 * 
 * @see NP-145 – Coordinator Prompt Status Auditor CLI
 */

import { z } from 'zod';

// Prompt status types
export const PromptStatus = {
  NON_ASSEGNATO: 'Non assegnato',
  IN_CORSO: 'In corso',
  COMPLETATO: 'Completato',
  BLOCCATO: 'Bloccato',
  SOSPESO: 'Sospeso',
} as const;

export type PromptStatus = typeof PromptStatus[keyof typeof PromptStatus];

// Prompt priority
export const PromptPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type PromptPriority = typeof PromptPriority[keyof typeof PromptPriority];

// Prompt data
export interface PromptData {
  id: string;
  description: string;
  status: PromptStatus;
  assignedTo?: string;
  startDate?: string;
  completionDate?: string;
  dependencies?: string[];
  priority?: PromptPriority;
  estimatedPoints?: number;
}

// Status analysis result
export interface StatusAnalysisResult {
  promptId: string;
  description: string;
  currentStatus: PromptStatus;
  daysInStatus: number;
  isStale: boolean;
  isBlocked: boolean;
  hasUnmetDependencies: boolean;
  recommendations: string[];
  priority: PromptPriority;
}

// Status audit configuration
export interface StatusAuditConfig {
  windowDays: number;
  staleThresholdDays: number;
  priorities: {
    [key in PromptPriority]: {
      staleThresholdDays: number;
      weight: number;
    };
  };
  persistence: {
    enabled: boolean;
    storageKey: string;
  };
  telemetry: {
    enabled: boolean;
    event: string;
  };
}

// Audit report
export interface AuditReport {
  summary: {
    totalPrompts: number;
    nonAssegnato: number;
    inCorso: number;
    completato: number;
    bloccato: number;
    sospeso: number;
    stalePrompts: number;
    blockedPrompts: number;
    acceptanceRate: number;
    timestamp: number;
  };
  stalePrompts: StatusAnalysisResult[];
  blockedPrompts: StatusAnalysisResult[];
  allPrompts: StatusAnalysisResult[];
  recommendations: string[];
}

// Zod schemas
export const PromptDataSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.enum(['Non assegnato', 'In corso', 'Completato', 'Bloccato', 'Sospeso']),
  assignedTo: z.string().optional(),
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  estimatedPoints: z.number().optional(),
});

export const StatusAuditConfigSchema = z.object({
  windowDays: z.number().min(1).max(365),
  staleThresholdDays: z.number().min(1).max(90),
  priorities: z.object({
    low: z.object({
      staleThresholdDays: z.number(),
      weight: z.number(),
    }),
    medium: z.object({
      staleThresholdDays: z.number(),
      weight: z.number(),
    }),
    high: z.object({
      staleThresholdDays: z.number(),
      weight: z.number(),
    }),
    critical: z.object({
      staleThresholdDays: z.number(),
      weight: z.number(),
    }),
  }),
  persistence: z.object({
    enabled: z.boolean(),
    storageKey: z.string(),
  }),
  telemetry: z.object({
    enabled: z.boolean(),
    event: z.string(),
  }),
});

/**
 * Default configuration
 */
export const DEFAULT_STATUS_AUDIT_CONFIG: StatusAuditConfig = {
  windowDays: 30,
  staleThresholdDays: 7,
  priorities: {
    low: {
      staleThresholdDays: 14,
      weight: 1,
    },
    medium: {
      staleThresholdDays: 7,
      weight: 2,
    },
    high: {
      staleThresholdDays: 3,
      weight: 3,
    },
    critical: {
      staleThresholdDays: 1,
      weight: 4,
    },
  },
  persistence: {
    enabled: true,
    storageKey: 'coordinator-prompt-status',
  },
  telemetry: {
    enabled: true,
    event: 'coordinator_prompt_status_audited',
  },
};

/**
 * Prompt Status Analyzer
 */
export class PromptStatusAnalyzer {
  private config: StatusAuditConfig;
  private prompts: PromptData[] = [];

  constructor(config: Partial<StatusAuditConfig> = {}) {
    this.config = {
      ...DEFAULT_STATUS_AUDIT_CONFIG,
      ...config,
    };
  }

  /**
   * Add prompt data
   */
  addPrompt(prompt: PromptData): void {
    const result = PromptDataSchema.safeParse(prompt);
    if (!result.success) {
      console.warn('[PromptStatusAnalyzer] Invalid prompt data:', result.error);
      return;
    }
    this.prompts.push(prompt);
  }

  /**
   * Add multiple prompts
   */
  addPrompts(prompts: PromptData[]): void {
    prompts.forEach(p => this.addPrompt(p));
  }

  /**
   * Clear all prompts
   */
  clearPrompts(): void {
    this.prompts = [];
  }

  /**
   * Analyze prompt status
   */
  analyzeStatus(): AuditReport {
    const now = Date.now();
    
    const analyses: StatusAnalysisResult[] = this.prompts.map(prompt => {
      const daysInStatus = this.calculateDaysInStatus(prompt);
      const priority = prompt.priority || 'medium';
      const staleThreshold = this.config.priorities[priority].staleThresholdDays;
      
      const isStale = daysInStatus > staleThreshold && 
                      prompt.status !== 'Completato';
      const isBlocked = prompt.status === 'Bloccato';
      const hasUnmetDependencies = this.checkUnmetDependencies(prompt);

      const recommendations = this.generateRecommendations(
        prompt,
        isStale,
        isBlocked,
        hasUnmetDependencies,
        daysInStatus
      );

      return {
        promptId: prompt.id,
        description: prompt.description,
        currentStatus: prompt.status,
        daysInStatus,
        isStale,
        isBlocked,
        hasUnmetDependencies,
        recommendations,
        priority,
      };
    });

    const stalePrompts = analyses.filter(a => a.isStale);
    const blockedPrompts = analyses.filter(a => a.isBlocked);

    const summary = {
      totalPrompts: this.prompts.length,
      nonAssegnato: this.prompts.filter(p => p.status === 'Non assegnato').length,
      inCorso: this.prompts.filter(p => p.status === 'In corso').length,
      completato: this.prompts.filter(p => p.status === 'Completato').length,
      bloccato: this.prompts.filter(p => p.status === 'Bloccato').length,
      sospeso: this.prompts.filter(p => p.status === 'Sospeso').length,
      stalePrompts: stalePrompts.length,
      blockedPrompts: blockedPrompts.length,
      acceptanceRate: this.calculateAcceptanceRate(),
      timestamp: now,
    };

    const recommendations = this.generateGlobalRecommendations(summary, stalePrompts, blockedPrompts);

    if (this.config.telemetry.enabled) {
      console.log(`[PromptStatusAnalyzer] ${this.config.telemetry.event}`, {
        totalPrompts: summary.totalPrompts,
        stalePrompts: summary.stalePrompts,
        blockedPrompts: summary.blockedPrompts,
        acceptanceRate: summary.acceptanceRate,
      });
    }

    return {
      summary,
      stalePrompts,
      blockedPrompts,
      allPrompts: analyses,
      recommendations,
    };
  }

  /**
   * Calculate days in current status
   */
  private calculateDaysInStatus(prompt: PromptData): number {
    const now = Date.now();
    let statusDate: Date;

    if (prompt.status === 'Completato' && prompt.completionDate) {
      statusDate = new Date(prompt.completionDate);
    } else if (prompt.startDate) {
      statusDate = new Date(prompt.startDate);
    } else {
      return 0;
    }

    const diffMs = now - statusDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check for unmet dependencies
   */
  private checkUnmetDependencies(prompt: PromptData): boolean {
    if (!prompt.dependencies || prompt.dependencies.length === 0) {
      return false;
    }

    return prompt.dependencies.some(depId => {
      const dep = this.prompts.find(p => p.id === depId);
      return !dep || dep.status !== 'Completato';
    });
  }

  /**
   * Generate recommendations for a prompt
   */
  private generateRecommendations(
    prompt: PromptData,
    isStale: boolean,
    isBlocked: boolean,
    hasUnmetDependencies: boolean,
    daysInStatus: number
  ): string[] {
    const recommendations: string[] = [];

    if (isStale) {
      recommendations.push(`⚠️ Stale for ${daysInStatus} days - requires attention`);
    }

    if (isBlocked) {
      recommendations.push('🚫 Blocked - identify and resolve blockers');
    }

    if (hasUnmetDependencies) {
      recommendations.push('🔗 Has unmet dependencies - complete dependencies first');
    }

    if (prompt.status === 'Non assegnato' && daysInStatus > 7) {
      recommendations.push('👤 Unassigned for >7 days - assign to agent');
    }

    if (prompt.status === 'In corso' && daysInStatus > 14) {
      recommendations.push('⏰ In progress for >14 days - check for issues');
    }

    if (prompt.priority === 'critical' && prompt.status !== 'Completato') {
      recommendations.push('🔴 Critical priority - expedite completion');
    }

    return recommendations;
  }

  /**
   * Generate global recommendations
   */
  private generateGlobalRecommendations(
    summary: AuditReport['summary'],
    stalePrompts: StatusAnalysisResult[],
    blockedPrompts: StatusAnalysisResult[]
  ): string[] {
    const recommendations: string[] = [];

    if (summary.acceptanceRate < 90) {
      recommendations.push(`📊 Acceptance rate (${summary.acceptanceRate.toFixed(1)}%) below target (≥90%) - review prompt assignment process`);
    }

    if (stalePrompts.length > 0) {
      recommendations.push(`⚠️ ${stalePrompts.length} stale prompts detected - prioritize resolution`);
    }

    if (blockedPrompts.length > 0) {
      recommendations.push(`🚫 ${blockedPrompts.length} blocked prompts - identify and remove blockers`);
    }

    if (summary.nonAssegnato > summary.totalPrompts * 0.3) {
      recommendations.push('👥 High number of unassigned prompts (>30%) - increase assignment rate');
    }

    if (summary.inCorso > summary.totalPrompts * 0.5) {
      recommendations.push('⏳ High number of in-progress prompts (>50%) - focus on completion');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All prompts within acceptable parameters');
    }

    return recommendations;
  }

  /**
   * Calculate acceptance rate (completed / total)
   */
  private calculateAcceptanceRate(): number {
    if (this.prompts.length === 0) return 0;
    const completed = this.prompts.filter(p => p.status === 'Completato').length;
    return (completed / this.prompts.length) * 100;
  }

  /**
   * Export to Markdown
   */
  exportToMarkdown(report: AuditReport): string {
    let md = '# Coordinator Prompt Status Audit\n\n';
    md += `**Generated:** ${new Date(report.summary.timestamp).toISOString()}\n\n`;

    md += '## Summary\n\n';
    md += `- **Total Prompts:** ${report.summary.totalPrompts}\n`;
    md += `- **Non Assegnato:** ${report.summary.nonAssegnato}\n`;
    md += `- **In Corso:** ${report.summary.inCorso}\n`;
    md += `- **Completato:** ${report.summary.completato}\n`;
    md += `- **Bloccato:** ${report.summary.bloccato}\n`;
    md += `- **Sospeso:** ${report.summary.sospeso}\n`;
    md += `- **Stale Prompts:** ${report.summary.stalePrompts}\n`;
    md += `- **Blocked Prompts:** ${report.summary.blockedPrompts}\n`;
    md += `- **Acceptance Rate:** ${report.summary.acceptanceRate.toFixed(1)}%\n\n`;

    if (report.recommendations.length > 0) {
      md += '## Recommendations\n\n';
      report.recommendations.forEach(rec => {
        md += `- ${rec}\n`;
      });
      md += '\n';
    }

    if (report.stalePrompts.length > 0) {
      md += '## Stale Prompts\n\n';
      md += '| ID | Description | Status | Days | Priority | Recommendations |\n';
      md += '|----|-------------|--------|------|----------|----------------|\n';
      report.stalePrompts.forEach(p => {
        md += `| ${p.promptId} | ${p.description} | ${p.currentStatus} | ${p.daysInStatus} | ${p.priority} | ${p.recommendations.join(', ')} |\n`;
      });
      md += '\n';
    }

    if (report.blockedPrompts.length > 0) {
      md += '## Blocked Prompts\n\n';
      md += '| ID | Description | Days | Recommendations |\n';
      md += '|----|-------------|------|----------------|\n';
      report.blockedPrompts.forEach(p => {
        md += `| ${p.promptId} | ${p.description} | ${p.daysInStatus} | ${p.recommendations.join(', ')} |\n`;
      });
      md += '\n';
    }

    return md;
  }

  /**
   * Export to JSON
   */
  exportToJSON(report: AuditReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StatusAuditConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): StatusAuditConfig {
    return { ...this.config };
  }
}

/**
 * Create prompt status analyzer
 */
export function createPromptStatusAnalyzer(
  config?: Partial<StatusAuditConfig>
): PromptStatusAnalyzer {
  return new PromptStatusAnalyzer(config);
}
