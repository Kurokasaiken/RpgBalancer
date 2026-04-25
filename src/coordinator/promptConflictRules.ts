/**
 * Prompt Conflict Detection Rules
 * 
 * Defines conflict detection rules and severity levels for analyzing
 * Kanban prompt assignments and file target overlaps.
 * 
 * @since 2026-01-21
 * @author Coordinator-Bot
 */

import { z } from 'zod';

interface KanbanPrompt {
  id?: string;
  name?: string;
  status?: string;
  agent?: string;
  evidence?: string;
  startDate?: string;
  fileTargets?: string[];
  dependencies?: string[];
}

/**
 * Conflict severity levels
 */
export const ConflictSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const CONFLICT_SEVERITY_VALUES = [
  ConflictSeverity.LOW,
  ConflictSeverity.MEDIUM,
  ConflictSeverity.HIGH,
  ConflictSeverity.CRITICAL,
] as const;

export type ConflictSeverity = typeof CONFLICT_SEVERITY_VALUES[number];

function createDefaultSeverityWeights(): Record<ConflictSeverity, number> {
  const weights: Record<ConflictSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  weights.critical = 4;
  weights.high = 3;
  weights.medium = 2;
  weights.low = 1;
  return weights;
}

const DEFAULT_SEVERITY_WEIGHTS = createDefaultSeverityWeights();

/**
 * Conflict types
 */
export const ConflictType = {
  FILE_TARGET_OVERLAP: 'file_target_overlap',
  DEPENDENCY_CYCLE: 'dependency_cycle',
  AGENT_OVERLOAD: 'agent_overload',
  STATUS_INCONSISTENCY: 'status_inconsistency',
  EVIDENCE_MISSING: 'evidence_missing',
  DUPLICATE_PROMPT: 'duplicate_prompt',
} as const;

export type ConflictType = typeof ConflictType[keyof typeof ConflictType];

/**
 * File target conflict
 */
export const FileTargetConflictSchema = z.object({
  type: z.literal(ConflictType.FILE_TARGET_OVERLAP),
  severity: z.nativeEnum(ConflictSeverity),
  promptIds: z.array(z.string()),
  filePath: z.string(),
  description: z.string(),
  recommendation: z.string(),
});

export type FileTargetConflict = z.infer<typeof FileTargetConflictSchema>;

/**
 * Dependency cycle conflict
 */
export const DependencyCycleConflictSchema = z.object({
  type: z.literal(ConflictType.DEPENDENCY_CYCLE),
  severity: z.nativeEnum(ConflictSeverity),
  cycle: z.array(z.string()),
  description: z.string(),
  recommendation: z.string(),
});

export type DependencyCycleConflict = z.infer<typeof DependencyCycleConflictSchema>;

/**
 * Agent overload conflict
 */
export const AgentOverloadConflictSchema = z.object({
  type: z.literal(ConflictType.AGENT_OVERLOAD),
  severity: z.nativeEnum(ConflictSeverity),
  agent: z.string(),
  activePrompts: z.array(z.string()),
  limit: z.number(),
  description: z.string(),
  recommendation: z.string(),
});

export type AgentOverloadConflict = z.infer<typeof AgentOverloadConflictSchema>;

/**
 * Status inconsistency conflict
 */
export const StatusInconsistencyConflictSchema = z.object({
  type: z.literal(ConflictType.STATUS_INCONSISTENCY),
  severity: z.nativeEnum(ConflictSeverity),
  promptId: z.string(),
  currentStatus: z.string(),
  expectedStatus: z.string(),
  description: z.string(),
  recommendation: z.string(),
});

export type StatusInconsistencyConflict = z.infer<typeof StatusInconsistencyConflictSchema>;

/**
 * Evidence missing conflict
 */
export const EvidenceMissingConflictSchema = z.object({
  type: z.literal(ConflictType.EVIDENCE_MISSING),
  severity: z.nativeEnum(ConflictSeverity),
  promptId: z.string(),
  status: z.string(),
  description: z.string(),
  recommendation: z.string(),
});

