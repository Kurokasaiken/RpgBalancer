/**
 * Task Intake Validator Schema
 * 
 * Zod schemas for validating strategy_tasks.md entries and detecting
 * tasks without proper prompts or KPI definitions.
 * 
 * @since 2026-01-19
 * @author Coordinator-Bot – Task Validator
 */

import { z } from 'zod';

/**
 * Task status values from strategy_tasks.md
 */
export const TaskStatusSchema = z.enum([
  'pending',
  'In corso',
  'Completato',
  'Non assegnato',
  '✅',
  '❌',
]);

/**
 * Task priority/KPI patterns
 */
export const TaskPrioritySchema = z.string().optional();

/**
 * Task entry from strategy_tasks.md
 */
export const TaskEntrySchema = z.object({
  /** Task ID (e.g., WS6.3-S1, GT-1, PC-M1) */
  taskId: z.string(),
  /** Task description or title */
  title: z.string(),
  /** Source strategy document */
  source: z.string(),
  /** Files or areas impacted */
  impact: z.string(),
  /** Current status */
  status: TaskStatusSchema,
  /** Priority level or KPI definition */
  priority: TaskPrioritySchema,
  /** Coordinator notes */
  notes: z.string().optional(),
});

/**
 * Validation issue types
 */
export const ValidationIssueTypeSchema = z.enum([
  'missing_prompt',
  'missing_kpi',
  'invalid_status',
  'missing_task_id',
  'missing_title',
  'missing_source',
  'missing_impact',
  'duplicate_task_id',
  'malformed_kpi',
  'inconsistent_format',
]);

/**
 * Validation issue severity
 */
export const ValidationIssueSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Individual validation issue
 */
export const ValidationIssueSchema = z.object({
  /** Issue type */
  type: ValidationIssueTypeSchema,
  /** Severity level */
  severity: ValidationIssueSeveritySchema,
  /** Task ID where issue was found */
  taskId: z.string(),
  /** Human-readable description */
  description: z.string(),
  /** Line number in file */
  lineNumber: z.number(),
  /** Raw line content */
  rawLine: z.string(),
  /** Suggested fix */
  suggestion: z.string().optional(),
  /** Whether issue is auto-fixable */
  autoFixable: z.boolean().default(false),
});

/**
 * Task validation result
 */
export const TaskValidationResultSchema = z.object({
  /** Total tasks processed */
  totalTasks: z.number(),
  /** Tasks with issues */
  tasksWithIssues: z.number(),
  /** Validation issues found */
  issues: z.array(ValidationIssueSchema),
  /** Issues grouped by type */
  issuesByType: z.record(z.array(ValidationIssueSchema)),
  /** Issues grouped by severity */
  issuesBySeverity: z.record(z.array(ValidationIssueSchema)),
  /** Processing duration in milliseconds */
  duration: z.number(),
  /** File path processed */
  filePath: z.string(),
  /** Validation timestamp */
  timestamp: z.number(),
  /** Whether validation passed (no critical issues) */
  passed: z.boolean(),
  /** Summary statistics */
  summary: z.object({
    tasksWithPrompts: z.number(),
    tasksWithKpi: z.number(),
    completedTasks: z.number(),
    pendingTasks: z.number(),
    duplicateIds: z.number(),
  }),
});

/**
 * Task intake validator configuration
 */
export const TaskValidatorConfigSchema = z.object({
  /** Require prompt text in task description */
  requirePrompt: z.boolean().default(true),
  /** Require KPI definition */
  requireKpi: z.boolean().default(true),
  /** Allow certain status values without KPI */
  kpiExemptions: z.array(TaskStatusSchema).default(['✅', '❌']),
  /** Minimum title length */
  minTitleLength: z.number().default(10),
  /** Maximum title length */
  maxTitleLength: z.number().default(200),
  /** Required source patterns */
  requiredSourcePatterns: z.array(z.string()).default([
    '.md',
    'strategy/',
    'docs/',
  ]),
  /** Auto-fix simple issues */
  enableAutoFix: z.boolean().default(false),
  /** Strict validation mode */
  strictMode: z.boolean().default(false),
});

// Type exports
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskEntry = z.infer<typeof TaskEntrySchema>;
export type ValidationIssueType = z.infer<typeof ValidationIssueTypeSchema>;
export type ValidationIssueSeverity = z.infer<typeof ValidationIssueSeveritySchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type TaskValidationResult = z.infer<typeof TaskValidationResultSchema>;
export type TaskValidatorConfig = z.infer<typeof TaskValidatorConfigSchema>;

/**
 * Default validator configuration
 */
export const DEFAULT_TASK_VALIDATOR_CONFIG: TaskValidatorConfig = {
  requirePrompt: true,
  requireKpi: true,
  kpiExemptions: ['✅', '❌'],
  minTitleLength: 10,
  maxTitleLength: 200,
  requiredSourcePatterns: ['.md', 'strategy/', 'docs/'],
  enableAutoFix: false,
  strictMode: false,
};

