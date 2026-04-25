/**
 * Coordinator Prompt Consistency CLI - Schema Definitions
 * 
 * Zod schemas for prompt validation and Markdown parsing.
 * Defines the structure for prompt entries, KPI requirements, and consistency checking.
 * 
 * @since 2026-01-20
 * @author Coordinator-Bot – Prompt QA
 */

import { z } from 'zod';

/**
 * Valid prompt states
 */
export const PromptState = z.enum([
  'Non assegnato',
  'In corso',
  'Completato',
  'Bloccato',
  'Annullato',
  'Sospeso',
]);

/**
 * KPI requirement types
 */
export const KPIType = z.enum([
  'performance',
  'quality',
  'documentation',
  'testing',
  'integration',
  'compliance',
  'accessibility',
  'security',
]);

/**
 * Agent assignment
 */
export const AgentAssignment = z.object({
  name: z.string(),
  role: z.string(),
});

/**
 * KPI requirement
 */
export const KPIRequirement = z.object({
  type: KPIType,
  description: z.string(),
  threshold: z.number().optional(),
  unit: z.string().optional(),
});

/**
 * Prompt entry structure
 */
export const PromptEntry = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  state: PromptState,
  dependsOn: z.array(z.string()).optional(),
  assignedTo: AgentAssignment.optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  estimated: z.number().optional(),
  lastUpdate: z.string().optional(),
  kpiRequirements: z.array(KPIRequirement).optional(),
  notes: z.string().optional(),
  evidenceLog: z.string().optional(),
});

/**
 * Kanban table structure
 */
export const KanbanTable = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

/**
 * Markdown document structure
 */
export const MarkdownDocument = z.object({
  title: z.string(),
  content: z.string(),
  prompts: z.array(PromptEntry),
  table: KanbanTable,
});

/**
 * Consistency check result
 */
export const ConsistencyResult = z.object({
  timestamp: z.string(),
  totalPrompts: z.number(),
  issues: z.array(z.object({
    type: z.enum(['duplicate', 'invalid_state', 'missing_kpi', 'missing_reference', 'orphaned_reference']),
    promptId: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    line: z.number().optional(),
    suggestion: z.string().optional(),
  })),
  summary: z.object({
    duplicates: z.number(),
    invalidStates: z.number(),
    missingKpis: z.number(),
    missingReferences: z.number(),
    orphanedReferences: z.number(),
  }),
  exportFormat: z.enum(['json', 'markdown', 'csv']),
});

/**
 * CLI options
 */
export const CliOptions = z.object({
  inputFile: z.string().optional(),
  outputFile: z.string().optional(),
  format: z.enum(['json', 'markdown', 'csv']).default('json'),
  verbose: z.boolean().default(false),
  fixMode: z.boolean().default(false),
  includeSuggestions: z.boolean().default(true),
  exitCode: z.number().default(0),
});

/**
 * Type exports
 */
export type PromptStateType = z.infer<typeof PromptState>;
export type KPITypeType = z.infer<typeof KPIType>;
export type AgentAssignmentType = z.infer<typeof AgentAssignment>;
export type KPIRequirementType = z.infer<typeof KPIRequirement>;
export type PromptEntryType = z.infer<typeof PromptEntry>;
export type KanbanTableType = z.infer<typeof KanbanTable>;
export type MarkdownDocumentType = z.infer<typeof MarkdownDocument>;
export type ConsistencyResultType = z.infer<typeof ConsistencyResult>;
export type CliOptionsType = z.infer<typeof CliOptions>;
