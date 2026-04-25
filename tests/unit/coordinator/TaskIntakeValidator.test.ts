/**
 * Task Intake Validator Tests
 * 
 * Unit tests for the task intake validation system.
 * Tests parsing, validation, and CLI functionality.
 * 
 * @since 2026-01-19
 * @author Coordinator-Bot – Task Validator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskIntakeValidator } from '../../../scripts/coordinator/taskIntakeValidator';
import {
  type TaskEntry,
  TaskValidationResult,
  ValidationIssue,
  ValidationIssueType,
  ValidationIssueSeverity,
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
} from '../../../scripts/coordinator/taskIntakeValidatorSchema';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
}));

describe('TaskIntakeValidator', () => {
  let validator: TaskIntakeValidator;
  let mockReadFileSync: any;
  let mockExistsSync: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Get mocked functions
    mockReadFileSync = (vi.mocked('fs').readFileSync as any);
    mockExistsSync = (vi.mocked('fs').existsSync as any);
    
    // Default mock implementations
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(`# Strategy Task Intake

|Task ID|Descrizione / Link piano|Origine (Strategia)|File / Aree impattate|Stato|Priorità / KPI|Note coordinator|
|-------|------------------------|-------------------|----------------------|-----|--------------|----------------|
|(es. WS6.3-S1)|Punch Club minimal UI – sezione Visione #3|village_sandbox_refactor_plan.md|VillageSandbox.tsx, PunchClubPage.tsx|pending|KPI: tempo carico < 2s|Attende risorse UI|
|WS6.3-S2|Spec \`useSandboxInteractionMode\` + picker mobile|village_sandbox_refactor_plan.md §WS6.3 / strategy/idle_village_punch_club_vision.md §5|src/ui/idleVillage/hooks/useSandboxInteractionMode.ts (nuovo), useSandboxDragController.ts, VillageSandbox.tsx|pending|KPI: tap-to-assign < 3 tocchi su mobile QA|Richiede definizione KPI UX|
|GT-1|Annotare Punch Club come laboratorio interno (no marketing) in MASTER_PLAN + market research|strategy/idle_village_punch_club_vision.md §3|docs/MASTER_PLAN.md, docs/plans/MARKET_RESEARCH_ANALYSIS.md|pending|KPI: zero riferimenti Punch Club nei piani marketing pubblici|—|
|PC-M1|Landing Punch Club mobile-first + redirect automatico su device mobili|strategy/idle_village_punch_club_vision.md §1, §5|src/ui/punchClub/MobileLanding.tsx, App.tsx router, tests/punch-club-landing.spec.ts|✅ 2026-01-04|KPI: /punch-club caricabile in <2s su mobile, redirect da homepage mobile attivo|Hero KPI + redirect condizionale + opt-out via PersistenceService + Playwright smoke|
|NP-040|Idle Village Scenario Task Planner Documentation – Complete doc scenario planner Phase E + strategy task entry + evidence log|idle_village_plan.md §12.17 (Phase E implementation)|docs/plans/idle_village_scenario_planner_phase_e.md (nuovo), strategy_tasks.md (entry), evidence log|✅ 2026-01-13|KPI: 13/13 scenari documentati con implementazione details, evidence log completo|Evidence: test-results/np-040-scenario-planner-doc-2026-01-13.log|
`);
    
    validator = new TaskIntakeValidator();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Schema Functions', () => {
    it('should detect KPI definitions', () => {
      expect(hasKpiDefinition('KPI: tempo carico < 2s')).toBe(true);
      expect(hasKpiDefinition('kpi: success rate > 90%')).toBe(true);
      expect(hasKpiDefinition('threshold: 100ms')).toBe(true);
      expect(hasKpiDefinition('target: 5 users')).toBe(true);
      expect(hasKpiDefinition('latency < 50ms')).toBe(true);
      expect(hasKpiDefinition('tempo < 2s')).toBe(true);
      expect(hasKpiDefinition('no metrics here')).toBe(false);
      expect(hasKpiDefinition('KPI: tempo carico < 2s')).toBe(true);
      expect(hasKpiDefinition('kpi: success rate > 90%')).toBe(true);
      expect(hasKpiDefinition('threshold: 100ms')).toBe(true);
      expect(hasKpiDefinition('target: 5 users')).toBe(true);
      expect(hasKpiDefinition('latency < 50ms')).toBe(true);
      expect(hasKpiDefinition('tempo < 2s')).toBe(true);
      expect(hasKpiDefinition('no metrics here')).toBe(false);
    });

    it('should detect prompt instructions', () => {
      expect(hasPromptInstructions('prompt: implement feature X')).toBe(true);
      expect(hasPromptInstructions('istruzioni: create component')).toBe(true);
      expect(hasPromptInstructions('obiettivo: complete task')).toBe(true);
      expect(hasPromptInstructions('richiesta: add tests')).toBe(true);
      expect(hasPromptInstructions('specifiche: implement function')).toBe(true);;
      expect(hasPromptInstructions('no instructions here')).toBe(false);
    });

    it('should detect completion status', () => {
      expect(isCompletionStatus('✅')).toBe(true);
      expect(isCompletionStatus('❌')).toBe(true);
      expect(isCompletionStatus('Completato')).toBe(true);
      expect(isCompletionStatus('completed')).toBe(true);
      expect(isCompletionStatus('pending')).toBe(false);
      expect(isCompletionStatus('In corso')).toBe(false);
    });

    it('should validate task ID formats', () => {
      expect(isValidTaskId('NP-040')).toBe(true);
      expect(isValidTaskId('KS-081')).toBe(true);
      expect(isValidTaskId('PC-M1')).toBe(true);
      expect(isValidTaskId('E2E-VRT-001')).toBe(true);
      expect(isValidTaskId('WS6.3-S1')).toBe(true);
      expect(isValidTaskId('WS6.3-2')).toBe(true);
      expect(isValidTaskId('GT-1')).toBe(true);
      expect(isValidTaskId('IV-PS0')).toBe(true);
      expect(isValidTaskId('AM-1')).toBe(true);
      expect(isValidTaskId('INVALID')).toBe(false);
      expect(isValidTaskId('123')).toBe(false);
      expect(isValidTaskId('')).toBe(false);
    });

    it('should parse table rows correctly', () => {
      const line = '|NP-040|Task Intake Validator|strategy_tasks.md|scripts/coordinator|pending|KPI: validation complete|Test task|';
      const task = parseTableRow(line, 1);
      
      expect(task).toEqual({
        taskId: 'NP-040',
        title: 'Task Intake Validator',
        source: 'strategy_tasks.md',
        impact: 'scripts/coordinator',
        status: 'pending',
        priority: 'KPI: validation complete',
        notes: 'Test task',
      });
    });

    it('should handle malformed rows gracefully', () => {
      const line = '|INVALID|Incomplete|row|data|';
      const task = parseTableRow(line, 1);
      expect(task).toBeNull();
    });

    it('should extract individual components', () => {
      const line = '|NP-040|Task Intake Validator|strategy_tasks.md|scripts/coordinator|pending|KPI: validation complete|Test task|';
      
      expect(extractTaskId(line)).toBe('NP-040');
      expect(extractTitle(line)).toBe('Task Intake Validator');
      expect(extractSource(line)).toBe('strategy_tasks.md');
      expect(extractImpact(line)).toBe('scripts/coordinator');
      expect(extractStatus(line)).toBe('pending');
      expect(extractPriority(line)).toBe('KPI: validation complete');
      expect(extractNotes(line)).toBe('Test task');
    });

    it('should identify table headers', () => {
      expect(isTableHeader('|Task ID|Descrizione|')).toBe(true);
      expect(isTableHeader('|-------|-----------|')).toBe(true);
      expect(isTableHeader('|NP-040|Task|')).toBe(false);
      expect(isTableRow('|NP-040|Task|')).toBe(true);
      expect(isTableRow('# Comment')).toBe(false);
    });
  });

  describe('Validator Configuration', () => {
    it('should use default configuration', () => {
      const config = validator.getConfig();
      expect(config.requirePrompt).toBe(true);
      expect(config.requireKpi).toBe(true);
      expect(config.minTitleLength).toBe(10);
      expect(config.maxTitleLength).toBe(200);
    });

    it('should accept custom configuration', () => {
      const customValidator = new TaskIntakeValidator({
        requirePrompt: false,
        requireKpi: false,
        minTitleLength: 5,
        maxTitleLength: 100,
      });
      
      const config = customValidator.getState();
      expect(config.requirePrompt).toBe(false);
      expect(config.requireKpi).toBe(false);
      expect(config.minTitleLength).toBe(5);
      expect(config.maxTitleLength).toBe(100);
    });
  });

  describe('File Validation', () => {
    it('should validate file successfully', async () => {
      const result = await validator.validateFile();
      
      expect(result.totalTasks).toBeGreaterThan(0);
      expect(result.filePath).toContain('strategy_tasks.md');
      expect(result.timestamp).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle file not found error', async () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = await validator.validateFile('nonexistent.md');
      
      expect(result.passed).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('file_error');
      expect(result.issues[0].severity).toBe('critical');
    });

    it('should detect tasks without prompts', async () => {
      const content = `# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|
|TEST-1|No prompt here|test.md|test.ts|pending|KPI: test|No prompt instructions|`;

      mockReadFileSync.mockReturnValue(content);
      
      const result = await validator.validateContent(content, 'test.md');
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.type === 'missing_prompt')).toBe(true);
      expect(result.issues.some(i => i.taskId === 'TEST-1')).toBe(true);
    });

    it('should detect tasks without KPI', async () => {
      const content = `# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|
|TEST-1|Task with prompt|test.md|test.ts|pending|No KPI here|Has prompt but no KPI|`;

      mockReadFileSync.mockReturnValue(content);
      
      const result = await validator.validateContent(content, 'test.md');
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.type === 'missing_kpi')).toBe(true);
      expect(result.issues.some(i => i.taskId === 'TEST-1')).toBe(true);
    });

    it('should allow completed tasks without KPI', async () => {
      const content = `# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|
|TEST-1|Completed task|test.md|test.ts|✅|No KPI needed|Task completed successfully|`;

      mockReadFileSync.mockReturnValue(content);
      
      const result = await validator.validateContent(content, 'test.md');
      
      expect(result.passed).toBe(true);
      expect(result.issues.filter(i => i.type === 'missing_kpi')).toHaveLength(0);
    });

    it('should detect duplicate task IDs', async () => {
      const content = `# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|
|DUPLICATE-1|First task|test.md|test.ts|pending|KPI: test|First task|
|DUPLICATE-1|Second task|test2.md|test2.ts|pending|KPI: test|Second task|`;

      mockReadFileSync.mockReturnValue(content);
      
      const result = await validator.validateContent(content, 'test.md');
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.type === 'duplicate_task_id')).toBe(true);
      expect(result.issues.filter(i => i.taskId === 'DUPLICATE-1')).toHaveLength(2);
    });

    it('should validate title length constraints', async () => {
      const shortContent = `# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|
|SHORT|Too short|test.md|test.ts|pending|KPI: test|Short title|`;

      mockReadFileSync.mockReturnValue(shortContent);
      
      const shortResult = await validator.validateContent(shortContent, 'test.md');
      expect(shortResult.passed).toBe(false);
      expect(shortResult.issues.some(i => i.type === 'missing_title')).toBe(true);

      const longContent = `# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|
|LONG|This title is way too long and should be truncated because it exceeds the maximum length limit of 200 characters which is quite long for a task title|test.md|test.ts|pending|KPI: test|Long title|`;

      mockReadFileSync.mockReturnValue(longContent);
      
      const longResult = await validator.validateContent(longContent, 'test.md');
      expect(longResult.passed).toBe(false);
      expect(longResult.issues.some(i => i.type === 'missing_title')).toBe(true);
    });

    it('should validate source format', async () => {
      const content = `# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|
|TEST-1|Task|invalid-source|test.ts|pending|KPI: test|Invalid source|`;

      mockReadFileSync.mockReturnValue(content);
      
      const result = await validator.validateContent(content, 'test.md');
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.type === 'missing_source')).toBe(true);
      expect(result.issues.some(i => i.taskId === 'TEST-1')).toBe(true);
    });

    it('should validate impact specification', async () => {
      const content = `# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|
|TEST-1|Task|test.md||pending|KPI: test|Missing impact|`;

      mockReadFileSync.mockReturnValue(content);
      
      const result = await validator.validateContent(content, 'test.md');
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.type === 'missing_impact')).toBe(true);
      expect(result.issues.some(i => i.taskId === 'TEST-1')).toBe(true);
    });

    it('should validate status values', async () => {
      const content = `# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|
|TEST-1|Task|test.md|test.ts|INVALID|KPI: test|Invalid status|`;

      mockReadFileSync.mockReturnValue(content);
      
      const result = await validator.validateContent(content, 'test.md');
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.type === 'invalid_status')).toBe(true);
      expect(result.issues.some(i => i.taskId === 'TEST-1')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should calculate correct statistics', async () => {
      const content = `# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|
|PROMPT-1|Task with prompt|test.md|test.ts|pending|KPI: test|Has prompt|
|KPI-1|Task with KPI|test.md|test.ts|pending|KPI: test|Has KPI|
|COMPLETED-1|Completed task|test.md|test.ts|✅|No KPI needed|Done|
|PENDING-1|Pending task|test.md|test.ts|pending|No KPI|Pending|`;

      mockReadFileSync.mockReturnValue(content);
      
      const result = await validator.validateContent(content, 'test.md');
      const stats = validator.getStatistics(result);
      
      expect(stats.totalTasks).toBe(4);
      expect(stats.tasksWithIssues).toBe(2); // PROMPT-1 and KPI-1
      expect(stats.missingPrompt).toBe(1); // PENDING-1
      expect(stats.missingKpi).toBe(1); // COMPLETED-1
      expect(stats.completedTasks).toBe(1);
      expect(stats.pendingTasks).toBe(1);
      expect(stats.duplicateIds).toBe(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate markdown report', () => {
      const result: TaskValidationResult = {
        totalTasks: 10,
        tasksWithIssues: 3,
        issues: [],
        issuesByType: {},
        issuesBySeverity: {},
        duration: 150,
        filePath: 'test.md',
        timestamp: Date.now(),
        passed: false,
        summary: {
          tasksWithPrompts: 7,
          tasksWithKpi: 8,
          completedTasks: 2,
          pendingTasks: 5,
          duplicateIds: 0,
        },
      };

      const markdown = validator.generateMarkdownReport(result);
      
      expect(markdown).toContain('# Task Intake Validation Report');
      expect(markdown).toContain('**Status:** ❌ FAILED');
      expect(markdown).toContain('**Total Tasks:** 10');
      expect(markdown).toContain('**Tasks with Issues:** 3');
    });

    it('should generate JSON report', () => {
      const result: TaskValidationResult = {
        totalTasks: 10,
        tasksWithIssues: 3,
        issues: [],
        issuesByType: {},
        issuesBySeverity: {},
        duration: 150,
        filePath: 'test.md',
        timestamp: Date.now(),
        passed: false,
        summary: {
          tasksWithPrompts: 7,
          tasksWithKpi: 8,
          completedTasks: 2,
          pendingTasks: 5,
          duplicateIds: 0,
        },
      };

      const json = validator.generateJsonReport(result);
      const parsed = JSON.parse(json);
      
      expect(parsed.totalTasks).toBe(10);
      expect(parsed.tasksWithIssues).toBe(3);
      expect(parsed.passed).toBe(false);
      expect(parsed.filePath).toBe('test.md');
    });
  });

  describe('CLI Integration', () => {
    it('should run validate command', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock successful validation
      mockReadFileSync.mockReturnValue(`# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|
|CLI-1|CLI test|test.md|test.ts|pending|KPI: test|CLI test|`);

      const result = await validator.validateFile();
      
      expect(result.totalTasks).toBe(1);
      expect(result.passed).toBe(true);
    });

    it('should handle statistics command', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const stats = validator.getStatistics(await validator.validateFile());
      
      expect(consoleSpy).toHaveBeenCalledWith('📊 Task Intake Statistics');
      expect(consoleSpy).toHaveBeenCalledWith('Total Tasks: 1');
    });

    it('should handle check-rule command', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock dynamic import for check-rule
      const { hasPromptInstructions, hasKpiDefinition } = await import('./taskIntakeValidatorSchema');
      
      hasPromptInstructions('Task with prompt instructions');
      hasKpiDefinition('Task with KPI: 100ms');
      
      expect(consoleSpy).toHaveBeenCalledWith('Task Text: "Task with prompt instructions"');
      expect(consoleSpy).toHaveBeenCalledWith('Has Prompt: ✅');
      expect(consoleSpy).toHaveBeenCalledWith('Has KPI: ✅');
      expect(consoleSpy).toHaveBeenCalledWith('Valid: ✅');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file', async () => {
      mockReadFileSync.mockReturnValue('# Strategy Task Intake\n\n');
      
      const result = await validator.validateContent('', 'test.md');
      
      expect(result.totalTasks).toBe(0);
      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should handle file with only headers', async () => {
      const content = `# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|`;

      mockReadFileSync.mockReturnValue(content);
      
      const result = await validator.validateContent(content, 'test.md');
      
      expect(result.totalTasks).toBe(0);
      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should handle malformed markdown', async () => {
      const content = `# Strategy Task Intake

|Task ID|Title|Source|Impact|Status|Priority|Notes|
|INVALID ROW FORMAT|test.md|test.ts|pending|KPI: test|Invalid|`;

      mockReadFileSync.mockReturnValue(content);
      
      const result = await validator.validateContent(content, 'test.md');
      
      expect(result.totalTasks).toBe(0);
      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should handle very long file', async () => {
      const lines = Array.from({ length: 1000 }, (_, i) => 
        `|TASK-${i}|Task ${i}|test.md|test${i}.ts|pending|KPI: test|Task ${i}|`
      ).join('\n');
      
      const content = `# Strategy Task Intake\n\n${lines.join('\n')}`;
      
      mockReadFileSync.mockReturnValue(content);
      
      const result = await validator.validateContent(content, 'test.md');
      
      expect(result.totalTasks).toBe(1000);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.passed).toBe(true);
    });
  });
});
