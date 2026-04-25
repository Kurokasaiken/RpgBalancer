/**
 * Task Intake Validator
 * 
 * Validates strategy_tasks.md entries to ensure tasks have proper
 * prompts and KPI definitions, maintaining Kanban consistency.
 * 
 * @since 2026-01-19
 * @author Coordinator-Bot – Task Validator
 */

import { readFileSync, existsSync } from 'fs';
import type {
  TaskEntry,
  TaskValidationResult,
  ValidationIssue,
  ValidationIssueType,
  ValidationIssueSeverity,
  TaskValidatorConfig,
  TaskStatus,
  DEFAULT_TASK_VALIDATOR_CONFIG,
  hasKpiDefinition,
  hasPromptInstructions,
  isCompletionStatus,
  isValidTaskId,
  parseTableRow,
  isTableRow,
  isTableHeader,
  extractTaskId,
  extractTitle,
  extractSource,
  extractImpact,
  extractStatus,
  extractPriority,
  extractNotes,
  TaskStatusSchema,
} from './taskIntakeValidatorSchema';

/**
 * Task Intake Validator Class
 */
export class TaskIntakeValidator {
  private config: TaskValidatorConfig;

  constructor(config: Partial<TaskValidatorConfig> = {}) {
    this.config = { ...DEFAULT_TASK_VALIDATOR_CONFIG, ...config };
  }

  /**
   * Validate strategy_tasks.md file
   */
  async validateFile(filePath: string = 'src/docs/docs/coordinator/strategy_tasks.md'): Promise<TaskValidationResult> {
    const startTime = Date.now();

    try {
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      const result = await this.validateContent(content, filePath);
      
      return {
        ...result,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        totalTasks: 0,
        tasksWithIssues: 0,
        issues: [{
          type: 'file_error',
          severity: 'critical',
          taskId: 'unknown',
          description: `Failed to read file: ${errorMessage}`,
          lineNumber: 0,
          rawLine: '',
          suggestion: 'Check file path and permissions',
          autoFixable: false,
        }],
        issuesByType: {},
        issuesBySeverity: {},
        duration: Date.now() - startTime,
        filePath,
        timestamp: Date.now(),
        passed: false,
        summary: {
          tasksWithPrompts: 0,
          tasksWithKpi: 0,
          completedTasks: 0,
          pendingTasks: 0,
          duplicateIds: 0,
        },
      };
    }
  }

  /**
   * Validate file content
   */
  async validateContent(content: string, filePath: string): Promise<TaskValidationResult> {
    const lines = content.split('\n');
    const issues: ValidationIssue[] = [];
    const tasks: TaskEntry[] = [];
    const taskIds = new Set<string>();
    
    let inTable = false;
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;

      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) {
        continue;
      }

      // Detect table start
      if (isTableHeader(line)) {
        inTable = true;
        continue;
      }