/**
 * KPI detection patterns
 */
export const KPI_PATTERNS = [
  /KPI:/i,
  /kpi:/i,
  /metric/i,
  /threshold/i,
  /target/i,
  /≤\s*\d+/,
  />=\s*\d+/,
  /<\s*\d+/,
  /%\s*complete/i,
  /success\s*rate/i,
  /latency.*<\s*\d+/i,
  /tempo.*<\s*\d+/i,
  /\d+\s*ms/i,
  /\d+\s*second/i,
];

/**
 * Prompt detection patterns
 */
export const PROMPT_PATTERNS = [
  /prompt/i,
  /istruzioni/i,
  /mandato/i,
  /obiettivo/i,
  /richiesta/i,
  /deliverable/i,
  /requirements/i,
  /specifiche/i,
  /specificare/i,
];

/**
 * Status patterns that indicate completion
 */
export const COMPLETION_STATUS_PATTERNS = [
  '✅',
  '❌',
  'Completato',
  'completed',
  'done',
  'finished',
];

/**
 * Task ID patterns
 */
export const TASK_ID_PATTERNS = [
  /^[A-Z]{2,}-\d+/,      // KS-081, NP-040
  /^[A-Z]+-\d+/,        // PC-M1
  /^[A-Z]+\.\d+/,        // E2E-VRT-001
  /^[A-Z]+-\d+-[A-Z]/,   // WS6.3-S1
  /^[A-Z]+-\d+-\d+/,     // WS6.3-2
  /^GT-\d+/,             // GT-1
  /^IV-PS\d+/,           // IV-PS0
  /^AM-\d+/,             // AM-1
];

/**
 * Check if a string contains KPI definition
 */
export function hasKpiDefinition(text: string): boolean {
  return KPI_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Check if a string contains prompt instructions
 */
export function hasPromptInstructions(text: string): boolean {
  return PROMPT_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Check if status indicates completion
 */
export function isCompletionStatus(status: string): boolean {
  return COMPLETION_STATUS_PATTERNS.includes(status) || 
         COMPLETION_STATUS_PATTERNS.some(pattern => pattern.toLowerCase().includes(status.toLowerCase()));
}

/**
 * Validate task ID format
 */
export function isValidTaskId(taskId: string): boolean {
  return TASK_ID_PATTERNS.some(pattern => pattern.test(taskId));
}

/**
 * Extract task ID from markdown table row
 */
export function extractTaskId(line: string): string | null {
  const match = line.match(/^\s*\|([^|]+)\|/);
  return match ? match[1].trim() : null;
}

/**
 * Extract title from markdown table row
 */
export function extractTitle(line: string): string | null {
  const match = line.match(/^\s*\|[^|]+\|([^|]+)\|/);
  if (!match) return null;
  
  const title = match[1].trim();
  // Remove status indicators from title
  return title.replace(/\s*✅\s*|\s*❌\s*$/g, '').trim();
}

/**
 * Extract source from markdown table row
 */
export function extractSource(line: string): string | null {
  const match = line.match(/^\s*\|[^|]+\|[^|]+\|([^|]+)\|/);
  return match ? match[1].trim() : null;
}

/**
 * Extract impact from markdown table row
 */
export function extractImpact(line: string): string | null {
  const match = line.match(/^\s*\|[^|]+\|[^|]+\|[^|]+\|([^|]+)\|/);
  return match ? match[1].trim() : null;
}

/**
 * Extract status from markdown table row
 */
export function extractStatus(line: string): string | null {
  const match = line.match(/^\s*\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|([^|]+)\|/);
  return match ? match[1].trim() : null;
}

/**
 * Extract priority/KPI from markdown table row
 */
export function extractPriority(line: string): string | null {
  const match = line.match(/^\s*\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|([^|]+)\|/);
  return match ? match[1].trim() : null;
}

/**
 * Extract notes from markdown table row
 */
export function extractNotes(line: string): string | null {
  const parts = line.split('|');
  return parts.length >= 7 ? parts[6].trim() : null;
}

/**
 * Parse strategy_tasks.md table row
 */
export function parseTableRow(line: string, lineNumber: number): TaskEntry | null {
  const taskId = extractTaskId(line);
  const title = extractTitle(line);
  const source = extractSource(line);
  const impact = extractImpact(line);
  const status = extractStatus(line);
  const priority = extractPriority(line);
  const notes = extractNotes(line);

  if (!taskId || !title) {
    return null;
  }

  return {
    taskId,
    title,
    source: source || '',
    impact: impact || '',
    status: (status as TaskStatus) || 'pending',
    priority: priority || '',
    notes: notes || '',
  };
}

/**
 * Check if line is a valid table row
 */
export function isTableRow(line: string): boolean {
  return line.startsWith('|') && line.includes('|') && line.split('|').length >= 6;
}

/**
 * Check if line is table header
 */
export function isTableHeader(line: string): boolean {
  return line.includes('Task ID') || line.includes('-------');
}