export type EvidenceMissingConflict = z.infer<typeof EvidenceMissingConflictSchema>;

/**
 * Duplicate prompt conflict
 */
export const DuplicatePromptConflictSchema = z.object({
  type: z.literal(ConflictType.DUPLICATE_PROMPT),
  severity: z.nativeEnum(ConflictSeverity),
  promptId: z.string(),
  duplicateIds: z.array(z.string()),
  description: z.string(),
  recommendation: z.string(),
});

export type DuplicatePromptConflict = z.infer<typeof DuplicatePromptConflictSchema>;

/**
 * Union of all conflict types
 */
export const ConflictSchema = z.discriminatedUnion('type', [
  FileTargetConflictSchema,
  DependencyCycleConflictSchema,
  AgentOverloadConflictSchema,
  StatusInconsistencyConflictSchema,
  EvidenceMissingConflictSchema,
  DuplicatePromptConflictSchema,
]);

export type Conflict = z.infer<typeof ConflictSchema>;

/**
 * Conflict detection configuration
 */
export const ConflictDetectionConfigSchema = z.object({
  agentWorkloadLimit: z.number().default(3),
  fileTargetOverlapThreshold: z.number().default(1),
  dependencyCycleDepth: z.number().default(10),
  evidenceRequiredForStatus: z.array(z.string()).default(['Completato']),
  ignorePatterns: z.array(z.string()).default([
    '*.md',
    'test-results/**',
    'node_modules/**',
    '.git/**',
  ]),
  severityWeights: z
    .record(z.nativeEnum(ConflictSeverity), z.number())
    .default(() => ({ ...DEFAULT_SEVERITY_WEIGHTS })),
});

export type ConflictDetectionConfig = z.infer<typeof ConflictDetectionConfigSchema>;

/**
 * Default conflict detection configuration
 */
export const DEFAULT_CONFLICT_DETECTION_CONFIG: ConflictDetectionConfig = {
  agentWorkloadLimit: 3,
  fileTargetOverlapThreshold: 1,
  dependencyCycleDepth: 10,
  evidenceRequiredForStatus: ['Completato'],
  ignorePatterns: [
    '*.md',
    'test-results/**',
    'node_modules/**',
    '.git/**',
  ],
  severityWeights: { ...DEFAULT_SEVERITY_WEIGHTS },
};

/**
 * Conflict detection rules engine
 */
export class PromptConflictRules {
  private config: ConflictDetectionConfig;

  constructor(config: ConflictDetectionConfig = DEFAULT_CONFLICT_DETECTION_CONFIG) {
    this.config = config;
  }