      // Process table rows
      if (inTable && isTableRow(line)) {
        const task = parseTableRow(line, lineNumber);
        
        if (task) {
          // Check for duplicate task IDs
          if (taskIds.has(task.taskId)) {
            issues.push(this.createIssue(
              'duplicate_task_id',
              'medium',
              task.taskId,
              `Duplicate task ID: ${task.taskId}`,
              lineNumber,
              line,
              'Change task ID to be unique'
            ));
          } else {
            taskIds.add(task.taskId);
          }

          // Validate task entry
          const taskIssues = this.validateTask(task, lineNumber, line);
          issues.push(...taskIssues);
          
          tasks.push(task);
        }
      }
    }

    // Group issues by type and severity
    const issuesByType = issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, ValidationIssue[]>);

    const issuesBySeverity = issues.reduce((acc, issue) => {
      if (!acc[issue.severity]) acc[issue.severity] = [];
      acc[issue.severity].push(issue);
      return acc;
    }, {} as Record<string, ValidationIssue[]>);

    // Calculate summary statistics
    const summary = {
      tasksWithPrompts: tasks.filter(t => hasPromptInstructions(t.title + ' ' + t.notes)).length,
      tasksWithKpi: tasks.filter(t => hasKpiDefinition(t.priority + ' ' + t.notes)).length,
      completedTasks: tasks.filter(t => isCompletionStatus(t.status)).length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      duplicateIds: issues.filter(i => i.type === 'duplicate_task_id').length,
    };

    // Determine if validation passed (no critical issues)
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const passed = criticalIssues.length === 0;

    return {
      totalTasks: tasks.length,
      tasksWithIssues: tasks.filter(t => 
        issues.some(i => i.taskId === t.taskId)
      ).length,
      issues,
      issuesByType,
      issuesBySeverity,
      duration: 0, // Will be set by caller
      filePath,
      timestamp: Date.now(),
      passed,
      summary,
    };
  }

  /**
   * Validate individual task entry
   */
  private validateTask(task: TaskEntry, lineNumber: number, rawLine: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Validate task ID
    if (!isValidTaskId(task.taskId)) {
      issues.push(this.createIssue(
        'missing_task_id',
        'high',
        task.taskId,
        `Invalid task ID format: ${task.taskId}`,
        lineNumber,
        rawLine,
        'Use standard format (e.g., NP-040, KS-081, PC-M1)'
      ));
    }

    // Validate title
    if (!task.title || task.title.length < this.config.minTitleLength) {
      issues.push(this.createIssue(
        'missing_title',
        'high',
        task.taskId,
        `Title too short or missing (min: ${this.config.minTitleLength} chars)`,
        lineNumber,
        rawLine,
        `Provide descriptive title with at least ${this.config.minTitleLength} characters`
      ));
    }

    if (task.title.length > this.config.maxTitleLength) {
      issues.push(this.createIssue(
        'missing_title',
        'medium',
        task.taskId,
        `Title too long (max: ${this.config.maxTitleLength} chars)`,
        lineNumber,
        rawLine,
        `Shorten title to ${this.config.maxTitleLength} characters or less`
      ));
    }

    // Validate source
    if (!task.source) {
      issues.push(this.createIssue(
        'missing_source',
        'medium',
        task.taskId,
        'Missing source document',
        lineNumber,
        rawLine,
        'Specify source strategy document'
      ));
    } else {
      const hasValidSource = this.config.requiredSourcePatterns.some(pattern => 
        task.source.includes(pattern)
      );
      
      if (!hasValidSource) {
        issues.push(this.createIssue(
          'missing_source',
          'low',
          task.taskId,
          `Invalid source format: ${task.source}`,
          lineNumber,
          rawLine,
          'Include .md, strategy/, or docs/ in source path'
        ));
      }
    }

    // Validate impact
    if (!task.impact) {
      issues.push(this.createIssue(
        'missing_impact',
        'medium',
        task.taskId,
        'Missing impact specification',
        lineNumber,
        rawLine,
        'Specify files or areas impacted by this task'
      ));
    }

    // Validate status
    try {
      TaskStatusSchema.parse(task.status);
    } catch {
      issues.push(this.createIssue(
        'invalid_status',
        'medium',
        task.taskId,
        `Invalid status: ${task.status}`,
        lineNumber,
        rawLine,
        'Use valid status: pending, In corso, Completato, Non assegnato'
      ));
    }

    // Check for prompt instructions
    if (this.config.requirePrompt && !isCompletionStatus(task.status)) {
      const fullText = `${task.title} ${task.notes}`.toLowerCase();
      if (!hasPromptInstructions(fullText)) {
        issues.push(this.createIssue(
          'missing_prompt',
          'high',
          task.taskId,
          'Missing prompt instructions in task description',
          lineNumber,
          rawLine,
          'Add prompt/mandate/objective in title or notes'
        ));
      }
    }

    // Check for KPI definition
    if (this.config.requireKpi && !this.config.kpiExemptions.includes(task.status)) {
      const fullText = `${task.priority} ${task.notes}`.toLowerCase();
      if (!hasKpiDefinition(fullText)) {
        issues.push(thisIssue(
          'missing_kpi',
          'high',
          task.taskId,
          'Missing KPI definition',
          lineNumber,
          rawLine,
          'Add KPI/metric/threshold in priority or notes'
        ));
      }
    }

    return issues;
  }

  /**
   * Create validation issue
   */
  private createIssue(
    type: ValidationIssueType,
    severity: ValidationIssueSeverity,
    taskId: string,
    description: string,
    lineNumber: number,
    rawLine: string,
    suggestion?: string
  ): ValidationIssue {
    return {
      type,
      severity,
      taskId,
      description,
      lineNumber,
      rawLine,
      suggestion,
      autoFixable: false,
    };
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(result: TaskValidationResult): string {
    const timestamp = new Date(result.timestamp).toISOString();
    
    let markdown = `# Task Intake Validation Report

**Generated:** ${timestamp}  
**File:** ${result.filePath}  
**Duration:** ${result.duration}ms  
**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}  

## Summary

- **Total Tasks:** ${result.totalTasks}
- **Tasks with Issues:** ${result.tasksWithIssues}
- **Critical Issues:** ${result.issuesBySeverity.critical?.length || 0}
- **High Issues:** ${result.issuesBySeverity.high?.length || 0}
- **Medium Issues:** ${resultBySeverity.medium?.length || 0}
- **Low Issues:** ${resultBySeverity.low?.length || 0}

### Task Statistics

| Metric | Count |
|--------|-------|
| Tasks with Prompts | ${result.summary.tasksWithPrompts} |
| Tasks with KPI | ${result.summary.tasksWithKpi} |
| Completed Tasks | ${result.summary.completedTasks} |
| Pending Tasks | ${result.summary.pendingTasks} |
| Duplicate IDs | ${result.summary.duplicateIds} |

`;

    if (result.issues.length > 0) {
      markdown += `\n\n## Issues\n\n`;
      
      const groupedIssues = result.issues.reduce((acc, issue) => {
        if (!acc[issue.severity]) acc[issue.severity] = [];
        acc[issue.severity].push(issue);
        return acc;
      }, {} as Record<string, typeof result.issues>);

      for (const severity of ['critical', 'high', 'medium', 'low']) {
        const issues = groupedIssues[severity];
        if (issues && issues.length > 0) {
          markdown += `### ${severity.toUpperCase()} (${issues.length})\n\n`;
          
          issues.forEach(issue => {
            markdown += `- **${issue.type}**: ${issue.description}\n`;
            markdown += `  - **Task ID:** \`${issue.taskId}\`\n`;
            markdown += `  - **Line:** ${issue.lineNumber}\n`;
            markdown += `  - **Raw:** \`${issue.rawLine}\`\n`;
            if (issue.suggestion) {
              markdown += `  - **Fix:** ${issue.suggestion}\n`;
            }
            markdown += `\n`;
          });
        }
      }
    }

    if (result.issuesByType && Object.keys(result.issuesByType).length > 0) {
      markdown += `\n## Issues by Type\n\n`;
      
      Object.entries(result.issuesByType).forEach(([type, issues]) => {
        markdown += `### ${type.replace(/_/g, ' ').toUpperCase()} (${issues.length})\n\n`;
        issues.forEach(issue => {
          markdown += `- \`${issue.taskId}\`: ${issue.description}\n`;
        });
        markdown += `\n`;
      });
    }

    return markdown;
  }

  /**
   * Generate JSON report
   */
  generateJsonReport(result: TaskValidationResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Auto-fix simple issues (placeholder for future implementation)
   */
  async autoFixIssues(issues: ValidationIssue[]): Promise<ValidationIssue[]> {
    const fixedIssues: ValidationIssue[] = [];
    const unfixedIssues: ValidationIssue[] = [];

    for (const issue of issues) {
      if (issue.autoFixable && this.config.enableAutoFix) {
        // Placeholder for auto-fix logic
        // This would involve modifying the original file
        fixedIssues.push(issue);
      } else {
        unfixedIssues.push(issue);
      }
    }

    return unfixedIssues;
  }

  /**
   * Get current configuration
   */
  getConfig(): TaskValidatorConfig {
    return { ...this.config };
  }

  /**
   * Get validation statistics
   */
  getStatistics(result: TaskValidationResult): Record<string, number> {
    return {
      totalTasks: result.totalTasks,
      tasksWithIssues: result.tasksWithIssues,
      criticalIssues: result.issuesBySeverity.critical?.length || 0,
      highIssues: result.issuesBySeverity.high?.length || 0,
      mediumIssues: result.issuesBySeverity.medium?.length || 0,
      lowIssues: result.issuesBySeverity.low?.length || 0,
      missingPrompt: result.issuesByType.missing_prompt?.length || 0,
      missingKpi: result.issuesByType.missing_kpi?.length || 0,
      duplicateIds: result.issuesByType.duplicate_task_id?.length || 0,
    };
  }
}

// Export singleton instance
export const taskIntakeValidator = new TaskIntakeValidator();