  /**
   * Detect file target overlaps
   */
  detectFileTargetOverlaps(prompts: Map<string, KanbanPrompt>): FileTargetConflict[] {
    const fileTargets = new Map<string, string[]>();
    const conflicts: FileTargetConflict[] = [];

    // Build file target map
    for (const [promptId, prompt] of prompts) {
      if (prompt.fileTargets) {
        for (const target of prompt.fileTargets) {
          if (!this.shouldIgnoreFile(target)) {
            if (!fileTargets.has(target)) {
              fileTargets.set(target, []);
            }
            fileTargets.get(target)!.push(promptId);
          }
        }
      }
    }

    // Detect overlaps
    for (const [filePath, promptIds] of fileTargets) {
      if (promptIds.length > this.config.fileTargetOverlapThreshold) {
        conflicts.push({
          type: ConflictType.FILE_TARGET_OVERLAP,
          severity: this.getOverlapSeverity(promptIds.length),
          promptIds,
          filePath,
          description: `Multiple prompts target the same file: ${filePath}`,
          recommendation: this.getOverlapRecommendation(promptIds.length),
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect dependency cycles
   */
  detectDependencyCycles(prompts: Map<string, KanbanPrompt>): DependencyCycleConflict[] {
    const conflicts: DependencyCycleConflict[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const [promptId] of prompts) {
      if (!visited.has(promptId)) {
        const cycle = this.findCycle(promptId, prompts, visited, recursionStack, []);
        if (cycle) {
          conflicts.push({
            type: ConflictType.DEPENDENCY_CYCLE,
            severity: ConflictSeverity.HIGH,
            cycle,
            description: `Circular dependency detected: ${cycle.join(' → ')} → ${cycle[0]}`,
            recommendation: 'Break the cycle by removing one dependency or restructuring the workflow',
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect agent overload
   */
  detectAgentOverload(prompts: Map<string, KanbanPrompt>): AgentOverloadConflict[] {
    const conflicts: AgentOverloadConflict[] = [];
    const agentWorkloads = new Map<string, string[]>();

    // Count active prompts per agent
    for (const [promptId, prompt] of prompts) {
      if (prompt.status === 'In corso' && prompt.agent) {
        if (!agentWorkloads.has(prompt.agent)) {
          agentWorkloads.set(prompt.agent, []);
        }
        agentWorkloads.get(prompt.agent)!.push(promptId);
      }
    }

    // Detect overloads
    for (const [agent, activePrompts] of agentWorkloads) {
      if (activePrompts.length > this.config.agentWorkloadLimit) {
        conflicts.push({
          type: ConflictType.AGENT_OVERLOAD,
          severity: this.getOverloadSeverity(activePrompts.length),
          agent,
          activePrompts,
          limit: this.config.agentWorkloadLimit,
          description: `Agent ${agent} has ${activePrompts.length} active prompts (limit: ${this.config.agentWorkloadLimit})`,
          recommendation: 'Reassign some prompts or wait for current ones to complete',
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect status inconsistencies
   */
  detectStatusInconsistencies(prompts: Map<string, KanbanPrompt>): StatusInconsistencyConflict[] {
    const conflicts: StatusInconsistencyConflict[] = [];

    for (const [promptId, prompt] of prompts) {
      // Check for completed prompts without evidence
      if (prompt.status === 'Completato' && !prompt.evidence) {
        conflicts.push({
          type: ConflictType.STATUS_INCONSISTENCY,
          severity: ConflictSeverity.MEDIUM,
          promptId,
          currentStatus: prompt.status,
          expectedStatus: 'Completato with evidence',
          description: `Prompt ${promptId} is marked as completed but lacks evidence`,
          recommendation: 'Add evidence reference or update status',
        });
      }

      // Check for in corso prompts without agent
      if (prompt.status === 'In corso' && (!prompt.agent || prompt.agent === '-')) {
        conflicts.push({
          type: ConflictType.STATUS_INCONSISTENCY,
          severity: ConflictSeverity.HIGH,
          promptId,
          currentStatus: prompt.status,
          expectedStatus: 'In corso with assigned agent',
          description: `Prompt ${promptId} is in progress but has no assigned agent`,
          recommendation: 'Assign an agent or update status',
        });
      }

      // Check for stale in corso prompts
      if (prompt.status === 'In corso' && prompt.startDate) {
        const daysSinceStart = this.getDaysSince(prompt.startDate);
        if (daysSinceStart > 7) { // Stale after 7 days
          conflicts.push({
            type: ConflictType.STATUS_INCONSISTENCY,
            severity: ConflictSeverity.MEDIUM,
            promptId,
            currentStatus: prompt.status,
            expectedStatus: 'In corso (stale)',
            description: `Prompt ${promptId} has been in progress for ${daysSinceStart} days`,
            recommendation: 'Update status or reassign if blocked',
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect missing evidence
   */
  detectMissingEvidence(prompts: Map<string, KanbanPrompt>): EvidenceMissingConflict[] {
    const conflicts: EvidenceMissingConflict[] = [];

    for (const [promptId, prompt] of prompts) {
      if (this.config.evidenceRequiredForStatus.includes(prompt.status) && !prompt.evidence) {
        conflicts.push({
          type: ConflictType.EVIDENCE_MISSING,
          severity: ConflictSeverity.HIGH,
          promptId,
          status: prompt.status,
          description: `Prompt ${promptId} requires evidence for status ${prompt.status}`,
          recommendation: 'Add evidence reference to complete the prompt',
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect duplicate prompts
   */
  detectDuplicatePrompts(prompts: Map<string, KanbanPrompt>): DuplicatePromptConflict[] {
    const conflicts: DuplicatePromptConflict[] = [];
    const promptNames = new Map<string, string[]>();

    // Group by prompt name
    for (const [promptId, prompt] of prompts) {
      const name = prompt.name || promptId;
      if (!promptNames.has(name)) {
        promptNames.set(name, []);
      }
      promptNames.get(name)!.push(promptId);
    }

    // Detect duplicates
    for (const [name, promptIds] of promptNames) {
      if (promptIds.length > 1) {
        const [primaryId, ...duplicateIds] = promptIds;
        conflicts.push({
          type: ConflictType.DUPLICATE_PROMPT,
          severity: ConflictSeverity.MEDIUM,
          promptId: primaryId,
          duplicateIds,
          description: `Multiple prompts with the same name: ${name}`,
          recommendation: 'Rename prompts or merge if they are duplicates',
        });
      }
    }

    return conflicts;
  }

  /**
   * Get overall conflict score
   */
  getConflictScore(conflicts: Conflict[]): number {
    return conflicts.reduce((score, conflict) => {
      return score + this.config.severityWeights[conflict.severity];
    }, 0);
  }

  /**
   * Get conflicts by severity
   */
  getConflictsBySeverity(conflicts: Conflict[]): Record<ConflictSeverity, Conflict[]> {
    return conflicts.reduce((acc, conflict) => {
      if (!acc[conflict.severity]) {
        acc[conflict.severity] = [];
      }
      acc[conflict.severity].push(conflict);
      return acc;
    }, {} as Record<ConflictSeverity, Conflict[]>);
  }

  /**
   * Find dependency cycle using DFS
   */
  private findCycle(
    promptId: string,
    prompts: Map<string, KanbanPrompt>,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): string[] | null {
    visited.add(promptId);
    recursionStack.add(promptId);
    path.push(promptId);

    const prompt = prompts.get(promptId);
    if (prompt?.dependencies) {
      for (const depId of prompt.dependencies) {
        if (!visited.has(depId)) {
          const cycle = this.findCycle(depId, prompts, visited, recursionStack, [...path]);
          if (cycle) return cycle;
        } else if (recursionStack.has(depId)) {
          // Found cycle
          const cycleStart = path.indexOf(depId);
          return path.slice(cycleStart);
        }
      }
    }

    recursionStack.delete(promptId);
    return null;
  }

  /**
   * Check if file should be ignored
   */
  private shouldIgnoreFile(filePath: string): boolean {
    return this.config.ignorePatterns.some(pattern => {
      // Simple glob pattern matching
      const regex = new RegExp(
        pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
      );
      return regex.test(filePath);
    });
  }

  /**
   * Get severity for file overlaps
   */
  private getOverlapSeverity(count: number): ConflictSeverity {
    if (count >= 4) return ConflictSeverity.CRITICAL;
    if (count >= 3) return ConflictSeverity.HIGH;
    if (count >= 2) return ConflictSeverity.MEDIUM;
    return ConflictSeverity.LOW;
  }

  /**
   * Get recommendation for file overlaps
   */
  private getOverlapRecommendation(count: number): string {
    if (count >= 4) {
      return 'Critical file overlap - consider restructuring or creating separate modules';
    }
    if (count >= 3) {
      return 'High overlap - review prompt priorities and consider sequential execution';
    }
    if (count >= 2) {
      return 'Medium overlap - coordinate between agents to avoid conflicts';
    }
    return 'Low overlap - monitor for potential issues';
  }

  /**
   * Get severity for agent overload
   */
  private getOverloadSeverity(count: number): ConflictSeverity {
    if (count >= 6) return ConflictSeverity.CRITICAL;
    if (count >= 5) return ConflictSeverity.HIGH;
    if (count >= 4) return ConflictSeverity.MEDIUM;
    return ConflictSeverity.LOW;
  }

  /**
   * Get days since date
   */
  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
